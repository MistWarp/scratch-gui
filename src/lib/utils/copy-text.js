const getDocument = options => (
    (options && options.document) || (typeof document === 'undefined' ? null : document)
);

const fallbackCopyText = (text, doc) => new Promise((resolve, reject) => {
    if (!doc || !doc.body || typeof doc.execCommand !== 'function') {
        reject(new Error('Clipboard access is unavailable.'));
        return;
    }

    const previousFocus = doc.activeElement;
    const textArea = doc.createElement('textarea');
    textArea.value = text;
    textArea.setAttribute('readonly', '');
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    doc.body.appendChild(textArea);

    try {
        textArea.focus();
        textArea.select();
        if (!doc.execCommand('copy')) throw new Error('Copy command failed.');
        resolve();
    } catch (error) {
        reject(error);
    } finally {
        textArea.remove();
        if (previousFocus && typeof previousFocus.focus === 'function') previousFocus.focus();
    }
});

/**
 * Copy text to the clipboard. Uses the Clipboard API when it is available and
 * falls back to the copy command when it is missing or refuses.
 * @param {string} text Text to copy.
 * @param {object} [options] Options.
 * @param {Document} [options.document] Document to copy from, for content shown in another window
 * (such as a popped-out panel). Defaults to the current document.
 * @returns {Promise<void>} Resolves once the text is copied, rejects if it could not be.
 */
const copyText = (text, options) => {
    const doc = getDocument(options);
    const view = doc && doc.defaultView;
    const nav = (view && view.navigator) || (typeof navigator === 'undefined' ? null : navigator);
    if (nav && nav.clipboard && typeof nav.clipboard.writeText === 'function') {
        try {
            return Promise.resolve(nav.clipboard.writeText(text)).catch(() => fallbackCopyText(text, doc));
        } catch (error) {
            return fallbackCopyText(text, doc);
        }
    }
    return fallbackCopyText(text, doc);
};

export default copyText;
