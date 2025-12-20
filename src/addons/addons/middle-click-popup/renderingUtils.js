// Rendering and block preview utilities

import {renderBlock, getBlockHeight} from './BlockRenderer.js';
import {createSpritePreviewItem, createCostumePreviewItem, createSectionHeader} from './uiComponents.js';

/**
 * Render a custom block to SVG
 * @param {any} customBlockData Custom block data
 * @param {any} svgBlock SVG group element
 * @param {any} Blockly Blockly instance
 * @param {any} vm VM instance
 * @returns {{width: number, height: number} | null} Rendered block dimensions or null on failure
 */
const renderCustomBlock = (customBlockData, svgBlock, Blockly, vm) => {
    const currentEditingTarget = vm.editingTarget;
    const targetWithBlock = vm.runtime.getTargetById(customBlockData.targetId);
    
    if (!targetWithBlock) {
        return null;
    }
    
    vm.setEditingTarget(customBlockData.targetId);
        
    try {
        const workspace = Blockly.getMainWorkspace();
        if (workspace) {
            // Use blockId to get the full definition hat block, not just the prototype
            const blocklyBlock = workspace.getBlockById(customBlockData.blockId);
            if (blocklyBlock) {
                const blockXml = Blockly.Xml.blockToDom(blocklyBlock);

                const nextEl = blockXml.querySelector('next');
                if (nextEl) nextEl.remove();

                const tempBlock = Blockly.Xml.domToBlock(blockXml, workspace);
                
                if (tempBlock && tempBlock.getSvgRoot()) {
                    const svgClone = tempBlock.getSvgRoot().cloneNode(true);
                    svgBlock.appendChild(svgClone);
                    
                    const bbox = tempBlock.getBoundingRectangle();
                    const blockWidth = bbox.right - bbox.left;
                    const blockHeight = bbox.bottom - bbox.top;
                    
                    tempBlock.dispose(false);
                    
                    if (!isNaN(blockWidth) && !isNaN(blockHeight) &&
                        isFinite(blockWidth) && isFinite(blockHeight) &&
                        blockWidth > 0 && blockHeight > 0) {
                        return {
                            width: blockWidth,
                            height: blockHeight
                        };
                    }
                }
            }
        }
    } catch (e) {
        console.error('Error rendering custom block:', e);
    } finally {
        if (currentEditingTarget) {
            vm.setEditingTarget(currentEditingTarget.id);
        }
    }
    
    return null;
};

/**
 * Render a menu item to SVG
 * @param {any} result Menu item
 * @param {any} svgBlock SVG group element
 * @param {number} previewWidth Preview container width
 * @param {number} previewScale Scale factor
 * @param {any} Blockly Blockly instance
 * @param {any} vm VM instance
 * @returns {{renderedBlock: any, height: number}} Rendered block data and height
 */
const renderMenuItem = (result, svgBlock, previewWidth, previewScale, Blockly, vm) => {
    let height;
    let renderedBlock = null;
    
    if (result.isHeader) {
        height = 40;
        const foreignObject = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
        foreignObject.setAttribute('width', `${previewWidth / previewScale}`);
        foreignObject.setAttribute('height', `${height}`);
        
        const headerItem = createSectionHeader(result.headerText ?? 'Unknown Section');
        foreignObject.appendChild(headerItem);
        svgBlock.appendChild(foreignObject);
        
        renderedBlock = {width: previewWidth / previewScale, height: height};
    } else if (result.isSprite || result.isCostume) {
        height = 60;
        const foreignObject = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
        foreignObject.setAttribute('width', `${previewWidth / previewScale}`);
        foreignObject.setAttribute('height', `${height}`);
        
        let item;
        if (result.isSprite) {
            item = createSpritePreviewItem(result.spriteData, vm);
        } else if (result.isCostume) {
            item = createCostumePreviewItem(result.costumeData);
        }
        
        if (item) {
            foreignObject.appendChild(item);
            svgBlock.appendChild(foreignObject);
            renderedBlock = {width: previewWidth / previewScale, height: height};
        }
    } else if (result.isCustomBlock) {
        renderedBlock = renderCustomBlock(result.customBlockData, svgBlock, Blockly, vm);
        
        if (renderedBlock && renderedBlock.height) {
            height = renderedBlock.height;
        } else {
            height = 120;
            renderedBlock = {width: previewWidth / previewScale, height: height};
        }
    } else if (result.block) {
        height = getBlockHeight(result.block);
        renderedBlock = renderBlock(result.block, svgBlock);
    }
    
    if (!height || isNaN(height)) {
        height = 40;
    }
    
    return {renderedBlock, height};
};

/**
 * Calculate actual height for a preview item
 * @param {any} result Menu item
 * @param {any} renderedBlock Rendered block data
 * @param {number} fallbackHeight Fallback height
 * @returns {number} Actual height
 */
const calculateActualHeight = (result, renderedBlock, fallbackHeight) => {
    let actualHeight = fallbackHeight;
    
    if (result.isCustomBlock && renderedBlock && renderedBlock.height) {
        // Add minimal padding to custom block height for proper spacing
        actualHeight = renderedBlock.height;
    }
    
    if (!actualHeight || isNaN(actualHeight)) {
        actualHeight = fallbackHeight;
    }
    if (!actualHeight || isNaN(actualHeight)) {
        actualHeight = 40;
    }
    
    return actualHeight;
};

export {
    renderCustomBlock,
    renderMenuItem,
    calculateActualHeight
};
