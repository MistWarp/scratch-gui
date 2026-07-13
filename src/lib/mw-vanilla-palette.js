const STORAGE_KEY = 'mw:vanilla-palette';
const VANILLA_PALETTE_CHANGED = 'mw:vanilla-palette-changed';

const getVanillaPalette = () => {
    try {
        return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch (err) {
        return false;
    }
};

const setVanillaPalette = enabled => {
    try {
        localStorage.setItem(STORAGE_KEY, enabled);
    } catch (err) {
        // ignore
    }
    window.dispatchEvent(new CustomEvent(VANILLA_PALETTE_CHANGED));
};

export {
    getVanillaPalette,
    setVanillaPalette,
    VANILLA_PALETTE_CHANGED
};
