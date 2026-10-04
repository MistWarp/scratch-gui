import {guardSavedCallback} from './save-guard.js';
import {isProjectOperationActive, isProjectOperationActiveError, withProjectOperation} from '../project-operation.js';
import openMistWarpShareWindow from './open-mw-share-window.js';
import {getRememberedPlatformProjectState, publishToMistWarp} from '../community/publish.js';
import {request} from '../community/api.js';
import communityEnabled from '../community/enabled.js';
import downloadBlob from '../utils/download-blob';
import {createMwp} from '../git/mwp.js';
import {projectFilename} from '../utils/safe-filename.js';
import {setSaveFeedback} from './save-feedback.js';
import {trackDaily} from '../../community/analytics.js';

const agreementAccepted = async () => {
    try {
        const {agreement} = await request('/agreement');
        return !(agreement.version > 0 && !agreement.accepted);
    } catch (e) {
        return false;
    }
};

// Ctrl+S / save button. Saving never creates a version: it uploads the
// current worktree snapshot and leaves the edits as uncommitted changes.
// Own project already on MistWarp -> upload silently. Someone else's
// project -> the window (remix makes a copy). Not on MistWarp yet ->
// download the native .mwp. The window only reappears for an update when a
// new upload agreement needs accepting, or the silent upload fails.
// Commits happen explicitly from the save window or Project history.
// Pressing save again while a save (or any other project operation) is still
// running is ignored and resolves false; the first save reports its outcome.
const savesInFlight = new WeakSet();
const runSmartSave = async ({vm, title, onSaved}) => {
    const onSavedIfCurrent = guardSavedCallback(vm, onSaved);
    const platform = communityEnabled ? getRememberedPlatformProjectState() : null;

    if (!platform) {
        setSaveFeedback(vm, 'downloading');
        let blob;
        try {
            ({blob} = await withProjectOperation(vm, () =>
                createMwp({vm, message: 'Save MistWarp project', commitChanges: false})));
        } catch (e) {
            if (isProjectOperationActiveError(e)) {
                // Another operation started first; nothing was attempted.
                setSaveFeedback(vm, null);
                return false;
            }
            setSaveFeedback(vm, 'downloadFailed');
            throw e;
        }
        downloadBlob(projectFilename(title, 'project', 'mwp'), blob);
        setSaveFeedback(vm, 'downloaded');
        trackDaily('project_saved', {kind: 'download'});
        onSavedIfCurrent();
        return true;
    }

    if (platform.isOwner === false && !platform.canSaveDirectly) {
        openMistWarpShareWindow({vm, initialTitle: title, action: 'remix', onPublished: onSavedIfCurrent});
        return false;
    }

    if (!(await agreementAccepted())) {
        openMistWarpShareWindow({vm, initialTitle: title, action: 'update', onPublished: onSavedIfCurrent});
        return false;
    }

    try {
        onSavedIfCurrent(await publishToMistWarp({vm, title: null, updateOnly: true, commitChanges: false}));
        return true;
    } catch (e) {
        // An autosave or other operation won the race: not a failure to report.
        if (isProjectOperationActiveError(e)) return false;
        openMistWarpShareWindow({
            vm,
            initialTitle: title,
            initialError: e,
            action: 'update',
            onPublished: onSavedIfCurrent
        });
        return false;
    }
};

const smartSave = async ({vm, title, onSaved = () => {}}) => {
    if (vm && (savesInFlight.has(vm) || isProjectOperationActive(vm))) return false;
    if (vm) savesInFlight.add(vm);
    try {
        return await runSmartSave({vm, title, onSaved});
    } finally {
        if (vm) savesInFlight.delete(vm);
    }
};

export {
    guardSavedCallback
};

export default smartSave;
