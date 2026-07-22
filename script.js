// ==========================================================================
// Language: remember manual choice + auto-route by country on first visit
// ==========================================================================
(function i18n() {
    const LANGS = [
        { code: 'cs', dir: '' },
        { code: 'en', dir: 'en/' },
        { code: 'de', dir: 'de/' },
        { code: 'pl', dir: 'pl/' }
    ];

    function currentInfo() {
        const path = location.pathname;
        const m = path.match(/\/(en|de|pl)\//);
        const code = m ? m[1] : 'cs';
        let file = path.substring(path.lastIndexOf('/') + 1);
        if (!file) file = 'index.html';
        return { code, file };
    }

    function urlForLang(code) {
        const cur = currentInfo();
        const target = LANGS.find(l => l.code === code);
        if (!target) return null;
        const up = cur.code === 'cs' ? '' : '../';
        return up + target.dir + cur.file;
    }

    const ls = {
        get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
        set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
    };
    const ss = {
        get(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
        set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} }
    };

    // Remember the language when a flag is clicked
    document.querySelectorAll('.lang-link[hreflang]').forEach(a => {
        a.addEventListener('click', () => ls.set('stelli_lang', a.getAttribute('hreflang')));
    });

    // Only auto-route from the Czech root; language folders are sticky
    const info = currentInfo();
    if (info.code !== 'cs') return;
    if (ss.get('stelli_autorouted')) return;
    ss.set('stelli_autorouted', '1');

    function goTo(code) {
        if (code === 'cs') return;
        const url = urlForLang(code);
        if (url) location.replace(url);
    }

    const saved = ls.get('stelli_lang');
    if (saved) { goTo(saved); return; }

    function fromCountry(cc) {
        cc = (cc || '').trim().toUpperCase();
        if (cc === 'CZ') return 'cs';
        if (cc === 'DE' || cc === 'AT' || cc === 'LI') return 'de';
        if (cc === 'PL') return 'pl';
        return 'en';
    }
    function fromBrowser() {
        const l = (navigator.language || 'en').toLowerCase();
        if (l.startsWith('cs')) return 'cs';
        if (l.startsWith('de')) return 'de';
        if (l.startsWith('pl')) return 'pl';
        return 'en';
    }

    fetch('https://ipapi.co/country/', { cache: 'no-store' })
        .then(r => r.ok ? r.text() : Promise.reject())
        .then(cc => goTo(fromCountry(cc)))
        .catch(() => goTo(fromBrowser()));
})();

// ==========================================================================
// Mobile navigation
// ==========================================================================
const navToggle = document.getElementById('navToggle');
const navMenu = document.getElementById('navMenu');
const navBackdrop = document.getElementById('navBackdrop');

// `overflow: hidden` on <body> (the .nav-open class below) doesn't stop
// touch-scrolling the page behind a fixed menu on iOS Safari — the page
// scrolls under the menu anyway. Pinning the body itself via
// position:fixed while remembering the scroll offset is the reliable
// cross-browser fix; restore the scroll position when the menu closes.
let navScrollY = 0;

function lockBodyScroll() {
    navScrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = -navScrollY + 'px';
    document.body.style.left = '0';
    document.body.style.right = '0';
}

function unlockBodyScroll() {
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    window.scrollTo(0, navScrollY);
}

function closeMenu() {
    navToggle?.classList.remove('active');
    navToggle?.setAttribute('aria-expanded', 'false');
    navMenu?.classList.remove('active');
    navBackdrop?.classList.remove('active');
    document.body.classList.remove('nav-open');
    unlockBodyScroll();
}

navToggle?.addEventListener('click', () => {
    const isOpen = navToggle.classList.toggle('active');
    navToggle.setAttribute('aria-expanded', String(isOpen));
    navMenu.classList.toggle('active', isOpen);
    navBackdrop?.classList.toggle('active', isOpen);
    document.body.classList.toggle('nav-open', isOpen);
    if (isOpen) lockBodyScroll();
    else unlockBodyScroll();
});

