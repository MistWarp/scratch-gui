import {useEffect, useRef} from 'react';

// Open layers (modals, menus) in the order they opened; Escape only reaches the newest one.
const layers = [];
const onKeyDown = event => {
    if (event.key !== 'Escape' || !layers.length) return;
    const handler = layers[layers.length - 1].current;
    if (handler) handler();
};

const useEscape = handler => {
    // The layer keeps its place in the stack while the handler identity changes between renders.
    const handlerRef = useRef(handler);
    handlerRef.current = handler;
    const active = Boolean(handler);
    useEffect(() => {
        if (!active) return () => {};
        layers.push(handlerRef);
        if (layers.length === 1) window.addEventListener('keydown', onKeyDown);
        return () => {
            const index = layers.lastIndexOf(handlerRef);
            if (index >= 0) layers.splice(index, 1);
            if (!layers.length) window.removeEventListener('keydown', onKeyDown);
        };
    }, [active]);
};

export default useEscape;
