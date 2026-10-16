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
