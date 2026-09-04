const keyFor = username => `mw:last-edited:${username.toLowerCase()}`;

export const rememberEditedProject = (username, id) => {
    if (!username || !id) return;
    try {
        localStorage.setItem(keyFor(username), JSON.stringify({id: String(id), at: Date.now()}));
    } catch (e) {
        // Continuing from cloud projects still works without browser storage.
    }
};

export const getLastEditedProject = username => {
    if (!username) return null;
    try {
        const value = JSON.parse(localStorage.getItem(keyFor(username)) || 'null');
        return value && typeof value.id === 'string' && /^[\w-]+$/.test(value.id) ? value : null;
    } catch (e) {
        return null;
    }
};
