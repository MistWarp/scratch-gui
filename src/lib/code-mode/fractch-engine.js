import {buildTarget, emitTarget, opcodeTable, toReplaceChange} from './fractch-adapter.js';

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

    const build = ({targetId, text, previous, lockedScripts, verifyRoundTrip = true}) => {
        const started = now();
        const result = buildTarget(currentContext(), targetId, text, {
            previous,
            lockedScripts,
            verifyRoundTrip
        });
        const change = stripKeptBlocks(toReplaceChange(result));
        return {
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
        };
    };

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
        throw new Error(`Unknown request ${message.type}`);
    };

    return {handle, tagOf};
};

export {createEngine, stripKeptBlocks};
