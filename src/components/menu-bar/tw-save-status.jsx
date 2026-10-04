import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import React, {useCallback, useEffect, useState} from 'react';
import {defineMessages, injectIntl, intlShape} from 'react-intl';
import classNames from 'classnames';
import InlineMessages from '../../containers/inline-messages.jsx';
import {closeAlertWithId, filterInlineAlerts, showAlertWithTimeout, showStandardAlert} from '../../reducers/alerts';
import {setProjectUnchanged} from '../../reducers/project-changed';
import openMistWarpShareWindow from '../../lib/mw/open-mw-share-window.js';
import {getMistWarpAction, getRememberedPlatformProjectState} from '../../lib/community/publish.js';
import communityEnabled from '../../lib/community/enabled.js';
import {isProjectOperationActive, PROJECT_OPERATION_EVENT} from '../../lib/project-operation.js';
import {getShortcutKey} from '../../lib/shortcuts/registry.js';
import {isMac} from '../../lib/utils/browser';

import {Cloud, Download, Save} from 'lucide-react';
import smartSave, {guardSavedCallback} from '../../lib/mw/smart-save.js';
import {getSaveFeedback, setSaveFeedback, SAVE_FEEDBACK_EVENT} from '../../lib/mw/save-feedback.js';
import {getSetting, onSettingsChanged} from '../../lib/mw/autosave-settings.js';

import styles from './save-status.css';

const messages = defineMessages({
    saving: {
        defaultMessage: 'Saving…',
        description: 'Menu bar save status while the project uploads to MistWarp',
        id: 'mw.saveStatus.saving'
    },
    preparingDownload: {
        defaultMessage: 'Preparing download…',
        description: 'Menu bar save status while a project file is built for download',
        id: 'mw.saveStatus.preparingDownload'
    },
    downloadFailed: {
        defaultMessage: 'Download failed',
        description: 'Menu bar save status after saving a project file to the computer failed',
        id: 'mw.saveStatus.downloadFailed'
    },
    saveFailed: {
        defaultMessage: 'Not saved',
        description: 'Menu bar save status after uploading the project to MistWarp failed',
        id: 'mw.saveStatus.saveFailed'
    },
    unsaved: {
        defaultMessage: 'Unsaved changes',
        description: 'Menu bar save status when the project has changes that are not saved yet',
        id: 'mw.saveStatus.unsaved'
    },
    saved: {
        defaultMessage: 'Saved',
        description: 'Menu bar save status when the latest changes are saved to MistWarp',
        id: 'mw.saveStatus.saved'
    },
    downloaded: {
        defaultMessage: 'Saved to computer',
        description: 'Menu bar save status after the project was downloaded to the computer',
        id: 'mw.saveStatus.downloaded'
    },
    readOnly: {
        defaultMessage: 'Read-only',
        description: 'Menu bar save status for a project the user is not allowed to save or remix',
        id: 'mw.saveStatus.readOnly'
    },
    readOnlyDetail: {
        // eslint-disable-next-line max-len
        defaultMessage: 'You can\'t save changes to this project or remix it. Use File > Save to your computer to keep a copy.',
        // eslint-disable-next-line max-len
        description: 'Tooltip on the disabled save button for a read-only project. File > Save to your computer is a menu path.',
        id: 'mw.saveStatus.readOnlyDetail'
    },
    remixLabel: {
        defaultMessage: 'Remix to MistWarp',
        description: 'Menu bar save button for a MistWarp project owned by someone else',
        id: 'mw.saveStatus.remixLabel'
    },
    updateLabel: {
        defaultMessage: 'Save changes',
        description: 'Menu bar save button for the user\'s own MistWarp project',
        id: 'mw.saveStatus.updateLabel'
    },
    uploadLabel: {
        defaultMessage: 'Save to MistWarp',
        description: 'Menu bar save button for a project that is not on MistWarp yet',
        id: 'mw.saveStatus.uploadLabel'
    },
    downloadLabel: {
        defaultMessage: 'Save to your computer',
        description: 'Menu bar save button when MistWarp accounts are unavailable',
        id: 'mw.saveStatus.downloadLabel'
    },
    remixDetail: {
        defaultMessage: 'Creates your own copy of this project on MistWarp.',
        description: 'Tooltip on the menu bar remix button',
        id: 'mw.saveStatus.remixDetail'
    },
    updateDetail: {
        defaultMessage: 'Uploads your latest changes to this MistWarp project.',
        description: 'Tooltip on the menu bar save button for the user\'s own MistWarp project',
        id: 'mw.saveStatus.updateDetail'
    },
    uploadDetail: {
        defaultMessage: 'Uploads this project to your MistWarp account.',
        description: 'Tooltip on the menu bar save button for a project that is not on MistWarp yet',
        id: 'mw.saveStatus.uploadDetail'
    },
    shortcutDownloads: {
        defaultMessage: '{shortcut} saves a copy to your computer instead.',
        // eslint-disable-next-line max-len
        description: 'Tooltip addition explaining that the save keyboard shortcut downloads a project that is not on MistWarp yet. {shortcut} is a key combination such as Ctrl+S.',
        id: 'mw.saveStatus.shortcutDownloads'
    },
    downloadDetail: {
        defaultMessage: 'Downloads a project file to your computer.',
        description: 'Tooltip on the menu bar save button when it downloads the project',
        id: 'mw.saveStatus.downloadDetail'
    },
    autosaveOn: {
        defaultMessage: 'Browser autosave is on.',
        description: 'Tooltip addition on the menu bar save button',
        id: 'mw.saveStatus.autosaveOn'
    },
    autosaveOff: {
        defaultMessage: 'Browser autosave is off.',
        description: 'Tooltip addition on the menu bar save button',
        id: 'mw.saveStatus.autosaveOff'
    }
});

