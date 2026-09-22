jest.mock('../../../src/lib/community/api', () => ({request: jest.fn(() => Promise.resolve())}));

const load = () => {
    let loaded;
    jest.isolateModules(() => {
        loaded = {
            reportSiteError: require('../../../src/lib/error-reporter').reportSiteError,
            request: require('../../../src/lib/community/api').request
        };
    });
    return loaded;
};

const userAgent = jest.spyOn(window.navigator, 'userAgent', 'get');

beforeEach(() => {
    jest.clearAllMocks();
    userAgent.mockReturnValue('Mozilla/5.0 (X11; Linux x86_64) Chrome/153.0.0.0 Safari/537.36');
});

test('reports build identity and project IDs from editor hashes', async () => {
    const {reportSiteError, request} = load();
    const {BUILD_ID} = require('../../../src/lib/build-version');
    reportSiteError({message: 'Test asset failure', url: 'https://mistwarp.org/editor#mw-p123'});
    expect(request).toHaveBeenCalledWith('/errors', expect.objectContaining({body: expect.objectContaining({
        projectId: 'p123', appVersion: BUILD_ID, message: 'Test asset failure'
    })}));
    await Promise.resolve();
});

test('skips cross-origin script errors without details', () => {
    const {reportSiteError, request} = load();
    reportSiteError({message: 'Script error.', stack: ':0:0'});
    expect(request).not.toHaveBeenCalled();
});

test('skips errors thrown by browser extensions', () => {
    const {reportSiteError, request} = load();
    reportSiteError({
        message: 'Cannot read properties of undefined (reading \'M_ID\')',
        stack: 'TypeError: Cannot read properties of undefined (reading \'M_ID\')\n' +
            '    at Y (chrome-extension://eppiocemhmnlbhjplcgkofciiegomcon/executors/200.js:1:761)\n' +
            '    at E (chrome-extension://eppiocemhmnlbhjplcgkofciiegomcon/executors/200.js:1:1442)',
        kind: 'rejection'
    });
    expect(request).not.toHaveBeenCalled();
});

test('still reports site errors that pass through a browser extension', () => {
    const {reportSiteError, request} = load();
    reportSiteError({
        message: 'Site failure',
        stack: 'TypeError: Site failure\n' +
            '    at run (https://mistwarp.org/assets/api.js:1:10)\n' +
            '    at wrap (chrome-extension://abc/content.js:1:20)'
    });
    expect(request).toHaveBeenCalledTimes(1);
});

test.each([
    'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm) Chrome/136.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
])('skips reports from crawlers: %s', agent => {
    userAgent.mockReturnValue(agent);
    const {reportSiteError, request} = load();
    reportSiteError({message: 'Failed to fetch dynamically imported module: https://mistwarp.org/assets/Project-C1T5GCNh.js', kind: 'react'});
    expect(request).not.toHaveBeenCalled();
});
