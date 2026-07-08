// Pure HTML-string templates shared by the build-time prerenderer
// (scripts/prerender.js). No DOM/browser APIs — safe to run in Node.
// Mirrors what content.js used to render client-side at runtime.

function pick(obj, key, lang) {
    return obj[key + '_' + lang] ?? obj[key + '_cs'] ?? obj[key] ?? '';
}

function photoGridHTML(photos, galleryId, altPrefix, prefix) {
    return photos.map((src, i) => {
        const full = prefix + src;
        const webp = full.replace(/\.(jpg|png)$/, '.webp');
        return '<div class="photo-thumb reveal-scale" style="--i:' + (i % 6) + '" data-lightbox data-gallery="' + galleryId + '" data-src="' + full + '">' +
            '<picture><source srcset="' + webp + '" type="image/webp">' +
            '<img src="' + full + '" alt="' + altPrefix + ' ' + (i + 1) + '" loading="lazy"></picture></div>';
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
    const full = prefix + cat.photo;
    const webp = full.replace(/\.(jpg|png)$/, '.webp');
    return '<div class="cat-card reveal-scale" style="--i:' + i + '">' +
        '<div class="photo-thumb" data-lightbox data-gallery="tym" data-src="' + full + '">' +
        '<picture><source srcset="' + webp + '" type="image/webp">' +
        '<img src="' + full + '" alt="' + cat.name + '" loading="lazy"></picture></div>' +
        '<div class="card-body"><h4>' + cat.name + '</h4><p>' + cat.desc + '</p></div></div>';
}

function teamHTML(data, prefix) {
    return {
        queens: data.queens.map((c, i) => teamCardHTML(c, i, prefix)).join(''),
        studs: data.studs.map((c, i) => teamCardHTML(c, i, prefix)).join('')
    };
}

module.exports = { pick, photoGridHTML, newsHTML, littersHTML, galleryHTML, onasLifeHTML, teamHTML };
