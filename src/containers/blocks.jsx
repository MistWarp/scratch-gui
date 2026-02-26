import bindAll from 'lodash.bindall';
import debounce from 'lodash.debounce';
import defaultsDeep from 'lodash.defaultsdeep';
import makeToolboxXML from '../lib/make-toolbox-xml';
import PropTypes from 'prop-types';
import React from 'react';
import {intlShape, injectIntl, defineMessages} from 'react-intl';
import VMScratchBlocks from '../lib/blocks';
import VM from 'scratch-vm';

import log from '../lib/utils/log.js';
import Prompt from './prompt.jsx';
import BlocksComponent from '../components/blocks/blocks.jsx';
import extensionData from '../lib/libraries/extensions/index.jsx';
import CustomProcedures from './custom-procedures.jsx';
import errorBoundaryHOC from '../lib/components/error-boundary-hoc.jsx';
import {BLOCKS_DEFAULT_SCALE, STAGE_DISPLAY_SIZES} from '../lib/constants/layout-constants';
import DropAreaHOC from '../lib/components/drop-area-hoc.jsx';
import DragConstants from '../lib/constants/drag-constants';
import SettingsStore from '../addons/settings-store-singleton';
import defineDynamicBlock from '../lib/utils/define-dynamic-block';
import {Theme} from '../lib/themes';
import {injectExtensionBlockTheme, injectExtensionCategoryTheme} from '../lib/themes/blockHelpers';

import {connect} from 'react-redux';
import {updateToolbox} from '../reducers/toolbox';
import {activateColorPicker} from '../reducers/color-picker';
import {
    closeExtensionLibrary,
    openSoundRecorder,
    openConnectionModal,
    openCustomExtensionModal
} from '../reducers/modals';
import {activateCustomProcedures, deactivateCustomProcedures} from '../reducers/custom-procedures';
import {setConnectionModalExtensionId} from '../reducers/connection-modal';
import {updateMetrics} from '../reducers/workspace-metrics';
import {isTimeTravel2020} from '../reducers/time-travel';

import installSystemClipboardForBlocks from '../lib/mw/system-clipboard.js';

import {
    activateTab,
    SOUNDS_TAB_INDEX,
    BLOCKS_TAB_INDEX
} from '../reducers/editor-tab';
import AddonHooks from '../addons/hooks.js';
import LoadScratchBlocksHOC from '../lib/components/tw-load-scratch-blocks-hoc.jsx';
import {findTopBlock} from '../lib/backpack/code-payload.js';
import {gentlyRequestPersistentStorage} from '../lib/utils/storage-request.js';
import CollaborationService from '../lib/collaboration-service.js';

// TW: Strings we add to scratch-blocks are localized here
const messages = defineMessages({
    PROCEDURES_RETURN: {
        defaultMessage: 'return {v}',
        // eslint-disable-next-line max-len
        description: 'The name of the "return" block from the Custom Reporters extension. {v} is replaced with a slot to insert a value.',
        id: 'tw.blocks.PROCEDURES_RETURN'
    },
    PROCEDURES_TO_REPORTER: {
        defaultMessage: 'Change To Reporter',
        // eslint-disable-next-line max-len
        description: 'Context menu item to change a command-shaped custom block into a reporter. Part of the Custom Reporters extension.',
        id: 'tw.blocks.PROCEDURES_TO_REPORTER'
    },
    PROCEDURES_TO_STATEMENT: {
        defaultMessage: 'Change To Statement',
        // eslint-disable-next-line max-len
        description: 'Context menu item to change a reporter-shaped custom block into a statement/command. Part of the Custom Reporters extension.',
        id: 'tw.blocks.PROCEDURES_TO_STATEMENT'
    },
    PROCEDURES_DOCS: {
        defaultMessage: 'How to use return',
        // eslint-disable-next-line max-len
        description: 'Button in extension list to learn how to use the "return" block from the Custom Reporters extension.',
        id: 'tw.blocks.PROCEDURES_DOCS'
    }
});

const addFunctionListener = (object, property, callback) => {
    const oldFn = object[property];
    object[property] = function (...args) {
        const result = oldFn.apply(this, args);
        callback.apply(this, result);
        return result;
    };
};

const DroppableBlocks = DropAreaHOC([
    DragConstants.BACKPACK_CODE
])(BlocksComponent);

