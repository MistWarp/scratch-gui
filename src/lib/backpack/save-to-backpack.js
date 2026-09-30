import {getAppearanceSetting} from '../mw-appearance-settings';

let saver = null;

const registerBackpackSaver = fn => {
    saver = fn;
    return () => {
        if (saver === fn) saver = null;
    };
};

const isBackpackAvailable = () => {
    if (!saver) return false;
    try {
        return !getAppearanceSetting('hide-backpack');
    } catch (e) {
        return true;
    }
};

const saveToBackpack = request => {
    if (!isBackpackAvailable()) return Promise.resolve(false);
    return saver(request);
};

export {
    registerBackpackSaver,
    isBackpackAvailable,
    saveToBackpack
};
