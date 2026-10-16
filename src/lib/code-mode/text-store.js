import {hasUnappliedEdits as hasUnappliedExtensionEdits, unappliedIds} from '../extension-dev/session.js';

const states = new Map();
const assetDrafts = new Map();
const listeners = new Set();

const notify = () => {
    for (const listener of Array.from(listeners)) listener();
};

const subscribeTexts = listener => {
    listeners.add(listener);
    return () => listeners.delete(listener);
};

const isDirty = state => Boolean(state) && (Boolean(state.draft) ||
    (typeof state.doc === 'string' && Boolean(state.baseline) && state.doc !== state.baseline.text));

const getText = targetId => states.get(targetId) || null;

const setText = (targetId, next, {silent = false} = {}) => {
    const before = states.get(targetId) || null;
    if (next === null) states.delete(targetId);
    else states.set(targetId, next);
    if (!silent || isDirty(before) !== isDirty(next)) notify();
    return next;
};

const updateText = (targetId, patch, options) => {
    const before = states.get(targetId) || {targetId};
    return setText(targetId, {...before, ...patch}, options);
};

const allTexts = () => Array.from(states.entries());

const dirtyTargetIds = () => Array.from(states.keys()).filter(id => isDirty(states.get(id)));

const unappliedFileCount = () => dirtyTargetIds().length + unappliedIds().length + assetDrafts.size;

const hasUnappliedCode = () => dirtyTargetIds().length > 0 || hasUnappliedExtensionEdits() || assetDrafts.size > 0;

const assetDraftKey = name => String(name).toLowerCase();

const getAssetDraft = name => assetDrafts.get(assetDraftKey(name)) || null;

const setAssetDraft = (name, draft) => {
    const key = assetDraftKey(name);
    const had = assetDrafts.has(key);
    if (draft) assetDrafts.set(key, {...draft, name});
    else assetDrafts.delete(key);
    if (had !== Boolean(draft)) notify();
};

const assetDraftNames = () => Array.from(assetDrafts.values()).map(draft => draft.name);

const clearAssetDrafts = () => {
    if (!assetDrafts.size) return;
    assetDrafts.clear();
    notify();
};

const takeAllTexts = () => {
    const all = Array.from(states.entries());
    states.clear();
    notify();
    return all;
};

const clearTexts = () => {
    if (!states.size) return;
    states.clear();
    notify();
};

export {
    allTexts,
    assetDraftNames,
    clearAssetDrafts,
    clearTexts,
    dirtyTargetIds,
    getAssetDraft,
    getText,
    hasUnappliedCode,
    isDirty,
    setAssetDraft,
    setText,
    subscribeTexts,
    takeAllTexts,
    unappliedFileCount,
    updateText
};
