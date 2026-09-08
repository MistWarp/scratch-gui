import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {execSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {defineConfig, loadEnv, build, transformWithEsbuild} from 'vite';
import react from '@vitejs/plugin-react';
import {viteCommonjs} from '@originjs/vite-plugin-commonjs';
import {nodePolyfills} from 'vite-plugin-node-polyfills';
import ejs from 'ejs';
import postcssImport from 'postcss-import';
import postcssVars from 'postcss-simple-vars';
import autoprefixer from 'autoprefixer';
import {APP_NAME} from './src/lib/constants/brand.js';
import {scratchDependencies} from './scripts/vite-dependencies.mjs';
import {writeEditorLocales} from './scripts/vite-locales.mjs';
import {writeCommunityLocales} from './scripts/community-translations.mjs';
import {writeScratchBlocks} from './scripts/vite-blocks.mjs';

const directory = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

const absolute = value => path.resolve(directory, value);
const reactDirectory = fs.realpathSync(absolute('node_modules/react'));
const reactDOMDirectory = fs.realpathSync(absolute('node_modules/react-dom'));

const globalCss = /\/(?:@fontsource|jsoneditor)\//;

const sharedResolve = {
    preserveSymlinks: true,
    dedupe: [
        'react', 'react-dom', 'react-intl', 'react-redux',
        '@turbowarp/jszip', 'immutable', 'lodash.bindall', 'rotur-sdk'
    ],
    alias: [
        // Linked workspace packages must share the renderer's hook dispatcher.
        {find: /^react$/, replacement: path.join(reactDirectory, 'index.js')},
        {find: /^react\/(.*)$/, replacement: `${reactDirectory}/$1`},
        {find: /^react-dom$/, replacement: path.join(reactDOMDirectory, 'index.js')},
        {find: /^react-dom\/(.*)$/, replacement: `${reactDOMDirectory}/$1`},
        {find: /^vite-plugin-node-polyfills\/shims\/(.*)$/,
            replacement: absolute('node_modules/vite-plugin-node-polyfills/shims/$1/dist/index.js')},
        {find: /^scratch-blocks$/, replacement: absolute('src/generated/scratch-blocks.js')},
        {find: /^scratch-render-fonts$/, replacement: absolute('src/lib/tw-scratch-render-fonts/index.js')},
        {find: /^fractch\/browser$/, replacement: absolute('node_modules/fractch/src/browser.js')},
        {find: /^text-encoding$/, replacement: absolute('src/lib/native-text-encoding.js')},
        {find: /^react-tooltip$/, replacement: absolute('node_modules/react-tooltip/dist/react-tooltip.min.cjs')}
    ]
};


const buildScript = async filename => {
    const result = await build({
        configFile: false,
        publicDir: false,
        logLevel: 'warn',
        resolve: sharedResolve,
        define: {'process.env.NODE_ENV': JSON.stringify('production')},
        plugins: [nodePolyfills()],
        build: {write: false,
            minify: true,
            lib: {entry: filename, name: 'ExtensionFrame', formats: ['iife']},
            commonjsOptions: {include: [/node_modules/, /scratch-vm/], transformMixedEsModules: true}}
    });
    const output = Array.isArray(result) ? result[0].output : result.output;
    return output.find(item => item.type === 'chunk').code;
};

const scriptCache = new Map();
const bundleScript = filename => {
    if (!scriptCache.has(filename)) scriptCache.set(filename, buildScript(filename));
    return scriptCache.get(filename);
};

// Scratch packages still ship loader requests in their source. Handle them here
// so the GUI does not need a Webpack installation or forks of those packages.
const scratchCompatibility = () => ({
    name: 'mistwarp-scratch-compatibility',
    enforce: 'pre',
    transform (code, id) {
        if (id.startsWith('\0')) return;
        id = id.split('?')[0];
        if (/\/peerjs\/dist\/peerjs(?:\.min)?\.js$/.test(id)) {
            // PeerJS 1.3's Parcel bundle assigns an undeclared variable. Modules
            // run in strict mode, so keep that bundle variable local.
            return transformWithEsbuild(`var parcelRequire;\n${code}`, id, {loader: 'js', format: 'esm'});
        }
        if (/\/(linebreak|grapheme-breaker)\/src\//.test(id)) {
            const data = fs.readFileSync(path.join(path.dirname(id), 'classes.trie'));
            code = code.replace(/fs\.readFileSync\(__dirname \+ '\/classes\.trie'(, 'base64')?\)/g,
                (_, base64) => (base64 ?
                    JSON.stringify(data.toString('base64')) : `new Uint8Array(${JSON.stringify([...data])})`));
        }
        if (/\.jsx?$/.test(id) && /\/src\//.test(id)) {
            return transformWithEsbuild(code, id, {loader: 'jsx', jsx: 'transform'});
        }
    },
    async resolveId (source, importer) {
        if (source.startsWith('\0mw-')) return source;
        if (/\?(base64|arraybuffer|recolor)$/.test(source)) {
            const [request, type] = source.split('?');
            const resolved = await this.resolve(request, importer, {skipSelf: true});
            if (!resolved) throw new Error(`Cannot resolve ${source}`);
            return `\0mw-${type}:${Buffer.from(resolved.id).toString('base64url')}.js`;
        }
        if (source.includes('!')) {
            const request = source.slice(source.lastIndexOf('!') + 1);
            const resolved = {id: createRequire(importer.split('?')[0]).resolve(request)};
            if (source.includes('ify-loader')) return createRequire(importer.split('?')[0]).resolve(request);
            if (source.includes('raw-loader')) return `${resolved.id}?raw`;
            if (source.includes('base64-loader')) {
                return `\0mw-base64:${Buffer.from(resolved.id).toString('base64url')}.js`;
            }
            if (source.includes('arraybuffer-loader')) {
                return `\0mw-arraybuffer:${Buffer.from(resolved.id).toString('base64url')}.js`;
            }
            if (source.includes('worker-loader')) return `${resolved.id}?worker`;
            if (source.includes('tw-load-script-as-plain-text')) {
                return `\0mw-script:${Buffer.from(resolved.id).toString('base64url')}.js`;
            }
            throw new Error(`Unsupported Scratch loader request: ${source}`);
        }
        // Existing GUI and paint styles use CSS modules without .module names.
        if (!source.includes('?') && source.endsWith('.css') && !source.endsWith('.module.css')) {
            const resolved = await this.resolve(source, importer, {skipSelf: true});
            if (resolved && !globalCss.test(resolved.id)) return `${resolved.id.slice(0, -4)}.module.css`;
        }
    },
    async load (id) {
        if (id.endsWith('.module.css') && !fs.existsSync(id)) {
            const original = id.replace(/\.module\.css$/, '.css');
            this.addWatchFile(original);
            return fs.readFileSync(original, 'utf8');
        }
        for (const type of ['base64', 'arraybuffer', 'script', 'recolor']) {
            const prefix = `\0mw-${type}:`;
            if (!id.startsWith(prefix)) continue;
            const filename = Buffer.from(id.slice(prefix.length, -3), 'base64url').toString();
            this.addWatchFile(filename);
            if (type === 'recolor') {
                return require('./src/lib/tw-recolor/build.js')(fs.readFileSync(filename, 'utf8'));
            }
            if (type === 'base64') {
                return `export default ${JSON.stringify(fs.readFileSync(filename).toString('base64'))};`;
            }
            if (type === 'arraybuffer') {
                return `export default new Uint8Array(${JSON.stringify([...fs.readFileSync(filename)])}).buffer;`;
            }
            return `export default ${JSON.stringify(await bundleScript(filename))};`;
        }
    }
});

const pageDefinitions = {
    'editor': ['editor.html', 'index', 'editor.jsx'],
    'community': ['index.html', 'simple', 'community.jsx'],
    'player': ['player.html', 'index', 'player.jsx'],
    'fullscreen': ['fullscreen.html', 'index', 'fullscreen.jsx'],
    'embed': ['embed.html', 'embed', 'embed.jsx'],
    'addon-settings': ['addons.html', 'simple', 'addon-settings.jsx'],
    'credits': ['credits.html', 'simple', 'credits/credits.jsx']
};

const pagesAndAssets = (env, root, library, generatedInputs) => {
    const routeRoot = root || '/';
    const selected = Object.entries(pageDefinitions).filter(([name]) =>
        (!env.ONLY_ENTRY || name === env.ONLY_ENTRY) &&
        !(env.MW_SKIP_EDITOR === 'true' && name === 'editor') &&
        (name !== 'community' || env.MW_COMMUNITY === 'true'));
    if (!library && selected.length === 0) throw new Error(`No entry selected: ${env.ONLY_ENTRY}`);
    const pages = new Map(selected.map(([name, [filename, template, entry]]) => [filename, {name, template, entry}]));
    if (pages.has('editor.html') && !pages.has('index.html') && env.MW_COMMUNITY !== 'true') {
        pages.set('index.html', pages.get('editor.html'));
    }
    const render = filename => {
        const page = pages.get(filename);
        const title = page.name === 'embed' ? `Embedded Project - ${APP_NAME}` :
            page.name === 'credits' ? `${APP_NAME} Credits` :
                page.name === 'addon-settings' ? `Addon Settings - ${APP_NAME}` : APP_NAME;
        const html = ejs.render(fs.readFileSync(absolute(`src/playground/${page.template}.ejs`), 'utf8'),
            {page: {root, APP_NAME, title}});
        const escape = value => String(value).replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/</g, '&lt;');
        const meta = Object.entries(JSON.parse(env.EXTRA_META || '{}')).map(([name, content]) =>
            `<meta name="${escape(name)}" content="${escape(content)}">`)
            .join('\n');
        return html.replace('</head>', `${meta}</head>`).replace('</body>',
            `<script type="module" src="/src/playground/${page.entry}"></script></body>`);
    };
    const copies = [
        ['node_modules/scratch-blocks/media', 'static/blocks-media/default'],
        ['node_modules/scratch-blocks/media', 'static/blocks-media/high-contrast'],
        ['src/lib/themes/blocks/high-contrast-media/blocks-media', 'static/blocks-media/high-contrast'],
        ['src/examples/extensions', 'static/extensions'],
        ['src/playground/service-worker.js', 'sw.js']
    ];
    const routing = server => {
        server.middlewares.use(async (req, res, next) => {
            const url = new URL(req.url, 'http://localhost');
            const pathname = decodeURIComponent(url.pathname);
            const local = pathname.startsWith(routeRoot) ? pathname.slice(routeRoot.length) : pathname.slice(1);
            for (const [from, to] of [...copies].reverse()) {
                if (local === to && fs.statSync(absolute(from)).isFile()) {
                    res.setHeader('Content-Type', 'text/javascript');
                    fs.createReadStream(absolute(from)).pipe(res);
                    return;
                }
                if (!local.startsWith(`${to}/`)) continue;
                const filename = path.resolve(absolute(from), local.slice(to.length + 1));
                if (filename.startsWith(`${absolute(from)}${path.sep}`) &&
                    fs.existsSync(filename) && fs.statSync(filename).isFile()) {
                    const types = {'.svg': 'image/svg+xml',
                        '.png': 'image/png',
                        '.js': 'text/javascript',
                        '.mp3': 'audio/mpeg',
                        '.wav': 'audio/wav'};
                    res.setHeader('Content-Type', types[path.extname(filename)] || 'application/octet-stream');
                    fs.createReadStream(filename).pipe(res);
                    return;
                }
            }
            if (!req.headers.accept?.includes('text/html')) return next();
            let filename = local.replace(/\/$/, '');
            if (/^(?:\d+\/)?(?:editor|fullscreen|embed)$/.test(filename)) {
                filename = `${filename.split('/').pop()}.html`;
            } else if (/^\d+$/.test(filename)) filename = 'player.html';
            else if (['addons', 'credits'].includes(filename)) filename += '.html';
            else if (!filename || !path.extname(filename)) filename = 'index.html';
            if (!pages.has(filename)) return next();
            try {
                res.setHeader('Content-Type', 'text/html');
                res.end(await server.transformIndexHtml(`/${filename}`, render(filename)));
            } catch (error) {
                next(error);
            }
        });
    };
    return {
        name: 'mistwarp-pages-and-assets',
        buildStart () {
            for (const filename of generatedInputs) this.addWatchFile(filename);
            if (this.meta.watchMode) {
                writeEditorLocales(directory);
                writeCommunityLocales(directory);
                writeScratchBlocks(directory);
            }
        },
        config: () => (library ? {} : {
            build: {rollupOptions: {input: (env.ONLY_ENTRY === 'editor' ?
                ['editor.html'] : [...pages.keys()]).map(absolute)}},
            optimizeDeps: {entries: [
                ...[...pages.values()].map(page => `src/playground/${page.entry}`),
                '!deploy-build/**'
            ]}
        }),
        resolveId: id => (pages.has(path.relative(directory, id)) ? id : null),
        load: id => (pages.has(path.relative(directory, id)) ? render(path.relative(directory, id)) : null),
        configureServer (server) {
            routing(server);
            server.watcher.add(generatedInputs);
            server.watcher.on('change', filename => {
                if (generatedInputs.includes(filename)) server.restart();
            });
        },
        configurePreviewServer (server) {
            server.middlewares.use((req, res, next) => {
                const url = new URL(req.url, 'http://localhost');
                let local = url.pathname.startsWith(routeRoot) ?
                    url.pathname.slice(routeRoot.length) : url.pathname.slice(1);
                local = local.replace(/\/$/, '');
                if (/^(?:\d+\/)?(?:editor|fullscreen|embed)$/.test(local)) local = `${local.split('/').pop()}.html`;
                else if (/^\d+$/.test(local)) local = 'player.html';
                else if (['addons', 'credits'].includes(local)) local += '.html';
                if (pages.has(local)) req.url = `${routeRoot}${local}${url.search}`;
                next();
            });
        },
        generateBundle (options, bundle) {
            if (!library && env.ONLY_ENTRY === 'editor') {
                const chunks = Object.values(bundle).filter(item => item.type === 'chunk');
                if (chunks.length !== 1 || chunks[0].imports.length || chunks[0].dynamicImports.length) {
                    this.error('The editor must be emitted as one JavaScript bundle without runtime imports.');
                }
            }
            if (env.MW_BUILD_STATS === 'true') {
                this.emitFile({type: 'asset',
                    fileName: 'stats.json',
                    source: JSON.stringify(Object.values(bundle).map(item => ({
                        fileName: item.fileName,
                        bytes: item.type === 'chunk' ? Buffer.byteLength(item.code) : Buffer.byteLength(item.source),
                        ...(item.type === 'chunk' ? {
                            imports: item.imports,
                            dynamicImports: item.dynamicImports,
                            modules: Object.keys(item.modules)
                        } : {})
                    })), null, 2)});
            }
        },
        writeBundle (options) {
            const out = options.dir;
            if (!library && env.ONLY_ENTRY === 'editor' && pages.has('index.html')) {
                fs.copyFileSync(path.join(out, 'editor.html'), path.join(out, 'index.html'));
            }
            // The first site pass already copied shared files into this output.
            if (env.MW_KEEP_BUILD === 'true') return;
            for (const [from, to] of copies) fs.cpSync(absolute(from), path.join(out, to), {recursive: true});
            if (!library && fs.existsSync(absolute('../docs/build'))) {
                fs.cpSync(absolute('../docs/build'), path.join(out, 'docs'), {recursive: true});
            }
            if (library) {
                fs.mkdirSync(path.join(out, 'libraries'), {recursive: true});
                const libraries = fs.readdirSync(absolute('src/lib/libraries')).filter(file => file.endsWith('.json'));
                for (const name of libraries) {
                    fs.copyFileSync(absolute(`src/lib/libraries/${name}`), path.join(out, 'libraries', name));
                }
            }
        }
    };
};

