import {BlockTypeInfo} from '../../../src/lib/spotlight/BlockTypeInfo.js';

const variable = (id, name, type = '') => ({id, name, type, getId: () => id});

const workspaceWith = variables => ({getAllVariables: () => variables});

describe('spotlight variables key', () => {
    const score = variable('a', 'score');
    const items = variable('b', 'items', 'list');
    const message = variable('c', 'message1', 'broadcast_msg');
    const key = BlockTypeInfo.getVariablesKey(workspaceWith([score, items, message]));

    test('stays the same while the variables are unchanged', () => {
        expect(BlockTypeInfo.getVariablesKey(workspaceWith([score, items, message]))).toBe(key);
    });

    test('changes when a variable, list or broadcast is deleted', () => {
        expect(BlockTypeInfo.getVariablesKey(workspaceWith([items, message]))).not.toBe(key);
        expect(BlockTypeInfo.getVariablesKey(workspaceWith([score, message]))).not.toBe(key);
        expect(BlockTypeInfo.getVariablesKey(workspaceWith([score, items]))).not.toBe(key);
    });

    test('changes when a variable is created or renamed', () => {
        expect(BlockTypeInfo.getVariablesKey(workspaceWith([score, items, message, variable('d', 'lives')])))
            .not.toBe(key);
        expect(BlockTypeInfo.getVariablesKey(workspaceWith([variable('a', 'points'), items, message])))
            .not.toBe(key);
    });
});
