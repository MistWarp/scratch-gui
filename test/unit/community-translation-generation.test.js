import {execFileSync} from 'child_process';
import path from 'path';

test('catalog generation rejects broken placeholders and preserves translation fallback', () => {
    const output = execFileSync(process.execPath, ['--input-type=module', '-e', `
        import fs from 'node:fs';
        import os from 'node:os';
        import path from 'node:path';
        import {writeCommunityLocales} from './scripts/community-translations.mjs';
        const root = fs.mkdtempSync(path.join(os.tmpdir(), 'mw-community-i18n-'));
        const catalogs = path.join(root, 'src/community/translations');
        fs.mkdirSync(catalogs, {recursive: true});
        const save = (locale, messages) => fs.writeFileSync(path.join(catalogs, locale + '.json'), JSON.stringify(messages));
        try {
            save('en', {Save: 'Save', 'Hello {name}': 'Hello {name}', 'home.title': 'Welcome'});
            save('fr', {Save: 'Enregistrer', 'Hello {name}': 'Bonjour {person}'});
            let rejected = false;
            try { writeCommunityLocales(root); } catch (e) { rejected = /placeholders differ/.test(e.message); }
            save('fr', {Save: 'Enregistrer', 'Hello {name}': 'Bonjour {name}'});
            const report = writeCommunityLocales(root);
            const generated = path.join(root, 'src/generated/community-locales');
            console.log(JSON.stringify({rejected, count: Object.keys(report).length,
                fr: JSON.parse(fs.readFileSync(path.join(generated, 'fr.json'))),
                fallbacks: JSON.parse(fs.readFileSync(path.join(generated, 'fallbacks.json')))}));
        } finally { fs.rmSync(root, {recursive: true, force: true}); }
    `], {cwd: path.resolve(__dirname, '../..'), encoding: 'utf8'});
    const result = JSON.parse(output);
    expect(result.rejected).toBe(true);
    expect(result.count).toBe(80);
    expect(result.fr.Save).toBe('Enregistrer');
    expect(result.fr['Hello {name}']).toBe('Bonjour {name}');
    expect(result.fr['home.title']).toBeUndefined();
    expect(result.fallbacks).toEqual({'home.title': 'Welcome'});
});
