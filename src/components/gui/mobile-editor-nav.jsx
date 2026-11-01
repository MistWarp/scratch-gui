import PropTypes from 'prop-types';
import React, {useCallback, useMemo} from 'react';
import {defineMessages, injectIntl, intlShape} from 'react-intl';
import {
    Blocks as BlocksIcon,
    PaintbrushVertical as CostumesIcon,
    Volume2 as SoundsIcon,
    Images as SpritesIcon,
    Monitor as StageIcon,
    FolderTree as FilesIcon
} from 'lucide-react';

import Box from '../box/box.jsx';
import ModeSwitch from '../code-mode/mode-switch.jsx';
import {BLOCKS_TAB_INDEX, COSTUMES_TAB_INDEX, SOUNDS_TAB_INDEX} from '../../reducers/editor-tab';
import {editorTabMessages, getEditorTabLabels} from './editor-tab-labels.js';
import MobileEditorNavButton from './mobile-editor-nav-button.jsx';
import {MOBILE_EDITOR_VIEWS} from './use-mobile-editor-view.js';
import styles from './gui.css';

const messages = defineMessages({
    sprites: {
        id: 'gui.gui.sprites',
        description: 'Sprite workspace tab in a narrow editor layout',
        defaultMessage: 'Sprites'
    },
    stage: {
        id: 'gui.gui.stage',
        description: 'Stage workspace tab in a narrow editor layout',
        defaultMessage: 'Stage'
    },
    editorViews: {
        id: 'gui.gui.editorViews',
        description: 'Accessible label for the row of workspace tabs in a narrow editor layout',
        defaultMessage: 'Editor views'
    },
    files: {
        id: 'mw.gui.files',
        description: 'Workspace tab that shows the Code mode files in a narrow editor layout',
        defaultMessage: 'Files'
    }
});

const MobileEditorNav = ({
    activeTabIndex,
    codeMode,
    intl,
    mobileEditorView,
    targetIsStage,
    onSelectTab,
    onSelectView
}) => {
    const editorTabLabels = useMemo(() => getEditorTabLabels(intl, targetIsStage), [intl, targetIsStage]);
    const handleCodeTab = useCallback(() => onSelectTab(BLOCKS_TAB_INDEX), [onSelectTab]);
    const handleCostumesTab = useCallback(() => onSelectTab(COSTUMES_TAB_INDEX), [onSelectTab]);
    const handleSoundsTab = useCallback(() => onSelectTab(SOUNDS_TAB_INDEX), [onSelectTab]);
    const handleFilesTab = useCallback(() => onSelectView(MOBILE_EDITOR_VIEWS.editor), [onSelectView]);
    const handleSpritesTab = useCallback(() => onSelectView(MOBILE_EDITOR_VIEWS.sprites), [onSelectView]);
    const handleStageTab = useCallback(() => onSelectView(MOBILE_EDITOR_VIEWS.stage), [onSelectView]);
    const editorViewSelected = mobileEditorView === MOBILE_EDITOR_VIEWS.editor;

    return (
        <Box
            className={styles.mobileEditorNav}
            role="tablist"
            aria-label={intl.formatMessage(messages.editorViews)}
        >
            <ModeSwitch
                compact
                onSurface
                className={styles.mobileModeSwitch}
            />
            {codeMode ? (
                <MobileEditorNavButton
                    icon={FilesIcon}
                    label={intl.formatMessage(messages.files)}
                    message={messages.files}
                    selected={editorViewSelected}
                    onClick={handleFilesTab}
                />
            ) : null}
            {codeMode ? null : (<React.Fragment>
                <MobileEditorNavButton
                    icon={BlocksIcon}
                    label={editorTabLabels.code}
                    message={editorTabMessages.code}
                    selected={editorViewSelected && activeTabIndex === BLOCKS_TAB_INDEX}
                    onClick={handleCodeTab}
                />
                <MobileEditorNavButton
                    icon={CostumesIcon}
                    label={editorTabLabels.costumes}
                    message={targetIsStage ? editorTabMessages.backdrops : editorTabMessages.costumes}
                    selected={editorViewSelected && activeTabIndex === COSTUMES_TAB_INDEX}
                    onClick={handleCostumesTab}
                />
                <MobileEditorNavButton
                    icon={SoundsIcon}
                    label={editorTabLabels.sounds}
                    message={editorTabMessages.sounds}
                    selected={editorViewSelected && activeTabIndex === SOUNDS_TAB_INDEX}
                    onClick={handleSoundsTab}
                />
            </React.Fragment>)}
            <MobileEditorNavButton
                icon={SpritesIcon}
                label={intl.formatMessage(messages.sprites)}
                message={messages.sprites}
                selected={mobileEditorView === MOBILE_EDITOR_VIEWS.sprites}
                onClick={handleSpritesTab}
            />
            <MobileEditorNavButton
                icon={StageIcon}
                label={intl.formatMessage(messages.stage)}
                message={messages.stage}
                selected={mobileEditorView === MOBILE_EDITOR_VIEWS.stage}
                onClick={handleStageTab}
            />
        </Box>
    );
};

MobileEditorNav.propTypes = {
    activeTabIndex: PropTypes.number,
    codeMode: PropTypes.bool,
    intl: intlShape.isRequired,
    mobileEditorView: PropTypes.oneOf(Object.values(MOBILE_EDITOR_VIEWS)).isRequired,
    targetIsStage: PropTypes.bool,
    onSelectTab: PropTypes.func.isRequired,
    onSelectView: PropTypes.func.isRequired
};

export default injectIntl(MobileEditorNav);
