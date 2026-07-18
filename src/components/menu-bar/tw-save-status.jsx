import {connect} from 'react-redux';
import {FormattedMessage} from 'react-intl';
import PropTypes from 'prop-types';
import React, {useCallback, useState} from 'react';
import InlineMessages from '../../containers/inline-messages.jsx';
import SB3Downloader from '../../containers/sb3-downloader.jsx';
import {filterInlineAlerts} from '../../reducers/alerts';
import {setProjectUnchanged} from '../../reducers/project-changed';
import openMistWarpShareWindow from '../../lib/mw/open-mw-share-window.js';
import {
    getMistWarpAction, getRememberedPlatformProjectState, publishToMistWarp
} from '../../lib/community/publish.js';

import {Save, CloudUpload, Loader} from 'lucide-react';

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
    const [uploading, setUploading] = useState(false);
    const platformState = roturReady ? getRememberedPlatformProjectState() : null;
    const mistwarpAction = roturReady ?
        getMistWarpAction(platformState, projectChanged) :
        null;
    // An already-shared project the user owns updates in place: skip the share
    // window and upload the sb3 straight away when they hit save.
    const sharedUpdate = mistwarpAction === 'update' && platformState && platformState.shared;
    const openSaveWindow = useCallback(() => openMistWarpShareWindow({
        vm,
        initialTitle: projectTitle,
        action: mistwarpAction,
        onPublished: onProjectUnchanged
    }), [vm, projectTitle, mistwarpAction, onProjectUnchanged]);
    const directUpload = useCallback(async () => {
        if (uploading) return;
        setUploading(true);
        try {
            await publishToMistWarp({vm, title: projectTitle, updateOnly: true});
            onProjectUnchanged();
        } catch (e) {
            // Something went wrong (needs sign-in, network, etc.): fall back to
            // the full save window so the user can see the error and retry.
            openSaveWindow();
        } finally {
            setUploading(false);
        }
    }, [uploading, vm, projectTitle, onProjectUnchanged, openSaveWindow]);
    const onSaveClick = sharedUpdate ? directUpload : openSaveWindow;
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
                        className={mistwarpAction ? styles.saveIconAlways : styles.saveIcon}
                        size={18}
                    />
                    {mistwarpAction ? null : (
                        <span className={styles.saveLabel}>
                            {fileHandle ? (
                                <FormattedMessage
                                    defaultMessage="Save as {file}"
                                    description="Menu bar item to save to an existing file on the user's computer"
                                    id="tw.menuBar.saveAs"
                                    values={{
                                        file: fileHandle.name
                                    }}
                                />
                            ) : (
                                <FormattedMessage
                                    defaultMessage="Save to your computer"
                                    description="Menu bar item for downloading a project to your computer"
                                    id="gui.menuBar.downloadToComputer"
                                />
                            )}
                        </span>
                    )}
                </div>
            )}
        </SB3Downloader>
    );
    if (!mistwarpAction) {
        return saveToComputer;
    }
    return (
        <React.Fragment>
            <div
                className={styles.saveNow}
                onClick={onSaveClick}
            >
                {uploading ? (
                    <Loader
                        className={styles.saveIconAlways}
                        size={18}
                    />
                ) : (
                    <CloudUpload
                        className={styles.saveIconAlways}
                        size={18}
                    />
                )}
                <span className={styles.saveLabel}>
                    {uploading ? (
                        <FormattedMessage
                            defaultMessage="Saving to MistWarp…"
                            description="Menu bar item while uploading the project to MistWarp"
                            id="mw.saveStatus.saving"
                        />
                    ) : mistwarpAction === 'remix' ? (
                        <FormattedMessage
                            defaultMessage="Remix to MistWarp"
                            description="Menu bar item to remix the project to MistWarp"
                            id="mw.saveStatus.remix"
                        />
                    ) : (
                        <FormattedMessage
                            defaultMessage="Save to MistWarp"
                            description="Menu bar item to save the project to MistWarp"
                            id="mw.saveStatus.save"
                        />
                    )}
                </span>
            </div>
            {saveToComputer}
        </React.Fragment>
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
