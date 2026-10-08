const FIT_STEPS = ['save-status', 'menu-labels', 'save-label', 'more-menu'];
const TITLE_MIN_WIDTH = 120;
const STEP_DOWN_MARGIN = 8;

const isMeasured = style => style.display !== 'none' &&
    style.position !== 'absolute' && style.position !== 'fixed';

const collectItems = (parent, items) => {
    for (const child of parent.children) {
        const style = getComputedStyle(child);
        if (style.display === 'contents') {
            collectItems(child, items);
        } else if (isMeasured(style)) {
            items.push({element: child, style});
        }
    }
    return items;
};

const measureMenuSlack = menu => {
    const items = collectItems(menu, []);
    const gap = parseFloat(getComputedStyle(menu).columnGap) || 0;
    let used = gap * Math.max(0, items.length - 1);
    for (const {element, style} of items) {
        used += (parseFloat(style.marginLeft) || 0) + (parseFloat(style.marginRight) || 0);
        used += element.getAttribute('data-mw-item') === 'project-title' ?
            TITLE_MIN_WIDTH :
            element.getBoundingClientRect().width;
    }
    return menu.clientWidth - used;
};

const nextFitLevel = (level, slack, savings) => {
    if (slack < 0 && level < FIT_STEPS.length) return level + 1;
    if (level > 0) {
        const saved = typeof savings[level] === 'number' ? savings[level] : Infinity;
        if (slack - saved >= STEP_DOWN_MARGIN) return level - 1;
    }
    return level;
};

const fitStepsAttribute = level => FIT_STEPS.slice(0, level).join(' ');

export {
    FIT_STEPS,
    TITLE_MIN_WIDTH,
    STEP_DOWN_MARGIN,
    measureMenuSlack,
    nextFitLevel,
    fitStepsAttribute
};
