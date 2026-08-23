require('fake-indexeddb/auto');

const DefaultBackend = require('@isomorphic-git/lightning-fs/src/DefaultBackend');
const Mutex = require('@isomorphic-git/lightning-fs/src/Mutex');

test('LightningFS works when the browser exposes but denies the Locks API', async () => {
    const deniedRequest = jest.fn(() => {
        throw new DOMException('Access to the Locks API is denied in this context.', 'SecurityError');
    });
    const previous = Object.getOwnPropertyDescriptor(global.navigator, 'locks');
    Object.defineProperty(global.navigator, 'locks', {
        configurable: true,
        value: {request: deniedRequest}
    });

    try {
        const backend = new DefaultBackend();
        await backend.init(`mistwarp-lock-test-${Date.now()}`, {db: {}});

        expect(backend._mutex).toBeInstanceOf(Mutex);
        expect(deniedRequest).not.toHaveBeenCalled();
    } finally {
        if (previous) {
            Object.defineProperty(global.navigator, 'locks', previous);
        } else {
            delete global.navigator.locks;
        }
    }
});