navBackdrop?.addEventListener('click', closeMenu);
document.querySelectorAll('.nav-menu a').forEach(link => link.addEventListener('click', closeMenu));

// ==========================================================================
// Highlight active nav link
// ==========================================================================
const currentPage = location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.nav-menu a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage) link.classList.add('active');
});

// ==========================================================================
// Scroll reveal (IntersectionObserver). Exposed on window so it can be
// re-run if content is ever injected dynamically after page load.
// ==========================================================================
const revealObserver = 'IntersectionObserver' in window
    ? new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' })
    : null;

function initRevealObservers() {
    const targets = document.querySelectorAll('.reveal, .reveal-scale, .reveal-left, .reveal-right');
    targets.forEach((el, i) => {
        if (el.dataset.revealBound) return;
        el.dataset.revealBound = '1';
        el.style.setProperty('--i', el.dataset.i || (i % 6));
        if (revealObserver) revealObserver.observe(el);
        else el.classList.add('is-visible');
    });
}
window.initRevealObservers = initRevealObservers;
initRevealObservers();

// ==========================================================================
// Animated counters (stat numbers with data-count)
// ==========================================================================
const counters = document.querySelectorAll('[data-count]');
if ('IntersectionObserver' in window && counters.length) {
    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const el = entry.target;
            const target = parseInt(el.dataset.count, 10);
            const suffix = el.dataset.suffix || '';
            const duration = 1400;
            const start = performance.now();
            function tick(now) {
                const progress = Math.min((now - start) / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 3);
                el.textContent = Math.round(eased * target) + suffix;
                if (progress < 1) requestAnimationFrame(tick);
            }
            requestAnimationFrame(tick);
            counterObserver.unobserve(el);
        });
    }, { threshold: 0.5 });
    counters.forEach(el => counterObserver.observe(el));
}

// ==========================================================================
// Accordion (FAQ)
// ==========================================================================
document.querySelectorAll('.accordion-item').forEach((item, idx) => {
    const trigger = item.querySelector('.accordion-trigger');
    const panel = item.querySelector('.accordion-panel');
    if (!trigger || !panel) return;
    if (!panel.id) panel.id = 'accordion-panel-' + idx + '-' + Math.random().toString(36).slice(2, 7);
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-controls', panel.id);
    trigger.addEventListener('click', () => {
        const isOpen = item.classList.contains('open');
        item.closest('.accordion').querySelectorAll('.accordion-item').forEach(other => {
            other.classList.remove('open');
            other.querySelector('.accordion-panel').style.maxHeight = null;
            other.querySelector('.accordion-trigger')?.setAttribute('aria-expanded', 'false');
        });
        if (!isOpen) {
            item.classList.add('open');
            panel.style.maxHeight = panel.scrollHeight + 'px';
            trigger.setAttribute('aria-expanded', 'true');
        }
    });
});

// ==========================================================================
// Lightbox — real photo grids with prev/next navigation per gallery group.
// Bindings are re-initializable if content is ever injected dynamically
// after page load.
// ==========================================================================
const lightbox = document.getElementById('lightbox');
const lightboxImg = lightbox?.querySelector('.lightbox-content img');
const lightboxCounter = lightbox?.querySelector('.lightbox-counter');
let lbGalleries = {};
let lbGroup = null;
let lbIndex = 0;
let lbReturnFocus = null;

function lbOpenAt(group, index) {
    const items = lbGalleries[group];
    if (!items || !items.length) return;
    lbGroup = group;
    lbIndex = (index + items.length) % items.length;
    const trigger = items[lbIndex];
    const src = trigger.dataset.src || trigger.querySelector('img')?.src;
    const alt = trigger.querySelector('img')?.alt || '';
    lightboxImg.src = src;
    lightboxImg.alt = alt;
    if (lightboxCounter) lightboxCounter.textContent = items.length > 1 ? (lbIndex + 1) + ' / ' + items.length : '';
    lightbox.classList.add('active');
}

