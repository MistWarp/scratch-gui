import JSZip from '@turbowarp/jszip';
import {
    exchangeValidator,
    onBanned,
    getPerks,
    getEditorProject,
    prepareSparseProjectUpload,
    request,
    runExchange
} from '../../src/lib/community/api.js';
import {
    getMistWarpAction,
    getRememberedPlatformProjectState,
    rememberPlatformProject
} from '../../src/lib/community/publish.js';
import rotur from '../../src/community/rotur.js';
import api from '../../src/community/api.js';
import {isMinorAccount, setMinorAccount} from '../../src/lib/minor-account.js';

test('a rejected /me request clears the saved session', async () => {
    localStorage.setItem('mw:mistwarp-session', 'expired');
    window.fetch = jest.fn(() => Promise.resolve({
        ok: false,
        status: 401,
        json: () => Promise.resolve({error: 'not authenticated'})
    }));

    await expect(request('/me')).rejects.toMatchObject({status: 401});
    expect(localStorage.getItem('mw:mistwarp-session')).toBeNull();
});

test('a rejected Rotur validator is marked for token invalidation', async () => {
    window.fetch = jest.fn(() => Promise.resolve({
        json: () => Promise.resolve({error: 'missing validators:generate permission'})
    }));

    await expect(exchangeValidator('bad-token')).rejects.toMatchObject({
        code: 'VALIDATOR_GENERATION_FAILED'
    });
});

test('a Rotur outage while generating a validator keeps the login', async () => {
    window.fetch = jest.fn(() => Promise.resolve({
        status: 503,
        json: () => Promise.resolve({error: 'service unavailable'})
    }));

    await expect(exchangeValidator('good-token')).rejects.toMatchObject({
        code: 'VALIDATOR_UNAVAILABLE'
    });
});

test('signing in remembers whether Rotur reports an under-18 account', async () => {
    const signIn = minor => {
        window.fetch = jest.fn(url => Promise.resolve(String(url).includes('/v2/validators') ? {
            status: 200,
            json: () => Promise.resolve({validator: 'v'})
        } : {
            ok: true,
            status: 200,
            json: () => Promise.resolve({ok: true, token: 'session', username: 'sam', minor})
        }));
        return exchangeValidator('rotur-token');
    };
    await signIn(true);
    expect(isMinorAccount()).toBe(true);
    await signIn(undefined);
    expect(isMinorAccount()).toBe(false);
    setMinorAccount(false);
});

test('the Rotur token is sent in a header, never in a URL', async () => {
    window.fetch = jest.fn(url => Promise.resolve(String(url).includes('/v2/validators') ? {
        status: 200,
        json: () => Promise.resolve({validator: '1,abc'})
    } : {
        ok: true,
        status: 200,
        json: () => Promise.resolve({ok: true, token: 'session', username: 'sam'})
    }));

    await exchangeValidator('rotur_secret-token');

    const [validatorUrl, validatorInit] = window.fetch.mock.calls[0];
    expect(validatorUrl).toBe('https://api.rotur.dev/v2/validators');
    expect(validatorInit).toMatchObject({
        method: 'POST',
        headers: {Authorization: 'Bearer rotur_secret-token'},
        body: JSON.stringify({key: 'app_1938b6a87799f862'})
    });
    for (const [url] of window.fetch.mock.calls) {
        expect(String(url)).not.toContain('rotur_secret-token');
    }
});

test('a server that only knows the old validator key gets one next', async () => {
    let authCalls = 0;
    window.fetch = jest.fn(url => {
        if (String(url).includes('/v2/validators')) {
            return Promise.resolve({status: 200, json: () => Promise.resolve({validator: 'v'})});
        }
        authCalls++;
        // The server live today checks only the old key, and answers 403.
        const refusal = {ok: false, code: 'invalid_validator', error: 'Validator expired or not valid'};
        return Promise.resolve(authCalls === 1 ?
            {ok: false, status: 403, json: () => Promise.resolve(refusal), clone: () => ({json: () => Promise.resolve(refusal)})} :
            {ok: true, status: 200, json: () => Promise.resolve({ok: true, token: 'session'})});
    });
    await expect(exchangeValidator('rotur-token')).resolves.toMatchObject({token: 'session'});
    const keys = window.fetch.mock.calls.filter(([url]) => String(url).includes('/v2/validators'))
        .map(([, init]) => JSON.parse(init.body).key);
    expect(keys).toEqual(['app_1938b6a87799f862', 'mistwarp']);
});

