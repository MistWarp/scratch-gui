import {
    builtinExtensionMeta,
    isGalleryExtensionUrl,
    resolveExtensionMeta,
    resolveExtensionMetas
} from '../../src/community/extension-meta.js';

describe('extension metadata', () => {
    const realFetch = global.fetch;

    afterEach(() => {
        global.fetch = realFetch;
    });

    test('resolves builtin extensions without fetching', async () => {
        global.fetch = jest.fn();
        const meta = await resolveExtensionMeta('mistwarpData', null);

        expect(meta).toEqual({name: 'Game Data', iconUrl: expect.any(String)});
        expect(global.fetch).not.toHaveBeenCalled();
    });

    test('only treats turbowarp.org urls as gallery urls', () => {
        expect(isGalleryExtensionUrl('https://extensions.turbowarp.org/runtime-options.js')).toBe(true);
        expect(isGalleryExtensionUrl('https://warp.mistium.com/')).toBe(false);
        expect(isGalleryExtensionUrl(null)).toBe(false);
    });

    test('resolves gallery urls through the extension catalog', async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve([{slug: 'runtime-options', name: 'Runtime Options', image: 'images/runtime.svg'}])
        });
        const meta = await resolveExtensionMeta(
            'runtimeoptions', 'https://extensions.turbowarp.org/runtime-options.js'
        );

        expect(meta).toEqual({
            name: 'Runtime Options',
            iconUrl: 'https://extensions.turbowarp.org/images/runtime.svg'
        });
        expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    test('never fetches non-gallery urls', async () => {
        global.fetch = jest.fn();
        expect(await resolveExtensionMeta('custom', 'https://example.com/ext.js')).toBeNull();
        expect(await resolveExtensionMeta('custom', null)).toBeNull();
        expect(global.fetch).not.toHaveBeenCalled();
    });

    test('resolves each extension once', async () => {
        global.fetch = jest.fn().mockResolvedValue({ok: true, json: () => Promise.resolve([])});
        const metas = await resolveExtensionMetas([
            {id: 'mistwarpData', url: null},
            {id: 'mistwarpData', url: null},
            {id: 'unknown', url: 'https://extensions.turbowarp.org/unknown.js'}
        ]);

        expect(metas.mistwarpData.name).toBe('Game Data');
        expect(metas).not.toHaveProperty('unknown');
    });

    test('falls back to the id when the builtin name is translated', async () => {
        global.fetch = jest.fn();
        expect(await resolveExtensionMeta('pen', null)).toEqual({name: 'pen', iconUrl: expect.any(String)});
        expect(global.fetch).not.toHaveBeenCalled();
    });

    test('falls back to null when the gallery is unreachable', async () => {
        global.fetch = jest.fn().mockRejectedValue(new Error('offline'));
        let fresh = null;
        jest.isolateModules(() => {
            fresh = require('../../src/community/extension-meta.js');
        });
        expect(await fresh.resolveExtensionMeta(
            'runtimeoptions', 'https://extensions.turbowarp.org/runtime-options.js'
        )).toBeNull();
    });
});
