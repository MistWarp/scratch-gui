import {build, transformWithEsbuild} from 'vite';
import {Script} from 'node:vm';
export const packagerRuntime = ({buildId, absolute, sharedResolve, scratchCompatibility, nodePolyfills,
    postcssImport, postcssVars, autoprefixer}) => {
    const runtimeCache = new Map();
    let development = false;
    const bundlePackagerRuntime = requestedName => {
        // Both variants currently include music support and share one compilation.
        const name = requestedName === 'scaffolding-min.js' ? 'scaffolding-full.js' : requestedName;
        if (!runtimeCache.has(name)) {
            runtimeCache.set(name, (async () => {
                const entry = name === 'addons.js' ? 'addons/index.js' : 'scaffolding/export.js';
                const result = await build({
                    configFile: false,
                    publicDir: false,
                    logLevel: 'warn',
                    resolve: sharedResolve,
                    define: {'process.env.NODE_ENV': JSON.stringify('production')},
                    plugins: [scratchCompatibility({inlineWorkers: true}), nodePolyfills()],
                    css: {modules: {localsConvention: 'camelCase'},
                        postcss: {plugins: [postcssImport(), postcssVars(), autoprefixer()]}},
                    worker: {format: 'iife', plugins: () => [scratchCompatibility(), nodePolyfills()]},
                    build: {write: false,
                        // Minify after Vite's library pass: its helper relocation
                        // interprets $& in replacement strings and corrupts this runtime.
                        minify: false,
                        target: 'esnext',
                        assetsInlineLimit: Infinity,
                        lib: {entry: absolute(`src/packager/${entry}`), name: 'PackagerRuntime', formats: ['iife']},
                        commonjsOptions: {include: [/node_modules/, /src/],
                            transformMixedEsModules: true,
                            requireReturnsDefault: id => (
                                /\?(raw|worker)(?:&inline)?$/.test(id) || id.startsWith('\0mw-') ? 'preferred' : false
                            )}}
                });
                const output = Array.isArray(result) ? result[0].output : result.output;
                const css = output.filter(item => item.type === 'asset' && item.fileName.endsWith('.css'))
                    .map(item => item.source)
                    .join('\n');
                const {code} = await transformWithEsbuild(output.find(item => item.type === 'chunk').code,
                    name, {minify: true, target: 'es2020'});
                new Script(code, {filename: name});
                return `(function(){const style=document.createElement('style');` +
                    `style.textContent=${JSON.stringify(css)};document.head.appendChild(style);})();\n` +
                    `${code}\n// ${buildId} =^..^=`;
            })());
        }
        return runtimeCache.get(name);
    };
    return ({
        name: 'mistwarp-packager-runtime',
        configResolved (config) {
            development = config.command === 'serve';
        },
        resolveId (id) {
            if (id === 'virtual:packager-runtime') return '\0mw-packager-runtime.js';
        },
        load (id) {
            if (id === '\0mw-packager-runtime.js') {
                return `export const buildId = ${JSON.stringify(buildId)};\n` +
                    `export const development = ${development};\n` +
                    'export const runtimeUrl = name => ' +
                    `\`\${import.meta.env.BASE_URL}packager-runtime/\${buildId}/\${name}\`;\n` +
                    // The branding a packaged project carries belongs to whichever app did the
                    // packaging, so the host supplies it rather than src/packager hardcoding ours.
                    'export {APP_NAME as appName, WEBSITE as website, ACCENT_COLOR as accentColor} ' +
                    `from ${JSON.stringify(absolute('src/lib/constants/brand.js'))};\n` +
                    'export {default as copyrightNotice} ' +
                    `from ${JSON.stringify(absolute('src/packager/copyright-notice.js'))};\n`;
            }
        },
        configureServer (server) {
            server.watcher.on('change', filename => {
                if (/\/(src|scratch-vm|scratch-render|scratch-audio)\//.test(filename)) runtimeCache.clear();
            });
            server.middlewares.use(async (req, res, next) => {
                const pattern = /\/packager-runtime\/([a-f0-9]+)\/([a-z-]+)\.js(?:\?.*)?$/;
                const match = pattern.exec(req.url);
                if (!match || match[1] !== buildId) return next();
                if (!['scaffolding-full', 'scaffolding-min', 'addons'].includes(match[2])) return next();
                try {
                    const code = await bundlePackagerRuntime(`${match[2]}.js`);
                    res.setHeader('Content-Type', 'text/javascript');
                    res.end(code);
                } catch (error) {
                    next(error);
                }
            });
        },
        async generateBundle () {
            for (const name of ['scaffolding-full.js', 'scaffolding-min.js', 'addons.js']) {
                this.emitFile({type: 'asset',
                    fileName: `packager-runtime/${buildId}/${name}`,
                    source: await bundlePackagerRuntime(name)});
            }
        }
    });

};
