import {canOfferFullAccessFor, loadLinkedExtensions} from '../../src/lib/extension-link.js';
import isTrustedExtensionUrl, {isRoturScratchExtensionUrl} from '../../src/lib/trusted-extension.js';

const makeManager = ({mode = 'iframe', loaded = false, retry = true, failures = 1, message = 'Script error.'} = {}) => {
    let left = failures;
    return {
        loadExtensionURL: jest.fn(() => (left-- > 0 ? Promise.reject(new Error(message)) : Promise.resolve())),
        isExtensionURLLoaded: jest.fn(() => loaded),
        securityManager: {
            getSandboxMode: jest.fn(() => Promise.resolve(mode)),
            canLoadExtensionFromProject: jest.fn(() => Promise.resolve(true)),
            canRetryUnsandboxed: jest.fn(() => Promise.resolve(retry))
        }
    };
};
const url = 'https://example.org/needs-the-page.js';

test('only rotur.dev/scratch scripts themselves are trusted', () => {
    expect(isRoturScratchExtensionUrl('https://rotur.dev/scratch/beam.js')).toBe(true);
    expect(isTrustedExtensionUrl('https://rotur.dev/scratch/all.js')).toBe(true);
    for (const other of [
        'https://rotur.dev/scratch/../x.js',
        'https://rotur.dev/scratch/%2e%2e/x.js',
        'https://rotur.dev/scratch/..\\x.js',
        'https://rotur.dev/scratchy/beam.js',
        'http://rotur.dev/scratch/beam.js',
        'https://user@rotur.dev/scratch/beam.js',
        'https://rotur.dev/scratch/beam.js?x=1',
        'https://rotur.dev/scratch/sub/beam.js',
        'https://rotur.dev.evil.example/scratch/beam.js'
    ]) {
        expect(isTrustedExtensionUrl(other)).toBe(false);
    }
});

test('full access is only offered for https links written as the browser loads them', () => {
    expect(canOfferFullAccessFor(url)).toBe(true);
    expect(canOfferFullAccessFor('http://localhost:8001/x.js')).toBe(true);
    expect(canOfferFullAccessFor('http://example.org/x.js')).toBe(false);
    expect(canOfferFullAccessFor('https://extensions.turbowarp.org@evil.example/x.js')).toBe(false);
    expect(canOfferFullAccessFor('https://example.org/a/../x.js')).toBe(false);
    expect(canOfferFullAccessFor('data:text/javascript,1')).toBe(false);
    expect(canOfferFullAccessFor('patching')).toBe(false);
});

test('an extension that fails in the sandbox loads again after the person allows full access', async () => {
    const manager = makeManager();
    const onError = jest.fn();
    await loadLinkedExtensions([url], {manager, mayAskFullAccess: true, onError});
    expect(manager.securityManager.canRetryUnsandboxed).toHaveBeenCalledWith(url);
    expect(manager.loadExtensionURL).toHaveBeenCalledTimes(2);
    expect(onError).not.toHaveBeenCalled();
});

test('saying no, or a second failure, reports the extension once', async () => {
    const declined = makeManager({retry: false});
    const onDeclined = jest.fn();
    await loadLinkedExtensions([url], {manager: declined, mayAskFullAccess: true, onError: onDeclined});
    expect(declined.loadExtensionURL).toHaveBeenCalledTimes(1);
    expect(onDeclined).toHaveBeenCalledTimes(1);

    const broken = makeManager({failures: 2});
    const onBroken = jest.fn();
    await loadLinkedExtensions([url], {manager: broken, mayAskFullAccess: true, onError: onBroken});
    expect(broken.loadExtensionURL).toHaveBeenCalledTimes(2);
    expect(onBroken).toHaveBeenCalledTimes(1);
});

test('nothing is offered where asking would not help or could be clicked for someone', async () => {
    const cases = [
        [{mayAskFullAccess: false}, {}],
        [{mayAskFullAccess: true}, {message: 'Error in sandboxed script: x. Check the console for more information.'}],
        [{mayAskFullAccess: true}, {message: 'Extension did not finish registering within 30 seconds: x'}],
        [{mayAskFullAccess: true}, {mode: 'unsandboxed'}],
        [{mayAskFullAccess: true}, {loaded: true}]
    ];
    for (const [options, state] of cases) {
        const manager = makeManager(state);
        const onError = jest.fn();
        await loadLinkedExtensions([url], {...options, manager, onError});
        expect(manager.securityManager.canRetryUnsandboxed).not.toHaveBeenCalled();
        expect(onError).toHaveBeenCalledTimes(1);
    }
});

test('a link asks at most once, and loads each extension once', async () => {
    const manager = makeManager({failures: 3, retry: false});
    const onError = jest.fn();
    await loadLinkedExtensions([url, url, 'https://example.org/other.js'], {
        manager, mayAskFullAccess: true, onError
    });
    expect(manager.loadExtensionURL).toHaveBeenCalledTimes(2);
    expect(manager.securityManager.canRetryUnsandboxed).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledTimes(2);
});