function lbOpen(group, index, triggerEl) {
    lbReturnFocus = triggerEl || document.activeElement;
    lbOpenAt(group, index);
    lightbox.querySelector('.lightbox-close')?.focus();
}

function lbClose() {
    lightbox.classList.remove('active');
    lbReturnFocus?.focus();
    lbReturnFocus = null;
}

function initLightboxBindings() {
    if (!lightbox) return;
    lbGalleries = {};
    document.querySelectorAll('[data-lightbox]').forEach(trigger => {
        const group = trigger.dataset.gallery || 'default';
        if (!lbGalleries[group]) lbGalleries[group] = [];
        lbGalleries[group].push(trigger);
        if (!trigger.dataset.lbBound) {
            trigger.dataset.lbBound = '1';
            trigger.addEventListener('click', () => {
                const g = trigger.dataset.gallery || 'default';
                lbOpen(g, lbGalleries[g].indexOf(trigger), trigger);
            });
            trigger.addEventListener('keydown', (e) => {
                if (e.key !== 'Enter' && e.key !== ' ') return;
                e.preventDefault();
                const g = trigger.dataset.gallery || 'default';
                lbOpen(g, lbGalleries[g].indexOf(trigger), trigger);
            });
        }
    });
}
window.initLightboxBindings = initLightboxBindings;

if (lightbox) {
    initLightboxBindings();

    lightbox.querySelector('.lightbox-prev')?.addEventListener('click', () => lbOpenAt(lbGroup, lbIndex - 1));
    lightbox.querySelector('.lightbox-next')?.addEventListener('click', () => lbOpenAt(lbGroup, lbIndex + 1));

    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox || e.target.closest('.lightbox-close')) lbClose();
    });

    const lbFocusable = Array.prototype.slice.call(
        lightbox.querySelectorAll('.lightbox-close, .lightbox-prev, .lightbox-next')
    );

    document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('active')) return;
        if (e.key === 'Escape') { lbClose(); return; }
        if (e.key === 'ArrowRight') lbOpenAt(lbGroup, lbIndex + 1);
        if (e.key === 'ArrowLeft') lbOpenAt(lbGroup, lbIndex - 1);
        if (e.key === 'Tab' && lbFocusable.length) {
            const first = lbFocusable[0];
            const last = lbFocusable[lbFocusable.length - 1];
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        }
    });
}

// ==========================================================================
// Contact form validation + real submission via Web3Forms
// ==========================================================================
// Access key from https://web3forms.com — messages are delivered to the
// e-mail registered with this key. Replace the placeholder below with the
// real key to activate delivery.
const WEB3FORMS_ACCESS_KEY = '275794e8-10a5-4489-b56a-64955e22f020';

document.querySelectorAll('.contact-form').forEach(form => {
    form.addEventListener('submit', async function (e) {
        e.preventDefault();
        let valid = true;

        this.querySelectorAll('[required]').forEach(field => {
            const group = field.closest('.form-group');
            const errorValid = field.type === 'email'
                ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value.trim())
                : field.value.trim().length > 0;

            group?.classList.toggle('has-error', !errorValid);
            if (!errorValid) valid = false;
        });

        if (!valid) return;

        const button = this.querySelector('button[type="submit"]');
        const originalText = button.textContent;
        button.disabled = true;
        button.textContent = 'Odesílám...';

        function showSuccess() {
            const success = form.parentElement.querySelector('.form-success') || form.nextElementSibling;
            form.style.display = 'none';
            if (success && success.classList.contains('form-success')) {
                success.classList.add('show');
            } else {
                alert('Děkujeme za vaši zprávu! Brzy se vám ozveme.');
            }
            form.reset();
        }

        function showError() {
            button.disabled = false;
            button.textContent = originalText;
            alert('Zprávu se nepodařilo odeslat. Zkuste to prosím znovu, nebo nám napište přímo na stellicattery@gmail.com.');
        }

        // If the access key hasn't been configured yet, fall back to the
        // local success animation so the site still behaves gracefully.
        if (!WEB3FORMS_ACCESS_KEY || WEB3FORMS_ACCESS_KEY === 'YOUR_WEB3FORMS_ACCESS_KEY') {
            setTimeout(() => { showSuccess(); button.disabled = false; button.textContent = originalText; }, 700);
            return;
        }

        try {
            const formData = new FormData(form);
            formData.append('access_key', WEB3FORMS_ACCESS_KEY);
            formData.append('subject', 'Nová zpráva z webu StElli Ragdoll');
            formData.append('from_name', 'StElli Ragdoll web');

            const response = await fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                headers: { 'Accept': 'application/json' },
                body: formData
            });
            const data = await response.json();

            if (data.success) {
                showSuccess();
            } else {
                showError();
            }
        } catch (err) {
            showError();
        }
    });

    form.querySelectorAll('input, textarea').forEach(field => {
        field.addEventListener('input', () => field.closest('.form-group')?.classList.remove('has-error'));
    });
});

