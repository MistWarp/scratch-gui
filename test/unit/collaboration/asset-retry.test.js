import AssetChannel from '../../../src/lib/collaboration/assets.js';
import Emitter from '../../../src/lib/collaboration/emitter.js';
import {ASSET, makeAsset} from '../../../src/lib/collaboration/protocol.js';

const MD5 = '0123456789abcdef0123456789abcdef.png';

const makeClient = () => {
    const session = new Emitter();
    session.isApproved = true;
    const sent = [];
    const transport = {
        open: true,
        sendToHost: envelope => {
            if (!transport.open) return false;
            sent.push(envelope);
            return true;
        },
        send: () => false,
        bufferedAmount: () => 0
    };
    const channel = new AssetChannel({
        isHost: false,
        session,
        transport,
        getAsset: () => null,
        storeAsset: () => Promise.resolve()
    });
    const failed = jest.fn();
    session.on('connection-failed', failed);
    const requests = () => sent.filter(envelope => envelope.type === ASSET.REQUEST);
    return {session, transport, channel, failed, requests};
};

// The host link drops and the session waits to be let back in.
const loseHost = ({session, transport}) => {
    session.isApproved = false;
    transport.open = false;
};
const readmit = ({session, transport}) => {
    transport.open = true;
    session.isApproved = true;
    session.emit('join-approved', {});
};

describe('asset requests across reconnects', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    test('a long reconnect does not use up the download retries', () => {
        const client = makeClient();
        client.channel.requestFromHost([MD5]);
        loseHost(client);
        jest.advanceTimersByTime(5 * 60 * 1000);
        expect(client.failed).not.toHaveBeenCalled();

        readmit(client);
        // Asked again as soon as the host lets us back in.
        expect(client.requests()).toHaveLength(2);
        expect(client.requests()[1].payload.md5exts).toEqual([MD5]);
        jest.advanceTimersByTime(20000);
        expect(client.failed).not.toHaveBeenCalled();
        jest.advanceTimersByTime(20000);
        expect(client.failed).toHaveBeenCalledTimes(1);
        client.channel.destroy();
    });

    test('a request the host never answers still fails eventually', () => {
        const client = makeClient();
        client.channel.requestFromHost([MD5]);
        jest.advanceTimersByTime(40000);
        expect(client.failed).toHaveBeenCalledTimes(1);
        client.channel.destroy();
    });

    test('a restarted host is not asked for assets from before the restart', () => {
        const client = makeClient();
        client.channel.requestFromHost([MD5]);
        loseHost(client);
        client.session.emit('host-restarted');
        readmit(client);
        expect(client.requests()).toHaveLength(1);
        jest.advanceTimersByTime(60000);
        expect(client.failed).not.toHaveBeenCalled();
        // Needed again after the restart: asked afresh.
        client.channel.requestFromHost([MD5]);
        expect(client.requests()).toHaveLength(2);
        client.channel.destroy();
    });
});

describe('abandoned incoming transfers', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    test('transfers from senders that went away do not block new ones', async () => {
        const session = new Emitter();
        const stored = jest.fn(() => Promise.resolve());
        const channel = new AssetChannel({
            isHost: true,
            session,
            transport: {send: () => true, sendToHost: () => false, bufferedAmount: () => 0},
            getAsset: () => null,
            storeAsset: stored
        });
        const md5 = index => `${index.toString(16).padStart(32, '0')}.png`;
        // 64 guests each drop out after the first of two chunks.
        for (let i = 0; i < 64; i++) {
            const peerId = `gone-${i}`;
            session.emit('asset-message', peerId, makeAsset(ASSET.BEGIN, {md5ext: md5(i), totalBytes: 2, chunkCount: 2}));
            session.emit('asset-message', peerId, makeAsset(ASSET.CHUNK, {
                md5ext: md5(i), index: 0, data: new Uint8Array([1]).buffer
            }));
        }
        jest.advanceTimersByTime(60000);

        const fresh = md5(100);
        session.emit('asset-message', 'guest', makeAsset(ASSET.BEGIN, {md5ext: fresh, totalBytes: 1, chunkCount: 1}));
        session.emit('asset-message', 'guest', makeAsset(ASSET.CHUNK, {
            md5ext: fresh, index: 0, data: new Uint8Array([7]).buffer
        }));
        await Promise.resolve();
        expect(stored).toHaveBeenCalledWith(fresh, new Uint8Array([7]));
        channel.destroy();
    });
});