class Blocks extends React.Component {
    constructor (props) {
        super(props);
        this.ScratchBlocks = VMScratchBlocks(props.vm, false);

        window.ScratchBlocks = this.ScratchBlocks;
        AddonHooks.blockly = this.ScratchBlocks;
        AddonHooks.blocklyCallbacks.forEach(i => i());
        AddonHooks.blocklyCallbacks.length = [];

        installSystemClipboardForBlocks(this.ScratchBlocks, props.vm);

        bindAll(this, [
            'attachVM',
            'detachVM',
            'getToolboxXML',
            'handleCategorySelected',
            'handleConnectionModalStart',
            'handleDrop',
            'handleExtensionsChanged',
            'handleStatusButtonUpdate',
            'handleOpenSoundRecorder',
            'handlePromptStart',
            'handlePromptCallback',
            'handlePromptClose',
            'handleCustomProceduresClose',
            'onScriptGlowOn',
            'onScriptGlowOff',
            'onBlockGlowOn',
            'onBlockGlowOff',
            'handleMonitorsUpdate',
            'handleExtensionAdded',
            'handleBlocksInfoUpdate',
            'onTargetsUpdate',
            'onVisualReport',
            'onWorkspaceUpdate',
            'onWorkspaceMetricsChange',
            'setBlocks',
            'setLocale',
            'handleEnableProcedureReturns'
        ]);
        this.ScratchBlocks.prompt = this.handlePromptStart;
        this.ScratchBlocks.statusButtonCallback = this.handleConnectionModalStart;
        this.ScratchBlocks.recordSoundCallback = this.handleOpenSoundRecorder;

        this.handlePaletteResizePointerDown = this.handlePaletteResizePointerDown.bind(this);
        this.handlePaletteResizePointerMove = this.handlePaletteResizePointerMove.bind(this);
        this.handlePaletteResizePointerUp = this.handlePaletteResizePointerUp.bind(this);
        this.setFlyoutWidth = this.setFlyoutWidth.bind(this);

        this.handleAddonSettingChanged = this.handleAddonSettingChanged.bind(this);
        this.applyPaletteResizeEnabledState = this.applyPaletteResizeEnabledState.bind(this);
        this.updateBlockColors = this.updateBlockColors.bind(this);

        this.handlePaletteHoverEnter = this.handlePaletteHoverEnter.bind(this);
        this.handlePaletteHoverLeave = this.handlePaletteHoverLeave.bind(this);
        this.attachPaletteHoverListeners = this.attachPaletteHoverListeners.bind(this);
        this.detachPaletteHoverListeners = this.detachPaletteHoverListeners.bind(this);

        this.state = {
            prompt: null,
            flyoutWidth: null,
            paletteResizeEnabled: !SettingsStore.getAddonEnabled('hide-flyout')
        };

        this.paletteResizeSession = null;
        this.paletteResizeRaf = null;

        this.paletteHoverCount = 0;
        this._paletteHoverEls = null;
        this.onTargetsUpdate = debounce(this.onTargetsUpdate, 100);
        this.onWorkspaceMetricsChange = debounce(this.onWorkspaceMetricsChange, 100);
        this.toolboxUpdateQueue = [];
    }
    componentDidMount () {
        SettingsStore.addEventListener('setting-changed', this.handleAddonSettingChanged);

        this.ScratchBlocks = VMScratchBlocks(this.props.vm, this.props.useCatBlocks);
        this.ScratchBlocks.prompt = this.handlePromptStart;
        this.ScratchBlocks.statusButtonCallback = this.handleConnectionModalStart;
        this.ScratchBlocks.recordSoundCallback = this.handleOpenSoundRecorder;

        installSystemClipboardForBlocks(this.ScratchBlocks, this.props.vm);

        this.ScratchBlocks.FieldColourSlider.activateEyedropper_ = this.props.onActivateColorPicker;
        this.ScratchBlocks.Procedures.externalProcedureDefCallback = this.props.onActivateCustomProcedures;
        this.ScratchBlocks.ScratchMsgs.setLocale(this.props.locale);

        const Msg = this.ScratchBlocks.Msg;
        Msg.PROCEDURES_RETURN = this.props.intl.formatMessage(messages.PROCEDURES_RETURN, {
            v: '%1'
        });
        Msg.PROCEDURES_TO_REPORTER = this.props.intl.formatMessage(messages.PROCEDURES_TO_REPORTER);
        Msg.PROCEDURES_TO_STATEMENT = this.props.intl.formatMessage(messages.PROCEDURES_TO_STATEMENT);
        Msg.PROCEDURES_DOCS = this.props.intl.formatMessage(messages.PROCEDURES_DOCS);

        const workspaceConfig = defaultsDeep({},
            this.props.options,
            {
                rtl: this.props.isRtl,
                toolbox: this.props.toolboxXML,
                colours: this.props.theme.getBlockColors(),
                grid: {
                    colour: this.props.theme.getBlockColors().gridColor
                },
                maxInstances: {
                    test: 10
                },
                oneBasedIndex: true,
                comments: true,
                sounds: SettingsStore.getAddonEnabled('editor-sounds')
            },
            Blocks.defaultOptions
        );
        
        const startTime = performance.now();
        this.workspace = this.ScratchBlocks.inject(this.blocks, workspaceConfig);
        const injectTime = performance.now() - startTime;
        console.log(`🧩 Blocks workspace injected in ${injectTime.toFixed(2)}ms`);
        AddonHooks.blocklyWorkspace = this.workspace;

        // Register buttons under new callback keys for creating variables,
        // lists, and procedures from extensions.

        const toolboxWorkspace = this.workspace.getFlyout().getWorkspace();

        try {
            const initialFlyoutWidth = this.workspace.getFlyout().getWidth();
            if (typeof initialFlyoutWidth === 'number' && Number.isFinite(initialFlyoutWidth)) {
                if (this.state.paletteResizeEnabled) {
                    this.setFlyoutWidth(initialFlyoutWidth);
                }
            }
        } catch (e) {
            // Ignore; resizing will be unavailable if flyout/toolbox APIs differ.
        }

        const varListButtonCallback = type =>
            (() => this.ScratchBlocks.Variables.createVariable(this.workspace, null, type));
        const procButtonCallback = () => {
            this.ScratchBlocks.Procedures.createProcedureDefCallback_(this.workspace);
        };

        toolboxWorkspace.registerButtonCallback('MAKE_A_VARIABLE', varListButtonCallback(''));
        toolboxWorkspace.registerButtonCallback('MAKE_A_LIST', varListButtonCallback('list'));
        toolboxWorkspace.registerButtonCallback('MAKE_A_PROCEDURE', procButtonCallback);
        toolboxWorkspace.registerButtonCallback('EXTENSION_CALLBACK', block => {
            this.props.vm.handleExtensionButtonPress(block.callbackData_);
        });
        toolboxWorkspace.registerButtonCallback('OPEN_EXTENSION_DOCS', block => {
            const docsURI = block.callbackData_;
            const url = new URL(docsURI);
            if (url.protocol === 'http:' || url.protocol === 'https:') {
                window.open(docsURI, '_blank');
            }
        });

        // Store the xml of the toolbox that is actually rendered.
        // This is used in componentDidUpdate instead of prevProps, because
        // the xml can change while e.g. on the costumes tab.
        this._renderedToolboxXML = this.props.toolboxXML;

        // we actually never want the workspace to enable "refresh toolbox" - this basically re-renders the
        // entire toolbox every time we reset the workspace.  We call updateToolbox as a part of
        // componentDidUpdate so the toolbox will still correctly be updated
        this.setToolboxRefreshEnabled = this.workspace.setToolboxRefreshEnabled.bind(this.workspace);
        this.workspace.setToolboxRefreshEnabled = () => {
            this.setToolboxRefreshEnabled(false);
        };

        // @todo change this when blockly supports UI events
        addFunctionListener(this.workspace, 'translate', this.onWorkspaceMetricsChange);
        addFunctionListener(this.workspace, 'zoom', this.onWorkspaceMetricsChange);

        this.props.vm.setCompilerOptions({
            warpTimer: true
        });

        this.attachVM();
        // Only update blocks/vm locale when visible to avoid sizing issues
        // If locale changes while not visible it will get handled in didUpdate
        if (this.props.isVisible) {
            this.setLocale();
        }

        // Attach collaboration service to workspace if connected
        const collaborationService = CollaborationService.getInstance();
        if (collaborationService.isConnected) {
            collaborationService.attachToWorkspace(this.workspace);
        }

        // tw: Handle when extensions are added when Blocks isn't mounted
        for (const category of this.props.vm.runtime._blockInfo) {
            this.handleExtensionAdded(category);
        }

        gentlyRequestPersistentStorage();

        // Defer attaching hover listeners until ScratchBlocks has finished injecting its DOM.
        setTimeout(() => {
            if (!this.unmounted) this.attachPaletteHoverListeners();
        }, 0);
    }
    shouldComponentUpdate (nextProps, nextState) {
        return (
            this.state.prompt !== nextState.prompt ||
            this.state.flyoutWidth !== nextState.flyoutWidth ||
            this.state.paletteResizeEnabled !== nextState.paletteResizeEnabled ||
            this.props.isVisible !== nextProps.isVisible ||
            this._renderedToolboxXML !== nextProps.toolboxXML ||
            this.props.extensionLibraryVisible !== nextProps.extensionLibraryVisible ||
            this.props.customProceduresVisible !== nextProps.customProceduresVisible ||
            this.props.locale !== nextProps.locale ||
            this.props.anyModalVisible !== nextProps.anyModalVisible ||
            this.props.stageSize !== nextProps.stageSize ||
            this.props.customStageSize !== nextProps.customStageSize ||
            this.props.theme !== nextProps.theme
        );
    }
    componentDidUpdate (prevProps) {
        // Update block colors when theme changes (check properties, not just reference)
        const prevTheme = prevProps.theme;
        const currentTheme = this.props.theme;
        const themeChanged = !prevTheme ||
            !currentTheme ||
            prevTheme.id !== currentTheme.id ||
            prevTheme.accent !== currentTheme.accent ||
            prevTheme.gui !== currentTheme.gui ||
            prevTheme.blocks !== currentTheme.blocks ||
            prevTheme.menuBarAlign !== currentTheme.menuBarAlign ||
            prevTheme.iconPack !== currentTheme.iconPack ||
            prevTheme.name !== currentTheme.name;

        if (themeChanged) {
            this.updateBlockColors(currentTheme);
        }

        // If any modals are open, call hideChaff to close z-indexed field editors
        if (this.props.anyModalVisible && !prevProps.anyModalVisible) {
            this.ScratchBlocks.hideChaff();
        }

        // Only rerender the toolbox when the blocks are visible and the xml is
        // different from the previously rendered toolbox xml.
        // Do not check against prevProps.toolboxXML because that may not have been rendered.
        if (this.props.isVisible && this.props.toolboxXML !== this._renderedToolboxXML) {
            this.requestToolboxUpdate();
        }

        if (this.props.isVisible === prevProps.isVisible) {
            if (
                this.props.stageSize !== prevProps.stageSize ||
                this.props.customStageSize !== prevProps.customStageSize
            ) {
                // force workspace to redraw for the new stage size
                window.dispatchEvent(new Event('resize'));
            }
            return;
        }
        // @todo hack to resize blockly manually in case resize happened while hidden
        // @todo hack to reload the workspace due to gui bug #413
        if (this.props.isVisible) { // Scripts tab
            // Set workspace visibility with performance optimization
            if (this.workspace) {
                this.workspace.setVisible(true);

                // Check for pending procedure returns request
                if (this.props.vm && this.props.vm._pendingProcedureReturns) {
                    console.log('Blocks: Detected pending procedure returns request, enabling...');
                    this.props.vm._pendingProcedureReturns = false;

                    // Enable procedure returns after workspace is ready
                    setTimeout(() => {
                        this.handleEnableProcedureReturns();

                        // Also handle pending category selection
                        if (this.props.vm._pendingCategorySelection) {
                            const categoryId = this.props.vm._pendingCategorySelection;
                            this.props.vm._pendingCategorySelection = null;
                            console.log('Blocks: Selecting pending category:', categoryId);
                            this.handleCategorySelected(categoryId);
                        }
                    }, 100);
                }
                
                // Defer expensive operations to next tick
                setTimeout(() => {
                    if (this.workspace) {
                        this.workspace.resize();
                    }
                }, 0);
            }
            if (prevProps.locale !== this.props.locale || this.props.locale !== this.props.vm.getLocale()) {
                // call setLocale if the locale has changed, or changed while the blocks were hidden.
                // vm.getLocale() will be out of sync if locale was changed while not visible
                this.setLocale();
            } else {
                // Defer workspace refresh to next tick for better performance
                setTimeout(() => {
                    if (this.workspace && !this.unmounted) {
                        this.workspace.refreshToolboxSelection_();
                        this.workspace.resize();
                    }
                }, 0);
            }

            window.dispatchEvent(new Event('resize'));
        } else {
            this.workspace.setVisible(false);
        }
    }
    componentWillUnmount () {
        SettingsStore.removeEventListener('setting-changed', this.handleAddonSettingChanged);
        this.detachPaletteHoverListeners();
        this.detachVM();
        this.unmounted = true;
        this.workspace.dispose();
        clearTimeout(this.toolboxUpdateTimeout);

        // Cancel any pending debounced calls
        this.onTargetsUpdate.cancel();
        this.onWorkspaceMetricsChange.cancel();

        // Clear the flyout blocks so that they can be recreated on mount.
        this.props.vm.clearFlyoutBlocks();

        // Detach collaboration service from workspace
        const collaborationService = CollaborationService.getInstance();
        collaborationService.detachFromWorkspace();

        AddonHooks.blocklyWorkspace = null;
    }

