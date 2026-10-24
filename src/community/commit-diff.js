import {computeLineDiff} from '../lib/git/git-diff.js';
import {appendUnifiedHunks} from '../lib/git/unified-diff.js';

const TEXT_FILE = new RegExp(
    '(?:^|/)(?:\\.gitignore|README(?:\\.[^/]*)?)$|' +
    '\\.(?:fractch|json|txt|md|js|jsx|ts|tsx|css|html|xml|ya?ml|osl|oip)$',
    'i'
);

const decodeBase64Bytes = value => {
    const binary = atob(value || '');
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index);
    return bytes;
};

const decodeBase64Text = value => new TextDecoder().decode(decodeBase64Bytes(value));

const decodeInlineText = value => (
    typeof value === 'string' ? decodeBase64Text(value) : new TextDecoder().decode(value)
);

const hasInlineText = value => value !== null && typeof value !== 'undefined';

const normalizedStatus = status => {
    if (status === 'removed' || status === 'deleted') return 'removed';
    if (status === 'added') return 'added';
    return 'modified';
};

const fileHeader = (path, status) => [
    `diff --mwp a/${path} b/${path}`,
    status === 'added' ? '--- /dev/null' : `--- a/${path}`,
    status === 'removed' ? '+++ /dev/null' : `+++ b/${path}`
];

const fileText = async (apiClient, projectId, sha, path) => {
    if (!sha) return '';
    const result = await apiClient.commitFile(projectId, sha, path);
    return decodeBase64Text(result.content);
};

const legacyTreeCache = new Map();

const normalizedLegacyTree = (apiClient, projectId, sha) => {
    const key = `${projectId}:${sha}`;
    if (!legacyTreeCache.has(key)) {
        const pending = apiClient.commitFile(projectId, sha, 'project.sb3')
            .then(async snapshot => {
                const {normalizeLegacySb3Snapshot} = await import('../lib/git/mwp.js');
                return {files: await normalizeLegacySb3Snapshot(decodeBase64Bytes(snapshot.content))};
            })
            .catch(error => {
                legacyTreeCache.delete(key);
                throw error;
            });
        legacyTreeCache.set(key, pending);
    }
    return legacyTreeCache.get(key);
};

const FRACTCH_FILE = /\.fractch$/i;
const SUMMARY_TEXT_LIMIT = 40;

const pairTexts = async ({apiClient, projectId, sha, parentProjectId, parent, change}) => {
    const path = change.path;
    const status = normalizedStatus(change.status);
    const [before, after] = await Promise.all([
        status === 'added' || !parent ? '' : hasInlineText(change.oldData) ?
            decodeInlineText(change.oldData) : fileText(apiClient, parentProjectId, parent, path),
        status === 'removed' || !sha ? '' : hasInlineText(change.newData) ?
            decodeInlineText(change.newData) : fileText(apiClient, projectId, sha, path)
    ]);
    return {path, before, after};
};

export const buildCommitDiffFromInspection = async ({
    apiClient,
    projectId,
    sha,
    inspection,
    parentProjectId = projectId
}) => {
    const parent = inspection.parent || '';
    const sections = await Promise.all((inspection.files || []).map(async change => {
        const path = change.path;
        const status = normalizedStatus(change.status);
        const lines = fileHeader(path, status);

        // Media and other binary files only need their object metadata. Avoid transferring
        // either blob just to render the compact changed-asset card.
        if (!TEXT_FILE.test(path)) return [...lines, 'Binary file changed'].join('\n');

        const {before, after} = await pairTexts({apiClient, projectId, sha, parentProjectId, parent, change});
        const result = await computeLineDiff(before, after);
        if (!(result.hunks || []).length) return '';
        appendUnifiedHunks(lines, result);
        return lines.join('\n');
    }));
    return sections.filter(Boolean).join('\n');
};

