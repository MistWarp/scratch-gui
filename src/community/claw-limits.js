import {useEffect, useState} from 'react';
import api from './api.js';

const tierRank = tier => ({lite: 1, plus: 2, drive: 3, pro: 3, max: 4}[String(tier || '').toLowerCase()] || 0);

const postLimit = tier => {
    const rank = tierRank(tier);
    return rank >= 4 ? 1000 : rank >= 3 ? 800 : rank >= 2 ? 600 : rank >= 1 ? 400 : 300;
};

const attachmentLimit = tier => {
    const rank = tierRank(tier);
    return rank >= 3 ? 4 : rank >= 2 ? 2 : 1;
};

const lengths = new Map();

const perksPostLength = username => {
    const key = String(username || '').toLowerCase();
    if (!lengths.has(key)) {
        const promise = Promise.resolve()
            .then(() => (api.loadSession() ? api.perks() : null))
            .then(data => {
                const value = Number(data && data.current && data.current.rotur && data.current.rotur.clawPostLength);
                return Number.isInteger(value) && value >= 100 && value <= 10000 ? value : null;
            })
            .catch(() => null)
            .then(value => {
                if (value === null && lengths.get(key) === promise) lengths.delete(key);
                return value;
            });
        lengths.set(key, promise);
    }
    return lengths.get(key);
};

const useClawPostLength = user => {
    const username = (user && user.username) || '';
    const fallback = postLimit(user && (user.subscription || user.tier));
    const [fromPerks, setFromPerks] = useState(null);
    useEffect(() => {
        let active = true;
        setFromPerks(null);
        if (!username) return () => {};
        perksPostLength(username).then(value => {
            if (active && value) setFromPerks(value);
        });
        return () => {
            active = false;
        };
    }, [username]);
    return fromPerks || fallback;
};

export {attachmentLimit, postLimit, useClawPostLength};
