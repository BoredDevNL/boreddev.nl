const nav = document.querySelector('.nav-bar');
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');
const sections = document.querySelectorAll('section');
const skillCategories = document.querySelectorAll('.skill-category');
const projectCards = document.querySelectorAll('.project-card');
const sectionHeadings = document.querySelectorAll('section > h2');
const planets = document.querySelectorAll('.planet');

VANTA.DOTS({
    el: "#hero-background",
    mouseControls: true,
    touchControls: true,
    gyroControls: false,
    minHeight: 200.00,
    minWidth: 200.00,
    scale: 1.00,
    scaleMobile: 1.00,
    color: 0x9a8c98,
    color2: 0x4a4e69,
    backgroundColor: 0x22223b,
    size: 3,
    spacing: 35.00,
    showLines: false
});

let lastScroll = 0;
window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 50) {
        nav.classList.add('scrolled');
    } else {
        nav.classList.remove('scrolled');
    }

    planets.forEach((planet, index) => {
        const speed = (index + 1) * 0.15;
        const yPos = currentScroll * speed;
        planet.style.transform = `translateY(${yPos}px) rotate(${yPos * 0.2}deg)`;
    });

    lastScroll = currentScroll;
});

navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (href.startsWith('#')) {
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                const offsetPosition = target.offsetTop - 100;
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        }
    });
});


const observerOptions = {
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px'
};

const headingObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateX(0)';
            headingObserver.unobserve(entry.target);
        }
    });
}, observerOptions);

const skillsObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
            entry.target.style.transitionDelay = `${index * 100}ms`;
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0) scale(1)';
            skillsObserver.unobserve(entry.target);
        }
    });
}, observerOptions);

const projectsObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
            entry.target.style.transitionDelay = `${index * 150}ms`;
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateX(0)';
            projectsObserver.unobserve(entry.target);
        }
    });
}, observerOptions);

sectionHeadings.forEach(heading => {
    heading.style.opacity = '0';
    heading.style.transform = 'translateX(-50px)';
    heading.style.transition = 'all 0.8s cubic-bezier(0.17, 0.55, 0.55, 1)';
    headingObserver.observe(heading);
});

skillCategories.forEach(category => {
    category.style.opacity = '0';
    category.style.transform = 'translateY(30px) scale(0.95)';
    category.style.transition = 'all 0.6s cubic-bezier(0.17, 0.55, 0.55, 1)';
    skillsObserver.observe(category);
});

projectCards.forEach((card, index) => {
    card.style.opacity = '0';
    card.style.transform = index % 2 === 0 ? 'translateX(-50px)' : 'translateX(50px)';
    card.style.transition = 'all 0.7s cubic-bezier(0.17, 0.55, 0.55, 1)';
    projectsObserver.observe(card);
});

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const headerOffset = 100;
            const elementPosition = target.offsetTop;
            const offsetPosition = elementPosition - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const hero = document.querySelector('.hero');
    const greeting = document.querySelector('.greeting');
    const intro = document.querySelector('.intro');
    const locationRow = document.querySelector('.location-row');
    const socialIcons = document.querySelector('.social-icons');

    const maxRotation = 10;
    const maxTransform = 15;

    hero.addEventListener('mousemove', (e) => {
        const rect = hero.getBoundingClientRect();
        const xPos = ((e.clientX - rect.left) / rect.width - 0.5) * 100;
        const yPos = ((e.clientY - rect.top) / rect.height - 0.5) * 100;
        const xRotation = (yPos / 50) * maxRotation;
        const yRotation = (xPos / 50) * -maxRotation;

        greeting.style.transform = `
            translateX(${xPos * 0.1}px)
            translateY(${yPos * 0.1}px)
            rotateX(${xRotation}deg)
            rotateY(${yRotation}deg)
            translateZ(50px)
        `;

        intro.style.transform = `
            translateX(${xPos * 0.05}px)
            translateY(${yPos * 0.05}px)
            rotateX(${xRotation * 0.5}deg)
            rotateY(${yRotation * 0.5}deg)
            translateZ(25px)
        `;

        if (locationRow) {
            locationRow.style.transform = `
                translateX(${xPos * 0.08}px)
                translateY(${yPos * 0.08}px)
                rotateX(${xRotation * 0.7}deg)
                rotateY(${yRotation * 0.7}deg)
                translateZ(35px)
            `;
        }

        if (socialIcons) {
            socialIcons.style.transform = `
                translateX(${xPos * 0.07}px)
                translateY(${yPos * 0.07}px)
                rotateX(${xRotation * 0.6}deg)
                rotateY(${yRotation * 0.6}deg)
                translateZ(30px)
            `;
        }
    });

    hero.addEventListener('mouseleave', () => {
        greeting.style.transform = 'translateZ(0)';
        intro.style.transform = 'translateZ(0)';
        if (locationRow) {
            locationRow.style.transform = 'translateZ(0)';
        }
        if (socialIcons) {
            socialIcons.style.transform = 'translateZ(0)';
        }
    });
});
