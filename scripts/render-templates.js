// Pure HTML-string templates shared by the build-time prerenderer
// (scripts/prerender.js). No DOM/browser APIs — safe to run in Node.
// Mirrors what content.js used to render client-side at runtime.

const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

// CMS fields are free text entered through /admin. Escape before splicing
// into the static HTML this script writes — otherwise a "<" or "&" in a
// title/description breaks the page markup, and an attacker with CMS
// access (or a phished OAuth token) could plant a persistent XSS payload
// that runs for every visitor of the public site.
function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}

function pick(obj, key, lang) {
    return escapeHtml(obj[key + '_' + lang] ?? obj[key + '_cs'] ?? obj[key] ?? '');
}

// Grid thumbnails reuse the full-res photo unless a pre-generated
// "-thumb" variant exists (see scripts/generate-thumbs.py) — served in
// the grid, while data-src keeps pointing at the full-res file for the
// lightbox. Falls back to the original so a freshly uploaded CMS photo
// still renders correctly before anyone re-runs the thumbnail script.
function thumbPathOf(src) {
    return src.replace(/\.(jpg|png)$/, '-thumb.jpg');
}
function gridSrcOf(src) {
    const thumb = thumbPathOf(src);
    return fs.existsSync(path.join(ROOT, thumb)) ? thumb : src;
}

function photoGridHTML(photos, galleryId, altPrefix, prefix) {
    return photos.map((src, i) => {
        const full = escapeHtml(prefix + src);
        const grid = escapeHtml(prefix + gridSrcOf(src));
        const webp = grid.replace(/\.(jpg|png)$/, '.webp');
        return '<div class="photo-thumb reveal-scale" style="--i:' + (i % 6) + '" data-lightbox tabindex="0" role="button" data-gallery="' + escapeHtml(galleryId) + '" data-src="' + full + '">' +
            '<picture><source srcset="' + webp + '" type="image/webp">' +
            '<img src="' + grid + '" alt="' + escapeHtml(altPrefix) + ' ' + (i + 1) + '" loading="lazy"></picture></div>';
    }).join('');
}

function newsHTML(news, lang) {
    if (!news.enabled) return { hidden: true, html: '' };
    return {
        hidden: false,
        html: '<div><h3>' + pick(news, 'title', lang) + '</h3>' +
            '<p>' + pick(news, 'text', lang) + ' <a href="kotatka.html">' + pick(news, 'cta', lang) + ' →</a></p></div>' +
            '<a href="kotatka.html" class="btn btn-solid">' + pick(news, 'cta', lang) + '</a>'
    };
}

function littersHTML(data, lang, prefix) {
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
                '<h2>' + pick(litter, 'name', lang) + '</h2><p>' + pick(litter, 'desc', lang) + '</p>' +
                '</div></div></section>';
            return;
        }
        html += '<section class="section' + (bg ? ' bg-soft' : '') + '"><div class="container">' +
            '<div class="section-header reveal">' +
            (badgeText[litter.status] ? '<span class="status-badge ' + badgeClass[litter.status] + '" style="position:static; display:inline-flex;">' + badgeText[litter.status][lang] + '</span>' : '') +
            '<h2 style="margin-top:1rem;">' + pick(litter, 'name', lang) + '</h2>' +
            '<p>' + pick(litter, 'desc', lang) + '</p></div>' +
            '<div class="photo-grid stagger">' + photoGridHTML(litter.photos, litter.id, pick(litter, 'name', lang), prefix) + '</div>' +
            '</div></section>';
    });
    return html;
}

function galleryHTML(data, prefix) {
    return photoGridHTML(data.photos, 'gallery', 'StElli Ragdoll', prefix);
}

function onasLifeHTML(data, prefix) {
    return photoGridHTML(data.photos, 'onas-life', 'StElli', prefix);
}

function teamCardHTML(cat, i, prefix) {
    const full = escapeHtml(prefix + cat.photo);
    const grid = escapeHtml(prefix + gridSrcOf(cat.photo));
    const webp = grid.replace(/\.(jpg|png)$/, '.webp');
    const name = escapeHtml(cat.name);
    return '<div class="cat-card reveal-scale" style="--i:' + i + '">' +
        '<div class="photo-thumb" data-lightbox tabindex="0" role="button" data-gallery="tym" data-src="' + full + '">' +
        '<picture><source srcset="' + webp + '" type="image/webp">' +
        '<img src="' + grid + '" alt="' + name + '" loading="lazy"></picture></div>' +
        '<div class="card-body"><h3>' + name + '</h3><p>' + escapeHtml(cat.desc) + '</p></div></div>';
}

function teamHTML(data, prefix) {
    return {
        queens: data.queens.map((c, i) => teamCardHTML(c, i, prefix)).join(''),
        studs: data.studs.map((c, i) => teamCardHTML(c, i, prefix)).join('')
    };
}

module.exports = { pick, photoGridHTML, newsHTML, littersHTML, galleryHTML, onasLifeHTML, teamHTML };
