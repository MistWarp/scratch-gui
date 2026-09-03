import Papa from 'papaparse';

export default () => new Promise((resolve, reject) => {
    const fileInput = document.createElement('input');
    fileInput.setAttribute('type', 'file');
    // accepting only these file types by default gets really annoying :3
    // fileInput.setAttribute('accept', '.csv, .tsv, .txt'); // parser auto-detects delimiter
    let settled = false;
    let handleWindowFocus = null;
    let handleWindowBlur = null;
    // The file dialog blurs the window when it opens in most browsers.
    // Only treat a later focus as a cancel if we actually saw that blur;
    // otherwise focus events from closing the context menu would cancel
    // the import before the user picks a file.
    let sawBlur = false;

    const cleanup = () => {
        window.removeEventListener('focus', handleWindowFocus);
        window.removeEventListener('blur', handleWindowBlur);
        fileInput.onchange = null;
        fileInput.oncancel = null;
        if (fileInput.parentNode) fileInput.parentNode.removeChild(fileInput);
    };
    const finish = result => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve(result);
    };
    const fail = error => {
        if (settled) return;
        settled = true;
        cleanup();
        reject(error);
    };
    const cancel = () => {
        const error = new Error('File selection cancelled');
        error.name = 'AbortError';
        fail(error);
    };
    handleWindowBlur = () => {
        sawBlur = true;
    };
    handleWindowFocus = () => {
        if (!sawBlur) return;
        // File inputs usually dispatch change just after returning focus to the page,
        // so wait a tick to give change/oncancel a chance to run first.
        setTimeout(() => {
            if (!settled && (!fileInput.files || fileInput.files.length === 0)) cancel();
        }, 300);
    };

    fileInput.onchange = e => {
        const file = e.target.files[0];
        if (!file) {
            cancel();
            return;
        }
        const fr = new FileReader();
        fr.onload = () => {
            const text = fr.result;
            Papa.parse(text, {
                header: false,
                complete: results => {
                    finish({
                        rows: results.data,
                        text
                    });
                },
                error: err => {
                    fail(err);
                }
            });
        };
        fr.onerror = () => {
            fail(new Error('Cannot read file'));
        };
        try {
            fr.readAsText(file);
        } catch (error) {
            fail(error);
        }
    };
    fileInput.oncancel = cancel;
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);
    document.body.appendChild(fileInput);
    fileInput.click();
});
