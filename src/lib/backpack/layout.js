const LAYOUT_KEY = 'mw:backpackLayout';
const PIN_KEY = 'mw:backpackPinned';
const HEIGHT_KEY = 'mw:backpackHeight';

const LAYOUTS = ['drawer', 'strip'];
const DEFAULT_LAYOUT = 'drawer';
const FILTERS = ['all', 'script', 'sprite', 'costume', 'sound'];

const readStorage = key => {
    try {
        return localStorage.getItem(key);
    } catch (e) {
        return null;
    }
};

const writeStorage = (key, value) => {
    try {
        localStorage.setItem(key, value);
        return true;
    } catch (e) {
        return false;
    }
};

const readLayoutParam = () => {
    try {
        const value = new URLSearchParams(window.location.search).get('backpackLayout');
        return LAYOUTS.includes(value) ? value : null;
    } catch (e) {
        return null;
    }
};

const getBackpackLayout = () => {
    const fromUrl = readLayoutParam();
    if (fromUrl) return fromUrl;
    const stored = readStorage(LAYOUT_KEY);
    return LAYOUTS.includes(stored) ? stored : DEFAULT_LAYOUT;
};

const setBackpackLayout = layout => writeStorage(LAYOUT_KEY, layout);

const getBackpackPinned = () => readStorage(PIN_KEY) === 'true';

const setBackpackPinned = pinned => writeStorage(PIN_KEY, pinned ? 'true' : 'false');

const getBackpackHeight = minimum => {
    const parsed = Number(readStorage(HEIGHT_KEY));
    if (Number.isFinite(parsed) && parsed >= minimum) return parsed;
    return null;
};

const setBackpackHeight = height => writeStorage(HEIGHT_KEY, String(height));

export {
    LAYOUTS,
    DEFAULT_LAYOUT,
    FILTERS,
    getBackpackLayout,
    setBackpackLayout,
    getBackpackPinned,
    setBackpackPinned,
    getBackpackHeight,
    setBackpackHeight
};
