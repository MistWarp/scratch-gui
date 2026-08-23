/* eslint-disable react/no-unused-prop-types */
/* eslint-disable no-unused-vars */
import classNames from 'classnames';
import {connect} from 'react-redux';
import {compose} from 'redux';
import {defineMessages, FormattedMessage, injectIntl, intlShape} from 'react-intl';
import PropTypes from 'prop-types';
import bindAll from 'lodash.bindall';
import {isMac} from '../../lib/utils/browser';
import React from 'react';

import VM from 'scratch-vm';

import Box from '../box/box.jsx';
import Button from '../button/button.jsx';
import CommunityButton from './community-button.jsx';
import ShareButton from './share-button.jsx';
import openMistWarpShareWindow from '../../lib/mw/open-mw-share-window.js';
import requestVersionMessage from '../../lib/mw/request-version-message.jsx';
import {
    getRememberedPlatformProjectState,
    getMistWarpAction,
    rememberPlatformProject
} from '../../lib/community/publish.js';
import {getProject as getMistWarpProject} from '../../lib/community/api.js';
import communityEnabled from '../../lib/community/enabled.js';
import {ComingSoonTooltip} from '../coming-soon/coming-soon.jsx';
import Divider from '../divider/divider.jsx';
// import SaveStatus from './save-status.jsx';
import ProjectWatcher from '../../containers/project-watcher.jsx';
import MenuBarMenu from './menu-bar-menu.jsx';
import MenuLabel from './tw-menu-label.jsx';
import {MenuItem, MenuSection, Submenu} from '../menu/menu.jsx';
import ProjectTitleInput from './project-title-input.jsx';
import AuthorInfo from './author-info.jsx';
import SB3Downloader from '../../containers/sb3-downloader.jsx';
import DeletionRestorer from '../../containers/deletion-restorer.jsx';
import TurboMode from '../../containers/turbo-mode.jsx';
import MenuBarHOC from '../../containers/menu-bar-hoc.jsx';
import SettingsMenu from './settings-menu.jsx';
import TWViewCounter from './tw-view-counter.jsx';

import ChangeUsername from '../../containers/tw-change-username.jsx';
import CloudVariablesToggler from '../../containers/tw-cloud-toggler.jsx';
import TWSaveStatus from './tw-save-status.jsx';
import TWNews from './tw-news.jsx';
import CollaborationContainer from '../../containers/collaboration-container.jsx';
import {
    commitProject,
    getDefaultAuthor,
    repoExists,
    getRemotes,
    push as gitPush,
    pull as gitPull,
    REPO_DIR as GIT_REPO_DIR,
    getFs as getGitFs
} from '../../lib/git/browser-git';
import {buildSb3FromFractchTree} from '../../lib/git/fractch-tree';
import {createMwp} from '../../lib/git/mwp.js';
import {
    getProjectHistoryState,
    preloadProjectHistory,
    subscribeProjectHistory
} from '../../lib/git/project-history.js';
import downloadBlob from '../../lib/utils/download-blob.js';
import {projectFilename} from '../../lib/utils/safe-filename.js';
import RestorePointAPI from '../../lib/api/restore-points';

import TWDesktopSettings from './tw-desktop-settings.jsx';
import RoturAccount from './mw-rotur-account.jsx';
import MwEditorNav from './mw-editor-nav.jsx';
import CollabPresence from './mw-collab-presence.jsx';

import {FEEDBACK_URL, APP_NAME} from '../../lib/constants/brand.js';

import {
    openTipsLibrary,
    openSettingsModal,
    openRestorePointModal,
    openProjectMetadataModal,
    openGitModal,
    openExtensionManagerModal,
    openHelp,
    openSimpleDialog
} from '../../reducers/modals';
import {openCollaborationModal} from '../../reducers/collaboration';
import {setPlayer} from '../../reducers/mode';
import {
    isTimeTravel220022BC,
    isTimeTravel1920,
    isTimeTravel1990,
    isTimeTravel2020,
    isTimeTravelNow,
    setTimeTravel
} from '../../reducers/time-travel';
import {
    autoUpdateProject,
    getIsUpdating,
    getIsShowingProject,
    manualUpdateProject,
    requestNewProject,
    remixProject,
    saveProjectAsCopy
} from '../../reducers/project-state';
import {
    openAboutMenu,
    closeAboutMenu,
    aboutMenuOpen,
    openAccountMenu,
    closeAccountMenu,
    accountMenuOpen,
    openFileMenu,
    closeFileMenu,
    fileMenuOpen,
    openWorkspaceBookmarksMenu,
    closeWorkspaceBookmarksMenu,
    workspaceBookmarksMenuOpen,
    openEditMenu,
    closeEditMenu,
    editMenuOpen,
    openLoginMenu,
    closeLoginMenu,
    loginMenuOpen,
    openModeMenu,
    closeModeMenu,
    modeMenuOpen,
    errorsMenuOpen,
    openErrorsMenu,
    closeErrorsMenu,
    openToolsMenu,
    closeToolsMenu,
    toolsMenuOpen
} from '../../reducers/menus';
import {setFileHandle} from '../../reducers/tw.js';
import {setProjectUnchanged} from '../../reducers/project-changed';
import {showStandardAlert, showAlertWithTimeout, closeAlertWithId} from '../../reducers/alerts';
import collectMetadata from '../../lib/collect-metadata';
import LazyScratchBlocks from '../../lib/tw-lazy-scratch-blocks';
import {mediaRecorderSupported} from '../../addons/environment.js';
import addonEnglish from '../../addons/addons-l10n/en.json';
import initBlockCount from '../../lib/menu-bar/block-count-analysis.js';
import {
    getSetting as getMenuBarSetting,
    getSettings as getMenuBarSettings,
    onSettingsChanged
} from '../../lib/menu-bar/settings.js';

import openFractchTerminalWindow from '../../lib/mw/open-fractch-terminal-window.js';

import WorkspaceBookmarksMenu from './workspace-bookmarks-menu.jsx';
import MediaRecorderButton from './media-recorder.jsx';

import {
    createWorkspaceBookmarksExportData,
    downloadJsonObject,
    getDefaultWorkspaceBookmarksPayload,
    mergeWorkspaceBookmarksPayload,
    readWorkspaceBookmarksFromStage,
    writeWorkspaceBookmarksToStage
} from '../../lib/mw/workspace-bookmarks.js';

import styles from './menu-bar.css';
import '!!style-loader!css-loader!./block-count.css';

// import helpIcon from '../../lib/assets/icon--tutorials.svg';
// import mystuffIcon from './icon--mystuff.png';
// import profileIcon from './icon--profile.png';

import ChevronDown from './ChevronDown.jsx';

import mistwarpLogo from '../../community/assets/mistwarp-logo.png';
import ninetiesLogo from './nineties_logo.svg';
import catLogo from './cat_logo.svg';
import prehistoricLogo from './prehistoric-logo.svg';
import oldtimeyLogo from './oldtimey-logo.svg';

import {
    FilePen, PencilRuler, TriangleAlert, Info, Shuffle,
    FilePlusCorner, Upload, RefreshCcw, ClockPlus, Package, FileInput,
    Save, ArchiveRestore, UserPen, Cloud, PackagePlus, Puzzle,
    Bookmark, GitBranch, FileCog, Bug, Database, Undo, Redo, Handshake, Wrench,
    Download, AppWindow, Computer, Shield, Code, Code2, TerminalSquare,
    Blocks as BlocksIcon, Menu as MenuIcon, Globe, ExternalLink, Pause, Play, HelpCircle
} from 'lucide-react';

import sharedMessages from '../../lib/constants/shared-messages';

import SeeInsideButton from './tw-see-inside.jsx';

/* const ariaMessages = defineMessages({
    tutorials: {
        id: 'gui.menuBar.tutorialsLibrary',
        defaultMessage: 'Tutorials',
        description: 'accessibility text for the tutorials button'
    }
}); */

const twMessages = defineMessages({
    compileError: {
        id: 'tw.menuBar.compileError',
        defaultMessage: '{sprite}: {error}',
        description: 'Error message in error menu'
    }
});

const menuLabelMessages = defineMessages({
    about: {
        id: 'gui.menuBar.about',
        defaultMessage: 'About'
    },
    bookmarks: {
        id: 'tw.workspaceBookmarks.menuLabel',
        defaultMessage: 'Bookmarks',
        description: 'Workspace bookmarks menu label'
    },
    edit: {
        id: 'gui.menuBar.edit',
        defaultMessage: 'Edit',
        description: 'Text for edit dropdown menu'
    },
    errors: {
        id: 'tw.menuBar.errors',
        defaultMessage: 'Project errors'
    },
    file: {
        id: 'gui.menuBar.file',
        defaultMessage: 'File',
        description: 'Text for file dropdown menu'
    },
    mode: {
        id: 'gui.menuBar.modeMenu',
        defaultMessage: 'Mode',
        description: 'Mode menu item in the menu bar'
    },
    more: {
        id: 'mw.menuBar.more',
        defaultMessage: 'More menus'
    },
    tools: {
        id: 'gui.menuBar.tools',
        defaultMessage: 'Tools',
        description: 'Text for tools dropdown menu'
    }
});

const MenuBarItemTooltip = ({
    children,
    className,
    enable,
    id,
    place = 'bottom'
}) => {
    if (enable) {
        return (
            <React.Fragment>
                {children}
            </React.Fragment>
        );
    }
    return (
        <ComingSoonTooltip
            className={classNames(styles.comingSoon, className)}
            place={place}
            tooltipClassName={styles.comingSoonTooltip}
            tooltipId={id}
        >
            {children}
        </ComingSoonTooltip>
    );
};


MenuBarItemTooltip.propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
    enable: PropTypes.bool,
    id: PropTypes.string,
    place: PropTypes.oneOf(['top', 'bottom', 'left', 'right'])
};

const MenuItemTooltip = ({id, isRtl, children, className}) => (
    <ComingSoonTooltip
        className={classNames(styles.comingSoon, className)}
        isRtl={isRtl}
        place={isRtl ? 'left' : 'right'}
        tooltipClassName={styles.comingSoonTooltip}
        tooltipId={id}
    >
        {children}
    </ComingSoonTooltip>
);

MenuItemTooltip.propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
    id: PropTypes.string,
    isRtl: PropTypes.bool
};

const AboutButton = props => (
    <Button
        className={classNames(styles.menuBarItem, styles.hoverable)}
        iconClassName={styles.aboutIcon}
        iconElem={Info}
        onClick={props.onClick}
    />
);

AboutButton.propTypes = {
    onClick: PropTypes.func.isRequired
};

// Unlike <MenuItem href="">, this uses an actual <a>
const MenuItemLink = props => (
    <a
        href={props.href}
        rel="noreferrer"
        target="_blank"
        className={styles.menuItemLink}
    >
        <MenuItem>{props.children}</MenuItem>
    </a>
);

MenuItemLink.propTypes = {
    children: PropTypes.node.isRequired,
    href: PropTypes.string.isRequired
};

const formatShortcutDisplay = keyCombo => {
    if (!keyCombo) return '';
    const platform = isMac ? 'mac' : 'windows';
    return keyCombo
        .replace(/Ctrl/g, platform === 'mac' ? '⌘' : 'Ctrl')
        .replace(/Cmd/g, '⌘')
        .replace(/Alt/g, platform === 'mac' ? '⌥' : 'Alt')
        .replace(/Shift/g, '⇧')
        .replace(/Space/g, '␣')
        .replace(/Enter/g, '↵')
        .replace(/ /g, '');
};

const COLLAPSE_MENU_WIDTH = 900;
const addonMessage = (intl, addonId) => (id, values) => intl.formatMessage({
    id: `${addonId}/${id}`,
    defaultMessage: addonEnglish[`${addonId}/${id}`] || id
}, values);

