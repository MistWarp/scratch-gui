/* global HTMLRewriter */

const API_BASE = 'https://api.mistwarp.org/v1';
const WARPTHEME_API_BASE = 'https://warptheme.mistium.com/api';
const AVATARS = 'https://avatars.rotur.dev';
const DEFAULT_IMAGE = 'https://mistwarp.org/images/apple-touch-icon.png';
const FETCH_TIMEOUT_MS = 3000;
const STATIC_FILE_PATH = /^\/(?:assets|js|static\/assets)\//;
// Standalone HTML entries with their own tags; the community SPA is index.html.
const SKIP_PATHS = new Set([
    '/editor',
    '/editor.html',
    '/player',
    '/player.html',
    '/fullscreen',
    '/fullscreen.html',
    '/embed.html',
    '/privacy.html'
]);

const STATIC_META = {
    '/': {
        title: 'MistWarp',
        description: 'MistWarp is a powerful Scratch mod. Create, share, and explore projects on the MistWarp community.'
    },
    '/explore': {
        title: 'Explore - MistWarp',
        description: 'Explore community projects, games, and creations shared on MistWarp.'
    },
    '/bounties': {
        title: 'Project bounties - MistWarp',
        description: 'Earn credits by completing bounties on MistWarp community projects.'
    },
    '/themes': {
        title: 'Themes - MistWarp',
        description: 'Browse community-made editor themes for MistWarp.'
    },
    '/groups': {
        title: 'Groups - MistWarp',
        description: 'Organisations that share projects, spaces, members, and funding on MistWarp.'
    },
    '/news': {
        title: 'News - MistWarp',
        description: 'Updates and announcements from the MistWarp team.'
    },
    '/stats': {
        title: 'MistWarp stats - MistWarp',
        description: 'Public statistics about the MistWarp community.'
    },
    '/leaderboard': {
        title: 'Leaderboard - MistWarp',
        description: 'Top creators and projects on MistWarp.'
    },
    '/spaces': {
        title: 'Spaces - MistWarp',
        description: 'Browse studios, collections, and community challenges on MistWarp.'
    },
    '/roadmap': {
        title: 'Roadmap - MistWarp',
        description: 'Suggest, discuss, and vote on ideas for MistWarp.'
    },
    '/trust': {
        title: 'Trust and safety - MistWarp',
        description: 'How MistWarp keeps the community safe.'
    },
    '/support': {
        title: 'Support - MistWarp',
        description: 'Get help with MistWarp.'
    },
    '/status': {
        title: 'Service status - MistWarp',
        description: 'Current status of MistWarp services.'
    },
    '/perks': {
        title: 'Membership perks - MistWarp',
        description: 'MistWarp membership plans and perks.'
    },
    '/mystuff': {
        title: 'My Stuff - MistWarp',
        description: 'Your MistWarp projects and library.',
        noindex: true
    },
    '/settings': {
        title: 'Settings - MistWarp',
        description: 'Your MistWarp account settings.',
        noindex: true
    },
    '/wallet': {
        title: 'Wallet - MistWarp',
        description: 'Your MistWarp credits and purchases.',
        noindex: true
    },
    '/notifications': {
        title: 'Notifications - MistWarp',
        description: 'Your MistWarp notifications.',
        noindex: true
    },
    '/admin': {
        title: 'Admin - MistWarp',
        description: 'MistWarp administration.',
        noindex: true
    }
};

const NOT_FOUND_META = {
    title: 'Page not found - MistWarp',
    description: 'This page does not exist on MistWarp.'
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
            (this.meta.noindex ? '<meta name="robots" content="noindex">' : '') +
            `<link rel="canonical" href="${url}">`, {html: true});
    }
}

