import {useEffect, useState} from 'react';

import {PREFERRED_MIN_EDITOR_HEIGHT} from '../../modules/editor-layout';

const useEditorViewportHeight = isPlayerOnly => {
    const [viewportHeight, setViewportHeight] = useState(
        typeof window === 'undefined' ? PREFERRED_MIN_EDITOR_HEIGHT : window.innerHeight
    );
    useEffect(() => {
        if (isPlayerOnly || typeof window === 'undefined') return;
        const handleResize = () => setViewportHeight(window.innerHeight);
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isPlayerOnly]);
    return viewportHeight;
};

export default useEditorViewportHeight;
