import JSZip from '@turbowarp/jszip';
import {compareProjects, filesToProject, projectAssetPaths, projectToFiles} from 'fractch';

const KEPT_ROOT_ENTRIES = new Set(['.git', '.gitignore', 'README.md']);

const YIELD_INTERVAL_MS = 30;

const yieldToBrowser = () => new Promise(resolve => setTimeout(resolve, 0));

const createYielder = () => {
    let last = Date.now();
    return () => {
        const now = Date.now();
        if (now - last < YIELD_INTERVAL_MS) return Promise.resolve();
        last = now;
        return yieldToBrowser();
    };
};

const sanitize = name => String(name === null || typeof name === 'undefined' ? '' : name)
    .replace(/[^a-zA-Z0-9-_]/g, '_') || 'target';

const toBytes = data => {
    if (data instanceof Uint8Array) return data;
    if (typeof data === 'string') return new TextEncoder().encode(data);
    if (ArrayBuffer.isView(data)) return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
    return new Uint8Array(data);
};

const hasControlCharacter = text => Array.from(text).some(character => {
    const code = character.charCodeAt(0);
    return code < 32 || code === 127;
});

const normalizeTreePath = path => path.replace(/\/+/g, '/');

const insideTree = (path, dir) => {
    if (typeof path !== 'string' || hasControlCharacter(path)) return false;
    const normalized = normalizeTreePath(path).replace(/\/$/, '');
    const root = normalizeTreePath(`${dir}/`);
    if (!normalized.startsWith(root)) return false;
    const parts = normalized.slice(root.length).split('/')
        .filter(Boolean);
    return parts.length > 0 && !parts.some(part => part === '.' || part === '..' || part.startsWith('.'));
};

const lstatOf = async (pfs, path) => {
    try {
        return await (pfs.lstat || pfs.stat).call(pfs, path);
    } catch (e) {
        return null;
    }
};

const removeRecursive = async (pfs, filePath) => {
    const stat = await lstatOf(pfs, filePath);
    if (!stat) return;
    if (stat.isDirectory() && !(stat.isSymbolicLink && stat.isSymbolicLink())) {
        const entries = await pfs.readdir(filePath);
        await Promise.all(entries.map(entry => removeRecursive(pfs, `${filePath}/${entry}`)));
        try {
            await pfs.rmdir(filePath);
        } catch (e) {
            console.warn('Failed to remove directory:', filePath, e);
        }
        return;
    }
    try {
        await pfs.unlink(filePath);
    } catch (e) {
        console.warn('Failed to remove file:', filePath, e);
    }
};

const clearWorkingTree = async ({pfs, dir}) => {
    if (!pfs || typeof pfs.readdir !== 'function') {
        throw new Error('Invalid filesystem object');
    }
    if (!dir || typeof dir !== 'string') {
        throw new Error('Invalid directory path');
    }
    let entries;
    try {
        entries = await pfs.readdir(dir);
    } catch (e) {
        return;
    }
    await Promise.all(entries.map(async entry => {
        if (KEPT_ROOT_ENTRIES.has(entry)) return;
        await removeRecursive(pfs, `${dir}/${entry}`);
    }));
};

const listGeneratedTree = async (pfs, dir) => {
    const files = [];
    const dirs = [];
    const links = [];
    const walk = async (current, isRoot) => {
        let entries;
        try {
            entries = await pfs.readdir(current);
        } catch (e) {
            return;
        }
        for (const entry of entries) {
            if (isRoot && KEPT_ROOT_ENTRIES.has(entry)) continue;
            const path = `${current}/${entry}`;
            const stat = await lstatOf(pfs, path);
            if (!stat) continue;
            if (stat.isSymbolicLink && stat.isSymbolicLink()) {
                links.push(path);
            } else if (stat.isDirectory()) {
                dirs.push(path);
                await walk(path, false);
            } else {
                files.push(path);
            }
        }
    };
    await walk(dir, true);
    return {files, dirs, links};
};

const sameBytes = (a, b) => {
    if (a.byteLength !== b.byteLength) return false;
    for (let i = 0; i < a.byteLength; i++) {
        if (a[i] !== b[i]) return false;
    }
    return true;
};

