import installBlockContextMenu from '../../../src/lib/backpack/block-context-menu';
import {registerBackpackSaver} from '../../../src/lib/backpack/save-to-backpack';

const mockBlocks = {
    ContextMenu: {show: jest.fn()},
    workspace: {currentGesture_: null},
    getMainWorkspace: () => mockBlocks.workspace
};

jest.mock('../../../src/lib/tw-lazy-scratch-blocks', () => ({
    isLoaded: () => true,
    get: () => mockBlocks
}));
jest.mock('../../../src/lib/mw-appearance-settings', () => ({
    getAppearanceSetting: () => false
}));

const originalShow = mockBlocks.ContextMenu.show;
const baseItems = () => [{text: 'Duplicate'}, {text: 'Add Comment'}, {text: 'Delete Block'}];
const makeBlock = (id, options = {}) => ({
    id,
    workspace: options.workspace || mockBlocks.workspace,
    isShadow: () => Boolean(options.shadow)
});
const shownItems = () => originalShow.mock.calls[originalShow.mock.calls.length - 1][1];

describe('block context menu backpack item', () => {
    let saver;
    let unregister;

    beforeAll(() => {
        expect(installBlockContextMenu(() => 'Add to backpack')).toBe(true);
    });

    beforeEach(() => {
        originalShow.mockClear();
        saver = jest.fn(() => Promise.resolve(true));
        unregister = registerBackpackSaver(saver);
    });

    afterEach(() => {
        unregister();
    });

    test('adds the item after the first entry for a workspace block', () => {
        mockBlocks.workspace.currentGesture_ = {flyout_: null, targetBlock_: makeBlock('top')};
        mockBlocks.ContextMenu.show({}, baseItems(), false);
        const items = shownItems();
        expect(items.map(item => item.text)).toEqual(['Duplicate', 'Add to backpack', 'Add Comment', 'Delete Block']);
        expect(items[1].icon).toBe('backpack');
        items[1].callback();
        expect(saver).toHaveBeenCalledWith({kind: 'script', blockId: 'top'});
    });

    test('leaves the flyout, shadows, other workspaces and the workspace menu alone', () => {
        const cases = [
            {flyout_: {}, targetBlock_: makeBlock('in-flyout')},
            {flyout_: null, targetBlock_: makeBlock('shadow', {shadow: true})},
            {flyout_: null, targetBlock_: makeBlock('elsewhere', {workspace: {}})},
            {flyout_: null, targetBlock_: null}
        ];
        for (const gesture of cases) {
            mockBlocks.workspace.currentGesture_ = gesture;
            mockBlocks.ContextMenu.show({}, baseItems(), false);
            expect(shownItems()).toHaveLength(3);
        }
    });

    test('hides the item when no backpack is available', () => {
        unregister();
        mockBlocks.workspace.currentGesture_ = {flyout_: null, targetBlock_: makeBlock('top')};
        mockBlocks.ContextMenu.show({}, baseItems(), false);
        expect(shownItems()).toHaveLength(3);
    });

    test('installs only once', () => {
        const wrapped = mockBlocks.ContextMenu.show;
        installBlockContextMenu();
        expect(mockBlocks.ContextMenu.show).toBe(wrapped);
    });
});
