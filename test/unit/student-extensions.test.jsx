import {webcrypto} from 'crypto';
import {TextEncoder} from 'util';
import {TWSecurityManagerComponent} from '../../src/containers/tw-security-manager.jsx';
import {ExtensionLibrary} from '../../src/containers/extension-library.jsx';
import {rememberPlatformProject} from '../../src/lib/community/publish.js';
import {clearBlockedProjectPrompts} from '../../src/lib/project-prompt-blocking.js';

Object.defineProperty(global, 'crypto', {value: webcrypto, configurable: true});
Object.defineProperty(global, 'TextEncoder', {value: TextEncoder, configurable: true});

const STUDENT_KEY = 'mw:classroom-student';
const GALLERY = 'https://extensions.turbowarp.org/Lily/Skins.js';
const MISTIUM = 'https://extensions.mistium.com/featured/Example.js';
const CUSTOM = 'https://example.com/tracker.js';

const installSecurityManager = (runtime = {}) => {
    const vm = {
        on: jest.fn(),
        off: jest.fn(),
        runtime: Object.assign({projectName: 'Class project', on: jest.fn(), off: jest.fn()}, runtime),
        extensionManager: {securityManager: {}}
    };
    const component = new TWSecurityManagerComponent({vm, securityManager: {}});
    component.setState = jest.fn();
    component.componentDidMount();
    return {vm, component, manager: vm.extensionManager.securityManager};
};

beforeEach(() => {
    localStorage.clear();
    clearBlockedProjectPrompts();
    rememberPlatformProject(null);
    window.history.replaceState(null, '', '/editor');
    delete window.__mwAllowAllSecurity;
});

afterEach(() => {
    localStorage.clear();
    delete window.__mwAllowAllSecurity;
});

describe('security manager for class accounts', () => {
    test('denies network, window, embed, location and notification access without a prompt', async () => {
        localStorage.setItem(STUDENT_KEY, '1');
        const {component, manager} = installSecurityManager();
        await expect(manager.canFetch('https://raw.githubusercontent.com/a/b/c.json')).resolves.toBe(false);
        await expect(manager.canFetch('https://example.com/data')).resolves.toBe(false);
        await expect(manager.canOpenWindow('https://example.com')).resolves.toBe(false);
        await expect(manager.canRedirect('https://example.com')).resolves.toBe(false);
        await expect(manager.canEmbed('https://example.com')).resolves.toBe(false);
        await expect(manager.canGeolocate()).resolves.toBe(false);
        await expect(manager.canNotify()).resolves.toBe(false);
        expect(component.setState).not.toHaveBeenCalled();
    });

    test('only gallery extensions load from a project, never custom or JavaScript ones', async () => {
        localStorage.setItem(STUDENT_KEY, '1');
        const {component, manager} = installSecurityManager();
        await expect(manager.canLoadExtensionFromProject(GALLERY)).resolves.toBe(true);
        await expect(manager.canLoadExtensionFromProject(MISTIUM)).resolves.toBe(true);
        await expect(manager.canLoadExtensionFromProject(CUSTOM)).resolves.toBe(false);
        await expect(manager.canLoadExtensionFromProject('data:text/javascript,1')).resolves.toBe(false);
        await expect(manager.canLoadExtensionFromProject('http://localhost:8000/extension.js')).resolves.toBe(false);
        await expect(manager.canLoadExtensionFromProject('https://extensions.turbowarp.org/EvalPlus.js'))
            .resolves.toBe(false);
        await expect(manager.canLoadExtensionFromProject('builtin:patching')).resolves.toBe(false);
        expect(component.setState).not.toHaveBeenCalled();
    });

    test('refuses to run any custom extension, even one trusted by the project or the user', async () => {
        localStorage.setItem(STUDENT_KEY, '1');
        window.history.replaceState(null, '', '/editor#mw-p1');
        rememberPlatformProject({id: 'p1', trustedExtensions: ['anything']});
        const {manager} = installSecurityManager();
        await expect(manager.getSandboxMode(GALLERY)).resolves.toBe('unsandboxed');
        await expect(manager.getSandboxMode(CUSTOM)).rejects.toThrow('class accounts');
        await expect(manager.getSandboxMode('data:text/javascript,1')).rejects.toThrow('class accounts');
    });

    test('the load all and allow all bypasses do not apply to students', async () => {
        localStorage.setItem(STUDENT_KEY, '1');
        window.__mwAllowAllSecurity = true;
        const {manager} = installSecurityManager({_mwProjectTrusted: true});
        await expect(manager.canFetch('https://example.com')).resolves.toBe(false);
        await expect(manager.getSandboxMode(CUSTOM)).rejects.toThrow('class accounts');
        await expect(manager.canLoadExtensionFromProject(CUSTOM)).resolves.toBe(false);
    });

    test('everyone else keeps the normal checks', async () => {
        const {manager} = installSecurityManager({_mwProjectTrusted: true});
        expect(await manager.canFetch('https://example.com')).toBe(true);
        expect(await manager.getSandboxMode(CUSTOM)).toBe('unsandboxed');
        const plain = installSecurityManager().manager;
        await expect(plain.getSandboxMode(CUSTOM)).resolves.toBe('iframe');
        await expect(plain.canFetch('https://raw.githubusercontent.com/a/b/c.json')).resolves.toBe(true);
    });
});

describe('extension library for class accounts', () => {
    const renderLibrary = () => {
        const library = Object.create(ExtensionLibrary.prototype);
        library.state = {gallery: [], galleryError: null, galleryTimedOut: false};
        library.props = {
            intl: {locale: 'en', formatMessage: message => message.defaultMessage},
            onOpenCustomExtensionModal: jest.fn()
        };
        return {library, element: library.render()};
    };

    const ids = element => element.props.data
        .filter(item => item && typeof item === 'object')
        .map(item => item.extensionId);

    test('hides the custom extension entry from a student', () => {
        localStorage.setItem(STUDENT_KEY, '1');
        const {library, element} = renderLibrary();
        expect(ids(element)).not.toContain('custom_extension');
        expect(ids(element)).toContain('pen');
        library.handleItemSelect({extensionId: 'custom_extension'});
        expect(library.props.onOpenCustomExtensionModal).not.toHaveBeenCalled();
    });

    test('keeps it for everyone else', () => {
        const {library, element} = renderLibrary();
        expect(ids(element)).toContain('custom_extension');
        library.handleItemSelect({extensionId: 'custom_extension'});
        expect(library.props.onOpenCustomExtensionModal).toHaveBeenCalledTimes(1);
    });
});
