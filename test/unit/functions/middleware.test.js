/**
 * @jest-environment node
 */

// functions/_middleware.js runs on Cloudflare Pages, where HTMLRewriter is a global. Node has
// no HTMLRewriter, so FakeHTMLRewriter records what the middleware registers and replays it
// against fake elements, the way the real one would for the community index.html.

import {onRequest} from '../../../functions/_middleware.js';

const API = 'https://api.mistwarp.org/v1';
const WARPTHEME = 'https://warptheme.mistium.com/api';
const DEFAULT_IMAGE = 'https://mistwarp.org/images/apple-touch-icon.png';

// The meta tags that src/playground/simple.ejs (the community index.html) ships with.
const PAGE_SELECTORS = [
    'title',
    'meta[name="description"]',
    'meta[property="og:title"]',
    'meta[property="og:description"]',
    'meta[property="og:url"]',
    'meta[property="og:image"]',
    'meta[name="twitter:card"]',
    'head'
];

class FakeElement {
    constructor (selector) {
        this.selector = selector;
        this.attributes = {};
        this.appended = [];
    }
    setAttribute (name, value) {
        this.attributes[name] = value;
        return this;
    }
    getAttribute (name) {
        return Object.prototype.hasOwnProperty.call(this.attributes, name) ? this.attributes[name] : null;
    }
    append (content, options) {
        this.appended.push({content, options});
        return this;
    }
}

class FakeTextChunk {
    constructor (text) {
        this.text = text;
        this.replacement = null;
    }
    replace (content) {
        this.replacement = content;
        return this;
    }
}

class FakeHTMLRewriter {
    constructor () {
        this.registrations = [];
    }
    on (selector, handlers) {
        this.registrations.push({selector, handlers});
        return this;
    }
    transform (response) {
        const transformed = new Response(response.body, response);
        transformed.rewriter = this;
        return transformed;
    }
    // Runs the registered handlers over one fake element per selector. The title's text is
    // delivered in several chunks, as HTMLRewriter may split it.
    render (titleChunks = ['Mist', 'Warp']) {
        const elements = {};
        const titleText = titleChunks.map(text => new FakeTextChunk(text));
        for (const selector of PAGE_SELECTORS) elements[selector] = new FakeElement(selector);
        for (const {selector, handlers} of this.registrations) {
            if (!elements[selector]) throw new Error(`Unexpected selector ${selector}`);
            if (handlers.element) handlers.element(elements[selector]);
            if (handlers.text && selector === 'title') titleText.forEach(chunk => handlers.text(chunk));
        }
        const content = selector => elements[selector].getAttribute('content');
        return {
            elements,
            title: titleText.map(chunk => (chunk.replacement === null ? chunk.text : chunk.replacement)).join(''),
            description: content('meta[name="description"]'),
            ogTitle: content('meta[property="og:title"]'),
            ogDescription: content('meta[property="og:description"]'),
            ogUrl: content('meta[property="og:url"]'),
            ogImage: content('meta[property="og:image"]'),
            twitterCard: content('meta[name="twitter:card"]'),
            head: elements.head.appended
        };
    }
}

const jsonResponse = (body, status = 200) => new Response(JSON.stringify(body), {
    status,
    headers: {'content-type': 'application/json'}
});

// Routes stubbed fetches by full URL. Anything unlisted is a 404.
const stubApi = routes => {
    global.fetch = jest.fn(url => {
        if (!Object.prototype.hasOwnProperty.call(routes, url)) return Promise.resolve(jsonResponse({}, 404));
        const route = routes[url];
        if (route instanceof Error) return Promise.reject(route);
        if (typeof route === 'function') return Promise.resolve(route());
        return Promise.resolve(jsonResponse(route));
    });
    return global.fetch;
};

const HTML = '<!DOCTYPE html><html><head><title>MistWarp</title></head><body></body></html>';

const htmlResponse = (body = HTML, headers = {}) => new Response(body, {
    headers: {'content-type': 'text/html; charset=utf-8', ...headers}
});

const run = async (path, {response = htmlResponse(), method = 'GET'} = {}) => {
    const next = jest.fn(() => Promise.resolve(response));
    const result = await onRequest({
        request: new Request(`https://mistwarp.org${path}`, {method}),
        next
    });
    return {result, next};
};

