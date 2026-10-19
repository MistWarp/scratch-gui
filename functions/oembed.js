import {
    CARD_HEIGHT, CARD_WIDTH, EMBED_HEIGHT, EMBED_WIDTH, apiJson, cardUrl, embedSrc, escapeAttribute, projectDetails
} from './_share/project.js';

const SITE_HOSTS = new Set(['mistwarp.org', 'www.mistwarp.org']);
const PROJECT_PATH = /^\/project\/([^/]+)\/?$/;
const VANITY_PATH = /^\/p\/([^/]+)\/?$/;
const EMBED_PATH = /^\/embed(?:\.html)?\/?$/;

const json = (body, status = 200) => new Response(JSON.stringify(body), {
    status,
    headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': status === 200 ? 'public, max-age=3600' : 'public, max-age=300'
    }
});

const decode = segment => {
    try {
        return decodeURIComponent(segment);
    } catch (e) {
        return null;
    }
};

const projectIdFor = async (target, siteHost) => {
    const host = target.hostname.replace(/\.$/, '');
    if (!SITE_HOSTS.has(host) && host !== siteHost) return null;
    let match = target.pathname.match(PROJECT_PATH);
    if (match) return decode(match[1]);
    if (EMBED_PATH.test(target.pathname)) return target.searchParams.get('mw');
    match = target.pathname.match(VANITY_PATH);
    if (!match) return null;
    const slug = decode(match[1]);
    if (!slug) return null;
    const data = await apiJson(`/vanity/${encodeURIComponent(slug)}`);
    return data && data.id ? String(data.id) : null;
};

const limit = value => {
    const number = Number.parseInt(value, 10);
    return Number.isFinite(number) && number > 0 ? number : Infinity;
};

export const onRequest = async context => {
    const url = new URL(context.request.url);
    const format = url.searchParams.get('format');
    if (format && format !== 'json') return json({error: 'only json is supported'}, 501);

    let target;
    try {
        target = new URL(url.searchParams.get('url') || '');
    } catch (e) {
        return json({error: 'url is required'}, 400);
    }

    const id = await projectIdFor(target, url.hostname);
    const details = id ? await projectDetails(id) : null;
    if (!details || !details.public) return json({error: 'project not found'}, 404);

    const scale = Math.min(1, limit(url.searchParams.get('maxwidth')) / EMBED_WIDTH,
        limit(url.searchParams.get('maxheight')) / EMBED_HEIGHT);
    const width = Math.max(1, Math.floor(EMBED_WIDTH * scale));
    const height = Math.max(1, Math.floor(EMBED_HEIGHT * scale));
    const title = `${details.name} by @${details.owner}`;

    return json({
        version: '1.0',
        type: 'rich',
        provider_name: 'MistWarp',
        provider_url: `${url.origin}/`,
        title,
        author_name: details.owner,
        author_url: `${url.origin}/users/${encodeURIComponent(details.owner)}`,
        html: `<iframe src="${escapeAttribute(embedSrc(url.origin, details.id, 'oembed'))}" ` +
            `width="${width}" height="${height}" title="${escapeAttribute(title)}" frameborder="0" ` +
            'scrolling="no" allowfullscreen></iframe>',
        width,
        height,
        thumbnail_url: cardUrl(details),
        thumbnail_width: CARD_WIDTH,
        thumbnail_height: CARD_HEIGHT,
        cache_age: 3600
    });
};
