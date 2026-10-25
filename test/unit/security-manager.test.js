import {webcrypto} from 'crypto';
import {TextEncoder} from 'util';
import {
    TWSecurityManagerComponent,
    canTrustLoadedProject,
    isLocalProjectUrl,
    isOwnedPlatformProject,
    isPlatformTrustedExtension,
    isTrustedExtension,
    manuallyTrustExtension
} from '../../src/containers/tw-security-manager.jsx';
import {rememberPlatformProject} from '../../src/lib/community/publish.js';
import {
    clearBlockedProjectPrompts,
    unblockProjectPrompts,
    isProjectPromptBlocked
} from '../../src/lib/project-prompt-blocking.js';

Object.defineProperty(global, 'crypto', {value: webcrypto, configurable: true});
Object.defineProperty(global, 'TextEncoder', {value: TextEncoder, configurable: true});

beforeEach(() => {
    clearBlockedProjectPrompts();
});

test('blocked projects cannot reopen extension security prompts', async () => {
    window.history.replaceState(null, '', '/editor');
    rememberPlatformProject(null);
    const component = new TWSecurityManagerComponent({
        vm: {runtime: {projectName: 'Blocked project'}},
        securityManager: {}
    });
    const callback = jest.fn();
    component.state.callback = callback;
    component.handleBlocked();

    expect(callback).toHaveBeenCalledWith(false);
    expect(isProjectPromptBlocked({name: 'Blocked project'})).toBe(true);
    await expect(component.canOpenWindow('https://example.com')).resolves.toBe(false);
    expect(component.state.type).toBe(null);
});

test('unblocking a project takes effect without reloading the editor', () => {
    const component = new TWSecurityManagerComponent({
        vm: {runtime: {projectName: 'Blocked project'}},
        securityManager: {}
    });
    component.state.callback = jest.fn();
    component.handleBlocked();

    expect(component.projectPromptsBlocked()).toBe(true);
    unblockProjectPrompts('name:Blocked project');
    expect(component.projectPromptsBlocked()).toBe(false);
});

test('only official or explicitly trusted extensions run unsandboxed', () => {
    const custom = 'https://example.com/extension.js';
    expect(isTrustedExtension('https://extensions.turbowarp.org/example.js')).toBe(true);
    expect(isTrustedExtension('https://extensions.mistium.com/featured/example.js')).toBe(true);
    expect(isTrustedExtension('https://extensions.mistium.com/unreviewed/example.js')).toBe(true);
    expect(isTrustedExtension('https://rotur.dev/scratch/beam.js')).toBe(true);
    expect(isTrustedExtension('https://rotur.dev/beam.js')).toBe(false);
    expect(isTrustedExtension('https://rotur.dev/scratch/../beam.js')).toBe(false);
    expect(isTrustedExtension('https://extensions.mistium.com.example.com/extension.js')).toBe(false);
    expect(isTrustedExtension(custom)).toBe(false);
    manuallyTrustExtension(custom);
    expect(isTrustedExtension(custom)).toBe(true);
});

test('only the verified owner gets the bypass option', () => {
    window.history.replaceState(null, '', '/editor#mw-project-1');
    rememberPlatformProject({id: 'project-1', isOwner: false});
    expect(isOwnedPlatformProject()).toBe(false);
    rememberPlatformProject({id: 'project-1', isOwner: true});
    expect(isOwnedPlatformProject()).toBe(true);
    window.history.replaceState(null, '', '/editor');
    expect(isOwnedPlatformProject()).toBe(false);
});

test('file and loopback project loads can offer the bypass option', () => {
    expect(canTrustLoadedProject({_mwCanTrustProject: true})).toBe(true);
    expect(isLocalProjectUrl('http://localhost:8000/project.sb3')).toBe(true);
    expect(isLocalProjectUrl('http://127.0.0.1/project.sb3')).toBe(true);
    expect(isLocalProjectUrl('http://localhost.example.com/project.sb3')).toBe(false);
    expect(isLocalProjectUrl('data:application/json,{}')).toBe(false);
    window.history.replaceState(null, '', '/editor?project_url=http%3A%2F%2Flocalhost%3A8000%2Fproject.sb3');
    expect(canTrustLoadedProject({})).toBe(true);
    window.history.replaceState(null, '', '/editor');
    expect(canTrustLoadedProject({})).toBe(false);
});

