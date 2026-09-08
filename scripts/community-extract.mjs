import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const require = createRequire(import.meta.url);
const {parse} = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceRoot = path.join(root, 'src/community');
const filename = path.join(sourceRoot, 'translations/en.json');
const english = JSON.parse(fs.readFileSync(filename));
const locations = {};
let added = 0;
const record = (text, source, line) => {
    if (!(text in english)) {
        english[text] = text; added++;
    }
    if (!locations[text]) locations[text] = [];
    locations[text].push(`${path.relative(root, source)}:${line}`);
};
const visit = directory => {
    for (const entry of fs.readdirSync(directory, {withFileTypes: true})) {
        const source = path.join(directory, entry.name);
        if (entry.isDirectory()) {
            if (entry.name !== 'translations') visit(source); continue;
        }
        if (!/\.jsx?$/.test(entry.name)) continue;
        const ast = parse(fs.readFileSync(source, 'utf8'), {sourceType: 'module', plugins: ['jsx']});
        traverse(ast, {
            CallExpression ({node}) {
                if (!['communityText', 'text', 't', 'formatCommunityMessage'].includes(node.callee.name)) return;
                const argument = node.arguments[0];
                if (argument?.type === 'StringLiteral') record(argument.value, source, argument.loc.start.line);
            },
            ObjectProperty ({node}) {
                if (['label', 'busyLabel', 'ariaLabel'].includes(node.key.name) &&
                    node.value.type === 'StringLiteral') {
                    record(node.value.value, source, node.value.loc.start.line);
                }
            }
        });
    }
};
visit(sourceRoot);
if (process.argv.includes('--check')) {
    if (added) throw new Error(`${added} new messages. Run pnpm i18n:community:extract and include the catalog.`);
} else {
    fs.writeFileSync(filename, `${JSON.stringify(english, null, 2)}\n`);
    fs.writeFileSync(path.join(sourceRoot, 'translations/_sources.json'), `${JSON.stringify(locations, null, 2)}\n`);
}
console.log(`${Object.keys(locations).length} messages found; ${added} new.`);
