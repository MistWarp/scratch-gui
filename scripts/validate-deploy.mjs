import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2] || 'build');
const failures = [];
const htmlFiles = [];

const walk = directory => {
    for (const entry of fs.readdirSync(directory, {withFileTypes: true})) {
        const filePath = path.join(directory, entry.name);
        if (entry.isDirectory()) walk(filePath);
        else if (entry.name.endsWith('.html')) htmlFiles.push(filePath);
    }
};

walk(root);

for (const htmlPath of htmlFiles) {
    const html = fs.readFileSync(htmlPath, 'utf8');
    const references = [...html.matchAll(/<(?:script|link)\b[^>]+(?:src|href)=["']([^"']+)["']/gi)]
        .map(match => match[1])
        .filter(reference => !/^(?:[a-z]+:|\/\/|#|data:)/i.test(reference));
    for (const reference of references) {
        const clean = decodeURIComponent(reference.split(/[?#]/, 1)[0]);
        const target = clean.startsWith('/') ?
            path.join(root, clean.slice(1)) :
            path.resolve(path.dirname(htmlPath), clean);
        if (!target.startsWith(`${root}${path.sep}`) || !fs.existsSync(target) || !fs.statSync(target).isFile()) {
            failures.push(`${path.relative(root, htmlPath)} references missing file ${reference}`);
            continue;
        }
        if (target.endsWith('.js')) {
            const prefix = fs.readFileSync(target, {encoding: 'utf8', flag: 'r'})
                .slice(0, 64)
                .trimStart();
            if (prefix.startsWith('<')) {
                failures.push(`${path.relative(root, target)} contains HTML instead of JavaScript`);
            }
        }
    }
}

if (failures.length) {
    console.error(`Deploy validation failed:\n${failures.join('\n')}`);
    process.exit(1);
}

console.log(`Validated ${htmlFiles.length} HTML files and their local script and stylesheet references.`);