test('platform projects trust only hashes approved by the server', async () => {
    window.history.replaceState(null, '', '/editor?platform_project=project-1');
    rememberPlatformProject({
        id: 'project-1',
        trustedExtensions: ['a641c5c6969ea28a3a3053f0a5d6c76a5a1f7017b5c8298d61ba9399fb0cad6f']
    });
    expect(await isPlatformTrustedExtension('https://example.com/trusted.js')).toBe(true);
    expect(isTrustedExtension('https://example.com/trusted.js')).toBe(false);
    expect(isTrustedExtension('https://extensions.turbowarp.org/unreviewed.js')).toBe(true);
    expect(isTrustedExtension('https://extensions.mistium.com/featured/example.js')).toBe(true);
    window.history.replaceState(null, '', '/editor');
    rememberPlatformProject(null);
});

test('only extensions discovered in a platform project use its saved source URL', async () => {
    window.history.replaceState(null, '', '/editor?platform_project=project-1');
    rememberPlatformProject({
        id: 'project-1',
        projectJsonUrl: 'https://storage.example/project.json?k=secret'
    });
    const component = new TWSecurityManagerComponent({
        vm: {runtime: {_mwProjectTrusted: true}},
        securityManager: {}
    });
    component.handleProjectLoading({stage: 'building'});
    component.props.vm.runtime._mwProjectTrusted = true;

    const pastedText = 'data:application/javascript,extension%20source';
    expect(await component.rewriteExtensionURL(pastedText)).toBe(pastedText);

    const storedExtension = 'https://example.com/stored.js';
    await component.canLoadExtensionFromProject(storedExtension, {wholeProject: true});
    expect(await component.rewriteExtensionURL(storedExtension)).toMatch(
        /^https:\/\/api\.mistwarp\.org\/v1\/projects\/project-1\/extensions\/[a-f0-9]{64}\/source\?k=secret$/
    );

    const spriteExtension = 'https://example.com/sprite.js';
    component.acquireModalLock = async () => ({showModal: async () => true});
    await component.canLoadExtensionFromProject(spriteExtension, {wholeProject: false});
    expect(await component.rewriteExtensionURL(spriteExtension)).toBe(spriteExtension);

    window.history.replaceState(null, '', '/editor');
    rememberPlatformProject(null);
});

test('trusting a project unsandboxes only its own extensions, not ones added later', async () => {
    const vmSecurityManager = {};
    const vm = {
        runtime: {_mwProjectTrusted: true},
        extensionManager: {securityManager: vmSecurityManager},
        on: () => {}
    };
    const component = new TWSecurityManagerComponent({vm, securityManager: {}});
    component.componentDidMount();
    const projectURL = 'data:application/javascript,Scratch.extensions.register({getInfo:()=>({id:"own"})})';
    const pastedURL = 'data:application/javascript,Scratch.extensions.register({getInfo:()=>({id:"pasted"})})';

    expect(await vmSecurityManager.canLoadExtensionFromProject(projectURL, {wholeProject: true})).toBe(true);
    expect(await vmSecurityManager.getSandboxMode(projectURL)).toBe('unsandboxed');
    expect(await vmSecurityManager.getSandboxMode(pastedURL)).toBe('iframe');

    component.handleProjectLoading({stage: 'building'});
    vm.runtime._mwProjectTrusted = true;
    expect(await vmSecurityManager.getSandboxMode(projectURL)).toBe('iframe');
});

