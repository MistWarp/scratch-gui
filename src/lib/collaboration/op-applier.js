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

export {OpApplier};
