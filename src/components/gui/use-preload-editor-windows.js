import {useEffect} from 'react';

import {preloadLazyGuiComponents} from './gui-components';

const IDLE_PRELOAD_TIMEOUT = 10000;
const FALLBACK_PRELOAD_DELAY = 5000;

const usePreloadEditorWindowsWhenIdle = isPlayerOnly => {
    useEffect(() => {
        if (isPlayerOnly || typeof window === 'undefined') return;
        const preload = () => preloadLazyGuiComponents();
        if (typeof window.requestIdleCallback === 'function') {
            const handle = window.requestIdleCallback(preload, {timeout: IDLE_PRELOAD_TIMEOUT});
            return () => window.cancelIdleCallback(handle);
        }
        const timeout = setTimeout(preload, FALLBACK_PRELOAD_DELAY);
        return () => clearTimeout(timeout);
    }, [isPlayerOnly]);
};

export default usePreloadEditorWindowsWhenIdle;
