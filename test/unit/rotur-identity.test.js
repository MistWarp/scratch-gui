jest.mock('../../src/lib/rotur/client.js', () => ({
    restoreSession: jest.fn(),
    login: jest.fn(() => Promise.resolve({username: 'new-user'})),
    logout: jest.fn(),
    getRotur: () => ({token: 'new-rotur-token'})
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
        logout: jest.fn()
    };
});

jest.mock('../../src/lib/rotur/cloud-sync.js', () => ({onRoturLogout: jest.fn()}));
jest.mock('../../src/lib/rotur/git-api.js', () => ({clearGitAuth: jest.fn()}));

import {login, restore} from '../../src/lib/rotur/identity.js';
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
