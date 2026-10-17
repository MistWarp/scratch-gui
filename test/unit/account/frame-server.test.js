import {createFrameServer, EDITOR_ROTUR_METHODS} from '../../../src/lib/account/frame-server.js';

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

const setup = (user = {username: 'mist', id: 'u1', bio: 'hi', avatarUrl: 'x'}, {signOutAnswer = true} = {}) => {
    const identity = createIdentity(user);
    let minted = 0;
    const deps = {
        identity,
        now: () => clock,
        confirmSignOut: jest.fn(async () => signOutAnswer),
        createEditorSession: jest.fn(async () => {
            minted += 1;
            return {
                token: minted === 1 ? 'editor-token' : `editor-token-${minted}`,
                expiresAt: clock + 7200000,
                extra: 'dropped'
            };
        }),
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
    return {deps, identity, port, send};
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
