import {closeTab, emptyTabs, openTab} from './tabs.js';

const MAX_GROUPS = 2;
const ASSET_KINDS = ['costume', 'sound'];
const MIN_RATIO = 0.15;
const MAX_RATIO = 0.85;

const singleLayout = (tabsState = emptyTabs()) => ({
    groups: [{...tabsState, id: 'g0'}],
    focused: 'g0',
    direction: 'row',
    ratio: 0.5
});

const groupById = (layout, id) => layout.groups.find(group => group.id === id) || null;

const focusedGroup = layout => groupById(layout, layout.focused) || layout.groups[0];

const activeTabOf = group => (group ? group.tabs.find(tab => tab.key === group.activeKey) || null : null);

const settle = (layout, groups) => {
    let kept = groups.filter(group => group.tabs.length);
    if (!kept.length) kept = [groups.find(group => group.id === layout.focused) || groups[0]];
    const focused = kept.some(group => group.id === layout.focused) ? layout.focused : kept[0].id;
    const changed = kept.length !== layout.groups.length ||
        kept.some((group, index) => group !== layout.groups[index]);
    if (!changed && focused === layout.focused) return layout;
    return {...layout, groups: kept, focused};
};

const setGroupTabs = (layout, id, tabsState) => {
    const current = groupById(layout, id);
    if (!current || tabsState === current) return layout;
    return settle(layout, layout.groups.map(group => (group.id === id ? {...tabsState, id} : group)));
};

const mapGroups = (layout, fn) => settle(layout, layout.groups.map(group => {
    const next = fn(group);
    return next === group ? group : {...next, id: group.id};
}));

const focusGroup = (layout, id) => (groupById(layout, id) && layout.focused !== id ? {...layout, focused: id} : layout);

const otherGroup = (layout, id) => layout.groups.find(group => group.id !== id) || null;

const openInLayout = (layout, tab, {preview = false} = {}) => {
    const focused = focusedGroup(layout);
    if (focused.tabs.some(item => item.key === tab.key)) {
        return setGroupTabs(layout, focused.id, openTab(focused, tab, {preview}));
    }
    const holder = layout.groups.find(group => group.tabs.some(item => item.key === tab.key));
    if (holder) return setGroupTabs(focusGroup(layout, holder.id), holder.id, openTab(holder, tab, {preview}));
    return setGroupTabs(layout, focused.id, openTab(focused, tab, {preview}));
};

const insertTab = (group, tab, index) => {
    const tabs = group.tabs.filter(item => item.key !== tab.key);
    const at = Math.max(0, Math.min(typeof index === 'number' ? index : tabs.length, tabs.length));
    return {
        ...group,
        tabs: tabs.slice(0, at).concat([tab], tabs.slice(at)),
        activeKey: tab.key,
        previewKey: group.previewKey === tab.key ? null : group.previewKey
    };
};

const moveTab = (layout, fromId, key, toId, index) => {
    const from = groupById(layout, fromId);
    const to = groupById(layout, toId);
    const tab = from && from.tabs.find(item => item.key === key);
    if (!tab || !to) return layout;
    if (fromId === toId) {
        const oldIndex = from.tabs.indexOf(tab);
        const target = typeof index === 'number' && index > oldIndex ? index - 1 : index;
        return focusGroup(setGroupTabs(layout, fromId, insertTab(from, tab, target)), fromId);
    }
    const groups = layout.groups.map(group => {
        if (group.id === fromId) return {...closeTab(group, key), id: fromId};
        if (group.id === toId) return insertTab(group, tab, index);
        return group;
    });
    return settle({...layout, focused: toId}, groups);
};

let groupCounter = 0;

const splitTab = (layout, fromId, key, direction, {copy = false} = {}) => {
    const from = groupById(layout, fromId);
    const tab = from && from.tabs.find(item => item.key === key);
    if (!tab) return layout;
    if (layout.groups.length >= MAX_GROUPS) {
        const other = otherGroup(layout, fromId);
        if (!other) return layout;
        if (copy) return setGroupTabs(focusGroup(layout, other.id), other.id, insertTab(other, tab));
        return moveTab(layout, fromId, key, other.id);
    }
    if (!copy && from.tabs.length < 2) return layout;
    groupCounter += 1;
    const id = `g${Date.now().toString(36)}${groupCounter}`;
    const source = copy ? from : {...closeTab(from, key), id: fromId};
    const created = {tabs: [tab], activeKey: tab.key, previewKey: null, id};
    return {
        ...layout,
        groups: layout.groups.map(group => (group.id === fromId ? source : group)).concat([created]),
        focused: id,
        direction: direction === 'column' ? 'column' : 'row',
        ratio: 0.5
    };
};

const closeInGroup = (layout, id, key) => {
    const group = groupById(layout, id);
    return group ? setGroupTabs(layout, id, closeTab(group, key)) : layout;
};

const closeEverywhere = (layout, key) => mapGroups(layout, group => closeTab(group, key));

const setRatio = (layout, ratio) => {
    const clamped = Math.min(MAX_RATIO, Math.max(MIN_RATIO, Number(ratio) || 0.5));
    return clamped === layout.ratio ? layout : {...layout, ratio: clamped};
};

const mountsAssetEditor = (layout, id) => {
    const tab = activeTabOf(groupById(layout, id));
    if (!tab || !ASSET_KINDS.includes(tab.kind)) return false;
    const holders = layout.groups.filter(group => {
        const active = activeTabOf(group);
        return active && active.kind === tab.kind;
    });
    const owner = holders.find(group => group.id === layout.focused) || holders[0];
    return owner.id === id;
};

export {
    MAX_GROUPS,
    activeTabOf,
    closeEverywhere,
    closeInGroup,
    focusGroup,
    focusedGroup,
    groupById,
    mapGroups,
    mountsAssetEditor,
    moveTab,
    openInLayout,
    setGroupTabs,
    setRatio,
    singleLayout,
    splitTab
};
