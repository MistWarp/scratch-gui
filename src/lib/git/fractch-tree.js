import JSZip from '@turbowarp/jszip';
import {convertProject, buildProjectFromBuildDir, toPromiseFs} from 'fractch';
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

const writeCustomAssets = async ({zip, projectJson, vfs, dir}) => {
    const customAssets = Array.isArray(projectJson.customAssets) ? projectJson.customAssets : [];
    for (const {name, md5ext} of customAssets) {
        const entry = zip.file(md5ext);
        if (!entry) {
            console.warn('[fractch-tree] missing custom asset in sb3:', md5ext);
            continue;
        }
        const path = `${dir}/${CUSTOM_ASSETS_DIR}/${name}`;
        await vfs.mkdirp(path.substring(0, path.lastIndexOf('/')));
        await vfs.writeFile(path, await entry.async('uint8array'));
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

// Mirrors fractch's internal emit.targetAssetFiles: the map of md5ext -> the
// "assets/<name>.<ext>" path each costume/sound declaration references. Kept
// local so we depend only on fractch's published (browser) exports.
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
        while (used.has(file)) file = `${base}_${n++}.${ext}`;
        used.add(file);
        map.set(md5ext, `assets/${file}`);
    }
    return map;
};

const yieldToBrowser = () => new Promise(resolve => {
    if (typeof requestAnimationFrame === 'function') {
        requestAnimationFrame(() => resolve());
    } else {
        setTimeout(resolve, 0);
    }
});

const sanitize = name => String(name === null || typeof name === 'undefined' ? '' : name)
    .replace(/[^a-zA-Z0-9-_]/g, '_') || 'target';

const removeRecursive = async (pfs, filePath) => {
    if (!pfs || !filePath || typeof filePath !== 'string') {
        return;
    }

    let stat;
    try {
        stat = await pfs.stat(filePath);
    } catch (e) {
        return;
    }

    if (stat.isDirectory()) {
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
        // Keep git metadata and user-authored root docs; only the fractch tree is
        // regenerated from the project on each write.
        if (entry === '.git' || entry === '.gitignore' || entry === 'README.md') return;
        await removeRecursive(pfs, `${dir}/${entry}`);
    }));
};

const loadSb3Zip = async ({vm, sb3ArrayBuffer}) => {
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
    return {zip, projectJson};
};

const writeProjectToFractchTree = async ({vm, sb3ArrayBuffer, fs, dir, onProgress, clear = true} = {}) => {
    if (!fs || !dir) {
        throw new Error('Invalid filesystem or directory');
    }

    if (typeof onProgress === 'function') {
        onProgress({phase: 'write', message: 'Reading project…', completed: 0, total: 1});
    }

    const {zip, projectJson} = await loadSb3Zip({vm, sb3ArrayBuffer});

    if (clear) {
        await clearWorkingTree({pfs: fs, dir});
    }

    if (typeof onProgress === 'function') {
        onProgress({phase: 'write', message: 'Writing fractch source…', completed: 0, total: 1});
        await yieldToBrowser();
    }

    await convertProject(projectJson, {outDir: dir, fs});

    const vfs = toPromiseFs(fs);

    await writeCustomAssets({zip, projectJson, vfs, dir});

    const targets = Array.isArray(projectJson.targets) ? projectJson.targets : [];
    let completed = 0;
    for (const target of targets) {
        const fileMap = targetAssetFiles(target);
        if (fileMap.size) {
            const tDir = `${dir}/${sanitize(target.name)}`;
            await vfs.mkdirp(`${tDir}/assets`);
            for (const [md5ext, rel] of fileMap) {
                const entry = zip.file(md5ext);
                if (!entry) {
                    console.warn('[fractch-tree] missing asset in sb3:', md5ext);
                    continue;
                }
                const data = await entry.async('uint8array');
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
        await yieldToBrowser();
    }
};

const buildSb3FromFractchTree = async ({fs, dir, onProgress} = {}) => {
    if (!fs || !dir) {
        throw new Error('Invalid filesystem or directory');
    }

    if (typeof onProgress === 'function') {
        onProgress({phase: 'pack', message: 'Rebuilding project from fractch…', completed: 0, total: 1});
    }

    const {manifest, assetFiles} = await buildProjectFromBuildDir({buildDir: dir, fs});

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
    writeProjectToFractchTree,
    buildSb3FromFractchTree,
    yieldToBrowser,
    sanitize
};
