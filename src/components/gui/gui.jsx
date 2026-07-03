import classNames from 'classnames';
import omit from 'lodash.omit';
import PropTypes from 'prop-types';
import React, {useCallback, useEffect, useRef, useState, useMemo} from 'react';
import {defineMessages, FormattedMessage, injectIntl, intlShape} from 'react-intl';
import {connect} from 'react-redux';
import MediaQuery from 'react-responsive';
import {Tab, Tabs, TabList, TabPanel} from 'react-tabs';
import tabStyles from 'react-tabs/style/react-tabs.css';
import VM from 'scratch-vm';

import Blocks from '../../containers/blocks.jsx';
import CostumeTab from '../../containers/costume-tab.jsx';
import SoundTab from '../../containers/sound-tab.jsx';
import ExtensionLibrary from '../../containers/extension-library.jsx';
import TargetPane from '../../containers/target-pane.jsx';
import StageWrapper from '../../containers/stage-wrapper.jsx';
import Loader from '../loader/loader.jsx';
import Box from '../box/box.jsx';
import MenuBar from '../menu-bar/menu-bar.jsx';
import CostumeLibrary from '../../containers/costume-library.jsx';
import SoundLibrary from '../../containers/sound-library.jsx';
import BackdropLibrary from '../../containers/backdrop-library.jsx';
import Watermark from '../../containers/watermark.jsx';

import Backpack from '../../containers/backpack.jsx';
import BrowserModal from '../browser-modal/browser-modal.jsx';
import TipsLibrary from '../../containers/tips-library.jsx';
import Cards from '../../containers/cards.jsx';
import Alerts from '../../containers/alerts.jsx';
import NotificationsProvider from '../../lib/notifications-provider.jsx';
import DragLayer from '../../containers/drag-layer.jsx';
import ConnectionModal from '../../containers/connection-modal.jsx';
import CollaborationContainer from '../../containers/collaboration-container.jsx';
import CollabLoader from '../collab-loader/collab-loader.jsx';
import TelemetryModal from '../telemetry-modal/telemetry-modal.jsx';
import TWUsernameModal from '../../containers/tw-username-modal.jsx';
import TWSettingsModal from '../../containers/tw-settings-modal.jsx';
import TWSecurityManager from '../../containers/tw-security-manager.jsx';
import TWCustomExtensionModal from '../../containers/tw-custom-extension-modal.jsx';
import TWRestorePointManager from '../../containers/tw-restore-point-manager.jsx';
import TWFontsModal from '../../containers/tw-fonts-modal.jsx';
import TWUnknownPlatformModal from '../../containers/tw-unknown-platform-modal.jsx';
import TWInvalidProjectModal from '../../containers/tw-invalid-project-modal.jsx';
import TWGitModal from '../../containers/mw-git-modal.jsx';
import MWExtensionManagerModal from '../../containers/mw-extension-manager-modal.jsx';
import MWProjectThemeModal from '../../containers/mw-project-theme-modal.jsx';
import WarpThemeModal from '../../containers/mw-warptheme-modal.jsx';
import ShortcutManager from '../shortcut-manager/shortcut-manager.jsx';
import SimpleDialog from '../../containers/simple-dialog.jsx';
import AddonHooks from '../../addons/hooks.js';
import NativeFindBar from '../find-bar/find-bar.jsx';
import Onboarding from '../../containers/onboarding.jsx';

import {STAGE_SIZE_MODES, FIXED_WIDTH, UNCONSTRAINED_NON_STAGE_WIDTH} from '../../lib/constants/layout-constants';
import {resolveStageSize} from '../../lib/utils/screen';
import {Theme} from '../../lib/themes';

import {setStageSize} from '../../reducers/stage-size';
import {showOnboarding} from '../../reducers/onboarding';

import {isRendererSupported, isBrowserSupported} from '../../lib/utils/tw-environment-support-prober.js';

import styles from './gui.css';

const messages = defineMessages({
    addExtension: {
        id: 'gui.gui.addExtension',
        description: 'Button to add an extension in the target pane',
        defaultMessage: 'Add Extension'
    }
});

import {
    Blocks as BlocksIcon,
    PaintbrushVertical as CostumesIcon,
    Volume2 as SoundsIcon,
    PackagePlus as ExtensionIcon
} from 'lucide-react';

const getFullscreenBackgroundColor = () => {
    const params = new URLSearchParams(location.search);
    if (params.has('fullscreen-background')) {
        return params.get('fullscreen-background');
    }
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return '#111';
    }
    return 'white';
};

const fullscreenBackgroundColor = getFullscreenBackgroundColor();

const AUTO_SMALL_STAGE_INNER_WIDTH = Math.round(FIXED_WIDTH);
const MIN_EDITOR_PANE_WIDTH = 598;
const MIN_TARGET_PANE_HEIGHT = 180;

const cachedStyleValues = new WeakMap();

