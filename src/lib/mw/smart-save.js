import openMistWarpShareWindow from './open-mw-share-window.js';
import {getRememberedPlatformProjectState, publishToMistWarp} from '../community/publish.js';
import {request} from '../community/api.js';
import communityEnabled from '../community/enabled.js';
import downloadBlob from '../utils/download-blob';
import {createMwp} from '../git/mwp.js';
import {projectFilename} from '../utils/safe-filename.js';

const projectChangeStates = new WeakMap();

const getProjectChangeState = vm => {
    if (!vm || (typeof vm !== 'object' && typeof vm !== 'function')) return null;
    let state = projectChangeStates.get(vm);
    if (!state) {
        state = {sequence: 0};
        projectChangeStates.set(vm, state);
        if (typeof vm.on === 'function') {
            vm.on('PROJECT_CHANGED', () => {
                state.sequence++;
            });
        }
    }
    return state;
};

const guardSavedCallback = (vm, onSaved) => {
    const state = getProjectChangeState(vm);
    const sequence = state && state.sequence;
    return result => {
        if (!state || state.sequence === sequence) onSaved(result);
    };
};

const agreementAccepted = async () => {
    try {
        const {agreement} = await request('/agreement');
        return !(agreement.version > 0 && !agreement.accepted);
    } catch (e) {
        return true;
    }
};

// Ctrl+S / save button. Own project already on MistWarp -> upload the current
// version silently. Someone else's project -> the window (remix makes a copy).
// Not on MistWarp yet -> download the native .mwp. The window only reappears for an
// update when a new upload agreement needs accepting, or the silent upload fails.
const smartSave = async ({vm, title, onSaved = () => {}}) => {
    const onSavedIfCurrent = guardSavedCallback(vm, onSaved);
    const platform = communityEnabled ? getRememberedPlatformProjectState() : null;

    if (!platform) {
        const {blob} = await createMwp({vm, message: 'Save MistWarp project'});
        downloadBlob(projectFilename(title, 'project', 'mwp'), blob);
        onSavedIfCurrent();
        return true;
    }

    if (platform.isOwner === false) {
        openMistWarpShareWindow({vm, initialTitle: title, action: 'remix', onPublished: onSavedIfCurrent});
        return false;
    }

    if (!(await agreementAccepted())) {
        openMistWarpShareWindow({vm, initialTitle: title, action: 'update', onPublished: onSavedIfCurrent});
        return false;
    }

    try {
        onSavedIfCurrent(await publishToMistWarp({vm, title: null, updateOnly: true}));
        return true;
    } catch (e) {
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

export {
    guardSavedCallback
};

export default smartSave;
