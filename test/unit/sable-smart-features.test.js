jest.mock('../../src/lib/rotur/identity.js', () => ({
    getRoturToken: () => 'rotur_test_token'
}));

import {
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
                choices: [{message: {
                    content: null,
                    tool_calls: [{
                        id: 'call_commit',
                        type: 'function',
                        function: {name: 'commit', arguments: '{"name":"fix(stage) update stage blocks"}'}
                    }]
                }}],
                sable: {charged_sc: 0.01, balance_sc: 9.99}
            })
        });

        const result = await generateCommitName(diff);

        expect(global.fetch).toHaveBeenCalledTimes(1);
        const [url, options] = global.fetch.mock.calls[0];
        expect(url).toBe('https://sable.rotur.dev/v1/chat/completions');
        expect(options.headers.Authorization).toBe('Bearer rotur_test_token');
        const request = JSON.parse(options.body);
        expect(request.model).toBe('sable/spark');
        expect(request.sable).toEqual({personality: 'none', remember: false, builtin_tools: false});
        expect(JSON.parse(request.messages[1].content)).toEqual({diff});
        expect(request.tools[0].function.name).toBe('commit');
        expect(request.tools[0].function.parameters.required).toEqual(['name']);
        expect(request.max_completion_tokens).toBe(512);
        expect(result).toEqual({name: 'fix(stage) update stage blocks', charged: 0.01, balance: 9.99});
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

    test('asks Sable to call the commit tool again when it answers in text', async () => {
        global.fetch
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    choices: [{message: {content: "Okay, let's inspect the diff."}}],
                    sable: {charged_sc: 0.01, balance_sc: 9.99}
                })
            })
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    choices: [{message: {
                        content: null,
                        tool_calls: [{
                            id: 'call_commit',
                            type: 'function',
                            function: {name: 'commit', arguments: '{"name":"fix(stage) position sprite"}'}
                        }]
                    }}],
                    sable: {charged_sc: 0.02, balance_sc: 9.97}
                })
            });

        await expect(generateCommitName('diff --git a/stage b/stage')).resolves.toEqual({
            name: 'fix(stage) position sprite',
            charged: 0.03,
            balance: 9.97
        });
        expect(global.fetch).toHaveBeenCalledTimes(2);
        const retry = JSON.parse(global.fetch.mock.calls[1][1].body);
        expect(retry.messages[2]).toEqual({role: 'assistant', content: "Okay, let's inspect the diff."});
        expect(retry.messages[3].content).toContain('Call it now');
    });

});
