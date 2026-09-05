import Emitter from './emitter.js';
import {SNAPSHOT, makeSnapshot} from './protocol.js';

const CHUNK_SIZE = 64 * 1024;
const SEND_WINDOW = 4;
const RECEIVE_TIMEOUT_MS = 60 * 1000;

const toArrayBuffer = data => {
    if (data instanceof ArrayBuffer) return data;
    if (ArrayBuffer.isView(data)) {
        return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
    }
    throw new Error('snapshot data must be binary');
};

/**
 * Host side of project onboarding: streams the serialized project (.sb3
 * bytes) to a newly approved client in acked 64KB chunks with a small
 * sliding window for backpressure. Transfers are fully independent per
 * client — any number of joiners can onboard concurrently.
 *
 * Events:
 *  - 'upload-start' ({peerId})
 *  - 'upload-progress' ({peerId, sent, total})
 *  - 'upload-complete' ({peerId})
 *  - 'upload-error' ({peerId, error})
 */
class HostSnapshotService extends Emitter {
    /**
     * @param {object} options Options.
     * @param {HostSession} options.session The host session.
     * @param {Transport} options.transport The transport.
     * @param {Function} options.getProjectData Async () => ArrayBuffer of
     * the serialized project. Called once per transfer.
     */
    constructor ({session, transport, getProjectData, getTargetIds, getExtensions}) {
        super();
        this.session = session;
        this.transport = transport;
        this.getProjectData = getProjectData;
        // Optional () => [{id, name, isStage}] captured with the snapshot
        // so receivers can adopt our target ids (sb3 does not keep them).
        this.getTargetIds = getTargetIds || null;
        // Optional () => [{id, url?}]: every loaded extension, including
        // ones with no blocks in the project (sb3 drops those).
        this.getExtensions = getExtensions || null;
        this._transfers = new Map(); // peerId -> transfer state
        this._transferCounter = 0;
        this._capture = null;

        this._onSnapshotNeeded = ({peerId}) => {
            this.startTransfer(peerId);
        };
        this._onSnapshotMessage = (peerId, envelope) => {
            if (envelope.type === SNAPSHOT.ACK) {
                this._onAck(peerId, envelope.payload);
            } else if (envelope.type === SNAPSHOT.REQUEST) {
                this.startTransfer(peerId);
            }
        };
        this._onUserLeft = user => {
            this._transfers.delete(user.id);
        };
        session.on('snapshot-needed', this._onSnapshotNeeded);
        session.on('snapshot-message', this._onSnapshotMessage);
        session.on('user-left', this._onUserLeft);
    }

    destroy () {
        this.session.off('snapshot-needed', this._onSnapshotNeeded);
        this.session.off('snapshot-message', this._onSnapshotMessage);
        this.session.off('user-left', this._onUserLeft);
        this._transfers.clear();
        this.removeAllListeners();
    }

    /**
     * Begin (or restart) streaming the project to one client.
     * @param {string} peerId Destination client.
     * @returns {Promise<void>} Resolves once the transfer has started.
     */
    async startTransfer (peerId) {
        this._transferCounter++;
        const transferId = `snapshot-${this._transferCounter}`;
        // Claim the slot first so a re-request supersedes an older transfer.
        this._transfers.set(peerId, {transferId, starting: true});
        this.emit('upload-start', {peerId});

        let buffer;
        let atSeq;
        let targetIds;
        let extensions;
        try {
            // Capture the sequence number BEFORE serializing: ops that land
            // during serialization are not in the snapshot, and the client
            // replays everything after atSeq, so it must not skip them.
            // Joiners arriving during the same serialization share its bytes
            // and base sequence. Each still has its own acknowledgements.
            if (!this._capture) {
                const capture = {};
                const take = async () => {
                    capture.atSeq = this.session.seq;
                    capture.targetIds = this.getTargetIds ? this.getTargetIds() : null;
                    capture.extensions = this.getExtensions ? this.getExtensions() : null;
                    return toArrayBuffer(await this.getProjectData());
                };
                capture.promise = this.session.queue ? this.session.queue.run(take) : take();
                this._capture = capture;
                capture.promise.finally(() => {
                    if (this._capture === capture) this._capture = null;
                }).catch(() => {});
            }
            const capture = this._capture;
            buffer = await capture.promise;
            atSeq = capture.atSeq;
            targetIds = capture.targetIds;
            extensions = capture.extensions;
        } catch (error) {
            if (this._transfers.get(peerId)?.transferId !== transferId) return;
            this._transfers.delete(peerId);
            this.emit('upload-error', {peerId, error});
            return;
        }

        const current = this._transfers.get(peerId);
        if (!current || current.transferId !== transferId) return; // superseded

        const chunkCount = Math.max(1, Math.ceil(buffer.byteLength / CHUNK_SIZE));
        const transfer = {
            transferId,
            buffer,
            chunkCount,
            nextIndex: 0,
            ackedCount: 0,
            acked: new Set()
        };
        this._transfers.set(peerId, transfer);

        const beginPayload = {
            transferId,
            totalBytes: buffer.byteLength,
            chunkCount,
            atSeq
        };
        if (targetIds) beginPayload.targetIds = targetIds;
        if (extensions) beginPayload.extensions = extensions;
        this.transport.send(peerId, makeSnapshot(SNAPSHOT.BEGIN, beginPayload));
        for (let i = 0; i < SEND_WINDOW; i++) {
            this._sendNextChunk(peerId, transfer);
        }
    }

