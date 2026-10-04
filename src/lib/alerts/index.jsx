import React from 'react';
import {FormattedMessage} from 'react-intl';
import keyMirror from 'keymirror';

import successImage from '../assets/icon--success.svg';
import {DOCS_BASE} from '../help/index.js';

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

// Device backup failures replace each other rather than stacking.
const RESTORE_POINT_ERROR_IDS = [
    'twRestorePointError', 'twRestorePointQuotaError', 'twRestorePointUnavailableError'
];

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
            'createRemixSuccess', 'creatingRemix', 'saveSuccess', 'saving', 'savingMwp'],
        showDownload: true,
        // showSaveNow: true,
        closeButton: true,
        content: (
            <FormattedMessage
                // eslint-disable-next-line max-len
                defaultMessage="Your project could not be saved. Choose Download to keep a copy on your computer, or look for a recent copy in File > Device backups."
                // eslint-disable-next-line max-len
                description="Message indicating that project could not be saved. Download is the button next to it. File > Device backups is the menu path."
                id="mw.alerts.savingError"
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
            'twCreatingRestorePoint', 'twRestorePointSuccess'],
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
        clearList: ['saveSuccess', 'saving', 'savingError', 'savingMwp', 'twCreatingRestorePoint',
            'twRestorePointSuccess'],
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
        alertId: 'backpackSaved',
        alertType: AlertTypes.STANDARD,
        clearList: ['backpackSaved', 'backpackInserted'],
        content: (
            <FormattedMessage
                defaultMessage="Saved to your backpack."
                description="Message shown after something is saved to the backpack"
                id="mw.alerts.backpackSaved"
            />
        ),
        iconURL: successImage,
        level: AlertLevels.SUCCESS,
        maxDisplaySecs: 3
    },
    {
        alertId: 'backpackInserted',
        alertType: AlertTypes.STANDARD,
        clearList: ['backpackSaved', 'backpackInserted'],
        content: (
            <FormattedMessage
                defaultMessage="Added from your backpack."
                description="Message shown after a backpack item is added to the project"
                id="mw.alerts.backpackInserted"
            />
        ),
        iconURL: successImage,
        level: AlertLevels.SUCCESS,
        maxDisplaySecs: 3
    },
    {
        alertId: 'savingMwp',
        alertType: AlertTypes.INLINE,
        clearList: ['saveSuccess', 'saving', 'savingError', 'savingMwp', 'twSaveToDiskSuccess'],
        content: (
            <FormattedMessage
                defaultMessage="Preparing your project file…"
                description="Message shown while a .mwp file with the project's history is built for download"
                id="mw.alerts.savingMwp"
            />
        ),
        iconSpinner: true,
        level: AlertLevels.INFO
    },
    {
        alertId: 'saving',
        alertType: AlertTypes.INLINE,
        clearList: ['saveSuccess', 'saving', 'savingError', 'twSaveToDiskSuccess',
            'twCreatingRestorePoint', 'twRestorePointSuccess'],
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
        clearList: ['twRestorePointSuccess'],
        content: (
            <FormattedMessage
                defaultMessage="Creating device backup…"
                description="Menu bar message indicating that a device backup is being created"
                id="tw.alerts.creatingRestorePoint"
            />
        ),
        iconSpinner: true,
        level: AlertLevels.INFO
    },
    {
        alertId: 'twRestorePointSuccess',
        alertType: AlertTypes.INLINE,
        clearList: ['twCreatingRestorePoint', ...RESTORE_POINT_ERROR_IDS],
        content: (
            <FormattedMessage
                defaultMessage="Device backup created. Find it in File > Device backups."
                // eslint-disable-next-line max-len
                description="Menu bar message indicating that a device backup was created. File > Device backups is the menu path to the backup list."
                id="mw.alerts.deviceBackupCreated"
            />
        ),
        iconURL: successImage,
        level: AlertLevels.SUCCESS,
        maxDisplaySecs: 3
    },
    // Backup failures stay until dismissed and offer a download instead.
    {
        alertId: 'twRestorePointError',
        alertType: AlertTypes.STANDARD,
        clearList: ['twCreatingRestorePoint', 'twRestorePointSuccess', ...RESTORE_POINT_ERROR_IDS],
        closeButton: true,
        showDownload: true,
        content: (
            <FormattedMessage
                defaultMessage="Could not create a device backup. Download your project to keep a copy."
                // eslint-disable-next-line max-len
                description="Message shown when a device backup could not be created. Download is the button next to it."
                id="mw.alerts.deviceBackupError"
            />
        ),
        level: AlertLevels.WARN
    },
    {
        alertId: 'twRestorePointQuotaError',
        alertType: AlertTypes.STANDARD,
        clearList: ['twCreatingRestorePoint', 'twRestorePointSuccess', ...RESTORE_POINT_ERROR_IDS],
        closeButton: true,
        showDownload: true,
        content: (
            <FormattedMessage
                // eslint-disable-next-line max-len
                defaultMessage="Could not create a device backup because this browser is out of storage space. Delete old backups in File > Device backups, or download your project."
                // eslint-disable-next-line max-len
                description="Message shown when a device backup failed because browser storage is full. File > Device backups is the menu path. Download is the button next to it."
                id="mw.alerts.deviceBackupQuotaError"
            />
        ),
        level: AlertLevels.WARN
    },
    {
        alertId: 'twRestorePointUnavailableError',
        alertType: AlertTypes.STANDARD,
        clearList: ['twCreatingRestorePoint', 'twRestorePointSuccess', ...RESTORE_POINT_ERROR_IDS],
        closeButton: true,
        showDownload: true,
        content: (
            <FormattedMessage
                // eslint-disable-next-line max-len
                defaultMessage="Device backups don't work in this browser window (private browsing can block them). Download your project to keep a copy."
                // eslint-disable-next-line max-len
                description="Message shown when device backups cannot be stored, for example in a private window. Download is the button next to it."
                id="mw.alerts.deviceBackupUnavailable"
            />
        ),
        level: AlertLevels.WARN
    },
    {
        alertId: 'twRestorePointExportError',
        alertType: AlertTypes.STANDARD,
        clearList: ['twRestorePointExportError'],
        closeButton: true,
        content: (
            <FormattedMessage
                defaultMessage="Could not export the device backup. Try again."
                description="Message shown when a device backup cannot be exported"
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
                defaultMessage="Could not load the device backup. Your current project was not replaced."
                description="Message shown when a device backup cannot be loaded"
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
                            href={`${DOCS_BASE}/advanced/cloud-variables/`}
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
