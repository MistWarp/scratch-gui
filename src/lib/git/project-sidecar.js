import storage from '../persistence/storage';

const SIDECAR_FILE = 'mistwarp.json';
const FONTS_DIR = 'fonts';

const isPlainObject = value => Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const hasOwn = (object, key) => Object.prototype.hasOwnProperty.call(object, key);

const toBytes = data => {
    if (data instanceof Uint8Array) return data;
    if (typeof data === 'string') return new TextEncoder().encode(data);
    if (ArrayBuffer.isView(data)) return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
    return new Uint8Array(data);
};

const extensionOf = path => {
    const base = path.substring(path.lastIndexOf('/') + 1);
    const dot = base.lastIndexOf('.');
    return dot > 0 ? base.substring(dot + 1).toLowerCase() : 'bin';
};

const safeFileName = name => String(name).replace(/[^a-zA-Z0-9-_]/g, '_') || 'font';

const safeRelativePath = path => typeof path === 'string' &&
    !path.startsWith('/') &&
    !path.includes('\\') &&
    !path.split('/').some(part => !part || part === '.' || part === '..');

const topLevelScripts = blocks => {
    const scripts = [];
    for (const [id, block] of Object.entries(blocks || {})) {
        if (Array.isArray(block)) {
            if (block.length < 5) continue;
            const opcode = block[0] === 12 ? 'data_variable' : 'data_listcontents';
            scripts.push({id, opcode, x: block[3], y: block[4]});
        } else if (block && block.topLevel && !block.shadow) {
            scripts.push({id, opcode: block.opcode, x: block.x, y: block.y});
        }
    }
    return scripts;
};

const scriptKey = script => {
    const x = Math.round(Number(script.x) || 0);
    const y = Math.round(Number(script.y) || 0);
    return `${script.opcode}@${x},${y}`;
};

const writeFonts = async ({readSb3File, projectJson, vfs, dir}) => {
    const fonts = Array.isArray(projectJson.customFonts) ? projectJson.customFonts : [];
    const used = new Set();
    const entries = [];
    for (const font of fonts) {
        if (!font || typeof font.family !== 'string') continue;
        const entry = {family: font.family, fallback: typeof font.fallback === 'string' ? font.fallback : ''};
        if (font.system) {
            entries.push({...entry, system: true});
            continue;
        }
        const data = typeof font.md5ext === 'string' ? await readSb3File(font.md5ext) : null;
        if (!data) {
            console.warn('[project-sidecar] missing font in sb3:', font.md5ext);
            continue;
        }
        const ext = extensionOf(font.md5ext);
        const base = safeFileName(font.family);
        let file = `${base}.${ext}`;
        let n = 2;
        while (used.has(file)) file = `${base}_${n++}.${ext}`;
        used.add(file);
        await vfs.mkdirp(`${dir}/${FONTS_DIR}`);
        await vfs.writeFile(`${dir}/${FONTS_DIR}/${file}`, data);
        entries.push({...entry, file: `${FONTS_DIR}/${file}`});
    }
    return entries;
};

const readFonts = async ({entries, vfs, dir, zip}) => {
    const fonts = [];
    for (const entry of Array.isArray(entries) ? entries : []) {
        if (!entry || typeof entry.family !== 'string') continue;
        const fallback = typeof entry.fallback === 'string' ? entry.fallback : '';
        if (entry.system) {
            fonts.push({system: true, family: entry.family, fallback});
            continue;
        }
        if (!safeRelativePath(entry.file)) continue;
        let data;
        try {
            data = await vfs.readFile(`${dir}/${entry.file}`);
        } catch (e) {
            console.warn('[project-sidecar] missing font file when packing:', entry.file, e);
            continue;
        }
        const bytes = toBytes(data);
        const dataFormat = extensionOf(entry.file);
        const asset = storage.createAsset(storage.AssetType.Font, dataFormat, bytes, null, true);
        const md5ext = `${asset.assetId}.${dataFormat}`;
        zip.file(md5ext, bytes);
        fonts.push({system: false, family: entry.family, fallback, md5ext});
    }
    return fonts;
};

const framesOf = target => {
    if (!isPlainObject(target.frames)) return null;
    const ids = Object.keys(target.frames);
    if (!ids.length) return null;
    const scripts = new Map(topLevelScripts(target.blocks).map(script => [script.id, script]));
    const frames = {};
    for (const id of ids) {
        const frame = target.frames[id];
        if (!isPlainObject(frame)) continue;
        const entry = {
            title: typeof frame.title === 'string' ? frame.title : '',
            x: frame.x,
            y: frame.y,
            width: frame.width,
            height: frame.height,
            collapsed: Boolean(frame.collapsed)
        };
        if (entry.collapsed && Array.isArray(frame.blocks)) {
            entry.scripts = frame.blocks
                .map(blockId => scripts.get(blockId))
                .filter(Boolean)
                .map(script => ({opcode: script.opcode, x: script.x, y: script.y}));
        }
        frames[id] = entry;
    }
    return Object.keys(frames).length ? frames : null;
};

