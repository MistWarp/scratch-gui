import JSZip from '@turbowarp/jszip';
import {convertProject, buildProjectFromBuildDir, toPromiseFs, writeExtensions} from 'fractch';
import storage from '../persistence/storage';

// Custom assets are mirrored into the repo as a real tracked folder with real
// filenames instead of md5 blobs. Identity is recovered by re-hashing on pack,
// exactly like fractch does for costumes and sounds.
const CUSTOM_ASSETS_DIR = 'assets';

const extensionOf = path => {
    const base = path.substring(path.lastIndexOf('/') + 1);
    const dot = base.lastIndexOf('.');
    return dot > 0 ? base.substring(dot + 1).toLowerCase() : 'bin';
};

const hasControlCharacter = text => Array.from(text).some(character => {
    const code = character.charCodeAt(0);
    return code < 32 || code === 127;
});

const safeRelativePath = path => {
    if (typeof path !== 'string' || hasControlCharacter(path)) return null;
    const parts = path.replace(/\\/g, '/').split('/')
        .filter(Boolean);
    if (!parts.length || /^[A-Za-z]:$/.test(parts[0])) return null;
    if (parts.some(part => part === '.' || part === '..' || part.startsWith('.'))) return null;
    return parts.join('/');
};

const writeCustomAssets = async ({readSb3File, projectJson, vfs, dir}) => {
    const customAssets = Array.isArray(projectJson.customAssets) ? projectJson.customAssets : [];
    for (const {name: rawName, md5ext} of customAssets) {
        const name = safeRelativePath(rawName);
        if (!name) {
            console.warn('[fractch-tree] skipping custom asset with an unsafe name:', rawName);
            continue;
        }
        const data = await readSb3File(md5ext);
        if (!data) {
            console.warn('[fractch-tree] missing custom asset in sb3:', md5ext);
            continue;
        }
        const path = `${dir}/${CUSTOM_ASSETS_DIR}/${name}`;
        await vfs.mkdirp(path.substring(0, path.lastIndexOf('/')));
        await vfs.writeFile(path, data);
    }
};

const readCustomAssets = async ({vfs, pfs, dir}) => {
    const found = [];

    const walk = async relative => {
        const absolute = `${dir}/${CUSTOM_ASSETS_DIR}${relative}`;
        let entries;
        try {
            entries = await pfs.readdir(absolute);
        } catch (e) {
            return;
        }
        for (const entry of entries) {
            const childRelative = `${relative}/${entry}`;
            const stat = await pfs.stat(`${absolute}/${entry}`);
            if (stat.isDirectory()) {
                await walk(childRelative);
            } else {
                const data = await vfs.readFile(`${absolute}/${entry}`);
                found.push({
                    name: childRelative.substring(1),
                    data: data instanceof Uint8Array ? data : new Uint8Array(data)
                });
            }
        }
    };

    await walk('');
    return found;
};

const targetAssetFiles = target => {
    const used = new Set();
    const map = new Map();
    for (const asset of [...(target.costumes || []), ...(target.sounds || [])]) {
        const md5ext = asset.md5ext || (asset.assetId && `${asset.assetId}.${asset.dataFormat || ''}`);
        if (!md5ext || map.has(md5ext)) continue;
        const md5extParts = String(md5ext).split('.');
        const ext = asset.dataFormat || md5extParts[md5extParts.length - 1] || 'dat';
        const base = String(asset.name === null || typeof asset.name === 'undefined' ? 'asset' : asset.name)
            .replace(/[^a-zA-Z0-9-_]/g, '_') || 'asset';
        let file = `${base}.${ext}`;
        let n = 2;
        while (used.has(file.toLowerCase())) file = `${base}_${n++}.${ext}`;
        used.add(file.toLowerCase());
        map.set(md5ext, `assets/${file}`);
    }
    return map;
};

const targetDirs = targets => {
    const used = new Set();
    const dirs = new Map();
    for (const target of targets) {
        const base = String(target && target.name !== null && typeof target.name !== 'undefined' ? target.name : '')
            .replace(/[^a-zA-Z0-9-_]/g, '_') || 'target';
        let name = base;
        let n = 2;
        while (used.has(name.toLowerCase())) name = `${base}_${n++}`;
        used.add(name.toLowerCase());
        dirs.set(target, name);
    }
    return dirs;
};

const cleanFormat = value => String(value === null || typeof value === 'undefined' ? '' : value)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

