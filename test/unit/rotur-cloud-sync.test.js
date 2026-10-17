const mockRequests = [];
let mockCloud = null;

jest.mock('../../src/lib/community/api.js', () => ({
    loadSession: () => 'session',
    request: jest.fn((path, options = {}) => {
        mockRequests.push({path, method: options.method || 'GET', body: options.body});
        if ((options.method || 'GET') === 'PUT') {
            mockCloud = JSON.parse(JSON.stringify(options.body));
            return Promise.resolve({ok: true});
        }
        return Promise.resolve({ok: true, settings: mockCloud});
    })
}));

const {mergeSnapshot, notifyLocalChange, onRoturLogin} = require('../../src/lib/rotur/cloud-sync.js');

const settle = async () => {
    for (let i = 0; i < 20; i++) await Promise.resolve();
};

const flush = async () => {
    jest.advanceTimersByTime(1000);
    for (let i = 0; i < 5; i++) await settle();
    jest.runOnlyPendingTimers();
    await settle();
};

const local = {
    theme: {gui: 'dark', accent: 'red'},
    customThemes: [{name: 'Local'}],
    settings: {
        rotur: {presenceEnabled: false},
        menuBar: {text: 'icons'},
        notificationPreferences: {comments: false},
        username: 'local-name',
        version: 1,
        updatedAt: 2
    }
};

const cloud = {
    theme: {gui: 'light', accent: 'blue'},
    customThemes: [{name: 'Cloud'}],
    settings: {
        rotur: {presenceEnabled: true},
        menuBar: {text: 'auto'},
        notificationPreferences: {comments: true},
        version: 1,
        updatedAt: 1
    }
};

beforeEach(() => {
    jest.useFakeTimers();
    localStorage.clear();
    mockRequests.length = 0;
    mockCloud = JSON.parse(JSON.stringify(cloud));
});

afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
});

test('only the sections that changed here replace the cloud copy', () => {
    const merged = mergeSnapshot(cloud, local, ['theme', 'rotur']);
    expect(merged.theme).toEqual(local.theme);
    expect(merged.customThemes).toEqual(cloud.customThemes);
    expect(merged.settings.rotur).toEqual(local.settings.rotur);
    expect(merged.settings.menuBar).toEqual(cloud.settings.menuBar);
    expect(merged.settings.notificationPreferences).toEqual(cloud.settings.notificationPreferences);
    expect(merged.settings.username).toBeUndefined();
    expect(merged.settings.updatedAt).toBe(2);
});

test('an unknown change or an empty cloud sends everything', () => {
    expect(mergeSnapshot(cloud, local, 'all')).toBe(local);
    expect(mergeSnapshot(null, local, ['theme'])).toBe(local);
    expect(mergeSnapshot({}, local, ['theme'])).toBe(local);
});

test('the username section follows the local override', () => {
    expect(mergeSnapshot(cloud, local, ['username']).settings.username).toBe('local-name');
    const cleared = {...local, settings: {...local.settings}};
    delete cleared.settings.username;
    expect(mergeSnapshot({...cloud, settings: {...cloud.settings, username: 'old'}}, cleared, ['username'])
        .settings.username).toBeUndefined();
});

test('a theme change on one site does not undo another site\'s menu bar change', async () => {
    mockCloud.settings.menuBar = {text: 'labels'};
    localStorage.setItem('tw:theme', JSON.stringify({gui: 'dark'}));
    localStorage.setItem('mw:menu-bar-text', 'auto');
    notifyLocalChange('theme');
    await flush();
    const put = mockRequests.find(request => request.method === 'PUT');
    expect(put.body.theme).toEqual({gui: 'dark'});
    expect(put.body.settings.menuBar).toEqual({text: 'labels'});
    expect(mockRequests[0].method).toBe('GET');
    expect(localStorage.getItem('tw:settings-dirty')).toBeNull();
});

test('changes without a named section still push everything', async () => {
    localStorage.setItem('tw:theme', JSON.stringify({gui: 'dark'}));
    notifyLocalChange();
    await flush();
    expect(mockRequests.map(request => request.method)).toEqual(['PUT']);
    expect(mockRequests[0].body.theme).toEqual({gui: 'dark'});
});

test('an old dirty flag from before this change pushes everything at sign-in', async () => {
    localStorage.setItem('tw:settings-dirty', '1');
    localStorage.setItem('tw:theme', JSON.stringify({gui: 'dark'}));
    await onRoturLogin();
    await flush();
    expect(mockRequests.filter(request => request.method === 'PUT')[0].body.theme).toEqual({gui: 'dark'});
});

test('a sign-in with a pending section change keeps the rest of the cloud copy', async () => {
    localStorage.setItem('tw:settings-dirty', JSON.stringify(['notificationPreferences']));
    localStorage.setItem('mw:notification-preferences', JSON.stringify({comments: false}));
    localStorage.setItem('tw:theme', JSON.stringify({gui: 'stale'}));
    await onRoturLogin();
    await flush();
    const put = mockRequests.filter(request => request.method === 'PUT')[0];
    expect(put.body.settings.notificationPreferences).toEqual({comments: false});
    expect(put.body.theme).toEqual(cloud.theme);
    expect(JSON.parse(localStorage.getItem('tw:theme'))).toEqual(cloud.theme);
});
