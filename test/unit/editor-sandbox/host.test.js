import {mountEditorHost} from '../../../src/lib/editor-sandbox/host';
import {CHANNEL} from '../../../src/lib/editor-sandbox/protocol';
import {request, uploadXhr} from '../../../src/lib/community/api';
import {saveWorkspace} from '../../../src/lib/editor-sandbox/host-storage';
import * as identity from '../../../src/lib/rotur/identity';
import {callRotur} from '../../../src/lib/rotur/extension-bridge';

jest.mock('../../../src/lib/community/api', () => ({request: jest.fn(), uploadXhr: jest.fn()}));
jest.mock('../../../src/lib/editor-sandbox/host-storage', () => ({
    loadWorkspace: jest.fn(async () => ({local: {}, databases: []})),
    saveWorkspace: jest.fn(async () => {}),
    initialPreferences: () => ({'tw:theme': 'dark'})
}));
jest.mock('../../../src/lib/rotur/identity', () => ({
    restore: async () => ({id: 'user', username: 'person'}),
    getState: jest.fn(),
    subscribe: jest.fn(), login: jest.fn(), logout: jest.fn()
}));
jest.mock('../../../src/lib/rotur/extension-bridge', () => ({callRotur: jest.fn(async () => 'value')}));
jest.mock('../../../src/lib/rotur/client', () => ({ensureScopes: jest.fn(async () => {})}));

let channels;
let frame;
let port;
const tick = () => new Promise(resolve => setTimeout(resolve, 0));
const send = async (method, args) => {
    port.onmessage({data: {id: 1, method, args}});
    await tick();
};
beforeEach(async () => {
    jest.clearAllMocks();
    identity.getState.mockReturnValue({status: 'ready', user: {id: 'user', username: 'person', token: 'secret'}});
    history.replaceState(null, '', '/editor#mw-123');
    sessionStorage.setItem('mw:editor-local-scope', 'local');
    document.body.innerHTML = '<div id="app"></div>';
    channels = [];
    global.MessageChannel = class {
        constructor () {
            this.port1 = {postMessage: jest.fn(), start: jest.fn(), close: jest.fn()};
            this.port2 = {};
            channels.push(this);
        }
    };
    await mountEditorHost();
    frame = document.querySelector('iframe');
    frame.contentWindow.postMessage = jest.fn();
    window.dispatchEvent(new MessageEvent('message', {
        source: frame.contentWindow, origin: 'null', data: {type: CHANNEL, kind: 'ready'}
    }));
    port = channels[0].port1;
});

test('only connects the expected opaque frame and sends no credentials', () => {
    expect(frame.getAttribute('sandbox')).not.toContain('allow-same-origin');
    const payload = frame.contentWindow.postMessage.mock.calls[0][0];
    expect(JSON.stringify(payload)).not.toContain('secret');
    window.dispatchEvent(new MessageEvent('message', {
        source: window, origin: 'null', data: {type: CHANNEL, kind: 'ready'}
    }));
    window.dispatchEvent(new MessageEvent('message', {
        source: frame.contentWindow, origin: location.origin, data: {type: CHANNEL, kind: 'ready'}
    }));
    expect(channels).toHaveLength(1);
});

test('a forged extension request cannot access another project or export the account', async () => {
    await send('request', {path: '/projects/456/editor'});
    expect(request).not.toHaveBeenCalled();
    expect(port.postMessage).toHaveBeenCalledWith(expect.objectContaining({error: expect.any(Object)}));
    await send('request', {path: '/me/export'});
    expect(request).not.toHaveBeenCalled();
});

test('publishing waits for consent in the parent page', async () => {
    request.mockResolvedValue({ok: true});
    await send('request', {path: '/projects/123/publish', method: 'POST'});
    expect(request).not.toHaveBeenCalled();
    const dialog = document.querySelector('[role="dialog"]');
    expect(dialog.textContent).toContain('Publish project 123');
    dialog.querySelector('button:last-child').click();
    await tick();
    expect(request).toHaveBeenCalledWith('/projects/123/publish', expect.objectContaining({method: 'POST'}));
});

test('cancelling an upload never sends authenticated data', async () => {
    await send('request', {path: '/projects/123/upload', method: 'POST', form: [['project', new Blob(['test'])]]});
    document.querySelector('[role="dialog"] button').click();
    await tick();
    expect(uploadXhr).not.toHaveBeenCalled();
});

test('storage is saved under a host-selected account and project scope', async () => {
    await send('storage.local', {scope: 'other-user:private', local: {draft: 'data'}});
    expect(saveWorkspace).toHaveBeenCalledWith('user:123', expect.objectContaining({local: {draft: 'data'}}));
});

test('unknown and inherited host operations are rejected', async () => {
    await send('constructor', {});
    expect(port.postMessage).toHaveBeenCalledWith(expect.objectContaining({error: expect.any(Object)}));
    expect(request).not.toHaveBeenCalled();
});

test('Rotur method paths cannot access the credential client or inherited methods', async () => {
    await send('rotur.call', {method: 'getToken', args: []});
    expect(port.postMessage).toHaveBeenCalledWith(expect.objectContaining({error: expect.any(Object)}));
    await send('rotur.call', {method: 'me.constructor', args: []});
    expect(port.postMessage).toHaveBeenCalledTimes(2);
});

test('game data cannot target another project', async () => {
    await send('game.data', {id: 'other-project', action: 'load'});
    expect(port.postMessage).toHaveBeenCalledWith(expect.objectContaining({error: expect.any(Object)}));
});

test('changing accounts while a publish confirmation is open cancels the request', async () => {
    await send('request', {path: '/projects/123/publish', method: 'POST'});
    identity.getState.mockReturnValue({status: 'ready', user: {id: 'other', username: 'other'}});
    document.querySelector('[role="dialog"] button:last-child').click();
    await tick();
    expect(request).not.toHaveBeenCalled();
    expect(port.postMessage).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.objectContaining({message: expect.stringContaining('account changed')})
    }));
});

test('Rotur storage ignores a forged namespace and waits for parent consent', async () => {
    await send('rotur.call', {method: 'storage.get', args: ['another-app', 'key'], sensitive: false});
    expect(callRotur).not.toHaveBeenCalled();
    document.querySelector('[role="dialog"] button:last-child').click();
    await tick();
    expect(callRotur).toHaveBeenCalledWith('storage.get', ['mistwarp:editor:123', 'key']);
});

test('Rotur does not reuse consent after an account switch', async () => {
    await send('rotur.call', {method: 'me.transfer', args: ['recipient', 10]});
    identity.getState.mockReturnValue({status: 'ready', user: {id: 'other', username: 'other'}});
    document.querySelector('[role="dialog"] button:last-child').click();
    await tick();
    expect(callRotur).not.toHaveBeenCalled();
});

test('creating a project updates the outer URL and clears old restore instructions', async () => {
    history.replaceState(null, '', '/editor?restore=42&starter=old');
    request.mockResolvedValue({id: 'new-project'});
    await send('request', {path: '/projects', method: 'POST', body: {title: 'Draft'}});
    document.querySelector('[role="dialog"] button:last-child').click();
    await tick();
    expect(location.hash).toBe('#mw-new-project');
    expect(location.search).toBe('');
    expect(saveWorkspace).toHaveBeenCalledWith('user:new-project', expect.any(Object));
});

test('legacy numeric editor routes use the root runtime with the project hash', async () => {
    history.replaceState(null, '', '/123/editor');
    await mountEditorHost();
    const url = new URL(document.querySelector('iframe').src);
    expect(url.pathname).toBe('/editor-runtime.html');
    expect(url.hash).toBe('#123');
});
