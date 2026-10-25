import {ChangeSet} from '@codemirror/state';
import {getFractchClient} from './fractch-client.js';
import {unitsOf} from './fractch-adapter.js';
import {mapUnits, rebase, resolveConflict, sliceUnit} from './code-rebase.js';
import {fillBlocks, keepFormatting, remapLocked, sameGaps} from './keep-formatting.js';
import {
    REFUSAL,
    commitApply,
    commitApplyAll,
    isCollaborating,
    liveChangeKey,
    prepareApply,
    prepareApplyAll
} from './apply-pipeline.js';
import {
    allTexts,
    appliableTargetIds,
    clearAssetDrafts,
    getText,
    isDirty,
    setText,
    takeAllTexts,
    updateText
} from './text-store.js';
import {baseHash, classifyDraft, loadDraft, scheduleDraftWrite} from './code-drafts.js';
import {clearCodeHistory, codeHistoryLastEvent, subscribeCodeHistory} from './code-history.js';
import {scanRegions} from './file-projection.js';

const TRANSIENT = new Set(['applied', 'undid', 'redid', 'restored', 'refused', 'cancelled', 'fileDeleted']);

const keepEmptyFiles = (before, result) => {
    const kept = new Set(scanRegions(result.text).map(region => region.name));
    const missing = scanRegions(before).filter(region => !kept.has(region.name));
    if (!missing.length) return result;
    const at = result.text.replace(/\s+$/, '').length;
    const blocks = missing.map(region => `region ${JSON.stringify(region.name)} {\n}`).join('\n\n');
    return {
        ...result,
        text: `${result.text.slice(0, at)}${at ? '\n\n' : ''}${blocks}${result.text.slice(at) || '\n'}`
    };
};

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

const draftUnits = (draft, units) => {
    if (!draft.units || typeof draft.units !== 'object') return null;
    const out = {};
    for (const key of Object.keys(units)) {
        const range = draft.units[key];
        const valid = range && range.from >= 0 && range.to >= range.from && range.to <= draft.text.length;
        out[key] = valid ? {from: range.from, to: range.to} : {from: draft.text.length, to: draft.text.length};
    }
    return out;
};

