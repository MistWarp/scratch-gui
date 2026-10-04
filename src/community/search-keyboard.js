const searchFocusIndex = (key, currentIndex, itemCount) => {
    if (!itemCount) return -1;
    if (key === 'ArrowDown') return currentIndex < 0 ? 0 : (currentIndex + 1) % itemCount;
    if (key === 'ArrowUp') return currentIndex < 0 ? itemCount - 1 : (currentIndex - 1 + itemCount) % itemCount;
    if (key === 'Home') return 0;
    if (key === 'End') return itemCount - 1;
    return null;
};

// What a key press in the search box does to the highlighted quick result. Focus stays in the
// input, so Home and End keep moving the caret until a result is highlighted.
export const searchKeyAction = (key, activeIndex, itemCount, open) => {
    if (key === 'Escape') return {type: 'close'};
    if (key === 'Enter') {
        return open && activeIndex >= 0 && activeIndex < itemCount ? {type: 'select', index: activeIndex} : null;
    }
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(key)) return null;
    if (!open) return key === 'ArrowDown' || key === 'ArrowUp' ? {type: 'open'} : null;
    if (activeIndex < 0 && (key === 'Home' || key === 'End')) return null;
    const index = searchFocusIndex(key, activeIndex, itemCount);
    return index < 0 ? null : {type: 'move', index};
};

export default searchFocusIndex;
