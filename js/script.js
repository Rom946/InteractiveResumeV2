const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Mobile navigation toggle
const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');

navToggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    navToggle.classList.toggle('open', isOpen);
    navToggle.setAttribute('aria-expanded', String(isOpen));
});

navLinks.addEventListener('click', (event) => {
    if (event.target.tagName === 'A') {
        navLinks.classList.remove('open');
        navToggle.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
    }
});

// Scroll reveal
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            revealObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));

// Animated counters (hero stats + project metrics)
function animateCount(el) {
    const target = parseInt(el.dataset.count, 10);
    const prefix = el.dataset.prefix || '';
    const suffix = el.dataset.suffix || '';
    const duration = 1200;
    const start = performance.now();

    function tick(now) {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = prefix + Math.round(eased * target) + suffix;
        if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
}

const countObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            animateCount(entry.target);
            countObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

document.querySelectorAll('[data-count]').forEach((el) => countObserver.observe(el));

// Highlight active nav link while scrolling
const sections = document.querySelectorAll('main section[id]');
const linkMap = new Map(
    [...document.querySelectorAll('.nav-links a[href^="#"]')].map((a) => [a.getAttribute('href').slice(1), a])
);

const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        const link = linkMap.get(entry.target.id);
        if (!link) return;
        if (entry.isIntersecting) {
            linkMap.forEach((a) => a.classList.remove('active'));
            link.classList.add('active');
        }
    });
}, { rootMargin: '-40% 0px -55% 0px' });

sections.forEach((section) => sectionObserver.observe(section));

/* ============ Projects: stacked cards scroll effect ============ */
const projectCards = [...document.querySelectorAll('.project-card')];

if (projectCards.length && !prefersReducedMotion) {
    let stackTicking = false;

    function updateStack() {
        stackTicking = false;
        projectCards.forEach((card, i) => {
            const next = projectCards[i + 1];
            if (!next) return;
            const cardTop = card.getBoundingClientRect().top;
            const nextTop = next.getBoundingClientRect().top;
            // 0 when the next card is a full viewport away, 1 when it covers this card
            const range = window.innerHeight - cardTop;
            const progress = Math.min(Math.max(1 - (nextTop - cardTop) / Math.max(range, 1), 0), 1);
            card.style.setProperty('--stack', progress.toFixed(3));
        });
    }

    window.addEventListener('scroll', () => {
        if (!stackTicking) {
            stackTicking = true;
            requestAnimationFrame(updateStack);
        }
    }, { passive: true });

    updateStack();
}

/* ============ Projects: cursor tilt + spotlight ============ */
if (!prefersReducedMotion && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    projectCards.forEach((card) => {
        const inner = card.querySelector('.project-card-inner');

        card.addEventListener('pointermove', (e) => {
            const rect = inner.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width;
            const y = (e.clientY - rect.top) / rect.height;
            inner.style.setProperty('--rx', ((0.5 - y) * 3).toFixed(2) + 'deg');
            inner.style.setProperty('--ry', ((x - 0.5) * 4).toFixed(2) + 'deg');
            inner.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
            inner.style.setProperty('--my', (y * 100).toFixed(1) + '%');
        });

        card.addEventListener('pointerleave', () => {
            inner.style.setProperty('--rx', '0deg');
            inner.style.setProperty('--ry', '0deg');
        });
    });
}

/* ============ Projects: Challenge / Approach / Outcome tabs ============ */
document.querySelectorAll('.project-card').forEach((card) => {
    const tabs = [...card.querySelectorAll('.tab-btn')];
    const indicator = card.querySelector('.tab-indicator');
    const panelsWrap = card.querySelector('.tab-panels');
    const panels = [...card.querySelectorAll('.tab-panel')];

    function moveIndicator(btn) {
        indicator.style.width = btn.offsetWidth + 'px';
        indicator.style.transform = `translateX(${btn.offsetLeft}px)`;
    }

    function setPanelHeight(panel) {
        panelsWrap.style.height = panel.offsetHeight + 'px';
    }

    function activate(index) {
        tabs.forEach((btn, i) => {
            const active = i === index;
            btn.classList.toggle('active', active);
            btn.setAttribute('aria-selected', String(active));
        });
        panels.forEach((panel, i) => panel.classList.toggle('active', i === index));
        moveIndicator(tabs[index]);
        setPanelHeight(panels[index]);
    }

    tabs.forEach((btn, i) => {
        btn.addEventListener('click', () => activate(i));
        btn.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                const dir = e.key === 'ArrowRight' ? 1 : -1;
                const nextIndex = (i + dir + tabs.length) % tabs.length;
                activate(nextIndex);
                tabs[nextIndex].focus();
            }
        });
    });

    // Initial layout (after fonts settle, heights can shift)
    function layout() {
        const activeIndex = tabs.findIndex((t) => t.classList.contains('active'));
        moveIndicator(tabs[activeIndex]);
        setPanelHeight(panels[activeIndex]);
    }

    layout();
    window.addEventListener('resize', layout);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
});

// Footer year
document.getElementById('year').textContent = new Date().getFullYear();
