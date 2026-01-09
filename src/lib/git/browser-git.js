import LightningFS from '@isomorphic-git/lightning-fs';
import git from 'isomorphic-git';

import {
    clearWorkingTree,
    writeProjectToWorkingTree
} from './project-working-tree.js';

const FS_NAME = 'mistwarp-git';
const REPO_DIR = '/repo';
const SNAPSHOT_FILE = 'project.sb3';
const EXPORT_VERSION = 1;

const uint8ToBase64 = uint8 => {
    let binary = '';
    const chunkSize = 0x8000;
    for (let i = 0; i < uint8.length; i += chunkSize) {
        // eslint-disable-next-line prefer-spread
        binary += String.fromCharCode.apply(null, uint8.subarray(i, i + chunkSize));
    }
    return btoa(binary);
};

const base64ToUint8 = base64 => {
    const binary = atob(base64);
    const out = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
    return out;
};

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
    try {
        await pfs.stat(filePath);
        return true;
    } catch (e) {
        return false;
    }
};

const ensureDir = async (pfs, dirPath) => {
    try {
        await pfs.mkdir(dirPath);
    } catch (e) {
        // ignore EEXIST and parents
    }
};

const removeRecursive = async (pfs, filePath) => {
    let stat;
    try {
        stat = await pfs.stat(filePath);
    } catch (e) {
        return;
    }

    if (stat.isDirectory()) {
        const entries = await pfs.readdir(filePath);
        // eslint-disable-next-line no-await-in-loop
        for (const entry of entries) await removeRecursive(pfs, `${filePath}/${entry}`);
        try {
            await pfs.rmdir(filePath);
        } catch (e) {
            // ignore
        }
        return;
    }

    try {
        await pfs.unlink(filePath);
    } catch (e) {
        // ignore
    }
};

const ensureParentDir = async (pfs, filePath) => {
    const parts = filePath.split('/').filter(Boolean);
    parts.pop();
    let current = '';
    for (const part of parts) {
        current = current ? `${current}/${part}` : `/${part}`;
        // eslint-disable-next-line no-await-in-loop
        await ensureDir(pfs, current);
    }
};

const stageAll = async (fs, dir) => {
    const matrix = await git.statusMatrix({fs, dir});
    await Promise.all(matrix.map(async row => {
        const [filepath, head, workdir] = row;
        if (filepath === '.gitignore') return;
        if (workdir === 0) {
            if (head !== 0) {
                await git.remove({fs, dir, filepath});
            }
            return;
        }
        await git.add({fs, dir, filepath});
    }));
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

const initRepo = async ({defaultBranch = 'main', vm = null} = {}) => {
    const fs = getFs();
    const pfs = fs.promises;
    await ensureDir(pfs, REPO_DIR);

    const already = await repoExists();
    if (!already) {
        await git.init({fs, dir: REPO_DIR, defaultBranch});
        await pfs.writeFile(pathJoin(REPO_DIR, '.gitignore'), '');
        await git.add({fs, dir: REPO_DIR, filepath: '.gitignore'});

        if (vm) {
            const sb3ArrayBuffer = await vm.saveProjectSb3('arraybuffer');
            await pfs.writeFile(pathJoin(REPO_DIR, SNAPSHOT_FILE), new Uint8Array(sb3ArrayBuffer));
            await writeProjectToWorkingTree({vm, fs: pfs, dir: REPO_DIR});
            await stageAll(fs, REPO_DIR);
        }

        await git.commit({
            fs,
            dir: REPO_DIR,
            message: 'Initialize repository',
            author: getDefaultAuthor()
        });
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
    const data = await pfs.readFile(snapshotPath);
    const view = data instanceof Uint8Array ? data : new Uint8Array(data);
    return view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength);
};

const readSnapshotAtCommit = async oid => {
    const fs = getFs();
    const {blob} = await git.readBlob({fs, dir: REPO_DIR, oid, filepath: SNAPSHOT_FILE});
    const view = blob instanceof Uint8Array ? blob : new Uint8Array(blob);
    return view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength);
};

const restoreProjectFromCurrentRef = async vm => {
    if (!vm) throw new Error('VM not provided');
    if (!(await repoExists())) throw new Error('Repository not initialized');
    const snapshot = await readSnapshot();
    vm.quit();
    await vm.loadProject(snapshot);
};

const getRepoStatus = async () => {
    const fs = getFs();
    const pfs = fs.promises;
    const initialized = await exists(pfs, pathJoin(REPO_DIR, '.git'));
    if (!initialized) {
        return {
            initialized: false,
            currentBranch: null,
            branches: [],
            commits: []
        };
    }

    const currentBranch = await git.currentBranch({fs, dir: REPO_DIR, fullname: false});
    const branches = await git.listBranches({fs, dir: REPO_DIR});
    const commits = await git.log({fs, dir: REPO_DIR, depth: 20});

    return {
        initialized: true,
        currentBranch,
        branches,
        commits
    };
};

const createBranch = async ref => {
    const fs = getFs();
    await git.branch({fs, dir: REPO_DIR, ref});
};

const checkoutBranch = async ref => {
    const fs = getFs();
    await git.checkout({fs, dir: REPO_DIR, ref, force: true});
};

