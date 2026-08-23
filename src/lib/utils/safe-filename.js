const RESERVED_WINDOWS_NAMES = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i;
const INVALID_FILENAME_CHARACTERS = /[<>:"/\\|?*]/g;

const safeFilenameBase = (title, fallback = 'project', maxLength = 100) => {
    const clean = value => Array.from(String(value || ''), character => (
        character.charCodeAt(0) < 32 ? '_' : character
    )
    ).join('')
        .replace(INVALID_FILENAME_CHARACTERS, '_')
        .trim()
        .replace(/[. ]+$/g, '')
        .substring(0, maxLength);
    const base = clean(title) || clean(fallback) || 'project';
    return RESERVED_WINDOWS_NAMES.test(base) ? `_${base}` : base;
};

const projectFilename = (title, fallback, extension) => `${safeFilenameBase(title, fallback)}.${extension}`;

export {safeFilenameBase, projectFilename};
