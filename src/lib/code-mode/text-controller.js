import {ChangeSet} from '@codemirror/state';
import {getFractchClient} from './fractch-client.js';
import {unitsOf} from './fractch-adapter.js';
import {mapUnits, rebase, resolveConflict, sliceUnit} from './code-rebase.js';
import {
    REFUSAL,
    commitApply,
    isCollaborating,
    liveChangeKey,
    prepareApply
} from './apply-pipeline.js';
import {
    allTexts,
    clearAssetDrafts,
    getText,
    isDirty,
    setText,
    takeAllTexts,
    updateText
} from './text-store.js';
import {baseHash, classifyDraft, loadDraft, scheduleDraftWrite} from './code-drafts.js';
import {clearCodeHistory, codeHistoryLastEvent, subscribeCodeHistory} from './code-history.js';

const TRANSIENT = new Set(['applied', 'undid', 'redid', 'restored', 'refused', 'cancelled']);

const locateUnits = (baseText, units, doc) => {
    const out = {};
    let cursor = 0;
    const keys = Object.keys(units).sort((a, b) => units[a].from - units[b].from);
    for (const key of keys) {
        const piece = sliceUnit(baseText, units, key);
        const at = piece === null ? -1 : doc.indexOf(piece, cursor);
        if (at === -1) {
            out[key] = {from: cursor, to: cursor};
        } else {
            out[key] = {from: at, to: at + piece.length};
            cursor = at + piece.length;
        }
    }
    return out;
};

const mapDiagnostics = (diagnostics, changes) => {
    if (!changes || changes.empty) return diagnostics;
    return diagnostics.map(item => {
        if (typeof item.from !== 'number') return item;
        const from = changes.mapPos(item.from, 1);
        const to = typeof item.to === 'number' ? Math.max(from, changes.mapPos(item.to, -1)) : from;
        return {...item, from, to};
    });
};

const targetInfo = (vm, targetId) => {
    const target = vm.runtime.getTargetById(targetId);
    if (!target) return null;
    return {targetName: target.isStage ? 'Stage' : target.getName(), isStage: target.isStage};
};

const carryConflicts = (previous, merged, theirs) => {
    const keys = new Set(merged.conflicts.map(item => item.key));
    const carried = (previous || []).filter(item => !keys.has(item.key) && merged.units[item.key])
        .map(item => ({...item, theirs: sliceUnit(theirs.text, theirs.units, item.key)}));
    return merged.conflicts.concat(carried);
};

