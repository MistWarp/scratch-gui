/**
 * The editor has two places that remember what can be undone: the
 * scratch-blocks workspace keeps block edits, and the restore-deletion reducer
 * keeps deleted sprites, costumes and sounds. Every entry in either place gets
 * a number from one counter, so undo can always take whichever action happened
 * last and the two behave as a single stack.
 */

const SEQUENCE = '_mwUndoSequence';

let lastSequence = 0;
let trackedWorkspace = null;
let pendingDeletionRestore = null;
const deletionListeners = new Set();
const blockEditListeners = new Set();

const nextUndoSequence = () => ++lastSequence;

const onDeletionRecorded = listener => {
    deletionListeners.add(listener);
    return () => deletionListeners.delete(listener);
};

const onBlockEdit = listener => {
    blockEditListeners.add(listener);
    return () => blockEditListeners.delete(listener);
};

const stampEvent = event => {
    if (event && event.recordUndo && !event[SEQUENCE]) {
        event[SEQUENCE] = nextUndoSequence();
        const targetId = trackedWorkspace ? trackedWorkspace._mwEditingTargetId || null : null;
        for (const listener of Array.from(blockEditListeners)) listener(targetId);
    }
};

const clearWorkspaceRedo = () => {
    if (trackedWorkspace && trackedWorkspace.redoStack_) {
        trackedWorkspace.redoStack_.length = 0;
    }
};

const topSequence = stack => {
    if (!stack || stack.length === 0) return null;
    return stack[stack.length - 1][SEQUENCE] || 0;
};

const untrackWorkspaceUndo = workspace => {
    if (!workspace || workspace !== trackedWorkspace) return;
    workspace.removeChangeListener(stampEvent);
    trackedWorkspace = null;
};

/**
 * Number every undoable event on the main workspace as it happens.
 * @param {object} workspace scratch-blocks main workspace
 */
const trackWorkspaceUndo = workspace => {
    if (!workspace || workspace === trackedWorkspace) return;
    untrackWorkspaceUndo(trackedWorkspace);
    trackedWorkspace = workspace;
    workspace.addChangeListener(stampEvent);
};

/**
 * Record a deletion as the newest action. Like any new action it discards
 * block edits that were undone and could otherwise be redone. That also means
 * a redone block edit can never be older than a deletion still in the history.
 * @returns {number} the deletion's place in the history
 */
const recordDeletion = () => {
    clearWorkspaceRedo();
    for (const listener of Array.from(deletionListeners)) listener();
    return nextUndoSequence();
};

/**
 * @param {?object} workspace scratch-blocks main workspace, if loaded
 * @param {?object} deletion latest restorable deletion, if any
 * @param {?object} code latest undoable code apply, if any
 * @returns {?string} 'code', 'deletion', 'blocks' or null when there is nothing to undo
 */
const nextUndoSource = (workspace, deletion, code) => {
    const blocks = topSequence(workspace && workspace.undoStack_);
    const hasDeletion = !!deletion && typeof deletion.restoreFun === 'function';
    const deletionSequence = hasDeletion ? (deletion.sequence || 0) : null;
    const codeSequence = code && typeof code.sequence === 'number' ? code.sequence : null;
    if (codeSequence !== null && (blocks === null || codeSequence > blocks) &&
        (deletionSequence === null || codeSequence > deletionSequence)) {
        return 'code';
    }
    if (hasDeletion && (blocks === null || deletionSequence > blocks)) return 'deletion';
    if (blocks !== null) return 'blocks';
    // Some workspaces (and test doubles) do not expose their stack. Let the
    // workspace decide whether it has anything to undo.
    if (workspace && !workspace.undoStack_) return 'blocks';
    return null;
};

/**
 * Undo the most recent action, whether it was a block edit or a deletion.
 * Presses made while a deletion is being restored share that restore instead
 * of reaching further back in the history.
 * @param {object} options what to undo and how to report the result
 * @param {?object} options.workspace scratch-blocks main workspace, if loaded
 * @param {?object} options.deletion latest restorable deletion, if any
 * @param {?object} options.code latest code apply, as {sequence, undo}
 * @param {function} options.onRestored called with the restored deletion's restoreFun
 * @param {function} options.onRestoreError called when restoring fails
 * @returns {Promise<boolean>} whether anything was undone
 */
const undoLatest = ({workspace, deletion, code, onRestored, onRestoreError}) => {
    if (pendingDeletionRestore) return pendingDeletionRestore;
    const source = nextUndoSource(workspace, deletion, code);
    if (source === 'code') return Promise.resolve(code.undo());
    if (source === 'blocks') {
        workspace.undo(false);
        return Promise.resolve(true);
    }
    if (source !== 'deletion') return Promise.resolve(false);

    const restore = deletion.restoreFun;
    pendingDeletionRestore = Promise.resolve()
        .then(() => restore())
        .then(() => {
            onRestored(restore);
            return true;
        })
        .catch(() => {
            onRestoreError();
            return false;
        })
        .then(result => {
            pendingDeletionRestore = null;
            return result;
        });
    return pendingDeletionRestore;
};

export {
    clearWorkspaceRedo,
    nextUndoSequence,
    nextUndoSource,
    onBlockEdit,
    onDeletionRecorded,
    recordDeletion,
    trackWorkspaceUndo,
    undoLatest,
    untrackWorkspaceUndo
};
