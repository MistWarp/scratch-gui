import React from 'react';
import configureStore from 'redux-mock-store';
import {mountWithIntl} from '../helpers/intl-helpers.jsx';
import {
    getGoogleFontsList,
    getPopularGoogleFonts,
    isGoogleFont,
    loadGoogleFont,
    searchGoogleFonts
} from '../../src/lib/themes/google-fonts.js';
import {applyThemeFonts, getFontFamilyString} from '../../src/lib/themes/fonts.js';
import {Theme} from '../../src/lib/themes/index.js';
import MWFontsWindow from '../../src/components/mw-fonts-window/mw-fonts-window.jsx';

const STUDENT_KEY = 'mw:classroom-student';

if (typeof global.CSS === 'undefined') global.CSS = {escape: value => String(value)};

const googleLinks = () => document.querySelectorAll('link[data-google-font]');

describe('Google Fonts in a student session', () => {
    beforeEach(() => {
        localStorage.clear();
        localStorage.setItem(STUDENT_KEY, '1');
        document.head.innerHTML = '';
        global.fetch = jest.fn(() => Promise.reject(new Error('network')));
    });

    afterEach(() => {
        localStorage.clear();
        document.head.innerHTML = '';
        delete global.fetch;
    });

    test('never adds a Google Fonts stylesheet or asks Google for the font list', async () => {
        await loadGoogleFont('Roboto');
        await loadGoogleFont('Lato', ['400']);
        expect(googleLinks()).toHaveLength(0);
        await expect(getGoogleFontsList()).resolves.toEqual([]);
        await expect(searchGoogleFonts('Rob')).resolves.toEqual([]);
        await expect(isGoogleFont('Roboto')).resolves.toBe(false);
        expect(getPopularGoogleFonts()).toEqual([]);
        expect(global.fetch).not.toHaveBeenCalled();
    });

    test('a theme with Google fonts falls back to the default and system fonts', async () => {
        const fonts = {google: ['Roboto'], system: ['Comic Sans MS'], history: []};
        await applyThemeFonts(fonts);
        const style = document.getElementById('theme-fonts').textContent;
        expect(style).not.toContain('Roboto');
        expect(style).toContain('"Comic Sans MS"');
        expect(style).toContain('Helvetica');
        expect(getFontFamilyString(fonts)).not.toContain('Roboto');
        expect(googleLinks()).toHaveLength(0);
        expect(global.fetch).not.toHaveBeenCalled();
    });

    test('the fonts window has no Google Fonts picker for a student', () => {
        const store = configureStore()({scratchGui: {theme: {theme: new Theme()}, vm: null}});
        const wrapper = mountWithIntl(<MWFontsWindow store={store} />);
        expect(wrapper.text()).not.toContain('Google Fonts');
        expect(wrapper.find('input[placeholder="Search Google Fonts…"]')).toHaveLength(0);
        expect(wrapper.text()).toContain('Local Fonts');
        wrapper.unmount();
    });
});

describe('Google Fonts for everyone else', () => {
    beforeEach(() => {
        localStorage.clear();
        document.head.innerHTML = '';
    });

    afterEach(() => {
        document.head.innerHTML = '';
    });

    test('still loads the stylesheet and shows the picker', () => {
        loadGoogleFont('Roboto');
        expect(googleLinks()).toHaveLength(1);
        expect(googleLinks()[0].href).toContain('https://fonts.googleapis.com/css2?family=Roboto');
        expect(getPopularGoogleFonts()).toContain('Roboto');
        const store = configureStore()({scratchGui: {theme: {theme: new Theme()}, vm: null}});
        const wrapper = mountWithIntl(<MWFontsWindow store={store} />);
        expect(wrapper.text()).toContain('Google Fonts');
        wrapper.unmount();
    });
});
