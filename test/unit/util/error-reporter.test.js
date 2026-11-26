/** @jest-environment-options {"url": "https://mistwarp.org/editor"} */

const load = () => {
    let loaded;
    jest.isolateModules(() => {
        loaded = {
            reportSiteError: require('../../../src/lib/error-reporter').reportSiteError,
            request: global.fetch
        };
    });
    return loaded;
};

const userAgent = jest.spyOn(window.navigator, 'userAgent', 'get');

beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn(() => Promise.resolve({}));
    userAgent.mockReturnValue('Mozilla/5.0 (X11; Linux x86_64) Chrome/153.0.0.0 Safari/537.36');
});

test('reports the build without the project, query or account', async () => {
    const {reportSiteError, request} = load();
    const {BUILD_ID} = require('../../../src/lib/build-version');
    reportSiteError({message: 'Test asset failure', url: 'https://mistwarp.org/editor?token=x#mw-p123'});
    expect(request).toHaveBeenCalledWith('https://api.mistwarp.org/v1/errors', expect.objectContaining({
        method: 'POST', credentials: 'omit'
    }));
    const options = request.mock.calls[0][1];
    expect(options.headers).toEqual({'Content-Type': 'application/json'});
    const body = JSON.parse(options.body);
    expect(body).toEqual(expect.objectContaining({
        appVersion: BUILD_ID, message: 'Test asset failure', url: 'https://mistwarp.org/editor'
    }));
    expect(body).not.toHaveProperty('projectId');
    await Promise.resolve();
});

test('a report that never answers stops blocking later reports', async () => {
    jest.useFakeTimers();
    const {reportSiteError, request} = load();
    request.mockImplementation((url, options) => new Promise((resolve, reject) => {
        options.signal.addEventListener('abort', () => reject(new Error('aborted')));
    }));
    reportSiteError({message: 'First hanging report'});
    reportSiteError({message: 'Second report while busy'});
    expect(request).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(8000);
    await Promise.resolve();
    await Promise.resolve();
    reportSiteError({message: 'Third report after the timeout'});
    expect(request).toHaveBeenCalledTimes(2);
    jest.useRealTimers();
});

test('skips cross-origin script errors without details', () => {
    const {reportSiteError, request} = load();
    reportSiteError({message: 'Script error.', stack: ':0:0'});
    expect(request).not.toHaveBeenCalled();
});

test.each(['unsandboxed is not defined', 'ReferenceError: unsandboxed is not defined',
    "Can't find variable: unsandboxed"])(
    'skips external extension error: %s', message => {
        const {reportSiteError, request} = load();
        reportSiteError({message, stack: 'ReferenceError: unsandboxed is not defined\n    at hyperSense.js:900:1'});
        expect(request).not.toHaveBeenCalled();
    }
);

test.each(['Error: Script error.', 'Uncaught Error: Script error.', 'Error: Error: Script error.'])(
    'skips wrapped cross-origin script errors: %s', message => {
        const {reportSiteError, request} = load();
        reportSiteError({message, stack: message, kind: 'react'});
        expect(request).not.toHaveBeenCalled();
    }
);

test.each([
    'Error: Uncaught Error: This extension must run unsandboxed.',
    'Error: Error: Popup Phoenix must run unsandboxed!',
    'Error: Uncaught Error: AKL requires an unsandboxed extension environment.',
    'Error: Uncaught Error: La extensión s32 necesita ejecutarse sin sandbox (unsandboxed) para poder recibir mensajes.',
    'Error: Uncaught TypeError: Cannot read properties of undefined (reading \'runtime\')'
])('skips errors relayed from sandboxed extensions: %s', message => {
    const {reportSiteError, request} = load();
    reportSiteError({message, stack: message, kind: 'rejection'});
    expect(request).not.toHaveBeenCalled();
});

