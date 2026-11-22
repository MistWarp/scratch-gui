import api from './api';

export const decodeBase64 = value => {
    const binary = atob(value || '');
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index);
    return bytes;
};

const FILE_FETCH_LIMIT = 8;

export const mapLimited = async (items, limit, task) => {
    const results = new Array(items.length);
    let next = 0;
    const worker = async () => {
        while (next < items.length) {
            const index = next++;
            results[index] = await task(items[index], index);
        }
    };
    await Promise.all(Array.from({length: Math.min(limit, items.length)}, worker));
    return results;
};

export const materializeMerge = async data => {
    const tree = await api.commitTree(data.targetProjectId, data.targetHead);
    const loaded = await mapLimited(tree.files || [], FILE_FETCH_LIMIT, async file => {
        const result = await api.commitFile(data.targetProjectId, data.targetHead, file.path);
        return [file.path, decodeBase64(result.content)];
    });
    const files = new Map(loaded);
    const conflicts = [];
    const binaryConflicts = [];
    for (const change of data.merge.changes || []) {
        if (change.conflict && change.binary) {
            binaryConflicts.push({...change, choice: ''});
            continue;
        }
        if (change.deleted) files.delete(change.path);
        else files.set(change.path, decodeBase64(change.content));
        if (change.conflict) {
            conflicts.push({path: change.path, content: new TextDecoder().decode(decodeBase64(change.content))});
        }
    }
    return {files, conflicts, binaryConflicts};
};

export const unresolvedBinaryConflict = session => (
    session.binaryConflicts.find(file => !file.choice) || null
);

export const resolvedMergeFiles = session => {
    const files = new Map(session.files);
    for (const file of session.conflicts) files.set(file.path, new TextEncoder().encode(file.content));
    for (const file of session.binaryConflicts) {
        const useSource = file.choice === 'source';
        const deleted = useSource ? file.theirsDeleted : file.oursDeleted;
        const content = useSource ? file.theirs : file.ours;
        if (deleted) files.delete(file.path);
        else files.set(file.path, decodeBase64(content));
    }
    return files;
};

export const withTextResolution = (session, path, content) => ({
    ...session,
    conflicts: session.conflicts.map(file => (file.path === path ? {...file, content} : file))
});

export const withBinaryChoice = (session, path, choice) => ({
    ...session,
    binaryConflicts: session.binaryConflicts.map(file => (file.path === path ? {...file, choice} : file))
});
