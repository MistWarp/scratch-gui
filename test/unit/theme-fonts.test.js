import {applyThemeFonts, removeThemeFonts} from '../../src/lib/themes/fonts.js';

const themeFontSelector = () => {
    const css = document.getElementById('theme-fonts').textContent;
    return css.slice(css.indexOf('*:not('), css.indexOf('{')).trim();
};

describe('theme fonts', () => {
    beforeEach(async () => {
        document.body.innerHTML = '';
        await applyThemeFonts({system: ['Comic Sans MS']});
    });

    afterEach(() => {
        removeThemeFonts();
        document.body.innerHTML = '';
    });

    test('apply to editor interface text', () => {
        document.body.innerHTML = '<div><button><span>Costumes</span></button></div>';
        expect(document.querySelector('span').matches(themeFontSelector())).toBe(true);
    });

    test('leave alone the text that paper measures for costume bounds', () => {
        document.body.innerHTML = '<span style="visibility: hidden; font-family: Sans Serif;">' +
            '<svg><text><tspan>123123123123</tspan></text></svg></span>';
        expect(document.querySelector('span').matches(themeFontSelector())).toBe(false);
        expect(document.querySelector('text').matches(themeFontSelector())).toBe(false);
        expect(document.querySelector('tspan').matches(themeFontSelector())).toBe(false);
    });

    test('apply inside windows that set a font of their own', () => {
        document.body.innerHTML = '<div class="addon-window" style="font-family: Helvetica;">' +
            '<div style="font-family: Arial;"><button>Close</button></div></div>';
        expect(document.querySelector('button').matches(themeFontSelector())).toBe(true);
    });
});
