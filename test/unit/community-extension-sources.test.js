import {webcrypto} from 'crypto';
import {TextEncoder} from 'util';
import JSZip from '@turbowarp/jszip';
import {
    collectExtensionSources,
    extensionSourceUrl,
    getCustomExtensionUrls,
    hashExtensionUrl
} from '../../src/lib/community/api.js';

Object.defineProperty(global, 'crypto', {value: webcrypto, configurable: true});
Object.defineProperty(global, 'TextEncoder', {value: TextEncoder, configurable: true});

const makeSb3 = async project => {
    const zip = new JSZip();
    zip.file('project.json', JSON.stringify(project));
    return zip.generateAsync({type: 'uint8array'});
};

test('custom extension URLs are collected and deduplicated across project and targets', () => {
    expect(getCustomExtensionUrls({
        extensionURLs: {
            one: 'https://example.com/one.js',
            duplicate: 'https://example.com/shared.js',
            turbowarp: 'https://extensions.turbowarp.org/example.js'
        },
        targets: [{
            extensionURLs: {
                two: 'data:application/javascript,code',
                duplicate: 'https://example.com/shared.js',
                mistium: 'https://extensions.mistium.com/featured/example.js',
                invalid: 3
            }
        }]
    })).toEqual([
        'https://example.com/one.js',
        'https://example.com/shared.js',
        'data:application/javascript,code'
    ]);
});

test('extension URL fingerprints are stable SHA-256 values', async () => {
    expect(await hashExtensionUrl('https://example.com/trusted.js'))
        .toBe('a641c5c6969ea28a3a3053f0a5d6c76a5a1f7017b5c8298d61ba9399fb0cad6f');
});

test('project extension source URLs carry only the project key and URL fingerprint', async () => {
    expect(await extensionSourceUrl({
        id: 'project-1',
        projectJsonUrl: 'https://storage.example/project.json?k=secret&other=value'
    }, 'https://example.com/trusted.js')).toBe(
        'https://api.mistwarp.org/v1/projects/project-1/extensions/' +
        'a641c5c6969ea28a3a3053f0a5d6c76a5a1f7017b5c8298d61ba9399fb0cad6f/source?k=secret'
    );
});

test('collectExtensionSources turns raw fetch errors into a clear custom-extension message without query tokens', async () => {
    const previousFetch = global.fetch;
    global.fetch = jest.fn().mockRejectedValue(new TypeError('Failed to fetch'));
    try {
        const sb3 = await makeSb3({
            extensionURLs: {custom: 'https://extensions.example/custom.js?token=secret'}
        });
        await expect(collectExtensionSources(sb3)).rejects.toMatchObject({
            code: 'extension_source_unavailable',
            friendly: true,
            extensionOrigin: 'remote',
            extensionUrl: 'https://extensions.example/custom.js',
            message: expect.stringContaining('Could not load the custom extension at https://extensions.example/custom.js before saving.')
        });
        const caught = await collectExtensionSources(sb3).catch(e => e);
        expect(caught.message).not.toContain('token=secret');
    } finally {
        global.fetch = previousFetch;
    }
});

test('collectExtensionSources reports HTTP errors and avoids dumping data URI contents', async () => {
    const previousFetch = global.fetch;
    global.fetch = jest.fn()
        .mockResolvedValueOnce({ok: false, status: 404})
        .mockRejectedValueOnce(new TypeError('Failed to fetch'));
    try {
        const remoteSb3 = await makeSb3({
            extensionURLs: {custom: 'https://extensions.example/missing.js'}
        });
        await expect(collectExtensionSources(remoteSb3)).rejects.toMatchObject({
            code: 'extension_source_unavailable',
            friendly: true,
            httpStatus: 404,
            message: expect.stringContaining('(HTTP 404)')
        });

        const dataSb3 = await makeSb3({
            extensionURLs: {inline: 'data:application/javascript,secretPayload123'}
        });
        const caught = await collectExtensionSources(dataSb3).catch(e => e);
        expect(caught.code).toBe('extension_source_unavailable');
        expect(caught.extensionOrigin).toBe('data');
        expect(caught.message).toContain('Could not read a custom extension before saving.');
        expect(caught.message).not.toContain('secretPayload123');
    } finally {
        global.fetch = previousFetch;
    }
});
