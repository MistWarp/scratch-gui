// Turns a news post's markdown into a short, plain excerpt whose links stay
// links, and finds a picture for it.

const LINK = /!?\[([^\]]*)\]\(([^)\s]+)[^)]*\)|(https?:\/\/[^\s<>()]+[^\s<>().,!?:;'"])/g;
const SITE = /^https?:\/\/(?:www\.)?mistwarp\.org(?=\/|$)/i;

/**
 * Where a link in a post goes, so the excerpt can name it.
 * @param {string} url absolute or root-relative URL
 * @returns {object} {kind, ...}
 */
export const routeFor = url => {
    const value = String(url || '');
    const path = SITE.test(value) ? value.replace(SITE, '') || '/' : value;
    if (!path.startsWith('/')) return {kind: 'external', href: value};
    const [pathname] = path.split(/[?#]/);
    let match = pathname.match(/^\/project\/([\w-]+)/);
    if (match) return {kind: 'project', id: match[1], to: path};
    match = pathname.match(/^\/p\/([\w-]+)/);
    if (match) return {kind: 'project', slug: match[1], to: path};
    match = pathname.match(/^\/spaces\/([\w-]+)/);
    if (match) return {kind: 'space', id: match[1], to: path};
    match = pathname.match(/^\/users\/([\w.-]+)/);
    if (match) return {kind: 'user', name: match[1], to: path};
    return {kind: 'page', to: path};
};

const plain = text => text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/^#{1,6}[ \t]+/gm, '')
    .replace(/^[ \t]*>[ \t]?/gm, '')
    // List items read as short sentences once the lines are joined.
    .replace(/^[ \t]*(?:[-*+]|\d+\.)[ \t]+(.*?)([.!?:;]?)[ \t]*$/gm, (line, item, end) => `${item}${end || '.'}`)
    .replace(/[*_~`]+/g, '')
    .replace(/[=]{3,}|-{3,}/g, ' ');

/**
 * @param {string} body markdown
 * @returns {Array.<object>} text parts ({text}) and link parts ({label, route})
 */
export const excerptParts = body => {
    const source = String(body || '');
    const parts = [];
    let last = 0;
    const pushText = text => {
        // A paragraph break reads as the end of a sentence.
        const cleaned = plain(text).replace(/([^.!?:\s])[ \t]*\n\s*\n/g, '$1. ')
            .replace(/\s+/g, ' ');
        if (cleaned.trim()) parts.push({text: cleaned});
    };
    for (const match of source.matchAll(LINK)) {
        pushText(source.slice(last, match.index));
        last = match.index + match[0].length;
        if (match[0].startsWith('!')) continue;
        const url = match[2] || match[3];
        parts.push({label: match[1] ? plain(match[1]).trim() : '', route: routeFor(url)});
    }
    pushText(source.slice(last));
    if (parts.length && parts[0].text) parts[0] = {text: parts[0].text.replace(/^\s+/, '')};
    return parts;
};

/**
 * The first image in a post, if it has one.
 * @param {object} item news item
 * @returns {?string} image URL
 */
export const imageFor = item => {
    const body = String((item && item.body) || '');
    const markdown = body.match(/!\[[^\]]*\]\((https?:\/\/[^)\s]+)/);
    if (markdown) return markdown[1];
    const html = body.match(/<img[^>]+src=["'](https?:\/\/[^"']+)/i);
    return html ? html[1] : null;
};

/**
 * Projects and spaces a post links to, its attached link first.
 * @param {object} item news item
 * @returns {Array.<object>} routes of kind project or space
 */
export const linkedPlaces = item => {
    const routes = [];
    const attached = item && item.link && typeof item.link.url === 'string' ? item.link.url : '';
    if (attached) routes.push(routeFor(attached));
    for (const part of excerptParts(item && item.body)) {
        if (part.route) routes.push(part.route);
    }
    return routes.filter(route => route.kind === 'project' || route.kind === 'space');
};
