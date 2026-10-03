/**
 * Wire format for collaboration links.
 *
 * Envelopes without binary fields travel as JSON text. Envelopes with
 * binary payload fields (snapshot and asset chunks) travel as one binary
 * body: a 4-byte header length, the JSON header, then the raw bytes. A
 * body larger than the link's frame limit is split into parts, which the
 * receiver joins in order. Links are ordered, so parts need no ids.
 *
 * Encoding and decoding are synchronous, so messages surface in exactly
 * the order they were sent.
 */

const FRAME = {
    BINARY: 1,
    TEXT: 2,
    PART: 16,
    LAST_BINARY: 17,
    LAST_TEXT: 18
};

// A string is at most 3 UTF-8 bytes per UTF-16 unit.
const MAX_UTF8_PER_CHAR = 3;
const MAX_MESSAGE_BYTES = 64 * 1024 * 1024;

const encoder = new TextEncoder();
const decoder = new TextDecoder();

const isBinary = value => value instanceof ArrayBuffer || ArrayBuffer.isView(value);

const toBytes = value => (value instanceof ArrayBuffer ?
    new Uint8Array(value) :
    new Uint8Array(value.buffer, value.byteOffset, value.byteLength));

/**
 * @param {object} envelope Protocol envelope.
 * @returns {string|Uint8Array} JSON text, or a binary body.
 */
const encodeMessage = envelope => {
    const payload = envelope && envelope.payload;
    const binaryKeys = payload && typeof payload === 'object' ?
        Object.keys(payload).filter(key => isBinary(payload[key])) : [];
    if (binaryKeys.length === 0) return JSON.stringify(envelope);

    const headerPayload = Object.assign({}, payload);
    const parts = binaryKeys.map(key => {
        delete headerPayload[key];
        return toBytes(payload[key]);
    });
    const header = Object.assign({}, envelope, {payload: headerPayload});
    header.$bin = binaryKeys.map((key, index) => [key, parts[index].byteLength]);
    const headerBytes = encoder.encode(JSON.stringify(header));
    const total = parts.reduce((sum, part) => sum + part.byteLength, 4 + headerBytes.byteLength);
    const body = new Uint8Array(total);
    new DataView(body.buffer).setUint32(0, headerBytes.byteLength);
    body.set(headerBytes, 4);
    let offset = 4 + headerBytes.byteLength;
    parts.forEach(part => {
        body.set(part, offset);
        offset += part.byteLength;
    });
    return body;
};

const decodeText = text => JSON.parse(text);

const decodeBinary = body => {
    if (body.byteLength < 4) throw new Error('binary message is too short');
    const view = new DataView(body.buffer, body.byteOffset, body.byteLength);
    const headerLength = view.getUint32(0);
    if (4 + headerLength > body.byteLength) throw new Error('binary message header is truncated');
    const header = JSON.parse(decoder.decode(body.subarray(4, 4 + headerLength)));
    const binary = header && header.$bin;
    if (!Array.isArray(binary) || !header.payload || typeof header.payload !== 'object') {
        throw new Error('binary message has no binary fields');
    }
    delete header.$bin;
    let offset = 4 + headerLength;
    binary.forEach(entry => {
        const [key, length] = Array.isArray(entry) ? entry : [];
        if (typeof key !== 'string' || !Number.isInteger(length) || length < 0 ||
            offset + length > body.byteLength || key === '__proto__') {
            throw new Error('binary message field is invalid');
        }
        const start = body.byteOffset + offset;
        header.payload[key] = body.buffer.slice(start, start + length);
        offset += length;
    });
    if (offset !== body.byteLength) throw new Error('binary message has trailing bytes');
    return header;
};

const withType = (type, bytes, start = 0, end = bytes.byteLength) => {
    const frame = new Uint8Array(1 + end - start);
    frame[0] = type;
    frame.set(bytes.subarray(start, end), 1);
    return frame.buffer;
};

/**
 * Split an envelope into frames no larger than a link allows.
 * @param {object} envelope Protocol envelope.
 * @param {number} frameLimit Largest frame the link can carry, in bytes.
 * @returns {Array.<string|ArrayBuffer>} Frames to send in order.
 */
const encodeFrames = (envelope, frameLimit) => {
    const message = encodeMessage(envelope);
    if (typeof message === 'string' && message.length * MAX_UTF8_PER_CHAR <= frameLimit) return [message];
    const text = typeof message === 'string';
    const bytes = text ? encoder.encode(message) : message;
    if (text && bytes.byteLength <= frameLimit) return [message];
    if (bytes.byteLength + 1 <= frameLimit) return [withType(text ? FRAME.TEXT : FRAME.BINARY, bytes)];
    const partSize = frameLimit - 1;
    const frames = [];
    for (let start = 0; start < bytes.byteLength; start += partSize) {
        const end = Math.min(start + partSize, bytes.byteLength);
        const last = end === bytes.byteLength;
        const type = last ? (text ? FRAME.LAST_TEXT : FRAME.LAST_BINARY) : FRAME.PART;
        frames.push(withType(type, bytes, start, end));
    }
    return frames;
};

/**
 * Joins frames back into envelopes. One per link direction.
 */
class FrameDecoder {
    constructor () {
        this._parts = [];
        this._partBytes = 0;
    }

    /**
     * @param {string|ArrayBuffer|ArrayBufferView} frame An inbound frame.
     * @returns {object|null} The decoded envelope, or null while a split
     * message is still arriving.
     * @throws {Error} When the frame is malformed.
     */
    push (frame) {
        if (typeof frame === 'string') return decodeText(frame);
        if (!isBinary(frame)) throw new Error('frame is neither text nor binary');
        const bytes = toBytes(frame);
        if (bytes.byteLength === 0) throw new Error('empty frame');
        const type = bytes[0];
        const body = bytes.subarray(1);
        switch (type) {
        case FRAME.BINARY:
            return decodeBinary(body);
        case FRAME.TEXT:
            return decodeText(decoder.decode(body));
        case FRAME.PART:
            this._append(body);
            return null;
        case FRAME.LAST_BINARY:
        case FRAME.LAST_TEXT: {
            this._append(body);
            const joined = this._join();
            return type === FRAME.LAST_TEXT ? decodeText(decoder.decode(joined)) : decodeBinary(joined);
        }
        default:
            throw new Error(`unknown frame type ${type}`);
        }
    }

    reset () {
        this._parts = [];
        this._partBytes = 0;
    }

    _append (body) {
        this._partBytes += body.byteLength;
        if (this._partBytes > MAX_MESSAGE_BYTES) {
            this.reset();
            throw new Error('split message is too large');
        }
        this._parts.push(body.slice());
    }

    _join () {
        const joined = new Uint8Array(this._partBytes);
        let offset = 0;
        this._parts.forEach(part => {
            joined.set(part, offset);
            offset += part.byteLength;
        });
        this.reset();
        return joined;
    }
}

const BASE64_SLICE = 0x8000;

const bytesToBase64 = buffer => {
    const bytes = toBytes(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i += BASE64_SLICE) {
        binary += String.fromCharCode.apply(null, bytes.subarray(i, i + BASE64_SLICE));
    }
    return btoa(binary);
};

const base64ToBytes = text => {
    const binary = atob(text);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes.buffer;
};

export {
    FRAME,
    MAX_MESSAGE_BYTES,
    encodeMessage,
    encodeFrames,
    FrameDecoder,
    bytesToBase64,
    base64ToBytes
};
