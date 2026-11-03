import {useEffect, useState} from 'react';

import {getPlayerStageWidth} from '../../modules/editor-layout';
import getMenuBarHeight from '../../lib/utils/menu-bar-height';

// Stage controls ($stage-menu-height) above the stage, and some space below it.
const STAGE_CONTROLS_HEIGHT = 44;
const SPACE_BELOW = 32;

// Everything above the stage controls: the menu bar and anything shown under it, like the news banner.
const getHeightAbove = () => {
    const wrapper = document.querySelector("[class*='stage-wrapper_stage-wrapper']");
    return wrapper ? wrapper.getBoundingClientRect().top + window.scrollY : getMenuBarHeight();
};

const usePlayerStageWidth = (isPlayerOnly, customStageSize) => {
    const [playerStageWidth, setPlayerStageWidth] = useState(null);
    useEffect(() => {
        if (!isPlayerOnly || typeof window === 'undefined') return;
        const fitPlayer = () => {
            setPlayerStageWidth(getPlayerStageWidth(
                window.innerWidth,
                window.innerHeight,
                customStageSize || {width: 0, height: 0},
                getHeightAbove() + STAGE_CONTROLS_HEIGHT + SPACE_BELOW
            ));
        };
        fitPlayer();
        window.addEventListener('resize', fitPlayer);
        return () => window.removeEventListener('resize', fitPlayer);
    }, [isPlayerOnly, customStageSize]);
    return playerStageWidth;
};

export default usePlayerStageWidth;
