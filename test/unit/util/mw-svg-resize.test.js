import {installSteadySvgResize} from '../../../src/lib/mw-svg-resize';
import {afterLiveResize, beginLiveResize, isLiveResizing} from '../../../src/lib/mw-live-resize';

let clock = 0;

const setup = () => {
    const div = {offsetWidth: 800, offsetHeight: 600};
    const svg = {
        attributes: {},
        parentNode: div,
        setAttribute: jest.fn((name, value) => {
            svg.attributes[name] = value;
        })
    };
    class WorkspaceSvg {
        constructor () {
            this.options = {};
            this.scans = 0;
        }
        getParentSvg () {
            return svg;
        }
        getBlocksBoundingBox () {
            this.scans++;
            return {x: 1, y: 2, width: 3, height: 4};
        }
        resize () {
            this.boxes = [this.getBlocksBoundingBox(), this.getBlocksBoundingBox(), this.getBlocksBoundingBox()];
            this.recordBlocksArea_();
        }
        recordBlocksArea_ () {
            const width = parseFloat(svg.attributes.width);
            const height = parseFloat(svg.attributes.height);
            this.blocksArea_ = {left: 0, top: 0, width, height};
        }
    }
    const ScratchBlocks = {WorkspaceSvg, svgResize: jest.fn()};
    installSteadySvgResize(ScratchBlocks);
    const workspace = new WorkspaceSvg();
    return {ScratchBlocks, workspace, svg, div};
};

beforeEach(() => {
    jest.useFakeTimers();
    clock = 1000;
    jest.spyOn(performance, 'now').mockImplementation(() => clock);
    Object.defineProperty(window, 'screen', {value: {width: 1920, height: 1080}, configurable: true});
});

afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
});

test('a single resize sets the exact svg size', () => {
    const {ScratchBlocks, workspace, svg} = setup();
    ScratchBlocks.svgResize(workspace);
    expect(svg.attributes).toEqual({width: '800px', height: '600px'});
    expect(svg.cachedWidth_).toBe(800);
    expect(svg.cachedHeight_).toBe(600);
});

test('shrinking during a burst keeps the svg size until the resize settles', () => {
    const {ScratchBlocks, workspace, svg, div} = setup();
    ScratchBlocks.svgResize(workspace);
    clock += 16;
    div.offsetWidth = 700;
    ScratchBlocks.svgResize(workspace);
    expect(svg.attributes.width).toBe('800px');
    expect(svg.cachedWidth_).toBe(700);
    expect(workspace.blocksArea_.width).toBe(700);

    clock += 1000;
    jest.runAllTimers();
    expect(svg.attributes.width).toBe('700px');
});

test('growing during a live resize makes the svg screen sized once, then exact on release', () => {
    const {ScratchBlocks, workspace, svg, div} = setup();
    ScratchBlocks.svgResize(workspace);
    const end = beginLiveResize();
    expect(isLiveResizing()).toBe(true);

    div.offsetWidth = 900;
    ScratchBlocks.svgResize(workspace);
    expect(svg.attributes).toEqual({width: '1920px', height: '1080px'});
    div.offsetWidth = 1000;
    ScratchBlocks.svgResize(workspace);
    expect(svg.setAttribute).toHaveBeenCalledTimes(4);

    end();
    expect(isLiveResizing()).toBe(false);
    expect(svg.attributes).toEqual({width: '1000px', height: '600px'});
});

test('the blocks bounding box is measured once per workspace resize', () => {
    const {workspace} = setup();
    workspace.resize();
    expect(workspace.scans).toBe(1);
    expect(workspace.boxes[1]).toEqual({x: 1, y: 2, width: 3, height: 4});
    expect(workspace.boxes[1]).not.toBe(workspace.boxes[2]);
    workspace.getBlocksBoundingBox();
    expect(workspace.scans).toBe(2);
});

test('callbacks wait for the live resize to end and run once', () => {
    const callback = jest.fn();
    afterLiveResize(callback);
    expect(callback).toHaveBeenCalledTimes(1);

    const endOuter = beginLiveResize();
    const endInner = beginLiveResize();
    afterLiveResize(callback);
    afterLiveResize(callback);
    endInner();
    expect(callback).toHaveBeenCalledTimes(1);
    endOuter();
    endOuter();
    expect(callback).toHaveBeenCalledTimes(2);
});
