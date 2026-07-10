import LightningFS from '@isomorphic-git/lightning-fs';
import http from 'isomorphic-git/http/web';
import git, {Errors} from 'isomorphic-git';
import JSZip from 'jszip';


import {
    writeProjectToFractchTree,
    buildSb3FromFractchTree
} from './fractch-tree.js';

const FS_NAME = 'mistwarp-git';
const REPO_DIR = '/repo';
const SNAPSHOT_FILE = 'project.sb3';
// Folder used to carry the whole git repo (fractch working tree + .git) inside a
// saved .sb3 zip, alongside the normal top-level project.json/assets.
const GIT_EMBED_DIR = '.mistwarp-git';

let fsSingleton = null;
let shouldWipeOnStart = true;

const getFs = () => {
    if (!fsSingleton) {
        fsSingleton = new LightningFS(FS_NAME, {wipe: shouldWipeOnStart});
        shouldWipeOnStart = false;
    }
    return fsSingleton;
};

const pathJoin = (...parts) => parts
    .filter(Boolean)
    .join('/')
    .replace(/\/+/g, '/')
    .replace(/\/\//g, '/');

const exists = async (pfs, filePath) => {
    if (!pfs || typeof pfs.stat !== 'function') {
        throw new Error('Invalid filesystem object');
    }
    if (!filePath || typeof filePath !== 'string') {
        throw new Error('Invalid file path');
    }

    try {
        await pfs.stat(filePath);
        return true;
    } catch (e) {
        return false;
    }
};

const ensureDir = async (pfs, dirPath) => {
    if (!pfs || typeof pfs.mkdir !== 'function') {
        throw new Error('Invalid filesystem object');
    }
    if (!dirPath || typeof dirPath !== 'string') {
        throw new Error('Invalid directory path');
    }

    try {
        await pfs.mkdir(dirPath);
    } catch (e) {
        if (e.code !== 'EEXIST') {
            throw e;
        }
    }
};

const removeRecursive = async (pfs, filePath) => {
    if (!pfs || !filePath || typeof filePath !== 'string') {
        return;
    }

    let stat;
    try {
        stat = await pfs.stat(filePath);
    } catch (e) {
        // File doesn't exist, nothing to remove
        return;
    }

    if (stat.isDirectory()) {
        const entries = await pfs.readdir(filePath);
        await Promise.all(entries.map(entry => removeRecursive(pfs, `${filePath}/${entry}`)));
        try {
            await pfs.rmdir(filePath);
        } catch (e) {
            // Directory might not be empty or have permission issues
            console.warn('Failed to remove directory:', filePath, e);
        }
        return;
    }

    try {
        await pfs.unlink(filePath);
    } catch (e) {
        // File might be locked or have permission issues
        console.warn('Failed to remove file:', filePath, e);
    }
};

const ensureParentDir = async (pfs, filePath) => {
    const parts = filePath.split('/').filter(Boolean);
    parts.pop();
    let current = '';
    for (const part of parts) {
        current = current ? `${current}/${part}` : `/${part}`;
        await ensureDir(pfs, current);
    }
};

const stageAll = async (fs, dir, {onProgress} = {}) => {
    if (!fs || !dir || typeof dir !== 'string') {
        throw new Error('Invalid filesystem or directory');
    }

    if (typeof onProgress === 'function') {
        onProgress({phase: 'status', message: 'Computing file status…', completed: 0, total: 1});
    }

    const matrix = await git.statusMatrix({fs, dir});
    const rows = matrix.filter(row => row && row[0] !== '.gitignore');
    const total = Math.max(1, rows.length);
    let completed = 0;
    let lastReport = 0;

    const report = () => {
        if (typeof onProgress !== 'function') return;
        const now = Date.now();
        if (now - lastReport < 100 && completed < total) return;
        lastReport = now;
        onProgress({
            phase: 'stage',
            message: 'Staging files…',
            completed,
            total
        });
    };

    report();

    // Process files in batches to avoid overwhelming the system
    const batchSize = 10;
    for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);
        await Promise.all(batch.map(async row => {
            if (!row || row.length < 3) return;

            const [filepath, head, workdir] = row;
            if (!filepath) return;

            try {
                if (workdir === 0) {
                    if (head !== 0) {
                        await git.remove({fs, dir, filepath});
                    }
                } else {
                    await git.add({fs, dir, filepath});
                }
            } catch (e) {
                console.warn('Failed to stage file:', filepath, e);
            }
            report();
        }));
        completed += batch.length;

        // Yield control to browser between batches
        if (i + batchSize < rows.length) {
            await new Promise(resolve => setTimeout(resolve, 0));
        }
    }
};

const getDefaultAuthor = () => {
    try {
        const saved = JSON.parse(localStorage.getItem('mw:git-author') || 'null');
        if (saved && typeof saved.name === 'string' && typeof saved.email === 'string') {
            return saved;
        }
    } catch (e) {
        // ignore
    }
    return {name: 'User', email: 'user@example.com'};
};

