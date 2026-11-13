/** @jest-environment node */
import fs from 'fs';
import path from 'path';
import vm from 'vm';
import {writeOfflineWorker} from '../../../scripts/vite-offline.mjs';

const ORIGIN = 'https://editor.example';
const SOURCE = fs.readFileSync(path.resolve(__dirname, '../../../src/playground/service-worker.js'), 'utf8');

let clock = 0;
const SteadyClock = {now: () => ++clock};

const urlOf = request => (typeof request === 'string' ? request : request.url);

class MemoryCache {
    constructor (network) {
        this.network = network;
        this.entries = new Map();
    }
    match (request) {
        const response = this.entries.get(urlOf(request));
        return Promise.resolve(response && response.clone());
    }
    put (request, response) {
        this.entries.set(urlOf(request), response.clone());
        return Promise.resolve();
    }
    async add (request) {
        const response = await this.network.fetch(request);
        if (!response.ok) throw new TypeError(`${urlOf(request)} responded ${response.status}`);
        await this.put(request, response);
    }
    async addAll (requests) {
        await Promise.all(requests.map(request => this.add(request)));
    }
    keys () {
        return Promise.resolve([...this.entries.keys()].map(url => ({url})));
    }
}

class MemoryCacheStorage {
    constructor (network) {
        this.network = network;
        this.named = new Map();
    }
    open (name) {
        if (!this.named.has(name)) this.named.set(name, new MemoryCache(this.network));
        return Promise.resolve(this.named.get(name));
    }
    has (name) {
        return Promise.resolve(this.named.has(name));
    }
    delete (name) {
        return Promise.resolve(this.named.delete(name));
    }
    keys () {
        return Promise.resolve([...this.named.keys()]);
    }
    async match (request, {cacheName} = {}) {
        const names = cacheName ? [cacheName] : [...this.named.keys()];
        for (const name of names) {
            const response = this.named.has(name) && await this.named.get(name).match(request);
            if (response) return response;
        }
    }
}

const createNetwork = () => {
    const network = {
        online: true,
        files: new Map(),
        redirects: new Map(),
        httpCache: new Set(),
        requests: [],
        serve (file, body, headers = {}) {
            network.files.set(new URL(file, ORIGIN).href, {body, headers});
        },
        fetch (request, init = {}) {
            const url = urlOf(request);
            network.requests.push(url);
            if (init.cache === 'only-if-cached') {
                if (!network.httpCache.has(url)) return Promise.reject(new TypeError('Not in the HTTP cache'));
            } else if (!network.online) {
                return Promise.reject(new TypeError('Offline'));
            }
            const served = network.redirects.get(url) || url;
            const file = network.files.get(served);
            const response = file ?
                new Response(file.body, {headers: file.headers}) :
                new Response('Not found', {status: 404});
            Object.defineProperty(response, 'url', {value: served});
            return Promise.resolve(response);
        }
    };
    return network;
};

const startWorker = ({manifest, network, caches}) => {
    const listeners = {};
    const self = {
        location: new URL('/sw.js', ORIGIN),
        addEventListener: (type, listener) => {
            listeners[type] = listener;
        },
        skipWaiting: jest.fn(() => Promise.resolve()),
        clients: {claim: jest.fn(() => Promise.resolve())},
        registration: {unregister: jest.fn(() => Promise.resolve(true))}
    };
    vm.runInNewContext(writeOfflineWorker(SOURCE, manifest), {
        self, caches, fetch: network.fetch, URL, Response, Date: SteadyClock
    });
    const lifecycle = async type => {
        const pending = [];
        listeners[type]({waitUntil: promise => pending.push(promise)});
        await Promise.all(pending);
    };
    return {
        self,
        install: () => lifecycle('install'),
        activate: () => lifecycle('activate'),
        message: data => listeners.message({data}),
        async request (address, mode = 'cors') {
            let response = null;
            const pending = [];
            listeners.fetch({
                request: {url: new URL(address, ORIGIN).href, method: 'GET', mode},
                respondWith: promise => {
                    response = promise;
                },
                waitUntil: promise => pending.push(promise)
            });
            const result = response && await response;
            await Promise.all(pending);
            return result;
        }
    };
};

