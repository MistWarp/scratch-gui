jest.mock('../../src/lib/rotur/client.js', () => ({
    restoreSession: jest.fn(),
    login: jest.fn(() => Promise.resolve({username: 'new-user'})),
    logout: jest.fn(),
    getRotur: () => ({token: 'new-rotur-token'})
}));

jest.mock('../../src/lib/community/api.js', () => ({
    exchangeValidator: jest.fn(() => Promise.resolve({token: 'new-mist-session'})),
    loadSession: () => global.localStorage.getItem('mw:mistwarp-session'),
    storeSession: token => {
        if (token) global.localStorage.setItem('mw:mistwarp-session', token);
        else global.localStorage.removeItem('mw:mistwarp-session');
    },
    logout: jest.fn()
}));

jest.mock('../../src/lib/rotur/cloud-sync.js', () => ({onRoturLogout: jest.fn()}));
jest.mock('../../src/lib/rotur/git-api.js', () => ({clearGitAuth: jest.fn()}));

import {login} from '../../src/lib/rotur/identity.js';
import {exchangeValidator} from '../../src/lib/community/api.js';
import {logout as roturLogout} from '../../src/lib/rotur/client.js';

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
