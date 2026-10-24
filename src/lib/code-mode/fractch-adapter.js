import {buildTarget, emitTarget, findInSourceMap, parseFractch, toReplaceChange} from 'fractch/browser';
import opcodeTable from 'scratch-vm/src/engine/opcodes.generated.json';

const UNIT_KINDS = [['script', 'scripts'], ['decl', 'declarations'], ['comment', 'comments']];

const scriptForTopId = (sourceMap, topId) => {
    const range = sourceMap && sourceMap.scripts && topId ? sourceMap.scripts[topId] : null;
    return range ? {topId, ...range} : null;
};

const scriptAtOffset = (sourceMap, offset) => {
    if (!sourceMap || !sourceMap.scripts) return null;
    for (const topId of Object.keys(sourceMap.scripts)) {
        const range = sourceMap.scripts[topId];
        if (offset >= range.from && offset <= range.to) return {topId, ...range};
    }
    return null;
};

const unitsOf = sourceMap => {
    const units = {};
    if (!sourceMap) return units;
    for (const [kind, field] of UNIT_KINDS) {
        const map = sourceMap[field] || {};
        for (const id of Object.keys(map)) units[`${kind}:${id}`] = {from: map[id].from, to: map[id].to};
    }
    return units;
};

const unitKind = key => key.slice(0, key.indexOf(':'));

const unitId = key => key.slice(key.indexOf(':') + 1);

const hasErrorDiagnostics = list => (list || []).some(item => item.severity === 'error');

export {
    UNIT_KINDS,
    buildTarget,
    emitTarget,
    findInSourceMap,
    hasErrorDiagnostics,
    opcodeTable,
    parseFractch,
    scriptAtOffset,
    scriptForTopId,
    toReplaceChange,
    unitId,
    unitKind,
    unitsOf
};
