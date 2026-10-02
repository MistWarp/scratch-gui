import React from 'react';
import {act} from 'react-dom/test-utils';
import {mount} from 'enzyme';
import {MemoryRouter, Route, Routes} from 'react-router-dom';

import api from '../../src/community/api.js';
import Project from '../../src/community/pages/Project.jsx';
import {setMockUserContext} from '../../src/community/UserContext.jsx';
import rotur from '../../src/community/rotur.js';

const mockClient = {
    loggedIn: true,
    _http: {getToken: () => 'rotur_secret-token'},
    setToken: jest.fn(),
    tokens: {create: jest.fn(() => Promise.resolve({token: 'rotur_new-token'}))},
    me: {
        get: jest.fn(() => Promise.resolve({username: 'Viewer'}))
    },
    profiles: {get: jest.fn(() => Promise.resolve({username: 'someone'}))},
    gifts: {claim: jest.fn(() => Promise.resolve({ok: true}))},
    storage: {get: jest.fn(() => Promise.resolve({data: {}}))}
};

jest.mock('../../src/community/UserContext.jsx', () => {
    let state = {user: null, loading: true, login: jest.fn()};
    return {
        useUser: () => state,
        setMockUserContext: next => {
            state = next;
        }
    };
});
jest.mock('../../src/lib/themes/custom-themes.js', () => ({
    CustomTheme: {},
    customThemeManager: {themes: {clear: jest.fn()}, loadCustomThemes: jest.fn()}
}));
jest.mock('../../src/community/rotur.js', () => ({
    following: jest.fn()
}));
jest.mock('../../src/lib/rotur/client.js', () => ({
    getRotur: () => mockClient,
    ensureScopes: jest.fn(() => Promise.resolve(true))
}));
jest.mock('../../src/lib/community/cached-fetch.js', () => ({
    cachedFetchBuffer: jest.fn(() => Promise.resolve(new ArrayBuffer(0))),
    preloadContent: jest.fn(() => Promise.resolve())
}));

const Harness = () => (
    <MemoryRouter
        initialEntries={['/project/project-1']}
        future={{v7_startTransition: true, v7_relativeSplatPath: true}}
    >
        <Routes>
            <Route path="/project/:id" element={<Project renderVersion={0} />} />
        </Routes>
    </MemoryRouter>
);

const flush = async () => {
    for (let i = 0; i < 6; i++) {
        await Promise.resolve();
    }
};

const mountProject = async () => {
    rotur.following.mockResolvedValue({following: []});
    jest.spyOn(api, 'getProject').mockResolvedValue({
        project: {
            id: 'project-1',
            title: 'Project',
            owner: 'Creator',
            projectJsonUrl: 'https://projects.example/project-1.sb3',
            assetsBase: 'https://assets.example/',
            hasContent: true,
            visibility: 'public'
        }
    });
    jest.spyOn(api, 'commits').mockResolvedValue({commits: []});
    jest.spyOn(api, 'view').mockResolvedValue({});
    setMockUserContext({user: {username: 'Viewer'}, loading: false, login: jest.fn()});
    const container = document.createElement('div');
    document.body.appendChild(container);
    const wrapper = mount(<Harness />, {attachTo: container});
    await act(flush);
    wrapper.update();
    const frame = wrapper.find('iframe').getDOMNode();
    const replies = [];
    jest.spyOn(frame.contentWindow, 'postMessage').mockImplementation(message => {
        if (message && message.type === 'mw:rotur-result') replies.push(message);
    });
    // What a custom extension running inside the player can send.
    const send = async data => {
        await act(async () => {
            window.dispatchEvent(new MessageEvent('message', {
                data: {type: 'mw:rotur', ...data},
                source: frame.contentWindow
            }));
            await flush();
        });
        wrapper.update();
        return replies.find(reply => reply.id === data.id);
    };
    return {wrapper, send};
};

describe('community project page Rotur bridge', () => {
    afterEach(() => {
        localStorage.removeItem('mw:rotur-grants');
        jest.restoreAllMocks();
    });

    test('never hands the token or private SDK methods to the player', async () => {
        const {wrapper, send} = await mountProject();
        for (const [id, method] of [
            [1, '_http.getToken'], [2, 'setToken'], [3, 'tokens.create'], [4, 'constructor.constructor']
        ]) {
            const reply = await send({kind: 'call', id, method, args: ['rotur_attacker']});
            expect(reply.ok).toBe(false);
            expect(JSON.stringify(reply)).not.toContain('rotur_secret-token');
        }
        expect(mockClient.setToken).not.toHaveBeenCalled();
        expect(mockClient.tokens.create).not.toHaveBeenCalled();
        wrapper.unmount();
    });

    test('projects can no longer send credits', async () => {
        const {wrapper, send} = await mountProject();
        const reply = await send({kind: 'call', id: 5, method: 'me.transfer', args: ['thief', 5000, '']});
        expect(reply.ok).toBe(false);
        wrapper.unmount();
    });

    test('a confirmation shows what the host builds, whatever the frame claims', async () => {
        const {wrapper, send} = await mountProject();
        const pending = send({
            kind: 'call',
            id: 6,
            method: 'gifts.claim',
            args: ['REAL-CODE'],
            opts: {sensitive: false, label: 'claim a free hat'}
        });
        await pending;
        expect(mockClient.gifts.claim).not.toHaveBeenCalled();
        expect(wrapper.text()).toContain('claim gift code REAL-CODE');
        expect(wrapper.text()).not.toContain('free hat');
        wrapper.unmount();
    });

    test('the frame cannot skip consent or pick another project grant', async () => {
        localStorage.setItem('mw:rotur-grants', JSON.stringify({'name:Other': ['posts:create']}));
        const {wrapper, send} = await mountProject();
        const consent = send({
            kind: 'consent',
            id: 6,
            scopes: ['posts:create'],
            meta: {name: 'Other', authenticatedOnly: true}
        });
        await consent;
        expect(wrapper.text()).toContain('Connect to Rotur');
        const call = await send({kind: 'call', id: 7, method: 'posts.create', args: ['spam']});
        expect(call.ok).toBe(false);
        expect(call.error).toContain('not granted');
        const scopeReply = await send({kind: 'consent', id: 8, scopes: ['tokens:manage']});
        expect(scopeReply.ok).toBe(false);
        wrapper.unmount();
    });

    test('allowlisted public reads still work and storage stays on this project', async () => {
        const {wrapper, send} = await mountProject();
        const reply = await send({kind: 'call', id: 9, method: 'profiles.get', args: ['someone']});
        expect(reply).toMatchObject({ok: true, result: {username: 'someone'}});
        await send({kind: 'consent', id: 10, scopes: ['storage:view']});
        const storage = await send({kind: 'call', id: 11, method: 'storage.get', args: ['victim-project']});
        expect(storage.ok).toBe(true);
        expect(mockClient.storage.get).toHaveBeenCalledWith('project-1');
        wrapper.unmount();
    });
});