class MenuBar extends React.Component {
    constructor (props) {
        super(props);
        const history = getProjectHistoryState();
        const historyData = history.phase === 'ready' && history.data ? history.data : null;
        this.state = {
            autosaveTimeRemaining: 0,
            autosavePaused: false,
            workspaceBookmarks: [],
            workspaceBookmarksCategories: ['General'],
            workspaceBookmarksCollapsedCategories: [],
            canUndo: true,
            canRedo: true,
            gitRepoExists: Boolean(historyData && historyData.status && historyData.status.initialized),
            gitRemotes: historyData && Array.isArray(historyData.remotes) ? historyData.remotes : [],
            mwpFileHandle: null,
            menuCollapsed: false,
            moreMenuOpen: false,
            menuBarSettings: getMenuBarSettings(),
            mistwarpProject: getRememberedPlatformProjectState()
        };
        this.menuBarRef = React.createRef();
        this.blockCountRef = React.createRef();
        this.blockCountController = null;
        this.mwpSaving = false;
        this.gitActionInFlight = false;
        this.disposeMenuBarSettings = null;
        this.menuResizeObserver = null;
        this.workspaceBookmarksProjectListener = null;
        this.autosaveCountdownInterval = null;
        this.undoRedoChangeListener = null;
        this.undoRedoWorkspace = null;
        this.unmounted = false;
        bindAll(this, [
            'handleDocumentMouseDown',
            'handleToggleMoreMenu',
            'handleClickSeeInside',
            'handleClickNew',
            'handleClickNewWindow',
            'handleClickRemix',
            'handleClickSave',
            'handleClickSaveAsCopy',
            'handleClickLoadFromComputer',
            'handleClickPackager',
            'handleClickRestorePoints',
            'handleClickProjectMetadata',
            'handleClickShare',
            'handleClickMistWarpShare',
            'handleClickSeeMistWarpPage',
            'refreshMistWarpShared',
            'handleClickUndo',
            'handleClickRedo',
            'handleClickCollaboration',
            'handleClickAddonSettings',
            'handleClickHelp',
            'handleClickGitModal',
            'handleClickFractchTerminal',
            'handleClickDebugger',
            'handleClickVariableManager',
            'handleOpenExtensionLibrary',
            'handleOpenExtensionManager',
            'handleClickFile',
            'refreshGitMenuState',
            'handleClickGitCommit',
            'handleClickGitPush',
            'handleClickGitPull',
            'handleClickSaveMwp',
            'handleClickSaveMwpAs',
            'handleSetMode',
            'handleKeyPress',
            'handleRestoreOption',
            'getSaveToComputerHandler',
            'restoreOptionMessage',
            'handleToggleAutosave',
            'getAutosaveEnabled',
            'getAutosaveTimeRemaining',
            'loadWorkspaceBookmarksFromProject',
            'saveWorkspaceBookmarksToProject',
            'ensureScratchBlocks',
            'getCurrentWorkspaceBookmarkState',
            'applyWorkspaceBookmarkState',
            'updateUndoRedoState',
            'handleAddWorkspaceBookmark',
            'handleSwitchWorkspaceBookmark',
            'handleDeleteWorkspaceBookmark',
            'handleEditWorkspaceBookmark',
            'handleToggleWorkspaceBookmarkCategoryCollapsed',
            'handleExportWorkspaceBookmarks',
            'handleImportWorkspaceBookmarks',
            'handleClearAllWorkspaceBookmarks',
            'showAlert',
            'showPrompt',
            'showConfirm'
        ]);
    }
    componentDidMount () {
        this.unmounted = false;
        document.addEventListener('keydown', this.handleKeyPress);
        document.addEventListener('mousedown', this.handleDocumentMouseDown);
        this.observeMenuBarWidth();
        this.startAutosaveCountdown();
        this.refreshMistWarpShared();
        this.disposeProjectHistory = subscribeProjectHistory(historyState => {
            if (historyState.phase === 'loading') {
                this.setState({gitRepoExists: false, gitRemotes: []});
                return;
            }
            if (historyState.phase !== 'ready' || !historyState.data) return;
            this.setState({
                gitRepoExists: Boolean(historyState.data.status && historyState.data.status.initialized),
                gitRemotes: Array.isArray(historyState.data.remotes) ? historyState.data.remotes : []
            });
        });
        if (this.blockCountRef.current) {
            this.blockCountController = initBlockCount({
                vm: this.props.vm,
                display: this.blockCountRef.current,
                getSetting: getMenuBarSetting,
                getBlockly: this.ensureScratchBlocks,
                msg: addonMessage(this.props.intl, 'block-count')
            });
        }
        this.disposeMenuBarSettings = onSettingsChanged(() => {
            const previousSettings = this.state.menuBarSettings;
            const menuBarSettings = getMenuBarSettings();
            this.setState({menuBarSettings}, () => {
                if (this.blockCountController) this.blockCountController.update();
                if (menuBarSettings.autosave_enabled !== previousSettings.autosave_enabled ||
                    menuBarSettings.autosave_interval !== previousSettings.autosave_interval) {
                    this.startAutosaveCountdown();
                }
            });
        });

        // Prevent the legacy addon from also injecting a bookmarks menu.
        window.__mistwarpNativeWorkspaceBookmarks = true;

        this.loadWorkspaceBookmarksFromProject();
        if (this.props.vm && this.props.vm.runtime) {
            this.workspaceBookmarksProjectListener = () => {
                this.loadWorkspaceBookmarksFromProject();
                this.refreshMistWarpShared();
            };
            this.props.vm.runtime.on('PROJECT_LOADED', this.workspaceBookmarksProjectListener);
        }

        this.ensureScratchBlocks().then(ScratchBlocks => {
            if (this.unmounted) return;
            const workspace = ScratchBlocks.getMainWorkspace();
            if (workspace) {
                this.undoRedoWorkspace = workspace;
                this.undoRedoChangeListener = () => {
                    setTimeout(() => this.updateUndoRedoState(), 0);
                };
                workspace.addChangeListener(this.undoRedoChangeListener);
                setTimeout(() => this.updateUndoRedoState(), 100);
            }
        });
    }
    componentWillUnmount () {
        this.unmounted = true;
        document.removeEventListener('keydown', this.handleKeyPress);
        document.removeEventListener('mousedown', this.handleDocumentMouseDown);
        if (this.blockCountController) this.blockCountController.destroy();
        if (this.disposeMenuBarSettings) this.disposeMenuBarSettings();
        if (this.disposeProjectHistory) this.disposeProjectHistory();
        if (this.menuResizeObserver) {
            this.menuResizeObserver.disconnect();
            this.menuResizeObserver = null;
        }

        if (this.autosaveCountdownInterval) {
            clearInterval(this.autosaveCountdownInterval);
            this.autosaveCountdownInterval = null;
        }

        if (this.props.vm && this.props.vm.runtime && this.workspaceBookmarksProjectListener) {
            this.props.vm.runtime.off('PROJECT_LOADED', this.workspaceBookmarksProjectListener);
        }

        if (this.undoRedoChangeListener && this.undoRedoWorkspace) {
            this.undoRedoWorkspace.removeChangeListener(this.undoRedoChangeListener);
            this.undoRedoChangeListener = null;
            this.undoRedoWorkspace = null;
        }
    }

    observeMenuBarWidth () {
        const el = this.menuBarRef.current;
        if (!el || typeof ResizeObserver === 'undefined') return;
        this.menuResizeObserver = new ResizeObserver(() => {
            const collapsed = el.getBoundingClientRect().width < COLLAPSE_MENU_WIDTH;
            if (collapsed !== this.state.menuCollapsed) {
                this.setState({menuCollapsed: collapsed, moreMenuOpen: false});
            }
        });
        this.menuResizeObserver.observe(el);
    }

    handleDocumentMouseDown (e) {
        if (!this.state.moreMenuOpen) return;
        const el = this.menuBarRef.current;
        if (el && el.contains(e.target)) return;
        this.setState({moreMenuOpen: false});
    }

    handleToggleMoreMenu () {
        this.setState(prevState => ({moreMenuOpen: !prevState.moreMenuOpen}));
    }

    showAlert (title, message) {
        return new Promise(resolve => {
            this.props.openSimpleDialog({
                type: 'alert',
                title,
                message,
                onOk: () => resolve()
            });
        });
    }

    showPrompt (title, message, defaultValue = '') {
        return new Promise(resolve => {
            this.props.openSimpleDialog({
                type: 'prompt',
                title,
                message,
                defaultValue,
                onOk: value => resolve(value),
                onCancel: () => resolve(null)
            });
        });
    }

    showConfirm (title, message) {
        return new Promise(resolve => {
            this.props.openSimpleDialog({
                type: 'confirm',
                title,
                message,
                onOk: () => resolve(true),
                onCancel: () => resolve(false)
            });
        });
    }

    async handleClickNew () {
        if (this.newProjectPending) return false;
        this.newProjectPending = true;
        // if the project is dirty, and user owns the project, we will autosave.
        // but if they are not logged in and can't save, user should consider
        // downloading or logging in first.
        // Note that if user is logged in and editing someone else's project,
        // they'll lose their work.
        this.props.onRequestCloseFile();
        try {
            const readyToReplaceProject = await this.props.confirmReadyToReplaceProject(
                this.props.intl.formatMessage(sharedMessages.replaceProjectWarning)
            );
            if (!readyToReplaceProject) return false;
            await Promise.resolve(this.props.onClickNew(this.props.canSave && this.props.canCreateNew));
            return true;
        } finally {
            this.newProjectPending = false;
        }
    }
    handleClickNewWindow () {
        this.props.onClickNewWindow();
        this.props.onRequestCloseFile();
    }
    handleClickRemix () {
        this.props.onClickRemix();
        this.props.onRequestCloseFile();
    }
    handleClickSave () {
        this.props.onClickSave();
        this.props.onRequestCloseFile();
    }
    handleClickSaveAsCopy () {
        this.props.onClickSaveAsCopy();
        this.props.onRequestCloseFile();
    }
    handleClickLoadFromComputer () {
        this.props.onRequestCloseFile();
        this.props.onStartSelectingFileUpload();
    }
    handleClickPackager () {
        this.props.onClickPackager();
        this.props.onRequestCloseFile();
    }
    handleClickRestorePoints () {
        this.props.onClickRestorePoints();
        this.props.onRequestCloseFile();
    }
    handleClickProjectMetadata () {
        this.props.onClickProjectMetadata();
        this.props.onRequestCloseTools();
    }
    handleClickAddRestorePoint = () => {
        if (this.props.vm) {
            this.props.vm.emit('TRIGGER_MANUAL_RESTORE_POINT');
        }
    };
    handleClickShare (waitForUpdate) {
        if (!this.props.isShared) {
            if (this.props.canShare) { // save before transitioning to project page
                this.props.onShare();
            }
            if (this.props.canSave) { // save before transitioning to project page
                this.props.autoUpdateProject();
                waitForUpdate(true); // queue the transition to project page
            } else {
                waitForUpdate(false); // immediately transition to project page
            }
        }
    }
    handleClickCollaboration () {
        this.props.onClickCollaboration();
        this.props.onRequestCloseTools();
    }
    handleClickAddonSettings () {
        this.props.onRequestCloseEdit();
        this.props.onClickAddonSettings();
    }
    handleClickHelp () {
        this.props.onClickHelp();
        this.props.onRequestCloseEdit();
    }
    handleClickGitModal () {
        this.props.onClickGitModal();
        this.props.onRequestCloseTools();
    }
    handleClickFractchTerminal () {
        openFractchTerminalWindow({vm: this.props.vm});
        this.props.onRequestCloseTools();
    }
    handleClickDebugger () {
        window.__mistwarpDebuggerToggle();
        this.props.onRequestCloseTools();
    }
    handleClickVariableManager () {
        window.__mistwarpVariableManagerToggle();
        this.props.onRequestCloseTools();
    }
    handleOpenExtensionLibrary () {
        this.props.onRequestCloseTools();
        this.props.onOpenExtensionLibrary();
    }
    handleOpenExtensionManager () {
        this.props.onRequestCloseTools();
        this.props.onOpenExtensionManagerModal();
    }
    refreshMistWarpShared () {
        const remembered = communityEnabled ? getRememberedPlatformProjectState() : null;
        if (!remembered) {
            this.setState({mistwarpProject: null});
            return;
        }
        this.setState({mistwarpProject: remembered});
        getMistWarpProject(remembered.id)
            .then(data => {
                const current = getRememberedPlatformProjectState();
                if (!current || String(current.id) !== String(remembered.id)) return;
                rememberPlatformProject(data.project);
                this.setState({mistwarpProject: data.project});
            })
            .catch(e => {
                if (e && e.status === 404) {
                    const current = getRememberedPlatformProjectState();
                    if (!current || String(current.id) !== String(remembered.id)) return;
                    rememberPlatformProject(null);
                    this.setState({mistwarpProject: null});
                }
            });
    }
    handleClickMistWarpShare () {
        this.props.onRequestCloseFile();
        openMistWarpShareWindow({
            vm: this.props.vm,
            initialTitle: this.props.projectTitle,
            action: getMistWarpAction(this.state.mistwarpProject, this.props.projectChanged),
            onPublished: result => {
                this.setState({mistwarpProject: {id: result.id, isOwner: true, shared: !!result.shared}});
                this.props.onProjectUnchanged();
            }
        });
    }
    handleClickSeeMistWarpPage () {
        this.props.onRequestCloseFile();
        if (this.state.mistwarpProject) {
            window.location.href = `/project/${this.state.mistwarpProject.id}`;
        }
    }

