import {createProject, uploadProject, publishProject, getProject, remixProject} from './api';

const PLATFORM_ID_KEY = 'mw:mistwarp-current-project';
const SCRATCH_ORIGIN_KEY = 'mw:mistwarp-scratch-origin';

const rememberPlatformProject = project => {
    try {
        if (project) {
            const value = typeof project === 'object' ? project : {id: project, isOwner: true};
            sessionStorage.setItem(PLATFORM_ID_KEY, JSON.stringify({
                id: String(value.id),
                isOwner: value.isOwner,
                shared: !!value.shared
            }));
        } else {
            sessionStorage.removeItem(PLATFORM_ID_KEY);
        }
    } catch (e) {
        // ignore
    }
};

const getRememberedPlatformProjectState = () => {
    try {
        const stored = sessionStorage.getItem(PLATFORM_ID_KEY);
        if (!stored) return null;
        try {
            const project = JSON.parse(stored);
            return project && typeof project === 'object' ? project : {id: String(project)};
        } catch (e) {
            return {id: stored};
        }
    } catch (e) {
        return null;
    }
};

const getRememberedPlatformProject = () => {
    const project = getRememberedPlatformProjectState();
    return project && project.id;
};

const getMistWarpAction = (project, changed) => {
    if (!project) return 'share';
    if (project.isOwner === false) return changed ? 'remix' : null;
    if (project.shared) return changed ? 'update' : null;
    return 'share';
};

const rememberScratchOrigin = scratchId => {
    try {
        if (scratchId) {
            sessionStorage.setItem(SCRATCH_ORIGIN_KEY, String(scratchId));
        } else {
            sessionStorage.removeItem(SCRATCH_ORIGIN_KEY);
        }
    } catch (e) {
        // ignore
    }
};

const getScratchOrigin = () => {
    try {
        return sessionStorage.getItem(SCRATCH_ORIGIN_KEY) || null;
    } catch (e) {
        return null;
    }
};

const captureThumbnailDataUri = vm => new Promise(resolve => {
    try {
        const renderer = vm && vm.renderer;
        if (!renderer) {
            resolve(null);
            return;
        }
        if (typeof renderer.requestSnapshot === 'function') {
            renderer.requestSnapshot(dataURI => resolve(dataURI));
            return;
        }
        if (renderer.canvas) {
            renderer.draw();
            resolve(renderer.canvas.toDataURL('image/png'));
            return;
        }
        resolve(null);
    } catch (e) {
        resolve(null);
    }
});

const dataUriToBlob = async dataUri => {
    if (!dataUri) {
        return null;
    }
    try {
        return await (await fetch(dataUri)).blob();
    } catch (e) {
        return null;
    }
};

const captureThumbnail = vm => captureThumbnailDataUri(vm).then(dataUriToBlob);

// Publish the project to MistWarp: stored on the server (R2), not git.
// A git remote is only involved if the user explicitly connects one elsewhere.
const publishToMistWarp = async ({vm, title, thumbnailBlob, onProgress = () => {}}) => {
    const projectTitle = (title && title.trim()) || 'Untitled';

    let platformProject = getRememberedPlatformProjectState();
    let platformId = platformProject && platformProject.id;
    if (platformId) {
        try {
            const existing = (await getProject(platformId)).project;
            platformProject = existing;
            rememberPlatformProject(existing);
        } catch (e) {
            if (e.status === 404) {
                platformId = null;
            } else {
                throw e;
            }
        }
        if (platformId && !platformProject.isOwner) {
            onProgress({phase: 'register', message: 'Creating remix'});
            const remix = await remixProject(platformId);
            platformId = remix.id;
            platformProject = {id: platformId, isOwner: true, shared: false};
            rememberPlatformProject(platformProject);
        }
    }

    if (!platformId) {
        onProgress({phase: 'register', message: 'Creating project'});
        const scratchOrigin = getScratchOrigin();
        const payload = {title: projectTitle};
        if (scratchOrigin) {
            payload.scratchOrigin = scratchOrigin;
        }
        const created = await createProject(payload);
        platformId = created.id;
        platformProject = {id: platformId, isOwner: true, shared: false};
        rememberPlatformProject(platformProject);
    }

    onProgress({phase: 'upload', message: 'Uploading project'});
    const sb3Blob = await vm.saveProjectSb3();
    const thumbnail = thumbnailBlob || await captureThumbnail(vm);
    try {
        await uploadProject(platformId, sb3Blob, thumbnail);
    } catch (e) {
        if (e.code !== 'debounced') {
            throw e;
        }
    }

    onProgress({phase: 'publish', message: 'Publishing'});
    await publishProject(platformId);
    rememberPlatformProject({...platformProject, id: platformId, isOwner: true, shared: true});

    return {id: platformId, url: `/project/${platformId}`};
};

export {
    publishToMistWarp,
    captureThumbnail,
    captureThumbnailDataUri,
    rememberPlatformProject,
    getRememberedPlatformProject,
    getRememberedPlatformProjectState,
    getMistWarpAction,
    rememberScratchOrigin,
    getScratchOrigin
};
