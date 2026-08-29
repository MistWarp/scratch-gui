import {getSetting} from '../../../src/lib/menu-bar/settings.js';
import {moveMenuItem} from '../../../src/lib/mw-menu-bar-layout.js';
import {getMenuBarItemLabel} from '../../../src/components/tw-settings-modal/menu-bar-layout-labels.js';

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
        'autosave': {
            enabled: false,
            autosaveEnabled: true,
            interval: 12
        }
    }));

    expect(getSetting('menu_labels')).toBe('icons');
    expect(getSetting('show_block_count')).toBe(false);
    expect(getSetting('show_costume_count')).toBe(true);
    expect(getSetting('autosave_enabled')).toBe(false);
    expect(getSetting('autosave_interval')).toBe(12);
});

test('normalizes stored menu bar settings', () => {
    localStorage.setItem('mw:menu-bar:menu_labels', 'invalid');
    localStorage.setItem('mw:menu-bar:autosave_interval', '999');

    expect(getSetting('menu_labels')).toBe('both');
    expect(getSetting('autosave_interval')).toBe(60);
});

test('moves menu bar items one position for keyboard and touch controls', () => {
    expect(moveMenuItem(['file', 'edit', 'tools'], 'edit', -1)).toEqual(['edit', 'file', 'tools']);
    expect(moveMenuItem(['file', 'edit', 'tools'], 'edit', 1)).toEqual(['file', 'tools', 'edit']);
    expect(moveMenuItem(['file', 'edit', 'tools'], 'file', -1)).toEqual(['file', 'edit', 'tools']);
});

test('menu bar layout never exposes internal identifiers as labels', () => {
    const intl = {formatMessage: message => message.defaultMessage};
    expect(getMenuBarItemLabel(intl, 'feedback')).toBe('Feedback');
    expect(getMenuBarItemLabel(intl, 'collab-presence')).toBe('Collaboration');
    expect(getMenuBarItemLabel(intl, 'future-item')).toBe('Future item');
});
