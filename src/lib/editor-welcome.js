import {request} from './community/api.js';
import {local} from '../modules/storage';

const STORAGE_KEY = 'mw:editor-welcome';
const DISMISSED = 'dismissed';

const PROJECT_SOURCE_PARAMS = [
    'project_url',
    'clone',
    'platform_project',
    'mw_assets',
    'starter',
    'restore'
];

const DEFAULT_PROJECT_HASHES = ['', '#', '#0'];

const loadsProjectFromUrl = (search, hash) => {
    const params = new URLSearchParams(search || '');
    if (PROJECT_SOURCE_PARAMS.some(key => params.has(key))) return true;
    return typeof hash === 'string' && !DEFAULT_PROJECT_HASHES.includes(hash);
};

const shouldShowEditorWelcome = ({
    dismissed,
    hasNoProjects,
    hash,
    isEmbedded,
    isPlayerOnly,
    isShowingDefaultProject,
    projectChanged,
    search
}) => {
    if (dismissed || !hasNoProjects || isEmbedded || isPlayerOnly || projectChanged) return false;
    if (!isShowingDefaultProject) return false;
    return !loadsProjectFromUrl(search, hash);
};

const hasNoOwnProjects = async () => {
    const me = await request('/me');
    if (!me || !me.username) return false;
    const data = await request(
        `/users/${encodeURIComponent(me.username)}/projects?all=true&limit=1`,
        {cache: false}
    );
    return Number(data.total) === 0;
};

const isEditorWelcomeDismissed = () => {
    if (!local.isAvailable()) return true;
    return local.readString(STORAGE_KEY) === DISMISSED;
};

const dismissEditorWelcome = () => local.writeString(STORAGE_KEY, DISMISSED);

export {
    STORAGE_KEY,
    PROJECT_SOURCE_PARAMS,
    dismissEditorWelcome,
    hasNoOwnProjects,
    isEditorWelcomeDismissed,
    loadsProjectFromUrl,
    shouldShowEditorWelcome
};
