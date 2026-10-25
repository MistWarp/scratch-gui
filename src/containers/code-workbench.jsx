/* eslint-disable react/jsx-no-bind */
import bindAll from 'lodash.bindall';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import {injectIntl, intlShape} from 'react-intl';
import {connect} from 'react-redux';
import {EditorView} from '@codemirror/view';
import {Transaction} from '@codemirror/state';
import {redo as redoText, redoDepth, undo as undoText, undoDepth} from '@codemirror/commands';
import {
    ArrowLeftRight,
    BookOpen,
    Check,
    CircleAlert,
    Columns2,
    Copy,
    Crosshair,
    Download,
    Info,
    Navigation,
    ExternalLink,
    FileInput,
    FilePlus2,
    FolderOpen,
    GitMerge,
    History,
    Library,
    Lock,
    LoaderCircle,
    Mic,
    Paintbrush,
    Pencil,
    Redo2,
    ReplaceAll,
    Rows2,
    Search,
    SearchCode,
    ShieldAlert,
    Shuffle,
    Trash2,
    Undo2,
    Upload,
    Users,
    X
} from 'lucide-react';

import Explorer, {DRAG_TYPE} from '../components/code-mode/explorer.jsx';
import SpriteProperties from '../components/code-mode/sprite-properties.jsx';
import EditorTabs, {hasTabDrag} from '../components/code-mode/editor-tabs.jsx';
import TextTab from '../components/code-mode/text-tab.jsx';
import AssetTab from '../components/code-mode/asset-tab.jsx';
import Panel, {ReferenceView} from '../components/code-mode/panel.jsx';
import QuickOpen from '../components/code-mode/quick-open.jsx';
import ContextMenu from '../components/code-mode/context-menu.jsx';
import AssetWorkbench from './code-workbench-assets.jsx';
import EditorPane from '../components/extension-dev/editor-pane.jsx';
import NewPane from '../components/extension-dev/new-pane.jsx';
import RemovePane from '../components/extension-dev/remove-pane.jsx';
import extensionMessages from '../components/extension-dev/messages.js';
import {reorderItems} from '../components/extension-dev/reorder.js';
import messages from '../components/code-mode/messages.js';
import styles from '../components/code-mode/workbench.css';

import {assetEditorActivated, consumeReveal} from '../reducers/editor-tab.js';
import {
    clearExtensionOutput,
    countProblems,
    setLoadProblems,
    setStaticProblems
} from '../reducers/extension-dev.js';
import {
    openBackdropLibrary,
    openHelp,
    openCostumeLibrary,
    openExtensionLibrary,
    openSoundLibrary,
    openSoundRecorder,
    openSpriteLibrary
} from '../reducers/modals.js';
import {setRestore} from '../reducers/restore-deletion.js';
import {showStandardAlert, closeAlertWithId} from '../reducers/alerts.js';
import {highlightTarget} from '../reducers/targets.js';
import CollaborationService from '../lib/collaboration/index.js';

import {itemIdFor} from '../lib/asset-identity.js';
import {
    SOUND_RECORDED_EVENT,
    classifyFile,
    uploadCostumes,
    uploadSounds,
    uploadSprites
} from '../lib/asset-upload.js';
import {installKeyScope} from '../lib/code-mode/key-scope.js';
import {setCursorBlockProvider, showBlock} from '../lib/code-mode/mode-switch.js';
import {unitId, unitKind} from '../lib/code-mode/fractch-adapter.js';
import {getTextController} from '../lib/code-mode/text-controller.js';
import {
    allTexts,
    appliableTargetIds,
    dirtyTargetIds,
    getText,
    isDirty,
    subscribeTexts
} from '../lib/code-mode/text-store.js';
import {latestRedo, latestUndo, subscribeCodeHistory} from '../lib/code-mode/code-history.js';
import {setTextUndoProvider} from '../lib/code-mode/undo-scope.js';
import {isCollaborating as isCodeLocked} from '../lib/code-mode/apply-pipeline.js';
import {codeUnitsExtension, setRunning, setUnits} from '../lib/code-mode/editor-units.js';
import {createDebugBridge} from '../lib/code-mode/debug-bridge.js';
import {
    confirmBackupFailure,
    confirmExtensionImpact,
    confirmImpact,
    confirmImpactAll,
    refusalText,
    promptText,
    runCodeHistory
} from '../lib/code-mode/code-dialogs.js';
import {
    editableSymbol,
    findReferences,
    fractchCompletionSource,
    fractchHover,
    procedureRenameChanges
} from '../lib/code-mode/intelligence.js';
import {
    assetAt,
    broadcastReceivers,
    extensionForSymbol,
    procedureDefinition,
    symbolAt
} from '../lib/code-mode/definition.js';
import {referenceGroups} from '../lib/code-mode/extension-completion.js';
import {
    SCRIPT_FILE,
    extensionFileName,
    itemsOf,
    listFiles,
    orderedSprites,
    resolveTab
} from '../lib/code-mode/files.js';
import {
    assetTab,
    closeOtherTabs,
    customAssetTab,
    cycleTab,
    extensionTab,
    loadSession,
    newExtensionTab,
    pinTab,
    pruneTabs,
    referenceTab,
    removeExtensionsTab,
    replaceTab,
    saveSession,
    scriptTab
} from '../lib/code-mode/tabs.js';
import {
    MAX_GROUPS,
    activeTabOf,
    closeEverywhere,
    closeInGroup,
    focusGroup,
    focusedGroup,
    groupById,
    mapGroups,
    mountsAssetEditor,
    moveTab,
    openInLayout,
    setGroupTabs,
    setRatio,
    singleLayout,
    splitTab
} from '../lib/code-mode/editor-groups.js';
import {
    downloadSource,
    fileNameOf,
    getDraft,
    getEntries,
    isCollaborating,
    rememberFileName,
    subscribe as subscribeExtensionSession
} from '../lib/extension-dev/session.js';
import {
    createExtensionFromSource,
    removeExtensionsFromProject,
    runUnsandboxed
} from '../lib/extension-dev/actions.js';
import {updateCallbacks} from '../lib/shortcuts/event-router.js';
import {getShortcutKey} from '../lib/shortcuts/registry.js';
import formatShortcutDisplay from '../lib/shortcuts/display.js';
import getCostumeUrl from '../lib/utils/get-costume-url.js';
import downloadBlob from '../lib/utils/download-blob.js';
import {projectFilename} from '../lib/utils/safe-filename.js';
import {emptyCostume, emptySprite} from '../lib/utils/empty-assets.js';
import sharedMessages from '../lib/constants/shared-messages.js';
import randomizeSpritePosition from '../lib/utils/randomize-sprite-position.js';
import {getSpriteLibrary} from '../lib/libraries/tw-async-libraries.js';
import SharedAudioContext from '../lib/audio/shared-audio-context.js';
import log from '../lib/utils/log.js';

const EXPLORER_OPEN_KEY = 'mw:code-mode:explorer-open';
const PANEL_OPEN_KEY = 'mw:code-mode:panel-open';
const EXPLORER_WIDTH_KEY = 'mw:code-mode:explorer-width';
const DRAWER_WIDTH = 1100;
const PANEL_COLLAPSE_WIDTH = 700;
const MIN_EXPLORER_WIDTH = 160;
const MAX_EXPLORER_WIDTH = 480;
const REGENERATE_DELAY = 500;
const RUNNING_POLL_MS = 250;
const MAX_REFERENCE_ITEMS = 40;
const IMAGE_ACCEPT = '.svg, .png, .bmp, .jpg, .jpeg, .jfif, .webp, .gif';
const SOUND_ACCEPT = '.wav, .mp3, .ogg, .oga, .flac, .m4a, .aac';
const SPRITE_ACCEPT = '.sprite3, .sprite2, .sprite, .svg, .png, .bmp, .jpg, .jpeg, .gif';

const EMPTY = [];
const EDGE_ZONE = 0.65;

const activeId = layout => {
    const group = focusedGroup(layout);
    return `${group.id}:${group.activeKey}`;
};

const readPreference = (key, fallback) => {
    try {
        const value = localStorage.getItem(key);
        return value === null ? fallback : JSON.parse(value);
    } catch (e) {
        return fallback;
    }
};

const writePreference = (key, value) => {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
        return;
    }
};

const projectKeyOf = vm => {
    const stage = vm.runtime.getTargetForStage();
    return stage ? stage.id : null;
};

const thumbnailFor = costume => {
    try {
        return costume.asset ? getCostumeUrl(costume.asset) : null;
    } catch (e) {
        return null;
    }
};

const soundDuration = sound => (sound.rate ? `${(sound.sampleCount / sound.rate).toFixed(2)}s` : null);

const quietReplace = (view, next) => {
    const current = view.state.doc.toString();
    if (current === next) return;
    let start = 0;
    const max = Math.min(current.length, next.length);
    while (start < max && current.charCodeAt(start) === next.charCodeAt(start)) start++;
    let end = 0;
    while (end < max - start &&
        current.charCodeAt(current.length - 1 - end) === next.charCodeAt(next.length - 1 - end)) end++;
    view.dispatch({
        changes: {from: start, to: current.length - end, insert: next.slice(start, next.length - end)},
        annotations: Transaction.addToHistory.of(false),
        filter: false
    });
};

const severityCounts = diagnostics => {
    let errors = 0;
    let warnings = 0;
    for (const item of diagnostics || []) {
        if (item.severity === 'error') errors++;
        else if (item.severity === 'warning') warnings++;
    }
    return {errors, warnings, total: errors + warnings};
};