    attachPaletteHoverListeners () {
        if (!this.blocks) return;
        if (!this.workspace || !this.workspace.getFlyout) return;

        // toolbox div and flyout svg are siblings inside the injection container.
        const toolboxDiv = this.blocks.querySelector('.blocklyToolboxDiv');
        const flyoutSvgGroup = this.blocks.querySelector('.blocklyFlyout');
        const els = [toolboxDiv, flyoutSvgGroup].filter(Boolean);
        if (els.length === 0) return;

        // Avoid double-binding.
        if (this._paletteHoverEls) return;

        for (const el of els) {
            el.addEventListener('mouseenter', this.handlePaletteHoverEnter);
            el.addEventListener('mouseleave', this.handlePaletteHoverLeave);
        }
        this._paletteHoverEls = els;

        try {
            const flyout = this.workspace && this.workspace.getFlyout && this.workspace.getFlyout();
            if (flyout && typeof flyout.twSetClippingEnabled === 'function') {
                flyout.twSetClippingEnabled(true);
            }
        } catch (e) {
            // ignore
        }
    }

    detachPaletteHoverListeners () {
        if (!this._paletteHoverEls) return;
        for (const el of this._paletteHoverEls) {
            el.removeEventListener('mouseenter', this.handlePaletteHoverEnter);
            el.removeEventListener('mouseleave', this.handlePaletteHoverLeave);
        }
        this._paletteHoverEls = null;
        this.paletteHoverCount = 0;
        // Default to no clipping when not hovered.
        try {
            const flyout = this.workspace && this.workspace.getFlyout && this.workspace.getFlyout();
            if (flyout && typeof flyout.twSetClippingEnabled === 'function') {
                flyout.twSetClippingEnabled(true);
            }
        } catch (e) {
            // ignore
        }
    }

    handlePaletteHoverEnter () {
        this.paletteHoverCount += 1;
        try {
            const flyout = this.workspace && this.workspace.getFlyout && this.workspace.getFlyout();
            if (flyout && typeof flyout.twSetClippingEnabled === 'function') {
                flyout.twSetClippingEnabled(false);
            }
        } catch (e) {
            // ignore
        }
    }

    handlePaletteHoverLeave () {
        this.paletteHoverCount = Math.max(0, this.paletteHoverCount - 1);
        if (this.paletteHoverCount !== 0) return;
        try {
            const flyout = this.workspace && this.workspace.getFlyout && this.workspace.getFlyout();
            if (flyout && typeof flyout.twSetClippingEnabled === 'function') {
                flyout.twSetClippingEnabled(true);
            }
        } catch (e) {
            // ignore
        }
    }

    setFlyoutWidth (flyoutWidth) {
        if (!this.workspace || !this.workspace.getFlyout || !this.workspace.getToolbox) return;
        if (!this.state.paletteResizeEnabled) return;
        if (!(typeof flyoutWidth === 'number' && Number.isFinite(flyoutWidth))) return;

        const flyout = this.workspace.getFlyout();
        const toolbox = this.workspace.getToolbox && this.workspace.getToolbox();
        if (!flyout || !toolbox) return;

        if (typeof flyout.setWidth === 'function') {
            flyout.setWidth(flyoutWidth);
        }
        if (typeof toolbox.setFlyoutWidth === 'function') {
            toolbox.setFlyoutWidth(flyoutWidth);
        }

        if (this.blocks && this.blocks.style && typeof this.blocks.style.setProperty === 'function') {
            this.blocks.style.setProperty('--blocks-palette-width', `${60 + flyoutWidth}px`);
        }

        if (this.state.flyoutWidth !== flyoutWidth) {
            this.setState({flyoutWidth});
        }
        // Recompute Blockly layout.
        this.workspace.resize();
    }

    handlePaletteResizePointerDown (e) {
        if (!this.workspace || !this.workspace.getFlyout || !this.workspace.getToolbox) return;
        if (!this.state.paletteResizeEnabled) return;
        if (typeof e.button !== 'undefined' && e.button !== 0) return;
        e.preventDefault();

        // Capture the pointer so we keep receiving move events even if the cursor
        // leaves the handle.
        if (e.currentTarget &&
            typeof e.currentTarget.setPointerCapture === 'function' &&
            typeof e.pointerId === 'number') {
            try {
                e.currentTarget.setPointerCapture(e.pointerId);
            } catch (err) {
                // Ignore; capture is best-effort.
            }
        }

        const container = this.blocks;
        if (!container || !container.getBoundingClientRect) return;

        const flyout = this.workspace.getFlyout();
        const toolbox = this.workspace.getToolbox && this.workspace.getToolbox();
        if (!flyout || !toolbox) return;

        const startFlyoutWidth = flyout.getWidth();
        const rect = container.getBoundingClientRect();

        // In ScratchBlocks this.toolboxPosition exists on the workspace.
        const TOOLBOX_AT_RIGHT = this.ScratchBlocks && this.ScratchBlocks.TOOLBOX_AT_RIGHT;
        const toolboxAtRight = TOOLBOX_AT_RIGHT ? (this.workspace.options.toolboxPosition === TOOLBOX_AT_RIGHT) : false;

        this.paletteResizeSession = {
            startClientX: e.clientX,
            startFlyoutWidth,
            containerLeft: rect.left,
            containerRight: rect.right,
            containerWidth: rect.width,
            toolboxAtRight
        };

        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';

        const isPointerEvent = typeof e.type === 'string' && e.type.startsWith('pointer');
        if (isPointerEvent) {
            window.addEventListener('pointermove', this.handlePaletteResizePointerMove);
            window.addEventListener('pointerup', this.handlePaletteResizePointerUp);
            window.addEventListener('pointercancel', this.handlePaletteResizePointerUp);
        } else {
            window.addEventListener('mousemove', this.handlePaletteResizePointerMove);
            window.addEventListener('mouseup', this.handlePaletteResizePointerUp);
        }
    }