const fetchJson = async (base, path) => {
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

const apiJson = path => fetchJson(API_BASE, path);

const flatten = text => (text || '').replace(/\s+/g, ' ').trim()
    .slice(0, 200);

const projectDetails = async id => {
    const data = await apiJson(`/projects/${encodeURIComponent(id)}`);
    if (!data || !data.project || data.project.shared !== true) return null;
    const project = data.project;
    return {
        name: project.title || 'Untitled project',
        owner: project.owner || 'unknown',
        description: flatten(project.instructions || project.description) ||
            `Play ${project.title} on MistWarp.`,
        image: project.thumbUrl || null
    };
};

const projectMeta = async id => {
    const details = await projectDetails(id);
    if (!details) {
        return {
            title: 'Project - MistWarp',
            description: 'View this project on MistWarp.'
        };
    }
    return {
        title: `${details.name} by ${details.owner} - MistWarp`,
        description: details.description,
        image: details.image,
        card: details.image ? 'summary_large_image' : 'summary'
    };
};

const vanityMeta = async (slug, suffix) => {
    const data = await apiJson(`/vanity/${encodeURIComponent(slug)}`);
    if (!data || !data.id) {
        return {
            title: 'Project - MistWarp',
            description: 'View this project on MistWarp.'
        };
    }
    if (!suffix) return projectMeta(data.id);
    const details = await projectDetails(data.id);
    if (!details) {
        return {
            title: `${suffix} - MistWarp`,
            description: 'View this project on MistWarp.'
        };
    }
    return {
        title: `${details.name} · ${suffix} - MistWarp`,
        description: details.description,
        image: details.image,
        card: details.image ? 'summary_large_image' : 'summary'
    };
};

const projectSubMeta = async (id, suffix) => {
    const details = await projectDetails(id);
    if (!details) {
        return {
            title: `${suffix} - MistWarp`,
            description: 'View this project on MistWarp.'
        };
    }
    return {
        title: `${details.name} · ${suffix} - MistWarp`,
        description: details.description,
        image: details.image,
        card: details.image ? 'summary_large_image' : 'summary'
    };
};

const pullMeta = async (id, index) => {
    const [details, data] = await Promise.all([
        projectDetails(id),
        apiJson(`/projects/${encodeURIComponent(id)}/pulls/${encodeURIComponent(index)}`)
    ]);
    const pull = data && data.pull;
    const projectName = details ? details.name : 'Project';
    if (!pull) return projectSubMeta(id, 'Pull requests');
    return {
        title: `${pull.title || `Pull request #${index}`} · ${projectName} - MistWarp`,
        description: flatten(pull.body) ||
            (details ? details.description : `Pull request #${index} on ${projectName}.`),
        image: details ? details.image : null,
        card: details && details.image ? 'summary_large_image' : 'summary'
    };
};

const userMeta = async (name, suffix) => {
    const data = await apiJson(`/users/${encodeURIComponent(name)}`);
    if (!data || data.exists !== true) {
        return {
            title: 'Profile - MistWarp',
            description: 'View this MistWarp profile.'
        };
    }
    const username = data.username || name;
    const base = suffix ? `${username} · ${suffix}` : username;
    return {
        title: `${base} - MistWarp`,
        description: flatten(data.bio) ||
            `${username} has shared ${(data.projects || []).length} projects on MistWarp.`,
        image: `${AVATARS}/${encodeURIComponent(username.toLowerCase())}`,
        card: 'summary'
    };
};

const spaceMeta = async id => {
    const data = await apiJson(`/spaces/${encodeURIComponent(id)}`);
    if (!data || !data.space || data.space.visibility === 'private') {
        return {
            title: 'Space - MistWarp',
            description: 'View this MistWarp space.'
        };
    }
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

const groupMeta = async tag => {
    const data = await apiJson(`/groups/${encodeURIComponent(tag)}`);
    const group = data && data.group;
    if (!group) {
        return {
            title: 'Group - MistWarp',
            description: 'View this MistWarp group.'
        };
    }
    const projects = data.projects || [];
    return {
        title: `${group.name || tag} - MistWarp`,
        description: flatten(group.description) ||
            `${group.name || tag} has shared ${projects.length} projects on MistWarp.`,
        image: group.icon_url || DEFAULT_IMAGE,
        card: 'summary'
    };
};

const newsMeta = async id => {
    const data = await apiJson(`/news/${encodeURIComponent(id)}`);
    const item = data && data.item;
    if (!item) {
        return {
            title: 'News - MistWarp',
            description: 'Updates and announcements from the MistWarp team.'
        };
    }
    return {
        title: `${item.title} - MistWarp`,
        description: flatten(item.body) || 'Updates and announcements from the MistWarp team.'
    };
};

const themeMeta = async id => {
    const data = await fetchJson(WARPTHEME_API_BASE, `/theme?uuid=${encodeURIComponent(id)}`);
    const theme = data && data.theme;
    if (!theme) {
        return {
            title: 'Theme - MistWarp',
            description: 'View this MistWarp editor theme.'
        };
    }
    const owner = theme.authorName || theme.owner || theme.author || 'Unknown';
    return {
        title: `${theme.name || 'Theme'} by ${owner} - MistWarp`,
        description: flatten(theme.description) || `A community-made editor theme for MistWarp.`
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

    let match = normalizedPath.match(/^\/p\/([^/]+)((?:\/[^/]+)*)$/);
    if (match) {
        const slug = decodeSegment(match[1]);
        if (slug === null) return NOT_FOUND_META;
        const rest = match[2] || '';
        if (!rest) return vanityMeta(slug);
        if (rest === '/remixes') return vanityMeta(slug, 'Remix tree');
        if (rest === '/pulls') return vanityMeta(slug, 'Pull requests');
        const pullMatch = rest.match(/^\/pulls\/([^/]+)$/);
        if (pullMatch) {
            const index = decodeSegment(pullMatch[1]);
            if (index === null) return NOT_FOUND_META;
            return vanityPullMeta(slug, index);
        }
        if (/^\/commits\/[^/]+$/.test(rest)) return vanityMeta(slug, 'Commit');
        return NOT_FOUND_META;
    }

    match = normalizedPath.match(/^\/project\/([^/]+)((?:\/[^/]+)*)$/);
    if (match) {
        const id = decodeSegment(match[1]);
        if (id === null) return NOT_FOUND_META;
        const rest = match[2] || '';
        if (!rest) return projectMeta(id);
        if (rest === '/remixes') return projectSubMeta(id, 'Remix tree');
        if (rest === '/pulls') return projectSubMeta(id, 'Pull requests');
        const pullMatch = rest.match(/^\/pulls\/([^/]+)$/);
        if (pullMatch) {
            const index = decodeSegment(pullMatch[1]);
            if (index === null) return NOT_FOUND_META;
            return pullMeta(id, index);
        }
        if (/^\/commits\/[^/]+$/.test(rest)) return projectSubMeta(id, 'Commit');
        return NOT_FOUND_META;
    }

    match = normalizedPath.match(/^\/users\/([^/]+)((?:\/[^/]+)*)$/);
    if (match) {
        const name = decodeSegment(match[1]);
        if (name === null) return NOT_FOUND_META;
        const rest = match[2] || '';
        if (!rest) return userMeta(name);
        if (rest === '/library') return userMeta(name, 'Game library');
        if (rest === '/followers') return userMeta(name, 'Followers');
        if (rest === '/following') return userMeta(name, 'Following');
        return NOT_FOUND_META;
    }

    match = normalizedPath.match(/^\/groups\/([^/]+)$/);
    if (match) {
        const tag = decodeSegment(match[1]);
        return tag === null ? NOT_FOUND_META : groupMeta(tag);
    }

    match = normalizedPath.match(/^\/news\/([^/]+)$/);
    if (match) {
        const id = decodeSegment(match[1]);
        if (id === null) return NOT_FOUND_META;
        if (id === 'manage') {
            return {
                title: 'Manage news - MistWarp',
                description: 'Manage MistWarp news posts.',
                noindex: true
            };
        }
        return newsMeta(id);
    }

    match = normalizedPath.match(/^\/themes\/([^/]+)$/);
    if (match) {
        const id = decodeSegment(match[1]);
        return id === null ? NOT_FOUND_META : themeMeta(id);
    }

    match = normalizedPath.match(/^\/posts\/([^/]+)$/);
    if (match) {
        return match[1] ? {
            title: 'Post - MistWarp',
            description: 'View this MistWarp community post.'
        } : NOT_FOUND_META;
    }

    match = normalizedPath.match(/^\/bounties\/([^/]+)$/);
    if (match) {
        return match[1] ? {
            title: 'Bounty - MistWarp',
            description: 'View this MistWarp project bounty.'
        } : NOT_FOUND_META;
    }

    match = normalizedPath.match(/^\/spaces\/([^/]+)((?:\/[^/]+)*)$/);
    if (match) {
        const id = decodeSegment(match[1]);
        if (id === null) return NOT_FOUND_META;
        const rest = match[2] || '';
        if (!rest) return spaceMeta(id);
        if (rest === '/manage') {
            return {
                title: 'Manage space - MistWarp',
                description: 'Manage a studio, collection, or challenge on MistWarp.',
                noindex: true
            };
        }
        return NOT_FOUND_META;
    }

    if (normalizedPath === '/mystuff/project') return NOT_FOUND_META;
    match = normalizedPath.match(/^\/mystuff\/project\/([^/]+)$/);
    if (match) {
        return {
            title: 'Manage project - MistWarp',
            description: 'Manage your MistWarp project.',
            noindex: true
        };
    }

    return NOT_FOUND_META;
};

const vanityPullMeta = async (slug, index) => {
    const data = await apiJson(`/vanity/${encodeURIComponent(slug)}`);
    if (!data || !data.id) {
        return {
            title: 'Pull request - MistWarp',
            description: 'View this MistWarp pull request.'
        };
    }
    return pullMeta(data.id, index);
};

export const onRequest = async context => {
    const {request, next} = context;
    const url = new URL(request.url);

    const response = await next();
    const contentType = response.headers.get('content-type') || '';
    if (STATIC_FILE_PATH.test(url.pathname) && contentType.includes('text/html')) {
        return new Response('Not found', {
            status: 404,
            headers: {
                'Cache-Control': 'no-store',
                'Content-Type': 'text/plain; charset=utf-8',
                'X-Content-Type-Options': 'nosniff'
            }
        });
    }

    if (!contentType.includes('text/html')) return response;
    if (SKIP_PATHS.has(url.pathname)) return response;

    const meta = await metaForPath(url.pathname);
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
