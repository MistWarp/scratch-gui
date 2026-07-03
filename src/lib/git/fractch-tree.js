import JSZip from '@turbowarp/jszip';
import {convertProject, buildProjectFromBuildDir, toPromiseFs} from 'fractch';

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
    zip.file('project.json', JSON.stringify(manifest));

    const vfs = toPromiseFs(fs);
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
