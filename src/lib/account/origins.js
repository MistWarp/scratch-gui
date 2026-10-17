const ACCOUNT_ORIGIN = process.env.MW_ACCOUNT_ORIGIN || 'https://mistwarp.org';
const EDITOR_ORIGIN = process.env.MW_EDITOR_ORIGIN || 'https://editor.mistwarp.org';

const currentOrigin = () => (typeof location === 'undefined' ? '' : location.origin);

const isSplitEditor = () => EDITOR_ORIGIN !== ACCOUNT_ORIGIN && currentOrigin() === EDITOR_ORIGIN;

const isEditorOrigin = origin => EDITOR_ORIGIN !== ACCOUNT_ORIGIN && origin === EDITOR_ORIGIN;

const editorRoot = () => {
    if (EDITOR_ORIGIN === ACCOUNT_ORIGIN) return '/editor';
    const origin = currentOrigin();
    if (origin === EDITOR_ORIGIN) return '/';
    if (origin === ACCOUNT_ORIGIN) return `${EDITOR_ORIGIN}/`;
    return '/editor';
};

export {
    ACCOUNT_ORIGIN,
    EDITOR_ORIGIN,
    editorRoot,
    isSplitEditor,
    isEditorOrigin
};