const getCachedBorderWidth = element => {
    if (!element) return 2;
    
    const cached = cachedStyleValues.get(element);
    if (typeof cached !== 'undefined') return cached;
    
    const computedStyle = window.getComputedStyle(element);
    const borderLeft = Number.parseFloat(computedStyle.borderLeftWidth) || 0;
    const borderRight = Number.parseFloat(computedStyle.borderRightWidth) || 0;
    const total = borderLeft + borderRight;
    const result = (!Number.isFinite(total) || total < 0) ? 2 : total;
    
    cachedStyleValues.set(element, result);
    return result;
};

const GUIComponent = props => {
    const handleEnableProcedureReturns = useCallback(() => {
        try {
            const workspace = AddonHooks.blocklyWorkspace;
            
            if (workspace && workspace.enableProcedureReturns) {
                workspace.enableProcedureReturns();
                
                if (workspace.refreshToolboxSelection_) {
                    workspace.refreshToolboxSelection_();
                }
            }
        } catch (error) {
            console.error('Error enabling procedure returns:', error);
        }
    }, []);

    const editorWrapperRef = useRef(null);
    const stageAndTargetWrapperRef = useRef(null);
    const stageResizeRafRef = useRef(null);
    const measureRafRef = useRef(null);
    const syncingModeRef = useRef(false);
    const prevStageSizeModeRef = useRef(null);
    const lastSyncedWidthRef = useRef(null);
    const [stagePanelWidth, setStagePanelWidth] = useState(null);
    const [stageContainerWidth, setStageContainerWidth] = useState(null);

    const handleStagePanelResizeDoubleClick = useCallback(() => {
        setStagePanelWidth(null);
        setStageContainerWidth(null);
    }, []);

    const getStageBorderExtraWidth = useCallback(containerEl => {
        if (!containerEl || typeof window === 'undefined') return 0;
        
        const stageEl = containerEl.querySelector('[class*="stage_stage"]');
        if (!stageEl) return 2;
        
        return getCachedBorderWidth(stageEl);
    }, []);

    const measureStageContainerWidth = useCallback(() => {
        if (measureRafRef.current) return;
        
        measureRafRef.current = requestAnimationFrame(() => {
            measureRafRef.current = null;
            
            const el = stageAndTargetWrapperRef.current;
            if (!el) return;

            const rect = el.getBoundingClientRect();
            if (!Number.isFinite(rect.width)) return;

            const computedStyle = window.getComputedStyle(el);
            const paddingLeft = Number.parseFloat(computedStyle.paddingLeft) || 0;
            const paddingRight = Number.parseFloat(computedStyle.paddingRight) || 0;
            const borderExtra = getStageBorderExtraWidth(el);

            const innerWidth = Math.max(
                0,
                rect.width - paddingLeft - paddingRight - borderExtra
            );

            setStageContainerWidth(prev => {
                if (typeof prev === 'number' && Math.abs(prev - innerWidth) < 2) {
                    return prev;
                }
                return innerWidth;
            });
        });
    }, [getStageBorderExtraWidth]);

    const lastResizeWidthRef = useRef(null);
    useEffect(() => {
        if (typeof stageContainerWidth !== 'number') return;

        const rounded = Math.round(stageContainerWidth);
        if (lastResizeWidthRef.current === rounded) return;

        lastResizeWidthRef.current = rounded;

        if (stageResizeRafRef.current) return;
        stageResizeRafRef.current = requestAnimationFrame(() => {
            stageResizeRafRef.current = null;
            window.dispatchEvent(new Event('resize'));
        });
    }, [stageContainerWidth]);

    const setStageWidth = useCallback(contentWidth => {
        if (contentWidth === null) {
            setStagePanelWidth(null);
            setStageContainerWidth(null);
            return;
        }

        const el = stageAndTargetWrapperRef.current;
        let paddingLeft = 8;
        let paddingRight = 8;
        let borderExtra = 2;
        if (el) {
            const computedStyle = window.getComputedStyle(el);
            paddingLeft = Number.parseFloat(computedStyle.paddingLeft) || 0;
            paddingRight = Number.parseFloat(computedStyle.paddingRight) || 0;
            borderExtra = getStageBorderExtraWidth(el);
        }

        let outerWidth = contentWidth + 2 + paddingLeft + paddingRight + borderExtra;

        const editorEl = editorWrapperRef.current;
        const containerEl = editorEl ? editorEl.parentElement : null;
        const containerWidth = containerEl ?
            containerEl.getBoundingClientRect().width :
            window.innerWidth;
        const maxOuterWidth = containerWidth - MIN_EDITOR_PANE_WIDTH - 6;
        if (Number.isFinite(maxOuterWidth) && maxOuterWidth > 0) {
            outerWidth = Math.min(outerWidth, maxOuterWidth);
        }

        setStagePanelWidth(outerWidth);
        setStageContainerWidth(contentWidth + 2);
    }, [getStageBorderExtraWidth]);

    useEffect(() => {
        if (prevStageSizeModeRef.current === null) {
            prevStageSizeModeRef.current = props.stageSizeRequestId;
            return;
        }
        if (prevStageSizeModeRef.current === props.stageSizeRequestId) return;
        prevStageSizeModeRef.current = props.stageSizeRequestId;

        if (props.isFullScreen) return;
        if (syncingModeRef.current) {
            syncingModeRef.current = false;
            return;
        }

        if (props.stageSizeMode === STAGE_SIZE_MODES.small) {
            setStageWidth(FIXED_WIDTH * 0.5);
        } else if (props.stageSizeMode === STAGE_SIZE_MODES.large) {
            setStageWidth(FIXED_WIDTH);
        } else {
            setStageWidth(null);
        }
    }, [props.stageSizeMode, props.stageSizeRequestId, props.isFullScreen, setStageWidth]);

    useEffect(() => {
        if (stageContainerWidth === lastSyncedWidthRef.current) return;
        lastSyncedWidthRef.current = stageContainerWidth;

        if (props.isFullScreen) return;
        if (typeof stageContainerWidth !== 'number') return;
        if (typeof props.onSetStageSize !== 'function') return;

        const smallThreshold = Math.min(
            AUTO_SMALL_STAGE_INNER_WIDTH,
            (props.customStageSize && props.customStageSize.width) || FIXED_WIDTH
        );
        const isSmall = stageContainerWidth < smallThreshold;

        if (isSmall && props.stageSizeMode !== STAGE_SIZE_MODES.small) {
            syncingModeRef.current = true;
            props.onSetStageSize(STAGE_SIZE_MODES.small);
        } else if (!isSmall && props.stageSizeMode === STAGE_SIZE_MODES.small) {
            syncingModeRef.current = true;
            props.onSetStageSize(STAGE_SIZE_MODES.full);
        }
    }, [
        stageContainerWidth,
        props.isFullScreen,
        props.onSetStageSize,
        props.stageSizeMode,
        props.customStageSize
    ]);

    useEffect(() => {
        measureStageContainerWidth();
        const el = stageAndTargetWrapperRef.current;
        if (!el || typeof ResizeObserver === 'undefined') return;
        const observer = new ResizeObserver(() => {
            measureStageContainerWidth();
        });
        observer.observe(el);
        return () => {
            observer.disconnect();
            if (measureRafRef.current) {
                cancelAnimationFrame(measureRafRef.current);
                measureRafRef.current = null;
            }
        };
    }, [measureStageContainerWidth]);

    const handleStagePanelResizePointerDown = useCallback(e => {
        if (typeof e.button !== 'undefined' && e.button !== 0) return;
        e.preventDefault();

        const el = stageAndTargetWrapperRef.current;
        if (!el) return;
        const editorEl = editorWrapperRef.current;
        const startRect = el.getBoundingClientRect();
        const computedStyle = window.getComputedStyle(el);
        const paddingLeft = Number.parseFloat(computedStyle.paddingLeft) || 0;
        const paddingRight = Number.parseFloat(computedStyle.paddingRight) || 0;
        const borderExtra = getStageBorderExtraWidth(el);
        const editorRect = editorEl ? editorEl.getBoundingClientRect() : null;
        const startX = (typeof e.clientX === 'number') ? e.clientX : 0;
        const startWidth = startRect.width;
        const startInnerWidth = Math.max(0, startWidth - paddingLeft - paddingRight - borderExtra);

        setStageContainerWidth(Math.round(startInnerWidth));

        if (e.currentTarget &&
            typeof e.currentTarget.setPointerCapture === 'function' &&
            typeof e.pointerId === 'number') {
            try {
                e.currentTarget.setPointerCapture(e.pointerId);
            } catch (err) {
                // ignore
            }
        }

        const minWidth = Math.max(0, (FIXED_WIDTH * 0.5) + paddingLeft + paddingRight + borderExtra);

        const containerEl = editorEl ? editorEl.parentElement : null;
        const containerRect = containerEl ? containerEl.getBoundingClientRect() : null;
        const containerWidth = (containerRect && Number.isFinite(containerRect.width)) ?
            containerRect.width :
            window.innerWidth;
        const resizerRect = (e.currentTarget && typeof e.currentTarget.getBoundingClientRect === 'function') ?
            e.currentTarget.getBoundingClientRect() : null;
        const resizerWidth = (resizerRect && Number.isFinite(resizerRect.width)) ? resizerRect.width : 6;

        const maxWidthByEditor = Math.max(minWidth, containerWidth - MIN_EDITOR_PANE_WIDTH - resizerWidth);

        let stageWrapperEl = el.querySelector('[class*="stage-wrapper_stage-wrapper"]');
        if (!stageWrapperEl) {
            const candidates = Array.from(el.querySelectorAll('[class*="stage-wrapper"]'));
            stageWrapperEl = candidates.find(candidate => candidate.querySelector('[class*="stage-header"]'));
        }
        const stageCanvasEl = stageWrapperEl ? stageWrapperEl.querySelector('[class*="stage_stage"]') : null;

        const stageWrapperRect = stageWrapperEl ? stageWrapperEl.getBoundingClientRect() : null;
        const stageCanvasRect = stageCanvasEl ? stageCanvasEl.getBoundingClientRect() : null;
        const stageOverheadHeight = (stageWrapperRect && stageCanvasRect) ?
            Math.max(0, stageWrapperRect.height - stageCanvasRect.height) :
            88;

        const maxStageCanvasHeight = Math.max(
            0,
            startRect.height - MIN_TARGET_PANE_HEIGHT - stageOverheadHeight
        );

        const customSize = props.customStageSize;
        const widthPerHeight = (customSize && customSize.height > 0) ?
            (customSize.width / customSize.height) :
            (4 / 3);
        const maxInnerWidthByHeight = (maxStageCanvasHeight * widthPerHeight) + 2;
        const maxWidthByHeight = Math.max(
            minWidth,
            maxInnerWidthByHeight + paddingLeft + paddingRight + borderExtra
        );

        const maxWidth = Math.min(maxWidthByEditor, maxWidthByHeight);

        const stageIsLeft = editorRect ? (startRect.left < editorRect.left) : false;
        const directionFactor = stageIsLeft ? 1 : -1;

        let moveRaf = null;
        const onMove = ev => {
            if (moveRaf) return;
            
            moveRaf = requestAnimationFrame(() => {
                moveRaf = null;
                
                const x = (typeof ev.clientX === 'number') ? ev.clientX : 0;
                const dx = x - startX;
                const nextWidth = Math.min(maxWidth, Math.max(minWidth, startWidth + (dx * directionFactor)));
                const nextInnerWidth = Math.max(0, nextWidth - paddingLeft - paddingRight - borderExtra);
                
                setStagePanelWidth(nextWidth);
                setStageContainerWidth(prev => {
                    if (typeof prev === 'number' && Math.abs(prev - nextInnerWidth) < 0.5) {
                        return prev;
                    }
                    return nextInnerWidth;
                });
            });
        };

        const onUp = () => {
            if (moveRaf) {
                cancelAnimationFrame(moveRaf);
                moveRaf = null;
            }
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
        };

        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
    }, [
        getStageBorderExtraWidth,
        props.customStageSize
    ]);

    const {
        accountNavOpen,
        activeTabIndex,
        alertsVisible,
        authorId,
        authorThumbnailUrl,
        authorUsername,
        basePath,
        backdropLibraryVisible,
        backpackHost,
        backpackVisible,
        blocksId,
        blocksTabVisible,
        cardsVisible,
        canChangeLanguage,
        canChangeTheme,
        canCreateNew,
        canEditTitle,
        canManageFiles,
        canRemix,
        canSave,
        canCreateCopy,
        canShare,
        canUseCloud,
        children,
        connectionModalVisible,
        costumeLibraryVisible,
        soundLibraryVisible,
        costumesTabVisible,
        customStageSize,
        enableCommunity,
        intl,
        extensionLibraryVisible,
        isCreating,
        isEmbedded,
        isFullScreen,
        isPlayerOnly,
        isRtl,
        isShared,
        isWindowFullScreen,
        isTelemetryEnabled,
        isTotallyNormal,
        loading,
        locale,
        logo,
        renderLogin,
        onClickAbout,
        onClickAccountNav,
        onCloseAccountNav,
        onClickAddonSettings,
        onClickDesktopSettings,
        onClickNewWindow,
        onClickPackager,
        onLogOut,
        onOpenExtensionLibrary,
        onOpenExtensionManagerModal,
        onOpenRegistration,
        onToggleLoginOpen,
        onActivateCostumesTab,
        onActivateSoundsTab,
        onActivateTab,
        onClickLogo,
        onExtensionButtonClick,
        onOpenCustomExtensionModal,
        onProjectTelemetryEvent,
        onRequestCloseBackdropLibrary,
        onRequestCloseCostumeLibrary,
        onRequestCloseExtensionLibrary,
        onRequestCloseSoundLibrary,
        onRequestCloseTelemetryModal,
        onSeeCommunity,
        onSetStageSize: _onSetStageSize,
        onSetFullScreen: _onSetFullScreen,
        onShare,
        onShowPrivacyPolicy,
        onStartSelectingFileUpload,
        onTelemetryModalCancel,
        onTelemetryModalOptIn,
        onTelemetryModalOptOut,
        securityManager,
        showComingSoon,
        showOpenFilePicker,
        showSaveFilePicker,
        soundsTabVisible,
        stageSizeMode,
        targetIsStage,
        telemetryModalVisible,
        theme,
        tipsLibraryVisible,
        onOpenOnboarding,
        onboardingVisible,
        usernameModalVisible,
        settingsModalVisible,
        customExtensionModalVisible,
        fontsModalVisible,
        unknownPlatformModalVisible,
        invalidProjectModalVisible,
        gitModalVisible,
        shortcutManagerModalVisible,
        vm,
        ...componentProps
    } = omit(props, 'dispatch');
    if (children) {
        return <Box {...componentProps}>{children}</Box>;
    }

    useEffect(() => {
        const hasSeenOnboarding = localStorage.getItem('mw:has-seen-onboarding');
        if (!hasSeenOnboarding && !isEmbedded && !isPlayerOnly && typeof onOpenOnboarding === 'function') {
            const timer = setTimeout(() => {
                onOpenOnboarding();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [isEmbedded, isPlayerOnly, onOpenOnboarding]);

    useEffect(() => {
        if (onStartSelectingFileUpload || onClickPackager) {
            const {updateCallbacks: updateShortcutsCallbacks} = require('../../lib/shortcuts/event-router.js');
            const newCallbacks = {};
            if (onStartSelectingFileUpload) {
                newCallbacks.loadFromComputer = onStartSelectingFileUpload;
            }
            if (onClickPackager) {
                newCallbacks.openPackager = onClickPackager;
            }
            updateShortcutsCallbacks(newCallbacks);
        }
    }, [onStartSelectingFileUpload, onClickPackager]);

    const tabClassNames = useMemo(() => ({
        tabs: styles.tabs,
        tab: classNames(tabStyles.reactTabsTab, styles.tab),
        tabList: classNames(tabStyles.reactTabsTabList, styles.tabList),
        tabPanel: classNames(tabStyles.reactTabsTabPanel, styles.tabPanel),
        tabPanelSelected: classNames(tabStyles.reactTabsTabPanelSelected, styles.isSelected),
        tabSelected: classNames(tabStyles.reactTabsTabSelected, styles.isSelected)
    }), []);

    const unconstrainedWidth = useMemo(() => (
        UNCONSTRAINED_NON_STAGE_WIDTH +
        FIXED_WIDTH +
        Math.max(0, customStageSize.width - FIXED_WIDTH)
    ), [customStageSize.width]);

    const alwaysEnabledModals = useMemo(() => (
        <React.Fragment>
            <NotificationsProvider />
            <TWSecurityManager securityManager={securityManager} />
            <TWRestorePointManager />
            <MWExtensionManagerModal />
            <MWProjectThemeModal />
            <WarpThemeModal />
            <ShortcutManager visible={shortcutManagerModalVisible} />
            {usernameModalVisible && <TWUsernameModal visible={usernameModalVisible} />}
            {settingsModalVisible && (
                <TWSettingsModal
                    isRtl={isRtl}
                    visible={settingsModalVisible}
                />
            )}
            {customExtensionModalVisible && <TWCustomExtensionModal />}
            {fontsModalVisible && <TWFontsModal />}
            {unknownPlatformModalVisible && <TWUnknownPlatformModal />}
            {invalidProjectModalVisible && <TWInvalidProjectModal />}
            {gitModalVisible && <TWGitModal />}
            <SimpleDialog />
            {onboardingVisible && <Onboarding />}
        </React.Fragment>
    ), [
        securityManager,
        usernameModalVisible,
        settingsModalVisible,
        isRtl,
        customExtensionModalVisible,
        fontsModalVisible,
        unknownPlatformModalVisible,
        invalidProjectModalVisible,
        gitModalVisible,
        shortcutManagerModalVisible,
        onboardingVisible
    ]);

    const minDimensions = useMemo(() => ({
        minWidth: typeof stagePanelWidth === 'number' ?
            MIN_EDITOR_PANE_WIDTH + stagePanelWidth + 6 + 16 :
            1024 + Math.max(0, customStageSize.width - 480),
        minHeight: 640 + Math.max(0, customStageSize.height - 360)
    }), [customStageSize.width, customStageSize.height, stagePanelWidth]);

    const stagePanelStyle = useMemo(() => {
        if (!stagePanelWidth) return null;
        return {
            width: `${stagePanelWidth}px`,
            flexBasis: `${stagePanelWidth}px`,
            flexShrink: 0
        };
    }, [stagePanelWidth]);

    return (<MediaQuery minWidth={unconstrainedWidth}>{isUnconstrained => {
        const stageSize = resolveStageSize(stageSizeMode, isUnconstrained);

        return isPlayerOnly ? (
            <React.Fragment>
                {isWindowFullScreen ? (
                    <div
                        className={styles.fullscreenBackground}
                        style={{
                            backgroundColor: fullscreenBackgroundColor
                        }}
                    />
                ) : null}
                <StageWrapper
                    isFullScreen={isFullScreen}
                    isEmbedded={isEmbedded}
                    isRendererSupported={isRendererSupported()}
                    isRtl={isRtl}
                    loading={loading}
                    stageSize={STAGE_SIZE_MODES.full}
                    vm={vm}
                >
                    {alertsVisible ? (
                        <Alerts className={styles.alertsContainer} />
                    ) : null}
                </StageWrapper>
                {alwaysEnabledModals}
            </React.Fragment>
        ) : (
            <Box
                className={styles.pageWrapper}
                dir={isRtl ? 'rtl' : 'ltr'}
                style={minDimensions}
                {...componentProps}
            >
                {alwaysEnabledModals}
                {telemetryModalVisible ? (
                    <TelemetryModal
                        isRtl={isRtl}
                        isTelemetryEnabled={isTelemetryEnabled}
                        onCancel={onTelemetryModalCancel}
                        onOptIn={onTelemetryModalOptIn}
                        onOptOut={onTelemetryModalOptOut}
                        onRequestClose={onRequestCloseTelemetryModal}
                        onShowPrivacyPolicy={onShowPrivacyPolicy}
                    />
                ) : null}
                {loading ? (
                    <Loader isFullScreen />
                ) : null}
                {isCreating ? (
                    <Loader
                        isFullScreen
                        messageId="gui.loader.creating"
                    />
                ) : null}
                <CollabLoader />
                {isBrowserSupported() ? null : (
                    <BrowserModal
                        isRtl={isRtl}
                        onClickDesktopSettings={onClickDesktopSettings}
                    />
                )}
                {tipsLibraryVisible ? (
                    <TipsLibrary />
                ) : null}
                {cardsVisible ? (
                    <Cards />
                ) : null}
                {alertsVisible ? (
                    <Alerts className={styles.alertsContainer} />
                ) : null}
                {connectionModalVisible ? (
                    <ConnectionModal
                        vm={vm}
                    />
                ) : null}
                <CollaborationContainer />
                {costumeLibraryVisible ? (
                    <CostumeLibrary
                        vm={vm}
                        onRequestClose={onRequestCloseCostumeLibrary}
                    />
                ) : null}
                {backdropLibraryVisible ? (
                    <BackdropLibrary
                        vm={vm}
                        onRequestClose={onRequestCloseBackdropLibrary}
                    />
                ) : null}
                {soundLibraryVisible ? (
                    <SoundLibrary
                        vm={vm}
                        onRequestClose={onRequestCloseSoundLibrary}
                    />
                ) : null}
                <MenuBar
                    accountNavOpen={accountNavOpen}
                    authorId={authorId}
                    authorThumbnailUrl={authorThumbnailUrl}
                    authorUsername={authorUsername}
                    canChangeLanguage={canChangeLanguage}
                    canChangeTheme={canChangeTheme}
                    canCreateCopy={canCreateCopy}
                    canCreateNew={canCreateNew}
                    canEditTitle={canEditTitle}
                    canManageFiles={canManageFiles}
                    canRemix={canRemix}
                    canSave={canSave}
                    canShare={canShare}
                    className={styles.menuBarPosition}
                    enableCommunity={enableCommunity}
                    isShared={isShared}
                    isTotallyNormal={isTotallyNormal}
                    logo={logo}
                    renderLogin={renderLogin}
                    showComingSoon={showComingSoon}
                    showOpenFilePicker={showOpenFilePicker}
                    showSaveFilePicker={showSaveFilePicker}
                    onClickAbout={onClickAbout}
                    onClickAccountNav={onClickAccountNav}
                    onClickAddonSettings={onClickAddonSettings}
                    onClickDesktopSettings={onClickDesktopSettings}
                    onClickNewWindow={onClickNewWindow}
                    onClickPackager={onClickPackager}
                    onClickLogo={onClickLogo}
                    onCloseAccountNav={onCloseAccountNav}
                    onLogOut={onLogOut}
                    onOpenExtensionLibrary={onOpenExtensionLibrary}
                    onOpenExtensionManagerModal={onOpenExtensionManagerModal}
                    onOpenRegistration={onOpenRegistration}
                    onProjectTelemetryEvent={onProjectTelemetryEvent}
                    onSeeCommunity={onSeeCommunity}
                    onShare={onShare}
                    onStartSelectingFileUpload={onStartSelectingFileUpload}
                    onToggleLoginOpen={onToggleLoginOpen}
                />
                <Box className={styles.bodyWrapper}>
                    <Box className={styles.flexWrapper}>
                        <Box
                            className={styles.editorWrapper}
                            ref={editorWrapperRef}
                        >
                            <NativeFindBar
                                activeTabIndex={activeTabIndex}
                                isPlayerOnly={isPlayerOnly}
                                locale={locale}
                                vm={vm}
                            />
                            <Tabs
                                forceRenderTabPanel
                                className={tabClassNames.tabs}
                                selectedIndex={activeTabIndex}
                                selectedTabClassName={tabClassNames.tabSelected}
                                selectedTabPanelClassName={tabClassNames.tabPanelSelected}
                                onSelect={onActivateTab}
                            >
                                <TabList className={tabClassNames.tabList}>
                                    <Tab className={tabClassNames.tab}>
                                        <BlocksIcon size={20} />
                                        <FormattedMessage
                                            defaultMessage="Code"
                                            description="Button to get to the code panel"
                                            id="gui.gui.codeTab"
                                        />
                                    </Tab>
                                    <Tab
                                        className={tabClassNames.tab}
                                        onClick={onActivateCostumesTab}
                                    >
                                        <CostumesIcon size={20} />
                                        {targetIsStage ? (
                                            <FormattedMessage
                                                defaultMessage="Backdrops"
                                                description="Button to get to the backdrops panel"
                                                id="gui.gui.backdropsTab"
                                            />
                                        ) : (
                                            <FormattedMessage
                                                defaultMessage="Costumes"
                                                description="Button to get to the costumes panel"
                                                id="gui.gui.costumesTab"
                                            />
                                        )}
                                    </Tab>
                                    <Tab
                                        className={tabClassNames.tab}
                                        onClick={onActivateSoundsTab}
                                    >
                                        <SoundsIcon size={20} />
                                        <FormattedMessage
                                            defaultMessage="Sounds"
                                            description="Button to get to the sounds panel"
                                            id="gui.gui.soundsTab"
                                        />
                                    </Tab>
                                </TabList>
                                <TabPanel className={tabClassNames.tabPanel}>
                                    <Box className={styles.blocksWrapper}>
                                        <Blocks
                                            key={`${blocksId}/${theme.id}`}
                                            canUseCloud={canUseCloud}
                                            grow={1}
                                            isVisible={blocksTabVisible}
                                            options={{
                                                media: `${basePath}static/${theme.getBlocksMediaFolder()}/`
                                            }}
                                            stageSize={stageSize}
                                            onOpenCustomExtensionModal={onOpenCustomExtensionModal}
                                            theme={theme}
                                            vm={vm}
                                        />
                                    </Box>
                                    <Box className={styles.extensionButtonContainer}>
                                        <button
                                            className={styles.extensionButton}
                                            title={intl.formatMessage(messages.addExtension)}
                                            onClick={onExtensionButtonClick}
                                        >
                                            <ExtensionIcon
                                                className={styles.extensionButtonIcon}
                                                draggable={false}
                                            />
                                        </button>
                                    </Box>
                                    <Box className={styles.watermark}>
                                        <Watermark />
                                    </Box>
                                </TabPanel>
                                <TabPanel className={tabClassNames.tabPanel}>
                                    {costumesTabVisible ? <CostumeTab
                                        vm={vm}
                                    /> : null}
                                </TabPanel>
                                <TabPanel className={tabClassNames.tabPanel}>
                                    {soundsTabVisible ? <SoundTab vm={vm} /> : null}
                                </TabPanel>
                            </Tabs>
                            {backpackVisible ? (
                                <Backpack host={backpackHost} />
                            ) : null}
                        </Box>

                        <Box
                            className={styles.stagePaneResizer}
                            onPointerDown={handleStagePanelResizePointerDown}
                            onDoubleClick={handleStagePanelResizeDoubleClick}
                            role="separator"
                            aria-orientation="vertical"
                            tabIndex={-1}
                        />

                        <Box
                            className={classNames(styles.stageAndTargetWrapper, styles[stageSize])}
                            ref={stageAndTargetWrapperRef}
                            style={stagePanelStyle}
                        >
                            <StageWrapper
                                isFullScreen={isFullScreen}
                                isRendererSupported={isRendererSupported()}
                                isRtl={isRtl}
                                stageSize={stageSize}
                                stageContainerWidth={
                                    typeof stageContainerWidth === 'number' ? stageContainerWidth : null
                                }
                                vm={vm}
                            />
                            <Box className={styles.targetWrapper}>
                                <TargetPane
                                    stageSize={stageSize}
                                    vm={vm}
                                />
                            </Box>
                        </Box>
                    </Box>
                </Box>
                {extensionLibraryVisible ? (
                    <ExtensionLibrary
                        vm={vm}
                        visible={extensionLibraryVisible}
                        onRequestClose={onRequestCloseExtensionLibrary}
                        onOpenCustomExtensionModal={onOpenCustomExtensionModal}
                        onEnableProcedureReturns={handleEnableProcedureReturns}
                    />
                ) : null}
                <DragLayer />
            </Box>
        );
    }}</MediaQuery>);
};

GUIComponent.propTypes = {
    accountNavOpen: PropTypes.bool,
    activeTabIndex: PropTypes.number,
    authorId: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
    authorThumbnailUrl: PropTypes.string,
    authorUsername: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
    backdropLibraryVisible: PropTypes.bool,
    backpackHost: PropTypes.string,
    backpackVisible: PropTypes.bool,
    basePath: PropTypes.string,
    blocksTabVisible: PropTypes.bool,
    blocksId: PropTypes.string,
    canChangeLanguage: PropTypes.bool,
    canChangeTheme: PropTypes.bool,
    canCreateCopy: PropTypes.bool,
    canCreateNew: PropTypes.bool,
    canEditTitle: PropTypes.bool,
    canManageFiles: PropTypes.bool,
    canRemix: PropTypes.bool,
    canSave: PropTypes.bool,
    canShare: PropTypes.bool,
    canUseCloud: PropTypes.bool,
    cardsVisible: PropTypes.bool,
    children: PropTypes.node,
    costumeLibraryVisible: PropTypes.bool,
    soundLibraryVisible: PropTypes.bool,
    costumesTabVisible: PropTypes.bool,
    customStageSize: PropTypes.shape({
        width: PropTypes.number,
        height: PropTypes.number
    }),
    enableCommunity: PropTypes.bool,
    extensionLibraryVisible: PropTypes.bool,
    intl: intlShape.isRequired,
    isCreating: PropTypes.bool,
    isEmbedded: PropTypes.bool,
    isFullScreen: PropTypes.bool,
    isPlayerOnly: PropTypes.bool,
    isRtl: PropTypes.bool,
    isShared: PropTypes.bool,
    isWindowFullScreen: PropTypes.bool,
    isTotallyNormal: PropTypes.bool,
    loading: PropTypes.bool,
    logo: PropTypes.string,
    onActivateCostumesTab: PropTypes.func,
    onActivateSoundsTab: PropTypes.func,
    onActivateTab: PropTypes.func,
    onClickAccountNav: PropTypes.func,
    onClickAddonSettings: PropTypes.func,
    onClickDesktopSettings: PropTypes.func,
    onClickPackager: PropTypes.func,
    onClickNewWindow: PropTypes.func,
    onClickLogo: PropTypes.func,
    onCloseAccountNav: PropTypes.func,
    onExtensionButtonClick: PropTypes.func,
    onOpenCustomExtensionModal: PropTypes.func,
    onLogOut: PropTypes.func,
    onOpenExtensionLibrary: PropTypes.func,
    onOpenExtensionManagerModal: PropTypes.func,
    onOpenRegistration: PropTypes.func,
    onRequestCloseBackdropLibrary: PropTypes.func,
    onRequestCloseCostumeLibrary: PropTypes.func,
    onRequestCloseSoundLibrary: PropTypes.func,
    onRequestCloseExtensionLibrary: PropTypes.func,
    onRequestCloseTelemetryModal: PropTypes.func,
    onSeeCommunity: PropTypes.func,
    onShare: PropTypes.func,
    onShowPrivacyPolicy: PropTypes.func,
    onStartSelectingFileUpload: PropTypes.func,
    onTabSelect: PropTypes.func,
    onTelemetryModalCancel: PropTypes.func,
    onTelemetryModalOptIn: PropTypes.func,
    onTelemetryModalOptOut: PropTypes.func,
    onToggleLoginOpen: PropTypes.func,
    onSetStageSize: PropTypes.func,
    onSetFullScreen: PropTypes.func,
    renderLogin: PropTypes.func,
    securityManager: PropTypes.shape({}),
    showComingSoon: PropTypes.bool,
    showOpenFilePicker: PropTypes.func,
    showSaveFilePicker: PropTypes.func,
    soundsTabVisible: PropTypes.bool,
    stageSizeMode: PropTypes.oneOf(Object.keys(STAGE_SIZE_MODES)),
    stageSizeRequestId: PropTypes.number,
    targetIsStage: PropTypes.bool,
    telemetryModalVisible: PropTypes.bool,
    theme: PropTypes.instanceOf(Theme),
    tipsLibraryVisible: PropTypes.bool,
    onOpenOnboarding: PropTypes.func,
    onboardingVisible: PropTypes.bool,
    usernameModalVisible: PropTypes.bool,
    settingsModalVisible: PropTypes.bool,
    shortcutManagerModalVisible: PropTypes.bool,
    customExtensionModalVisible: PropTypes.bool,
    fontsModalVisible: PropTypes.bool,
    unknownPlatformModalVisible: PropTypes.bool,
    invalidProjectModalVisible: PropTypes.bool,
    gitModalVisible: PropTypes.bool,
    vm: PropTypes.instanceOf(VM).isRequired
};
GUIComponent.defaultProps = {
    backpackHost: null,
    backpackVisible: false,
    basePath: './',
    blocksId: 'original',
    canChangeLanguage: true,
    canChangeTheme: true,
    canCreateNew: false,
    canEditTitle: false,
    canManageFiles: true,
    canRemix: false,
    canSave: false,
    canCreateCopy: false,
    canShare: false,
    canUseCloud: false,
    enableCommunity: false,
    isCreating: false,
    isShared: false,
    isTotallyNormal: false,
    loading: false,
    showComingSoon: false,
    stageSizeMode: STAGE_SIZE_MODES.large
};

const mapStateToProps = state => ({
    customStageSize: state.scratchGui.customStageSize,
    isWindowFullScreen: state.scratchGui.tw.isWindowFullScreen,
    blocksId: state.scratchGui.timeTravel.year.toString(),
    stageSizeMode: state.scratchGui.stageSize.stageSize,
    stageSizeRequestId: state.scratchGui.stageSize.requestId,
    theme: state.scratchGui.theme.theme,
    locale: state.locales.locale,
    onboardingVisible: state.scratchGui.onboarding.visible,
    shortcutManagerModalVisible: state.scratchGui.modals.shortcutManagerModal
});

const mapDispatchToProps = dispatch => ({
    onSetStageSize: stageSize => dispatch(setStageSize(stageSize)),
    onOpenOnboarding: () => dispatch(showOnboarding())
});

export default injectIntl(connect(
    mapStateToProps,
    mapDispatchToProps
)(GUIComponent));
