import {
    analyticsEnabled,
    setAnalyticsEnabled,
    trackApiSuccess
} from '../../src/community/analytics.js';
import {setMinorAccount} from '../../src/lib/minor-account.js';

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

    test('analytics stay off for accounts under 18', () => {
        setAnalyticsEnabled(true);
        setMinorAccount(true);
        expect(analyticsEnabled()).toBe(false);
        setMinorAccount(false);
        expect(analyticsEnabled()).toBe(true);
    });

    test('unrelated API requests do not attempt to send events', () => {
        const fetchSpy = jest.fn();
        global.fetch = fetchSpy;
        trackApiSuccess('/projects/example/comments', 'POST');
        expect(fetchSpy).not.toHaveBeenCalled();
        delete global.fetch;
    });

    test('sends events with a keepalive fetch when an analytics endpoint is configured', () => {
        const originalAnalyticsUrl = process.env.MW_ANALYTICS_URL;
        const fetchSpy = jest.fn(() => Promise.resolve());
        process.env.MW_ANALYTICS_URL = 'https://analytics.example';
        jest.resetModules();
        const {track} = require('../../src/community/analytics.js');
        global.fetch = fetchSpy;

        track('home_view');

        expect(fetchSpy).toHaveBeenCalledWith(
            'https://analytics.example/v1/events',
            expect.objectContaining({method: 'POST', keepalive: true, credentials: 'omit'})
        );
        if (typeof originalAnalyticsUrl === 'undefined') delete process.env.MW_ANALYTICS_URL;
        else process.env.MW_ANALYTICS_URL = originalAnalyticsUrl;
        delete global.fetch;
        jest.resetModules();
    });

    test('does not send events while no analytics endpoint is configured', () => {
        const originalAnalyticsUrl = process.env.MW_ANALYTICS_URL;
        const fetchSpy = jest.fn(() => Promise.resolve());
        delete process.env.MW_ANALYTICS_URL;
        jest.resetModules();
        const {track} = require('../../src/community/analytics.js');
        global.fetch = fetchSpy;

        track('home_view');

        expect(fetchSpy).not.toHaveBeenCalled();
        if (typeof originalAnalyticsUrl !== 'undefined') process.env.MW_ANALYTICS_URL = originalAnalyticsUrl;
        delete global.fetch;
        jest.resetModules();
    });
});
