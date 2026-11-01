import {local} from '../../modules/storage';

const keyFor = username => `mw:last-edited:${username.toLowerCase()}`;

export const rememberEditedProject = (username, id) => {
    if (!username || !id) return;
    local.writeJSON(keyFor(username), {id: String(id), at: Date.now()});
};

export const getLastEditedProject = username => {
    if (!username) return null;
    try {
        const value = JSON.parse(local.readString(keyFor(username)) || 'null');
        return value && typeof value.id === 'string' && /^[\w-]+$/.test(value.id) ? value : null;
    } catch (e) {
        return null;
    }
};
