// ==========================================================================
// CMS-driven content loader. Reads /data/*.json (edited via /admin, the
// Sveltia CMS) and renders it into the page. Kept separate from script.js
// so the CMS data layer and the interaction layer can evolve independently.
// ==========================================================================
(function () {
    const langMatch = location.pathname.match(/\/(en|de|pl)\//);
    const LANG = langMatch ? langMatch[1] : 'cs';
    const PREFIX = LANG === 'cs' ? '' : '../';

    function pick(obj, key) {
        return obj[key + '_' + LANG] ?? obj[key + '_cs'] ?? obj[key] ?? '';
    }

    function loadJSON(name) {
        return fetch(PREFIX + 'data/' + name + '.json', { cache: 'no-store' })
            .then(r => r.ok ? r.json() : null)
            .catch(() => null);
    }

    function photoGridHTML(photos, galleryId, altPrefix) {
        return photos.map((src, i) => {
            const full = PREFIX + src;
            const webp = full.replace(/\.(jpg|png)$/, '.webp');
            return '<div class="photo-thumb reveal-scale" style="--i:' + (i % 6) + '" data-lightbox data-gallery="' + galleryId + '" data-src="' + full + '">' +
                '<picture><source srcset="' + webp + '" type="image/webp">' +
                '<img src="' + full + '" alt="' + altPrefix + ' ' + (i + 1) + '" loading="lazy"></picture></div>';
        }).join('');
    }

    function afterRender() {
        if (window.initLightboxBindings) window.initLightboxBindings();
        if (window.initRevealObservers) window.initRevealObservers();
    }

    const renderers = {
        // --- Homepage news banner ---
        news: function () {
            const el = document.getElementById('newsBox');
            if (!el) return Promise.resolve();
            return loadJSON('news').then(news => {
                if (!news) return;
                if (!news.enabled) { el.style.display = 'none'; return; }
                el.innerHTML =
                    '<div><h3>' + pick(news, 'title') + '</h3>' +
                    '<p>' + pick(news, 'text') + ' <a href="kotatka.html">' + pick(news, 'cta') + ' →</a></p></div>' +
                    '<a href="kotatka.html" class="btn btn-solid">' + pick(news, 'cta') + '</a>';
            });
        },

        // --- Kitten litters (kotatka.html) ---
        litters: function () {
            const el = document.getElementById('littersContainer');
            if (!el) return Promise.resolve();
            return loadJSON('litters').then(data => {
                if (!data) return;
                const badgeClass = { available: 'available', reserved: 'reserved', home: 'home', upcoming: '' };
                const badgeText = {
                    available: { cs: 'Dostupné', en: 'Available', de: 'Verfügbar', pl: 'Dostępne' },
                    reserved: { cs: 'Vše v rezervaci', en: 'All reserved', de: 'Alle reserviert', pl: 'Wszystkie zarezerwowane' },
                    home: { cs: 'V nových domovech', en: 'In new homes', de: 'In neuen Zuhausen', pl: 'W nowych domach' }
                };
                let html = '';
                let bg = false;
                data.litters.forEach(litter => {
                    const isUpcoming = litter.status === 'upcoming';
                    bg = !bg;
                    if (isUpcoming) {
                        html += '<section class="section"><div class="container"><div class="cta-banner reveal-scale">' +
                            '<h2>' + pick(litter, 'name') + '</h2><p>' + pick(litter, 'desc') + '</p>' +
                            '</div></div></section>';
                        return;
                    }
                    html += '<section class="section' + (bg ? ' bg-soft' : '') + '"><div class="container">' +
                        '<div class="section-header reveal">' +
                        (badgeText[litter.status] ? '<span class="status-badge ' + badgeClass[litter.status] + '" style="position:static; display:inline-flex;">' + badgeText[litter.status][LANG] + '</span>' : '') +
                        '<h2 style="margin-top:1rem;">' + pick(litter, 'name') + '</h2>' +
                        '<p>' + pick(litter, 'desc') + '</p></div>' +
                        '<div class="photo-grid stagger">' + photoGridHTML(litter.photos, litter.id, pick(litter, 'name')) + '</div>' +
                        '</div></section>';
                });
                el.innerHTML = html;
                afterRender();
            });
        },

        // --- Photo gallery (fotogalerie.html) ---
        gallery: function () {
            const el = document.getElementById('galleryGrid');
            if (!el) return Promise.resolve();
            return loadJSON('gallery').then(data => {
                if (!data) return;
                el.innerHTML = photoGridHTML(data.photos, 'gallery', 'StElli Ragdoll');
                afterRender();
            });
        },

        // --- "Life at StElli" gallery (o-nas.html) ---
        onasLife: function () {
            const el = document.getElementById('onasGrid');
            if (!el) return Promise.resolve();
            return loadJSON('onas-life').then(data => {
                if (!data) return;
                el.innerHTML = photoGridHTML(data.photos, 'onas-life', 'StElli');
                afterRender();
            });
        },

        // --- Team (tym.html) ---
        team: function () {
            const queensEl = document.getElementById('teamQueens');
            const studsEl = document.getElementById('teamStuds');
            if (!queensEl && !studsEl) return Promise.resolve();
            return loadJSON('team').then(data => {
                if (!data) return;
                function cardHTML(cat, i) {
                    const full = PREFIX + cat.photo;
                    const webp = full.replace(/\.(jpg|png)$/, '.webp');
                    return '<div class="cat-card reveal-scale" style="--i:' + i + '">' +
                        '<div class="photo-thumb" data-lightbox data-gallery="tym" data-src="' + full + '">' +
                        '<picture><source srcset="' + webp + '" type="image/webp">' +
                        '<img src="' + full + '" alt="' + cat.name + '" loading="lazy"></picture></div>' +
                        '<div class="card-body"><h4>' + cat.name + '</h4><p>' + cat.desc + '</p></div></div>';
                }
                if (queensEl) queensEl.innerHTML = data.queens.map(cardHTML).join('');
                if (studsEl) studsEl.innerHTML = data.studs.map(cardHTML).join('');
                afterRender();
            });
        }
    };

    document.addEventListener('DOMContentLoaded', function () {
        Promise.all(Object.values(renderers).map(fn => fn()));
    });
})();
