import {local} from '../modules/storage';

const STORAGE_KEY = 'mw:vanilla-palette';
const VANILLA_PALETTE_CHANGED = 'mw:vanilla-palette-changed';

const getVanillaPalette = () => local.readString(STORAGE_KEY) === 'true';

const setVanillaPalette = enabled => {
    local.writeString(STORAGE_KEY, String(enabled));
    window.dispatchEvent(new CustomEvent(VANILLA_PALETTE_CHANGED));
};

export {
    getVanillaPalette,
    setVanillaPalette,
    VANILLA_PALETTE_CHANGED
};
