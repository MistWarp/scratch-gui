import {webcrypto} from 'crypto';
import {TextEncoder} from 'util';
import {
    extensionSourceUrl,
    getCustomExtensionUrls,
    hashExtensionUrl
} from '../../src/lib/community/api.js';

Object.defineProperty(global, 'crypto', {value: webcrypto, configurable: true});
Object.defineProperty(global, 'TextEncoder', {value: TextEncoder, configurable: true});

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
        'https://mwapi.mistium.com/api/projects/project-1/extensions/' +
        'a641c5c6969ea28a3a3053f0a5d6c76a5a1f7017b5c8298d61ba9399fb0cad6f/source?k=secret'
    );
});