export default defineConfig(({mode}) => {
    const env = {...loadEnv(mode, directory, ''), ...process.env};
    writeEditorLocales(directory);
    writeCommunityLocales(directory);
    const generatedInputs = [...writeScratchBlocks(directory),
        absolute('src/lib/tw-translations/generated-translations.json'),
        ...fs.readdirSync(absolute('src/community/translations')).filter(name => name.endsWith('.json'))
            .map(name => absolute(`src/community/translations/${name}`))];
    const root = env.ROOT ?? '/';
    if (root && !root.endsWith('/')) throw new Error('If ROOT is defined, it must have a trailing slash.');
    const library = env.BUILD_MODE === 'dist';
    const values = {
        DEBUG: Boolean(env.DEBUG),
        ENABLE_SERVICE_WORKER: env.ENABLE_SERVICE_WORKER || '',
        ROOT: root,
        ROUTING_STYLE: env.ROUTING_STYLE || 'wildcard',
        MW_COMMUNITY: env.MW_COMMUNITY === 'true' ? 'true' : '',
        MW_BUILD_ID: env.MW_BUILD_ID || env.GITHUB_SHA || execSync('git rev-parse HEAD', {encoding: 'utf8'}).trim(),
        MW_BUILD_TIME: env.MW_BUILD_TIME || '',
        MW_STATUS_URL: env.MW_STATUS_URL || 'https://status.warp.mistium.com',
        GOOGLE_FONTS_API_KEY: env.GOOGLE_FONTS_API_KEY || 'demo'
    };
    return {
        cacheDir: `node_modules/.vite/${mode}-${env.PORT || 8601}`,
        base: library ? `${env.STATIC_PATH || '/static'}/` : root || './',
        publicDir: library ? false : 'static',
        resolve: sharedResolve,
        define: Object.fromEntries(Object.entries(values).map(([key, value]) =>
            [`process.env.${key}`, JSON.stringify(value)])),
        plugins: [scratchCompatibility(), react({jsxRuntime: 'classic'}),
            viteCommonjs({exclude: ['/node_modules/.vite/', '/peerjs/dist/', '/generated/scratch-blocks.js']}),
            nodePolyfills(), pagesAndAssets(env, root, library, generatedInputs)],
        css: {modules: {localsConvention: 'camelCase',
            generateScopedName: (name, filename) => {
                const original = filename.replace(/\.module\.css$/, '.css');
                const hash = createHash('sha256').update(path.relative(directory, original) + name)
                    .digest('base64url')
                    .slice(0, 5);
                return `${path.basename(original, '.css')}_${name}_${hash}`;
            }},
        postcss: {plugins: [postcssImport(), postcssVars(), autoprefixer()]}},
        server: {host: '0.0.0.0', port: Number(env.PORT || 8601), cors: true,
            watch: {ignored: ['**/deploy-build/**']},
            fs: {allow: [path.dirname(directory)]}},
        preview: {port: Number(env.PORT || 8601)},
        optimizeDeps: {
            include: ['react', 'react-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime',
                'react-router-dom', 'react-redux', 'react-intl',
                // These imports are injected after Vite scans source. Discovering them
                // later can mix dependency generations across lazy React routes.
                'vite-plugin-node-polyfills/shims/buffer',
                'vite-plugin-node-polyfills/shims/global',
                'vite-plugin-node-polyfills/shims/process',
                'scratch-vm', 'scratch-render', 'scratch-render-fonts',
                '@turbowarp/scratch-svg-renderer', 'peerjs', 'fs'],
            exclude: ['scratch-paint'],
            esbuildOptions: {loader: {'.js': 'jsx'}, plugins: [scratchDependencies(bundleScript)]}
        },
        worker: {format: 'iife', plugins: () => [scratchCompatibility(), nodePolyfills()]},
        build: {
            outDir: library ? 'dist' : env.BUILD_DIR || 'build',
            emptyOutDir: env.MW_KEEP_BUILD !== 'true',
            copyPublicDir: env.MW_KEEP_BUILD !== 'true',
            reportCompressedSize: env.MW_BUILD_STATS === 'true',
            sourcemap: Boolean(env.SOURCEMAP && env.SOURCEMAP !== 'false'),
            assetsInlineLimit: 2048,
            commonjsOptions: {
                include: [/node_modules/, /src/],
                extensions: ['.js', '.jsx', '.mjs', '.cjs'],
                transformMixedEsModules: true,
                requireReturnsDefault: id => (
                    /\?(raw|worker)$/.test(id) || id.startsWith('\0mw-') ? 'preferred' : false
                )
            },
            ...(!library && env.ONLY_ENTRY === 'editor' ? {
                cssCodeSplit: false,
                rollupOptions: {output: {inlineDynamicImports: true}}
            } : !library ? {
                // Shared translations belong in their own chunk on the other pages,
                // not in an arbitrarily named UI component such as "checkbox".
                rollupOptions: {output: {manualChunks: id => (
                    id.includes('/generated/editor-locales/') ? 'editor-locales' : undefined
                )}}
            } : {}),
            ...(library ? {lib: {entry: absolute('src/index.js'),
                name: 'GUI',
                formats: ['es', 'umd'],
                fileName: format => `scratch-gui.${format === 'es' ? 'mjs' : 'js'}`},
            rollupOptions: {
                external: ['react', 'react-dom'],
                output: {globals: {'react': 'React', 'react-dom': 'ReactDOM'}}
            }} : {})
        }
    };
});
