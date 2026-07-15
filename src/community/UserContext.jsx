import React, {createContext, useContext, useEffect, useState, useCallback} from 'react';
import api from './api';
import {applyThemeVisuals, detectTheme} from '../lib/themes/themePersistance.js';
import {onRoturLogin} from '../lib/rotur/cloud-sync.js';
import {
    subscribe as subscribeIdentity,
    restore as identityRestore,
    login as identityLogin,
    logout as identityLogout
} from '../lib/rotur/identity.js';

const UserContext = createContext({user: null, login: () => {}, logout: () => {}});

const UserProvider = ({children}) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const applyLoggedIn = useCallback(async () => {
        let me = null;
        try {
            me = await api.me();
        } catch (e) {
            me = null;
        }
        setUser(me);
        try {
            await onRoturLogin();
        } catch (e) {
            // ignore
        }
        applyThemeVisuals(detectTheme());
    }, []);

    const handleIdentity = useCallback(state => {
        if (state.user) {
            applyLoggedIn();
        } else {
            setUser(null);
            applyThemeVisuals(detectTheme());
        }
    }, [applyLoggedIn]);

    useEffect(() => {
        const unsubscribe = subscribeIdentity(handleIdentity);
        identityRestore().finally(() => setLoading(false));
        return unsubscribe;
    }, [handleIdentity]);

    const login = useCallback(async () => {
        await identityLogin();
    }, []);

    const logout = useCallback(async () => {
        await identityLogout();
    }, []);

    return (
        <UserContext.Provider value={{user, loading, login, logout}}>
            {children}
        </UserContext.Provider>
    );
};

const useUser = () => useContext(UserContext);

export {UserProvider, useUser};
