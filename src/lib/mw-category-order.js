const CATEGORY_ORDER_CHANGED = 'mw:category-order-changed';

const getCategoryOrder = vm => {
    const runtime = vm && vm.runtime;
    if (!runtime || typeof runtime.getCategoryOrder !== 'function') return [];
    return runtime.getCategoryOrder();
};

const setCategoryOrder = (vm, ids) => {
    const runtime = vm && vm.runtime;
    if (!runtime || typeof runtime.setCategoryOrder !== 'function') return;
    runtime.setCategoryOrder(ids);
    window.dispatchEvent(new CustomEvent(CATEGORY_ORDER_CHANGED));
};

const resetCategoryOrder = vm => setCategoryOrder(vm, []);

const applyCategoryOrder = (entries, order = []) => {
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

const moveCategory = (savedOrder, currentIds, movedId, beforeId) => {
    const ids = [...new Set([...savedOrder, ...currentIds])];
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
