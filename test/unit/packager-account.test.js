import {createAccountHost, accountExtensionsUsed} from '../../src/packager/scaffolding/account-host';
import {createMemoryStorage, installBrowserStorage} from '../../src/packager/scaffolding/browser-storage';

jest.mock('rotur-sdk', () => ({Rotur: jest.fn()}));
jest.mock('scratch-vm/src/extensions/rotur/core', () => ({scopesUsedByProject: () => ['storage:view']}));

const runtimeFor = opcode => ({
    targets: [{blocks: {_blocks: {a: {opcode}}}}],
    ioDevices: {userData: {postData: jest.fn()}}
});
const client = () => ({login: jest.fn().mockResolvedValue(), me: {get: jest.fn().mockResolvedValue({username: 'player', id: 42})}});
afterEach(() => { document.body.innerHTML = ''; localStorage.clear(); jest.restoreAllMocks(); });

test('ordinary projects run without Rotur login', async () => {
    const sdk = client();
    const runtime = runtimeFor('motion_movesteps');
    await createAccountHost(runtime, {}, function () { return sdk; }).prepare();
    expect(accountExtensionsUsed(runtime)).toEqual([]);
    expect(sdk.login).not.toHaveBeenCalled();
    expect(document.querySelector('button')).toBeNull();
});

test('account projects wait for verified login and expose identity to both extension hosts', async () => {
    const sdk = client();
    const runtime = runtimeFor('mistwarpData_load');
    const host = createAccountHost(runtime, {title: 'Example'}, function () { return sdk; });
    let started = false;
    const ready = host.prepare().then(() => { started = true; });
    await Promise.resolve();
    expect(started).toBe(false);
    expect(sdk.login).not.toHaveBeenCalled();
    await document.querySelector('button').onclick();
    await ready;
    expect(runtime.roturHost.getUser()).toEqual({loggedIn: true, username: 'player', id: '42'});
    expect(runtime.mistwarpGameHost.getUser()).toEqual(runtime.roturHost.getUser());
    expect(runtime.ioDevices.userData.postData).toHaveBeenCalledWith({username: 'player'});
    expect(localStorage.length).toBe(0);
    await expect(runtime.roturHost.call('constructor.constructor', [])).rejects.toThrow('Invalid Rotur method');
});

test('failed authentication keeps project gated and permits retry', async () => {
    const sdk = client();
    sdk.login.mockRejectedValueOnce(new Error('Login cancelled'));
    const runtime = runtimeFor('rotur_username');
    const host = createAccountHost(runtime, {}, function () { return sdk; });
    let started = false;
    const ready = host.prepare().then(() => { started = true; });
    const button = document.querySelector('button');
    await button.onclick();
    expect(started).toBe(false);
    expect(runtime.roturHost.getUser().loggedIn).toBe(false);
    expect(button.disabled).toBe(false);
    await button.onclick();
    await ready;
    expect(started).toBe(true);
});

test('published game data uses a player capability and the authenticated session', async () => {
    const sdk = client();
    sdk.validators = {generate: jest.fn().mockResolvedValue({validator: 'validation-fixture'})};
    const replies = [{token: 'session-fixture'}, {capability: 'play-fixture', expiresAt: Date.now() + 60000},
        {save: {revision: 1, value: {level: 2}}}];
    const originalFetch = global.fetch;
    global.fetch = jest.fn(async () => ({ok: true, json: async () => replies.shift()}));
    try {
        const runtime = runtimeFor('mistwarpData_load');
        const host = createAccountHost(runtime, {projectId: '123'}, function () { return sdk; });
        const ready = host.prepare();
        await document.querySelector('button').onclick();
        await ready;
        const save = await runtime.mistwarpGameHost.call('data.load');
        expect(save.value.level).toBe(2);
        expect(global.fetch.mock.calls[1][1].body).toBe(JSON.stringify({context: 'play'}));
        expect(global.fetch.mock.calls[2][1].headers).toMatchObject({
            Authorization: 'Bearer session-fixture', 'X-MistWarp-Game-Data': 'play-fixture'
        });
        expect(runtime.mistwarpGameHost.getUser()).not.toHaveProperty('token');
    } finally {
        global.fetch = originalFetch;
    }
});

test('sensitive Rotur actions retain a separate confirmation after login', async () => {
    const sdk = client();
    sdk.me.transfer = jest.fn();
    const runtime = runtimeFor('roturEconomy_transfer');
    const host = createAccountHost(runtime, {}, function () { return sdk; });
    const ready = host.prepare();
    await document.querySelector('button').onclick();
    await ready;
    jest.spyOn(window, 'confirm').mockReturnValue(false);
    await expect(runtime.roturHost.call('me.transfer', ['someone', 5], {sensitive: true}))
        .rejects.toThrow('cancelled');
    expect(sdk.me.transfer).not.toHaveBeenCalled();
});

test('preview storage supports browser storage methods and property access without sharing data', () => {
    const first = createMemoryStorage();
    const second = createMemoryStorage();
    first.setItem('a', 1);
    first.b = 2;
    expect(first.a).toBe('1');
    expect(first.getItem('b')).toBe('2');
    expect(Object.keys(first)).toEqual(['a', 'b']);
    expect(first.length).toBe(2);
    expect(second.getItem('a')).toBeNull();
    delete first.a;
    expect(first.key(0)).toBe('b');
    first.clear();
    expect(first.length).toBe(0);
});

test('opaque previews receive isolated storage while normal browser storage stays intact', () => {
    const target = {};
    for (const name of ['localStorage', 'sessionStorage', 'indexedDB']) {
        Object.defineProperty(target, name, {configurable: true, get () { throw new Error('SecurityError'); }});
    }
    installBrowserStorage(target);
    target.sessionStorage.setItem('boot', 'ok');
    expect(target.sessionStorage.getItem('boot')).toBe('ok');
    expect(target.localStorage.getItem('boot')).toBeNull();
    expect(typeof target.indexedDB.open).toBe('function');
    const existing = target.localStorage;
    installBrowserStorage(target);
    expect(target.localStorage).toBe(existing);
});
