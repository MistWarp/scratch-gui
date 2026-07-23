import WindowManager from './window-manager';

const showAlert = (message, options = {}) => new Promise(resolve => {
    const title = options.title || 'Alert';
    const width = options.width || 420;
    const height = options.height || 160;

    const win = WindowManager.createWindow({
        title,
        width,
        height,
        resizable: false,
        maximizable: false,
        minimizable: false,
        closable: true,
        modal: true,
        alwaysOnTop: true,
        className: 'mw-alert-window'
    });

    let windowGrabbedHandler = null;

    const cleanup = () => {
        if (windowGrabbedHandler) {
            document.removeEventListener('pointerdown', windowGrabbedHandler);
            windowGrabbedHandler = null;
        }
    };

    const handleWindowGrabbed = e => {
        const clickedWindow = e.target.closest('.addon-window');
        if (clickedWindow && clickedWindow !== win.element) {
            try {
                win.close();
            } catch (err) {
                // ignore
            }
            resolve();
            cleanup();
        }
    };

    windowGrabbedHandler = handleWindowGrabbed;
    setTimeout(() => {
        document.addEventListener('pointerdown', windowGrabbedHandler);
    }, 100);

    const content = document.createElement('div');
    content.style.cssText = 'padding:18px;display:flex;flex-direction:column;gap:12px;' +
        'align-items:stretch;justify-content:center;min-height:100%;box-sizing:border-box;' +
        'font-family:inherit;color:var(--ui-modal-foreground, #111);';

    const msgEl = document.createElement('div');
    msgEl.innerText = String(message === null ? '' : message);
    msgEl.style.cssText = 'white-space:pre-wrap;font-size:14px;line-height:1.4;';

    const controls = document.createElement('div');
    controls.style.cssText = 'display:flex;justify-content:flex-end;gap:8px;margin-top:6px;';

    const okBtn = document.createElement('button');
    okBtn.innerText = options.okLabel || 'OK';
    okBtn.className = 'mw-alert-ok-btn';
    okBtn.style.cssText = 'padding:8px 14px;border-radius:8px;border:none;' +
        'background:var(--ui-primary, #4C97FF);color:white;cursor:pointer;font-weight:600;';

    okBtn.addEventListener('click', () => {
        try {
            win.close();
        } catch (e) {
            // ignore
        }
        cleanup();
        resolve();
    });

    const keyHandler = e => {
        if (e.key === 'Enter' || e.key === 'Escape') {
            e.preventDefault();
            try {
                win.close();
            } catch (err) {
                // ignore
            }
            cleanup();
            resolve();
        }
    };

    controls.appendChild(okBtn);
    content.appendChild(msgEl);
    content.appendChild(controls);

    win.setContent(content);
    win.center().show();

    setTimeout(() => {
        try {
            okBtn.focus();
        } catch (e) {
            // ignore
        }
        document.addEventListener('keydown', keyHandler);
    }, 10);

    const origOnClose = win.onClose;
    win.onClose = () => {
        document.removeEventListener('keydown', keyHandler);
        cleanup();
        try {
            origOnClose();
        } catch (e) {
            // ignore
        }
        resolve();
    };
});

export default showAlert;
