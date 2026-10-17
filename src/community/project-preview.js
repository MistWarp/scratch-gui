import api from './api.js';

const MAX_ENTRIES = 200;
const TTL = 5 * 60 * 1000;
const cache = new Map();

const keyFor = ref => (ref && ref.id ? `id:${ref.id}` : `slug:${ref && ref.slug}`);

const fetchPreview = async ref => {
    let id = ref.id;
    if (!id && ref.slug) {
        const resolved = await api.resolveVanity(ref.slug);
        id = resolved && resolved.id;
    }
    if (!id) return null;
    const data = await api.getProject(id);
    return (data && data.project) || null;
};

const loadProjectPreview = ref => {
    if (!ref || (!ref.id && !ref.slug)) return Promise.resolve(null);
    const key = keyFor(ref);
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < TTL) return hit.promise;
    const promise = fetchPreview(ref).catch(() => {
        if (cache.get(key)?.promise === promise) cache.delete(key);
        return null;
    });
    cache.delete(key);
    cache.set(key, {at: Date.now(), promise});
    if (cache.size > MAX_ENTRIES) cache.delete(cache.keys().next().value);
    return promise;
};

export default loadProjectPreview;
