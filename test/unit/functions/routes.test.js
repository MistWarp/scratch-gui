/**
 * @jest-environment node
 */

import {onRequest} from '../../../functions/_middleware.js';

const E = 'https://editor.mistwarp.org';
const M = 'https://mistwarp.org';

const PAGES = {
    '/index.html': 'community',
    '/editor.html': 'editor',
    '/player.html': 'player',
    '/fullscreen.html': 'fullscreen',
    '/embed.html': 'embed',
    '/addons.html': 'addons',
    '/credits.html': 'credits',
    '/account-frame.html': 'account-frame',
    '/privacy.html': 'privacy',
    '/docs/index.html': 'docs'
};
const FILES = new Set(['/sw.js', '/manifest.webmanifest', '/version.json', '/assets/editor-abc.js']);

const page = name => new Response(name, {headers: {'content-type': 'text/html; charset=utf-8'}});

const pagesAssets = request => {
    const url = new URL(request.url);
    const {pathname, search} = url;
    const moved = location => new Response(null, {status: 308, headers: {location: new URL(location, url).href}});
    if (PAGES[pathname]) return moved(`${pathname.replace(/(?:index)?\.html$/, '')}${search}`);
    if (FILES.has(pathname)) return new Response('file', {headers: {'content-type': 'text/javascript'}});
    if (pathname === '/') return page(PAGES['/index.html']);
    if (PAGES[`${pathname}index.html`]) return page(PAGES[`${pathname}index.html`]);
    if (pathname.endsWith('/') && PAGES[`${pathname.slice(0, -1)}.html`]) return moved(pathname.slice(0, -1) + search);
    if (PAGES[`${pathname}.html`]) return page(PAGES[`${pathname}.html`]);
    if (PAGES[`${pathname}/index.html`]) return moved(`${pathname}/${search}`);
    return page(PAGES['/index.html']);
};

beforeAll(() => {
    global.HTMLRewriter = class {
        on () {
            return this;
        }
        transform (response) {
            return response;
        }
    };
    global.fetch = jest.fn(() => Promise.resolve(new Response('{}', {status: 404})));
});

afterAll(() => {
    delete global.HTMLRewriter;
});

const visit = async start => {
    let fragment = start.includes('#') ? start.slice(start.indexOf('#')) : '';
    let url = start.split('#')[0];
    const hops = [];
    for (let i = 0; i < 5; i++) {
        const request = new Request(url, {headers: {accept: 'text/html'}});
        const response = await onRequest({
            request,
            next: () => Promise.resolve(pagesAssets(request)),
            env: {ASSETS: {fetch: input => Promise.resolve(pagesAssets(input))}}
        });
        const location = response.headers.get('location');
        if (response.status >= 300 && response.status < 400 && location) {
            const next = new URL(location, url);
            if (next.hash) fragment = next.hash;
            next.hash = '';
            hops.push(response.status);
            url = next.href;
            continue;
        }
        return {hops, final: `${url}${fragment}`, status: response.status, body: await response.text()};
    }
    throw new Error(`${start} redirects too many times`);
};