const renderPath = async (path, options) => {
    const {result} = await run(path, options);
    expect(result.rewriter).toBeInstanceOf(FakeHTMLRewriter);
    return result.rewriter.render();
};

const fetchedUrls = () => global.fetch.mock.calls.map(call => call[0]);

const sharedProject = (overrides = {}) => ({
    project: {
        title: 'Cool Game',
        owner: 'alice',
        shared: true,
        instructions: 'Use   the\n arrow keys.',
        thumbUrl: 'https://thumbs.example/1.png',
        ...overrides
    }
});

const realFetch = global.fetch;

beforeAll(() => {
    global.HTMLRewriter = FakeHTMLRewriter;
});

afterAll(() => {
    delete global.HTMLRewriter;
    global.fetch = realFetch;
});

beforeEach(() => {
    stubApi({});
});

describe('requests the middleware passes through', () => {
    test('non-HTML responses are returned untouched', async () => {
        const response = new Response('{}', {headers: {'content-type': 'application/json'}});
        const {result, next} = await run('/project/1', {response});
        expect(next).toHaveBeenCalledTimes(1);
        expect(result).toBe(response);
        expect(global.fetch).not.toHaveBeenCalled();
    });

    test('responses without a content type are returned untouched', async () => {
        const response = new Response('raw');
        response.headers.delete('content-type');
        const {result} = await run('/', {response});
        expect(result).toBe(response);
    });

    test.each([
        '/editor',
        '/editor.html',
        '/player',
        '/player.html',
        '/fullscreen',
        '/fullscreen.html',
        '/embed.html',
        '/privacy.html'
    ])('standalone page %s keeps its own tags', async path => {
        const response = htmlResponse();
        const {result} = await run(path, {response});
        expect(result).toBe(response);
        expect(global.fetch).not.toHaveBeenCalled();
    });

    test.each(['/docs', '/docs/', '/docs/blocks/looks'])('docs page %s is not rewritten', async path => {
        const response = htmlResponse();
        const {result} = await run(path, {response});
        expect(result).toBe(response);
    });

    test('paths that only start with "docs" are still rewritten', async () => {
        const meta = await renderPath('/docsearch');
        expect(meta.title).toBe('Page not found - MistWarp');
    });
});

describe('static file paths', () => {
    test.each([
        '/assets/missing.js',
        '/js/missing.js',
        '/static/assets/missing.png'
    ])('an SPA fallback for %s becomes a plain 404', async path => {
        const {result} = await run(path);
        expect(result.status).toBe(404);
        expect(result.headers.get('cache-control')).toBe('no-store');
        expect(result.headers.get('content-type')).toBe('text/plain; charset=utf-8');
        expect(result.headers.get('x-content-type-options')).toBe('nosniff');
        await expect(result.text()).resolves.toBe('Not found');
    });

    test('real static files are served as they are', async () => {
        const response = new Response('console.log(1)', {headers: {'content-type': 'text/javascript'}});
        const {result} = await run('/assets/index.js', {response});
        expect(result).toBe(response);
    });

    test('paths that merely contain "assets" are not treated as static files', async () => {
        const {result} = await run('/users/assets');
        expect(result.status).toBe(200);
        expect(result.rewriter).toBeInstanceOf(FakeHTMLRewriter);
    });
});

describe('sitemap.xml', () => {
    test('proxies the API sitemap with XML and cache headers', async () => {
        const fetch = stubApi({
            [`${API}/sitemap.xml`]: () => new Response('<urlset></urlset>', {status: 200})
        });
        const {result, next} = await run('/sitemap.xml');
        expect(next).not.toHaveBeenCalled();
        expect(fetch).toHaveBeenCalledWith(`${API}/sitemap.xml`, expect.objectContaining({
            signal: expect.any(AbortSignal)
        }));
        expect(result.status).toBe(200);
        expect(result.headers.get('content-type')).toBe('application/xml; charset=utf-8');
        expect(result.headers.get('cache-control')).toBe('public, max-age=3600');
        await expect(result.text()).resolves.toBe('<urlset></urlset>');
    });

    test('answers 503 when the API returns an error', async () => {
        stubApi({[`${API}/sitemap.xml`]: () => new Response('boom', {status: 500})});
        const {result} = await run('/sitemap.xml');
        expect(result.status).toBe(503);
        await expect(result.text()).resolves.toBe('Sitemap unavailable');
    });

    test('answers 503 when the API cannot be reached', async () => {
        stubApi({[`${API}/sitemap.xml`]: new TypeError('fetch failed')});
        const {result} = await run('/sitemap.xml');
        expect(result.status).toBe(503);
    });
});

