import {useCallback, useEffect, useRef} from 'react';
import {useUser} from './UserContext.jsx';

const useAfterLogin = action => {
    const {user, loginOrThrow} = useUser();
    const actionRef = useRef(action);
    actionRef.current = action;
    const pending = useRef(null);
    useEffect(() => {
        if (!user || !pending.current) return;
        const args = pending.current;
        pending.current = null;
        actionRef.current(...args);
    }, [user]);
    return useCallback((...args) => {
        if (user) return actionRef.current(...args);
        pending.current = args;
        Promise.resolve(loginOrThrow()).catch(() => {
            pending.current = null;
        });
        return null;
    }, [user, loginOrThrow]);
};

export default useAfterLogin;
