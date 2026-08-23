import React from 'react';
import {FormattedMessage} from 'react-intl';
import keyMirror from 'keymirror';

import successImage from '../assets/icon--success.svg';

const AlertTypes = keyMirror({
    STANDARD: null,
    EXTENSION: null,
    INLINE: null
});

const AlertLevels = {
    SUCCESS: 'success',
    INFO: 'info',
    WARN: 'warn'
};

// Git status toasts replace each other rather than stacking.
const GIT_ALERT_IDS = [
    'gitCommitting', 'gitPushing', 'gitPulling',
    'gitCommitSuccess', 'gitPushSuccess', 'gitPullSuccess'
];

const alerts = [
    {
        alertId: 'createSuccess',
        alertType: AlertTypes.STANDARD,
        clearList: ['createSuccess', 'creating', 'createCopySuccess', 'creatingCopy',
            'createRemixSuccess', 'creatingRemix', 'saveSuccess', 'saving'],
        content: (
            <FormattedMessage
                defaultMessage="New project created."
                description="Message indicating that project was successfully created"
                id="gui.alerts.createsuccess"
            />
        ),
        iconURL: successImage,
        level: AlertLevels.SUCCESS,
        maxDisplaySecs: 5
    },
    {
        alertId: 'createCopySuccess',
        alertType: AlertTypes.STANDARD,
        clearList: ['createSuccess', 'creating', 'createCopySuccess', 'creatingCopy',
            'createRemixSuccess', 'creatingRemix', 'saveSuccess', 'saving'],
        content: (
            <FormattedMessage
                defaultMessage="Project saved as a copy."
                description="Message indicating that project was successfully created"
                id="gui.alerts.createcopysuccess"
            />
        ),
        iconURL: successImage,
        level: AlertLevels.SUCCESS,
        maxDisplaySecs: 5
    },
    {
        alertId: 'createRemixSuccess',
        alertType: AlertTypes.STANDARD,
        clearList: ['createSuccess', 'creating', 'createCopySuccess', 'creatingCopy',
            'createRemixSuccess', 'creatingRemix', 'saveSuccess', 'saving'],
        content: (
            <FormattedMessage
                defaultMessage="Project saved as a remix."
                description="Message indicating that project was successfully created"
                id="gui.alerts.createremixsuccess"
            />
        ),
        iconURL: successImage,
        level: AlertLevels.SUCCESS,
        maxDisplaySecs: 5
    },
    {
        alertId: 'creating',
        alertType: AlertTypes.STANDARD,
        clearList: ['createSuccess', 'creating', 'createCopySuccess', 'creatingCopy',
            'createRemixSuccess', 'creatingRemix', 'saveSuccess', 'saving'],
        content: (
            <FormattedMessage
                defaultMessage="Creating new…"
                description="Message indicating that project is in process of creating"
                id="gui.alerts.creating"
            />
        ),
        iconSpinner: true,
        level: AlertLevels.SUCCESS
    },
    {
        alertId: 'creatingCopy',
        alertType: AlertTypes.STANDARD,
        clearList: ['createSuccess', 'creating', 'createCopySuccess', 'creatingCopy',
            'createRemixSuccess', 'creatingRemix', 'saveSuccess', 'saving'],
        content: (
            <FormattedMessage
                defaultMessage="Copying project…"
                description="Message indicating that project is in process of copying"
                id="gui.alerts.creatingCopy"
            />
        ),
        iconSpinner: true,
        level: AlertLevels.SUCCESS
    },
    {
        alertId: 'creatingRemix',
        alertType: AlertTypes.STANDARD,
        clearList: ['createSuccess', 'creating', 'createCopySuccess', 'creatingCopy',
            'createRemixSuccess', 'creatingRemix', 'saveSuccess', 'saving'],
        content: (
            <FormattedMessage
                defaultMessage="Remixing project…"
                description="Message indicating that project is in process of remixing"
                id="gui.alerts.creatingRemix"
            />
        ),
        iconSpinner: true,
        level: AlertLevels.SUCCESS
    },
    {
        alertId: 'creatingError',
        clearList: ['createSuccess', 'creating', 'createCopySuccess', 'creatingCopy',
            'createRemixSuccess', 'creatingRemix', 'saveSuccess', 'saving'],
        closeButton: true,
        content: (
            <FormattedMessage
                defaultMessage="Could not create the project. Please try again!"
                description="Message indicating that project could not be created"
                id="gui.alerts.creatingError"
            />
        ),
        level: AlertLevels.WARN
    },
    {
        alertId: 'savingError',
        clearList: ['createSuccess', 'creating', 'createCopySuccess', 'creatingCopy',
            'createRemixSuccess', 'creatingRemix', 'saveSuccess', 'saving'],
        showDownload: true,
        // showSaveNow: true,
        closeButton: true,
        content: (
            <FormattedMessage
                defaultMessage="Project could not save."
                description="Message indicating that project could not be saved"
                id="gui.alerts.savingError"
            />
        ),
        level: AlertLevels.WARN
    },
    {
        alertId: 'assetExportError',
        clearList: ['assetExportError'],
        closeButton: true,
        content: (
            <FormattedMessage
                defaultMessage="The asset could not be exported. Please try again."
                description="Message indicating that an asset could not be exported"
                id="gui.alerts.assetExportError"
            />
        ),
        level: AlertLevels.WARN
    },
    {
        alertId: 'assetRestoreError',
        clearList: ['assetRestoreError'],
        closeButton: true,
        content: (
            <FormattedMessage
                defaultMessage="The deleted item could not be restored. Please try again."
                description="Message indicating that a deleted editor item could not be restored"
                id="gui.alerts.assetRestoreError"
            />
        ),
        level: AlertLevels.WARN
    },
    {
        alertId: 'assetDeleteError',
        alertType: AlertTypes.STANDARD,
        clearList: ['assetDeleteError'],
        closeButton: true,
        content: (
            <FormattedMessage
                defaultMessage="The item could not be deleted."
                description="Message indicating that an editor item could not be deleted"
                id="gui.alerts.assetDeleteError"
            />
        ),
        level: AlertLevels.WARN
    },
    {
        alertId: 'recordingError',
        alertType: AlertTypes.STANDARD,
        clearList: ['recordingError'],
        closeButton: true,
        content: (
            <FormattedMessage
                defaultMessage="Could not start recording. Check your microphone permission and try again."
                description="Message shown when microphone recording cannot start"
                id="gui.alerts.recordingError"
            />
        ),
        level: AlertLevels.WARN
    },
    {
        alertId: 'cloudUnavailable',
        alertType: AlertTypes.STANDARD,
        clearList: ['cloudUnavailable'],
        closeButton: true,
        content: (
            <FormattedMessage
                defaultMessage="Cloud variables are unavailable in this editor session."
                description="Message shown when cloud variables cannot be enabled"
                id="gui.alerts.cloudUnavailable"
            />
        ),
        level: AlertLevels.WARN
    },
    {
        alertId: 'usernameChangeUnavailable',
        alertType: AlertTypes.STANDARD,
        clearList: ['usernameChangeUnavailable'],
        closeButton: true,
        content: (
            <FormattedMessage
                defaultMessage="Username cannot be changed while the project is running."
                description="Message shown when a username cannot be changed while a project is running"
                id="tw.changeUsername.cannotChangeWhileRunning"
            />
        ),
        level: AlertLevels.WARN
    },
    {
        alertId: 'saveSuccess',
        alertType: AlertTypes.INLINE,
        clearList: ['saveSuccess', 'saving', 'savingError', 'twSaveToDiskSuccess',
            'twCreatingRestorePoint', 'twRestorePointSuccess', 'twRestorePointError'],
        content: (
            <FormattedMessage
                defaultMessage="Project saved."
                description="Message indicating that project was successfully saved"
                id="gui.alerts.savesuccess"
            />
        ),
        iconURL: successImage,
        level: AlertLevels.SUCCESS,
        maxDisplaySecs: 3
    },
    {
        alertId: 'twSaveToDiskSuccess',
        alertType: AlertTypes.INLINE,
        clearList: ['saveSuccess', 'saving', 'savingError', 'twCreatingRestorePoint',
            'twRestorePointSuccess', 'twRestorePointError'],
        content: (
            <FormattedMessage
                defaultMessage="Saved to your computer."
                description="Message indicating that project was successfully saved to the user's disk"
                id="tw.alerts.savedToDisk"
            />
        ),
        iconURL: successImage,
        level: AlertLevels.SUCCESS,
        maxDisplaySecs: 3
    },
    {
        alertId: 'saving',
        alertType: AlertTypes.INLINE,
        clearList: ['saveSuccess', 'saving', 'savingError', 'twSaveToDiskSuccess',
            'twCreatingRestorePoint', 'twRestorePointSuccess', 'twRestorePointError'],
        content: (
            <FormattedMessage
                defaultMessage="Saving project…"
                description="Message indicating that project is in process of saving"
                id="gui.alerts.saving"
            />
        ),
        iconSpinner: true,
        level: AlertLevels.INFO
    },
    {
        alertId: 'gitCommitting',
        alertType: AlertTypes.INLINE,
        clearList: GIT_ALERT_IDS,
        content: (
            <FormattedMessage
                defaultMessage="Committing to Git…"
                description="Message shown while a git commit is in progress"
                id="mw.alerts.gitCommitting"
            />
        ),
        iconSpinner: true,
        level: AlertLevels.INFO
    },
    {
        alertId: 'gitPushing',
        alertType: AlertTypes.INLINE,
        clearList: GIT_ALERT_IDS,
        content: (
            <FormattedMessage
                defaultMessage="Pushing to remote…"
                description="Message shown while a git push is in progress"
                id="mw.alerts.gitPushing"
            />
        ),
        iconSpinner: true,
        level: AlertLevels.INFO
    },
    {
        alertId: 'gitPulling',
        alertType: AlertTypes.INLINE,
        clearList: GIT_ALERT_IDS,
        content: (
            <FormattedMessage
                defaultMessage="Pulling from remote…"
                description="Message shown while a git pull is in progress"
                id="mw.alerts.gitPulling"
            />
        ),
        iconSpinner: true,
        level: AlertLevels.INFO
    },
    {
        alertId: 'gitCommitSuccess',
        alertType: AlertTypes.INLINE,
        clearList: GIT_ALERT_IDS,
        content: (
            <FormattedMessage
                defaultMessage="Committed to Git."
                description="Message shown after a successful git commit"
                id="mw.alerts.gitCommitSuccess"
            />
        ),
        iconURL: successImage,
        level: AlertLevels.SUCCESS,
        maxDisplaySecs: 3
    },
    {
        alertId: 'gitPushSuccess',
        alertType: AlertTypes.INLINE,
        clearList: GIT_ALERT_IDS,
        content: (
            <FormattedMessage
                defaultMessage="Pushed to remote."
                description="Message shown after a successful git push"
                id="mw.alerts.gitPushSuccess"
            />
        ),
        iconURL: successImage,
        level: AlertLevels.SUCCESS,
        maxDisplaySecs: 3
    },
    {
        alertId: 'gitPullSuccess',
        alertType: AlertTypes.INLINE,
        clearList: GIT_ALERT_IDS,
        content: (
            <FormattedMessage
                defaultMessage="Pulled from remote."
                description="Message shown after a successful git pull"
                id="mw.alerts.gitPullSuccess"
            />
        ),
        iconURL: successImage,
        level: AlertLevels.SUCCESS,
        maxDisplaySecs: 3
    },
    {
        alertId: 'twCreatingRestorePoint',
        alertType: AlertTypes.INLINE,
        clearList: ['twRestorePointSuccess', 'twRestorePointError'],
        content: (
            <FormattedMessage
                defaultMessage="Creating restore point…"
                description="Menu bar message indicating that a restore point is being automatically created"
                id="tw.alerts.creatingRestorePoint"
            />
        ),
        iconSpinner: true,
        level: AlertLevels.INFO
    },
    {
        alertId: 'twRestorePointSuccess',
        alertType: AlertTypes.INLINE,
        clearList: ['twCreatingRestorePoint', 'twRestorePointError'],
        content: (
            <FormattedMessage
                defaultMessage="Access restore points in &quot;File&quot;"
                // eslint-disable-next-line max-len
                description="Menu bar message indicating that a restore point was successfully created. File refers to the file dropdown menu."
                id="tw.alerts.restorePointSuccess"
            />
        ),
        iconURL: successImage,
        level: AlertLevels.SUCCESS,
        maxDisplaySecs: 3
    },
    {
        alertId: 'twRestorePointError',
        alertType: AlertTypes.INLINE,
        clearList: ['twCreatingRestorePoint', 'twRestorePointSuccess'],
        content: (
            <FormattedMessage
                defaultMessage="Could not create restore point"
                // eslint-disable-next-line max-len
                description="Menu bar message indicating that a restore point could not be created."
                id="tw.alerts.restorePointError"
            />
        ),
        iconURL: successImage,
        level: AlertLevels.WARN,
        maxDisplaySecs: 5
    },
    {
        alertId: 'twRestorePointExportError',
        alertType: AlertTypes.STANDARD,
        clearList: ['twRestorePointExportError'],
        closeButton: true,
        content: (
            <FormattedMessage
                defaultMessage="Could not export the restore point. Try again."
                description="Message shown when a restore point cannot be exported"
                id="tw.alerts.restorePointExportError"
            />
        ),
        level: AlertLevels.WARN
    },
    {
        alertId: 'twRestorePointLoadError',
        alertType: AlertTypes.STANDARD,
        clearList: ['twRestorePointLoadError'],
        closeButton: true,
        content: (
            <FormattedMessage
                defaultMessage="Could not load the restore point. Your current project was not replaced."
                description="Message shown when a restore point cannot be loaded"
                id="tw.alerts.restorePointLoadError"
            />
        ),
        level: AlertLevels.WARN
    },
    {
        alertId: 'cloudInfo',
        alertType: AlertTypes.STANDARD,
        clearList: ['cloudInfo'],
        content: (
            <FormattedMessage
                defaultMessage="Please note, cloud variables only support numbers, not letters or symbols. {learnMoreLink}" // eslint-disable-line max-len
                description="Info about cloud variable limitations"
                id="gui.alerts.cloudInfo"
                values={{
                    learnMoreLink: (
                        <a
                            href="https://scratch.mit.edu/info/faq/#clouddata"
                            rel="noopener noreferrer"
                            target="_blank"
                        >
                            <FormattedMessage
                                defaultMessage="Learn more."
                                description="Link text to cloud var faq"
                                id="gui.alerts.cloudInfoLearnMore"
                            />
                        </a>
                    )
                }}
            />
        ),
        closeButton: true,
        level: AlertLevels.SUCCESS,
        maxDisplaySecs: 15
    },
    {
        alertId: 'importingAsset',
        alertType: AlertTypes.STANDARD,
        clearList: [],
        content: (
            <FormattedMessage
                defaultMessage="Importing…"
                description="Message indicating that project is in process of importing"
                id="gui.alerts.importing"
            />
        ),
        iconSpinner: true,
        level: AlertLevels.SUCCESS
    },
    {
        alertId: 'assetImportError',
        clearList: ['importingAsset', 'assetImportError'],
        closeButton: true,
        content: (
            <FormattedMessage
                defaultMessage="The asset could not be imported. Check the file and try again."
                description="Message indicating that an asset could not be imported"
                id="gui.alerts.assetImportError"
            />
        ),
        level: AlertLevels.WARN
    },
    {
        alertId: 'listImportError',
        clearList: ['listImportError'],
        closeButton: true,
        content: (
            <FormattedMessage
                defaultMessage="The list could not be imported. Check the file and column number, then try again."
                description="Message indicating that a list monitor import failed"
                id="gui.alerts.listImportError"
            />
        ),
        level: AlertLevels.WARN
    },
    {
        alertId: 'blockImportError',
        clearList: ['blockImportError'],
        closeButton: true,
        content: (
            <FormattedMessage
                defaultMessage="The blocks could not be imported. Try copying or dragging them again."
                description="Message indicating that blocks could not be imported"
                id="gui.alerts.blockImportError"
            />
        ),
        level: AlertLevels.WARN
    },
    {
        alertId: 'extensionLoadError',
        clearList: ['extensionLoadError'],
        closeButton: true,
        content: (
            <FormattedMessage
                defaultMessage={
                    'The extension could not be loaded. Check the connection or extension source and try again.'
                }
                description="Message indicating that an extension failed to load"
                id="gui.alerts.extensionLoadError"
            />
        ),
        level: AlertLevels.WARN
    }
];

export {
    alerts as default,
    AlertLevels,
    AlertTypes
};
