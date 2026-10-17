const ACCOUNT_ORIGIN = process.env.MW_ACCOUNT_ORIGIN || 'https://mistwarp.org';
const EDITOR_ORIGIN = process.env.MW_EDITOR_ORIGIN || 'https://editor.mistwarp.org';

const currentOrigin = () => (typeof location === 'undefined' ? '' : location.origin);

const isSplitEditor = () => EDITOR_ORIGIN !== ACCOUNT_ORIGIN && currentOrigin() === EDITOR_ORIGIN;

const isEditorOrigin = origin => EDITOR_ORIGIN !== ACCOUNT_ORIGIN && origin === EDITOR_ORIGIN;

const editorMovedAway = () => EDITOR_ORIGIN !== ACCOUNT_ORIGIN && currentOrigin() === ACCOUNT_ORIGIN;

export {
    ACCOUNT_ORIGIN,
    EDITOR_ORIGIN,
    isSplitEditor,
    isEditorOrigin,
    editorMovedAway
};
