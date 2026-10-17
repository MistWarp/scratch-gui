const BROADCAST = /\b(?:when\s+broadcast|broadcastWait|broadcast)\s+("(?:[^"\\]|\\.)*"|[A-Za-z_]\w*)/g;
const PROCEDURE = /@([A-Za-z_]\w*)/g;
const MEMBER = /\b([A-Za-z][A-Za-z0-9]*)\.([A-Za-z_$][\w$]*)/g;
const STRING = /"(?:[^"\\]|\\.)*"/g;
const ASSET_CALL = '\\bassets\\.(menu|get|set|load|unload|check|delete|byte|infolder)\\(\\s*';
const ASSET_ARGUMENT = new RegExp(`(?:${ASSET_CALL}|\\b(ASSET|FOLDER):\\s*(?:assets\\.menu\\(\\s*)?)$`);

const escapeRegExp = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const parseName = raw => {
    if (!raw.startsWith('"')) return raw;
    try {
        return JSON.parse(raw);
    } catch (e) {
        return raw.slice(1, -1);
    }
};

const symbolAt = (text, offset) => {
    const doc = String(text || '');
    const lineStart = doc.lastIndexOf('\n', Math.max(0, offset - 1)) + 1;
    const nextBreak = doc.indexOf('\n', offset);
    const line = doc.slice(lineStart, nextBreak === -1 ? doc.length : nextBreak);
    const column = offset - lineStart;
    const covers = match => column >= match.index && column <= match.index + match[0].length;
    for (const match of line.matchAll(BROADCAST)) {
        if (covers(match)) return {kind: 'broadcast', name: parseName(match[1])};
    }
    for (const match of line.matchAll(PROCEDURE)) {
        if (covers(match)) return {kind: 'procedure', name: match[1]};
    }
    for (const match of line.matchAll(MEMBER)) {
        if (covers(match)) return {kind: 'extension', id: match[1], member: match[2]};
    }
    return null;
};

const lineAround = (text, offset) => {
    const doc = String(text || '');
    const lineStart = doc.lastIndexOf('\n', Math.max(0, offset - 1)) + 1;
    const nextBreak = doc.indexOf('\n', offset);
    return {line: doc.slice(lineStart, nextBreak === -1 ? doc.length : nextBreak), column: offset - lineStart};
};

const assetAt = (text, offset) => {
    const {line, column} = lineAround(text, offset);
    for (const match of line.matchAll(STRING)) {
        if (column <= match.index || column >= match.index + match[0].length) continue;
        const context = ASSET_ARGUMENT.exec(line.slice(0, match.index));
        if (!context) return null;
        const folder = context[1] === 'infolder' || context[2] === 'FOLDER';
        return {kind: folder ? 'assetFolder' : 'asset', name: parseName(match[0])};
    }
    return null;
};

const procedureDefinition = (text, name) => {
    const match = new RegExp(`\\bdef\\s+@${escapeRegExp(name)}\\s*\\(`).exec(String(text || ''));
    if (!match) return null;
    const from = match.index + match[0].indexOf('@');
    return {from, to: from + name.length + 1};
};

const broadcastReceivers = (vm, name) => {
    const wanted = String(name).toLowerCase();
    const receivers = [];
    for (const target of vm.runtime.targets) {
        if (!target.isOriginal) continue;
        for (const block of Object.values(target.blocks._blocks)) {
            if (block.opcode !== 'event_whenbroadcastreceived') continue;
            const field = block.fields && block.fields.BROADCAST_OPTION;
            if (!field || String(field.value).toLowerCase() !== wanted) continue;
            receivers.push({
                targetId: target.id,
                targetName: target.isStage ? null : target.getName(),
                blockId: block.id
            });
        }
    }
    return receivers;
};

const extensionForSymbol = (vm, symbol) => {
    if (!symbol || symbol.kind !== 'extension') return null;
    const manager = vm.extensionManager;
    if (manager.isCoreExtension && manager.isCoreExtension(symbol.id)) return null;
    return manager.isExtensionLoaded(symbol.id) ? {id: symbol.id, opcode: symbol.member} : null;
};

export {assetAt, broadcastReceivers, extensionForSymbol, procedureDefinition, symbolAt};
