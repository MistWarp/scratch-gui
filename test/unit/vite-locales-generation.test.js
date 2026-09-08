import {execFileSync} from 'child_process';
import path from 'path';

// Exercise the real package layout: only en.json is shipped in msg/json.
// Other block dictionaries must be extracted from generated scratch_msgs.js.
test('locale generation includes non-English block messages', () => {
    const output = execFileSync(process.execPath, ['--input-type=module', '-e', `
        import {readBlockMessages} from './scripts/vite-blocks.mjs';
        console.log(JSON.stringify({en: readBlockMessages('en'), fr: readBlockMessages('fr')}));
    `], {cwd: path.resolve(__dirname, '../..'), encoding: 'utf8'});
    const {en, fr} = JSON.parse(output);
    expect(Object.keys(fr).length).toBeGreaterThan(200);
    expect(fr.MOTION_MOVESTEPS).toBe('avancer de %1 pas');
    expect(en.MOTION_MOVESTEPS).toBe('move %1 steps');
});

test('locale generation extracts MistWarp defaults and addon translations', () => {
    const output = execFileSync(process.execPath, ['--input-type=module', '-e', `
        import fs from 'node:fs';
        import {readEditorDefaultMessages, writeEditorLocales} from './scripts/vite-locales.mjs';
        const root = process.cwd();
        const defaults = readEditorDefaultMessages(root);
        writeEditorLocales(root);
        const generated = name => JSON.parse(fs.readFileSync(
            root + '/src/generated/editor-locales/' + name + '.json'
        )).messages;
        console.log(JSON.stringify({defaults, en: generated('en'), fr: generated('fr')}));
    `], {cwd: path.resolve(__dirname, '../..'), encoding: 'utf8'});
    const {defaults, en, fr} = JSON.parse(output);
    expect(defaults['gui.menuBar.tools']).toBe('Project');
    expect(defaults['gui.gui.findBlocks']).toBe('Find Blocks');
    expect(en['gui.menuBar.tools']).toBe('Project');
    expect(fr['block-count/blocks']).toBeTruthy();
});
