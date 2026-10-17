import {
    createFrameServer, createStorageStore, mintEditorSession, EDITOR_ROTUR_METHODS
} from '../../../src/lib/account/frame-server.js';

const createPort = () => {
    const sent = [];
    return {
        sent,
        postMessage: message => sent.push(message),
        start: jest.fn(),
        onmessage: null
    };
};

const createIdentity = user => {
    let state = {status: user ? 'ready' : 'idle', user};
    const listeners = new Set();
    return {
        getState: () => state,
        subscribe: listener => {
            listeners.add(listener);
            return () => listeners.delete(listener);
        },
        logout: jest.fn(() => {
            state = {status: 'idle', user: null};
            for (const listener of listeners) listener(state);
        }),
        set: next => {
            state = next;
            for (const listener of listeners) listener(state);
        }
    };
};

let clock = 1000000;

const createMemoryStorage = () => {
    const items = new Map();
    return {
        getItem: key => (items.has(key) ? items.get(key) : null),
        setItem: (key, value) => items.set(key, String(value))
    };
};

const createMinter = () => {
    let minted = 0;
    return jest.fn(async () => {
        minted += 1;
        return {
            token: minted === 1 ? 'editor-token' : `editor-token-${minted}`,
            expiresAt: clock + 7200000,
            extra: 'dropped'
        };
    });
};

const createSharedLock = () => {
    let tail = Promise.resolve();
    return task => {
        const run = tail.then(() => task());
        tail = run.catch(() => null);
        return run;
    };
};

const setup = (user = {username: 'mist', id: 'u1', bio: 'hi', avatarUrl: 'x'}, {
    signOutAnswer = true,
    identity = createIdentity(user),
    storage = createMemoryStorage(),
    createEditorSession = createMinter(),
    mistSession = () => 'parent-session',
    tokenRejected,
    lock
} = {}) => {
    const deps = {
        identity,
        now: () => clock,
        mistSession,
        store: createStorageStore(() => storage, 'mw:editor-session'),
        lock,
        tokenRejected,
        confirmSignOut: jest.fn(async () => signOutAnswer),
        createEditorSession,
        callRotur: jest.fn(async (method, args) => ({method, args})),
        projectRotur: {
            ensureConsent: jest.fn(async () => true),
            call: jest.fn(async () => 'result'),
            clear: jest.fn(async () => true)
        }
    };
    const server = createFrameServer(deps);
    const port = createPort();
    server.serve(port);
    const send = async (method, args) => {
        const id = port.sent.length + 1000;
        await port.onmessage({data: {id, method, args}});
        return port.sent.find(message => message.id === id);
    };
    return {deps, identity, port, send, storage};
};

test('announces the public identity on connect and when it changes', () => {
    const {port, identity} = setup();
    expect(port.sent[0]).toEqual({
        kind: 'ready',
        identity: {status: 'ready', user: {username: 'mist', id: 'u1', bio: 'hi'}, banMessage: null}
    });
    identity.set({status: 'idle', user: null});
    expect(port.sent[1]).toEqual({kind: 'identity', identity: {status: 'idle', user: null, banMessage: null}});
});

test('hands the editor only an editor session token', async () => {
    const {send} = setup();
    await expect(send('editorSession')).resolves.toEqual({
        id: expect.any(Number),
        result: {token: 'editor-token', expiresAt: clock + 7200000}
    });
});

test('repeated requests reuse one editor token instead of minting more', async () => {
    const {send, deps} = setup();
    const replies = [];
    for (let i = 0; i < 20; i++) replies.push(await send('editorSession'));
    expect(new Set(replies.map(reply => reply.result.token))).toEqual(new Set(['editor-token']));
    expect(deps.createEditorSession).toHaveBeenCalledTimes(1);
});

test('concurrent requests share one mint', async () => {
    const {send, deps} = setup();
    await Promise.all([send('editorSession'), send('editorSession'), send('editorSession')]);
    expect(deps.createEditorSession).toHaveBeenCalledTimes(1);
});

