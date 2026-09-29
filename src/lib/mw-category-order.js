const STORAGE_KEY = 'mw:category-order';
const CATEGORY_ORDER_CHANGED = 'mw:category-order-changed';

const getCategoryOrder = () => {
    try {
        const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
        return Array.isArray(parsed) ? parsed.filter(id => typeof id === 'string') : [];
    } catch (err) {
        return [];
    }
};

const setCategoryOrder = ids => {
    try {
        if (ids.length) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
        } else {
            localStorage.removeItem(STORAGE_KEY);
        }
    } catch (err) {
        // ignore
    }
    window.dispatchEvent(new CustomEvent(CATEGORY_ORDER_CHANGED));
};

const resetCategoryOrder = () => setCategoryOrder([]);

const applyCategoryOrder = (entries, order = getCategoryOrder()) => {
    const rank = new Map(order.map((id, index) => [id, index]));
    const ranked = entries.filter(entry => rank.has(entry.id))
        .sort((a, b) => rank.get(a.id) - rank.get(b.id));
    const lastRanked = entries.reduce((last, entry, index) => (rank.has(entry.id) ? index : last), -1);
    const result = [...ranked];
    entries.forEach((entry, index) => {
        if (rank.has(entry.id)) return;
        if (index > lastRanked) {
            result.push(entry);
            return;
        }
        const previous = index > 0 ? result.indexOf(entries[index - 1]) : -1;
        result.splice(previous + 1, 0, entry);
    });
    return result;
};

const moveCategory = (currentIds, movedId, beforeId) => {
    const ids = [...new Set([...getCategoryOrder(), ...currentIds])];
    const visible = new Set(currentIds);
    const without = ids.filter(id => id !== movedId);
    let index = beforeId ? without.indexOf(beforeId) : -1;
    if (index < 0) {
        const lastVisible = without.reduce((last, id, i) => (visible.has(id) ? i : last), -1);
        index = lastVisible + 1;
    }
    without.splice(index, 0, movedId);
    return without;
};

export {
    applyCategoryOrder,
    getCategoryOrder,
    moveCategory,
    resetCategoryOrder,
    setCategoryOrder,
    CATEGORY_ORDER_CHANGED
};
