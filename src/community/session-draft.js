// Unsent composer text kept for the browser tab, so a reload or a detour does not lose it.
const PREFIX = 'mw-community-draft:';

export const readSessionDraft = key => {
    if (!key) return '';
    try {
        return sessionStorage.getItem(PREFIX + key) || '';
    } catch (e) {
        return '';
    }
};

export const writeSessionDraft = (key, value) => {
    if (!key) return;
    try {
        if (value) sessionStorage.setItem(PREFIX + key, value);
        else sessionStorage.removeItem(PREFIX + key);
    } catch (e) { /* Drafts are a convenience; storage may be full or blocked. */ }
};
