document.addEventListener('DOMContentLoaded', () => {
    const timeElement = document.getElementById('local-time');
    const timeFormat = new Intl.DateTimeFormat('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Europe/Amsterdam'
    });

    function updateTime() {
        timeElement.textContent = timeFormat.format(new Date());
    }

    updateTime();
    setInterval(updateTime, 1000);

    fetchGitHubCommits();
    fetchRepoStats();
    fetchBlogPosts();
});

async function fetchRepoStats() {
    const cacheKey = 'boredos_repo_cache';
    const cacheDuration = 15 * 60 * 1000;
    let repo = null;

    const cachedData = localStorage.getItem(cacheKey);
    if (cachedData) {
        const { timestamp, data } = JSON.parse(cachedData);
        if (Date.now() - timestamp < cacheDuration) repo = data;
    }

    if (!repo) {
        try {
            const response = await fetch('https://api.github.com/repos/BoredOS/BoredOS');
            if (!response.ok) throw new Error('Repo fetch failed');
            const json = await response.json();
            repo = {
                stars: json.stargazers_count,
                forks: json.forks_count,
                pushed: json.pushed_at
            };
            localStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), data: repo }));
        } catch (error) {
            console.error('Error fetching repo stats:', error);
            return;
        }
    }

    document.getElementById('repo-stars').textContent = repo.stars.toLocaleString('en-US');
    document.getElementById('repo-forks').textContent = repo.forks.toLocaleString('en-US');
    document.getElementById('repo-pushed').textContent = getTimeAgo(new Date(repo.pushed));
}

function setFeedMessage(feedElement, text) {
    feedElement.innerHTML = '';
    const li = document.createElement('li');
    li.className = 'feed-empty';
    li.textContent = text;
    feedElement.appendChild(li);
}

async function fetchGitHubCommits() {
    const feedElement = document.getElementById('github-feed');
    const username = 'boreddevnl';
    const cacheKey = 'github_commits_cache_v2';
    const cacheDuration = 15 * 60 * 1000;

    // Check cache first
    const cachedData = localStorage.getItem(cacheKey);
    if (cachedData) {
        const { timestamp, commits } = JSON.parse(cachedData);
        if (Date.now() - timestamp < cacheDuration) {
            renderCommits(commits, feedElement);
            return;
        }
    }

    try {
        // The search API finds commits across all public repos (incl. orgs like BoredOS),
        // unlike the events API which often doesn't list pushes at all.
        const response = await fetch(
            `https://api.github.com/search/commits?q=author:${username}&sort=author-date&order=desc&per_page=5`,
            { headers: { Accept: 'application/vnd.github+json' } }
        );

        if (response.status === 403 || response.status === 429) {
            throw new Error('Rate limit exceeded');
        }
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const { items } = await response.json();

        // Fetch +/- stats per commit; a failure here just hides the stats
        const commits = await Promise.all(items.map(async (item) => {
            let stats = null;
            try {
                const detail = await fetch(item.url);
                if (detail.ok) stats = (await detail.json()).stats;
            } catch (err) {
                console.error('Could not fetch commit stats:', err);
            }

            const fullName = item.repository.full_name;
            const ownPrefix = new RegExp(`^${username}/`, 'i');

            return {
                repoName: fullName.replace(ownPrefix, ''),
                repoUrl: item.repository.html_url,
                message: item.commit.message.split('\n')[0],
                htmlUrl: item.html_url,
                date: item.commit.author.date,
                additions: stats ? stats.additions : null,
                deletions: stats ? stats.deletions : null
            };
        }));

        localStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), commits }));
        renderCommits(commits, feedElement);

    } catch (error) {
        console.error('Error fetching GitHub commits:', error);
        if (error.message === 'Rate limit exceeded') {
            setFeedMessage(feedElement, 'GitHub rate limit hit. Try again later.');
        } else {
            setFeedMessage(feedElement, 'Could not load commits.');
        }
    }
}

function renderCommits(commits, feedElement) {
    if (!commits || commits.length === 0) {
        setFeedMessage(feedElement, 'No recent public commits.');
        return;
    }

    feedElement.innerHTML = '';

    commits.forEach(commit => {
        const stats = commit.additions === null
            ? ''
            : `<span class="feed-stats"><span class="add">+${commit.additions}</span> <span class="del">-${commit.deletions}</span></span>`;

        const li = document.createElement('li');
        li.innerHTML = `
            <span class="feed-main">
                <a href="${escapeHtml(commit.repoUrl)}" target="_blank" rel="noopener" class="feed-repo">${escapeHtml(commit.repoName)}</a>
                <span class="feed-sep">—</span>
                <a href="${escapeHtml(commit.htmlUrl)}" target="_blank" rel="noopener" title="${escapeHtml(commit.message)}">${escapeHtml(commit.message)}</a>
            </span>
            ${stats}
            <span class="feed-time">${getTimeAgo(new Date(commit.date))}</span>
        `;
        feedElement.appendChild(li);
    });
}

function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y ago";

    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo ago";

    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";

    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";

    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m ago";

    return Math.floor(seconds) + "s ago";
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML.replace(/"/g, '&quot;');
}

const BLOGS = [
    { url: 'https://blog.boreddev.nl/index.json', label: 'boreddev.nl' },
    { url: 'https://blog.boredos.dev/index.json', label: 'boredos.dev' }
];

async function fetchBlog(blog) {
    const response = await fetch(blog.url);
    if (!response.ok) throw new Error(`Failed to load ${blog.url}`);

    const posts = await response.json();
    return posts.map(post => {
        const date = new Date(post.date || post.publishDate || post.published_at);
        return {
            title: post.title,
            permalink: post.permalink,
            date: isNaN(date.getTime()) ? null : date,
            source: blog.label
        };
    });
}

async function fetchBlogPosts() {
    const feedElement = document.getElementById('blog-feed');

    // Load both blogs; one failing shouldn't hide the other
    const results = await Promise.allSettled(BLOGS.map(fetchBlog));
    const posts = [];

    results.forEach(result => {
        if (result.status === 'fulfilled') {
            posts.push(...result.value);
        } else {
            console.error('Error fetching blog posts:', result.reason);
        }
    });

    if (posts.length === 0) {
        const allFailed = results.every(result => result.status === 'rejected');
        setFeedMessage(feedElement, allFailed ? 'Could not load posts.' : 'No posts yet.');
        return;
    }

    // Newest first; undated posts go last
    posts.sort((a, b) => (b.date ? b.date.getTime() : 0) - (a.date ? a.date.getTime() : 0));

    feedElement.innerHTML = '';

    posts.slice(0, 5).forEach(post => {
        const li = document.createElement('li');
        const timeSpan = post.date ? `<span class="feed-time">${getTimeAgo(post.date)}</span>` : '';

        li.innerHTML = `
            <span class="feed-main">
                <a href="${escapeHtml(post.permalink)}" target="_blank" rel="noopener">${escapeHtml(post.title)}</a>
            </span>
            <span class="feed-source">${post.source}</span>
            ${timeSpan}
        `;
        feedElement.appendChild(li);
    });
}
