import {rememberPlatformProject, rememberScratchOrigin} from './community/publish.js';
import {adoptImportedProjectHistory} from './git/project-history.js';
import {detachProjectSession} from '../modules/project-session';

const detachWorkspace = vm => {
    rememberPlatformProject(null);
    rememberScratchOrigin(null);
    adoptImportedProjectHistory(vm, null, null);
    detachProjectSession(vm);
    const url = new URL(window.location.href);
    url.hash = '';
    for (const key of ['clone', 'project_url', 'platform_project', 'mw_assets', 'mw_te', 'starter', 'restore']) {
        url.searchParams.delete(key);
    }
    window.history.replaceState(null, '', url);
};
export {detachWorkspace};
