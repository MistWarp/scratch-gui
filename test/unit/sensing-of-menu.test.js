import connectBlocks from '../../src/lib/blocks';
import LazyScratchBlocks from '../../src/lib/tw-lazy-scratch-blocks';

jest.mock('../../src/lib/tw-lazy-scratch-blocks', () => ({get: jest.fn()}));

test.each([
    {},
    {OBJECT: {shadow: 'missing', block: 'missing'}}
])('sensing menu tolerates incomplete VM inputs: %j', inputs => {
    const blocks = {
        Blocks: new Proxy({}, {get: (target, key) => {
            if (!target[key]) target[key] = {};
            return target[key];
        }}),
        Colours: {sensing: {}},
        Msg: {},
        VerticalFlyout: {},
        FlyoutExtensionCategoryHeader: {},
        FieldNote: {},
        scratchBlocksUtils: {},
        utils: {}
    };
    LazyScratchBlocks.get.mockReturnValue(blocks);
    const vm = {
        editingTarget: {blocks: {getBlock: id => (id === 'sensing' ? {inputs} : undefined)}},
        runtime: {
            flyoutBlocks: {_blocks: {}},
            getTargetForStage: () => ({getAllVariableNamesInScopeByType: () => ['score']})
        }
    };
    connectBlocks(vm);
    const block = {id: 'sensing', type: 'sensing_of', jsonInit: jest.fn()};
    blocks.Blocks.sensing_of.init.call(block);
    const options = block.jsonInit.mock.calls[0][0].args0[0].options();
    expect(options.map(option => option[1])).toEqual(['backdrop #', 'backdrop name', 'volume', 'score']);
});
