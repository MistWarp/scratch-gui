// Vite build for MistWarp scratch-gui. Replaces webpack.config.js.
// Env contract (same names as before):
//   ROOT            public base path, must end with / (default /)
//   MW_COMMUNITY    'true' enables community homepage at index.html
//   ONLY_ENTRY      build a single entry: editor|community|player|fullscreen|embed|addon-settings|credits
//   BUILD_DIR       output directory (default build)
//   SOURCEMAP       set to e.g. true to emit sourcemaps in production builds
import {defineConfig, loadEnv} from 'vite';
import react from '@vitejs/plugin-react';
import {viteStaticCopy} from 'vite-plugin-static-copy';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {APP_NAME} from './src/lib/constants/brand.js';

const dirname = path.dirname(fileURLToPath(import.meta.url));

const resolve = p => path.resolve(dirname, p);

// Dev-only CJS interop for the linked scratch-* packages (see
// mw-dev-cjs-interop below). Mirrors what build.commonjsOptions does for
// builds: static require() calls become imports, module.exports becomes a
// default export. Values match webpack semantics: CJS targets unwrap to
// their default export, ESM targets stay namespaces.
const linkedTypeCache = new Map();
const bareTypeCache = new Map();

const linkedTargetType = (spec, dir) => {
    const base = path.join(dir, spec);
    for (const candidate of [base, `${base}.js`, `${base}.json`, path.join(base, 'index.js')]) {
        try {
            if (!fs.statSync(candidate).isFile()) continue;
            if (candidate.endsWith('.json')) return 'default';
            const cached = linkedTypeCache.get(candidate);
            if (cached) return cached;
            const source = fs.readFileSync(candidate, 'utf8');
            const type = /(^|\n)\s*module\.exports|[^.]exports\.[A-Za-z_$]/.test(source) ?
                'default' : 'namespace';
            linkedTypeCache.set(candidate, type);
            return type;
        } catch (e) { /* try next candidate */ }
    }
    return 'namespace';
};

// How Vite will serve a bare import: CJS sources get pre-bundled with a
// default export, ESM sources stay namespaces. Inspect the resolved file.
const bareTargetType = (spec, dir) => {
    const cached = bareTypeCache.get(`${dir}::${spec}`);
    if (cached) return cached;
    // Plain Node resolution, not this.resolve(): in dev that can return the
    // pre-bundled ESM-ified file, which misclassifies CJS sources.
    let type = 'default';
    try {
        const req = createRequire(`${dir}/package.json`);
        const file = req.resolve(spec).split('?')[0];
        if (file.endsWith('.mjs')) {
            type = 'namespace';
        } else if (!file.endsWith('.cjs') && !file.endsWith('.json')) {
            let pkgDir = path.dirname(file);
            let pkg = null;
            for (let i = 0; i < 6; i++) {
                const pkgPath = path.join(pkgDir, 'package.json');
                if (fs.existsSync(pkgPath)) {
                    try {
                        pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
                    } catch (e) { /* ignore */ }
                    break;
                }
                const parent = path.dirname(pkgDir);
                if (parent === pkgDir) break;
                pkgDir = parent;
            }
            // Prefer the bundler entry: `module` is what Vite serves.
            const entry = (pkg && pkg.module) || '';
            if (entry) {
                const entryFile = path.join(pkgDir, entry);
                if (fs.existsSync(entryFile)) {
                    const source = fs.readFileSync(entryFile, 'utf8').slice(0, 65536);
                    if (!/(^|\n)\s*module\.exports|[^.]exports\.[A-Za-z_$]/.test(source)) {
                        type = 'namespace';
                    }
                }
            } else if (pkg && pkg.type === 'module') {
                type = 'namespace';
            } else if (!pkg || pkg.type !== 'commonjs') {
                const source = fs.readFileSync(file, 'utf8').slice(0, 65536);
                if (!/(^|\n)\s*module\.exports|[^.]exports\.[A-Za-z_$]/.test(source) &&
                    /(^|\n)\s*(import|export)\s/.test(source)) {
                    type = 'namespace';
                }
            }
        }
    } catch (e) { /* keep default */ }
    bareTypeCache.set(`${dir}::${spec}`, type);
    return type;
};

