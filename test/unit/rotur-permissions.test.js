import {buildAuthUrl} from '../../src/lib/rotur/client.js';

test('MistWarp requests its complete stable Rotur permission set at login', () => {
    const url = new URL(buildAuthUrl('https://warp.mistium.com/explore'));
    const permissions = url.searchParams.get('requires').split(',');
    const required = [
        'account:view',
        'account:profile',
        'account:settings',
        'credits:view',
        'credits:manage',
        'credits:transfer',
        'credits:daily',
        'notifications:view',
        'posts:create',
        'posts:delete',
        'groups:view',
        'groups:members.view',
        'groups:join',
        'groups:leave',
        'groups:manage'
    ];

    expect(url.searchParams.get('return_to')).toBe('https://warp.mistium.com/explore');
    expect(new Set(permissions).size).toBe(permissions.length);
    required.forEach(permission => expect(permissions).toContain(permission));
});
