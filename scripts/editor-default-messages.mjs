import fs from 'node:fs';
import path from 'node:path';
import {readEditorDefaultMessages} from './vite-locales.mjs';

const directory = process.cwd();
const output = path.join(directory, 'src/lib/tw-translations/default-messages.json');
const content = `${JSON.stringify(readEditorDefaultMessages(directory), null, 2)}\n`;

if (process.argv.includes('--check')) {
    if (!fs.existsSync(output) || fs.readFileSync(output, 'utf8') !== content) {
        throw new Error('Editor messages changed. Run pnpm i18n:editor:extract.');
    }
} else {
    fs.writeFileSync(output, content);
}

console.log(`${Object.keys(JSON.parse(content)).length} editor messages found.`);