const setDefaultAuthor = author => {
    try {
        localStorage.setItem('mw:git-author', JSON.stringify(author));
    } catch (e) {
        // ignore
    }
};

const repoExists = () => {
    const fs = getFs();
    const pfs = fs.promises;
    return exists(pfs, pathJoin(REPO_DIR, '.git'));
};

const listFilesRecursive = async (pfs, rootDir) => {
    const out = [];
    const walk = async currentDir => {
        const entries = await pfs.readdir(currentDir);
        for (const entry of entries) {
            const full = `${currentDir}/${entry}`;
            const stat = await pfs.stat(full);
            if (stat.isDirectory()) {
                await walk(full);
            } else {
                out.push(full);
            }
        }
    };
    await walk(rootDir);
    return out;
};

const clearWorkdirExceptGit = async pfs => {
    let entries;
    try {
        entries = await pfs.readdir(REPO_DIR);
    } catch (e) {
        return;
    }
    for (const entry of entries) {
        if (entry === '.git') continue;
        await removeRecursive(pfs, `${REPO_DIR}/${entry}`);
    }
};

const initRepo = async ({defaultBranch = 'main', vm = null, onProgress} = {}) => {
    if (!defaultBranch || typeof defaultBranch !== 'string') {
        throw new Error('Invalid default branch name');
    }

    const fs = getFs();
    const pfs = fs.promises;
    await ensureDir(pfs, REPO_DIR);

    const already = await repoExists();
    if (!already) {
        if (typeof onProgress === 'function') {
            onProgress({phase: 'init', message: 'Initializing repository…', completed: 0, total: 1});
        }

        try {
            await git.init({fs, dir: REPO_DIR, defaultBranch});
            await pfs.writeFile(pathJoin(REPO_DIR, '.gitignore'), '');
            await git.add({fs, dir: REPO_DIR, filepath: '.gitignore'});

            if (vm) {
                if (typeof onProgress === 'function') {
                    onProgress({phase: 'snapshot', message: 'Saving project snapshot…', completed: 0, total: 1});
                }

                if (typeof vm.saveProjectSb3 !== 'function') {
                    throw new Error('VM does not support saveProjectSb3');
                }

                await writeProjectToFractchTree({vm, fs: pfs, dir: REPO_DIR, onProgress});
                await stageAll(fs, REPO_DIR, {onProgress});
            }

            await git.commit({
                fs,
                dir: REPO_DIR,
                message: 'Initialize repository',
                author: getDefaultAuthor()
            });
        } catch (e) {
            // Clean up partial initialization on error
            try {
                await removeRecursive(pfs, REPO_DIR);
            } catch (cleanupError) {
                console.warn('Failed to clean up after initialization error:', cleanupError);
            }
            throw e;
        }
    }

    return {
        fs,
        dir: REPO_DIR
    };
};

const readSnapshot = async () => {
    const fs = getFs();
    const pfs = fs.promises;
    const snapshotPath = pathJoin(REPO_DIR, SNAPSHOT_FILE);

    if (!(await exists(pfs, snapshotPath))) {
        throw new Error('Project snapshot not found');
    }

    try {
        const data = await pfs.readFile(snapshotPath);
        const view = data instanceof Uint8Array ? data : new Uint8Array(data);
        return view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength);
    } catch (e) {
        throw new Error(`Failed to read project snapshot: ${e.message}`);
    }
};

const buildSb3FromCommit = async oid => {
    const fs = getFs();
    const pfs = fs.promises;
    const tmpDir = `${REPO_DIR}-export-${Date.now()}`;
    try {
        await ensureDir(pfs, tmpDir);
        const files = await git.listFiles({fs, dir: REPO_DIR, ref: oid});
        for (const filepath of files) {
            if (filepath === '.gitignore' || filepath === SNAPSHOT_FILE) continue;
            const {blob} = await git.readBlob({fs, dir: REPO_DIR, oid, filepath});
            const dest = pathJoin(tmpDir, filepath);
            await ensureParentDir(pfs, dest);
            await pfs.writeFile(dest, blob instanceof Uint8Array ? blob : new Uint8Array(blob));
        }
        const bytes = await buildSb3FromFractchTree({fs: pfs, dir: tmpDir});
        return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
    } finally {
        await removeRecursive(pfs, tmpDir);
    }
};

const readSnapshotAtCommit = async oid => {
    if (!oid || typeof oid !== 'string') {
        throw new Error('Invalid commit OID');
    }

    const fs = getFs();
    try {
        const {blob} = await git.readBlob({fs, dir: REPO_DIR, oid, filepath: SNAPSHOT_FILE});
        const view = blob instanceof Uint8Array ? blob : new Uint8Array(blob);
        return view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength);
    } catch (e) {
        // New fractch-only commits have no project.sb3 blob; rebuild from the text tree.
        try {
            return await buildSb3FromCommit(oid);
        } catch (rebuildError) {
            throw new Error(`Failed to read snapshot at commit ${oid}: ${rebuildError.message}`);
        }
    }
};

