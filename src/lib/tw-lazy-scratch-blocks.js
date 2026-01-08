let _ScratchBlocks = null;

const isLoaded = () => !!_ScratchBlocks;

const get = () => {
    if (!isLoaded()) {
        throw new Error('scratch-blocks is not loaded yet');
    }
    return _ScratchBlocks;
};

const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);

const load = () => {
    if (_ScratchBlocks) {
        return Promise.resolve();
    }
    return import(/* webpackChunkName: "sb" */ 'scratch-blocks')
        .then(m => {
            _ScratchBlocks = m.default;

            if (_ScratchBlocks.Flyout &&
                _ScratchBlocks.Flyout.prototype) {
                const FlyoutProto = _ScratchBlocks.Flyout.prototype;
                const originalGetWidth = FlyoutProto.getWidth;
                if (typeof originalGetWidth === 'function' && typeof FlyoutProto.setWidth !== 'function') {
                    FlyoutProto.setWidth = function (width) {
                        this.twUserWidth_ = (typeof width === 'number' && Number.isFinite(width)) ? width : null;
                    };
                    FlyoutProto.getWidth = function () {
                        if (typeof this.twUserWidth_ === 'number') return this.twUserWidth_;
                        return originalGetWidth.call(this);
                    };
                }
            }

            if (_ScratchBlocks.Toolbox &&
                _ScratchBlocks.Toolbox.prototype &&
                typeof _ScratchBlocks.Toolbox.prototype.setFlyoutWidth !== 'function') {
                _ScratchBlocks.Toolbox.prototype.setFlyoutWidth = function (flyoutWidth) {
                    const CATEGORY_MENU_WIDTH = 60;
                    if (!(typeof flyoutWidth === 'number' && Number.isFinite(flyoutWidth))) return;
                    this.width = CATEGORY_MENU_WIDTH + flyoutWidth;
                    if (this.flyout_ && typeof this.flyout_.setWidth === 'function') {
                        this.flyout_.setWidth(flyoutWidth);
                    }
                };
            }

            const verticalFlyoutProto = _ScratchBlocks.VerticalFlyout && _ScratchBlocks.VerticalFlyout.prototype;

            // Allow disabling flyout clipping (clip-path) at runtime.
            if (verticalFlyoutProto &&
                typeof verticalFlyoutProto.twSetClippingEnabled !== 'function') {
                verticalFlyoutProto.twSetClippingEnabled = function (enabled) {
                    if (!this.workspace_ || !this.workspace_.svgGroup_) return;
                    const svgGroup = this.workspace_.svgGroup_;
                    const flyoutSvg = this.svgGroup_;
                    if (enabled) {
                        if (this.twOriginalClipPath_) {
                            svgGroup.setAttribute('clip-path', this.twOriginalClipPath_);
                        }

                        if (flyoutSvg) {
                            if (hasOwn(this, 'twOriginalFlyoutOverflow_')) {
                                flyoutSvg.style.overflow = this.twOriginalFlyoutOverflow_ || '';
                            }
                            if (hasOwn(this, 'twOriginalFlyoutOverflowAttr_')) {
                                if (this.twOriginalFlyoutOverflowAttr_ === null) {
                                    flyoutSvg.removeAttribute('overflow');
                                } else {
                                    flyoutSvg.setAttribute('overflow', this.twOriginalFlyoutOverflowAttr_);
                                }
                            }
                        }
                    } else {
                        if (!this.twOriginalClipPath_) {
                            this.twOriginalClipPath_ = svgGroup.getAttribute('clip-path');
                        }
                        svgGroup.removeAttribute('clip-path');

                        if (flyoutSvg) {
                            if (!hasOwn(this, 'twOriginalFlyoutOverflow_')) {
                                this.twOriginalFlyoutOverflow_ = flyoutSvg.style.overflow;
                            }
                            if (!hasOwn(this, 'twOriginalFlyoutOverflowAttr_')) {
                                this.twOriginalFlyoutOverflowAttr_ = flyoutSvg.getAttribute('overflow');
                            }
                            flyoutSvg.style.overflow = 'visible';
                            flyoutSvg.setAttribute('overflow', 'visible');
                        }
                    }
                };
            }
            
            // Patch VerticalFlyout.createRect_ to handle race conditions
            if (verticalFlyoutProto && verticalFlyoutProto.createRect_) {
                verticalFlyoutProto.createRect_ = function (block, x, y, blockHW, index) {
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
