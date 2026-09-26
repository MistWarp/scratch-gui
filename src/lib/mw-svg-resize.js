import {afterLiveResize, isLiveResizing} from './mw-live-resize';

const BURST_WINDOW = 500;
const SETTLE_DELAY = 500;

const now = () => ((typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now());

const getMainWorkspace = workspace => {
    let main = workspace;
    while (main.options && main.options.parentWorkspace) {
        main = main.options.parentWorkspace;
    }
    return main;
};

const setSvgSize = (svg, width, height) => {
    if (svg.mwSvgWidth !== width) {
        svg.setAttribute('width', `${width}px`);
        svg.mwSvgWidth = width;
    }
    if (svg.mwSvgHeight !== height) {
        svg.setAttribute('height', `${height}px`);
        svg.mwSvgHeight = height;
    }
};

const getScreenSize = () => {
    if (typeof window === 'undefined' || !window.screen) return {width: 0, height: 0};
    return {width: window.screen.width || 0, height: window.screen.height || 0};
};

const clearSettle = svg => {
    if (svg.mwSettleTimer) {
        clearTimeout(svg.mwSettleTimer);
        svg.mwSettleTimer = null;
    }
};

const svgResize = workspace => {
    const main = getMainWorkspace(workspace);
    const svg = main.getParentSvg();
    const div = svg && svg.parentNode;
    if (!div) return;

    const width = div.offsetWidth;
    const height = div.offsetHeight;
    const time = now();
    const sized = typeof svg.mwSvgWidth === 'number';
    const live = sized && (isLiveResizing() || time - (svg.mwLastResize || -Infinity) < BURST_WINDOW);
    svg.mwLastResize = time;

    if (!live) {
        setSvgSize(svg, width, height);
    } else if (width > svg.mwSvgWidth || height > svg.mwSvgHeight) {
        const screen = getScreenSize();
        setSvgSize(
            svg,
            Math.max(width, svg.mwSvgWidth, screen.width),
            Math.max(height, svg.mwSvgHeight, screen.height)
        );
    }
    svg.cachedWidth_ = width;
    svg.cachedHeight_ = height;
    main.resize();

    clearSettle(svg);
    if (svg.mwSvgWidth === width && svg.mwSvgHeight === height) return;
    if (!svg.mwSettle) {
        svg.mwSettle = () => {
            svg.mwSettleTimer = null;
            if (!svg.parentNode || main.getParentSvg() !== svg) return;
            svg.mwLastResize = -Infinity;
            svgResize(main);
        };
    }
    if (isLiveResizing()) {
        afterLiveResize(svg.mwSettle);
        return;
    }
    svg.mwSettleTimer = setTimeout(svg.mwSettle, SETTLE_DELAY);
};

const installSteadySvgResize = ScratchBlocks => {
    if (!ScratchBlocks || typeof ScratchBlocks.svgResize !== 'function' || ScratchBlocks.svgResize.mwSteady) return;
    const resize = workspace => svgResize(workspace);
    resize.mwSteady = true;
    ScratchBlocks.svgResize = resize;

    const proto = ScratchBlocks.WorkspaceSvg && ScratchBlocks.WorkspaceSvg.prototype;
    if (!proto) return;

    const resizeWorkspace = proto.resize;
    const getBlocksBoundingBox = proto.getBlocksBoundingBox;
    if (typeof resizeWorkspace === 'function' && typeof getBlocksBoundingBox === 'function') {
        proto.resize = function () {
            if (this.mwBoundsCache) return resizeWorkspace.call(this);
            this.mwBoundsCache = {box: null};
            try {
                return resizeWorkspace.call(this);
            } finally {
                this.mwBoundsCache = null;
            }
        };
        proto.getBlocksBoundingBox = function () {
            const cache = this.mwBoundsCache;
            if (!cache) return getBlocksBoundingBox.call(this);
            if (!cache.box) cache.box = getBlocksBoundingBox.call(this);
            const {x, y, width, height} = cache.box;
            return {x, y, width, height};
        };
    }

    const recordBlocksArea = proto.recordBlocksArea_;
    if (typeof recordBlocksArea === 'function') {
        proto.recordBlocksArea_ = function () {
            recordBlocksArea.call(this);
            const svg = this.getParentSvg();
            if (!this.blocksArea_ || !svg || typeof svg.cachedWidth_ !== 'number') return;
            this.blocksArea_.width = Math.min(this.blocksArea_.width, svg.cachedWidth_);
            this.blocksArea_.height = Math.min(this.blocksArea_.height, svg.cachedHeight_);
        };
    }
};

export {
    installSteadySvgResize
};