class CodeWorkbench extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleCloseMenu',
            'getCursorBlock',
            'handleActivateTab',
            'handleCancelRename',
            'handleCloseQuickOpen',
            'handleCloseTab',
            'handleCommitRename',
            'handleDragHover',
            'handleDragStart',
            'handleDrop',
            'handleExplorerContextMenu',
            'handleExplorerDelete',
            'handleExplorerOpen',
            'handleExplorerRename',
            'handleExplorerResizePointerDown',
            'handleExplorerResizeKeyDown',
            'handleExplorerSelect',
            'handleExplorerToggle',
            'handleGroupResizeKeyDown',
            'handleGroupResizePointerDown',
            'handleOpenReferenceTab',
            'handleTabDragEnd',
            'handleFileInputChange',
            'handlePanelJump',
            'handlePanelOpenFile',
            'handlePanelTab',
            'handlePickQuickOpen',
            'handlePinTab',
            'handleProjectChanged',
            'handleProjectLoaded',
            'handleRefreshEntries',
            'handleRootMenu',
            'handleRunAll',
            'handleSoundRecorded',
            'handleStop',
            'handleTabContextMenu',
            'handleTextContextMenu',
            'handleTextsChanged',
            'handleTextChange',
            'handleEditorReady',
            'confirmExtension',
            'handleClearOutput',
            'handleExtensionApplied',
            'handleExtensionFocusHandled',
            'handleExtensionShowProblems',
            'handleGoToDefinition',
            'handleFindReferences',
            'handleRenameSymbol',
            'handleInsertReference',
            'handleOpenDebugHelp',
            'handleOutputJump',
            'handleRunUnsandboxed',
            'handleSessionChanged',
            'outputLocation',
            'pollRunning',
            'handleApply',
            'handleApplyAll',
            'handleRunScript',
            'handleShowLockedBlock',
            'resolveAssetName',
            'handleToggleExplorer',
            'handleTogglePanel',
            'handleOpenQuickOpen',
            'canDrop',
            'setFileInput',
            'setGroupsNode',
            'setRoot'
        ]);
        const projectKey = projectKeyOf(props.vm);
        const session = loadSession(projectKey);
        this.state = {
            projectKey,
            layout: session ? session.layout : singleLayout(),
            expanded: session ? session.expanded : {},
            selectedKey: null,
            textsVersion: 0,
            tabDrag: null,
            dropZone: null,
            overlays: {},
            focus: null,
            explorerOpen: readPreference(EXPLORER_OPEN_KEY, true) !== false,
            explorerWidth: Math.min(MAX_EXPLORER_WIDTH,
                Math.max(MIN_EXPLORER_WIDTH, Number(readPreference(EXPLORER_WIDTH_KEY, 240)) || 240)),
            panelOpen: readPreference(PANEL_OPEN_KEY, false) === true,
            panelTab: 'problems',
            width: null,
            drawerOpen: false,
            quickOpen: false,
            menu: null,
            renamingKey: null,
            dropKey: null,
            entries: getEntries(props.vm),
            extensionFocus: null
        };
        this.firstEntry = !session;
        this.extensionApply = {current: null};
        this.completion = fractchCompletionSource(() => this.props.vm, () => {
            const tab = this.activeTab();
            return tab ? tab.targetId : null;
        });
        this.textKeymap = [
            {key: 'Mod-z', run: view => this.handleTextHistory(view, 'undo')},
            {key: 'Mod-y', mac: 'Mod-Shift-z', run: view => this.handleTextHistory(view, 'redo')},
            {key: 'Mod-Shift-z', run: view => this.handleTextHistory(view, 'redo')},
            {key: 'F12', run: () => this.handleGoToDefinition()},
            {key: 'Shift-F12', run: () => this.handleFindReferences()},
            {key: 'F2', run: () => this.handleRenameSymbol()}
        ];
        this.hover = fractchHover(() => this.props.vm, {
            hover: styles.blockHover,
            hoverBlock: styles.blockHoverRow,
            hoverSwatch: styles.blockHoverSwatch,
            hoverDoc: styles.blockHoverDoc,
            hoverOpcode: styles.blockHoverOpcode
        });
        this.runningTimer = null;
        this.controller = getTextController(props.vm);
        this.textExtensions = new Map();
        this.pushedUnits = new WeakMap();
        this.debug = createDebugBridge({
            vm: props.vm,
            intl: props.intl,
            activeTab: () => this.activeTab(),
            activeEditorView: () => this.activeEditorView(),
            textState: targetId => this.textState(targetId),
            targetLabel: targetId => this.targetLabel(targetId),
            blockLine: (targetId, blockId) => this.blockLine(targetId, blockId),
            jumpTo: jump => this.jumpTo(jump),
            showMessage: (targetId, text) => this.showMessage(targetId, text),
            openWatch: () => {
                if (!this.unmounted && !(this.state.panelOpen && this.state.panelTab === 'watch')) {
                    this.handlePanelTab('watch');
                }
            },
            update: () => {
                if (!this.unmounted) this.forceUpdate();
            }
        });
        this.editorCallbacks = {current: {
            onRun: this.handleRunScript,
            onShowBlock: this.handleShowLockedBlock,
            resolveAssetName: this.resolveAssetName
        }};
        this.regenerateTimer = null;
        this.pendingFocus = null;
        this.pendingUpload = null;
        this.dragSource = null;
        this.lastAssetEditorKey = null;
        this.root = null;
        this.groupsNode = null;
        this.groupNodes = {};
        this.groupRefs = new Map();
        this.tabDrag = null;
        this.fileInput = null;
        this.assets = new AssetWorkbench(this);
    }
    componentDidMount () {
        const {vm} = this.props;
        this.releaseTextUndo = setTextUndoProvider(() => this.textUndoState());
        this.uninstallKeyScope = installKeyScope(document);
        this.assets.attach();
        vm.runtime.on('PROJECT_CHANGED', this.handleProjectChanged);
        vm.runtime.on('PROJECT_LOADED', this.handleProjectLoaded);
        vm.runtime.on('EXTENSION_RELOADED', this.handleRefreshEntries);
        vm.on('EXTENSION_ADDED', this.handleRefreshEntries);
        vm.on('EXTENSION_REMOVED', this.handleRefreshEntries);
        vm.on('EXTENSIONS_REORDERED', this.handleRefreshEntries);
        vm.on('BLOCKSINFO_UPDATE', this.handleRefreshEntries);
        window.addEventListener(SOUND_RECORDED_EVENT, this.handleSoundRecorded);
        this.unsubscribeTexts = subscribeTexts(this.handleTextsChanged);
        this.unsubscribeHistory = subscribeCodeHistory(this.handleTextsChanged);
        this.unsubscribeSession = subscribeExtensionSession(this.handleSessionChanged);
        this.runningTimer = setInterval(this.pollRunning, RUNNING_POLL_MS);
        this.configureController();
        updateCallbacks({
            toggleExplorer: () => {
                this.handleToggleExplorer();
                return true;
            },
            togglePanel: () => {
                this.handleTogglePanel();
                return true;
            },
            quickOpen: () => {
                this.handleOpenQuickOpen();
                return true;
            },
            applyFile: () => {
                this.handleApply();
                return true;
            },
            applyAll: () => {
                this.handleApplyAll();
                return true;
            },
            closeTab: () => {
                const group = this.focusedTabs();
                if (group.activeKey) this.handleCloseTab(group.activeKey, group.id);
                return true;
            },
            nextTab: () => {
                this.updateTabs(cycleTab(this.focusedTabs(), 1));
                return true;
            },
            previousTab: () => {
                this.updateTabs(cycleTab(this.focusedTabs(), -1));
                return true;
            },
            openReferenceTab: () => {
                this.handleOpenReferenceTab();
                return true;
            }
        });
        setCursorBlockProvider(this.getCursorBlock);
        if (this.root && typeof ResizeObserver !== 'undefined') {
            this.resizeObserver = new ResizeObserver(items => {
                const width = items[0] && items[0].contentRect.width;
                if (width) this.handleResize(width);
            });
            this.resizeObserver.observe(this.root);
        }
        this.startSession();
        this.handleReveal(this.props.reveal);
        this.afterTabsChange({focus: false});
    }
    componentDidUpdate (prevProps, prevState) {
        if (this.props.reveal && this.props.reveal !== prevProps.reveal) {
            this.handleReveal(this.props.reveal);
        }
        if (this.props.editingTarget !== prevProps.editingTarget && this.props.editingTarget) {
            this.revealTargetInExplorer(this.props.editingTarget);
        }
        if (this.props.sprites !== prevProps.sprites || this.props.stage !== prevProps.stage ||
            this.state.entries !== prevState.entries) {
            this.updateLayout(layout => mapGroups(layout, group => pruneTabs(group,
                tab => resolveTab(this.props.vm, tab, this.state.entries).exists)));
        }
        if (this.state.layout !== prevState.layout || this.state.expanded !== prevState.expanded) {
            saveSession(this.state.projectKey, {layout: this.state.layout, expanded: this.state.expanded});
        }
        if (activeId(this.state.layout) !== activeId(prevState.layout)) {
            this.afterTabsChange({focus: true});
        }
        if (this.state.textsVersion !== prevState.textsVersion) this.applyPendingFocus();
        this.syncAssetEditor();
        this.syncActiveView();
    }
    componentWillUnmount () {
        const {vm} = this.props;
        if (this.releaseTextUndo) this.releaseTextUndo();
        clearTimeout(this.regenerateTimer);
        this.assets.detach();
        vm.runtime.off('PROJECT_CHANGED', this.handleProjectChanged);
        vm.runtime.off('PROJECT_LOADED', this.handleProjectLoaded);
        vm.runtime.off('EXTENSION_RELOADED', this.handleRefreshEntries);
        vm.off('EXTENSION_ADDED', this.handleRefreshEntries);
        vm.off('EXTENSION_REMOVED', this.handleRefreshEntries);
        vm.off('EXTENSIONS_REORDERED', this.handleRefreshEntries);
        vm.off('BLOCKSINFO_UPDATE', this.handleRefreshEntries);
        window.removeEventListener(SOUND_RECORDED_EVENT, this.handleSoundRecorded);
        if (this.unsubscribeTexts) this.unsubscribeTexts();
        if (this.unsubscribeHistory) this.unsubscribeHistory();
        if (this.unsubscribeSession) this.unsubscribeSession();
        clearInterval(this.runningTimer);
        this.debug.dispose();
        const off = () => false;
        updateCallbacks({
            toggleExplorer: off,
            togglePanel: off,
            quickOpen: off,
            applyFile: off,
            applyAll: off,
            closeTab: off,
            nextTab: off,
            previousTab: off,
            openReferenceTab: off
        });
        setCursorBlockProvider(null);
        if (this.resizeObserver) this.resizeObserver.disconnect();
        if (this.uninstallKeyScope) this.uninstallKeyScope();
        this.unmounted = true;
        if (this.lastAssetEditorKey !== null) this.props.dispatch(assetEditorActivated(null));
        saveSession(this.state.projectKey, {layout: this.state.layout, expanded: this.state.expanded});
    }
    setRoot (root) {
        this.root = root;
    }
    setGroupsNode (node) {
        this.groupsNode = node;
    }
    groupAreaRef (id) {
        if (!this.groupRefs.has(id)) {
            this.groupRefs.set(id, node => {
                if (node) this.groupNodes[id] = node;
                else delete this.groupNodes[id];
            });
        }
        return this.groupRefs.get(id);
    }
    groupView (id) {
        const node = this.groupNodes[id];
        const host = node && node.querySelector('.cm-editor');
        return host ? EditorView.findFromDOM(host) : null;
    }
    orderedGroups () {
        const {layout} = this.state;
        const focused = focusedGroup(layout);
        return [focused].concat(layout.groups.filter(group => group !== focused));
    }
    setFileInput (input) {
        this.fileInput = input;
    }
    configureController () {
        const {dispatch, intl} = this.props;
        this.controller.configure({
            confirmImpact: impact => confirmImpact(dispatch, intl, impact),
            confirmImpactAll: impact => confirmImpactAll(dispatch, intl, impact),
            confirmBackupFailure: error => confirmBackupFailure(dispatch, intl, error),
            title: () => this.props.projectTitle || null
        });
    }
    handleTextsChanged () {
        if (this.unmounted) return;
        this.setState(state => ({textsVersion: state.textsVersion + 1}));
    }
    textState (targetId) {
        return targetId ? getText(targetId) : null;
    }
    cmUnits (state) {
        const {intl} = this.props;
        const units = (state && state.units) || {};
        const lockedIds = new Set();
        const locked = [];
        for (const item of (state && state.lockedScripts) || []) {
            const range = units[`script:${item.topId}`];
            if (!range) continue;
            lockedIds.add(item.topId);
            const reason = intl.formatMessage(messages.lockedReason);
            locked.push({...range, topId: item.topId, reason: item.reason ? `${reason} (${item.reason})` : reason});
        }
        const runs = [];
        for (const key of Object.keys(units)) {
            if (unitKind(key) !== 'script' || lockedIds.has(unitId(key))) continue;
            runs.push({...units[key], topId: unitId(key)});
        }
        return {locked, runs};
    }
    extensionsFor (targetId) {
        if (!this.textExtensions.has(targetId)) {
            const {intl} = this.props;
            this.textExtensions.set(targetId, [this.hover, codeUnitsExtension({
                callbacks: this.editorCallbacks,
                classes: {
                    gutter: styles.unitGutter,
                    run: styles.runMarker,
                    running: styles.runMarkerRunning,
                    lock: styles.lockMarker,
                    lockedLine: styles.lockedLine,
                    lockPopup: styles.lockPopup,
                    lockPopupButton: styles.lockPopupButton
                },
                labels: {
                    run: intl.formatMessage(messages.runScript),
                    running: intl.formatMessage(messages.running),
                    showBlock: intl.formatMessage(messages.showBlock),
                    lockedReason: intl.formatMessage(messages.lockedReason)
                }
            }), this.debug.extension]);
        }
        return this.textExtensions.get(targetId);
    }
    syncActiveView () {
        for (const group of this.state.layout.groups) {
            const tab = activeTabOf(group);
            if (tab && tab.kind === 'script') this.pushToView(this.groupView(group.id), this.textState(tab.targetId));
        }
    }
    pushToView (view, state) {
        if (!view || !state || state.status !== 'ready') return;
        if (view.state.doc.toString() !== state.doc) quietReplace(view, state.doc);
        if (this.pushedUnits.get(view) !== state.unitsVersion) {
            this.pushedUnits.set(view, state.unitsVersion);
            setUnits(view, this.cmUnits(state));
        }
    }
    handleEditorReady (tab, view) {
        if (tab && tab.kind === 'script') this.pushToView(view, this.textState(tab.targetId));
    }
    handleTextChange (groupId, tab, text, changes) {
        if (!tab || tab.kind !== 'script') return;
        const group = groupById(this.state.layout, groupId);
        if (group && tab.key === group.previewKey) {
            this.updateLayout(layout => setGroupTabs(layout, groupId, pinTab(groupById(layout, groupId), tab.key)));
        }
        this.controller.edit(tab.targetId, text, changes);
    }
    canApplyState (state) {
        return Boolean(state) && state.status === 'ready' && !state.draft && !state.applying &&
            !this.props.collaborating && isDirty(state) && !(state.conflicts && state.conflicts.length);
    }
    handleApply () {
        this.applyActive();
    }
    applyAllTargets () {
        return appliableTargetIds().filter(id => Boolean(this.props.vm.runtime.getTargetById(id)));
    }
    canApplyAll () {
        const ids = this.applyAllTargets();
        return ids.length > 1 && !this.props.collaborating && !ids.some(id => getText(id).applying);
    }
    handleApplyAll () {
        if (this.props.collaborating || !this.applyAllTargets().length) return Promise.resolve(null);
        return this.controller.applyAll()
            .catch(error => {
                log.warn('Apply all failed', error);
                return null;
            })
            .then(result => {
                if (this.unmounted || !result) return result;
                if (result.status === 'invalid' || (result.status === 'failed' && result.diagnostics)) {
                    this.handleExtensionShowProblems();
                }
                if (result.status === 'conflict' && result.targetIds && result.targetIds.length) {
                    this.openFile(scriptTab(result.targetIds[0]), {preview: false});
                }
                return result;
            });
    }
    applyActive () {
        const tab = this.activeTab();
        if (tab && tab.kind === 'customAsset') return this.assets.apply(tab);
        if (tab && tab.kind === 'extension') {
            const apply = this.extensionApply.current;
            if (!apply || this.props.collaborating || getDraft(tab.extensionId) === null) {
                return Promise.resolve(null);
            }
            return Promise.resolve(apply());
        }
        const state = tab && tab.kind === 'script' ? this.textState(tab.targetId) : null;
        if (!state || !isDirty(state) || state.draft || state.status !== 'ready' || this.props.collaborating) {
            return Promise.resolve(null);
        }
        return this.controller.apply(tab.targetId);
    }
    handleRunScript (topId) {
        const tab = this.activeTab();
        const target = tab && tab.targetId ? this.props.vm.runtime.getTargetById(tab.targetId) : null;
        if (target && target.blocks.getBlock(topId)) {
            this.props.vm.runtime.toggleScript(topId, {target, stackClick: true});
        }
    }
    handleShowLockedBlock (topId) {
        const tab = this.activeTab();
        if (!tab || !tab.targetId) return;
        showBlock({dispatch: this.props.dispatch, vm: this.props.vm, targetId: tab.targetId, blockId: topId});
    }
    resolveAssetName (item) {
        if (item && item.type === 'assetFile') return item.assetName || null;
        if (!item || (item.type !== 'costume' && item.type !== 'sound')) return null;
        const target = this.props.vm.runtime.getTargetById(item.targetId);
        const found = target && itemsOf(target, item.type).find(entry => itemIdFor(entry) === item.itemId);
        return found ? found.name : null;
    }
    setOverlay (targetId, overlay) {
        this.setState(state => ({overlays: {...state.overlays, [targetId]: overlay}}));
    }
    startSession () {
        if (!this.firstEntry) return;
        this.firstEntry = false;
        const target = this.props.vm.editingTarget;
        if (target) this.openFile(scriptTab(target.id), {preview: false});
    }
    handleProjectLoaded () {
        const projectKey = projectKeyOf(this.props.vm);
        if (projectKey === this.state.projectKey) return;
        const session = loadSession(projectKey);
        this.firstEntry = !session;
        this.textExtensions.clear();
        this.setState({
            projectKey,
            layout: session ? session.layout : singleLayout(),
            expanded: session ? session.expanded : {},
            overlays: {},
            selectedKey: null,
            focus: null,
            entries: getEntries(this.props.vm)
        }, () => {
            this.startSession();
            this.afterTabsChange({focus: false});
        });
    }
    handleProjectChanged () {
        clearTimeout(this.regenerateTimer);
        this.regenerateTimer = setTimeout(() => {
            this.regenerateTimer = null;
            const active = this.activeTab();
            if (active && active.kind === 'script') this.controller.refresh(active.targetId);
        }, REGENERATE_DELAY);
    }
    handleRefreshEntries () {
        if (this.unmounted) return;
        this.setState({entries: getEntries(this.props.vm)});
    }
    handleResize (width) {
        const update = {width};
        if (width < PANEL_COLLAPSE_WIDTH && (this.state.width === null || this.state.width >= PANEL_COLLAPSE_WIDTH)) {
            update.panelOpen = false;
        }
        if (width >= DRAWER_WIDTH) update.drawerOpen = false;
        this.setState(update);
    }
    isDrawer () {
        return typeof this.state.width === 'number' && this.state.width < DRAWER_WIDTH;
    }
    focusedTabs () {
        return focusedGroup(this.state.layout);
    }
    activeTab () {
        return activeTabOf(this.focusedTabs());
    }
    updateLayout (fn) {
        this.setState(state => {
            const layout = fn(state.layout);
            return layout === state.layout ? null : {layout};
        });
    }
    updateTabs (tabsState) {
        const {layout} = this.state;
        const next = setGroupTabs(layout, layout.focused, tabsState);
        if (next !== layout) this.setState({layout: next});
    }
    afterTabsChange ({focus}) {
        const tab = this.activeTab();
        if (!tab) return;
        if (focus) this.focusTarget(tab);
        if (tab.kind === 'script') this.controller.refresh(tab.targetId);
    }
    focusTarget (tab) {
        const {vm} = this.props;
        if (!tab.targetId) return;
        const target = vm.runtime.getTargetById(tab.targetId);
        if (!target) return;
        if (!vm.editingTarget || vm.editingTarget.id !== target.id) vm.setEditingTarget(target.id);
        if (tab.kind === 'costume') {
            const index = itemsOf(target, 'costume').findIndex(item => itemIdFor(item) === tab.itemId);
            if (index !== -1 && index !== target.currentCostume) this.selectCostume(target, index);
        }
    }
    selectCostume (target, index) {
        const {vm} = this.props;
        if (vm.editingCommands && vm.editingCommands.handler && vm.editingTarget === target) {
            vm.editingCommands.request('selectCostume', [index]);
        } else {
            target.setCostume(index);
        }
    }
    applyPendingFocus () {
        const pending = this.pendingFocus;
        if (!pending) return;
        const script = this.textState(pending.targetId);
        if (!script || script.status === 'loading') return;
        this.pendingFocus = null;
        if (script.status !== 'ready') return;
        if (typeof pending.from === 'number') {
            this.setState({focus: {targetId: pending.targetId, from: pending.from, to: pending.to, at: Date.now()}});
            return;
        }
        const exact = this.blockRange(pending.targetId, pending.blockId);
        if (exact) {
            this.setState({focus: {targetId: pending.targetId, from: exact.from, to: exact.to, at: Date.now()}});
            return;
        }
        const target = this.props.vm.runtime.getTargetById(pending.targetId);
        const topId = target && pending.blockId ? target.blocks.getTopLevelScript(pending.blockId) : null;
        const range = topId && script.units ? script.units[`script:${topId}`] : null;
        if (!range) return;
        this.setState({focus: {targetId: pending.targetId, from: range.from, to: range.from, at: Date.now()}});
    }
    syncAssetEditor () {
        let editor = null;
        for (const group of this.orderedGroups()) {
            const tab = activeTabOf(group);
            if (!tab || !mountsAssetEditor(this.state.layout, group.id) ||
                tab.targetId !== this.props.editingTarget) continue;
            const resolved = resolveTab(this.props.vm, tab, this.state.entries);
            if (resolved.exists) {
                editor = {kind: tab.kind, targetId: tab.targetId, index: resolved.index};
                break;
            }
        }
        const key = editor ? `${editor.kind}:${editor.targetId}:${editor.index}` : null;
        if (key === this.lastAssetEditorKey) return;
        this.lastAssetEditorKey = key;
        this.props.dispatch(assetEditorActivated(editor));
    }
    handleReveal (reveal) {
        if (!reveal) return;
        this.props.dispatch(consumeReveal(reveal.nonce));
        const {vm} = this.props;
        const editing = vm.editingTarget;
        switch (reveal.kind) {
        case 'block': {
            const targetId = reveal.targetId || (editing && editing.id);
            if (!targetId) return;
            this.pendingFocus = {targetId, blockId: reveal.id};
            this.openFile(scriptTab(targetId), {preview: false});
            this.applyPendingFocus();
            return;
        }
        case 'target':
            if (reveal.targetId) this.openFile(scriptTab(reveal.targetId), {preview: false});
            return;
        case 'currentCostume': {
            if (!editing) return;
            const costume = editing.getCostumes()[editing.currentCostume];
            if (costume) this.openFile(assetTab('costume', editing.id, itemIdFor(costume)), {preview: false});
            return;
        }
        case 'currentSound': {
            if (!editing) return;
            const sounds = editing.getSounds();
            const sound = sounds[sounds.length - 1];
            if (sound) this.openFile(assetTab('sound', editing.id, itemIdFor(sound)), {preview: false});
            return;
        }
        case 'extensions':
            this.setState(state => ({expanded: {...state.expanded, 'folder:extensions': true}}));
            return;
        case 'extension':
            if (!reveal.id) return;
            this.setState(state => ({
                entries: getEntries(vm),
                expanded: {...state.expanded, 'folder:extensions': true},
                selectedKey: `extension:${reveal.id}`,
                extensionFocus: reveal.location ? {...reveal.location, extensionId: reveal.id, at: Date.now()} :
                    state.extensionFocus
            }), () => this.openFile(extensionTab(reveal.id), {preview: false}));
            return;
        case 'newExtension': {
            const tab = newExtensionTab(reveal.source);
            this.setState(state => ({layout: mapGroups(state.layout, group => replaceTab(group, tab))}),
                () => this.openFile(tab, {preview: false}));
            return;
        }
        case 'removeExtensions': {
            if (!reveal.ids || !reveal.ids.length) return;
            const tab = removeExtensionsTab(reveal.ids);
            this.setState(state => ({layout: mapGroups(state.layout, group => replaceTab(group, tab))}),
                () => this.openFile(tab, {preview: false}));
            return;
        }
        case 'unapplied': {
            const targetId = dirtyTargetIds()[0];
            if (targetId) this.openFile(scriptTab(targetId), {preview: false});
            return;
        }
        case 'codeChanges':
            if (!reveal.targetId) return;
            this.openFile(scriptTab(reveal.targetId), {preview: false});
            this.controller.refresh(reveal.targetId);
            this.setOverlay(reveal.targetId, {kind: 'changes', before: reveal.before});
            return;
        default:
        }
    }
    handleSoundRecorded (event) {
        const targetId = event.detail && event.detail.targetId;
        const target = targetId ? this.props.vm.runtime.getTargetById(targetId) : null;
        if (!target) return;
        const sounds = target.getSounds();
        const sound = sounds[sounds.length - 1];
        if (sound) this.openFile(assetTab('sound', target.id, itemIdFor(sound)), {preview: false});
    }
    revealTargetInExplorer (targetId) {
        const key = `target:${targetId}`;
        const selected = this.state.selectedKey;
        if (selected && (selected === key || selected.includes(`:${targetId}`))) return;
        this.setState(state => ({
            selectedKey: key,
            expanded: state.expanded[key] === false ? {...state.expanded, [key]: true} : state.expanded
        }));
    }
    openFile (tab, {preview}) {
        const resolved = resolveTab(this.props.vm, tab, this.state.entries);
        if (!resolved.exists) return;
        const layout = this.state.layout;
        const next = openInLayout(layout, tab, {preview});
        if (activeId(next) === activeId(layout)) this.focusTarget(tab);
        if (next !== layout) this.setState({layout: next});
        if (this.isDrawer()) this.setState({drawerOpen: false});
    }
    updateGroup (groupId, fn) {
        this.updateLayout(layout => {
            const group = groupById(layout, groupId);
            return group ? setGroupTabs(focusGroup(layout, groupId), groupId, fn(group)) : layout;
        });
    }
    handleFocusGroup (groupId) {
        if (this.state.layout.focused !== groupId) this.updateLayout(layout => focusGroup(layout, groupId));
    }
    handleActivateTab (key, groupId = this.state.layout.focused) {
        this.updateGroup(groupId, group => ({...group, activeKey: key}));
    }
    handlePinTab (key, groupId = this.state.layout.focused) {
        this.updateGroup(groupId, group => pinTab(group, key));
    }
    handleCloseTab (key, groupId) {
        this.updateLayout(layout => {
            const focused = focusedGroup(layout);
            const owner = groupId ? groupById(layout, groupId) :
                [focused].concat(layout.groups).find(group => group.tabs.some(tab => tab.key === key));
            return owner ? closeInGroup(layout, owner.id, key) : layout;
        });
    }
    handleOpenReferenceTab () {
        this.openFile(referenceTab(), {preview: false});
    }
    handleTabContextMenu (groupId, key, event) {
        const {intl} = this.props;
        const shortcutHint = id => formatShortcutDisplay(getShortcutKey(id, this.props.customShortcuts)) || null;
        const split = this.state.layout.groups.length >= MAX_GROUPS;
        this.openMenu(event, [
            {label: intl.formatMessage(messages.close),
                icon: X,
                hint: shortcutHint('closeTab'),
                onClick: () => this.handleCloseTab(key, groupId)},
            {label: intl.formatMessage(messages.closeOthers),
                onClick: () => this.updateGroup(groupId, group => closeOtherTabs(group, key))},
            split ? {label: intl.formatMessage(messages.openInOtherGroup),
                icon: Columns2,
                separator: true,
                onClick: () => this.updateLayout(layout => splitTab(layout, groupId, key, layout.direction,
                    {copy: true}))} :
                {label: intl.formatMessage(messages.splitRight),
                    icon: Columns2,
                    separator: true,
                    onClick: () => this.updateLayout(layout => splitTab(layout, groupId, key, 'row', {copy: true}))},
            split ? {label: intl.formatMessage(messages.moveToOtherGroup),
                onClick: () => this.updateLayout(layout => splitTab(layout, groupId, key, layout.direction))} :
                {label: intl.formatMessage(messages.splitDown),
                    icon: Rows2,
                    onClick: () => this.updateLayout(layout => splitTab(layout, groupId, key, 'column',
                        {copy: true}))},
            {label: intl.formatMessage(messages.nextTab),
                separator: true,
                hint: shortcutHint('nextTab'),
                onClick: () => this.updateGroup(groupId, group => cycleTab({...group, activeKey: key}, 1))},
            {label: intl.formatMessage(messages.previousTab),
                hint: shortcutHint('previousTab'),
                onClick: () => this.updateGroup(groupId, group => cycleTab({...group, activeKey: key}, -1))}
        ]);
    }
    handleTabDragStart (groupId, key) {
        this.tabDrag = {groupId, key};
        setTimeout(() => {
            if (this.tabDrag && !this.unmounted) this.setState({tabDrag: this.tabDrag});
        }, 0);
    }
    handleTabDragEnd () {
        this.tabDrag = null;
        if (this.state.tabDrag || this.state.dropZone) this.setState({tabDrag: null, dropZone: null});
    }
    handleTabDrop (groupId, index) {
        const drag = this.tabDrag;
        this.handleTabDragEnd();
        if (drag) this.updateLayout(layout => moveTab(layout, drag.groupId, drag.key, groupId, index));
    }
    dropZoneFor (groupId, event) {
        const drag = this.tabDrag;
        const {layout} = this.state;
        if (!drag) return null;
        if (layout.groups.length >= MAX_GROUPS) return drag.groupId === groupId ? null : 'center';
        const source = groupById(layout, drag.groupId);
        if (!source || source.tabs.length < 2) return null;
        const rect = event.currentTarget.getBoundingClientRect();
        if (!rect.width || !rect.height) return null;
        const x = (this.props.isRtl ? rect.right - event.clientX : event.clientX - rect.left) / rect.width;
        const y = (event.clientY - rect.top) / rect.height;
        if (x > EDGE_ZONE && x >= y) return 'end';
        if (y > EDGE_ZONE) return 'bottom';
        return null;
    }
    handleAreaDragOver (groupId, event) {
        if (!hasTabDrag(event)) return;
        event.preventDefault();
        const zone = this.dropZoneFor(groupId, event);
        event.dataTransfer.dropEffect = zone ? 'move' : 'none';
        const current = this.state.dropZone;
        if (zone ? !current || current.groupId !== groupId || current.zone !== zone : current) {
            this.setState({dropZone: zone ? {groupId, zone} : null});
        }
    }
    handleAreaDrop (groupId, event) {
        if (!hasTabDrag(event)) return;
        event.preventDefault();
        const zone = this.dropZoneFor(groupId, event);
        const drag = this.tabDrag;
        this.handleTabDragEnd();
        if (!drag || !zone) return;
        this.updateLayout(layout => (zone === 'center' ?
            moveTab(layout, drag.groupId, drag.key, groupId) :
            splitTab(layout, drag.groupId, drag.key, zone === 'end' ? 'row' : 'column')));
    }
    handleGroupResizePointerDown (event) {
        if (event.button !== 0 || !this.groupsNode) return;
        event.preventDefault();
        const rect = this.groupsNode.getBoundingClientRect();
        const row = this.state.layout.direction === 'row';
        const rtl = this.props.isRtl;
        const move = moveEvent => {
            const size = row ? rect.width : rect.height;
            if (!size) return;
            let offset = moveEvent.clientY - rect.top;
            if (row) offset = rtl ? rect.right - moveEvent.clientX : moveEvent.clientX - rect.left;
            this.updateLayout(layout => setRatio(layout, offset / size));
        };
        const up = () => {
            window.removeEventListener('pointermove', move);
            window.removeEventListener('pointerup', up);
        };
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', up);
    }
    handleGroupResizeKeyDown (event) {
        const row = this.state.layout.direction === 'row';
        const keys = row ? ['ArrowLeft', 'ArrowRight'] : ['ArrowUp', 'ArrowDown'];
        if (!keys.includes(event.key)) return;
        event.preventDefault();
        event.stopPropagation();
        let step = event.key === keys[1] ? 0.05 : -0.05;
        if (row && this.props.isRtl) step = -step;
        this.updateLayout(layout => setRatio(layout, layout.ratio + step));
    }
    openMenu (event, items) {
        this.setState({menu: {x: event.clientX, y: event.clientY, items: items.filter(Boolean)}});
    }
    handleCloseMenu () {
        if (this.state.menu) this.setState({menu: null});
    }
    handleOpenQuickOpen () {
        this.setState({quickOpen: true});
    }
    handleCloseQuickOpen () {
        this.setState({quickOpen: false});
    }
    handlePickQuickOpen (file) {
        this.setState({quickOpen: false});
        this.openFile(file.tab, {preview: false});
    }
    handleToggleExplorer () {
        if (this.isDrawer()) {
            this.setState(state => ({drawerOpen: !state.drawerOpen}));
            return;
        }
        const explorerOpen = !this.state.explorerOpen;
        writePreference(EXPLORER_OPEN_KEY, explorerOpen);
        this.setState({explorerOpen});
    }
    handleTogglePanel () {
        const panelOpen = !this.state.panelOpen;
        writePreference(PANEL_OPEN_KEY, panelOpen);
        this.setState({panelOpen});
    }
    handlePanelTab (panelTab) {
        if (this.state.panelOpen && this.state.panelTab === panelTab) {
            this.handleTogglePanel();
            return;
        }
        writePreference(PANEL_OPEN_KEY, true);
        this.setState({panelTab, panelOpen: true});
    }
    handleExplorerResizePointerDown (event) {
        if (event.button !== 0) return;
        event.preventDefault();
        const startX = event.clientX;
        const startWidth = this.state.explorerWidth;
        const rtl = this.props.isRtl ? -1 : 1;
        const move = moveEvent => {
            const width = Math.min(MAX_EXPLORER_WIDTH,
                Math.max(MIN_EXPLORER_WIDTH, startWidth + ((moveEvent.clientX - startX) * rtl)));
            this.setState({explorerWidth: width});
        };
        const up = () => {
            window.removeEventListener('pointermove', move);
            window.removeEventListener('pointerup', up);
            writePreference(EXPLORER_WIDTH_KEY, this.state.explorerWidth);
        };
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', up);
    }
    handleExplorerResizeKeyDown (event) {
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
        event.preventDefault();
        event.stopPropagation();
        const step = (event.key === 'ArrowRight' ? 16 : -16) * (this.props.isRtl ? -1 : 1);
        const explorerWidth = Math.min(MAX_EXPLORER_WIDTH,
            Math.max(MIN_EXPLORER_WIDTH, this.state.explorerWidth + step));
        writePreference(EXPLORER_WIDTH_KEY, explorerWidth);
        this.setState({explorerWidth});
    }
    isExpanded (key, fallback) {
        return typeof this.state.expanded[key] === 'boolean' ? this.state.expanded[key] : fallback;
    }
    buildRows () {
        const {intl, vm} = this.props;
        const {entries} = this.state;
        const rows = [];
        const stage = vm.runtime.getTargetForStage();
        const targets = (stage ? [stage] : []).concat(orderedSprites(vm, this.props.sprites));
        for (const target of targets) {
            const targetKey = `target:${target.id}`;
            const expanded = this.isExpanded(targetKey, target.id === this.props.editingTarget);
            rows.push({
                key: targetKey,
                type: 'target',
                isStage: target.isStage,
                label: target.isStage ? intl.formatMessage(messages.stage) : target.getName(),
                depth: 0,
                targetId: target.id,
                expandable: true,
                expanded,
                renamable: !target.isStage,
                draggable: !target.isStage,
                thumbnail: thumbnailFor(target.getCostumes()[target.currentCostume] || {})
            });
            if (!expanded) continue;
            const script = this.textState(target.id);
            const counts = this.scriptProblemCounts(target.id, script);
            const undid = script && script.message && script.message.kind === 'undid';
            rows.push({
                key: `script:${target.id}`,
                type: 'script',
                label: SCRIPT_FILE,
                depth: 1,
                targetId: target.id,
                openable: true,
                parentKey: targetKey,
                meta: undid ? intl.formatMessage(messages.undidCodeChange) : null,
                problems: counts.total ? counts : null
            });
            for (const kind of ['costume', 'sound']) {
                const folderKey = `folder:${target.id}:${kind}`;
                const items = itemsOf(target, kind);
                const folderExpanded = this.isExpanded(folderKey, false);
                rows.push({
                    key: folderKey,
                    type: 'folder',
                    folderKind: kind,
                    label: intl.formatMessage(kind === 'sound' ? messages.sounds :
                        (target.isStage ? messages.backdrops : messages.costumes)),
                    depth: 1,
                    targetId: target.id,
                    expandable: true,
                    expanded: folderExpanded,
                    meta: String(items.length),
                    parentKey: targetKey
                });
                if (!folderExpanded) continue;
                items.forEach((item, index) => {
                    const itemId = itemIdFor(item);
                    rows.push({
                        key: `${kind}:${target.id}:${itemId}`,
                        type: kind,
                        label: item.name,
                        depth: 2,
                        targetId: target.id,
                        itemId,
                        index,
                        openable: true,
                        draggable: true,
                        renamable: true,
                        thumbnail: kind === 'costume' ? thumbnailFor(item) : null,
                        meta: kind === 'sound' ? soundDuration(item) : null,
                        parentKey: folderKey
                    });
                });
            }
        }
        const extensionsExpanded = this.isExpanded('folder:extensions', true);
        rows.push({
            key: 'folder:extensions',
            type: 'extensions',
            label: intl.formatMessage(messages.extensions),
            depth: 0,
            expandable: true,
            expanded: extensionsExpanded,
            meta: entries.length ? String(entries.length) : null
        });
        if (extensionsExpanded) {
            if (!entries.length) {
                rows.push({
                    key: 'extensions:empty',
                    type: 'empty',
                    label: intl.formatMessage(messages.noExtensions),
                    depth: 1,
                    muted: true,
                    parentKey: 'folder:extensions'
                });
            }
            for (const entry of entries) {
                const counts = countProblems(this.props.devState, entry.id);
                rows.push({
                    key: `extension:${entry.id}`,
                    type: 'extension',
                    label: extensionFileName(entry),
                    tooltip: entry.name,
                    depth: 1,
                    extensionId: entry.id,
                    entry,
                    openable: true,
                    draggable: entry.status === 'loaded',
                    meta: entry.kind === 'builtin' ? intl.formatMessage(messages.builtIn) : null,
                    problems: counts.total ? counts : null,
                    parentKey: 'folder:extensions'
                });
            }
        }
        rows.push(...this.assets.rows());
        return rows;
    }
    rowTab (row) {
        if (row.type === 'assetFile') return customAssetTab(row.assetName);
        if (row.type === 'script') return scriptTab(row.targetId);
        if (row.type === 'costume' || row.type === 'sound') return assetTab(row.type, row.targetId, row.itemId);
        if (row.type === 'extension') return {key: row.key, kind: 'extension', extensionId: row.extensionId};
        return null;
    }
    handleExplorerSelect (row) {
        this.setState({selectedKey: row.key});
        if (row.type !== 'target' || !this.props.vm.runtime.getTargetById(row.targetId)) return;
        if (this.props.editingTarget === row.targetId) return;
        this.props.vm.setEditingTarget(row.targetId);
        const service = CollaborationService.getInstance();
        if (service) service.onEditingTargetChange();
    }
    handleExplorerToggle (row) {
        this.setState(state => ({expanded: {...state.expanded, [row.key]: !row.expanded}}));
    }
    handleExplorerOpen (row, {preview}) {
        const tab = this.rowTab(row);
        if (tab) this.openFile(tab, {preview});
    }
    handleExplorerRename (row) {
        if (row.renamable) this.setState({renamingKey: row.key});
    }
    handleCancelRename () {
        this.setState({renamingKey: null});
    }
    handleCommitRename (row, value) {
        if (this.state.renamingKey !== row.key) return;
        this.setState({renamingKey: null});
        const name = String(value || '').trim();
        if (!name || name === row.label) return;
        if (this.assets.owns(row)) {
            this.assets.rename(row, name);
            return;
        }
        const {vm} = this.props;
        try {
            if (row.type === 'target') {
                vm.renameSprite(row.targetId, name);
            } else if (row.type === 'costume' || row.type === 'sound') {
                const index = this.prepareAsset(row);
                if (index === -1) return;
                if (row.type === 'costume') vm.renameCostume(index, name);
                else vm.renameSound(index, name);
            }
        } catch (error) {
            log.error(error);
        }
    }
    prepareAsset (row) {
        const {vm} = this.props;
        const target = vm.runtime.getTargetById(row.targetId);
        if (!target) return -1;
        if (!vm.editingTarget || vm.editingTarget.id !== target.id) vm.setEditingTarget(target.id);
        return itemsOf(target, row.type).findIndex(item => itemIdFor(item) === row.itemId);
    }
    handleExplorerDelete (row) {
        const {dispatch, vm} = this.props;
        if (this.assets.owns(row)) {
            this.assets.remove(row);
            return;
        }
        if (row.type === 'target' && !row.isStage) {
            try {
                const restoreFun = vm.deleteSprite(row.targetId);
                if (typeof restoreFun === 'function') dispatch(setRestore({restoreFun, deletedItem: 'Sprite'}));
            } catch (error) {
                dispatch(showStandardAlert('assetDeleteError'));
            }
        } else if (row.type === 'costume' || row.type === 'sound') {
            const index = this.prepareAsset(row);
            if (index === -1) return;
            const target = vm.editingTarget;
            if (row.type === 'costume' && target.getCostumes().length < 2) return;
            try {
                const restoreFun = row.type === 'costume' ? vm.deleteCostume(index) : vm.deleteSound(index);
                if (typeof restoreFun === 'function') {
                    dispatch(setRestore({restoreFun, deletedItem: row.type === 'costume' ? 'Costume' : 'Sound'}));
                }
            } catch (error) {
                dispatch(showStandardAlert('assetDeleteError'));
            }
        } else if (row.type === 'extension') {
            if (this.props.collaborating) return;
            this.handleReveal({kind: 'removeExtensions', ids: [row.extensionId]});
        }
    }
    duplicateRow (row) {
        const {dispatch, vm} = this.props;
        const fail = () => dispatch(showStandardAlert('assetImportError'));
        try {
            if (row.type === 'target') {
                Promise.resolve(vm.duplicateSprite(row.targetId)).catch(fail);
            } else if (row.type === 'costume' || row.type === 'sound') {
                const index = this.prepareAsset(row);
                if (index === -1) return;
                Promise.resolve(row.type === 'costume' ? vm.duplicateCostume(index) : vm.duplicateSound(index))
                    .catch(fail);
            }
        } catch (error) {
            fail();
        }
    }
    exportRow (row) {
        const {dispatch, vm} = this.props;
        const fail = () => dispatch(showStandardAlert('assetExportError'));
        if (row.type === 'target') {
            const target = vm.runtime.getTargetById(row.targetId);
            if (!target) return;
            vm.exportSprite(row.targetId)
                .then(content => downloadBlob(projectFilename(target.getName(), 'Sprite', 'sprite3'), content))
                .catch(fail);
        } else if (row.type === 'costume' || row.type === 'sound') {
            const target = vm.runtime.getTargetById(row.targetId);
            const item = target && itemsOf(target, row.type).find(entry => itemIdFor(entry) === row.itemId);
            if (!item) return;
            try {
                const data = row.type === 'costume' ? vm.getExportedCostume(item) : item.asset.data;
                downloadBlob(
                    projectFilename(item.name, row.type === 'costume' ? 'Costume' : 'Sound', item.asset.dataFormat),
                    new Blob([data], {type: item.asset.assetType.contentType})
                );
            } catch (error) {
                fail();
            }
        } else if (row.type === 'script') {
            const target = vm.runtime.getTargetById(row.targetId);
            const script = this.textState(row.targetId);
            if (!target || !script || script.status !== 'ready') return;
            downloadBlob(`${projectFilename(target.getName(), 'Sprite', 'fractch')}`,
                new Blob([script.doc], {type: 'text/plain'}));
        } else if (row.type === 'extension') {
            vm.extensionManager.getExtensionSource(row.extensionId, {fetch: true})
                .then(text => {
                    if (typeof text === 'string') downloadSource(row.entry, text);
                })
                .catch(fail);
        }
    }
    requestUpload (kind, targetId) {
        if (!this.fileInput) return;
        this.pendingUpload = {kind, targetId};
        const target = targetId ? this.props.vm.runtime.getTargetById(targetId) : null;
        this.fileInput.accept = kind === 'sound' ? SOUND_ACCEPT : (kind === 'sprite' ? SPRITE_ACCEPT : IMAGE_ACCEPT);
        this.fileInput.dataset.stage = target && target.isStage ? 'true' : 'false';
        this.fileInput.click();
    }
    handleFileInputChange (event) {
        const request = this.pendingUpload;
        this.pendingUpload = null;
        if (!request) return;
        if (request.kind === 'customAsset') {
            const files = Array.from(event.target.files || []);
            event.target.value = null;
            this.assets.addFiles(files, request.folder);
            return;
        }
        this.uploadFiles(event.target, request.kind, request.targetId);
    }
    uploadFiles (files, kind, targetId) {
        const {dispatch, vm} = this.props;
        const notify = {
            onStart: () => dispatch(showStandardAlert('importingAsset')),
            onEnd: () => dispatch(closeAlertWithId('importingAsset')),
            onError: () => dispatch(showStandardAlert('assetImportError'))
        };
        const target = targetId ? vm.runtime.getTargetById(targetId) : null;
        if (kind === 'sprite') return uploadSprites({vm, files, ...notify});
        if (!target) return Promise.resolve([]);
        if (kind === 'sound') return uploadSounds({vm, files, targetId, ...notify});
        return uploadCostumes({vm, files, targetId, isBackdrop: target.isStage, ...notify});
    }
    addBlankCostume (targetId) {
        const {dispatch, intl, vm} = this.props;
        const target = vm.runtime.getTargetById(targetId);
        if (!target) return;
        const name = intl.formatMessage(target.isStage ? sharedMessages.backdrop : sharedMessages.costume, {index: 1});
        const costume = emptyCostume(name);
        vm.addCostume(costume.md5, costume, targetId)
            .then(() => {
                const costumes = target.getCostumes();
                const added = costumes[costumes.length - 1];
                if (added) this.openFile(assetTab('costume', targetId, itemIdFor(added)), {preview: false});
            })
            .catch(() => dispatch(showStandardAlert('assetImportError')));
    }
    paintSprite () {
        const {dispatch, intl, vm} = this.props;
        const sprite = emptySprite(
            intl.formatMessage(sharedMessages.sprite, {index: 1}),
            intl.formatMessage(sharedMessages.pop),
            intl.formatMessage(sharedMessages.costume, {index: 1})
        );
        vm.addSprite(JSON.stringify(sprite))
            .then(() => {
                const target = vm.editingTarget;
                const costume = target && target.getCostumes()[0];
                if (costume) this.openFile(assetTab('costume', target.id, itemIdFor(costume)), {preview: false});
            })
            .catch(() => dispatch(showStandardAlert('assetImportError')));
    }
    surpriseSprite () {
        const {dispatch, vm} = this.props;
        getSpriteLibrary()
            .then(library => {
                const choices = library.filter(item =>
                    item.tags.indexOf('letters') === -1 && item.tags.indexOf('numbers') === -1);
                const item = choices[Math.floor(Math.random() * choices.length)];
                if (!item) throw new Error('No sprites are available');
                randomizeSpritePosition(item);
                return vm.addSprite(JSON.stringify(item));
            })
            .catch(() => dispatch(showStandardAlert('assetImportError')));
    }
    openLibrary (kind, targetId) {
        const {dispatch, vm} = this.props;
        const target = targetId ? vm.runtime.getTargetById(targetId) : null;
        if (target && (!vm.editingTarget || vm.editingTarget.id !== target.id)) vm.setEditingTarget(target.id);
        if (kind === 'sound') dispatch(openSoundLibrary());
        else if (kind === 'sprite') dispatch(openSpriteLibrary());
        else if (target && target.isStage) dispatch(openBackdropLibrary());
        else dispatch(openCostumeLibrary());
    }
    rootItems () {
        const {intl} = this.props;
        return [
            {label: intl.formatMessage(messages.paintSprite), icon: Paintbrush, onClick: () => this.paintSprite()},
            {label: intl.formatMessage(messages.uploadSprite),
                icon: Upload,
                onClick: () => this.requestUpload('sprite', null)},
            {label: intl.formatMessage(messages.spriteLibrary),
                icon: Library,
                onClick: () => this.openLibrary('sprite', null)},
            {label: intl.formatMessage(messages.surpriseSprite), icon: Shuffle, onClick: () => this.surpriseSprite()}
        ];
    }
    handleRootMenu (event) {
        if (event.type === 'click') {
            const rect = event.currentTarget.getBoundingClientRect();
            this.setState({menu: {x: rect.left, y: rect.bottom + 2, items: this.rootItems()}});
            return;
        }
        this.openMenu(event, this.rootItems());
    }
    handleExplorerContextMenu (row, event) {
        const assetItems = this.assets.contextMenu(row);
        if (assetItems) {
            this.openMenu(event, assetItems);
            return;
        }
        const {dispatch, intl, vm} = this.props;
        const locked = this.props.collaborating;
        const m = descriptor => intl.formatMessage(descriptor);
        const open = {
            label: m(messages.open),
            icon: FolderOpen,
            onClick: () => this.handleExplorerOpen(row, {preview: false})
        };
        const rename = {label: m(messages.rename), icon: Pencil, onClick: () => this.handleExplorerRename(row)};
        const duplicate = {label: m(messages.duplicate), icon: Copy, onClick: () => this.duplicateRow(row)};
        const remove = {label: m(messages.delete), icon: Trash2, onClick: () => this.handleExplorerDelete(row)};
        const exportItem = {label: m(messages.export), icon: Download, onClick: () => this.exportRow(row)};
        let items = [];
        switch (row.type) {
        case 'target':
            items = row.isStage ? [] : [rename, duplicate, remove, exportItem];
            if (this.props.spritePaneVisible) {
                items.push({
                    label: m(messages.revealInSpritePane),
                    icon: Crosshair,
                    separator: items.length > 0,
                    onClick: () => {
                        vm.setEditingTarget(row.targetId);
                        if (!row.isStage) dispatch(highlightTarget(row.targetId));
                    }
                });
            }
            break;
        case 'script':
            items = [open, exportItem];
            break;
        case 'costume': {
            const target = vm.runtime.getTargetById(row.targetId);
            items = [open, rename, duplicate,
                {...remove, disabled: !target || target.getCostumes().length < 2}, exportItem];
            break;
        }
        case 'sound':
            items = [open, rename, duplicate, remove, exportItem];
            break;
        case 'folder': {
            const target = vm.runtime.getTargetById(row.targetId);
            const stage = target && target.isStage;
            items = row.folderKind === 'sound' ? [
                {label: m(messages.recordSound),
                    icon: Mic,
                    onClick: () => {
                        if (vm.editingTarget.id !== row.targetId) vm.setEditingTarget(row.targetId);
                        dispatch(openSoundRecorder());
                    }},
                {
                    label: m(messages.uploadSound),
                    icon: Upload,
                    onClick: () => this.requestUpload('sound', row.targetId)
                },
                {label: m(messages.soundLibrary), icon: Library, onClick: () => this.openLibrary('sound', row.targetId)}
            ] : [
                {label: m(stage ? messages.paintBackdrop : messages.paintCostume),
                    icon: Paintbrush,
                    onClick: () => this.addBlankCostume(row.targetId)},
                {label: m(stage ? messages.uploadBackdrop : messages.uploadCostume),
                    icon: Upload,
                    onClick: () => this.requestUpload('costume', row.targetId)},
                {label: m(stage ? messages.backdropLibrary : messages.costumeLibrary),
                    icon: Library,
                    onClick: () => this.openLibrary('costume', row.targetId)}
            ];
            break;
        }
        case 'extensions':
            items = [
                {label: m(messages.newExtension),
                    icon: FilePlus2,
                    disabled: locked,
                    onClick: () => this.handleReveal({kind: 'newExtension'})},
                {label: m(messages.addExtension), icon: FileInput, onClick: () => dispatch(openExtensionLibrary())}
            ];
            break;
        case 'extension':
            items = [
                {...open, icon: ExternalLink},
                {...remove, disabled: locked},
                {label: m(messages.export), icon: Download, onClick: () => this.exportRow(row)}
            ];
            if (row.entry.status === 'loaded' && row.entry.kind === 'embedded' && row.entry.mode !== 'unsandboxed') {
                items.push({label: m(messages.runUnsandboxed),
                    icon: ShieldAlert,
                    separator: true,
                    disabled: locked,
                    onClick: () => this.handleRunUnsandboxed(row.entry)});
            }
            break;
        default:
        }
        if (items.length) this.openMenu(event, items);
    }
    handleDragStart (row, event) {
        if (!row.draggable) {
            event.preventDefault();
            return;
        }
        this.dragSource = {
            type: row.type,
            targetId: row.targetId,
            itemId: row.itemId,
            extensionId: row.extensionId,
            assetName: row.assetName,
            folderPath: row.folderPath
        };
        event.dataTransfer.effectAllowed = 'copyMove';
        event.dataTransfer.setData(DRAG_TYPE, JSON.stringify(this.dragSource));
        event.dataTransfer.setData('text/plain', row.label);
    }
    handleDragHover (key) {
        if (this.state.dropKey !== key) this.setState({dropKey: key});
    }
    canDrop (row, event) {
        const types = Array.from(event.dataTransfer.types || []);
        if (types.includes('Files')) return !row || row.type !== 'empty';
        if (!types.includes(DRAG_TYPE) || !this.dragSource) return false;
        const source = this.dragSource;
        if (!row) return false;
        if (this.assets.owns(source)) return this.assets.canDrop(row, source);
        if (source.type === 'extension') return row.type === 'extension';
        if (source.type === 'target') return row.type === 'target' && !row.isStage && row.targetId !== source.targetId;
        if (row.type === 'target' || row.type === 'script') return row.targetId !== source.targetId;
        if (row.type === 'folder') return row.folderKind === source.type;
        return row.type === source.type;
    }
    handleDrop (row, event) {
        const transfer = event.dataTransfer;
        const internal = transfer.getData(DRAG_TYPE);
        const source = this.dragSource;
        this.dragSource = null;
        if (internal && source) {
            this.dropInternal(source, row);
            return;
        }
        const files = Array.from(transfer.files || []);
        if (files.length) this.dropFiles(files, row);
    }
    dropInternal (source, row) {
        const {vm} = this.props;
        if (!row) return;
        if (this.assets.owns(source)) {
            this.assets.move(source, row);
            return;
        }
        if (source.type === 'extension') {
            if (row.type !== 'extension' || row.extensionId === source.extensionId) return;
            const loaded = this.state.entries.filter(entry => entry.status === 'loaded').map(entry => entry.id);
            const from = loaded.indexOf(source.extensionId);
            const to = loaded.indexOf(row.extensionId);
            if (from === -1 || to === -1) return;
            const order = reorderItems(loaded, from, to);
            Promise.resolve(vm.extensionManager.setExtensionOrder(order))
                .catch(error => log.error(error))
                .then(this.handleRefreshEntries);
            return;
        }
        if (source.type === 'target') {
            const targets = vm.runtime.targets;
            const from = targets.findIndex(target => target.id === source.targetId);
            const to = targets.findIndex(target => target.id === row.targetId);
            if (from !== -1 && to !== -1 && row.type === 'target' && !row.isStage) vm.reorderTarget(from, to);
            return;
        }
        const sourceTarget = vm.runtime.getTargetById(source.targetId);
        if (!sourceTarget) return;
        const items = itemsOf(sourceTarget, source.type);
        const fromIndex = items.findIndex(item => itemIdFor(item) === source.itemId);
        if (fromIndex === -1) return;
        if (row.targetId === source.targetId) {
            if (row.type !== source.type || row.itemId === source.itemId) return;
            const toIndex = items.findIndex(item => itemIdFor(item) === row.itemId);
            if (toIndex === -1) return;
            if (source.type === 'costume') vm.reorderCostume(source.targetId, fromIndex, toIndex);
            else vm.reorderSound(source.targetId, fromIndex, toIndex);
            return;
        }
        if (!row.targetId) return;
        if (!vm.editingTarget || vm.editingTarget.id !== sourceTarget.id) vm.setEditingTarget(sourceTarget.id);
        const share = source.type === 'costume' ?
            vm.shareCostumeToTarget(fromIndex, row.targetId) :
            vm.shareSoundToTarget(fromIndex, row.targetId);
        Promise.resolve(share).catch(() => this.props.dispatch(showStandardAlert('assetImportError')));
    }
    dropFiles (files, row) {
        const {dispatch, vm} = this.props;
        if (this.assets.owns(row)) {
            this.assets.addFiles(files, this.assets.folderOfRow(row));
            return;
        }
        const fail = () => dispatch(showStandardAlert('assetImportError'));
        const byKind = {image: [], sound: [], sprite: [], extension: []};
        let unsupported = false;
        for (const file of files) {
            const kind = classifyFile(file);
            if (kind) byKind[kind].push(file);
            else unsupported = true;
        }
        const reject = list => {
            if (list.length) unsupported = true;
        };
        if (!row) {
            this.uploadFiles(byKind.sprite.concat(byKind.image), 'sprite', null);
            reject(byKind.sound);
            reject(byKind.extension);
        } else if (row.type === 'extensions' || row.type === 'extension') {
            reject(byKind.image);
            reject(byKind.sound);
            reject(byKind.sprite);
            this.loadExtensionFiles(byKind.extension);
        } else if (row.targetId) {
            const folder = row.type === 'folder' ? row.folderKind : row.type;
            if (folder === 'sound') {
                reject(byKind.image);
            } else if (byKind.image.length) {
                this.uploadFiles(byKind.image, 'costume', row.targetId);
            }
            if (folder === 'costume') {
                reject(byKind.sound);
            } else if (byKind.sound.length) {
                this.uploadFiles(byKind.sound, 'sound', row.targetId);
            }
            reject(byKind.sprite);
            reject(byKind.extension);
        }
        if (unsupported) fail();
        if (row && row.targetId && vm.editingTarget && vm.editingTarget.id !== row.targetId) {
            vm.setEditingTarget(row.targetId);
        }
    }
    loadExtensionFiles (files) {
        const {dispatch, vm} = this.props;
        if (!files.length) return;
        if (this.props.collaborating) {
            dispatch(showStandardAlert('assetImportError'));
            return;
        }
        Promise.all(files.map(file => file.text()))
            .then(sources => sources.reduce((chain, source, index) => chain.then(() =>
                vm.extensionManager.createExtension(source, {unsandboxed: false}).then(ids => {
                    for (const id of ids) rememberFileName(id, files[index].name);
                })), Promise.resolve()))
            .then(() => {
                if (vm.runtime && typeof vm.runtime.emitProjectChanged === 'function') vm.runtime.emitProjectChanged();
                this.handleRefreshEntries();
            })
            .catch(error => {
                log.error(error);
                dispatch(showStandardAlert('assetImportError'));
            });
    }
    activeEditorView () {
        return this.groupView(this.state.layout.focused);
    }
    textUndoState () {
        const tab = this.activeTab();
        if (!tab || tab.kind !== 'script') return null;
        const view = this.activeEditorView();
        const state = this.textState(tab.targetId);
        const editable = Boolean(view) && Boolean(state) && state.status === 'ready' && !state.draft &&
            !this.props.collaborating;
        return {
            targetId: tab.targetId,
            dirty: isDirty(state),
            canUndo: editable && undoDepth(view.state) > 0,
            canRedo: editable && redoDepth(view.state) > 0,
            undo: () => {
                undoText(view);
                view.focus();
            },
            redo: () => {
                redoText(view);
                view.focus();
            }
        };
    }
    handleTextHistory (view, direction) {
        const undo = direction === 'undo';
        if ((undo ? undoDepth : redoDepth)(view.state) > 0) return undo ? undoText(view) : redoText(view);
        const tab = this.activeTab();
        if (!tab || tab.kind !== 'script' || isCodeLocked(this.props.vm)) return false;
        if (isDirty(this.textState(tab.targetId))) return false;
        const entry = undo ? latestUndo(tab.targetId) : latestRedo(tab.targetId);
        if (!entry) return false;
        runCodeHistory({vm: this.props.vm, dispatch: this.props.dispatch, intl: this.props.intl, direction, entry});
        return true;
    }
    historyKeyFor (targetId, state) {
        if (!this.historyKeys) this.historyKeys = new Map();
        const kind = state && state.message && state.message.kind;
        if (state && state.tag && (kind === 'applied' || kind === 'undid' || kind === 'redid')) {
            const key = `${kind}:${state.tag.changeKey}`;
            if (this.historyKeys.get(targetId) !== key) this.historyKeys.set(targetId, key);
        }
        return this.historyKeys.get(targetId) || null;
    }
    getCursorBlock () {
        const tab = this.activeTab();
        if (!tab || tab.kind !== 'script') return null;
        const view = this.activeEditorView();
        const topId = view ? this.scriptAt(tab.targetId, view.state.selection.main.head) : null;
        return topId ? {targetId: tab.targetId, blockId: topId} : null;
    }
    scriptAt (targetId, offset) {
        const script = this.textState(targetId);
        if (!script || script.status !== 'ready' || offset === null) return null;
        for (const key of Object.keys(script.units || {})) {
            const range = script.units[key];
            if (unitKind(key) === 'script' && offset >= range.from && offset <= range.to) return unitId(key);
        }
        return null;
    }
    handleTextContextMenu (event) {
        const tab = this.activeTab();
        const view = this.activeEditorView();
        if (!tab || !view) return;
        event.preventDefault();
        const {intl} = this.props;
        const offset = view.posAtCoords({x: event.clientX, y: event.clientY});
        const topId = this.scriptAt(tab.targetId, offset);
        const script = this.textState(tab.targetId);
        const selection = view.state.selection.main;
        const selected = view.state.sliceDoc(selection.from, selection.to);
        const readOnly = this.props.collaborating || !script || script.status !== 'ready' || Boolean(script.draft);
        this.openMenu(event, [
            {
                label: intl.formatMessage(messages.goToDefinition),
                icon: Navigation,
                hint: 'F12',
                disabled: offset === null || !(assetAt(view.state.doc.toString(), offset) ||
                    symbolAt(view.state.doc.toString(), offset)),
                onClick: () => this.handleGoToDefinition(offset)
            },
            {
                label: intl.formatMessage(messages.findReferences),
                icon: SearchCode,
                hint: 'Shift+F12',
                disabled: offset === null || !this.symbolAt(tab, view, offset),
                onClick: () => this.handleFindReferences(offset)
            },
            {
                label: intl.formatMessage(messages.renameSymbol),
                icon: ReplaceAll,
                hint: 'F2',
                disabled: offset === null || readOnly || !this.symbolAt(tab, view, offset),
                onClick: () => this.handleRenameSymbol(offset)
            },
            {
                label: intl.formatMessage(messages.showBlock),
                icon: ArrowLeftRight,
                disabled: !topId,
                onClick: () => showBlock({
                    dispatch: this.props.dispatch,
                    vm: this.props.vm,
                    targetId: tab.targetId,
                    blockId: topId
                })
            },
            {
                label: intl.formatMessage(messages.openReference),
                icon: BookOpen,
                onClick: () => this.handlePanelTab('reference')
            },
            {
                label: intl.formatMessage(messages.discardChanges),
                icon: Undo2,
                disabled: !isDirty(script) || Boolean(script && script.draft),
                onClick: () => this.controller.revert(tab.targetId)
            },
            {
                label: intl.formatMessage(messages.copy),
                icon: Copy,
                disabled: !selected,
                onClick: () => {
                    if (navigator.clipboard) navigator.clipboard.writeText(selected).catch(() => {});
                }
            }
        ]);
    }
    handleRunAll () {
        const tab = this.activeTab();
        const target = tab && tab.targetId ? this.props.vm.runtime.getTargetById(tab.targetId) : null;
        if (target) this.props.vm.runtime.startHats('event_whenflagclicked', null, target);
    }
    handleStop () {
        const tab = this.activeTab();
        const target = tab && tab.targetId ? this.props.vm.runtime.getTargetById(tab.targetId) : null;
        if (target) this.props.vm.runtime.stopForTarget(target);
    }
    runtimeScriptProblems (targetId) {
        const {devState, intl} = this.props;
        const problems = [];
        for (const item of devState.scriptProblems[targetId] || []) {
            const line = this.blockLine(targetId, item.topId);
            problems.push({
                key: item.key,
                severity: 'error',
                message: intl.formatMessage(messages.scriptRuntimeError, {message: item.message}),
                line,
                jump: {targetId, topId: item.topId}
            });
        }
        ((devState.liveProblems || {})[targetId] || []).forEach((message, index) => {
            problems.push({
                key: `live:${index}`,
                severity: 'error',
                message: intl.formatMessage(messages.liveReloadProblem, {message})
            });
        });
        for (const [extensionId, list] of Object.entries(devState.runtimeProblems)) {
            for (const item of list) {
                if (item.targetId !== targetId || !item.blockId) continue;
                problems.push({
                    key: `ext:${extensionId}:${item.key}`,
                    severity: 'error',
                    message: intl.formatMessage(messages.extensionThrew, {
                        label: item.opcode ? item.opcode.replace('_', '.') : extensionId,
                        message: item.message,
                        file: `${extensionId}.js`,
                        line: item.line || '?'
                    }),
                    line: this.blockLine(targetId, item.blockId),
                    jump: {targetId, blockId: item.blockId}
                });
            }
        }
        return problems;
    }
    extensionProblems (entry) {
        const {devState, intl} = this.props;
        const problems = (devState.staticProblems[entry.id] || [])
            .concat(devState.loadProblems[entry.id] || [])
            .filter(problem => problem.severity === 'error' || problem.severity === 'warning')
            .map(problem => ({
                key: problem.key || `${problem.code || 'p'}:${problem.line}:${problem.message}`,
                severity: problem.severity,
                message: problem.text || problem.message,
                line: problem.line,
                column: problem.column
            }));
        for (const problem of devState.runtimeProblems[entry.id] || []) {
            const label = problem.targetId ? this.targetLabel(problem.targetId) : null;
            const callLine = label ? this.blockLine(problem.targetId, problem.blockId) : null;
            problems.push({
                key: problem.key,
                severity: 'error',
                message: label ? intl.formatMessage(messages.calledFrom, {
                    message: problem.text || problem.message,
                    file: label,
                    line: callLine || '?'
                }) : (problem.text || problem.message),
                line: problem.line,
                column: problem.column
            });
        }
        return problems;
    }
    scriptProblemCounts (targetId, script) {
        const counts = script && script.status === 'error' ?
            {errors: 1, warnings: 0, total: 1} :
            severityCounts(script && script.diagnostics);
        const runtime = this.runtimeScriptProblems(targetId).length;
        return {errors: counts.errors + runtime, warnings: counts.warnings, total: counts.total + runtime};
    }
    problemGroups () {
        const {vm} = this.props;
        const groups = [];
        const stage = vm.runtime.getTargetForStage();
        const targets = (stage ? [stage] : []).concat(orderedSprites(vm, this.props.sprites));
        for (const target of targets) {
            const script = this.textState(target.id);
            let problems = [];
            if (script && script.status === 'error') {
                problems = [{severity: 'error', message: script.error}];
            } else if (script) {
                problems = (script.diagnostics || []).map((item, index) => ({
                    key: `${item.code || 'd'}:${index}`,
                    severity: item.severity,
                    message: item.hint ? `${item.message}. ${item.hint}` : item.message,
                    line: item.line,
                    column: item.column,
                    from: item.from,
                    to: item.to
                }));
            }
            const all = problems.concat(this.runtimeScriptProblems(target.id));
            if (!all.length) continue;
            groups.push({
                key: `script:${target.id}`,
                title: SCRIPT_FILE,
                detail: target.getName(),
                tab: scriptTab(target.id),
                targetId: target.id,
                problems: all
            });
        }
        const live = (this.props.devState.liveProblems || {}).project || [];
        if (live.length) {
            groups.push({
                key: 'live:project',
                title: this.props.intl.formatMessage(messages.liveReload),
                problems: live.map((message, index) => ({
                    key: `live:${index}`,
                    severity: 'error',
                    message: this.props.intl.formatMessage(messages.liveReloadProblem, {message})
                }))
            });
        }
        for (const entry of this.state.entries) {
            const problems = this.extensionProblems(entry);
            if (!problems.length) continue;
            groups.push({
                key: `extension:${entry.id}`,
                title: extensionFileName(entry),
                detail: entry.name,
                extensionId: entry.id,
                problems
            });
        }
        return groups;
    }
    handlePanelOpenFile (group) {
        if (group.extensionId) this.handleReveal({kind: 'extension', id: group.extensionId});
        else if (group.tab) this.openFile(group.tab, {preview: false});
    }
    handlePanelJump (group, problem) {
        if (problem.jump) {
            this.jumpTo(problem.jump);
            return;
        }
        if (group.extensionId) {
            this.handleReveal({
                kind: 'extension',
                id: group.extensionId,
                location: problem.line ? {line: problem.line, column: problem.column} : null
            });
            return;
        }
        if (group.targetId && typeof problem.from === 'number') {
            this.pendingFocus = {targetId: group.targetId, from: problem.from, to: problem.to};
            this.openFile(group.tab, {preview: false});
            this.applyPendingFocus();
            return;
        }
        this.handlePanelOpenFile(group);
    }
    blockRange (targetId, blockId) {
        const script = this.textState(targetId);
        if (!script || script.status !== 'ready' || !blockId || !script.baseline) return null;
        if (script.doc !== script.baseline.text) return null;
        const map = script.baseline.sourceMap;
        const range = map && map.blocks ? map.blocks[blockId] : null;
        return range ? {from: range.from, to: range.to, line: range.line} : null;
    }
    blockLine (targetId, blockId) {
        const script = this.textState(targetId);
        const map = script && script.baseline && script.baseline.sourceMap;
        const range = map && map.blocks && blockId ? map.blocks[blockId] : null;
        return range && range.line ? range.line : null;
    }
    jumpTo (jump) {
        if (jump.extensionId) {
            this.handleReveal({
                kind: 'extension',
                id: jump.extensionId,
                location: jump.line ? {line: jump.line, column: jump.column} : null
            });
            return;
        }
        if (!jump.targetId || !this.props.vm.runtime.getTargetById(jump.targetId)) return;
        this.pendingFocus = {targetId: jump.targetId, blockId: jump.blockId || jump.topId};
        this.openFile(scriptTab(jump.targetId), {preview: false});
        this.applyPendingFocus();
    }
    targetLabel (targetId) {
        const target = this.props.vm.runtime.getTargetById(targetId);
        if (!target) return null;
        return target.isStage ? `${this.props.intl.formatMessage(messages.stage)}/${SCRIPT_FILE}` :
            `${target.getName()}/${SCRIPT_FILE}`;
    }
    outputLocation (entry) {
        if (entry.extensionId && entry.line) return `${entry.extensionId}.js:${entry.line}`;
        if (entry.targetId && (entry.blockId || entry.topId)) {
            const label = this.targetLabel(entry.targetId);
            if (!label) return null;
            const line = this.blockLine(entry.targetId, entry.blockId || entry.topId);
            return line ? `${label}:${line}` : label;
        }
        return entry.extensionId ? `${entry.extensionId}.js` : null;
    }
    handleOutputJump (entry) {
        if (entry.extensionId && (entry.line || !entry.targetId)) {
            this.jumpTo({extensionId: entry.extensionId, line: entry.line, column: entry.column});
        } else if (entry.targetId) {
            this.jumpTo({targetId: entry.targetId, blockId: entry.blockId, topId: entry.topId});
        }
    }
    handleClearOutput () {
        this.props.dispatch(clearExtensionOutput(null));
    }
    handleOpenDebugHelp () {
        this.props.dispatch(openHelp('ext-debugging'));
    }
    handleInsertReference (item) {
        const group = this.orderedGroups().find(each => {
            const tab = activeTabOf(each);
            return tab && tab.kind === 'script';
        });
        const view = group ? this.groupView(group.id) : null;
        if (!view || view.state.readOnly) return;
        const {from, to} = view.state.selection.main;
        view.dispatch({
            changes: {from, to, insert: item.insert},
            selection: {anchor: from + item.insert.length},
            userEvent: 'input.complete'
        });
        view.focus();
    }
    handleSessionChanged () {
        this.handleTextsChanged();
    }
    confirmExtension (impact) {
        return confirmExtensionImpact(this.props.dispatch, this.props.intl, impact);
    }
    handleExtensionApplied () {
        this.handleRefreshEntries();
    }
    handleExtensionShowProblems () {
        writePreference(PANEL_OPEN_KEY, true);
        this.setState({panelTab: 'problems', panelOpen: true});
    }
    handleExtensionFocusHandled (at) {
        this.setState(state => (state.extensionFocus && state.extensionFocus.at === at ?
            {extensionFocus: null} : null));
    }
    handleRunUnsandboxed (entry) {
        const {dispatch, intl, vm} = this.props;
        if (this.props.collaborating) return Promise.resolve(false);
        return runUnsandboxed({
            vm,
            dispatch,
            intl,
            messages: extensionMessages,
            entry,
            fileName: fileNameOf(entry.id),
            confirm: this.confirmExtension
        }).then(ok => {
            this.handleRefreshEntries();
            return ok;
        });
    }
    pollRunning () {
        for (const group of this.state.layout.groups) {
            const tab = activeTabOf(group);
            const view = tab && tab.kind === 'script' ? this.groupView(group.id) : null;
            if (!view) continue;
            const running = [];
            for (const thread of this.props.vm.runtime.threads) {
                if (thread.isKilled || thread.status === 4 || thread.updateMonitor || !thread.target) continue;
                const target = thread.target.sprite && thread.target.sprite.clones[0];
                if ((target || thread.target).id === tab.targetId) running.push(thread.topBlock);
            }
            setRunning(view, running);
            this.debug.syncView(view, tab.targetId);
        }
    }
    showMessage (targetId, text) {
        this.controller.setMessage(targetId, {kind: 'info', text});
    }
    handleGoToDefinition (offset = null) {
        const tab = this.activeTab();
        const view = this.activeEditorView();
        if (!tab || tab.kind !== 'script' || !view) return false;
        const {intl, vm} = this.props;
        const at = offset === null ? view.state.selection.main.head : offset;
        const doc = view.state.doc.toString();
        const asset = assetAt(doc, at);
        if (asset) return this.assets.goTo(asset, tab.targetId);
        const symbol = symbolAt(doc, at);
        if (!symbol) return false;
        const name = symbol.kind === 'extension' ? `${symbol.id}.${symbol.member}` : symbol.name;
        const notFound = () => this.showMessage(tab.targetId, intl.formatMessage(messages.noDefinition, {name}));
        if (symbol.kind === 'procedure') {
            const range = procedureDefinition(doc, symbol.name);
            if (!range) return notFound();
            this.setState({focus: {targetId: tab.targetId, from: range.from, to: range.to, at: Date.now()}});
            return true;
        }
        if (symbol.kind === 'broadcast') {
            const receivers = broadcastReceivers(vm, symbol.name);
            if (!receivers.length) return notFound();
            if (receivers.length === 1) {
                this.jumpTo({targetId: receivers[0].targetId, blockId: receivers[0].blockId});
                return true;
            }
            const coords = view.coordsAtPos(at) || {left: 0, bottom: 0};
            this.setState({menu: {
                x: coords.left,
                y: coords.bottom + 2,
                items: receivers.map(receiver => ({
                    label: intl.formatMessage(messages.receiverIn, {
                        name: symbol.name,
                        target: receiver.targetName || intl.formatMessage(messages.stage)
                    }),
                    icon: Navigation,
                    onClick: () => this.jumpTo({targetId: receiver.targetId, blockId: receiver.blockId})
                }))
            }});
            return true;
        }
        const definition = extensionForSymbol(vm, symbol);
        if (!definition) return notFound();
        this.handleReveal({kind: 'extension', id: definition.id, location: {opcode: definition.opcode}});
        return true;
    }
    symbolAt (tab, view, offset) {
        if (!tab || tab.kind !== 'script' || !view) return null;
        return editableSymbol(this.props.vm, tab.targetId, view.state.doc.toString(), offset);
    }
    handleFindReferences (offset = null) {
        const tab = this.activeTab();
        const view = this.activeEditorView();
        const at = view && offset === null ? view.state.selection.main.head : offset;
        const symbol = this.symbolAt(tab, view, at);
        if (!symbol) return false;
        const {intl, vm} = this.props;
        const references = findReferences(vm, tab.targetId, symbol, view.state.doc.toString());
        if (!references.length) {
            this.showMessage(tab.targetId, intl.formatMessage(messages.noReferences, {name: symbol.name}));
            return true;
        }
        this.showMessage(tab.targetId, intl.formatMessage(messages.referenceCount, {
            count: references.length,
            name: symbol.name
        }));
        const jump = reference => {
            if (reference.blockId) {
                this.jumpTo(reference);
                return;
            }
            this.setState({focus: {targetId: tab.targetId, from: reference.from, to: reference.to, at: Date.now()}});
        };
        const location = reference => {
            const label = this.targetLabel(reference.targetId);
            const line = reference.blockId ? this.blockLine(reference.targetId, reference.blockId) :
                view.state.doc.lineAt(reference.from).number;
            return line ? `${label}:${line}` : label;
        };
        const shown = references.slice(0, MAX_REFERENCE_ITEMS);
        const items = shown.map(reference => ({
            label: intl.formatMessage(messages.referenceIn, {name: symbol.name, location: location(reference)}),
            icon: Navigation,
            onClick: () => jump(reference)
        }));
        if (references.length > shown.length) {
            items.push({
                label: intl.formatMessage(messages.moreReferences, {count: references.length - shown.length}),
                disabled: true,
                onClick: () => {}
            });
        }
        const coords = view.coordsAtPos(at) || {left: 0, bottom: 0};
        this.setState({menu: {x: coords.left, y: coords.bottom + 2, items}});
        return true;
    }
    async handleRenameSymbol (offset = null) {
        const tab = this.activeTab();
        const view = this.activeEditorView();
        const at = view && offset === null ? view.state.selection.main.head : offset;
        const symbol = this.symbolAt(tab, view, at);
        if (!symbol) return false;
        const {dispatch, intl, vm} = this.props;
        const state = this.textState(tab.targetId);
        if (this.props.collaborating || !state || state.status !== 'ready' || state.draft) return true;
        const procedure = symbol.kind === 'procedure';
        if (!procedure && dirtyTargetIds().length) {
            this.showMessage(tab.targetId, intl.formatMessage(messages.renameDirty));
            return true;
        }
        const entered = await promptText(dispatch, {
            title: intl.formatMessage(messages.renameTitle, {name: symbol.name}),
            message: intl.formatMessage(messages.renameMessage),
            defaultValue: symbol.name
        });
        const name = entered === null ? '' : entered.trim();
        if (!name || name === symbol.name) return true;
        if (procedure) return this.renameProcedure(tab, symbol, name);
        if (this.props.collaborating || dirtyTargetIds().length) {
            this.showMessage(tab.targetId, intl.formatMessage(messages.renameDirty));
            return true;
        }
        const renamed = symbol.kind === 'broadcast' ?
            vm.renameBroadcast(symbol.id, name) :
            vm.renameVariable(symbol.id, name);
        if (!renamed) {
            this.showMessage(tab.targetId, intl.formatMessage(messages.renameTaken, {name}));
            return true;
        }
        await Promise.all(allTexts().map(([targetId]) => (this.controller.isStale(targetId) ?
            this.controller.regenerate(targetId) : null)));
        this.showMessage(tab.targetId, intl.formatMessage(messages.renamed, {from: symbol.name, to: name}));
        return true;
    }
    renameProcedure (tab, symbol, name) {
        const {intl} = this.props;
        if (!/^[A-Za-z_]\w*$/.test(name)) {
            this.showMessage(tab.targetId, intl.formatMessage(messages.renameInvalid));
            return true;
        }
        const view = this.activeEditorView();
        if (!view) return true;
        if (procedureDefinition(view.state.doc.toString(), name)) {
            this.showMessage(tab.targetId, intl.formatMessage(messages.renameTaken, {name}));
            return true;
        }
        const changes = procedureRenameChanges(view.state.doc.toString(), symbol.name, name);
        if (!changes.length) return true;
        view.dispatch({changes});
        this.handleApply();
        return true;
    }
    textMessages (targetId, state) {
        const {intl} = this.props;
        const m = (descriptor, values) => intl.formatMessage(descriptor, values);
        const items = [];
        if (!state || state.status === 'loading') {
            return [{key: 'loading', icon: LoaderCircle, text: m(messages.loading)}];
        }
        if (state.status === 'error') {
            const text = m(messages.emitFailed, {message: state.error});
            return [{key: 'error', icon: CircleAlert, text, error: true}];
        }
        if (this.props.collaborating) {
            items.push({key: 'collaboration', icon: Users, text: m(messages.collaborating)});
        }
        if (state.conflicts && state.conflicts.length) {
            items.push({
                key: 'conflicts',
                icon: GitMerge,
                text: m(messages.conflicts, {count: state.conflicts.length}),
                action: {
                    label: m(messages.resolve),
                    icon: GitMerge,
                    onClick: () => this.setOverlay(targetId, {kind: 'conflicts'})
                }
            });
        }
        if (state.draft) {
            items.push({key: 'draft', icon: History, text: m(messages.staleDraft)});
        }
        const message = state.message;
        if (message && message.kind === 'refused') {
            items.push({
                key: 'refused',
                icon: CircleAlert,
                error: true,
                text: refusalText(this.props.intl, message)
            });
        }
        const counts = severityCounts(state.diagnostics);
        if (counts.errors) {
            items.push({
                key: 'problems',
                icon: CircleAlert,
                error: true,
                text: m(messages.problemCount, {count: counts.errors}),
                action: {label: m(messages.showProblems), onClick: () => this.handlePanelTab('problems')}
            });
        }
        const locked = (state.lockedScripts || []).length;
        if (locked) {
            items.push({
                key: 'locked',
                icon: Lock,
                text: m(messages.lockedScripts, {count: locked}),
                tooltip: m(messages.readOnlyHint)
            });
        }
        if (state.applying) items.push({key: 'applying', icon: LoaderCircle, text: m(messages.applying)});
        if (message && message.kind === 'applied') items.push({key: 'applied', icon: Check, text: m(messages.applied)});
        if (message && message.kind === 'restored') {
            items.push({key: 'restored', icon: History, text: m(messages.restoredDraft)});
        }
        if (message && message.kind === 'undid') {
            const entry = latestRedo(targetId);
            items.push({
                key: 'undid',
                icon: Undo2,
                text: m(messages.undidCodeChange),
                action: entry && !this.props.collaborating ? {
                    label: m(messages.redo),
                    icon: Redo2,
                    onClick: () => runCodeHistory({
                        vm: this.props.vm,
                        dispatch: this.props.dispatch,
                        intl,
                        direction: 'redo',
                        entry
                    })
                } : null
            });
        }
        if (message && message.kind === 'redid') {
            items.push({key: 'redid', icon: Redo2, text: m(messages.redidCodeChange)});
        }
        if (message && message.kind === 'info') items.push({key: 'info', icon: Info, text: message.text});
        if (message && message.kind === 'cancelled') {
            items.push({key: 'cancelled', icon: X, text: m(messages.applyCancelled)});
        }
        return items;
    }
    textOverlay (targetId, state) {
        const {intl} = this.props;
        const m = descriptor => intl.formatMessage(descriptor);
        if (!state || state.status !== 'ready') return null;
        if (state.draft) {
            return {
                title: m(messages.staleDraft),
                beforeLabel: m(messages.currentBlocks),
                afterLabel: m(messages.yourText),
                sections: [{
                    key: 'draft',
                    before: state.draft.baseText,
                    after: state.draft.text,
                    actions: [
                        {label: m(messages.copy),
                            icon: Copy,
                            primary: true,
                            onClick: () => {
                                if (!navigator.clipboard) return;
                                navigator.clipboard.writeText(state.draft.text).catch(() => {});
                            }},
                        {label: m(messages.discard),
                            icon: Trash2,
                            onClick: () => this.controller.discardDraft(targetId)}
                    ]
                }]
            };
        }
        const overlay = this.state.overlays[targetId];
        if (!overlay) return null;
        const close = () => this.setOverlay(targetId, null);
        if (overlay.kind === 'conflicts') {
            const conflicts = state.conflicts || [];
            if (!conflicts.length) return null;
            return {
                title: m(messages.resolveTitle),
                beforeLabel: m(messages.yourText),
                afterLabel: m(messages.blockVersion),
                closeLabel: m(messages.close),
                onClose: close,
                sections: conflicts.map(conflict => ({
                    key: conflict.key,
                    label: String(conflict.mine || conflict.theirs || '').split('\n')[0],
                    before: conflict.mine || '',
                    after: conflict.theirs || '',
                    actions: [
                        {label: m(conflict.kind === 'deleted' ? messages.keepMyScript : messages.keepMine),
                            primary: true,
                            onClick: () => this.controller.resolve(targetId, conflict.key, 'mine')},
                        {label: m(conflict.kind === 'deleted' ? messages.deleteIt : messages.useBlocks),
                            onClick: () => this.controller.resolve(targetId, conflict.key, 'theirs')}
                    ]
                }))
            };
        }
        if (overlay.kind === 'changes') {
            return {
                title: m(messages.changesSinceApply),
                beforeLabel: m(messages.afterApply),
                afterLabel: m(messages.currentBlocks),
                closeLabel: m(messages.close),
                onClose: close,
                sections: [{key: 'changes', before: overlay.before || '', after: state.baseline.text}]
            };
        }
        return null;
    }
    tabDescriptors (group) {
        const {vm} = this.props;
        return group.tabs.map(tab => {
            const resolved = resolveTab(vm, tab, this.state.entries);
            let title = resolved.title || '';
            if (tab.kind === 'newExtension') title = this.props.intl.formatMessage(messages.newExtensionTab);
            if (tab.kind === 'removeExtensions') title = this.props.intl.formatMessage(messages.removeExtensionsTab);
            if (tab.kind === 'reference') title = this.props.intl.formatMessage(messages.reference);
            return {
                key: tab.key,
                kind: tab.kind,
                title,
                detail: resolved.detail || null,
                dirty: (tab.kind === 'script' && isDirty(this.textState(tab.targetId))) ||
                    (tab.kind === 'extension' && getDraft(tab.extensionId) !== null) ||
                    (tab.kind === 'customAsset' && this.assets.isDirty(tab))
            };
        });
    }
    createExtension (tab, source, unsandboxed) {
        const {dispatch, intl, vm} = this.props;
        if (this.props.collaborating) return Promise.reject(new Error(intl.formatMessage(messages.collaborating)));
        return createExtensionFromSource({vm, dispatch, intl, messages: extensionMessages, source, unsandboxed})
            .then(ids => {
                const entries = getEntries(vm);
                this.setState(state => ({entries, layout: closeEverywhere(state.layout, tab.key)}), () => {
                    if (ids[0]) this.openFile(extensionTab(ids[0]), {preview: false});
                });
            });
    }
    removeExtensions (tab, ids) {
        const {dispatch, intl, vm} = this.props;
        if (this.props.collaborating) return Promise.reject(new Error(intl.formatMessage(messages.collaborating)));
        return removeExtensionsFromProject({
            vm,
            dispatch,
            intl,
            messages: extensionMessages,
            ids,
            projectTitle: this.props.projectTitle
        }).then(() => {
            this.setState(state => ({entries: getEntries(vm), layout: closeEverywhere(state.layout, tab.key)}));
        });
    }
    renderExtensionTab (tab, entry, focused) {
        const {devState, dispatch, vm} = this.props;
        const focus = this.state.extensionFocus;
        const stateKey = `${devState.generation}:${entry.id}`;
        return (
            <div className={styles.extensionHost}>
                <EditorPane
                    applyHint={formatShortcutDisplay(getShortcutKey('applyFile', this.props.customShortcuts))}
                    applyRef={focused ? this.extensionApply : null}
                    confirmImpact={this.confirmExtension}
                    dark={this.props.dark}
                    dispatch={dispatch}
                    draftIdentity={this.controller.identity ? this.controller.identity() : null}
                    entry={entry}
                    focus={focused && focus && focus.extensionId === entry.id ? focus : null}
                    key={stateKey}
                    loadProblems={devState.loadProblems[entry.id] || EMPTY}
                    locked={this.props.collaborating}
                    projectTitle={this.props.projectTitle}
                    runtimeProblems={devState.runtimeProblems[entry.id] || EMPTY}
                    stateKey={stateKey}
                    vm={vm}
                    onApplied={this.handleExtensionApplied}
                    onEntriesChanged={this.handleRefreshEntries}
                    onFocusHandled={this.handleExtensionFocusHandled}
                    onRemove={ids => this.handleReveal({kind: 'removeExtensions', ids})}
                    onRunUnsandboxed={this.handleRunUnsandboxed}
                    onSetLoadProblems={(id, problems) => dispatch(setLoadProblems(id, problems))}
                    onSetStaticProblems={(id, problems) => dispatch(setStaticProblems(id, problems))}
                    onShowProblems={this.handleExtensionShowProblems}
                />
            </div>
        );
    }
    renderEditor (group) {
        const {intl, vm} = this.props;
        const tab = activeTabOf(group);
        const focused = group.id === this.state.layout.focused;
        if (!tab) {
            const hint = formatShortcutDisplay(getShortcutKey('quickOpen', this.props.customShortcuts));
            return (
                <div className={styles.emptyEditor}>
                    <p>{intl.formatMessage(messages.emptyEditor)}</p>
                    <div className={styles.emptyActions}>
                        <button
                            className={styles.primaryButton}
                            type="button"
                            onClick={this.handleOpenQuickOpen}
                        >
                            <Search size={14} />
                            <span>{intl.formatMessage(messages.quickOpen)}</span>
                            {hint ? <kbd className={styles.kbd}>{hint}</kbd> : null}
                        </button>
                        <button
                            className={styles.secondaryButton}
                            disabled={this.props.collaborating}
                            type="button"
                            onClick={() => this.handleReveal({kind: 'newExtension'})}
                        >
                            <FilePlus2 size={14} />
                            <span>{intl.formatMessage(messages.newExtension)}</span>
                        </button>
                    </div>
                </div>
            );
        }
        const resolved = resolveTab(vm, tab, this.state.entries);
        if (!resolved.exists) return null;
        if (tab.kind === 'script') {
            const focus = this.state.focus;
            const state = this.textState(tab.targetId);
            const ready = Boolean(state) && state.status === 'ready';
            return (
                <TextTab
                    applyDisabled={!this.canApplyState(state)}
                    applyAllDisabled={!this.canApplyAll()}
                    applyAllHint={formatShortcutDisplay(getShortcutKey('applyAll', this.props.customShortcuts))}
                    applyHint={formatShortcutDisplay(getShortcutKey('applyFile', this.props.customShortcuts))}
                    completion={this.completion}
                    dark={this.props.dark}
                    diagnostics={(state && state.diagnostics) || EMPTY}
                    extensions={this.extensionsFor(tab.targetId)}
                    focus={focused && focus && focus.targetId === tab.targetId ? focus : null}
                    key={tab.key}
                    historyKey={this.historyKeyFor(tab.targetId, state)}
                    keymap={this.textKeymap}
                    messages={this.textMessages(tab.targetId, state)}
                    overlay={this.textOverlay(tab.targetId, state)}
                    readOnly={!ready || this.props.collaborating || Boolean(state.draft)}
                    tabKey={`${this.state.projectKey}:${tab.key}${group.id === 'g0' ? '' : `:${group.id}`}`}
                    value={ready ? state.doc : ''}
                    onApply={this.handleApply}
                    onApplyAll={this.applyAllTargets().length > 1 ? this.handleApplyAll : null}
                    onChange={(text, changes) => this.handleTextChange(group.id, tab, text, changes)}
                    onContextMenu={this.handleTextContextMenu}
                    onReady={view => this.handleEditorReady(tab, view)}
                    onRunAll={this.handleRunAll}
                    onStop={this.handleStop}
                />
            );
        }
        if (tab.kind === 'extension') return this.renderExtensionTab(tab, resolved.entry, focused);
        if (tab.kind === 'reference') {
            return (
                <div
                    className={styles.referenceTab}
                    data-mw-region="panel"
                >
                    <ReferenceView
                        groups={referenceGroups(vm)}
                        onInsert={this.handleInsertReference}
                    />
                </div>
            );
        }
        if (tab.kind === 'newExtension') {
            return (
                <div className={styles.extensionHost}>
                    <NewPane
                        key={tab.source || 'new'}
                        source={tab.source}
                        vm={vm}
                        onCancel={() => this.handleCloseTab(tab.key)}
                        onCreate={(source, unsandboxed) => this.createExtension(tab, source, unsandboxed)}
                    />
                </div>
            );
        }
        if (tab.kind === 'removeExtensions') {
            const devState = this.props.devState;
            return (
                <div className={styles.extensionHost}>
                    <RemovePane
                        entries={this.state.entries}
                        ids={resolved.ids}
                        patches={resolved.ids.some(id => (devState.staticProblems[id] || [])
                            .some(problem => problem.code === 'patches-internals'))}
                        vm={vm}
                        onCancel={() => this.handleCloseTab(tab.key)}
                        onConfirm={ids => this.removeExtensions(tab, ids)}
                    />
                </div>
            );
        }
        if (tab.kind === 'customAsset') return this.assets.render(tab, resolved, group);
        return (
            <AssetTab
                blocked={!mountsAssetEditor(this.state.layout, group.id)}
                editingTargetId={this.props.editingTarget}
                index={resolved.index}
                ownerName={resolved.target.getName()}
                soundSupported={Boolean(vm.runtime.audioEngine && SharedAudioContext())}
                tab={tab}
                onOpenToEdit={() => {
                    this.handleFocusGroup(group.id);
                    if (tab.targetId !== this.props.editingTarget) vm.setEditingTarget(tab.targetId);
                }}
            />
        );
    }
    renderDropTarget (group) {
        const zone = this.state.dropZone && this.state.dropZone.groupId === group.id ? this.state.dropZone.zone : null;
        return (
            <div
                className={styles.dropCatcher}
                onDragLeave={event => {
                    if (event.currentTarget.contains(event.relatedTarget)) return;
                    if (this.state.dropZone && this.state.dropZone.groupId === group.id) {
                        this.setState({dropZone: null});
                    }
                }}
                onDragOver={event => this.handleAreaDragOver(group.id, event)}
                onDrop={event => this.handleAreaDrop(group.id, event)}
            >
                {zone ? (
                    <div
                        className={classNames(styles.dropZone, {
                            [styles.dropZoneEnd]: zone === 'end',
                            [styles.dropZoneBottom]: zone === 'bottom'
                        })}
                    />
                ) : null}
            </div>
        );
    }
    renderSpriteProperties () {
        const sprite = this.props.sprites && this.props.sprites[this.props.editingTarget];
        if (!sprite) return null;
        return (
            <SpriteProperties
                sprite={sprite}
                vm={this.props.vm}
            />
        );
    }
    renderGroups (explorerVisible) {
        const {intl} = this.props;
        const {layout} = this.state;
        const split = layout.groups.length > 1;
        const nodes = [];
        layout.groups.forEach((group, index) => {
            if (index) {
                nodes.push(
                    <div
                        aria-label={intl.formatMessage(messages.resizeGroups)}
                        aria-orientation={layout.direction === 'row' ? 'vertical' : 'horizontal'}
                        className={layout.direction === 'row' ? styles.groupResizer : styles.groupResizerStacked}
                        key="resizer"
                        role="separator"
                        tabIndex={0}
                        onKeyDown={this.handleGroupResizeKeyDown}
                        onPointerDown={this.handleGroupResizePointerDown}
                    />
                );
            }
            nodes.push(
                <div
                    className={styles.editorGroup}
                    key={group.id}
                    style={split ? {flex: `${index ? 1 - layout.ratio : layout.ratio} 1 0`} : null}
                    onFocusCapture={() => this.handleFocusGroup(group.id)}
                    onPointerDownCapture={() => this.handleFocusGroup(group.id)}
                >
                    <EditorTabs
                        activeKey={group.activeKey}
                        explorerHint={index ? null : formatShortcutDisplay(
                            getShortcutKey('toggleExplorer', this.props.customShortcuts))}
                        explorerOpen={explorerVisible}
                        focused={!split || group.id === layout.focused}
                        previewKey={group.previewKey}
                        rtl={this.props.isRtl}
                        tabs={this.tabDescriptors(group)}
                        onActivate={key => this.handleActivateTab(key, group.id)}
                        onClose={key => this.handleCloseTab(key, group.id)}
                        onContextMenu={(key, event) => this.handleTabContextMenu(group.id, key, event)}
                        onPin={key => this.handlePinTab(key, group.id)}
                        onTabDragEnd={this.handleTabDragEnd}
                        onTabDragStart={key => this.handleTabDragStart(group.id, key)}
                        onTabDrop={at => this.handleTabDrop(group.id, at)}
                        onToggleExplorer={index ? null : this.handleToggleExplorer}
                    />
                    <div
                        className={styles.editorArea}
                        ref={this.groupAreaRef(group.id)}
                    >
                        {this.renderEditor(group)}
                        {this.state.tabDrag ? this.renderDropTarget(group) : null}
                    </div>
                </div>
            );
        });
        return (
            <div
                className={classNames(styles.editorColumn, {
                    [styles.editorColumnStacked]: split && layout.direction === 'column'
                })}
                ref={this.setGroupsNode}
            >
                {nodes}
            </div>
        );
    }
    render () {
        const {intl} = this.props;
        const drawer = this.isDrawer();
        const explorerVisible = drawer ? this.state.drawerOpen : this.state.explorerOpen;
        const rows = this.buildRows();
        const explorer = explorerVisible ? (
            <Explorer
                activeKey={this.focusedTabs().activeKey}
                canDrop={this.canDrop}
                dropKey={this.state.dropKey}
                footer={this.renderSpriteProperties()}
                renamingKey={this.state.renamingKey}
                rows={rows}
                selectedKey={this.state.selectedKey}
                style={drawer ? null : {width: `${this.state.explorerWidth}px`}}
                onCancelRename={this.handleCancelRename}
                onCommitRename={this.handleCommitRename}
                onContextMenu={this.handleExplorerContextMenu}
                onDelete={this.handleExplorerDelete}
                onDragHover={this.handleDragHover}
                onDragStart={this.handleDragStart}
                onDrop={this.handleDrop}
                onOpen={this.handleExplorerOpen}
                onRename={this.handleExplorerRename}
                onRootMenu={this.handleRootMenu}
                onSelect={this.handleExplorerSelect}
                onToggle={this.handleExplorerToggle}
            />
        ) : null;
        return (
            <div
                className={styles.workbench}
                dir={this.props.isRtl ? 'rtl' : 'ltr'}
                ref={this.setRoot}
            >
                <div className={styles.workbenchBody}>
                    {drawer ? (
                        explorer ? (
                            <div className={styles.drawerLayer}>
                                <div className={styles.drawer}>{explorer}</div>
                                <button
                                    aria-label={intl.formatMessage(messages.toggleExplorer)}
                                    className={styles.drawerScrim}
                                    type="button"
                                    onClick={this.handleToggleExplorer}
                                />
                            </div>
                        ) : null
                    ) : (
                        <React.Fragment>
                            {explorer}
                            {explorer ? (
                                <div
                                    aria-label={intl.formatMessage(messages.resizeExplorer)}
                                    aria-orientation="vertical"
                                    className={styles.explorerResizer}
                                    role="separator"
                                    tabIndex={0}
                                    onKeyDown={this.handleExplorerResizeKeyDown}
                                    onPointerDown={this.handleExplorerResizePointerDown}
                                />
                            ) : null}
                        </React.Fragment>
                    )}
                    {this.renderGroups(explorerVisible)}
                </div>
                <Panel
                    groups={this.problemGroups()}
                    open={this.state.panelOpen}
                    output={this.props.devState.output}
                    outputLocation={this.outputLocation}
                    reference={this.state.panelOpen && this.state.panelTab === 'reference' ?
                        referenceGroups(this.props.vm) : EMPTY}
                    tab={this.state.panelTab}
                    onClearOutput={this.handleClearOutput}
                    onInsertReference={this.handleInsertReference}
                    onOpenReferenceTab={this.handleOpenReferenceTab}
                    onJump={this.handlePanelJump}
                    onOpenHelp={this.handleOpenDebugHelp}
                    onOutputJump={this.handleOutputJump}
                    onOpenFile={this.handlePanelOpenFile}
                    onTab={this.handlePanelTab}
                    onToggle={this.handleTogglePanel}
                    watch={this.debug.watchProps}
                />
                <input
                    className={styles.hiddenInput}
                    multiple
                    ref={this.setFileInput}
                    tabIndex={-1}
                    type="file"
                    onChange={this.handleFileInputChange}
                />
                {this.state.quickOpen ? (
                    <QuickOpen
                        files={listFiles(this.props.vm, this.props.sprites, this.state.entries).concat([{
                            tab: referenceTab(),
                            title: intl.formatMessage(messages.reference),
                            detail: null,
                            kind: 'reference'
                        }])}
                        onClose={this.handleCloseQuickOpen}
                        onPick={this.handlePickQuickOpen}
                    />
                ) : null}
                {this.state.menu ? (
                    <ContextMenu
                        items={this.state.menu.items}
                        x={this.state.menu.x}
                        y={this.state.menu.y}
                        onClose={this.handleCloseMenu}
                    />
                ) : null}
            </div>
        );
    }
}

