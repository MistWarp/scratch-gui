import {indexOfItem, itemIdFor} from '../asset-identity.js';
import {getEntries} from '../extension-dev/session.js';
import {assetTab, customAssetTab, extensionTab, scriptTab} from './tabs.js';
import {baseName, folderOf} from './custom-assets.js';

const SCRIPT_FILE = 'scripts.fractch';
const ASSETS_ROOT = 'Assets';

const customAssetDetail = name => (folderOf(name) ? `${ASSETS_ROOT}/${folderOf(name)}` : ASSETS_ROOT);

const customAssets = vm => (vm.runtime.assetManager ? vm.runtime.assetManager.assets : []);

const orderedSprites = (vm, spritesState) => {
    const sprites = vm.runtime.targets.filter(target => target.isOriginal && !target.isStage);
    if (!spritesState) return sprites;
    const order = id => {
        const info = spritesState[id];
        return info && typeof info.order === 'number' ? info.order : Number.MAX_SAFE_INTEGER;
    };
    return sprites.slice().sort((a, b) => order(a.id) - order(b.id));
};

const extensionFileName = entry => `${entry.id}.js`;

const itemsOf = (target, kind) => {
    if (!target) return [];
    return kind === 'costume' ? target.getCostumes() : target.getSounds();
};

const resolveTab = (vm, tab, entries) => {
    if (tab.kind === 'extension') {
        const list = entries || getEntries(vm);
        const entry = list.find(item => item.id === tab.extensionId);
        return entry ? {exists: true, title: extensionFileName(entry), detail: entry.name, entry} : {exists: false};
    }
    if (tab.kind === 'newExtension' || tab.kind === 'reference') return {exists: true};
    if (tab.kind === 'removeExtensions') {
        const list = entries || getEntries(vm);
        const ids = tab.ids.filter(id => list.some(item => item.id === id));
        return ids.length ? {exists: true, ids, detail: ids.map(id => `${id}.js`).join(', ')} : {exists: false};
    }
    if (tab.kind === 'customAsset') {
        const entry = vm.runtime.assetManager ? vm.runtime.assetManager.getAsset(tab.name) : null;
        return entry ? {exists: true, entry, title: baseName(entry.name), detail: customAssetDetail(entry.name)} :
            {exists: false};
    }
    const target = vm.runtime.getTargetById(tab.targetId);
    if (!target || !target.isOriginal) return {exists: false};
    if (tab.kind === 'script') {
        return {exists: true, target, title: SCRIPT_FILE, detail: target.isStage ? null : target.getName()};
    }
    const items = itemsOf(target, tab.kind);
    const index = indexOfItem(items, tab.itemId);
    if (index === -1) return {exists: false};
    return {exists: true, target, index, item: items[index], title: items[index].name, detail: target.getName()};
};

const listFiles = (vm, spritesState, entries) => {
    const files = [];
    const stage = vm.runtime.getTargetForStage();
    const targets = (stage ? [stage] : []).concat(orderedSprites(vm, spritesState));
    for (const target of targets) {
        const owner = target.getName();
        files.push({tab: scriptTab(target.id), title: SCRIPT_FILE, detail: owner, kind: 'script'});
        for (const costume of target.getCostumes()) {
            files.push({
                tab: assetTab('costume', target.id, itemIdFor(costume)),
                title: costume.name,
                detail: owner,
                kind: 'costume'
            });
        }
        for (const sound of target.getSounds()) {
            files.push({
                tab: assetTab('sound', target.id, itemIdFor(sound)),
                title: sound.name,
                detail: owner,
                kind: 'sound'
            });
        }
    }
    for (const entry of customAssets(vm)) {
        files.push({
            tab: customAssetTab(entry.name),
            title: baseName(entry.name),
            detail: customAssetDetail(entry.name),
            kind: 'customAsset'
        });
    }
    for (const entry of entries || getEntries(vm)) {
        files.push({
            tab: extensionTab(entry.id),
            title: extensionFileName(entry),
            detail: entry.name,
            kind: 'extension'
        });
    }
    return files;
};

const matchFiles = (files, query) => {
    const text = String(query || '').trim()
        .toLowerCase();
    if (!text) return files;
    const scored = [];
    for (const file of files) {
        const haystack = `${file.detail || ''}/${file.title}`.toLowerCase();
        const title = file.title.toLowerCase();
        let score = -1;
        if (title.startsWith(text)) score = 0;
        else if (title.includes(text)) score = 1;
        else if (haystack.includes(text)) score = 2;
        else {
            let position = 0;
            for (const ch of text) {
                position = haystack.indexOf(ch, position);
                if (position === -1) break;
                position++;
            }
            if (position !== -1) score = 3;
        }
        if (score !== -1) scored.push({file, score});
    }
    return scored.sort((a, b) => a.score - b.score).map(item => item.file);
};

export {
    SCRIPT_FILE,
    extensionFileName,
    itemsOf,
    listFiles,
    matchFiles,
    orderedSprites,
    resolveTab
};
