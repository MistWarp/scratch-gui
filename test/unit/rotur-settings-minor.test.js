import {
    applyRoturSettingsSnapshot,
    getRoturSettings,
    getRoturSettingsSnapshot,
    subscribeRoturSettings,
    updateRoturSettings
} from '../../src/lib/rotur/settings.js';
import {isMinorAccount, setMinorAccount} from '../../src/lib/minor-account.js';

const STORAGE_KEY = 'mw:rotur-settings';

describe('Rotur presence defaults for under-18 accounts', () => {
    beforeEach(() => {
        localStorage.clear();
        setMinorAccount(false);
    });

    test('adults share presence and edit duration by default', () => {
        expect(getRoturSettings()).toEqual({
            presenceEnabled: true,
            includeEditDuration: true,
            activitySharing: 'ask'
        });
    });

    test('minors start with presence and edit duration off', () => {
        setMinorAccount(true);
        expect(isMinorAccount()).toBe(true);
        expect(getRoturSettings()).toEqual({
            presenceEnabled: false,
            includeEditDuration: false,
            activitySharing: 'ask'
        });
    });

    test('a choice the user made is kept for a minor', () => {
        setMinorAccount(true);
        updateRoturSettings({presenceEnabled: true});
        expect(getRoturSettings().presenceEnabled).toBe(true);
        expect(getRoturSettings().includeEditDuration).toBe(false);
    });

    test('changing one setting does not choose the others', () => {
        updateRoturSettings({activitySharing: 'off'});
        setMinorAccount(true);
        expect(getRoturSettings()).toEqual({
            presenceEnabled: false,
            includeEditDuration: false,
            activitySharing: 'off'
        });
    });

    test('legacy storage only counts values that differ from the old defaults as choices', () => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            presenceEnabled: true,
            includeEditDuration: false,
            activitySharing: 'ask'
        }));
        setMinorAccount(true);
        expect(getRoturSettings()).toEqual({
            presenceEnabled: false,
            includeEditDuration: false,
            activitySharing: 'ask'
        });
        setMinorAccount(false);
        expect(getRoturSettings()).toEqual({
            presenceEnabled: true,
            includeEditDuration: false,
            activitySharing: 'ask'
        });
    });

    test('cloud snapshots carry which settings were chosen', () => {
        updateRoturSettings({includeEditDuration: false});
        const snapshot = getRoturSettingsSnapshot();
        expect(snapshot.chosen).toEqual(['includeEditDuration']);
        localStorage.clear();
        setMinorAccount(true);
        applyRoturSettingsSnapshot({...snapshot, presenceEnabled: true});
        expect(getRoturSettings().presenceEnabled).toBe(false);
        expect(getRoturSettings().includeEditDuration).toBe(false);
        applyRoturSettingsSnapshot({presenceEnabled: true, includeEditDuration: true, activitySharing: 'ask'});
        expect(getRoturSettings().presenceEnabled).toBe(false);
    });

    test('subscribers hear about the new defaults when the minor flag changes', () => {
        const listener = jest.fn();
        const unsubscribe = subscribeRoturSettings(listener);
        setMinorAccount(true);
        expect(listener).toHaveBeenLastCalledWith(expect.objectContaining({presenceEnabled: false}));
        setMinorAccount(false);
        expect(listener).toHaveBeenLastCalledWith(expect.objectContaining({presenceEnabled: true}));
        unsubscribe();
    });
});
