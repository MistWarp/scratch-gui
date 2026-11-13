/** @jest-environment node */
import path from 'path';
import {createOfflineManifest, writeOfflineWorker} from '../../../scripts/vite-offline.mjs';

const ROOT = '/repo';
const L10N = '/repo/node_modules/.pnpm/@turbowarp+scratch-l10n@5.0.0/node_modules/@turbowarp/scratch-l10n';

const chunk = (fileName, options = {}) => ({
    type: 'chunk',
    fileName,
    code: '',
    imports: [],
    dynamicImports: [],
    isEntry: false,
    isDynamicEntry: false,
    facadeModuleId: null,
    moduleIds: [],
    ...options
});
const language = (fileName, ...moduleIds) => chunk(fileName, {isDynamicEntry: true, moduleIds});
const asset = (fileName, source) => ({type: 'asset', fileName, source});

const bundleOf = (...items) => Object.fromEntries(items.map(item => [item.fileName, item]));

const editorBundle = () => bundleOf(
    asset('editor.html', '<script type="module" src="/assets/editor-AAAAAAAA.js"></script>' +
        '<link rel="stylesheet" href="/assets/editor-CCCCCCCC.css">'),
    asset('index.html', '<script type="module" src="/assets/community-DDDDDDDD.js"></script>'),
    chunk('assets/editor-AAAAAAAA.js', {
        isEntry: true,
        facadeModuleId: path.join(ROOT, 'editor.html'),
        imports: ['assets/shared-BBBBBBBB.js'],
        dynamicImports: ['assets/paint-EEEEEEEE.js', 'assets/de-FFFFFFFF.js', 'assets/de-GGGGGGGG.js',
            'assets/de-KKKKKKKK.js'],
        code: 'new Worker(new URL("/assets/lint.worker-HHHHHHHH.js", import.meta.url))'
    }),
    chunk('assets/shared-BBBBBBBB.js'),
    chunk('assets/paint-EEEEEEEE.js', {
        isDynamicEntry: true,
        moduleIds: ['/repo/src/paint.js', '/repo/src/generated/editor-locales/de.json']
    }),
    language('assets/de-FFFFFFFF.js', '/repo/src/generated/editor-locales/de.json'),
    language('assets/de-GGGGGGGG.js', `\0${L10N}/src/locale-data/de.js?commonjs-module`,
        `${L10N}/src/locale-data/de.js`, `\0${L10N}/src/locale-data/de.js?commonjs-es-import`),
    language('assets/de-KKKKKKKK.js', '/repo/src/generated/community-locales/de.json'),
    asset('assets/lint.worker-HHHHHHHH.js', 'self.onmessage = () => {};'),
    asset('assets/editor-CCCCCCCC.css', Buffer.from('@font-face{src:url(/assets/sans-IIIIIIII.woff2)}')),
    asset('assets/sans-IIIIIIII.woff2', Buffer.from([0, 1, 2])),
    chunk('assets/community-DDDDDDDD.js', {isEntry: true, facadeModuleId: path.join(ROOT, 'index.html')})
);

test('keeps everything the editor page can load and leaves languages to download on use', () => {
    const manifest = createOfflineManifest(editorBundle(), {
        directory: ROOT,
        pages: ['editor.html'],
        files: ['static/blocks-media/default/icon.svg'],
        version: 'v1'
    });
    expect(manifest).toEqual({
        version: 'v1',
        pages: {'editor.html': 'assets/editor-AAAAAAAA.js'},
        precache: [
            'assets/editor-AAAAAAAA.js',
            'assets/editor-CCCCCCCC.css',
            'assets/lint.worker-HHHHHHHH.js',
            'assets/paint-EEEEEEEE.js',
            'assets/sans-IIIIIIII.woff2',
            'assets/shared-BBBBBBBB.js',
            'static/blocks-media/default/icon.svg'
        ],
        languages: {
            'assets/de-FFFFFFFF.js': {key: 'src/generated/editor-locales/de.json', language: 'de'},
            'assets/de-GGGGGGGG.js': {key: '@turbowarp/scratch-l10n/src/locale-data/de.js'},
            'assets/de-KKKKKKKK.js': {key: 'src/generated/community-locales/de.json', language: 'de'}
        }
    });
});

test('the English catalogue is part of the editor, not a download', () => {
    const bundle = editorBundle();
    bundle['assets/editor-AAAAAAAA.js'].dynamicImports.push('assets/en-JJJJJJJJ.js');
    bundle['assets/en-JJJJJJJJ.js'] = language('assets/en-JJJJJJJJ.js', '/repo/src/generated/editor-locales/en.json');
    const manifest = createOfflineManifest(bundle, {directory: ROOT, pages: ['editor.html'], version: 'v1'});
    expect(manifest.precache).toContain('assets/en-JJJJJJJJ.js');
    expect(Object.keys(manifest.languages)).not.toContain('assets/en-JJJJJJJJ.js');
});

test('refuses pages that the build does not contain or that have no script', () => {
    const bundle = editorBundle();
    expect(() => createOfflineManifest(bundle, {directory: ROOT, pages: ['addons.html'], version: 'v1'}))
        .toThrow('The offline page addons.html is not part of this build.');
    bundle['addons.html'] = asset('addons.html', '<p>Addons</p>');
    expect(() => createOfflineManifest(bundle, {directory: ROOT, pages: ['addons.html'], version: 'v1'}))
        .toThrow('The offline page addons.html has no entry script.');
});

test('writes the manifest into the worker exactly once and as data', () => {
    const manifest = {version: 'v1', precache: ["assets/$&-$'.js"]};
    const worker = writeOfflineWorker('const OFFLINE = self.__MW_OFFLINE__;\n', manifest);
    expect(worker).toBe(`const OFFLINE = ${JSON.stringify(manifest)};\n`);
    expect(() => writeOfflineWorker('const OFFLINE = {};', manifest)).toThrow('The worker source has no');
});
