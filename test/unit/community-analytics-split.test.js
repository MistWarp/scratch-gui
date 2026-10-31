/** @jest-environment-options {"url": "https://editor.mistwarp.org/"} */
const mockCall = jest.fn();
jest.mock('../../src/lib/account/bridge.js', () => ({call: (...args) => mockCall(...args)}));

const {setAnalyticsEnabled, syncAnalyticsChoice, track} = require('../../src/community/analytics.js');

const flush = () => new Promise(resolve => setTimeout(resolve, 0));

describe('analytics on the split editor origin', () => {
    let fetchSpy;

    beforeEach(() => {
        localStorage.clear();
        mockCall.mockReset();
        fetchSpy = jest.fn(() => Promise.resolve());
        global.fetch = fetchSpy;
    });

    afterEach(() => {
        delete global.fetch;
    });

    test('sends nothing until the account origin has confirmed the choice', async () => {
        track('editor_open');
        expect(fetchSpy).not.toHaveBeenCalled();
        mockCall.mockResolvedValue({enabled: false});
        await syncAnalyticsChoice();
        expect(mockCall).toHaveBeenCalledWith('analytics', {});
        track('editor_open');
        expect(fetchSpy).not.toHaveBeenCalled();
        mockCall.mockResolvedValue({enabled: true});
        await syncAnalyticsChoice();
        track('editor_open');
        expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    test('changing the choice in the editor updates the account origin', async () => {
        mockCall.mockResolvedValue({enabled: false});
        setAnalyticsEnabled(false);
        await flush();
        expect(mockCall).toHaveBeenCalledWith('analytics', {enabled: false});
    });
});
