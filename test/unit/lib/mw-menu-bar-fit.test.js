import {
    FIT_STEPS,
    STEP_DOWN_MARGIN,
    TITLE_MIN_WIDTH,
    fitStepsAttribute,
    measureMenuSlack,
    nextFitLevel
} from '../../../src/lib/mw/menu-bar-fit.js';

const sized = (element, width) => {
    element.getBoundingClientRect = () => ({width});
    return element;
};

const buildMenu = ({menuWidth, items, titleWidth}) => {
    const menu = document.createElement('div');
    menu.style.columnGap = '8px';
    Object.defineProperty(menu, 'clientWidth', {value: menuWidth});
    const group = document.createElement('div');
    group.style.display = 'contents';
    items.forEach(width => group.appendChild(sized(document.createElement('div'), width)));
    menu.appendChild(group);
    const floating = sized(document.createElement('div'), 500);
    floating.style.position = 'absolute';
    menu.appendChild(floating);
    if (typeof titleWidth === 'number') {
        const title = sized(document.createElement('div'), titleWidth);
        title.setAttribute('data-mw-item', 'project-title');
        menu.appendChild(title);
    }
    document.body.appendChild(menu);
    return menu;
};

afterEach(() => {
    document.body.innerHTML = '';
});

test('counts items inside display: contents groups and skips floating ones', () => {
    const menu = buildMenu({menuWidth: 400, items: [100, 100]});
    expect(measureMenuSlack(menu)).toBe(400 - 200 - 8);
});

test('reserves room for a usable project title instead of its current width', () => {
    const menu = buildMenu({menuWidth: 400, items: [100], titleWidth: 18});
    expect(measureMenuSlack(menu)).toBe(400 - 100 - TITLE_MIN_WIDTH - 8);
});

test('steps up while the menu does not fit, up to the last step', () => {
    expect(nextFitLevel(0, -1, [])).toBe(1);
    expect(nextFitLevel(FIT_STEPS.length, -50, [])).toBe(FIT_STEPS.length);
});

test('steps down only when the space a step saved is free again', () => {
    const savings = [undefined, 100];
    expect(nextFitLevel(1, 100 + STEP_DOWN_MARGIN - 1, savings)).toBe(1);
    expect(nextFitLevel(1, 100 + STEP_DOWN_MARGIN, savings)).toBe(0);
});

test('holds a step whose saving has not been measured yet', () => {
    expect(nextFitLevel(2, 1000, [])).toBe(2);
});

test('lists every active step for the menu bar attribute', () => {
    expect(fitStepsAttribute(0)).toBe('');
    expect(fitStepsAttribute(2)).toBe('save-status menu-labels');
});
