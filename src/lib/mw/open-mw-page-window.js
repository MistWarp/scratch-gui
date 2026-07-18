import WindowManager from '../../addons/window-system/window-manager';

const openWindows = new Map();

const openMistWarpPageWindow = ({id, title, path, width = 940, height = 640}) => {
    const existing = openWindows.get(id);
    if (existing) {
        existing.show().bringToFront();
        return existing;
    }

    const iframe = document.createElement('iframe');
    iframe.src = path;
    iframe.title = title;
    iframe.style.cssText = [
        'flex: 1',
        'width: 100%',
        'height: 100%',
        'border: 0',
        'min-height: 0',
        'background: var(--ui-modal-background, #fff)'
    ].join('; ');

    const win = WindowManager.createWindow({
        id,
        title,
        width,
        height,
        minWidth: 480,
        minHeight: 400,
        onClose: () => openWindows.delete(id)
    });

    win.setContent(iframe);
    win.center();
    win.show();
    openWindows.set(id, win);
    return win;
};

export default openMistWarpPageWindow;
