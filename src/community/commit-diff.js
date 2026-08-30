import {computeLineDiff} from '../lib/git/git-diff.js';

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

const CONTEXT_LINES = 3;
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

const groupedHunks = result => {
    const groups = [];
    for (const hunk of result.hunks || []) {
        const previous = groups[groups.length - 1];
        const previousHunk = previous?.[previous.length - 1];
        const oldGap = previousHunk ? hunk.oldStart - (previousHunk.oldStart + previousHunk.oldLines) : Infinity;
        const newGap = previousHunk ? hunk.newStart - (previousHunk.newStart + previousHunk.newLines) : Infinity;
        if (previous && oldGap <= CONTEXT_LINES * 2 && newGap <= CONTEXT_LINES * 2) previous.push(hunk);
        else groups.push([hunk]);
    }
    return groups;
};

const appendUnifiedHunks = (lines, result) => {
    for (const group of groupedHunks(result)) {
        const first = group[0];
        const last = group[group.length - 1];
        const oldStart = Math.max(1, first.oldStart - CONTEXT_LINES);
        const newStart = Math.max(1, first.newStart - CONTEXT_LINES);
        const oldEnd = Math.min(result.linesA.length, last.oldStart - 1 + last.oldLines + CONTEXT_LINES);
        const newEnd = Math.min(result.linesB.length, last.newStart - 1 + last.newLines + CONTEXT_LINES);
        lines.push(`@@ -${oldStart},${oldEnd - oldStart + 1} +${newStart},${newEnd - newStart + 1} @@`);
        let oldIndex = oldStart - 1;
        let newIndex = newStart - 1;
        for (const hunk of group) {
            const changedOldIndex = hunk.oldStart - 1;
            const changedNewIndex = hunk.newStart - 1;
            while (oldIndex < changedOldIndex && newIndex < changedNewIndex) {
                lines.push(` ${result.linesA[oldIndex] || ''}`);
                oldIndex++;
                newIndex++;
            }
            for (const item of hunk.changes || []) {
                lines.push(`${item.type === 'add' ? '+' : '-'}${item.content || ''}`);
            }
            oldIndex = changedOldIndex + hunk.oldLines;
            newIndex = changedNewIndex + hunk.newLines;
        }
        while (oldIndex < oldEnd && newIndex < newEnd) {
            lines.push(` ${result.linesA[oldIndex] || ''}`);
            oldIndex++;
            newIndex++;
        }
    }
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

        const [before, after] = await Promise.all([
            status === 'added' ? '' : change.oldData ?
                new TextDecoder().decode(change.oldData) : fileText(apiClient, parentProjectId, parent, path),
            status === 'removed' ? '' : change.newData ?
                new TextDecoder().decode(change.newData) : fileText(apiClient, projectId, sha, path)
        ]);
        const result = await computeLineDiff(before, after);
        if (!(result.hunks || []).length) return '';
        appendUnifiedHunks(lines, result);
        return lines.join('\n');
    }));
    return sections.filter(Boolean).join('\n');
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

export const loadCommitInspection = async ({apiClient, projectId, sha, remixBase = null}) => {
    const remote = await apiClient.commitInspection(projectId, sha);
    const recovered = await recoverRemixBootstrapInspection({
        apiClient,
        projectId,
        sha,
        remote,
        remixBase
    });
    const inspection = recovered || remote;
    return {
        ...inspection,
        oid: inspection.sha || sha,
        diff: await buildCommitDiffFromInspection({
            apiClient,
            projectId,
            sha,
            inspection,
            parentProjectId: inspection.parentProjectId || projectId
        })
    };
};