    handlePaletteResizePointerMove (e) {
        if (!this.paletteResizeSession) return;
        if (!this.state.paletteResizeEnabled) return;
        const {
            startFlyoutWidth,
            containerLeft,
            containerRight,
            containerWidth,
            toolboxAtRight
        } = this.paletteResizeSession;

        const CATEGORY_MENU_WIDTH = 60;
        const MIN_WORKSPACE_WIDTH = 200;
        const MIN_FLYOUT_WIDTH = 160;
        const maxFlyoutWidth = Math.max(
            MIN_FLYOUT_WIDTH,
            Math.floor(containerWidth - CATEGORY_MENU_WIDTH - MIN_WORKSPACE_WIDTH)
        );

        let nextPaletteWidth;
        if (toolboxAtRight) {
            nextPaletteWidth = Math.round(containerRight - e.clientX);
        } else {
            nextPaletteWidth = Math.round(e.clientX - containerLeft);
        }

        let nextFlyoutWidth = nextPaletteWidth - CATEGORY_MENU_WIDTH;
        nextFlyoutWidth = Math.max(
            MIN_FLYOUT_WIDTH,
            Math.min(maxFlyoutWidth, nextFlyoutWidth)
        );

        // Avoid excessive reflows.
        if (this.paletteResizeRaf) return;
        this.paletteResizeRaf = window.requestAnimationFrame(() => {
            this.paletteResizeRaf = null;
            // If something changed mid-drag (e.g. window resized), fall back to incremental changes.
            if (!Number.isFinite(nextFlyoutWidth)) return;
            if (Math.round(nextFlyoutWidth) !== Math.round(startFlyoutWidth)) {
                this.setFlyoutWidth(nextFlyoutWidth);
            }
        });
    }

    handlePaletteResizePointerUp () {
        this.paletteResizeSession = null;
        if (this.paletteResizeRaf) {
            window.cancelAnimationFrame(this.paletteResizeRaf);
            this.paletteResizeRaf = null;
        }
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        window.removeEventListener('pointermove', this.handlePaletteResizePointerMove);
        window.removeEventListener('pointerup', this.handlePaletteResizePointerUp);
        window.removeEventListener('pointercancel', this.handlePaletteResizePointerUp);
        window.removeEventListener('mousemove', this.handlePaletteResizePointerMove);
        window.removeEventListener('mouseup', this.handlePaletteResizePointerUp);
    }

    handleAddonSettingChanged (e) {
        const detail = e && e.detail;
        if (!detail) return;
        if (detail.addonId !== 'hide-flyout') return;
        if (detail.settingId !== 'enabled') return;

        const nextPaletteResizeEnabled = !SettingsStore.getAddonEnabled('hide-flyout');
        if (this.state.paletteResizeEnabled === nextPaletteResizeEnabled) return;

        this.setState({
            paletteResizeEnabled: nextPaletteResizeEnabled
        }, () => {
            this.applyPaletteResizeEnabledState(nextPaletteResizeEnabled);
        });
    }

    applyPaletteResizeEnabledState (paletteResizeEnabled) {
        if (!this.workspace || !this.workspace.getFlyout || !this.workspace.getToolbox) return;

        // Stop any active drag session immediately.
        this.handlePaletteResizePointerUp();

        const flyout = this.workspace.getFlyout();
        const toolbox = this.workspace.getToolbox && this.workspace.getToolbox();
        if (!flyout || !toolbox) return;

        const CATEGORY_MENU_WIDTH = 60;

        if (paletteResizeEnabled) {
            // Re-sync the current (default) flyout width into our override system.
            const currentWidth = flyout.getWidth();
            if (typeof currentWidth === 'number' && Number.isFinite(currentWidth)) {
                this.setFlyoutWidth(currentWidth);
            }
        } else {
            // Clear width overrides so the auto-hiding palette addon can control layout.
            if (typeof flyout.setWidth === 'function') {
                flyout.setWidth(null);
            }

            const flyoutWidth = flyout.getWidth();
            if (typeof flyoutWidth === 'number' && Number.isFinite(flyoutWidth)) {
                toolbox.width = CATEGORY_MENU_WIDTH + flyoutWidth;
            }

            if (this.blocks && this.blocks.style) {
                this.blocks.style.removeProperty('--blocks-palette-width');
            }

            if (this.state.flyoutWidth !== null) {
                this.setState({flyoutWidth: null});
            }

            this.workspace.resize();
        }
    }
    requestToolboxUpdate () {
        clearTimeout(this.toolboxUpdateTimeout);
        this.toolboxUpdateTimeout = setTimeout(() => {
            this.updateToolbox();
        }, 0);
    }
    setLocale () {
        this.ScratchBlocks.ScratchMsgs.setLocale(this.props.locale);
        this.props.vm.setLocale(this.props.locale, this.props.messages)
            .then(() => {
                if (this.unmounted) return;
                this.workspace.getFlyout().setRecyclingEnabled(false);
                this.props.vm.refreshWorkspace();
                this.requestToolboxUpdate();
                this.withToolboxUpdates(() => {
                    this.workspace.getFlyout().setRecyclingEnabled(true);
                });
            });
    }

