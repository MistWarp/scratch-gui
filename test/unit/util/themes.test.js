import {Theme, BLOCKS_THREE, BLOCKS_DARK} from '../../../src/lib/themes';
import {injectExtensionBlockTheme, injectExtensionCategoryTheme} from '../../../src/lib/themes/blockHelpers';
import {detectTheme, persistTheme} from '../../../src/lib/themes/themePersistance';

const STORAGE_KEY = 'tw:theme';

describe('themes', () => {
    beforeEach(() => {
        localStorage.removeItem(STORAGE_KEY);
    });

    describe('core functionality', () => {
        test('a default Theme falls back to the default accent, gui and blocks', () => {
            const theme = new Theme();

            expect(theme.gui).toBe('light');
            expect(theme.blocks).toBe(BLOCKS_THREE);
            expect(theme.isDark()).toBe(false);
        });

        test('exposes a default theme per gui option', () => {
            expect(Theme.defaults.light.isDark()).toBe(false);
            expect(Theme.defaults.dark.isDark()).toBe(true);
        });

        test('set() returns a new theme and leaves the original alone', () => {
            const theme = Theme.defaults.light;
            const dark = theme.set('blocks', BLOCKS_DARK);

            expect(dark.blocks).toBe(BLOCKS_DARK);
            expect(theme.blocks).toBe(BLOCKS_THREE);
        });

        test('invalid values fall back to the defaults', () => {
            const theme = new Theme('not-an-accent', 'not-a-gui', 'not-a-blocks-theme');

            expect(theme.gui).toBe('light');
            expect(theme.blocks).toBe(BLOCKS_THREE);
        });
    });

    describe('block helpers', () => {
        test('leaves extension block colors alone for the default block theme', () => {
            const blockInfoJson = {
                type: 'dummy_block',
                colour: '#0FBD8C',
                colourSecondary: '#0DA57A',
                colourTertiary: '#0B8E69'
            };

            const updated = injectExtensionBlockTheme(blockInfoJson, Theme.defaults.light);

            expect(updated).toEqual(blockInfoJson);
        });

        test('updates extension block colors for a non-default block theme', () => {
            const blockInfoJson = {
                type: 'dummy_block',
                colour: '#0FBD8C',
                colourSecondary: '#0DA57A',
                colourTertiary: '#0B8E69'
            };

            const darkBlocks = Theme.defaults.light.set('blocks', BLOCKS_DARK);
            const updated = injectExtensionBlockTheme(blockInfoJson, darkBlocks);

            expect(updated.colour).not.toEqual(blockInfoJson.colour);
            expect(updated.type).toBe('dummy_block');
        });

        test('leaves the extension category XML alone for the default block theme', () => {
            const dynamicBlockXML = [
                {
                    id: 'pen',
                    xml: '<category name="Pen" id="pen" colour="#0FBD8C" secondaryColour="#0DA57A"></category>'
                }
            ];

            const result = injectExtensionCategoryTheme(dynamicBlockXML, Theme.defaults.light);

            expect(result).toEqual(dynamicBlockXML);
        });

        test('rewrites the extension category XML for a non-default block theme', () => {
            const dynamicBlockXML = [
                {
                    id: 'pen',
                    xml: '<category name="Pen" id="pen" colour="#0FBD8C" secondaryColour="#0DA57A"></category>'
                }
            ];

            const darkBlocks = Theme.defaults.light.set('blocks', BLOCKS_DARK);
            const result = injectExtensionCategoryTheme(dynamicBlockXML, darkBlocks);

            expect(result[0].id).toBe('pen');
            expect(result[0].xml).not.toEqual(dynamicBlockXML[0].xml);
            expect(result[0].xml).toContain('<category');
        });
    });

    describe('theme persistance', () => {
        test('persists a non-default theme to local storage', () => {
            persistTheme(Theme.defaults.dark);

            expect(JSON.parse(localStorage.getItem(STORAGE_KEY)).gui).toBe('dark');
        });

        test('reads a persisted theme back', () => {
            persistTheme(Theme.defaults.dark);

            expect(detectTheme().gui).toBe('dark');
            expect(detectTheme().isDark()).toBe(true);
        });

        test('clears storage when the theme matches system preferences', () => {
            persistTheme(Theme.defaults.dark);
            persistTheme(Theme.defaults.light);

            expect(localStorage.getItem(STORAGE_KEY)).toBe(null);
        });

        test('migrates the legacy "dark" string value', () => {
            localStorage.setItem(STORAGE_KEY, 'dark');

            expect(detectTheme().isDark()).toBe(true);
        });

        test('falls back to system preferences when storage is empty', () => {
            expect(detectTheme().gui).toBe('light');
        });
    });
});
