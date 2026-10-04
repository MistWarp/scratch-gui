const SITE_NAME = 'MistWarp';
const DEFAULT_DESCRIPTION =
    'MistWarp is a powerful Scratch mod. Create, share, and explore projects on the MistWarp community.';

const setMeta = (attr, key, content) => {
    let el = document.head.querySelector(`meta[${attr}="${key}"]`);
    if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        document.head.appendChild(el);
    }
    el.setAttribute('content', content);
};

// The path whose page set its own title. Route-level defaults leave it alone until the next navigation.
let claimedPath = null;

const applyPageMeta = ({title, description, image, card} = {}) => {
    const fullTitle = title ? `${title} - ${SITE_NAME}` : SITE_NAME;
    const desc = (description || DEFAULT_DESCRIPTION).replace(/\s+/g, ' ').trim()
        .slice(0, 200);
    const url = `${window.location.origin}${window.location.pathname}`;
    const img = image || `${window.location.origin}/images/apple-touch-icon.png`;
    document.title = fullTitle;
    setMeta('name', 'description', desc);
    setMeta('property', 'og:site_name', SITE_NAME);
    setMeta('property', 'og:title', fullTitle);
    setMeta('property', 'og:description', desc);
    setMeta('property', 'og:url', url);
    setMeta('property', 'og:image', img);
    setMeta('name', 'twitter:card', card || (image ? 'summary_large_image' : 'summary'));
    setMeta('name', 'twitter:title', fullTitle);
    setMeta('name', 'twitter:description', desc);
    setMeta('name', 'twitter:image', img);
    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) {
        canonical = document.createElement('link');
        canonical.rel = 'canonical';
        document.head.appendChild(canonical);
    }
    canonical.href = url;
};

const setPageMeta = meta => {
    claimedPath = window.location.pathname;
    applyPageMeta(meta);
};

// The generic title for a route. A navigation always applies it; a later refresh (such as a
// translation finishing loading) does not overwrite the title a page has since set.
export const setRouteMeta = (meta, navigated) => {
    if (navigated) claimedPath = null;
    else if (claimedPath === window.location.pathname) return;
    applyPageMeta(meta);
};

export default setPageMeta;