test.each([
    [`${E}/`, 'editor', `${E}/`, 0],
    [`${E}/?starter=clicker`, 'editor', `${E}/?starter=clicker`, 0],
    [`${E}/#mw-pAbc`, 'editor', `${E}/#mw-pAbc`, 0],
    [`${E}/index.html`, 'editor', `${E}/`, 1],
    [`${E}/editor`, 'editor', `${E}/`, 1],
    [`${E}/editor?clone=pAbc&chat=1`, 'editor', `${E}/?clone=pAbc&chat=1`, 1],
    [`${E}/editor#mw-pAbc`, 'editor', `${E}/#mw-pAbc`, 1],
    [`${E}/editor/`, 'editor', `${E}/`, 1],
    [`${E}/editor.html?fps=60`, 'editor', `${E}/?fps=60`, 1],
    [`${E}/fullscreen`, 'fullscreen', `${E}/fullscreen`, 0],
    [`${E}/fullscreen/`, 'fullscreen', `${E}/fullscreen`, 1],
    [`${E}/fullscreen.html#123`, 'fullscreen', `${E}/fullscreen#123`, 1],
    [`${E}/player`, 'player', `${E}/player`, 0],
    [`${E}/player.html`, 'player', `${E}/player`, 1],
    [`${E}/embed?autoplay#123`, 'embed', `${E}/embed?autoplay#123`, 0],
    [`${E}/embed.html`, 'embed', `${E}/embed`, 1],
    [`${E}/addons`, 'addons', `${E}/addons`, 0],
    [`${E}/addons/`, 'addons', `${E}/addons`, 1],
    [`${E}/credits.html`, 'credits', `${E}/credits`, 1],
    [`${E}/editor/fullscreen`, 'fullscreen', `${E}/fullscreen`, 1],
    [`${E}/editor/fullscreen/#123`, 'fullscreen', `${E}/fullscreen#123`, 1],
    [`${E}/editor/player?turbo`, 'player', `${E}/player?turbo`, 1],
    [`${E}/editor/embed`, 'embed', `${E}/embed`, 1],
    [`${E}/123`, 'player', `${E}/123`, 0],
    [`${E}/123?turbo&fps=60`, 'player', `${E}/123?turbo&fps=60`, 0],
    [`${E}/123/`, 'player', `${E}/123`, 1],
    [`${E}/123/editor`, 'editor', `${E}/123/editor`, 0],
    [`${E}/123/fullscreen`, 'fullscreen', `${E}/123/fullscreen`, 0],
    [`${E}/123/embed?autoplay`, 'embed', `${E}/embed?autoplay#123`, 1],
    [`${E}/pAbc/embed`, 'embed', `${E}/embed#mw-pAbc`, 1],
    [`${E}/privacy`, 'privacy', `${M}/privacy`, 1],
    [`${E}/account-frame.html`, 'account-frame', `${M}/account-frame`, 1],
    [`${E}/explore/`, 'community', `${M}/explore`, 1],
    [`${E}/project/pAbc`, 'community', `${M}/project/pAbc`, 1],
    [`${E}/docs/`, 'docs', `${M}/docs/`, 1],
    [`${M}/editor`, 'editor', `${E}/`, 1],
    [`${M}/editor?starter=clicker`, 'editor', `${E}/?starter=clicker`, 1],
    [`${M}/editor?restore=4#mw-pAbc`, 'editor', `${E}/?restore=4#mw-pAbc`, 1],
    [`${M}/editor/`, 'editor', `${E}/`, 1],
    [`${M}/editor.html?chat=1`, 'editor', `${E}/?chat=1`, 1],
    [`${M}/fullscreen#123`, 'fullscreen', `${E}/fullscreen#123`, 1],
    [`${M}/player.html`, 'player', `${E}/player`, 1],
    [`${M}/editor/fullscreen#123`, 'fullscreen', `${E}/fullscreen#123`, 1],
    [`${M}/editor/addons`, 'addons', `${E}/addons`, 1],
    [`${M}/editor/embed`, 'embed', `${M}/embed`, 1],
    [`${M}/addons`, 'addons', `${E}/addons`, 1],
    [`${M}/credits`, 'credits', `${E}/credits`, 1],
    [`${M}/123?turbo`, 'player', `${E}/123?turbo`, 1],
    [`${M}/123/editor`, 'editor', `${E}/123/editor`, 1],
    [`${M}/123/fullscreen/`, 'fullscreen', `${E}/123/fullscreen`, 1],
    [`${M}/123/embed?autoplay`, 'embed', `${M}/embed?autoplay#123`, 1],
    [`${M}/embed?autoplay#123`, 'embed', `${M}/embed?autoplay#123`, 0],
    [`${M}/embed.html`, 'embed', `${M}/embed`, 1],
    [`${M}/`, 'community', `${M}/`, 0],
    [`${M}/index.html`, 'community', `${M}/`, 1],
    [`${M}/explore/`, 'community', `${M}/explore`, 1],
    [`${M}/privacy.html`, 'privacy', `${M}/privacy`, 1],
    [`${M}/account-frame`, 'account-frame', `${M}/account-frame`, 0],
    [`${M}/docs`, 'docs', `${M}/docs/`, 1],
    [`${M}/docs/`, 'docs', `${M}/docs/`, 0]
])('%s shows the %s page at %s after %i redirects', async (start, view, final, count) => {
    const result = await visit(start);
    expect(result.status).toBe(200);
    expect(result.body).toBe(view);
    expect(result.final).toBe(final);
    expect(result.hops).toHaveLength(count);
    if (count) expect(result.hops[0]).toBe(start.startsWith(`${M}/docs`) ? 308 : 301);
});

test.each([
    `${M}/nope`,
    `${M}/editor/foo`,
    `${E}/editor/foo`,
    `${E}/editor/privacy`,
    `${M}/123/player`,
    `${E}/nope`
])('the unknown page %s ends on a 404', async start => {
    const result = await visit(start);
    expect(result.status).toBe(404);
    expect(result.hops.length).toBeLessThanOrEqual(1);
});

test.each([
    `${E}/sw.js`,
    `${E}/manifest.webmanifest`,
    `${E}/version.json`,
    `${E}/assets/editor-abc.js`
])('the file %s is served directly', async start => {
    const result = await visit(start);
    expect(result.status).toBe(200);
    expect(result.hops).toHaveLength(0);
});
