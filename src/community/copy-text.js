const fallbackCopyText = text => new Promise((resolve, reject) => {
    if (typeof document === 'undefined' || !document.body || typeof document.execCommand !== 'function') {
        reject(new Error('Clipboard access is unavailable.'));
        return;
    }

    const previousFocus = document.activeElement;
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.setAttribute('readonly', '');
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);

    try {
        textArea.select();
        if (!document.execCommand('copy')) throw new Error('Copy command failed.');
        resolve();
    } catch (error) {
        reject(error);
    } finally {
        textArea.remove();
        if (previousFocus && typeof previousFocus.focus === 'function') previousFocus.focus();
    }
});

const copyText = text => {
    if (
        typeof navigator !== 'undefined' &&
        navigator.clipboard &&
        typeof navigator.clipboard.writeText === 'function'
    ) {
        return navigator.clipboard.writeText(text).catch(() => fallbackCopyText(text));
    }
    return fallbackCopyText(text);
};

export default copyText;
