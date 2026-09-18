import fs from 'node:fs';
import path from 'node:path';

const root = 'src/community';
const tokens = fs.readFileSync(path.join(root, 'styles/tokens.module.css'), 'utf8');
const defined = new Set([...tokens.matchAll(/(--[\w-]+)\s*:/g)].map(match => match[1]));
const pillAllowed = /track|progress/i;
const problems = [];

const walk = dir => fs.readdirSync(dir, {withFileTypes: true}).forEach(entry => {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(file);
    if (!file.endsWith('.css') || file.endsWith('tokens.module.css')) return;
    const css = fs.readFileSync(file, 'utf8');
    [...css.matchAll(/(--[\w-]+)\s*:/g)].forEach(match => defined.add(match[1]));
    css.split('\n').forEach((line, index) => {
        const where = `${file}:${index + 1}`;
        if (/font-size:\s*([\d.]|[1-3]\d)(\.\d+)?(px|rem)/.test(line)) problems.push(`${where} raw font-size, use --fs-*`);
        if (/border-radius:[^;]*\b([4-9]|1\d)px/.test(line)) problems.push(`${where} raw border-radius, use --radius*`);
    });
    [...css.matchAll(/([^{}]+)\{[^{}]*border-radius:\s*999px/g)].forEach(match => {
        if (!pillAllowed.test(match[1])) problems.push(`${file} pill radius on ${match[1].trim()}`);
    });
});
walk(root);

const mwTokens = /^--(fs|radius|maxw|bg|border|text-dim|text-faint|card-shadow|page-pad)/;
const walkVars = dir => fs.readdirSync(dir, {withFileTypes: true}).forEach(entry => {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) return walkVars(file);
    if (!file.endsWith('.css')) return;
    [...fs.readFileSync(file, 'utf8').matchAll(/var\((--[\w-]+)/g)].forEach(match => {
        if (mwTokens.test(match[1]) && !defined.has(match[1])) problems.push(`${file} undefined ${match[1]}`);
    });
});
walkVars(root);

if (problems.length) {
    console.error(problems.join('\n'));
    process.exit(1);
}
console.log('community css ok');
