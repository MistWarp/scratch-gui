// Rendering and block preview utilities

import {renderBlock, getBlockHeight} from './BlockRenderer.js';
import {
    createSpritePreviewItem,
    createCostumePreviewItem,
    createSectionHeader,
    createSoundPreviewItem,
    createCustomBlockPreviewItem,
    createActionPreviewItem
} from './uiComponents.js';

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
    } else if (result.isSprite || result.isCostume || result.isSound || result.isCustomBlock || result.isAction) {
        height = 60;
        const foreignObject = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
        foreignObject.setAttribute('width', `${previewWidth / previewScale}`);
        foreignObject.setAttribute('height', `${height}`);

        let item;
        if (result.isSprite) {
            item = createSpritePreviewItem(result.spriteData, vm);
        } else if (result.isCostume) {
            item = createCostumePreviewItem(result.costumeData);
        } else if (result.isSound) {
            item = createSoundPreviewItem(result.soundData);
        } else if (result.isCustomBlock) {
            item = createCustomBlockPreviewItem(result.customBlockData);
        } else if (result.isAction) {
            item = createActionPreviewItem(result.actionData);
        }

        if (item) {
            foreignObject.appendChild(item);
            svgBlock.appendChild(foreignObject);
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
    renderMenuItem,
    calculateActualHeight
};