// ==========================================================================
// Cat mascot system — breathing/blinking SVG cats, cursor-tracking eyes,
// petting hearts, paw cursor trail, and a random peek-and-pounce easter egg
// ==========================================================================
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function buildCatMascot() {
    const wrap = document.createElement('div');
    wrap.className = 'cat-svg-wrap';
    wrap.innerHTML = `<svg viewBox="0 0 200 200" class="cat-svg" aria-hidden="true" focusable="false">
        <g class="cat-tail-group"><path class="cat-tail" d="M145,152 Q196,148 190,96 Q187,70 165,77" fill="none" stroke="#b9a4cf" stroke-width="20" stroke-linecap="round"/></g>
        <ellipse class="cat-body" cx="100" cy="148" rx="54" ry="40" fill="#ffffff"/>
        <ellipse cx="100" cy="150" rx="54" ry="26" fill="#efe7fa"/>
        <ellipse class="cat-paw" cx="74" cy="184" rx="14" ry="9" fill="#ffffff"/>
        <ellipse class="cat-paw" cx="126" cy="184" rx="14" ry="9" fill="#ffffff"/>
        <path class="cat-ear cat-ear-left" d="M62,64 L48,26 L86,55 Z" fill="#8e76ad"/>
        <path class="cat-ear cat-ear-right" d="M138,64 L152,26 L114,55 Z" fill="#8e76ad"/>
        <circle class="cat-head" cx="100" cy="90" r="40" fill="#ffffff"/>
        <path class="cat-mask" d="M70,82 Q100,114 130,82 Q132,107 100,124 Q68,107 70,82 Z" fill="#cdbfe0"/>
        <g class="cat-whiskers" stroke="#cdbfe0" stroke-width="1.6" stroke-linecap="round">
            <line x1="58" y1="92" x2="22" y2="86"/>
            <line x1="58" y1="98" x2="20" y2="98"/>
            <line x1="58" y1="104" x2="22" y2="110"/>
            <line x1="142" y1="92" x2="178" y2="86"/>
            <line x1="142" y1="98" x2="180" y2="98"/>
            <line x1="142" y1="104" x2="178" y2="110"/>
        </g>
        <g class="cat-eye cat-eye-left">
            <ellipse cx="82" cy="88" rx="9.5" ry="11.5" fill="#7fb2d9"/>
            <g class="cat-pupil-group"><circle class="cat-pupil" cx="82" cy="88" r="4.6" fill="#20222e"/><circle cx="79.6" cy="84.8" r="1.6" fill="#ffffff"/></g>
            <ellipse class="cat-eyelid" cx="82" cy="88" rx="10.5" ry="12.5" fill="#ffffff"/>
        </g>
        <g class="cat-eye cat-eye-right">
            <ellipse cx="118" cy="88" rx="9.5" ry="11.5" fill="#7fb2d9"/>
            <g class="cat-pupil-group"><circle class="cat-pupil" cx="118" cy="88" r="4.6" fill="#20222e"/><circle cx="115.6" cy="84.8" r="1.6" fill="#ffffff"/></g>
            <ellipse class="cat-eyelid" cx="118" cy="88" rx="10.5" ry="12.5" fill="#ffffff"/>
        </g>
        <path class="cat-nose" d="M95,99 L105,99 L100,105 Z" fill="#e8a9bb"/>
        <path class="cat-mouth" d="M100,105 Q93,111 84,107 M100,105 Q107,111 116,107" stroke="#a795b8" stroke-width="2" fill="none" stroke-linecap="round"/>
    </svg>`;
    return wrap;
}