    handleClickFile () {
        this.props.onClickFile();
        this.refreshMistWarpShared();
        this.refreshGitMenuState();
    }

    async refreshGitMenuState () {
        const history = getProjectHistoryState();
        if (history.phase === 'ready' && history.data) {
            this.setState({
                gitRepoExists: Boolean(history.data.status && history.data.status.initialized),
                gitRemotes: Array.isArray(history.data.remotes) ? history.data.remotes : []
            });
            return;
        }
        try {
            if (!(await repoExists())) {
                this.setState({gitRepoExists: false, gitRemotes: []});
                return;
            }
            const remotes = await getRemotes(this.props.vm).catch(() => []);
            this.setState({
                gitRepoExists: true,
                gitRemotes: Array.isArray(remotes) ? remotes : []
            });
        } catch (e) {
            this.setState({gitRepoExists: false, gitRemotes: []});
        }
    }

    gitAuth () {
        let token = '';
        try {
            token = localStorage.getItem('mw:git-token') || '';
        } catch (e) {
            token = '';
        }
        const username = (getDefaultAuthor().name || '').trim();
        if (!token) return null;
        return () => (username ? {username, password: token} : {username: token, password: token});
    }

    async handleClickGitPush (remote) {
        if (this.gitActionInFlight) return false;
        this.gitActionInFlight = true;
        this.props.onRequestCloseFile();
        this.props.onShowGitStatus('gitPushing');
        try {
            await gitPush({
                vm: this.props.vm,
                remote,
                setUpstream: true,
                onAuth: this.gitAuth()
            });
            this.props.onGitStatusDone('gitPushSuccess');
            return true;
        } catch (e) {
            console.error(e);
            this.props.onCloseGitStatus('gitPushing');
            this.showAutosaveNotification(`Push failed. ${e && e.message ? e.message : e}`, 'error');
            return false;
        } finally {
            this.gitActionInFlight = false;
        }
    }

    async handleClickGitPull (remote) {
        if (this.gitActionInFlight) return false;
        this.gitActionInFlight = true;
        this.props.onRequestCloseFile();
        try {
            if (this.props.projectChanged) {
                const ok = await this.showConfirm(
                    'Replace this project?',
                    this.props.intl.formatMessage({
                        defaultMessage: 'Pulling will replace your project with the repository version. Continue?',
                        description: 'Confirmation before git pull replaces the open project',
                        id: 'mw.menuBar.gitPull.confirmReplace'
                    })
                );
                if (!ok) return false;
            }
            this.props.onShowGitStatus('gitPulling');
            await RestorePointAPI.createSafetyRestorePoint(this.props.vm, this.props.projectTitle);
            await gitPull({
                vm: this.props.vm,
                remote,
                onAuth: this.gitAuth()
            });
            // The working tree changed; rebuild the project and reload it.
            const fs = getGitFs();
            const bytes = await buildSb3FromFractchTree({fs: fs.promises, dir: GIT_REPO_DIR});
            const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
            this.props.vm.quit();
            await this.props.vm.loadProject(buffer, {skipGitImport: true});
            this.props.vm.renderer.draw();
            this.props.onGitStatusDone('gitPullSuccess');
            return true;
        } catch (e) {
            console.error(e);
            this.props.onCloseGitStatus('gitPulling');
            this.showAutosaveNotification(`Pull failed. ${e && e.message ? e.message : e}`, 'error');
            return false;
        } finally {
            this.gitActionInFlight = false;
        }
    }

    async handleClickGitCommit () {
        if (this.gitActionInFlight) return false;
        this.gitActionInFlight = true;
        this.props.onRequestCloseFile();
        try {
            const message = await this.showPrompt(
                this.props.intl.formatMessage({
                    defaultMessage: 'Commit message',
                    description: 'Prompt title when committing to git from the File menu',
                    id: 'mw.menuBar.gitCommit.prompt'
                }),
                'Add a short message describing this version.',
                ''
            );
            if (message === null || !message.trim()) {
                return false;
            }
            this.props.onShowGitStatus('gitCommitting');
            await commitProject({
                vm: this.props.vm,
                message: message.trim(),
                author: getDefaultAuthor()
            });
            await preloadProjectHistory(this.props.vm, {force: true});
            this.props.onGitStatusDone('gitCommitSuccess');
            return true;
        } catch (e) {
            console.error(e);
            this.props.onCloseGitStatus('gitCommitting');
            this.showAutosaveNotification(`Commit failed. ${e && e.message ? e.message : e}`, 'error');
            return false;
        } finally {
            this.gitActionInFlight = false;
        }
    }

    async saveMwp (saveAs) {
        this.props.onRequestCloseFile();
        if (this.mwpSaving) return false;
        this.mwpSaving = true;
        try {
            let message = 'Initial version';
            let commitChanges = true;
            if (await repoExists()) {
                const choice = await requestVersionMessage();
                if (choice === null) return;
                commitChanges = choice !== false;
                if (commitChanges) message = choice;
            }
            const filename = projectFilename(this.props.projectTitle, 'MistWarp Project', 'mwp');
            let handle = saveAs ? null : this.state.mwpFileHandle;
            if (!handle && this.props.showSaveFilePicker) {
                handle = await this.props.showSaveFilePicker({
                    suggestedName: filename,
                    types: [{
                        description: 'MistWarp Project',
                        accept: {'application/x-mistwarp-project': ['.mwp']}
                    }],
                    excludeAcceptAllOption: true
                });
            }
            const platformProject = getRememberedPlatformProjectState();
            const exported = await createMwp({
                vm: this.props.vm,
                projectId: platformProject && platformProject.id,
                remixParent: platformProject && platformProject.remixParent,
                baseCommit: platformProject && platformProject.remixBaseCommit,
                message,
                commitChanges
            });
            await preloadProjectHistory(this.props.vm, {force: true});
            if (handle) {
                const writable = await handle.createWritable();
                await writable.write(exported.blob);
                await writable.close();
                this.setState({mwpFileHandle: handle});
            } else {
                downloadBlob(filename, exported.blob);
            }
            this.props.showToast('MistWarp project saved.', 'success');
            return true;
        } catch (error) {
            if (error && error.name === 'AbortError') return false;
            this.props.showToast(
                `Could not save MistWarp project: ${error && error.message ? error.message : error}`,
                'error'
            );
            return false;
        } finally {
            this.mwpSaving = false;
        }
    }

    handleClickSaveMwp () {
        return this.saveMwp(false);
    }

    handleClickSaveMwpAs () {
        return this.saveMwp(true);
    }
    handleSetMode (mode) {
        return () => {
            // Turn on/off filters for modes.
            if (mode === '1920') {
                document.documentElement.style.filter = 'brightness(.9)contrast(.8)sepia(1.0)';
                document.documentElement.style.height = '100%';
            } else if (mode === '1990') {
                document.documentElement.style.filter = 'hue-rotate(40deg)';
                document.documentElement.style.height = '100%';
            } else {
                document.documentElement.style.filter = '';
                document.documentElement.style.height = '';
            }

            // Change logo for modes
            if (mode === '1990') {
                document.getElementById('logo_img').src = ninetiesLogo;
            } else if (mode === '2020') {
                document.getElementById('logo_img').src = catLogo;
            } else if (mode === '1920') {
                document.getElementById('logo_img').src = oldtimeyLogo;
            } else if (mode === '220022BC') {
                document.getElementById('logo_img').src = prehistoricLogo;
            } else {
                document.getElementById('logo_img').src = this.props.logo;
            }

            this.props.onSetTimeTravelMode(mode);
        };
    }
    handleRestoreOption (restoreFun) {
        return () => {
            restoreFun();
            this.props.onRequestCloseEdit();
        };
    }
    handleKeyPress (event) {
        // Workspace bookmarks shortcuts (Ctrl+Alt+1..0 to switch, Ctrl+Alt+T to add)
        // Ignore when typing.
        const target = event.target;
        const isTyping = target && (
            target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.isContentEditable
        );
        if (!isTyping && !this.props.isPlayerOnly && event.ctrlKey && event.altKey) {
            const key = event.key.toLowerCase();
            if (key >= '1' && key <= '9') {
                event.preventDefault();
                void this.handleSwitchWorkspaceBookmark(parseInt(key, 10) - 1);
                return;
            }
            if (key === '0') {
                event.preventDefault();
                void this.handleSwitchWorkspaceBookmark(9);
                return;
            }
            if (key === 't') {
                event.preventDefault();
                void this.handleAddWorkspaceBookmark();
                return;
            }
        }

        const modifier = isMac ? event.metaKey : event.ctrlKey;
        if (modifier && !event.altKey && !event.shiftKey && event.key.toLowerCase() === 's' &&
            target && target.dataset && 'projectTitleInput' in target.dataset) {
            event.preventDefault();
            target.blur();
            setTimeout(() => this.props.handleSaveProject(), 0);
        }
    }

    loadWorkspaceBookmarksFromProject () {
        try {
            const vm = this.props.vm;
            if (!vm || !vm.runtime) return;
            const stage = vm.runtime.getTargetForStage();
            if (!stage || !stage.comments) return;

            const payload = readWorkspaceBookmarksFromStage(stage) || getDefaultWorkspaceBookmarksPayload();
            this.setState({
                workspaceBookmarks: payload.bookmarks,
                workspaceBookmarksCategories: payload.categories,
                workspaceBookmarksCollapsedCategories: payload.collapsedCategories
            });
        } catch (e) {
            // eslint-disable-next-line no-console
            console.warn('Failed to load workspace bookmarks:', e);
        }
    }

    saveWorkspaceBookmarksToProject () {
        try {
            const vm = this.props.vm;
            if (!vm || !vm.runtime) return;
            const stage = vm.runtime.getTargetForStage();
            if (!stage || !stage.comments) return;

            writeWorkspaceBookmarksToStage(stage, {
                bookmarks: this.state.workspaceBookmarks,
                categories: this.state.workspaceBookmarksCategories,
                collapsedCategories: this.state.workspaceBookmarksCollapsedCategories
            });

            if (vm.runtime.emitProjectChanged) {
                vm.runtime.emitProjectChanged();
            }
        } catch (e) {
            // eslint-disable-next-line no-console
            console.warn('Failed to save workspace bookmarks:', e);
        }
    }

    ensureScratchBlocks () {
        if (LazyScratchBlocks.isLoaded()) {
            return Promise.resolve(LazyScratchBlocks.get());
        }
        return LazyScratchBlocks.load().then(() => LazyScratchBlocks.get());
    }

