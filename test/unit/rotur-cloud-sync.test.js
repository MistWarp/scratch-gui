const mockRequests = [];
let mockCloud = null;
let mockSession = 'session';
const mockHolds = {};

jest.mock('../../src/lib/community/api.js', () => ({
    loadSession: () => mockSession,
    request: jest.fn((path, options = {}) => {
        const method = options.method || 'GET';
        mockRequests.push({path, method, body: options.body, cache: options.cache});
        const respond = () => {
            if (mockHolds.fail === method) return Promise.reject(new Error('offline'));
            if (method === 'PUT') {
                mockCloud = JSON.parse(JSON.stringify(options.body));
                return Promise.resolve({ok: true});
            }
            return Promise.resolve({ok: true, settings: JSON.parse(JSON.stringify(mockCloud))});
        };
        if (mockHolds[method]) {
            return new Promise(resolve => {
                mockHolds[method] = () => resolve(respond());
            });
        }
        return respond();
    })
}));

const {
    mergeSnapshot,
    notifyLocalChange,
    onRoturLogin,
    onRoturLogout
} = require('../../src/lib/rotur/cloud-sync.js');

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

const puts = () => mockRequests.filter(request => request.method === 'PUT');

const hold = method => {
    mockHolds[method] = true;
};

const release = async method => {
    const resume = mockHolds[method];
    delete mockHolds[method];
    resume();
    await settle();
};

beforeEach(() => {
    jest.useFakeTimers();
    localStorage.clear();
    mockRequests.length = 0;
    mockSession = 'session';
    for (const key of Object.keys(mockHolds)) delete mockHolds[key];
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
    localStorage.setItem('tw:settings-dirty', JSON.stringify({notificationPreferences: 'a'}));
    localStorage.setItem('mw:notification-preferences', JSON.stringify({comments: false}));
    localStorage.setItem('tw:theme', JSON.stringify({gui: 'stale'}));
    const result = await onRoturLogin();
    await flush();
    const put = puts()[0];
    expect(put.body.settings.notificationPreferences).toEqual({comments: false});
    expect(put.body.theme).toEqual(cloud.theme);
    expect(JSON.parse(localStorage.getItem('tw:theme'))).toEqual(cloud.theme);
    expect(result.applied).toBe(true);
});

test('sign-in reads the cloud copy past the request cache', async () => {
    await onRoturLogin();
    expect(mockRequests[0]).toMatchObject({method: 'GET', cache: false});
});

test('a change made while a push is in flight is kept and pushed next', async () => {
    localStorage.setItem('mw:menu-bar-text', 'dark');
    notifyLocalChange('menuBar.text');
    hold('PUT');
    jest.advanceTimersByTime(1000);
    await settle();
    expect(puts()).toHaveLength(1);

    localStorage.setItem('mw:accent-menu-bar', 'false');
    notifyLocalChange('menuBar.accent');
    await release('PUT');
    await settle();

    expect(localStorage.getItem('mw:accent-menu-bar')).toBe('false');
    expect(Object.keys(JSON.parse(localStorage.getItem('tw:settings-dirty')))).toEqual(['menuBar.accent']);

    await flush();
    expect(puts()).toHaveLength(2);
    expect(puts()[1].body.settings.menuBar).toMatchObject({text: 'dark', accent: false});
    expect(localStorage.getItem('tw:settings-dirty')).toBeNull();
});

test('a change made while the cloud copy is loading goes into the same push', async () => {
    localStorage.setItem('mw:menu-bar-text', 'dark');
    notifyLocalChange('menuBar.text');
    hold('GET');
    jest.advanceTimersByTime(1000);
    await settle();

    localStorage.setItem('mw:notification-preferences', JSON.stringify({comments: false}));
    notifyLocalChange('notificationPreferences');
    await release('GET');
    await settle();

    expect(puts()).toHaveLength(1);
    expect(puts()[0].body.settings.notificationPreferences).toEqual({comments: false});
    expect(JSON.parse(localStorage.getItem('mw:notification-preferences'))).toEqual({comments: false});
    await flush();
    expect(puts()).toHaveLength(1);
});

test('a menu bar change on one site keeps the menu bar order set on the other', async () => {
    mockCloud.settings.menuBar = {order: {left: ['file', 'edit']}, hidden: ['tutorials'], accent: true};
    localStorage.setItem('mw:menu-bar-order-v7', JSON.stringify({left: ['edit']}));
    localStorage.setItem('mw:accent-menu-bar', 'false');
    notifyLocalChange('menuBar.accent');
    await flush();
    expect(puts()[0].body.settings.menuBar).toEqual({
        order: {left: ['file', 'edit']},
        hidden: ['tutorials'],
        accent: false
    });
});

test('a cloud copy without themes does not delete the local ones', async () => {
    delete mockCloud.theme;
    delete mockCloud.customThemes;
    localStorage.setItem('tw:theme', JSON.stringify({gui: 'dark'}));
    localStorage.setItem('tw:custom-themes', JSON.stringify([{name: 'Mine'}]));
    notifyLocalChange('notificationPreferences');
    await flush();
    expect(puts()[0].body.customThemes).toEqual([{name: 'Mine'}]);
    expect(JSON.parse(localStorage.getItem('tw:custom-themes'))).toEqual([{name: 'Mine'}]);
    expect(JSON.parse(localStorage.getItem('tw:theme'))).toEqual({gui: 'dark'});
});

test('a push with nothing left to send does not write the cloud copy back', async () => {
    localStorage.setItem('tw:theme', JSON.stringify({gui: 'dark'}));
    notifyLocalChange('theme');
    await onRoturLogin();
    await settle();
    expect(puts()).toHaveLength(1);
    await flush();
    expect(puts()).toHaveLength(1);
});

test('a failed read of the cloud copy keeps the change for later', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    mockHolds.fail = 'GET';
    notifyLocalChange('theme');
    await flush();
    expect(puts()).toHaveLength(0);
    expect(Object.keys(JSON.parse(localStorage.getItem('tw:settings-dirty')))).toEqual(['theme']);
    console.warn.mockRestore();
});

test('signing out while a push is in flight does not bring the cloud copy back', async () => {
    mockCloud.settings.username = 'cloud-name';
    notifyLocalChange('theme');
    hold('PUT');
    jest.advanceTimersByTime(1000);
    await settle();
    mockSession = null;
    onRoturLogout();
    await release('PUT');
    await settle();
    expect(localStorage.getItem('tw:username-override')).toBeNull();
});
