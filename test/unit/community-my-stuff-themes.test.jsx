import React from 'react';
import {act} from 'react-dom/test-utils';
import {mount} from 'enzyme';
import {MemoryRouter, useLocation} from 'react-router-dom';

import api from '../../src/community/api.js';
import MyStuffThemes from '../../src/community/components/MyStuffThemes.jsx';
import Modal from '../../src/community/components/ui/Modal.jsx';
import {customThemeManager} from '../../src/lib/themes/custom-themes.js';
import {applyTheme, detectTheme, THEME_CHANGE_EVENT} from '../../src/lib/themes/themePersistance.js';

const localTheme = {
    uuid: 'local-1',
    name: 'Quiet dark',
    description: 'A calmer workspace',
    export: () => ({name: 'Quiet dark', gui: 'dark', blocks: 'three'})
};

jest.mock('../../src/community/api.js', () => ({
    __esModule: true,
    default: {themes: jest.fn()}
}));
jest.mock('../../src/lib/themes/custom-themes.js', () => ({
    customThemeManager: {
        getAllThemes: jest.fn(),
        removeTheme: jest.fn(),
        subscribe: jest.fn(() => jest.fn())
    }
}));
jest.mock('../../src/lib/themes/themePersistance.js', () => ({
    applyTheme: jest.fn(),
    detectTheme: jest.fn(),
    THEME_CHANGE_EVENT: 'mw:theme-change'
}));
jest.mock('../../src/community/components/ThemePreview.jsx', () => ({theme}) => (
    <span data-preview={theme.name} />
));
jest.mock('../../src/community/components/ThemeCard.jsx', () => ({theme}) => (
    <span data-theme-card={theme.id}>{theme.name}</span>
));

const LocationProbe = () => <span data-location={useLocation().search} />;

