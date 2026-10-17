import downloadBlob from '../utils/download-blob.js';

const drafts = new Map();
const sources = new Map();
const authored = new Set();
const fileNames = new Map();
const listeners = new Set();
let restorePointMade = false;

const APPLY_AS_YOU_TYPE_KEY = 'mw:extension-dev:apply-as-you-type';

const notify = () => {
    for (const listener of listeners) {
        try {
            listener();
        } catch (e) {
            console.error(e);
        }
    }
};

const subscribe = listener => {
    listeners.add(listener);
    return () => listeners.delete(listener);
};

const getDraft = id => (drafts.has(id) ? drafts.get(id) : null);

const setDraft = (id, text) => {
    const isNew = !drafts.has(id);
    drafts.set(id, text);
    if (isNew) notify();
};

const clearDraft = id => {
    if (drafts.delete(id)) notify();
};

const hasUnappliedEdits = () => drafts.size > 0;

const unappliedIds = () => Array.from(drafts.keys());

const markAuthored = id => {
    authored.add(id);
    notify();
};

const isAuthored = id => authored.has(id);

const getCachedSource = key => (sources.has(key) ? sources.get(key) : null);

const setCachedSource = (key, text) => {
    sources.set(key, text);
};

const forgetCachedSource = key => {
    sources.delete(key);
};

const resetSession = () => {
    drafts.clear();
    sources.clear();
    authored.clear();
    fileNames.clear();
    restorePointMade = false;
    notify();
};

const needsFirstApplyRestorePoint = () => !restorePointMade;

const markFirstApplyRestorePoint = () => {
    restorePointMade = true;
};

const readStorage = (key, fallback) => {
    try {
        const value = localStorage.getItem(key);
        return value === null ? fallback : JSON.parse(value);
    } catch (e) {
        return fallback;
    }
};

const writeStorage = (key, value) => {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
        return;
    }
};

const getApplyAsYouType = () => readStorage(APPLY_AS_YOU_TYPE_KEY, true) !== false;
const setApplyAsYouType = value => writeStorage(APPLY_AS_YOU_TYPE_KEY, Boolean(value));
const rememberFileName = (id, name) => fileNames.set(id, name);
const fileNameOf = id => fileNames.get(id) || null;

const fallbackEntries = vm => {
    const manager = vm.extensionManager;
    const urls = typeof manager.getExtensionURLs === 'function' ? manager.getExtensionURLs() : {};
    return Array.from(manager._loadedExtensions.keys()).map(id => {
        const url = urls[id] || null;
        let kind = 'builtin';
        if (url) kind = url.startsWith('data:') ? 'embedded' : 'url';
        return {id, url, kind, status: 'loaded', mode: null, name: id, error: null};
    });
};

const getEntries = vm => {
    if (!vm || !vm.extensionManager) return [];
    const manager = vm.extensionManager;
    const entries = typeof manager.getExtensionEntries === 'function' ?
        manager.getExtensionEntries() :
        fallbackEntries(vm);
    const categories = (vm.runtime && vm.runtime._blockInfo) || [];
    return entries
        .filter(entry => !manager.isCoreExtension || !manager.isCoreExtension(entry.id))
        .map(entry => {
            const category = categories.find(item => item.id === entry.id);
            return {
                ...entry,
                name: (category && category.name) || entry.name || entry.id,
                iconURI: category ? (category.menuIconURI || category.blockIconURI || null) : null,
                color: category ? category.color1 : null
            };
        });
};

const fileNameFor = entry => `${(entry.name || entry.id).replace(/[\\/:*?"<>|]+/g, '').trim() || entry.id}.js`;

const downloadSource = (entry, text) => {
    downloadBlob(fileNameFor(entry), new Blob([text], {type: 'text/javascript'}));
};

const isCollaborating = state => Boolean(state.scratchGui.collaboration && state.scratchGui.collaboration.isConnected);

export {
    clearDraft,
    downloadSource,
    fileNameFor,
    forgetCachedSource,
    getCachedSource,
    getApplyAsYouType,
    getDraft,
    getEntries,
    fileNameOf,
    hasUnappliedEdits,
    isAuthored,
    isCollaborating,
    markAuthored,
    resetSession,
    setApplyAsYouType,
    setCachedSource,
    rememberFileName,
    setDraft,
    subscribe,
    markFirstApplyRestorePoint,
    needsFirstApplyRestorePoint,
    unappliedIds
};
