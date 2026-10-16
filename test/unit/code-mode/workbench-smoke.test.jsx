import React from 'react';
import {mountWithIntl} from '../../helpers/intl-helpers.jsx';
import {CodeWorkbench} from '../../../src/containers/code-workbench.jsx';
import {extensionDevInitialState} from '../../../src/reducers/extension-dev.js';
import {clearTexts, getText, hasUnappliedCode, updateText} from '../../../src/lib/code-mode/text-store.js';
import {executeShortcut} from '../../../src/lib/shortcuts/event-router.js';

const mockApply = jest.fn(() => Promise.resolve({status: 'committed'}));

jest.mock('../../../src/lib/code-mode/text-controller.js', () => {
    const store = require('../../../src/lib/code-mode/text-store.js');
    const text = 'when flag at 0,0 {\n  say "hi";\n}\n';
    const controller = {
        configure: () => {},
        refresh: targetId => {
            if (!store.getText(targetId)) {
                store.setText(targetId, {
                    targetId,
                    status: 'ready',
                    doc: text,
                    baseline: {text, sourceMap: {scripts: {hat: {from: 0, to: 30}}}},
                    units: {'script:hat': {from: 0, to: 30}},
                    unitsVersion: 1,
                    lockedScripts: [],
                    diagnostics: []
                });
            }
            return Promise.resolve(store.getText(targetId));
        },
        edit: (targetId, doc) => store.updateText(targetId, {doc}),
        apply: (...args) => mockApply(...args),
        setMessage: () => {},
        resolve: () => {},
        revert: () => {},
        discardDraft: () => {}
    };
    return {getTextController: () => controller};
});

const makeTarget = (id, name, isStage) => {
    const costumes = [{name: `${name} costume`, asset: null}];
    const sounds = [{name: 'pop', rate: 48000, sampleCount: 48000}];
    return {
        id,
        isOriginal: true,
        isStage,
        currentCostume: 0,
        getName: () => name,
        getCostumes: () => costumes,
        getSounds: () => sounds,
        setCostume: jest.fn(),
        blocks: {getTopLevelScript: () => 'hat'}
    };
};

const makeVm = () => {
    const stage = makeTarget('stage', 'Stage', true);
    const sprite = makeTarget('sprite', 'Sprite1', false);
    const listeners = () => ({on: jest.fn(), off: jest.fn()});
    const vm = {
        ...listeners(),
        editingTarget: sprite,
        setEditingTarget: jest.fn(id => {
            vm.editingTarget = id === 'stage' ? stage : sprite;
        }),
        extensionManager: {getExtensionEntries: () => [], isCoreExtension: () => false},
        runtime: {
            ...listeners(),
            targets: [stage, sprite],
            _blockInfo: [],
            getTargetForStage: () => stage,
            getTargetById: id => [stage, sprite].find(target => target.id === id)
        }
    };
    return vm;
};

const render = (props = {}) => mountWithIntl(
    <CodeWorkbench
        devState={extensionDevInitialState}
        dispatch={jest.fn()}
        editingTarget="sprite"
        sprites={{sprite: {order: 0}}}
        vm={makeVm()}
        {...props}
    />
);

describe('code workbench', () => {
    beforeEach(() => {
        clearTexts();
        mockApply.mockClear();
    });

    test('first entry opens the editing target scripts file and lists every target', async () => {
        const wrapper = render();
        await Promise.resolve();
        await Promise.resolve();
        wrapper.update();
        const rows = wrapper.find('[role="treeitem"]').map(node => node.text());
        expect(rows).toEqual(expect.arrayContaining(['Stage', 'Sprite1', 'scripts.fractch', 'Extensions']));
        expect(wrapper.find('[role="tablist"]').first()
            .find('[role="tab"]')
            .map(node => node.text())).toEqual([
            expect.stringContaining('scripts.fractch')
        ]);
        expect(wrapper.find('[data-mw-text-tab="true"]').length).toBe(1);
        wrapper.unmount();
    });

    test('a reveal request is consumed and opens the block target', () => {
        const dispatch = jest.fn();
        const wrapper = render({dispatch, reveal: {kind: 'block', targetId: 'sprite', id: 'b', nonce: 7}});
        expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({nonce: 7}));
        wrapper.unmount();
    });

    test('opening a costume of another sprite makes it the editing target', () => {
        const vm = makeVm();
        const wrapper = render({vm});
        const instance = wrapper.find(CodeWorkbench).instance();
        const stage = vm.runtime.getTargetForStage();
        const costume = stage.getCostumes()[0];
        instance.handleExplorerOpen({
            type: 'costume',
            targetId: 'stage',
            itemId: require('../../../src/lib/asset-identity.js').itemIdFor(costume)
        }, {preview: true});
        expect(vm.setEditingTarget).toHaveBeenCalledWith('stage');
        wrapper.unmount();
    });

    test('a dirty script tab shows the dot, enables Apply and applies on Mod+Enter', async () => {
        const wrapper = render();
        wrapper.find(CodeWorkbench).instance()
            .handleActivateTab('script:sprite');
        await Promise.resolve();
        await Promise.resolve();
        wrapper.update();
        const apply = () => wrapper.find('button').filterWhere(node => node.prop('aria-label') === 'Apply');
        expect(apply().prop('disabled')).toBe(true);
        updateText('sprite', {doc: `${getText('sprite').doc}\n// note\n`});
        wrapper.update();
        expect(hasUnappliedCode()).toBe(true);
        expect(apply().prop('disabled')).toBe(false);
        const tabs = wrapper.find('EditorTabs').first()
            .prop('tabs');
        expect(tabs.find(tab => tab.key === 'script:sprite').dirty).toBe(true);
        executeShortcut({actionType: 'callback', action: 'applyFile'});
        expect(mockApply).toHaveBeenCalledWith('sprite');
        wrapper.unmount();
    });

    test('collaboration makes the text read only and shows the lock message first', async () => {
        const wrapper = render({collaborating: true});
        wrapper.find(CodeWorkbench).instance()
            .handleActivateTab('script:sprite');
        await Promise.resolve();
        await Promise.resolve();
        wrapper.update();
        updateText('sprite', {doc: 'changed'});
        wrapper.update();
        expect(wrapper.find('button').filterWhere(node => node.prop('aria-label') === 'Apply')
            .prop('disabled')).toBe(true);
        expect(wrapper.text()).toContain('Editing code is unavailable during collaboration');
        wrapper.unmount();
    });
});
