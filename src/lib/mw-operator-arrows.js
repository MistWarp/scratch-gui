import VMScratchBlocks from './tw-lazy-scratch-blocks';
import {local} from '../modules/storage';

const STORAGE_KEY = 'mw:hide-operator-arrows';

const getHideOperatorArrows = () => local.readString(STORAGE_KEY) === 'true';

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
    local.writeString(STORAGE_KEY, String(hidden));
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
