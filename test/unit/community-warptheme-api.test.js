import warpthemeApi, {request} from '../../src/lib/warptheme-api.js';

const mockRotur = {account: 'rotur-user-1', token: 'rotur-session'};
jest.mock('../../src/lib/rotur/client.js', () => ({
    ensureScopes: jest.fn(() => Promise.resolve(true)),
    accountKey: () => mockRotur.account,
    getAccessToken: () => Promise.resolve(mockRotur.token)
}));

describe('WarpTheme API adapter', () => {
    beforeEach(() => {
        mockRotur.account = 'rotur-user-1';
        mockRotur.token = 'rotur-session';
        localStorage.setItem('mw:warptheme-session', JSON.stringify({
            token: 'warp-session',
            owner: 'rotur-user-1'
        }));
        window.fetch = jest.fn((url, options) => {
            if (url.endsWith('/api/theme') && options.method === 'POST') {
                return Promise.resolve({
                    ok: true,
                    status: 200,
                    json: () => Promise.resolve({ok: true, uuids: ['published-theme']})
                });
            }
            if (url.endsWith('/api/rate')) {
                return Promise.resolve({
                    ok: true,
                    status: 200,
                    json: () => Promise.resolve({ok: true, likes: 4, dislikes: 0})
                });
            }
            if (url.endsWith('/api/user/likes')) {
                return Promise.resolve({
                    ok: true,
                    status: 200,
                    json: () => Promise.resolve({ok: true, themes: []})
                });
            }
            return Promise.resolve({
                ok: true,
                status: 200,
                json: () => Promise.resolve({ok: true})
            });
        });
    });

    afterEach(() => {
        localStorage.removeItem('mw:warptheme-session');
    });

    test('publishes MistWarp themes using WarpTheme bulk upload format', async () => {
        const result = await warpthemeApi.createTheme({
            name: 'Blue',
            description: 'A blue theme',
            theme: {name: 'Blue', gui: 'light', blocks: 'three'}
        });

        expect(result).toEqual({theme: {id: 'published-theme'}});
        const [url, options] = window.fetch.mock.calls[0];
        expect(url).toBe('https://warptheme.mistium.com/api/theme');
        expect(options.headers.Authorization).toBe('Bearer warp-session');
        expect(JSON.parse(options.body)).toEqual({
            themes: [{
                name: 'Blue',
                description: 'A blue theme',
                platform: 'mistwarp',
                themeJson: {name: 'Blue', gui: 'light', blocks: 'three'}
            }]
        });
    });

    test('deletes and rates themes through WarpTheme query and form contracts', async () => {
        await warpthemeApi.deleteTheme('theme one');
        const rating = await warpthemeApi.likeTheme('theme one');

        expect(window.fetch.mock.calls[0][0])
            .toBe('https://warptheme.mistium.com/api/theme?uuid=theme%20one');
        expect(window.fetch.mock.calls[0][1].method).toBe('DELETE');
        expect(window.fetch.mock.calls[1][0]).toBe('https://warptheme.mistium.com/api/user/likes');
        expect(window.fetch.mock.calls[2][0]).toBe('https://warptheme.mistium.com/api/rate');
        expect(window.fetch.mock.calls[2][1].body).toBe('uuid=theme+one&rating=like');
        expect(rating).toMatchObject({liked: true, likes: 4});
        expect(window.fetch.mock.calls.every(call => call[0].startsWith('https://warptheme.mistium.com/api/')))
            .toBe(true);
    });

    test('tracks explicit downloads and preserves an existing like toggle', async () => {
        window.fetch.mockImplementation((url, options) => {
            if (url.endsWith('/api/user/likes')) {
                return Promise.resolve({
                    ok: true,
                    status: 200,
                    json: () => Promise.resolve({ok: true, themes: [{uuid: 'theme one'}]})
                });
            }
            if (url.includes('/api/theme/download')) {
                return Promise.resolve({
                    ok: true,
                    status: 200,
                    json: () => Promise.resolve({name: 'Theme one', gui: 'light', blocks: 'three'})
                });
            }
            return Promise.resolve({
                ok: true,
                status: 200,
                json: () => Promise.resolve({ok: true, likes: 3, dislikes: 0})
            });
        });

        await warpthemeApi.downloadTheme('theme one');
        await warpthemeApi.downloadTheme('theme one', {track: true});
        const rating = await warpthemeApi.likeTheme('theme one');

        expect(window.fetch.mock.calls[0][1].headers.Authorization).toBeUndefined();
        expect(window.fetch.mock.calls[1][1].headers.Authorization).toBe('Bearer warp-session');
        expect(rating).toMatchObject({liked: false, likes: 3});
    });

    test('hydrates detail like state from an existing WarpTheme session', async () => {
        window.fetch.mockImplementation(url => {
            let data = {ok: true};
            if (url.includes('/api/theme?')) {
                data = {ok: true, theme: {uuid: 'theme-one', name: 'Theme one', authorName: 'Mist'}};
            } else if (url.includes('/api/theme/download')) {
                data = {name: 'Theme one', gui: 'light', blocks: 'three'};
            } else if (url.includes('/api/themes')) {
                data = {ok: true, themes: [{uuid: 'theme-one', authorName: 'Mist'}]};
            } else if (url.includes('/api/user/likes')) {
                data = {ok: true, themes: [{uuid: 'theme-one'}]};
            }
            return Promise.resolve({
                ok: true,
                status: 200,
                json: () => Promise.resolve(data)
            });
        });

        const result = await warpthemeApi.getTheme('theme-one');

        expect(result.theme.liked).toBe(true);
        const likesRequest = window.fetch.mock.calls.find(call => call[0].endsWith('/api/user/likes'));
        expect(likesRequest[1].headers.Authorization).toBe('Bearer warp-session');
    });

    test('does not reuse WarpTheme authorization after the Rotur identity changes', async () => {
        mockRotur.account = 'someone-else';

        await request('/user/likes', {optionalAuth: true});

        expect(window.fetch.mock.calls[0][1].headers.Authorization).toBeUndefined();
        expect(localStorage.getItem('mw:warptheme-session')).toBeNull();
    });

    test('clears cached likes when the Rotur session disappears', async () => {
        window.fetch.mockImplementation(url => {
            let data = {ok: true};
            if (url.includes('/api/theme?')) {
                data = {ok: true, theme: {uuid: 'theme-one', name: 'Theme one', authorName: 'Mist'}};
            } else if (url.includes('/api/theme/download')) {
                data = {name: 'Theme one', gui: 'light', blocks: 'three'};
            } else if (url.includes('/api/themes')) {
                data = {ok: true, themes: [{uuid: 'theme-one', authorName: 'Mist'}]};
            } else if (url.includes('/api/user/likes')) {
                data = {ok: true, themes: [{uuid: 'theme-one'}]};
            }
            return Promise.resolve({
                ok: true,
                status: 200,
                json: () => Promise.resolve(data)
            });
        });

        expect((await warpthemeApi.getTheme('theme-one')).theme.liked).toBe(true);
        mockRotur.account = '';
        expect((await warpthemeApi.getTheme('theme-one')).theme.liked).toBe(false);
        expect(localStorage.getItem('mw:warptheme-session')).toBeNull();
    });

    test('discards an expired optional WarpTheme session', async () => {
        window.fetch.mockResolvedValue({
            ok: false,
            status: 401,
            json: () => Promise.resolve({error: 'Expired session'})
        });

        await expect(request('/user/likes', {optionalAuth: true})).rejects.toThrow('Expired session');
        expect(localStorage.getItem('mw:warptheme-session')).toBeNull();
    });

    test('authorizes WarpTheme with the Rotur token in a header, never in a URL', async () => {
        localStorage.removeItem('mw:warptheme-session');
        mockRotur.token = 'rotur_secret-token';
        window.fetch.mockImplementation(url => Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve(url.includes('/v2/validators') ?
                {validator: '1,abc'} :
                {ok: true, token: 'fresh-warp-session', themes: []})
        }));

        await request('/user/likes', {authenticated: true});

        const [validatorUrl, validatorInit] = window.fetch.mock.calls[0];
        expect(validatorUrl).toBe('https://api.rotur.dev/v2/validators');
        expect(validatorInit.headers.Authorization).toBe('Bearer rotur_secret-token');
        expect(JSON.parse(validatorInit.body)).toEqual({key: 'warptheme'});
        expect(window.fetch.mock.calls[1][0]).toBe('https://warptheme.mistium.com/api/auth?v=1%2Cabc');
        expect(window.fetch.mock.calls.some(([url]) => url.includes('rotur_secret-token'))).toBe(false);
        expect(JSON.parse(localStorage.getItem('mw:warptheme-session'))).toEqual({
            token: 'fresh-warp-session', owner: 'rotur-user-1'
        });
    });
});
