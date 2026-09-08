import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';

const require = createRequire(import.meta.url);
const blocksDirectory = fs.realpathSync(path.dirname(require.resolve('scratch-blocks/package.json')));

// The distributed package keeps non-English dictionaries in scratch_msgs.js.
// Extract its JSON assignments without evaluating the generated JavaScript.
const translationsPath = path.join(blocksDirectory, 'msg/scratch_msgs.js');
let dictionaries;
let modified;
export const readBlockMessages = locale => {
    const mtime = fs.statSync(translationsPath).mtimeMs;
    if (!dictionaries || modified !== mtime) {
        dictionaries = Object.fromEntries([...fs.readFileSync(translationsPath, 'utf8')
            .matchAll(/Blockly\.ScratchMsgs\.locales\["([^"]+)"\]\s*=\s*(\{[\s\S]*?^\});/gm)]
            .map(match => [match[1], JSON.parse(match[2])]));
        if (!dictionaries.en || !dictionaries.fr) throw new Error('Could not read Scratch Blocks translations');
        modified = mtime;
    }
    return dictionaries[locale] || {};
};

// Use the generated Closure sources directly. The package's development dist
// wraps them in eval strings, which prevents Vite from minifying their contents.
export const writeScratchBlocks = directory => {
    const files = ['blockly_compressed_vertical.js', 'blocks_compressed.js',
        'blocks_compressed_vertical.js', 'msg/messages.js'];
    const source = files.map(file => fs.readFileSync(path.join(blocksDirectory, file), 'utf8')).join('\n');
    const output = path.join(directory, 'src/generated/scratch-blocks.js');
    const content = `export default (function () {\n${source}\n` +
        `Blockly.ScratchMsgs.locales.en = ${JSON.stringify(readBlockMessages('en'))};\n` +
        `return Blockly;\n}).call(globalThis);\n`;
    fs.mkdirSync(path.dirname(output), {recursive: true});
    if (!fs.existsSync(output) || fs.readFileSync(output, 'utf8') !== content) fs.writeFileSync(output, content);
    return [...files.map(file => path.join(blocksDirectory, file)), translationsPath];
};