const canonicalText = state => (state.canonicalBaseline || state.baseline).text;

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
        scheduleDraftWrite(id, info, dirty ? {
            text: state.doc,
            baseHash: baseHash(canonicalText(state)),
            units: state.units || null
        } : null);
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
            const units = unitsOf(emitted.sourceMap);
            setText(targetId, {
                ...state,
                doc: draft.text,
                units: draftUnits(draft, units) || locateUnits(emitted.text, units, draft.text),
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
            const formatted = Boolean(state.canonicalBaseline && state.baseline);
            const fresh = formatted ? keepFormatting({
                previous: state.canonicalBaseline,
                formatted: state.baseline,
                next: emitted
            }) : {text: emitted.text, sourceMap: emitted.sourceMap};
            const theirs = {text: fresh.text, units: unitsOf(fresh.sourceMap)};
            const base = state.baseline ? {
                text: state.baseline.text,
                units: unitsOf(state.baseline.sourceMap)
            } : null;
            const common = {
                targetId,
                status: 'ready',
                error: null,
                baseline: fresh,
                canonicalBaseline: formatted ? {text: emitted.text, sourceMap: emitted.sourceMap} : null,
                tag: emitted.tag,
                info: targetInfo(vm, targetId),
                lockedScripts: formatted ?
                    remapLocked(emitted.lockedScripts, fresh.sourceMap) :
                    emitted.lockedScripts || [],
                unitsVersion: ++unitsClock
            };
            if (!base || !isDirty(state) || state.draft) {
                setText(targetId, {
                    ...state,
                    ...common,
                    doc: fresh.text,
                    units: theirs.units,
                    conflicts: [],
                    diagnostics: state.doc === fresh.text ? state.diagnostics || [] : []
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
            return {
                targetId: id,
                name: info ? info.targetName : id,
                isStage: Boolean(info && info.isStage),
                text: state.doc
            };
        });

    const setMessage = (targetId, message) => {
        const state = getText(targetId);
        if (state) setText(targetId, {...state, message});
    };

    const finishWith = (targetId, patch) => {
        const state = getText(targetId);
        if (!state) return null;
        return setText(targetId, {...state, applying: false, pendingChanges: null, ...patch});
    };

    const recordAfterText = (entry, targetId, text) => {
        if (entry && entry.afterTexts) entry.afterTexts[targetId] = text;
        else if (entry && !entry.afterText) entry.afterText = text;
    };

    const settleApplied = async (targetId, {snapshot, sourceMap, diagnostics: planDiagnostics, commitKey, entry}) => {
        const committed = getText(targetId);
        let emitted;
        try {
            emitted = await client.emit(vm, targetId);
        } catch (error) {
            finishWith(targetId, {tag: null, message: {kind: 'applied'}});
            return {kept: false, ms: null};
        }
        const now = getText(targetId) || committed;
        const typed = now.doc !== snapshot;
        const warnings = mapDiagnostics(planDiagnostics.filter(item => item.severity !== 'error'),
            now.pendingChanges);
        const kept = Boolean(emitted.tag && emitted.tag.changeKey === commitKey);
        if (kept) {
            const mine = {text: snapshot, sourceMap: fillBlocks(sourceMap, emitted.sourceMap)};
            const agree = sameGaps(mine, emitted);
            const baseline = keepEmptyFiles(snapshot, agree ? mine :
                keepFormatting({previous: emitted, formatted: mine, next: emitted}));
            recordAfterText(entry, targetId, baseline.text);
            const units = unitsOf(baseline.sourceMap);
            let doc = now.doc;
            let docUnits = now.pendingChanges ? mapUnits(units, now.pendingChanges) : units;
            let conflicts = [];
            if (!agree && !typed) {
                doc = baseline.text;
                docUnits = units;
            } else if (!agree) {
                const mineUnits = unitsOf(mine.sourceMap);
                const merged = rebase({
                    base: {text: snapshot, units: mineUnits},
                    theirs: {text: baseline.text, units},
                    mine: {
                        text: now.doc,
                        units: now.pendingChanges ? mapUnits(mineUnits, now.pendingChanges) : mineUnits
                    }
                });
                doc = merged.text;
                docUnits = merged.units;
                conflicts = merged.conflicts;
            }
            const finished = finishWith(targetId, {
                doc,
                units: docUnits,
                conflicts,
                diagnostics: typed ? warnings : [],
                baseline,
                canonicalBaseline: {text: emitted.text, sourceMap: emitted.sourceMap},
                tag: emitted.tag,
                lockedScripts: remapLocked(emitted.lockedScripts, baseline.sourceMap),
                unitsVersion: ++unitsClock,
                message: {kind: 'applied'}
            });
            if (finished) persistDraft(targetId, finished);
            return {kept: agree && !typed, ms: emitted.ms};
        }
        const withEmpty = keepEmptyFiles(snapshot, {text: emitted.text, sourceMap: emitted.sourceMap});
        recordAfterText(entry, targetId, withEmpty.text);
        const theirs = {text: withEmpty.text, units: unitsOf(emitted.sourceMap)};
        const base = {text: snapshot, units: unitsOf(sourceMap)};
        const mineUnits = now.pendingChanges ? mapUnits(base.units, now.pendingChanges) : base.units;
        const merged = rebase({base, theirs, mine: {text: now.doc, units: mineUnits}});
        const finished = finishWith(targetId, {
            doc: merged.text,
            units: merged.units,
            conflicts: merged.conflicts,
            diagnostics: warnings,
            baseline: withEmpty,
            canonicalBaseline: null,
            tag: emitted.tag,
            lockedScripts: emitted.lockedScripts || [],
            unitsVersion: ++unitsClock,
            message: {kind: 'applied'}
        });
        if (finished) persistDraft(targetId, finished);
        return {kept: false, ms: emitted.ms};
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
        const settled = await settleApplied(targetId, {
            snapshot,
            sourceMap: plan.built.sourceMap,
            diagnostics: plan.diagnostics,
            commitKey: outcome.commitKey,
            entry: outcome.entry
        });
        return {...outcome, kept: settled.kept, timings: {build: plan.built.ms, emit: settled.ms}};
    };

    const applyAllTargets = () => appliableTargetIds().filter(id => {
        const target = vm.runtime.getTargetById(id);
        return Boolean(target && target.isOriginal);
    });

    const finishAll = (ids, patchFor) => {
        for (const id of ids) finishWith(id, patchFor(id));
    };

    const applyFiles = async (ids, files) => {
        let plan;
        try {
            plan = await prepareApplyAll({vm, client, files});
        } catch (error) {
            const text = (error && error.message) || String(error);
            finishAll(ids, () => ({message: {kind: 'refused', text}}));
            return {status: 'refused', reason: 'error'};
        }
        if (plan.status === 'invalid') {
            const blocked = plan.files.filter(file => file.diagnostics.some(item => item.severity === 'error'))
                .map(file => file.name);
            for (const file of plan.files) {
                const current = getText(file.targetId);
                const failed = blocked.includes(file.name);

                finishWith(file.targetId, {
                    diagnostics: mapDiagnostics(file.diagnostics, current.pendingChanges),
                    message: failed ? null : {
                        kind: 'refused',
                        reason: 'applyAllBlocked',
                        values: {files: blocked}
                    }
                });
            }
            return {status: 'invalid', files: plan.files};
        }
        if (plan.status === 'refused') {
            finishAll(ids, () => ({message: {kind: 'refused', reason: plan.reason, text: plan.message}}));
            return plan;
        }
        let outcome;
        try {
            outcome = await commitApplyAll(plan, {
                vm,
                client,
                title: options.title ? options.title() : null,
                confirmImpact: options.confirmImpactAll || options.confirmImpact,
                confirmBackupFailure: options.confirmBackupFailure
            });
        } catch (error) {
            outcome = {status: 'refused', reason: 'error', message: (error && error.message) || String(error)};
        }
        if (outcome.status === 'failed') {
            finishAll(ids, id => {
                if (id !== outcome.targetId) {
                    return {message: {
                        kind: 'refused',
                        reason: 'applyAllFailed',
                        values: {file: outcome.fileName}
                    }};
                }
                const current = getText(id);
                const patch = {message: {
                    kind: 'refused',
                    reason: 'applyAllFailedHere',
                    values: {reason: outcome.message}
                }};
                if (outcome.diagnostics) {
                    patch.diagnostics = mapDiagnostics(outcome.diagnostics, current.pendingChanges);
                }
                return patch;
            });
            return outcome;
        }
        if (outcome.status !== 'committed') {
            finishAll(ids, () => ({message: {
                kind: outcome.status === 'cancelled' ? 'cancelled' : 'refused',
                reason: outcome.reason,
                text: outcome.message
            }}));
            return outcome;
        }
        for (const file of outcome.files) {
            const prepared = plan.files.find(item => item.targetId === file.targetId);
            await settleApplied(file.targetId, {
                snapshot: prepared.snapshot,
                sourceMap: (file.built || prepared.built).sourceMap,
                diagnostics: file.built ? file.built.diagnostics : prepared.diagnostics,
                commitKey: file.commitKey,
                entry: outcome.entry
            });
        }
        return outcome;
    };

    const applyAll = async () => {
        let ids = applyAllTargets();
        if (!ids.length) return {status: 'clean'};
        if (ids.some(id => getText(id).applying)) return {status: 'busy'};
        if (isCollaborating(vm)) {
            for (const id of ids) {
                setMessage(id, {kind: 'refused', reason: 'collaboration', text: REFUSAL.collaboration});
            }
            return {status: 'refused', reason: 'collaboration'};
        }
        for (const id of ids) {
            if (!isStale(id)) continue;
            const state = await regenerate(id);
            if (!state || state.status !== 'ready') return {status: 'unavailable', targetId: id};
        }
        ids = ids.filter(id => isDirty(getText(id)) && !getText(id).draft);
        const conflicted = ids.filter(id => (getText(id).conflicts || []).length);
        if (conflicted.length) return {status: 'conflict', targetIds: conflicted};
        if (ids.length < 2) return ids.length ? apply(ids[0]) : {status: 'clean'};
        const files = ids.map(id => {
            const state = getText(id);
            const info = targetInfo(vm, id);
            return {
                targetId: id,
                name: info ? info.targetName : id,
                text: state.doc,
                previous: state.baseline,
                lockedScripts: state.lockedScripts
            };
        });
        for (const file of files) {
            const state = getText(file.targetId);
            setText(file.targetId, {...state, applying: true, pendingChanges: ChangeSet.empty(file.text.length)});
        }
        try {
            return await applyFiles(ids, files);
        } finally {
            for (const id of ids) {
                const state = getText(id);
                if (state && state.applying) finishWith(id, {});
            }
        }
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
                units: state.units || null,
                baseHash: sync ? null : baseHash(canonicalText(state))
            });
        }
        client.reset();
    };

    const historyChanged = () => {
        const event = codeHistoryLastEvent();
        if (!event || event.clock === historyClock) return;
        historyClock = event.clock;
        const message = {kind: event.kind === 'undo' ? 'undid' : 'redid'};
        for (const id of event.targetIds || [event.targetId]) setMessage(id, message);
    };

    const unsubscribeHistory = subscribeCodeHistory(historyChanged);

    const dispose = () => {
        unsubscribeHistory();
    };

    return {
        apply,
        applyAll,
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
