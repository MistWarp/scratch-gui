import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import React, {useCallback, useEffect, useState} from 'react';
import InlineMessages from '../../containers/inline-messages.jsx';
import {filterInlineAlerts} from '../../reducers/alerts';
import {setProjectUnchanged} from '../../reducers/project-changed';
import openMistWarpShareWindow from '../../lib/mw/open-mw-share-window.js';
import {getMistWarpAction, getRememberedPlatformProjectState} from '../../lib/community/publish.js';
import communityEnabled from '../../lib/community/enabled.js';

import {Cloud, Download, Save} from 'lucide-react';
import smartSave, {guardSavedCallback} from '../../lib/mw/smart-save.js';
import {getSaveFeedback, setSaveFeedback, SAVE_FEEDBACK_EVENT} from '../../lib/mw/save-feedback.js';
import {getSetting, onSettingsChanged} from '../../lib/mw/autosave-settings.js';

import styles from './save-status.css';

const TWSaveStatus = ({
    alertsList,
    projectChanged,
    projectTitle,
    roturReady,
    onProjectUnchanged,
    vm
}) => {
    const [feedback, setFeedback] = useState(() => getSaveFeedback(vm));
    const [autosave, setAutosave] = useState(() => getSetting('enabled'));
    const [downloadError, setDownloadError] = useState(false);
    const [busy, setBusy] = useState(false);
    useEffect(() => {
        const update = event => {
            if (event.detail.vm === vm) setFeedback(getSaveFeedback(vm));
        };
        const reset = () => {
            setSaveFeedback(vm, null);
            setDownloadError(false);
        };
        window.addEventListener(SAVE_FEEDBACK_EVENT, update);
        if (vm.on) vm.on('PROJECT_LOADED', reset);
        const unsubscribe = onSettingsChanged(() => setAutosave(getSetting('enabled')));
        return () => {
            window.removeEventListener(SAVE_FEEDBACK_EVENT, update);
            if (vm.off) vm.off('PROJECT_LOADED', reset);
            unsubscribe();
        };
    }, [vm]);
    const platformState = communityEnabled && roturReady ? getRememberedPlatformProjectState() : null;
    const isOwner = platformState && platformState.isOwner === true;
    const mistwarpAction = getMistWarpAction(platformState, projectChanged) ||
        (isOwner ? 'update' : platformState ? 'remix' : 'save');
    const onSaveClick = useCallback(() => {
        if (communityEnabled) {
            openMistWarpShareWindow({
                vm,
                initialTitle: projectTitle,
                action: mistwarpAction,
                onPublished: guardSavedCallback(vm, onProjectUnchanged)
            });
        } else if (!busy) {
            setBusy(true);
            setDownloadError(false);
            smartSave({vm, title: projectTitle, onSaved: onProjectUnchanged})
                .catch(() => setDownloadError(true))
                .finally(() => setBusy(false));
        }
    }, [vm, projectTitle, mistwarpAction, onProjectUnchanged, busy]);
    const status = busy ? 'Preparing download…' : downloadError ? 'Download failed. Try again' :
        projectChanged ? 'Unsaved changes' : isOwner ? 'Saved to MistWarp' :
            feedback === 'downloaded' ? 'Downloaded to computer' : platformState ? 'Shared project' : 'Local project';
    const label = communityEnabled ? (mistwarpAction === 'remix' ? 'Remix to MistWarp' : 'Save to MistWarp') :
        'Save to your computer';
    const detail = isOwner ? (autosave ? 'Autosave is on. Publishing is separate.' : 'Autosave is off.') :
        'Device backups stay in this browser. Save a copy to keep your work.';
    const Icon = isOwner ? Cloud : feedback === 'downloaded' ? Download : Save;
    const readOnly = platformState && platformState.isOwner === false && platformState.canRemix === false;
    return (
        <React.Fragment>
            <button
                type="button"
                className={styles.saveNow}
                aria-label={`${status}. ${label}`}
                disabled={busy || readOnly}
                onClick={onSaveClick}
                title={`${status}. ${detail} ${label}`}
            >
                <Icon
                    className={styles.saveIconAlways}
                    size={16}
                />
                <span className={styles.saveLabel}>{status}</span>
            </button>
            {filterInlineAlerts(alertsList).length > 0 ? <InlineMessages /> : null}
        </React.Fragment>
    );
};

TWSaveStatus.propTypes = {
    alertsList: PropTypes.arrayOf(PropTypes.object),
    projectChanged: PropTypes.bool,
    projectTitle: PropTypes.string,
    roturReady: PropTypes.bool,
    onProjectUnchanged: PropTypes.func,
    vm: PropTypes.shape({
        saveProjectSb3: PropTypes.func,
        renderer: PropTypes.object,
        on: PropTypes.func,
        off: PropTypes.func
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

export {TWSaveStatus};
