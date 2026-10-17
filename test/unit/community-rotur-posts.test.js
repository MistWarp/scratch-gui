jest.mock('../../src/lib/rotur/identity.js', () => ({getRoturToken: () => 'token'}));
jest.mock('../../src/lib/rotur/client.js', () => {
    const create = jest.fn(() => Promise.resolve({id: 'sdk'}));
    return {
        ensureScopes: jest.fn(() => Promise.resolve(true)),
        getRotur: () => ({loggedIn: true, posts: {create}}),
        create
    };
});

import {create} from '../../src/lib/rotur/client.js';
import rotur from '../../src/community/rotur.js';

const realFetch = global.fetch;

afterEach(() => {
    global.fetch = realFetch;
    create.mockClear();
});

describe('creating claw posts', () => {
    test('uses the SDK and marks the post as made in MistWarp', async () => {
        await rotur.createPost('hello', {profileOnly: true});
        expect(create).toHaveBeenCalledWith('hello', {profileOnly: true, os: 'MistWarp'});
    });

    test('sends made_with in the v2 body when a project is attached', async () => {
        global.fetch = jest.fn(() => Promise.resolve({ok: true, json: () => Promise.resolve({id: 'p9'})}));
        const madeWith = {app: 'MistWarp', kind: 'project', ref: 'p1', url: 'https://mistwarp.org/project/p1'};
        await expect(rotur.createPost('look', {
            profileOnly: false, attachments: ['a', 'b'], poll: ['x', 'y'], madeWith
        })).resolves.toEqual({id: 'p9'});
        expect(create).not.toHaveBeenCalled();
        const [url, init] = global.fetch.mock.calls[0];
        expect(url).toBe('https://api.rotur.dev/v2/posts');
        expect(init.method).toBe('POST');
        expect(init.headers).toEqual({'Authorization': 'Bearer token', 'Content-Type': 'application/json'});
        expect(JSON.parse(init.body)).toEqual({
            content: 'look', os: 'MistWarp', made_with: madeWith, attachments: 'a,b', poll: ['x', 'y']
        });
    });
});

const respond = (status, body) => Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => (body === null ? Promise.reject(new Error('not json')) : Promise.resolve(body))
});

const freshRotur = () => {
    let fresh;
    jest.isolateModules(() => {
        fresh = require('../../src/community/rotur.js').default;
    });
    return fresh;
};

describe('claw v2 features', () => {
    test('For You returns its page and remembers when the API has no such route', async () => {
        const client = freshRotur();
        global.fetch = jest.fn(() => respond(200, {
            items: [{id: 'a', user: 'mist', reasons: [{type: 'fresh'}]}, null], next_cursor: 'c1', personalised: false
        }));
        await expect(client.forYou({limit: 20})).resolves.toEqual({
            items: [{id: 'a', user: 'mist', reasons: [{type: 'fresh'}]}], next_cursor: 'c1', personalised: false
        });
        expect(global.fetch.mock.calls[0][0]).toBe('https://api.rotur.dev/v2/feed/for-you?limit=20');

        const old = freshRotur();
        global.fetch = jest.fn(() => respond(404, null));
        await expect(old.forYou()).resolves.toBeNull();
        await expect(old.forYou()).resolves.toBeNull();
        expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    test('For You that is switched off counts as missing', async () => {
        const client = freshRotur();
        global.fetch = jest.fn(() => respond(503, {error: 'off', code: 'not_available'}));
        await expect(client.forYou()).resolves.toBeNull();
    });

    test('a missing post in a thread is still an error', async () => {
        const client = freshRotur();
        global.fetch = jest.fn(() => respond(404, {error: 'Post not found', code: 'post_not_found'}));
        await expect(client.thread('p1')).rejects.toMatchObject({status: 404, code: 'post_not_found'});
    });

    test('threads come back with ancestors and a page of replies', async () => {
        const client = freshRotur();
        global.fetch = jest.fn(() => respond(200, {
            ancestors: [{id: 'root'}], post: {id: 'p1'}, replies: {items: [{id: 'r1'}], next_cursor: ''}, sort: 'relevant'
        }));
        await expect(client.thread('p1')).resolves.toEqual({
            ancestors: [{id: 'root'}], post: {id: 'p1'}, replies: {items: [{id: 'r1'}], next_cursor: null}, sort: 'relevant'
        });
        expect(global.fetch.mock.calls[0][0]).toBe('https://api.rotur.dev/v2/posts/p1/thread?sort=relevant&limit=20');
    });

    test('pouncing sends PUT and taking it back sends DELETE, keeping error codes', async () => {
        const client = freshRotur();
        global.fetch = jest.fn(() => respond(200, {pounced: true, pounce_count: 4, pounces_left: 2}));
        await expect(client.pounce('p1')).resolves.toEqual({pounced: true, pounce_count: 4, pounces_left: 2});
        expect(global.fetch.mock.calls[0][0]).toBe('https://api.rotur.dev/v2/posts/p1/pounce');
        expect(global.fetch.mock.calls[0][1].method).toBe('PUT');

        global.fetch = jest.fn(() => respond(403, {error: 'None left', code: 'no_pounces_left', resets_at: 99}));
        await expect(client.unpounce('p1')).rejects.toMatchObject({
            code: 'no_pounces_left', data: {resets_at: 99}
        });
        expect(global.fetch.mock.calls[0][1].method).toBe('DELETE');
    });

    test('lists retry without the token when it has expired', async () => {
        const client = freshRotur();
        global.fetch = jest.fn()
            .mockImplementationOnce(() => respond(401, {error: 'expired', code: 'auth_invalid'}))
            .mockImplementationOnce(() => respond(200, [{id: 'a'}]));
        await expect(client.topPosts(10, 24)).resolves.toEqual([{id: 'a'}]);
        expect(global.fetch.mock.calls[0][1].headers).toEqual({Authorization: 'Bearer token'});
        expect(global.fetch.mock.calls[1]).toEqual(['https://api.rotur.dev/v2/posts/top?limit=10&time_period=24']);
    });

    test('impressions stop being sent once the API refuses them', async () => {
        const client = freshRotur();
        global.fetch = jest.fn(() => respond(403, {error: 'no', code: 'first_party_only'}));
        await expect(client.reportImpressions([{token: 't', visible_ms: 1200}])).rejects.toMatchObject({status: 403});
        await expect(client.reportImpressions([{token: 't2', visible_ms: 1200}])).resolves.toBeNull();
        expect(global.fetch).toHaveBeenCalledTimes(1);
    });
});
