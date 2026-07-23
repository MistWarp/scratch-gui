import Emitter from './emitter.js';
import {ASSET, makeAsset} from './protocol.js';

const CHUNK_SIZE = 64 * 1024;

// Ops, presence and asset bytes share one ordered data channel, so anything
// queued ahead of an op delays it. Stop feeding chunks once this much is
// already waiting: the transfer still uses the whole link, but a block edit
// made mid-transfer waits for a small backlog instead of the entire asset.
const MAX_BUFFERED_BYTES = 128 * 1024;
const DRAIN_POLL_MS = 50;

const toArrayBuffer = data => {
    if (data instanceof ArrayBuffer) return data;
    if (ArrayBuffer.isView(data)) {
        return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
    }
    throw new Error('asset data must be binary');
};

/**
 * Content-addressed asset transfer channel. Ops never carry asset bytes —
 * only `assetRefs` (md5ext strings). The bytes travel here:
 *
 *  - The originator of an asset-bearing op pushes the bytes to the host
 *    BEFORE sending the proposal. The data channel is ordered, so the
 *    host always has the asset when the op arrives.
 *  - Every other client hits the op, finds the asset missing, blocks its
 *    apply queue (client-session) and requests the bytes from the host,
 *    which serves them from local storage.
 *
 * Events:
 *  - 'asset-received' (md5ext) — an asset was stored locally
 *  - 'asset-unavailable' ({peerId, md5ext}) — host could not serve a request
 */
class AssetChannel extends Emitter {
    /**
     * @param {object} options Options.
     * @param {boolean} options.isHost Host or client role.
     * @param {HostSession|ClientSession} options.session The session.
     * @param {Transport} options.transport The transport.
     * @param {Function} options.getAsset (md5ext) => ArrayBuffer|Uint8Array|null.
     * @param {Function} options.storeAsset Async (md5ext, Uint8Array) => void.
     */
    constructor ({isHost, session, transport, getAsset, storeAsset}) {
        super();
        this.isHost = isHost;
        this.session = session;
        this.transport = transport;
        this.getAsset = getAsset;
        this.storeAsset = storeAsset;
        this._incoming = new Map(); // `${peerId}:${md5ext}` -> receive state
        this._requestedFromHost = new Set();
        this._pendingServes = new Map(); // md5ext -> Set of peerIds waiting for it
        this._destroyed = false;

        if (isHost) {
            this._onAssetMessage = (peerId, envelope) => this._onMessage(peerId, envelope);
        } else {
            this._onAssetMessage = envelope => this._onMessage('host', envelope);
        }
        session.on('asset-message', this._onAssetMessage);
    }

    destroy () {
        this._destroyed = true;
        this.session.off('asset-message', this._onAssetMessage);
        this._incoming.clear();
        this._requestedFromHost.clear();
        this._pendingServes.clear();
        this.removeAllListeners();
    }

    /**
     * Push an asset's bytes to a peer (client -> host before a proposal,
     * or host -> client when serving a request). Chunks are paced against
     * the channel backlog, so this resolves only once every chunk has been
     * handed to the transport.
     * @param {string} peerId Destination ('host' allowed on clients).
     * @param {string} md5ext Asset id.
     * @returns {Promise<boolean>} Whether the asset was found and sent.
     */
    async sendAsset (peerId, md5ext) {
        const raw = this.getAsset(md5ext);
        if (!raw) return false;
        const buffer = toArrayBuffer(raw);
        const chunkCount = Math.max(1, Math.ceil(buffer.byteLength / CHUNK_SIZE));

        const send = envelope => (
            peerId === 'host' ? this.transport.sendToHost(envelope) : this.transport.send(peerId, envelope)
        );
        send(makeAsset(ASSET.BEGIN, {md5ext, totalBytes: buffer.byteLength, chunkCount}));
        for (let index = 0; index < chunkCount; index++) {
            await this._waitForDrain(peerId);
            if (this._destroyed) return false;
            const start = index * CHUNK_SIZE;
            send(makeAsset(ASSET.CHUNK, {
                md5ext,
                index,
                data: buffer.slice(start, Math.min(start + CHUNK_SIZE, buffer.byteLength))
            }));
        }
        return true;
    }

