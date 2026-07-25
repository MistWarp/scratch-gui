import {getSetting} from '../../../src/lib/menu-bar/settings.js';

beforeEach(() => {
    localStorage.clear();
});

test('migrates legacy menu bar addons without enabling disabled addons', () => {
    localStorage.setItem('tw:addons', JSON.stringify({
        'block-count': {
            enabled: true,
            hide_block_count: true,
            show_costume_count: true
        },
        'custom-menu-bar': {
            enabled: true,
            'menu-labels': 'icons'
        },
        'mediarecorder': {
            enabled: true
        },
        'autosave': {
            enabled: false,
            autosaveEnabled: true,
            interval: 12
        }
    }));

    expect(getSetting('menu_labels')).toBe('icons');
    expect(getSetting('show_block_count')).toBe(false);
    expect(getSetting('show_costume_count')).toBe(true);
    expect(getSetting('show_media_recorder')).toBe(true);
    expect(getSetting('autosave_enabled')).toBe(false);
    expect(getSetting('autosave_interval')).toBe(12);
});

test('normalizes stored menu bar settings', () => {
    localStorage.setItem('mw:menu-bar:menu_labels', 'invalid');
    localStorage.setItem('mw:menu-bar:autosave_interval', '999');

    expect(getSetting('menu_labels')).toBe('both');
    expect(getSetting('autosave_interval')).toBe(60);
});
