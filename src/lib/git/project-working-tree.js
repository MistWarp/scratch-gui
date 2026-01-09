const sanitizePathPart = name => {
    const safe = String(name || '')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/[\\/:*?"<>|]/g, '-')
        .replace(/\.+$/g, '')
        .trim();
    return safe || 'unnamed';
};

const ensureDir = async (fs, dirPath) => {
    try {
        await fs.mkdir(dirPath);
    } catch (e) {
        // ignore
    }
};

const writeTextFile = async (fs, filePath, text) => {
    await fs.writeFile(filePath, text);
};

const writeBinaryFile = async (fs, filePath, data) => {
    if (typeof data === 'string') {
        await fs.writeFile(filePath, data);
        return;
    }
    const view = data instanceof Uint8Array ? data : new Uint8Array(data);
    await fs.writeFile(filePath, view);
};

const removeRecursive = async (fs, filePath) => {
    let stat;
    try {
        stat = await fs.stat(filePath);
    } catch (e) {
        return;
    }

    if (stat.isDirectory()) {
        const entries = await fs.readdir(filePath);
        // eslint-disable-next-line no-await-in-loop
        for (const entry of entries) await removeRecursive(fs, `${filePath}/${entry}`);
        try {
            await fs.rmdir(filePath);
        } catch (e) {
            // ignore
        }
        return;
    }

    try {
        await fs.unlink(filePath);
    } catch (e) {
        // ignore
    }
};

const clearWorkingTree = async ({pfs, dir}) => {
    const entries = await pfs.readdir(dir);
    for (const entry of entries) {
        if (entry === '.git') continue;
        if (entry === '.gitignore') continue;
        // eslint-disable-next-line no-await-in-loop
        await removeRecursive(pfs, `${dir}/${entry}`);
    }
};

const getTopLevelScripts = blocks => {
    if (!blocks || !Array.isArray(blocks._scripts)) return [];
    return blocks._scripts.filter(Boolean);
};

const wrapXml = inner => (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<xml xmlns="http://www.w3.org/1999/xhtml">${inner}</xml>\n`
);

const getCostumeAssetType = (storage, costume) => {
    if (!costume) return null;
    const format = costume.dataFormat || (costume.md5ext ? costume.md5ext.split('.').pop() : null);
    if (format === 'svg') return storage.AssetType.ImageVector;
    return storage.AssetType.ImageBitmap;
};

const getSoundAssetType = storage => storage.AssetType.Sound;

const loadAssetData = async (storage, assetType, md5ext) => {
    if (!md5ext) return null;
    const md5 = md5ext.split('.')[0];
    const asset = await storage.load(assetType, md5);
    return asset ? asset.data : null;
};

const writeTarget = async ({vm, target, storage, fs, dir}) => {
    const spriteName = sanitizePathPart(target.getName ? target.getName() : target.sprite && target.sprite.name);
    const spriteRoot = `${dir}/${spriteName}`;

    const scriptsDir = `${spriteRoot}/scripts`;
    const costumesDir = `${spriteRoot}/costumes`;
    const soundsDir = `${spriteRoot}/sounds`;

    await ensureDir(fs, spriteRoot);
    await ensureDir(fs, scriptsDir);
    await ensureDir(fs, costumesDir);
    await ensureDir(fs, soundsDir);

    // Scripts
    const scripts = getTopLevelScripts(target.blocks);
    for (const scriptId of scripts) {
        let xmlInner = '';
        if (typeof target.blocks.blockToXML === 'function') {
            xmlInner = target.blocks.blockToXML(scriptId, target.comments);
        } else if (typeof target.blocks.toXML === 'function') {
            // fallback: whole target as single file
            xmlInner = target.blocks.toXML(target.comments);
        }
        // eslint-disable-next-line no-await-in-loop
        await writeTextFile(fs, `${scriptsDir}/${scriptId}.xml`, wrapXml(xmlInner));
    }

    // Assets + index.json
    const spriteJsonString = vm.toJSON(target.id);
    const spriteJson = JSON.parse(spriteJsonString);

    const costumes = Array.isArray(spriteJson.costumes) ? spriteJson.costumes : [];
    const sounds = Array.isArray(spriteJson.sounds) ? spriteJson.sounds : [];

    const costumeFiles = [];
    for (const costume of costumes) {
        const name = sanitizePathPart(costume.name);
        const ext = costume.dataFormat || (costume.md5ext ? costume.md5ext.split('.').pop() : '');
        const filename = ext ? `${name}.${ext}` : name;
        const md5ext = costume.md5ext;
        const assetType = getCostumeAssetType(storage, costume);

        // eslint-disable-next-line no-await-in-loop
        const data = await loadAssetData(storage, assetType, md5ext);
        if (data) {
            // eslint-disable-next-line no-await-in-loop
            await writeBinaryFile(fs, `${costumesDir}/${filename}`, data);
        }

        costumeFiles.push({
            name: costume.name,
            file: `costumes/${filename}`,
            md5ext: costume.md5ext,
            dataFormat: costume.dataFormat,
            rotationCenterX: costume.rotationCenterX,
            rotationCenterY: costume.rotationCenterY
        });
    }

    const soundFiles = [];
    for (const sound of sounds) {
        const name = sanitizePathPart(sound.name);
        const ext = sound.dataFormat || sound.format || (sound.md5ext ? sound.md5ext.split('.').pop() : '');
        const filename = ext ? `${name}.${ext}` : name;
        const md5ext = sound.md5ext;

        // eslint-disable-next-line no-await-in-loop
        const data = await loadAssetData(storage, getSoundAssetType(storage), md5ext);
        if (data) {
            // eslint-disable-next-line no-await-in-loop
            await writeBinaryFile(fs, `${soundsDir}/${filename}`, data);
        }

        soundFiles.push({
            name: sound.name,
            file: `sounds/${filename}`,
            md5ext: sound.md5ext,
            dataFormat: sound.dataFormat,
            rate: sound.rate,
            sampleCount: sound.sampleCount
        });
    }

    const indexJson = {
        name: spriteJson.name,
        isStage: spriteJson.isStage,
        variables: spriteJson.variables,
        lists: spriteJson.lists,
        broadcasts: spriteJson.broadcasts,
        currentCostume: spriteJson.currentCostume,
        x: spriteJson.x,
        y: spriteJson.y,
        size: spriteJson.size,
        direction: spriteJson.direction,
        visible: spriteJson.visible,
        draggable: spriteJson.draggable,
        rotationStyle: spriteJson.rotationStyle,
        tempo: spriteJson.tempo,
        volume: spriteJson.volume,
        videoState: spriteJson.videoState,
        videoTransparency: spriteJson.videoTransparency,
        textToSpeechLanguage: spriteJson.textToSpeechLanguage,
        costumes: costumeFiles,
        sounds: soundFiles
    };

    await writeTextFile(fs, `${spriteRoot}/index.json`, JSON.stringify(indexJson, null, 2));
};

const writeProjectToWorkingTree = async ({vm, fs, dir}) => {
    const runtime = vm && vm.runtime;
    const storage = runtime && runtime.storage;
    if (!runtime || !storage) throw new Error('VM runtime/storage not available');

    const targets = runtime.targets.filter(t => t.isOriginal);

    for (const target of targets) {
        // eslint-disable-next-line no-await-in-loop
        await writeTarget({vm, target, storage, fs, dir});
    }
};

export {
    clearWorkingTree,
    writeProjectToWorkingTree
};
