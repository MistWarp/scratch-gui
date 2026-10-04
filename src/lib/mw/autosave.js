import React from 'react';
import {defineMessages, FormattedMessage} from 'react-intl';
import {getRememberedPlatformProjectState, publishToMistWarp} from '../community/publish.js';
import {isProjectOperationActive} from '../project-operation.js';
import communityEnabled from '../community/enabled.js';
import {guardSavedCallback} from './smart-save.js';
import {getSettings} from './autosave-settings.js';

const messages = defineMessages({
    autosaved: {
        defaultMessage: 'Project autosaved.',
        description: 'Toast shown after the project was automatically saved to MistWarp',
        id: 'mw.autosave.saved'
    },
    failed: {
        defaultMessage: 'Autosave failed.',
        description: 'Toast shown when automatically saving the project to MistWarp failed',
        id: 'mw.autosave.failed'
    }
});

// Toasts render inside the editor's IntlProvider, so pass translatable elements.
const toastMessage = descriptor => React.createElement(FormattedMessage, descriptor);

let inFlight = false;

const isInFlight = () => inFlight;

// Push the current worktree snapshot to MistWarp without creating a version.
// Manual saves and autosave share this path: uploads never commit, so edits
// stay as uncommitted changes until versioned explicitly from the save
// window or Project history.
const runAutosave = async ({
    vm, projectChanged, onSaved = () => {}, showToast = () => {},
    platformState, settings
} = {}) => {
    const config = settings || getSettings();
    if (!config.enabled) return false;
    if (config.only_when_changed && !projectChanged) return false;
    if (!communityEnabled) return false;
    const platform = platformState || getRememberedPlatformProjectState();
    if (!platform || !platform.id) return false;
    if (platform.isOwner === false && !platform.canSaveDirectly) return false;
    if (!vm || isProjectOperationActive(vm) || vm._mwHistoryHydration?.replaceHistory ||
        vm._mwPendingDiskOverwrite) return false;
    if (inFlight) return false;
    // Module-level re-entry guard; intentionally not atomic with the await below.
    // eslint-disable-next-line require-atomic-updates
    inFlight = true;
    try {
        const onSavedIfCurrent = guardSavedCallback(vm, onSaved);
        onSavedIfCurrent(await publishToMistWarp({
            vm,
            title: null,
            updateOnly: true,
            commitChanges: false,
            changeMessage: ''
        }));
        if (config.notifications) showToast(toastMessage(messages.autosaved), 'success');
        return true;
    } catch (e) {
        // A pending upload agreement needs an explicit user decision in the
        // save window; never nag for it from a background tick.
        if (!e || e.code !== 'agreement_required') {
            if (config.notifications) showToast(toastMessage(messages.failed), 'error');
        }
        return false;
    } finally {
        // eslint-disable-next-line require-atomic-updates
        inFlight = false;
    }
};

export {
    isInFlight,
    runAutosave
};
