let _ScratchBlocks = null;

const isLoaded = () => !!_ScratchBlocks;

const get = () => {
    if (!isLoaded()) {
        throw new Error('scratch-blocks is not loaded yet');
    }
    return _ScratchBlocks;
};

const load = () => {
    if (_ScratchBlocks) {
        return Promise.resolve();
    }
    return import(/* webpackChunkName: "sb" */ 'scratch-blocks')
        .then(m => {
            _ScratchBlocks = m.default;
            
            // Patch VerticalFlyout.createRect_ to handle race conditions
            if (_ScratchBlocks.VerticalFlyout && _ScratchBlocks.VerticalFlyout.prototype.createRect_) {
                _ScratchBlocks.VerticalFlyout.prototype.createRect_ = function (block, x, y, blockHW, index) {
                    // Create an invisible rectangle under the block to act as a button
                    const rect = _ScratchBlocks.utils.createSvgElement('rect', {
                        'fill-opacity': 0,
                        'x': x,
                        'y': y,
                        'height': blockHW.height,
                        'width': blockHW.width
                    }, null);
                    
                    rect.tooltip = block;
                    _ScratchBlocks.Tooltip.bindMouseEvents(rect);
                    
                    // Add the rectangles under the blocks, so that the blocks' tooltips work
                    const blockSvgRoot = block.getSvgRoot();
                    const canvas = this.workspace_.getCanvas();
                    
                    // Enhanced safety check with additional validation
                    if (blockSvgRoot &&
                        blockSvgRoot.parentNode === canvas &&
                        canvas.contains &&
                        canvas.contains(blockSvgRoot)) {
                        try {
                            canvas.insertBefore(rect, blockSvgRoot);
                        } catch (e) {
                            // Fallback to appendChild if insertBefore fails
                            console.warn('Flyout insertBefore failed, using appendChild as fallback:', e);
                            canvas.appendChild(rect);
                        }
                    } else {
                        // If the block's SVG root is not a proper child of the canvas, just append the rect
                        canvas.appendChild(rect);
                    }
                    
                    block.flyoutRect_ = rect;
                    this.backgroundButtons_[index] = rect;
                    return rect;
                };
            }
            
            return _ScratchBlocks;
        });
};

export default {
    get,
    isLoaded,
    load
};
