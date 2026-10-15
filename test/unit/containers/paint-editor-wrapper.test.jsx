import React from 'react';
import {mount} from 'enzyme';
import configureStore from 'redux-mock-store';

import PaintEditorWrapper from '../../../src/containers/paint-editor-wrapper.jsx';

jest.mock('../../../src/lib/tw-scratch-paint', () => {
    const MockPaintEditor = () => null;
    return {__esModule: true, default: MockPaintEditor};
});
jest.mock('../../../src/lib/components/error-boundary-hoc.jsx', () => () => Component => Component);

const PaintEditor = jest.requireMock('../../../src/lib/tw-scratch-paint').default;

const makeCostume = (name, skinId) => ({
    name,
    skinId,
    dataFormat: 'png',
    rotationCenterX: 0,
    rotationCenterY: 0,
    asset: {}
});

const makeVM = costumes => {
    const target = {
        id: 'sprite',
        sprite: {costumes},
        getCostumes: () => target.sprite.costumes
    };
    const vm = {
        editingTarget: target,
        getCostume: jest.fn(index => {
            const asset = target.getCostumes()[index].asset;
            return asset ? 'data:image/png;base64,' : null;
        }),
        renderer: {customFonts: {}},
        runtime: {
            fontManager: {
                getFonts: jest.fn(() => []),
                on: jest.fn(),
                off: jest.fn()
            }
        }
    };
    return vm;
};

const mountWrapper = (vm, selectedCostumeIndex) => {
    const store = configureStore()({
        locales: {isRtl: false},
        scratchGui: {
            vm,
            customStageSize: {width: 480, height: 360},
            theme: {theme: {isDark: () => false}}
        }
    });
    return mount(
        <PaintEditorWrapper
            selectedCostumeIndex={selectedCostumeIndex}
            store={store}
        />
    );
};

describe('PaintEditorWrapper', () => {
    test('renders nothing for a sprite without costumes', () => {
        const vm = makeVM([]);
        const wrapper = mountWrapper(vm, 0);
        expect(wrapper.find(PaintEditor)).toHaveLength(0);
        expect(vm.getCostume).not.toHaveBeenCalled();
    });

    test('renders nothing when the selected costume was removed before the editor re-rendered', () => {
        const vm = makeVM([makeCostume('a', 1), makeCostume('b', 2)]);
        const wrapper = mountWrapper(vm, 1);
        expect(wrapper.find(PaintEditor)).toHaveLength(1);

        vm.editingTarget.sprite.costumes = [makeCostume('a', 1)];
        vm.getCostume.mockClear();
        vm.runtime.fontManager.getFonts.mockReturnValue([{family: 'New'}]);
        const handleUpdateFonts = vm.runtime.fontManager.on.mock.calls[0][1];
        expect(() => handleUpdateFonts()).not.toThrow();
        wrapper.update();
        expect(wrapper.find(PaintEditor)).toHaveLength(0);
        expect(vm.getCostume).not.toHaveBeenCalled();
    });

    test('clamps the selected costume to the last one', () => {
        const vm = makeVM([makeCostume('a', 1), makeCostume('b', 2)]);
        const wrapper = mountWrapper(vm, 5);
        const editor = wrapper.find(PaintEditor);
        expect(editor.prop('name')).toBe('b');
        expect(vm.getCostume).toHaveBeenCalledWith(1);
    });
});
