import Blockly from '../../../src/generated/scratch-blocks';

test('operator buttons can be disposed before they are rendered', () => {
    const field = new Blockly.FieldOperatorButton('data:image/svg+xml,', 'plus');
    expect(() => field.dispose()).not.toThrow();
});

test('ending an unchanged comment resize restores workspace resizing and tolerates a duplicate event', () => {
    const bubble = {
        resizeStartSize_: {width: 100, height: 80}, width_: 100, height_: 80,
        workspace_: {setResizesEnabled: jest.fn()}
    };
    Blockly.ScratchBubble.prototype.resizeMouseUp_.call(bubble);
    expect(bubble.workspace_.setResizesEnabled).toHaveBeenCalledWith(true);
    expect(() => Blockly.ScratchBubble.prototype.resizeMouseUp_.call(bubble)).not.toThrow();
});

test('an incompatible child block survives as a top-level block', () => {
    const workspace = new Blockly.Workspace();
    const xml = Blockly.Xml.textToDom(
        '<xml><block type="operator_add"><value name="NUM1"><block type="event_whenstageclicked"/></value></block></xml>'
    );
    try {
        expect(() => Blockly.Xml.domToBlockHeadless_(xml.firstChild, workspace)).not.toThrow();
        expect(workspace.getAllBlocks()).toHaveLength(2);
        expect(workspace.getTopBlocks()).toHaveLength(2);
    } finally {
        workspace.dispose();
    }
});