CodeWorkbench.propTypes = {
    collaborating: PropTypes.bool,
    customShortcuts: PropTypes.object,
    dark: PropTypes.bool,
    devState: PropTypes.object.isRequired,
    dispatch: PropTypes.func.isRequired,
    editingTarget: PropTypes.string,
    intl: intlShape,
    isRtl: PropTypes.bool,
    projectTitle: PropTypes.string,
    reveal: PropTypes.object,
    spritePaneVisible: PropTypes.bool,
    sprites: PropTypes.object,
    stage: PropTypes.object,
    vm: PropTypes.object.isRequired
};

const mapStateToProps = state => ({
    collaborating: isCollaborating(state),
    projectTitle: state.scratchGui.projectTitle,
    customShortcuts: state.scratchGui.shortcuts && state.scratchGui.shortcuts.customShortcuts,
    dark: Boolean(state.scratchGui.theme.theme && state.scratchGui.theme.theme.isDark()),
    devState: state.scratchGui.extensionDev,
    editingTarget: state.scratchGui.targets.editingTarget,
    isRtl: state.locales.isRtl,
    reveal: state.scratchGui.editorTab.reveal,
    sprites: state.scratchGui.targets.sprites,
    stage: state.scratchGui.targets.stage,
    vm: state.scratchGui.vm
});

export {CodeWorkbench};
export default injectIntl(connect(mapStateToProps)(CodeWorkbench));
