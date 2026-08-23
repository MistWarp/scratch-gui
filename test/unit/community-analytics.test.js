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
});