    async getCurrentWorkspaceBookmarkState () {
        const ScratchBlocks = await this.ensureScratchBlocks();
        const workspace = ScratchBlocks.getMainWorkspace();
        if (!workspace) return null;

        const metrics = workspace.getMetrics();
        const currentTarget = this.props.vm ? this.props.vm.editingTarget : null;

        return {
            scrollX: metrics.viewLeft,
            scrollY: metrics.viewTop,
            scale: workspace.scale,
            targetId: currentTarget ? currentTarget.id : null
        };
    }

    async applyWorkspaceBookmarkState (state) {
        if (!state) return;

        const vm = this.props.vm;
        if (!vm || !vm.runtime) return;

        if (state.targetId && state.targetId !== vm.editingTarget?.id) {
            const target = vm.runtime.getTargetById(state.targetId);
            if (target) {
                vm.setEditingTarget(state.targetId);
            }
        }

        const ScratchBlocks = await this.ensureScratchBlocks();
        const workspace = ScratchBlocks.getMainWorkspace();
        if (workspace && workspace.scrollbar) {
            workspace.setScale(state.scale);
            const scrollX = state.scrollX - workspace.getMetrics().contentLeft;
            const scrollY = state.scrollY - workspace.getMetrics().contentTop;
            workspace.scrollbar.set(scrollX, scrollY);
        }
    }

    async handleAddWorkspaceBookmark () {
        const maxTabs = 20;
        const enableCategories = true;

        if (this.state.workspaceBookmarks.length >= maxTabs) {
            await this.showAlert(
                this.props.intl.formatMessage({
                    defaultMessage: 'Error',
                    id: 'tw.workspaceBookmarks.errorTitle'
                }),
                this.props.intl.formatMessage({
                    defaultMessage: 'Maximum number of bookmarks reached ({max})',
                    description: 'Alert when too many bookmarks exist',
                    id: 'tw.workspaceBookmarks.maxReached'
                }, {max: maxTabs})
            );
            return;
        }

        const state = await this.getCurrentWorkspaceBookmarkState();
        if (!state) return;

        const name = await this.showPrompt(
            this.props.intl.formatMessage({
                defaultMessage: 'Bookmark Name',
                id: 'tw.workspaceBookmarks.nameTitle'
            }),
            this.props.intl.formatMessage({
                defaultMessage: 'Bookmark name:',
                description: 'Prompt title for bookmark name',
                id: 'tw.workspaceBookmarks.namePrompt'
            }),
            `Bookmark ${this.state.workspaceBookmarks.length + 1}`
        );
        if (name === null) return;

        let category = 'General';
        if (enableCategories) {
            const categoryList = this.state.workspaceBookmarksCategories.join(', ');
            const categoryInput = await this.showPrompt(
                this.props.intl.formatMessage({
                    defaultMessage: 'Bookmark Category',
                    id: 'tw.workspaceBookmarks.categoryTitle'
                }),
                this.props.intl.formatMessage({
                    defaultMessage: 'Category (existing: {categories})',
                    description: 'Prompt for bookmark category',
                    id: 'tw.workspaceBookmarks.categoryPrompt'
                }, {categories: categoryList}),
                'General'
            );
            if (categoryInput === null) return;
            category = categoryInput.trim() || 'General';
        }

        const bookmark = {
            name: (name.trim() || `Bookmark ${this.state.workspaceBookmarks.length + 1}`),
            category,
            state,
            timestamp: Date.now()
        };

        this.setState(prev => {
            const categories = new Set(prev.workspaceBookmarksCategories);
            categories.add(category);
            return {
                workspaceBookmarks: [...prev.workspaceBookmarks, bookmark],
                workspaceBookmarksCategories: [...categories]
            };
        }, () => {
            this.saveWorkspaceBookmarksToProject();
            this.props.onRequestCloseWorkspaceBookmarks();
        });
    }

    async handleSwitchWorkspaceBookmark (index) {
        if (index < 0 || index >= this.state.workspaceBookmarks.length) return;
        await this.applyWorkspaceBookmarkState(this.state.workspaceBookmarks[index].state);
        this.props.onRequestCloseWorkspaceBookmarks();
    }

    handleDeleteWorkspaceBookmark (index) {
        if (index < 0 || index >= this.state.workspaceBookmarks.length) return;
        this.setState(prev => {
            const next = [...prev.workspaceBookmarks];
            next.splice(index, 1);
            return {workspaceBookmarks: next};
        }, () => {
            this.saveWorkspaceBookmarksToProject();
        });
    }

    async handleEditWorkspaceBookmark (index) {
        const enableCategories = true;
        if (index < 0 || index >= this.state.workspaceBookmarks.length) return;
        const bookmark = this.state.workspaceBookmarks[index];

        const newName = await this.showPrompt(
            this.props.intl.formatMessage({
                defaultMessage: 'Bookmark Name',
                id: 'tw.workspaceBookmarks.nameTitle'
            }),
            this.props.intl.formatMessage({
                defaultMessage: 'Bookmark name:',
                description: 'Prompt title for bookmark name',
                id: 'tw.workspaceBookmarks.namePrompt'
            }),
            bookmark.name
        );
        if (newName === null || newName.trim() === '') {
            this.props.onRequestCloseWorkspaceBookmarks();
            return;
        }

        const currentCategory = bookmark.category || 'General';
        let categoryInput = null;
        if (enableCategories) {
            const categoryList = this.state.workspaceBookmarksCategories.join(', ');
            categoryInput = await this.showPrompt(
                this.props.intl.formatMessage({
                    defaultMessage: 'Bookmark Category',
                    id: 'tw.workspaceBookmarks.categoryTitle'
                }),
                this.props.intl.formatMessage({
                    defaultMessage: 'Category (existing: {categories})',
                    description: 'Prompt for bookmark category',
                    id: 'tw.workspaceBookmarks.categoryPrompt'
                }, {categories: categoryList}),
                currentCategory
            );
        }
        const newCategory = categoryInput === null ? currentCategory : categoryInput.trim() || 'General';

        this.setState(prev => {
            const currentIndex = prev.workspaceBookmarks.findIndex(item => item.timestamp === bookmark.timestamp);
            if (currentIndex === -1) return null;
            const next = [...prev.workspaceBookmarks];
            next[currentIndex] = {
                ...next[currentIndex],
                name: newName.trim(),
                category: newCategory
            };
            const categories = new Set(prev.workspaceBookmarksCategories);
            categories.add(newCategory);
            return {
                workspaceBookmarks: next,
                workspaceBookmarksCategories: [...categories]
            };
        }, () => {
            this.saveWorkspaceBookmarksToProject();
            this.props.onRequestCloseWorkspaceBookmarks();
        });
    }

    handleToggleWorkspaceBookmarkCategoryCollapsed (category) {
        this.setState(prev => {
            const set = new Set(prev.workspaceBookmarksCollapsedCategories);
            if (set.has(category)) {
                set.delete(category);
            } else {
                set.add(category);
            }
            return {workspaceBookmarksCollapsedCategories: [...set]};
        }, () => {
            this.saveWorkspaceBookmarksToProject();
        });
    }

    handleExportWorkspaceBookmarks () {
        const data = createWorkspaceBookmarksExportData({
            bookmarks: this.state.workspaceBookmarks,
            categories: this.state.workspaceBookmarksCategories,
            collapsedCategories: this.state.workspaceBookmarksCollapsedCategories
        });
        downloadJsonObject(data, `workspace-bookmarks-${Date.now()}.json`);
        this.props.onRequestCloseWorkspaceBookmarks();
    }

    handleImportWorkspaceBookmarks () {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,application/json';
        input.addEventListener('change', e => {
            const file = e.target.files && e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = ev => {
                try {
                    const data = JSON.parse(ev.target.result);
                    if (!data || !Array.isArray(data.bookmarks)) {
                        throw new Error('Invalid format');
                    }
                    const importCount = data.bookmarks.length;
                    this.setState(prev => {
                        const merged = mergeWorkspaceBookmarksPayload({
                            bookmarks: prev.workspaceBookmarks,
                            categories: prev.workspaceBookmarksCategories,
                            collapsedCategories: prev.workspaceBookmarksCollapsedCategories
                        }, data);
                        return {
                            workspaceBookmarks: merged.bookmarks,
                            workspaceBookmarksCategories: merged.categories
                        };
                    }, async () => {
                        this.saveWorkspaceBookmarksToProject();
                        await this.showAlert(
                            this.props.intl.formatMessage({
                                defaultMessage: 'Success',
                                id: 'tw.workspaceBookmarks.importTitle'
                            }),
                            this.props.intl.formatMessage({
                                defaultMessage: 'Successfully imported {count} bookmarks!',
                                description: 'Alert after importing bookmarks',
                                id: 'tw.workspaceBookmarks.importSuccess'
                            }, {count: importCount})
                        );
                    });
                } catch {
                    this.showAlert(
                        this.props.intl.formatMessage({
                            defaultMessage: 'Error',
                            id: 'tw.workspaceBookmarks.importErrorTitle'
                        }),
                        this.props.intl.formatMessage({
                            defaultMessage: 'Failed to import bookmarks. Please check the file format.',
                            description: 'Alert when import fails',
                            id: 'tw.workspaceBookmarks.importFailed'
                        })
                    );
                }
            };
            reader.readAsText(file);
        });
        input.click();
        this.props.onRequestCloseWorkspaceBookmarks();
    }