    _sendNextChunk (peerId, transfer) {
        if (transfer.nextIndex >= transfer.chunkCount) return;
        const index = transfer.nextIndex++;
        const start = index * CHUNK_SIZE;
        const data = transfer.buffer.slice(start, Math.min(start + CHUNK_SIZE, transfer.buffer.byteLength));
        this.transport.send(peerId, makeSnapshot(SNAPSHOT.CHUNK, {
            transferId: transfer.transferId,
            index,
            data
        }));
    }

    _onAck (peerId, {transferId, index}) {
        const transfer = this._transfers.get(peerId);
        if (!transfer || transfer.transferId !== transferId || transfer.starting) return;
        if (!Number.isInteger(index) || index < 0 || index >= transfer.nextIndex || transfer.acked.has(index)) return;
        transfer.acked.add(index);
        transfer.ackedCount++;
        this.emit('upload-progress', {
            peerId,
            sent: Math.min(transfer.ackedCount * CHUNK_SIZE, transfer.buffer.byteLength),
            total: transfer.buffer.byteLength
        });
        if (transfer.ackedCount >= transfer.chunkCount) {
            this._transfers.delete(peerId);
            this.emit('upload-complete', {peerId});
            return;
        }
        this._sendNextChunk(peerId, transfer);
    }
}

/**
 * Client side of project onboarding: reassembles the streamed snapshot,
 * loads it into the local document, then unblocks the session's ordered
 * op stream at the snapshot's sequence number.
 *
 * Events:
 *  - 'download-start' ({totalBytes})
 *  - 'download-progress' ({loaded, total})
 *  - 'download-complete' ()
 *  - 'download-error' ({error})
 */
class ClientSnapshotService extends Emitter {
    /**
     * @param {object} options Options.
     * @param {ClientSession} options.session The client session.
     * @param {Transport} options.transport The transport.
     * @param {Function} options.applyProjectData Async (ArrayBuffer) =>
     * loads the project into the local document.
     */
    constructor ({session, transport, applyProjectData, remapTargetIds, loadExtensions}) {
        super();
        this.session = session;
        this.transport = transport;
        this.applyProjectData = applyProjectData;
        // Optional (targetIds) => void, adopts the host's target ids after
        // the loaded sb3 regenerated them.
        this.remapTargetIds = remapTargetIds || null;
        // Optional async ([{id, url?}]) => void, matches our loaded
        // extensions to the host's.
        this.loadExtensions = loadExtensions || null;
        this._incoming = null;
        this._timeout = null;

        this._onSnapshotMessage = envelope => {
            if (envelope.type === SNAPSHOT.BEGIN) {
                this._onBegin(envelope.payload);
            } else if (envelope.type === SNAPSHOT.CHUNK) {
                this._onChunk(envelope.payload);
            }
        };
        this._onResyncNeeded = () => {
            this.requestResync();
        };
        session.on('snapshot-message', this._onSnapshotMessage);
        session.on('resync-needed', this._onResyncNeeded);
        this._destroyed = false;
        this._generation = 0;
        this._attempts = 0;
        this._loadChain = Promise.resolve();
        this._onApproved = () => {
            if (session.lastAppliedSeq === null) this._armTimeout();
        };
        session.on('join-approved', this._onApproved);
    }

    destroy () {
        this._destroyed = true;
        this._generation++;
        this.session.off('join-approved', this._onApproved);
        this.session.off('snapshot-message', this._onSnapshotMessage);
        this.session.off('resync-needed', this._onResyncNeeded);
        this._clearTimeout();
        this._incoming = null;
        this.removeAllListeners();
    }

