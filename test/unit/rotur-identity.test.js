const mockSession = {listener: null, account: 'id-1'};
jest.mock('../../src/lib/rotur/client.js', () => ({
    restoreSession: jest.fn(),
    login: jest.fn(() => Promise.resolve({username: 'new-user'})),
    logout: jest.fn(),
    getRotur: () => ({token: 'new-rotur-token'}),
    getAccessToken: () => Promise.resolve('new-rotur-token'),
    needsReconnect: () => false,
    accountKey: () => mockSession.account,
    onSessionChange: jest.fn(listener => {
        mockSession.listener = listener;
    })
}));

jest.mock('../../src/lib/community/api.js', () => {
    const exchangeValidator = jest.fn(() => Promise.resolve({token: 'new-mist-session'}));
    return {
        exchangeValidator,
        runExchange: token => exchangeValidator(token),
        onAuthInvalid: jest.fn(),
        onBanned: jest.fn(),
        loadSession: () => global.localStorage.getItem('mw:mistwarp-session'),
        storeSession: token => {
            if (token) global.localStorage.setItem('mw:mistwarp-session', token);
            else global.localStorage.removeItem('mw:mistwarp-session');
        },
        logout: jest.fn(),
        setRoturTokenGetter: jest.fn()
    };
});

jest.mock('../../src/lib/rotur/cloud-sync.js', () => ({onRoturLogout: jest.fn()}));
jest.mock('../../src/lib/rotur/git-api.js', () => ({clearGitAuth: jest.fn()}));

import {getState, login, restore} from '../../src/lib/rotur/identity.js';
import {exchangeValidator} from '../../src/lib/community/api.js';
import {logout as roturLogout, restoreSession} from '../../src/lib/rotur/client.js';

test('switching Rotur accounts exchanges a fresh MistWarp session', async () => {
    localStorage.setItem('mw:mistwarp-session', 'old-account-session');

    await expect(login()).resolves.toEqual({username: 'new-user'});

    expect(exchangeValidator).toHaveBeenCalledWith('new-rotur-token');
    expect(localStorage.getItem('mw:mistwarp-session')).toBeNull();
});

test('a rejected validator invalidates the Rotur login', async () => {
    const error = Object.assign(new Error('permission denied'), {code: 'VALIDATOR_GENERATION_FAILED'});
    exchangeValidator.mockRejectedValueOnce(error);

    await expect(login()).rejects.toBe(error);

    expect(roturLogout).toHaveBeenCalled();
    expect(localStorage.getItem('mw:mistwarp-session')).toBeNull();
});

test('restoring retries when Rotur is briefly unreachable', async () => {
    jest.useFakeTimers();
    localStorage.setItem('mw:mistwarp-session', 'existing-session');
    const unreachable = Object.assign(new Error('Could not reach Rotur'), {transient: true});
    restoreSession
        .mockRejectedValueOnce(unreachable)
        .mockResolvedValueOnce({username: 'returning-user'});

    const restored = restore();
    await jest.advanceTimersByTimeAsync(1000);

    await expect(restored).resolves.toEqual({username: 'returning-user'});
    expect(restoreSession).toHaveBeenCalledTimes(2);
    jest.useRealTimers();
});

test('restoring gives up after repeated Rotur failures', async () => {
    jest.useFakeTimers();
    restoreSession.mockReset();
    restoreSession.mockRejectedValue(Object.assign(new Error('Could not reach Rotur'), {transient: true}));

    const restored = restore();
    await jest.advanceTimersByTimeAsync(4000);

    await expect(restored).resolves.toBeNull();
    expect(restoreSession).toHaveBeenCalledTimes(3);
    jest.useRealTimers();
});

test('a Rotur token in the address bar is never adopted', async () => {
    window.history.replaceState(null, '', '/editor?token=rotur_attacker-token&project=1');
    localStorage.setItem('mw:rotur-token', 'rotur_own-token');
    localStorage.setItem('mw:mistwarp-session', 'own-session');
    roturLogout.mockClear();
    restoreSession.mockResolvedValueOnce({username: 'own-user'});

    await expect(restore()).resolves.toEqual({username: 'own-user'});

    expect(localStorage.getItem('mw:rotur-token')).toBe('rotur_own-token');
    expect(localStorage.getItem('mw:mistwarp-session')).toBe('own-session');
    expect(roturLogout).not.toHaveBeenCalled();
});

test('switching account in another tab restores here as the new account', async () => {
    jest.useRealTimers();
    restoreSession.mockReset();
    localStorage.setItem('mw:mistwarp-session', 'old-account-session');
    restoreSession.mockResolvedValueOnce({username: 'sam', id: 'id-1'});
    await restore();
    expect(getState().user).toMatchObject({username: 'sam'});
    restoreSession.mockResolvedValueOnce({username: 'kit', id: 'id-2'});
    mockSession.listener({accessToken: 'b', subject: 'id-2', username: 'kit'});
    // The old account's MistWarp session goes straight away.
    expect(localStorage.getItem('mw:mistwarp-session')).toBeNull();
    for (let i = 0; i < 50 && (getState().user || {}).username !== 'kit'; i++) {
        await new Promise(resolve => setTimeout(resolve, 5));
    }
    expect(getState().user).toMatchObject({username: 'kit', id: 'id-2'});
    // The same account refreshing its token is not a switch.
    restoreSession.mockClear();
    mockSession.listener({accessToken: 'c', subject: 'id-2', username: 'kit'});
    expect(restoreSession).not.toHaveBeenCalled();
});

test('signing out of the old sign-in in another tab signs this tab out', async () => {
    restoreSession.mockReset();
    restoreSession.mockResolvedValueOnce({username: 'sam', id: 'id-1'});
    mockSession.account = 'rotur_legacy';
    await restore();
    expect(getState().user).toBeTruthy();
    mockSession.account = '';
    window.dispatchEvent(new StorageEvent('storage', {key: 'mw:rotur-token', newValue: null}));
    expect(getState().user).toBeNull();
    mockSession.account = 'id-1';
});
