import PropTypes from 'prop-types';
import React from 'react';
import VM from 'scratch-vm';

import Box from '../box/box.jsx';
import NativeFindBar from '../find-bar/find-bar.jsx';
import NativeSpotlight from '../../containers/spotlight.jsx';
import {COSTUMES_TAB_INDEX} from '../../reducers/editor-tab';
import EditorTabs from './editor-tabs.jsx';
import MobileEditorNav from './mobile-editor-nav.jsx';
import MobileStagePane from './mobile-stage-pane.jsx';
import CodeWorkbenchSlot from './code-workbench-slot.jsx';
import {MOBILE_EDITOR_VIEWS} from './use-mobile-editor-view.js';
import styles from './gui.css';
import {getGuiComponents} from './gui-components';

const EditorPane = ({
    activeTabIndex,
    backpackHost,
    backpackVisible,
    blocksPanel,
    blocksTabVisible,
    codeMode,
    costumesTabVisible,
    floatingStage,
    isFullScreen,
    isMobileEditor,
    isPlayerOnly,
    isRtl,
    locale,
    mobileEditorView,
    paneRef,
    soundsTabVisible,
    stageSize,
    targetIsStage,
    vm,
    onActivateTab,
    onSelectMobileTab,
    onSelectMobileView
}) => {
    const {TargetPane, Backpack} = getGuiComponents();
    const mobileContentHidden = isMobileEditor && mobileEditorView !== MOBILE_EDITOR_VIEWS.editor;
    const showBackpack = backpackVisible && !codeMode && !mobileContentHidden &&
        !(isMobileEditor && activeTabIndex === COSTUMES_TAB_INDEX);
    return (
        <Box
            className={styles.editorWrapper}
            ref={paneRef}
        >
            <NativeFindBar
                activeTabIndex={codeMode ? -1 : activeTabIndex}
                isPlayerOnly={isPlayerOnly}
                locale={locale}
                vm={vm}
            />
            <NativeSpotlight
                blocksEditorVisible={Boolean(blocksTabVisible)}
                isPlayerOnly={isPlayerOnly}
                locale={locale}
                vm={vm}
            />
            {isMobileEditor ? (
                <MobileEditorNav
                    activeTabIndex={activeTabIndex}
                    codeMode={codeMode}
                    mobileEditorView={mobileEditorView}
                    targetIsStage={targetIsStage}
                    onSelectTab={onSelectMobileTab}
                    onSelectView={onSelectMobileView}
                />
            ) : null}
            {codeMode ? (
                <CodeWorkbenchSlot
                    floatingStage={floatingStage}
                    isHidden={mobileContentHidden}
                    vm={vm}
                />
            ) : null}
            <EditorTabs
                activeTabIndex={activeTabIndex}
                costumesTabVisible={costumesTabVisible}
                isHidden={codeMode || mobileContentHidden}
                isTabListHidden={isMobileEditor}
                soundsTabVisible={soundsTabVisible}
                targetIsStage={targetIsStage}
                vm={vm}
                onActivateTab={onActivateTab}
            >
                {blocksPanel}
            </EditorTabs>
            {isMobileEditor && mobileEditorView === MOBILE_EDITOR_VIEWS.sprites ? (
                <Box className={styles.mobileEditorPane}>
                    <TargetPane
                        stageSize={stageSize}
                        vm={vm}
                    />
                </Box>
            ) : null}
            {isMobileEditor && mobileEditorView === MOBILE_EDITOR_VIEWS.stage ? (
                <MobileStagePane
                    isFullScreen={isFullScreen}
                    isRtl={isRtl}
                    vm={vm}
                />
            ) : null}
            {showBackpack ? <Backpack host={backpackHost} /> : null}
        </Box>
    );
};

EditorPane.propTypes = {
    activeTabIndex: PropTypes.number,
    backpackHost: PropTypes.string,
    backpackVisible: PropTypes.bool,
    blocksPanel: PropTypes.node.isRequired,
    blocksTabVisible: PropTypes.bool,
    codeMode: PropTypes.bool,
    costumesTabVisible: PropTypes.bool,
    floatingStage: PropTypes.bool,
    isFullScreen: PropTypes.bool,
    isMobileEditor: PropTypes.bool,
    isPlayerOnly: PropTypes.bool,
    isRtl: PropTypes.bool,
    locale: PropTypes.string,
    mobileEditorView: PropTypes.oneOf(Object.values(MOBILE_EDITOR_VIEWS)).isRequired,
    paneRef: PropTypes.shape({current: PropTypes.instanceOf(Element)}).isRequired,
    soundsTabVisible: PropTypes.bool,
    stageSize: PropTypes.string.isRequired,
    targetIsStage: PropTypes.bool,
    vm: PropTypes.instanceOf(VM).isRequired,
    onActivateTab: PropTypes.func,
    onSelectMobileTab: PropTypes.func.isRequired,
    onSelectMobileView: PropTypes.func.isRequired
};

export default EditorPane;