describe('rewritten pages', () => {
    test('static routes get their title, description and default image', async () => {
        const meta = await renderPath('/explore');
        expect(meta.title).toBe('Explore - MistWarp');
        expect(meta.ogTitle).toBe('Explore - MistWarp');
        expect(meta.description).toBe('Explore community projects, games, and creations shared on MistWarp.');
        expect(meta.ogDescription).toBe(meta.description);
        expect(meta.ogImage).toBe(DEFAULT_IMAGE);
        expect(meta.ogUrl).toBe('https://mistwarp.org/explore');
        expect(meta.twitterCard).toBe('summary');
        expect(global.fetch).not.toHaveBeenCalled();
    });

    test('the home page', async () => {
        const meta = await renderPath('/');
        expect(meta.title).toBe('MistWarp');
        expect(meta.ogUrl).toBe('https://mistwarp.org/');
    });

    test('trailing slashes match the static route but the canonical URL keeps the path', async () => {
        const meta = await renderPath('/explore//');
        expect(meta.title).toBe('Explore - MistWarp');
        expect(meta.ogUrl).toBe('https://mistwarp.org/explore//');
    });

    test('the canonical URL drops the query string and hash', async () => {
        const meta = await renderPath('/themes?sort=new#top');
        expect(meta.ogUrl).toBe('https://mistwarp.org/themes');
        expect(meta.head[0].content).toContain('<link rel="canonical" href="https://mistwarp.org/themes">');
    });

    test('the title replaces every text chunk', async () => {
        const {result} = await run('/news');
        const meta = result.rewriter.render(['Mi', 'st', 'Warp']);
        expect(meta.title).toBe('News - MistWarp');
    });

    test('head gets twitter tags and a canonical link as HTML', async () => {
        const meta = await renderPath('/stats');
        expect(meta.head).toHaveLength(1);
        expect(meta.head[0].options).toEqual({html: true});
        expect(meta.head[0].content).toBe(
            '<meta name="twitter:title" content="MistWarp stats - MistWarp">' +
            '<meta name="twitter:description" content="Public statistics about the MistWarp community.">' +
            `<meta name="twitter:image" content="${DEFAULT_IMAGE}">` +
            '<link rel="canonical" href="https://mistwarp.org/stats">'
        );
    });

    test.each([
        '/mystuff',
        '/settings',
        '/wallet',
        '/purchases',
        '/notifications',
        '/admin',
        '/news/manage',
        '/spaces/abc/manage',
        '/mystuff/project/42'
    ])('%s is marked noindex', async path => {
        const meta = await renderPath(path);
        expect(meta.head[0].content).toContain('<meta name="robots" content="noindex">');
    });

    test('public pages are not marked noindex', async () => {
        const meta = await renderPath('/explore');
        expect(meta.head[0].content).not.toContain('robots');
    });

    test('the rewritten response keeps the status and headers of the page', async () => {
        const response = htmlResponse(HTML, {'cache-control': 'public, max-age=60', 'x-frame-options': 'DENY'});
        const {result} = await run('/explore', {response});
        expect(result.status).toBe(200);
        expect(result.headers.get('cache-control')).toBe('public, max-age=60');
        expect(result.headers.get('x-frame-options')).toBe('DENY');
        await expect(result.text()).resolves.toBe(HTML);
    });

    test.each([
        '/nope',
        '/p/slug/unknown',
        '/project/1/unknown',
        '/project/1/pulls/2/extra',
        '/users/alice/unknown',
        '/spaces/abc/unknown',
        '/mystuff/project'
    ])('unknown path %s gets not-found tags', async path => {
        const meta = await renderPath(path);
        expect(meta.title).toBe('Page not found - MistWarp');
        expect(meta.description).toBe('This page does not exist on MistWarp.');
        expect(global.fetch).not.toHaveBeenCalled();
    });

    test.each([
        '/p/%E0%A4%A',
        '/project/%E0%A4%A',
        '/project/1/pulls/%E0%A4%A',
        '/users/%E0%A4%A',
        '/groups/%E0%A4%A',
        '/news/%E0%A4%A',
        '/themes/%E0%A4%A',
        '/spaces/%E0%A4%A'
    ])('malformed percent-encoding in %s gets not-found tags without an API call', async path => {
        const meta = await renderPath(path);
        expect(meta.title).toBe('Page not found - MistWarp');
        expect(global.fetch).not.toHaveBeenCalled();
    });

    test('values with HTML characters are escaped in the appended head tags', async () => {
        stubApi({
            [`${API}/projects/1`]: sharedProject({
                title: '<script>"x"&</script>',
                instructions: 'a < b > c'
            })
        });
        const meta = await renderPath('/project/1');
        const head = meta.head[0].content;
        expect(head).toContain(
            'content="&lt;script&gt;&quot;x&quot;&amp;&lt;/script&gt; by alice - MistWarp"'
        );
        expect(head).toContain('content="a &lt; b &gt; c"');
        expect(head).not.toContain('<script>');
        // setAttribute and text replacement escape on their own, so those get the raw value.
        expect(meta.ogTitle).toBe('<script>"x"&</script> by alice - MistWarp');
        expect(meta.title).toBe('<script>"x"&</script> by alice - MistWarp');
    });
});