    updateBlockColors (theme) {
        if (!this.workspace || !this.ScratchBlocks) return;

        const newColors = theme.getBlockColors();

        try {
            // Try to override the ScratchBlocks color definitions
            if (this.ScratchBlocks.Colours && this.ScratchBlocks.Colours.overrideColours) {
                this.ScratchBlocks.Colours.overrideColours(newColors);
            }

            // Update flyout background constant (Blockly sets this, not CSS)
            const flyout = this.workspace.getFlyout && this.workspace.getFlyout();
            if (flyout && newColors.flyout && typeof flyout.setBackgroundColour_ === 'function') {
                flyout.setBackgroundColour_(newColors.flyout);
            }

            // Force update of all cached color lookups
            if (this.ScratchBlocks.workspace && this.ScratchBlocks.workspace.Workspace) {
                // Force Blockly to recalculate theme colors
                if (this.workspace.getAllBlocks) {
                    const blocks = this.workspace.getAllBlocks();
                    blocks.forEach(block => {
                        if (block.updateColour) {
                            block.updateColour();
                        }
                    });
                }
            }

            // Update workspace-specific colors directly if available
            const workspace = this.workspace;
            if (workspace) {
                // Update workspace background
                const blocksSvg = this.blocks && this.blocks.querySelector('svg.blocklySvg');
                if (blocksSvg && newColors.workspace) {
                    blocksSvg.style.backgroundColor = newColors.workspace;
                }

                // Update grid color if available
                if (newColors.gridColor && workspace.grid_ && workspace.grid_.pattern) {
                    workspace.grid_.pattern.setAttribute('fill', newColors.gridColor);
                }

                // Update scrollbar colors if available
                if (workspace.scrollbar) {
                    const scrollbar = workspace.scrollbar;
                    if (scrollbar.vScroll && scrollbar.vScroll.outerSvg_) {
                        const vSvg = scrollbar.vScroll.outerSvg_;
                        if (vSvg && newColors.scrollbar) {
                            vSvg.style.fill = newColors.scrollbar;
                        }
                    }
                    if (scrollbar.hScroll && scrollbar.hScroll.outerSvg_) {
                        const hSvg = scrollbar.hScroll.outerSvg_;
                        if (hSvg && newColors.scrollbar) {
                            hSvg.style.fill = newColors.scrollbar;
                        }
                    }
                }
            }

            // Update flyout background element (the path element ScratchBlocks creates)
            if (newColors.flyout) {
                const flyoutBackground = document.querySelector('svg.blocklyFlyout > path.blocklyFlyoutBackground, svg.blocklyFlyout > rect.blocklyFlyoutBackground');
                if (flyoutBackground) {
                    flyoutBackground.setAttribute('fill', newColors.flyout);
                }
                // Also update the SVG background
                const flyoutSvg = document.querySelector('svg.blocklyFlyout');
                if (flyoutSvg) {
                    flyoutSvg.style.backgroundColor = newColors.flyout;
                }
            }

            // Update toolbox/palette background element
            if (newColors.toolbox) {
                const toolboxBackground = document.querySelector('svg.blocklyToolbox > path.blocklyToolboxBackground');
                if (toolboxBackground) {
                    toolboxBackground.setAttribute('fill', newColors.toolbox);
                }
                const toolboxSvg = document.querySelector('svg.blocklyToolbox');
                if (toolboxSvg) {
                    toolboxSvg.style.backgroundColor = newColors.toolbox;
                }
            }

            // Update toolbox text colors
            if (newColors.toolboxText || newColors.flyoutLabelColor) {
                const textColor = newColors.toolboxText || newColors.flyoutLabelColor;
                const labels = document.querySelectorAll('.blocklyTreeLabel, .blocklyFlyoutLabelText');
                labels.forEach(label => {
                    label.style.fill = textColor;
                });
            }

            // Update separator lines in toolbox
            if (newColors.toolboxText) {
                const separators = document.querySelectorAll('.blocklyTreeSeparator');
                separators.forEach(separator => {
                    separator.style.borderColor = newColors.toolboxText;
                });
            }

            // Update category icons in toolbox
            const categoryIcons = document.querySelectorAll('.blocklyTreeIcon');
            categoryIcons.forEach(icon => {
                const parentRow = icon.closest('.blocklyTreeRow');
                if (parentRow && newColors.toolboxText) {
                    const label = parentRow.querySelector('.blocklyTreeLabel');
                    if (label) {
                        const categoryType = label.getAttribute('data-category');
                        // Get the color for this category
                        let categoryColor;
                        try {
                            categoryColor = this.ScratchBlocks.Colours.categoryTypeToColorMap[categoryType];
                            if (categoryColor) {
                                icon.style.backgroundColor = categoryColor.colorPrimary;
                            }
                        } catch (e) {
                            // Ignore errors getting category colors
                        }
                    }
                }
            });

            if (this.workspace.getFlyout && this.workspace.setVisible) {
                this.workspace.setVisible(false);
                this.workspace.setVisible(this.props.isVisible);
            }

            this.requestToolboxUpdate();

            setTimeout(() => {
                if (this.workspace && !this.unmounted) {
                    this.workspace.refreshToolboxSelection_();
                    if (typeof this.workspace.markDraggedBlockAsDirty === 'function') {
                        this.workspace.markDraggedBlockAsDirty();
                    }

                    // Update toolbox and flyout elements again after they re-render
                    if (newColors.toolbox) {
                        const toolboxSvg = document.querySelector('svg.blocklyToolbox');
                        const toolboxBackground = document.querySelector('svg.blocklyToolbox > path.blocklyToolboxBackground');
                        if (toolboxSvg) {
                            toolboxSvg.style.setProperty('background-color', newColors.toolbox, 'important');
                        }
                        if (toolboxBackground) {
                            toolboxBackground.setAttribute('fill', newColors.toolbox);
                        }
                    }
                    if (newColors.flyout) {
                        const flyoutSvg = document.querySelector('svg.blocklyFlyout');
                        const flyoutBackground = document.querySelector('svg.blocklyFlyout > rect.blocklyFlyoutBackground, svg.blocklyFlyout > path.blocklyFlyoutBackground');
                        if (flyoutSvg) {
                            flyoutSvg.style.setProperty('background-color', newColors.flyout, 'important');
                        }
                        if (flyoutBackground) {
                            flyoutBackground.setAttribute('fill', newColors.flyout);
                        }
                    }
                    if (newColors.toolboxText || newColors.flyoutLabelColor) {
                        const textColor = newColors.toolboxText || newColors.flyoutLabelColor;
                        const labels = document.querySelectorAll('.blocklyTreeLabel, .blocklyFlyoutLabelText');
                        labels.forEach(label => {
                            label.style.setProperty('fill', textColor, 'important');
                        });
                    }
                    if (newColors.scrollbar) {
                        const scrollbarElements = document.querySelectorAll('.blocklyScrollbarBackground, .blocklyScrollbarThumb');
                        scrollbarElements.forEach(el => {
                            el.style.setProperty('fill', newColors.scrollbar, 'important');
                        });
                    }
                }
            }, 100);

            // Additional retry to ensure colors stick after all re-renders
            setTimeout(() => {
                if (this.workspace && !this.unmounted) {
                    if (newColors.toolbox) {
                        const toolboxSvg = document.querySelector('svg.blocklyToolbox');
                        const toolboxBackground = document.querySelector('svg.blocklyToolbox > path.blocklyToolboxBackground');
                        if (toolboxSvg) {
                            toolboxSvg.style.setProperty('background-color', newColors.toolbox, 'important');
                        }
                        if (toolboxBackground) {
                            toolboxBackground.setAttribute('fill', newColors.toolbox);
                        }
                    }
                    if (newColors.flyout) {
                        const flyoutSvg = document.querySelector('svg.blocklyFlyout');
                        const flyoutBackground = document.querySelector('svg.blocklyFlyout > rect.blocklyFlyoutBackground, svg.blocklyFlyout > path.blocklyFlyoutBackground');
                        if (flyoutSvg) {
                            flyoutSvg.style.setProperty('background-color', newColors.flyout, 'important');
                        }
                        if (flyoutBackground) {
                            flyoutBackground.setAttribute('fill', newColors.flyout);
                        }
                    }
                }
            }, 300);
        } catch (e) {
            console.error('Error updating block colors:', e);
        }
    }

    updateToolbox () {
        this.toolboxUpdateTimeout = false;

        const categoryId = this.workspace.toolbox_.getSelectedCategoryId();
        const offset = this.workspace.toolbox_.getCategoryScrollOffset();
        this.workspace.updateToolbox(this.props.toolboxXML);
        this._renderedToolboxXML = this.props.toolboxXML;

        // In order to catch any changes that mutate the toolbox during "normal runtime"
        // (variable changes/etc), re-enable toolbox refresh.
        // Using the setter function will rerender the entire toolbox which we just rendered.
        this.workspace.toolboxRefreshEnabled_ = true;

        const currentCategoryPos = this.workspace.toolbox_.getCategoryPositionById(categoryId);
        const currentCategoryLen = this.workspace.toolbox_.getCategoryLengthById(categoryId);
        if (offset < currentCategoryLen) {
            this.workspace.toolbox_.setFlyoutScrollPos(currentCategoryPos + offset);
        } else {
            this.workspace.toolbox_.setFlyoutScrollPos(currentCategoryPos);
        }

        const queue = this.toolboxUpdateQueue;
        this.toolboxUpdateQueue = [];
        queue.forEach(fn => fn());
    }

    withToolboxUpdates (fn) {
        // if there is a queued toolbox update, we need to wait
        if (this.toolboxUpdateTimeout) {
            this.toolboxUpdateQueue.push(fn);
        } else {
            fn();
        }
    }

