import {exchangeValidator, getEditorProject, request} from '../../src/lib/community/api.js';
import {
    getMistWarpAction,
    getRememberedPlatformProjectState,
    rememberPlatformProject
} from '../../src/lib/community/publish.js';
import rotur from '../../src/community/rotur.js';

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

test('MistWarp project identity controls share, remix, and update actions', () => {
    expect(getMistWarpAction(null, false)).toBe('share');
    expect(getMistWarpAction({isOwner: false, shared: true}, false)).toBeNull();
    expect(getMistWarpAction({isOwner: false, shared: true}, true)).toBe('remix');
    expect(getMistWarpAction({isOwner: true, shared: true}, false)).toBeNull();
    expect(getMistWarpAction({isOwner: true, shared: true}, true)).toBe('update');
    expect(getMistWarpAction({isOwner: true, shared: false}, false)).toBe('share');
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
    expect(window.fetch.mock.calls[0][0]).toBe('https://mwapi.mistium.com/api/projects/project-1/editor');
});

test('MistWarp project identity keeps ownership and sharing state', () => {
    rememberPlatformProject({id: 'project-1', isOwner: false, shared: true});
    expect(getRememberedPlatformProjectState()).toEqual({
        id: 'project-1',
        isOwner: false,
        shared: true
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
});
