import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';

const require = createRequire(import.meta.url);
const parseMessage = require('intl-messageformat-parser').parse;

export const messageArguments = message => {
    const names = new Set();
    const visit = node => {
        if (!node || typeof node !== 'object') return;
        if (node.type === 'argumentElement') names.add(node.id);
        for (const value of Object.values(node)) {
            if (Array.isArray(value)) value.forEach(visit);
            else if (value && typeof value === 'object') visit(value);
        }
    };
    visit(parseMessage(message));
    return [...names].sort().join(',');
};
const {default: locales, isRtl} = require('@turbowarp/scratch-l10n');
const directory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const catalogDirectory = path.join(directory, 'src/community/translations');
const read = filename => JSON.parse(fs.readFileSync(filename, 'utf8'));
const upstreamSource = fs.readFileSync(require.resolve('@turbowarp/scratch-l10n/locales/editor-msgs.js'), 'utf8');
const upstream = JSON.parse(upstreamSource.slice(upstreamSource.indexOf('{')).replace(/;?\s*$/, ''));
const normalize = text => text.trim().replace(/…/g, '...')
    .toLowerCase();

export const writeCommunityLocales = (root = directory) => {
    const sourceCatalog = path.join(root, 'src/community/translations');
    const english = read(path.join(sourceCatalog, 'en.json'));
    for (const name of fs.readdirSync(sourceCatalog)) {
        if (name.endsWith('.json') && !name.startsWith('_') && !locales[name.slice(0, -5)]) {
            throw new Error(`Unknown locale catalog: ${name}`);
        }
    }
    const upstreamIds = new Map();
    for (const [id, text] of Object.entries(upstream.en)) {
        // Reuse only short labels. Longer phrases can have different context.
        if (text.length <= 45 && !text.includes('{')) {
            const key = normalize(text);
            if (!upstreamIds.has(key)) upstreamIds.set(key, []);
            upstreamIds.get(key).push(id);
        }
    }
    const output = path.join(root, 'src/generated/community-locales');
    fs.mkdirSync(output, {recursive: true});
    const write = (name, content) => {
        const target = path.join(output, name);
        if (!fs.existsSync(target) || fs.readFileSync(target, 'utf8') !== content) fs.writeFileSync(target, content);
    };
    const report = {};
    const metadata = {};
    for (const [locale, info] of Object.entries(locales)) {
        metadata[locale] = {name: info.name, rtl: isRtl(locale)};
        const translated = {};
        if (locale !== 'en') {
            for (const [key, text] of Object.entries(english)) {
                const candidates = (upstreamIds.get(normalize(text)) || [])
                    .map(id => upstream[locale]?.[id]).filter(Boolean);
                // Ambiguous upstream translations need an explicit local translation.
                if (candidates.length && new Set(candidates).size === 1) translated[key] = candidates[0];
            }
        }
        const parents = locale === 'es-419' ? ['es', locale] : [locale];
        for (const candidate of parents) {
            const filename = path.join(sourceCatalog, `${candidate}.json`);
            if (!fs.existsSync(filename)) continue;
            for (const [key, value] of Object.entries(read(filename))) {
                if (!(key in english)) throw new Error(`${candidate}: unknown message ${key}`);
                if (typeof value !== 'string') throw new Error(`${candidate}: ${key} must be a string`);
                if (value.trim()) {
                    if (/\{[a-zA-Z]\w*(?:[,}])/.test(english[key]) &&
                        messageArguments(value) !== messageArguments(english[key])) {
                        throw new Error(`${candidate}: placeholders differ for ${key}`);
                    }
                    translated[key] = value;
                }
            }
        }
        write(`${locale}.json`, JSON.stringify(translated));
        report[locale] = {translated: Object.keys(translated).length, total: Object.keys(english).length};
    }
    // Source-text IDs already contain their English fallback; don't ship them twice.
    write('fallbacks.json', JSON.stringify(Object.fromEntries(
        Object.entries(english).filter(([key, value]) => key !== value))));
    write('locales.json', JSON.stringify(metadata));
    write('index.js', `export const loaders = {\n${Object.keys(locales).filter(l => l !== 'en')
        .map(l =>
            `${JSON.stringify(l)}: () => import('./${l}.json')`)
        .join(',\n')}\n};\n`);
    write('coverage.json', `${JSON.stringify(report, null, 2)}\n`);
    return report;
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const command = process.argv[2] || 'check';
    if (command === 'add') {
        const locale = process.argv[3];
        if (!locales[locale] || locale === 'en') {
            throw new Error('Choose an editor locale code, for example fr or pt-br');
        }
        const filename = path.join(catalogDirectory, `${locale}.json`);
        const current = fs.existsSync(filename) ? read(filename) : {};
        const template = Object.fromEntries(Object.keys(read(path.join(catalogDirectory, 'en.json')))
            .map(key => [key, current[key] || '']));
        fs.writeFileSync(filename, `${JSON.stringify(template, null, 2)}\n`);
        console.log(path.relative(directory, filename));
    }
    const report = writeCommunityLocales();
    if (command === 'coverage') console.table(report);
    else console.log(`Validated ${Object.keys(report).length} community locales.`);
}
