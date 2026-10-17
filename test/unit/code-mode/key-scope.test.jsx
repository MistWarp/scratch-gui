import React from 'react';
import {mountWithIntl} from '../../helpers/intl-helpers.jsx';
import {SoundEditor} from '../../../src/containers/sound-editor.jsx';
import {AssetTab, shouldMountAssetEditor} from '../../../src/components/code-mode/asset-tab.jsx';
import {
    getKeyRegion,
    installKeyScope,
    isAssetEditorActive,
    setKeyRegion
} from '../../../src/lib/code-mode/key-scope.js';

jest.mock('../../../src/lib/audio/audio-buffer-player.js', () => jest.fn().mockImplementation(() => ({
    play: jest.fn(),
    stop: jest.fn()
})));

const region = name => {
    const node = document.createElement('div');
    node.setAttribute('data-mw-region', name);
    const child = document.createElement('button');
    node.appendChild(child);
    document.body.appendChild(node);
    return {node, child};
};

describe('key scope', () => {
    let uninstall;
    beforeEach(() => {
        uninstall = installKeyScope(document);
    });
    afterEach(() => {
        uninstall();
        document.body.innerHTML = '';
    });

    test('records the region of the last pointerdown', () => {
        const explorer = region('explorer');
        const asset = region('asset');
        asset.child.dispatchEvent(new Event('pointerdown', {bubbles: true}));
        expect(getKeyRegion()).toBe('asset');
        expect(isAssetEditorActive()).toBe(true);
        explorer.child.dispatchEvent(new Event('pointerdown', {bubbles: true}));
        expect(isAssetEditorActive()).toBe(false);
    });

    test('focus moves the region too', () => {
        const panel = region('panel');
        setKeyRegion('asset');
        panel.child.dispatchEvent(new FocusEvent('focusin', {bubbles: true}));
        expect(getKeyRegion()).toBe('panel');
    });

    test('clicking outside every region leaves no region', () => {
        setKeyRegion('asset');
        document.body.dispatchEvent(new Event('pointerdown', {bubbles: true}));
        expect(getKeyRegion()).toBeNull();
    });

    test('uninstalling clears the region', () => {
        setKeyRegion('asset');
        uninstall();
        expect(getKeyRegion()).toBeNull();
        uninstall = installKeyScope(document);
    });
});

describe('asset editor key hooks', () => {
    const renderSoundEditor = isActive => {
        const props = {
            name: 'pop',
            onShowImportError: jest.fn(),
            sampleRate: 48000,
            samples: new Float32Array(10),
            soundId: 's1',
            soundIndex: 0,
            vm: {}
        };
        if (isActive) props.isActive = isActive;
        const editor = new SoundEditor({...SoundEditor.defaultProps, ...props});
        editor.handleDelete = jest.fn();
        return editor;
    };

    const deleteKey = () => ({
        key: 'Delete',
        target: document.body,
        defaultPrevented: false,
        preventDefault: jest.fn()
    });

    test('the sound editor handles body keys by default', () => {
        const editor = renderSoundEditor();
        editor.handleKeyPress(deleteKey());
        expect(editor.handleDelete).toHaveBeenCalled();
    });

    test('the sound editor ignores keys while another region is active', () => {
        const editor = renderSoundEditor(() => false);
        const event = deleteKey();
        editor.handleKeyPress(event);
        expect(editor.handleDelete).not.toHaveBeenCalled();
        expect(event.preventDefault).not.toHaveBeenCalled();
    });

    test('an asset tab of another sprite does not mount its editor', () => {
        expect(shouldMountAssetEditor({targetId: 'a', kind: 'costume'}, 'a')).toBe(true);
        expect(shouldMountAssetEditor({targetId: 'a', kind: 'costume'}, 'b')).toBe(false);
        const onOpenToEdit = jest.fn();
        const wrapper = mountWithIntl(
            <AssetTab
                editingTargetId="other"
                index={0}
                ownerName="Sprite1"
                tab={{kind: 'costume', targetId: 'sprite'}}
                onOpenToEdit={onOpenToEdit}
            />
        );
        expect(wrapper.find('[data-mw-region="asset"]').length).toBe(0);
        wrapper.find('button').simulate('click');
        expect(onOpenToEdit).toHaveBeenCalled();
    });
});
