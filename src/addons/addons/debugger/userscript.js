import {isPaused, setPaused, onPauseChanged, setup} from './module.js';
import createLogsTab from './logs.js';
import createThreadsTab from './threads.js';
import createPerformanceTab from './performance.js';
import createMemoryTab from './memory.js';
import Utils from '../find-bar/blockly/Utils.js';
import addSmallStageClass from '../../libraries/common/cs/small-stage.js';
import WindowManager from '../../window-system/window-manager.js';

const removeAllChildren = element => {
    if (!element) return;
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
};

/**
 * Debugger addon main script
 * @param {object} param0 Scratch addon parameters
 */
export default async function ({addon, console, msg}) {
    setup(addon);

    let logsTab;
    const messagesLoggedBeforeLogsTabLoaded = [];
    const logMessage = (...args) => {
        if (logsTab) {
            logsTab.addLog(...args);
        } else {
            messagesLoggedBeforeLogsTabLoaded.push(args);
        }
    };

    let hasLoggedPauseError = false;
    const pause = (_, thread) => {
        if (addon.tab.redux.state.scratchGui.mode.isPlayerOnly) {
            if (!hasLoggedPauseError) {
                logMessage(msg('cannot-pause-player'), thread, 'error');
                hasLoggedPauseError = true;
            }
            return;
        }
        setPaused(true);
        setInterfaceVisible(true);
    };
    addon.tab.addBlock('\u200B\u200Bbreakpoint\u200B\u200B', {
        args: [],
        displayName: msg('block-breakpoint'),
        callback: pause
    });
    addon.tab.addBlock('\u200B\u200Blog\u200B\u200B %s', {
        args: ['content'],
        displayName: msg('block-log'),
        callback: ({content}, thread) => {
            logMessage(content, thread, 'log');
        }
    });
    addon.tab.addBlock('\u200B\u200Bwarn\u200B\u200B %s', {
        args: ['content'],
        displayName: msg('block-warn'),
        callback: ({content}, thread) => {
            logMessage(content, thread, 'warn');
        }
    });
    addon.tab.addBlock('\u200B\u200Berror\u200B\u200B %s', {
        args: ['content'],
        displayName: msg('block-error'),
        callback: ({content}, thread) => {
            logMessage(content, thread, 'error');
        }
    });

    const vm = addon.tab.traps.vm;
    await new Promise((resolve, reject) => {
        if (vm.editingTarget) return resolve();
        vm.runtime.once('PROJECT_LOADED', resolve);
    });
    const ScratchBlocks = await addon.tab.traps.getBlockly();

    const debuggerButtonOuter = document.createElement('div');
    debuggerButtonOuter.className = 'sa-debugger-container';
    const debuggerButton = document.createElement('div');
    debuggerButton.className = addon.tab.scratchClass('button_outlined-button', 'stage-header_stage-button');
    const debuggerButtonContent = document.createElement('div');
    debuggerButtonContent.className = addon.tab.scratchClass('button_content');
    const debuggerButtonImage = document.createElement('svg');
    debuggerButtonImage.className = addon.tab.scratchClass('stage-header_stage-button-icon');
    debuggerButtonImage.draggable = false;
    debuggerButtonImage.innerHTML = addon.self.getResource('/icons/debug.svg');
    debuggerButtonContent.appendChild(debuggerButtonImage);
    debuggerButton.appendChild(debuggerButtonContent);
    debuggerButtonOuter.appendChild(debuggerButton);
    debuggerButton.addEventListener('click', () => toggleDebuggerInterface());

    // Prevent text selection and highlighting on debugger button
    debuggerButtonOuter.style.userSelect = 'none';
    debuggerButton.style.userSelect = 'none';
    debuggerButtonContent.style.userSelect = 'none';
    debuggerButtonImage.style.userSelect = 'none';
  
    // Prevent focus/active highlighting
    debuggerButton.style.outline = 'none';
    debuggerButton.style.webkitTapHighlightColor = 'transparent';
    debuggerButton.addEventListener('mousedown', e => {
        e.preventDefault(); // Prevent default selection behavior
    });
    debuggerButton.addEventListener('selectstart', e => {
        e.preventDefault(); // Prevent text selection
    });

    let debuggerWindow = null;

    const setHasUnreadMessage = unreadMessage => {
        debuggerButtonContent.classList.toggle('sa-debugger-unread', unreadMessage);
    };

    const toggleDebuggerInterface = () => {
        try {
            // Check if window exists and is actually visible
            if (debuggerWindow && debuggerWindow.isVisible) {
                setInterfaceVisible(false);
            } else {
                setInterfaceVisible(true);
            }
      
            // Ensure state consistency - if window was somehow destroyed but we think it's visible
            if (!debuggerWindow && isInterfaceVisible) {
                isInterfaceVisible = false;
            }
      
            // Additional safety check: if window element was removed from DOM
            if (debuggerWindow && !document.contains(debuggerWindow.element)) {
                debuggerWindow = null;
                isInterfaceVisible = false;
            }
        } catch (error) {
            console.error('Error toggling debugger interface:', error);
            // Reset state on error
            debuggerWindow = null;
            isInterfaceVisible = false;
            debuggerButtonContent.classList.remove('sa-debugger-active', 'sa-debugger-unread');
        }
    };

    let isInterfaceVisible = false;
    const setInterfaceVisible = _isVisible => {
        try {
            isInterfaceVisible = _isVisible;

            if (_isVisible) {
                if (!debuggerWindow) {
                    createDebuggerWindow();
                }
        
                // If window is minimized, restore it instead of just showing
                if (debuggerWindow.isMinimized) {
                    debuggerWindow.restore();
                } else {
                    debuggerWindow.show().bringToFront();
                }
        
                if (activeTab && activeTab.show) {
                    activeTab.show();
                }
        
                // Update button state to show debugger is active
                debuggerButtonContent.classList.add('sa-debugger-active');
            } else {
                if (debuggerWindow) {
                    debuggerWindow.hide();
                    if (activeTab && activeTab.hide) {
                        activeTab.hide();
                    }
                }
        
                // Clear unread message indicator when closing debugger
                setHasUnreadMessage(false);
        
                // Update button visual state to reflect debugger is closed
                debuggerButtonContent.classList.remove('sa-debugger-active');
            }
      
            // If the debugger is being hidden and the window was destroyed externally,
            // ensure our state stays consistent
            if (!_isVisible && debuggerWindow && !debuggerWindow.element) {
                debuggerWindow = null;
            }
        } catch (error) {
            console.error('Error setting debugger interface visibility:', error);
            // Reset state on error
            isInterfaceVisible = false;
            debuggerButtonContent.classList.remove('sa-debugger-active', 'sa-debugger-unread');
        }
    };

    // Variables to store interface elements
    let interfaceContainer;
    let tabListElement;
    let buttonContainerElement;
    let tabContentContainer;
    let updateCompilerWarningVisibility;

    // Cleanup for listeners tied to a specific debugger window instance.
    // (Do not put VM/runtime overrides here; closing the window should not disable debugging.)
    const windowCleanupFunctions = [];

    // Cleanup for when the addon is disabled/unloaded.
    // This is where we restore VM/runtime overrides and remove global listeners.
    const cleanupFunctions = [];

    // Tabs are created once, but the debugger window DOM can be recreated.
    // These references allow us to remount tabs/content when the window is reopened.
    let allTabs = [];
    let activeTab = null;
    let setActiveTab = null;
    const boundTabClicks = new WeakSet();

    const mountDebuggerInterface = () => {
        if (!tabListElement || !buttonContainerElement || !tabContentContainer) return;
        if (!setActiveTab || !allTabs || allTabs.length === 0) return;

        // Reattach tab elements into the new window's tab list.
        // Appending moves the existing nodes from any previous window.
        removeAllChildren(tabListElement);
        for (const tab of allTabs) {
            if (tab?.tab?.element) {
                tabListElement.appendChild(tab.tab.element);

                // Ensure click handler is only bound once per tab element.
                if (!boundTabClicks.has(tab.tab.element)) {
                    tab.tab.element.addEventListener('click', () => {
                        setActiveTab(tab);
                    });
                    boundTabClicks.add(tab.tab.element);
                }
            }
        }

        // Keyboard navigation for tabs (bind per-window, since tabListElement is recreated).
        const handleTabListKeyDown = e => {
            const tabs = Array.from(tabListElement.children);
            const currentIndex = tabs.indexOf(e.target);
            if (currentIndex === -1) return;

            let nextIndex = currentIndex;
            switch (e.key) {
            case 'ArrowRight':
            case 'ArrowDown':
                nextIndex = (currentIndex + 1) % tabs.length;
                break;
            case 'ArrowLeft':
            case 'ArrowUp':
                nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
                break;
            case 'Home':
                nextIndex = 0;
                break;
            case 'End':
                nextIndex = tabs.length - 1;
                break;
            default:
                return;
            }

            if (nextIndex !== currentIndex) {
                e.preventDefault();
                tabs[nextIndex].focus();
                const correspondingTab = allTabs.find(tab => tab?.tab?.element === tabs[nextIndex]);
                if (correspondingTab) {
                    setActiveTab(correspondingTab);
                }
            }
        };
        tabListElement.addEventListener('keydown', handleTabListKeyDown);
        windowCleanupFunctions.push(() => {
            tabListElement?.removeEventListener('keydown', handleTabListKeyDown);
        });

        // Restore previously active tab if possible; otherwise default to first.
        const tabToSelect = (activeTab && allTabs.includes(activeTab)) ? activeTab : allTabs[0];
        if (tabToSelect) {
            setActiveTab(tabToSelect);
        }
    };

    const createDebuggerWindow = () => {
        debuggerWindow = WindowManager.createWindow({
            id: 'debugger',
            title: 'Debugger',
            width: 600,
            height: 400,
            minWidth: 600,
            minHeight: 400,
            maxWidth: Math.min(window.innerWidth * 0.9, 800),
            maxHeight: Math.min(window.innerHeight * 0.9, 600),
            className: 'sa-debugger-window',
            x: 50,
            y: 50,
            onClose: () => {
                // Cleanup when window is closed. The debugger addon continues running;
                // we only tear down listeners that were tied to this window instance.
                debuggerWindow = null;
                isInterfaceVisible = false;

                // Clear references to DOM nodes that belonged to the closed window.
                interfaceContainer = null;
                tabListElement = null;
                buttonContainerElement = null;
                tabContentContainer = null;
                updateCompilerWarningVisibility = null;
        
                // Hide active tab properly
                if (activeTab && activeTab.hide) {
                    activeTab.hide();
                }
        
                // Update button state to reflect that debugger is closed
                debuggerButtonContent.classList.remove('sa-debugger-unread');
                debuggerButtonContent.classList.remove('sa-debugger-active');
        
                // Clear any pending messages or timers if they exist
                setHasUnreadMessage(false);
        
                // Run window-scoped cleanup functions
                for (const cleanup of windowCleanupFunctions) {
                    try {
                        cleanup();
                    } catch (error) {
                        console.warn('Error during debugger cleanup:', error);
                    }
                }
                windowCleanupFunctions.length = 0;
        
                // Optional: pause the program if it's running when debugger closes
                // This provides better UX as users expect debugger closure to stop debugging
                if (isPaused()) {
                    setPaused(false);
                }
            },
            onResize: () => {
                // Handle any resize logic for tabs if needed
                if (activeTab && activeTab.resize) {
                    activeTab.resize();
                }
            }
        });

        // Create the interface content
        interfaceContainer = createDebuggerInterface();

        // Set the content
        debuggerWindow.setContent(interfaceContainer);

        // If tabs have already been created, mount them into this new window instance.
        mountDebuggerInterface();
    
        // Add keyboard shortcut support
        const handleKeyDown = e => {
            if (e.key === 'Escape' && isInterfaceVisible) {
                e.preventDefault();
                setInterfaceVisible(false);
            }
        };
    
        // Add global escape key listener when debugger is open
        document.addEventListener('keydown', handleKeyDown);
    
        // Track keyboard listener for cleanup
        windowCleanupFunctions.push(() => {
            document.removeEventListener('keydown', handleKeyDown);
        });
    };

    const createDebuggerInterface = () => {
        interfaceContainer = Object.assign(document.createElement('div'), {
            className: 'sa-debugger-interface-content'
        });

        tabListElement = Object.assign(document.createElement('ul'), {
            'className': 'sa-debugger-tabs',
            'role': 'tablist',
            'aria-label': 'Debugger tabs'
        });
        buttonContainerElement = Object.assign(document.createElement('div'), {
            'className': 'sa-debugger-header-buttons',
            'role': 'toolbar',
            'aria-label': 'Debugger controls'
        });
        tabContentContainer = Object.assign(document.createElement('div'), {
            className: 'sa-debugger-tab-content',
            role: 'tabpanel'
        });

        const interfaceHeader = Object.assign(document.createElement('div'), {
            className: 'sa-debugger-header'
        });

        const compilerWarning = document.createElement('a');
        compilerWarning.addEventListener('click', () => {
            addon.tab.redux.dispatch({
                type: 'scratch-gui/modals/OPEN_MODAL',
                modal: 'settingsModal'
            });
        });
        compilerWarning.className = 'sa-debugger-log sa-debugger-compiler-warning';
        compilerWarning.textContent = 'The debugger works best when the compiler is disabled.';
        updateCompilerWarningVisibility = () => {
            compilerWarning.hidden = !vm.runtime.compilerOptions.enabled;
        };
        vm.on('COMPILER_OPTIONS_CHANGED', updateCompilerWarningVisibility);
        updateCompilerWarningVisibility();
    
        // Track this VM event listener for cleanup
        windowCleanupFunctions.push(() => {
            vm.off('COMPILER_OPTIONS_CHANGED', updateCompilerWarningVisibility);
        });

        interfaceHeader.append(tabListElement, buttonContainerElement);
        interfaceContainer.append(interfaceHeader, compilerWarning, tabContentContainer);

        return interfaceContainer;
    };

    const createHeaderButton = ({text, icon, description}) => {
        const button = Object.assign(document.createElement('div'), {
            'className': addon.tab.scratchClass('card_shrink-expand-button'),
            'draggable': false,
            'role': 'button',
            'tabIndex': 0,
            'aria-label': description || text || 'Button'
        });
        if (description) {
            button.title = description;
        }
        const imageElement = Object.assign(document.createElement('img'), {
            'src': icon,
            'draggable': false,
            'alt': '',
            'aria-hidden': 'true'
        });
        const textElement = Object.assign(document.createElement('span'), {
            textContent: text || 'Button'
        });
        button.appendChild(imageElement);
        button.appendChild(textElement);
    
        // Add keyboard support
        button.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                button.click();
            }
        });
    
        return {
            element: button,
            image: imageElement,
            text: textElement
        };
    };

    const createHeaderTab = ({text, icon}) => {
        const tab = document.createElement('li');
        tab.setAttribute('role', 'tab');
        tab.setAttribute('tabindex', '0');
        tab.setAttribute('aria-label', text || 'Tab');
    
        const imageElement = Object.assign(addon.tab.recolorable(), {
            'src': icon,
            'draggable': false,
            'alt': '',
            'aria-hidden': 'true'
        });
        const textElement = Object.assign(document.createElement('span'), {
            textContent: text || 'Tab'
        });
        tab.appendChild(imageElement);
        tab.appendChild(textElement);
    
        // Add keyboard support for tabs
        tab.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                tab.click();
            }
        });
    
        return {
            element: tab,
            image: imageElement,
            text: textElement
        };
    };

    const unpauseButton = createHeaderButton({
        text: msg('unpause'),
        icon: addon.self.getResource('/icons/play.svg') /* rewritten by pull.js */
    });
    unpauseButton.element.classList.add('sa-debugger-unpause');
    unpauseButton.element.addEventListener('click', () => setPaused(false));
    const updateUnpauseVisibility = paused => {
        unpauseButton.element.style.display = paused ? '' : 'none';
    };
    updateUnpauseVisibility(isPaused());
    onPauseChanged(updateUnpauseVisibility);

    // Close button removed for better UX - users can use the window's native close button or ESC key

    const originalStep = vm.runtime._step;
    const afterStepCallbacks = [];
    vm.runtime._step = function (...args) {
        const ret = originalStep.call(this, ...args);
        for (const cb of afterStepCallbacks) {
            cb();
        }
        return ret;
    };
    const addAfterStepCallback = cb => {
        afterStepCallbacks.push(cb);
    };
  
    // Restore vm.runtime._step when the addon is disabled/unloaded.
    cleanupFunctions.push(() => {
        if (vm && vm.runtime && originalStep) {
            vm.runtime._step = originalStep;
        }
    });

    const getBlock = (target, id) => target.blocks.getBlock(id) || vm.runtime.flyoutBlocks.getBlock(id);

    const getTargetInfoById = id => {
        const target = vm.runtime.getTargetById(id);
        if (target) {
            let name = target.getName();
            let original = target;
            if (!target.isOriginal) {
                name = msg('clone-of', {
                    sprite: name
                });
                original = target.sprite.clones[0];
            }
            return {
                exists: true,
                originalId: original.id,
                name
            };
        }
        return {
            exists: false,
            original: null,
            name: msg('unknown-sprite')
        };
    };

    const createBlockLink = (targetInfo, blockId) => {
        const link = document.createElement('a');
        link.className = 'sa-debugger-log-link';

        const {exists, name, originalId} = targetInfo;
        link.textContent = name;
        if (exists) {
            // We use mousedown instead of click so that you can still go to blocks when logs are rapidly scrolling
            link.addEventListener('mousedown', () => {
                switchToSprite(originalId);
                activateCodeTab();
                goToBlock(blockId);
            });
        } else {
            link.classList.add('sa-debugger-log-link-unknown');
        }

        return link;
    };

    const switchToSprite = targetId => {
        if (targetId !== vm.editingTarget.id) {
            if (vm.runtime.getTargetById(targetId)) {
                vm.setEditingTarget(targetId);
            }
        }
    };

    const activateCodeTab = () => {
        const redux = addon.tab.redux;
        if (redux.state.scratchGui.editorTab.activeTabIndex !== 0) {
            redux.dispatch({
                type: 'scratch-gui/navigation/ACTIVATE_TAB',
                activeTabIndex: 0
            });
        }
    };

    const goToBlock = blockId => {
        const workspace = Blockly.getMainWorkspace();
        const block = workspace.getBlockById(blockId);
        if (!block) return;

        // Don't scroll to blocks in the flyout
        if (block.workspace.isFlyout) return;

        new Utils(addon).scrollBlockIntoView(blockId);
    };

    /**
   * @param {string} procedureCode
   * @returns {string}
   */
    const formatProcedureCode = procedureCode => {
        const customBlock = addon.tab.getCustomBlock(procedureCode);
        if (customBlock) {
            procedureCode = customBlock.displayName;
        }
        // May be slightly incorrect in some edge cases.
        return procedureCode.replace(/%[nbs]/g, '()');
    };

    // May be slightly incorrect in some edge cases.
    const formatBlocklyBlockData = jsonData => {
    // For sample jsonData, see:
    // https://github.com/scratchfoundation/scratch-blocks/blob/0bd1a17e66a779ec5d11f4a00c43784e3ac7a7b8/blocks_vertical/motion.js
    // https://github.com/scratchfoundation/scratch-blocks/blob/0bd1a17e66a779ec5d11f4a00c43784e3ac7a7b8/blocks_vertical/control.js

        const processSegment = index => {
            const message = jsonData[`message${index}`];
            const args = jsonData[`args${index}`];
            if (!message) {
                return null;
            }
            const parts = message.split(/%\d+/g);
            let formattedMessage = '';
            for (let i = 0; i < parts.length; i++) {
                formattedMessage += parts[i];
                const argInfo = args && args[i];
                if (argInfo) {
                    const type = argInfo.type;
                    if (type === 'field_vertical_separator') {
                        // no-op
                    } else if (type === 'field_image') {
                        const src = argInfo.src;
                        if (src.endsWith('rotate-left.svg')) {
                            formattedMessage += msg('/_general/blocks/anticlockwise');
                        } else if (src.endsWith('rotate-right.svg')) {
                            formattedMessage += msg('/_general/blocks/clockwise');
                        } else if (src.endsWith('green-flag.svg')) {
                            formattedMessage += msg('/_general/blocks/green-flag');
                        }
                    } else {
                        formattedMessage += '()';
                    }
                }
            }
            return formattedMessage;
        };

        const parts = [];
        let i = 0;
        // The jsonData doesn't directly tell us how many segments it has, so we have to
        // just keep looping until one doesn't exist.
        while (true) {
            const nextSegment = processSegment(i);
            if (nextSegment) {
                parts.push(nextSegment);
            } else {
                break;
            }
            i++;
        }
        return parts.join(' ');
    };

    const createBlockPreview = (targetId, blockId) => {
        const target = vm.runtime.getTargetById(targetId);
        if (!target) {
            return null;
        }

        const block = getBlock(target, blockId);
        if (!block || block.opcode === 'text') {
            return null;
        }

        let text;
        let category;
        let shape;
        let color;
        if (
            block.opcode === 'data_variable' ||
      block.opcode === 'data_listcontents' ||
      block.opcode === 'argument_reporter_string_number' ||
      block.opcode === 'argument_reporter_boolean'
        ) {
            text = Object.values(block.fields)[0].value;
            if (block.opcode === 'data_variable') {
                category = 'data';
            } else if (block.opcode === 'data_listcontents') {
                category = 'list';
            } else {
                category = 'more';
            }
            shape = 'round';
        } else if (block.opcode === 'procedures_call') {
            const proccode = block.mutation.proccode;
            text = formatProcedureCode(proccode);
            const customBlock = addon.tab.getCustomBlock(proccode);
            if (customBlock) {
                category = 'addon-custom-block';
            } else {
                category = 'more';
            }
        } else if (block.opcode === 'procedures_definition') {
            const prototypeBlockId = block.inputs.custom_block.block;
            const prototypeBlock = getBlock(target, prototypeBlockId);
            const proccode = prototypeBlock.mutation.proccode;
            text = ScratchBlocks.ScratchMsgs.translate('PROCEDURES_DEFINITION', 'define %1').replace(
                '%1',
                formatProcedureCode(proccode)
            );
            category = 'more';
        } else {
            // Try to call things like https://github.com/scratchfoundation/scratch-blocks/blob/0bd1a17e66a779ec5d11f4a00c43784e3ac7a7b8/blocks_vertical/operators.js#L36
            let jsonData;
            const fakeBlock = {
                jsonInit (data) {
                    jsonData = data;
                }
            };
            const blockConstructor = ScratchBlocks.Blocks[block.opcode];
            if (blockConstructor) {
                try {
                    blockConstructor.init.call(fakeBlock);
                } catch (e) {
                    // ignore
                }
            }
            if (!jsonData) {
                return null;
            }
            text = formatBlocklyBlockData(jsonData);
            if (!text) {
                return null;
            }
            category = jsonData?.extensions.includes('default_extension_colors') ? 'pen' : jsonData.category;
            const isStatement =
        (jsonData.extensions &&
          (jsonData.extensions.includes('shape_statement') ||
            jsonData.extensions.includes('shape_hat') ||
            jsonData.extensions.includes('shape_end'))) ||
        'previousStatement' in jsonData ||
        'nextStatement' in jsonData;
            shape = isStatement ? 'stacked' : 'round';
            color = jsonData.colour;
        }

        if (!text) {
            return null;
        }

        const element = document.createElement('span');
        element.className = 'sa-debugger-block-preview sa-block-color';
        element.textContent = text;
        element.dataset.shape = shape;

        const COLOR_CLASSES = [
            'motion',
            'looks',
            'sounds',
            'events',
            'control',
            'sensing',
            'operators',
            'data',
            'data-lists',
            'list',
            'more',
            'pen',
            'addon-custom-block'
        ];
        if (COLOR_CLASSES.includes(category)) {
            element.classList.add(`sa-block-color-${category}`);
        } else if (color) {
            element.style.setProperty('--sa-block-colored-background', color);
        }

        return element;
    };

    const api = {
        debug: {
            createHeaderButton,
            createHeaderTab,
            setHasUnreadMessage,
            addAfterStepCallback,
            getBlock,
            getTargetInfoById,
            createBlockLink,
            createBlockPreview
        },
        addon,
        msg,
        console
    };
    logsTab = await createLogsTab(api);
    const threadsTab = await createThreadsTab(api);
    const performanceTab = await createPerformanceTab(api);
    const memoryTab = await createMemoryTab(api);
    allTabs = [logsTab, threadsTab, performanceTab, memoryTab].filter(tab => tab && tab.tab && tab.tab.element);

    for (const message of messagesLoggedBeforeLogsTabLoaded) {
        logsTab.addLog(...message);
    }
    messagesLoggedBeforeLogsTabLoaded.length = 0;

    setActiveTab = tab => {
        if (tab === activeTab) return;
        const selectedClass = 'sa-debugger-tab-selected';
        if (activeTab) {
            activeTab.hide();
            activeTab.tab.element.classList.remove(selectedClass);
            activeTab.tab.element.setAttribute('aria-selected', 'false');
            activeTab.tab.element.setAttribute('tabindex', '-1');
        }
        tab.tab.element.classList.add(selectedClass);
        tab.tab.element.setAttribute('aria-selected', 'true');
        tab.tab.element.setAttribute('tabindex', '0');
        activeTab = tab;

        removeAllChildren(tabContentContainer);
        tabContentContainer.appendChild(tab.content);

        removeAllChildren(buttonContainerElement);
        buttonContainerElement.appendChild(unpauseButton.element);
        for (const button of tab.buttons) {
            buttonContainerElement.appendChild(button.element);
        }

        // Close button no longer needed here - removed for cleaner UX

        if (isInterfaceVisible) {
            activeTab.show();
        }
    };
    // Initialize the debugger window and interface now that all tabs are created
    createDebuggerWindow();

    // Now that tabs exist, mount them into the initially created window.
    mountDebuggerInterface();
  
    if (allTabs.length > 0) {
        setActiveTab(allTabs[0]);
    }

    addSmallStageClass();

    const ogGreenFlag = vm.runtime.greenFlag;
    vm.runtime.greenFlag = function (...args) {
        if (addon.settings.get('log_clear_greenflag')) {
            logsTab.clearLogs();
        }
        if (addon.settings.get('log_greenflag')) {
            logsTab.addLog(msg('log-msg-flag-clicked'), null, 'internal');
        }
        return ogGreenFlag.call(this, ...args);
    };

    // Restore VM overrides when the addon is disabled/unloaded.
    cleanupFunctions.push(() => {
        if (ogGreenFlag && vm && vm.runtime) {
            vm.runtime.greenFlag = ogGreenFlag;
        }
    });

    const ogMakeClone = vm.runtime.targets[0].constructor.prototype.makeClone;
    vm.runtime.targets[0].constructor.prototype.makeClone = function (...args) {
        if (addon.settings.get('log_failed_clone_creation') && !vm.runtime.clonesAvailable()) {
            logsTab.addLog(
                msg('log-msg-clone-cap', {sprite: this.getName()}),
                vm.runtime.sequencer.activeThread,
                'internal-warn'
            );
        }
        const clone = ogMakeClone.call(this, ...args);
        if (addon.settings.get('log_clone_create') && clone) {
            logsTab.addLog(
                msg('log-msg-clone-created', {sprite: this.getName()}),
                vm.runtime.sequencer.activeThread,
                'internal'
            );
        }
        return clone;
    };

    // Restore VM overrides when the addon is disabled/unloaded.
    cleanupFunctions.push(() => {
        if (ogMakeClone && vm && vm.runtime && vm.runtime.targets && vm.runtime.targets[0]) {
            vm.runtime.targets[0].constructor.prototype.makeClone = ogMakeClone;
        }
    });

    const ogStartHats = vm.runtime.startHats;
    vm.runtime.startHats = function (hat, optMatchFields, ...args) {
        if (addon.settings.get('log_broadcasts') && hat === 'event_whenbroadcastreceived') {
            logsTab.addLog(
                msg('log-msg-broadcasted', {broadcast: optMatchFields.BROADCAST_OPTION}),
                vm.runtime.sequencer.activeThread,
                'internal'
            );
        }
        return ogStartHats.call(this, hat, optMatchFields, ...args);
    };

    // Restore VM overrides when the addon is disabled/unloaded.
    cleanupFunctions.push(() => {
        if (ogStartHats && vm && vm.runtime) {
            vm.runtime.startHats = ogStartHats;
        }
    });

    // Add page unload cleanup to handle browser close/navigation
    const handlePageUnload = () => {
        performGlobalCleanup();
    };
  
    window.addEventListener('beforeunload', handlePageUnload);
  
    // Track page unload listener for cleanup
    cleanupFunctions.push(() => {
        window.removeEventListener('beforeunload', handlePageUnload);
    });

    // Global cleanup function for when addon is disabled or removed
    const performGlobalCleanup = () => {
        try {
            // Close debugger window
            if (debuggerWindow) {
                debuggerWindow.close();
                debuggerWindow = null;
            }
      
            // Reset interface state
            isInterfaceVisible = false;
      
            // Run all registered cleanup functions (VM event listeners, overrides, etc.)
            for (const cleanup of cleanupFunctions) {
                try {
                    cleanup();
                } catch (error) {
                    console.warn('Error during global debugger cleanup:', error);
                }
            }
            cleanupFunctions.length = 0;
      
            // Clear button state
            if (debuggerButtonContent) {
                debuggerButtonContent.classList.remove('sa-debugger-unread', 'sa-debugger-active');
            }
      
            console.log('Debugger addon cleanup completed successfully');
      
        } catch (error) {
            console.error('Error during global debugger cleanup:', error);
        }
    };

    while (true) {
        await addon.tab.waitForElement(
            '[class^="stage-header_stage-size-row"], [class^="stage-header_fullscreen-buttons-row_"]',
            {
                markAsSeen: true,
                reduxEvents: [
                    'scratch-gui/mode/SET_PLAYER',
                    'scratch-gui/mode/SET_FULL_SCREEN',
                    'fontsLoaded/SET_FONTS_LOADED',
                    'scratch-gui/locales/SELECT_LOCALE'
                ]
            }
        );
        if (addon.tab.editorMode === 'editor') {
            addon.tab.appendToSharedSpace({space: 'stageHeader', element: debuggerButtonOuter, order: 0});
        } else {
            debuggerButtonOuter.remove();
            setInterfaceVisible(false);
        }
    }
}
