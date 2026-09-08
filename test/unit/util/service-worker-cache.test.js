/** @jest-environment node */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const setup = () => {
    const handlers = {};
    const cache = {match: jest.fn(), put: jest.fn()};
    const context = {
        self: {addEventListener: (type, handler) => { handlers[type] = handler; },
            clients: {claim: jest.fn()}},
        caches: {open: jest.fn(async () => cache), keys: jest.fn(async () => ['mistwarp-old']),
            delete: jest.fn(async () => true)},
        fetch: jest.fn(), URL, console: {log: jest.fn()}, setInterval: jest.fn()
    };
    vm.runInNewContext(fs.readFileSync(path.resolve(__dirname,
        '../../../src/playground/service-worker.js'), 'utf8'), context);
    return {handlers, cache, context};
};

test('page navigation gets fresh HTML instead of stale chunk references', async () => {
    const {handlers, cache, context} = setup();
    const fresh = {status: 200, clone: () => 'fresh copy'};
    context.fetch.mockResolvedValue(fresh);
    cache.match.mockResolvedValue('stale HTML');
    const request = {url: 'https://mistwarp.org/', method: 'GET', mode: 'navigate'};
    let response;
    handlers.fetch({request, respondWith: promise => { response = promise; }});
    await expect(response).resolves.toBe(fresh);
    expect(cache.match).not.toHaveBeenCalled();
    expect(cache.put).toHaveBeenCalledWith(request, 'fresh copy');
});

test('offline page navigation still uses cached HTML', async () => {
    const {handlers, cache, context} = setup();
    context.fetch.mockRejectedValue(new Error('Offline'));
    cache.match.mockResolvedValue('cached HTML');
    let response;
    handlers.fetch({request: {url: 'https://mistwarp.org/', method: 'GET', mode: 'navigate'},
        respondWith: promise => { response = promise; }});
    await expect(response).resolves.toBe('cached HTML');
});

test('activation waits for cache cleanup before claiming clients', async () => {
    const {handlers, context} = setup();
    let pending;
    handlers.activate({waitUntil: promise => { pending = promise; }});
    await pending;
    expect(context.caches.delete).toHaveBeenCalledWith('mistwarp-old');
    expect(context.self.clients.claim).toHaveBeenCalledTimes(1);
});
