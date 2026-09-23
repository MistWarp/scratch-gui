import React from 'react';
import {mount} from 'enzyme';
import {Provider} from 'react-redux';
import {createStore, combineReducers} from 'redux';
import TWThemeManagerHOC from '../../../src/containers/tw-theme-manager-hoc';
import themeReducer from '../../../src/reducers/theme';
import modeReducer from '../../../src/reducers/mode';
import {Theme} from '../../../src/lib/themes';
import {customThemeManager} from '../../../src/lib/themes/custom-themes';
import {applyEmbedThemeMessage} from '../../../src/lib/themes/embed-theme';

const Managed = TWThemeManagerHOC(() => null);
const sendTheme = (theme, extra = {}, source = window.parent) => window.dispatchEvent(new MessageEvent('message', {
    source,
    data: {type: 'mw:apply-theme', theme, ...extra}
}));

describe('embed theme messages', () => {
    let wrapper;
    let store;
    const currentTheme = () => store.getState().scratchGui.theme.theme;
    const mountEmbed = () => {
        store = createStore(combineReducers({scratchGui: combineReducers({theme: themeReducer, mode: modeReducer})}), {
            scratchGui: {theme: {theme: Theme.defaults.light}, mode: {isEmbedded: true}}
        });
        wrapper = mount(<Provider store={store}><Managed /></Provider>);
    };

    beforeEach(() => {
        jest.useFakeTimers();
        localStorage.clear();
        customThemeManager.themes.clear();
        window.addEventListener('message', applyEmbedThemeMessage);
    });

    afterEach(() => {
        if (wrapper) wrapper.unmount();
        wrapper = null;
        window.removeEventListener('message', applyEmbedThemeMessage);
        localStorage.clear();
        customThemeManager.themes.clear();
        jest.clearAllTimers();
        jest.useRealTimers();
    });

    test('keeps CSS and Redux in sync across repeated light/dark messages', () => {
        mountEmbed();
        for (const gui of ['dark', 'light', 'dark', 'dark']) {
            sendTheme(JSON.stringify({gui, blocks: 'high-contrast'}));
            expect(currentTheme().gui).toBe(gui);
            expect(currentTheme().blocks).toBe('high-contrast');
            expect(document.documentElement.style.getPropertyValue('--text-primary'))
                .toBe(currentTheme().getGuiColors()['text-primary']);
        }
    });

    test('retains a message received before the first render', () => {
        sendTheme('dark');
        mountEmbed();
        expect(currentTheme().gui).toBe('dark');
        expect(document.documentElement.style.getPropertyValue('--ui-white')).toBe('#111111');
    });

    test('loads custom themes before resolving their UUID, including replacement definitions', () => {
        mountEmbed();
        for (const gui of ['dark', 'light']) {
            sendTheme(JSON.stringify({isCustom: true, customThemeUuid: 'embed-test'}), {
                customThemes: JSON.stringify([{uuid: 'embed-test', name: 'Embed', gui, accent: 'blue', blocks: 'three'}])
            });
            expect(currentTheme().uuid).toBe('embed-test');
            expect(currentTheme().gui).toBe(gui);
        }
    });

    test('accepts inline themes and structured-cloned settings', () => {
        mountEmbed();
        const appearance = {styles: {'tab-style': 'scratchbox'}};
        sendTheme({inlineCustomTheme: {name: 'Inline', gui: 'midnight', accent: 'blue', blocks: 'three', appearance}});
        expect(currentTheme().name).toBe('Inline');
        expect(currentTheme().gui).toBe('midnight');
        expect(currentTheme().appearance).toEqual(appearance);
    });

    test('reset removes the selected theme and stale custom definitions', () => {
        mountEmbed();
        sendTheme({isCustom: true, customThemeUuid: 'embed-test'}, {
            customThemes: [{uuid: 'embed-test', name: 'Embed', gui: 'dark', accent: 'blue', blocks: 'three'}]
        });
        sendTheme(null, {customThemes: ''});
        expect(localStorage.getItem('tw:theme')).toBeNull();
        expect(localStorage.getItem('tw:custom-themes')).toBeNull();
        expect(customThemeManager.getTheme('embed-test')).toBeNull();
        expect(currentTheme().gui).toBe('light');
    });

    test('ignores messages from unrelated windows and malformed payloads', () => {
        mountEmbed();
        sendTheme('dark');
        const accepted = currentTheme();
        sendTheme('light', {}, null);
        sendTheme('not json');
        sendTheme([]);
        sendTheme('light', {customThemes: '{}'});
        sendTheme(undefined);
        expect(currentTheme()).toBe(accepted);
        expect(localStorage.getItem('tw:theme')).toBe('dark');
    });

    test('unmount removes the theme-change subscription', () => {
        mountEmbed();
        wrapper.unmount();
        wrapper = null;
        const previous = currentTheme();
        sendTheme('dark');
        expect(currentTheme()).toBe(previous);
    });
});