const checkoutCommit = async oid => {
    const fs = getFs();
    await git.checkout({fs, dir: REPO_DIR, ref: oid, force: true});
};

const checkoutBranchAndRestore = async ({vm, ref}) => {
    await checkoutBranch(ref);
    await restoreProjectFromCurrentRef(vm);
};

const checkoutCommitAndRestore = async ({vm, oid}) => {
    await checkoutCommit(oid);
    await restoreProjectFromCurrentRef(vm);
};

const commitProject = async ({vm, message, author}) => {
    const fs = getFs();
    const pfs = fs.promises;

    if (!(await repoExists())) {
        await initRepo();
    }

    if (!vm || typeof vm.saveProjectSb3 !== 'function' || typeof vm.loadProject !== 'function') {
        throw new Error('VM does not support save/load project');
    }

    const saveProjectSb3 = vm._mwGit_originalSaveProjectSb3 || vm.saveProjectSb3;
    const sb3ArrayBuffer = await saveProjectSb3.call(vm, 'arraybuffer');

    await clearWorkingTree({pfs, dir: REPO_DIR});
    await pfs.writeFile(pathJoin(REPO_DIR, SNAPSHOT_FILE), new Uint8Array(sb3ArrayBuffer));
    await writeProjectToWorkingTree({vm, fs: pfs, dir: REPO_DIR});

    // Ensure any new files are discoverable by isomorphic-git (it uses callback fs,
    // but LightningFS mirrors state).
    await stageAll(fs, REPO_DIR);

    const effectiveAuthor = author || getDefaultAuthor();
    if (author) setDefaultAuthor(author);

    return git.commit({
        fs,
        dir: REPO_DIR,
        message,
        author: effectiveAuthor
    });
};

const deleteRepo = async () => {
    const fs = getFs();
    const pfs = fs.promises;
    if (!(await exists(pfs, REPO_DIR))) return;
    await removeRecursive(pfs, REPO_DIR);
};

const deleteBranch = async ref => {
    const fs = getFs();
    const currentBranch = await git.currentBranch({fs, dir: REPO_DIR, fullname: false});
    if (currentBranch && currentBranch === ref) {
        throw new Error('Cannot delete the currently checked out branch');
    }
    await git.deleteBranch({fs, dir: REPO_DIR, ref});
};

const listFilesRecursive = async (pfs, rootDir) => {
    const out = [];
    const walk = async currentDir => {
        const entries = await pfs.readdir(currentDir);
        // eslint-disable-next-line no-await-in-loop
        for (const entry of entries) {
            const full = `${currentDir}/${entry}`;
            // eslint-disable-next-line no-await-in-loop
            const stat = await pfs.stat(full);
            if (stat.isDirectory()) {
                // eslint-disable-next-line no-await-in-loop
                await walk(full);
            } else {
                out.push(full);
            }
        }
    };
    await walk(rootDir);
    return out;
};

const exportRepoToGitJsonString = async () => {
    const fs = getFs();
    const pfs = fs.promises;
    if (!(await repoExists())) return null;

    const gitDir = pathJoin(REPO_DIR, '.git');
    const files = await listFilesRecursive(pfs, gitDir);
    const entries = await Promise.all(files.map(async filePath => {
        const data = await pfs.readFile(filePath);
        const view = data instanceof Uint8Array ? data : new Uint8Array(data);
        return {
            path: filePath.replace(`${REPO_DIR}/`, ''),
            encoding: 'base64',
            data: uint8ToBase64(view)
        };
    }));

    return JSON.stringify({
        version: EXPORT_VERSION,
        repoDir: REPO_DIR,
        entries
    });
};

const importRepoFromGitJsonString = async gitJsonString => {
    if (!gitJsonString) return;

    let parsed;
    try {
        parsed = JSON.parse(gitJsonString);
    } catch (e) {
        throw new Error('Invalid git.json');
    }

    if (!parsed || parsed.version !== EXPORT_VERSION || !Array.isArray(parsed.entries)) {
        throw new Error('Unsupported git.json format');
    }

    const fs = getFs();
    const pfs = fs.promises;
    await deleteRepo();
    await ensureDir(pfs, REPO_DIR);

    // eslint-disable-next-line no-await-in-loop
    for (const entry of parsed.entries) {
        if (!entry || typeof entry.path !== 'string' || entry.encoding !== 'base64') continue;
        const filePath = pathJoin(REPO_DIR, entry.path);
        // eslint-disable-next-line no-await-in-loop
        await ensureParentDir(pfs, filePath);
        // eslint-disable-next-line no-await-in-loop
        await pfs.writeFile(filePath, base64ToUint8(entry.data || ''));
    }
};

export {
    getDefaultAuthor,
    setDefaultAuthor,
    ensureParentDir,
    getRepoStatus,
    initRepo,
    repoExists,
    createBranch,
    checkoutBranch,
    checkoutBranchAndRestore,
    checkoutCommitAndRestore,
    restoreProjectFromCurrentRef,
    readSnapshotAtCommit,
    exportRepoToGitJsonString,
    importRepoFromGitJsonString,
    deleteRepo,
    deleteBranch,
    commitProject,
    REPO_DIR
};
