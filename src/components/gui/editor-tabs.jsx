import classNames from 'classnames';
import PropTypes from 'prop-types';
import React, {useMemo} from 'react';
import {FormattedMessage, injectIntl, intlShape} from 'react-intl';
import {Tab, Tabs, TabList, TabPanel} from 'react-tabs';
import VM from 'scratch-vm';
import {
    Blocks as BlocksIcon,
    PaintbrushVertical as CostumesIcon,
    Volume2 as SoundsIcon
} from 'lucide-react';

import LoadingSpinner from '../tw-loading-spinner/spinner.jsx';
import CollaborationTabIndicator from '../../containers/collaboration-tab-indicator.jsx';
import ScriptLoadIndicator from '../script-load-indicator/script-load-indicator.jsx';
import {BLOCKS_TAB_INDEX, COSTUMES_TAB_INDEX, SOUNDS_TAB_INDEX} from '../../reducers/editor-tab';
import {editorTabMessages, getEditorTabLabels} from './editor-tab-labels.js';
import styles from './gui.css';
import {getGuiComponents} from './gui-components';

const EditorTabs = ({
    activeTabIndex,
    children,
    costumesTabVisible,
    intl,
    isHidden,
    isTabListHidden,
    soundsTabVisible,
    targetIsStage,
    vm,
    onActivateTab
}) => {
    const {CostumeTab, SoundTab} = getGuiComponents();
    const editorTabLabels = useMemo(() => getEditorTabLabels(intl, targetIsStage), [intl, targetIsStage]);
    return (
        <Tabs
            forceRenderTabPanel
            className={classNames(styles.tabs, {
                [styles.mobileEditorContentHidden]: isHidden
            })}
            selectedIndex={activeTabIndex}
            selectedTabClassName={styles.tabSelected}
            selectedTabPanelClassName={styles.tabPanelSelected}
            onSelect={onActivateTab}
        >
            <TabList
                className={classNames(styles.tabList, {
                    [styles.mobileEditorDesktopTabsHidden]: isTabListHidden
                })}
            >
                <Tab
                    aria-label={editorTabLabels.code}
                    className={styles.tab}
                >
                    <BlocksIcon size={20} />
                    <FormattedMessage {...editorTabMessages.code} />
                    <CollaborationTabIndicator tab={BLOCKS_TAB_INDEX} />
                </Tab>
                <Tab
                    aria-label={editorTabLabels.costumes}
                    className={styles.tab}
                >
                    <CostumesIcon size={20} />
                    <FormattedMessage
                        {...(targetIsStage ?
                            editorTabMessages.backdrops : editorTabMessages.costumes)}
                    />
                    <CollaborationTabIndicator tab={COSTUMES_TAB_INDEX} />
                </Tab>
                <Tab
                    aria-label={editorTabLabels.sounds}
                    className={styles.tab}
                >
                    <SoundsIcon size={20} />
                    <FormattedMessage {...editorTabMessages.sounds} />
                    <CollaborationTabIndicator tab={SOUNDS_TAB_INDEX} />
                </Tab>
                <ScriptLoadIndicator />
            </TabList>
            <TabPanel className={styles.tabPanel}>
                {children}
            </TabPanel>
            <TabPanel className={styles.tabPanel}>
                <React.Suspense fallback={<LoadingSpinner />}>
                    {costumesTabVisible ? <CostumeTab
                        vm={vm}
                    /> : null}
                </React.Suspense>
            </TabPanel>
            <TabPanel className={styles.tabPanel}>
                <React.Suspense fallback={<LoadingSpinner />}>
                    {soundsTabVisible ? <SoundTab vm={vm} /> : null}
                </React.Suspense>
            </TabPanel>
        </Tabs>
    );
};

EditorTabs.propTypes = {
    activeTabIndex: PropTypes.number,
    children: PropTypes.node,
    costumesTabVisible: PropTypes.bool,
    intl: intlShape.isRequired,
    isHidden: PropTypes.bool,
    isTabListHidden: PropTypes.bool,
    soundsTabVisible: PropTypes.bool,
    targetIsStage: PropTypes.bool,
    vm: PropTypes.instanceOf(VM).isRequired,
    onActivateTab: PropTypes.func
};

export default injectIntl(EditorTabs);