const restoreProjectFromCurrentRef = async vm => {
    if (!vm) throw new Error('VM not provided');
    if (!(await repoExists())) throw new Error('Repository not initialized');

    try {
        const fs = getFs();
        const pfs = fs.promises;
        const snapshotPath = pathJoin(REPO_DIR, SNAPSHOT_FILE);

        // Old commits carry a binary project.sb3 snapshot; new commits are
        // fractch-only, so repack the text tree into an sb3.
        let snapshot;
        if (await exists(pfs, snapshotPath)) {
            snapshot = await readSnapshot();
        } else {
            const bytes = await buildSb3FromFractchTree({fs: pfs, dir: REPO_DIR});
            snapshot = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
        }

        if (typeof vm.quit !== 'function') {
            throw new Error('VM does not support quit method');
        }
        if (typeof vm.loadProject !== 'function') {
            throw new Error('VM does not support loadProject method');
        }

        vm.quit();
        await vm.loadProject(snapshot, {skipGitImport: true});
    } catch (e) {
        throw new Error(`Failed to restore project: ${e.message}`);
    }
};

const describeRepoChange = ([, head, workdir, stage]) => {
    if (head === 1 && workdir === 2 && stage === 1) return 'modified';
    if (head === 0 && workdir === 2) return 'untracked';
    if (head === 1 && stage === 2) return 'staged';
    if (head === 1 && workdir === 0) return 'deleted';
    return 'unmodified';
};

const getRepoChanges = async vm => {
    if (!(await repoExists())) {
        throw new Error('Repository not initialized');
    }
    const fs = getFs();
    const pfs = fs.promises;
    const dir = REPO_DIR;
    await writeProjectToFractchTree({vm, fs: pfs, dir});
    const status = await git.statusMatrix({
        fs,
        dir
    });
    return status.map(row => {
        const [filepath] = row;
        const description = describeRepoChange(row);
        return {
            filepath,
            description
        };
    })
        .filter(v => v.description !== 'unmodified');
};

const getRepoStatus = async vm => {
    const fs = getFs();
    const pfs = fs.promises;
    const initialized = await exists(pfs, pathJoin(REPO_DIR, '.git'));
    if (!initialized) {
        return {
            initialized: false,
            currentBranch: null,
            branches: [],
            commits: [],
            changes: []
        };
    }

    const currentBranch = await git.currentBranch({fs, dir: REPO_DIR, fullname: false});
    const branches = await git.listBranches({fs, dir: REPO_DIR});
    const commits = await git.log({fs, dir: REPO_DIR, depth: 20});
    const changes = await getRepoChanges(vm);

    return {
        initialized: true,
        currentBranch,
        branches,
        commits,
        changes
    };
};

const createBranch = async ({ref} = {}) => {
    if (!ref || typeof ref !== 'string') {
        throw new Error('Invalid branch name');
    }

    if (!/^[a-zA-Z0-9._/-]+$/.test(ref) || ref.startsWith('/') || ref.endsWith('/') || ref.includes('//')) {
        throw new Error('Invalid branch name format');
    }

    const fs = getFs();
    const pfs = fs.promises;

    if (!(await exists(pfs, pathJoin(REPO_DIR, '.git')))) {
        throw new Error('Repository not initialized');
    }

    try {
        await git.resolveRef({fs, dir: REPO_DIR, ref: 'HEAD'});
    } catch (e) {
        throw new Error('Cannot create branch: HEAD is missing. Initialize or check out a commit.');
    }

    try {
        await git.branch({fs, dir: REPO_DIR, ref});
    } catch (e) {
        throw new Error(`Failed to create branch ${ref}: ${e.message}`);
    }
    return 'ok';
};

const checkoutBranch = async ref => {
    if (!ref || typeof ref !== 'string') {
        throw new Error('Invalid branch reference');
    }

    const fs = getFs();
    try {
        await clearWorkdirExceptGit(fs.promises);
        await git.checkout({fs, dir: REPO_DIR, ref, force: true});
    } catch (e) {
        throw new Error(`Failed to checkout branch ${ref}: ${e.message}`);
    }
    return 'ok';
};

const checkoutCommit = async oid => {
    if (!oid || typeof oid !== 'string') {
        throw new Error('Invalid commit OID');
    }

    const fs = getFs();
    try {
        await clearWorkdirExceptGit(fs.promises);
        await git.checkout({fs, dir: REPO_DIR, ref: oid, force: true});
    } catch (e) {
        throw new Error(`Failed to checkout commit ${oid}: ${e.message}`);
    }
    return 'ok';
};