describe('My Stuff themes', () => {
    let themeChangeListener;

    beforeEach(() => {
        jest.clearAllMocks();
        localStorage.removeItem('tw:theme');
        themeChangeListener = null;
        detectTheme.mockReturnValue({});
        customThemeManager.getAllThemes.mockReturnValue([localTheme]);
        customThemeManager.subscribe.mockImplementation(listener => {
            themeChangeListener = listener;
            return jest.fn();
        });
        api.themes.mockResolvedValue({themes: [{id: 'published-1', name: 'Published theme'}]});
    });

    test('applies local themes and loads published themes only when requested', async () => {
        let wrapper;
        await act(async () => {
            wrapper = mount(
                <MemoryRouter
                    initialEntries={['/mystuff?section=themes']}
                    future={{v7_startTransition: true, v7_relativeSplatPath: true}}
                >
                    <MyStuffThemes username="Sophie" />
                    <LocationProbe />
                </MemoryRouter>
            );
        });
        wrapper.update();

        expect(wrapper.text()).toContain('Quiet dark');
        expect(api.themes).not.toHaveBeenCalled();
        wrapper.find('button').filterWhere(button => button.text() === 'Apply').simulate('click');
        expect(applyTheme).toHaveBeenCalledWith(localTheme);

        await act(async () => {
            wrapper.find('button').filterWhere(button => button.text() === 'Published on WarpTheme').simulate('click');
            await Promise.resolve();
        });
        wrapper.update();

        expect(api.themes).toHaveBeenCalledWith({owner: 'Sophie', sort: 'newest'});
        expect(wrapper.text()).toContain('Published theme');
        expect(wrapper.find(LocationProbe).find('span').prop('data-location'))
            .toBe('?section=themes&themeView=published');
        wrapper.unmount();
    });

    test('normalizes an invalid library view without loading published themes', async () => {
        let wrapper;
        await act(async () => {
            wrapper = mount(
                <MemoryRouter
                    initialEntries={['/mystuff?section=themes&themeView=missing']}
                    future={{v7_startTransition: true, v7_relativeSplatPath: true}}
                >
                    <MyStuffThemes username="Sophie" />
                    <LocationProbe />
                </MemoryRouter>
            );
            await Promise.resolve();
        });
        wrapper.update();

        expect(wrapper.find(LocationProbe).find('span').prop('data-location')).toBe('?section=themes');
        expect(wrapper.text()).toContain('Quiet dark');
        expect(api.themes).not.toHaveBeenCalled();
        wrapper.unmount();
    });

    test('marks the saved theme that is active when the library opens', async () => {
        detectTheme.mockReturnValue(localTheme);
        let wrapper;
        await act(async () => {
            wrapper = mount(
                <MemoryRouter future={{v7_startTransition: true, v7_relativeSplatPath: true}}>
                    <MyStuffThemes username="Sophie" />
                </MemoryRouter>
            );
        });
        wrapper.update();

        expect(wrapper.find('button').filterWhere(button => button.text() === 'Applied')).toHaveLength(1);
        expect(wrapper.find('button').filterWhere(button => button.text() === 'Applied').prop('disabled')).toBe(true);
        expect(wrapper.find('a').filterWhere(link => link.text().includes('Edit library'))).toHaveLength(1);
        expect(wrapper.text()).not.toContain('Manage');

        detectTheme.mockReturnValue({});
        act(() => {
            window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
        });
        wrapper.update();
        expect(wrapper.find('button').filterWhere(button => button.text() === 'Apply')).toHaveLength(1);
        wrapper.unmount();
    });

    test('falls back when another theme control removes the active theme', async () => {
        localStorage.setItem('tw:theme', JSON.stringify({isCustom: true, customThemeUuid: 'local-1'}));
        detectTheme.mockReturnValue(localTheme);
        let wrapper;
        await act(async () => {
            wrapper = mount(
                <MemoryRouter future={{v7_startTransition: true, v7_relativeSplatPath: true}}>
                    <MyStuffThemes username="Sophie" />
                </MemoryRouter>
            );
        });
        wrapper.update();

        const fallback = {uuid: 'default'};
        customThemeManager.getAllThemes.mockReturnValue([]);
        detectTheme.mockReturnValue(fallback);
        act(() => themeChangeListener());
        wrapper.update();

        expect(applyTheme).toHaveBeenCalledWith(fallback);
        expect(wrapper.text()).toContain('Your library is empty');
        expect(wrapper.find('a').filterWhere(link => link.text() === 'Create a theme').prop('href'))
            .toBe('/settings?section=theme&tab=custom&themeAction=create');
        wrapper.unmount();
    });

    test('confirms local theme removal inside My Stuff', async () => {
        let wrapper;
        await act(async () => {
            wrapper = mount(
                <MemoryRouter future={{v7_startTransition: true, v7_relativeSplatPath: true}}>
                    <MyStuffThemes username="Sophie" />
                </MemoryRouter>
            );
        });
        wrapper.update();

        wrapper.find('button[aria-label="Remove Quiet dark"]').simulate('click');
        expect(wrapper.find(Modal).prop('title')).toBe('Remove saved theme?');
        wrapper.find(Modal).find('button').filterWhere(button => button.text() === 'Remove theme').simulate('click');
        expect(customThemeManager.removeTheme).toHaveBeenCalledWith('local-1');
        wrapper.unmount();
    });

    test('warns when removing the active local theme', async () => {
        detectTheme.mockReturnValue(localTheme);
        let wrapper;
        await act(async () => {
            wrapper = mount(
                <MemoryRouter future={{v7_startTransition: true, v7_relativeSplatPath: true}}>
                    <MyStuffThemes username="Sophie" />
                </MemoryRouter>
            );
        });
        wrapper.update();

        wrapper.find('button[aria-label="Remove Quiet dark"]').simulate('click');
        expect(wrapper.find(Modal).text()).toContain('Removing it will switch MistWarp to its fallback theme.');
        wrapper.unmount();
    });
});
