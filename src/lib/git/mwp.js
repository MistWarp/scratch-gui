import JSZip from '@turbowarp/jszip';
import {
    abortEditorMerge,
    commitProject,
    collectReachableObjectOids,
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
import {buildSb3FromFractchTree, writeProjectToFractchTree} from './fractch-tree.js';
import {getMistWarpAuthor} from '../rotur/identity.js';
import {
    computeLineDiff,
    getChangedFilesBetweenCommits,
    getFileContentAtCommit,
    listFilesInTree
} from './git-diff.js';

const MWP_FORMAT = 'mistwarp-project';
const MWP_VERSION = 1;
const MWP_MANIFEST = 'mwp.json';
const MAX_MWP_FILES = 20000;
const MAX_MWP_UNCOMPRESSED_BYTES = 512 * 1024 * 1024;
const TEXT_FILE = /\.(fractch|json|txt|md|gitignore)$/i;
const READABLE_FILE = new RegExp(
    '(?:^|/)(?:\\.gitignore|README(?:\\.[^/]*)?)$|' +
    '\\.(?:fractch|json|txt|md|js|jsx|ts|tsx|css|html|svg|xml|ya?ml|osl|oip)$',
    'i'
);
const MAX_READABLE_FILE_BYTES = 5 * 1024 * 1024;
const MAX_MEDIA_PREVIEW_BYTES = 25 * 1024 * 1024;
const MEDIA_TYPES = {
    svg: 'image/svg+xml',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    webp: 'image/webp',
    bmp: 'image/bmp',
    ico: 'image/x-icon',
    wav: 'audio/wav',
    mp3: 'audio/mpeg',
    ogg: 'audio/ogg',
    m4a: 'audio/mp4',
    flac: 'audio/flac',
    mp4: 'video/mp4',
    webm: 'video/webm',
    mov: 'video/quicktime'
};

const mediaTypeForPath = path => MEDIA_TYPES[path.split('.')
    .pop()
    .toLowerCase()] || '';

const safeBranchName = branch => (
    Boolean(branch) &&
    /^[a-zA-Z0-9][a-zA-Z0-9._/-]{0,99}$/.test(branch) &&
    !branch.includes('..')
);

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

const clearImportedWorktree = async () => {
    const pfs = getFs().promises;
    const entries = await pfs.readdir(REPO_DIR);
    const remove = async path => {
        const stat = await pfs.stat(path);
        if (stat.isDirectory()) {
            for (const entry of await pfs.readdir(path)) await remove(`${path}/${entry}`);
            await pfs.rmdir(path);
        } else {
            await pfs.unlink(path);
        }
    };
    for (const entry of entries) {
        if (entry !== '.git') await remove(`${REPO_DIR}/${entry}`);
    }
};

const ensureManifestBranch = async manifest => {
    const branch = manifest.branch || 'main';
    if (!safeBranchName(branch)) throw new Error('Invalid MistWarp branch name');
    const fs = getFs();
    const branches = await git.listBranches({fs, dir: REPO_DIR});
    if (branches.includes(branch)) return branch;
    if (!manifest.head || typeof manifest.head !== 'string') {
        throw new Error(`MistWarp project is missing the ${branch} branch and its recorded head`);
    }
    await git.readCommit({fs, dir: REPO_DIR, oid: manifest.head});
    await git.writeRef({
        fs,
        dir: REPO_DIR,
        ref: `refs/heads/${branch}`,
        value: manifest.head,
        force: false
    });
    return branch;
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
    const branch = await ensureManifestBranch(manifest);
    if (manifest.worktree === false) {
        // Compact MWP files carry Git as the source of truth and omit the
        // duplicate worktree, so materialize it after import.
        await clearImportedWorktree();
        await git.checkout({fs, dir: REPO_DIR, ref: branch, force: true});
    }
    return manifest;
};

const checkoutMwpBranch = async branch => {
    if (!safeBranchName(branch)) {
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

const commitSummary = item => ({
    sha: item.oid,
    message: item.commit.message,
    author: item.commit.author?.name || '',
    date: item.commit.author?.timestamp ? item.commit.author.timestamp * 1000 : 0
});

const shallowRepoMeta = async ({branch, head, baseHead, baseHistory}) => {
    const local = [];
    let oid = head;
    while (oid && oid !== baseHead && local.length < 50) {
        const entry = await git.readCommit({fs: getFs(), dir: REPO_DIR, oid});
        local.push({oid, commit: entry.commit});
        oid = (entry.commit.parent || [])[0] || '';
    }
    if (oid !== baseHead) throw new Error('The shallow remix history does not reach its recorded base');

    const inheritedCommits = (baseHistory?.commits || []).filter(item =>
        !local.some(localItem => localItem.oid === (item.sha || item.oid))
    );
    const inheritedGraph = baseHistory?.graph || {branches: [], branchLogs: [], nodes: []};
    const localNodes = local.map(item => ({
        sha: item.oid,
        message: item.commit.message,
        author: item.commit.author?.name || '',
        date: item.commit.author?.timestamp ? item.commit.author.timestamp * 1000 : 0,
        parents: item.commit.parent || [],
        branches: item.oid === head ? [branch] : []
    }));
    const inheritedNodes = (inheritedGraph.nodes || []).filter(item =>
        !local.some(localItem => localItem.oid === (item.sha || item.oid))
    );
    const inheritedBranch = (inheritedGraph.branchLogs || []).find(item => item.branch === branch);
    const branchOids = [
        ...local.map(item => item.oid),
        ...((inheritedBranch && inheritedBranch.oids) || (baseHead ? [baseHead] : []))
    ].filter((item, index, items) => item && items.indexOf(item) === index);
    const branchLogs = (inheritedGraph.branchLogs || []).filter(item => item.branch !== branch);
    branchLogs.push({branch, oids: branchOids});
    const branches = [...new Set([branch, ...(inheritedGraph.branches || [])])];
    return {
        branch,
        head,
        graph: {branches, branchLogs, nodes: [...localNodes, ...inheritedNodes]},
        commits: [...local.map(commitSummary), ...inheritedCommits]
    };
};

const currentRepoMeta = async ({baseHead = '', baseHistory = null} = {}) => {
    const fs = getFs();
    const branches = await git.listBranches({fs, dir: REPO_DIR});
    const currentBranch = await git.currentBranch({fs, dir: REPO_DIR, fullname: false});
    const branch = branches.includes(currentBranch) ? currentBranch : branches[0];
    if (!branch) throw new Error('MistWarp project has no branch to export');
    const head = await git.resolveRef({fs, dir: REPO_DIR, ref: branch});
    if (baseHead) return shallowRepoMeta({branch, head, baseHead, baseHistory});
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
        commits: log.map(commitSummary)
    };
};

const exportCurrentMwp = async (metadata, {
    baseHead = '', includeWorktree = false, assumeBaseKnown = false, baseHistory = null
} = {}) => {
    const repo = await currentRepoMeta({
        baseHead: assumeBaseKnown ? baseHead : '',
        baseHistory
    });
    let includeObjectOids = null;
    let delta = false;
    if (!includeWorktree && baseHead) {
        try {
            const known = assumeBaseKnown ? new Set([baseHead]) : await collectReachableObjectOids(baseHead);
            includeObjectOids = await collectReachableObjectOids(repo.head, known);
            delta = true;
        } catch (e) {
            // The server's base is not in this clone. A full archive is the safe fallback.
            includeObjectOids = null;
        }
    }
    const repoBlob = await exportRepoToZip({
        includeGitDir: true,
        includeWorktree,
        includeObjectOids
    });
    const zip = await JSZip.loadAsync(repoBlob);
    const manifest = {
        format: MWP_FORMAT,
        version: MWP_VERSION,
        createdWith: 'MistWarp',
        projectId: metadata.projectId || null,
        remixParent: metadata.remixParent || null,
        baseCommit: metadata.baseCommit || null,
        branch: repo.branch,
        head: repo.head,
        worktree: includeWorktree,
        baseHead: delta ? baseHead : null,
        delta,
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

const preserveCurrentRepo = async () => {
    if (!(await repoExists())) return null;
    try {
        return (await exportCurrentMwp({})).blob;
    } catch (error) {
        // A cancelled or older import can leave a .git directory whose HEAD
        // points at a missing branch. It cannot be restored, but it must not
        // prevent an unrelated pull request from loading.
        console.warn('Discarding an incomplete browser Git workspace:', error);
        return null;
    }
};

const createMwp = async ({
    vm, sb3Files, projectId, remixParent, baseCommit, remoteHead,
    message = 'Save project', commitChanges = true, requireChanges = false, baseHistory = null
} = {}) => {
    const author = projectId ? await getMistWarpAuthor() : getDefaultAuthor();
    let shallowBase = false;
    if (!(await repoExists())) {
        const initialParent = remoteHead || '';
        await initRepo({defaultBranch: 'main', vm, sb3Files, initialMessage: message, initialParent, author});
        shallowBase = Boolean(initialParent);
    } else if ((vm || sb3Files) && commitChanges) {
        try {
            await commitProject({vm, sb3Files, message, author, rememberAuthor: false});
        } catch (error) {
            if (!/No changes to commit/.test(error.message || '')) throw error;
            if (requireChanges) {
                const noChanges = new Error('No files changed in this commit.');
                noChanges.code = 'no_changes';
                throw noChanges;
            }
        }
    }
    return exportCurrentMwp(
        {projectId, remixParent, baseCommit},
        {baseHead: remoteHead, includeWorktree: !commitChanges, assumeBaseKnown: shallowBase, baseHistory}
    );
};

const buildSb3FromCurrentRepo = async () => {
    try {
        const legacySnapshot = await readWorktreeFile('project.sb3');
        return new Blob([legacySnapshot], {type: 'application/x.scratch.sb3'});
    } catch (e) {
        // API-generated baseline histories use the legacy binary snapshot.
    }
    const bytes = await buildSb3FromFractchTree({fs: getFs().promises, dir: REPO_DIR});
    return new Blob([bytes], {type: 'application/x.scratch.sb3'});
};

const bytesEqual = (a, b) => {
    if (!a || !b || a.byteLength !== b.byteLength) return false;
    for (let i = 0; i < a.byteLength; i++) {
        if (a[i] !== b[i]) return false;
    }
    return true;
};

const removeDiffDirectory = async (pfs, path) => {
    let stat;
    try {
        stat = await pfs.stat(path);
    } catch (e) {
        return;
    }
    if (!stat.isDirectory()) {
        await pfs.unlink(path);
        return;
    }
    const entries = await pfs.readdir(path);
    await Promise.all(entries.map(entry => removeDiffDirectory(pfs, `${path}/${entry}`)));
    await pfs.rmdir(path);
};

const buildProjectArtifactsFromFileEntries = async files => {
    const pfs = getFs().promises;
    const tempDir = `${REPO_DIR}-materialize-${Date.now()}-${Math.random().toString(36)
        .slice(2)}`;
    const treeZip = new JSZip();
    try {
        await pfs.mkdir(tempDir);
        for (const file of files || []) {
            if (!safeArchivePath(file.path) || !(file.data instanceof Uint8Array)) {
                throw new Error('The server returned an invalid project tree');
            }
            const destination = `${tempDir}/${file.path}`;
            await ensureParentDir(pfs, destination);
            await pfs.writeFile(destination, file.data);
            treeZip.file(file.path, file.data);
        }
        const legacy = (files || []).find(file => file.path === 'project.sb3');
        const bytes = legacy ? legacy.data : await buildSb3FromFractchTree({fs: pfs, dir: tempDir});
        const tree = await treeZip.generateAsync({type: 'blob', compression: 'DEFLATE'});
        return {sb3: new Blob([bytes], {type: 'application/x.scratch.sb3'}), tree};
    } finally {
        await removeDiffDirectory(pfs, tempDir);
    }
};

const buildSb3FromFileEntries = async files => (await buildProjectArtifactsFromFileEntries(files)).sb3;

const listDiffDirectory = async (pfs, root, current = root) => {
    const paths = [];
    for (const entry of await pfs.readdir(current)) {
        const fullPath = `${current}/${entry}`;
        const stat = await pfs.stat(fullPath);
        if (stat.isDirectory()) {
            paths.push(...await listDiffDirectory(pfs, root, fullPath));
        } else {
            paths.push(fullPath.slice(root.length + 1));
        }
    }
    return paths;
};

// Convert the single project.sb3 blob used by old commits into the same file
// representation as modern Fractch commits. This is intentionally exposed for
// the commit viewer's narrow legacy-bridge path, where downloading the full MWP
// archive would also transfer every unrelated Git object.
const normalizeLegacySb3Snapshot = async snapshot => {
    const fs = getFs();
    const pfs = fs.promises;
    const tempDir = `${REPO_DIR}-legacy-${Date.now()}-${Math.random().toString(36)
        .slice(2)}`;
    try {
        await pfs.mkdir(tempDir);
        const bytes = snapshot instanceof Uint8Array ? snapshot : new Uint8Array(snapshot);
        await writeProjectToFractchTree({sb3ArrayBuffer: bytes, fs: pfs, dir: tempDir});
        const files = [];
        for (const path of await listDiffDirectory(pfs, tempDir)) {
            const raw = await pfs.readFile(`${tempDir}/${path}`);
            const data = raw instanceof Uint8Array ? raw : new Uint8Array(raw);
            const {oid} = await git.hashBlob({object: data});
            files.push({path, oid, size: data.byteLength, data});
        }
        return files;
    } finally {
        await removeDiffDirectory(pfs, tempDir);
    }
};

const commitTreeFiles = async (fs, oid) => {
    const commit = await git.readCommit({fs, dir: REPO_DIR, oid});
    return listFilesInTree({fs, dir: REPO_DIR, treeOid: commit.commit.tree});
};

// Older histories stored one project.sb3 blob. New histories store the same
// project as Fractch source files. Convert the old side before comparing them,
// otherwise the format migration makes every source line look newly added.
const normalizedLegacyChanges = async (base, head) => {
    const fs = getFs();
    const pfs = fs.promises;
    const [baseTree, headTree] = await Promise.all([
        commitTreeFiles(fs, base),
        commitTreeFiles(fs, head)
    ]);
    if (!baseTree.some(file => file.path === 'project.sb3') ||
        headTree.some(file => file.path === 'project.sb3')) return null;

    const tempDir = `${REPO_DIR}-diff-${Date.now()}-${Math.random().toString(36)
        .slice(2)}`;
    try {
        await pfs.mkdir(tempDir);
        const {blob} = await git.readBlob({fs, dir: REPO_DIR, oid: base, filepath: 'project.sb3'});
        const snapshot = blob instanceof Uint8Array ? blob : new Uint8Array(blob);
        await writeProjectToFractchTree({sb3ArrayBuffer: snapshot, fs: pfs, dir: tempDir});

        const before = new Map();
        for (const path of await listDiffDirectory(pfs, tempDir)) {
            const data = await pfs.readFile(`${tempDir}/${path}`);
            before.set(path, data instanceof Uint8Array ? data : new Uint8Array(data));
        }
        for (const entry of baseTree) {
            if (entry.path === 'project.sb3' || before.has(entry.path)) continue;
            const {blob: data} = await git.readBlob({fs, dir: REPO_DIR, oid: base, filepath: entry.path});
            before.set(entry.path, data instanceof Uint8Array ? data : new Uint8Array(data));
        }

        const after = new Map();
        for (const entry of headTree) {
            const {blob: data} = await git.readBlob({fs, dir: REPO_DIR, oid: head, filepath: entry.path});
            after.set(entry.path, data instanceof Uint8Array ? data : new Uint8Array(data));
        }

        const changes = [];
        for (const path of new Set([...before.keys(), ...after.keys()])) {
            const oldData = before.get(path) || null;
            const newData = after.get(path) || null;
            if (oldData && newData && bytesEqual(oldData, newData)) continue;
            changes.push({
                path,
                type: oldData ? (newData ? 'modified' : 'removed') : 'added',
                oidA: oldData ? 'normalized' : null,
                oidB: newData ? 'normalized' : null,
                before: oldData,
                after: newData
            });
        }
        return changes;
    } finally {
        await removeDiffDirectory(pfs, tempDir);
    }
};

const normalizedLegacyRootChanges = async head => {
    const fs = getFs();
    const pfs = fs.promises;
    const headTree = await commitTreeFiles(fs, head);
    if (!headTree.some(file => file.path === 'project.sb3')) return null;
    const tempDir = `${REPO_DIR}-root-diff-${Date.now()}-${Math.random().toString(36)
        .slice(2)}`;
    try {
        await pfs.mkdir(tempDir);
        const {blob} = await git.readBlob({fs, dir: REPO_DIR, oid: head, filepath: 'project.sb3'});
        const snapshot = blob instanceof Uint8Array ? blob : new Uint8Array(blob);
        await writeProjectToFractchTree({sb3ArrayBuffer: snapshot, fs: pfs, dir: tempDir});
        const changes = [];
        for (const path of await listDiffDirectory(pfs, tempDir)) {
            const data = await pfs.readFile(`${tempDir}/${path}`);
            changes.push({
                path,
                type: 'added',
                oidA: null,
                oidB: 'normalized',
                before: null,
                after: data instanceof Uint8Array ? data : new Uint8Array(data)
            });
        }
        return changes;
    } finally {
        await removeDiffDirectory(pfs, tempDir);
    }
};

const diffForCommits = async (base, head, {root = false} = {}) => {
    const fs = getFs();
    let changed = null;
    if (root) {
        try {
            changed = await normalizedLegacyRootChanges(head);
        } catch (error) {
            console.warn('Could not normalize the legacy root commit:', error);
        }
    }
    try {
        if (!changed) changed = await normalizedLegacyChanges(base, head);
    } catch (error) {
        console.warn('Could not normalize the legacy project diff:', error);
    }
    if (!changed) {
        changed = await getChangedFilesBetweenCommits({fs, dir: REPO_DIR, oidA: base, oidB: head});
    }
    const sections = [];
    for (const file of changed) {
        if (!TEXT_FILE.test(file.path)) {
            sections.push(`diff --mwp a/${file.path} b/${file.path}\nBinary file changed`);
            continue;
        }
        const beforeFile = file.before ? {text: new TextDecoder().decode(file.before)} : file.oidA ?
            await getFileContentAtCommit({fs, dir: REPO_DIR, oid: base, filepath: file.path}) : null;
        const afterFile = file.after ? {text: new TextDecoder().decode(file.after)} : file.oidB ?
            await getFileContentAtCommit({fs, dir: REPO_DIR, oid: head, filepath: file.path}) : null;
        const before = beforeFile?.text || '';
        const after = afterFile?.text || '';
        const result = await computeLineDiff(before, after);
        if (!(result.hunks || []).length) continue;
        const lines = [
            `diff --mwp a/${file.path} b/${file.path}`,
            file.type === 'added' ? '--- /dev/null' : `--- a/${file.path}`,
            file.type === 'removed' ? '+++ /dev/null' : `+++ b/${file.path}`
        ];
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
    const previous = await preserveCurrentRepo();
    try {
        const manifest = await importMwp(workspace);
        const fs = getFs();
        const branch = await git.currentBranch({fs, dir: REPO_DIR, fullname: false}) || manifest.branch || 'main';
        const head = await git.resolveRef({fs, dir: REPO_DIR, ref: 'HEAD'});
        if (head === oid) throw new Error('This is already the current version');
        const target = await git.readCommit({fs, dir: REPO_DIR, oid});
        const author = await getMistWarpAuthor();
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
    const previous = await preserveCurrentRepo();
    try {
        return await prepareMwpPull(options);
    } finally {
        await restorePreviousRepo(previous);
    }
};

const inspectMwpCommit = async ({workspace, oid, parentOid = ''}) => {
    if (!workspace || !oid) throw new Error('Choose a commit to inspect');
    const previous = await preserveCurrentRepo();
    try {
        await importMwp(workspace);
        const entry = await git.readCommit({fs: getFs(), dir: REPO_DIR, oid});
        const parents = entry.commit.parent || [];
        let parent = parentOid || parents[0] || '';
        let root = false;
        if (!parent) {
            root = true;
            const fs = getFs();
            const tree = await git.writeTree({fs, dir: REPO_DIR, tree: []});
            const identity = {
                name: 'MistWarp',
                email: 'history@mistwarp.local',
                timestamp: 1,
                timezoneOffset: 0
            };
            parent = await git.writeCommit({
                fs,
                dir: REPO_DIR,
                commit: {tree, parent: [], author: identity, committer: identity, message: 'Empty project'}
            });
        }
        const diff = await diffForCommits(parent, oid, {root});
        return {diff, oid, commit: entry.commit, parent, root};
    } finally {
        await restorePreviousRepo(previous);
    }
};

const inspectMwpFiles = async ({workspace, oid = ''}) => {
    if (!workspace) throw new Error('This project does not have a saved file archive');
    const previous = await preserveCurrentRepo();
    try {
        const manifest = await importMwp(workspace);
        const head = oid || manifest.head || await git.resolveRef({fs: getFs(), dir: REPO_DIR, ref: 'HEAD'});
        const fs = getFs();
        const commit = await git.readCommit({fs, dir: REPO_DIR, oid: head});
        const entries = await listFilesInTree({fs, dir: REPO_DIR, treeOid: commit.commit.tree});
        const files = [];
        for (const entry of entries) {
            const {blob} = await git.readBlob({fs, dir: REPO_DIR, oid: head, filepath: entry.path});
            const bytes = blob instanceof Uint8Array ? blob : new Uint8Array(blob);
            const readable = bytes.byteLength <= MAX_READABLE_FILE_BYTES &&
                (READABLE_FILE.test(entry.path) || !bytes.slice(0, 8000).includes(0));
            const mediaType = mediaTypeForPath(entry.path);
            files.push({
                path: entry.path,
                oid: entry.oid,
                size: bytes.byteLength,
                binary: !readable,
                text: readable ? new TextDecoder().decode(bytes) : null,
                mediaType,
                media: mediaType && bytes.byteLength <= MAX_MEDIA_PREVIEW_BYTES ? bytes : null
            });
        }
        return {head, files};
    } finally {
        await restorePreviousRepo(previous);
    }
};

const startMwpMerge = async ({target, source, pullId, baseCommit, headCommit}) => {
    const author = await getMistWarpAuthor();
    const previous = await preserveCurrentRepo();
    const inspected = await prepareMwpPull({target, source, pullId, baseCommit, headCommit});
    const {diff, sourceRef, sourceManifest, targetManifest} = inspected;
    const result = await startEditorMerge({
        ours: targetManifest.branch,
        theirs: sourceRef,
        author
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
        head = await completeEditorMerge({author: await getMistWarpAuthor()});
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
    buildProjectArtifactsFromFileEntries,
    buildSb3FromFileEntries,
    buildSb3FromCurrentRepo,
    cancelMwpMerge,
    checkoutMwpBranch,
    chooseMergeBinary,
    createMwp,
    exportCurrentMwp,
    finishMwpMerge,
    importMwp,
    inspectMwpCommit,
    inspectMwpFiles,
    inspectMwpPull,
    loadMwp,
    normalizeLegacySb3Snapshot,
    restoreMwpVersion,
    startMwpMerge,
    updateMergeConflict
};
