import fs from 'node:fs';
import path from 'node:path';

const root = 'src/community';
const tokensFile = path.join(root, 'styles/tokens.module.css');
const tokens = fs.readFileSync(tokensFile, 'utf8');
const defined = new Set([...tokens.matchAll(/(--[\w-]+)\s*:/g)].map(match => match[1]));
const pillAllowed = /track|progress/i;
const problems = [];

const checkLine = (line, where) => {
    if (/font-size:\s*[\d.]+(px|rem|em)/.test(line)) problems.push(`${where} raw font-size, use --fs-*`);
    if (/border-radius:[^;]*(?<![\d.])([4-9]|[1-9]\d+)(\.\d+)?px/.test(line.replace(/\b999px/g, ''))) {
        problems.push(`${where} raw border-radius, use --radius*`);
    }
};

const walk = dir => fs.readdirSync(dir, {withFileTypes: true}).forEach(entry => {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(file);
    if (!file.endsWith('.css')) return;
    const css = fs.readFileSync(file, 'utf8');
    [...css.matchAll(/(--[\w-]+)\s*:/g)].forEach(match => defined.add(match[1]));
    const declarations = file === tokensFile ?
        css.split('\n').filter(line => !/^\s+--[\w-]+:/.test(line)) : css.split('\n');
    declarations.forEach((line, index) => checkLine(line, `${file}:${index + 1}`));
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
