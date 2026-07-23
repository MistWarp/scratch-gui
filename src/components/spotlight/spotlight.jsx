/* eslint-disable no-use-before-define, func-style, require-jsdoc, no-loop-func */
import React, {useEffect, useMemo, useRef} from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import {Search} from 'lucide-react';
import {isRtl} from '@turbowarp/scratch-l10n';

import LazyScratchBlocks from '../../lib/tw-lazy-scratch-blocks';
import {updateCallbacks} from '../../lib/shortcuts/event-router.js';

import WorkspaceQuerier from '../../lib/spotlight/WorkspaceQuerier.js';
import {getBlockHeight} from '../../lib/spotlight/BlockRenderer.js';
import {BlockTypeInfo} from '../../lib/spotlight/BlockTypeInfo.js';
import {onClearTextWidthCache, offClearTextWidthCache} from '../../lib/spotlight/module.js';
import {performSearch} from '../../lib/spotlight/searchUtils.js';
import {getRecents, pushRecent} from '../../lib/spotlight/recents.js';
import {
    openSettingsModal,
    openExtensionLibrary,
    openExtensionManagerModal,
    openHelp
} from '../../reducers/modals.js';
import {activateTab} from '../../reducers/editor-tab.js';
import {HELP_ENTRIES} from '../../lib/help/index.js';
import {renderMenuItem, calculateActualHeight} from '../../lib/spotlight/renderingUtils.js';
import {
    findNextSelectableIndex,
    handleSpriteSelection,
    handleCostumeSelection,
    handleCustomBlockSelection,
    handleSoundSelection,
    handleBlockSelection
} from '../../lib/spotlight/selectionUtils.js';

import {loadAddonMessagesForLocale, formatAddonMessage} from '../find-bar/addon-i18n';

import './spotlight.css';

const PREVIEW_LIMIT = 32;
const POPUP_SCALE = 48;
const POPUP_WIDTH = 30;
const POPUP_MAX_HEIGHT = 40;

/**
 * The spotlight (middle click popup) component
 * @param {object} props the props for the component
 * @returns {null} nothing
 */