const manifestFor = (version, language = 'de-1.js') => ({
    version,
    pages: {'editor.html': `editor-${version}.js`, 'addons.html': `addons-${version}.js`},
    precache: [`assets/editor-${version}.js`, `assets/addons-${version}.js`, 'static/blocks-media/default/flag.svg'],
    languages: {
        [`assets/${language}`]: {key: 'src/generated/editor-locales/de.json', language: 'de'},
        [`assets/settings-${language}`]: {key: 'src/addons/addons-l10n-settings/de.json', language: 'de'},
        [`assets/data-${language}`]: {key: '@turbowarp/scratch-l10n/src/locale-data/de.js'},
        'assets/fr-1.js': {key: 'src/generated/editor-locales/fr.json', language: 'fr'},
        'assets/data-fr-1.js': {key: '@turbowarp/scratch-l10n/src/locale-data/fr.js'}
    }
});

const deploy = (network, manifest) => {
    for (const [page, entry] of Object.entries(manifest.pages)) {
        network.serve(page.replace(/\.html$/, ''), `<script src="/assets/${entry}"></script>`, {
            'Content-Type': 'text/html; charset=utf-8',
            'Content-Security-Policy': "frame-ancestors 'self'"
        });
    }
    network.redirects.set(`${ORIGIN}/editor.html`, `${ORIGIN}/`);
    network.files.set(`${ORIGIN}/`, network.files.get(`${ORIGIN}/editor`));
    network.redirects.set(`${ORIGIN}/addons.html`, `${ORIGIN}/addons`);
    for (const file of [...manifest.precache, ...Object.keys(manifest.languages)]) {
        network.serve(file, `contents of ${file}`);
    }
};

const setup = (version = 'v1') => {
    const network = createNetwork();
    const caches = new MemoryCacheStorage(network);
    const manifest = manifestFor(version);
    deploy(network, manifest);
    return {network, caches, manifest, worker: startWorker({manifest, network, caches})};
};

const textOf = async response => response && response.text();

const isNetworkError = response => response.type === 'error';

test('installs the editor and serves its pages at the addresses the server gave them', async () => {
    const {network, worker} = setup();
    await worker.install();
    await worker.activate();
    network.online = false;
    const editor = await worker.request('/?project=1#5', 'navigate');
    expect(await textOf(editor)).toBe('<script src="/assets/editor-v1.js"></script>');
    expect(editor.headers.get('Content-Security-Policy')).toBe("frame-ancestors 'self'");
    expect(await textOf(await worker.request('/editor.html', 'navigate'))).toContain('editor-v1.js');
    expect(await textOf(await worker.request('/addons', 'navigate'))).toContain('addons-v1.js');
    expect(await textOf(await worker.request('/assets/editor-v1.js'))).toBe('contents of assets/editor-v1.js');
    expect(await textOf(await worker.request('/static/blocks-media/default/flag.svg')))
        .toBe('contents of static/blocks-media/default/flag.svg');
    expect(worker.self.clients.claim).toHaveBeenCalled();
    expect(worker.self.skipWaiting).not.toHaveBeenCalled();
});

test('the editor\'s own routes open the kept pages offline', async () => {
    const {network, worker} = setup();
    await worker.install();
    await worker.activate();
    network.online = false;
    const routes = {'/editor': 'editor-v1.js', '/123/editor?locale=de': 'editor-v1.js', '/addons/': 'addons-v1.js'};
    for (const [address, entry] of Object.entries(routes)) {
        expect(await textOf(await worker.request(address, 'navigate'))).toContain(entry);
    }
    await expect(worker.request('/123/fullscreen', 'navigate')).rejects.toThrow('Offline');
});

test('a build whose index page is the editor keeps it at the folder address too', async () => {
    const network = createNetwork();
    const caches = new MemoryCacheStorage(network);
    const manifest = {version: 'v1', pages: {'index.html': 'index-v1.js'}, precache: [], languages: {}};
    network.serve('index.html', '<script src="/assets/index-v1.js"></script>', {'Content-Type': 'text/html'});
    const worker = startWorker({manifest, network, caches});
    await worker.install();
    await worker.activate();
    network.online = false;
    expect(await textOf(await worker.request('/?locale=de', 'navigate'))).toContain('index-v1.js');
});

test('pages it does not keep, and requests outside its folders, go to the network', async () => {
    const {network, worker} = setup();
    network.serve('123', 'player page');
    await worker.install();
    await worker.activate();
    expect(await textOf(await worker.request('/123', 'navigate'))).toBe('player page');
    expect(await worker.request('/version.json')).toBeNull();
    expect(await worker.request('https://api.example/v1/projects')).toBeNull();
});

