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
    hash,
    isEmbedded,
    isPlayerOnly,
    isShowingDefaultProject,
    projectChanged,
    search
}) => {
    if (dismissed || isEmbedded || isPlayerOnly || projectChanged) return false;
    if (!isShowingDefaultProject) return false;
    return !loadsProjectFromUrl(search, hash);
};

const isEditorWelcomeDismissed = () => {
    try {
        return localStorage.getItem(STORAGE_KEY) === DISMISSED;
    } catch (e) {
        return true;
    }
};

const dismissEditorWelcome = () => {
    try {
        localStorage.setItem(STORAGE_KEY, DISMISSED);
    } catch (e) {
        return false;
    }
    return true;
};

export {
    STORAGE_KEY,
    PROJECT_SOURCE_PARAMS,
    dismissEditorWelcome,
    isEditorWelcomeDismissed,
    loadsProjectFromUrl,
    shouldShowEditorWelcome
};