// --- Cursor-tracking eyes -------------------------------------------------
const catEyeInstances = [];
let lastMouseX = window.innerWidth / 2;
let lastMouseY = window.innerHeight / 3;
let eyeTrackScheduled = false;

function registerCatEyes(root) {
    const leftGroup = root.querySelector('.cat-eye-left .cat-pupil-group');
    const rightGroup = root.querySelector('.cat-eye-right .cat-pupil-group');
    const leftEye = root.querySelector('.cat-eye-left ellipse');
    const rightEye = root.querySelector('.cat-eye-right ellipse');
    if (!leftGroup || !rightGroup) return null;
    const entry = { leftGroup, rightGroup, leftEye, rightEye };
    catEyeInstances.push(entry);
    return entry;
}

function unregisterCatEyes(entry) {
    const idx = catEyeInstances.indexOf(entry);
    if (idx > -1) catEyeInstances.splice(idx, 1);
}

function updateCatEyes() {
    eyeTrackScheduled = false;
    catEyeInstances.forEach(({ leftGroup, rightGroup, leftEye, rightEye }) => {
        [[leftGroup, leftEye], [rightGroup, rightEye]].forEach(([pupilGroup, eyeEl]) => {
            const rect = eyeEl.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            const dx = lastMouseX - cx;
            const dy = lastMouseY - cy;
            const dist = Math.hypot(dx, dy) || 1;
            const maxOffset = 2.6;
            const pull = Math.min(maxOffset, dist / 20);
            pupilGroup.style.transform = `translate(${(dx / dist) * pull}px, ${(dy / dist) * pull}px)`;
        });
    });
}

if (!prefersReducedMotion) {
    window.addEventListener('mousemove', (e) => {
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
        if (!eyeTrackScheduled) {
            eyeTrackScheduled = true;
            requestAnimationFrame(updateCatEyes);
        }
    }, { passive: true });
}

// --- Petting: hearts/paws float up on hover or click ----------------------
function spawnHearts(el) {
    const rect = el.getBoundingClientRect();
    const symbols = ['💗', '🐾', '✨'];
    for (let i = 0; i < 3; i++) {
        const heart = document.createElement('span');
        heart.className = 'float-particle';
        heart.textContent = symbols[Math.floor(Math.random() * symbols.length)];
        heart.style.left = (rect.left + rect.width / 2 + (Math.random() * 40 - 20)) + 'px';
        heart.style.top = (rect.top + rect.height * 0.2) + 'px';
        heart.style.animationDelay = (i * 0.12) + 's';
        document.body.appendChild(heart);
        heart.addEventListener('animationend', () => heart.remove());
    }
}

function attachPetting(el) {
    let purring = false;
    function purr() {
        if (purring) return;
        purring = true;
        el.classList.add('is-purring');
        spawnHearts(el);
        setTimeout(() => { el.classList.remove('is-purring'); purring = false; }, 650);
    }
    el.addEventListener('click', purr);
    if (!prefersReducedMotion) el.addEventListener('mouseenter', purr);
}