const restoreFrames = (target, frames) => {
    if (!isPlainObject(frames)) return;
    const unclaimed = new Map();
    for (const script of topLevelScripts(target.blocks)) {
        const key = scriptKey(script);
        if (!unclaimed.has(key)) unclaimed.set(key, []);
        unclaimed.get(key).push(script.id);
    }
    const restored = {};
    for (const [id, frame] of Object.entries(frames)) {
        if (!isPlainObject(frame)) continue;
        const entry = {
            title: typeof frame.title === 'string' ? frame.title : '',
            x: Number(frame.x) || 0,
            y: Number(frame.y) || 0,
            width: Number(frame.width) || 0,
            height: Number(frame.height) || 0,
            collapsed: Boolean(frame.collapsed)
        };
        if (entry.collapsed && Array.isArray(frame.scripts)) {
            const blocks = [];
            for (const script of frame.scripts) {
                const matches = unclaimed.get(scriptKey(script || {}));
                if (matches && matches.length) blocks.push(matches.shift());
            }
            if (blocks.length) entry.blocks = blocks;
        }
        restored[id] = entry;
    }
    if (Object.keys(restored).length) target.frames = restored;
};

const writeProjectSidecar = async ({readSb3File, projectJson, vfs, dir}) => {
    const targets = Array.isArray(projectJson.targets) ? projectJson.targets : [];
    const sidecar = {};

    const sprites = targets.filter(target => !target.isStage).map(target => target.name);
    if (sprites.length > 1) sidecar.spriteOrder = sprites;

    const frames = {};
    for (const target of targets) {
        const targetFrames = framesOf(target);
        if (targetFrames) frames[target.name] = targetFrames;
    }
    if (Object.keys(frames).length) sidecar.frames = frames;

    const fonts = await writeFonts({readSb3File, projectJson, vfs, dir});
    if (fonts.length) sidecar.fonts = fonts;

    const storageByTarget = {};
    for (const target of targets) {
        if (isPlainObject(target.extensionStorage)) storageByTarget[target.name] = target.extensionStorage;
    }
    const extensionStorage = {};
    if (isPlainObject(projectJson.extensionStorage)) extensionStorage.project = projectJson.extensionStorage;
    if (Object.keys(storageByTarget).length) extensionStorage.targets = storageByTarget;
    if (Object.keys(extensionStorage).length) sidecar.extensionStorage = extensionStorage;

    if (projectJson.meta && typeof projectJson.meta.origin === 'string') sidecar.origin = projectJson.meta.origin;

    if (!Object.keys(sidecar).length) return;
    await vfs.writeFile(`${dir}/${SIDECAR_FILE}`, new TextEncoder().encode(`${JSON.stringify(sidecar, null, 2)}\n`));
};

const readSidecarFile = async (vfs, dir) => {
    let data;
    try {
        data = await vfs.readFile(`${dir}/${SIDECAR_FILE}`);
    } catch (e) {
        return null;
    }
    try {
        const json = JSON.parse(typeof data === 'string' ? data : new TextDecoder().decode(data));
        return isPlainObject(json) ? json : null;
    } catch (e) {
        console.warn(`[project-sidecar] ignoring unreadable ${SIDECAR_FILE}`, e);
        return null;
    }
};

const sortSprites = (manifest, order) => {
    if (!Array.isArray(order) || !Array.isArray(manifest.targets)) return;
    const rank = new Map(order.map((name, index) => [name, index]));
    const sprites = manifest.targets.filter(target => !target.isStage);
    const ranked = sprites
        .map((target, index) => ({target, index, rank: rank.has(target.name) ? rank.get(target.name) : Infinity}))
        .sort((a, b) => (a.rank - b.rank) || (a.index - b.index))
        .map(item => item.target);
    let next = 0;
    manifest.targets = manifest.targets.map(target => (target.isStage ? target : ranked[next++]));
};

const applySidecar = (manifest, sidecar, fonts) => {
    const targets = Array.isArray(manifest.targets) ? manifest.targets : [];

    if (fonts.length) manifest.customFonts = fonts;
    else delete manifest.customFonts;

    if (isPlainObject(sidecar.frames)) {
        for (const target of targets) {
            if (hasOwn(sidecar.frames, target.name)) restoreFrames(target, sidecar.frames[target.name]);
        }
    }

    const extensionStorage = isPlainObject(sidecar.extensionStorage) ? sidecar.extensionStorage : {};
    if (isPlainObject(extensionStorage.project)) manifest.extensionStorage = extensionStorage.project;
    if (isPlainObject(extensionStorage.targets)) {
        for (const target of targets) {
            const stored = hasOwn(extensionStorage.targets, target.name) ? extensionStorage.targets[target.name] : null;
            if (isPlainObject(stored)) target.extensionStorage = stored;
        }
    }

    if (typeof sidecar.origin === 'string') {
        if (!isPlainObject(manifest.meta)) manifest.meta = {};
        manifest.meta.origin = sidecar.origin;
    }

    sortSprites(manifest, sidecar.spriteOrder);
};

const readProjectSidecar = async ({vfs, dir, zip, manifest}) => {
    const sidecar = await readSidecarFile(vfs, dir) || {};
    const fonts = await readFonts({entries: sidecar.fonts, vfs, dir, zip});
    applySidecar(manifest, sidecar, fonts);
};

export {
    SIDECAR_FILE,
    readProjectSidecar,
    writeProjectSidecar
};
