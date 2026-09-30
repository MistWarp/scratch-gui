import collectStackBlocks from '../../../src/lib/backpack/script-stack';

const makeBlocks = stored => ({getBlock: id => stored[id]});

describe('collectStackBlocks', () => {
    const stored = {
        hat: {id: 'hat', opcode: 'event_whenflagclicked', next: 'loop', parent: null, topLevel: true,
            inputs: {}, fields: {}, x: 10, y: 20},
        loop: {id: 'loop', opcode: 'control_forever', next: null, parent: 'hat', topLevel: false,
            inputs: {SUBSTACK: {name: 'SUBSTACK', block: 'say', shadow: null}}, fields: {}},
        say: {id: 'say', opcode: 'looks_say', next: null, parent: 'loop', topLevel: false,
            inputs: {MESSAGE: {name: 'MESSAGE', block: 'join', shadow: 'text'}}, fields: {}},
        join: {id: 'join', opcode: 'operator_join', next: null, parent: 'say', topLevel: false,
            inputs: {}, fields: {}},
        text: {id: 'text', opcode: 'text', next: null, parent: 'say', topLevel: false, shadow: true,
            inputs: {}, fields: {TEXT: {name: 'TEXT', value: 'Hello!'}}},
        other: {id: 'other', opcode: 'event_whenkeypressed', next: null, parent: null, topLevel: true,
            inputs: {}, fields: {}}
    };

    test('collects the stack, its inputs, covered shadows and substacks', () => {
        const blocks = collectStackBlocks(makeBlocks(stored), 'hat');
        expect(blocks.map(block => block.id)).toEqual(['hat', 'loop', 'say', 'join', 'text']);
    });

    test('makes a block from the middle of a stack the top of its own script', () => {
        const blocks = collectStackBlocks(makeBlocks(stored), 'loop');
        expect(blocks.map(block => block.id)).toEqual(['loop', 'say', 'join', 'text']);
        expect(blocks[0]).toEqual(expect.objectContaining({parent: null, topLevel: true, x: 0, y: 0}));
    });

    test('copies blocks so saving cannot change the project', () => {
        const blocks = collectStackBlocks(makeBlocks(stored), 'loop');
        blocks[0].opcode = 'changed';
        expect(stored.loop.parent).toBe('hat');
        expect(stored.loop.opcode).toBe('control_forever');
    });

    test('returns nothing for a missing block', () => {
        expect(collectStackBlocks(makeBlocks(stored), 'missing')).toEqual([]);
    });
});