export default function NativeSpotlight ({vm, locale, activeTabIndex, isPlayerOnly, dispatch}) {
    const activeTabIndexRef = useRef(activeTabIndex);
    activeTabIndexRef.current = activeTabIndex;

    const isPlayerOnlyRef = useRef(isPlayerOnly);
    isPlayerOnlyRef.current = isPlayerOnly;

    const localeRef = useRef(locale);
    localeRef.current = locale;

    const dispatchRef = useRef(dispatch);
    dispatchRef.current = dispatch;

    const state = useMemo(() => ({
        cleanup: null
    }), []);

    useEffect(() => {
        let didUnmount = false;

        const run = async () => {
            if (!vm || isPlayerOnlyRef.current) return;

            const Blockly = await LazyScratchBlocks.load().then(() => LazyScratchBlocks.get());
            if (didUnmount) return;

            const messages = await loadAddonMessagesForLocale(localeRef.current);
            if (didUnmount) return;

            const msg = key => formatAddonMessage(messages, key.replace(/^\//, ''));

            let searchFrame = null;

            const popupRoot = document.body.appendChild(document.createElement('div'));
            popupRoot.classList.add('sa-mcp-root');
            popupRoot.dir = isRtl(localeRef.current) ? 'rtl' : 'ltr';
            popupRoot.style.display = 'none';

            const popupContainer = popupRoot.appendChild(document.createElement('div'));
            popupContainer.classList.add('sa-mcp-container');
            popupContainer.classList.add('sa-mcp-container-collapsed');
            popupContainer.setAttribute('aria-label', 'Spotlight search');
            popupContainer.setAttribute('role', 'dialog');

            const popupInputContainer = popupContainer.appendChild(document.createElement('div'));
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

            const dispatchAction = actionCreator => dispatchRef.current(actionCreator);
            const actions = [
                {
                    id: 'green-flag',
                    label: 'Green Flag',
                    keywords: ['run', 'start', 'play', 'flag', 'go'],
                    run: () => vm.greenFlag()
                },
                {
                    id: 'stop',
                    label: 'Stop',
                    keywords: ['halt', 'end', 'stop all'],
                    run: () => vm.stopAll()
                },
                {
                    id: 'open-settings',
                    label: 'Open Settings',
                    keywords: ['preferences', 'options', 'theme', 'appearance', 'fps'],
                    run: () => dispatchAction(openSettingsModal())
                },
                {
                    id: 'open-extensions',
                    label: 'Add Extension',
                    keywords: ['extension', 'library', 'add', 'pen', 'music'],
                    run: () => dispatchAction(openExtensionLibrary())
                },
                {
                    id: 'manage-extensions',
                    label: 'Manage Extensions',
                    keywords: ['extension', 'manager', 'remove', 'reorder'],
                    run: () => dispatchAction(openExtensionManagerModal())
                },
                {
                    id: 'open-help',
                    label: 'Open Help',
                    keywords: ['help', 'docs', 'documentation', 'guide', 'support'],
                    run: () => dispatchAction(openHelp())
                },
                {
                    id: 'help-blocks',
                    label: 'Help: Block palette',
                    keywords: ['help', 'blocks', 'docs', 'reference', 'palette'],
                    run: () => dispatchAction(openHelp('blocks-palette'))
                },
                {
                    id: 'tab-code',
                    label: 'Go to Code',
                    keywords: ['tab', 'scripts', 'workspace', 'blocks'],
                    run: () => dispatchAction(activateTab(0))
                },
                {
                    id: 'tab-costumes',
                    label: 'Go to Costumes',
                    keywords: ['tab', 'paint', 'draw', 'images'],
                    run: () => dispatchAction(activateTab(1))
                },
                {
                    id: 'tab-sounds',
                    label: 'Go to Sounds',
                    keywords: ['tab', 'audio', 'record'],
                    run: () => dispatchAction(activateTab(2))
                }
            ];

            const docs = HELP_ENTRIES.map(entry => ({
                id: `docs:${entry.id}`,
                label: entry.title,
                type: 'Docs',
                keywords: [...(entry.keywords || []), entry.category, 'docs', 'help', 'guide'],
                run: () => dispatchAction(openHelp(entry.id))
            }));

            let mousePosition = {x: 0, y: 0};
            const onMouseMove = e => {
                mousePosition = {x: e.clientX, y: e.clientY};
            };
            const onMouseDown = e => {
                mousePosition = {x: e.clientX, y: e.clientY};
            };
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mousedown', onMouseDown, {capture: true});

            onClearTextWidthCache(closePopup);

            const queryPreviews = [];
            let queryIllegalResult = null;
            let selectedPreviewIdx = 0;
            let blockTypes = null;
            let indexedTargetId = null;
            let limited = false;

            let allowMenuClose = true;

            let popupPosition = null;
            let isCenteredMode = false;
            let searchMode = 'everything';

            let previewWidth = 0;
            let previewHeight = 0;

            let previewScale = 0;

            const previewMinHeight = 0;
            let previewMaxHeight = 0;

            function openPopup (centered = false) {
                if (isPlayerOnlyRef.current) return;
                if (activeTabIndexRef.current !== 0) return;

                const workspace = Blockly.getMainWorkspace();
                if (!workspace) {
                    console.warn('Spotlight: Workspace not ready');
                    return;
                }

                isCenteredMode = centered;
                searchMode = centered ? 'everything' : 'blocks';
                popupRoot.classList.toggle('sa-mcp-centered', centered);
                popupContainer.setAttribute('aria-modal', `${centered}`);

                previewScale = (window.innerWidth * 0.00005) + (POPUP_SCALE / 100);

                if (isNaN(previewScale) || !isFinite(previewScale) || previewScale <= 0) {
                    previewScale = 0.56;
                }

                if (centered) {
                    previewWidth = Math.min(window.innerWidth - 32, 680);
                } else {
                    previewWidth = (window.innerWidth * POPUP_WIDTH) / 100;
                }

                if (isNaN(previewWidth) || !isFinite(previewWidth) || previewWidth <= 0) {
                    previewWidth = 480;
                }

                previewMaxHeight = centered ?
                    Math.min(window.innerHeight * 0.62, 620) :
                    (window.innerHeight * POPUP_MAX_HEIGHT) / 100;

                if (isNaN(previewMaxHeight) || !isFinite(previewMaxHeight) || previewMaxHeight <= 0) {
                    previewMaxHeight = 480;
                }

                popupContainer.style.width = `${previewWidth}px`;

                if (centered) {
                    popupPosition = {
                        x: (window.innerWidth - previewWidth) / 2,
                        y: Math.min(96, window.innerHeight * 0.12)
                    };
                    popupRoot.style.top = '';
                    popupRoot.style.left = '';
                } else {
                    popupPosition = {x: mousePosition.x + 16, y: mousePosition.y - 8};
                    popupRoot.style.top = `${popupPosition.y}px`;
                    popupRoot.style.left = `${popupPosition.x}px`;
                }

                popupInput.value = '';
                popupInputSuggestion.value = '';
                popupContainer.classList.toggle('sa-mcp-container-collapsed', searchMode !== 'everything');
                popupStatusText.textContent = searchMode === 'everything' ?
                    'Type to search blocks, sprites, actions...' : 'Type to search';

                popupRoot.style.display = '';
                popupInput.focus();

                if (blockTypes && indexedTargetId === (vm.editingTarget && vm.editingTarget.id)) {
                    doPerformSearch();
                    return;
                }

                requestAnimationFrame(() => {
                    const toolbox = workspace.getToolbox();
                    if (!toolbox || !toolbox.flyout_ || !toolbox.flyout_.getWorkspace()) {
                        console.warn('Spotlight: Toolbox not ready yet, retrying...');
                        popupStatusText.textContent = 'Loading blocks...';

                        setTimeout(() => {
                            loadBlockTypes(workspace);
                        }, 100);
                    } else {
                        loadBlockTypes(workspace);
                    }
                });
            }

            function loadBlockTypes (workspace) {
                try {
                    blockTypes = BlockTypeInfo.getBlocks(Blockly, vm, workspace, msg);
                    indexedTargetId = vm.editingTarget && vm.editingTarget.id;

                    if (!blockTypes || blockTypes.length === 0) {
                        console.warn('Spotlight: No block types available, showing empty search');
                        blockTypes = [];
                        popupStatusText.textContent = 'No blocks available';
                        return;
                    }

                    querier.indexWorkspace([...blockTypes]);
                    blockTypes.sort((a, b) => {
                        const prio = block => ['operators', 'data'].indexOf(block.category.name) -
                            (block.id.startsWith('data_') ? 1 : 0);
                        return prio(b) - prio(a);
                    });

                    doPerformSearch();
                } catch (error) {
                    console.error('Spotlight: Error loading blocks', error);
                    popupStatusText.textContent = 'Error loading blocks';
                }
            }

            function closePopup () {
                if (allowMenuClose) {
                    popupPosition = null;
                    popupRoot.style.display = 'none';
                    if (searchFrame) cancelAnimationFrame(searchFrame);
                    searchFrame = null;
                }
            }

            function updateInput () {
                if (searchFrame) cancelAnimationFrame(searchFrame);

                if (popupInput.value.trim().length === 0) {
                    popupContainer.classList.toggle('sa-mcp-container-collapsed', searchMode !== 'everything');
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

            function doPerformSearch () {
                if (!blockTypes) {
                    popupStatusText.textContent = 'Loading blocks...';
                    return;
                }

                if (blockTypes.length === 0) {
                    popupStatusText.textContent = 'No blocks available';
                    return;
                }

                const searchResult = performSearch(
                    popupInput.value, querier, blockTypes, vm, PREVIEW_LIMIT, searchMode,
                    {actions, docs, recents: getRecents()}
                );
                const blockList = searchResult.blockList;
                queryIllegalResult = searchResult.queryIllegalResult;
                limited = searchResult.limited;

                if (popupInput.value.trim().length === 0) {
                    const hasEmptyResults = blockList.some(result => !result.isHeader);
                    if (searchMode === 'everything') {
                        popupStatusText.textContent = hasEmptyResults ?
                            'Recent' : 'Type to search blocks, sprites, actions...';
                    } else {
                        popupStatusText.textContent = 'Type to search';
                    }
                    popupResultBox.style.display = 'none';
                } else {
                    if (searchResult.mathResult !== null) {
                        popupResultBox.textContent = `= ${searchResult.mathResult}`;
                        popupResultBox.style.display = '';
                        popupResultBox.classList.add('sa-mcp-result-math');
                        popupResultBox.classList.remove('sa-mcp-result-conversion');
                    } else if (searchResult.conversionResult) {
                        const resultStr = searchResult.conversionResult.result.toFixed(4).replace(/\.?0+$/, '');
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
                    const plural = searchCount === 1 ? '' : 's';
                    const limitNote = limited ? ' · best matches shown' : '';
                    popupStatusText.textContent = searchCount > 0 ?
                        `${searchCount} result${plural}${limitNote}` :
                        (hasComputed ? 'Calculated result' : 'No results found');
                }

                while (popupPreviewBlocks.firstChild) popupPreviewBlocks.removeChild(popupPreviewBlocks.lastChild);

                queryPreviews.length = 0;
                let y = 0;

                for (let resultIdx = 0; resultIdx < blockList.length; resultIdx++) {
                    const result = blockList[resultIdx];

                    const mouseMoveListener = () => {
                        updateSelection(resultIdx);
                    };

                    const mouseDownListener = e => {
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

                    const svgGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                    popupPreviewBlocks.appendChild(svgGroup);
                    const {renderedBlock, height} = renderMenuItem(
                        result, svgGroup, previewWidth, previewScale, Blockly, vm
                    );

                    const svgBlock = svgGroup;

                    if (!renderedBlock || !svgBlock) continue;

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

                    const bgOffset = (result.isHeader || result.isSprite || result.isCostume ||
                        result.isSound || result.isCustomBlock || result.isAction) ? 0 : actualHeight / 10;
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
                        soundData: result.soundData,
                        isAction: result.isAction,
                        actionData: result.actionData
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

                if (popupPosition && !isCenteredMode) {
                    const popupHeight = popupContainer.getBoundingClientRect().height;
                    const popupBottom = popupPosition.y + popupHeight;
                    if (popupBottom > window.innerHeight) {
                        popupPosition.y = Math.max(0, window.innerHeight - popupHeight);
                        popupRoot.style.top = `${popupPosition.y}px`;
                    }

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

            function updateSelection (newIdx) {
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
                        const auto = newSelection.autocompleteFactory(true);
                        popupInputSuggestion.value = popupInput.value + auto.substring(popupInput.value.length);
                    } else {
                        popupInputSuggestion.value = '';
                    }
                } else {
                    popupInputSuggestion.value = '';
                    selectedPreviewIdx = -1;
                }
            }

            function updateCursor () {
                const cursorPos = popupInput.selectionStart ?? 0;
                const cursorPosRel = popupInput.value.length === 0 ? 0 : cursorPos / popupInput.value.length;

                let y = 0;
                for (let previewIdx = 0; previewIdx < queryPreviews.length; previewIdx++) {
                    const preview = queryPreviews[previewIdx];

                    let blockX = 12;
                    let blockY = 0;

                    if (preview.isHeader || preview.isSprite || preview.isCostume || preview.isSound ||
                        preview.isCustomBlock || preview.isAction) {
                        blockX = 0;
                        blockY = y * previewScale;
                    } else {
                        if (blockX + preview.renderedBlock.width > previewWidth / previewScale) {
                            blockX += ((previewWidth / previewScale) - blockX - preview.renderedBlock.width) *
                                previewScale * cursorPosRel;
                        }
                        blockY = (y + 30) * previewScale;
                    }

                    preview.svgBlock.setAttribute(
                        'transform', `translate(${blockX}, ${blockY}) scale(${previewScale})`
                    );

                    if (preview.isHeader) {
                        y += 40;
                    } else if (preview.isSprite || preview.isCostume || preview.isSound ||
                        preview.isCustomBlock || preview.isAction) {
                        y += 60;
                    } else if (preview.block) {
                        const blockHeight = getBlockHeight(preview.block);
                        y += (blockHeight && !isNaN(blockHeight)) ? blockHeight : 40;
                    }
                }

                popupInputSuggestion.scrollLeft = popupInput.scrollLeft;
            }

            function selectBlock () {
                const selectedPreview = queryPreviews[selectedPreviewIdx];
                if (!selectedPreview) return;

                if (selectedPreview.isHeader) return;

                if (selectedPreview.isAction && selectedPreview.actionData) {
                    pushRecent('action', selectedPreview.actionData.id);
                    selectedPreview.actionData.run();
                    closePopup();
                    return;
                }

                if (selectedPreview.isSprite && selectedPreview.spriteData) {
                    pushRecent('asset', `sprite:${selectedPreview.spriteData.name}`);
                    handleSpriteSelection(selectedPreview.spriteData, vm);
                    closePopup();
                    return;
                }

                if (selectedPreview.isCostume && selectedPreview.costumeData) {
                    pushRecent('asset', `costume:${selectedPreview.costumeData.name}`);
                    handleCostumeSelection(selectedPreview.costumeData, vm, {dispatch: dispatchRef.current});
                    closePopup();
                    return;
                }

                if (selectedPreview.isSound && selectedPreview.soundData) {
                    pushRecent('asset', `sound:${selectedPreview.soundData.name}`);
                    handleSoundSelection(selectedPreview.soundData, vm, {dispatch: dispatchRef.current});
                    closePopup();
                    return;
                }

                if (selectedPreview.isCustomBlock && selectedPreview.customBlockData) {
                    pushRecent('asset', `customblock:${selectedPreview.customBlockData.displayName}`);
                    handleCustomBlockSelection(
                        selectedPreview.customBlockData, vm, Blockly, {dispatch: dispatchRef.current}
                    );
                    closePopup();
                    return;
                }

                if (!selectedPreview.block) return;

                if (searchMode === 'everything' && selectedPreview.autocompleteFactory) {
                    pushRecent('block', selectedPreview.autocompleteFactory(false));
                }

                const newBlock = handleBlockSelection(selectedPreview.block, Blockly, mousePosition);

                const fakeEvent = {
                    clientX: mousePosition.x,
                    clientY: mousePosition.y,
                    type: 'mousedown',
                    stopPropagation: function () {},
                    preventDefault: function () {},
                    target: selectedPreview.svgBlock
                };
                const workspace = Blockly.getMainWorkspace();
                if (workspace.getGesture(fakeEvent)) {
                    workspace.startDragWithFakeEvent(fakeEvent, newBlock);
                }
            }

            function acceptAutocomplete () {
                let factory;
                if (queryPreviews[selectedPreviewIdx]) factory = queryPreviews[selectedPreviewIdx].autocompleteFactory;
                else factory = () => popupInputSuggestion.value;
                if (popupInputSuggestion.value.length === 0 || !factory) return;
                popupInput.value = factory(false);
                popupInput.selectionStart = popupInput.value.length + 1;
                updateInput();
            }

            const onKeyDown = e => {
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
                case 'PageDown': {
                    const nextIdx = Math.min(selectedPreviewIdx + 10, queryPreviews.length - 1);
                    updateSelection(nextIdx);
                    e.stopPropagation();
                    e.preventDefault();
                    break;
                }
                case 'PageUp': {
                    const prevIdx = Math.max(selectedPreviewIdx - 10, 0);
                    updateSelection(prevIdx);
                    e.stopPropagation();
                    e.preventDefault();
                    break;
                }
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
                default:
                    break;
                }
            };

            popupInput.addEventListener('input', updateInput);
            popupInput.addEventListener('keydown', onKeyDown);
            popupInput.addEventListener('focusout', closePopup);
            document.addEventListener('selectionchange', updateCursor);

            popupRoot.addEventListener('mousedown', e => {
                if (e.target === popupRoot) closePopup();
            });

            updateCallbacks({openSpotlight: () => openPopup(true)});

            const onSpotlightMessage = e => {
                if (e.origin !== window.location.origin) return;
                if (e.data && e.data.type === 'mw:spotlight') openPopup(true);
            };
            window.addEventListener('message', onSpotlightMessage);

            const invalidateIndex = () => {
                blockTypes = null;
                indexedTargetId = null;
                querier.clearWorkspaceIndex();
            };
            vm.on('EXTENSION_ADDED', invalidateIndex);
            vm.on('EXTENSION_REMOVED', invalidateIndex);
            vm.on('EXTENSIONS_REORDERED', invalidateIndex);
            vm.on('BLOCKSINFO_UPDATE', invalidateIndex);

            const originalDoWorkspaceClick = Blockly.Gesture.prototype.doWorkspaceClick_;
            let patchedDoWorkspaceClick = null;
            if (!originalDoWorkspaceClick.__mwSpotlightPatched) {
                patchedDoWorkspaceClick = function () {
                    /* eslint-disable no-invalid-this */
                    if (this.mostRecentEvent_.button === 1 || this.mostRecentEvent_.shiftKey) openPopup();
                    mousePosition = {x: this.mostRecentEvent_.clientX, y: this.mostRecentEvent_.clientY};
                    return originalDoWorkspaceClick.call(this);
                    /* eslint-enable no-invalid-this */
                };
                patchedDoWorkspaceClick.__mwSpotlightPatched = true;
                Blockly.Gesture.prototype.doWorkspaceClick_ = patchedDoWorkspaceClick;
            }

            const originalIsDeleteArea = Blockly.WorkspaceSvg.prototype.isDeleteArea;
            let patchedIsDeleteArea = null;
            if (!originalIsDeleteArea.__mwSpotlightPatched) {
                patchedIsDeleteArea = function (e) {
                    /* eslint-disable no-invalid-this */
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
                    return originalIsDeleteArea.call(this, e);
                    /* eslint-enable no-invalid-this */
                };
                patchedIsDeleteArea.__mwSpotlightPatched = true;
                Blockly.WorkspaceSvg.prototype.isDeleteArea = patchedIsDeleteArea;
            }

            state.cleanup = () => {
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mousedown', onMouseDown, {capture: true});
                document.removeEventListener('selectionchange', updateCursor);
                window.removeEventListener('message', onSpotlightMessage);
                offClearTextWidthCache(closePopup);

                vm.off('EXTENSION_ADDED', invalidateIndex);
                vm.off('EXTENSION_REMOVED', invalidateIndex);
                vm.off('EXTENSIONS_REORDERED', invalidateIndex);
                vm.off('BLOCKSINFO_UPDATE', invalidateIndex);

                if (patchedDoWorkspaceClick &&
                    Blockly.Gesture.prototype.doWorkspaceClick_ === patchedDoWorkspaceClick) {
                    Blockly.Gesture.prototype.doWorkspaceClick_ = originalDoWorkspaceClick;
                }
                if (patchedIsDeleteArea &&
                    Blockly.WorkspaceSvg.prototype.isDeleteArea === patchedIsDeleteArea) {
                    Blockly.WorkspaceSvg.prototype.isDeleteArea = originalIsDeleteArea;
                }

                if (searchFrame) cancelAnimationFrame(searchFrame);
                ReactDOM.unmountComponentAtNode(popupSearchIcon);
                if (popupRoot.parentNode) popupRoot.parentNode.removeChild(popupRoot);
            };
        };

        run();

        return () => {
            didUnmount = true;
            if (state.cleanup) {
                state.cleanup();
                state.cleanup = null;
            }
        };
    }, [vm, state]);

    return null;
}

NativeSpotlight.propTypes = {
    vm: PropTypes.shape({
        on: PropTypes.func,
        off: PropTypes.func,
        editingTarget: PropTypes.object,
        runtime: PropTypes.shape({
            targets: PropTypes.array
        }),
        setEditingTarget: PropTypes.func,
        greenFlag: PropTypes.func,
        stopAll: PropTypes.func
    }).isRequired,
    locale: PropTypes.string,
    activeTabIndex: PropTypes.number.isRequired,
    isPlayerOnly: PropTypes.bool,
    dispatch: PropTypes.func.isRequired
};

NativeSpotlight.defaultProps = {
    locale: null,
    isPlayerOnly: false
};
