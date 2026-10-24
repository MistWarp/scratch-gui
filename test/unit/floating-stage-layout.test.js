import {
    DEFAULT_LAYOUT,
    MARGIN,
    MAX_WIDTH,
    MIN_WIDTH,
    boxFor,
    defaultLayoutFor,
    fitWidth,
    nextCorner,
    normalizeLayout,
    readLayout,
    snapToCorner,
    writeLayout
} from '../../src/lib/floating-stage-layout.js';

const host = {width: 1200, height: 800};
const size = {width: 360, height: 300};
const TOP = 76;
const BOTTOM = 36;

describe('floating stage layout', () => {
    beforeEach(() => window.localStorage.clear());

    test('the default sits in the top right corner below the editor strip', () => {
        expect(boxFor({layout: DEFAULT_LAYOUT, host, size})).toEqual({
            left: host.width - size.width - MARGIN,
            top: TOP + MARGIN
        });
    });

    test('a bottom corner keeps clear of the panel bar', () => {
        const box = boxFor({layout: {...DEFAULT_LAYOUT, corner: 'bottom-left'}, host, size});
        expect(box).toEqual({left: MARGIN, top: host.height - BOTTOM - size.height - MARGIN});
    });

    test('the window stays inside the editor when the editor shrinks', () => {
        const layout = {...DEFAULT_LAYOUT, corner: 'top-left', dx: 900, dy: 600};
        const box = boxFor({layout, host: {width: 800, height: 600}, size});
        expect(box.left + size.width).toBeLessThanOrEqual(800);
        expect(box.top + size.height).toBeLessThanOrEqual(600 - BOTTOM);
    });

    test('dropping near an edge snaps to the margin of the nearest corner', () => {
        const right = host.width - size.width - 20;
        expect(snapToCorner({left: right, top: TOP + 5, host, size})).toEqual({
            corner: 'top-right',
            dx: MARGIN,
            dy: MARGIN
        });
        expect(snapToCorner({left: 10, top: host.height, host, size})).toEqual({
            corner: 'bottom-left',
            dx: MARGIN,
            dy: MARGIN
        });
    });

    test('dropping away from the edges keeps the distance to the nearest corner', () => {
        const snapped = snapToCorner({left: 200, top: TOP + 150, host, size});
        expect(snapped).toEqual({corner: 'top-left', dx: 200, dy: 150});
        expect(boxFor({layout: {...DEFAULT_LAYOUT, ...snapped}, host, size})).toEqual({left: 200, top: TOP + 150});
    });

    test('width is clamped to the space available and the stage aspect ratio', () => {
        const fitTo = width => fitWidth({width, host, aspect: 0.75, chromeHeight: 50, chromeWidth: 16});
        expect(fitTo(10)).toBe(MIN_WIDTH);
        expect(fitTo(5000)).toBeLessThanOrEqual(MAX_WIDTH);
        const tall = fitTo(5000);
        expect(((tall - 16) * 0.75) + 50).toBeLessThanOrEqual(host.height - TOP - BOTTOM - (MARGIN * 2) + 1);
    });

    test('arrow keys move the window to the neighbouring corner', () => {
        expect(nextCorner('top-right', 'ArrowLeft')).toBe('top-left');
        expect(nextCorner('top-right', 'ArrowDown')).toBe('bottom-right');
        expect(nextCorner('bottom-left', 'ArrowUp')).toBe('top-left');
        expect(nextCorner('bottom-left', 'ArrowRight')).toBe('bottom-right');
        expect(nextCorner('bottom-left', 'Enter')).toBe('bottom-left');
    });

    test('stored layouts are validated', () => {
        expect(normalizeLayout({corner: 'middle', dx: -5, dy: 'x', width: 99999, collapsed: 1})).toEqual({
            corner: 'top-right',
            dx: 0,
            dy: MARGIN,
            width: MAX_WIDTH,
            collapsed: true
        });
        window.localStorage.setItem('mw:code-mode:floating-stage', '{broken');
        expect(readLayout()).toEqual(DEFAULT_LAYOUT);
    });

    test('measured insets keep the window off the explorer and an open panel', () => {
        const measured = {...host, insets: {top: 80, right: 0, bottom: 240, left: 250}};
        expect(boxFor({layout: {...DEFAULT_LAYOUT, corner: 'bottom-left'}, host: measured, size})).toEqual({
            left: 250 + MARGIN,
            top: host.height - 240 - size.height - MARGIN
        });
    });

    test('a short editor shrinks the window below the usual minimum so it still fits', () => {
        const short = {width: 1200, height: 450, insets: {top: 76, right: 0, bottom: 36, left: 0}};
        const width = fitWidth({width: 360, host: short, aspect: 640 / 360, chromeHeight: 50, chromeWidth: 16});
        expect(width).toBeLessThan(MIN_WIDTH);
        expect(((width - 16) * (640 / 360)) + 50).toBeLessThanOrEqual(450 - 76 - 36 - (MARGIN * 2) + 1);
    });

    test('right to left layouts start in the top left corner', () => {
        expect(defaultLayoutFor(true).corner).toBe('top-left');
        expect(readLayout(true).corner).toBe('top-left');
        expect(readLayout(false).corner).toBe('top-right');
    });

    test('a written layout reads back', () => {
        const layout = {corner: 'bottom-left', dx: 40, dy: 12, width: 500, collapsed: true};
        writeLayout(layout);
        expect(readLayout()).toEqual(layout);
    });
});
