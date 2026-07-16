import {useRef, useCallback} from 'react';

const useLatest = () => {
    const seqRef = useRef(0);
    return useCallback(() => {
        const seq = ++seqRef.current;
        return fn => (...args) => {
            if (seq === seqRef.current) fn(...args);
        };
    }, []);
};

export default useLatest;
