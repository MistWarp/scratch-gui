import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import React, {useCallback, useEffect, useState} from 'react';
import {defineMessages, injectIntl, intlShape} from 'react-intl';
import classNames from 'classnames';
import InlineMessages from '../../containers/inline-messages.jsx';
import {closeAlertWithId, filterInlineAlerts, showAlertWithTimeout, showStandardAlert} from '../../reducers/alerts';
import {setProjectUnchanged} from '../../reducers/project-changed';
import openMistWarpShareWindow from '../../lib/mw/open-mw-share-window.js';
import {
    getMistWarpAction,
    getRememberedPlatformProjectState,
    getScratchOrigin
} from '../../lib/community/publish.js';
import communityEnabled from '../../lib/community/enabled.js';
import {isProjectOperationActive, PROJECT_OPERATION_EVENT} from '../../lib/project-operation.js';
import {getShortcutKey} from '../../lib/shortcuts/registry.js';
import {isMac} from '../../lib/utils/browser';

import {Cloud, Download, Save} from 'lucide-react';
import smartSave, {EXPLICIT_SAVE_EVENT, guardSavedCallback} from '../../lib/mw/smart-save.js';
import {subscribeTexts, unappliedFileCount} from '../../lib/code-mode/text-store.js';
import {revealInCode} from '../../reducers/editor-tab.js';
import {
    getSaveFeedback,
    getSaveFeedbackTime,
    setSaveFeedback,
    SAVE_FEEDBACK_EVENT
} from '../../lib/mw/save-feedback.js';
import {getSetting, onSettingsChanged} from '../../lib/mw/autosave-settings.js';
import {takeEditorIntent} from '../../lib/mw/editor-intent.js';

import styles from './save-status.css';

