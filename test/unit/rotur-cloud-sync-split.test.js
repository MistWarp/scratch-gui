const mockRequests = [];
let mockCloud = null;
let mockToken = null;
let mockUser = {username: 'mist'};

jest.mock('../../src/lib/account/origins.js', () => ({
    isSplitEditor: () => true
}));

jest.mock('../../src/lib/account/bridge.js', () => ({
    getIdentity: () => ({status: mockUser ? 'ready' : 'idle', user: mockUser})
}));

jest.mock('../../src/lib/community/api.js', () => ({
    loadSession: () => mockToken,
    request: jest.fn((path, options = {}) => {
        const method = options.method || 'GET';
        mockRequests.push({path, method, body: options.body});
        mockToken = 'renewed-editor-token';
        if (method === 'PUT') {
            mockCloud = JSON.parse(JSON.stringify(options.body));
            return Promise.resolve({ok: true});
        }
        return Promise.resolve({ok: true, settings: JSON.parse(JSON.stringify(mockCloud))});
    })
}));

const {notifyLocalChange} = require('../../src/lib/rotur/cloud-sync.js');

const settle = async () => {
    for (let i = 0; i < 20; i++) await Promise.resolve();
};

const flush = async () => {
    jest.advanceTimersByTime(1000);
    for (let i = 0; i < 5; i++) await settle();
    jest.runOnlyPendingTimers();
    await settle();
};

const puts = () => mockRequests.filter(request => request.method === 'PUT');

beforeEach(() => {
    jest.useFakeTimers();
    localStorage.clear();
    mockRequests.length = 0;
    mockToken = null;
    mockUser = {username: 'mist'};
    mockCloud = {
        theme: {gui: 'light'},
        customThemes: [],
        settings: {menuBar: {text: 'auto'}, version: 1, updatedAt: 1}
    };
});

afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
});

test('a change in the split editor is kept while its editor token is being renewed', async () => {
    localStorage.setItem('tw:theme', JSON.stringify({gui: 'dark'}));
    notifyLocalChange('theme');
    await flush();
    expect(puts()).toHaveLength(1);
    expect(puts()[0].body.theme).toEqual({gui: 'dark'});
    expect(localStorage.getItem('tw:settings-dirty')).toBeNull();

    mockToken = null;
    localStorage.setItem('mw:menu-bar-text', 'dark');
    notifyLocalChange('menuBar.text');
    await flush();
    expect(puts()).toHaveLength(2);
    expect(puts()[1].body.theme).toEqual({gui: 'dark'});
    expect(puts()[1].body.settings.menuBar.text).toBe('dark');
    expect(JSON.parse(localStorage.getItem('tw:theme'))).toEqual({gui: 'dark'});
});

test('the split editor does not mark or push changes while signed out of the account', async () => {
    mockUser = null;
    mockToken = 'leftover-token';
    localStorage.setItem('tw:theme', JSON.stringify({gui: 'dark'}));
    notifyLocalChange('theme');
    await flush();
    expect(mockRequests).toHaveLength(0);
    expect(localStorage.getItem('tw:settings-dirty')).toBeNull();
});
