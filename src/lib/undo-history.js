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

const nextUndoSequence = () => ++lastSequence;

const stampEvent = event => {
    if (event && event.recordUndo && !event[SEQUENCE]) {
        event[SEQUENCE] = nextUndoSequence();
    }
};

const topSequence = stack => {
    if (!stack || stack.length === 0) return null;
    return stack[stack.length - 1][SEQUENCE] || 0;
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

const untrackWorkspaceUndo = workspace => {
    if (!workspace || workspace !== trackedWorkspace) return;
    workspace.removeChangeListener(stampEvent);
    trackedWorkspace = null;
};

/**
 * Record a deletion as the newest action. Like any new action it discards
 * block edits that were undone and could otherwise be redone. That also means
 * a redone block edit can never be older than a deletion still in the history.
 * @returns {number} the deletion's place in the history
 */
const recordDeletion = () => {
    if (trackedWorkspace && trackedWorkspace.redoStack_) {
        trackedWorkspace.redoStack_.length = 0;
    }
    return nextUndoSequence();
};

/**
 * @param {?object} workspace scratch-blocks main workspace, if loaded
 * @param {?object} deletion latest restorable deletion, if any
 * @returns {?string} 'deletion', 'blocks' or null when there is nothing to undo
 */
const nextUndoSource = (workspace, deletion) => {
    const blocks = topSequence(workspace && workspace.undoStack_);
    const hasDeletion = !!deletion && typeof deletion.restoreFun === 'function';
    if (hasDeletion && (blocks === null || (deletion.sequence || 0) > blocks)) return 'deletion';
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
 * @param {object} options
 * @param {?object} options.workspace scratch-blocks main workspace, if loaded
 * @param {?object} options.deletion latest restorable deletion, if any
 * @param {function} options.onRestored called with the restored deletion's restoreFun
 * @param {function} options.onRestoreError called when restoring fails
 * @returns {Promise<boolean>} whether anything was undone
 */
const undoLatest = ({workspace, deletion, onRestored, onRestoreError}) => {
    if (pendingDeletionRestore) return pendingDeletionRestore;
    const source = nextUndoSource(workspace, deletion);
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
    nextUndoSource,
    recordDeletion,
    trackWorkspaceUndo,
    undoLatest,
    untrackWorkspaceUndo
};