// Which status the save button shows next to its label. Ordered by urgency:
// work in progress, then failures, then unsaved edits, then the last success.
const getSaveStatus = ({busy, downloadError, feedback, isOwner, projectChanged, readOnly}) => {
    if (readOnly) return 'readOnly';
    if (feedback === 'uploading') return 'saving';
    if (busy || feedback === 'downloading') return 'preparingDownload';
    if (downloadError || feedback === 'downloadFailed') return 'downloadFailed';
    if (projectChanged && feedback === 'cloudFailed') return 'saveFailed';
    if (projectChanged) return 'unsaved';
    if (feedback === 'cloud' || isOwner) return 'saved';
    if (feedback === 'downloaded') return 'downloaded';
    return null;
};

const STATUS_TONES = {
    readOnly: 'idle',
    saving: 'busy',
    preparingDownload: 'busy',
    downloadFailed: 'error',
    saveFailed: 'error',
    unsaved: 'unsaved',
    saved: 'saved',
    downloaded: 'saved'
};

const formatShortcut = key => (isMac ? key.replace(/Ctrl/g, '⌘') : key);

const TWSaveStatus = ({
    alertsList,
    customShortcuts,
    intl,
    projectChanged,
    projectTitle,
    roturReady,
    onAlertDone,
    onCloseAlert,
    onProjectUnchanged,
    onShowAlert,
    vm
}) => {
    const [feedback, setFeedback] = useState(() => getSaveFeedback(vm));
    const [autosave, setAutosave] = useState(() => getSetting('enabled'));
    const [downloadError, setDownloadError] = useState(false);
    const [busy, setBusy] = useState(false);
    const [operationActive, setOperationActive] = useState(() => isProjectOperationActive(vm));
    const [, refreshPlatform] = useState(0);
    useEffect(() => {
        const refresh = () => refreshPlatform(version => version + 1);
        window.addEventListener('mw:platform-project-changed', refresh);
        const update = event => {
            if (event.detail.vm !== vm) return;
            const next = getSaveFeedback(vm);
            setFeedback(next);
            // Downloads from this button, Ctrl+S and the shortcut all land here,
            // so show their progress and outcome where the user can see it.
            // Uploads are reported by the status next to the button instead,
            // so background autosaves do not flash alerts.
            if (next === 'downloading') {
                onShowAlert('savingMwp');
            } else if (next === 'downloaded') {
                onAlertDone('twSaveToDiskSuccess');
            } else if (next === 'downloadFailed') {
                onCloseAlert('savingMwp');
                onShowAlert('savingError');
            }
        };
        const operation = event => {
            if (event.detail.vm === vm) setOperationActive(event.detail.active);
        };
        const reset = () => {
            setSaveFeedback(vm, null);
            setDownloadError(false);
        };
        setOperationActive(isProjectOperationActive(vm));
        window.addEventListener(SAVE_FEEDBACK_EVENT, update);
        window.addEventListener(PROJECT_OPERATION_EVENT, operation);
        if (vm.on) vm.on('PROJECT_LOADED', reset);
        const unsubscribe = onSettingsChanged(() => setAutosave(getSetting('enabled')));
        return () => {
            window.removeEventListener('mw:platform-project-changed', refresh);
            window.removeEventListener(SAVE_FEEDBACK_EVENT, update);
            window.removeEventListener(PROJECT_OPERATION_EVENT, operation);
            if (vm.off) vm.off('PROJECT_LOADED', reset);
            unsubscribe();
        };
    }, [vm, onAlertDone, onCloseAlert, onShowAlert]);
    const platformState = communityEnabled && roturReady ? getRememberedPlatformProjectState() : null;
    const isOwner = platformState && (platformState.isOwner === true || platformState.canSaveDirectly === true);
    const mistwarpAction = getMistWarpAction(platformState, projectChanged) ||
        (isOwner ? 'update' : platformState ? 'remix' : 'save');
    const readOnly = Boolean(platformState && platformState.isOwner === false &&
        !platformState.canSaveDirectly && platformState.canRemix === false);
    const unavailable = readOnly || busy || operationActive;
    const onSaveClick = useCallback(() => {
        // Saves, uploads and project replacements share one lock; a second
        // click while one runs would only fail, so ignore it.
        if (unavailable || isProjectOperationActive(vm)) return;
        if (communityEnabled) {
            openMistWarpShareWindow({
                vm,
                initialTitle: projectTitle,
                action: mistwarpAction,
                onPublished: guardSavedCallback(vm, onProjectUnchanged)
            });
        } else {
            setBusy(true);
            setDownloadError(false);
            smartSave({vm, title: projectTitle, onSaved: onProjectUnchanged})
                .catch(() => setDownloadError(true))
                .finally(() => setBusy(false));
        }
    }, [vm, projectTitle, mistwarpAction, onProjectUnchanged, unavailable]);
    const status = getSaveStatus({busy, downloadError, feedback, isOwner, projectChanged, readOnly});
    const statusText = status ? intl.formatMessage(messages[status]) : '';
    const label = intl.formatMessage(communityEnabled ?
        (mistwarpAction === 'remix' ? messages.remixLabel :
            mistwarpAction === 'update' ? messages.updateLabel : messages.uploadLabel) :
        messages.downloadLabel);
    let detail;
    if (readOnly) {
        detail = intl.formatMessage(messages.readOnlyDetail);
    } else if (!communityEnabled) {
        detail = intl.formatMessage(messages.downloadDetail);
    } else if (mistwarpAction === 'remix') {
        detail = intl.formatMessage(messages.remixDetail);
    } else if (mistwarpAction === 'update') {
        detail = intl.formatMessage(messages.updateDetail);
    } else {
        detail = intl.formatMessage(messages.uploadDetail);
    }
    // Ctrl+S never uploads a project that is not on MistWarp yet (see
    // smart-save.js); say so, since this button uploads it.
    const shortcut = getShortcutKey('save', customShortcuts);
    if (communityEnabled && !platformState && shortcut) {
        detail = `${detail} ${intl.formatMessage(messages.shortcutDownloads, {shortcut: formatShortcut(shortcut)})}`;
    }
    if (isOwner && !readOnly) {
        detail = `${detail} ${intl.formatMessage(autosave ? messages.autosaveOn : messages.autosaveOff)}`;
    }
    const Icon = communityEnabled ? Cloud : feedback === 'downloaded' ? Download : Save;
    const tone = status ? STATUS_TONES[status] : null;
    return (
        <React.Fragment>
            <button
                type="button"
                className={classNames(styles.saveNow, {
                    [styles.readOnly]: readOnly,
                    [styles.busy]: !readOnly && (busy || operationActive)
                })}
                aria-busy={busy || operationActive}
                aria-disabled={unavailable}
                aria-label={statusText ? `${label}. ${statusText}. ${detail}` : `${label}. ${detail}`}
                onClick={onSaveClick}
                title={statusText ? `${statusText}. ${detail}` : detail}
            >
                <span className={styles.saveIconWrapper}>
                    <Icon
                        className={styles.saveIconAlways}
                        size={16}
                    />
                    {tone ? (
                        <span
                            className={classNames(styles.statusDot, styles[tone])}
                            data-status={status}
                        />
                    ) : null}
                </span>
                <span className={styles.saveAction}>{label}</span>
                {statusText ? (
                    <span
                        className={classNames(styles.statusText, styles[tone])}
                        role="status"
                    >
                        {statusText}
                    </span>
                ) : null}
            </button>
            {filterInlineAlerts(alertsList).length > 0 ? <InlineMessages /> : null}
        </React.Fragment>
    );
};

