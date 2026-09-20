jest.mock('../../src/lib/rotur/client.js', () => ({subscribeTier: jest.fn()}));
jest.mock('../../src/community/api', () => ({
    __esModule: true,
    default: {refreshPerks: jest.fn(), perksSeen: jest.fn()}
}));

import {subscribeTier} from '../../src/lib/rotur/client.js';
import api from '../../src/community/api';
import {watchTier} from '../../src/community/tier-watch.js';

const push = async hint => {
    await subscribeTier.mock.calls[subscribeTier.mock.calls.length - 1][0](hint);
};

beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    api.perksSeen.mockResolvedValue({ok: true});
});

test('a fresh browser celebrates an upgrade the server has not seen acknowledged', async () => {
    const onChange = jest.fn();
    api.refreshPerks.mockResolvedValue({current: {tier: 'Plus'}, upgradedFrom: 'Free'});
    watchTier('Mist', onChange);
    await push('Plus');

    expect(onChange.mock.calls[0][0]).toMatchObject({current: {tier: 'Plus'}, upgraded: true});
    expect(localStorage.getItem('mw:tier:mist')).toBeNull();

    await onChange.mock.calls[0][0].acknowledge();
    expect(api.perksSeen).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem('mw:tier:mist')).toBe('Plus');
});

test('an unacknowledged celebration comes back on the next load', async () => {
    api.refreshPerks.mockResolvedValue({current: {tier: 'Plus'}, upgradedFrom: 'Free'});
    watchTier('mist', () => {});
    await push('Plus');

    const onChange = jest.fn();
    watchTier('mist', onChange);
    await push('Plus');
    expect(api.refreshPerks).toHaveBeenCalledTimes(2);
    expect(onChange.mock.calls[0][0].upgraded).toBe(true);
});

test('a tier the server already acknowledged stays quiet and stops asking', async () => {
    const onChange = jest.fn();
    api.refreshPerks.mockResolvedValue({current: {tier: 'Plus'}, upgradedFrom: ''});
    watchTier('mist', onChange);
    await push('Plus');
    await push('Plus');

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0].upgraded).toBe(false);
    expect(api.refreshPerks).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem('mw:tier:mist')).toBe('Plus');
});

test('a failed refresh does not record the tier so the next load retries', async () => {
    const onChange = jest.fn();
    api.refreshPerks.mockRejectedValue(new Error('offline'));
    watchTier('mist', onChange);
    await push('Plus');

    expect(onChange.mock.calls[0][0]).toMatchObject({current: {tier: 'Plus'}, upgraded: false});
    expect(localStorage.getItem('mw:tier:mist')).toBeNull();
});
