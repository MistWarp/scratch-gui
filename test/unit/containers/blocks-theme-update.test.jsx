import {Blocks} from '../../../src/containers/blocks.jsx';

describe('block theme updates', () => {
    test('do not hide the workspace while changing block colors', () => {
        const blocks = Object.create(Blocks.prototype);
        const parentSvg = {style: {display: 'block'}};

        blocks.workspace = {
            getAllBlocks: jest.fn(() => []),
            getFlyout: jest.fn(() => null),
            getParentSvg: jest.fn(() => parentSvg),
            setVisible: jest.fn(visible => {
                parentSvg.style.display = visible ? 'block' : 'none';
                if (visible) throw new Error('A project block failed to render');
            })
        };
        blocks.ScratchBlocks = {
            Colours: {overrideColours: jest.fn()},
            Css: {inject: jest.fn()}
        };
        blocks.recolorFlyoutBlocks = jest.fn();
        blocks.requestToolboxUpdate = jest.fn();
        blocks.props = {isVisible: true};

        blocks.updateBlockColors({getBlockColors: () => ({})}, true);

        expect(blocks.workspace.setVisible).not.toHaveBeenCalled();
        expect(parentSvg.style.display).toBe('block');
        expect(blocks.requestToolboxUpdate).toHaveBeenCalledTimes(1);
    });
});