const makeParents = async (pfs, dir, path, stale) => {
    const parts = path.slice(dir.length + 1).split('/');
    parts.pop();
    let current = dir;
    for (const part of parts) {
        current = `${current}/${part}`;
        const stat = await lstatOf(pfs, current);
        if (stat && stat.isDirectory()) continue;
        if (stat) {
            await pfs.unlink(current);
            stale.delete(current);
        }
        await pfs.mkdir(current);
    }
};

const writeFiles = async ({pfs, dir, files, prune, onProgress}) => {
    const previous = await listGeneratedTree(pfs, dir);
    for (const link of previous.links) {
        try {
            await pfs.unlink(link);
        } catch (e) {
            console.warn('[fractch-tree] could not remove link:', link, e);
        }
    }
    const stale = new Set(previous.files);
    const maybeYield = createYielder();
    let completed = 0;
    for (const [relative, data] of files) {
        const path = normalizeTreePath(`${dir}/${relative}`);
        completed += 1;
        if (!insideTree(path, dir)) {
            console.warn('[fractch-tree] refusing to write a path outside the project folder:', relative);
            continue;
        }
        const bytes = toBytes(data);
        if (stale.has(path)) {
            stale.delete(path);
            let existing = null;
            try {
                existing = await pfs.readFile(path);
            } catch (e) {
                existing = null;
            }
            if (existing && sameBytes(toBytes(existing), bytes)) continue;
        } else {
            await makeParents(pfs, dir, path, stale);
            const stat = await lstatOf(pfs, path);
            if (stat && stat.isDirectory()) await removeRecursive(pfs, path);
        }
        await pfs.writeFile(path, bytes);
        if (typeof onProgress === 'function' && completed % 25 === 0) {
            onProgress({phase: 'write', message: 'Writing project files…', completed, total: files.size});
        }
        await maybeYield();
    }
    if (!prune) return;
    for (const path of stale) {
        const stat = await lstatOf(pfs, path);
        if (stat && !stat.isDirectory()) await pfs.unlink(path);
    }
    const dirs = [...previous.dirs].sort((a, b) => b.length - a.length);
    for (const path of dirs) {
        try {
            if ((await pfs.readdir(path)).length === 0) await pfs.rmdir(path);
        } catch (e) {
            console.warn('Failed to remove directory:', path, e);
        }
    }
};

const sb3FileReader = files => name => {
    if (!Object.prototype.hasOwnProperty.call(files, name)) return null;
    const data = files[name];
    return data === null || typeof data === 'undefined' ? null : toBytes(data);
};

const zipFileReader = zip => name => {
    const entry = zip.file(name);
    return entry ? entry.async('uint8array') : null;
};

const loadSb3 = async ({vm, sb3ArrayBuffer, sb3Files}) => {
    let files = sb3Files;
    if (!files && !sb3ArrayBuffer && vm && typeof vm.saveProjectSb3DontZip === 'function') {
        files = vm.saveProjectSb3DontZip();
    }
    if (files) {
        const readSb3File = sb3FileReader(files);
        const projectBytes = await readSb3File('project.json');
        if (!projectBytes) {
            throw new Error('Invalid sb3 files: no project.json');
        }
        return {readSb3File, projectJson: JSON.parse(new TextDecoder().decode(projectBytes))};
    }
    let buffer = sb3ArrayBuffer;
    if (!buffer) {
        if (!vm || typeof vm.saveProjectSb3 !== 'function') {
            throw new Error('VM does not support saveProjectSb3');
        }
        buffer = await vm.saveProjectSb3('arraybuffer');
    }
    if (!buffer || (buffer.byteLength === 0)) {
        throw new Error('Failed to obtain project data');
    }
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    const zip = await JSZip.loadAsync(bytes);
    const projectEntry = zip.file('project.json');
    if (!projectEntry) {
        throw new Error('Invalid sb3: no project.json');
    }
    const projectJson = JSON.parse(await projectEntry.async('string'));
    return {readSb3File: zipFileReader(zip), projectJson};
};