test('a token reported stale is renewed at most once every five minutes', async () => {
    const {send, deps} = setup();
    await send('editorSession');
    expect((await send('editorSession', {stale: 'editor-token'})).result.token).toBe('editor-token');
    clock += 300000;
    expect((await send('editorSession', {stale: 'editor-token'})).result.token).toBe('editor-token-2');
    expect((await send('editorSession', {stale: 'editor-token-2'})).result.token).toBe('editor-token-2');
    expect((await send('editorSession', {stale: 'someone-elses'})).result.token).toBe('editor-token-2');
    expect(deps.createEditorSession).toHaveBeenCalledTimes(2);
});

test('a token close to expiry is replaced', async () => {
    const {send, deps} = setup();
    await send('editorSession');
    clock += 7200000 - 200000;
    expect((await send('editorSession')).result.token).toBe('editor-token-2');
    expect(deps.createEditorSession).toHaveBeenCalledTimes(2);
});

test('switching accounts in the frame drops the cached token', async () => {
    const {send, deps, identity} = setup();
    await send('editorSession');
    identity.set({status: 'ready', user: {username: 'other', id: 'u2'}});
    expect((await send('editorSession')).result.token).toBe('editor-token-2');
    expect(deps.createEditorSession).toHaveBeenCalledTimes(2);
});

test('refuses an editor session when signed out', async () => {
    const {send, deps} = setup(null);
    const reply = await send('editorSession');
    expect(reply.error).toMatchObject({code: 'signed_out'});
    expect(deps.createEditorSession).not.toHaveBeenCalled();
});

test('only allowlisted Rotur methods run for the editor', async () => {
    const {send, deps} = setup();
    expect((await send('rotur', {method: 'notifications.list', args: [7]})).result)
        .toEqual({method: 'notifications.list', args: [7]});
    for (const method of ['_http.getToken', 'credits.transfer', 'me.update', 'validators.generate', 'constructor']) {
        expect((await send('rotur', {method, args: []})).error).toBeTruthy();
    }
    expect(deps.callRotur).toHaveBeenCalledTimes(1);
    expect([...EDITOR_ROTUR_METHODS].every(method => !method.startsWith('_'))).toBe(true);
});

test('unknown requests and prototype keys are refused', async () => {
    const {send} = setup();
    for (const method of ['toString', '__proto__', 'hasOwnProperty', 'fetch']) {
        expect((await send(method)).error.message).toBe('Unknown MistWarp account request');
    }
});

test('project requests need a valid project and pass through to the project host', async () => {
    const {send, deps} = setup();
    expect((await send('projectRotur', {action: 'call', project: {name: 'Game', id: 'p1'}, method: 'me.get', args: []})).result)
        .toBe('result');
    expect(deps.projectRotur.call).toHaveBeenCalledWith({name: 'Game', id: 'p1'}, 'me.get', [], expect.any(Number));
    expect((await send('projectRotur', {action: 'call', project: {name: 'x', id: '../p'}, method: 'me.get'})).error)
        .toBeTruthy();
    expect((await send('projectRotur', {action: 'ensureConsent', project: {name: 'x'}, scopes: [{}]})).error)
        .toBeTruthy();
    expect((await send('projectRotur', {action: 'delete', project: {name: 'x'}})).error).toBeTruthy();
});

test('signing out goes through the account once the user confirms it in the frame', async () => {
    const {send, deps} = setup();
    const reply = await send('signOut');
    expect(deps.confirmSignOut).toHaveBeenCalled();
    expect(deps.identity.logout).toHaveBeenCalled();
    expect(reply.result.user).toBeNull();
});

test('the editor cannot sign the user out without their answer', async () => {
    const {send, deps} = setup(undefined, {signOutAnswer: false});
    const reply = await send('signOut');
    expect(deps.identity.logout).not.toHaveBeenCalled();
    expect(reply.result.user).toMatchObject({username: 'mist'});
});

test('signing out when already signed out does not prompt', async () => {
    const {send, deps} = setup(null);
    await send('signOut');
    expect(deps.confirmSignOut).not.toHaveBeenCalled();
});

