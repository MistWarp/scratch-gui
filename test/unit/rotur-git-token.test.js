jest.mock('@isomorphic-git/lightning-fs', () => class MemorylessFs {
    constructor () {
        this.promises = {};
    }
});

const TOKEN = 'rotur_secret-token';

jest.mock('../../src/lib/rotur/client.js', () => ({
    getRotur: () => ({loggedIn: true, token: 'rotur_secret-token'}),
    fetchCurrentUser: () => Promise.resolve({username: 'sophie'})
}));

const http = require('isomorphic-git/http/web');
const {getAuth, isRoturGitUrl} = require('../../src/lib/rotur/git-api.js');
const {cloneRepo, corsProxyForUrl, git} = require('../../src/lib/git/browser-git.js');

const originalFetch = global.fetch;

// A Git server that asks for credentials, the way any server can.
const recordRequests = () => {
    const requests = [];
    global.fetch = jest.fn((url, init = {}) => {
        requests.push({url: String(url), headers: {...(init.headers || {})}});
        return Promise.resolve({
            url: String(url),
            status: 401,
            statusText: 'Unauthorized',
            headers: new Map([['www-authenticate', 'Basic realm="git"']]),
            body: null,
            arrayBuffer: () => Promise.resolve(new ArrayBuffer(0))
        });
    });
    return requests;
};

afterEach(() => {
    global.fetch = originalFetch;
});

test('Rotur Git credentials are only given to Rotur Git over https', async () => {
    await expect(getAuth('https://git.rotur.dev/sophie/game.git'))
        .resolves.toEqual({username: 'sophie', password: TOKEN});
    for (const url of [
        'https://evil.example/repo.git',
        'http://git.rotur.dev/sophie/game.git',
        'https://git.rotur.dev.evil.example/sophie/game.git',
        'https://user:pass@git.rotur.dev/sophie/game.git',
        'https://cors.isomorphic-git.org/git.rotur.dev/sophie/game.git',
        undefined
    ]) {
        expect(isRoturGitUrl(url)).toBe(false);
        await expect(getAuth(url)).resolves.toEqual({cancel: true});
    }
});

test('a server that answers 401 never receives the Rotur token', async () => {
    const requests = recordRequests();
    // This is what ?clone=<url> did: clone any URL with Rotur Git's onAuth.
    await expect(git.getRemoteInfo({
        http,
        corsProxy: corsProxyForUrl('https://evil.example/repo.git'),
        url: 'https://evil.example/repo.git',
        onAuth: getAuth
    })).rejects.toThrow();
    expect(requests.map(request => request.url)).toEqual([
        'https://cors.isomorphic-git.org/evil.example/repo.git/info/refs?service=git-upload-pack'
    ]);
    expect(JSON.stringify(requests)).not.toContain(Buffer.from(`sophie:${TOKEN}`).toString('base64'));
    expect(requests[0].headers.Authorization).toBeUndefined();
});

test('Rotur Git never goes through the CORS proxy', () => {
    for (const url of [
        'https://git.rotur.dev/sophie/game.git',
        'http://git.rotur.dev/sophie/game.git',
        'https://GIT.ROTUR.DEV/sophie/game.git'
    ]) {
        expect(() => corsProxyForUrl(url)).toThrow('turned off');
    }
    expect(corsProxyForUrl('https://github.com/MistWarp/scratch-gui.git')).toBe('https://cors.isomorphic-git.org');
});

test('cloning a Rotur Git repo stops before any request', async () => {
    const requests = recordRequests();
    await expect(cloneRepo({url: 'https://git.rotur.dev/sophie/game.git', onAuth: getAuth}))
        .rejects.toThrow('turned off');
    expect(requests).toEqual([]);
});
