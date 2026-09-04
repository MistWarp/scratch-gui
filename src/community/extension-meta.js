import extensionLibrary from '../lib/libraries/extensions/index.jsx';

const TURBOWARP_GALLERY_URL = 'https://extensions.turbowarp.org/generated-metadata/extensions-v0.json';
const TURBOWARP_BASE = 'https://extensions.turbowarp.org/';

let builtinCache = null;
const builtins = () => {
    if (!builtinCache) {
        builtinCache = new Map();
        for (const entry of extensionLibrary || []) {
            if (entry?.extensionId && !builtinCache.has(entry.extensionId)) builtinCache.set(entry.extensionId, entry);
        }
    }
    return builtinCache;
};

export const builtinExtensionMeta = id => {
    const entry = builtins().get(id);
    if (!entry) return null;
    return {
        name: typeof entry.name === 'string' ? entry.name : id,
        iconUrl: typeof entry.iconURL === 'string' ? entry.iconURL : null
    };
};

let galleryPromise = null;
const loadGallery = () => {
    if (!galleryPromise) {
        galleryPromise = fetch(TURBOWARP_GALLERY_URL).then(response => {
            if (!response.ok) throw new Error('Could not load the extension gallery.');
            return response.json();
        }).catch(() => []);
    }
    return galleryPromise;
};

export const isGalleryExtensionUrl = url =>
    typeof url === 'string' && url.startsWith(TURBOWARP_BASE);

export const resolveExtensionMeta = async (id, url) => {
    const builtin = builtinExtensionMeta(id);
    if (builtin) return builtin;
    if (!isGalleryExtensionUrl(url)) return null;
    const catalog = await loadGallery();
    const list = Array.isArray(catalog) ? catalog : catalog?.extensions || [];
    const match = list.find(entry => `${TURBOWARP_BASE}${entry?.slug}.js` === url);
    if (!match) return null;
    return {
        name: match.name || id,
        iconUrl: match.image ? `${TURBOWARP_BASE}${match.image}` : null
    };
};

export const resolveExtensionMetas = async items => {
    const metas = {};
    const seen = new Set();
    const jobs = [];
    for (const item of items || []) {
        if (!item || seen.has(item.id)) continue;
        seen.add(item.id);
        jobs.push(
            resolveExtensionMeta(item.id, item.url)
                .catch(() => null)
                .then(meta => {
                    if (meta) metas[item.id] = meta;
                })
        );
    }
    await Promise.all(jobs);
    return metas;
};