describe('project pages', () => {
    test('a shared project fetches the API with a JSON accept header and a timeout', async () => {
        stubApi({[`${API}/projects/123`]: sharedProject()});
        const meta = await renderPath('/project/123');
        expect(global.fetch).toHaveBeenCalledWith(`${API}/projects/123`, {
            signal: expect.any(AbortSignal),
            headers: {accept: 'application/json'}
        });
        expect(meta.title).toBe('Cool Game by alice - MistWarp');
        expect(meta.description).toBe('Use the arrow keys.');
        expect(meta.ogImage).toBe('https://thumbs.example/1.png');
        expect(meta.twitterCard).toBe('summary_large_image');
    });

    test('falls back to the description, then to a generated one', async () => {
        stubApi({[`${API}/projects/1`]: sharedProject({instructions: '', description: 'About it'})});
        expect((await renderPath('/project/1')).description).toBe('About it');

        stubApi({[`${API}/projects/1`]: sharedProject({instructions: '  ', description: null})});
        expect((await renderPath('/project/1')).description).toBe('Play Cool Game on MistWarp.');
    });

    test('a project without a title or owner still reads well', async () => {
        stubApi({[`${API}/projects/1`]: sharedProject({title: '', owner: '', instructions: ''})});
        const meta = await renderPath('/project/1');
        expect(meta.title).toBe('Untitled project by unknown - MistWarp');
        expect(meta.description).toBe('Play Untitled project on MistWarp.');
    });

    test('long descriptions are cut to 200 characters', async () => {
        stubApi({[`${API}/projects/1`]: sharedProject({instructions: 'x'.repeat(500)})});
        expect((await renderPath('/project/1')).description).toHaveLength(200);
    });

    test('a project without a thumbnail uses the default image and a small card', async () => {
        stubApi({[`${API}/projects/1`]: sharedProject({thumbUrl: null})});
        const meta = await renderPath('/project/1');
        expect(meta.ogImage).toBe(DEFAULT_IMAGE);
        expect(meta.twitterCard).toBe('summary');
    });

    test.each([
        ['unshared', sharedProject({shared: false})],
        ['missing', {}],
        ['null', null]
    ])('an %s project gets generic tags that leak nothing', async (label, body) => {
        stubApi({[`${API}/projects/1`]: body});
        const meta = await renderPath('/project/1');
        expect(meta.title).toBe('Project - MistWarp');
        expect(meta.description).toBe('View this project on MistWarp.');
        expect(meta.ogImage).toBe(DEFAULT_IMAGE);
    });

    test('the page is still served when the API is down', async () => {
        stubApi({[`${API}/projects/1`]: new TypeError('fetch failed')});
        const meta = await renderPath('/project/1');
        expect(meta.title).toBe('Project - MistWarp');
    });

    test('the page is still served when the API returns an error or bad JSON', async () => {
        stubApi({[`${API}/projects/1`]: () => new Response('oops', {status: 500})});
        expect((await renderPath('/project/1')).title).toBe('Project - MistWarp');

        stubApi({[`${API}/projects/1`]: () => new Response('not json', {status: 200})});
        expect((await renderPath('/project/1')).title).toBe('Project - MistWarp');
    });

    test('ids are decoded from the path and re-encoded for the API', async () => {
        stubApi({[`${API}/projects/a%2Fb%20c`]: sharedProject()});
        const meta = await renderPath('/project/a%2Fb%20c');
        expect(fetchedUrls()).toEqual([`${API}/projects/a%2Fb%20c`]);
        expect(meta.title).toBe('Cool Game by alice - MistWarp');
    });

    test.each([
        ['/remixes', 'Remix tree'],
        ['/pulls', 'Pull requests'],
        ['/commits/abc123', 'Commit']
    ])('sub-page %s', async (rest, suffix) => {
        stubApi({[`${API}/projects/1`]: sharedProject()});
        const meta = await renderPath(`/project/1${rest}`);
        expect(meta.title).toBe(`Cool Game · ${suffix} - MistWarp`);
        expect(meta.description).toBe('Use the arrow keys.');
        expect(meta.twitterCard).toBe('summary_large_image');
    });

    test('sub-page of a hidden project', async () => {
        const meta = await renderPath('/project/1/remixes');
        expect(meta.title).toBe('Remix tree - MistWarp');
        expect(meta.description).toBe('View this project on MistWarp.');
    });

    test('pull request page fetches the project and the pull', async () => {
        stubApi({
            [`${API}/projects/1`]: sharedProject(),
            [`${API}/projects/1/pulls/7`]: {pull: {title: 'Fix jump', body: 'Makes\n\njumping work'}}
        });
        const meta = await renderPath('/project/1/pulls/7');
        expect(fetchedUrls().sort()).toEqual([`${API}/projects/1`, `${API}/projects/1/pulls/7`]);
        expect(meta.title).toBe('Fix jump · Cool Game - MistWarp');
        expect(meta.description).toBe('Makes jumping work');
        expect(meta.ogImage).toBe('https://thumbs.example/1.png');
        expect(meta.twitterCard).toBe('summary_large_image');
    });

    test('pull request without a title or body', async () => {
        stubApi({
            [`${API}/projects/1`]: sharedProject(),
            [`${API}/projects/1/pulls/7`]: {pull: {}}
        });
        const meta = await renderPath('/project/1/pulls/7');
        expect(meta.title).toBe('Pull request #7 · Cool Game - MistWarp');
        expect(meta.description).toBe('Use the arrow keys.');
    });

    test('pull request on a hidden project', async () => {
        stubApi({[`${API}/projects/1/pulls/7`]: {pull: {title: 'Fix jump'}}});
        const meta = await renderPath('/project/1/pulls/7');
        expect(meta.title).toBe('Fix jump · Project - MistWarp');
        expect(meta.description).toBe('Pull request #7 on Project.');
        expect(meta.ogImage).toBe(DEFAULT_IMAGE);
        expect(meta.twitterCard).toBe('summary');
    });

    test('missing pull request falls back to the pull requests page', async () => {
        stubApi({[`${API}/projects/1`]: sharedProject()});
        const meta = await renderPath('/project/1/pulls/7');
        expect(meta.title).toBe('Cool Game · Pull requests - MistWarp');
    });
});

