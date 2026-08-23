import {newsLinkReady, newsPollReady} from '../../src/community/pages/News.jsx';

jest.mock('../../src/lib/themes/custom-themes.js', () => ({
    customThemeManager: {themes: {clear: jest.fn()}, loadCustomThemes: jest.fn()}
}));

describe('News composer', () => {
    test('requires two non-empty options for polls', () => {
        expect(newsPollReady('update', [])).toBe(true);
        expect(newsPollReady('poll', ['Yes', 'No'])).toBe(true);
        expect(newsPollReady('poll', ['Yes', '   '])).toBe(false);
    });

    test('requires complete, safe action links', () => {
        expect(newsLinkReady('', '')).toBe(true);
        expect(newsLinkReady('Roadmap', '/roadmap')).toBe(true);
        expect(newsLinkReady('Website', 'https://example.com')).toBe(true);
        expect(newsLinkReady('Bad', 'javascript:alert(1)')).toBe(false);
        expect(newsLinkReady('', '/roadmap')).toBe(false);
    });
});