const checkoutBranchAndRestore = async ({vm, ref}) => {
    await checkoutBranch(ref);
    await restoreProjectFromCurrentRef(vm);
    return 'ok';
};

const checkoutCommitAndRestore = async ({vm, oid}) => {
    await checkoutCommit(oid);
    await restoreProjectFromCurrentRef(vm);
    return 'ok';
};

const addRemote = async ({vm, name, url}) => {
    if (!vm) {
        throw new Error('VM is required');
    }

    const fs = getFs();

    if (!(await repoExists())) {
        await initRepo({defaultBranch: 'main', vm: vm});
    }

    await git.addRemote({fs, dir: REPO_DIR, remote: name, url});
};

const removeRemote = async ({vm, name}) => {
    if (!vm) {
        throw new Error('VM is required');
    }

    const fs = getFs();

    if (!(await repoExists())) {
        await initRepo({defaultBranch: 'main', vm: vm});
    }

    await git.deleteRemote({fs, dir: REPO_DIR, name});
};

const getRemotes = async vm => {
    if (!vm) {
        throw new Error('VM is required');
    }

    const fs = getFs();

    if (!(await repoExists())) {
        await initRepo({defaultBranch: 'main', vm: vm});
    }

    const remotes = await git.listRemotes({fs, dir: REPO_DIR});

    // isomorphic-git returns {remote, url}; expose it as {name, url}.
    return remotes.map(remote => ({
        name: remote.remote || remote.name,
        url: remote.url
    }));
};

const DEFAULT_CORS_PROXY = 'https://cors.isomorphic-git.org';
const DIRECT_CORS_HOSTS = [];

const corsProxyForUrl = url => {
    try {
        if (DIRECT_CORS_HOSTS.includes(new URL(url).host)) {
            return null;
        }
    } catch (e) {
        // ignore
    }
    return DEFAULT_CORS_PROXY;
};

const corsProxyForRemote = async (fs, remoteName) => {
    try {
        const remotes = await git.listRemotes({fs, dir: REPO_DIR});
        const match = remotes.find(r => (r.remote || r.name) === remoteName);
        if (match && match.url) {
            return corsProxyForUrl(match.url);
        }
    } catch (e) {
        // ignore
    }
    return DEFAULT_CORS_PROXY;
};

const push = async ({vm, remote, branch, ref, setUpstream = true, onProgress, ...options}) => {
    if (!vm) {
        throw new Error('VM is required');
    }

    const fs = getFs();

    if (!(await repoExists())) {
        await initRepo({defaultBranch: 'main', vm: vm});
    }

    // isomorphic-git's push uses `ref`/`remoteRef`, not `branch`. Default to the
    // current branch, and create the same-named branch on the remote.
    let localRef = ref || branch;
    if (!localRef) {
        localRef = await git.currentBranch({fs, dir: REPO_DIR, fullname: false});
    }
    if (!localRef) {
        throw new Error('No branch to push. Check out a branch first.');
    }

    // Make sure the repo identity (name + email) is configured so it travels
    // with the pushed history.
    try {
        const author = getDefaultAuthor();
        if (author.name) {
            await git.setConfig({fs, dir: REPO_DIR, path: 'user.name', value: author.name});
        }
        if (author.email) {
            await git.setConfig({fs, dir: REPO_DIR, path: 'user.email', value: author.email});
        }
    } catch (e) {
        // Non-fatal.
    }

    const result = await git.push({
        fs,
        http,
        corsProxy: await corsProxyForRemote(fs, remote),
        dir: REPO_DIR,
        remote,
        ref: localRef,
        remoteRef: localRef,
        onProgress: evt => {
            if (typeof onProgress === 'function' && evt) {
                onProgress({
                    phase: 'push',
                    message: `Pushing… ${evt.phase || ''}`.trim(),
                    completed: evt.loaded,
                    total: evt.total
                });
            }
        },
        ...options
    });

    // Emulate `git push -u`: record the upstream so future pulls/pushes track it.
    if (setUpstream) {
        try {
            await git.setConfig({fs, dir: REPO_DIR, path: `branch.${localRef}.remote`, value: remote});
            await git.setConfig({fs, dir: REPO_DIR, path: `branch.${localRef}.merge`, value: `refs/heads/${localRef}`});
        } catch (e) {
            // Non-fatal: the push itself succeeded.
            console.warn('Failed to set upstream tracking:', e);
        }
    }

    return result;
};

