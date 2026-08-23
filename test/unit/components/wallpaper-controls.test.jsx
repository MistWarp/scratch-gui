import React from 'react';
import {mountWithIntl} from '../../helpers/intl-helpers.jsx';

jest.mock('../../../src/reducers/locales.js', () => ({selectLocale: jest.fn()}));
jest.mock('@turbowarp/scratch-l10n', () => ({en: {name: 'English'}}));

import {UnconnectedWallpaperPage} from '../../../src/components/tw-settings-modal/appearance-pages.jsx';
import {Theme} from '../../../src/lib/themes/index.js';

describe('wallpaper controls', () => {
    test('selects and removes saved wallpapers with separate buttons', () => {
        const onChangeTheme = jest.fn();
        const theme = new Theme().set('wallpaper', {
            url: '',
            opacity: 0.3,
            darkness: 0,
            gridVisible: true,
            history: ['https://example.com/wallpaper.png']
        });
        const wrapper = mountWithIntl(
            <UnconnectedWallpaperPage
                theme={theme}
                onChangeTheme={onChangeTheme}
            />
        );

        const choices = wrapper.find('button[aria-pressed]');
        expect(choices).toHaveLength(2);
        expect(choices.at(0).prop('aria-pressed')).toBe(true);

        choices.at(1).simulate('click', {currentTarget: {value: 'https://example.com/wallpaper.png'}});
        expect(onChangeTheme.mock.calls[0][0].wallpaper.url).toBe('https://example.com/wallpaper.png');

        wrapper.find('button[aria-label="Remove wallpaper"]').simulate('click', {
            currentTarget: {value: 'https://example.com/wallpaper.png'}
        });
        expect(onChangeTheme.mock.calls[1][0].wallpaper.history).toEqual([]);
    });
});
