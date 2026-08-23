import JSZip from '@turbowarp/jszip';
import {
    abortEditorMerge,
    commitProject,
    completeEditorMerge,
    computeCommitGraph,
    deleteRepo,
    ensureParentDir,
    exportRepoToZip,
    getDefaultAuthor,
    getFs,
    git,
    initRepo,
    readWorktreeFile,
    repoExists,
    resolveEditorMergeBinary,
    startEditorMerge,
    writeWorktreeFile,
    REPO_DIR
} from './browser-git.js';
import {buildSb3FromFractchTree} from './fractch-tree.js';
import {
    computeLineDiff,
    getChangedFilesBetweenCommits,
    getFileContentAtCommit
} from './git-diff.js';

const MWP_FORMAT = 'mistwarp-project';
const MWP_VERSION = 1;
const MWP_MANIFEST = 'mwp.json';
const MAX_MWP_FILES = 20000;
const MAX_MWP_UNCOMPRESSED_BYTES = 512 * 1024 * 1024;
const TEXT_FILE = /\.(fractch|json|svg|txt|md|gitignore)$/i;

const safeArchivePath = path => {
    if (!path || path.startsWith('/') || path.includes('\\')) return false;
    return !path.split('/').some(part => !part || part === '.' || part === '..');
};

const loadMwp = async input => {
    const zip = await JSZip.loadAsync(input);
    const paths = Object.keys(zip.files).filter(path => !zip.files[path].dir);
    if (paths.length > MAX_MWP_FILES || paths.some(path => !safeArchivePath(path))) {
        throw new Error('Unsafe or oversized MistWarp project');
    }
    const entry = zip.file(MWP_MANIFEST);
    if (!entry) throw new Error('This file is missing mwp.json');
    const manifest = JSON.parse(await entry.async('text'));
    if (manifest.format !== MWP_FORMAT || manifest.version !== MWP_VERSION) {
        throw new Error('Unsupported MistWarp project version');
    }
    return {zip, manifest, paths};
};

const importMwp = async input => {
    const {zip, manifest, paths} = await loadMwp(input);
    const fs = getFs();
    const pfs = fs.promises;
    await deleteRepo();
    await pfs.mkdir(REPO_DIR).catch(error => {
        if (error.code !== 'EEXIST') throw error;
    });
    let total = 0;
    for (const path of paths) {
        if (path === MWP_MANIFEST) continue;
        const data = await zip.files[path].async('uint8array');
        total += data.byteLength;
        if (total > MAX_MWP_UNCOMPRESSED_BYTES) throw new Error('MistWarp project expands beyond 512 MB');
        const destination = `${REPO_DIR}/${path}`;
        await ensureParentDir(pfs, destination);
        await pfs.writeFile(destination, data);
    }
    if (!(await repoExists())) throw new Error('MistWarp project has no Git history');
    return manifest;
};

const checkoutMwpBranch = async branch => {
    if (!branch || !/^[a-zA-Z0-9][a-zA-Z0-9._/-]{0,99}$/.test(branch) || branch.includes('..')) {
        throw new Error('Invalid MistWarp branch name');
    }
    const fs = getFs();
    const branches = await git.listBranches({fs, dir: REPO_DIR});
    if (!branches.includes(branch)) {
        const head = await git.resolveRef({fs, dir: REPO_DIR, ref: 'HEAD'});
        await git.writeRef({fs, dir: REPO_DIR, ref: `refs/heads/${branch}`, value: head, force: false});
    }
    await git.checkout({fs, dir: REPO_DIR, ref: branch});
};

const attachMwpHistory = async (input, ref, requestedHead) => {
    const {zip, manifest, paths} = await loadMwp(input);
    const fs = getFs();
    const pfs = fs.promises;
    const objectPaths = paths.filter(path => path.startsWith('.git/objects/'));
    let total = 0;
    for (const path of objectPaths) {
        const data = await zip.files[path].async('uint8array');
        total += data.byteLength;
        if (total > MAX_MWP_UNCOMPRESSED_BYTES) throw new Error('Pull request history expands beyond 512 MB');
        const destination = `${REPO_DIR}/${path}`;
        await ensureParentDir(pfs, destination);
        await pfs.writeFile(destination, data);
    }
    const head = requestedHead || manifest.head;
    await git.readCommit({fs, dir: REPO_DIR, oid: head});
    await git.writeRef({fs, dir: REPO_DIR, ref: `refs/heads/${ref}`, value: head, force: true});
    return manifest;
};