const createTextController = ({vm, client = getFractchClient()}) => {
    let options = {};
    const pendingDrafts = [];
    const regenerations = new Map();
    let unitsClock = 0;
    let historyClock = null;

    const configure = next => {
        options = {...options, ...next};
    };

    const identity = () => (options.getIdentity ? options.getIdentity() : null);

    const persistDraft = (targetId, state) => {
        const id = state.identity || identity();
        const info = targetInfo(vm, targetId);
        if (!id || !info) return;
        const dirty = state.baseline && state.doc !== state.baseline.text;
        scheduleDraftWrite(id, info, dirty ? {text: state.doc, baseHash: baseHash(state.baseline.text)} : null);
    };

    const findDraft = targetId => {
        const info = targetInfo(vm, targetId);
        if (!info) return Promise.resolve(null);
        const current = identity();
        const index = pendingDrafts.findIndex(draft => draft.targetName === info.targetName &&
            draft.isStage === info.isStage && (draft.identity === current || draft.sync));
        if (index !== -1) {
            const draft = pendingDrafts.splice(index, 1)[0];
            return Promise.resolve(draft);
        }
        if (!current) return Promise.resolve(null);
        return loadDraft(current, info).then(draft => draft, () => null);
    };

    const applyDraft = (targetId, draft, emitted) => {
        const kind = classifyDraft(draft, emitted.text);
        const state = getText(targetId);
        if (!kind || !state || state.status !== 'ready' || isDirty(state)) return;
        if (kind === 'restore') {
            setText(targetId, {
                ...state,
                doc: draft.text,
                units: locateUnits(emitted.text, unitsOf(emitted.sourceMap), draft.text),
                unitsVersion: ++unitsClock,
                message: {kind: 'restored'}
            });
        } else {
            setText(targetId, {...state, draft: {kind: 'stale', text: draft.text, baseText: emitted.text}});
        }
    };

    const regenerate = targetId => {
        if (regenerations.has(targetId)) return regenerations.get(targetId);
        const before = getText(targetId);
        if (!before) updateText(targetId, {status: 'loading', doc: '', units: {}, lockedScripts: []});
        const firstLoad = !before || !before.baseline;
        const generation = vm._projectLoadGeneration || 0;
        const run = client.emit(vm, targetId).then(emitted => {
            if (regenerations.get(targetId) === run) regenerations.delete(targetId);
            if (generation !== (vm._projectLoadGeneration || 0) || !vm.runtime.getTargetById(targetId)) return null;
            const state = getText(targetId) || {targetId};
            const theirs = {text: emitted.text, units: unitsOf(emitted.sourceMap)};
            const base = state.baseline ? {
                text: state.baseline.text,
                units: unitsOf(state.baseline.sourceMap)
            } : null;
            const common = {
                targetId,
                status: 'ready',
                error: null,
                baseline: {text: emitted.text, sourceMap: emitted.sourceMap},
                tag: emitted.tag,
                info: targetInfo(vm, targetId),
                lockedScripts: emitted.lockedScripts || [],
                unitsVersion: ++unitsClock
            };
            if (!base || !isDirty(state) || state.draft) {
                setText(targetId, {
                    ...state,
                    ...common,
                    doc: emitted.text,
                    units: theirs.units,
                    conflicts: [],
                    diagnostics: state.doc === emitted.text ? state.diagnostics || [] : []
                });
            } else {
                const merged = rebase({base, theirs, mine: {text: state.doc, units: state.units || {}}});
                setText(targetId, {
                    ...state,
                    ...common,
                    doc: merged.text,
                    units: merged.units,
                    conflicts: carryConflicts(state.conflicts, merged, theirs)
                });
                persistDraft(targetId, getText(targetId));
            }
            if (firstLoad) {
                return findDraft(targetId).then(draft => {
                    if (draft) applyDraft(targetId, draft, emitted);
                    return getText(targetId);
                });
            }
            return getText(targetId);
        }, error => {
            if (regenerations.get(targetId) === run) regenerations.delete(targetId);
            if (generation !== (vm._projectLoadGeneration || 0)) return null;
            const state = getText(targetId) || {targetId};
            const message = (error && error.message) || String(error);
            if (state.baseline && isDirty(state)) {
                setText(targetId, {...state, message: {kind: 'refused', text: message}});
            } else {
                setText(targetId, {...state, status: 'error', error: message, doc: '', units: {}});
            }
            return getText(targetId);
        });
        regenerations.set(targetId, run);
        return run;
    };

    const isStale = targetId => {
        const state = getText(targetId);
        if (!state || !state.tag) return true;
        return state.tag.generation !== (vm._projectLoadGeneration || 0) ||
            state.tag.changeKey !== liveChangeKey(vm, targetId);
    };

    const refresh = targetId => {
        const state = getText(targetId);
        if (state && state.applying) return Promise.resolve(state);
        if (!state || state.status !== 'ready' || isStale(targetId)) return regenerate(targetId);
        return Promise.resolve(state);
    };

    const edit = (targetId, doc, changes) => {
        const state = getText(targetId);
        if (!state || state.status !== 'ready') return;
        const units = changes ? mapUnits(state.units || {}, changes) : state.units;
        const pendingChanges = state.pendingChanges && changes ?
            state.pendingChanges.compose(changes) :
            state.pendingChanges;
        const diagnostics = changes ? mapDiagnostics(state.diagnostics || [], changes) : state.diagnostics;
        const clearMessage = state.message && TRANSIENT.has(state.message.kind);
        const next = {
            ...state,
            doc,
            units,
            pendingChanges,
            diagnostics,
            identity: identity(),
            message: clearMessage ? null : state.message
        };
        setText(targetId, next, {silent: !clearMessage});
        persistDraft(targetId, next);
    };

    const otherTexts = targetId => allTexts()
        .filter(([id, state]) => id !== targetId && isDirty(state) && typeof state.doc === 'string')
        .map(([id, state]) => {
            const info = targetInfo(vm, id);
            return {name: info ? info.targetName : id, text: state.doc};
        });

    const finishWith = (targetId, patch) => {
        const state = getText(targetId);
        if (!state) return null;
        return setText(targetId, {...state, applying: false, pendingChanges: null, ...patch});
    };

    const apply = async targetId => {
        let state = getText(targetId);
        if (!state || state.status !== 'ready') return {status: 'unavailable'};
        if (state.applying) return {status: 'busy'};
        if (isCollaborating(vm)) {
            setText(targetId, {
                ...state,
                message: {kind: 'refused', reason: 'collaboration', text: REFUSAL.collaboration}
            });
            return {status: 'refused', reason: 'collaboration'};
        }
        if (state.draft) return {status: 'unavailable'};
        if (isStale(targetId)) {
            state = await regenerate(targetId);
            if (!state || state.status !== 'ready') return {status: 'unavailable'};
        }
        if (state.conflicts && state.conflicts.length) return {status: 'conflict'};
        if (!isDirty(state)) return {status: 'clean'};
        const snapshot = state.doc;
        const previous = state.baseline;
        setText(targetId, {...state, applying: true, pendingChanges: ChangeSet.empty(snapshot.length)});
        let plan;
        try {
            plan = await prepareApply({
                vm,
                client,
                targetId,
                text: snapshot,
                previous,
                lockedScripts: state.lockedScripts,
                otherTexts: otherTexts(targetId)
            });
        } catch (error) {
            finishWith(targetId, {message: {kind: 'refused', text: (error && error.message) || String(error)}});
            return {status: 'refused', reason: 'error'};
        }
        const current = getText(targetId);
        if (plan.status === 'invalid') {
            finishWith(targetId, {diagnostics: mapDiagnostics(plan.diagnostics, current.pendingChanges)});
            return {status: 'invalid', diagnostics: plan.diagnostics};
        }
        if (plan.status === 'refused') {
            finishWith(targetId, {message: {kind: 'refused', reason: plan.reason, text: plan.message}});
            return plan;
        }
        const outcome = await commitApply(plan, {
            vm,
            title: options.title ? options.title() : null,
            confirmImpact: options.confirmImpact,
            confirmBackupFailure: options.confirmBackupFailure
        });
        if (outcome.status !== 'committed') {
            finishWith(targetId, {message: {kind: outcome.status === 'cancelled' ? 'cancelled' : 'refused',
                reason: outcome.reason,
                text: outcome.message}});
            return outcome;
        }
        const committed = getText(targetId);
        let emitted;
        try {
            emitted = await client.emit(vm, targetId);
        } catch (error) {
            finishWith(targetId, {tag: null, message: {kind: 'applied'}});
            return outcome;
        }
        if (outcome.entry && !outcome.entry.afterText) outcome.entry.afterText = emitted.text;
        const now = getText(targetId) || committed;
        const theirs = {text: emitted.text, units: unitsOf(emitted.sourceMap)};
        const canonical = now.doc === snapshot && emitted.tag && emitted.tag.changeKey === outcome.commitKey;
        let doc = emitted.text;
        let units = theirs.units;
        let conflicts = [];
        let diagnostics = [];
        if (!canonical) {
            const base = {text: snapshot, units: unitsOf(plan.built.sourceMap)};
            const mineUnits = now.pendingChanges ? mapUnits(base.units, now.pendingChanges) : base.units;
            const merged = rebase({base, theirs, mine: {text: now.doc, units: mineUnits}});
            doc = merged.text;
            units = merged.units;
            conflicts = merged.conflicts;
            diagnostics = mapDiagnostics(plan.diagnostics.filter(item => item.severity !== 'error'),
                now.pendingChanges);
        }
        const finished = finishWith(targetId, {
            doc,
            units,
            conflicts,
            diagnostics,
            baseline: {text: emitted.text, sourceMap: emitted.sourceMap},
            tag: emitted.tag,
            lockedScripts: emitted.lockedScripts || [],
            unitsVersion: ++unitsClock,
            message: {kind: 'applied'}
        });
        if (finished) persistDraft(targetId, finished);
        return {...outcome, canonical, timings: {build: plan.built.ms, emit: emitted.ms}};
    };

    const resolve = (targetId, key, choice) => {
        const state = getText(targetId);
        if (!state || !state.conflicts) return;
        const next = resolveConflict({text: state.doc, units: state.units, conflicts: state.conflicts}, key, choice);
        const updated = setText(targetId, {
            ...state,
            doc: next.text,
            units: next.units,
            conflicts: next.conflicts,
            unitsVersion: ++unitsClock
        });
        persistDraft(targetId, updated);
    };

    const propose = async (targetId, {text, units, conflicts}) => {
        const state = await refresh(targetId);
        if (!state || state.status !== 'ready' || state.applying || state.draft || isDirty(state)) return false;
        const next = setText(targetId, {
            ...state,
            doc: text,
            units,
            conflicts,
            diagnostics: [],
            unitsVersion: ++unitsClock,
            message: null
        });
        persistDraft(targetId, next);
        return true;
    };

    const discardDraft = targetId => {
        const state = getText(targetId);
        if (!state) return;
        const next = setText(targetId, {...state, draft: null});
        persistDraft(targetId, next);
    };

    const revert = targetId => {
        const state = getText(targetId);
        if (!state || !state.baseline) return;
        const next = setText(targetId, {
            ...state,
            doc: state.baseline.text,
            units: unitsOf(state.baseline.sourceMap),
            conflicts: [],
            diagnostics: [],
            unitsVersion: ++unitsClock
        });
        persistDraft(targetId, next);
    };

    const setMessage = (targetId, message) => {
        const state = getText(targetId);
        if (state) setText(targetId, {...state, message});
    };

    const projectLoaded = () => {
        const sync = isCollaborating(vm);
        regenerations.clear();
        clearAssetDrafts();
        for (const [, state] of takeAllTexts()) {
            if (!isDirty(state) || state.draft) continue;
            const info = state.info || null;
            if (!info) continue;
            pendingDrafts.push({
                ...info,
                identity: state.identity || null,
                sync,
                text: state.doc,
                baseHash: sync ? null : baseHash(state.baseline.text)
            });
        }
        client.reset();
    };

    const historyChanged = () => {
        const event = codeHistoryLastEvent();
        if (!event || event.clock === historyClock) return;
        historyClock = event.clock;
        setMessage(event.targetId, {kind: event.kind === 'undo' ? 'undid' : 'redid'});
    };

    const unsubscribeHistory = subscribeCodeHistory(historyChanged);

    const dispose = () => {
        unsubscribeHistory();
    };

    return {
        apply,
        configure,
        discardDraft,
        dispose,
        edit,
        identity,
        isStale,
        projectLoaded,
        propose,
        refresh,
        regenerate,
        resolve,
        revert,
        setMessage
    };
};

let shared = null;

const getTextController = vm => {
    if (!shared || shared.vm !== vm) {
        if (shared) shared.controller.dispose();
        shared = {vm, controller: createTextController({vm})};
    }
    return shared.controller;
};

const attached = new WeakMap();

const attachCodeMode = (vm, {getIdentity}) => {
    const controller = getTextController(vm);
    controller.configure({getIdentity});
    if (attached.has(vm)) return attached.get(vm);
    const loaded = () => {
        controller.projectLoaded();
        clearCodeHistory();
    };
    vm.runtime.on('PROJECT_LOADED', loaded);
    const detach = () => {
        vm.runtime.off('PROJECT_LOADED', loaded);
        attached.delete(vm);
    };
    attached.set(vm, detach);
    return detach;
};

export {attachCodeMode, createTextController, getTextController, locateUnits};
