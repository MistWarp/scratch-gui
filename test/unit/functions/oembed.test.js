/**
 * @jest-environment node
 */

import {onRequest} from '../../../functions/oembed.js';

const API = 'https://api.mistwarp.org/v1';

const jsonResponse = (body, status = 200) => new Response(JSON.stringify(body), {
    status,
    headers: {'content-type': 'application/json'}
});

const stubApi = routes => {
    global.fetch = jest.fn(url => Promise.resolve(Object.prototype.hasOwnProperty.call(routes, url) ?
        jsonResponse(routes[url]) :
        jsonResponse({}, 404)));
};

const publicProject = (overrides = {}) => ({
    project: {
        id: 'p55',
        title: 'Cool Game',
        owner: 'alice',
        shared: true,
        visibility: 'public',
        edited: 1789856223544,
        ...overrides
    }
});

const oembed = async query => {
    const result = await onRequest({request: new Request(`https://mistwarp.org/oembed?${query}`)});
    return {result, body: await result.json()};
};

const forUrl = (url, extra = '') => oembed(`url=${encodeURIComponent(url)}&format=json${extra}`);

const realFetch = global.fetch;

afterAll(() => {
    global.fetch = realFetch;
});

beforeEach(() => {
    stubApi({[`${API}/projects/p55`]: publicProject()});
});

test('a public project page answers with a rich player embed', async () => {
    const {result, body} = await forUrl('https://mistwarp.org/project/p55');
    expect(result.status).toBe(200);
    expect(result.headers.get('content-type')).toBe('application/json; charset=utf-8');
    expect(result.headers.get('access-control-allow-origin')).toBe('*');
    expect(body).toEqual({
        version: '1.0',
        type: 'rich',
        provider_name: 'MistWarp',
        provider_url: 'https://mistwarp.org/',
        title: 'Cool Game by @alice',
        author_name: 'alice',
        author_url: 'https://mistwarp.org/users/alice',
        html: '<iframe src="https://mistwarp.org/embed?mw=p55&amp;ref=oembed" width="482" height="412" ' +
            'title="Cool Game by @alice" frameborder="0" scrolling="no" allowfullscreen></iframe>',
        width: 482,
        height: 412,
        thumbnail_url: `${API}/projects/p55/card.png?v=1789856223544`,
        thumbnail_width: 1200,
        thumbnail_height: 630,
        cache_age: 3600
    });
});

test.each([
    'https://mistwarp.org/project/p55/',
    'https://www.mistwarp.org/project/p55?ref=x#top',
    'https://mistwarp.org/embed?mw=p55',
    'https://mistwarp.org/embed.html?mw=p55&autoplay'
])('%s is recognised', async url => {
    const {result, body} = await forUrl(url);
    expect(result.status).toBe(200);
    expect(body.title).toBe('Cool Game by @alice');
});

test('a vanity URL is resolved through the API', async () => {
    stubApi({
        [`${API}/vanity/cool-game`]: {id: 'p55'},
        [`${API}/projects/p55`]: publicProject()
    });
    const {body} = await forUrl('https://mistwarp.org/p/cool-game');
    expect(body.author_name).toBe('alice');
});

test('the player is scaled down to fit the requested size and keeps its shape', async () => {
    expect((await forUrl('https://mistwarp.org/project/p55', '&maxwidth=241')).body)
        .toMatchObject({width: 241, height: 206});
    expect((await forUrl('https://mistwarp.org/project/p55', '&maxwidth=1000&maxheight=206')).body)
        .toMatchObject({width: 241, height: 206});
    expect((await forUrl('https://mistwarp.org/project/p55', '&maxwidth=2000')).body)
        .toMatchObject({width: 482, height: 412});
    expect((await forUrl('https://mistwarp.org/project/p55', '&maxwidth=abc')).body)
        .toMatchObject({width: 482, height: 412});
});

test.each([
    ['an unlisted', publicProject({visibility: 'unlisted'})],
    ['an unshared', publicProject({shared: false})],
    ['a missing', {}]
])('%s project is not found', async (label, project) => {
    stubApi({[`${API}/projects/p55`]: project});
    const {result} = await forUrl('https://mistwarp.org/project/p55');
    expect(result.status).toBe(404);
});

test.each([
    'https://example.com/project/p55',
    'https://mistwarp.org/users/alice',
    'https://mistwarp.org/project/p55/remixes',
    'https://mistwarp.org/p/unknown'
])('%s is not a game page', async url => {
    const {result} = await forUrl(url);
    expect(result.status).toBe(404);
});

test('a missing or broken url is a bad request', async () => {
    expect((await oembed('format=json')).result.status).toBe(400);
    expect((await oembed('url=not%20a%20url')).result.status).toBe(400);
});

test('only JSON is offered', async () => {
    const {result} = await oembed(`url=${encodeURIComponent('https://mistwarp.org/project/p55')}&format=xml`);
    expect(result.status).toBe(501);
});

test('the format may be left out', async () => {
    const {result} = await oembed(`url=${encodeURIComponent('https://mistwarp.org/project/p55')}`);
    expect(result.status).toBe(200);
});

test('names with HTML characters are escaped inside the player HTML', async () => {
    stubApi({[`${API}/projects/p55`]: publicProject({title: '"><script>x</script>'})});
    const {body} = await forUrl('https://mistwarp.org/project/p55');
    expect(body.html).toContain('title="&quot;&gt;&lt;script&gt;x&lt;/script&gt; by @alice"');
    expect(body.html).not.toContain('<script>');
});
