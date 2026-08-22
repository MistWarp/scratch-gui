import {isVisibleNotification} from '../../src/lib/rotur/client.js';

describe('Rotur notification visibility', () => {
    test('shows account follow notifications', () => {
        expect(isVisibleNotification({type: 'follow', actor: 'someone'})).toBe(true);
    });

    test('shows MistWarp platform notifications', () => {
        expect(isVisibleNotification({
            type: 'notification',
            platform: 'MistWarp',
            source: 'someone'
        })).toBe(true);
        expect(isVisibleNotification({
            type: 'notification',
            platform_data: {source: 'mistwarp'}
        })).toBe(true);
    });

    test('hides OriginChats notifications', () => {
        expect(isVisibleNotification({
            type: 'notification',
            platform: 'originChats',
            source: 'originchats'
        })).toBe(false);
    });

    test('hides unrelated app and Rotur activity', () => {
        expect(isVisibleNotification({type: 'group_invite', actor: 'someone'})).toBe(false);
        expect(isVisibleNotification({
            type: 'notification',
            source: 'another-app'
        })).toBe(false);
    });
});
