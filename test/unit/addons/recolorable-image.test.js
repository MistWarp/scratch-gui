import {TextDecoder} from 'util';
import createRecolorableImage from '../../../src/addons/recolorable-image';

const svg = '<svg xmlns="http://www.w3.org/2000/svg"><path fill="#855cd6"/></svg>';
const displayed = image => decodeURIComponent(image.getAttribute('src').split(',')[1]);

beforeEach(() => {
    global.TextDecoder = TextDecoder;
});

test.each([
    `data:image/svg+xml,${encodeURIComponent(svg)}`,
    `data:image/svg+xml;base64,${btoa(svg)}`
])('recolors inline SVGs and responds to theme updates: %s', source => {
    let color = '#abcdef';
    const callbacks = [];
    const image = createRecolorableImage(() => color, callbacks);
    image.src = source;
    expect(displayed(image)).toContain('#abcdef');
    color = '#123456';
    callbacks[0]();
    expect(displayed(image)).toContain('#123456');
    expect(image.src).toBe(source);
});

test('malformed data URLs do not throw during add-on startup', () => {
    const image = createRecolorableImage(() => '#abcdef', []);
    expect(() => { image.src = 'data:image/svg+xml;base64,%%%'; }).not.toThrow();
    expect(image.getAttribute('src')).toBe('data:image/svg+xml;base64,%%%');
});

test('an older SVG download cannot replace a newer source', async () => {
    const originalFetch = global.fetch;
    let resolve;
    global.fetch = jest.fn(() => new Promise(done => { resolve = done; }));
    try {
        const image = createRecolorableImage(() => '#abcdef', []);
        image.src = '/assets/icon.svg';
        image.src = '/assets/photo.png';
        resolve({ok: true, text: () => Promise.resolve(svg)});
        for (let i = 0; i < 5; i++) await Promise.resolve();
        expect(image.getAttribute('src')).toBe('/assets/photo.png');
    } finally {
        global.fetch = originalFetch;
    }
});

test('recolors SVG file URLs used by the development server', async () => {
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockResolvedValue({ok: true, text: () => Promise.resolve(svg)});
    try {
        const image = createRecolorableImage(() => '#abcdef', []);
        image.src = '/assets/icon.svg';
        for (let i = 0; i < 5; i++) await Promise.resolve();
        expect(displayed(image)).toContain('#abcdef');
    } finally {
        global.fetch = originalFetch;
    }
});