    attachVM () {
        this.workspace.addChangeListener(this.props.vm.blockListener);
        this.flyoutWorkspace = this.workspace
            .getFlyout()
            .getWorkspace();
        this.flyoutWorkspace.addChangeListener(this.props.vm.flyoutBlockListener);
        this.flyoutWorkspace.addChangeListener(this.props.vm.monitorBlockListener);
        this.props.vm.addListener('SCRIPT_GLOW_ON', this.onScriptGlowOn);
        this.props.vm.addListener('SCRIPT_GLOW_OFF', this.onScriptGlowOff);
        this.props.vm.addListener('BLOCK_GLOW_ON', this.onBlockGlowOn);
        this.props.vm.addListener('BLOCK_GLOW_OFF', this.onBlockGlowOff);
        this.props.vm.addListener('VISUAL_REPORT', this.onVisualReport);
        this.props.vm.addListener('workspaceUpdate', this.onWorkspaceUpdate);
        this.props.vm.addListener('targetsUpdate', this.onTargetsUpdate);
        this.props.vm.addListener('MONITORS_UPDATE', this.handleMonitorsUpdate);
        this.props.vm.addListener('EXTENSION_ADDED', this.handleExtensionAdded);
        this.props.vm.addListener('BLOCKSINFO_UPDATE', this.handleBlocksInfoUpdate);
        this.props.vm.addListener('EXTENSION_REMOVED', this.handleExtensionsChanged);
        this.props.vm.addListener('EXTENSIONS_REORDERED', this.handleExtensionsChanged);
        this.props.vm.addListener('PERIPHERAL_CONNECTED', this.handleStatusButtonUpdate);
        this.props.vm.addListener('PERIPHERAL_DISCONNECTED', this.handleStatusButtonUpdate);
    }
    detachVM () {
        this.props.vm.removeListener('SCRIPT_GLOW_ON', this.onScriptGlowOn);
        this.props.vm.removeListener('SCRIPT_GLOW_OFF', this.onScriptGlowOff);
        this.props.vm.removeListener('BLOCK_GLOW_ON', this.onBlockGlowOn);
        this.props.vm.removeListener('BLOCK_GLOW_OFF', this.onBlockGlowOff);
        this.props.vm.removeListener('VISUAL_REPORT', this.onVisualReport);
        this.props.vm.removeListener('workspaceUpdate', this.onWorkspaceUpdate);
        this.props.vm.removeListener('targetsUpdate', this.onTargetsUpdate);
        this.props.vm.removeListener('MONITORS_UPDATE', this.handleMonitorsUpdate);
        this.props.vm.removeListener('EXTENSION_ADDED', this.handleExtensionAdded);
        this.props.vm.removeListener('BLOCKSINFO_UPDATE', this.handleBlocksInfoUpdate);
        this.props.vm.removeListener('EXTENSION_REMOVED', this.handleExtensionsChanged);
        this.props.vm.removeListener('EXTENSIONS_REORDERED', this.handleExtensionsChanged);
        this.props.vm.removeListener('PERIPHERAL_CONNECTED', this.handleStatusButtonUpdate);
        this.props.vm.removeListener('PERIPHERAL_DISCONNECTED', this.handleStatusButtonUpdate);
    }

    updateToolboxBlockValue (id, value) {
        this.withToolboxUpdates(() => {
            const block = this.workspace
                .getFlyout()
                .getWorkspace()
                .getBlockById(id);
            if (block) {
                block.inputList[0].fieldRow[0].setValue(value);
            }
        });
    }

    onTargetsUpdate () {
        if (this.props.vm.editingTarget && this.workspace.getFlyout()) {
            ['glide', 'move', 'set'].forEach(prefix => {
                this.updateToolboxBlockValue(`${prefix}x`, Math.round(this.props.vm.editingTarget.x).toString());
                this.updateToolboxBlockValue(`${prefix}y`, Math.round(this.props.vm.editingTarget.y).toString());
            });
        }
    }
    onWorkspaceMetricsChange () {
        const target = this.props.vm.editingTarget;
        if (target && target.id) {
            this.props.updateMetrics({
                targetID: target.id,
                scrollX: this.workspace.scrollX,
                scrollY: this.workspace.scrollY,
                scale: this.workspace.scale
            });
        }
    }
    onScriptGlowOn (data) {
        this.workspace.glowStack(data.id, true);
    }
    onScriptGlowOff (data) {
        this.workspace.glowStack(data.id, false);
    }
    onBlockGlowOn (data) {
        this.workspace.glowBlock(data.id, true);
    }
    onBlockGlowOff (data) {
        this.workspace.glowBlock(data.id, false);
    }
    onVisualReport (data) {
        this.workspace.reportValue(data.id, data.value, data.fullValue);
    }
    getToolboxXML () {
        // Use try/catch because this requires digging pretty deep into the VM
        // Code inside intentionally ignores several error situations (no stage, etc.)
        // Because they would get caught by this try/catch
        try {
            let {editingTarget: target, runtime} = this.props.vm;
            const stage = runtime.getTargetForStage();
            if (!target) target = stage; // If no editingTarget, use the stage

            const stageCostumes = stage.getCostumes();
            const targetCostumes = target.getCostumes();
            const targetSounds = target.getSounds();
            const dynamicBlocksXML = injectExtensionCategoryTheme(
                this.props.vm.runtime.getBlocksXML(target),
                this.props.theme
            );
            return makeToolboxXML(false, target.isStage, target.id, dynamicBlocksXML,
                targetCostumes[targetCostumes.length - 1].name,
                stageCostumes[stageCostumes.length - 1].name,
                targetSounds.length > 0 ? targetSounds[targetSounds.length - 1].name : '',
                this.props.theme.getBlockColors()
            );
        } catch {
            return null;
        }
    }
    onWorkspaceUpdate (data) {
        // When we change sprites, update the toolbox to have the new sprite's blocks
        const toolboxXML = this.getToolboxXML();
        if (toolboxXML) {
            this.props.updateToolboxState(toolboxXML);
        }

        if (this.props.vm.editingTarget && !this.props.workspaceMetrics.targets[this.props.vm.editingTarget.id]) {
            this.onWorkspaceMetricsChange();
        }

        // Remove and reattach the workspace listener (but allow flyout events)
        this.workspace.removeChangeListener(this.props.vm.blockListener);
        const dom = this.ScratchBlocks.Xml.textToDom(data.xml);
        try {
            this.ScratchBlocks.Xml.clearWorkspaceAndLoadFromXml(dom, this.workspace);
        } catch (error) {
            // The workspace is likely incomplete. What did update should be
            // functional.
            //
            // Instead of throwing the error, by logging it and continuing as
            // normal lets the other workspace update processes complete in the
            // gui and vm, which lets the vm run even if the workspace is
            // incomplete. Throwing the error would keep things like setting the
            // correct editing target from happening which can interfere with
            // some blocks and processes in the vm.
            if (error.message) {
                error.message = `Workspace Update Error: ${error.message}`;
            }
            log.error(error);
        }
        this.workspace.addChangeListener(this.props.vm.blockListener);

        if (this.props.vm.editingTarget && this.props.workspaceMetrics.targets[this.props.vm.editingTarget.id]) {
            const {scrollX, scrollY, scale} = this.props.workspaceMetrics.targets[this.props.vm.editingTarget.id];
            this.workspace.scrollX = scrollX;
            this.workspace.scrollY = scrollY;
            this.workspace.scale = scale;
            this.workspace.resize();
        }

        // Clear the undo state of the workspace since this is a
        // fresh workspace and we don't want any changes made to another sprites
        // workspace to be 'undone' here.
        this.workspace.clearUndo();
    }
    handleMonitorsUpdate (monitors) {
        // Update the checkboxes of the relevant monitors.
        // TODO: What about monitors that have fields? See todo in scratch-vm blocks.js changeBlock:
        // https://github.com/LLK/scratch-vm/blob/2373f9483edaf705f11d62662f7bb2a57fbb5e28/src/engine/blocks.js#L569-L576
        const flyout = this.workspace.getFlyout();
        for (const monitor of monitors.values()) {
            const blockId = monitor.get('id');
            const isVisible = monitor.get('visible');
            flyout.setCheckboxState(blockId, isVisible);
            // We also need to update the isMonitored flag for this block on the VM, since it's used to determine
            // whether the checkbox is activated or not when the checkbox is re-displayed (e.g. local variables/blocks
            // when switching between sprites).
            const block = this.props.vm.runtime.monitorBlocks.getBlock(blockId);
            if (block) {
                block.isMonitored = isVisible;
            }
        }
    }
    handleExtensionAdded (categoryInfo) {
        const defineBlocks = blockInfoArray => {
            if (blockInfoArray && blockInfoArray.length > 0) {
                const staticBlocksJson = [];
                const dynamicBlocksInfo = [];
                blockInfoArray.forEach(blockInfo => {
                    if (blockInfo.info && blockInfo.info.isDynamic) {
                        dynamicBlocksInfo.push(blockInfo);
                    } else if (blockInfo.json) {
                        staticBlocksJson.push(injectExtensionBlockTheme(blockInfo.json, this.props.theme));
                    }
                    // otherwise it's a non-block entry such as '---'
                });

                this.ScratchBlocks.defineBlocksWithJsonArray(staticBlocksJson);
                dynamicBlocksInfo.forEach(blockInfo => {
                    // This is creating the block factory / constructor -- NOT a specific instance of the block.
                    // The factory should only know static info about the block: the category info and the opcode.
                    // Anything else will be picked up from the XML attached to the block instance.
                    const extendedOpcode = `${categoryInfo.id}_${blockInfo.info.opcode}`;
                    const blockDefinition = defineDynamicBlock(
                        this.ScratchBlocks,
                        categoryInfo,
                        blockInfo,
                        extendedOpcode,
                        this.props.theme
                    );
                    this.ScratchBlocks.Blocks[extendedOpcode] = blockDefinition;
                });
            }
        };

        // scratch-blocks implements a menu or custom field as a special kind of block ("shadow" block)
        // these actually define blocks and MUST run regardless of the UI state
        defineBlocks(
            Object.getOwnPropertyNames(categoryInfo.customFieldTypes)
                .map(fieldTypeName => categoryInfo.customFieldTypes[fieldTypeName].scratchBlocksDefinition));
        defineBlocks(categoryInfo.menus);
        defineBlocks(categoryInfo.blocks);

        // Update the toolbox with new blocks if possible
        const toolboxXML = this.getToolboxXML();
        if (toolboxXML) {
            this.props.updateToolboxState(toolboxXML);
        }
    }
    handleBlocksInfoUpdate (categoryInfo) {
        // @todo Later we should replace this to avoid all the warnings from redefining blocks.
        this.handleExtensionAdded(categoryInfo);
    }