// --- Persistent corner buddy cat (every page) ------------------------------
function initCatBuddy() {
    if (document.querySelector('.cat-buddy')) return;
    const buddy = document.createElement('div');
    buddy.className = 'cat-buddy';
    buddy.setAttribute('role', 'button');
    buddy.setAttribute('tabindex', '0');
    buddy.setAttribute('aria-label', 'Pomazlete kočku StElli');
    buddy.appendChild(buildCatMascot());
    document.body.appendChild(buddy);
    registerCatEyes(buddy);
    attachPetting(buddy);
}

// --- Hero showcase cat (homepage only) -------------------------------------
function initHeroCat() {
    const slot = document.getElementById('heroCatSlot');
    if (!slot) return;
    slot.appendChild(buildCatMascot());
    registerCatEyes(slot);
    attachPetting(slot);
}

// --- Cursor paw trail + click ripple ---------------------------------------
function initPawTrail() {
    if (prefersReducedMotion) return;
    let lastPawTime = 0;
    window.addEventListener('mousemove', (e) => {
        const now = performance.now();
        if (now - lastPawTime < 120) return;
        lastPawTime = now;
        const paw = document.createElement('span');
        paw.className = 'paw-trail';
        paw.textContent = '🐾';
        paw.style.left = (e.clientX - 8) + 'px';
        paw.style.top = (e.clientY - 8) + 'px';
        paw.style.setProperty('--r', (Math.random() * 40 - 20) + 'deg');
        document.body.appendChild(paw);
        paw.addEventListener('animationend', () => paw.remove());
    }, { passive: true });

    window.addEventListener('click', (e) => {
        const ripple = document.createElement('span');
        ripple.className = 'paw-ripple';
        ripple.textContent = '🐾';
        ripple.style.left = (e.clientX - 14) + 'px';
        ripple.style.top = (e.clientY - 14) + 'px';
        document.body.appendChild(ripple);
        ripple.addEventListener('animationend', () => ripple.remove());
    });
}

// --- Peek-and-pounce easter egg ---------------------------------------------
function runCatPeek() {
    const fromRight = Math.random() > 0.5;
    const dir = fromRight ? -1 : 1;
    const peekOffset = 70;

    const peek = document.createElement('div');
    peek.className = 'cat-peek' + (fromRight ? ' from-right' : ' from-left');
    peek.style.top = (20 + Math.random() * 55) + 'vh';
    if (fromRight) peek.style.right = '-90px'; else peek.style.left = '-90px';
    peek.style.transform = 'translate(0px, 0px)';

    const inner = document.createElement('div');
    inner.className = 'cat-peek-inner';
    inner.appendChild(buildCatMascot());
    peek.appendChild(inner);
    document.body.appendChild(peek);
    const eyeEntry = registerCatEyes(peek);

    let escaped = false;

    function setTransform(x, y) { peek.style.transform = `translate(${x}px, ${y}px)`; }

    function cleanup(delay) {
        setTimeout(() => {
            peek.remove();
            if (eyeEntry) unregisterCatEyes(eyeEntry);
        }, delay);
    }

    function runAway(fast) {
        if (escaped) return;
        escaped = true;
        peek.classList.remove('is-looking');
        const duration = fast ? 240 : 420;
        peek.style.transition = `transform ${duration}ms cubic-bezier(0.4,0,1,1), opacity ${duration}ms ease`;
        setTransform(dir * (peekOffset + 220), 0);
        peek.style.opacity = '0';
        cleanup(duration + 40);
    }

    peek.addEventListener('click', (e) => { e.stopPropagation(); spawnHearts(peek); runAway(true); });

    requestAnimationFrame(() => {
        peek.style.opacity = '1';
        setTransform(dir * peekOffset, 0);

        setTimeout(() => { if (!escaped) peek.classList.add('is-looking'); }, 550);

        setTimeout(() => {
            if (escaped) return;
            peek.classList.remove('is-looking');
            const rect = peek.getBoundingClientRect();
            const targetX = Math.max(-160, Math.min(160, lastMouseX - rect.left - rect.width / 2));
            const targetY = Math.max(-120, Math.min(120, lastMouseY - rect.top - rect.height / 2));
            peek.style.transition = 'transform 420ms cubic-bezier(0.34,1.56,0.64,1)';
            setTransform(dir * peekOffset + targetX, targetY);
            setTimeout(() => runAway(false), 420);
        }, 1900);
    });
}