export const loadCommitFileTexts = async ({apiClient, projectId, sha, inspection, parentProjectId = projectId}) => {
    const parent = inspection.parent || '';
    const changes = (inspection.files || []).filter(change => FRACTCH_FILE.test(change.path || ''));
    if (changes.length > SUMMARY_TEXT_LIMIT) return {};
    const texts = {};
    await Promise.all(changes.map(async change => {
        try {
            const {path, before, after} = await pairTexts({apiClient, projectId, sha, parentProjectId, parent, change});
            texts[path] = {before, after};
        } catch (error) {
            // Leave this file without summary texts; the line diff still renders.
        }
    }));
    return texts;
};

export const withFileCache = apiClient => {
    const cache = new Map();
    return {
        ...apiClient,
        commitFile: (projectId, sha, path, ...rest) => {
            const key = `${projectId}:${sha}:${path}:${rest.join(',')}`;
            if (!cache.has(key)) cache.set(key, apiClient.commitFile(projectId, sha, path, ...rest));
            return cache.get(key);
        }
    };
};

const treeFileMap = tree => new Map((tree?.files || []).map(file => [file.path, file]));

export const compareCommitTrees = (beforeTree, afterTree) => {
    const before = treeFileMap(beforeTree);
    const after = treeFileMap(afterTree);
    const paths = [...new Set([...before.keys(), ...after.keys()])].sort();
    return paths.reduce((changes, path) => {
        const oldFile = before.get(path);
        const newFile = after.get(path);
        if (oldFile?.oid === newFile?.oid) return changes;
        changes.push({
            path,
            status: oldFile ? (newFile ? 'modified' : 'removed') : 'added',
            oldOid: oldFile?.oid || null,
            newOid: newFile?.oid || null,
            oldSize: oldFile?.size || 0,
            newSize: newFile?.size || 0,
            oldData: oldFile?.data || null,
            newData: newFile?.data || null
        });
        return changes;
    }, []);
};

const recoverRemixBootstrapInspection = async ({apiClient, projectId, sha, remote, remixBase}) => {
    if (!remixBase?.enabled || !remixBase.projectId || !remixBase.sha || remote.files?.length) return null;
    const copiedTree = remote.tree && remote.parentTree && remote.tree === remote.parentTree;
    const inheritedHead = remixBase.currentHead && remixBase.currentHead === remote.parent;
    if (!copiedTree && !inheritedHead) return null;
    let [beforeTree, afterTree] = await Promise.all([
        apiClient.commitTree(remixBase.projectId, remixBase.sha),
        apiClient.commitTree(projectId, sha)
    ]);
    const beforeFiles = beforeTree?.files || [];
    const afterFiles = afterTree?.files || [];
    if (beforeFiles.some(file => file.path === 'project.sb3') &&
        !afterFiles.some(file => file.path === 'project.sb3')) {
        beforeTree = await normalizedLegacyTree(apiClient, remixBase.projectId, remixBase.sha);
    }
    const files = compareCommitTrees(beforeTree, afterTree);
    if (!files.length) return null;
    return {
        ...remote,
        parent: remixBase.sha,
        files,
        remixBootstrap: true,
        parentProjectId: remixBase.projectId
    };
};

export const loadCommitInspection = async ({
    apiClient,
    projectId,
    sha,
    remixBase = null,
    inspection: prefetchedInspection = null,
    onProgress = null
}) => {
    const report = (progress, label) => {
        if (onProgress) onProgress({progress, label});
    };
    if (!prefetchedInspection) report(20, 'Reading commit');
    const remote = prefetchedInspection || await apiClient.commitInspection(projectId, sha);
    report(44, 'Checking ancestry');
    const recovered = await recoverRemixBootstrapInspection({
        apiClient,
        projectId,
        sha,
        remote,
        remixBase
    });
    const inspection = recovered || remote;
    const parentProjectId = inspection.parentProjectId || projectId;
    const cachingClient = withFileCache(apiClient);
    report(58, 'Comparing project files');
    const [diff, fileTexts] = await Promise.all([
        buildCommitDiffFromInspection({apiClient: cachingClient, projectId, sha, inspection, parentProjectId}),
        loadCommitFileTexts({apiClient: cachingClient, projectId, sha, inspection, parentProjectId})
    ]);
    report(92, 'Drawing changes');
    return {...inspection, oid: inspection.sha || sha, diff, fileTexts};
};
