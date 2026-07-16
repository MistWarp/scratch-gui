import React, {createContext, useContext, useEffect, useState, useCallback} from 'react';
import api from './api';
import {applyThemeVisuals, detectTheme} from '../lib/themes/themePersistance.js';
import {customThemeManager} from '../lib/themes/custom-themes.js';
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
        let applied = false;
        try {
            applied = (await onRoturLogin()).applied;
        } catch (e) {
            applied = false;
        }
        if (applied) {
            try {
                customThemeManager.themes.clear();
                customThemeManager.loadCustomThemes();
            } catch (e) {
                // ignore
            }
        }
        applyThemeVisuals(detectTheme());
        setUser(me);
    }, []);

    const handleIdentity = useCallback(state => {
        if (state.user) {
            applyLoggedIn().finally(() => setLoading(false));
        } else {
            setUser(null);
            applyThemeVisuals(detectTheme());
            if (state.status !== 'restoring') {
                setLoading(false);
            }
        }
    }, [applyLoggedIn]);

    useEffect(() => {
        const unsubscribe = subscribeIdentity(handleIdentity);
        identityRestore();
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