const currentRepoMeta = async () => {
    const fs = getFs();
    const branch = await git.currentBranch({fs, dir: REPO_DIR, fullname: false}) || 'main';
    const head = await git.resolveRef({fs, dir: REPO_DIR, ref: 'HEAD'});
    const log = await git.log({fs, dir: REPO_DIR, ref: branch, depth: 50});
    const rawGraph = await computeCommitGraph({depth: 100});
    const graph = {
        branches: rawGraph.branches,
        branchLogs: rawGraph.branchLogs,
        nodes: rawGraph.nodes.map(item => ({
            sha: item.oid,
            message: item.commit.message,
            author: item.commit.author?.name || '',
            date: item.commit.author?.timestamp ? item.commit.author.timestamp * 1000 : 0,
            parents: item.parents || [],
            branches: item.branches || []
        }))
    };
    return {
        branch,
        head,
        graph,
        commits: log.map(item => ({
            sha: item.oid,
            message: item.commit.message,
            author: item.commit.author?.name || '',
            date: item.commit.author?.timestamp ? item.commit.author.timestamp * 1000 : 0
        }))
    };
};

const exportCurrentMwp = async metadata => {
    const repoBlob = await exportRepoToZip({includeGitDir: true});
    const zip = await JSZip.loadAsync(repoBlob);
    const repo = await currentRepoMeta();
    const manifest = {
        format: MWP_FORMAT,
        version: MWP_VERSION,
        createdWith: 'MistWarp',
        projectId: metadata.projectId || null,
        remixParent: metadata.remixParent || null,
        baseCommit: metadata.baseCommit || null,
        branch: repo.branch,
        head: repo.head,
        commits: repo.commits,
        graph: repo.graph
    };
    zip.file(MWP_MANIFEST, JSON.stringify(manifest, null, 2));
    const blob = await zip.generateAsync({
        type: 'blob',
        mimeType: 'application/x-mistwarp-project',
        compression: 'DEFLATE',
        compressionOptions: {level: 6}
    });
    return {blob, manifest};
};

const createMwp = async ({
    vm, projectId, remixParent, baseCommit, message = 'Save project', commitChanges = true
} = {}) => {
    if (!(await repoExists())) {
        await initRepo({defaultBranch: 'main', vm, initialMessage: message});
    } else if (vm && commitChanges) {
        try {
            await commitProject({vm, message, author: getDefaultAuthor()});
        } catch (error) {
            if (!/No changes to commit/.test(error.message || '')) throw error;
        }
    }
    return exportCurrentMwp({projectId, remixParent, baseCommit});
};

const buildSb3FromCurrentRepo = async () => {
    const bytes = await buildSb3FromFractchTree({fs: getFs().promises, dir: REPO_DIR});
    return new Blob([bytes], {type: 'application/x.scratch.sb3'});
};

const diffForCommits = async (base, head) => {
    const fs = getFs();
    const changed = await getChangedFilesBetweenCommits({fs, dir: REPO_DIR, oidA: base, oidB: head});
    const sections = [];
    for (const file of changed) {
        if (!TEXT_FILE.test(file.path)) {
            sections.push(`diff --mwp a/${file.path} b/${file.path}\nBinary file changed`);
            continue;
        }
        const beforeFile = file.oidA ?
            await getFileContentAtCommit({fs, dir: REPO_DIR, oid: base, filepath: file.path}) : null;
        const afterFile = file.oidB ?
            await getFileContentAtCommit({fs, dir: REPO_DIR, oid: head, filepath: file.path}) : null;
        const before = beforeFile?.text || '';
        const after = afterFile?.text || '';
        const result = await computeLineDiff(before, after);
        const lines = [`diff --mwp a/${file.path} b/${file.path}`, `--- a/${file.path}`, `+++ b/${file.path}`];
        for (const hunk of result.hunks || []) {
            lines.push(`@@ -${hunk.oldStart},${hunk.oldLines} +${hunk.newStart},${hunk.newLines} @@`);
            for (const change of hunk.changes || []) {
                lines.push(`${change.type === 'add' ? '+' : '-'}${change.content || ''}`);
            }
        }
        sections.push(lines.join('\n'));
    }
    return sections.join('\n');
};

let activeMerge = null;

const prepareMwpPull = async ({target, source, pullId, baseCommit, headCommit}) => {
    const targetManifest = await importMwp(target);
    const sourceRef = `mwp-pr-${String(pullId).replace(/[^a-zA-Z0-9._-]/g, '')}`;
    const sourceManifest = await attachMwpHistory(source, sourceRef, headCommit);
    const base = baseCommit || sourceManifest.baseCommit || targetManifest.head;
    const head = headCommit || sourceManifest.head;
    if (base && base !== targetManifest.head) {
        try {
            await git.readCommit({fs: getFs(), dir: REPO_DIR, oid: base});
        } catch (error) {
            throw new Error('The remix does not contain the recorded parent commit');
        }
    }
    const diff = await diffForCommits(base, head);
    return {diff, sourceRef, sourceManifest, targetManifest};
};

const restorePreviousRepo = async previous => {
    if (previous) await importMwp(previous);
    else await deleteRepo();
};

