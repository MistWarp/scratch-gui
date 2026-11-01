import {useEffect, useState} from 'react';

import {getPlayerStageWidth} from '../../modules/editor-layout';

const usePlayerStageWidth = (isPlayerOnly, customStageSize) => {
    const [playerStageWidth, setPlayerStageWidth] = useState(null);
    useEffect(() => {
        if (!isPlayerOnly || typeof window === 'undefined') return;
        const fitPlayer = () => {
            setPlayerStageWidth(getPlayerStageWidth(window.innerWidth, customStageSize && customStageSize.width));
        };
        fitPlayer();
        window.addEventListener('resize', fitPlayer);
        return () => window.removeEventListener('resize', fitPlayer);
    }, [isPlayerOnly, customStageSize]);
    return playerStageWidth;
};

export default usePlayerStageWidth;
