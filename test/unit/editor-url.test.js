/**
 * @jest-environment jsdom
 * @jest-environment-options {"url": "https://mistwarp.org/explore"}
 */

const ENV_KEYS = ['MW_ACCOUNT_ORIGIN', 'MW_EDITOR_ORIGIN', 'ROOT'];
const savedEnv = Object.fromEntries(ENV_KEYS.map(key => [key, process.env[key]]));

const withOrigins = ({account, editor}, load) => {
    if (account) process.env.MW_ACCOUNT_ORIGIN = account;
    else delete process.env.MW_ACCOUNT_ORIGIN;
    if (editor) process.env.MW_EDITOR_ORIGIN = editor;
    else delete process.env.MW_EDITOR_ORIGIN;
    let loaded;
    jest.isolateModules(() => {
        loaded = load();
    });
    return loaded;
};

const loadEditorUrl = origins => withOrigins(origins, () => require('../../src/community/api.js').editorUrl);

afterEach(() => {
    for (const key of ENV_KEYS) {
        if (typeof savedEnv[key] === 'undefined') delete process.env[key];
        else process.env[key] = savedEnv[key];
    }
});

describe('editorUrl on mistwarp.org', () => {
    const editorUrl = () => loadEditorUrl({});

    test('a blank project opens the root of editor.mistwarp.org', () => {
        expect(editorUrl()()).toBe('https://editor.mistwarp.org/');
    });

    test('platform and Scratch projects go in the hash', () => {
        expect(editorUrl()({platformProject: 'pAbc'})).toBe('https://editor.mistwarp.org/#mw-pAbc');
        expect(editorUrl()({scratchProject: '123'})).toBe('https://editor.mistwarp.org/#123');
    });

    test('options become query parameters', () => {
        expect(editorUrl()({starter: 'clicker'})).toBe('https://editor.mistwarp.org/?starter=clicker');
        expect(editorUrl()({restore: 7})).toBe('https://editor.mistwarp.org/?restore=7');
        expect(editorUrl()({clone: 'pAbc', chat: true})).toBe('https://editor.mistwarp.org/?clone=pAbc&chat=1');
        expect(editorUrl()({projectJson: 'https://x.test/p.json', assets: 'https://x.test/a/'}))
            .toBe('https://editor.mistwarp.org/?project_url=https%3A%2F%2Fx.test%2Fp.json' +
                '&mw_assets=https%3A%2F%2Fx.test%2Fa%2F');
    });

    test('a collaboration link keeps the project in the hash', () => {
        expect(editorUrl()({platformProject: 'pAbc'}).replace('#', '?collaborate=1#'))
            .toBe('https://editor.mistwarp.org/?collaborate=1#mw-pAbc');
    });
});

describe('editorUrl where the editor shares the page origin', () => {
    test('a build with one origin keeps the relative /editor path', () => {
        const editorUrl = loadEditorUrl({account: 'https://mistwarp.org', editor: 'https://mistwarp.org'});
        expect(editorUrl()).toBe('/editor');
        expect(editorUrl({platformProject: 'pAbc'})).toBe('/editor#mw-pAbc');
        expect(editorUrl({starter: 'clicker'})).toBe('/editor?starter=clicker');
    });

    test('a preview or dev origin opens its own /editor, not production', () => {
        const editorUrl = loadEditorUrl({account: 'https://abc.scratch-gui.pages.dev'});
        expect(editorUrl()).toBe('/editor');
        expect(editorUrl({scratchProject: '123'})).toBe('/editor#123');
    });

    test('on the editor origin itself links go to its root', () => {
        const editorUrl = loadEditorUrl({account: 'https://account.example', editor: 'https://mistwarp.org'});
        expect(editorUrl()).toBe('/');
        expect(editorUrl({platformProject: 'pAbc'})).toBe('/#mw-pAbc');
        expect(editorUrl({chat: true})).toBe('/?chat=1');
    });
});

describe('editor routes on the editor origin', () => {
    const loadRouter = origins => {
        process.env.ROOT = '/';
        return withOrigins(origins, () => require('../../src/lib/components/tw-state-manager-hoc.jsx').WildcardRouter);
    };
    const callbacks = () => ({
        onSetProjectId: jest.fn(() => Promise.resolve(true)),
        onSetIsPlayerOnly: jest.fn(),
        onSetIsFullScreen: jest.fn()
    });

    test('the editor host keeps the editor at the root', () => {
        const WildcardRouter = loadRouter({account: 'https://account.example', editor: 'https://mistwarp.org'});
        const router = new WildcardRouter(callbacks());
        expect(router.generateURL({projectId: '0', isPlayerOnly: false, isFullScreen: false})).toBe('/');
        expect(router.generateURL({projectId: '0', isPlayerOnly: true, isFullScreen: false})).toBe('/player');
        expect(router.generateURL({projectId: '0', isPlayerOnly: false, isFullScreen: true})).toBe('/fullscreen');
        expect(router.generateURL({projectId: '123', isPlayerOnly: false, isFullScreen: false})).toBe('/123/editor');
        expect(router.generateURL({projectId: '123', isPlayerOnly: true, isFullScreen: false})).toBe('/123');
    });

    test('going back to the root on the editor host shows the editor', async () => {
        const WildcardRouter = loadRouter({account: 'https://account.example', editor: 'https://mistwarp.org'});
        const handlers = callbacks();
        history.replaceState(null, '', '/');
        await new WildcardRouter(handlers).parseURL(true);
        expect(handlers.onSetIsPlayerOnly).toHaveBeenLastCalledWith(false);
        history.replaceState(null, '', '/player');
        await new WildcardRouter(handlers).parseURL(true);
        expect(handlers.onSetIsPlayerOnly).toHaveBeenLastCalledWith(true);
        history.replaceState(null, '', '/explore');
    });

    test('other origins keep the TurboWarp paths', () => {
        const WildcardRouter = loadRouter({});
        const router = new WildcardRouter(callbacks());
        expect(router.generateURL({projectId: '0', isPlayerOnly: false, isFullScreen: false})).toBe('/editor');
        expect(router.generateURL({projectId: '0', isPlayerOnly: true, isFullScreen: false})).toBe('/');
        expect(router.generateURL({projectId: '123', isPlayerOnly: false, isFullScreen: false})).toBe('/123/editor');
    });
});
