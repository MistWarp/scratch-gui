import api from './api';
import {subscribeTier} from '../lib/rotur/client.js';
import {local} from '../modules/storage';

const storageKey = username => `mw:tier:${String(username).toLowerCase()}`;

const readStored = key => local.readString(key);

const writeStored = (key, value) => {
    local.writeString(key, String(value));
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
