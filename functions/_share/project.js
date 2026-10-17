export const API_BASE = 'https://api.mistwarp.org/v1';
export const DEFAULT_IMAGE = 'https://mistwarp.org/images/apple-touch-icon.png';
export const FETCH_TIMEOUT_MS = 3000;
export const MISTWARP_PURPLE = '#855cd6';
export const CARD_WIDTH = 1200;
export const CARD_HEIGHT = 630;
export const EMBED_WIDTH = 482;
export const EMBED_HEIGHT = 412;

const HEX_COLOR = /^#[0-9a-f]{6}$/i;
const VANITY_SLUG = /^[a-z0-9-]{3,40}$/i;

export const escapeAttribute = value => String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

export const fetchJson = async (base, path) => {
    try {
        const res = await fetch(`${base}${path}`, {
            signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
            headers: {accept: 'application/json'}
        });
        if (res.ok) return await res.json();
    } catch (e) {
        return null;
    }
    return null;
};

export const apiJson = path => fetchJson(API_BASE, path);

export const flatten = text => (text || '').replace(/\s+/g, ' ').trim()
    .slice(0, 200);

const text = value => (typeof value === 'string' ? value : '');

const brandingOf = project => (project.branding && typeof project.branding === 'object' ? project.branding : {});

export const projectDetails = async id => {
    const data = await apiJson(`/projects/${encodeURIComponent(id)}`);
    if (!data || !data.project || data.project.shared !== true) return null;
    const project = data.project;
    const name = project.title || 'Untitled project';
    const branding = brandingOf(project);
    const pitch = [branding.tagline, project.description, project.instructions]
        .map(value => flatten(text(value)))
        .find(Boolean) || '';
    const slug = text(project.vanitySlug);
    const edited = Number(project.edited);
    return {
        id: String(project.id || id),
        name,
        owner: project.owner || 'unknown',
        pitch,
        description: pitch || `Play ${name} on MistWarp.`,
        image: project.thumbUrl || null,
        slug: VANITY_SLUG.test(slug) ? slug.toLowerCase() : '',
        public: project.visibility === 'public',
        accent: HEX_COLOR.test(text(branding.accentColor)) ? branding.accentColor.toLowerCase() : MISTWARP_PURPLE,
        edited: Number.isFinite(edited) ? edited : 0,
        free: !(Number(project.price) > 0)
    };
};

export const projectPath = details => (details.slug ?
    `/p/${encodeURIComponent(details.slug)}` :
    `/project/${encodeURIComponent(details.id)}`);

export const cardUrl = details => `${API_BASE}/projects/${encodeURIComponent(details.id)}/card.png` +
    `?v=${encodeURIComponent(details.edited)}`;

export const embedSrc = (origin, id, ref) => {
    const src = `${origin}/embed?mw=${encodeURIComponent(id)}`;
    return ref ? `${src}&ref=${encodeURIComponent(ref)}` : src;
};