    /**
     * Push every asset in a list, one at a time so concurrent transfers do
     * not defeat the pacing. Skipping already-sent ones is the caller's
     * concern. Used right before proposing an asset-bearing op.
     * @param {string} peerId Destination.
     * @param {Array.<string>} md5exts Assets to send.
     * @returns {Promise} Resolves once all of them are on the wire.
     */
    async sendAssets (peerId, md5exts) {
        for (const md5ext of md5exts) {
            await this.sendAsset(peerId, md5ext);
        }
    }

    _waitForDrain (peerId) {
        if (this.transport.bufferedAmount(peerId) < MAX_BUFFERED_BYTES) return Promise.resolve();
        return new Promise(resolve => {
            const check = () => {
                if (this._destroyed || this.transport.bufferedAmount(peerId) < MAX_BUFFERED_BYTES) {
                    resolve();
                    return;
                }
                setTimeout(check, DRAIN_POLL_MS);
            };
            setTimeout(check, DRAIN_POLL_MS);
        });
    }

    /**
     * Ask the host for missing assets (client only). De-duplicates
     * in-flight requests.
     * @param {Array.<string>} md5exts Missing assets.
     */
    requestFromHost (md5exts) {
        const wanted = md5exts.filter(md5ext => !this._requestedFromHost.has(md5ext));
        if (wanted.length === 0) return;
        wanted.forEach(md5ext => this._requestedFromHost.add(md5ext));
        this.transport.sendToHost(makeAsset(ASSET.REQUEST, {md5exts: wanted}));
    }

    _onMessage (peerId, envelope) {
        switch (envelope.type) {
        case ASSET.REQUEST: {
            if (!this.isHost) return;
            const {md5exts} = envelope.payload;
            md5exts.filter(md5ext => !this.getAsset(md5ext))
                .forEach(md5ext => {
                    if (!this._pendingServes.has(md5ext)) {
                        this._pendingServes.set(md5ext, new Set());
                    }
                    this._pendingServes.get(md5ext).add(peerId);
                    this.emit('asset-unavailable', {peerId, md5ext});
                });
            this.sendAssets(peerId, md5exts.filter(md5ext => this.getAsset(md5ext)));
            break;
        }
        case ASSET.BEGIN: {
            const {md5ext, totalBytes, chunkCount} = envelope.payload;
            this._incoming.set(`${peerId}:${md5ext}`, {
                md5ext,
                totalBytes,
                chunkCount,
                chunks: new Array(chunkCount),
                receivedCount: 0,
                receivedBytes: 0
            });
            break;
        }
        case ASSET.CHUNK: {
            const {md5ext, index, data} = envelope.payload;
            const key = `${peerId}:${md5ext}`;
            const incoming = this._incoming.get(key);
            if (!incoming || index >= incoming.chunkCount || incoming.chunks[index]) return;
            incoming.chunks[index] = toArrayBuffer(data);
            incoming.receivedCount++;
            incoming.receivedBytes += incoming.chunks[index].byteLength;
            if (incoming.receivedCount === incoming.chunkCount) {
                this._incoming.delete(key);
                this._finish(incoming);
            }
            break;
        }
        default:
            break;
        }
    }

    async _finish (incoming) {
        if (incoming.receivedBytes !== incoming.totalBytes) {
            return; // corrupt transfer; a re-request will replace it
        }
        const combined = new Uint8Array(incoming.receivedBytes);
        let offset = 0;
        incoming.chunks.forEach(chunk => {
            combined.set(new Uint8Array(chunk), offset);
            offset += chunk.byteLength;
        });
        try {
            await this.storeAsset(incoming.md5ext, combined);
        } catch (error) {
            this._requestedFromHost.delete(incoming.md5ext);
            return;
        }
        this._requestedFromHost.delete(incoming.md5ext);
        this.emit('asset-received', incoming.md5ext);

        const waiting = this._pendingServes.get(incoming.md5ext);
        if (waiting) {
            this._pendingServes.delete(incoming.md5ext);
            waiting.forEach(peerId => this.sendAsset(peerId, incoming.md5ext));
        }
    }
}

export default AssetChannel;