test('a token that can\'t make app-ID validators uses the old key, and isn\'t taken for a ban', async () => {
    // Rotur only lets MistWarp's own sign-in token make app-ID validators; the
    // desktop app's token and older ones get 403, with no code.
    window.fetch = jest.fn((url, init) => {
        if (String(url).includes('/v2/validators')) {
            return Promise.resolve(JSON.parse(init.body).key === 'mistwarp' ?
                {status: 200, json: () => Promise.resolve({validator: 'v-old'})} :
                {status: 403, json: () => Promise.resolve({error: 'Token lacks permission: validators:generate'})});
        }
        return Promise.resolve({ok: true, status: 200, json: () => Promise.resolve({ok: true, token: 'session'})});
    });
    await expect(exchangeValidator('rotur-legacy')).resolves.toMatchObject({token: 'session'});
    expect(String(window.fetch.mock.calls[2][0])).toContain('v=v-old');

    // Without validators:generate either, the old key's own error is what's reported.
    window.fetch = jest.fn(() => Promise.resolve({
        status: 403, json: () => Promise.resolve({error: 'Token lacks permission: validators:generate'})
    }));
    await expect(exchangeValidator('rotur-legacy')).rejects.toThrow('Token lacks permission');
    expect(window.fetch).toHaveBeenCalledTimes(2);
});

test('a ban from MistWarp\'s Rotur App shows the banned screen with Rotur\'s reason', async () => {
    const until = Date.UTC(2026, 9, 3, 12);
    const refusal = {
        ok: false, code: 'app_banned', error: 'You\'ve been banned from MistWarp.',
        reason: 'Cheating in races', until, redirectUrl: 'https://rotur.dev/me'
    };
    const refused = {ok: false, status: 403, json: () => Promise.resolve(refusal)};
    refused.clone = () => refused;
    window.fetch = jest.fn(url => Promise.resolve(String(url).includes('/v2/validators') ?
        {status: 200, json: () => Promise.resolve({validator: 'v'})} : refused));
    const banned = jest.fn();
    onBanned(banned);
    await expect(runExchange('rotur-token')).rejects.toMatchObject({code: 'app_banned'});
    expect(banned).toHaveBeenCalledWith(
        `You've been banned from MistWarp until ${new Date(until).toLocaleDateString()}. Reason: Cheating in races`,
        'https://rotur.dev/me'
    );
    onBanned(null);
});

test('MistWarp project identity controls share, remix, and update actions', () => {
    expect(getMistWarpAction(null, false)).toBe('save');
    expect(getMistWarpAction({isOwner: false, shared: true}, false)).toBeNull();
    expect(getMistWarpAction({isOwner: false, shared: true}, true)).toBe('remix');
    expect(getMistWarpAction({isOwner: true, shared: true}, false)).toBeNull();
    expect(getMistWarpAction({isOwner: true, shared: true}, true)).toBe('update');
    expect(getMistWarpAction({isOwner: true, shared: false}, false)).toBeNull();
});

test('disabled remix permission removes the editor remix action', () => {
    expect(getMistWarpAction({isOwner: false, canRemix: false}, true)).toBeNull();
});

test('editor project loads use the permission checked endpoint', async () => {
    window.fetch = jest.fn(() => Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ok: true, project: {id: 'project-1'}})
    }));

    await expect(getEditorProject('project-1')).resolves.toMatchObject({project: {id: 'project-1'}});
    expect(window.fetch.mock.calls[0][0]).toBe('https://api.mistwarp.org/v1/projects/project-1/editor');
});

test('the editor reads paid limits from the MistWarp perks endpoint', async () => {
    window.fetch = jest.fn(() => Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ok: true, current: {tier: 'Plus'}})
    }));

    await expect(getPerks()).resolves.toMatchObject({current: {tier: 'Plus'}});
    expect(window.fetch.mock.calls[0][0]).toBe('https://api.mistwarp.org/v1/perks');
});

test('theme marketplace uses WarpTheme while trash stays on the MistWarp API', async () => {
    window.fetch = jest.fn(url => {
        let data = {ok: true};
        if (url.includes('/api/themes')) {
            data = {ok: true, themes: [{uuid: 'theme-one', authorName: 'A name', platform: 'mistwarp'}]};
        } else if (url.includes('/api/theme/download')) {
            data = {platform: 'MistWarp', themes: [{name: 'Theme one', gui: 'light', blocks: 'three'}]};
        } else if (url.includes('/api/theme?')) {
            data = {ok: true, theme: {uuid: 'theme-one', name: 'Theme one'}};
        } else if (url.includes('/me/trash')) {
            data = {ok: true, projects: []};
        }
        return Promise.resolve({ok: true, status: 200, json: () => Promise.resolve(data)});
    });

    await api.themes({owner: 'A name', sort: 'likes'});
    await api.getTheme('theme one');
    await api.trash();
    await api.restoreProject('project one');

    expect(window.fetch.mock.calls.map(call => [call[0], call[1].method])).toEqual([
        ['https://warptheme.mistium.com/api/themes?platform=mistwarp&sort=likes', 'GET'],
        ['https://warptheme.mistium.com/api/theme?uuid=theme%20one', 'GET'],
        ['https://warptheme.mistium.com/api/theme/download?uuid=theme%20one&platform=mistwarp', 'GET'],
        ['https://warptheme.mistium.com/api/themes?platform=mistwarp&sort=likes', 'GET'],
        ['https://api.mistwarp.org/v1/me/trash', 'GET'],
        ['https://api.mistwarp.org/v1/projects/project one/restore', 'POST']
    ]);
    expect(window.fetch.mock.calls.some(call => call[0].includes('api.mistwarp.org/v1/themes'))).toBe(false);
});

