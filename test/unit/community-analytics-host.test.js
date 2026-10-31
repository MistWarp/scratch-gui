/** @jest-environment-options {"url": "https://mistwarp-preview.pages.dev/"} */
import {track} from '../../src/community/analytics.js';

test('previews and dev servers do not add to the live counts', () => {
    const fetchSpy = jest.fn(() => Promise.resolve());
    global.fetch = fetchSpy;
    track('home_view');
    expect(fetchSpy).not.toHaveBeenCalled();
    delete global.fetch;
});