test('refuses to install when the server already has a different build', async () => {
    const {network, worker} = setup();
    network.serve('editor', '<script src="/assets/editor-v2.js"></script>');
    network.files.set(`${ORIGIN}/`, network.files.get(`${ORIGIN}/editor`));
    await expect(worker.install()).rejects.toThrow('editor.html on the server is not from build v1.');
});

test('keeps files fetched on use, and an older copy when the network has lost it', async () => {
    const {network, caches, worker} = setup();
    network.serve('packager-runtime/runtime.js', 'runtime');
    await worker.install();
    await worker.activate();
    expect(await textOf(await worker.request('/packager-runtime/runtime.js'))).toBe('runtime');
    network.online = false;
    expect(await textOf(await worker.request('/packager-runtime/runtime.js'))).toBe('runtime');
    const older = await caches.open('mistwarp-offline-v0');
    await older.put(`${ORIGIN}/assets/gone.js`, new Response('from the previous build'));
    network.online = true;
    expect(await textOf(await worker.request('/assets/gone.js'))).toBe('from the previous build');
    expect((await worker.request('/assets/missing.js')).status).toBe(404);
});

test('an update keeps downloaded languages and the version open tabs still use', async () => {
    const network = createNetwork();
    const caches = new MemoryCacheStorage(network);
    const first = manifestFor('v1', 'de-1.js');
    deploy(network, first);
    const v1 = startWorker({manifest: first, network, caches});
    await v1.install();
    await v1.activate();
    await v1.request('/assets/de-1.js');
    await caches.open('mistwarp-cache-v2');

    const second = manifestFor('v2', 'de-2.js');
    deploy(network, second);
    const v2 = startWorker({manifest: second, network, caches});
    await v2.install();
    await v2.activate();
    const third = manifestFor('v3', 'de-3.js');
    deploy(network, third);
    const v3 = startWorker({manifest: third, network, caches});
    await v3.install();

    expect(await caches.keys()).toEqual(['mistwarp-offline-v1', 'mistwarp-offline-v2', 'mistwarp-offline-v3']);
    await v3.activate();
    expect(await caches.keys()).toEqual(['mistwarp-offline-v2', 'mistwarp-offline-v3']);
    network.online = false;
    expect(await textOf(await v3.request('/assets/de-3.js'))).toBe('contents of assets/de-3.js');
    expect(await textOf(await v3.request('/assets/editor-v2.js'))).toBe('contents of assets/editor-v2.js');
    expect(isNetworkError(await v3.request('/assets/fr-1.js'))).toBe(true);
});

test('keeps the whole of a language the browser downloaded before the worker existed', async () => {
    const {network, worker} = setup();
    network.httpCache.add(`${ORIGIN}/assets/de-1.js`);
    network.httpCache.add(`${ORIGIN}/assets/data-de-1.js`);
    await worker.install();
    await worker.activate();
    network.online = false;
    for (const file of ['de-1.js', 'settings-de-1.js', 'data-de-1.js']) {
        expect(await textOf(await worker.request(`/assets/${file}`))).toBe(`contents of assets/${file}`);
    }
    for (const file of ['fr-1.js', 'data-fr-1.js']) {
        expect(isNetworkError(await worker.request(`/assets/${file}`))).toBe(true);
    }
});

test('removes itself and the old caches from a site that does not serve the editor', async () => {
    const {network, caches, worker} = setup();
    network.redirects.set(`${ORIGIN}/editor.html`, 'https://elsewhere.example/');
    network.files.set('https://elsewhere.example/', network.files.get(`${ORIGIN}/editor`));
    await caches.open('mistwarp-cache-v2');
    await caches.open('mistwarp-runtime-v2');
    await caches.open('someone-elses-cache');
    await worker.install();
    expect(worker.self.skipWaiting).toHaveBeenCalled();
    await worker.activate();
    expect(worker.self.registration.unregister).toHaveBeenCalled();
    expect(worker.self.clients.claim).not.toHaveBeenCalled();
    network.serve('assets/community.js', 'community');
    expect(await textOf(await worker.request('/assets/community.js'))).toBe('community');
    expect(await caches.keys()).toEqual(['someone-elses-cache']);
});

test('the page can ask a waiting update to take over', () => {
    const {worker} = setup();
    worker.message({type: 'something else'});
    expect(worker.self.skipWaiting).not.toHaveBeenCalled();
    worker.message({type: 'SKIP_WAITING'});
    expect(worker.self.skipWaiting).toHaveBeenCalled();
});