const pull = async ({vm, remote, ref, author, onAuth, onProgress} = {}) => {
    if (!vm) {
        throw new Error('VM is required');
    }
    const fs = getFs();
    if (!(await repoExists())) {
        throw new Error('Repository not initialized');
    }

    let localRef = ref;
    if (!localRef) {
        localRef = await git.currentBranch({fs, dir: REPO_DIR, fullname: false});
    }
    if (!localRef) {
        throw new Error('No branch checked out to pull into');
    }

    await git.pull({
        fs,
        http,
        corsProxy: await corsProxyForRemote(fs, remote || 'origin'),
        dir: REPO_DIR,
        ref: localRef,
        remote: remote || 'origin',
        singleBranch: true,
        fastForward: true,
        author: author || getDefaultAuthor(),
        onAuth,
        onProgress: evt => {
            if (typeof onProgress === 'function' && evt) {
                onProgress({
                    phase: 'pull',
                    message: `Pulling… ${evt.phase || ''}`.trim(),
                    completed: evt.loaded,
                    total: evt.total
                });
            }
        }
    });

    return 'ok';
};

const commitProject = async ({vm, message, author, onProgress} = {}) => {
    if (!message || typeof message !== 'string' || !message.trim()) {
        throw new Error('Commit message is required');
    }

    if (!vm) {
        throw new Error('VM is required');
    }

    const fs = getFs();
    const pfs = fs.promises;

    if (!(await repoExists())) {
        await initRepo({defaultBranch: 'main', vm: vm});
    }

    if (typeof vm.saveProjectSb3 !== 'function' || typeof vm.loadProject !== 'function') {
        throw new Error('VM does not support save/load project');
    }

    let sb3ArrayBuffer;

    try {
        sb3ArrayBuffer = await vm.saveProjectSb3('arraybuffer');
        if (!sb3ArrayBuffer || sb3ArrayBuffer.byteLength === 0) {
            throw new Error('Failed to save project');
        }
    } catch (e) {
        throw new Error(`Failed to save project: ${e.message}`);
    }

    if (typeof onProgress === 'function') {
        onProgress({phase: 'snapshot', message: 'Saving project snapshot…', completed: 0, total: 1});
    }

    try {
        await writeProjectToFractchTree({vm, sb3ArrayBuffer, fs: pfs, dir: REPO_DIR, onProgress});

        // Ensure any new files are discoverable by isomorphic-git (it uses callback fs,
        // but LightningFS mirrors state).
        await stageAll(fs, REPO_DIR, {onProgress});

        // After staging, ensure there are changes to commit.
        // If there are no differences, abort the commit.
        const matrixAfter = await git.statusMatrix({fs, dir: REPO_DIR});
        const rowsAfter = matrixAfter.filter(row => row && row[0] !== '.gitignore');
        const hasChanges = rowsAfter.some(row => {
            // statusMatrix rows can be [path, HEAD, WORKDIR] or [path, HEAD, WORKDIR, STAGE]
            const head = row[1];
            if (row.length >= 4) {
                const stage = row[3];
                return head !== stage;
            }
            const workdir = row[2];
            return head !== workdir;
        });

        if (!hasChanges) {
            throw new Error('No changes to commit');
        }

        const effectiveAuthor = author || getDefaultAuthor();
        if (author) setDefaultAuthor(author);

        if (typeof onProgress === 'function') {
            onProgress({phase: 'commit', message: 'Creating commit…', completed: 1, total: 1});
        }


        const ret = await git.commit({
            fs,
            dir: REPO_DIR,
            message: message.trim(),
            author: effectiveAuthor
        });
        return ret;
    } catch (e) {
        throw new Error(`Failed to commit: ${e.message}`);
    }
};

const deleteRepo = async () => {
    const fs = getFs();
    const pfs = fs.promises;
    if (!(await exists(pfs, REPO_DIR))) return;
    await removeRecursive(pfs, REPO_DIR);
};

const deleteBranch = async ref => {
    if (!ref || typeof ref !== 'string') {
        throw new Error('Invalid branch name');
    }

    const fs = getFs();
    try {
        const currentBranch = await git.currentBranch({fs, dir: REPO_DIR, fullname: false});
        if (currentBranch && currentBranch === ref) {
            throw new Error('Cannot delete the currently checked out branch');
        }
        await git.deleteBranch({fs, dir: REPO_DIR, ref});
    } catch (e) {
        throw new Error(`Failed to delete branch ${ref}: ${e.message}`);
    }
};

const listBranches = async () => {
    const fs = getFs();
    try {
        return await git.listBranches({fs, dir: REPO_DIR});
    } catch (e) {
        throw new Error(`Failed to list branches: ${e.message}`);
    }
};

const mergeBranchesPreview = async ({ours, theirs} = {}) => {
    if (!ours || !theirs || typeof ours !== 'string' || typeof theirs !== 'string') {
        throw new Error('Invalid branches for merge preview');
    }
    const fs = getFs();
    try {
        const result = await git.merge({
            fs,
            dir: REPO_DIR,
            ours,
            theirs,
            abortOnConflict: true,
            dryRun: true
        });
        return {
            result,
            conflicts: []
        };
    } catch (e) {
        if (Errors && e instanceof Errors.MergeConflictError) {
            const data = e.data || {};
            const conflicts = Array.isArray(data.filepaths) ? data.filepaths : [];
            return {
                result: null,
                conflicts
            };
        }
        throw new Error(`Failed to preview merge: ${e.message}`);
    }
};

