const selectedIndexAfterDelete = (selectedIndex, deletedIndex, itemCount) => {
    if (deletedIndex < selectedIndex) return selectedIndex - 1;
    if (deletedIndex > selectedIndex) return selectedIndex;
    return Math.min(selectedIndex, Math.max(itemCount - 2, 0));
};

export {selectedIndexAfterDelete};
