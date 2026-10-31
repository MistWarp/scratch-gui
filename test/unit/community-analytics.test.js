/** @jest-environment-options {"url": "https://mistwarp.org/"} */
import {
    analyticsEnabled,
    setAnalyticsEnabled,
    track,
    trackApiSuccess
} from '../../src/community/analytics.js';
import {setMinorAccount} from '../../src/lib/minor-account.js';

describe('community analytics privacy controls', () => {
    let fetchSpy;

    beforeEach(() => {
        localStorage.clear();
        fetchSpy = jest.fn(() => Promise.resolve());
        global.fetch = fetchSpy;
    });

    afterEach(() => {
        delete global.fetch;
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
        track('home_view');
        expect(fetchSpy).not.toHaveBeenCalled();
        setMinorAccount(false);
        expect(analyticsEnabled()).toBe(true);
    });

    test('unrelated API requests do not attempt to send events', () => {
        trackApiSuccess('/projects/example/comments', 'POST');
        expect(fetchSpy).not.toHaveBeenCalled();
    });

    test('sends only the event name and variant to the API with a keepalive fetch', () => {
        track('project_view', {variant: 'signed_out', project: 'p123'});

        expect(fetchSpy).toHaveBeenCalledWith(
            'https://api.mistwarp.org/v1/events',
            expect.objectContaining({method: 'POST', keepalive: true, credentials: 'omit'})
        );
        expect(JSON.parse(fetchSpy.mock.calls[0][1].body)).toEqual({name: 'project_view', variant: 'signed_out'});
    });

    test('sends no variant when none is given', () => {
        track('editor_open');
        expect(JSON.parse(fetchSpy.mock.calls[0][1].body)).toEqual({name: 'editor_open'});
    });

    test('does not send events after analytics is turned off', () => {
        setAnalyticsEnabled(false);
        track('home_view');
        expect(fetchSpy).not.toHaveBeenCalled();
    });
});
