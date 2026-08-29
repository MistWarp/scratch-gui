import {
    collectVariables,
    createVariable,
    formatValuePreview,
    renameVariable,
    setMonitorVisible,
    setVariableValue,
    validateName
} from '../../../src/lib/variable-manager/model.js';

const makeTarget = ({id, name, isStage = false, variables = {}, blocks = {}}) => ({
    id,
    isOriginal: true,
    isStage,
    variables,
    blocks: {_blocks: blocks},
    getName: () => name
});

const makeVm = () => {
    const stage = makeTarget({
        id: 'stage',
        name: 'Stage',
        isStage: true,
        variables: {
            score: {id: 'score', name: 'score', type: '', value: 10, isCloud: false},
            cloud: {id: 'cloud', name: '☁ online', type: '', value: 3, isCloud: true}
        },
        blocks: {
            block1: {fields: {VARIABLE: {id: 'score', value: 'score'}}}
        }
    });
    const sprite = makeTarget({
        id: 'sprite',
        name: 'Cat',
        variables: {
            items: {id: 'items', name: 'items', type: 'list', value: ['a', 'b'], isCloud: false}
        },
        blocks: {
            block2: {fields: {LIST: {id: 'items', value: 'items'}}},
            block3: {fields: {VARIABLE: {id: 'score', value: 'score'}}}
        }
    });
    const monitorBlocks = {
        _blocks: {
            score: {id: 'score'},
            items: {id: 'items'}
        },
        changeBlock: jest.fn()
    };
    const runtime = {
        targets: [stage, sprite],
        monitorBlocks,
        getEditingTarget: () => sprite,
        getTargetForStage: () => stage,
        getTargetById: id => [stage, sprite].find(target => target.id === id),
        getMonitorState: () => new Map([
            ['score', new Map([['visible', true]])]
        ]),
        emitProjectChanged: jest.fn()
    };
    return {
        runtime,
        setVariableValue: jest.fn((targetId, variableId, value) => {
            const target = runtime.getTargetById(targetId);
            if (!target || !target.variables[variableId]) return false;
            target.variables[variableId].value = value;
            return true;
        })
    };
};

describe('native Variable Manager model', () => {
    test('collects globals and the selected sprite locals with usage and monitor state', () => {
        const records = collectVariables(makeVm());

        expect(records.map(record => record.id)).toEqual(['cloud', 'items', 'score']);
        expect(records.find(record => record.id === 'items')).toMatchObject({
            scope: 'local',
            targetName: 'Cat',
            type: 'list',
            usageCount: 1,
            monitorVisible: false
        });
        expect(records.find(record => record.id === 'score')).toMatchObject({
            scope: 'global',
            usageCount: 2,
            monitorVisible: true
        });
    });

    test('validates duplicate names within a type and scope', () => {
        const records = collectVariables(makeVm());

        expect(validateName(records, 'score', {scope: 'global'})).toMatchObject({ok: false});
        expect(validateName(records, 'score', {scope: 'local'})).toMatchObject({ok: true});
        expect(validateName(records, 'online', {scope: 'global', cloud: true})).toMatchObject({ok: false});
    });

    test('creates local lists and cloud variables through the Blockly workspace', () => {
        const workspace = {createVariable: jest.fn(() => ({getId: () => 'new-id'}))};
        const records = collectVariables(makeVm());

        createVariable(workspace, records, {
            name: 'inventory',
            type: 'list',
            scope: 'local',
            cloud: false
        });
        createVariable(workspace, records, {
            name: 'players',
            type: 'variable',
            scope: 'global',
            cloud: true
        });

        expect(workspace.createVariable).toHaveBeenNthCalledWith(1, 'inventory', 'list', null, true, false);
        expect(workspace.createVariable).toHaveBeenNthCalledWith(2, '☁ players', '', null, false, true);
    });

    test('renames through Blockly and rejects conflicting names', () => {
        const workspace = {renameVariableById: jest.fn()};
        const records = collectVariables(makeVm());
        const items = records.find(record => record.id === 'items');

        expect(renameVariable(workspace, records, items, 'inventory')).toBe('inventory');
        expect(workspace.renameVariableById).toHaveBeenCalledWith('items', 'inventory');
        expect(() => renameVariable(workspace, records, items, '')).toThrow('Enter a name.');
    });

    test('updates values and monitor visibility while marking the project changed', () => {
        const vm = makeVm();
        const records = collectVariables(vm);
        const items = records.find(record => record.id === 'items');
        const score = records.find(record => record.id === 'score');

        setVariableValue(vm, items, ['one', 'two']);
        expect(vm.setVariableValue).toHaveBeenCalledWith('sprite', 'items', ['one', 'two']);
        expect(vm.runtime.emitProjectChanged).toHaveBeenCalled();

        expect(setMonitorVisible(vm, score, false)).toBe(true);
        expect(vm.runtime.monitorBlocks.changeBlock).toHaveBeenCalledWith({
            id: 'score',
            element: 'checkbox',
            value: false
        }, vm.runtime);
    });

    test('summarizes scalar and list values for the navigator', () => {
        expect(formatValuePreview({type: 'variable', value: ''})).toBe('Empty value');
        expect(formatValuePreview({type: 'list', value: ['one', 'two']})).toBe('2 items · one, two');
    });
});
