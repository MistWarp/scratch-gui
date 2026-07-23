import {useEffect} from 'react';

const useEscape = handler => {
    useEffect(() => {
        if (!handler) return () => {};
        const onKeyDown = event => {
            if (event.key === 'Escape') handler();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [handler]);
};

export default useEscape;