    /**
     * Ask the host for a fresh snapshot and drop local ordering state.
     * Used both when the session detects it cannot catch up and when the
     * host explicitly demands a resync.
     */
    requestResync () {
        if (this._destroyed) return;
        this._generation++;
        this._incoming = null;
        this.session.beginResync();
        this._armTimeout();
        this.transport.sendToHost(makeSnapshot(SNAPSHOT.REQUEST, {}));
    }

    _onBegin ({transferId, totalBytes, chunkCount, atSeq, targetIds, extensions}) {
        this._generation++;
        this._incoming = {
            generation: this._generation,
            transferId,
            totalBytes,
            chunkCount,
            atSeq,
            targetIds: targetIds || null,
            extensions: extensions || null,
            chunks: new Array(chunkCount),
            receivedCount: 0,
            receivedBytes: 0
        };
        this._armTimeout();
        this.emit('download-start', {totalBytes});
    }

    _onChunk ({transferId, index, data}) {
        const incoming = this._incoming;
        if (!incoming || incoming.transferId !== transferId) return;
        if (index >= incoming.chunkCount || incoming.chunks[index]) return;

        incoming.chunks[index] = toArrayBuffer(data);
        incoming.receivedCount++;
        incoming.receivedBytes += incoming.chunks[index].byteLength;
        this._armTimeout();

        this.transport.sendToHost(makeSnapshot(SNAPSHOT.ACK, {transferId, index}));
        this.emit('download-progress', {
            loaded: incoming.receivedBytes,
            total: incoming.totalBytes
        });

        if (incoming.receivedCount === incoming.chunkCount) {
            this._incoming = null;
            this._clearTimeout();
            this._loadChain = this._loadChain.then(() => this._finish(incoming)).catch(error => {
                if (!this._destroyed) this._fail(error);
            });
        }
    }

    async _finish (incoming) {
        const active = () => !this._destroyed && incoming.generation === this._generation;
        if (!active()) return;
        if (this.session.queue) await this.session.queue.tail;
        if (this.session.applier && this.session.applier.queue) await this.session.applier.queue.tail;
        if (!active()) return;

        const combined = new Uint8Array(incoming.receivedBytes);
        let offset = 0;
        incoming.chunks.forEach(chunk => {
            combined.set(new Uint8Array(chunk), offset);
            offset += chunk.byteLength;
        });
        if (combined.byteLength !== incoming.totalBytes) {
            const error = new Error(
                `snapshot size mismatch: expected ${incoming.totalBytes}, got ${combined.byteLength}`);
            this._fail(error);
            return;
        }

        this.emit('download-complete');

        try {
            await this.applyProjectData(combined.buffer, active);
            if (!active()) return;
        } catch (error) {
            this._fail(error);
            return;
        }

        // Adopt the host's target ids BEFORE any queued ops replay, so op
        // targetIds resolve identically on every peer.
        if (incoming.targetIds && this.remapTargetIds) {
            try {
                await this.remapTargetIds(incoming.targetIds, active);
                if (!active()) return;
            } catch (error) {
                this._fail(error);
                return;
            }
        }

        // Match the host's loaded extensions (the sb3 only carries the
        // ones with blocks in use) before ops that may need them replay.
        if (incoming.extensions && this.loadExtensions) {
            try {
                await this.loadExtensions(incoming.extensions);
                if (!active()) return;
            } catch (error) {
                this._fail(error);
                return;
            }
        }

        if (!active()) return;
        this._attempts = 0;
        this.session.setBaseSeq(incoming.atSeq);
        this.transport.sendToHost(makeSnapshot(SNAPSHOT.COMPLETE, {
            transferId: incoming.transferId
        }));
    }

    _fail (error) {
        if (this._destroyed) return;
        this.emit('download-error', {error});
        if (++this._attempts >= 3) {
            this.session.emit('connection-failed', {error: error.message || 'Could not load collaboration project'});
        } else this.requestResync();
    }

    _armTimeout () {
        this._clearTimeout();
        this._timeout = setTimeout(() => {
            const error = new Error('snapshot transfer stalled');
            this._incoming = null;
            this._fail(error);
        }, RECEIVE_TIMEOUT_MS);
    }

    _clearTimeout () {
        if (this._timeout) {
            clearTimeout(this._timeout);
            this._timeout = null;
        }
    }
}

export {
    HostSnapshotService,
    ClientSnapshotService,
    CHUNK_SIZE,
    SEND_WINDOW
};
