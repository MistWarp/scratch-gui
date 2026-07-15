import {isTrustedExtension, manuallyTrustExtension} from '../../src/containers/tw-security-manager.jsx';
import {
    setSecurityWarningSetting,
    shouldWarn,
    isSecurityManagerDisabled
} from '../../src/lib/security-warning-settings.js';

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

test('security warning categories can be disabled independently', () => {
    localStorage.removeItem('mw:security-warnings');
    expect(shouldWarn('download')).toBe(true);
    setSecurityWarningSetting('download', false);
    expect(shouldWarn('download')).toBe(false);
    expect(shouldWarn('fetch')).toBe(true);
    expect(isSecurityManagerDisabled()).toBe(false);
    setSecurityWarningSetting('disabled', true);
    expect(isSecurityManagerDisabled()).toBe(true);
});
