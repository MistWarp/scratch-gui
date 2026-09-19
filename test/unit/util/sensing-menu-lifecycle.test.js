import initBlocks from '../../../src/lib/blocks';
import LazyScratchBlocks from '../../../src/lib/tw-lazy-scratch-blocks';

jest.mock('../../../src/lib/tw-lazy-scratch-blocks', () => ({get: jest.fn()}));

test('sensing menus survive a missing stage and include its variables when it arrives', () => {
    const blocks = {
        Blocks: new Proxy({}, {get: (target, key) => (target[key] || (target[key] = {}))}),
        Colours: {sensing: {}},
        Msg: {SENSING_OF_VOLUME: 'volume'},
        VerticalFlyout: {}, FlyoutExtensionCategoryHeader: {}, FieldNote: {},
        scratchBlocksUtils: {}, utils: {}
    };
    LazyScratchBlocks.get.mockReturnValue(blocks);
    const vm = {
        editingTarget: {blocks: {getBlock: () => ({inputs: {}})}},
        runtime: {flyoutBlocks: {_blocks: {}}, getTargetForStage: jest.fn(() => undefined)}
    };
    initBlocks(vm);
    let options;
    blocks.Blocks.sensing_of.init.call({id: 'sensing', jsonInit: json => {
        options = json.args0[0].options;
    }});
    expect(options()).toContainEqual(['volume', 'volume']);
    vm.runtime.getTargetForStage.mockReturnValue({getAllVariableNamesInScopeByType: () => ['score']});
    expect(options()).toContainEqual(['score', 'score']);
});
