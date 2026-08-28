import JSZip from '@turbowarp/jszip';
import {
    createProject, uploadProject, publishProject, updateProject, checkProjectAssets, getProject, remixProject,
    deleteProject, collectExtensionSources
} from './api';
import {createMwp} from '../git/mwp.js';
import {syncConfiguredRemotes} from '../git/sync-remotes.js';
import {preloadProjectHistory} from '../git/project-history.js';

const ZIP_COMPRESSABLE = ['.json', '.svg', '.wav', '.ttf', '.otf'];

// Only ship project.json plus assets the server does not already have;
// assets are content-addressed server-side so everything else is reused.
const zipProjectFiles = (files, include) => {
    const zip = new JSZip();
    for (const [name, data] of Object.entries(files)) {
        if (!include(name)) continue;
        zip.file(name, data, {
            compression: ZIP_COMPRESSABLE.some(ext => name.endsWith(ext)) ? 'DEFLATE' : 'STORE'
        });
    }
    return zip.generateAsync({type: 'blob', mimeType: 'application/x.scratch.sb3'});
};

const buildSparseSb3 = async (files, platformId) => {
    const names = Object.keys(files).filter(name => name !== 'project.json');
    const {missing} = await checkProjectAssets(platformId, names);
    const missingSet = new Set(missing);
    return zipProjectFiles(files, name => name === 'project.json' || missingSet.has(name));
};

const PLATFORM_ID_KEY = 'mw:mistwarp-current-project';
const SCRATCH_ORIGIN_KEY = 'mw:mistwarp-scratch-origin';

