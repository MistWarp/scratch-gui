import React from 'react';
import {act} from 'react-dom/test-utils';
import {mount} from 'enzyme';
import {Link, MemoryRouter, Route, Routes, useLocation} from 'react-router-dom';

import api from '../../src/community/api.js';
import ThemeCard from '../../src/community/components/ThemeCard.jsx';
import Button from '../../src/community/components/ui/Button.jsx';
import Modal from '../../src/community/components/ui/Modal.jsx';
import Theme, {nextThemeRating, savedThemeMatches, themeReturnContext} from '../../src/community/pages/Theme.jsx';
import Themes, {normalizeThemeBrowseParams} from '../../src/community/pages/Themes.jsx';
import {customThemeManager} from '../../src/lib/themes/custom-themes.js';

jest.mock('../../src/community/UserContext.jsx', () => ({
    useUser: () => ({user: {username: 'Sophie'}, login: jest.fn()})
}));
jest.mock('../../src/community/api.js', () => ({
    __esModule: true,
    default: {
        createTheme: jest.fn(),
        deleteTheme: jest.fn(() => Promise.resolve()),
        downloadTheme: jest.fn(),
        getTheme: jest.fn(),
        likeTheme: jest.fn(),
        saveTheme: jest.fn(),
        setThemePreview: jest.fn(() => Promise.resolve()),
        themes: jest.fn(() => Promise.resolve({themes: []})),
        updateTheme: jest.fn(() => Promise.resolve())
    }
}));
jest.mock('../../src/lib/themes/custom-themes.js', () => ({
    CustomTheme: {import: jest.fn(value => value)},
    customThemeManager: {
        addFromExportData: jest.fn(() => ({name: 'Saved theme'})),
        getAllThemes: jest.fn(() => []),
        subscribe: jest.fn(() => jest.fn())
    }
}));
jest.mock('../../src/lib/themes/themePersistance.js', () => ({
    applyTheme: jest.fn(),
    detectTheme: jest.fn(() => ({}))
}));
jest.mock('../../src/community/theme-utils.js', () => ({
    exportCurrentTheme: jest.fn(() => ({name: 'Current theme'}))
}));

const LocationProbe = () => <span data-location={useLocation().search} />;