    async handleClearAllWorkspaceBookmarks () {
        if (this.state.workspaceBookmarks.length === 0) {
            this.props.onRequestCloseWorkspaceBookmarks();
            return;
        }
        const ok = await this.showConfirm(
            this.props.intl.formatMessage({
                defaultMessage: 'Confirm',
                id: 'tw.workspaceBookmarks.clearTitle'
            }),
            this.props.intl.formatMessage({
                defaultMessage: 'Are you sure you want to delete all {count} bookmarks? This action cannot be undone.',
                description: 'Confirmation when clearing bookmarks',
                id: 'tw.workspaceBookmarks.clearAllConfirm'
            }, {count: this.state.workspaceBookmarks.length})
        );
        if (!ok) {
            this.props.onRequestCloseWorkspaceBookmarks();
            return;
        }
        this.setState({
            workspaceBookmarks: [],
            workspaceBookmarksCategories: ['General'],
            workspaceBookmarksCollapsedCategories: []
        }, () => {
            this.saveWorkspaceBookmarksToProject();
            this.props.onRequestCloseWorkspaceBookmarks();
        });
    }
    getSaveToComputerHandler (downloadProjectCallback) {
        return () => {
            this.props.onRequestCloseFile();
            downloadProjectCallback();
            if (this.props.onProjectTelemetryEvent) {
                const metadata = collectMetadata(this.props.vm, this.props.projectTitle, this.props.locale);
                this.props.onProjectTelemetryEvent('projectDidSave', metadata);
            }
        };
    }
    handleToggleAutosave () {
        this.setState(prevState => ({autosavePaused: !prevState.autosavePaused}));
    }
    getAutosaveEnabled () {
        return this.state.menuBarSettings.autosave_enabled;
    }
    getAutosaveTimeRemaining () {
        return this.state.autosaveTimeRemaining;
    }
    startAutosaveCountdown () {
        // Clear existing interval
        if (this.autosaveCountdownInterval) {
            clearInterval(this.autosaveCountdownInterval);
        }

        // Don't start countdown if autosave is disabled
        if (!this.getAutosaveEnabled()) {
            this.setState({autosaveTimeRemaining: 0});
            return;
        }

        const intervalMinutes = this.state.menuBarSettings.autosave_interval;

        // Set initial time
        const totalSeconds = intervalMinutes * 60;
        this.setState({autosaveTimeRemaining: totalSeconds});

        // Start countdown
        this.autosaveCountdownInterval = setInterval(() => {
            this.setState(prevState => {
                // Don't countdown if paused
                if (prevState.autosavePaused) {
                    return prevState; // No change
                }

                const newTime = prevState.autosaveTimeRemaining - 1;

                if (newTime <= 0) {
                    // Time to autosave!
                    this.performAutosave();
                    return {autosaveTimeRemaining: totalSeconds}; // Reset timer
                }
                return {autosaveTimeRemaining: newTime};
            });
        }, 1000);
    }
    async performAutosave () {
        if (this.state.menuBarSettings.autosave_only_when_changed && !this.props.projectChanged) return;
        // Save to the current file using the same method as manual save
        if (this.props.handleSaveProject) {
            try {
                const saved = await this.props.handleSaveProject();
                if (saved !== false && this.state.menuBarSettings.autosave_notifications) {
                    this.showAutosaveNotification('Project autosaved.', 'success');
                }
            } catch (error) {
                if (this.state.menuBarSettings.autosave_notifications) {
                    this.showAutosaveNotification('Autosave failed.', 'error');
                }
            }
        }
    }
    showAutosaveNotification (message, type = 'info') {
        // Use the toast notification system instead of manual DOM manipulation
        if (this.props.showToast) {
            this.props.showToast(message, type);
        } else {
            // Fallback to console if showToast is not available
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }
    formatTimeRemaining (seconds) {
        if (seconds <= 0) return '';

        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;

        if (minutes > 0) {
            return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
        }
        return `${remainingSeconds}s`;
    }
    restoreOptionMessage (deletedItem) {
        switch (deletedItem) {
        case 'Sprite':
            return (<FormattedMessage
                defaultMessage="Restore Sprite"
                description="Menu bar item for restoring the last deleted sprite."
                id="gui.menuBar.restoreSprite"
            />);
        case 'Sound':
            return (<FormattedMessage
                defaultMessage="Restore Sound"
                description="Menu bar item for restoring the last deleted sound."
                id="gui.menuBar.restoreSound"
            />);
        case 'Costume':
            return (<FormattedMessage
                defaultMessage="Restore Costume"
                description="Menu bar item for restoring the last deleted costume."
                id="gui.menuBar.restoreCostume"
            />);
        default: {
            return (<FormattedMessage
                defaultMessage="Restore"
                description="Menu bar item for restoring the last deleted item in its disabled state." /* eslint-disable-line max-len */
                id="gui.menuBar.restore"
            />);
        }
        }
    }
    handleClickSeeInside () {
        this.props.onClickSeeInside();
    }
    handleClickUndo () {
        if (!this.props.isPlayerOnly && this.state.canUndo) {
            this.ensureScratchBlocks().then(ScratchBlocks => {
                if (this.unmounted) return;
                const workspace = ScratchBlocks.getMainWorkspace();
                if (workspace) {
                    workspace.undo(false);
                    this.updateUndoRedoState();
                }
            });
        }
    }
    handleClickRedo () {
        if (!this.props.isPlayerOnly && this.state.canRedo) {
            this.ensureScratchBlocks().then(ScratchBlocks => {
                if (this.unmounted) return;
                const workspace = ScratchBlocks.getMainWorkspace();
                if (workspace) {
                    workspace.undo(true);
                    this.updateUndoRedoState();
                }
            });
        }
    }
    updateUndoRedoState () {
        if (this.props.isPlayerOnly) return;
        this.ensureScratchBlocks().then(ScratchBlocks => {
            if (this.unmounted) return;
            const workspace = ScratchBlocks.getMainWorkspace();
            if (workspace) {
                const canUndo = workspace.hasUndoStack ?
                    workspace.hasUndoStack() : (workspace.undoStack_ && workspace.undoStack_.length > 0);
                const canRedo = workspace.hasRedoStack ?
                    workspace.hasRedoStack() : (workspace.redoStack_ && workspace.redoStack_.length > 0);
                this.setState({canUndo, canRedo});
            }
        });
    }
    buildAboutMenu (onClickAbout) {
        if (!onClickAbout) {
            // hide the button
            return null;
        }
        if (typeof onClickAbout === 'function') {
            // make a button which calls a function
            return <AboutButton onClick={onClickAbout} />;
        }
        // assume it's an array of objects
        // each item must have a 'title' FormattedMessage and a 'handleClick' function
        // generate a menu with items for each object in the array
        return (
            <MenuLabel
                ariaLabel={this.props.intl.formatMessage(menuLabelMessages.about)}
                open={this.props.aboutMenuOpen}
                onOpen={this.props.onRequestOpenAbout}
                onClose={this.props.onRequestCloseAbout}
            >
                <Info
                    className={styles.aboutIcon}
                    size={20}
                />
                <MenuBarMenu
                    className={classNames(styles.menuBarMenu)}
                    open={this.props.aboutMenuOpen}
                    place={this.props.isRtl ? 'right' : 'left'}
                >
                    {
                        onClickAbout.map(itemProps => {
                            const AboutIcon = {
                                computer: Computer,
                                shield: Shield,
                                info: Info,
                                code: Code
                            }[itemProps.icon];
                            return (
                                <MenuItem
                                    key={itemProps.title}
                                    isRtl={this.props.isRtl}
                                    onClick={this.wrapAboutMenuCallback(itemProps.onClick)}
                                >
                                    {AboutIcon ? <AboutIcon /> : null}
                                    {itemProps.title}
                                </MenuItem>
                            );
                        })
                    }
                </MenuBarMenu>
            </MenuLabel>
        );
    }
    wrapAboutMenuCallback (callback) {
        return () => {
            callback();
            this.props.onRequestCloseAbout();
        };
    }
    render () {
        const mistwarpAction = communityEnabled ?
            getMistWarpAction(this.state.mistwarpProject, this.props.projectChanged) :
            null;
        const saveNowMessage = (
            <FormattedMessage
                defaultMessage="Save now"
                description="Menu bar item for saving now"
                id="gui.menuBar.saveNow"
            />
        );
        const createCopyMessage = (
            <FormattedMessage
                defaultMessage="Save as a copy"
                description="Menu bar item for saving as a copy"
                id="gui.menuBar.saveAsCopy"
            />
        );
        const remixMessage = (
            <FormattedMessage
                defaultMessage="Remix"
                description="Menu bar item for remixing"
                id="gui.menuBar.remix"
            />
        );
        const newProjectMessage = (
            <FormattedMessage
                defaultMessage="New"
                description="Menu bar item for creating a new project"
                id="gui.menuBar.new"
            />
        );
        const remixButton = (
            <Button
                className={classNames(
                    styles.menuBarButton,
                    styles.remixButton
                )}
                iconClassName={styles.remixButtonIcon}
                iconElem={Shuffle}
                onClick={this.handleClickRemix}
            >
                {remixMessage}
            </Button>
        );
        // Show the About button only if we have a handler for it (like in the desktop app)
        const aboutButton = this.buildAboutMenu(this.props.onClickAbout);
        const menuBar = (
            <Box
                className={classNames(
                    this.props.className,
                    styles.menuBar,
                    {
                        [styles.iconsOnly]: this.state.menuBarSettings.menu_labels === 'icons',
                        [styles.labelsOnly]: this.state.menuBarSettings.menu_labels === 'labels'
                    }
                )}
                ref={this.menuBarRef}
            >
                <div
                    className={classNames(
                        styles.mainMenu,
                        {
                            [styles[`main-menu-align-${this.props.theme.menuBarAlign || 'center'}`]]: true
                        }
                    )}
                >
                    <a
                        href="/"
                        className={classNames(styles.menuBarItem, styles.hoverable, styles.homeLink)}
                        title="MistWarp home"
                        data-mw-item="__home"
                    >
                        <img
                            src={mistwarpLogo}
                            alt="MistWarp"
                            className={styles.homeLogo}
                        />
                        <span className={styles.homeWordmark}>
                            {'MistWarp'}
                        </span>
                    </a>
                    {this.state.menuCollapsed && (
                        <button
                            type="button"
                            className={classNames(styles.menuBarItem, styles.hoverable, styles.moreMenuButton, {
                                [styles.active]: this.state.moreMenuOpen
                            })}
                            aria-expanded={this.state.moreMenuOpen}
                            aria-haspopup="menu"
                            aria-label={this.props.intl.formatMessage(menuLabelMessages.more)}
                            onClick={this.handleToggleMoreMenu}
                            title="More"
                        >
                            <MenuIcon size={20} />
                        </button>
                    )}
                    <div
                        className={classNames(styles.fileGroup, {
                            [styles.fileGroupCollapsed]: this.state.menuCollapsed,
                            [styles.fileGroupExpanded]: this.state.menuCollapsed && this.state.moreMenuOpen
                        })}
                    >
                        {this.props.errors.length > 0 && <div data-mw-item="__errors">
                            <MenuLabel
                                ariaLabel={this.props.intl.formatMessage(menuLabelMessages.errors)}
                                open={this.props.errorsMenuOpen}
                                onOpen={this.props.onClickErrors}
                                onClose={this.props.onRequestCloseErrors}
                            >
                                <TriangleAlert size={20} />
                                <ChevronDown size={8} />
                                <MenuBarMenu
                                    className={classNames(styles.menuBarMenu)}
                                    open={this.props.errorsMenuOpen}
                                    place={this.props.isRtl ? 'left' : 'right'}
                                >
                                    <MenuSection>
                                        <MenuItemLink href={FEEDBACK_URL}>
                                            <FormattedMessage
                                                defaultMessage="Some scripts encountered errors."
                                                description="Link in error menu"
                                                id="tw.menuBar.reportError1"
                                            />
                                        </MenuItemLink>
                                        <MenuItemLink href={FEEDBACK_URL}>
                                            <FormattedMessage
                                                defaultMessage="This is a bug. Please report it."
                                                description="Link in error menu"
                                                id="tw.menuBar.reportError2"
                                            />
                                        </MenuItemLink>
                                    </MenuSection>
                                    <MenuSection>
                                        {this.props.errors.map(({id, sprite, error}) => (
                                            <MenuItem key={id}>
                                                {this.props.intl.formatMessage(twMessages.compileError, {
                                                    sprite,
                                                    error
                                                })}
                                            </MenuItem>
                                        ))}
                                    </MenuSection>
                                </MenuBarMenu>
                            </MenuLabel>
                        </div>}
                        {(this.props.canManageFiles) && (
                            <MenuLabel
                                ariaLabel={this.props.intl.formatMessage(menuLabelMessages.file)}
                                dataItem="file"
                                open={this.props.fileMenuOpen}
                                onOpen={this.handleClickFile}
                                onClose={this.props.onRequestCloseFile}
                            >
                                <FilePen
                                    width={20}
                                    height={20}
                                    size={20}
                                />
                                <span className={styles.collapsibleLabel}>
                                    <FormattedMessage
                                        defaultMessage="File"
                                        description="Text for file dropdown menu"
                                        id="gui.menuBar.file"
                                    />
                                </span>
                                <ChevronDown size={8} />
                                <MenuBarMenu
                                    className={classNames(styles.menuBarMenu)}
                                    open={this.props.fileMenuOpen}
                                    place={this.props.isRtl ? 'left' : 'right'}
                                >
                                    <MenuItem
                                        isRtl={this.props.isRtl}
                                        onClick={this.handleClickNew}
                                    >
                                        <FilePlusCorner />
                                        {newProjectMessage}
                                    </MenuItem>
                                    {this.props.onClickNewWindow && (
                                        <MenuItem
                                            isRtl={this.props.isRtl}
                                            onClick={this.handleClickNewWindow}
                                        >
                                            <AppWindow />
                                            <FormattedMessage
                                                defaultMessage="New window"
                                                // eslint-disable-next-line max-len
                                                description="Part of desktop app. Menu bar item that creates a new window."
                                                id="tw.menuBar.newWindow"
                                            />
                                        </MenuItem>
                                    )}
                                    {(this.props.canSave || this.props.canCreateCopy || this.props.canRemix) && (
                                        <MenuSection>
                                            {this.props.canSave && (
                                                <MenuItem
                                                    onClick={this.handleClickSave}
                                                    shortcut={formatShortcutDisplay('Ctrl+S')}
                                                >
                                                    {saveNowMessage}
                                                </MenuItem>
                                            )}
                                            {this.props.canCreateCopy && (
                                                <MenuItem
                                                    onClick={this.handleClickSaveAsCopy}
                                                    shortcut={formatShortcutDisplay('Ctrl+Shift+S')}
                                                >
                                                    <Save />
                                                    {createCopyMessage}
                                                </MenuItem>
                                            )}
                                            {this.props.canRemix && (
                                                <MenuItem onClick={this.handleClickRemix}>
                                                    {remixMessage}
                                                </MenuItem>
                                            )}
                                        </MenuSection>
                                    )}
                                    {this.props.roturReady ? (
                                        <MenuSection>
                                            <MenuItem
                                                disabled={!mistwarpAction}
                                                onClick={this.handleClickMistWarpShare}
                                                shortcut={this.state.mistwarpProject ?
                                                    formatShortcutDisplay('Ctrl+S') : null}
                                                title={mistwarpAction ? null : 'No new changes'}
                                            >
                                                <Globe />
                                                {mistwarpAction === 'remix' ? (
                                                    <FormattedMessage
                                                        defaultMessage="Remix to MistWarp"
                                                        description="File menu item to remix a MistWarp project"
                                                        id="mw.menuBar.remix"
                                                    />
                                                ) : (
                                                    <FormattedMessage
                                                        defaultMessage="Save to MistWarp"
                                                        description="File menu item to save the project to MistWarp"
                                                        id="mw.menuBar.share"
                                                    />
                                                )}
                                            </MenuItem>
                                            {this.state.mistwarpProject ? (
                                                <MenuItem onClick={this.handleClickSeeMistWarpPage}>
                                                    <ExternalLink />
                                                    <FormattedMessage
                                                        defaultMessage="See project page"
                                                        description="File menu item opening the MistWarp project page"
                                                        id="mw.menuBar.projectPage"
                                                    />
                                                </MenuItem>
                                            ) : null}
                                        </MenuSection>
                                    ) : null}
                                    <MenuSection>
                                        <MenuItem
                                            onClick={this.handleClickLoadFromComputer}
                                            shortcut={formatShortcutDisplay('Ctrl+O')}
                                        >
                                            <Upload />
                                            {this.props.intl.formatMessage(sharedMessages.loadFromComputerTitle)}
                                        </MenuItem>
                                        <MenuItem
                                            onClick={this.handleClickSaveMwp}
                                            shortcut={this.state.mistwarpProject ?
                                                null : formatShortcutDisplay('Ctrl+S')}
                                        >
                                            <Save />
                                            <FormattedMessage
                                                defaultMessage="Save to your computer"
                                                description="File menu item to save the native project to the computer"
                                                id="mw.menuBar.saveMwp"
                                            />
                                        </MenuItem>
                                        {this.state.mwpFileHandle ? (
                                            <MenuItem
                                                onClick={this.handleClickSaveMwpAs}
                                            >
                                                <FileInput />
                                                <FormattedMessage
                                                    defaultMessage="Save as…"
                                                    description="File menu item to save a new native project file"
                                                    id="mw.menuBar.saveMwpAs"
                                                />
                                            </MenuItem>
                                        ) : null}
                                        <SB3Downloader
                                            showSaveFilePicker={this.props.showSaveFilePicker}
                                        >
                                            {(_className, downloadProject) => (
                                                <MenuItem>
                                                    <div className={styles.submenuRow}>
                                                        <Download />
                                                        <span className={styles.submenuRowLabel}>
                                                            <FormattedMessage
                                                                defaultMessage="Export"
                                                                description={
                                                                    'File menu submenu for other project formats'
                                                                }
                                                                id="mw.menuBar.export"
                                                            />
                                                        </span>
                                                        <ChevronDown className={styles.submenuCaret} />
                                                    </div>
                                                    <Submenu
                                                        place={this.props.isRtl ? 'left' : 'right'}
                                                    >
                                                        <MenuItem
                                                            onClick={this.getSaveToComputerHandler(downloadProject)}
                                                        >
                                                            <Save />
                                                            <FormattedMessage
                                                                defaultMessage="Scratch project (.sb3)"
                                                                description={
                                                                    'Export as SB3 without history'
                                                                }
                                                                id="mw.menuBar.exportSb3"
                                                            />
                                                        </MenuItem>
                                                        {this.props.onClickPackager ? (
                                                            <MenuItem
                                                                onClick={this.handleClickPackager}
                                                                shortcut={formatShortcutDisplay('Ctrl+P')}
                                                            >
                                                                <Package />
                                                                <FormattedMessage
                                                                    defaultMessage="Package project"
                                                                    // eslint-disable-next-line max-len
                                                                    description="Menu item to open the current project in the packager"
                                                                    id="tw.menuBar.package"
                                                                />
                                                            </MenuItem>
                                                        ) : null}
                                                    </Submenu>
                                                </MenuItem>
                                            )}
                                        </SB3Downloader>
                                    </MenuSection>
                                    <MenuSection>
                                        <MenuItem
                                            onClick={this.handleClickRestorePoints}
                                            shortcut={formatShortcutDisplay('Alt+R')}
                                        >
                                            <RefreshCcw />
                                            <FormattedMessage
                                                defaultMessage="Restore points"
                                                description="Menu bar item to manage restore points"
                                                id="tw.menuBar.restorePoints"
                                            />
                                        </MenuItem>
                                        <MenuItem onClick={this.handleClickAddRestorePoint}>
                                            <ClockPlus />
                                            <FormattedMessage
                                                defaultMessage="Create restore point"
                                                description="Menu bar item to create a manual restore point immediately"
                                                id="tw.menuBar.createRestorePoint"
                                            />
                                        </MenuItem>
                                    </MenuSection>
                                    {this.getAutosaveEnabled() && (
                                        <MenuSection>
                                            <MenuItem onClick={this.handleToggleAutosave}>
                                                {this.state.autosavePaused ? <Play /> : <Pause />}
                                                {this.state.autosavePaused ? (
                                                    <FormattedMessage
                                                        defaultMessage="Resume autosave"
                                                        description="Menu bar item to resume autosave"
                                                        id="tw.menuBar.resumeAutosave"
                                                    />
                                                ) : (
                                                    <FormattedMessage
                                                        defaultMessage="Pause autosave"
                                                        description="Menu bar item to pause autosave"
                                                        id="tw.menuBar.pauseAutosave"
                                                    />
                                                )}
                                                {this.getAutosaveTimeRemaining() > 0 && (
                                                    <span
                                                        style={{
                                                            marginLeft: '8px',
                                                            fontSize: '0.9em',
                                                            opacity: this.state.autosavePaused ? 0.5 : 0.7
                                                        }}
                                                    >
                                                        {'('}
                                                        {this.formatTimeRemaining(this.getAutosaveTimeRemaining())}
                                                        {')'}
                                                    </span>
                                                )}
                                            </MenuItem>
                                        </MenuSection>
                                    )}
                                </MenuBarMenu>
                            </MenuLabel>
                        )}
                        <MenuLabel
                            ariaLabel={this.props.intl.formatMessage(menuLabelMessages.edit)}
                            dataItem="edit"
                            open={this.props.editMenuOpen}
                            onOpen={this.props.onClickEdit}
                            onClose={this.props.onRequestCloseEdit}
                        >
                            <PencilRuler size={20} />
                            <span className={styles.collapsibleLabel}>
                                <FormattedMessage
                                    defaultMessage="Edit"
                                    description="Text for edit dropdown menu"
                                    id="gui.menuBar.edit"
                                />
                            </span>
                            <ChevronDown size={8} />
                            <MenuBarMenu
                                className={classNames(styles.menuBarMenu)}
                                open={this.props.editMenuOpen}
                                place={this.props.isRtl ? 'left' : 'right'}
                            >
                                <MenuSection>
                                    {this.props.isPlayerOnly ? null : (
                                        <DeletionRestorer>{(handleRestore, {restorable, deletedItem}) => (
                                            <MenuItem
                                                className={classNames({[styles.disabled]: !restorable})}
                                                onClick={this.handleRestoreOption(handleRestore)}
                                            >
                                                <ArchiveRestore />
                                                {this.restoreOptionMessage(deletedItem)}
                                            </MenuItem>
                                        )}</DeletionRestorer>
                                    )}
                                </MenuSection>
                                <MenuSection>
                                    <MenuItem
                                        className={classNames({[styles.disabled]: !this.state.canUndo})}
                                        onClick={this.state.canUndo ? this.handleClickUndo : null}
                                        shortcut={formatShortcutDisplay('Ctrl+Z')}
                                    >
                                        <Undo />

                                        <FormattedMessage
                                            defaultMessage="Undo"
                                            description="Menu bar item for undoing"
                                            id="gui.menuBar.undo"
                                        />
                                    </MenuItem>
                                    <MenuItem
                                        className={classNames({[styles.disabled]: !this.state.canRedo})}
                                        onClick={this.state.canRedo ? this.handleClickRedo : null}
                                        shortcut={formatShortcutDisplay('Ctrl+Shift+Z')}
                                    >
                                        <Redo />

                                        <FormattedMessage
                                            defaultMessage="Redo"
                                            description="Menu bar item for redoing"
                                            id="gui.menuBar.redo"
                                        />
                                    </MenuItem>
                                </MenuSection>
                                <MenuSection>
                                    {this.props.onClickAddonSettings && (
                                        <MenuItem
                                            onClick={this.handleClickAddonSettings}
                                        >
                                            <Puzzle />
                                            <FormattedMessage
                                                defaultMessage="Addons"
                                                description="Menu bar item to open addon settings"
                                                id="tw.menuBar.addons"
                                            />
                                        </MenuItem>
                                    )}
                                    {this.props.onClickDesktopSettings &&
                                        <TWDesktopSettings onClick={this.props.onClickDesktopSettings} />}
                                    <ChangeUsername>{changeUsername => (
                                        <MenuItem onClick={changeUsername}>
                                            <UserPen />
                                            <FormattedMessage
                                                defaultMessage="Change Username"
                                                description="Menu bar item for changing the username"
                                                id="tw.menuBar.changeUsername"
                                            />
                                        </MenuItem>
                                    )}</ChangeUsername>
                                    <CloudVariablesToggler>{(toggleCloudVariables, {enabled, canUseCloudVariables}) => (
                                        <MenuItem
                                            className={classNames({[styles.disabled]: !canUseCloudVariables})}
                                            onClick={toggleCloudVariables}
                                        >
                                            <Cloud />
                                            {canUseCloudVariables ? (
                                                enabled ? (
                                                    <FormattedMessage
                                                        defaultMessage="Disable Cloud Variables"
                                                        description="Menu bar item for disabling cloud variables"
                                                        id="tw.menuBar.cloudOff"
                                                    />
                                                ) : (
                                                    <FormattedMessage
                                                        defaultMessage="Enable Cloud Variables"
                                                        description="Menu bar item for enabling cloud variables"
                                                        id="tw.menuBar.cloudOn"
                                                    />
                                                )
                                            ) : (
                                                <FormattedMessage
                                                    defaultMessage="Cloud Variables are not Available"
                                                    // eslint-disable-next-line max-len
                                                    description="Menu bar item for when cloud variables are not available"
                                                    id="tw.menuBar.cloudUnavailable"
                                                />
                                            )}
                                        </MenuItem>
                                    )}</CloudVariablesToggler>
                                </MenuSection>
                                <MenuSection>
                                    <MenuItem
                                        onClick={this.handleClickHelp}
                                    >
                                        <HelpCircle />
                                        <FormattedMessage
                                            defaultMessage="Help"
                                            description="Menu bar item that opens the help window"
                                            id="mw.menuBar.help"
                                        />
                                    </MenuItem>
                                </MenuSection>
                            </MenuBarMenu>
                        </MenuLabel>
                        {this.props.isTotallyNormal && (
                            <MenuLabel
                                ariaLabel={this.props.intl.formatMessage(menuLabelMessages.mode)}
                                dataItem="mode"
                                open={this.props.modeMenuOpen}
                                onOpen={this.props.onClickMode}
                                onClose={this.props.onRequestCloseMode}
                            >
                                <FormattedMessage
                                    defaultMessage="Mode"
                                    description="Mode menu item in the menu bar"
                                    id="gui.menuBar.modeMenu"
                                />
                                <MenuBarMenu
                                    className={classNames(styles.menuBarMenu)}
                                    open={this.props.modeMenuOpen}
                                    place={this.props.isRtl ? 'left' : 'right'}
                                >
                                    <MenuSection>
                                        <MenuItem onClick={this.handleSetMode('NOW')}>
                                            <span className={classNames({[styles.inactive]: !this.props.modeNow})}>
                                                {'✓'}
                                            </span>
                                            {' '}
                                            <FormattedMessage
                                                defaultMessage="Normal mode"
                                                description="April fools: resets editor to not have any pranks"
                                                id="gui.menuBar.normalMode"
                                            />
                                        </MenuItem>
                                        <MenuItem onClick={this.handleSetMode('2020')}>
                                            <span className={classNames({[styles.inactive]: !this.props.mode2020})}>
                                                {'✓'}
                                            </span>
                                            {' '}
                                            <FormattedMessage
                                                defaultMessage="Caturday mode"
                                                description="April fools: Cat blocks mode"
                                                id="gui.menuBar.caturdayMode"
                                            />
                                        </MenuItem>
                                    </MenuSection>
                                </MenuBarMenu>
                            </MenuLabel>
                        )}
                        <MenuLabel
                            ariaLabel={this.props.intl.formatMessage(menuLabelMessages.tools)}
                            dataItem="tools"
                            open={this.props.toolsMenuOpen}
                            onOpen={this.props.onClickTools}
                            onClose={this.props.onRequestCloseTools}
                        >
                            <Wrench size={20} />
                            <span className={styles.collapsibleLabel}>
                                <FormattedMessage
                                    defaultMessage="Tools"
                                    description="Text for tools dropdown menu"
                                    id="gui.menuBar.tools"
                                />
                            </span>
                            <ChevronDown size={8} />
                            <MenuBarMenu
                                className={classNames(styles.menuBarMenu)}
                                open={this.props.toolsMenuOpen}
                                place={this.props.isRtl ? 'left' : 'right'}
                            >
                                <MenuSection>
                                    <MenuItem
                                        onClick={this.handleClickGitModal}
                                    >
                                        <GitBranch />
                                        <FormattedMessage
                                            defaultMessage="Version history"
                                            description="Menu bar item to open project version history"
                                            id="mw.menuBar.git"
                                        />
                                    </MenuItem>
                                    <MenuItem
                                        onClick={this.handleClickFractchTerminal}
                                    >
                                        <TerminalSquare />
                                        <FormattedMessage
                                            defaultMessage="Terminal"
                                            description="Menu bar item that opens the shell in a window"
                                            id="mw.menuBar.terminal"
                                        />
                                    </MenuItem>
                                    <MenuItem
                                        onClick={this.handleClickCollaboration}
                                    >
                                        <Handshake size={20} />
                                        <FormattedMessage
                                            defaultMessage="Live Collaboration"
                                            description="Menu bar item for live collaboration"
                                            id="tw.menuBar.collaboration"
                                        />
                                    </MenuItem>
                                    <MenuItem onClick={this.handleClickProjectMetadata}>
                                        <Info />
                                        <FormattedMessage
                                            defaultMessage="Project metadata"
                                            // eslint-disable-next-line max-len
                                            description="Menu bar item to view the open project's metadata (author, dates, contents)"
                                            id="mw.menuBar.projectMetadata"
                                        />
                                    </MenuItem>
                                </MenuSection>
                                {window.__mistwarpDebuggerToggle || window.__mistwarpVariableManagerToggle ? (
                                    <MenuSection>
                                        {window.__mistwarpDebuggerToggle && (
                                            <MenuItem
                                                onClick={this.handleClickDebugger}
                                            >
                                                <Bug />
                                                <FormattedMessage
                                                    defaultMessage="Debugger"
                                                    description="Menu bar item to toggle the debugger"
                                                    id="tw.menuBar.debugger"
                                                />
                                            </MenuItem>
                                        )}
                                        {window.__mistwarpVariableManagerToggle && (
                                            <MenuItem
                                                onClick={this.handleClickVariableManager}
                                            >
                                                <Database />
                                                <FormattedMessage
                                                    defaultMessage="Variable Manager"
                                                    description="Menu bar item to toggle the variable manager"
                                                    id="tw.menuBar.variableManager"
                                                />
                                            </MenuItem>
                                        )}
                                    </MenuSection>
                                ) : null}
                                <MenuSection>
                                    <MenuItem
                                        onClick={this.handleOpenExtensionLibrary}
                                        shortcut={formatShortcutDisplay('Ctrl+.')}
                                    >
                                        <PackagePlus />
                                        <FormattedMessage
                                            defaultMessage="Add Extension"
                                            description="Menu bar item for adding or importing extensions"
                                            id="tw.menuBar.extensions.addImport"
                                        />
                                    </MenuItem>
                                    <MenuItem
                                        onClick={this.handleOpenExtensionManager}
                                        shortcut={formatShortcutDisplay('Ctrl+Alt+E')}
                                    >
                                        <FileCog />
                                        <FormattedMessage
                                            defaultMessage="Manage Extensions"
                                            description="Menu bar item for managing loaded extensions"
                                            id="tw.menuBar.extensions.manage"
                                        />
                                    </MenuItem>
                                </MenuSection>
                            </MenuBarMenu>
                        </MenuLabel>
                        {!this.props.isPlayerOnly && (
                            <MenuLabel
                                ariaLabel={this.props.intl.formatMessage(menuLabelMessages.bookmarks)}
                                dataItem="bookmarks"
                                open={this.props.workspaceBookmarksMenuOpen}
                                onOpen={this.props.onClickWorkspaceBookmarks}
                                onClose={this.props.onRequestCloseWorkspaceBookmarks}
                            >
                                <Bookmark size={20} />
                                <span className={styles.collapsibleLabel}>
                                    <FormattedMessage
                                        defaultMessage="Bookmarks"
                                        description="Workspace bookmarks menu label"
                                        id="tw.workspaceBookmarks.menuLabel"
                                    />
                                </span>
                                <ChevronDown size={8} />
                                <MenuBarMenu
                                    className={classNames(styles.menuBarMenu)}
                                    open={this.props.workspaceBookmarksMenuOpen}
                                    place={this.props.isRtl ? 'left' : 'right'}
                                >
                                    <WorkspaceBookmarksMenu
                                        bookmarks={this.state.workspaceBookmarks}
                                        categories={this.state.workspaceBookmarksCategories}
                                        collapsedCategories={this.state.workspaceBookmarksCollapsedCategories}
                                        enableCategories
                                        showSearch
                                        intl={this.props.intl}
                                        onAddBookmark={this.handleAddWorkspaceBookmark}
                                        onSwitchToBookmark={this.handleSwitchWorkspaceBookmark}
                                        onEditBookmark={this.handleEditWorkspaceBookmark}
                                        onDeleteBookmark={this.handleDeleteWorkspaceBookmark}
                                        onToggleCategoryCollapsed={this.handleToggleWorkspaceBookmarkCategoryCollapsed}
                                        onExport={this.handleExportWorkspaceBookmarks}
                                        onImport={this.handleImportWorkspaceBookmarks}
                                        onClearAll={this.handleClearAllWorkspaceBookmarks}
                                    />
                                </MenuBarMenu>
                            </MenuLabel>
                        )}
                        {(this.props.canChangeTheme || this.props.canChangeLanguage) && <SettingsMenu />}
                    </div>

                    {!this.props.isPlayerOnly && mediaRecorderSupported &&
                        this.state.menuBarSettings.show_media_recorder && (
                        <MediaRecorderButton
                            className={classNames(styles.menuBarItem, styles.hoverable)}
                            labelClassName={styles.collapsibleLabel}
                            projectTitle={this.props.projectTitle}
                            vm={this.props.vm}
                        />
                    )}
                    {!this.props.isPlayerOnly && (
                        <button
                            type="button"
                            className="sa-block-count-display"
                            data-mw-item="block-count"
                            ref={this.blockCountRef}
                        />
                    )}

                    <div
                        data-mw-item="__divider"
                        className={styles.menuBarLayoutItem}
                    >
                        <Divider className={styles.divider} />
                    </div>

                    {this.props.canEditTitle ? (
                        <div
                            data-mw-item="project-title"
                            className={classNames(styles.menuBarItem, styles.growable)}
                        >
                            <MenuBarItemTooltip
                                enable
                                id="title-field"
                            >
                                <ProjectTitleInput
                                    className={classNames(styles.titleFieldGrowable)}
                                />
                            </MenuBarItemTooltip>
                        </div>
                    ) : ((this.props.authorUsername && this.props.authorUsername !== this.props.username) ? (
                        <AuthorInfo
                            className={styles.authorInfo}
                            imageUrl={this.props.authorThumbnailUrl}
                            projectId={this.props.projectId}
                            projectTitle={this.props.projectTitle}
                            userId={this.props.authorId}
                            username={this.props.authorUsername}
                        />
                    ) : null)}

                    {(this.props.isShowingProject || this.props.isUpdating) &&
                        this.props.projectId && this.props.projectId !== '0' ? (
                            <div
                                data-mw-item="__view-counter"
                                className={classNames(styles.menuBarItem, styles.viewCounter)}
                            >
                                <TWViewCounter projectId={this.props.projectId} />
                            </div>
                        ) : null}
                    {this.props.canShare ? (
                        (this.props.isShowingProject || this.props.isUpdating) && (
                            <div
                                data-mw-item="share"
                                className={classNames(styles.menuBarItem)}
                            >
                                <ProjectWatcher onDoneUpdating={this.props.onSeeCommunity}>
                                    {
                                        waitForUpdate => (
                                            <ShareButton
                                                className={styles.menuBarButton}
                                                isShared={this.props.isShared}
                                                /* eslint-disable react/jsx-no-bind */
                                                onClick={() => {
                                                    this.handleClickShare(waitForUpdate);
                                                }}
                                            /* eslint-enable react/jsx-no-bind */
                                            />
                                        )
                                    }
                                </ProjectWatcher>
                            </div>
                        )
                    ) : this.props.showComingSoon ? (
                        <div
                            data-mw-item="share"
                            className={classNames(styles.menuBarItem)}
                        >
                            <MenuBarItemTooltip id="share-button">
                                <ShareButton className={styles.menuBarButton} />
                            </MenuBarItemTooltip>
                        </div>
                    ) : null}
                    {this.props.canRemix && (
                        <div
                            data-mw-item="remix"
                            className={classNames(styles.menuBarItem)}
                        >
                            {remixButton}
                        </div>
                    )}
                    <div
                        data-mw-item="community"
                        className={classNames(styles.menuBarItem, styles.communityButtonWrapper)}
                    >
                        {this.props.enableCommunity ? (
                            this.state.mistwarpProject ? (
                                <CommunityButton
                                    className={styles.menuBarButton}
                                    /* eslint-disable-next-line react/jsx-no-bind */
                                    onClick={this.handleClickSeeMistWarpPage}
                                />
                            ) : null
                        ) : (this.props.showComingSoon ? (
                            <MenuBarItemTooltip id="community-button">
                                <CommunityButton className={styles.menuBarButton} />
                            </MenuBarItemTooltip>
                        ) : (this.props.enableSeeInside ? (
                            <SeeInsideButton
                                className={styles.menuBarButton}
                                onClick={this.handleClickSeeInside}
                            />
                        ) : []))}
                    </div>
                    {/* tw: add a feedback button */}
                    <div
                        data-mw-item="feedback"
                        className={styles.menuBarItem}
                    >
                        <Button
                            className={classNames(styles.feedbackLink, styles.feedbackButton)}
                            href={FEEDBACK_URL}
                            rel="noopener noreferrer"
                            target="_blank"
                        >
                            <FormattedMessage
                                defaultMessage="{APP_NAME} Feedback"
                                description="Button to give feedback in the menu bar"
                                id="tw.feedbackButton"
                                values={{
                                    APP_NAME
                                }}
                            />
                        </Button>
                    </div>
                </div>

                <div
                    data-mw-item="__account-group"
                    className={styles.accountInfoGroup}
                >
                    <div
                        data-mw-item="save-status"
                        className={styles.menuBarLayoutItem}
                    >
                        <TWSaveStatus
                            showSaveFilePicker={this.props.showSaveFilePicker}
                        />
                    </div>
                    {aboutButton && (
                        <div
                            data-mw-item="about"
                            className={styles.menuBarLayoutItem}
                        >
                            {aboutButton}
                        </div>
                    )}
                    <div
                        data-mw-item="collab-presence"
                        className={styles.menuBarLayoutItem}
                    >
                        <CollabPresence />
                    </div>
                    <div
                        data-mw-item="mw-editor-nav"
                        className={styles.menuBarLayoutItem}
                    >
                        <MwEditorNav />
                    </div>
                    <div
                        data-mw-item="rotur-account"
                        className={classNames(styles.menuBarLayoutItem, styles.roturAccountSlot)}
                    >
                        <RoturAccount />
                    </div>
                </div>
            </Box>
        );

        return (
            <React.Fragment>
                {menuBar}
                <TWNews />
            </React.Fragment>
        );
    }
}

MenuBar.propTypes = {
    enableSeeInside: PropTypes.bool,
    onClickSeeInside: PropTypes.func,
    aboutMenuOpen: PropTypes.bool,
    accountMenuOpen: PropTypes.bool,
    authorId: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
    authorThumbnailUrl: PropTypes.string,
    authorUsername: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
    autoUpdateProject: PropTypes.func,
    canChangeLanguage: PropTypes.bool,
    canChangeTheme: PropTypes.bool,
    canCreateCopy: PropTypes.bool,
    canCreateNew: PropTypes.bool,
    canEditTitle: PropTypes.bool,
    canManageFiles: PropTypes.bool,
    canRemix: PropTypes.bool,
    canSave: PropTypes.bool,
    canShare: PropTypes.bool,
    className: PropTypes.string,
    logo: PropTypes.string,
    errors: PropTypes.arrayOf(PropTypes.shape({
        sprite: PropTypes.string,
        error: PropTypes.string,
        id: PropTypes.number
    })),
    errorsMenuOpen: PropTypes.bool,
    onClickErrors: PropTypes.func,
    onRequestCloseErrors: PropTypes.func,
    confirmReadyToReplaceProject: PropTypes.func,
    currentLocale: PropTypes.string.isRequired,
    editMenuOpen: PropTypes.bool,
    fractchMode: PropTypes.bool,
    onToggleFractchMode: PropTypes.func,
    editorMenuOpen: PropTypes.bool,
    enableCommunity: PropTypes.bool,
    fileMenuOpen: PropTypes.bool,
    workspaceBookmarksMenuOpen: PropTypes.bool,
    toolsMenuOpen: PropTypes.bool,
    handleSaveProject: PropTypes.func,
    intl: intlShape,
    isPlayerOnly: PropTypes.bool,
    isRtl: PropTypes.bool,
    isShared: PropTypes.bool,
    isShowingProject: PropTypes.bool,
    isTotallyNormal: PropTypes.bool,
    isUpdating: PropTypes.bool,
    locale: PropTypes.string.isRequired,
    loginMenuOpen: PropTypes.bool,
    mode1920: PropTypes.bool,
    mode1990: PropTypes.bool,
    mode2020: PropTypes.bool,
    mode220022BC: PropTypes.bool,
    modeMenuOpen: PropTypes.bool,
    modeNow: PropTypes.bool,
    onClickAbout: PropTypes.oneOfType([
        PropTypes.func, // button mode: call this callback when the About button is clicked
        PropTypes.arrayOf( // menu mode: list of items in the About menu
            PropTypes.shape({
                title: PropTypes.string, // text for the menu item
                onClick: PropTypes.func // call this callback when the menu item is clicked
            })
        )
    ]),
    onClickAccount: PropTypes.func,
    onClickAddonSettings: PropTypes.func,
    onClickCollaboration: PropTypes.func,
    onClickDesktopSettings: PropTypes.func,
    onClickPackager: PropTypes.func,
    onClickRestorePoints: PropTypes.func,
    onClickProjectMetadata: PropTypes.func,
    onClickAddRestorePoint: PropTypes.func,
    onClickExtensionManager: PropTypes.func,
    openSimpleDialog: PropTypes.func.isRequired,
    showToast: PropTypes.func,
    onClickEdit: PropTypes.func,
    onClickEditor: PropTypes.func,
    onClickFile: PropTypes.func,
    onClickWorkspaceBookmarks: PropTypes.func,
    onClickLogin: PropTypes.func,
    onClickMode: PropTypes.func,
    onClickNew: PropTypes.func,
    onClickNewWindow: PropTypes.func,
    onClickRemix: PropTypes.func,
    onClickSave: PropTypes.func,
    onClickSaveAsCopy: PropTypes.func,
    onClickPreferencesModal: PropTypes.func,
    onClickGitModal: PropTypes.func,
    onClickHelp: PropTypes.func,

    onOpenSettingsModal: PropTypes.func,
    onLogOut: PropTypes.func,
    onOpenExtensionLibrary: PropTypes.func,
    onOpenExtensionManagerModal: PropTypes.func,
    onOpenRegistration: PropTypes.func,
    onOpenTipLibrary: PropTypes.func,
    onProjectTelemetryEvent: PropTypes.func,
    onRequestCloseAbout: PropTypes.func,
    onRequestCloseAccount: PropTypes.func,
    onRequestCloseEdit: PropTypes.func,
    onRequestCloseEditor: PropTypes.func,
    onRequestCloseFile: PropTypes.func,
    onRequestCloseWorkspaceBookmarks: PropTypes.func,
    onRequestCloseLogin: PropTypes.func,
    onRequestCloseMode: PropTypes.func,
    onClickTools: PropTypes.func,
    onRequestCloseTools: PropTypes.func,
    onRequestOpenAbout: PropTypes.func,
    onSeeCommunity: PropTypes.func,
    onSetTimeTravelMode: PropTypes.func,
    onShare: PropTypes.func,
    onStartSelectingFileUpload: PropTypes.func,
    onToggleLoginOpen: PropTypes.func,
    projectId: PropTypes.string,
    projectTitle: PropTypes.string,
    projectChanged: PropTypes.bool,
    roturReady: PropTypes.bool,
    onProjectUnchanged: PropTypes.func,
    onShowGitStatus: PropTypes.func,
    onCloseGitStatus: PropTypes.func,
    onGitStatusDone: PropTypes.func,
    renderLogin: PropTypes.func,
    sessionExists: PropTypes.bool,
    showSaveFilePicker: PropTypes.func,
    showComingSoon: PropTypes.bool,
    theme: PropTypes.shape({
        menuBarAlign: PropTypes.string
    }),
    username: PropTypes.string,
    userOwnsProject: PropTypes.bool,
    vm: PropTypes.instanceOf(VM).isRequired
};

MenuBar.contextTypes = {
    store: PropTypes.object
};

MenuBar.defaultProps = {
    onShare: () => { }
};

const mapStateToProps = (state, ownProps) => {
    const loadingState = state.scratchGui.projectState.loadingState;
    const user = state.session && state.session.session && state.session.session.user;
    return {
        authorUsername: state.scratchGui.tw.author.username,
        authorThumbnailUrl: state.scratchGui.tw.author.thumbnail,
        projectId: state.scratchGui.projectState.projectId,
        aboutMenuOpen: aboutMenuOpen(state),
        accountMenuOpen: accountMenuOpen(state),
        currentLocale: state.locales.locale,
        fileMenuOpen: fileMenuOpen(state),
        editMenuOpen: editMenuOpen(state),
        workspaceBookmarksMenuOpen: workspaceBookmarksMenuOpen(state),
        errors: state.scratchGui.tw.compileErrors,
        errorsMenuOpen: errorsMenuOpen(state),
        toolsMenuOpen: toolsMenuOpen(state),
        isPlayerOnly: state.scratchGui.mode.isPlayerOnly,
        isRtl: state.locales.isRtl,
        isUpdating: getIsUpdating(loadingState),
        isShowingProject: getIsShowingProject(loadingState),
        locale: state.locales.locale,
        loginMenuOpen: loginMenuOpen(state),
        modeMenuOpen: modeMenuOpen(state),
        projectTitle: state.scratchGui.projectTitle,
        projectChanged: state.scratchGui.projectChanged,
        roturReady: state.scratchGui.rotur && state.scratchGui.rotur.status === 'ready',
        sessionExists: state.session && typeof state.session.session !== 'undefined',
        theme: state.scratchGui.theme.theme,
        username: user ? user.username : null,
        userOwnsProject: ownProps.authorUsername && user &&
            (ownProps.authorUsername === user.username),
        vm: state.scratchGui.vm,
        mode220022BC: isTimeTravel220022BC(state),
        mode1920: isTimeTravel1920(state),
        mode1990: isTimeTravel1990(state),
        mode2020: isTimeTravel2020(state),
        modeNow: isTimeTravelNow(state)
    };
};

const mapDispatchToProps = dispatch => ({
    onClickSeeInside: () => dispatch(setPlayer(false)),
    autoUpdateProject: () => dispatch(autoUpdateProject()),
    onOpenTipLibrary: () => dispatch(openTipsLibrary()),
    onClickAccount: () => dispatch(openAccountMenu()),
    onRequestCloseAccount: () => dispatch(closeAccountMenu()),
    onClickCollaboration: () => dispatch(openCollaborationModal()),
    onClickFile: () => dispatch(openFileMenu()),
    onRequestCloseFile: () => dispatch(closeFileMenu()),
    onProjectUnchanged: () => dispatch(setProjectUnchanged()),
    onShowGitStatus: alertId => dispatch(showStandardAlert(alertId)),
    onCloseGitStatus: alertId => dispatch(closeAlertWithId(alertId)),
    onGitStatusDone: alertId => showAlertWithTimeout(dispatch, alertId),
    onClickWorkspaceBookmarks: () => dispatch(openWorkspaceBookmarksMenu()),
    onRequestCloseWorkspaceBookmarks: () => dispatch(closeWorkspaceBookmarksMenu()),
    onClickEdit: () => dispatch(openEditMenu()),
    onRequestCloseEdit: () => dispatch(closeEditMenu()),
    onClickErrors: () => dispatch(openErrorsMenu()),
    onRequestCloseErrors: () => dispatch(closeErrorsMenu()),
    onClickTools: () => dispatch(openToolsMenu()),
    onRequestCloseTools: () => dispatch(closeToolsMenu()),
    onClickLogin: () => dispatch(openLoginMenu()),
    onRequestCloseLogin: () => dispatch(closeLoginMenu()),
    onClickMode: () => dispatch(openModeMenu()),
    onRequestCloseMode: () => dispatch(closeModeMenu()),
    onRequestOpenAbout: () => dispatch(openAboutMenu()),
    onRequestCloseAbout: () => dispatch(closeAboutMenu()),
    onClickRestorePoints: () => dispatch(openRestorePointModal()),
    onClickProjectMetadata: () => dispatch(openProjectMetadataModal()),
    onClickExtensionManager: () => dispatch(openExtensionManagerModal()),
    onClickGitModal: () => {
        dispatch(closeEditMenu());
        dispatch(openGitModal());
    },
    onClickHelp: () => dispatch(openHelp()),
    onOpenSettingsModal: () => dispatch(openSettingsModal()),
    onClickNew: needSave => {
        dispatch(setPlayer(false));
        dispatch(requestNewProject(needSave));
        dispatch(setFileHandle(null));
    },
    onClickRemix: () => dispatch(remixProject()),
    onClickSave: () => dispatch(manualUpdateProject()),
    onClickSaveAsCopy: () => dispatch(saveProjectAsCopy()),
    onSeeCommunity: () => dispatch(setPlayer(true)),
    onSetTimeTravelMode: mode => dispatch(setTimeTravel(mode))
});

export default compose(
    injectIntl,
    MenuBarHOC,
    connect(
        mapStateToProps,
        mapDispatchToProps
    )
)(MenuBar);

export {MenuBar};
