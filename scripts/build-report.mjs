import fs from 'node:fs';
import path from 'node:path';
import {gzipSync} from 'node:zlib';
import {init, parse} from 'es-module-lexer';

await init;
const directory = path.resolve(process.argv[2] || process.env.BUILD_DIR || 'build');
const filename = process.argv[3] || 'editor.html';
const html = fs.readFileSync(path.join(directory, filename), 'utf8');
const scripts = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map(match => match[1]);
const files = new Set();
const walk = file => {
    if (files.has(file)) return;
    files.add(file);
    const code = fs.readFileSync(file, 'utf8');
    const [imports] = parse(code);
    for (const item of imports) {
        if (item.type !== 'static' || !item.specifier || !item.specifier.startsWith('.')) continue;
        walk(path.resolve(path.dirname(file), item.specifier));
    }
};
for (const script of scripts) {
    const assetPath = script.slice(script.indexOf('assets/'));
    walk(path.join(directory, assetPath));
}
const modules = [...files].map(file => {
    const source = fs.readFileSync(file);
    return {file: path.relative(directory, file), bytes: source.length, gzipBytes: gzipSync(source).length};
}).sort((a, b) => b.bytes - a.bytes);
console.log(JSON.stringify({page: filename,
    initialModules: modules.length,
    bytes: modules.reduce((sum, file) => sum + file.bytes, 0),
    gzipBytes: modules.reduce((sum, file) => sum + file.gzipBytes, 0),
    modules}, null, 2));