const TEXT_MERGE_RE = /\.(fractch|json|svg|txt|md)$/i;

const mergeBranchesApply = async ({ours, theirs, resolutions, author} = {}) => {
    if (!ours || !theirs || typeof ours !== 'string' || typeof theirs !== 'string') {
        throw new Error('Invalid branches for merge');
    }
    const fs = getFs();
    const pfs = fs.promises;
    const map = resolutions && typeof resolutions === 'object' ? resolutions : {};
    const mergeAuthor = author || getDefaultAuthor();
    const message = `Merge branch '${theirs}' into ${ours}`;

    const oursOid = await git.resolveRef({fs, dir: REPO_DIR, ref: ours});
    const theirsOid = await git.resolveRef({fs, dir: REPO_DIR, ref: theirs});
    const {conflicts} = await mergeBranchesPreview({ours, theirs});

    let res;
    if (conflicts.length === 0) {
        res = await git.merge({
            fs,
            dir: REPO_DIR,
            ours,
            theirs,
            abortOnConflict: true,
            author: mergeAuthor,
            message
        });
    } else {
        const mergeDriver = ({path, contents}) => {
            const mergedText = map[path] === 'theirs' ? contents[2] : contents[1];
            return {cleanMerge: true, mergedText};
        };
        try {
            res = await git.merge({
                fs,
                dir: REPO_DIR,
                ours,
                theirs,
                abortOnConflict: false,
                author: mergeAuthor,
                message,
                mergeDriver
            });
        } catch (e) {
            await clearWorkdirExceptGit(pfs);
            await git.checkout({fs, dir: REPO_DIR, ref: ours, force: true});
            throw new Error(`Failed to merge: ${e.message}`);
        }
    }

    await clearWorkdirExceptGit(pfs);
    await git.checkout({fs, dir: REPO_DIR, ref: ours, force: true});

    const binaryConflicts = conflicts.filter(p => !TEXT_MERGE_RE.test(p));
    if (binaryConflicts.length > 0) {
        for (const filepath of binaryConflicts) {
            const sideOid = map[filepath] === 'theirs' ? theirsOid : oursOid;
            let blob = null;
            try {
                ({blob} = await git.readBlob({fs, dir: REPO_DIR, oid: sideOid, filepath}));
            } catch (e) {
                blob = null;
            }
            const dest = pathJoin(REPO_DIR, filepath);
            if (blob) {
                await ensureParentDir(pfs, dest);
                await pfs.writeFile(dest, blob instanceof Uint8Array ? blob : new Uint8Array(blob));
                await git.add({fs, dir: REPO_DIR, filepath});
            } else {
                try {
                    await pfs.unlink(dest);
                } catch (e) {
                    // already absent
                }
                await git.remove({fs, dir: REPO_DIR, filepath});
            }
        }
        res = await git.commit({
            fs,
            dir: REPO_DIR,
            message,
            author: mergeAuthor,
            parent: [oursOid, theirsOid]
        });
    }
    return res;
};

const getBranchLogs = async ({depth = 50} = {}) => {
    const fs = getFs();
    const branches = await git.listBranches({fs, dir: REPO_DIR});
    const out = [];
    for (const b of branches) {
        const commits = await git.log({fs, dir: REPO_DIR, ref: b, depth});
        out.push({branch: b, commits});
    }
    return out;
};

const computeCommitGraph = async ({depth = 50} = {}) => {
    const fs = getFs();
    const branches = await git.listBranches({fs, dir: REPO_DIR});
    const logs = await getBranchLogs({depth});
    const map = new Map();
    for (const entry of logs) {
        for (const c of entry.commits) {
            const key = c.oid;
            if (!map.has(key)) {
                const parents = Array.isArray(c.commit.parent) ?
                    c.commit.parent :
                    (Array.isArray(c.commit.parents) ?
                        c.commit.parents : []);
                map.set(key, {oid: c.oid, commit: c.commit, branches: new Set(), parents});
            }
            map.get(key).branches.add(entry.branch);
        }
    }
    const nodes = Array.from(map.values())
        .map(n => ({oid: n.oid, commit: n.commit, branches: Array.from(n.branches), parents: n.parents}))
        .sort((a, b) => (b.commit.author.timestamp || 0) - (a.commit.author.timestamp || 0));
    const branchLogs = logs.map(l => ({branch: l.branch, oids: l.commits.map(c => c.oid)}));
    return {branches, nodes, branchLogs};
};

