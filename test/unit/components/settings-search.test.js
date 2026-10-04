import {normalizeSearchText, searchSettingsPages} from '../../../src/components/tw-settings-modal/settings-search.js';

const pages = [
    {id: 'general', label: 'General', keywords: 'framerate fps interpolation'},
    {id: 'theme', label: 'Theme', keywords: 'dark light accent'},
    {id: 'customThemes', label: 'Custom themes', keywords: 'marketplace import'},
    {id: 'editor', label: 'Editor', keywords: 'stage palette'},
    {id: 'addons', label: 'Addons', keywords: 'extensions tweaks'}
];

describe('settings search', () => {
    test('an empty query matches nothing', () => {
        expect(searchSettingsPages(pages, '')).toEqual([]);
        expect(searchSettingsPages(pages, '   ')).toEqual([]);
    });

    test('matches page titles and keywords without caring about case', () => {
        expect(searchSettingsPages(pages, 'FPS').map(page => page.id)).toEqual(['general']);
        expect(searchSettingsPages(pages, 'addons').map(page => page.id)).toEqual(['addons']);
    });

    test('matches setting text for a page', () => {
        const pageText = {editor: ['Hide Backpack', 'Hides the backpack bar at the bottom of the editor.']};
        expect(searchSettingsPages(pages, 'backpack', pageText).map(page => page.id)).toEqual(['editor']);
    });

    test('every word of the query must match', () => {
        expect(searchSettingsPages(pages, 'dark accent').map(page => page.id)).toEqual(['theme']);
        expect(searchSettingsPages(pages, 'dark marketplace')).toEqual([]);
    });

    test('pages whose title matches come before pages that only match keywords', () => {
        const withThemeKeyword = pages.concat({id: 'blocks', label: 'Blocks', keywords: 'theme colors'});
        expect(searchSettingsPages(withThemeKeyword, 'theme').map(page => page.id))
            .toEqual(['theme', 'customThemes', 'blocks']);
    });

    test('ignores accents', () => {
        expect(normalizeSearchText('Thème')).toBe('theme');
        expect(searchSettingsPages([{id: 'theme', label: 'Thème'}], 'theme').map(page => page.id))
            .toEqual(['theme']);
    });
});
