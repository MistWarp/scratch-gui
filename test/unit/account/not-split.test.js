jest.mock('../../../src/lib/account/origins.js', () => ({
    ACCOUNT_ORIGIN: 'https://mistwarp.org',
    EDITOR_ORIGIN: 'https://editor.mistwarp.org',
    isSplitEditor: () => false,
    isEditorOrigin: () => false
}));

const mockBridge = {
    connect: jest.fn(),
    call: jest.fn(),
    getIdentity: jest.fn(() => ({status: 'idle', user: null})),
    subscribeIdentity: jest.fn(() => () => {})
};
jest.mock('../../../src/lib/account/bridge.js', () => mockBridge);

const identity = require('../../../src/lib/rotur/identity.js');
const {loadSession, storeSession} = require('../../../src/lib/community/api.js');

test('on the account origin nothing uses the account frame', async () => {
    localStorage.setItem('mw:mistwarp-session', 'full-session');
    expect(loadSession()).toBe('full-session');
    await identity.restore().catch(() => null);
    identity.logout();
    storeSession(null);
    expect(mockBridge.connect).not.toHaveBeenCalled();
    expect(mockBridge.call).not.toHaveBeenCalled();
    expect(mockBridge.subscribeIdentity).not.toHaveBeenCalled();
});