    handleExtensionsChanged () {
        const toolboxXML = this.getToolboxXML();
        if (toolboxXML) {
            this.props.updateToolboxState(toolboxXML);
        }
    }
    handleCategorySelected (categoryId) {
        const extension = extensionData.find(ext => ext.extensionId === categoryId);
        if (extension && extension.launchPeripheralConnectionFlow) {
            this.handleConnectionModalStart(categoryId);
        }

        this.withToolboxUpdates(() => {
            this.workspace.toolbox_.setSelectedCategoryById(categoryId);
        });
    }
    setBlocks (blocks) {
        this.blocks = blocks;
    }
    handlePromptStart (message, defaultValue, callback, optTitle, optVarType) {
        const p = {prompt: {callback, message, defaultValue}};
        p.prompt.title = optTitle ? optTitle :
            this.ScratchBlocks.Msg.VARIABLE_MODAL_TITLE;
        p.prompt.varType = typeof optVarType === 'string' ?
            optVarType : this.ScratchBlocks.SCALAR_VARIABLE_TYPE;
        p.prompt.showVariableOptions = // This flag means that we should show variable/list options about scope
            optVarType !== this.ScratchBlocks.BROADCAST_MESSAGE_VARIABLE_TYPE &&
            p.prompt.title !== this.ScratchBlocks.Msg.RENAME_VARIABLE_MODAL_TITLE &&
            p.prompt.title !== this.ScratchBlocks.Msg.RENAME_LIST_MODAL_TITLE;
        p.prompt.showCloudOption = (optVarType === this.ScratchBlocks.SCALAR_VARIABLE_TYPE) && this.props.canUseCloud;
        this.setState(p);
    }
    handleConnectionModalStart (extensionId) {
        this.props.onOpenConnectionModal(extensionId);
    }
    handleStatusButtonUpdate () {
        this.ScratchBlocks.refreshStatusButtons(this.workspace);
    }
    handleOpenSoundRecorder () {
        this.props.onOpenSoundRecorder();
    }

    /*
     * Pass along information about proposed name and variable options (scope and isCloud)
     * and additional potentially conflicting variable names from the VM
     * to the variable validation prompt callback used in scratch-blocks.
     */
    handlePromptCallback (input, variableOptions) {
        this.state.prompt.callback(
            input,
            this.props.vm.runtime.getAllVarNamesOfType(this.state.prompt.varType),
            variableOptions);
        this.handlePromptClose();
    }
    handlePromptClose () {
        this.setState({prompt: null});
    }
    handleCustomProceduresClose (data) {
        const collaborationService = CollaborationService.getInstance();
        const newProcedureBlocks = [];
        const allBlocks = this.workspace.getAllBlocks(true);
        
        allBlocks.forEach(block => {
            if (block.type === 'procedures_definition') {
                const blockId = block.id;
                if (!window._syncedProcedureBlocks) {
                    window._syncedProcedureBlocks = new Set();
                }
                
                if (!window._syncedProcedureBlocks.has(blockId)) {
                    newProcedureBlocks.push(block);
                    window._syncedProcedureBlocks.add(blockId);
                }
            }
        });
        
        if (collaborationService && collaborationService.isConnected) {
            console.log('[Blocks] Collaboration connected, syncing', newProcedureBlocks.length, 'procedure blocks');
            
            if (newProcedureBlocks.length > 0) {
                newProcedureBlocks.forEach(block => {
                    try {
                        const xml = this.ScratchBlocks.Xml.blockToDom(block);
                        const xmlText = this.ScratchBlocks.Xml.domToText(xml);
                        
                        const event = {
                            type: 'create',
                            blockId: block.id,
                            xml: xmlText,
                            workspaceId: this.workspace.id,
                            recordUndo: false
                        };
                        
                        const eventOrigin = (collaborationService.peer && collaborationService.peer.id) ?
                            collaborationService.peer.id : 'local';
                        
                        const localTarget = this.props.vm.editingTarget ? this.props.vm.editingTarget : null;
                        const targetName = localTarget ? localTarget.getName() : null;
                        
                        const randomPart = Math.random().toString(36)
                            .slice(2, 8);

                        const eid = `${eventOrigin}-${Date.now()}-${randomPart}`;
                        
                        console.log('[Blocks] Sending procedure block to collaborators:', {
                            blockId: block.id,
                            eventId: eid,
                            xmlLength: xmlText.length
                        });
                        
                        collaborationService.sendMessage('block-event', {
                            event: event,
                            targetName: targetName,
                            eventId: eid,
                            eventOrigin: eventOrigin,
                            timestamp: Date.now()
                        });
                        
                    } catch (e) {
                        console.error('[Blocks] Error syncing procedure block:', e);
                    }
                });
            }
        }
        
        this.props.onRequestCloseCustomProcedures(data);
        const ws = this.workspace;
        ws.refreshToolboxSelection_();
        ws.toolbox_.scrollToCategoryById('myBlocks');
    }
    handleDrop (dragInfo) {
        fetch(dragInfo.payload.bodyUrl)
            .then(response => response.json())
            .then(payload => {
                // based on https://github.com/ScratchAddons/ScratchAddons/pull/7028
                const topBlock = findTopBlock(payload);
                if (topBlock) {
                    const metrics = this.props.workspaceMetrics.targets[this.props.vm.editingTarget.id];
                    if (metrics) {
                        const {x, y} = dragInfo.currentOffset;
                        const {left, right} = this.workspace.scrollbar.hScroll.outerSvg_.getBoundingClientRect();
                        const {top} = this.workspace.scrollbar.vScroll.outerSvg_.getBoundingClientRect();
                        topBlock.x = (
                            this.props.isRtl ? metrics.scrollX - x + right : -metrics.scrollX + x - left
                        ) / metrics.scale;
                        topBlock.y = (-metrics.scrollY - top + y) / metrics.scale;
                    }
                }
                return this.props.vm.shareBlocksToTarget(payload, this.props.vm.editingTarget.id);
            })
            .then(() => {
                this.props.vm.refreshWorkspace();
                this.updateToolbox(); // To show new variables/custom blocks
            });
    }
    handleEnableProcedureReturns () {
        console.log('handleEnableProcedureReturns called');
        this.workspace.enableProcedureReturns();
        this.requestToolboxUpdate();
        
        // Force immediate toolbox refresh to show return blocks
        setTimeout(() => {
            console.log('Executing delayed toolbox refresh');
            if (this.workspace.getFlyout) {
                const flyout = this.workspace.getFlyout();
                if (flyout && flyout.getWorkspace) {
                    flyout.getWorkspace().refreshToolboxSelection_();
                }
            }
            this.workspace.refreshToolboxSelection_();
            
            // Also trigger a specific refresh of the procedures category
            if (this.workspace.getToolbox && this.workspace.getToolbox()) {
                const toolbox = this.workspace.getToolbox();
                if (toolbox.refreshSelection) {
                    toolbox.refreshSelection();
                }
            }
        }, 100);
    }
    render () {
        /* eslint-disable no-unused-vars */
        const {
            anyModalVisible,
            canUseCloud,
            customStageSize,
            customProceduresVisible,
            extensionLibraryVisible,
            isFullScreen,
            options,
            stageSize,
            vm,
            isRtl,
            isVisible,
            onActivateColorPicker,
            onOpenConnectionModal,
            onOpenSoundRecorder,
            onOpenCustomExtensionModal,
            reduxOnOpenCustomExtensionModal,
            updateToolboxState,
            onActivateCustomProcedures,
            onActivateBlocksTab,
            onRequestCloseExtensionLibrary,
            onRequestCloseCustomProcedures,
            toolboxXML,
            updateMetrics: updateMetricsProp,
            useCatBlocks,
            workspaceMetrics,
            ...props
        } = this.props;
        /* eslint-enable no-unused-vars */
        return (
            <React.Fragment>
                <DroppableBlocks
                    componentRef={this.setBlocks}
                    onDrop={this.handleDrop}
                    gridVisible={this.props.theme.wallpaper.gridVisible !== false}
                    paletteWidth={typeof this.state.flyoutWidth === 'number' ?
                        (60 + this.state.flyoutWidth) : null}
                    paletteResizingEnabled={this.state.paletteResizeEnabled && !isFullScreen}
                    onPaletteResizePointerDown={this.handlePaletteResizePointerDown}
                    {...props}
                />
                {this.state.prompt ? (
                    <Prompt
                        defaultValue={this.state.prompt.defaultValue}
                        isStage={vm.runtime.getEditingTarget().isStage}
                        showListMessage={this.state.prompt.varType === this.ScratchBlocks.LIST_VARIABLE_TYPE}
                        label={this.state.prompt.message}
                        showCloudOption={this.state.prompt.showCloudOption}
                        showVariableOptions={this.state.prompt.showVariableOptions}
                        title={this.state.prompt.title}
                        vm={vm}
                        onCancel={this.handlePromptClose}
                        onOk={this.handlePromptCallback}
                    />
                ) : null}

                {customProceduresVisible ? (
                    <CustomProcedures
                        options={{
                            media: options.media
                        }}
                        onRequestClose={this.handleCustomProceduresClose}
                    />
                ) : null}
            </React.Fragment>
        );
    }
}

