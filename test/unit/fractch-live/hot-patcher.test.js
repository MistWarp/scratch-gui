import {hotPatchProject} from '../../../src/lib/fractch-live/hot-patcher';

const makeTarget = opcode => ({
    isStage: false,
    name: 'Sprite',
    blocks: {
        top: {
            opcode,
            next: null,
            parent: null,
            inputs: {},
            fields: {},
            shadow: false,
            topLevel: true,
            x: 0,
            y: 0
        }
    },
    comments: {},
    variables: {},
    lists: {},
    broadcasts: {},
    costumes: [],
    sounds: []
});

test('rebuilds the workspace when an incremental Blockly import fails', () => {
    const liveTarget = {
        isOriginal: true,
        isStage: false,
        getName: () => 'Sprite',
        blocks: {},
        comments: {},
        variables: {}
    };
    liveTarget.sprite = {clones: [liveTarget]};
    const workspace = {
        setResizesEnabled: jest.fn(),
        setToolboxRefreshEnabled: jest.fn(),
        getBlockById: () => ({dispose: jest.fn()})
    };
    window.AddonHooks = {blocklyWorkspace: workspace};
    window.ScratchBlocks = {
        Events: {
            isEnabled: () => true,
            disable: jest.fn(),
            enable: jest.fn()
        },
        Xml: {
            textToDom: jest.fn(() => ({})),
            domToWorkspace: jest.fn(() => {
                throw new TypeError('invalid connection');
            })
        }
    };
    const vm = {
        runtime: {
            targets: [liveTarget],
            stopForTarget: jest.fn(),
            emitProjectChanged: jest.fn(),
            requestRedraw: jest.fn()
        },
        editingTarget: liveTarget,
        emitTargetsUpdate: jest.fn(),
        emitWorkspaceUpdate: jest.fn()
    };

    expect(hotPatchProject({
        vm,
        previousProject: {targets: [makeTarget('old')]},
        nextProject: {targets: [makeTarget('new')]}
    }).mode).toBe('patch');
    expect(vm.emitWorkspaceUpdate).toHaveBeenCalledTimes(1);
});