function scheduleCatPeek() {
    if (prefersReducedMotion) return;
    const delay = 24000 + Math.random() * 28000;
    setTimeout(() => {
        if (document.visibilityState === 'visible') runCatPeek();
        scheduleCatPeek();
    }, delay);
}

// initCatBuddy();   // petting corner mascot — disabled for now
// initHeroCat();    // petting hero mascot — disabled for now
initPawTrail();
// scheduleCatPeek(); // peek-and-pounce easter egg — disabled for now

// ==========================================================================
// Floating "Chci kotě" button — site-wide on concept pages. Injected here so
// every page gets it without markup edits (the homepage ships its own inline
// copy instead, since it needs to sit inside the page's own script block).
// Its color fades from blue to cream as it scrolls over the footer, driven
// by scroll position rather than snapping at contact.
// ==========================================================================
(function initFloatCat() {
    if (!document.body.classList.contains('concept')) return;
    if (document.getElementById('floatCta')) return;
    const path = (location.pathname.split('/').pop() || 'index.html');
    if (path === '' || path === 'index.html') return;

    const isSub = /\/(en|de|pl)\//.test(location.pathname);
    const langMatch = location.pathname.match(/\/(en|de|pl)\//);
    const lang = langMatch ? langMatch[1] : 'cs';
    const imgPrefix = isSub ? '../images/' : 'images/';

    const ARIA_LABEL = { cs: 'Chci koťátko', en: 'I want a kitten', de: 'Ich möchte ein Kätzchen', pl: 'Chcę kocię' };
    const LABEL = { cs: 'Chci kotě', en: 'A kitten', de: 'Kätzchen', pl: 'Chcę kocię' };

    const a = document.createElement('a');
    a.href = 'kontakty.html#formular';
    a.className = 'c-float-cta is-visible';
    a.id = 'floatCta';
    a.setAttribute('aria-label', ARIA_LABEL[lang]);
    a.innerHTML =
        '<span class="c-float-cta-icon">' +
            '<picture><source srcset="' + imgPrefix + 'logo-icon-cat-bold.webp" type="image/webp"><img class="c-float-cta-cat" src="' + imgPrefix + 'logo-icon-cat-bold.png" alt="" aria-hidden="true"></picture>' +
            '<picture><source srcset="' + imgPrefix + 'logo-icon-cat-bold-light.webp" type="image/webp"><img class="c-float-cta-cat c-float-cta-cat-light" src="' + imgPrefix + 'logo-icon-cat-bold-light.png" alt="" aria-hidden="true"></picture>' +
        '</span>' +
        '<span class="c-float-cta-label" aria-hidden="true">' + LABEL[lang] + '</span>';
    document.body.appendChild(a);

    const footer = document.querySelector('footer');
    if (!footer) return;

    const fadeDistance = 160;
    let ticking = false;

    function updateFooterProgress() {
        ticking = false;
        const btnRect = a.getBoundingClientRect();
        const footerRect = footer.getBoundingClientRect();
        const distance = footerRect.top - btnRect.top;
        const progress = 1 - Math.min(Math.max(distance / fadeDistance, 0), 1);
        a.style.setProperty('--footer-progress', progress.toFixed(3));
    }

    function onScroll() {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(updateFooterProgress);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    updateFooterProgress();
})();

// ==========================================================================
// Smooth page transitions between internal links
// ==========================================================================
document.querySelectorAll('a[href]').forEach(link => {
    const href = link.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto') || link.target === '_blank') return;

    link.addEventListener('click', (e) => {
        e.preventDefault();
        document.body.classList.add('is-leaving');
        setTimeout(() => { window.location.href = href; }, 320);
    });
});