test('a failed mint is not retried for ten seconds', async () => {
    const {send, deps} = setup();
    deps.createEditorSession.mockImplementation(async () => {
        throw new Error('not authenticated');
    });
    for (let i = 0; i < 5; i++) expect((await send('editorSession')).error.message).toBe('not authenticated');
    expect(deps.createEditorSession).toHaveBeenCalledTimes(1);
    clock += 10000;
    await send('editorSession');
    expect(deps.createEditorSession).toHaveBeenCalledTimes(2);
});

test('a new frame reuses the token another frame minted', async () => {
    const createEditorSession = createMinter();
    const storage = createMemoryStorage();
    const identity = createIdentity({username: 'mist', id: 'u1'});
    const frames = [];
    const lock = createSharedLock();
    for (let i = 0; i < 10; i++) frames.push(setup(undefined, {identity, storage, createEditorSession, lock}));
    const replies = await Promise.all(frames.map(frame => frame.send('editorSession')));
    expect(new Set(replies.map(reply => reply.result.token))).toEqual(new Set(['editor-token']));
    expect(createEditorSession).toHaveBeenCalledTimes(1);
    const later = setup(undefined, {identity, storage, createEditorSession});
    expect((await later.send('editorSession', {stale: 'editor-token'})).result.token).toBe('editor-token');
    expect(createEditorSession).toHaveBeenCalledTimes(1);
});

test('the renewal limit is shared between frames', async () => {
    const createEditorSession = createMinter();
    const storage = createMemoryStorage();
    const identity = createIdentity({username: 'mist', id: 'u1'});
    await setup(undefined, {identity, storage, createEditorSession}).send('editorSession');
    clock += 300000;
    expect((await setup(undefined, {identity, storage, createEditorSession})
        .send('editorSession', {stale: 'editor-token'})).result.token).toBe('editor-token-2');
    expect((await setup(undefined, {identity, storage, createEditorSession})
        .send('editorSession', {stale: 'editor-token-2'})).result.token).toBe('editor-token-2');
    expect(createEditorSession).toHaveBeenCalledTimes(2);
});

test('a new MistWarp session in the frame replaces the cached token', async () => {
    let parent = 'parent-session';
    const {send, deps, storage} = setup(undefined, {mistSession: () => parent});
    await send('editorSession');
    expect(storage.getItem('mw:editor-session')).not.toContain('parent-session');
    parent = 'another-session';
    expect((await send('editorSession')).result.token).toBe('editor-token-2');
    expect(deps.createEditorSession).toHaveBeenCalledTimes(2);
});

test('a token minted while the account changed is not cached or handed out', async () => {
    let finishMint = null;
    const createEditorSession = jest.fn(() => new Promise(resolve => {
        finishMint = resolve;
    }));
    const {send, identity, storage} = setup(undefined, {createEditorSession});
    const pending = send('editorSession');
    await Promise.resolve();
    await Promise.resolve();
    identity.set({status: 'ready', user: {username: 'other', id: 'u2'}});
    finishMint({token: 'mist-token', expiresAt: clock + 7200000});
    const reply = await pending;
    expect(reply.result).toBeUndefined();
    expect(reply.error).toMatchObject({code: 'bridge'});
    expect(JSON.parse(storage.getItem('mw:editor-session')).session).toBeNull();
});

test('a malformed mint reply counts as a failure', async () => {
    const createEditorSession = jest.fn(async () => ({token: '', expiresAt: 'soon'}));
    const {send} = setup(undefined, {createEditorSession});
    expect((await send('editorSession')).error).toBeTruthy();
    expect((await send('editorSession')).error).toBeTruthy();
    expect(createEditorSession).toHaveBeenCalledTimes(1);
});

test('the cache still works for one frame when storage is blocked', async () => {
    const storage = {
        getItem: () => {
            throw new Error('blocked');
        },
        setItem: () => {
            throw new Error('blocked');
        }
    };
    const {send, deps} = setup(undefined, {storage});
    await send('editorSession');
    await send('editorSession');
    expect(deps.createEditorSession).toHaveBeenCalledTimes(1);
});