test('direct project uploads omit assets already stored by the server', async () => {
    const known = '11111111111111111111111111111111.png';
    const missing = '22222222222222222222222222222222.wav';
    const zip = new JSZip();
    zip.file('project.json', JSON.stringify({targets: []}));
    zip.file(known, new Uint8Array([1]));
    zip.file(missing, new Uint8Array([2]));
    const project = await zip.generateAsync({type: 'blob'});
    window.fetch = jest.fn(() => Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ok: true, missing: [missing]})
    }));

    const sparse = await prepareSparseProjectUpload('project-1', project);
    const result = await JSZip.loadAsync(sparse);

    expect(Object.keys(result.files).sort()).toEqual([missing, 'project.json']);
});

test('project comments include their selected type', async () => {
    window.fetch = jest.fn(() => Promise.resolve({
        ok: true,
        status: 201,
        json: () => Promise.resolve({ok: true})
    }));

    await api.addComment('project-1', 'The start button does nothing', null, 'bug');
    expect(JSON.parse(window.fetch.mock.calls[0][1].body)).toEqual({
        content: 'The start button does nothing',
        parent: null,
        kind: 'bug',
        donation: null
    });
});

test('space browsing sends pagination and encoded search parameters', async () => {
    window.fetch = jest.fn(() => Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ok: true, spaces: [], total: 0})
    }));

    await api.spaces({kind: 'challenge', q: 'game jam', offset: 24, limit: 12});
    expect(window.fetch.mock.calls[0][0]).toBe(
        'https://api.mistwarp.org/v1/spaces?kind=challenge&q=game%20jam&offset=24&limit=12'
    );
});

test('challenge calendar requests send their bounded date window', async () => {
    window.fetch = jest.fn(() => Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ok: true, spaces: [], total: 0})
    }));

    await api.spaces({
        kind: 'challenge',
        limit: 100,
        startsBefore: 1798761599999,
        endsAfter: 1789772400000
    });
    expect(window.fetch.mock.calls[0][0]).toBe(
        'https://api.mistwarp.org/v1/spaces?kind=challenge&q=&offset=0&limit=100&startsBefore=1798761599999&endsAfter=1789772400000'
    );
});

test('profile projects and libraries send bounded pagination parameters', async () => {
    window.fetch = jest.fn(() => Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ok: true, projects: [], total: 0})
    }));

    await api.userProjects('A name', {offset: 24, limit: 12});
    await api.library({offset: 48, limit: 24});
    await api.myProjectPage('A name', {offset: 12, limit: 6});
    await api.userReviews('A name');

    expect(window.fetch.mock.calls.map(call => call[0])).toEqual([
        'https://api.mistwarp.org/v1/users/A%20name/projects?offset=24&limit=12',
        'https://api.mistwarp.org/v1/me/library?offset=48&limit=24',
        'https://api.mistwarp.org/v1/users/A%20name/projects?all=1&offset=12&limit=6',
        'https://api.mistwarp.org/v1/users/A%20name/reviews?limit=6'
    ]);
});

test('comment feeds send pagination, anchors, and full-list requests', async () => {
    window.fetch = jest.fn(() => Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ok: true, comments: []})
    }));

    await api.getComments('project-1', {offset: 20, limit: 20, anchor: 'reply 1'});
    await api.spaceComments('space-1', {all: true});

    expect(window.fetch.mock.calls.map(call => call[0])).toEqual([
        'https://api.mistwarp.org/v1/projects/project-1/comments?offset=20&limit=20&anchor=reply+1',
        'https://api.mistwarp.org/v1/spaces/space-1/comments?all=1'
    ]);
});

