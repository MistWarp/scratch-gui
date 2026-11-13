const OFFLINE = self.__MW_OFFLINE__;
const PREFIX = 'mistwarp-offline-';
const CACHE = `${PREFIX}${OFFLINE.version}`;
const LEGACY_CACHES = ['mistwarp-cache-v2', 'mistwarp-runtime-v2'];
const BASE = new URL('./', self.location).href;
const RECORD = new URL('offline-version.json', BASE).href;
const CACHED_ON_USE = /^(?:assets|static|packager-runtime|microbit|images)\//;
const ROUTES = [
    [/^(?:\d+\/)?editor$/, 'editor.html'],
    [/^(?:\d+\/)?fullscreen$/, 'fullscreen.html'],
    [/^(?:\d+|player)$/, 'player.html'],
    [/^addons$/, 'addons.html']
];

const resolve = file => new URL(file, BASE).href;

const LANGUAGE_FILES = Object.entries(OFFLINE.languages)
    .map(([file, language]) => ({...language, address: resolve(file)}));

const withoutQuery = address => {
    const url = new URL(address);
    url.search = '';
    url.hash = '';
    return url.href;
};

const json = value => new Response(JSON.stringify(value), {headers: {'Content-Type': 'application/json'}});

const readRecord = async cacheName => {
    const response = await caches.match(RECORD, {cacheName});
    return response ? response.json() : null;
};

const isInstalled = async () => Boolean(await caches.match(RECORD, {cacheName: CACHE}));

const olderVersions = async () => {
    const names = (await caches.keys()).filter(name => name.startsWith(PREFIX) && name !== CACHE);
    const versions = await Promise.all(names.map(async name => ({name, record: await readRecord(name)})));
    return versions.filter(({record}) => record)
        .sort((a, b) => (b.record.activated || 0) - (a.record.activated || 0));
};

const fetchPage = async page => {
    const response = await fetch(resolve(page), {cache: 'no-cache'});
    const html = await response.text();
    if (!response.ok || !html.includes(OFFLINE.pages[page])) {
        throw new Error(`${page} on the server is not from build ${OFFLINE.version}.`);
    }
    const directory = page.endsWith('index.html') ? [resolve(page.slice(0, -'index.html'.length))] : [];
    return {
        addresses: [...new Set([resolve(page), withoutQuery(response.url), ...directory])],
        html,
        headers: response.headers
    };
};

const isDownloaded = async address => {
    const response = await fetch(address, {cache: 'only-if-cached', mode: 'same-origin'}).catch(() => null);
    return response?.status === 200;
};

const wholeLanguagesOf = files => {
    const keys = new Set(files.map(file => file.key));
    const languages = new Set(files.map(file => file.language).filter(Boolean));
    return LANGUAGE_FILES.filter(file => keys.has(file.key) || languages.has(file.language));
};

const languagesToKeep = async older => {
    const kept = [];
    for (const {name, record} of older) {
        for (const {url} of await (await caches.open(name)).keys()) {
            const file = record.languages[url.slice(BASE.length)];
            if (file) kept.push(file);
        }
    }
    const downloaded = await Promise.all(LANGUAGE_FILES.map(async file => (await isDownloaded(file.address)) && file));
    return wholeLanguagesOf([...kept, ...downloaded.filter(Boolean)]);
};

const install = async () => {
    const pages = await Promise.all(Object.keys(OFFLINE.pages).map(fetchPage));
    if (!pages.every(({addresses}) => addresses.every(address => address.startsWith(BASE)))) {
        await self.skipWaiting();
        return;
    }
    const cache = await caches.open(CACHE);
    await cache.addAll(OFFLINE.precache.map(resolve));
    await cache.addAll((await languagesToKeep(await olderVersions())).map(file => file.address));
    await Promise.all(pages.flatMap(({addresses, html, headers}) =>
        addresses.map(address => cache.put(address, new Response(html, {headers})))));
    await cache.put(RECORD, json({languages: OFFLINE.languages}));
};

const deleteCaches = async isStale => {
    const ours = (await caches.keys()).filter(name => name.startsWith(PREFIX) || LEGACY_CACHES.includes(name));
    await Promise.all(ours.filter(isStale).map(name => caches.delete(name)));
};

const retire = async () => {
    await deleteCaches(() => true);
    await self.registration.unregister();
};

const activate = async () => {
    const record = await readRecord(CACHE);
    if (!record) return retire();
    const previous = (await olderVersions()).find(version => version.record.activated);
    await deleteCaches(name => name !== CACHE && name !== previous?.name);
    await (await caches.open(CACHE)).put(RECORD, json({...record, activated: Date.now()}));
    await self.clients.claim();
};

const pageAddress = url => {
    const address = withoutQuery(url);
    const path = address.slice(BASE.length).replace(/\/$/, '');
    const route = ROUTES.find(([pattern, page]) => pattern.test(path) && page in OFFLINE.pages);
    return route ? resolve(route[1]) : address;
};

const navigate = async request => await caches.match(pageAddress(request.url), {cacheName: CACHE}) || fetch(request);

const keep = async (request, response) => {
    if (await isInstalled()) await (await caches.open(CACHE)).put(request, response);
};

const asset = async (event, request) => {
    const current = await caches.match(request, {cacheName: CACHE});
    if (current) return current;
    const response = await fetch(request).catch(() => Response.error());
    if (response.status === 200) event.waitUntil(keep(request, response.clone()));
    return response.ok ? response : await caches.match(request) || response;
};

self.addEventListener('install', event => event.waitUntil(install()));

self.addEventListener('activate', event => event.waitUntil(activate()));

self.addEventListener('message', event => {
    if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', event => {
    const {request} = event;
    if (request.method !== 'GET' || !request.url.startsWith(BASE)) return;
    if (request.mode === 'navigate') event.respondWith(navigate(request));
    else if (CACHED_ON_USE.test(request.url.slice(BASE.length))) event.respondWith(asset(event, request));
});
