import WindowManager from '../../src/addons/window-system/window-manager';

afterEach(() => WindowManager.closeAllWindows());

test('modal windows contain focus and remove the backdrop when hidden', () => {
    const outside = document.createElement('button');
    document.body.appendChild(outside);
    outside.focus();
    const modal = WindowManager.createWindow({id: 'test-modal', modal: true});
    modal.show();
    expect(modal.element.getAttribute('aria-modal')).toBe('true');
    expect(modal.backdrop.isConnected).toBe(true);
    outside.focus();
    expect(modal.element.contains(document.activeElement)).toBe(true);
    modal.hide();
    expect(modal.backdrop).toBe(null);
    expect(document.activeElement).toBe(outside);
    outside.remove();
});

test('a window stays open when its dialog declines to close', () => {
    const onClose = jest.fn();
    let allowClose = false;
    const win = WindowManager.createWindow({id: 'test-decline', onBeforeClose: () => allowClose, onClose});
    win.show();
    win.close();
    expect(win.element.isConnected).toBe(true);
    expect(onClose).not.toHaveBeenCalled();
    allowClose = true;
    win.close();
    expect(win.element.isConnected).toBe(false);
    expect(onClose).toHaveBeenCalledTimes(1);
});

test('Escape that a field already handled does not close the window', () => {
    const onClose = jest.fn();
    const win = WindowManager.createWindow({id: 'test-escape', onClose});
    win.show();
    const input = document.createElement('input');
    input.addEventListener('keydown', event => event.preventDefault());
    win.contentElement.appendChild(input);
    input.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape', bubbles: true, cancelable: true}));
    expect(onClose).not.toHaveBeenCalled();
    document.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape', bubbles: true, cancelable: true}));
    expect(onClose).toHaveBeenCalledTimes(1);
});

const pointer = (type, x, y) => {
    const event = new MouseEvent(type, {clientX: x, clientY: y, button: 0, bubbles: true, cancelable: true});
    Object.defineProperty(event, 'pointerId', {value: 1});
    return event;
};

test('dragging moves the window with a transform and commits the position on release', () => {
    const win = WindowManager.createWindow({id: 'test-drag', x: 100, y: 100, width: 400, height: 300});
    win.show();
    const header = win.headerElement;
    const startLeft = win.element.style.left;
    header.dispatchEvent(pointer('pointerdown', 150, 110));
    header.dispatchEvent(pointer('pointermove', 190, 140));
    expect(win.element.style.left).toBe(startLeft);
    expect(win.element.style.transform).toBe('translate3d(40px, 30px, 0)');
    header.dispatchEvent(pointer('pointerup', 190, 140));
    expect(win.element.style.transform).toBe('');
    expect(win.element.style.left).toBe(`${win.x}px`);
    expect(win.element.style.top).toBe(`${win.y}px`);
});
