import {getVanillaPalette} from './mw-vanilla-palette';

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

            try {
                const operatorUtils = _ScratchBlocks.ScratchBlocks && _ScratchBlocks.ScratchBlocks.OperatorUtils;
                if (operatorUtils) {
                    operatorUtils.arrowsHidden = localStorage.getItem('mw:hide-operator-arrows') === 'true';
                }
            } catch (e) {
                // ignore
            }

            const Procedures = _ScratchBlocks.Procedures;
            if (Procedures && typeof Procedures.flyoutCategory === 'function') {
                const originalFlyoutCategory = Procedures.flyoutCategory;
                Procedures.flyoutCategory = workspace => originalFlyoutCategory(workspace).filter(node => !(
                    getVanillaPalette() && node.getAttribute('type') === 'procedures_return'
                ));
            }

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
