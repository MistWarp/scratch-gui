/* global HTMLRewriter */

const API_BASE = 'https://mwapi.mistium.com/api';
const AVATARS = 'https://avatars.rotur.dev';
const DEFAULT_IMAGE = 'https://warp.mistium.com/images/apple-touch-icon.png';
const FETCH_TIMEOUT_MS = 3000;

const STATIC_META = {
    '/spaces': {
        title: 'Spaces - MistWarp',
        description: 'Browse studios, collections, and community challenges on MistWarp.'
    },
    '/roadmap': {
        title: 'Roadmap - MistWarp',
        description: 'Suggest, discuss, and vote on ideas for MistWarp.'
    }
};

const escapeAttribute = value => String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

class AttrSetter {
    constructor (name, value) {
        this.name = name;
        this.value = value;
    }
    element (el) {
        el.setAttribute(this.name, this.value);
    }
}

class TextReplacer {
    constructor (value) {
        this.value = value;
        this.first = true;
    }
    text (chunk) {
        chunk.replace(this.first ? this.value : '');
        this.first = false;
    }
}

class HeadAppender {
    constructor (meta, url) {
        this.meta = meta;
        this.url = url;
    }
    element (el) {
        const title = escapeAttribute(this.meta.title);
        const description = escapeAttribute(this.meta.description);
        const image = escapeAttribute(this.meta.image);
        const url = escapeAttribute(this.url);
        el.append(`<meta name="twitter:title" content="${title}">` +
            `<meta name="twitter:description" content="${description}">` +
            `<meta name="twitter:image" content="${image}">` +
            `<link rel="canonical" href="${url}">`, {html: true});
    }
}

const fetchJson = async path => {
    try {
        const res = await fetch(`${API_BASE}${path}`, {
            signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
            headers: {accept: 'application/json'}
        });
        if (res.ok) return await res.json();
    } catch (e) {
        return null;
    }
    return null;
};

const flatten = text => (text || '').replace(/\s+/g, ' ').trim()
    .slice(0, 200);

const projectMeta = async id => {
    const data = await fetchJson(`/projects/${encodeURIComponent(id)}`);
    if (!data || !data.project || data.project.shared !== true) return null;
    const project = data.project;
    return {
        title: `${project.title} by ${project.owner} - MistWarp`,
        description: flatten(project.instructions || project.description) ||
            `Play ${project.title} on MistWarp.`,
        image: project.thumbUrl || null,
        card: project.thumbUrl ? 'summary_large_image' : 'summary'
    };
};

const userMeta = async name => {
    const data = await fetchJson(`/users/${encodeURIComponent(name)}`);
    if (!data || data.exists !== true) return null;
    const username = data.username || name;
    return {
        title: `${username} - MistWarp`,
        description: flatten(data.bio) ||
            `${username} has shared ${(data.projects || []).length} projects on MistWarp.`,
        image: `${AVATARS}/${encodeURIComponent(username.toLowerCase())}`,
        card: 'summary'
    };
};

const spaceMeta = async id => {
    const data = await fetchJson(`/spaces/${encodeURIComponent(id)}`);
    if (!data || !data.space || data.space.visibility === 'private') return null;
    const space = data.space;
    const kind = {
        studio: 'studio',
        collection: 'collection',
        challenge: 'challenge'
    }[space.kind] || 'space';
    const projectImage = (space.projects || []).find(project => project.thumbUrl);
    const image = space.thumbnailUrl || (projectImage && projectImage.thumbUrl) || null;
    return {
        title: `${space.title} - MistWarp`,
        description: flatten(space.description) ||
            `${space.title} is a MistWarp ${kind} by ${space.owner}.`,
        image,
        card: image ? 'summary_large_image' : 'summary'
    };
};

const decodeSegment = segment => {
    try {
        return decodeURIComponent(segment);
    } catch (e) {
        return null;
    }
};

const metaForPath = pathname => {
    const normalizedPath = pathname.replace(/\/+$/, '') || '/';
    if (STATIC_META[normalizedPath]) return STATIC_META[normalizedPath];

    const projectMatch = normalizedPath.match(/^\/project\/([^/]+)$/);
    if (projectMatch) {
        const id = decodeSegment(projectMatch[1]);
        return id === null ? null : projectMeta(id);
    }

    const userMatch = normalizedPath.match(/^\/users\/([^/]+)(?:\/followers)?$/);
    if (userMatch) {
        const name = decodeSegment(userMatch[1]);
        return name === null ? null : userMeta(name);
    }

    const spaceMatch = normalizedPath.match(/^\/spaces\/([^/]+)$/);
    if (spaceMatch) {
        const id = decodeSegment(spaceMatch[1]);
        return id === null ? null : spaceMeta(id);
    }

    if (/^\/spaces\/[^/]+\/manage$/.test(normalizedPath)) {
        return {
            title: 'Manage space - MistWarp',
            description: 'Manage a studio, collection, or challenge on MistWarp.'
        };
    }

    return null;
};

export const onRequest = async context => {
    const {request, next} = context;
    const url = new URL(request.url);

    const metaPromise = metaForPath(url.pathname);
    if (!STATIC_META[url.pathname.replace(/\/+$/, '') || '/'] &&
        !/^\/(?:project|users|spaces)\//.test(url.pathname)) return next();

    const response = await next();
    if (!(response.headers.get('content-type') || '').includes('text/html')) return response;

    const meta = await metaPromise;
    if (!meta) return response;

    const canonicalUrl = `${url.origin}${url.pathname}`;
    const completeMeta = {
        ...meta,
        image: meta.image || DEFAULT_IMAGE,
        card: meta.card || 'summary'
    };

    return new HTMLRewriter()
        .on('title', new TextReplacer(completeMeta.title))
        .on('meta[name="description"]', new AttrSetter('content', completeMeta.description))
        .on('meta[property="og:title"]', new AttrSetter('content', completeMeta.title))
        .on('meta[property="og:description"]', new AttrSetter('content', completeMeta.description))
        .on('meta[property="og:url"]', new AttrSetter('content', canonicalUrl))
        .on('meta[property="og:image"]', new AttrSetter('content', completeMeta.image))
        .on('meta[name="twitter:card"]', new AttrSetter('content', completeMeta.card))
        .on('head', new HeadAppender(completeMeta, canonicalUrl))
        .transform(response);
};
