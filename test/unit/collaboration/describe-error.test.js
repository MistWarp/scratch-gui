import {describeCollabError, isRetryableCollabError} from '../../../src/lib/collaboration/describe-error.js';
import AssetChannel, {ASSET_LINK_CLOSED} from '../../../src/lib/collaboration/assets.js';
import Emitter from '../../../src/lib/collaboration/emitter.js';

describe('describeCollabError', () => {
    test('names the room and says what to do', () => {
        expect(describeCollabError('ROOM_NOT_FOUND', 'raw', {roomId: 'cool-cat-001'}))
            .toBe('Nobody is hosting room "cool-cat-001" right now. ' +
                'Check the code, or ask the host for a new invite link.');
        expect(describeCollabError('ROOM_TAKEN', 'raw', {roomId: 'x'})).toMatch(/already in use\. Pick another/);
        expect(describeCollabError('SERVER_UNREACHABLE')).toMatch(/collaboration server/);
    });

    test('a dial timeout reads differently for hosts and guests', () => {
        expect(describeCollabError('DIAL_TIMEOUT', null, {hosting: true})).toMatch(/opening the room/);
        expect(describeCollabError('DIAL_TIMEOUT', null, {hosting: false})).toMatch(/connect to the host/);
    });

    test('unknown or missing codes keep the engine text', () => {
        expect(describeCollabError(null, 'The host did not answer.')).toBe('The host did not answer.');
        expect(describeCollabError('SOMETHING_NEW', 'Engine text')).toBe('Engine text');
        expect(describeCollabError(null)).toMatch(/connection failed/);
    });

    test('only failures that a retry can fix are retryable', () => {
        ['RECONNECT_FAILED', 'ROOM_NOT_FOUND', 'DIAL_TIMEOUT', 'SERVER_UNREACHABLE', 'NO_ANSWER',
            'SNAPSHOT_FAILED', 'ASSET_FAILED'].forEach(code => expect(isRetryableCollabError(code)).toBe(true));
        ['ROOM_TAKEN', 'HOST_GONE', null, 'CONNECTION_CANCELLED']
            .forEach(code => expect(isRetryableCollabError(code)).toBe(false));
    });
});

test('a send into a closed asset link fails with a code, not just a message', async () => {
    const channel = new AssetChannel({
        isHost: false,
        session: new Emitter(),
        transport: {sendToHost: () => false, send: () => false, bufferedAmount: () => 0},
        getAsset: () => new Uint8Array([1, 2, 3]),
        storeAsset: () => Promise.resolve()
    });
    await expect(channel.sendAsset('host', 'abc.png')).rejects.toMatchObject({code: ASSET_LINK_CLOSED});
    channel.destroy();
});
