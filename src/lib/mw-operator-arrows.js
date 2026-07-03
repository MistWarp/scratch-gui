import VMScratchBlocks from './tw-lazy-scratch-blocks';

const STORAGE_KEY = 'mw:hide-operator-arrows';

const getHideOperatorArrows = () => {
    try {
        return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch (err) {
        return false;
    }
};

const getOperatorUtils = () => {
    if (!VMScratchBlocks.isLoaded()) {
        return null;
    }
    const ScratchBlocks = VMScratchBlocks.get();
    return ScratchBlocks && ScratchBlocks.ScratchBlocks && ScratchBlocks.ScratchBlocks.OperatorUtils;
};

const applyHideOperatorArrows = hidden => {
    const utils = getOperatorUtils();
    if (!utils) {
        return;
    }
    if (typeof utils.setArrowsHidden === 'function') {
        utils.setArrowsHidden(hidden);
    } else {
        utils.arrowsHidden = hidden;
    }
};

const setHideOperatorArrows = hidden => {
    try {
        localStorage.setItem(STORAGE_KEY, hidden);
    } catch (err) {
        // ignore
    }
    applyHideOperatorArrows(hidden);
};

const initOperatorArrows = () => {
    applyHideOperatorArrows(getHideOperatorArrows());
};

export {
    getHideOperatorArrows,
    setHideOperatorArrows,
    applyHideOperatorArrows,
    initOperatorArrows
};
