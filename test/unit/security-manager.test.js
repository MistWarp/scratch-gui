import {webcrypto} from 'crypto';
import {TextEncoder} from 'util';
import {
    isOwnedPlatformProject,
    isPlatformTrustedExtension,
    isTrustedExtension,
    manuallyTrustExtension
} from '../../src/containers/tw-security-manager.jsx';
import {rememberPlatformProject} from '../../src/lib/community/publish.js';

Object.defineProperty(global, 'crypto', {value: webcrypto, configurable: true});
Object.defineProperty(global, 'TextEncoder', {value: TextEncoder, configurable: true});

test('only official or explicitly trusted extensions run unsandboxed', () => {
    const custom = 'https://example.com/extension.js';
    expect(isTrustedExtension('https://extensions.turbowarp.org/example.js')).toBe(true);
    expect(isTrustedExtension('https://extensions.mistium.com/featured/example.js')).toBe(true);
    expect(isTrustedExtension('https://extensions.mistium.com/unreviewed/example.js')).toBe(true);
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
