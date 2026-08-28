import {reorderItems} from '../../../src/components/mw-extension-manager-modal/extension-manager-modal.jsx';
import makeToolboxXML from '../../../src/lib/make-toolbox-xml.js';
import extensionData from '../../../src/lib/libraries/extensions/index.jsx';

describe('extension manager ordering', () => {
    test('moves an extension category to the requested position', () => {
        expect(reorderItems(['pen', 'music', 'translate'], 2, 0))
            .toEqual(['translate', 'pen', 'music']);
    });

    test('leaves the order unchanged for invalid indexes', () => {
        const items = ['pen', 'music'];
        expect(reorderItems(items, -1, 0)).toBe(items);
        expect(reorderItems(items, 0, 2)).toBe(items);
    });

    test('the generated toolbox honors extension category order', () => {
        const toolbox = makeToolboxXML(false, false, 'target', [
            {id: 'music', xml: '<category id="music"><block type="music_play" /></category>'},
            {id: 'tw', xml: '<category id="tw"><block type="tw_test" /></category>'},
            {id: 'patching', xml: '<category id="patching"><block type="patching_test" /></category>'}
        ]);

        expect(toolbox.indexOf('id="music"')).toBeLessThan(toolbox.indexOf('id="tw"'));
        expect(toolbox.indexOf('id="tw"')).toBeLessThan(toolbox.indexOf('id="patching"'));
    });

    test('the for-each toolbox block uses its variable field', () => {
        const toolbox = makeToolboxXML(false, false, 'target', []);

        expect(toolbox).toContain('<field name="VARIABLE">i</field>');
        expect(toolbox).not.toContain('<value name="VARIABLE">');
    });

    test('multiplayer stays out of the toolbox for existing projects', () => {
        const toolbox = makeToolboxXML(false, false, 'target', [{
            id: 'mistwarpMultiplayer',
            xml: '<category id="mistwarpMultiplayer"><block type="mistwarpMultiplayer_connect" /></category>'
        }]);

        expect(toolbox).not.toContain('mistwarpMultiplayer');
    });

    test('multiplayer stays out of the extension library', () => {
        expect(extensionData.some(extension => extension.extensionId === 'mistwarpMultiplayer')).toBe(false);
    });
});
