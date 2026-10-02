// MistWarp desktop is offline first, with no Rotur: no sign-in, no Rotur-backed
// community features, no payments, and nothing for projects to call. The
// desktop app's editor runs on tw-editor:// with window.EditorPreload, so
// either of those means desktop.

const ROTUR_OFFLINE_MESSAGE = 'Rotur isn\'t available in the MistWarp desktop app, which works offline.';

/**
 * @returns {boolean} Whether this editor can use Rotur at all.
 */
const hasRotur = () => {
    if (typeof window === 'undefined') return true;
    if (typeof window.EditorPreload !== 'undefined') return false;
    return /^https?:$/.test(window.location.protocol);
};

const roturOfflineError = () => Object.assign(new Error(ROTUR_OFFLINE_MESSAGE), {code: 'rotur_offline'});

export {hasRotur, roturOfflineError, ROTUR_OFFLINE_MESSAGE};
