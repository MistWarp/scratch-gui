import {Blocks} from '../../../src/containers/blocks.jsx';

const makeBlocks = overrides => {
    const blocks = Object.create(Blocks.prototype);
    blocks.updateToolbox = jest.fn();
    blocks.props = {
        isRtl: false,
        onShowImportError: jest.fn(),
        vm: {
            editingTarget: {id: 'sprite-a'},
            refreshWorkspace: jest.fn(),
            shareBlocksToTarget: jest.fn(() => Promise.resolve())
        },
        workspaceMetrics: {targets: {}},
        ...overrides
    };
    return blocks;
};

describe('blocks backpack drops', () => {
    afterEach(() => {
        global.fetch.mockRestore();
    });

    test('keeps the original target when loading finishes after a target switch', async () => {
        let finishFetch;
        global.fetch = jest.fn(() => new Promise(resolve => {
            finishFetch = resolve;
        }));
        const blocks = makeBlocks();

        const drop = blocks.handleDrop({
            payload: {bodyUrl: '/backpack/code'},
            currentOffset: {x: 0, y: 0}
        });
        blocks.props.vm.editingTarget = {id: 'sprite-b'};
        finishFetch({ok: true, json: () => Promise.resolve({blocks: {}})});

        await expect(drop).resolves.toBe(true);
        expect(blocks.props.vm.shareBlocksToTarget).toHaveBeenCalledWith({blocks: {}}, 'sprite-a');
        expect(blocks.props.vm.refreshWorkspace).not.toHaveBeenCalled();
        expect(blocks.updateToolbox).not.toHaveBeenCalled();
    });

    test('shows an import error without rejecting when the backpack request fails', async () => {
        global.fetch = jest.fn(() => Promise.resolve({ok: false, status: 500}));
        const blocks = makeBlocks();

        await expect(blocks.handleDrop({
            payload: {bodyUrl: '/backpack/code'},
            currentOffset: {x: 0, y: 0}
        })).resolves.toBe(false);

        expect(blocks.props.vm.shareBlocksToTarget).not.toHaveBeenCalled();
        expect(blocks.props.onShowImportError).toHaveBeenCalledTimes(1);
    });
});
