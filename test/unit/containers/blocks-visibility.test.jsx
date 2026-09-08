import {Blocks} from '../../../src/containers/blocks.jsx';

describe('returning to the Code tab', () => {
    let blocks;
    let frame;

    beforeEach(() => {
        jest.spyOn(window, 'requestAnimationFrame').mockImplementation(callback => {
            frame = callback;
            return 1;
        });
        jest.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
        blocks = Object.create(Blocks.prototype);
        blocks.props = {
            isVisible: true,
            locale: 'en',
            theme: {},
            vm: {getLocale: () => 'en'}
        };
        const svg = {width: 0, height: 0};
        blocks.workspace = {
            svg,
            setVisible: jest.fn(),
            refreshToolboxSelection_: jest.fn(),
            resize: jest.fn()
        };
        blocks.ScratchBlocks = {
            svgResize: jest.fn(workspace => {
                workspace.svg.width = 800;
                workspace.svg.height = 600;
                workspace.resize();
            })
        };
    });

    afterEach(() => jest.restoreAllMocks());

    test('restores the SVG dimensions after the tab becomes visible', () => {
        blocks.componentDidUpdate({...blocks.props, isVisible: false});
        expect(blocks.workspace.setVisible).toHaveBeenCalledWith(true);
        expect(blocks.workspace.svg.width).toBe(0);

        frame();

        expect(blocks.workspace.svg).toEqual({width: 800, height: 600});
        expect(blocks.workspace.refreshToolboxSelection_).toHaveBeenCalledTimes(1);
        expect(blocks.workspace.resize).toHaveBeenCalledTimes(1);
    });

    test('does not measure a hidden or disposed workspace after a rapid tab switch', () => {
        blocks.componentDidUpdate({...blocks.props, isVisible: false});
        blocks.props = {...blocks.props, isVisible: false};
        frame();
        expect(blocks.ScratchBlocks.svgResize).not.toHaveBeenCalled();

        blocks.props = {...blocks.props, isVisible: true};
        blocks.unmounted = true;
        frame();
        expect(blocks.ScratchBlocks.svgResize).not.toHaveBeenCalled();
    });
});
