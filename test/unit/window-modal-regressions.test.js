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
