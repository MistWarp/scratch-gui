import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import recolor from '../src/lib/tw-recolor/build.js';

// Prebundle Scratch's CommonJS graph as a unit so circular require() calls keep
// their Node semantics. Loader requests inside published Scratch sources become
// ordinary modules; none of the old Webpack loaders are executed.
export const scratchDependencies = bundleScript => ({
    name: 'mistwarp-scratch-dependencies',
    setup (builder) {
        const resolve = (request, importer) => createRequire(importer).resolve(request);
        builder.onResolve({filter: /!|\?(base64|arraybuffer|recolor)$/}, args => {
            let request = args.path;
            let type;
            if (request.includes('!')) {
                const loader = request.slice(0, request.lastIndexOf('!'));
                request = request.slice(request.lastIndexOf('!') + 1);
                if (loader.includes('raw-loader')) type = 'raw';
                else if (loader.includes('base64-loader')) type = 'base64';
                else if (loader.includes('arraybuffer-loader')) type = 'arraybuffer';
                else if (loader.includes('worker-loader')) type = 'worker';
                else if (loader.includes('tw-load-script-as-plain-text')) type = 'script';
                else if (loader.includes('ify-loader')) type = 'ify';
                else throw new Error(`Unsupported Scratch dependency loader: ${loader}`);
            } else {
                [request, type] = request.split('?');
            }
            const filename = resolve(request, args.importer);
            return type === 'ify' ? {path: filename} : {path: filename, namespace: `mw-${type}`};
        });
        for (const type of ['raw', 'base64', 'arraybuffer', 'worker', 'script', 'recolor']) {
            builder.onLoad({filter: /.*/, namespace: `mw-${type}`}, async args => {
                if (type === 'recolor') return {contents: recolor(fs.readFileSync(args.path, 'utf8')), loader: 'js'};
                if (type === 'worker') {
                    const source = await bundleScript(args.path);
                    return {contents: `module.exports = class extends Worker {
                        constructor() {
                            const source = ${JSON.stringify(source)};
                            const url = URL.createObjectURL(new Blob([source], {type: 'text/javascript'}));
                            super(url);
                            URL.revokeObjectURL(url);
                        }
                    };`,
                    loader: 'js'};
                }
                let value;
                if (type === 'script') value = await bundleScript(args.path);
                else if (type === 'raw') value = fs.readFileSync(args.path, 'utf8');
                else if (type === 'base64') value = fs.readFileSync(args.path).toString('base64');
                else {
                    const bytes = JSON.stringify([...fs.readFileSync(args.path)]);
                    return {contents: `module.exports = new Uint8Array(${bytes}).buffer;`, loader: 'js'};
                }
                return {contents: `module.exports = ${JSON.stringify(value)};`, loader: 'js'};
            });
        }
        builder.onLoad({filter: /\/(linebreak|grapheme-breaker)\/src\/.*\.js$/}, args => {
            let contents = fs.readFileSync(args.path, 'utf8');
            const data = fs.readFileSync(path.join(path.dirname(args.path), 'classes.trie'));
            contents = contents.replace(/fs\.readFileSync\(__dirname \+ '\/classes\.trie'(, 'base64')?\)/g,
                (_, base64) => (base64 ?
                    JSON.stringify(data.toString('base64')) : `new Uint8Array(${JSON.stringify([...data])})`));
            return {contents, loader: 'js'};
        });
        builder.onLoad({filter: /\/peerjs\/dist\/peerjs(?:\.min)?\.js$/}, args => ({
            contents: `var parcelRequire;\n${fs.readFileSync(args.path, 'utf8')}`, loader: 'js'
        }));
    }
});
