import {gradientStyle, safeColor} from '../../src/community/components/ThemePreview.jsx';
import {filterThemes} from '../../src/community/pages/Themes.jsx';

describe('theme marketplace previews', () => {
    test('matches WarpTheme accent gradients and stop ordering', () => {
        const style = gradientStyle({
            visual: {
                accent: {
                    direction: 90,
                    colors: [
                        {color: '#00ff00', position: 100},
                        {color: '#ffff00', position: 0}
                    ]
                }
            }
        });
        expect(style.background).toBe('linear-gradient(90deg, #ffff00 0%, #00ff00 100%)');
    });

    test('supports WarpTheme legacy primary and secondary colours', () => {
        const style = gradientStyle({
            visual: {colors: {primary: '#112233', secondary: '#aabbcc'}}
        });
        expect(style.background).toBe('linear-gradient(135deg, #112233 0%, #aabbcc 100%)');
    });

    test('rejects values that are not CSS colours', () => {
        expect(safeColor('url(https://example.com/a)')).toBe('');
    });

    test('filters themes by search, appearance, and block style', () => {
        const themes = [
            {name: 'Daylight', owner: 'Mist', visual: {gui: 'light', blocks: 'three'}},
            {name: 'After dark', owner: 'Sophie', visual: {gui: 'dark', blocks: 'custom'}}
        ];
        expect(filterThemes(themes, {appearance: 'dark', blocks: 'custom', query: 'sophie'}))
            .toEqual([themes[1]]);
        expect(filterThemes(themes, {appearance: 'light'})).toEqual([themes[0]]);
    });
});
