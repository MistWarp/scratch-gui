import Emitter from './emitter.js';
import {encodeFrames, FrameDecoder, bytesToBase64, base64ToBytes} from './wire.js';

const RAW_SERIALIZATION = 'raw';
const LEGACY_SERIALIZATION = 'binary';
const RELAY_MARK = 'mw-relay-1';
// Used when the browser does not report the SCTP message limit.
const DEFAULT_FRAME_LIMIT = 16 * 1024;
// Large frames hold up everything queued behind them on an ordered channel.
const MAX_FRAME_LIMIT = 128 * 1024;
const RELAY_FRAME_LIMIT = 96 * 1024;

/**
 * One ordered, reliable path between two peers. Transport only talks to
 * links, so a direct WebRTC channel and the broker relay are
 * interchangeable.
 *
 * Events:
 *  - 'open' ()
 *  - 'message' (envelope) — decoded, not yet validated
 *  - 'frame-error' (error) — a frame could not be decoded
 *  - 'close' () — emitted once, whoever closed it
 */
class Link extends Emitter {
    constructor (peerId, metadata, path) {
        super();
        this.peer = peerId;
        this.metadata = metadata || {};
        this.path = path;
        this._decoder = new FrameDecoder();
        this._down = false;
    }

    _decode (frame) {
        if (this._down) return;
        let envelope;
        try {
            envelope = this._decoder.push(frame);
        } catch (error) {
            this.emit('frame-error', error);
            return;
        }
        if (envelope !== null) this.emit('message', envelope);
    }

    _markDown () {
        if (this._down) return;
        this._down = true;
        this._decoder.reset();
        this.emit('close');
    }
}

const frameLimitFor = conn => {
    const transport = conn.peerConnection && conn.peerConnection.sctp;
    const max = transport && transport.maxMessageSize;
    if (typeof max !== 'number' || !(max > 0)) return DEFAULT_FRAME_LIMIT;
    return Math.min(max, MAX_FRAME_LIMIT);
};

/**
 * A PeerJS data channel. New peers use raw serialization and our own
 * frames; a channel from an older client keeps PeerJS serialization so it
 * can still be told about the version mismatch.
 */
class DirectLink extends Link {
    constructor (conn) {
        super(conn.peer, conn.metadata, 'direct');
        this.conn = conn;
        this.legacy = conn.serialization !== RAW_SERIALIZATION;
        this._frameLimit = 0;
        conn.on('open', () => {
            if (!this._down) this.emit('open');
        });
        conn.on('data', data => {
            if (this._down) return;
            if (this.legacy) this.emit('message', data);
            else this._decode(data);
        });
        conn.on('close', () => this._markDown());
        conn.on('error', () => this._markDown());
    }

    get open () {
        return !this._down && Boolean(this.conn.open);
    }

    send (envelope) {
        if (!this.open) return false;
        try {
            if (this.legacy) {
                this.conn.send(envelope);
            } else {
                if (!this._frameLimit) this._frameLimit = frameLimitFor(this.conn);
                const frames = encodeFrames(envelope, this._frameLimit);
                for (const frame of frames) this.conn.send(frame);
            }
        } catch (error) {
            return false;
        }
        return this.open;
    }

    bufferedAmount () {
        const channel = this.conn.dataChannel;
        return (channel ? channel.bufferedAmount : 0) + (this.conn.bufferSize || 0);
    }

    close () {
        try {
            this.conn.close();
        } catch (error) {
            // A failed channel may already be closed.
        }
        this._markDown();
    }
}

/**
 * A path through the signalling server, for networks where WebRTC cannot
 * connect. Messages ride the broker's WebSocket as candidate messages
 * addressed to the other peer. Each direction numbers its frames, and a
 * gap closes the link, so a lost frame turns into a quick rejoin instead
 * of a silent hole in the op stream.
 */
class RelayLink extends Link {
    /**
     * @param {object} options Options.
     * @param {string} options.peerId The other peer.
     * @param {string} options.linkId Random id shared by both ends.
     * @param {object} [options.metadata] Join metadata (host side).
     * @param {Function} options.signal (message) => boolean, sends one relay
     * message to the other peer through the broker.
     * @param {Function} options.bufferedAmount () => bytes queued on the
     * broker socket.
     */
    constructor ({peerId, linkId, metadata, signal, bufferedAmount}) {
        super(peerId, metadata, 'relay');
        this.linkId = linkId;
        this._signal = signal;
        this._bufferedAmount = bufferedAmount;
        this._open = false;
        this._sent = 0;
        this._received = 0;
    }

    get open () {
        return this._open && !this._down;
    }

    /** Client side: ask the host to accept this link. */
    request () {
        if (!this._signal({op: 'open', link: this.linkId, meta: this.metadata})) this._markDown();
    }

    /** Host side: accept the link and start using it. */
    accept () {
        if (!this._signal({op: 'accept', link: this.linkId})) {
            this._markDown();
            return;
        }
        this.markOpen();
    }

    markOpen () {
        if (this._down || this._open) return;
        this._open = true;
        this.emit('open');
    }

    send (envelope) {
        if (!this.open) return false;
        let frames;
        try {
            frames = encodeFrames(envelope, RELAY_FRAME_LIMIT);
        } catch (error) {
            return false;
        }
        for (const frame of frames) {
            const message = typeof frame === 'string' ?
                {op: 'data', link: this.linkId, n: this._sent, t: 's', d: frame} :
                {op: 'data', link: this.linkId, n: this._sent, t: 'b', d: bytesToBase64(frame)};
            this._sent++;
            if (!this._signal(message)) {
                // Part of this message is lost, so the stream cannot continue.
                this._markDown();
                return false;
            }
        }
        return true;
    }

    /**
     * Handle a data message for this link from the broker.
     * @param {object} payload The relay payload.
     */
    receive (payload) {
        if (!this.open) return;
        if (payload.n !== this._received || typeof payload.d !== 'string') {
            this.close();
            return;
        }
        this._received++;
        let frame;
        try {
            frame = payload.t === 'b' ? base64ToBytes(payload.d) : payload.d;
        } catch (error) {
            this.close();
            return;
        }
        this._decode(frame);
    }

    bufferedAmount () {
        return this._bufferedAmount();
    }

    close () {
        if (this._down) return;
        this._signal({op: 'close', link: this.linkId});
        this._markDown();
    }

    /** The other end closed the link. */
    remoteClose () {
        this._markDown();
    }
}

export {
    LEGACY_SERIALIZATION,
    RAW_SERIALIZATION,
    RELAY_MARK,
    DEFAULT_FRAME_LIMIT,
    MAX_FRAME_LIMIT,
    RELAY_FRAME_LIMIT,
    DirectLink,
    RelayLink
};
