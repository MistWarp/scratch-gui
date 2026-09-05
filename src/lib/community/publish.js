import JSZip from '@turbowarp/jszip';
import {withProjectOperation} from '../project-operation.js';
import {
    createProject, uploadProject, publishProject, updateProject, checkProjectAssets, getProject, getProjectCommits,
    remixProject, deleteProject, collectExtensionSources
} from './api';
import {createMwp} from '../git/mwp.js';
import {deleteRepo} from '../git/browser-git.js';
import {syncConfiguredRemotes} from '../git/sync-remotes.js';
import {enableAfterCloudSave} from '../mw/autosave-settings.js';
import {setSaveFeedback} from '../mw/save-feedback.js';
import {trackDaily} from '../../community/analytics.js';
import {
    adoptImportedProjectHistory,
    isProjectHistoryHydrated,
    preloadProjectHistory,
    setRemoteProjectHistory
} from '../git/project-history.js';

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

const rememberPlatformProject = (project, {resetSaveBase = false} = {}) => {
    try {
        const previous = sessionStorage.getItem(PLATFORM_ID_KEY);
        const previousProject = getRememberedPlatformProjectState();
        if (project) {
            const value = typeof project === 'object' ? project : {id: project, isOwner: true};
            sessionStorage.setItem(PLATFORM_ID_KEY, JSON.stringify({
                id: String(value.id),
                isOwner: value.isOwner,
                canSaveDirectly: value.canSaveDirectly === true,
                shared: !!value.shared,
                canRemix: value.canRemix,
                projectJsonUrl: value.projectJsonUrl,
                trustedExtensions: value.trustedExtensions || [],
                workspaceUrl: value.workspaceUrl,
                edited: value.edited,
                saveBase: !resetSaveBase && String(previousProject?.id) === String(value.id) &&
                    previousProject?.saveBase ?
                    previousProject.saveBase : (typeof value.gitHead !== 'undefined' ||
                        typeof value.edited === 'number' ? {head: value.gitHead || '', edited: value.edited} : null),
                gitHead: value.gitHead,
                gitBranch: value.gitBranch,
                remixParent: value.remixParent,
                remixBaseCommit: value.remixBaseCommit
            }));
        } else {
            sessionStorage.removeItem(PLATFORM_ID_KEY);
        }
        if (previous !== sessionStorage.getItem(PLATFORM_ID_KEY)) {
            window.dispatchEvent(new Event('mw:platform-project-changed'));
        }
    } catch (e) {
        // ignore
    }
};


const getRememberedPlatformProject = () => {
    const project = getRememberedPlatformProjectState();
    return project && project.id;
};

