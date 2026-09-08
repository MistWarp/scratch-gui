import paintByDefault from '../../../src/addons/addons/paint-by-default/userscript';
import commentPreviews from '../../../src/addons/addons/editor-comment-previews/userscript';

afterEach(() => {
    jest.restoreAllMocks();
    document.body.innerHTML = '';
});

test('paint-by-default tolerates missing tooltips and action menus', async () => {
    const handlers = {};
    jest.spyOn(document.body, 'addEventListener').mockImplementation((type, handler) => {
        handlers[type] = handler;
    });
    await paintByDefault({addon: {
        self: {disabled: false},
        settings: {get: () => 'paint'},
        tab: {redux: {state: {locales: {messages: {'gui.spriteSelector.addSpriteFromPaint': 'Paint'}}}}}
    }});
    document.body.innerHTML = '<div><button class="action-menu_main-button_test">Add</button></div>';
    const event = {target: document.querySelector('button'), stopPropagation: jest.fn()};
    expect(() => handlers.mouseover(event)).not.toThrow();
    expect(() => handlers.click(event)).not.toThrow();
    expect(event.stopPropagation).not.toHaveBeenCalled();
});

test('comment previews tolerate a project with no editing target', async () => {
    const handlers = {};
    jest.spyOn(document, 'addEventListener').mockImplementation((type, handler) => {
        handlers[type] = handler;
    });
    await commentPreviews({addon: {
        self: {disabled: false, addEventListener: jest.fn()},
        settings: {get: () => 'none', addEventListener: jest.fn()},
        tab: {traps: {vm: {editingTarget: null}}, displayNoneWhileDisabled: jest.fn()}
    }});
    const block = document.createElement('g');
    block.classList.add('blocklyDraggable');
    block.dataset.id = 'removed';
    document.body.appendChild(block);
    expect(() => handlers.mouseover({target: block})).not.toThrow();
    expect(document.querySelector('.sa-comment-preview-inner').classList
        .contains('sa-comment-preview-hidden')).toBe(true);
});
