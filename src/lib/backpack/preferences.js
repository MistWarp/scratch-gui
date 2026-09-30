const HEIGHT_KEY = 'mw:backpackHeight';

const FILTERS = ['all', 'script', 'sprite', 'costume', 'sound'];

const getBackpackHeight = minimum => {
    try {
        const parsed = Number(localStorage.getItem(HEIGHT_KEY));
        if (Number.isFinite(parsed) && parsed >= minimum) return parsed;
    } catch (e) {
        return null;
    }
    return null;
};

const setBackpackHeight = height => {
    try {
        localStorage.setItem(HEIGHT_KEY, String(height));
        return true;
    } catch (e) {
        return false;
    }
};

export {
    FILTERS,
    getBackpackHeight,
    setBackpackHeight
};