describe('theme marketplace action locks', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        api.themes.mockResolvedValue({themes: []});
    });

    test('recognizes legacy library entries by theme and author', () => {
        expect(savedThemeMatches(
            {name: ' Quiet Dark ', author: 'MIST'},
            {id: 'remote-1', name: 'quiet dark', owner: 'Mist'}
        )).toBe(true);
        expect(savedThemeMatches(
            {sourceId: 'remote-2', name: 'Quiet Dark', author: 'Mist'},
            {id: 'remote-1', name: 'Quiet Dark', owner: 'Mist'}
        )).toBe(false);
    });

    test('keeps like counts accurate when WarpTheme omits the count', () => {
        expect(nextThemeRating({liked: false, likes: 4}, {liked: true})).toMatchObject({liked: true, likes: 5});
        expect(nextThemeRating({liked: true, likes: 4}, {liked: false})).toMatchObject({liked: false, likes: 3});
        expect(nextThemeRating({liked: false, likes: 4}, {liked: true, likes: 9}))
            .toMatchObject({liked: true, likes: 9});
    });

    test('normalizes invalid theme browse routes', () => {
        expect(normalizeThemeBrowseParams(new URLSearchParams('tab=unknown&sort=broken&q=dark')).toString())
            .toBe('q=dark');
        expect(normalizeThemeBrowseParams(new URLSearchParams('tab=publish&sort=newest')).toString())
            .toBe('tab=publish&sort=newest');
    });

    test('keeps the originating list when a theme card opens', () => {
        const wrapper = mount(
            <MemoryRouter
                initialEntries={['/mystuff?section=themes&themeView=published']}
                future={{v7_startTransition: true, v7_relativeSplatPath: true}}
            >
                <ThemeCard
                    returnLabel="Your themes"
                    theme={{id: 'theme-1', name: 'Quiet dark', owner: 'Sophie'}}
                />
            </MemoryRouter>
        );
        expect(wrapper.find(Link).prop('state')).toEqual({
            themeReturnLabel: 'Your themes',
            themeReturnTo: '/mystuff?section=themes&themeView=published'
        });
        expect(themeReturnContext({themeReturnLabel: 'Your themes', themeReturnTo: '/mystuff?section=themes'}))
            .toEqual({label: 'Your themes', to: '/mystuff?section=themes'});
        expect(themeReturnContext({themeReturnLabel: 'Bad', themeReturnTo: '//outside.example'}))
            .toEqual({label: 'All themes', to: '/themes'});
        wrapper.unmount();
    });

    test('updates theme search results and URL while typing', async () => {
        api.themes.mockResolvedValue({themes: [
            {id: 'quiet', name: 'Quiet dark', owner: 'Sophie'},
            {id: 'bright', name: 'Bright day', owner: 'Alex'}
        ]});
        let wrapper;
        await act(async () => {
            wrapper = mount(
                <MemoryRouter
                    initialEntries={['/themes']}
                    future={{v7_startTransition: true, v7_relativeSplatPath: true}}
                >
                    <Routes><Route path="/themes" element={<React.Fragment><Themes /><LocationProbe /></React.Fragment>} /></Routes>
                </MemoryRouter>
            );
            await Promise.resolve();
        });
        wrapper.update();

        act(() => {
            wrapper.find('input[aria-label="Search themes"]').simulate('change', {target: {value: 'quiet'}});
        });
        wrapper.update();

        expect(wrapper.find(LocationProbe).find('span').prop('data-location')).toBe('?q=quiet');
        expect(wrapper.text()).toContain('Quiet dark');
        expect(wrapper.text()).not.toContain('Bright day');
        wrapper.unmount();
    });

    test('shows a retry state when WarpTheme cannot load', async () => {
        api.themes
            .mockRejectedValueOnce(new Error('WarpTheme is unavailable.'))
            .mockResolvedValueOnce({themes: [{id: 'quiet', name: 'Quiet dark', owner: 'Sophie'}]});
        let wrapper;
        await act(async () => {
            wrapper = mount(
                <MemoryRouter future={{v7_startTransition: true, v7_relativeSplatPath: true}}>
                    <Themes />
                </MemoryRouter>
            );
            await Promise.resolve();
        });
        wrapper.update();

        expect(wrapper.text()).toContain('Could not load themes');
        expect(wrapper.text()).not.toContain('No themes found');
        await act(async () => {
            wrapper.find(Button).filterWhere(button => button.text() === 'Try again').simulate('click');
            await Promise.resolve();
        });
        wrapper.update();
        expect(wrapper.text()).toContain('Quiet dark');
        expect(api.themes).toHaveBeenCalledTimes(2);
        wrapper.unmount();
    });

    test('locks rapid theme detail actions', async () => {
        let finishLike;
        api.getTheme.mockResolvedValue({
            theme: {id: 'theme-1', name: 'Test theme', owner: 'Sophie', theme: {}, likes: 0}
        });
        api.likeTheme.mockReturnValue(new Promise(resolve => {
            finishLike = resolve;
        }));
        let wrapper;
        await act(async () => {
            wrapper = mount(
                <MemoryRouter
                    initialEntries={['/themes/theme-1']}
                    future={{v7_startTransition: true, v7_relativeSplatPath: true}}
                >
                    <Routes>
                        <Route path="/themes/:id" element={<Theme />} />
                        <Route path="/mystuff" element={<span>My Stuff themes</span>} />
                    </Routes>
                </MemoryRouter>
            );
            await Promise.resolve();
        });
        wrapper.update();
        const like = wrapper.find(Button).filterWhere(button => button.text().includes('Like')).prop('onClick');

        let first;
        act(() => {
            first = like();
            like();
        });
        wrapper.update();
        expect(api.likeTheme).toHaveBeenCalledTimes(1);
        expect(wrapper.find(Button).filterWhere(button => button.text().includes('Updating…'))).toHaveLength(1);
        expect(wrapper.find(Button).filterWhere(button => button.text().includes('Apply theme'))).toHaveLength(1);
        expect(wrapper.text()).not.toContain('Applying…');

        await act(async () => {
            finishLike({liked: true, likes: 1});
            await first;
        });
        wrapper.unmount();
    });

    test('asks owners to confirm deletion in the shared modal', async () => {
        api.getTheme.mockResolvedValue({
            theme: {id: 'theme-1', name: 'Test theme', owner: 'Sophie', theme: {}, likes: 0}
        });
        let wrapper;
        await act(async () => {
            wrapper = mount(
                <MemoryRouter
                    initialEntries={['/themes/theme-1']}
                    future={{v7_startTransition: true, v7_relativeSplatPath: true}}
                >
                    <Routes>
                        <Route path="/themes/:id" element={<Theme />} />
                        <Route path="/mystuff" element={<span>My Stuff themes</span>} />
                    </Routes>
                </MemoryRouter>
            );
            await Promise.resolve();
        });
        wrapper.update();

        wrapper.find(Button).filterWhere(button => button.text().includes('Delete')).simulate('click');
        expect(wrapper.find(Modal).prop('title')).toBe('Delete theme?');
        await act(async () => {
            await wrapper.find(Modal).find(Button)
                .filterWhere(button => button.text().includes('Delete theme'))
                .prop('onClick')();
        });
        expect(api.deleteTheme).toHaveBeenCalledWith('theme-1');
        wrapper.unmount();
    });

    test('lets owners edit published theme details', async () => {
        api.getTheme.mockResolvedValue({
            theme: {id: 'theme-1', name: 'Old name', description: 'Old copy', owner: 'Sophie', theme: {}}
        });
        let wrapper;
        await act(async () => {
            wrapper = mount(
                <MemoryRouter
                    initialEntries={['/themes/theme-1']}
                    future={{v7_startTransition: true, v7_relativeSplatPath: true}}
                >
                    <Routes><Route path="/themes/:id" element={<Theme />} /></Routes>
                </MemoryRouter>
            );
            await Promise.resolve();
        });
        wrapper.update();

        wrapper.find(Button).filterWhere(button => button.text().includes('Edit details')).simulate('click');
        const editModal = wrapper.find(Modal).filterWhere(modal => modal.prop('title') === 'Edit theme details');
        editModal.find('input').simulate('change', {target: {value: 'New name'}});
        editModal.find('textarea').simulate('change', {target: {value: 'New copy'}});
        await act(async () => {
            await wrapper.find(Modal).find(Button)
                .filterWhere(button => button.text().includes('Save changes'))
                .prop('onClick')();
        });
        wrapper.update();

        expect(api.updateTheme).toHaveBeenCalledWith('theme-1', {
            name: 'New name',
            description: 'New copy'
        });
        expect(wrapper.find('h1').text()).toBe('New name');
        wrapper.unmount();
    });

    test('recognizes a WarpTheme theme already saved in My Stuff', async () => {
        api.getTheme.mockResolvedValue({
            theme: {id: 'theme-1', name: 'Saved theme', owner: 'Mist', theme: {}}
        });
        customThemeManager.getAllThemes.mockReturnValue([{sourceId: 'theme-1'}]);
        let wrapper;
        await act(async () => {
            wrapper = mount(
                <MemoryRouter
                    initialEntries={['/themes/theme-1']}
                    future={{v7_startTransition: true, v7_relativeSplatPath: true}}
                >
                    <Routes><Route path="/themes/:id" element={<Theme />} /></Routes>
                </MemoryRouter>
            );
            await Promise.resolve();
        });
        wrapper.update();

        const savedButton = wrapper.find(Button)
            .filterWhere(button => button.text().includes('Saved to My Stuff'));
        expect(savedButton.prop('disabled')).toBe(true);
        wrapper.unmount();
    });

    test('locks rapid theme publishing submissions', async () => {
        let finishCreate;
        api.createTheme.mockReturnValue(new Promise(resolve => {
            finishCreate = resolve;
        }));
        let wrapper;
        await act(async () => {
            wrapper = mount(
                <MemoryRouter
                    initialEntries={['/themes?tab=publish']}
                    future={{v7_startTransition: true, v7_relativeSplatPath: true}}
                >
                    <Routes>
                        <Route path="/themes" element={<Themes />} />
                        <Route path="/themes/:id" element={<span>Published theme</span>} />
                    </Routes>
                </MemoryRouter>
            );
            await Promise.resolve();
        });
        wrapper.update();
        const publish = wrapper.find('form').prop('onSubmit');
        const event = {preventDefault: jest.fn()};

        let first;
        act(() => {
            first = publish(event);
            publish(event);
        });
        expect(api.createTheme).toHaveBeenCalledTimes(1);

        await act(async () => {
            finishCreate({theme: {id: 'created-theme'}});
            await first;
        });
        wrapper.unmount();
    });

    test('ignores an older theme file read that finishes last', async () => {
        let finishFirst;
        const firstFile = {text: () => new Promise(resolve => {
            finishFirst = resolve;
        })};
        const secondFile = {text: () => Promise.resolve(JSON.stringify({name: 'Second theme'}))};
        let wrapper;
        await act(async () => {
            wrapper = mount(
                <MemoryRouter
                    initialEntries={['/themes?tab=publish']}
                    future={{v7_startTransition: true, v7_relativeSplatPath: true}}
                >
                    <Routes><Route path="/themes" element={<Themes />} /></Routes>
                </MemoryRouter>
            );
            await Promise.resolve();
        });
        wrapper.update();
        wrapper.find('button').filterWhere(button => button.text().includes('Theme JSON')).simulate('click');
        const chooseFile = wrapper.find('input[accept="application/json,.json"]').prop('onChange');

        let first;
        await act(async () => {
            first = chooseFile({target: {files: [firstFile]}});
            await chooseFile({target: {files: [secondFile]}});
        });
        await act(async () => {
            finishFirst(JSON.stringify({name: 'First theme'}));
            await first;
        });
        wrapper.update();

        const nameInput = wrapper.find('label').filterWhere(label => label.text().startsWith('Name')).find('input');
        expect(nameInput.prop('value')).toBe('Second theme');
        wrapper.unmount();
    });

    test('ignores a pending theme file after switching back to the current theme', async () => {
        let finishRead;
        const file = {text: () => new Promise(resolve => {
            finishRead = resolve;
        })};
        let wrapper;
        await act(async () => {
            wrapper = mount(
                <MemoryRouter
                    initialEntries={['/themes?tab=publish']}
                    future={{v7_startTransition: true, v7_relativeSplatPath: true}}
                >
                    <Routes><Route path="/themes" element={<Themes />} /></Routes>
                </MemoryRouter>
            );
            await Promise.resolve();
        });
        wrapper.update();
        wrapper.find('button').filterWhere(button => button.text().includes('Theme JSON')).simulate('click');
        const read = wrapper.find('input[accept="application/json,.json"]').prop('onChange')({
            target: {files: [file]}
        });
        wrapper.find('button').filterWhere(button => button.text().includes('Current theme')).simulate('click');

        await act(async () => {
            finishRead(JSON.stringify({name: 'Late file'}));
            await read;
        });
        wrapper.update();

        expect(wrapper.find('label').filterWhere(label => label.text().startsWith('Name')).find('input').prop('value'))
            .toBe('');
        expect(wrapper.text()).not.toContain('Late file');
        wrapper.unmount();
    });
});
