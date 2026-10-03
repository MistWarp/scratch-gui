import {
    encodeFrames,
    FrameDecoder,
    bytesToBase64,
    base64ToBytes
} from '../../../src/lib/collaboration/wire.js';
import {makeCtrl, makeSnapshot, makeOp, CTRL, SNAPSHOT, OP} from '../../../src/lib/collaboration/protocol.js';

const roundTrip = (envelope, limit = 64 * 1024) => {
    const decoder = new FrameDecoder();
    const frames = encodeFrames(envelope, limit);
    const decoded = frames.map(frame => decoder.push(frame));
    return {frames, decoded: decoded.filter(item => item !== null), pending: decoded.slice(0, -1)};
};

const bytes = (length, seed = 7) => {
    const out = new Uint8Array(length);
    for (let i = 0; i < length; i++) out[i] = (i * seed) % 256;
    return out;
};

// Jest's deep equality walks typed arrays element by element and is slow.
const sameBytes = (a, b) => Buffer.from(a).equals(Buffer.from(b));

describe('collaboration wire format', () => {
    test('small envelopes travel as one JSON string', () => {
        const envelope = makeCtrl(CTRL.USERNAME_CHANGE, {username: 'ann'});
        const {frames, decoded} = roundTrip(envelope);
        expect(frames).toHaveLength(1);
        expect(typeof frames[0]).toBe('string');
        expect(decoded).toEqual([envelope]);
    });

    test('binary payload fields come back as ArrayBuffers with the same bytes', () => {
        const data = bytes(1000);
        const envelope = makeSnapshot(SNAPSHOT.CHUNK, {transferId: 't', index: 3, data: data.subarray(10, 900)});
        const {frames, decoded} = roundTrip(envelope);
        expect(frames).toHaveLength(1);
        expect(frames[0]).toBeInstanceOf(ArrayBuffer);
        expect(decoded[0].payload.data).toBeInstanceOf(ArrayBuffer);
        expect(sameBytes(new Uint8Array(decoded[0].payload.data), data.subarray(10, 900))).toBe(true);
        expect(decoded[0].payload.index).toBe(3);
        expect(decoded[0]).not.toHaveProperty('$bin');
    });

    test('large binary messages are split and joined in order', () => {
        const data = bytes(200 * 1024, 13);
        const envelope = makeSnapshot(SNAPSHOT.CHUNK, {transferId: 't', index: 0, data: data.buffer});
        const {frames, decoded, pending} = roundTrip(envelope, 16 * 1024);
        expect(frames.length).toBeGreaterThan(12);
        frames.forEach(frame => expect(frame.byteLength).toBeLessThanOrEqual(16 * 1024));
        expect(pending.every(item => item === null)).toBe(true);
        expect(sameBytes(new Uint8Array(decoded[0].payload.data), data)).toBe(true);
    });

    test('large text messages with multi-byte characters are split and joined', () => {
        const xml = '<block>🧱 ünïcödé </block>'.repeat(4000);
        const envelope = makeOp(OP.VM_EDIT, {command: {method: 'blockEvent', args: [{xml}]}}, {
            seq: 1, clientId: 'a', clientOpId: 1
        });
        const {frames, decoded} = roundTrip(envelope, 16 * 1024);
        expect(frames.length).toBeGreaterThan(1);
        frames.forEach(frame => expect(frame.byteLength).toBeLessThanOrEqual(16 * 1024));
        expect(decoded).toEqual([envelope]);
    });

    test('a text message that only fits once encoded is still sent as text', () => {
        const envelope = makeCtrl(CTRL.USERNAME_CHANGE, {username: 'a'.repeat(9000)});
        const {frames, decoded} = roundTrip(envelope, 16 * 1024);
        expect(frames).toHaveLength(1);
        expect(typeof frames[0]).toBe('string');
        expect(decoded).toEqual([envelope]);
    });

    test('messages after a split message keep their order', () => {
        const decoder = new FrameDecoder();
        const big = makeSnapshot(SNAPSHOT.CHUNK, {transferId: 't', index: 0, data: bytes(50000).buffer});
        const small = makeCtrl(CTRL.SESSION_READY, {});
        const out = [];
        [...encodeFrames(big, 8192), ...encodeFrames(small, 8192)].forEach(frame => {
            const envelope = decoder.push(frame);
            if (envelope) out.push(envelope.type);
        });
        expect(out).toEqual([SNAPSHOT.CHUNK, CTRL.SESSION_READY]);
    });

    test('malformed frames throw instead of producing envelopes', () => {
        const decoder = new FrameDecoder();
        expect(() => decoder.push('not json')).toThrow();
        expect(() => decoder.push(new Uint8Array([99, 1, 2]).buffer)).toThrow();
        expect(() => decoder.push(new Uint8Array([1, 0, 0, 0, 200]).buffer)).toThrow();
        expect(() => decoder.push(new ArrayBuffer(0))).toThrow();
        expect(() => decoder.push(42)).toThrow();
        const header = new TextEncoder().encode(JSON.stringify({payload: {}, $bin: [['__proto__', 1]]}));
        const frame = new Uint8Array(1 + 4 + header.byteLength + 1);
        frame[0] = 1;
        new DataView(frame.buffer).setUint32(1, header.byteLength);
        frame.set(header, 5);
        expect(() => decoder.push(frame.buffer)).toThrow();
    });

    test('base64 helpers round trip binary frames', () => {
        const data = bytes(70000, 31);
        expect(sameBytes(new Uint8Array(base64ToBytes(bytesToBase64(data.buffer))), data)).toBe(true);
    });
});