const restoreMwpVersion = async ({workspace, oid, message} = {}) => {
    if (!workspace || !oid) throw new Error('Choose a version to restore');
    const previous = (await repoExists()) ? (await exportCurrentMwp({})).blob : null;
    try {
        const manifest = await importMwp(workspace);
        const fs = getFs();
        const branch = await git.currentBranch({fs, dir: REPO_DIR, fullname: false}) || manifest.branch || 'main';
        const head = await git.resolveRef({fs, dir: REPO_DIR, ref: 'HEAD'});
        if (head === oid) throw new Error('This is already the current version');
        const target = await git.readCommit({fs, dir: REPO_DIR, oid});
        const author = getDefaultAuthor();
        const identity = {
            ...author,
            timestamp: Math.floor(Date.now() / 1000),
            timezoneOffset: new Date().getTimezoneOffset()
        };
        const restoredHead = await git.writeCommit({
            fs,
            dir: REPO_DIR,
            commit: {
                tree: target.commit.tree,
                parent: [head],
                author: identity,
                committer: identity,
                message: message || `Restored version ${oid.slice(0, 7)}`
            }
        });
        await git.writeRef({
            fs,
            dir: REPO_DIR,
            ref: `refs/heads/${branch}`,
            value: restoredHead,
            force: true
        });
        await git.checkout({fs, dir: REPO_DIR, ref: branch, force: true});
        const mwp = await exportCurrentMwp({
            projectId: manifest.projectId,
            remixParent: manifest.remixParent,
            baseCommit: manifest.baseCommit
        });
        const sb3 = await buildSb3FromCurrentRepo();
        return {mwp: mwp.blob, sb3, manifest: mwp.manifest, expectedHead: head};
    } finally {
        await restorePreviousRepo(previous);
    }
};

const inspectMwpPull = async options => {
    const previous = (await repoExists()) ? (await exportCurrentMwp({})).blob : null;
    try {
        return await prepareMwpPull(options);
    } finally {
        await restorePreviousRepo(previous);
    }
};

const startMwpMerge = async ({target, source, pullId, baseCommit, headCommit}) => {
    const previous = (await repoExists()) ? (await exportCurrentMwp({})).blob : null;
    const inspected = await prepareMwpPull({target, source, pullId, baseCommit, headCommit});
    const {diff, sourceRef, sourceManifest, targetManifest} = inspected;
    const result = await startEditorMerge({
        ours: targetManifest.branch,
        theirs: sourceRef,
        author: getDefaultAuthor()
    });
    const conflicts = [];
    for (const path of result.conflicts || []) {
        const data = await readWorktreeFile(path);
        conflicts.push({path, content: new TextDecoder().decode(data)});
    }
    activeMerge = {pullId, targetManifest, sourceManifest, sourceRef, merged: result.merged, previous};
    return {
        diff,
        conflicts,
        binaryConflicts: result.binaryConflicts || [],
        merged: result.merged,
        expectedHead: targetManifest.head
    };
};

const updateMergeConflict = (path, content) => writeWorktreeFile(path, new TextEncoder().encode(content));
const chooseMergeBinary = (path, choice) => resolveEditorMergeBinary(path, choice);

const finishMwpMerge = async () => {
    if (!activeMerge) throw new Error('No pull request merge is active');
    let head;
    if (activeMerge.merged) {
        head = await git.resolveRef({fs: getFs(), dir: REPO_DIR, ref: 'HEAD'});
    } else {
        head = await completeEditorMerge({author: getDefaultAuthor()});
    }
    const mwp = await exportCurrentMwp({
        projectId: activeMerge.targetManifest.projectId,
        remixParent: activeMerge.targetManifest.remixParent,
        baseCommit: activeMerge.targetManifest.baseCommit
    });
    const sb3 = await buildSb3FromCurrentRepo();
    const result = {mwp: mwp.blob, sb3, head, manifest: mwp.manifest};
    await restorePreviousRepo(activeMerge.previous);
    // The active merge is intentionally cleared only after its repository has been restored.
    // eslint-disable-next-line require-atomic-updates
    activeMerge = null;
    return result;
};

const cancelMwpMerge = async () => {
    const merge = activeMerge;
    activeMerge = null;
    if (merge && !merge.merged) await abortEditorMerge();
    if (merge) await restorePreviousRepo(merge.previous);
};

export {
    MWP_FORMAT,
    MWP_VERSION,
    attachMwpHistory,
    buildSb3FromCurrentRepo,
    cancelMwpMerge,
    checkoutMwpBranch,
    chooseMergeBinary,
    createMwp,
    exportCurrentMwp,
    finishMwpMerge,
    importMwp,
    inspectMwpPull,
    loadMwp,
    restoreMwpVersion,
    startMwpMerge,
    updateMergeConflict
};
