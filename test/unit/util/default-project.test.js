import defaultProjectGenerator from '../../../src/lib/default-project/index.js';
import {createHash} from 'crypto';
import {readFileSync} from 'fs';
import path from 'path';

describe('defaultProject', () => {
    // This test ensures that the assets referenced in the default project JSON
    // do not get out of sync with the raw assets that are included alongside.
    // see https://github.com/LLK/scratch-gui/issues/4844
    test('assets referenced by the project are included', () => {
        const translatorFn = () => '';
        const defaultProject = defaultProjectGenerator(translatorFn);
        const includedAssetIds = defaultProject.map(obj => obj.id);
        const projectData = JSON.parse(defaultProject[0].data);
        const fog = readFileSync(path.resolve(__dirname, '../../../src/lib/default-project/fog.svg'));
        expect(includedAssetIds).toContain(createHash('md5').update(fog)
            .digest('hex'));
        projectData.targets.forEach(target => {
            target.costumes.forEach(costume => {
                expect(includedAssetIds.includes(costume.assetId)).toBe(true);
            });
            target.sounds.forEach(sound => {
                expect(includedAssetIds.includes(sound.assetId)).toBe(true);
            });
        });
    });

    test('the default costume is drawn at the size it reports', () => {
        const fog = readFileSync(path.resolve(__dirname, '../../../src/lib/default-project/fog.svg'), 'utf8');
        const attribute = name => fog.match(new RegExp(`<svg[^>]* ${name}="([^"]+)"`))[1];
        const viewBox = attribute('viewBox').split(/[ ,]+/)
            .map(Number);
        expect(viewBox).toEqual([0, 0, Number(attribute('width')), Number(attribute('height'))]);
    });
});
