jest.mock('../../src/lib/rotur/identity.js', () => ({
    getRoturToken: () => 'rotur_test_token'
}));

import {
    cleanCommitName,
    generateCommitName,
    getSmartFeaturesBalance,
    topUpSmartFeatures
} from '../../src/lib/sable/smart-features.js';

describe('Sable smart features', () => {
    beforeEach(() => {
        global.fetch = jest.fn();
    });

    afterEach(() => {
        delete global.fetch;
    });

    test('sends the complete diff directly to Sable only when called', async () => {
        const diff = 'diff --git a/stage.fractch b/stage.fractch\n-old block\n+new block';
        global.fetch.mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({
                choices: [{text: 'Update stage blocks\n'}],
                sable: {charged_sc: 0.01, balance_sc: 9.99}
            })
        });

        const result = await generateCommitName(diff);

        expect(global.fetch).toHaveBeenCalledTimes(1);
        const [url, options] = global.fetch.mock.calls[0];
        expect(url).toBe('https://sable.rotur.dev/v1/completions');
        expect(options.headers.Authorization).toBe('Bearer rotur_test_token');
        const request = JSON.parse(options.body);
        expect(request.model).toBe('sable/spark');
        expect(request.sable).toEqual({personality: 'none', remember: false, builtin_tools: false});
        expect(request.prompt).toContain(diff);
        expect(result).toEqual({name: 'Update stage blocks', charged: 0.01, balance: 9.99});
    });

    test('uses Sable HTTP balance routes directly', async () => {
        global.fetch
            .mockResolvedValueOnce({ok: true, json: () => Promise.resolve({credits: 4, rc: 20})})
            .mockResolvedValueOnce({ok: true, json: () => Promise.resolve({credits: 14, rc: 10})});

        await expect(getSmartFeaturesBalance()).resolves.toEqual({credits: 4, rc: 20});
        await expect(topUpSmartFeatures()).resolves.toEqual({credits: 14, rc: 10});
        expect(global.fetch.mock.calls[1][0]).toBe('https://sable.rotur.dev/v1/balance/topup');
        expect(JSON.parse(global.fetch.mock.calls[1][1].body)).toEqual({amount: 10});
    });

    test('cleans a model response into one short title', () => {
        expect(cleanCommitName('"Add multiplayer lobby."\nIgnore me')).toBe('Add multiplayer lobby');
    });

});