describe('vanity project pages', () => {
    test('/p/:slug resolves the slug, then the project', async () => {
        stubApi({
            [`${API}/vanity/cool-game`]: {id: '55'},
            [`${API}/projects/55`]: sharedProject()
        });
        const meta = await renderPath('/p/cool-game');
        expect(fetchedUrls()).toEqual([`${API}/vanity/cool-game`, `${API}/projects/55`]);
        expect(meta.title).toBe('Cool Game by alice - MistWarp');
        expect(meta.ogUrl).toBe('https://mistwarp.org/p/cool-game');
    });

    test('unknown slug gets generic project tags without a project fetch', async () => {
        const meta = await renderPath('/p/missing');
        expect(fetchedUrls()).toEqual([`${API}/vanity/missing`]);
        expect(meta.title).toBe('Project - MistWarp');
    });

    test.each([
        ['/remixes', 'Remix tree'],
        ['/pulls', 'Pull requests'],
        ['/commits/abc', 'Commit']
    ])('sub-page %s', async (rest, suffix) => {
        stubApi({
            [`${API}/vanity/cool-game`]: {id: '55'},
            [`${API}/projects/55`]: sharedProject()
        });
        const meta = await renderPath(`/p/cool-game${rest}`);
        expect(meta.title).toBe(`Cool Game · ${suffix} - MistWarp`);
    });

    test('sub-page of a hidden project', async () => {
        stubApi({[`${API}/vanity/cool-game`]: {id: '55'}});
        const meta = await renderPath('/p/cool-game/remixes');
        expect(meta.title).toBe('Remix tree - MistWarp');
    });

    test('pull request page', async () => {
        stubApi({
            [`${API}/vanity/cool-game`]: {id: '55'},
            [`${API}/projects/55`]: sharedProject(),
            [`${API}/projects/55/pulls/3`]: {pull: {title: 'Add levels'}}
        });
        const meta = await renderPath('/p/cool-game/pulls/3');
        expect(meta.title).toBe('Add levels · Cool Game - MistWarp');
    });

    test('pull request page for an unknown slug', async () => {
        const meta = await renderPath('/p/missing/pulls/3');
        expect(meta.title).toBe('Pull request - MistWarp');
        expect(meta.description).toBe('View this MistWarp pull request.');
    });
});

