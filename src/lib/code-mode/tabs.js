const MAX_SESSIONS = 8;

const emptyTabs = () => ({tabs: [], activeKey: null, previewKey: null});

const scriptTab = targetId => ({key: `script:${targetId}`, kind: 'script', targetId});

const assetTab = (kind, targetId, itemId) => ({key: `${kind}:${targetId}:${itemId}`, kind, targetId, itemId});

const extensionTab = extensionId => ({key: `extension:${extensionId}`, kind: 'extension', extensionId});

const newExtensionTab = source => ({key: 'new-extension', kind: 'newExtension', source: source || null});

const removeExtensionsTab = ids => ({key: 'remove-extensions', kind: 'removeExtensions', ids: ids.slice()});

const replaceTab = (state, tab) => ({
    ...state,
    tabs: state.tabs.map(item => (item.key === tab.key ? tab : item))
});

const openTab = (state, tab, {preview = false} = {}) => {
    const existing = state.tabs.find(item => item.key === tab.key);
    if (existing) {
        const previewKey = !preview && state.previewKey === tab.key ? null : state.previewKey;
        return {...state, activeKey: tab.key, previewKey};
    }
    let tabs = state.tabs;
    let previewKey = state.previewKey;
    let index = tabs.length;
    if (preview && previewKey) {
        const previewIndex = tabs.findIndex(item => item.key === previewKey);
        if (previewIndex !== -1) {
            tabs = tabs.slice(0, previewIndex).concat(tabs.slice(previewIndex + 1));
            index = previewIndex;
        }
    } else {
        const activeIndex = tabs.findIndex(item => item.key === state.activeKey);
        if (activeIndex !== -1) index = activeIndex + 1;
    }
    tabs = tabs.slice(0, index).concat([tab], tabs.slice(index));
    previewKey = preview ? tab.key : previewKey;
    return {tabs, activeKey: tab.key, previewKey};
};

const pinTab = (state, key) => (state.previewKey === key ? {...state, previewKey: null} : state);

const closeTab = (state, key) => {
    const index = state.tabs.findIndex(item => item.key === key);
    if (index === -1) return state;
    const tabs = state.tabs.slice(0, index).concat(state.tabs.slice(index + 1));
    let activeKey = state.activeKey;
    if (activeKey === key) {
        const next = tabs[index] || tabs[index - 1] || null;
        activeKey = next ? next.key : null;
    }
    return {tabs, activeKey, previewKey: state.previewKey === key ? null : state.previewKey};
};

const closeOtherTabs = (state, key) => {
    const tab = state.tabs.find(item => item.key === key);
    if (!tab) return state;
    return {tabs: [tab], activeKey: key, previewKey: state.previewKey === key ? key : null};
};

const cycleTab = (state, step) => {
    if (!state.tabs.length) return state;
    const index = state.tabs.findIndex(item => item.key === state.activeKey);
    const next = state.tabs[(index + step + state.tabs.length) % state.tabs.length];
    return {...state, activeKey: next.key};
};

const pruneTabs = (state, exists) => {
    const tabs = state.tabs.filter(exists);
    if (tabs.length === state.tabs.length) return state;
    const next = {...state, tabs};
    if (!tabs.some(item => item.key === state.activeKey)) {
        const oldIndex = state.tabs.findIndex(item => item.key === state.activeKey);
        const fallback = state.tabs.slice(0, Math.max(0, oldIndex)).reverse()
            .find(exists) || tabs[0] || null;
        next.activeKey = fallback ? fallback.key : null;
    }
    if (!tabs.some(item => item.key === state.previewKey)) next.previewKey = null;
    return next;
};

const sessions = new Map();

const loadSession = projectKey => sessions.get(projectKey) || null;

const saveSession = (projectKey, value) => {
    if (!projectKey) return;
    sessions.delete(projectKey);
    sessions.set(projectKey, value);
    while (sessions.size > MAX_SESSIONS) sessions.delete(sessions.keys().next().value);
};

export {
    assetTab,
    closeOtherTabs,
    closeTab,
    cycleTab,
    emptyTabs,
    extensionTab,
    loadSession,
    newExtensionTab,
    removeExtensionsTab,
    replaceTab,
    openTab,
    pinTab,
    pruneTabs,
    saveSession,
    scriptTab
};
