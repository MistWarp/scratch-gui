import api from './api';
import {subscribeTier} from '../lib/rotur/client.js';

const storageKey = username => `mw:tier:${String(username).toLowerCase()}`;

const readStored = key => {
    try {
        return localStorage.getItem(key);
    } catch (_) {
        return null;
    }
};

const writeStored = (key, value) => {
    try {
        localStorage.setItem(key, value);
    } catch (_) {
        return;
    }
};

const watchTier = (username, onChange) => {
    const key = storageKey(username);
    let last = readStored(key);
    return subscribeTier(async hint => {
        if (hint === last) return;
        last = hint;
        const result = await api.refreshPerks().catch(() => null);
        const upgraded = Boolean(result && result.upgradedFrom);
        if (result && !upgraded) writeStored(key, hint);
        onChange({
            current: result && result.current ? result.current : {tier: hint},
            upgraded,
            acknowledge: () => {
                writeStored(key, hint);
                return api.perksSeen().catch(() => null);
            }
        });
    });
};

export {watchTier};
