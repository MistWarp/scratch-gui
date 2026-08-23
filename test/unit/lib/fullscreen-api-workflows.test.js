import FullscreenAPI from '../../../src/lib/api/fullscreen';

describe('fullscreen API', () => {
    let originalExitFullscreen;
    let originalRequestFullscreen;

    beforeEach(() => {
        originalExitFullscreen = document.exitFullscreen;
        originalRequestFullscreen = document.body.requestFullscreen;
    });

    afterEach(() => {
        document.exitFullscreen = originalExitFullscreen;
        document.body.requestFullscreen = originalRequestFullscreen;
    });

    test('returns the browser request promise', () => {
        const request = Promise.resolve();
        document.body.requestFullscreen = jest.fn(() => request);

        expect(FullscreenAPI.request()).toBe(request);
    });

    test('returns the browser exit promise', () => {
        const exiting = Promise.resolve();
        document.exitFullscreen = jest.fn(() => exiting);

        expect(FullscreenAPI.exit()).toBe(exiting);
    });
});
