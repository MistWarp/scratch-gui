import {local} from '../../modules/storage';
const HEIGHT_KEY = 'mw:backpackHeight';

const FILTERS = ['all', 'script', 'sprite', 'costume', 'sound'];

const getBackpackHeight = minimum => {
    const parsed = Number(local.readString(HEIGHT_KEY));
    if (Number.isFinite(parsed) && parsed >= minimum) return parsed;
    return null;
};

const setBackpackHeight = height => local.writeString(HEIGHT_KEY, String(height));

export {
    FILTERS,
    getBackpackHeight,
    setBackpackHeight
};