const exportRepoToZip = async ({includeGitDir = true} = {}) => {
    const fs = getFs();
    const pfs = fs.promises;

    if (!(await repoExists())) {
        throw new Error('Repository not initialized');
    }

    const zip = new JSZip();
    const root = REPO_DIR;

    const files = await listFilesRecursive(pfs, root);

    for (const absPath of files) {
        if (!includeGitDir && absPath.startsWith(`${REPO_DIR}/.git/`)) {
            continue;
        }

        const relPath = absPath.replace(`${REPO_DIR}/`, '');

        try {
            const data = await pfs.readFile(absPath);
            const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);

            zip.file(relPath, bytes);
        } catch (e) {
            console.warn('Skipping file during zip export:', relPath, e);
        }
    }

    return zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: {level: 6}
    });
};

const downloadRepoZip = async options => {
    const blob = await exportRepoToZip(options);

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'project-repo.zip';
    a.click();
    URL.revokeObjectURL(url);
};

const commitSb3 = async ({
    sb3ArrayBuffer,
    message,
    author,
    onProgress,
    vm
} = {}) => {
    if (!sb3ArrayBuffer || !(sb3ArrayBuffer instanceof ArrayBuffer)) {
        throw new Error('Invalid SB3 buffer');
    }
    if (!message || !message.trim()) {
        throw new Error('Commit message is required');
    }

    const fs = getFs();
    const pfs = fs.promises;

    if (!(await repoExists())) {
        await initRepo({defaultBranch: 'main'});
    }

    if (typeof onProgress === 'function') {
        onProgress({phase: 'snapshot', message: 'Converting project to fractch…'});
    }

    await writeProjectToFractchTree({
        sb3ArrayBuffer,
        fs: pfs,
        dir: REPO_DIR,
        onProgress,
        vm: vm
    });

    await stageAll(fs, REPO_DIR, {onProgress});

    const authorUsed = author || getDefaultAuthor();
    if (author) setDefaultAuthor(author);

    const oid = await git.commit({
        fs,
        dir: REPO_DIR,
        message: message.trim(),
        author: authorUsed
    });

    return oid;
};

const pickSb3File = () => new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.sb,.sb2,.sb3,.json';

    input.onchange = () => {
        const file = input.files && input.files[0];
        if (!file) return reject(new Error('No file selected'));
        resolve(file);
    };

    input.click();
});

const README_FILE = 'README.md';

const readReadme = async () => {
    const fs = getFs();
    const pfs = fs.promises;
    if (!(await repoExists())) return '';
    try {
        const data = await pfs.readFile(pathJoin(REPO_DIR, README_FILE), 'utf8');
        return typeof data === 'string' ? data : new TextDecoder().decode(data);
    } catch (e) {
        return '';
    }
};

const writeReadme = async content => {
    const fs = getFs();
    const pfs = fs.promises;
    if (!(await repoExists())) {
        throw new Error('Initialize a repository first');
    }
    const text = content === null || typeof content === 'undefined' ? '' : String(content);
    if (text.length === 0) {
        // Empty README: remove the file so it doesn't linger as an empty blob.
        try {
            await pfs.unlink(pathJoin(REPO_DIR, README_FILE));
        } catch (e) {
            // not present, nothing to do
        }
        return;
    }
    await pfs.writeFile(pathJoin(REPO_DIR, README_FILE), text);
};

// Clone a git repository into LightningFS, replacing any existing repo. After
// this, the working tree holds the cloned files (fractch source + .git).
const moveDir = async (pfs, from, to) => {
    try {
        await pfs.rename(from, to);
        return;
    } catch (e) {
        // fall back to copy
    }
    await ensureDir(pfs, to);
    const entries = await pfs.readdir(from);
    for (const entry of entries) {
        const src = `${from}/${entry}`;
        const dest = `${to}/${entry}`;
        const stat = await pfs.stat(src);
        if (stat.isDirectory()) {
            await moveDir(pfs, src, dest);
        } else {
            const data = await pfs.readFile(src);
            await pfs.writeFile(dest, data instanceof Uint8Array ? data : new Uint8Array(data));
        }
    }
    await removeRecursive(pfs, from);
};

const cloneRepo = async ({url, ref, onAuth, onProgress} = {}) => {
    if (!url || typeof url !== 'string') {
        throw new Error('Repository URL is required');
    }

    const fs = getFs();
    const pfs = fs.promises;
    const tmpDir = `${REPO_DIR}-clone-${Date.now()}`;

    try {
        await ensureDir(pfs, tmpDir);
        const cloneOptions = {
            fs,
            http,
            dir: tmpDir,
            url: url.trim(),
            corsProxy: corsProxyForUrl(url.trim()),
            singleBranch: false,
            onAuth,
            onProgress: evt => {
                if (typeof onProgress === 'function' && evt) {
                    onProgress({
                        phase: 'clone',
                        message: `Cloning… ${evt.phase || ''}`.trim(),
                        completed: evt.loaded,
                        total: evt.total
                    });
                }
            }
        };
        if (ref) cloneOptions.ref = ref;
        await git.clone(cloneOptions);
    } catch (e) {
        try {
            await removeRecursive(pfs, tmpDir);
        } catch (cleanupError) {
            // ignore
        }
        throw new Error(`Failed to clone: ${e.message}`);
    }

    await deleteRepo();
    await moveDir(pfs, tmpDir, REPO_DIR);

    return {fs, dir: REPO_DIR};
};

