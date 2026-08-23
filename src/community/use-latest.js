import {useCallback, useEffect, useRef} from 'react';

const useLatest = () => {
    const seqRef = useRef(0);
    useEffect(() => () => {
        seqRef.current += 1;
    }, []);
    return useCallback(() => {
        const seq = ++seqRef.current;
        return fn => (...args) => {
            if (seq === seqRef.current) return fn(...args);
        };
    }, []);
};

export default useLatest;
