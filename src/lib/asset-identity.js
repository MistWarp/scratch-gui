const ids = new WeakMap();
let counter = 0;

const itemIdFor = item => {
    if (!item || typeof item !== 'object') return null;
    let id = ids.get(item);
    if (!id) {
        id = `item${++counter}`;
        ids.set(item, id);
    }
    return id;
};

const indexOfItem = (items, itemId) => {
    if (!Array.isArray(items) || !itemId) return -1;
    return items.findIndex(item => ids.get(item) === itemId);
};

const findItem = (items, itemId) => {
    const index = indexOfItem(items, itemId);
    return index === -1 ? null : items[index];
};

export {
    findItem,
    indexOfItem,
    itemIdFor
};