// True if the repo working tree contains at least one .fractch source file.
const repoHasFractch = async () => {
    const fs = getFs();
    const pfs = fs.promises;
    if (!(await repoExists())) return false;
    try {
        const files = await listFilesRecursive(pfs, REPO_DIR);
        return files.some(f => /\.fractch$/i.test(f) && !f.includes('/.git/'));
    } catch (e) {
        return false;
    }
};

// Copy the entire LightningFS repo (fractch working tree + .git) into an sb3 zip
// under GIT_EMBED_DIR, leaving the normal project.json/assets at the top level.
// Returns a new Blob; if there is no repo, the original blob is returned as-is.
const embedRepoIntoSb3Blob = async blob => {
    if (!blob) return blob;
    if (!(await repoExists())) return blob;

    const fs = getFs();
    const pfs = fs.promises;

    let zip;
    try {
        zip = await JSZip.loadAsync(blob);
    } catch (e) {
        console.warn('Could not open sb3 to embed git history:', e);
        return blob;
    }

    const files = await listFilesRecursive(pfs, REPO_DIR);
    for (const absPath of files) {
        const rel = absPath.slice(REPO_DIR.length + 1);
        if (!rel) continue;
        try {
            const data = await pfs.readFile(absPath);
            zip.file(`${GIT_EMBED_DIR}/${rel}`, data instanceof Uint8Array ? data : new Uint8Array(data));
        } catch (e) {
            console.warn('Skipping repo file while embedding:', rel, e);
        }
    }

    return zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: {level: 6}
    });
};

// Restore a repo previously embedded by embedRepoIntoSb3Blob back into LightningFS.
// If the sb3 has no embedded repo, any stale repo is cleared so the git panel
// matches the freshly loaded project. Returns true when a repo was imported.
const importRepoFromSb3 = async input => {
    if (!input) return false;

    let zip;
    try {
        zip = await JSZip.loadAsync(input);
    } catch (e) {
        try {
            await deleteRepo();
        } catch (cleanupError) {
            // ignore
        }
        return false;
    }

    const prefix = `${GIT_EMBED_DIR}/`;
    const entryPaths = Object.keys(zip.files).filter(p => p.startsWith(prefix) && !zip.files[p].dir);

    const fs = getFs();
    const pfs = fs.promises;

    if (entryPaths.length === 0) {
        try {
            await deleteRepo();
        } catch (e) {
            // ignore
        }
        return false;
    }

    await deleteRepo();
    await ensureDir(pfs, REPO_DIR);

    for (const p of entryPaths) {
        const rel = p.slice(prefix.length);
        if (!rel) continue;
        const segments = rel.split('/');
        if (segments.some(s => s === '..' || s === '')) {
            console.warn('Skipping unsafe embedded repo path on import:', p);
            continue;
        }
        try {
            const data = await zip.files[p].async('uint8array');
            const dest = pathJoin(REPO_DIR, rel);
            await ensureParentDir(pfs, dest);
            await pfs.writeFile(dest, data);
        } catch (e) {
            console.warn('Skipping embedded repo file on import:', p, e);
        }
    }

    return true;
};

const pickAndCommitSb3 = async ({
    message,
    author,
    onProgress,
    vm
}) => {
    const file = await pickSb3File();
    const buffer = await file.arrayBuffer();

    return commitSb3({
        sb3ArrayBuffer: buffer,
        message,
        author,
        onProgress,
        vm
    });
};

export {
    getDefaultAuthor,
    setDefaultAuthor,
    ensureParentDir,
    getRepoStatus,
    getRepoChanges,
    getFs,
    initRepo,
    repoExists,
    createBranch,
    checkoutBranch,
    checkoutBranchAndRestore,
    listBranches,
    checkoutCommitAndRestore,
    restoreProjectFromCurrentRef,
    readSnapshotAtCommit,
    getBranchLogs,
    computeCommitGraph,
    deleteRepo,
    deleteBranch,
    commitProject,
    mergeBranchesPreview,
    mergeBranchesApply,
    addRemote,
    removeRemote,
    getRemotes,
    push,
    pull,
    exportRepoToZip,
    downloadRepoZip,
    commitSb3,
    pickAndCommitSb3,
    embedRepoIntoSb3Blob,
    importRepoFromSb3,
    cloneRepo,
    repoHasFractch,
    readReadme,
    writeReadme,
    REPO_DIR,
    git
};
