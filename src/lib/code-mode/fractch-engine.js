import {
    buildTarget,
    emitTarget,
    hasErrorDiagnostics,
    opcodeTable,
    parseFractch,
    toReplaceChange
} from './fractch-adapter.js';
import {textFacts} from './text-facts.js';

const now = () => (typeof performance === 'undefined' ? Date.now() : performance.now());

const topOf = (blocks, id, memo) => {
    const path = [];
    let current = id;
    while (current && !memo.has(current)) {
        path.push(current);
        const block = blocks[current];
        const parent = block && !Array.isArray(block) ? block.parent : null;
        if (!parent || !blocks[parent]) {
            memo.set(current, current);
            break;
        }
        current = parent;
    }
    const top = memo.get(current) || current;
    for (const item of path) memo.set(item, top);
    return top;
};

const stripKeptBlocks = change => {
    const keep = new Set(change.keepScripts);
    if (!keep.size) return change;
    const memo = new Map();
    const blocks = {};
    for (const id of Object.keys(change.blocks)) {
        if (!keep.has(topOf(change.blocks, id, memo))) blocks[id] = change.blocks[id];
    }
    return {...change, blocks};
};

const keepLivePositions = (scope, targetId, parsed, result, change) => {
    const paired = (result.changed || []).filter(item => item.topId === item.newTopId).map(item => item.topId);
    if (!paired.length) return change;
    const target = (scope.targets || []).find(entry => entry.id === targetId);
    const live = target && target.blocks;
    if (!live) return change;
    const unplaced = new Set((parsed.scripts || []).filter(script => script.x === null && script.span)
        .map(script => script.span[0]));
    const scripts = (result.sourceMap && result.sourceMap.scripts) || {};
    let blocks = null;
    for (const topId of paired) {
        const range = scripts[topId];
        const block = change.blocks[topId];
        const old = live[topId];
        if (!range || !unplaced.has(range.from) || !block || !old || typeof old.x !== 'number') continue;
        blocks = blocks || {...change.blocks};
        blocks[topId] = {...block, x: old.x, y: old.y};
    }
    return blocks ? {...change, blocks} : change;
};

const createEngine = () => {
    const targets = new Map();
    let meta = {generation: null, extensionSignatures: {}, extensionSignatureHash: null};
    let context = null;

    const currentContext = () => {
        if (!context) {
            context = {
                form: 'live',
                generation: meta.generation,
                extensionSignatures: meta.extensionSignatures,
                opcodes: opcodeTable,
                targets: Array.from(targets.values())
            };
        }
        return context;
    };

    const tagOf = targetId => {
        const target = targets.get(targetId);
        return target ? {generation: meta.generation, changeKey: target.changeKey} : null;
    };

    const update = ({generation, extensionSignatures, extensionSignatureHash, targets: posted, keep}) => {
        if (generation !== meta.generation) targets.clear();
        meta = {generation, extensionSignatures, extensionSignatureHash};
        if (Array.isArray(keep)) {
            const live = new Set(keep);
            for (const id of Array.from(targets.keys())) {
                if (!live.has(id)) targets.delete(id);
            }
        }
        for (const target of posted || []) targets.set(target.id, target);
        context = null;
        return {ok: true};
    };

    const emit = ({targetId, lockCheck = true}) => {
        const started = now();
        const result = emitTarget(currentContext(), targetId, {lockCheck});
        return {
            text: result.text,
            sourceMap: result.sourceMap,
            lockedScripts: result.lockedScripts || [],
            tag: tagOf(targetId),
            ms: now() - started
        };
    };

    const buildIn = (scope, {targetId, text, previous, lockedScripts, verifyRoundTrip = true}) => {
        const started = now();
        const source = String(text === null || typeof text === 'undefined' ? '' : text);
        const parsed = parseFractch(source);
        const result = buildTarget(scope, targetId, source, {
            previous,
            lockedScripts,
            verifyRoundTrip,
            parsed: {text: source, value: parsed}
        });
        const change = keepLivePositions(scope, targetId, parsed, result, stripKeptBlocks(toReplaceChange(result)));
        return {
            result,
            built: {
                tag: tagOf(targetId),
                diagnostics: result.diagnostics,
                unchangedScripts: result.unchangedScripts,
                changed: result.changed,
                created: result.created,
                removed: result.removed,
                valueSets: result.valueSets,
                sourceMap: result.sourceMap,
                change,
                ms: now() - started
            }
        };
    };

    const build = message => buildIn(currentContext(), message).built;

    const buildBatch = ({items}) => {
        const base = currentContext();
        let scope = base;
        const results = [];
        for (const item of items || []) {
            const {result, built} = buildIn(scope, item);
            results.push(built);
            const target = targets.get(item.targetId);
            const blocking = (result.diagnostics || []).filter(entry => entry.code !== 'FR220');
            if (target && target.isStage && result.target && !hasErrorDiagnostics(blocking)) {
                const stage = {
                    ...target,
                    variables: result.target.variables,
                    lists: result.target.lists,
                    broadcasts: result.target.broadcasts || target.broadcasts
                };
                scope = {...base, targets: base.targets.map(entry => (entry.id === stage.id ? stage : entry))};
            }
        }
        return results;
    };

    const facts = ({texts}) => (texts || []).map(text => textFacts(text));

    const emitProject = ({targets: list, monitors}) => {
        const project = {
            form: 'sb3',
            targets: list,
            monitors: monitors || [],
            opcodes: opcodeTable,
            extensionSignatures: meta.extensionSignatures
        };
        const texts = {};
        for (const target of list) {
            const result = emitTarget(project, target.name, {lockCheck: false});
            texts[target.isStage ? 'Stage' : target.name] = {text: result.text, sourceMap: result.sourceMap};
        }
        return texts;
    };

    const handle = message => {
        if (message.type === 'update') return update(message);
        if (message.type === 'emitProject') return emitProject(message);
        if (message.type === 'emit') return emit(message);
        if (message.type === 'build') return build(message);
        if (message.type === 'buildBatch') return buildBatch(message);
        if (message.type === 'facts') return facts(message);
        throw new Error(`Unknown request ${message.type}`);
    };

    return {handle, tagOf};
};

export {createEngine, stripKeptBlocks};
