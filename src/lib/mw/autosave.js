import {getRememberedPlatformProjectState, publishToMistWarp} from '../community/publish.js';
import communityEnabled from '../community/enabled.js';
import {guardSavedCallback} from './smart-save.js';
import {getSettings} from './autosave-settings.js';

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
    if (platform.isOwner === false) return false;
    if (!vm) return false;
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
        if (config.notifications) showToast('Project autosaved.', 'success');
        return true;
    } catch (e) {
        // A pending upload agreement needs an explicit user decision in the
        // save window; never nag for it from a background tick.
        if (!e || e.code !== 'agreement_required') {
            if (config.notifications) showToast('Autosave failed.', 'error');
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