describe('user pages', () => {
    const alice = {exists: true, username: 'Alice', bio: 'Makes  games', projects: [1, 2, 3]};

    test('profile with a bio and avatar', async () => {
        stubApi({[`${API}/users/alice`]: alice});
        const meta = await renderPath('/users/alice');
        expect(meta.title).toBe('Alice - MistWarp');
        expect(meta.description).toBe('Makes games');
        expect(meta.ogImage).toBe('https://avatars.rotur.dev/alice');
        expect(meta.twitterCard).toBe('summary');
    });

    test('profile without a bio counts projects', async () => {
        stubApi({[`${API}/users/alice`]: {...alice, bio: ''}});
        expect((await renderPath('/users/alice')).description).toBe('Alice has shared 3 projects on MistWarp.');

        stubApi({[`${API}/users/alice`]: {exists: true}});
        const meta = await renderPath('/users/alice');
        expect(meta.title).toBe('alice - MistWarp');
        expect(meta.description).toBe('alice has shared 0 projects on MistWarp.');
    });

    test.each([
        ['/library', 'Game library'],
        ['/followers', 'Followers'],
        ['/following', 'Following']
    ])('sub-page %s', async (rest, suffix) => {
        stubApi({[`${API}/users/alice`]: alice});
        const meta = await renderPath(`/users/alice${rest}`);
        expect(meta.title).toBe(`Alice · ${suffix} - MistWarp`);
    });

    test('missing user', async () => {
        stubApi({[`${API}/users/ghost`]: {exists: false}});
        const meta = await renderPath('/users/ghost');
        expect(meta.title).toBe('Profile - MistWarp');
        expect(meta.ogImage).toBe(DEFAULT_IMAGE);
    });

    test('avatar URL encodes the lowercased name', async () => {
        stubApi({[`${API}/users/A%20B`]: {exists: true, username: 'A B'}});
        const meta = await renderPath('/users/A%20B');
        expect(meta.ogImage).toBe('https://avatars.rotur.dev/a%20b');
    });
});