const transformLinkedCjs = async (code, dir) => {
    const imports = [];
    const seen = new Map();
    const unwrap = (spec, wantNamespace) => {
        const key = `${wantNamespace ? 'ns' : 'def'}:${spec}`;
        if (!seen.has(key)) {
            const name = `__mwR${seen.size}`;
            seen.set(key, name);
            imports.push(wantNamespace ?
                `import * as ${name} from ${JSON.stringify(spec)};` :
                `import ${name} from ${JSON.stringify(spec)};`);
        }
        const name = seen.get(key);
        return wantNamespace ? name : `(${name}.default ?? ${name})`;
    };
    // Classify once per spec. Vite query modules (?worker/?raw/…) and JSON
    // always export their payload as default.
    const specs = new Map();
    const classify = spec => {
        if (!specs.has(spec)) {
            let type = 'default';
            if (!spec.includes('!') && !spec.endsWith('.json')) {
                type = spec.startsWith('.') ?
                    linkedTargetType(spec, dir) :
                    bareTargetType(spec, dir);
            }
            specs.set(spec, type);
        }
        return specs.get(spec);
    };
    const isComment = line => {
        const trimmed = line.trimStart();
        return trimmed.startsWith('//') || trimmed.startsWith('*');
    };
    // Pre-resolve every require() spec so the sync replacement passes below
    // can look types up.
    const specPattern = /require\(\s*(['"])([^'"]+)\1\s*\)/g;
    for (const line of code.split('\n')) {
        if (isComment(line)) continue;
        for (const match of line.matchAll(specPattern)) {
            classify(match[2]);
        }
    }
    const lookup = spec => specs.get(spec) || 'default';
    const lines = code.split('\n').map(line => {
        if (isComment(line) || !line.includes('require(')) return line;
        // const X = require('S'); / const {a} = require('S'); / const X = require('S').prop;
        const declarator = new RegExp(
            '(const|let|var)\\s+(\\{[^}]*\\}|[A-Za-z_$][\\w$]*)\\s*=\\s*' +
            'require\\(\\s*([\'"])([^\'"]+)\\3\\s*\\)(\\.[A-Za-z_$][\\w$]*)?',
            'g'
        );
        return line.replace(
            declarator,
            (match, kind, binding, quote, spec, prop) => {
                const type = lookup(spec);
                if (binding.startsWith('{')) {
                    // Destructure from merged namespace so CJS defaults
                    // and ESM named exports both work.
                    const name = `__mwD${seen.size}`;
                    seen.set(`merge:${spec}`, name);
                    imports.push(`import * as ${name} from ${JSON.stringify(spec)};`);
                    const merged = `{...${name}, ...(${name}.default || {})}`;
                    return `${kind} ${binding} = ${merged}${prop || ''}`;
                }
                if (type === 'default') {
                    const name = unwrap(spec, false);
                    return `${kind} ${binding} = ${name}${prop || ''}`;
                }
                const name = unwrap(spec, true);
                return `${kind} ${binding} = ${name}${prop || ''}`;
            }
        );
    })
        .map(line => {
            if (isComment(line) || !line.includes('require(')) return line;
            // Bare side-effect require.
            if (/^\s*require\(\s*(['"])[^'"]+\1\s*\)\s*;?\s*$/.test(line)) {
                return line.replace(
                    /require\(\s*(['"])([^'"]+)\1\s*\)/,
                    (match, quote, spec) => `import ${JSON.stringify(spec)}`
                );
            }
            // Any other expression-position require().
            // The [^.\w$] guard skips property access like goog.require() or
            // __webpack_require__() inside prebuilt bundles.
            return line.replace(
                /(^|[^.\w$])require\(\s*(['"])([^'"]+)\1\s*\)(\.[A-Za-z_$][\w$]*)?/g,
                (match, prefix, quote, spec, prop) => {
                    const type = lookup(spec);
                    const value = unwrap(spec, type === 'namespace');
                    return `${prefix}${value}${prop || ''}`;
                }
            );
        });
    let output = lines.join('\n');
    const footer = [];
    let hasDefault = false;
    const named = [];
    output = output.replace(/^([ \t]*)module\.exports\s*=\s*/gm, (match, indent) => {
        hasDefault = true;
        footer.push('export default __mw_default;');
        return `${indent}const __mw_default = `;
    });
    output = output.replace(/^([ \t]*)exports\.([A-Za-z_$][\w$]*)\s*=\s*/gm, (match, indent, name) => {
        named.push(name);
        footer.push(`export {__mw_exp_${name} as ${name}};`);
        return `${indent}const __mw_exp_${name} = `;
    });
    if (!hasDefault && named.length > 0) {
        // exports.*-only file (e.g. blocks-execute-cache.js): consumers
        // require() the whole exports object, so synthesize a default.
        footer.push(`export default {${named.join(', ')}};`);
    }
    if (hasDefault) {
        // Named re-exports so `import {x} from` works, like the build's
        // CJS handling provides. Single export statement, no new bindings,
        // so it can never collide with module-scope declarations.
        try {
            const lexer = await import('cjs-module-lexer');
            await lexer.init();
            const {exports: detected} = lexer.parse(code);
            const existing = new Set(named);
            for (const match of output.matchAll(/^export\s+(?:const|let|var|function|class|\{)/gm)) {
                existing.add(match[0]);
            }
            const reexports = [];
            for (const name of detected) {
                if (name === 'default' || name === '__esModule' || existing.has(name)) continue;
                if (!/^[A-Za-z_$][\w$]*$/.test(name)) continue;
                existing.add(name);
                let alias = `__mw_re_${name}`;
                for (let i = 2; output.includes(alias); i++) alias = `__mw_re_${name}_${i}`;
                footer.push(`const ${alias} = __mw_default.${name};`);
                reexports.push(`${alias} as ${name}`);
            }
            if (reexports.length > 0) {
                footer.push(`export {${reexports.join(', ')}};`);
            }
        } catch (e) { /* lexer failure: default export still works */ }
    }
    if (imports.length === 0 && footer.length === 0) return null;
    return `${imports.join('\n')}\n${output}\n${footer.join('\n')}\n`;
};

export default defineConfig(({mode}) => {
    const env = {...loadEnv(mode, dirname, ''), ...process.env};
    const IS_PRODUCTION = mode === 'production';

    const root = env.ROOT || '/';
    if (root.length > 0 && !root.endsWith('/')) {
        throw new Error('If ROOT is defined, it must have a trailing slash.');
    }
    const ENABLE_COMMUNITY = env.MW_COMMUNITY === 'true';
    const ONLY_ENTRY = env.ONLY_ENTRY || '';
    const BUILD_DIR = env.BUILD_DIR || 'build';

    const editorTitle = `${APP_NAME} - Enhance Your Scratch Experience`;
    const entrySrc = {
        'editor.html': './src/playground/editor.jsx',
        'player.html': './src/playground/player.jsx',
        'fullscreen.html': './src/playground/fullscreen.jsx',
        'embed.html': './src/playground/embed.jsx',
        'addons.html': './src/playground/addon-settings.jsx',
        'credits.html': './src/playground/credits/credits.jsx',
        'community.html': './src/playground/community.jsx',
        'index.html': ENABLE_COMMUNITY ?
            './src/playground/community.jsx' : './src/playground/editor.jsx'
    };
    const titles = {
        'editor.html': editorTitle,
        'player.html': editorTitle,
        'fullscreen.html': editorTitle,
        'embed.html': `Embedded Project - ${APP_NAME}`,
        'addons.html': `Addon Settings - ${APP_NAME}`,
        'credits.html': `${APP_NAME} Credits`,
        'community.html': APP_NAME,
        'index.html': ENABLE_COMMUNITY ? APP_NAME : editorTitle
    };

    const allEntries = {
        index: resolve('index.html'),
        editor: resolve('editor.html'),
        player: resolve('player.html'),
        fullscreen: resolve('fullscreen.html'),
        embed: resolve('embed.html'),
        addons: resolve('addons.html'),
        credits: resolve('credits.html')
    };
    // ONLY_ENTRY uses public page names (community, addon-settings); map to entry keys.
    const onlyKey = ONLY_ENTRY === 'community' ? 'index' :
        ONLY_ENTRY === 'addon-settings' ? 'addons' : ONLY_ENTRY;
    const entries = Object.fromEntries(
        Object.entries(allEntries).filter(([name]) => !onlyKey || name === onlyKey)
    );
    if (ONLY_ENTRY && !(onlyKey in allEntries)) {
        throw new Error(`Unknown ONLY_ENTRY=${ONLY_ENTRY}`);
    }

    // Rewrites mirror the old webpack-dev-server historyApiFallback.
    const rewrites = [
        [/^\/editor\/?$/, '/editor.html'],
        [/^\/fullscreen\/?$/, '/fullscreen.html'],
        [/^\/embed\/?$/, '/embed.html'],
        [/^\/addons\/?$/, '/addons.html'],
        [/^\/credits\/?$/, '/credits.html'],
        [/^\/\d+\/?$/, '/player.html'],
        [/^\/\d+\/fullscreen\/?$/, '/fullscreen.html'],
        [/^\/\d+\/editor\/?$/, '/editor.html'],
        [/^\/\d+\/embed\/?$/, '/embed.html']
    ];
    const communityIndex = '/index.html';

    return {
        base: root,
        publicDir: resolve('static'),
        define: {
            'process.env.NODE_ENV': JSON.stringify(mode),
            'process.env.DEBUG': JSON.stringify(Boolean(env.DEBUG)),
            'process.env.ENABLE_SERVICE_WORKER': JSON.stringify(env.ENABLE_SERVICE_WORKER || ''),
            'process.env.ROOT': JSON.stringify(root),
            'process.env.ROUTING_STYLE': JSON.stringify(env.ROUTING_STYLE || 'wildcard'),
            'process.env.MW_COMMUNITY': JSON.stringify(ENABLE_COMMUNITY ? 'true' : ''),
            'process.env.MW_STATUS_URL': JSON.stringify(
                env.MW_STATUS_URL || 'https://status.warp.mistium.com'
            ),
            'process.env.GOOGLE_FONTS_API_KEY': JSON.stringify(env.GOOGLE_FONTS_API_KEY || 'demo')
        },
        resolve: {
            alias: [
                {find: /^scratch-render-fonts$/, replacement: resolve('src/lib/tw-scratch-render-fonts')},
                {
                    find: /^react-tooltip$/,
                    replacement: resolve('node_modules/react-tooltip/dist/react-tooltip.min.cjs')
                },
                {find: /^react$/, replacement: resolve('node_modules/react')},
                {find: /^react-dom$/, replacement: resolve('node_modules/react-dom')},
                // scratch-blocks' browser field points at the raw shim, which
                // needs webpack-only loaders (imports-loader/exports-loader).
                // Use the prebuilt bundle everywhere, like the old build did.
                {
                    find: /^scratch-blocks$/,
                    replacement: resolve('../scratch-blocks/dist/vertical.js')
                },
                // react-virtualized's dist/es build references a
                // bpfrpt_proptype_* export that does not exist (webpack only
                // warned about it). Use the CommonJS build instead.
                {
                    find: /^react-virtualized$/,
                    replacement: resolve('node_modules/react-virtualized/dist/commonjs/index.js')
                }
            ]
        },
        css: {
            modules: {
                generateScopedName: '[name]_[local]_[hash:base64:5]',
                localsConvention: 'camelCase'
            }
        },
        assetsInclude: ['**/*.hex'],
        assetsInlineLimit: 2048,
        worker: {
            format: 'es'
        },
        server: {
            host: '0.0.0.0',
            port: Number(env.PORT || 8601),
            headers: {'Access-Control-Allow-Origin': '*'},
            // The linked scratch-* packages live one level up and are served
            // straight from there in dev.
            fs: {
                allow: [resolve('..')]
            }
        },
        build: {
            outDir: BUILD_DIR,
            emptyOutDir: true,
            assetsDir: 'static/assets',
            sourcemap: Boolean(env.SOURCEMAP),
            chunkSizeWarningLimit: 2000,
            // The linked scratch-* packages still use require() in places.
            // Transform them like the old babel preset-env output did, and
            // unwrap ESM default exports so worker-loader-shaped
            // require() calls keep returning the constructor directly.
            commonjsOptions: {
                include: [
                    /node_modules/,
                    /scratch-vm\//,
                    /scratch-render\//,
                    /scratch-audio\//,
                    /scratch-blocks\//,
                    /scratch-paint\//
                ],
                transformMixedEsModules: true,
                requireReturnsDefault: 'auto'
            },
            rollupOptions: {
                input: entries,
                output: {
                    entryFileNames: 'js/[name]-[hash].js',
                    chunkFileNames: 'js/[name]-[hash].js'
                }
            }
        },
        plugins: [
            // Classic runtime: repo is still on React 16 (no jsx-runtime).
            // Note: @vitejs/plugin-react v6 uses Oxc, not Babel, so the old
            // react-intl message extractor does not run here. Extraction is
            // covered by the `i18n:src` script, which still uses .babelrc.
            react({
                jsxRuntime: 'classic'
            }),
            // Dev serves the linked scratch-* packages raw (their webpack
            // inline-loader requests break esbuild pre-bundling), so give
            // them the same CJS interop there that build.commonjsOptions
            // provides for builds. Covers module.exports/exports.* and
            // static require() calls.
            {
                name: 'mw-dev-cjs-interop',
                enforce: 'pre',
                apply: 'serve',
                transform (code, id) {
                    const file = id.split('?')[0];
                    if (!file.endsWith('.js')) return null;
                    if (!/\/scratch-(vm|render|audio|blocks|paint)\//.test(file)) return null;
                    if (file.includes('/node_modules/')) return null;
                    if (!/require\(|module\.exports|exports\.[A-Za-z_$]/.test(code)) return null;
                    return transformLinkedCjs(code, path.dirname(file));
                }
            },
            // The old webpack css-loader ran with modules:true for every .css
            // file except @fontsource and monaco-editor. Vite only treats
            // *.module.css as modules, so redirect other CSS imports to a
            // virtual .module.css id whose content is the real file. Bare
            // (side-effect) imports keep working because the styles are still
            // injected; scoping matches webpack.
            {
                name: 'mw-css-modules-all',
                enforce: 'pre',
                async resolveId (source, importer) {
                    if (!importer || source.includes('?')) return null;
                    if (!/\.css$/.test(source) || source.endsWith('.module.css')) return null;
                    const resolved = await this.resolve(source, importer, {skipSelf: true});
                    if (!resolved || resolved.id.includes('\0')) return null;
                    const file = resolved.id.split('?')[0];
                    if (!file.endsWith('.css') || file.endsWith('.module.css')) return null;
                    if (/node_modules[\\/](@fontsource|monaco-editor)[\\/]/.test(file)) return null;
                    return `${file.slice(0, -4)}.module.css`;
                },
                async load (id) {
                    if (!id.endsWith('.module.css')) return null;
                    const real = `${id.slice(0, -11)}.css`;
                    if (/node_modules[\\/](@fontsource|monaco-editor)[\\/]/.test(real)) return null;
                    try {
                        return await fs.promises.readFile(real, 'utf8');
                    } catch (e) {
                        return null;
                    }
                }
            },
            // Compat for webpack inline-loader requests still used in src and
            // in the linked scratch-* packages:
            //   worker-loader?...!./x      -> ./x?worker
            //   raw-loader!./x             -> ./x?raw
            //   url-loader/file-loader!./x -> ./x?url
            //   arraybuffer/base64-loader   -> ?arraybuffer/?base64 (see mw-raw-binary)
            //   tw-load-script-as-plain-text!./x -> ./x?raw
            //   ify-loader!pkg             -> pkg (plain require; no-op under webpack)
            //   style-loader/css-loader-only chains -> plain path (global CSS)
            {
                name: 'mw-webpack-inline-loaders',
                enforce: 'pre',
                resolveId (source, importer) {
                    if (!importer || !source.includes('!')) return null;
                    if (source.includes('tw-recolor/build!')) return null;
                    const parts = source.split('!');
                    const target = parts.pop();
                    const prefixes = parts.join('!');
                    const queryFor = prefix => {
                        if (/worker-loader/.test(prefix)) return 'worker';
                        if (/raw-loader|tw-load-script-as-plain-text/.test(prefix)) return 'raw';
                        if (/url-loader|file-loader/.test(prefix)) return 'url';
                        if (/arraybuffer-loader/.test(prefix)) return 'arraybuffer';
                        if (/base64-loader/.test(prefix)) return 'base64';
                        return null;
                    };
                    const query = queryFor(prefixes);
                    if (query) {
                        return this.resolve(
                            `${target}?${query}`, importer, {skipSelf: true}
                        );
                    }
                    // ify-loader and bare style/css-loader chains: plain request.
                    if (/ify-loader|css-loader|style-loader/.test(prefixes)) {
                        return this.resolve(target, importer, {skipSelf: true});
                    }
                    return null;
                }
            },
            // Compat for the tw-recolor webpack loader
            // (src/lib/tw-recolor/build.js): `!.../tw-recolor/build!./x.svg`
            // imports a getSRC() function returning a data: URI, recoloring
            // #855cd6 with the runtime window.Recolor theme color.
            {
                name: 'mw-tw-recolor',
                enforce: 'pre',
                async resolveId (source, importer) {
                    if (!importer || !source.includes('tw-recolor/build!')) return null;
                    const target = source.slice(source.lastIndexOf('!') + 1);
                    const resolved = await this.resolve(target, importer, {skipSelf: true});
                    if (!resolved) return null;
                    return `${resolved.id.split('?')[0]}?tw-recolor`;
                },
                async load (id) {
                    if (!id.endsWith('?tw-recolor')) return null;
                    const svg = await fs.promises.readFile(id.slice(0, -'?tw-recolor'.length), 'utf8');
                    const original = JSON.stringify(svg);
                    return `const original = ${original};
const getSRC = () => {
    const recolored = typeof Recolor === 'object' ? (
        original.replace(/#855cd6/gi, Recolor.primary)
    ) : original;
    return 'data:image/svg+xml;,' + encodeURIComponent(recolored);
};
export default getSRC;
`;
                }
            },
            //   ?arraybuffer -> ArrayBuffer (was arraybuffer-loader)
            //   ?base64      -> raw base64 string without data: prefix (was base64-loader)
            {
                name: 'mw-raw-binary',
                enforce: 'pre',
                async load (id) {
                    const queryIndex = id.indexOf('?');
                    if (queryIndex === -1) return null;
                    const file = id.slice(0, queryIndex);
                    const query = id.slice(queryIndex);
                    if (!query.startsWith('?arraybuffer') && !query.startsWith('?base64')) return null;
                    if (!fs.existsSync(file)) return null;
                    const buffer = await fs.promises.readFile(file);
                    const base64 = buffer.toString('base64');
                    if (query.startsWith('?arraybuffer')) {
                        return 'const bytes = Uint8Array.from(atob(' +
                            `${JSON.stringify(base64)}), c => c.charCodeAt(0));\n` +
                            'export default bytes.buffer;\n';
                    }
                    return `export default ${JSON.stringify(base64)};\n`;
                }
            },
            {
                name: 'mw-html-tokens',
                transformIndexHtml: {
                    order: 'pre',
                    handler (html, ctx) {
                        const base = path.basename(ctx.filename || ctx.path || '');
                        const title = titles[base] || APP_NAME;
                        const entry = entrySrc[base] || './src/playground/editor.jsx';
                        const manifest = (root === '/' || root === '') ?
                            `<link rel="manifest" href="${root}manifest.webmanifest">` : '';
                        return html
                            .replaceAll('%APP_NAME%', APP_NAME)
                            .replaceAll('%PAGE_TITLE%', title)
                            .replaceAll('%ENTRY_SRC%', entry)
                            .replaceAll('%ROOT_JSON%', JSON.stringify(root))
                            .replaceAll('%MANIFEST_LINK%', manifest)
                            .replaceAll('%ROOT%', root);
                    }
                }
            },
            {
                name: 'mw-history-fallback',
                configureServer (server) {
                    server.middlewares.use((req, res, next) => {
                        const url = (req.url || '').split(/[?#]/)[0];
                        for (const [pattern, target] of rewrites) {
                            if (pattern.test(url)) {
                                req.url = target;
                                return next();
                            }
                        }
                        // Anything else without an extension (/, /explore, /project/*, ...)
                        // falls through to the community app, like before.
                        const accept = req.headers.accept || '';
                        if (req.method === 'GET' && accept.includes('text/html') &&
                            !path.extname(url) && !url.startsWith('/src/') &&
                            !url.startsWith('/node_modules/') && !url.startsWith('/@')) {
                            req.url = communityIndex;
                        }
                        next();
                    });
                }
            },
            // sw.js is registered at `${ROOT}sw.js` (see load-service-worker.js).
            // Emit it as a plain asset instead of a bundle entry.
            {
                name: 'mw-service-worker',
                async generateBundle () {
                    const source = await fs.promises.readFile(
                        resolve('src/playground/service-worker.js'), 'utf8'
                    );
                    this.emitFile({type: 'asset', fileName: 'sw.js', source});
                },
                configureServer (server) {
                    server.middlewares.use((req, res, next) => {
                        if ((req.url || '').split(/[?#]/)[0] !== '/sw.js') return next();
                        fs.promises.readFile(resolve('src/playground/service-worker.js'), 'utf8')
                            .then(source => {
                                res.setHeader('Content-Type', 'application/javascript');
                                res.end(source);
                            })
                            .catch(next);
                    });
                }
            },
            viteStaticCopy({
                targets: [
                    {
                        src: 'node_modules/scratch-blocks/media/*',
                        dest: 'static/blocks-media/default'
                    },
                    {
                        src: 'node_modules/scratch-blocks/media/*',
                        dest: 'static/blocks-media/high-contrast'
                    },
                    {
                        src: 'src/lib/themes/blocks/high-contrast-media/blocks-media/*',
                        dest: 'static/blocks-media/high-contrast',
                        overwrite: true
                    },
                    {
                        src: 'src/examples/extensions/*',
                        dest: 'static'
                    }
                ]
            }),
            // Old webpack copied ../docs/build to docs/ when present.
            // (fs.cpSync: vite-plugin-static-copy mangles ../ source paths.)
            {
                name: 'mw-docs-copy',
                apply: 'build',
                closeBundle () {
                    if (!IS_PRODUCTION) return;
                    const from = resolve('../docs/build');
                    if (!fs.existsSync(from)) return;
                    fs.cpSync(from, path.join(BUILD_DIR, 'docs'), {recursive: true});
                }
            }
        ]
    };
});
