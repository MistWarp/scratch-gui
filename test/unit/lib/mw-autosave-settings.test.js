import {getSetting, getSettings, setSetting} from '../../../src/lib/mw/autosave-settings.js';

beforeEach(() => {
    localStorage.clear();
});

test('defaults to disabled with a 5 minute interval', () => {
    expect(getSettings()).toEqual({
        enabled: false,
        interval: 5,
        notifications: true,
        only_when_changed: true
    });
});

test('normalizes stored values', () => {
    localStorage.setItem('mw:autosave:interval', '999');
    localStorage.setItem('mw:autosave:enabled', 'true');

    expect(getSetting('interval')).toBe(60);
    expect(getSetting('enabled')).toBe(true);
});

test('migrates the previous menu bar keys', () => {
    localStorage.setItem('mw:menu-bar:autosave_enabled', 'true');
    localStorage.setItem('mw:menu-bar:autosave_interval', '12');

    expect(getSetting('enabled')).toBe(true);
    expect(getSetting('interval')).toBe(12);
});

test('migrates the legacy addon settings', () => {
    localStorage.setItem('tw:addons', JSON.stringify({
        autosave: {
            enabled: true,
            autosaveEnabled: true,
            interval: 12,
            showNotifications: false,
            saveOnlyWhenChanged: false
        }
    }));

    expect(getSetting('enabled')).toBe(true);
    expect(getSetting('interval')).toBe(12);
    expect(getSetting('notifications')).toBe(false);
    expect(getSetting('only_when_changed')).toBe(false);
});

test('round-trips settings through storage', () => {
    setSetting('enabled', true);
    setSetting('interval', 2);

    expect(getSetting('enabled')).toBe(true);
    expect(getSetting('interval')).toBe(2);
});
