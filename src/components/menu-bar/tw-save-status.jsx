import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import React, {useCallback} from 'react';
import InlineMessages from '../../containers/inline-messages.jsx';
import SB3Downloader from '../../containers/sb3-downloader.jsx';
import {filterInlineAlerts} from '../../reducers/alerts';
import {setProjectUnchanged} from '../../reducers/project-changed';
import openMistWarpShareWindow from '../../lib/mw/open-mw-share-window.js';
import {getMistWarpAction, getRememberedPlatformProjectState} from '../../lib/community/publish.js';

import {Save} from 'lucide-react';

import styles from './save-status.css';

const TWSaveStatus = ({
    alertsList,
    fileHandle,
    projectChanged,
    projectTitle,
    roturReady,
    showSaveFilePicker,
    onProjectUnchanged,
    vm
}) => {
    const platformState = roturReady ? getRememberedPlatformProjectState() : null;
    const mistwarpAction = roturReady ?
        getMistWarpAction(platformState, projectChanged) :
        null;
    const openSaveWindow = useCallback(() => openMistWarpShareWindow({
        vm,
        initialTitle: projectTitle,
        action: mistwarpAction,
        onPublished: onProjectUnchanged
    }), [vm, projectTitle, mistwarpAction, onProjectUnchanged]);
    const onSaveClick = openSaveWindow;
    if (filterInlineAlerts(alertsList).length > 0) {
        return <InlineMessages />;
    }
    if (!projectChanged) {
        return null;
    }
    const saveToComputer = (
        <SB3Downloader
            showSaveFilePicker={showSaveFilePicker}
        >
            {(_className, _downloadProjectCallback, {smartSave}) => (
                <div
                    onClick={smartSave}
                    className={styles.saveNow}
                    title={fileHandle ?
                        `Save as ${fileHandle.name}` :
                        'Save to your computer'}
                >
                    <Save
                        className={styles.saveIconAlways}
                        size={18}
                    />
                </div>
            )}
        </SB3Downloader>
    );
    if (!mistwarpAction) {
        return saveToComputer;
    }
    const mistwarpLabel = mistwarpAction === 'remix' ? 'Remix to MistWarp' : 'Save to MistWarp';
    return (
        <div
            className={styles.saveNow}
            onClick={onSaveClick}
            title={mistwarpLabel}
        >
            <Save
                className={styles.saveIconAlways}
                size={18}
            />
        </div>
    );
};

TWSaveStatus.propTypes = {
    alertsList: PropTypes.arrayOf(PropTypes.object),
    fileHandle: PropTypes.shape({
        name: PropTypes.string
    }),
    projectChanged: PropTypes.bool,
    projectTitle: PropTypes.string,
    roturReady: PropTypes.bool,
    showSaveFilePicker: PropTypes.func,
    onProjectUnchanged: PropTypes.func,
    vm: PropTypes.shape({
        saveProjectSb3: PropTypes.func,
        renderer: PropTypes.object
    })
};

const mapStateToProps = state => ({
    alertsList: state.scratchGui.alerts.alertsList,
    fileHandle: state.scratchGui.tw.fileHandle,
    projectChanged: state.scratchGui.projectChanged,
    projectTitle: state.scratchGui.projectTitle,
    roturReady: state.scratchGui.rotur && state.scratchGui.rotur.status === 'ready',
    vm: state.scratchGui.vm
});

const mapDispatchToProps = dispatch => ({
    onProjectUnchanged: () => dispatch(setProjectUnchanged())
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(TWSaveStatus);
