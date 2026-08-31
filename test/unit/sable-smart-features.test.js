jest.mock('../../src/lib/rotur/identity.js', () => ({
    getRoturToken: () => 'rotur_test_token'
}));

import {
    cleanCommitName,
    cleanSuggestedTags,
    generateCommitName,
    getSmartFeaturesBalance,
    suggestProjectTags,
    topUpSmartFeatures,
    usefulTag
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

    test('sends the full Fractch source and cleans suggested tags', async () => {
        const fractchSource = '// File: Stage.fractch\nwhen flag clicked { forever { move 10 steps } }';
        global.fetch.mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({
                choices: [{message: {content: '{"tags":["game","platformer","keyboard-controls","art"]}'}}],
                sable: {charged_sc: 0.03, balance_sc: 9.96}
            })
        });

        const result = await suggestProjectTags({
            title: 'Jump',
            instructions: 'Use the arrow keys.',
            notes: '',
            existingTags: ['art'],
            fractchSource
        });

        expect(global.fetch.mock.calls[0][0]).toBe('https://sable.rotur.dev/v1/chat/completions');
        const request = JSON.parse(global.fetch.mock.calls[0][1].body);
        expect(request.messages).toEqual(expect.arrayContaining([
            expect.objectContaining({role: 'user', content: expect.stringContaining(fractchSource)})
        ]));
        expect(request.messages[1].content).toContain('Current tags: ["art"]');
        expect(request.response_format).toEqual({type: 'json_object'});
        expect(request.temperature).toBe(0);
        expect(result).toEqual({
            tags: ['game', 'platformer', 'keyboard-controls'],
            charged: 0.03,
            balance: 9.96
        });
    });

    test('normalises model output and removes existing or duplicate tags', () => {
        expect(cleanSuggestedTags('["Platformer", "#MOBILE", "platformer", "Pixel Art"]', ['mobile']))
            .toEqual(['platformer', 'pixel-art']);
        expect(cleanSuggestedTags('{"tags":["Platformer", "Puzzle"]}')).toEqual(['platformer', 'puzzle']);
    });

    test('removes dialogue fragments and Fractch syntax from model tags', () => {
        const response = '["okay", "lets", "tackle", "this", "the", "user", "wants", "up", "clicked"]';
        expect(cleanSuggestedTags(response)).toEqual([]);
        expect(usefulTag('point-and-click')).toBe(true);
        expect(usefulTag('the-user')).toBe(false);
    });
});