const withSafeFormats = asset => {
    if (!asset || typeof asset !== 'object') return asset;
    const md5ext = typeof asset.md5ext === 'string' ? asset.md5ext : '';
    const fromMd5ext = md5ext.includes('.') ? cleanFormat(md5ext.slice(md5ext.lastIndexOf('.') + 1)) : '';
    const dataFormat = cleanFormat(asset.dataFormat) || fromMd5ext || 'dat';
    return dataFormat === asset.dataFormat ? asset : {...asset, dataFormat};
};

const MAP_PREFIX = '_fractch_map_';

const STDLIB_MODULES = new Set(['fractch/json', 'fractch/strings']);

const safeRegion = region => {
    if (typeof region !== 'string' || hasControlCharacter(region)) return 'main';
    const parts = region.replace(/\\/g, '/').replace(/\.fractch$/i, '')
        .split('/')
        .filter(Boolean);
    if (!parts.length || /^[A-Za-z]:$/.test(parts[0])) return 'main';
    if (parts.some(part => part === '.' || part === '..' || part.startsWith('.'))) return 'main';
    return parts.join('/');
};

const withSafeRegions = projectJson => {
    const targets = Array.isArray(projectJson.targets) ? projectJson.targets : [];
    let changed = false;
    const safeTargets = targets.map(target => {
        const comments = target && target.comments && typeof target.comments === 'object' ? target.comments : null;
        if (!comments) return target;
        let safeComments = null;
        for (const [id, comment] of Object.entries(comments)) {
            if (!comment || typeof comment !== 'object' || comment.blockId) continue;
            const text = String(comment.text || '') + (typeof comment.extraText === 'string' ? comment.extraText : '');
            if (!text.startsWith(MAP_PREFIX)) continue;
            let map;
            try {
                map = JSON.parse(text.slice(MAP_PREFIX.length));
            } catch (e) {
                continue;
            }
            if (!map || typeof map !== 'object') continue;
            if (!map.scripts || typeof map.scripts !== 'object') map.scripts = {};
            const scripts = {};
            let unsafe = false;
            for (const [topId, region] of Object.entries(map.scripts)) {
                scripts[topId] = safeRegion(region);
                if (scripts[topId] !== region) unsafe = true;
            }
            let modules = map.modules;
            if (modules && typeof modules === 'object') {
                modules = {};
                for (const [topId, moduleId] of Object.entries(map.modules)) {
                    if (STDLIB_MODULES.has(moduleId)) modules[topId] = moduleId;
                    else unsafe = true;
                }
            }
            if (!unsafe) continue;
            const safeMap = {...map, scripts};
            if (modules) safeMap.modules = modules;
            const safeText = MAP_PREFIX + JSON.stringify(safeMap);
            const safeComment = {...comment, text: safeText};
            delete safeComment.extraText;
            safeComments = {...(safeComments || comments), [id]: safeComment};
        }
        if (!safeComments) return target;
        changed = true;
        return {...target, comments: safeComments};
    });
    return changed ? {...projectJson, targets: safeTargets} : projectJson;
};

const withSafePaths = projectJson => {
    const safe = withSafeRegions(projectJson);
    const targets = Array.isArray(safe.targets) ? safe.targets : [];
    return {
        ...safe,
        targets: targets.map(target => (target && typeof target === 'object' ? {
            ...target,
            costumes: Array.isArray(target.costumes) ? target.costumes.map(withSafeFormats) : target.costumes,
            sounds: Array.isArray(target.sounds) ? target.sounds.map(withSafeFormats) : target.sounds
        } : target))
    };
};

const yieldToBrowser = () => new Promise(resolve => setTimeout(resolve, 0));

const YIELD_INTERVAL_MS = 30;

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

