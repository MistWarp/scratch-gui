const IMAGE_FORMATS = new Set(['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp']);
const AUDIO_FORMATS = new Set(['wav', 'mp3', 'ogg', 'oga', 'flac', 'm4a', 'aac']);
const TEXT_FORMATS = new Set([
    'txt', 'json', 'csv', 'tsv', 'html', 'htm', 'md', 'markdown', 'js', 'mjs', 'cjs', 'css', 'xml', 'svg',
    'fractch', 'yaml', 'yml', 'toml', 'ini', 'log'
]);
const LANGUAGES = {js: 'javascript', mjs: 'javascript', cjs: 'javascript', json: 'json', fractch: 'fractch'};
const SNIFF_BYTES = 4096;

const extensionOf = name => {
    const base = String(name).substring(String(name).lastIndexOf('/') + 1);
    const dot = base.lastIndexOf('.');
    if (dot <= 0 || dot === base.length - 1) return 'bin';
    return base.substring(dot + 1).toLowerCase();
};

const baseName = path => String(path).substring(String(path).lastIndexOf('/') + 1);

const folderOf = path => {
    const slash = String(path).lastIndexOf('/');
    return slash === -1 ? '' : String(path).substring(0, slash);
};

const joinPath = (folder, name) => (folder ? `${folder}/${name}` : name);

const looksLikeText = data => {
    if (!data || !data.length) return true;
    const head = data.subarray(0, SNIFF_BYTES);
    if (head.includes(0)) return false;
    if (typeof TextDecoder === 'undefined') return true;
    try {
        new TextDecoder('utf-8', {fatal: true}).decode(head, {stream: true});
        return true;
    } catch (error) {
        return false;
    }
};

const assetKind = entry => {
    const extension = extensionOf(entry.name);
    const format = entry.asset.dataFormat;
    if (TEXT_FORMATS.has(extension)) return 'text';
    if (IMAGE_FORMATS.has(extension) || (extension === 'bin' && IMAGE_FORMATS.has(format))) return 'image';
    if (AUDIO_FORMATS.has(extension) || (extension === 'bin' && AUDIO_FORMATS.has(format))) return 'audio';
    if (TEXT_FORMATS.has(format)) return 'text';
    return looksLikeText(entry.asset.data) ? 'text' : 'binary';
};

const languageFor = name => LANGUAGES[extensionOf(name)] || 'text';

const encodeText = text => new TextEncoder().encode(String(text));

const readText = entry => entry.asset.decodeText();

const indexOfName = (manager, name) => manager.assets.indexOf(manager.getAsset(name));

const writeText = (manager, name, text) => {
    const entry = manager.getAsset(name);
    if (!entry) return false;
    const storage = manager.runtime.storage;
    const asset = storage.createAsset(storage.AssetType.CustomAsset, entry.asset.dataFormat,
        encodeText(text), null, true);
    manager.addAsset(entry.name, asset);
    return true;
};

const createTextFile = (manager, path) => {
    const name = manager.getUnusedName(path);
    const extension = extensionOf(name);
    manager.createAsset(name, new Uint8Array(0), extension === 'bin' ? 'txt' : extension);
    return manager.getAsset(name) ? manager.getAsset(name).name : null;
};

const addAssetFiles = async (manager, files, folder, storage = manager.runtime.storage) => {
    const added = [];
    let failed = 0;
    for (const file of Array.from(files)) {
        try {
            const buffer = await file.arrayBuffer();
            const asset = storage.createAsset(storage.AssetType.CustomAsset, extensionOf(file.name),
                new Uint8Array(buffer), null, true);
            const name = manager.getUnusedName(joinPath(folder, file.name));
            manager.addAsset(name, asset);
            added.push(name);
        } catch (error) {
            failed++;
        }
    }
    return {added, failed};
};

const isInside = (name, folder) => Boolean(folder) && name.toLowerCase().startsWith(`${folder.toLowerCase()}/`);

const renameEntry = (manager, from, to) => {
    const index = indexOfName(manager, from);
    if (index === -1) return null;
    manager.renameAsset(index, to);
    return manager.assets[index].name;
};

const moveFolder = (manager, from, to) => {
    const renames = {};
    for (const entry of manager.assets.slice()) {
        const before = entry.name;
        if (!isInside(before, from)) continue;
        const next = renameEntry(manager, before, `${to}${before.substring(from.length)}`);
        if (next) renames[before] = next;
    }
    return renames;
};

const deleteFolder = (manager, folder) => {
    for (const entry of manager.assets.slice()) {
        if (isInside(entry.name, folder)) manager.deleteAssetByName(entry.name);
    }
};

const compareNames = (a, b) => a.toLowerCase().localeCompare(b.toLowerCase());

const buildAssetTree = (names, extraFolders = []) => {
    const root = {path: '', folders: new Map(), files: []};
    const folderNode = path => {
        let node = root;
        let current = '';
        for (const part of path.split('/')) {
            current = joinPath(current, part);
            const key = part.toLowerCase();
            if (!node.folders.has(key)) {
                node.folders.set(key, {path: current, name: part, folders: new Map(), files: []});
            }
            node = node.folders.get(key);
        }
        return node;
    };
    for (const folder of extraFolders) {
        if (folder) folderNode(folder);
    }
    for (const name of names) {
        const folder = folderOf(name);
        (folder ? folderNode(folder) : root).files.push(name);
    }
    const finish = node => ({
        path: node.path,
        name: node.name,
        folders: Array.from(node.folders.values()).sort((a, b) => compareNames(a.name, b.name))
            .map(finish),
        files: node.files.slice().sort((a, b) => compareNames(baseName(a), baseName(b)))
    });
    return finish(root);
};

const allFolders = (names, extraFolders = []) => {
    const out = new Set();
    for (const path of names.map(folderOf).concat(extraFolders)) {
        let current = '';
        for (const part of path ? path.split('/') : []) {
            current = joinPath(current, part);
            out.add(current);
        }
    }
    return Array.from(out).sort(compareNames);
};

const formatSize = bytes => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export {
    addAssetFiles,
    allFolders,
    assetKind,
    baseName,
    buildAssetTree,
    createTextFile,
    deleteFolder,
    extensionOf,
    folderOf,
    formatSize,
    isInside,
    joinPath,
    languageFor,
    looksLikeText,
    moveFolder,
    readText,
    renameEntry,
    writeText
};
