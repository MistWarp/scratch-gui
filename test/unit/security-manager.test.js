import {
    isOwnedPlatformProject,
    isTrustedExtension,
    manuallyTrustExtension
} from '../../src/containers/tw-security-manager.jsx';
import {rememberPlatformProject} from '../../src/lib/community/publish.js';

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
