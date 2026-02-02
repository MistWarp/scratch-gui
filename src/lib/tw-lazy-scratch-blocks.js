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

            const FlyoutProto = _ScratchBlocks.Flyout && _ScratchBlocks.Flyout.prototype;
            if (FlyoutProto) {
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

            const ToolboxProto = _ScratchBlocks.Toolbox && _ScratchBlocks.Toolbox.prototype;

            if (ToolboxProto && typeof ToolboxProto.setFlyoutWidth !== 'function') {
                ToolboxProto.setFlyoutWidth = function (flyoutWidth) {
                    const CATEGORY_MENU_WIDTH = 60;
                    if (!(typeof flyoutWidth === 'number' && Number.isFinite(flyoutWidth))) return;
                    this.width = CATEGORY_MENU_WIDTH + flyoutWidth;
                    if (this.flyout_ && typeof this.flyout_.setWidth === 'function') {
                        this.flyout_.setWidth(flyoutWidth);
                    }
                };
            }

            const verticalFlyoutProto = _ScratchBlocks.VerticalFlyout && _ScratchBlocks.VerticalFlyout.prototype;

            if (verticalFlyoutProto && typeof verticalFlyoutProto.twSetClippingEnabled !== 'function') {

                if (typeof verticalFlyoutProto.setMetrics_ === 'function' &&
                    typeof verticalFlyoutProto.twOriginalSetMetrics_ !== 'function') {
                    verticalFlyoutProto.twOriginalSetMetrics_ = verticalFlyoutProto.setMetrics_;

                    verticalFlyoutProto.setMetrics_ = function (...args) {
                        return verticalFlyoutProto.twOriginalSetMetrics_.call(this, args[0]);
                    };
                }

                verticalFlyoutProto.twSetClippingEnabled = function (enabled) {
                    if (!this.workspace_ || !this.workspace_.svgGroup_) return;
    
                    let clipRect = this.clipRect_;
                    if (!clipRect) {
                        const svg = this.workspace_.getParentSvg();
                        if (svg) {
                            clipRect = svg.querySelector('#blocklyBlockMenuClipRect');
                        }
                    }
    
                    let flyoutSvg = this.svgGroup_;
                    while (flyoutSvg && flyoutSvg.tagName !== 'svg') {
                        flyoutSvg = flyoutSvg.parentElement;
                    }

                    if (!enabled && flyoutSvg && flyoutSvg.classList.contains('sa-flyoutClose')) {
                        return;
                    }
    
                    if (clipRect) {
                        this.twClippingEnabled_ = enabled;
                        if (enabled) {
                            const metrics = this.getMetrics_();
                            clipRect.setAttribute('width', metrics ? (`${metrics.viewWidth}px`) : '250px');
            
                            if (flyoutSvg) {
                                flyoutSvg.style.overflow = 'hidden';
                            }
                        } else {
                            clipRect.setAttribute('width', '100000px');
            
                            if (flyoutSvg) {
                                flyoutSvg.style.overflow = 'visible';
                            }
                        }
                    }
                };

                const originalSetMetrics = verticalFlyoutProto.setMetrics_;
                verticalFlyoutProto.setMetrics_ = function (...args) {
                    const ret = originalSetMetrics.call(this, args[0]);
                    
                    if (this.twClippingEnabled_ === false && this.clipRect_) {
                        this.clipRect_.setAttribute('width', '100000px');
                    }
                    return ret;
                };
            }
            
            if (verticalFlyoutProto && verticalFlyoutProto.createRect_) {
                verticalFlyoutProto.createRect_ = function (block, x, y, blockHW, index) {
                    const rect = _ScratchBlocks.utils.createSvgElement('rect', {
                        'fill-opacity': 0,
                        'x': x,
                        'y': y,
                        'height': blockHW.height,
                        'width': blockHW.width
                    }, null);
                    
                    rect.tooltip = block;
                    _ScratchBlocks.Tooltip.bindMouseEvents(rect);
                    
                    const blockSvgRoot = block.getSvgRoot();
                    const canvas = this.workspace_.getCanvas();
                    
                    if (blockSvgRoot &&
                        blockSvgRoot.parentNode === canvas &&
                        canvas.contains &&
                        canvas.contains(blockSvgRoot)) {
                        try {
                            canvas.insertBefore(rect, blockSvgRoot);
                        } catch (e) {
                            console.warn('Flyout insertBefore failed, using appendChild as fallback:', e);
                            canvas.appendChild(rect);
                        }
                    } else {
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
