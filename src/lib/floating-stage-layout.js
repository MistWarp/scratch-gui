const STORAGE_KEY = 'mw:code-mode:floating-stage';
const MARGIN = 12;
const SNAP_DISTANCE = 32;
const MIN_WIDTH = 220;
const MAX_WIDTH = 960;
const DEFAULT_WIDTH = 360;
const CORNERS = ['top-right', 'top-left', 'bottom-left', 'bottom-right'];
const INSETS = {top: 76, right: 0, bottom: 36, left: 0};

const areaOf = host => ({
    x: INSETS.left,
    y: INSETS.top,
    width: Math.max(0, host.width - INSETS.left - INSETS.right),
    height: Math.max(0, host.height - INSETS.top - INSETS.bottom)
});

const DEFAULT_LAYOUT = {
    corner: 'top-right',
    dx: MARGIN,
    dy: MARGIN,
    width: DEFAULT_WIDTH,
    collapsed: false
};

const isFiniteNumber = value => typeof value === 'number' && Number.isFinite(value);

const normalizeLayout = value => {
    if (!value || typeof value !== 'object') return {...DEFAULT_LAYOUT};
    return {
        corner: CORNERS.includes(value.corner) ? value.corner : DEFAULT_LAYOUT.corner,
        dx: isFiniteNumber(value.dx) ? Math.max(0, value.dx) : DEFAULT_LAYOUT.dx,
        dy: isFiniteNumber(value.dy) ? Math.max(0, value.dy) : DEFAULT_LAYOUT.dy,
        width: isFiniteNumber(value.width) ? Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, value.width)) :
            DEFAULT_LAYOUT.width,
        collapsed: Boolean(value.collapsed)
    };
};

const readLayout = () => {
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        return normalizeLayout(raw ? JSON.parse(raw) : null);
    } catch (e) {
        return {...DEFAULT_LAYOUT};
    }
};

const writeLayout = layout => {
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeLayout(layout)));
    } catch (e) {
        return false;
    }
    return true;
};

const isRight = corner => corner.endsWith('right');
const isBottom = corner => corner.startsWith('bottom');

const fitWidth = ({width, host, aspect, chromeHeight, chromeWidth}) => {
    const area = areaOf(host);
    const maxByWidth = area.width - (MARGIN * 2);
    const maxByHeight = ((area.height - (MARGIN * 2) - chromeHeight) / aspect) + chromeWidth;
    const limit = Math.min(MAX_WIDTH, maxByWidth, maxByHeight);
    return Math.round(Math.max(Math.min(MIN_WIDTH, maxByWidth), Math.min(width, limit)));
};

const boxFor = ({layout, host, size}) => {
    const area = areaOf(host);
    const maxX = Math.max(0, area.width - size.width);
    const maxY = Math.max(0, area.height - size.height);
    const dx = Math.min(layout.dx, maxX);
    const dy = Math.min(layout.dy, maxY);
    return {
        left: area.x + (isRight(layout.corner) ? maxX - dx : dx),
        top: area.y + (isBottom(layout.corner) ? maxY - dy : dy)
    };
};

const snapToCorner = ({left, top, host, size}) => {
    const area = areaOf(host);
    const maxX = Math.max(0, area.width - size.width);
    const maxY = Math.max(0, area.height - size.height);
    const clampedLeft = Math.min(Math.max(0, left - area.x), maxX);
    const clampedTop = Math.min(Math.max(0, top - area.y), maxY);
    const right = clampedLeft + (size.width / 2) > area.width / 2;
    const bottom = clampedTop + (size.height / 2) > area.height / 2;
    const snap = distance => (distance < SNAP_DISTANCE ? MARGIN : Math.round(distance));
    return {
        corner: `${bottom ? 'bottom' : 'top'}-${right ? 'right' : 'left'}`,
        dx: snap(right ? maxX - clampedLeft : clampedLeft),
        dy: snap(bottom ? maxY - clampedTop : clampedTop)
    };
};

const nextCorner = (corner, key) => {
    const vertical = isBottom(corner) ? 'bottom' : 'top';
    const horizontal = isRight(corner) ? 'right' : 'left';
    if (key === 'ArrowLeft') return `${vertical}-left`;
    if (key === 'ArrowRight') return `${vertical}-right`;
    if (key === 'ArrowUp') return `top-${horizontal}`;
    if (key === 'ArrowDown') return `bottom-${horizontal}`;
    return corner;
};

export {
    DEFAULT_LAYOUT,
    MARGIN,
    MAX_WIDTH,
    MIN_WIDTH,
    boxFor,
    fitWidth,
    isBottom,
    isRight,
    nextCorner,
    normalizeLayout,
    readLayout,
    snapToCorner,
    writeLayout
};
