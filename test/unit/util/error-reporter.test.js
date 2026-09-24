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

test('skips ReferenceErrors and SyntaxErrors thrown by JavaScript typed into a project block', () => {
    const {reportSiteError, request} = load();
    reportSiteError({
        message: 'Can\'t find variable: runtimr',
        name: 'ReferenceError',
        stack: 'gen3@\nM@https://mistwarp.org/assets/api-CDdEy8sZ.js:1340:43\nstepThread@https://mistwarp.org/assets/api-CDdEy8sZ.js:1487:12988'
    });
    reportSiteError({
        message: 'Unexpected identifier \'repeat\'',
        name: 'SyntaxError',
        stack: 'SyntaxError: Unexpected identifier \'repeat\'\n    at executeBlock (eval at F (https://mistwarp.org/assets/api.js:1340:234), <anonymous>:99:54)\n    at _.stepThread (https://mistwarp.org/assets/api.js:1487:12987)'
    });
    expect(request).not.toHaveBeenCalled();
});

test.each([
    ['ReferenceError', 'foo is not defined', 'ReferenceError: foo is not defined\n    at render (https://mistwarp.org/assets/app.js:1:10)'],
    ['TypeError', 'Cannot read properties of undefined (reading \'getFenceBounds\')', 'TypeError: Cannot read properties of undefined (reading \'getFenceBounds\')\n    at Oe.getFencedPositionOfDrawable (https://mistwarp.org/assets/api.js:2789:22012)\n    at _.stepThread (https://mistwarp.org/assets/api.js:1487:12987)']
])('still reports %s from MistWarp code', (name, message, stack) => {
    const {reportSiteError, request} = load();
    reportSiteError({message, name, stack});
    expect(request).toHaveBeenCalledTimes(1);
});

test.each([
    ['NotAllowedError', 'The request is not allowed by the user agent or the platform in the current context, possibly because the user denied permission.'],
    ['NetworkError', 'A network error occurred.']
])('skips browser refusals: %s', (name, message) => {
    const {reportSiteError, request} = load();
    reportSiteError({message, name, stack: `${name}: ${message}`, kind: 'rejection'});
    expect(request).not.toHaveBeenCalled();
});
