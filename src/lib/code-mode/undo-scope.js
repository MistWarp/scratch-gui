import {getEntries} from '../extension-dev/session.js';

let provider = null;

const setTextUndoProvider = next => {
    provider = next;
    return () => {
        if (provider === next) provider = null;
    };
};

const textUndo = () => (provider ? provider() : null);

const extensionName = (vm, id) => {
    const match = getEntries(vm).find(item => item.id === id);
    return (match && match.name) || id || '';
};

const describeCodeEntry = (vm, entry, {stageName = 'Stage'} = {}) => {
    if (!entry) return null;
    if (entry.kind === 'extension') {
        const name = extensionName(vm, entry.extensionId);
        return name ? {kind: 'extension', name} : null;
    }
    const ids = Array.isArray(entry.targetIds) && entry.targetIds.length ? entry.targetIds : [entry.targetId];
    if (ids.length > 1) return {kind: 'files', count: ids.length};
    const target = ids[0] && vm.runtime.getTargetById(ids[0]);
    if (!target) return null;
    return {kind: 'file', name: target.isStage ? stageName : target.getName()};
};

export {describeCodeEntry, setTextUndoProvider, textUndo};
