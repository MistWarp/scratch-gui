import {getSetting} from '../../../src/lib/mw-stage-controls/settings';

test('uses defaults when a sandbox blocks the localStorage getter', () => {
    const storage = Object.getOwnPropertyDescriptor(window, 'localStorage');
    Object.defineProperty(window, 'localStorage', {configurable: true, get: () => {
        throw new DOMException('Storage blocked', 'SecurityError');
    }});
    try {
        expect(getSetting('screenshot')).toBe(true);
        expect(getSetting('clone_counter')).toBe(false);
    } finally {
        Object.defineProperty(window, 'localStorage', storage);
    }
});
