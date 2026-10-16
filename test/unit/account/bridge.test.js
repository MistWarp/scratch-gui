jest.mock('../../../src/lib/account/origins.js', () => ({
    ACCOUNT_ORIGIN: 'https://mistwarp.org',
    EDITOR_ORIGIN: 'https://editor.mistwarp.org',
    isSplitEditor: () => true,
    isEditorOrigin: () => true
}));

global.MessageChannel = global.MessageChannel || require('worker_threads').MessageChannel;

const loadBridge = () => {
    let bridge;
    jest.isolateModules(() => {
        bridge = require('../../../src/lib/account/bridge.js');
    });
    return bridge;
};

const openPorts = [];

const accountFrames = () => [...document.querySelectorAll('iframe')]
    .filter(frame => frame.src.startsWith('https://mistwarp.org/'));

const fireLoad = frame => {
    let transferred = null;
    frame.contentWindow.postMessage = (message, origin, transfer) => {
        transferred = {message, origin, port: transfer && transfer[0]};
    };
    frame.dispatchEvent(new Event('load'));
    if (transferred && transferred.port) openPorts.push(transferred.port);
    return transferred;
};

afterEach(() => {
    jest.useRealTimers();
    for (const frame of accountFrames()) frame.remove();
    for (const port of openPorts.splice(0)) port.close();
});

test('a frame that never connects is removed, and the next try starts fresh', async () => {
    jest.useFakeTimers();
    const bridge = loadBridge();
    const first = bridge.connect();
    expect(accountFrames()).toHaveLength(1);
    jest.advanceTimersByTime(16000);
    await expect(first).rejects.toThrow('Could not reach your MistWarp account');
    expect(accountFrames()).toHaveLength(0);
    bridge.connect().catch(() => null);
    expect(accountFrames()).toHaveLength(1);
});

test('the editor only connects to the account origin and stays hidden until asked', async () => {
    const bridge = loadBridge();
    const connecting = bridge.connect();
    const [frame] = accountFrames();
    expect(frame.getAttribute('aria-hidden')).toBe('true');
    const sent = fireLoad(frame);
    expect(sent.origin).toBe('https://mistwarp.org');
    expect(sent.message).toEqual({type: 'mw:account', kind: 'connect'});
    sent.port.postMessage({kind: 'ready', identity: {status: 'ready', user: {username: 'mist', id: 'u1'}}});
    await connecting;
    expect(bridge.getIdentity().user.username).toBe('mist');
    sent.port.postMessage({kind: 'show'});
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(frame.getAttribute('aria-hidden')).toBe('false');
    expect(frame.style.position).toBe('fixed');
});

test('a reload hides the frame and fails calls that were waiting on the old one', async () => {
    const bridge = loadBridge();
    const connecting = bridge.connect();
    const [frame] = accountFrames();
    const first = fireLoad(frame);
    first.port.postMessage({kind: 'ready', identity: {status: 'idle', user: null}});
    await connecting;
    first.port.postMessage({kind: 'show'});
    await new Promise(resolve => setTimeout(resolve, 0));
    const waiting = bridge.call('identity');
    await new Promise(resolve => setTimeout(resolve, 0));
    fireLoad(frame);
    await expect(waiting).rejects.toThrow('reloaded');
    expect(frame.getAttribute('aria-hidden')).toBe('true');
});
