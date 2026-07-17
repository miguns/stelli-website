// Renders CMS data (data/*.json, edited via /admin) into the static HTML
// pages between <!--PRERENDER:id:START/END--> markers, for all four
// languages. Run after any data/*.json change (see the GitHub Action) so
// litters/gallery/team/news are visible without JavaScript and to crawlers
// that don't execute it. Safe to re-run — it only ever replaces the
// content between its own markers.
const fs = require('fs');
const path = require('path');
const { newsHTML, littersHTML, galleryHTML, onasLifeHTML, teamHTML } = require('./render-templates');

const ROOT = path.join(__dirname, '..');
const LANGS = [
    { code: 'cs', dir: '.' },
    { code: 'en', dir: 'en' },
    { code: 'de', dir: 'de' },
    { code: 'pl', dir: 'pl' }
];

function readJSON(name) {
    return JSON.parse(fs.readFileSync(path.join(ROOT, 'data', name + '.json'), 'utf8'));
}

function injectMarker(html, id, inner) {
    const startTag = '<!--PRERENDER:' + id + ':START-->';
    const endTag = '<!--PRERENDER:' + id + ':END-->';
    const re = new RegExp(startTag + '[\\s\\S]*?' + endTag);
    if (!re.test(html)) {
        throw new Error('Prerender marker "' + id + '" not found');
    }
    return html.replace(re, startTag + inner + endTag);
}

function setHidden(html, id, hidden) {
    const openTagRe = new RegExp('(<div[^>]*id="' + id + '"[^>]*)(>)');
    return html.replace(openTagRe, (_m, tagStart, close) => {
        const cleaned = tagStart.replace(/\s+hidden\b/g, '');
        return cleaned + (hidden ? ' hidden' : '') + close;
    });
}

function renderFile(file, apply) {
    const full = path.join.apply(path, file);
    let html = fs.readFileSync(full, 'utf8');
    html = apply(html);
    fs.writeFileSync(full, html, 'utf8');
}

function run() {
    const news = readJSON('news');
    const litters = readJSON('litters');
    const gallery = readJSON('gallery');
    const onasLife = readJSON('onas-life');
    const team = readJSON('team');

    LANGS.forEach(({ code, dir }) => {
        const prefix = code === 'cs' ? '' : '../';
        const base = [ROOT, dir];

        renderFile(base.concat('index.html'), html => {
            // The redesigned homepage no longer carries the news box; only
            // inject when the marker is still present so the pipeline (litters,
            // gallery, team…) keeps working regardless.
            if (!html.includes('<!--PRERENDER:newsBox:START-->')) return html;
            const result = newsHTML(news, code);
            html = injectMarker(html, 'newsBox', result.html);
            return setHidden(html, 'newsBox', result.hidden);
        });

        renderFile(base.concat('kotatka.html'), html =>
            injectMarker(html, 'littersContainer', littersHTML(litters, code, prefix)));

        renderFile(base.concat('fotogalerie.html'), html =>
            injectMarker(html, 'galleryGrid', galleryHTML(gallery, prefix)));

        renderFile(base.concat('o-nas.html'), html =>
            injectMarker(html, 'onasGrid', onasLifeHTML(onasLife, prefix)));

        renderFile(base.concat('tym.html'), html => {
            const result = teamHTML(team, prefix);
            html = injectMarker(html, 'teamQueens', result.queens);
            return injectMarker(html, 'teamStuds', result.studs);
        });

        console.log('Prerendered ' + code);
    });
}

run();