const messages = defineMessages({
    savedWithUnapplied: {
        defaultMessage: 'Saved. {count, plural, one {# file has} other {# files have}} unapplied changes',
        description: 'Menu bar save status after an explicit save while code text tabs still have unapplied edits',
        id: 'mw.saveStatus.savedWithUnapplied'
    },
    openUnapplied: {
        defaultMessage: 'Open',
        description: 'Button next to the save status that opens the first file with unapplied code changes',
        id: 'mw.saveStatus.openUnapplied'
    },
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
    savedJustNow: {
        defaultMessage: 'Saved just now',
        description: 'Menu bar save status less than a minute after the user saved the project to MistWarp',
        id: 'mw.saveStatus.savedJustNow'
    },
    savedMinutesAgo: {
        defaultMessage: 'Saved {minutes} min ago',
        // eslint-disable-next-line max-len
        description: 'Menu bar save status some minutes after the user saved the project to MistWarp. {minutes} is a whole number from 1 to 59.',
        id: 'mw.saveStatus.savedMinutesAgo'
    },
    savedAt: {
        defaultMessage: 'Saved at {time}',
        // eslint-disable-next-line max-len
        description: 'Menu bar save status an hour or more after the user saved the project to MistWarp. {time} is a clock time such as 4:51 PM.',
        id: 'mw.saveStatus.savedAt'
    },
    autosaved: {
        defaultMessage: 'Autosaved',
        // eslint-disable-next-line max-len
        description: 'Short menu bar save status after autosave uploaded the latest changes, shown when the menu bar is crowded',
        id: 'mw.saveStatus.autosaved'
    },
    autosavedJustNow: {
        defaultMessage: 'Autosaved just now',
        description: 'Menu bar save status less than a minute after autosave uploaded the latest changes to MistWarp',
        id: 'mw.saveStatus.autosavedJustNow'
    },
    autosavedMinutesAgo: {
        defaultMessage: 'Autosaved {minutes} min ago',
        // eslint-disable-next-line max-len
        description: 'Menu bar save status some minutes after autosave uploaded the latest changes to MistWarp. {minutes} is a whole number from 1 to 59.',
        id: 'mw.saveStatus.autosavedMinutesAgo'
    },
    autosavedAt: {
        defaultMessage: 'Autosaved at {time}',
        // eslint-disable-next-line max-len
        description: 'Menu bar save status an hour or more after autosave uploaded the latest changes to MistWarp. {time} is a clock time such as 4:51 PM.',
        id: 'mw.saveStatus.autosavedAt'
    },
    autosavedDetail: {
        defaultMessage: 'Autosave uploaded your latest changes to MistWarp, so it is safe to leave the editor.',
        description: 'Tooltip on the menu bar save button after autosave uploaded the latest changes',
        id: 'mw.saveStatus.autosavedDetail'
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
    autosaveEvery: {
        // eslint-disable-next-line max-len
        defaultMessage: 'Autosave uploads your changes to MistWarp every {minutes, plural, one {minute} other {# minutes}}.',
        // eslint-disable-next-line max-len
        description: 'Tooltip addition on the menu bar save button when autosave is on. {minutes} is the autosave interval.',
        id: 'mw.saveStatus.autosaveEvery'
    },
    autosaveDisabled: {
        defaultMessage: 'Autosave is off.',
        description: 'Tooltip addition on the menu bar save button when autosave is off',
        id: 'mw.saveStatus.autosaveDisabled'
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
    if (feedback === 'autosaved') return 'autosaved';
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
    autosaved: 'saved',
    downloaded: 'saved'
};

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

const SAVED_TIME_MESSAGES = {
    saved: [messages.savedJustNow, messages.savedMinutesAgo, messages.savedAt],
    autosaved: [messages.autosavedJustNow, messages.autosavedMinutesAgo, messages.autosavedAt]
};

const formatSavedTime = (intl, status, savedAt, now) => {
    const [justNow, minutesAgo, at] = SAVED_TIME_MESSAGES[status];
    const elapsed = Math.max(0, now - savedAt);
    if (elapsed < MINUTE) return intl.formatMessage(justNow);
    if (elapsed < HOUR) return intl.formatMessage(minutesAgo, {minutes: Math.floor(elapsed / MINUTE)});
    return intl.formatMessage(at, {time: intl.formatTime(savedAt, {hour: 'numeric', minute: '2-digit'})});
};

const formatShortcut = key => (isMac ? key.replace(/Ctrl/g, '⌘') : key);

const TWSaveStatus = ({
    alertsList,
    customShortcuts,
    intl,
    projectChanged,
    projectTitle,
    roturReady,
    roturStatus,
    onAlertDone,
    onCloseAlert,
    onOpenUnapplied,
    onProjectUnchanged,
    onShowAlert,
    vm
}) => {
    const [unappliedNotice, setUnappliedNotice] = useState(0);
    useEffect(() => {
        const saved = event => {
            if (event.detail && event.detail.vm !== vm) return;
            setUnappliedNotice(unappliedFileCount());
        };
        const texts = () => setUnappliedNotice(count => (count ? unappliedFileCount() : 0));
        window.addEventListener(EXPLICIT_SAVE_EVENT, saved);
        const unsubscribe = subscribeTexts(texts);
        return () => {
            window.removeEventListener(EXPLICIT_SAVE_EVENT, saved);
            unsubscribe();
        };
    }, [vm]);
    const [feedback, setFeedback] = useState(() => getSaveFeedback(vm));
    const [savedAt, setSavedAt] = useState(() => getSaveFeedbackTime(vm));
    const [now, setNow] = useState(() => Date.now());
    const [autosave, setAutosave] = useState(() => getSetting('enabled'));
    const [autosaveInterval, setAutosaveInterval] = useState(() => getSetting('interval'));
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
            if (next === 'autosaved') setUnappliedNotice(unappliedFileCount());
            setSavedAt(getSaveFeedbackTime(vm));
            setNow(Date.now());
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
            setUnappliedNotice(0);
        };
        setOperationActive(isProjectOperationActive(vm));
        window.addEventListener(SAVE_FEEDBACK_EVENT, update);
        window.addEventListener(PROJECT_OPERATION_EVENT, operation);
        if (vm.runtime) vm.runtime.on('PROJECT_LOADED', reset);
        const unsubscribe = onSettingsChanged(() => {
            setAutosave(getSetting('enabled'));
            setAutosaveInterval(getSetting('interval'));
        });
        return () => {
            window.removeEventListener('mw:platform-project-changed', refresh);
            window.removeEventListener(SAVE_FEEDBACK_EVENT, update);
            window.removeEventListener(PROJECT_OPERATION_EVENT, operation);
            if (vm.runtime) vm.runtime.off('PROJECT_LOADED', reset);
            unsubscribe();
        };
    }, [vm, onAlertDone, onCloseAlert, onShowAlert]);
    useEffect(() => {
        const runtime = vm && vm.runtime;
        if (!communityEnabled || !runtime || !runtime.on) return;
        const intent = takeEditorIntent();
        if (!intent) return;
        const showHint = () => {
            if (intent === 'scratch') {
                if (!getScratchOrigin()) return false;
                if (!getRememberedPlatformProjectState()) onAlertDone('mwScratchHint');
                return true;
            }
            const project = getRememberedPlatformProjectState();
            if (!project || typeof project.isOwner !== 'boolean') return false;
            if (project.isOwner === false && !project.canSaveDirectly && project.canRemix !== false) {
                onAlertDone('mwRemixHint');
            }
            return true;
        };
        if (runtime.targets && runtime.targets.length && showHint()) return;
        const loaded = () => {
            runtime.off('PROJECT_LOADED', loaded);
            showHint();
        };
        runtime.on('PROJECT_LOADED', loaded);
        return () => runtime.off('PROJECT_LOADED', loaded);
    }, [vm, onAlertDone]);
    const signedOut = roturStatus === 'idle' || roturStatus === 'error';
    const platformState = communityEnabled && (roturReady || signedOut) ? getRememberedPlatformProjectState() : null;
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
                onPublished: guardSavedCallback(vm, () => {
                    onProjectUnchanged();
                    setUnappliedNotice(unappliedFileCount());
                })
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
    const showUnapplied = (status === 'saved' || status === 'autosaved') && unappliedNotice > 0 && !projectChanged;
    const timed = !showUnapplied && savedAt !== null &&
        ((status === 'saved' && feedback === 'cloud') || status === 'autosaved');
    useEffect(() => {
        if (!timed) return;
        setNow(Date.now());
        const timer = setInterval(() => setNow(Date.now()), 15 * 1000);
        return () => clearInterval(timer);
    }, [timed]);
    let statusText = '';
    if (showUnapplied) {
        statusText = intl.formatMessage(messages.savedWithUnapplied, {count: unappliedNotice});
    } else if (timed) {
        statusText = formatSavedTime(intl, status, savedAt, now);
    } else if (status) {
        statusText = intl.formatMessage(messages[status]);
    }
    const shortStatus = timed ? intl.formatMessage(messages[status]) : null;
    const liveStatus = shortStatus || statusText;
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
    if (status === 'autosaved' && !showUnapplied) {
        detail = intl.formatMessage(messages.autosavedDetail);
    } else if (isOwner && !readOnly) {
        detail = `${detail} ${autosave ?
            intl.formatMessage(messages.autosaveEvery, {minutes: autosaveInterval}) :
            intl.formatMessage(messages.autosaveDisabled)}`;
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
                        aria-hidden="true"
                    >
                        {statusText}
                    </span>
                ) : null}
                {shortStatus ? (
                    <span
                        className={classNames(styles.statusText, styles.statusShort, styles[tone])}
                        aria-hidden="true"
                    >
                        {shortStatus}
                    </span>
                ) : null}
                <span
                    className={styles.statusLive}
                    role="status"
                >
                    {liveStatus}
                </span>
            </button>
            {showUnapplied ? (
                <button
                    type="button"
                    className={styles.openUnapplied}
                    onClick={onOpenUnapplied}
                >
                    {intl.formatMessage(messages.openUnapplied)}
                </button>
            ) : null}
            {filterInlineAlerts(alertsList).length > 0 ? <InlineMessages className={styles.floatingMessage} /> : null}
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
    roturStatus: PropTypes.string,
    onAlertDone: PropTypes.func,
    onCloseAlert: PropTypes.func,
    onOpenUnapplied: PropTypes.func,
    onProjectUnchanged: PropTypes.func,
    onShowAlert: PropTypes.func,
    vm: PropTypes.shape({
        saveProjectSb3: PropTypes.func,
        renderer: PropTypes.object,
        runtime: PropTypes.shape({
            targets: PropTypes.array,
            on: PropTypes.func,
            off: PropTypes.func
        }),
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
    roturStatus: state.scratchGui.rotur && state.scratchGui.rotur.status,
    vm: state.scratchGui.vm
});

const mapDispatchToProps = dispatch => ({
    onAlertDone: alertId => showAlertWithTimeout(dispatch, alertId),
    onCloseAlert: alertId => dispatch(closeAlertWithId(alertId)),
    onOpenUnapplied: () => dispatch(revealInCode({kind: 'unapplied'})),
    onProjectUnchanged: () => dispatch(setProjectUnchanged()),
    onShowAlert: alertId => dispatch(showStandardAlert(alertId))
});

export default injectIntl(connect(
    mapStateToProps,
    mapDispatchToProps
)(TWSaveStatus));

export {TWSaveStatus, getSaveStatus};