test('the extension whose prompt was answered with Load all runs unsandboxed', async () => {
    window.history.replaceState(null, '', '/editor');
    rememberPlatformProject(null);
    const vmSecurityManager = {};
    const vm = {
        runtime: {_mwProjectTrusted: false, projectName: 'Trusted project'},
        extensionManager: {securityManager: vmSecurityManager},
        on: () => {}
    };
    const component = new TWSecurityManagerComponent({vm, securityManager: {}});
    component.componentDidMount();
    component.acquireModalLock = async () => ({
        showModal: async () => {
            vm.runtime._mwProjectTrusted = true;
            return true;
        }
    });
    const url = 'https://example.com/first.js';
    expect(await vmSecurityManager.canLoadExtensionFromProject(url, {wholeProject: true})).toBe(true);
    expect(await vmSecurityManager.getSandboxMode(url)).toBe('unsandboxed');
});

test('after Load all, JavaScript-running extensions still prompt and manual trust still applies', async () => {
    window.history.replaceState(null, '', '/editor');
    rememberPlatformProject(null);
    const vmSecurityManager = {};
    const vm = {
        runtime: {_mwProjectTrusted: true, projectName: 'Trusted project'},
        extensionManager: {securityManager: vmSecurityManager},
        on: () => {}
    };
    const component = new TWSecurityManagerComponent({vm, securityManager: {}});
    component.componentDidMount();
    const showModal = jest.fn(async () => false);
    component.acquireModalLock = async () => ({showModal});

    expect(await vmSecurityManager.canLoadExtensionFromProject('builtin:patching')).toBe(false);
    expect(showModal).toHaveBeenCalled();

    const manualURL = 'https://example.com/manual.js';
    manuallyTrustExtension(manualURL);
    expect(await vmSecurityManager.getSandboxMode(manualURL)).toBe('unsandboxed');
});

test('after Load all, extensions from outside the project load still prompt and stay sandboxed', async () => {
    window.history.replaceState(null, '', '/editor');
    rememberPlatformProject(null);
    const vmSecurityManager = {};
    const vm = {
        runtime: {_mwProjectTrusted: true, projectName: 'Trusted project'},
        extensionManager: {securityManager: vmSecurityManager},
        on: () => {}
    };
    const component = new TWSecurityManagerComponent({vm, securityManager: {}});
    component.componentDidMount();
    const showModal = jest.fn(async () => false);
    component.acquireModalLock = async () => ({showModal});

    const peerURL = 'https://evil.example/peer.js';
    expect(await vmSecurityManager.canLoadExtensionFromProject(peerURL)).toBe(false);
    expect(showModal).toHaveBeenCalled();
    expect(await vmSecurityManager.getSandboxMode(peerURL)).toBe('iframe');
});

test('an extension from a link that failed in the sandbox can be trusted after asking', async () => {
    window.history.replaceState(null, '', '/editor');
    rememberPlatformProject(null);
    const url = 'https://example.org/needs-the-page.js';
    const component = new TWSecurityManagerComponent({
        vm: {runtime: {projectName: 'Link project'}},
        securityManager: {}
    });
    const shown = [];
    component.acquireModalLock = async () => ({
        showModal: async (type, data) => {
            shown.push({type, data});
            return true;
        },
        releaseLock: () => {}
    });
    expect(isTrustedExtension(url)).toBe(false);
    await expect(component.canRetryUnsandboxed(url)).resolves.toBe(true);
    expect(shown[0].data).toMatchObject({url, host: 'example.org', sandboxFailed: true, unsandboxed: true});
    expect(isTrustedExtension(url)).toBe(true);
    await expect(component.canRetryUnsandboxed('javascript:alert(1)')).resolves.toBe(false);
    await expect(component.canRetryUnsandboxed('http://example.org/x.js')).resolves.toBe(false);
    expect(shown).toHaveLength(1);
});

test('saying no to full access for a link leaves the extension sandboxed', async () => {
    const url = 'https://example.net/declined.js';
    const component = new TWSecurityManagerComponent({
        vm: {runtime: {projectName: 'Link project'}},
        securityManager: {}
    });
    component.acquireModalLock = async () => ({showModal: async () => false, releaseLock: () => {}});
    await expect(component.canRetryUnsandboxed(url)).resolves.toBe(false);
    expect(isTrustedExtension(url)).toBe(false);
});
