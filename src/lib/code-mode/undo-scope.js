let provider = null;

const setTextUndoProvider = next => {
    provider = next;
    return () => {
        if (provider === next) provider = null;
    };
};

const textUndo = () => (provider ? provider() : null);

const entryNames = (vm, entry) => {
    const ids = Array.isArray(entry.targetIds) && entry.targetIds.length ? entry.targetIds : [entry.targetId];
    return ids.map(id => {
        const target = id && vm.runtime.getTargetById(id);
        if (!target) return null;
        return target.isStage ? 'Stage' : target.getName();
    }).filter(Boolean);
};

const describeCodeEntry = (vm, entry) => {
    if (!entry) return null;
    if (entry.kind === 'extension') return {kind: 'extension', name: entry.extensionId || ''};
    const names = entryNames(vm, entry);
    if (names.length > 1) return {kind: 'files', count: names.length};
    return {kind: 'file', name: names[0] || ''};
};

export {describeCodeEntry, setTextUndoProvider, textUndo};
