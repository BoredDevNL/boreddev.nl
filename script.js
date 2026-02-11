document.addEventListener('DOMContentLoaded', () => {
    // Typing Effect
    const nameText = "Chris";
    const typingSpeed = 150; // ms per char
    const typingElement = document.getElementById('typing-text');
    let charIndex = 0;

    function type() {
        if (charIndex < nameText.length) {
            typingElement.textContent += nameText.charAt(charIndex);
            charIndex++;
            setTimeout(type, typingSpeed);
        }
    }

    setTimeout(type, 500);

    // Local Time Clock
    function updateTime() {
        const timeElement = document.getElementById('local-time');
        const now = new Date();
        
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        
        timeElement.textContent = `${hours}:${minutes}`;
    }

    updateTime();
    setInterval(updateTime, 1000);

    // Fetch GitHub Commits
    fetchGitHubCommits();
    fetchBlogPosts();
});

async function fetchGitHubCommits() {
    const feedElement = document.getElementById('github-feed');
    const username = 'boreddevnl';
    const cacheKey = 'github_commits_cache';
    const cacheDuration = 15 * 60 * 1000; 

    // Check cache first
    const cachedData = localStorage.getItem(cacheKey);
    if (cachedData) {
        const { timestamp, events } = JSON.parse(cachedData);
        if (Date.now() - timestamp < cacheDuration) {
            console.log('Using cached GitHub data');
            await renderCommits(events, feedElement, username);
            return;
        }
    }
    
    try {
        const response = await fetch(`https://api.github.com/users/${username}/events/public`);
        
        if (response.status === 403) {
             throw new Error('Rate limit exceeded');
        }
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const events = await response.json();
        
        // Cache the successful response
        localStorage.setItem(cacheKey, JSON.stringify({
            timestamp: Date.now(),
            events: events
        }));

        await renderCommits(events, feedElement, username);

    } catch (error) {
        console.error('Error fetching GitHub commits:', error);
        if (error.message === 'Rate limit exceeded') {
             feedElement.innerHTML = '<li>API Rate limit exceeded. Try again later.</li>';
        } else {
             feedElement.innerHTML = '<li>Error loading commits. Check console for details.</li>';
        }
    }
}

async function renderCommits(events, feedElement, username) {
    // Filter for PushEvents (commits)
    const pushEvents = events.filter(event => event.type === 'PushEvent').slice(0, 5);

    if (pushEvents.length === 0) {
        feedElement.innerHTML = '<li>No recent public commits found.</li>';
        return;
    }

    feedElement.innerHTML = ''; // Clear loading text

    const commitDetails = await Promise.all(pushEvents.map(async (event) => {
        try {
            // Use the last commit in the push, or the head SHA if the array is empty
            const commitUrl = (event.payload.commits && event.payload.commits.length > 0)
                ? event.payload.commits[event.payload.commits.length - 1].url
                : `https://api.github.com/repos/${event.repo.name}/commits/${event.payload.head}`;

            const response = await fetch(commitUrl);
            if (!response.ok) throw new Error('Detail fetch failed');
            
            const data = await response.json();
            return {
                repoName: event.repo.name.replace(`${username}/`, ''),
                repoUrl: `https://github.com/${event.repo.name}`,
                message: data.commit.message.split('\n')[0],
                additions: data.stats.additions,
                deletions: data.stats.deletions,
                timeAgo: getTimeAgo(new Date(event.created_at)),
                htmlUrl: data.html_url
            };
        } catch (err) {
            console.error("Could not fetch commit details:", err);
            return null;
        }
    }));

    commitDetails.forEach(commit => {
        if (!commit) return;

        const li = document.createElement('li');
        li.innerHTML = `
            <a href="${commit.repoUrl}" target="_blank" class="feed-repo" style="color: #cba6f7; text-decoration: none; font-weight: bold;">${commit.repoName}</a>: 
            <a href="${commit.htmlUrl}" target="_blank" style="color: #89b4fa; text-decoration: none; border-bottom: 1px dashed rgba(137, 180, 250, 0.3); transition: border-bottom 0.2s;">${escapeHtml(commit.message)}</a>
            <span class="feed-stats" style="font-size: 0.85em; opacity: 0.8;">
                (<span style="color: #a6e3a1;">+${commit.additions}</span> <span style="color: #f38ba8;">-${commit.deletions}</span>)
            </span>
            <span class="feed-time">${commit.timeAgo}</span>
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
    return div.innerHTML;
}

async function fetchBlogPosts() {
    const feedElement = document.getElementById('blog-feed');
    
    try {
        const response = await fetch('https://blog.boreddev.nl/index.json');
        
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const posts = await response.json();
        
        const recentPosts = posts.slice(0, 3);

        if (recentPosts.length === 0) {
            feedElement.innerHTML = '<li>No recent posts found.</li>';
            return;
        }

        feedElement.innerHTML = '';

        recentPosts.forEach(post => {
            const li = document.createElement('li');
            
            let timeSpan = '';
            const dateStr = post.date || post.publishDate || post.published_at;
            if (dateStr) {
                 const date = new Date(dateStr);
                 if (!isNaN(date.getTime())) {
                     timeSpan = ` <span class="feed-time">${getTimeAgo(date)}</span>`;
                 }
            }

            li.innerHTML = `<a href="${post.permalink}" target="_blank">${escapeHtml(post.title)}</a>${timeSpan}`;
            feedElement.appendChild(li);
        });

    } catch (error) {
        console.error('Error fetching blog posts:', error);
        feedElement.innerHTML = '<li>Error loading posts.</li>';
    }
}
