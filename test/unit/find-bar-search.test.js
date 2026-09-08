import FindBarController from '../../src/components/find-bar/FindBarController';
import styles from '../../src/components/find-bar/find-bar.module.css';
import {getCodeSearch} from '../../src/lib/find-bar/api';

jest.mock('../../src/lib/find-bar/api', () => ({getCodeSearch: jest.fn(), setFindBarApi: jest.fn()}));

let controller;
const makeController = blocks => {
    const target = {blocks: {_blocks: blocks}, variables: {}};
    const vm = {on: jest.fn(), removeListener: jest.fn(), runtime: {
        getTargetForStage: () => target, getBlocksJSON: () => []
    }};
    const result = new FindBarController({ScratchBlocks: {Msg: {}}, vm,
        utils: {getEditingTarget: () => target, scrollBlockIntoView: jest.fn()}, msg: x => x, msgAny: x => x,
        activeTabIndexRef: {current: 0}, isPlayerOnlyRef: {current: false}});
    result.findInput = document.createElement('input');
    result.dropdownOut = document.createElement('div');
    result.dropdownOut.appendChild(result.dropdown.createDom());
    return result;
};

afterEach(() => {
    controller.destroy();
    getCodeSearch.mockReset();
    jest.useRealTimers();
});

test('large searches filter data before rendering and retain all result pages', () => {
    const blocks = {};
    for (let i = 0; i < 5000; i++) {
        blocks[i] = {id: String(i), opcode: 'looks_say', inputs: {},
            fields: {TEXT: {value: `token ${i}`}}};
    }
    controller = makeController(blocks);
    controller.findInput.value = 'token';
    controller.inputChange({skipDebounce: true});
    expect(controller.dropdown.items).toHaveLength(100);
    expect(controller.dropdown.el.children).toHaveLength(101);
    expect(controller.dropdown.el.lastElementChild).toBe(controller.moreResultsRow);
    expect(controller.moreResults.parentElement).toBe(controller.moreResultsRow);
    controller.moreResults.click();
    expect(controller.dropdown.items).toHaveLength(200);
    expect(controller.dropdown.el.lastElementChild).toBe(controller.moreResultsRow);
    controller.dropdown.onItemClick(controller.dropdown.items[199]);
    window.HTMLElement.prototype.scrollIntoView = jest.fn();
    controller.dropdown.navigateFilter(1);
    expect(controller.dropdown.items).toHaveLength(300);
    expect(controller.dropdown.selected).toBe(controller.dropdown.items[200]);
    controller.findInput.value = 'token 4999';
    controller.inputChange({skipDebounce: true});
    expect(controller.dropdown.items).toHaveLength(1);
    expect(controller.dropdown.items[0].data.labelID).toBe('4999');
});

test('clearing search cancels pending input and the same query can be searched again', () => {
    jest.useFakeTimers();
    controller = makeController({a: {opcode: 'looks_say', inputs: {}, fields: {TEXT: {value: 'hello'}}}});
    controller.findInput.value = 'hello';
    controller.inputChange();
    controller.findInput.value = '';
    controller.inputChange();
    jest.runOnlyPendingTimers();
    expect(controller.dropdown.items[0].data.isTextInputEntry).toBeFalsy();
    controller.findInput.value = 'hello';
    controller.inputChange({skipDebounce: true});
    expect(controller.dropdown.items).toHaveLength(1);
    expect(controller.dropdown.items[0].data.isTextInputEntry).toBe(true);
});

test('old code-search results cannot reopen a cleared search', async () => {
    let resolve;
    getCodeSearch.mockReturnValue({search: jest.fn(), searchAll: () => new Promise(r => { resolve = r; })});
    controller = makeController({});
    controller.findInput.value = 'query';
    controller.inputChange();
    controller.findInput.value = '';
    controller.inputChange();
    resolve([{filepath: 'old.js', line: 1, preview: 'query'}]);
    await Promise.resolve();
    expect(controller.dropdown.items).toHaveLength(0);
    expect(controller.dropdownOut.classList.contains(styles.visible)).toBe(false);
});

test('block names cannot collide with inherited object properties', () => {
    controller = makeController({a: {id: 'a', opcode: 'constructor', inputs: {}, fields: {}}});
    expect(controller.getScratchBlocks()[0].labelID).toBe('a');
});
