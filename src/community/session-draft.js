import {session} from '../modules/storage';

// Unsent composer text kept for the browser tab, so a reload or a detour does not lose it.
const PREFIX = 'mw-community-draft:';

export const readSessionDraft = key => {
    if (!key) return '';
    return session.readString(PREFIX + key) || '';
};

export const writeSessionDraft = (key, value) => {
    if (!key) return;
    if (value) session.writeString(PREFIX + key, String(value));
    else session.remove(PREFIX + key);
};
