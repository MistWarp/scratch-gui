import {useCallback, useEffect, useRef} from 'react';
import {track} from './analytics.js';
import {useUser} from './UserContext.jsx';

const useAfterLogin = (action, reason) => {
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
        track('signin_prompt_shown', {reason});
        Promise.resolve(loginOrThrow()).catch(() => {
            pending.current = null;
        });
        return null;
    }, [user, loginOrThrow, reason]);
};

export default useAfterLogin;
