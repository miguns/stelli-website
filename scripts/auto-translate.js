// Fills in missing EN/DE/PL text in data/*.json using the DeepL API.
// Only translates fields that are empty — anything already written
// (by hand or by a previous run) is left untouched.
//
// Convention: any key ending in "_cs" is treated as the Czech source of
// truth. Its "_en" / "_de" / "_pl" siblings are translated in if missing.
//
// Requires env var DEEPL_API_KEY. Run via `node scripts/auto-translate.js`.

const fs = require('fs');
const path = require('path');

const DEEPL_KEY = process.env.DEEPL_API_KEY;
const DEEPL_URL = DEEPL_KEY && DEEPL_KEY.endsWith(':fx')
    ? 'https://api-free.deepl.com/v2/translate'
    : 'https://api.deepl.com/v2/translate';

const TARGETS = [
    { suffix: 'en', deepl: 'EN-GB' },
    { suffix: 'de', deepl: 'DE' },
    { suffix: 'pl', deepl: 'PL' }
];

const DATA_DIR = path.join(__dirname, '..', 'data');
const FILES = ['news.json', 'litters.json', 'testimonials.json'];

let apiCalls = 0;

async function translate(text, targetLang) {
    apiCalls++;
    const res = await fetch(DEEPL_URL, {
        method: 'POST',
        headers: {
            Authorization: 'DeepL-Auth-Key ' + DEEPL_KEY,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: [text], source_lang: 'CS', target_lang: targetLang })
    });
    if (!res.ok) {
        const body = await res.text();
        throw new Error('DeepL API error ' + res.status + ': ' + body);
    }
    const data = await res.json();
    return data.translations[0].text;
}

async function walk(node, stats) {
    if (Array.isArray(node)) {
        for (const item of node) await walk(item, stats);
        return;
    }
    if (!node || typeof node !== 'object') return;

    for (const key of Object.keys(node)) {
        const value = node[key];
        if (key.endsWith('_cs') && typeof value === 'string' && value.trim()) {
            const base = key.slice(0, -3);
            for (const { suffix, deepl } of TARGETS) {
                const targetKey = base + '_' + suffix;
                const existing = node[targetKey];
                if (typeof existing === 'string' && existing.trim()) continue; // never overwrite
                try {
                    node[targetKey] = await translate(value, deepl);
                    stats.translated++;
                    console.log('  translated ' + targetKey + ': "' + value + '" -> "' + node[targetKey] + '"');
                } catch (err) {
                    console.error('  FAILED ' + targetKey + ': ' + err.message);
                    stats.failed++;
                }
            }
        } else if (value && typeof value === 'object') {
            await walk(value, stats);
        }
    }
}

async function main() {
    if (!DEEPL_KEY) {
        console.error('DEEPL_API_KEY is not set — skipping translation.');
        process.exit(0);
    }

    let anyChanged = false;

    for (const file of FILES) {
        const filePath = path.join(DATA_DIR, file);
        if (!fs.existsSync(filePath)) continue;

        const raw = fs.readFileSync(filePath, 'utf8');
        const json = JSON.parse(raw);
        const stats = { translated: 0, failed: 0 };

        console.log('Checking ' + file + '...');
        await walk(json, stats);

        if (stats.translated > 0) {
            fs.writeFileSync(filePath, JSON.stringify(json, null, 2) + '\n', 'utf8');
            anyChanged = true;
            console.log(file + ': filled in ' + stats.translated + ' field(s).');
        } else {
            console.log(file + ': nothing to translate.');
        }
        if (stats.failed > 0) {
            console.log(file + ': ' + stats.failed + ' translation(s) failed, see log above.');
        }
    }

    console.log('DeepL API calls made: ' + apiCalls);
    // Signal to the workflow whether there is anything to commit.
    process.exit(anyChanged ? 0 : 0);
}

main().catch(err => {
    console.error('Unexpected error:', err);
    process.exit(1);
});
