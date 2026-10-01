const STORAGE_KEY = 'mw:category-order';
const CATEGORY_ORDER_CHANGED = 'mw:category-order-changed';

const cleanOrder = order => (Array.isArray(order) ? order.filter(id => typeof id === 'string') : []);

const supportsProjectOrder = vm => Boolean(
    vm && vm.runtime &&
    typeof vm.runtime.getCategoryOrder === 'function' &&
    typeof vm.runtime.setCategoryOrder === 'function'
);

const getProjectOrder = vm => (supportsProjectOrder(vm) ? cleanOrder(vm.runtime.getCategoryOrder()) : []);

const getLocalOrder = () => {
    try {
        return cleanOrder(JSON.parse(localStorage.getItem(STORAGE_KEY)));
    } catch (err) {
        return [];
    }
};

const setLocalOrder = ids => {
    try {
        if (ids.length) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
        } else {
            localStorage.removeItem(STORAGE_KEY);
        }
    } catch (err) {
        // ignore
    }
};

const getCategoryOrder = vm => {
    const projectOrder = getProjectOrder(vm);
    return projectOrder.length ? projectOrder : getLocalOrder();
};

const setCategoryOrder = (vm, ids, useProject) => {
    if (useProject && supportsProjectOrder(vm)) {
        vm.runtime.setCategoryOrder(ids);
    } else {
        setLocalOrder(ids);
    }
    window.dispatchEvent(new CustomEvent(CATEGORY_ORDER_CHANGED));
};

const hasCustomCategoryOrder = vm => getProjectOrder(vm).length > 0 || getLocalOrder().length > 0;

const resetCategoryOrder = vm => {
    if (getProjectOrder(vm).length) vm.runtime.setCategoryOrder([]);
    setLocalOrder([]);
    window.dispatchEvent(new CustomEvent(CATEGORY_ORDER_CHANGED));
};

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
    hasCustomCategoryOrder,
    moveCategory,
    resetCategoryOrder,
    setCategoryOrder,
    CATEGORY_ORDER_CHANGED
};
