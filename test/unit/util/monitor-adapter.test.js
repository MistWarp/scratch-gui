import monitorAdapter from '../../../src/lib/utils/monitor-adapter';

describe('monitor adapter', () => {
    test('normalizes arbitrary list values without changing strings and numbers', () => {
        const value = ['message', 2, true, {text: 'hello'}];
        const result = monitorAdapter({
            id: 'list',
            opcode: 'data_listcontents',
            params: {},
            value
        });

        expect(result.value).toEqual(['message', 2, 'true', '{"text":"hello"}']);
        expect(value).toEqual(['message', 2, true, {text: 'hello'}]);
    });
});
