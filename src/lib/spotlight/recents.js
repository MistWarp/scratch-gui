// Recently chosen spotlight results, most-recent-first, bounded.

const STORAGE_KEY = 'mw:spotlight-recents';
const RECENTS_MAX = 12;

const getRecents = () => {
    try {
        const value = JSON.parse(localStorage.getItem(STORAGE_KEY));
        return Array.isArray(value) ? value.filter(entry => entry && entry.kind && entry.key) : [];
    } catch (e) {
        return [];
    }
};

const pushRecent = (kind, key) => {
    if (!kind || !key) return;
    const list = getRecents().filter(entry => !(entry.kind === kind && entry.key === key));
    list.unshift({kind, key});
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, RECENTS_MAX)));
    } catch (e) {
        // ignore write failures (private mode, quota)
    }
};

const recentRank = (recents, kind, key) => {
    for (let i = 0; i < recents.length; i++) {
        if (recents[i].kind === kind && recents[i].key === key) return i;
    }
    return -1;
};

export {
    getRecents,
    pushRecent,
    recentRank,
    RECENTS_MAX
};