test('profile comment mutations and legacy project lists encode usernames', async () => {
    window.fetch = jest.fn(() => Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ok: true})
    }));

    await api.myProjects('A name');
    await api.addProfileComment('A name', 'Hello', null);
    await api.deleteProfileComment('A name', 'comment-1');
    await api.reactProfileComment('A name', 'comment-1', 'heart');

    expect(window.fetch.mock.calls.map(call => call[0])).toEqual([
        'https://api.mistwarp.org/v1/users/A%20name/projects?all=1',
        'https://api.mistwarp.org/v1/users/A%20name/comments',
        'https://api.mistwarp.org/v1/users/A%20name/comments/comment-1',
        'https://api.mistwarp.org/v1/users/A%20name/comments/comment-1/react'
    ]);
});

test('MistWarp project identity keeps ownership and sharing state', () => {
    rememberPlatformProject({id: 'project-1', isOwner: false, shared: true});
    expect(getRememberedPlatformProjectState()).toEqual({
        id: 'project-1',
        isOwner: false,
        shared: true,
        trustedExtensions: [],
        canSaveDirectly: false,
        saveBase: null
    });
});

test('MistWarp project identity keeps disabled remix permission', () => {
    rememberPlatformProject({id: 'project-1', isOwner: false, shared: true, canRemix: false});
    expect(getRememberedPlatformProjectState().canRemix).toBe(false);
});

test('follower leaderboard adds account index and status from profiles', async () => {
    window.fetch = jest.fn(url => Promise.resolve({
        ok: true,
        json: () => Promise.resolve(url.includes('/stats/followers') ?
            [{username: 'Mist', follower_count: 42}] :
            {index: 1, status: {presence: 'online', status: 'warping'}})
    }));

    await expect(rotur.followerLeaderboard(1)).resolves.toEqual([{
        username: 'Mist',
        follower_count: 42,
        index: 1,
        status: {presence: 'online', status: 'warping'}
    }]);
    expect(window.fetch).toHaveBeenCalledTimes(2);
    expect(window.fetch.mock.calls.map(call => call[0])).toEqual([
        'https://api.rotur.dev/stats/followers?max=1',
        'https://api.rotur.dev/profile/Mist?include_posts=0'
    ]);
});

test('Rotur profile caching evicts old entries instead of growing without bound', async () => {
    window.fetch = jest.fn(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({index: 1})
    }));

    for (let i = 0; i < 201; i++) {
        await rotur.profile(`cache-user-${i}`);
    }
    const requestsBeforeRevisit = window.fetch.mock.calls.length;

    await rotur.profile('cache-user-0');

    expect(window.fetch).toHaveBeenCalledTimes(requestsBeforeRevisit + 1);
});

test('a full Rotur profile response also satisfies group tag profile reads', async () => {
    window.fetch = jest.fn(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({username: 'ProfileCacheCase', posts: [], group_tag: 'warp'})
    }));

    await rotur.profile('ProfileCacheCase', {includePosts: true});
    await rotur.profile('profilecachecase');

    expect(window.fetch).toHaveBeenCalledTimes(1);
    expect(window.fetch.mock.calls[0][0]).toBe(
        'https://api.rotur.dev/profile/profilecachecase?include_posts=1&app=app_1938b6a87799f862'
    );
});

describe('Rotur group tags', () => {
    const profileResponse = tag => Promise.resolve({ok: true, json: () => Promise.resolve({group_tag: tag})});

    test('every tag for one person shares a single profile lookup', async () => {
        window.fetch = jest.fn(() => profileResponse('warp'));

        const tags = await Promise.all([
            rotur.groupTag('SharedTagUser'),
            rotur.groupTag('sharedtaguser'),
            rotur.groupTag(' SharedTagUser ')
        ]);
        const users = await rotur.withGroupTags([{username: 'SHAREDTAGUSER'}, {username: 'x', group_tag: 'own'}]);

        expect(tags).toEqual(['warp', 'warp', 'warp']);
        expect(users).toEqual([{username: 'SHAREDTAGUSER', group_tag: 'warp'}, {username: 'x', group_tag: 'own'}]);
        expect(window.fetch).toHaveBeenCalledTimes(1);
    });

    test('a failed lookup is retried instead of cached as no tag', async () => {
        window.fetch = jest.fn()
            .mockImplementationOnce(() => Promise.resolve({ok: false, status: 503, json: () => Promise.resolve({})}))
            .mockImplementationOnce(() => profileResponse('builders'));

        await expect(rotur.groupTag('retry-tag-user')).resolves.toBe('');
        await expect(rotur.groupTag('retry-tag-user')).resolves.toBe('builders');
        expect(window.fetch).toHaveBeenCalledTimes(2);
    });

    test('a tag set locally is used without a lookup', async () => {
        window.fetch = jest.fn();
        rotur.setGroupTag('LocalTagUser', 'makers');
        await expect(rotur.groupTag('localtaguser')).resolves.toBe('makers');
        expect(window.fetch).not.toHaveBeenCalled();
    });
});