const getMistWarpAction = (project, changed) => {
    if (!project) return 'save';
    if (project.isOwner === false && !project.canSaveDirectly) {
        return changed && project.canRemix !== false ? 'remix' : null;
    }
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
const publishWorkspace = async ({
    vm, title, thumbnailBlob, changeMessage = '', commitChanges = true,
    share = false, updateOnly = false, onProgress = () => {}
}) => {
    const projectTitle = (title && title.trim()) || 'Untitled';

    let createdNow = false;
    let baseHistory = null;
    let platformProject = getRememberedPlatformProjectState();
    const wasLiveContributor = platformProject && !platformProject.isOwner && platformProject.canSaveDirectly;
    let platformId = platformProject && platformProject.id;
    const saveBase = platformProject && platformProject.saveBase;
    const importedHistory = vm && vm._mwHistoryHydration;
    const replaceHistory = Boolean(importedHistory && importedHistory.replaceHistory &&
        importedHistory.projectId === String(platformId));
    if (platformId) {
        try {
            const existing = (await getProject(platformId)).project;
            if (saveBase && ((saveBase.head || '') !== (existing.gitHead || '') ||
                (typeof saveBase.edited === 'number' && saveBase.edited !== existing.edited))) {
                throw Object.assign(new Error('This project was saved elsewhere after you opened it. ' +
                    'Your code has not been uploaded. Download your work before reopening the saved project.'),
                {code: 'head_changed'});
            }
            platformProject = existing;
            rememberPlatformProject(existing);
            setRemoteProjectHistory(existing);
        } catch (e) {
            if (e.status === 404) {
                platformId = null;
                setRemoteProjectHistory(null);
            } else {
                throw e;
            }
        }
        if (wasLiveContributor && !platformProject.canSaveDirectly) {
            throw new Error('Your live editing access ended. Ask the owner to approve a new session before saving.');
        }
        if (platformId && !platformProject.isOwner && !platformProject.canSaveDirectly) {
            onProgress({phase: 'register', message: 'Creating remix'});
            const remixSource = platformProject;
            const remix = await remixProject(platformId);
            platformId = remix.id;
            // The remix inherits the parent's history at its recorded base commit.
            // Keep the complete server state so createMwp can export only objects
            // created after that base instead of uploading the inherited DAG again.
            platformProject = (await getProject(platformId)).project;
            baseHistory = await getProjectCommits(remixSource.id, remixSource.projectJsonUrl);
            rememberPlatformProject(platformProject);
            setRemoteProjectHistory(platformProject);
            createdNow = true;
        }
    }

    if (!platformId) {
        setRemoteProjectHistory(null);
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

    if (!createdNow && platformProject.isOwner && !updateOnly && title && platformProject.title !== projectTitle) {
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
        onProgress({phase: 'package', message: 'Preparing pushed history and extensions'});
        const remixBaseHead = createdNow && platformProject?.remixParent ?
            platformProject.remixBaseCommit || '' : '';
        const remoteHead = replaceHistory ? '' :
            remixBaseHead || (platformProject?.workspaceUrl ? platformProject.gitHead : '');
        const additionalParents = [];
        if (remoteHead && !isProjectHistoryHydrated(vm)) {
            if (!baseHistory) {
                baseHistory = await getProjectCommits(platformId, platformProject.projectJsonUrl);
            }
            // Bounded graph metadata cannot prove that an older fork base is
            // missing. Ordinary saves never add speculative repair parents.
            await deleteRepo();
        }
        const mwpPromise = createMwp({
            vm,
            sb3Files,
            projectId: platformId,
            remixParent: platformProject && platformProject.remixParent,
            baseCommit: platformProject && platformProject.remixBaseCommit,
            remoteHead,
            branch: platformProject?.gitBranch || 'main',
            additionalParents,
            message: changeMessage.trim() || (createdNow ? 'Initial version' : 'Updated project'),
            commitChanges,
            requireChanges: commitChanges && !createdNow && !replaceHistory,
            baseHistory
        });
        const extensionSourcesPromise = collectExtensionSources(sb3Blob);
        const [thumbnail, mwp, extensions] = await Promise.all([
            thumbnailPromise,
            mwpPromise,
            extensionSourcesPromise
        ]);
        onProgress({phase: 'upload', message: 'Uploading project'});
        const uploaded = await uploadProject(platformId, sb3Blob, thumbnail, (loaded, total) => {
            const percent = total > 0 ? Math.min(100, Math.round((loaded / total) * 100)) : null;
            onProgress({
                phase: 'upload',
                message: percent !== null && percent >= 100 ? 'Processing on server' :
                    percent === null ? 'Uploading project' : `Uploading ${percent}%`,
                loaded,
                total
            });
        }, {workspace: mwp.blob,
            git: mwp.manifest,
            replaceHistory,
            extensions,
            expectedHead: platformProject.gitHead || '',
            expectedEdited: platformProject.edited});
        platformProject = {...platformProject,
            ...(uploaded && uploaded.project),
            gitHead: uploaded?.project?.gitHead || mwp.manifest.head,
            gitBranch: uploaded?.project?.gitBranch || mwp.manifest.branch
        };
        rememberPlatformProject(platformProject, {resetSaveBase: true});
        // The operation lock keeps this workspace stable through the upload.
        // eslint-disable-next-line require-atomic-updates
        vm._mwPendingDiskOverwrite = false;
        if (replaceHistory) {
            platformProject = {...platformProject, gitHead: mwp.manifest.head, gitBranch: mwp.manifest.branch};
            adoptImportedProjectHistory(vm, mwp.manifest, platformProject, false);
        }
        onProgress({phase: 'finish', message: 'Updating pushed history'});
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
    if (share && !shared && platformProject.isOwner) {
        onProgress({phase: 'publish', message: 'Sharing'});
        await publishProject(platformId);
        shared = true;
    }
    rememberPlatformProject({...platformProject, id: platformId, shared});

    try {
        const withHash = new URL(window.location.href);
        withHash.hash = `mw-${platformId}`;
        withHash.searchParams.delete('starter');
        withHash.searchParams.delete('restore');
        window.history.replaceState(null, '', withHash);
    } catch (e) {
        // ignore
    }

    enableAfterCloudSave();
    setSaveFeedback(vm, 'cloud');
    trackDaily('project_saved', {kind: 'cloud'});

    return {id: platformId, url: `/project/${platformId}`, shared, remoteWarnings};
};

const publishToMistWarp = options => withProjectOperation(options.vm, () => publishWorkspace(options));

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