test.each([
    'Script error in the project player',
    'Error: Could not load the project script.'
])('still reports MistWarp errors that mention scripts: %s', message => {
    const {reportSiteError, request} = load();
    reportSiteError({message, stack: `Error: ${message}\n    at run (https://mistwarp.org/assets/api.js:1:10)`});
    expect(request).toHaveBeenCalledTimes(1);
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

test.each([
    ['AbortError', 'The operation was aborted.', 'rejection', ''],
    ['NotSupportedError', 'The browser failed to lock the pointer.', 'rejection', ''],
    ['TypeError', 'undefined is not an object (evaluating \'window.ethereum.selectedAddress = undefined\')', 'uncaught',
        'global code@https://mistwarp.org/editor:1:16'],
    ['ReferenceError', 'Can\'t find variable: EmptyRanges', 'uncaught', 'played@\nsyncControl@\nhandleEvent@'],
    [undefined, 'Unhandled promise rejection', 'rejection', '']
])('skips errors raised outside MistWarp: %s %s', (name, message, kind, stack) => {
    const {reportSiteError, request} = load();
    reportSiteError({message, name, kind, stack});
    expect(request).not.toHaveBeenCalled();
});

test('skips React losing track of nodes only on a machine translated page', () => {
    const message = 'Failed to execute \'removeChild\' on \'Node\': The node to be removed is not a child of this node.';
    const stack = `NotFoundError: ${message}\n    at mf (https://mistwarp.org/assets/app-target.js:42:79383)`;
    let loaded = load();
    loaded.reportSiteError({message, name: 'NotFoundError', stack, kind: 'rejection'});
    expect(loaded.request).toHaveBeenCalledTimes(1);
    document.documentElement.classList.add('translated-ltr');
    try {
        jest.clearAllMocks();
        loaded = load();
        loaded.reportSiteError({message, name: 'NotFoundError', stack, kind: 'rejection'});
        expect(loaded.request).not.toHaveBeenCalled();
    } finally {
        document.documentElement.classList.remove('translated-ltr');
    }
});

test.each([
    'TypeError: Failed to fetch\n    at https://mistwarp.org/editor:20:3585\n    at https://mistwarp.org/editor:20:3016\n    at Object.next (https://mistwarp.org/editor:20:3121)',
    '@https://mistwarp.org/editor:17:6302'
])('skips errors from scripts injected into the page: %s', stack => {
    const {reportSiteError, request} = load();
    reportSiteError({message: 'Failed to fetch', stack, kind: 'rejection'});
    expect(request).not.toHaveBeenCalled();
});

test('still reports errors whose stack reaches a MistWarp bundle', () => {
    const {reportSiteError, request} = load();
    reportSiteError({
        message: 'Failed to fetch',
        stack: 'TypeError: Failed to fetch\n    at https://mistwarp.org/editor:20:3585\n    at load (https://mistwarp.org/assets/api-Dkeazk7Z.js:1:2)',
        kind: 'rejection'
    });
    expect(request).toHaveBeenCalledTimes(1);
});

test('skips reports from hosts other than mistwarp.org', () => {
    const {reportSiteError, request} = load();
    window.history.replaceState(null, '', '/editor');
    const spy = jest.spyOn(window, 'location', 'get');
    spy.mockReturnValue({hostname: 'editor.turboshare.org.uk', host: 'editor.turboshare.org.uk', href: 'https://editor.turboshare.org.uk/editor'});
    reportSiteError({message: 'Off site failure'});
    spy.mockRestore();
    expect(request).not.toHaveBeenCalled();
});

test('scrubs identifying paths, tokens, data URIs and emails before sending', () => {
    const {reportSiteError, request} = load();
    reportSiteError({
        message: 'Failed for alice@example.com with Bearer secret.tok at https://mistwarp.org/users/alice?k=1 and data:application/javascript,console.log(1)',
        stack: 'Error: boom\n    at save (https://user:pass@mistwarp.org/project/proj99/pulls/4?token=abc:12:34)',
        url: 'https://mistwarp.org/project/proj99/pulls/4?k=secret#top'
    });
    expect(request).toHaveBeenCalledTimes(1);
    const body = JSON.parse(request.mock.calls[0][1].body);
    expect(body.url).toBe('https://mistwarp.org/project/:id/pulls/:id');
    expect(body.message).toContain('[email]');
    expect(body.message).toContain('Bearer [redacted]');
    expect(body.message).toContain('https://mistwarp.org/users/:id');
    expect(body.message).toContain('data:[redacted]');
    expect(body.message).not.toContain('alice');
    expect(body.message).not.toContain('secret.tok');
    expect(body.message).not.toContain('console.log');
    expect(body.stack).toContain('https://mistwarp.org/project/:id/pulls/4:12:34');
    expect(body.stack).not.toContain('user:pass');
    expect(body.stack).not.toContain('proj99');
    expect(body.stack).not.toContain('token=abc');
});

test('reportActionableError sends 5xx API failures anonymously with scrubbed routes', () => {
    let reportActionableError;
    let request;
    jest.isolateModules(() => {
        ({reportActionableError} = require('../../../src/lib/error-reporter'));
        request = global.fetch;
    });
    const error = Object.assign(new Error('MistWarp is having trouble right now.'), {
        status: 500,
        code: 'storage_write_failed',
        serverMessage: 'Failed writing for alice in proj99'
    });
    expect(reportActionableError(error, {context: 'api', method: 'POST', path: '/projects/proj99/upload?k=secret'})).toBe(true);
    expect(reportActionableError(error, {context: 'save'})).toBe(false);
    expect(request).toHaveBeenCalledTimes(1);
    const [url, options] = request.mock.calls[0];
    expect(url).toBe('https://api.mistwarp.org/v1/errors');
    expect(options.credentials).toBe('omit');
    expect(options.headers).toEqual({'Content-Type': 'application/json'});
    const body = JSON.parse(options.body);
    expect(body.kind).toBe('manual');
    expect(body.message).toBe('[api] POST /projects/:id/upload -> HTTP 500 (storage_write_failed)');
    expect(body.message).not.toContain('proj99');
    expect(body.message).not.toContain('alice');
    expect(body).not.toHaveProperty('projectId');
});

test('reportActionableError reports unexpected save errors and server upload timeouts', () => {
    let reportActionableError;
    let request;
    jest.isolateModules(() => {
        ({reportActionableError} = require('../../../src/lib/error-reporter'));
        request = global.fetch;
    });
    const runtimeError = new TypeError('Cannot read properties of undefined (reading \'zip\')');
    expect(reportActionableError(runtimeError, {context: 'save'})).toBe(true);
    expect(request).toHaveBeenCalledTimes(1);
    expect(JSON.parse(request.mock.calls[0][1].body).message).toBe(
        '[save] Cannot read properties of undefined (reading \'zip\')'
    );

    jest.isolateModules(() => {
        ({reportActionableError} = require('../../../src/lib/error-reporter'));
        request = global.fetch;
    });
    const timeoutError = Object.assign(new Error('Upload timed out'), {code: 'upload_processing_timeout'});
    expect(reportActionableError(timeoutError, {context: 'api', path: '/projects/p42/upload'})).toBe(true);
    expect(JSON.parse(request.mock.calls[1][1].body).message).toBe(
        '[api] Upload processing timeout (/projects/:id/upload)'
    );
});

test('reportActionableError skips unactionable user, network and third-party extension errors', () => {
    let reportActionableError;
    let request;
    jest.isolateModules(() => {
        ({reportActionableError} = require('../../../src/lib/error-reporter'));
        request = global.fetch;
    });
    const unactionable = [
        Object.assign(new Error('Not found'), {status: 404}),
        Object.assign(new Error('Sign in'), {status: 401}),
        Object.assign(new Error('Too many requests'), {status: 429}),
        Object.assign(new Error('Offline'), {code: 'network'}),
        Object.assign(new Error('Timed out'), {code: 'timeout'}),
        Object.assign(new Error('Stalled'), {code: 'upload_stalled'}),
        Object.assign(new Error('Agreement required'), {code: 'agreement_required'}),
        Object.assign(new Error('Changed elsewhere'), {code: 'head_changed'}),
        Object.assign(new Error('Storage full'), {code: 'storage_full'}),
        Object.assign(new Error('Not exact'), {code: 'project_not_exact'}),
        Object.assign(new Error('Busy'), {code: 'project_operation_active'}),
        new TypeError('Failed to fetch'),
        Object.assign(new Error('Aborted'), {name: 'AbortError'}),
        Object.assign(new Error('Could not load third party extension'), {
            code: 'extension_source_unavailable',
            extensionOrigin: 'remote',
            extensionUrl: 'https://someone-else.example/ext.js'
        })
    ];
    for (const error of unactionable) {
        expect(reportActionableError(error, {context: 'save'})).toBe(false);
    }
    expect(request).not.toHaveBeenCalled();
});

test('reportActionableError reports first-party and data URI extension read failures', () => {
    let reportActionableError;
    let request;
    jest.isolateModules(() => {
        ({reportActionableError} = require('../../../src/lib/error-reporter'));
        request = global.fetch;
    });
    const firstParty = Object.assign(new Error('Could not load extension'), {
        code: 'extension_source_unavailable',
        extensionOrigin: 'remote',
        extensionUrl: 'https://rotur.dev/scratch/example.js'
    });
    expect(reportActionableError(firstParty, {context: 'save'})).toBe(true);
    expect(request).toHaveBeenCalledTimes(1);

    jest.isolateModules(() => {
        ({reportActionableError} = require('../../../src/lib/error-reporter'));
        request = global.fetch;
    });
    const dataExt = Object.assign(new Error('Could not read a custom extension before saving.'), {
        code: 'extension_source_unavailable',
        extensionOrigin: 'data'
    });
    expect(reportActionableError(dataExt, {context: 'save'})).toBe(true);
    expect(request).toHaveBeenCalledTimes(2);
});
