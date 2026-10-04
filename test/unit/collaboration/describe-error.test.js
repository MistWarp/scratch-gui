import {IntlProvider} from 'react-intl';
import {
    describeCollabError,
    formatCollabError,
    isRetryableCollabError
} from '../../../src/lib/collaboration/describe-error.js';
import AssetChannel, {ASSET_LINK_CLOSED} from '../../../src/lib/collaboration/assets.js';
import Emitter from '../../../src/lib/collaboration/emitter.js';

const {intl} = new IntlProvider({locale: 'en'}, {}).getChildContext();
const format = (code, fallback, context) => formatCollabError(intl, code, fallback, context);

describe('describeCollabError', () => {
    test('names the room and says what to do', () => {
        expect(format('ROOM_NOT_FOUND', 'raw', {roomId: 'cool-cat-001'}))
            .toBe('Nobody is hosting room "cool-cat-001" right now. ' +
                'Check the code, or ask the host for a new invite link.');
        expect(format('ROOM_NOT_FOUND')).toMatch(/^Nobody is hosting this room/);
        expect(format('ROOM_TAKEN', 'raw', {roomId: 'x'})).toMatch(/already in use\. Pick another/);
        expect(format('SERVER_UNREACHABLE')).toMatch(/collaboration server/);
    });

    test('a dial timeout reads differently for hosts and guests', () => {
        expect(format('DIAL_TIMEOUT', null, {hosting: true})).toMatch(/opening the room/);
        expect(format('DIAL_TIMEOUT', null, {hosting: false})).toMatch(/connect to the host/);
    });

    test('unknown or missing codes keep the engine text', () => {
        expect(format(null, 'The host did not answer.')).toBe('The host did not answer.');
        expect(format('SOMETHING_NEW', 'Engine text')).toBe('Engine text');
        expect(format(null)).toMatch(/connection failed/);
    });

    test('known codes are translatable descriptors, engine text is passed through', () => {
        expect(describeCollabError('ROOM_NOT_FOUND', 'raw', {roomId: 'r'})).toEqual({
            message: expect.objectContaining({id: 'mw.collaboration.error.roomNotFound'}),
            values: {roomId: 'r'}
        });
        expect(describeCollabError('SOMETHING_NEW', 'Engine text')).toEqual({text: 'Engine text'});
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
