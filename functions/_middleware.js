/* global HTMLRewriter */

import {
    API_BASE, CARD_HEIGHT, CARD_WIDTH, DEFAULT_IMAGE, FETCH_TIMEOUT_MS, apiJson, cardUrl, escapeAttribute,
    fetchJson, flatten, projectDetails, projectPath
} from './_share/project.js';

const WARPTHEME_API_BASE = 'https://warptheme.mistium.com/api';
const AVATARS = 'https://avatars.rotur.dev';
const ROTUR_API_BASE = 'https://api.rotur.dev/v2';
const POST_ID = /^[A-Za-z0-9_-]{1,64}$/;
const VIDEO_URL = /\.(?:mp4|webm|mov|m4v|ogv)(?:[?#]|$)/i;
const STATIC_FILE_PATH = /^\/(?:assets|js|static\/assets)\//;
const DOCS_PATH = /^\/docs(?:\/|$)/;
const LEGACY_EMBED_PATH = /^\/(\d+|p[A-Za-z0-9]+)\/embed\/?$/;
const EDITOR_HOST = 'editor.mistwarp.org';
const EDITOR_ORIGIN = `https://${EDITOR_HOST}`;
const ACCOUNT_ORIGIN = 'https://mistwarp.org';
const ACCOUNT_HOSTS = new Set(['mistwarp.org', 'www.mistwarp.org']);
const APP_PAGES = new Set(['/player', '/fullscreen', '/embed', '/addons', '/credits']);
const MOVED_APP_PAGES = new Set(['/player', '/fullscreen', '/addons', '/credits']);
const PROJECT_PAGE = /^\/\d+(?:\/(editor|fullscreen))?$/;
const PROJECT_PAGE_ASSETS = {editor: '/editor', fullscreen: '/fullscreen'};
const FILE_PATH = /\/[^/]+\.(?!html$)[A-Za-z0-9]+$/;
// Standalone HTML entries with their own tags; the community SPA is index.html.
const SKIP_PATHS = new Set([
    '/editor',
    '/player',
    '/fullscreen',
    '/embed',
    '/addons',
    '/credits',
    '/account-frame',
    '/privacy',
    '/embedtest',
    '/embedtestbad',
    '/sb3-postmessage-test'
]);

const STATIC_META = {
    '/': {
        title: 'MistWarp',
        description:
            'MistWarp is a powerful Scratch mod. Create, share, and explore projects on the MistWarp community.'
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
    '/posts': {
        title: 'Posts - MistWarp',
        description: 'Popular posts from claw, the Rotur social network, on MistWarp.'
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
    '/compare': {
        title: 'MistWarp compared with Scratch and TurboWarp - MistWarp',
        description: 'What MistWarp adds on top of Scratch and TurboWarp: ' +
            'a built-in community, version history, faster projects, and more blocks.'
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
    '/search': {
        title: 'Search - MistWarp',
        description: 'Search projects, people, and spaces on MistWarp.'
    },
    '/random': {
        title: 'Random project - MistWarp',
        description: 'Play a random project from the MistWarp community.',
        noindex: true
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
        description: 'Your Rotur credits and MistWarp purchases.',
        noindex: true
    },
    '/purchases': {
        title: 'Purchases - MistWarp',
        description: 'What you have bought on MistWarp.',
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
        const meta = this.meta;
        const tag = (name, value) => `<meta ${name}="${escapeAttribute(value)}">`;
        const tags = [
            tag('name="twitter:title" content', meta.ogTitle),
            tag('name="twitter:description" content', meta.description),
            tag('name="twitter:image" content', meta.image)
        ];
        if (meta.imageAlt) {
            tags.push(tag('name="twitter:image:alt" content', meta.imageAlt),
                tag('property="og:image:alt" content', meta.imageAlt));
        }
        if (meta.imageWidth) {
            tags.push(tag('property="og:image:width" content', meta.imageWidth),
                tag('property="og:image:height" content', meta.imageHeight));
        }
        if (meta.themeColor) tags.push(tag('name="theme-color" content', meta.themeColor));
        if (meta.noindex) tags.push('<meta name="robots" content="noindex">');
        tags.push(`<link rel="canonical" href="${escapeAttribute(this.url)}">`);
        if (meta.oembedUrl) {
            tags.push(`<link rel="alternate" type="application/json+oembed" ` +
                `href="${escapeAttribute(meta.oembedUrl)}" title="${escapeAttribute(meta.ogTitle)}">`);
        }
        el.append(tags.join(''), {html: true});
    }
}

const PROJECT_FALLBACK = {
    title: 'Project - MistWarp',
    description: 'View this project on MistWarp.'
};

const sentence = value => (/[.!?~\u2026]$/.test(value) ? value : `${value}.`);

const playLine = (details, subject) => `Play${subject ? ` ${subject}` : ''}${details.free ? ' free' : ''} ` +
    'in your browser on MistWarp.';

const gameMeta = details => {
    const byline = `${details.name} by @${details.owner}`;
    return {
        title: `${byline} - MistWarp`,
        ogTitle: byline,
        description: details.pitch ?
            `${sentence(details.pitch)} ${playLine(details)}` :
            playLine(details, details.name),
        image: cardUrl(details),
        imageWidth: CARD_WIDTH,
        imageHeight: CARD_HEIGHT,
        imageAlt: details.name,
        card: 'summary_large_image',
        themeColor: details.accent,
        canonicalPath: projectPath(details),
        oembed: details.public
    };
};

const projectMeta = async id => {
    const details = await projectDetails(id);
    return details ? gameMeta(details) : PROJECT_FALLBACK;
};

const projectSubMeta = async (id, suffix, rest) => {
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
        card: details.image ? 'summary_large_image' : 'summary',
        canonicalPath: `${projectPath(details)}${rest}`
    };
};

const vanityMeta = async (slug, suffix, rest) => {
    const data = await apiJson(`/vanity/${encodeURIComponent(slug)}`);
    if (!data || !data.id) return PROJECT_FALLBACK;
    return suffix ? projectSubMeta(data.id, suffix, rest) : projectMeta(data.id);
};

const pullMeta = async (id, index) => {
    const [details, data] = await Promise.all([
        projectDetails(id),
        apiJson(`/projects/${encodeURIComponent(id)}/pulls/${encodeURIComponent(index)}`)
    ]);
    const pull = data && data.pull;
    const projectName = details ? details.name : 'Project';
    if (!pull) return projectSubMeta(id, 'Pull requests', '/pulls');
    return {
        title: `${pull.title || `Pull request #${index}`} · ${projectName} - MistWarp`,
        description: flatten(pull.body) ||
            (details ? details.description : `Pull request #${index} on ${projectName}.`),
        image: details ? details.image : null,
        card: details && details.image ? 'summary_large_image' : 'summary',
        canonicalPath: details ? `${projectPath(details)}/pulls/${encodeURIComponent(index)}` : null
    };
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

const imageUrl = value => {
    if (typeof value !== 'string' || VIDEO_URL.test(value)) return null;
    try {
        const url = new URL(value);
        return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null;
    } catch (e) {
        return null;
    }
};

const postMeta = async id => {
    const fallback = {
        title: 'Post - MistWarp',
        description: 'View this MistWarp community post.'
    };
    if (!POST_ID.test(id)) return fallback;
    const post = await fetchJson(ROTUR_API_BASE, `/posts/${encodeURIComponent(id)}`);
    if (!post || typeof post !== 'object' || post.error || typeof post.user !== 'string' || !post.user) {
        return fallback;
    }
    const author = post.user.slice(0, 40);
    const attachments = Array.isArray(post.attachments) ? post.attachments : [post.attachment];
    const madeWith = post.made_with && typeof post.made_with === 'object' ? post.made_with : null;
    const image = attachments.map(imageUrl).find(Boolean) || (madeWith && imageUrl(madeWith.image));
    return {
        title: `Post by ${author} - MistWarp`,
        description: flatten(typeof post.content === 'string' ? post.content : '') ||
            `A post by ${author} on claw.`,
        image: image || `${AVATARS}/${encodeURIComponent(author.toLowerCase())}`,
        card: image ? 'summary_large_image' : 'summary'
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

const absoluteImage = (image, origin) => {
    try {
        return new URL(image || DEFAULT_IMAGE, origin).href;
    } catch (e) {
        return DEFAULT_IMAGE;
    }
};

const hostOf = url => url.hostname.replace(/\.$/, '');

const isFilePath = pathname => STATIC_FILE_PATH.test(pathname) || FILE_PATH.test(pathname);

const pagePath = pathname => {
    if (DOCS_PATH.test(pathname) || isFilePath(pathname)) return pathname;
    const path = pathname.replace(/(.)\/+$/, '$1').replace(/\.html$/i, '');
    return path === '/index' ? '/' : path;
};

const permanent = location => new Response(null, {
    status: 301,
    headers: {'Location': location, 'Cache-Control': 'public, max-age=3600'}
});

const legacyEmbedRedirect = url => {
    const legacyEmbed = url.pathname.match(LEGACY_EMBED_PATH);
    if (!legacyEmbed) return null;
    const id = legacyEmbed[1];
    return permanent(`${url.origin}/embed${url.search}#${/^\d+$/.test(id) ? id : `mw-${id}`}`);
};

const editorHostRoute = url => {
    const path = pagePath(url.pathname);
    if (path === '/' || path === '/editor') {
        return url.pathname === '/' ? {asset: '/editor'} : {redirect: `${EDITOR_ORIGIN}/${url.search}`};
    }
    const project = path.match(PROJECT_PAGE);
    if (APP_PAGES.has(path) || project) {
        if (path !== url.pathname) return {redirect: `${EDITOR_ORIGIN}${path}${url.search}`};
        return project ? {asset: PROJECT_PAGE_ASSETS[project[1]] || '/player'} : {asset: null};
    }
    if (isFilePath(url.pathname)) return {asset: null};
    return {redirect: `${ACCOUNT_ORIGIN}${path}${url.search}`};
};

const accountHostRoute = url => {
    const path = pagePath(url.pathname);
    if (path === '/editor') return `${EDITOR_ORIGIN}/${url.search}`;
    if (MOVED_APP_PAGES.has(path) || PROJECT_PAGE.test(path)) return `${EDITOR_ORIGIN}${path}${url.search}`;
    return path === url.pathname ? null : `${url.origin}${path}${url.search}`;
};

const otherHostRoute = url => {
    const path = pagePath(url.pathname);
    return path === url.pathname ? null : `${url.origin}${path}${url.search}`;
};

const notFoundFile = () => new Response('Not found', {
    status: 404,
    headers: {
        'Cache-Control': 'no-store',
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Content-Type-Options': 'nosniff'
    }
});

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
        if (rest === '/remixes') return vanityMeta(slug, 'Remix tree', rest);
        if (rest === '/pulls') return vanityMeta(slug, 'Pull requests', rest);
        const pullMatch = rest.match(/^\/pulls\/([^/]+)$/);
        if (pullMatch) {
            const index = decodeSegment(pullMatch[1]);
            if (index === null) return NOT_FOUND_META;
            return vanityPullMeta(slug, index);
        }
        if (/^\/commits\/[^/]+$/.test(rest)) return vanityMeta(slug, 'Commit', rest);
        return NOT_FOUND_META;
    }

    match = normalizedPath.match(/^\/project\/([^/]+)((?:\/[^/]+)*)$/);
    if (match) {
        const id = decodeSegment(match[1]);
        if (id === null) return NOT_FOUND_META;
        const rest = match[2] || '';
        if (!rest) return projectMeta(id);
        if (rest === '/remixes') return projectSubMeta(id, 'Remix tree', rest);
        if (rest === '/pulls') return projectSubMeta(id, 'Pull requests', rest);
        const pullMatch = rest.match(/^\/pulls\/([^/]+)$/);
        if (pullMatch) {
            const index = decodeSegment(pullMatch[1]);
            if (index === null) return NOT_FOUND_META;
            return pullMeta(id, index);
        }
        if (/^\/commits\/[^/]+$/.test(rest)) return projectSubMeta(id, 'Commit', rest);
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
        const id = decodeSegment(match[1]);
        return id === null ? NOT_FOUND_META : postMeta(id);
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

    if (/^\/roadmap\/(?:changes|entry\/[^/]+|[^/]+)$/.test(normalizedPath)) return STATIC_META['/roadmap'];

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

export const onRequest = async context => {
    const {request, next} = context;
    const url = new URL(request.url);

    if (url.pathname === '/sitemap.xml') {
        try {
            const upstream = await fetch(`${API_BASE}/sitemap.xml`, {
                signal: AbortSignal.timeout(FETCH_TIMEOUT_MS * 3)
            });
            if (upstream.ok) {
                return new Response(upstream.body, {
                    headers: {
                        'Content-Type': 'application/xml; charset=utf-8',
                        'Cache-Control': 'public, max-age=3600'
                    }
                });
            }
        } catch (e) {
            return new Response('Sitemap unavailable', {status: 503});
        }
        return new Response('Sitemap unavailable', {status: 503});
    }

    const legacyEmbed = legacyEmbedRedirect(url);
    if (legacyEmbed) return legacyEmbed;

    const host = hostOf(url);
    if (host === EDITOR_HOST) {
        const route = editorHostRoute(url);
        if (route.redirect) return permanent(route.redirect);
        const served = route.asset ?
            await context.env.ASSETS.fetch(new Request(new URL(route.asset, url).href, request)) :
            await next();
        const servedType = served.headers.get('content-type') || '';
        if (!route.asset && isFilePath(url.pathname) && servedType.includes('text/html')) return notFoundFile();
        return served;
    }

    const moved = ACCOUNT_HOSTS.has(host) ? accountHostRoute(url) : otherHostRoute(url);
    if (moved) return permanent(moved);

    const response = await next();
    const contentType = response.headers.get('content-type') || '';
    if (STATIC_FILE_PATH.test(url.pathname) && contentType.includes('text/html')) return notFoundFile();

    if (!contentType.includes('text/html')) return response;
    if (SKIP_PATHS.has(url.pathname) || DOCS_PATH.test(url.pathname)) return response;

    let meta;
    try {
        meta = await metaForPath(url.pathname);
    } catch (e) {
        // Unexpected API data must not take the page down; serve it with its default tags.
        return response;
    }
    if (!meta) return response;

    const canonicalUrl = `${url.origin}${meta.canonicalPath || url.pathname}`;
    const completeMeta = {
        ...meta,
        ogTitle: meta.ogTitle || meta.title,
        image: absoluteImage(meta.image, url.origin),
        card: meta.card || 'summary',
        oembedUrl: meta.oembed ? `${url.origin}/oembed?url=${encodeURIComponent(canonicalUrl)}&format=json` : null
    };

    return new HTMLRewriter()
        .on('title', new TextReplacer(completeMeta.title))
        .on('meta[name="description"]', new AttrSetter('content', completeMeta.description))
        .on('meta[property="og:title"]', new AttrSetter('content', completeMeta.ogTitle))
        .on('meta[property="og:description"]', new AttrSetter('content', completeMeta.description))
        .on('meta[property="og:url"]', new AttrSetter('content', canonicalUrl))
        .on('meta[property="og:image"]', new AttrSetter('content', completeMeta.image))
        .on('meta[name="twitter:card"]', new AttrSetter('content', completeMeta.card))
        .on('head', new HeadAppender(completeMeta, canonicalUrl))
        .transform(meta === NOT_FOUND_META ?
            new Response(response.body, {status: 404, statusText: 'Not Found', headers: response.headers}) :
            response);
};