describe('space, group, news and theme pages', () => {
    test('public space uses its thumbnail', async () => {
        stubApi({[`${API}/spaces/s1`]: {space: {
            title: 'Jam', owner: 'bob', kind: 'challenge', description: '', thumbnailUrl: 'https://t/s.png'
        }}});
        const meta = await renderPath('/spaces/s1');
        expect(meta.title).toBe('Jam - MistWarp');
        expect(meta.description).toBe('Jam is a MistWarp challenge by bob.');
        expect(meta.ogImage).toBe('https://t/s.png');
        expect(meta.twitterCard).toBe('summary_large_image');
    });

    test('space falls back to the first project thumbnail, and unknown kinds read as "space"', async () => {
        stubApi({[`${API}/spaces/s1`]: {space: {
            title: 'Jam',
            owner: 'bob',
            kind: 'weird',
            projects: [{thumbUrl: null}, {thumbUrl: 'https://t/p.png'}]
        }}});
        const meta = await renderPath('/spaces/s1');
        expect(meta.description).toBe('Jam is a MistWarp space by bob.');
        expect(meta.ogImage).toBe('https://t/p.png');
    });

    test('space without any image', async () => {
        stubApi({[`${API}/spaces/s1`]: {space: {title: 'Jam', owner: 'bob', kind: 'studio'}}});
        const meta = await renderPath('/spaces/s1');
        expect(meta.ogImage).toBe(DEFAULT_IMAGE);
        expect(meta.twitterCard).toBe('summary');
    });

    test('private space leaks nothing', async () => {
        stubApi({[`${API}/spaces/s1`]: {space: {title: 'Secret', visibility: 'private'}}});
        const meta = await renderPath('/spaces/s1');
        expect(meta.title).toBe('Space - MistWarp');
        expect(meta.description).toBe('View this MistWarp space.');
    });

    test('group', async () => {
        stubApi({[`${API}/groups/abc`]: {group: {name: 'ABC', icon_url: 'https://i/g.png'}, projects: [1]}});
        const meta = await renderPath('/groups/abc');
        expect(meta.title).toBe('ABC - MistWarp');
        expect(meta.description).toBe('ABC has shared 1 projects on MistWarp.');
        expect(meta.ogImage).toBe('https://i/g.png');
    });

    test('group without a name or icon, and a missing group', async () => {
        stubApi({[`${API}/groups/abc`]: {group: {description: 'We  build'}}});
        const meta = await renderPath('/groups/abc');
        expect(meta.title).toBe('abc - MistWarp');
        expect(meta.description).toBe('We build');
        expect(meta.ogImage).toBe(DEFAULT_IMAGE);

        stubApi({});
        expect((await renderPath('/groups/abc')).title).toBe('Group - MistWarp');
    });

    test('news item', async () => {
        stubApi({[`${API}/news/n1`]: {item: {title: 'Release', body: 'New\nthings'}}});
        const meta = await renderPath('/news/n1');
        expect(meta.title).toBe('Release - MistWarp');
        expect(meta.description).toBe('New things');
    });

    test('missing news item', async () => {
        const meta = await renderPath('/news/n1');
        expect(meta.title).toBe('News - MistWarp');
    });

    test('/news/manage needs no API call', async () => {
        const meta = await renderPath('/news/manage');
        expect(meta.title).toBe('Manage news - MistWarp');
        expect(global.fetch).not.toHaveBeenCalled();
    });

    test('theme uses the WarpTheme API', async () => {
        stubApi({[`${WARPTHEME}/theme?uuid=t%201`]: {theme: {name: 'Dusk', authorName: 'carol'}}});
        const meta = await renderPath('/themes/t%201');
        expect(fetchedUrls()).toEqual([`${WARPTHEME}/theme?uuid=t%201`]);
        expect(meta.title).toBe('Dusk by carol - MistWarp');
        expect(meta.description).toBe('A community-made editor theme for MistWarp.');
    });

    test('theme author fallbacks and a missing theme', async () => {
        stubApi({[`${WARPTHEME}/theme?uuid=t1`]: {theme: {owner: 'dave', description: 'Dark'}}});
        const meta = await renderPath('/themes/t1');
        expect(meta.title).toBe('Theme by dave - MistWarp');
        expect(meta.description).toBe('Dark');

        stubApi({});
        expect((await renderPath('/themes/t1')).title).toBe('Theme - MistWarp');
    });

    test.each([
        ['/posts/1', 'Post - MistWarp'],
        ['/bounties/1', 'Bounty - MistWarp'],
        ['/spaces/1/manage', 'Manage space - MistWarp'],
        ['/mystuff/project/1', 'Manage project - MistWarp']
    ])('%s gets fixed tags without an API call', async (path, title) => {
        const meta = await renderPath(path);
        expect(meta.title).toBe(title);
        expect(global.fetch).not.toHaveBeenCalled();
    });
});

describe('unexpected API data', () => {
    test.each([
        ['/users/alice', `${API}/users/alice`, {exists: true, username: 42}],
        ['/users/alice', `${API}/users/alice`, {exists: true, bio: {html: 'x'}}],
        ['/spaces/s1', `${API}/spaces/s1`, {space: {title: 'Jam', projects: 'none'}}],
        ['/project/1', `${API}/projects/1`, sharedProject({instructions: 5})]
    ])('%s still serves the page when the API returns odd values', async (path, url, body) => {
        stubApi({[url]: body});
        const response = htmlResponse();
        const {result} = await run(path, {response});
        expect(result.status).toBe(200);
        await expect(result.text()).resolves.toBe(HTML);
    });
});