test('concurrent sign-out requests share one prompt', async () => {
    let answer = null;
    const {send, deps} = setup();
    deps.confirmSignOut.mockImplementation(() => new Promise(resolve => {
        answer = resolve;
    }));
    const first = send('signOut');
    const second = send('signOut');
    await Promise.resolve();
    await Promise.resolve();
    expect(deps.confirmSignOut).toHaveBeenCalledTimes(1);
    expect(deps.confirmSignOut).toHaveBeenCalledWith('mist');
    answer(true);
    expect((await first).result.user).toBeNull();
    expect((await second).result.user).toBeNull();
    expect(deps.identity.logout).toHaveBeenCalledTimes(1);
});

test('a confirmed sign-out does not sign out an account that replaced the one asked about', async () => {
    let answer = null;
    const {send, deps, identity} = setup();
    deps.confirmSignOut.mockImplementation(() => new Promise(resolve => {
        answer = resolve;
    }));
    const pending = send('signOut');
    await Promise.resolve();
    identity.set({status: 'ready', user: {username: 'other', id: 'u2'}});
    answer(true);
    expect((await pending).result.user).toMatchObject({username: 'other'});
    expect(identity.logout).not.toHaveBeenCalled();
});

test('signing out forgets the cached editor token', async () => {
    const {send, storage} = setup();
    await send('editorSession');
    await send('signOut');
    expect(JSON.parse(storage.getItem('mw:editor-session')).session).toBeNull();
});

test('a revoked MistWarp session is replaced once before minting again', async () => {
    const ensureMistSession = jest.fn(async () => 'session');
    const dropMistSession = jest.fn();
    const mint = jest.fn()
        .mockRejectedValueOnce(Object.assign(new Error('not authenticated'), {status: 401}))
        .mockResolvedValueOnce({token: 't', expiresAt: 1});
    await expect(mintEditorSession({ensureMistSession, dropMistSession, mint})).resolves.toEqual({token: 't', expiresAt: 1});
    expect(dropMistSession).toHaveBeenCalledTimes(1);
    expect(ensureMistSession).toHaveBeenCalledTimes(2);

    const limited = jest.fn().mockRejectedValue(Object.assign(new Error('Too many'), {status: 429}));
    await expect(mintEditorSession({ensureMistSession, dropMistSession, mint: limited})).rejects.toThrow('Too many');
    expect(limited).toHaveBeenCalledTimes(1);

    const revoked = jest.fn().mockRejectedValue(Object.assign(new Error('not authenticated'), {status: 401}));
    await expect(mintEditorSession({ensureMistSession, dropMistSession, mint: revoked})).rejects.toThrow();
    expect(revoked).toHaveBeenCalledTimes(2);
});

test('a token the API really rejects is replaced straight away', async () => {
    const rejected = new Set();
    const tokenRejected = jest.fn(async token => rejected.has(token));
    const {send, deps} = setup(undefined, {tokenRejected});
    await send('editorSession');
    expect((await send('editorSession', {stale: 'editor-token'})).result.token).toBe('editor-token');
    expect(tokenRejected).toHaveBeenCalledTimes(1);
    clock += 10000;
    rejected.add('editor-token');
    expect((await send('editorSession', {stale: 'editor-token'})).result.token).toBe('editor-token-2');
    expect(deps.createEditorSession).toHaveBeenCalledTimes(2);
});

test('stale reports check the token at most every ten seconds', async () => {
    const tokenRejected = jest.fn(async () => false);
    const {send, deps} = setup(undefined, {tokenRejected});
    await send('editorSession');
    for (let i = 0; i < 20; i++) await send('editorSession', {stale: 'editor-token'});
    expect(tokenRejected).toHaveBeenCalledTimes(1);
    expect((await send('editorSession', {stale: 'not-the-token'})).result.token).toBe('editor-token');
    expect(tokenRejected).toHaveBeenCalledTimes(1);
    expect(deps.createEditorSession).toHaveBeenCalledTimes(1);
});