const removeRecursive = async (pfs, filePath) => {
    if (!pfs || !filePath || typeof filePath !== 'string') {
        return;
    }

    let stat;
    try {
        stat = await (pfs.lstat || pfs.stat).call(pfs, filePath);
    } catch (e) {
        return;
    }

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

const KEPT_ROOT_ENTRIES = new Set(['.git', '.gitignore', 'README.md']);

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
        // Keep git metadata and user-authored root docs; only the fractch tree is
        // regenerated from the project on each write.
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
            let stat;
            try {
                stat = await (pfs.lstat || pfs.stat).call(pfs, path);
            } catch (e) {
                continue;
            }
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

const toBytes = data => {
    if (data instanceof Uint8Array) return data;
    if (typeof data === 'string') return new TextEncoder().encode(data);
    if (ArrayBuffer.isView(data)) return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
    return new Uint8Array(data);
};

const sameBytes = (a, b) => {
    if (a.byteLength !== b.byteLength) return false;
    for (let i = 0; i < a.byteLength; i++) {
        if (a[i] !== b[i]) return false;
    }
    return true;
};

const normalizeTreePath = path => path.replace(/\/+/g, '/');

const insideTree = (path, dir, {allowAncestors = false} = {}) => {
    if (typeof path !== 'string' || hasControlCharacter(path)) return false;
    const normalized = normalizeTreePath(path).replace(/\/$/, '');
    const root = normalizeTreePath(`${dir}/`);
    if (allowAncestors && (normalized === '' || root.startsWith(`${normalized}/`))) return true;
    if (!normalized.startsWith(root)) return false;
    const parts = normalized.slice(root.length).split('/')
        .filter(Boolean);
    return parts.length > 0 && !parts.some(part => part === '.' || part === '..' || part.startsWith('.'));
};

const GUARDED_METHODS = new Set(['writeFile', 'mkdir', 'unlink', 'rmdir', 'rename', 'symlink', 'appendFile']);

const guardTreeFs = (pfs, dir) => new Proxy(pfs, {
    get: (target, property) => {
        const value = target[property];
        if (typeof value !== 'function') return value;
        if (!GUARDED_METHODS.has(property)) return value.bind(target);
        return (...args) => {
            const paths = property === 'rename' || property === 'symlink' ? args.slice(0, 2) : args.slice(0, 1);
            const options = {allowAncestors: property === 'mkdir'};
            if (paths.every(path => insideTree(path, dir, options))) return value.apply(target, args);
            console.warn('[fractch-tree] refusing to touch a path outside the project folder:', paths);
            return Promise.resolve();
        };
    }
});

const removeLinks = async (pfs, links) => {
    for (const link of links) {
        try {
            await pfs.unlink(link);
        } catch (e) {
            console.warn('[fractch-tree] could not remove link:', link, e);
        }
    }
};

const createTreeSync = async ({pfs, dir}) => {
    const previous = await listGeneratedTree(pfs, dir);
    await removeLinks(pfs, previous.links);
    const stale = new Set(previous.files);
    const writeFile = async (path, data, options) => {
        const normalized = normalizeTreePath(path);
        if (stale.has(normalized)) {
            stale.delete(normalized);
            let existing = null;
            try {
                existing = await pfs.readFile(normalized);
            } catch (e) {
                existing = null;
            }
            if (existing && sameBytes(toBytes(existing), toBytes(data))) return;
        }
        await pfs.writeFile(normalized, data, options);
    };
    const syncedFs = new Proxy(pfs, {
        get: (target, property) => {
            if (property === 'writeFile') return writeFile;
            const value = target[property];
            return typeof value === 'function' ? value.bind(target) : value;
        }
    });
    const finish = async () => {
        for (const path of stale) {
            await pfs.unlink(path);
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
    return {fs: syncedFs, finish};
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

const MD5EXT = /^[0-9a-f]{32}\.[a-z0-9]{1,8}$/;

const worktreeAssetPaths = async sb3Files => {
    const projectBytes = await sb3FileReader(sb3Files)('project.json');
    if (!projectBytes) return new Map();
    const projectJson = withSafePaths(JSON.parse(new TextDecoder().decode(projectBytes)));
    const paths = new Map();
    const ambiguous = new Set();
    const targets = Array.isArray(projectJson.targets) ? projectJson.targets : [];
    const dirs = targetDirs(targets);
    for (const target of targets) {
        for (const [md5ext, rel] of targetAssetFiles(target)) {
            const path = `${dirs.get(target)}/${rel}`;
            if (!MD5EXT.test(md5ext) || (paths.has(path) && paths.get(path) !== md5ext)) ambiguous.add(path);
            paths.set(path, md5ext);
        }
    }
    for (const path of ambiguous) paths.delete(path);
    return paths;
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

const writeProjectToFractchTree = async ({
    vm, sb3ArrayBuffer, sb3Files, fs, dir, onProgress, clear = true
} = {}) => {
    if (!fs || !dir) {
        throw new Error('Invalid filesystem or directory');
    }

    if (typeof onProgress === 'function') {
        onProgress({phase: 'write', message: 'Reading project…', completed: 0, total: 1});
    }

    const loaded = await loadSb3({vm, sb3ArrayBuffer, sb3Files});
    const readSb3File = loaded.readSb3File;
    const projectJson = withSafePaths(loaded.projectJson);

    const writeTree = async treeFs => {
        if (typeof onProgress === 'function') {
            onProgress({phase: 'write', message: 'Writing fractch source…', completed: 0, total: 1});
            await yieldToBrowser();
        }

        await convertProject(projectJson, {outDir: dir, fs: treeFs});
        await writeExtensions(projectJson, dir, {fs: treeFs});

        const vfs = toPromiseFs(treeFs);

        await writeCustomAssets({readSb3File, projectJson, vfs, dir});

        const maybeYield = createYielder();
        const targets = Array.isArray(projectJson.targets) ? projectJson.targets : [];
        const dirs = targetDirs(targets);
        let completed = 0;
        for (const target of targets) {
            const fileMap = targetAssetFiles(target);
            if (fileMap.size) {
                const tDir = `${dir}/${dirs.get(target)}`;
                await vfs.mkdirp(`${tDir}/assets`);
                for (const [md5ext, rel] of fileMap) {
                    const data = await readSb3File(md5ext);
                    if (!data) {
                        console.warn('[fractch-tree] missing asset in sb3:', md5ext);
                        continue;
                    }
                    await vfs.writeFile(`${tDir}/${rel}`, data);
                }
            }
            completed += 1;
            if (typeof onProgress === 'function') {
                onProgress({
                    phase: 'write',
                    message: `Writing assets for ${target.name}…`,
                    completed,
                    total: Math.max(1, targets.length)
                });
            }
            await maybeYield();
        }
    };

    if (!clear) {
        await removeLinks(fs, (await listGeneratedTree(fs, dir)).links);
        await writeTree(guardTreeFs(fs, dir));
        return;
    }

    const sync = await createTreeSync({pfs: fs, dir});
    try {
        await writeTree(guardTreeFs(sync.fs, dir));
        await sync.finish();
    } catch (error) {
        console.warn('[fractch-tree] rewriting the whole tree after an incremental write failed:', error);
        await clearWorkingTree({pfs: fs, dir});
        await writeTree(guardTreeFs(fs, dir));
    }
};

const buildSb3FromFractchTree = async ({fs, dir, onProgress} = {}) => {
    if (!fs || !dir) {
        throw new Error('Invalid filesystem or directory');
    }

    if (typeof onProgress === 'function') {
        onProgress({phase: 'pack', message: 'Rebuilding project from fractch…', completed: 0, total: 1});
    }

    // The editor is the source of truth: unused costumes/sounds must stay
    // visible in the Costumes/Sounds tabs, exactly like Scratch. Fractch's
    // asset pruner is for CLI packaging, not for loading into the editor.
    const {manifest, assetFiles} = await buildProjectFromBuildDir({buildDir: dir, fs, prune: false});

    const zip = new JSZip();
    const vfs = toPromiseFs(fs);

    const customAssets = await readCustomAssets({vfs, pfs: fs, dir});
    if (customAssets.length) {
        manifest.customAssets = customAssets.map(({name, data}) => {
            const dataFormat = extensionOf(name);
            const asset = storage.createAsset(
                storage.AssetType.CustomAsset,
                dataFormat,
                data,
                null,
                true
            );
            const md5ext = `${asset.assetId}.${dataFormat}`;
            zip.file(md5ext, data);
            return {name, md5ext};
        });
    } else {
        delete manifest.customAssets;
    }

    zip.file('project.json', JSON.stringify(manifest));

    const written = new Set();
    for (const [md5ext, srcRel] of assetFiles) {
        if (written.has(md5ext)) continue;
        written.add(md5ext);
        try {
            const data = await vfs.readFile(`${dir}/${srcRel}`);
            zip.file(md5ext, data instanceof Uint8Array ? data : new Uint8Array(data));
        } catch (e) {
            console.warn('[fractch-tree] missing asset file when packing:', srcRel, e);
        }
    }

    if (typeof onProgress === 'function') {
        onProgress({phase: 'pack', message: 'Compressing project…', completed: 1, total: 1});
    }

    return zip.generateAsync({type: 'uint8array'});
};

export {
    clearWorkingTree,
    worktreeAssetPaths,
    writeProjectToFractchTree,
    buildSb3FromFractchTree,
    yieldToBrowser,
    sanitize
};
