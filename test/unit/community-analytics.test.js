import {
    analyticsEnabled,
    setAnalyticsEnabled,
    trackApiSuccess
} from '../../src/community/analytics.js';

describe('community analytics privacy controls', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    test('analytics can be disabled and enabled locally', () => {
        setAnalyticsEnabled(false);
        expect(analyticsEnabled()).toBe(false);
        setAnalyticsEnabled(true);
        expect(analyticsEnabled()).toBe(true);
    });

    test('unrelated API requests do not attempt to send events', () => {
        const fetchSpy = jest.fn();
        global.fetch = fetchSpy;
        trackApiSuccess('/projects/example/comments', 'POST');
        expect(fetchSpy).not.toHaveBeenCalled();
        delete global.fetch;
    });

    test('falls back to fetch when the browser refuses to queue a beacon', () => {
        const originalStatusUrl = process.env.MW_STATUS_URL;
        const originalSendBeacon = navigator.sendBeacon;
        const fetchSpy = jest.fn(() => Promise.resolve());
        process.env.MW_STATUS_URL = 'https://status.example';
        jest.resetModules();
        const {track} = require('../../src/community/analytics.js');
        navigator.sendBeacon = jest.fn(() => false);
        global.fetch = fetchSpy;

        track('home_view');

        expect(navigator.sendBeacon).toHaveBeenCalledTimes(1);
        expect(fetchSpy).toHaveBeenCalledWith(
            expect.stringMatching(/\/v1\/events$/),
            expect.objectContaining({method: 'POST', keepalive: true})
        );
        if (typeof originalStatusUrl === 'undefined') delete process.env.MW_STATUS_URL;
        else process.env.MW_STATUS_URL = originalStatusUrl;
        navigator.sendBeacon = originalSendBeacon;
        delete global.fetch;
        jest.resetModules();
    });
});
