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

// White text on the accent fill is 3.88:1, so it must be bold and at least
// 14px. A rule that fills with the accent and colours text for it has to get
// that size and weight from a rule naming one of its classes. Icon-only
// pieces (icons, marks, dots, tracks and bars) carry no text.
const fillSize = /var\(--fs-(md|lg|xl|2xl|3xl|4xl|hero)\)/;
const textOnFill = /^(var\(--accent-contrast[^)]*\)|#fff(fff)?|white)$/i;
const noText = /icon|mark|dot|track|fill|progress|bar/i;
const declaration = (body, name) => (
    body.match(new RegExp(`(?:^|[;\\s])${name}\\s*:\\s*([^;]*)`)) || []
)[1];
const walkFills = dir => fs.readdirSync(dir, {withFileTypes: true}).forEach(entry => {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) return walkFills(file);
    if (!file.endsWith('.css')) return;
    const css = fs.readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
        .map(match => ({selector: match[1].trim(), body: match[2]}));
    rules.forEach(rule => {
        const background = declaration(rule.body, 'background(?:-color)?');
        const color = declaration(rule.body, 'color');
        if (!background || !color || !/^var\(--(accent|mw-accent)\)$/.test(background.trim())) return;
        if (!textOnFill.test(color.trim()) || noText.test(rule.selector)) return;
        const classes = [...rule.selector.matchAll(/\.([\w-]+)/g)].map(match => match[1]);
        const related = rules.filter(other => classes.some(name => (
            new RegExp(`\\.${name}(?![\\w-])`).test(other.selector))));
        const sizes = related.map(other => declaration(other.body, 'font-size')).filter(Boolean);
        const weights = related.map(other => declaration(other.body, 'font-weight')).filter(Boolean);
        const big = sizes.length && sizes.every(size => fillSize.test(size));
        const bold = weights.length && weights.every(weight => /^(600|700|800|900|bold|bolder)$/.test(weight.trim()));
        if (!big || !bold) {
            problems.push(`${file} text on the accent fill must be --fs-md or larger and 600+: ${rule.selector}`);
        }
    });
});
walkFills(root);

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