const MD5EXT = /^[0-9a-f]{32}\.[a-z0-9]{1,8}$/;

const worktreeAssetPaths = async sb3Files => {
    const projectBytes = await sb3FileReader(sb3Files)('project.json');
    if (!projectBytes) return new Map();
    const projectJson = JSON.parse(new TextDecoder().decode(projectBytes));
    const paths = new Map();
    for (const [path, md5ext] of projectAssetPaths(projectJson)) {
        if (MD5EXT.test(md5ext)) paths.set(path, md5ext);
    }
    return paths;
};

const projectFilesFromSb3 = async ({vm, sb3ArrayBuffer, sb3Files}) => {
    const {readSb3File, projectJson} = await loadSb3({vm, sb3ArrayBuffer, sb3Files});
    return {readSb3File, projectJson, ...(await projectToFiles({projectJson, readAsset: readSb3File}))};
};

const readTreeFiles = async (pfs, dir) => {
    const files = new Map();
    const {files: paths} = await listGeneratedTree(pfs, dir);
    const root = normalizeTreePath(`${dir}/`);
    for (const path of paths) {
        files.set(path.slice(root.length), toBytes(await pfs.readFile(path)));
    }
    return files;
};

const checkFiles = async ({files, projectJson, readSb3File}) => {
    const rebuilt = await filesToProject(files);
    return compareProjects(projectJson, rebuilt.projectJson, {
        readBefore: readSb3File,
        readAfter: md5ext => rebuilt.assets.get(md5ext) || null
    });
};

const writeProjectToFractchTree = async ({
    vm, sb3ArrayBuffer, sb3Files, fs, dir, onProgress, clear = true, verify = false
} = {}) => {
    if (!fs || !dir) {
        throw new Error('Invalid filesystem or directory');
    }
    if (typeof onProgress === 'function') {
        onProgress({phase: 'write', message: 'Reading project…', completed: 0, total: 1});
    }
    const {files, diagnostics, projectJson, readSb3File} = await projectFilesFromSb3({vm, sb3ArrayBuffer, sb3Files});
    if (typeof onProgress === 'function') {
        onProgress({phase: 'write', message: 'Writing project files…', completed: 0, total: files.size});
        await yieldToBrowser();
    }
    try {
        await writeFiles({pfs: fs, dir, files, prune: clear, onProgress});
    } catch (error) {
        if (!clear) throw error;
        console.warn('[fractch-tree] rewriting the whole tree after an incremental write failed:', error);
        await clearWorkingTree({pfs: fs, dir});
        await writeFiles({pfs: fs, dir, files, prune: false, onProgress});
    }
    const differences = verify ?
        await checkFiles({files: await readTreeFiles(fs, dir), projectJson, readSb3File}) : [];
    return {files, diagnostics, differences};
};

const notExactError = differences => {
    const error = new Error('This version would not keep the project exactly as it is in the editor.');
    error.code = 'project_not_exact';
    error.differences = differences;
    return error;
};

const zipProject = ({projectJson, assets}) => {
    const zip = new JSZip();
    zip.file('project.json', JSON.stringify(projectJson));
    for (const [md5ext, data] of assets) zip.file(md5ext, data);
    return zip.generateAsync({type: 'uint8array'});
};

const buildSb3FromFractchTree = async ({fs, dir, onProgress} = {}) => {
    if (!fs || !dir) {
        throw new Error('Invalid filesystem or directory');
    }
    if (typeof onProgress === 'function') {
        onProgress({phase: 'pack', message: 'Rebuilding project from fractch…', completed: 0, total: 1});
    }
    const built = await filesToProject(await readTreeFiles(fs, dir));
    if (typeof onProgress === 'function') {
        onProgress({phase: 'pack', message: 'Compressing project…', completed: 1, total: 1});
    }
    return zipProject(built);
};

export {
    clearWorkingTree,
    notExactError,
    worktreeAssetPaths,
    writeProjectToFractchTree,
    buildSb3FromFractchTree,
    yieldToBrowser,
    sanitize
};