Blocks.propTypes = {
    intl: intlShape,
    anyModalVisible: PropTypes.bool,
    canUseCloud: PropTypes.bool,
    customStageSize: PropTypes.shape({
        width: PropTypes.number,
        height: PropTypes.number
    }),
    customProceduresVisible: PropTypes.bool,
    extensionLibraryVisible: PropTypes.bool,
    isRtl: PropTypes.bool,
    isVisible: PropTypes.bool,
    locale: PropTypes.string.isRequired,
    messages: PropTypes.objectOf(PropTypes.string),
    onActivateColorPicker: PropTypes.func,
    onActivateCustomProcedures: PropTypes.func,
    onActivateBlocksTab: PropTypes.func,
    onOpenConnectionModal: PropTypes.func,
    onOpenSoundRecorder: PropTypes.func,
    onOpenCustomExtensionModal: PropTypes.func,
    reduxOnOpenCustomExtensionModal: PropTypes.func,
    onRequestCloseCustomProcedures: PropTypes.func,
    onRequestCloseExtensionLibrary: PropTypes.func,
    options: PropTypes.shape({
        media: PropTypes.string,
        zoom: PropTypes.shape({
            controls: PropTypes.bool,
            wheel: PropTypes.bool,
            startScale: PropTypes.number
        }),
        comments: PropTypes.bool,
        collapse: PropTypes.bool
    }),
    stageSize: PropTypes.oneOf(Object.keys(STAGE_DISPLAY_SIZES)).isRequired,
    theme: PropTypes.instanceOf(Theme),
    toolboxXML: PropTypes.string,
    updateMetrics: PropTypes.func,
    updateToolboxState: PropTypes.func,
    useCatBlocks: PropTypes.bool,
    vm: PropTypes.instanceOf(VM).isRequired,
    isFullScreen: PropTypes.bool,
    workspaceMetrics: PropTypes.shape({
        targets: PropTypes.objectOf(PropTypes.object)
    })
};

Blocks.defaultOptions = {
    zoom: {
        controls: true,
        wheel: true,
        startScale: BLOCKS_DEFAULT_SCALE
    },
    grid: {
        spacing: 40,
        length: 2,
        colour: '#ddd'
    },
    comments: true,
    collapse: false,
    sounds: false
};

Blocks.defaultProps = {
    isVisible: true,
    options: Blocks.defaultOptions,
    theme: Theme.defaults.light
};

const mapStateToProps = state => ({
    anyModalVisible: (
        Object.keys(state.scratchGui.modals).some(key => state.scratchGui.modals[key]) ||
        state.scratchGui.mode.isFullScreen
    ),
    customStageSize: state.scratchGui.customStageSize,
    extensionLibraryVisible: state.scratchGui.modals.extensionLibrary,
    isFullScreen: state.scratchGui.mode.isFullScreen,
    isRtl: state.locales.isRtl,
    locale: state.locales.locale,
    messages: state.locales.messages,
    toolboxXML: state.scratchGui.toolbox.toolboxXML,
    customProceduresVisible: state.scratchGui.customProcedures.active,
    workspaceMetrics: state.scratchGui.workspaceMetrics,
    useCatBlocks: isTimeTravel2020(state)
});

const mapDispatchToProps = dispatch => ({
    onActivateColorPicker: callback => dispatch(activateColorPicker(callback)),
    onActivateCustomProcedures: (data, callback) => dispatch(activateCustomProcedures(data, callback)),
    onOpenConnectionModal: id => {
        dispatch(setConnectionModalExtensionId(id));
        dispatch(openConnectionModal());
    },
    onOpenSoundRecorder: () => {
        dispatch(activateTab(SOUNDS_TAB_INDEX));
        dispatch(openSoundRecorder());
    },
    reduxOnOpenCustomExtensionModal: () => dispatch(openCustomExtensionModal()),
    onRequestCloseExtensionLibrary: () => {
        dispatch(closeExtensionLibrary());
    },
    onRequestCloseCustomProcedures: data => {
        dispatch(deactivateCustomProcedures(data));
    },
    onActivateBlocksTab: () => {
        console.log('onActivateBlocksTab called');
        dispatch(activateTab(BLOCKS_TAB_INDEX));
    },
    updateToolboxState: toolboxXML => {
        dispatch(updateToolbox(toolboxXML));
    },
    updateMetrics: metrics => {
        dispatch(updateMetrics(metrics));
    }
});

export default injectIntl(errorBoundaryHOC('Blocks')(
    connect(
        mapStateToProps,
        mapDispatchToProps
    )(LoadScratchBlocksHOC(Blocks))
));
