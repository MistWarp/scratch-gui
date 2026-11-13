import fs from 'node:fs';
import path from 'node:path';

const LANGUAGE_MODULES = [
    /\/src\/generated\/(?:editor|community)-locales\/(?!en\.json$)(?<language>[\w-]+)\.json$/,
    /\/@turbowarp\/scratch-l10n\/src\/locale-data\/[\w-]+\.js$/,
    /\/src\/addons\/addons-l10n(?:-settings)?\/(?<language>[\w-]+)\.json$/,
    /\/src\/packager\/locales\/(?<language>[\w-]+)\.json$/
];
const HASHED_FILE = /[\w.-]+-[\w-]{8}\.[a-z0-9]+/g;
const PACKAGES = '/node_modules/';
const MANIFEST_PLACEHOLDER = 'self.__MW_OFFLINE__';

const sourceOf = id => id.replace(/^\0/, '').replace(/\?.*$/, '');

const languageOf = (item, directory) => {
    if (item.type !== 'chunk' || !item.isDynamicEntry) return null;
    const sources = new Set(item.moduleIds.map(sourceOf));
    const [id] = sources;
    const match = sources.size === 1 && LANGUAGE_MODULES.map(pattern => id.match(pattern)).find(Boolean);
    if (!match) return null;
    const packaged = id.lastIndexOf(PACKAGES);
    const key = packaged === -1 ? path.relative(directory, id) : id.slice(packaged + PACKAGES.length);
    return match.groups ? {key, language: match.groups.language} : {key};
};

const textOf = item => {
    if (item.type === 'chunk') return item.code;
    if (typeof item.source === 'string') return item.source;
    return /\.(?:css|html|svg|js)$/.test(item.fileName) ? Buffer.from(item.source).toString('utf8') : '';
};

export const createOfflineManifest = (bundle, {directory, pages, files = [], version}) => {
    const items = Object.values(bundle);
    const byName = new Map(items.map(item => [path.posix.basename(item.fileName), item]));
    const references = item => [
        ...(item.type === 'chunk' ? [...item.imports, ...item.dynamicImports] : []).map(name => bundle[name]),
        ...[...textOf(item).matchAll(HASHED_FILE)].map(([name]) => byName.get(name))
    ].filter(Boolean);
    const seen = new Set();
    const precache = new Set(files);
    const languages = {};
    const visit = item => {
        if (seen.has(item)) return;
        seen.add(item);
        const language = languageOf(item, directory);
        if (language) {
            languages[item.fileName] = language;
            return;
        }
        precache.add(item.fileName);
        references(item).forEach(visit);
    };
    const entries = pages.map(page => {
        if (!bundle[page]) throw new Error(`The offline page ${page} is not part of this build.`);
        const entry = items.find(item => item.type === 'chunk' && item.isEntry &&
            item.facadeModuleId === path.join(directory, page));
        if (!entry) throw new Error(`The offline page ${page} has no entry script.`);
        seen.add(bundle[page]);
        references(bundle[page]).forEach(visit);
        return [page, entry.fileName];
    });
    return {version, pages: Object.fromEntries(entries), precache: [...precache].sort(), languages};
};

const filesIn = (from, to) => fs.readdirSync(from, {recursive: true})
    .filter(name => fs.statSync(path.join(from, name)).isFile())
    .map(name => path.posix.join(to, ...name.split(path.sep)));

export const writeOfflineWorker = (source, manifest) => {
    if (!source.includes(MANIFEST_PLACEHOLDER)) throw new Error(`The worker source has no ${MANIFEST_PLACEHOLDER}.`);
    return source.replace(MANIFEST_PLACEHOLDER, () => JSON.stringify(manifest));
};

export const offlineWorker = ({directory, source, pages, folders, version}) => ({
    name: 'mistwarp-offline-worker',
    apply: 'build',
    enforce: 'post',
    generateBundle (options, bundle) {
        const built = pages.filter(page => bundle[page]);
        if (built.length === 0) return;
        const files = folders.flatMap(([from, to]) => filesIn(path.join(directory, from), to));
        const manifest = createOfflineManifest(bundle, {directory, pages: built, files, version});
        this.emitFile({
            type: 'asset',
            fileName: 'sw.js',
            source: writeOfflineWorker(fs.readFileSync(source, 'utf8'), manifest)
        });
    }
});
