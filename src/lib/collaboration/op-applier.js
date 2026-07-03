import {OP} from './protocol.js';

/**
 * Base class for applying sequenced operations to a document (the real VM
 * in production, a plain-JS doc in tests).
 *
 * Owns the remote-apply suppression scope: while `apply` runs, any change
 * events fired synchronously by the underlying document (e.g. Blockly
 * listeners reacting to a programmatic mutation) must not be captured as
 * new local ops. The capture layer consults `isApplyingRemote`. The depth
 * counter is scoped to the apply call and initialized here, by
 * construction — it can never leak or go NaN.
 */
class OpApplier {
    constructor () {
        this._remoteApplyDepth = 0;
    }

    get isApplyingRemote () {
        return this._remoteApplyDepth > 0;
    }

    /**
     * Run a function within the remote-apply suppression scope. Re-entrant.
     * @param {Function} fn The mutation to run.
     * @returns {*} The function's return value.
     */
    withRemoteApply (fn) {
        this._remoteApplyDepth++;
        try {
            return fn();
        } finally {
            this._remoteApplyDepth--;
        }
    }

    /**
     * Apply one sequenced operation.
     * @param {string} type Op type (protocol OP.*).
     * @param {object} payload Op payload.
     * @param {object} [meta] {clientId, seq} of the sequenced op.
     * @returns {*} Whatever the subclass's _apply returns.
     * @throws When the op is semantically invalid; the host turns this
     * into an op-reject, clients into a resync.
     */
    apply (type, payload, meta = {}) {
        return this.withRemoteApply(() => this._apply(type, payload, meta));
    }

    _apply (/* type, payload, meta */) {
        throw new Error('OpApplier subclass must implement _apply');
    }
}

/**
 * Compute the entity keys an op touches. Two ops conflict when they share
 * a key: after applying a remote op, the client re-asserts any of its own
 * unconfirmed (pending) ops that share a key with it, so every peer
 * converges on host order.
 *
 * Note the asymmetry for blocks: a field edit on block X keys as
 * `block:t:X:field:NAME` while a delete keys as `block:t:X`. A remote
 * delete therefore does NOT trigger re-assertion of a pending field edit —
 * re-applying an edit to a deleted block must be a no-op everywhere, which
 * appliers guarantee.
 * @param {string} type Op type.
 * @param {object} payload Op payload.
 * @returns {Array.<string>} Entity keys.
 */
const entityKeysForOp = (type, payload) => {
    switch (type) {
    case OP.BLOCK_EVENT: {
        const event = payload.event || {};
        const targetId = payload.targetId || '';
        const blockId = event.blockId || '';
        switch (event.type) {
        case 'change':
            return [`block:${targetId}:${blockId}:${event.element || ''}:${event.name || ''}`];
        case 'move':
        case 'dragOutside':
        case 'endDrag':
            return [`block:${targetId}:${blockId}:pos`];
        case 'var_create':
        case 'var_delete':
        case 'var_rename':
            return [`var:${event.varId || ''}`];
        case 'comment_create':
        case 'comment_delete':
        case 'comment_change':
        case 'comment_move':
            return [`comment:${targetId}:${event.commentId || ''}`];
        default:
            // create / delete / anything unknown: key on the whole block
            return [`block:${targetId}:${blockId}`];
        }
    }
    case OP.TARGET_UPDATE:
        return Object.keys(payload.props || {}).map(prop => `target:${payload.targetId}:${prop}`);
    case OP.SPRITE_ADD:
    case OP.SPRITE_DELETE:
    case OP.SPRITE_RENAME:
    case OP.SPRITE_REORDER:
        return [`sprite:${payload.targetId}`];
    case OP.COSTUME_ADD:
    case OP.COSTUME_DELETE:
    case OP.COSTUME_RENAME:
    case OP.COSTUME_SELECT:
    case OP.COSTUME_REORDER:
    case OP.COSTUME_DUPLICATE:
    case OP.COSTUME_UPDATE:
        return [`costumes:${payload.targetId}`];
    case OP.SOUND_ADD:
    case OP.SOUND_DELETE:
    case OP.SOUND_RENAME:
    case OP.SOUND_REORDER:
    case OP.SOUND_DUPLICATE:
    case OP.SOUND_UPDATE:
        return [`sounds:${payload.targetId}`];
    case OP.BLOCKS_SHARE:
        return [`sprite:${payload.targetId}`];
    case OP.EXTENSION_LOAD:
    case OP.EXTENSION_REMOVE:
    case OP.EXTENSION_REORDER:
        return ['extensions'];
    default:
        return [];
    }
};

export {
    OpApplier,
    entityKeysForOp
};