const rememberPlatformProject = project => {
    try {
        if (project) {
            const value = typeof project === 'object' ? project : {id: project, isOwner: true};
            sessionStorage.setItem(PLATFORM_ID_KEY, JSON.stringify({
                id: String(value.id),
                isOwner: value.isOwner,
                shared: !!value.shared,
                canRemix: value.canRemix,
                projectJsonUrl: value.projectJsonUrl,
                trustedExtensions: value.trustedExtensions || [],
                workspaceUrl: value.workspaceUrl,
                gitHead: value.gitHead,
                gitBranch: value.gitBranch,
                remixParent: value.remixParent,
                remixBaseCommit: value.remixBaseCommit
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
    if (!project) return 'save';
    if (project.isOwner === false) return changed && project.canRemix !== false ? 'remix' : null;
    return changed ? 'update' : null;
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
            renderer.draw();
            return;
        }
        if (renderer.canvas) {
            renderer.dirty = true;
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

const THUMB_MAX_BYTES = 1000000;
const THUMB_MAX_WIDTH = 960;
const THUMB_MAX_HEIGHT = 720;

// The server silently ignores thumbnails over 1MB, so shrink before upload.
const prepareThumbnailBlob = async dataUri => {
    const original = await dataUriToBlob(dataUri);
    if (!original) {
        return null;
    }
    if (original.size <= THUMB_MAX_BYTES) {
        return original;
    }
    try {
        const img = await new Promise((resolve, reject) => {
            const image = new Image();
            image.onload = () => resolve(image);
            image.onerror = reject;
            image.src = dataUri;
        });
        const scale = Math.min(1, THUMB_MAX_WIDTH / img.width, THUMB_MAX_HEIGHT / img.height);
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        const encode = (type, quality) => new Promise(resolve => canvas.toBlob(resolve, type, quality));
        const attempts = [['image/png'], ['image/jpeg', 0.85], ['image/jpeg', 0.6]];
        for (const [type, quality] of attempts) {
            const candidate = await encode(type, quality);
            if (candidate && candidate.size <= THUMB_MAX_BYTES) {
                return candidate;
            }
        }
    } catch (e) {
        return null;
    }
    return null;
};

// Save to MistWarp first, then mirror the new version to any connections the
// user has added. Sharing remains a separate action.
const publishToMistWarp = async ({
    vm, title, thumbnailBlob, changeMessage = '', commitChanges = true,
    share = false, updateOnly = false, onProgress = () => {}
}) => {
    const projectTitle = (title && title.trim()) || 'Untitled';

    let createdNow = false;
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
            createdNow = true;
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
        createdNow = true;
    }

    if (!createdNow && !updateOnly && title && platformProject.title !== projectTitle) {
        await updateProject(platformId, {title: projectTitle});
    }

    // Create + upload must be atomic: if the upload fails on a project we just
    // created, delete it so we never leave a data-less project behind.
    try {
        onProgress({phase: 'package', message: 'Preparing project files'});
        const thumbnailPromise = updateOnly ? Promise.resolve(null) :
            Promise.resolve(thumbnailBlob || captureThumbnail(vm));
        await new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve, 0)));
        const sb3Files = vm.saveProjectSb3DontZip();
        let sb3Blob;
        try {
            sb3Blob = await buildSparseSb3(sb3Files, platformId);
        } catch (e) {
            sb3Blob = await zipProjectFiles(sb3Files, () => true);
        }
        onProgress({phase: 'package', message: 'Preparing version history and extensions'});
        const mwpPromise = createMwp({
            vm,
            sb3Files,
            projectId: platformId,
            remixParent: platformProject && platformProject.remixParent,
            baseCommit: platformProject && platformProject.remixBaseCommit,
            remoteHead: platformProject && platformProject.workspaceUrl ? platformProject.gitHead : '',
            message: changeMessage.trim() || (createdNow ? 'Initial version' : 'Updated project'),
            commitChanges
        });
        const extensionSourcesPromise = collectExtensionSources(sb3Blob);
        const [thumbnail, mwp, extensions] = await Promise.all([
            thumbnailPromise,
            mwpPromise,
            extensionSourcesPromise
        ]);
        onProgress({phase: 'upload', message: 'Uploading project'});
        try {
            await uploadProject(platformId, sb3Blob, thumbnail, (loaded, total) => {
                const percent = total > 0 ? Math.min(100, Math.round((loaded / total) * 100)) : null;
                onProgress({
                    phase: 'upload',
                    message: percent !== null && percent >= 100 ? 'Processing on server' :
                        percent === null ? 'Uploading project' : `Uploading ${percent}%`,
                    loaded,
                    total
                });
            }, {workspace: mwp.blob, git: mwp.manifest, extensions});
        } catch (e) {
            if (e.code !== 'debounced' || createdNow) {
                throw e;
            }
        }
        onProgress({phase: 'finish', message: 'Updating version history'});
        await preloadProjectHistory(vm, {force: true});
    } catch (e) {
        if (createdNow && e.code !== 'upload_processing_timeout') {
            try {
                await deleteProject(platformId);
            } catch (_) {
                // best-effort cleanup
            }
            rememberPlatformProject(null);
        }
        throw e;
    }

    const remoteSync = await syncConfiguredRemotes({vm, onProgress});
    const remoteWarnings = remoteSync.filter(remote => !remote.ok);

    let shared = Boolean(platformProject && platformProject.shared);
    if (share && !shared) {
        onProgress({phase: 'publish', message: 'Sharing'});
        await publishProject(platformId);
        shared = true;
    }
    rememberPlatformProject({...platformProject, id: platformId, isOwner: true, shared});

    try {
        const withHash = new URL(window.location.href);
        withHash.hash = `mw-${platformId}`;
        window.history.replaceState(null, '', withHash);
    } catch (e) {
        // ignore
    }

    return {id: platformId, url: `/project/${platformId}`, shared, remoteWarnings};
};

export {
    publishToMistWarp,
    captureThumbnail,
    captureThumbnailDataUri,
    prepareThumbnailBlob,
    rememberPlatformProject,
    getRememberedPlatformProject,
    getRememberedPlatformProjectState,
    getMistWarpAction,
    rememberScratchOrigin,
    getScratchOrigin
};
