// @ts-check
/* eslint-disable */

import WorkspaceQuerier, { QueryResult } from "./WorkspaceQuerier.js";
import React from 'react';
import ReactDOM from 'react-dom';
import {Search} from 'lucide-react';
import { getBlockHeight, BlockComponent } from "./BlockRenderer.js";
import { BlockInstance, BlockShape, BlockTypeInfo } from "./BlockTypeInfo.js";
import { onClearTextWidthCache } from "./module.js";
import { performSearch } from "./searchUtils.js";
import { renderMenuItem, calculateActualHeight } from "./renderingUtils.js";
import {
    findNextSelectableIndex,
    handleSpriteSelection,
    handleCostumeSelection,
    handleCustomBlockSelection,
    handleSoundSelection,
    handleBlockSelection
} from "./selectionUtils.js";
import {updateCallbacks} from '../../../lib/shortcuts/event-router.js';

/**
 * @param {{addon: any, msg: any}} param0
 */
export default async function ({ addon, msg }) {
    const Blockly = await addon.tab.traps.getBlockly();
    const vm = addon.tab.traps.vm;

    const PREVIEW_LIMIT = 32;
    let searchFrame = null;

    const popupRoot = document.body.appendChild(document.createElement('div'));
    popupRoot.classList.add('sa-mcp-root');
    popupRoot.dir = addon.tab.direction;
    popupRoot.style.display = 'none';

    const popupContainer = popupRoot.appendChild(document.createElement('div'));
    popupContainer.classList.add('sa-mcp-container');
    popupContainer.classList.add('sa-mcp-container-collapsed');
    popupContainer.setAttribute('aria-label', 'Spotlight search');
    popupContainer.setAttribute('role', 'dialog');

    const popupInputContainer = popupContainer.appendChild(document.createElement('div'));
    popupInputContainer.classList.add(addon.tab.scratchClass('input_input-form'));
    popupInputContainer.classList.add('sa-mcp-input-wrapper');

    const popupSearchIcon = popupInputContainer.appendChild(document.createElement('span'));
    popupSearchIcon.classList.add('sa-mcp-search-icon');
    ReactDOM.render(React.createElement(Search, {size: 20, strokeWidth: 2}), popupSearchIcon);

    const popupInputSuggestion = popupInputContainer.appendChild(document.createElement('input'));
    popupInputSuggestion.classList.add('sa-mcp-input-suggestion');

    const popupInput = popupInputContainer.appendChild(document.createElement('input'));
    popupInput.classList.add('sa-mcp-input');
    popupInput.setAttribute('autocomplete', 'off');
    popupInput.setAttribute('aria-label', 'Search blocks and project assets');
    popupInput.setAttribute('placeholder', 'Search blocks, sprites, costumes, and sounds');
    popupInput.setAttribute('role', 'searchbox');

    const popupResultBox = popupContainer.appendChild(document.createElement('div'));
    popupResultBox.classList.add('sa-mcp-result-box');
    popupResultBox.style.display = 'none';

    const popupPreviewContainer = popupContainer.appendChild(document.createElement('div'));
    popupPreviewContainer.classList.add('sa-mcp-preview-container');

    const popupStatusBar = popupContainer.appendChild(document.createElement('div'));
    popupStatusBar.classList.add('sa-mcp-status-bar');
    popupStatusBar.setAttribute('aria-live', 'polite');
    const popupStatusText = popupStatusBar.appendChild(document.createElement('span'));
    popupStatusText.textContent = 'Type to search';

    const popupPreviewBlocks = popupPreviewContainer.appendChild(
        document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    );
    popupPreviewBlocks.classList.add('sa-mcp-preview-blocks');

    const querier = new WorkspaceQuerier();

    let mousePosition = { x: 0, y: 0 };
    document.addEventListener('mousemove', e => {
        mousePosition = { x: e.clientX, y: e.clientY };
    });
    document.addEventListener('mousedown', e => {
        mousePosition = { x: e.clientX, y: e.clientY };
    }, { capture: true });

    onClearTextWidthCache(closePopup);

    /**
   * @typedef ResultPreview
   * @property {BlockInstance | null} block
   * @property {((endOnly: boolean) => string)?} autocompleteFactory
   * @property {BlockComponent | {width: number, height: number}} renderedBlock
   * @property {SVGGElement} svgBlock
   * @property {SVGRectElement} svgBackground
   * @property {boolean} [isSprite]
   * @property {any} [spriteData]
   * @property {boolean} [isCostume]
   * @property {any} [costumeData]
   * @property {boolean} [isHeader]
   * @property {string} [headerText]
 * @property {boolean} [isCustomBlock]
 * @property {any} [customBlockData]
 * @property {boolean} [isSound]
 * @property {any} [soundData]
 */
    /** @type {ResultPreview[]} */
    const queryPreviews = [];
    /** @type {QueryResult | null} */
    let queryIllegalResult = null;
    let selectedPreviewIdx = 0;
    /** @type {BlockTypeInfo[]?} */
    let blockTypes = null;
    let indexedTargetId = null;
    let limited = false;

    let allowMenuClose = true;

    /** @type {null | {x: number, y: number}} */
    let popupPosition = null;
    /** @type {null | {x: number, y: number}} */
    let popupOrigin = null;
    let isCenteredMode = false;
    let searchMode = 'everything';

    let previewWidth = 0;
    let previewHeight = 0;

    let previewScale = 0;

    const previewMinHeight = 0;
    let previewMaxHeight = 0;

    function openPopup(centered = false) {
        if (addon.self.disabled) return;

        // Don't show the menu if we're not in the code editor
        if (addon.tab.editorMode !== 'editor') return;
        if (addon.tab.redux.state.scratchGui.editorTab.activeTabIndex !== 0) return;

        const workspace = Blockly.getMainWorkspace();
        if (!workspace) {
            console.warn('Middle-click popup: Workspace not ready');
            return;
        }

        isCenteredMode = centered;
        searchMode = centered ? 'everything' : 'blocks';
        popupRoot.classList.toggle('sa-mcp-centered', centered);
        popupContainer.setAttribute('aria-modal', `${centered}`);

        previewScale = window.innerWidth * 0.00005 + addon.settings.get('popup_scale') / 100;

        // Validate previewScale
        if (isNaN(previewScale) || !isFinite(previewScale) || previewScale <= 0) {
            previewScale = 0.56; // Default scale
        }

        if (centered) {
            previewWidth = Math.min(window.innerWidth - 32, 680);
        } else {
            previewWidth = (window.innerWidth * addon.settings.get('popup_width')) / 100;
        }

        // Validate previewWidth
        if (isNaN(previewWidth) || !isFinite(previewWidth) || previewWidth <= 0) {
            previewWidth = 480; // Default width
        }

        previewMaxHeight = centered ?
            Math.min(window.innerHeight * 0.62, 620) :
            (window.innerHeight * addon.settings.get('popup_max_height')) / 100;

        // Validate previewMaxHeight
        if (isNaN(previewMaxHeight) || !isFinite(previewMaxHeight) || previewMaxHeight <= 0) {
            previewMaxHeight = 480; // Default max height
        }

        popupContainer.style.width = `${previewWidth}px`;

        if (centered) {
            popupOrigin = {
                x: window.innerWidth / 2,
                y: Math.min(96, window.innerHeight * 0.12)
            };
            popupPosition = {
                x: (window.innerWidth - previewWidth) / 2,
                y: Math.min(96, window.innerHeight * 0.12)
            };
            popupRoot.style.top = '';
            popupRoot.style.left = '';
        } else {
            popupOrigin = { x: mousePosition.x, y: mousePosition.y };
            popupPosition = { x: mousePosition.x + 16, y: mousePosition.y - 8 };
            popupRoot.style.top = `${popupPosition.y}px`;
            popupRoot.style.left = `${popupPosition.x}px`;
        }

        popupInput.value = '';
        popupInputSuggestion.value = '';
        popupStatusText.textContent = 'Type to search';

        // Show the popup immediately
        popupRoot.style.display = '';
        popupInput.focus();

        if (blockTypes && indexedTargetId === (vm.editingTarget && vm.editingTarget.id)) {
            doPerformSearch();
            return;
        }

        // Indexing is deferred so the shell appears immediately.
        requestAnimationFrame(() => {
            const toolbox = workspace.getToolbox();
            if (!toolbox || !toolbox.flyout_ || !toolbox.flyout_.getWorkspace()) {
                console.warn('Middle-click popup: Toolbox not ready yet, retrying...');
                // Show a loading message
                popupStatusText.textContent = 'Loading blocks...';

                // Retry after a short delay
                setTimeout(() => {
                    loadBlockTypes(workspace);
                }, 100);
            } else {
                loadBlockTypes(workspace);
            }
        });
    }

    /**
     * Load block types from a workspace
     * @param {*} workspace Workspace to load block types from
     */
    function loadBlockTypes(workspace) {
        try {
            blockTypes = BlockTypeInfo.getBlocks(Blockly, vm, workspace, msg);
            indexedTargetId = vm.editingTarget && vm.editingTarget.id;

            if (!blockTypes || blockTypes.length === 0) {
                console.warn('Middle-click popup: No block types available, showing empty search');
                blockTypes = [];
                popupStatusText.textContent = 'No blocks available';
                return;
            }

            querier.indexWorkspace([...blockTypes]);
            blockTypes.sort((a, b) => {
                /**
                 * @typedef {{ name: string }} LocalBlockCategory
                 * @typedef {{ category: LocalBlockCategory, id: string }} LocalBlockType
                 */
                /** @type {(block: LocalBlockType) => number} */
                const prio = (block) => ['operators', 'data'].indexOf(block.category.name) - (block.id.startsWith('data_') ? 1 : 0);
                return prio(b) - prio(a);
            });

            // Perform initial search now that blocks are loaded
            doPerformSearch();
        } catch (error) {
            console.error('Middle-click popup: Error loading blocks', error);
            popupStatusText.textContent = 'Error loading blocks';
        }
    }

    function closePopup() {
        if (allowMenuClose) {
            popupOrigin = null;
            popupPosition = null;
            popupRoot.style.display = 'none';
            if (searchFrame) cancelAnimationFrame(searchFrame);
            searchFrame = null;
        }
    }

    popupInput.addEventListener('input', updateInput);

    function updateInput() {
        if (searchFrame) cancelAnimationFrame(searchFrame);

        if (popupInput.value.trim().length === 0) {
            popupContainer.classList.add('sa-mcp-container-collapsed');
            doPerformSearch();
            return;
        }

        popupContainer.classList.remove('sa-mcp-container-collapsed');

        popupStatusText.textContent = 'Searching...';
        searchFrame = requestAnimationFrame(() => {
            searchFrame = null;
            doPerformSearch();
        });
    }

    function doPerformSearch() {
        // Check if blocks are loaded and workspace is indexed
        if (!blockTypes) {
            popupStatusText.textContent = 'Loading blocks...';
            return;
        }

        if (blockTypes.length === 0) {
            popupStatusText.textContent = 'No blocks available';
            return;
        }

        const searchResult = performSearch(popupInput.value, querier, blockTypes, vm, PREVIEW_LIMIT, searchMode);
        const blockList = searchResult.blockList;
        queryIllegalResult = searchResult.queryIllegalResult;
        limited = searchResult.limited;

        // Handle math/conversion results display
        if (popupInput.value.trim().length === 0) {
            popupStatusText.textContent = 'Type to search';
            popupResultBox.style.display = 'none';
        } else {
            if (searchResult.mathResult !== null) {
                popupResultBox.textContent = `= ${searchResult.mathResult}`;
                popupResultBox.style.display = '';
                popupResultBox.classList.add('sa-mcp-result-math');
                popupResultBox.classList.remove('sa-mcp-result-conversion');
            } else if (searchResult.conversionResult) {
                let resultStr = searchResult.conversionResult.result.toFixed(4).replace(/\.?0+$/, '');
                popupResultBox.textContent = `= ${resultStr} ${searchResult.conversionResult.toUnit}`;
                popupResultBox.style.display = '';
                popupResultBox.classList.add('sa-mcp-result-conversion');
                popupResultBox.classList.remove('sa-mcp-result-math');
            } else {
                popupResultBox.style.display = 'none';
                popupResultBox.classList.remove('sa-mcp-result-math', 'sa-mcp-result-conversion');
            }

            const hasComputed = popupResultBox.style.display !== 'none';
            const searchCount = blockList.filter(result => !result.isHeader).length;
            popupStatusText.textContent = searchCount > 0 ?
                `${searchCount} result${searchCount === 1 ? '' : 's'}${limited ? ' · best matches shown' : ''}` :
                (hasComputed ? 'Calculated result' : 'No results found');
        }

        // @ts-ignore Delete the old previews
        while (popupPreviewBlocks.firstChild) popupPreviewBlocks.removeChild(popupPreviewBlocks.lastChild);

        queryPreviews.length = 0;
        let y = 0;

        for (let resultIdx = 0; resultIdx < blockList.length; resultIdx++) {
            const result = blockList[resultIdx];

            const mouseMoveListener = () => {
                updateSelection(resultIdx);
            };

            const mouseDownListener = /** @param {MouseEvent} e */ (e) => {
                e.stopPropagation();
                e.preventDefault();
                updateSelection(resultIdx);
                allowMenuClose = !e.shiftKey;
                selectBlock();
                allowMenuClose = true;
                if (e.shiftKey) popupInput.focus();
            };

            const svgBackground = popupPreviewBlocks.appendChild(
                document.createElementNS('http://www.w3.org/2000/svg', 'rect')
            );

            // Use rendering utilities
            const svgGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            popupPreviewBlocks.appendChild(svgGroup);
            const { renderedBlock, height } = renderMenuItem(result, svgGroup, previewWidth, previewScale, Blockly, vm);

            /** @type {SVGGElement} */
            const svgBlock = svgGroup;

            if (!renderedBlock || !svgBlock) continue; // Skip if we couldn't render

            const actualHeight = calculateActualHeight(result, renderedBlock, height);

            if (isNaN(y)) {
                y = 0;
            }

            svgBackground.classList.add('sa-mcp-preview-block-bg');
            svgBackground.setAttribute('x', '8');
            svgBackground.setAttribute('width', `${previewWidth - 16}`);
            svgBackground.addEventListener('mousemove', mouseMoveListener);
            svgBackground.addEventListener('mousedown', mouseDownListener);
            svgBlock.addEventListener('mousemove', mouseMoveListener);
            svgBlock.addEventListener('mousedown', mouseDownListener);
            svgBlock.classList.add('sa-mcp-preview-block');

            // For custom blocks, headers, sprites, and costumes, position background at y
            // For regular blocks, add some offset
            const bgOffset = (result.isHeader || result.isSprite || result.isCostume ||
                result.isSound || result.isCustomBlock) ? 0 : actualHeight / 10;
            svgBackground.setAttribute('transform', `translate(0, ${(y + bgOffset) * previewScale})`);
            svgBackground.setAttribute('height', `${actualHeight * previewScale}px`);

            queryPreviews.push({
                block: result.block,
                autocompleteFactory: result.autocompleteFactory ?? null,
                renderedBlock,
                svgBlock,
                svgBackground,
                isSprite: result.isSprite,
                spriteData: result.spriteData,
                isCostume: result.isCostume,
                costumeData: result.costumeData,
                isHeader: result.isHeader,
                headerText: result.headerText,
                isCustomBlock: result.isCustomBlock,
                customBlockData: result.customBlockData,
                isSound: result.isSound,
                soundData: result.soundData
            });

            y += actualHeight;
        }

        if (isNaN(y) || !isFinite(y)) {
            y = 0;
        }

        const totalHeight = (y + 8) * previewScale;

        if (isNaN(totalHeight) || !isFinite(totalHeight)) {
            previewHeight = previewMinHeight;
        } else if (totalHeight < previewMinHeight) {
            previewHeight = previewMinHeight;
        } else if (totalHeight > previewMaxHeight) {
            previewHeight = previewMaxHeight;
        } else {
            previewHeight = totalHeight;
        }

        popupPreviewBlocks.setAttribute('height', `${isNaN(totalHeight) ? previewMinHeight : totalHeight}px`);
        popupPreviewContainer.style.height = `${previewHeight}px`;
        popupInputContainer.dataset.error = `${limited}`;

        // Adjust position if it goes off screen (only for non-centered mode)
        if (popupPosition && !isCenteredMode) {
            const popupHeight = popupContainer.getBoundingClientRect().height;
            const popupBottom = popupPosition.y + popupHeight;
            if (popupBottom > window.innerHeight) {
                popupPosition.y = Math.max(0, window.innerHeight - popupHeight);
                popupRoot.style.top = `${popupPosition.y}px`;
            }

            // Also check if it goes off the right edge
            const popupRight = popupPosition.x + previewWidth;
            if (popupRight > window.innerWidth) {
                popupPosition.x = Math.max(0, window.innerWidth - previewWidth);
                popupRoot.style.left = `${popupPosition.x}px`;
            }
        }

        selectedPreviewIdx = -1;
        updateSelection(0);
        updateCursor();
    }

    function updateSelection(/** @type {number} */ newIdx) {
        if (selectedPreviewIdx === newIdx) return;

        const oldSelection = queryPreviews[selectedPreviewIdx];
        if (oldSelection) {
            oldSelection.svgBackground.classList.remove('sa-mcp-preview-block-bg-selection');
            oldSelection.svgBlock.classList.remove('sa-mcp-preview-block-selection');
        }

        if (queryPreviews.length === 0 && queryIllegalResult) {
            popupInputSuggestion.value =
                popupInput.value + queryIllegalResult.toText(true).substring(popupInput.value.length);
            return;
        }

        // Use selection utility to find next selectable index
        const actualIdx = findNextSelectableIndex(queryPreviews, newIdx, selectedPreviewIdx);

        if (actualIdx === -1) {
            selectedPreviewIdx = -1;
            return;
        }

        const newSelection = queryPreviews[actualIdx];
        if (newSelection) {
            selectedPreviewIdx = actualIdx;

            newSelection.svgBackground.classList.add('sa-mcp-preview-block-bg-selection');
            newSelection.svgBlock.classList.add('sa-mcp-preview-block-selection');

            newSelection.svgBackground.scrollIntoView({
                block: 'nearest',
                behavior: 'auto'
            });

            if (newSelection.autocompleteFactory) {
                popupInputSuggestion.value =
                    popupInput.value + newSelection.autocompleteFactory(true).substring(popupInput.value.length);
            } else {
                popupInputSuggestion.value = '';
            }
        } else {
            popupInputSuggestion.value = '';
            selectedPreviewIdx = -1;
        }
    }

    // @ts-ignore
    document.addEventListener('selectionchange', updateCursor);

    function updateCursor() {
        const cursorPos = popupInput.selectionStart ?? 0;
        const cursorPosRel = popupInput.value.length === 0 ? 0 : cursorPos / popupInput.value.length;

        let y = 0;
        for (let previewIdx = 0; previewIdx < queryPreviews.length; previewIdx++) {
            const preview = queryPreviews[previewIdx];

            let blockX = 12;
            let blockY = 0;

            if (preview.isHeader || preview.isSprite || preview.isCostume || preview.isSound ||
                preview.isCustomBlock) {
                blockX = 0;
                blockY = y * previewScale;
            } else {
                // Regular blocks
                if (blockX + preview.renderedBlock.width > previewWidth / previewScale) {
                    blockX += (previewWidth / previewScale - blockX - preview.renderedBlock.width) * previewScale * cursorPosRel;
                }
                blockY = (y + 30) * previewScale;
            }

            preview.svgBlock.setAttribute('transform', `translate(${blockX}, ${blockY}) scale(${previewScale})`);

            if (preview.isHeader) {
                y += 40;
            } else if (preview.isSprite || preview.isCostume || preview.isSound || preview.isCustomBlock) {
                y += 60;
            } else if (preview.block) {
                const blockHeight = getBlockHeight(preview.block);
                y += (blockHeight && !isNaN(blockHeight)) ? blockHeight : 40;
            }
        }

        popupInputSuggestion.scrollLeft = popupInput.scrollLeft;
    }

    function selectBlock() {
        const selectedPreview = queryPreviews[selectedPreviewIdx];
        if (!selectedPreview) return;

        if (selectedPreview.isHeader) return;

        if (selectedPreview.isSprite && selectedPreview.spriteData) {
            handleSpriteSelection(selectedPreview.spriteData, vm);
            closePopup();
            return;
        }

        if (selectedPreview.isCostume && selectedPreview.costumeData) {
            handleCostumeSelection(selectedPreview.costumeData, vm, addon.tab.redux);
            closePopup();
            return;
        }

        if (selectedPreview.isSound && selectedPreview.soundData) {
            handleSoundSelection(selectedPreview.soundData, vm, addon.tab.redux);
            closePopup();
            return;
        }

        if (selectedPreview.isCustomBlock && selectedPreview.customBlockData) {
            handleCustomBlockSelection(selectedPreview.customBlockData, vm, Blockly, addon.tab.redux);
            closePopup();
            return;
        }

        if (!selectedPreview.block) return;

        const newBlock = handleBlockSelection(selectedPreview.block, Blockly, mousePosition);

        const fakeEvent = {
            clientX: mousePosition.x,
            clientY: mousePosition.y,
            type: 'mousedown',
            stopPropagation: function () { },
            preventDefault: function () { },
            target: selectedPreview.svgBlock
        };
        const workspace = Blockly.getMainWorkspace();
        if (workspace.getGesture(fakeEvent)) {
            workspace.startDragWithFakeEvent(fakeEvent, newBlock);
        }
    }

    function acceptAutocomplete() {
        let factory;
        if (queryPreviews[selectedPreviewIdx]) factory = queryPreviews[selectedPreviewIdx].autocompleteFactory;
        else factory = () => popupInputSuggestion.value;
        if (popupInputSuggestion.value.length === 0 || !factory) return;
        popupInput.value = factory(false);
        popupInput.selectionStart = popupInput.value.length + 1;
        updateInput();
    }

    popupInput.addEventListener('keydown', e => {
        switch (e.key) {
            case 'Escape':
                if (popupInput.value.length > 0) {
                    popupInput.value = '';
                    updateInput();
                } else {
                    closePopup();
                }
                e.stopPropagation();
                e.preventDefault();
                break;
            case 'Tab':
                acceptAutocomplete();
                e.stopPropagation();
                e.preventDefault();
                break;
            case 'Enter':
                selectBlock();
                closePopup();
                e.stopPropagation();
                e.preventDefault();
                break;
            case 'ArrowDown':
                if (selectedPreviewIdx + 1 >= queryPreviews.length) updateSelection(0);
                else updateSelection(selectedPreviewIdx + 1);
                e.stopPropagation();
                e.preventDefault();
                break;
            case 'ArrowUp':
                if (selectedPreviewIdx - 1 < 0) updateSelection(queryPreviews.length - 1);
                else updateSelection(selectedPreviewIdx - 1);
                e.stopPropagation();
                e.preventDefault();
                break;
            case 'PageDown':
                const nextIdx = Math.min(selectedPreviewIdx + 10, queryPreviews.length - 1);
                updateSelection(nextIdx);
                e.stopPropagation();
                e.preventDefault();
                break;
            case 'PageUp':
                const prevIdx = Math.max(selectedPreviewIdx - 10, 0);
                updateSelection(prevIdx);
                e.stopPropagation();
                e.preventDefault();
                break;
            case 'Home':
                updateSelection(0);
                e.stopPropagation();
                e.preventDefault();
                break;
            case 'End':
                updateSelection(queryPreviews.length - 1);
                e.stopPropagation();
                e.preventDefault();
                break;
        }
    });

    popupInput.addEventListener('focusout', closePopup);

    popupRoot.addEventListener('mousedown', e => {
        if (e.target === popupRoot) closePopup();
    });

    updateCallbacks({openSpotlight: () => openPopup(true)});

    const invalidateIndex = () => {
        blockTypes = null;
        indexedTargetId = null;
        querier.clearWorkspaceIndex();
    };
    vm.on('EXTENSION_ADDED', invalidateIndex);
    vm.on('EXTENSION_REMOVED', invalidateIndex);
    vm.on('EXTENSIONS_REORDERED', invalidateIndex);
    vm.on('BLOCKSINFO_UPDATE', invalidateIndex);

    // Open on mouse wheel button
    const _doWorkspaceClick_ = Blockly.Gesture.prototype.doWorkspaceClick_;
    Blockly.Gesture.prototype.doWorkspaceClick_ = function () {
        if (this.mostRecentEvent_.button === 1 || this.mostRecentEvent_.shiftKey) openPopup();
        mousePosition = { x: this.mostRecentEvent_.clientX, y: this.mostRecentEvent_.clientY };
        _doWorkspaceClick_.call(this);
    };

    // The popup should delete blocks dragged ontop of it
    const _isDeleteArea = Blockly.WorkspaceSvg.prototype.isDeleteArea;
    Blockly.WorkspaceSvg.prototype.isDeleteArea = function (/** @type {MouseEvent} */ e) {
        if (popupPosition) {
            if (
                e.clientX > popupPosition.x &&
                e.clientX < popupPosition.x + previewWidth &&
                e.clientY > popupPosition.y &&
                e.clientY < popupPosition.y + previewHeight
            ) {
                return Blockly.DELETE_AREA_TOOLBOX;
            }
        }
        return _isDeleteArea.call(this, e);
    };
}
