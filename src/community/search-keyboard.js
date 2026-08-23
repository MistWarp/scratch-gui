const searchFocusIndex = (key, currentIndex, itemCount) => {
    if (!itemCount) return -1;
    if (key === 'ArrowDown') return currentIndex < 0 ? 0 : (currentIndex + 1) % itemCount;
    if (key === 'ArrowUp') return currentIndex < 0 ? itemCount - 1 : (currentIndex - 1 + itemCount) % itemCount;
    if (key === 'Home') return 0;
    if (key === 'End') return itemCount - 1;
    return null;
};

export default searchFocusIndex;
