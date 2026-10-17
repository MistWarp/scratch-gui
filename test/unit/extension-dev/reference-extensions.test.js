import fs from 'fs';
import os from 'os';
import path from 'path';
import {lintExtension} from '../../../src/lib/extension-dev/lint.js';

const root = path.join(os.homedir(), 'extensions.mistium');
const folders = ['featured', 'files', 'files/penguinmod'];
const files = fs.existsSync(root) ?
    folders.flatMap(folder => fs.readdirSync(path.join(root, folder))
        .filter(name => name.endsWith('.js'))
        .map(name => path.join(root, folder, name))) :
    [];

const describeIfPresent = files.length ? describe : describe.skip;

describeIfPresent('reference extensions', () => {
    test('lint without errors', () => {
        const counts = {};
        const errors = [];
        const lines = [];
        for (const file of files) {
            const source = fs.readFileSync(file, 'utf8');
            const unsandboxed = /Scratch\.extensions\.unsandboxed/.test(source);
            const diagnostics = lintExtension(source, {unsandboxed});
            for (const diagnostic of diagnostics) {
                const key = `${diagnostic.severity} ${diagnostic.code}`;
                counts[key] = (counts[key] || 0) + 1;
                lines.push(`${path.relative(root, file)}:${diagnostic.line}:${diagnostic.column} ${key} ${diagnostic.message}`);
                if (diagnostic.severity === 'error') errors.push(lines[lines.length - 1]);
            }
        }
        if (process.env.MW_LINT_REPORT) {
            fs.writeFileSync(process.env.MW_LINT_REPORT, `${JSON.stringify(counts, null, 2)}\n${lines.join('\n')}\n`);
        }
        expect(files.length).toBe(109);
        expect(errors).toEqual([]);
    });
});