TWSaveStatus.propTypes = {
    alertsList: PropTypes.arrayOf(PropTypes.object),
    customShortcuts: PropTypes.objectOf(PropTypes.string),
    intl: intlShape,
    projectChanged: PropTypes.bool,
    projectTitle: PropTypes.string,
    roturReady: PropTypes.bool,
    onAlertDone: PropTypes.func,
    onCloseAlert: PropTypes.func,
    onProjectUnchanged: PropTypes.func,
    onShowAlert: PropTypes.func,
    vm: PropTypes.shape({
        saveProjectSb3: PropTypes.func,
        renderer: PropTypes.object,
        on: PropTypes.func,
        off: PropTypes.func
    })
};

const mapStateToProps = state => ({
    alertsList: state.scratchGui.alerts.alertsList,
    customShortcuts: state.scratchGui.shortcuts && state.scratchGui.shortcuts.customShortcuts,
    fileHandle: state.scratchGui.tw.fileHandle,
    projectChanged: state.scratchGui.projectChanged,
    projectTitle: state.scratchGui.projectTitle,
    roturReady: state.scratchGui.rotur && state.scratchGui.rotur.status === 'ready',
    vm: state.scratchGui.vm
});

const mapDispatchToProps = dispatch => ({
    onAlertDone: alertId => showAlertWithTimeout(dispatch, alertId),
    onCloseAlert: alertId => dispatch(closeAlertWithId(alertId)),
    onProjectUnchanged: () => dispatch(setProjectUnchanged()),
    onShowAlert: alertId => dispatch(showStandardAlert(alertId))
});

export default injectIntl(connect(
    mapStateToProps,
    mapDispatchToProps
)(TWSaveStatus));

export {TWSaveStatus, getSaveStatus};
