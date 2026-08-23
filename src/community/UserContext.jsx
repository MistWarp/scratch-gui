import React, {createContext, useContext, useEffect, useState, useCallback, useRef} from 'react';
import api from './api';
import {applyThemeVisuals, detectTheme} from '../lib/themes/themePersistance.js';
import {customThemeManager} from '../lib/themes/custom-themes.js';
import {onRoturLogin} from '../lib/rotur/cloud-sync.js';
import {subscribeNotifications, subscribeNotificationRemovals} from '../lib/rotur/client.js';
import {
    subscribe as subscribeIdentity,
    restore as identityRestore,
    login as identityLogin,
    logout as identityLogout
} from '../lib/rotur/identity.js';

const UserContext = createContext({user: null, login: () => {}, loginOrThrow: () => {}, logout: () => {}});

const normalizeUser = user => user && {...user, isAdmin: user.isAdmin === true};
const signInErrorMessage = error => (
    error && /popup|blocked|window/i.test(String(error.message || '')) ?
        'Sign-in window was blocked. Allow popups for this site and try again.' :
        (error && error.message) || 'Sign-in did not complete. Please try again.'
);

const UserProvider = ({children}) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [banMessage, setBanMessage] = useState(null);
    const [signInError, setSignInError] = useState('');
    const notificationsUnsub = useRef(null);
    const removalsUnsub = useRef(null);
    const identityVersion = useRef(0);

    const handleNotificationPush = useCallback(notification => {
        if (!notification || notification.read) return;
        window.dispatchEvent(new CustomEvent('mw:notifications-push', {detail: notification}));
    }, []);

    const handleNotificationRemoved = useCallback(payload => {
        if (!payload || typeof payload.id !== 'string') return;
        window.dispatchEvent(new CustomEvent('mw:notifications-removed', {detail: payload}));
    }, []);

    const clearNotificationSub = useCallback(() => {
        if (notificationsUnsub.current) {
            notificationsUnsub.current();
            notificationsUnsub.current = null;
        }
        if (removalsUnsub.current) {
            removalsUnsub.current();
            removalsUnsub.current = null;
        }
    }, []);

    const applyLoggedIn = useCallback(async (identityUser, version) => {
        let me = null;
        try {
            me = await api.me();
        } catch (e) {
            me = null;
        }
        if (version !== identityVersion.current) return;
        let applied = false;
        try {
            applied = (await onRoturLogin()).applied;
        } catch (e) {
            applied = false;
        }
        if (version !== identityVersion.current) return;
        if (applied) {
            try {
                customThemeManager.themes.clear();
                customThemeManager.loadCustomThemes();
            } catch (e) {
                // ignore
            }
        }
        applyThemeVisuals(detectTheme());
        // A transient /me failure while Rotur is logged in should not flip the
        // UI to signed-out; fall back to a minimal user so it stays logged in.
        setUser(normalizeUser(me || (identityUser ? {username: identityUser.username} : null)));
    }, []);

    const handleIdentity = useCallback(state => {
        const version = ++identityVersion.current;
        setBanMessage(state.banMessage || null);
        if (state.user) {
            if (!notificationsUnsub.current) {
                notificationsUnsub.current = subscribeNotifications(handleNotificationPush);
                removalsUnsub.current = subscribeNotificationRemovals(handleNotificationRemoved);
            }
            applyLoggedIn(state.user, version).finally(() => {
                if (version === identityVersion.current) setLoading(false);
            });
        } else {
            clearNotificationSub();
            setUser(null);
            applyThemeVisuals(detectTheme());
            if (state.status !== 'restoring') {
                setLoading(false);
            }
        }
    }, [applyLoggedIn, clearNotificationSub, handleNotificationPush, handleNotificationRemoved]);

    useEffect(() => {
        const unsubscribe = subscribeIdentity(handleIdentity);
        identityRestore();
        return unsubscribe;
    }, [handleIdentity]);

    useEffect(() => () => {
        clearNotificationSub();
    }, [clearNotificationSub]);

    const loginOrThrow = useCallback(async () => {
        setSignInError('');
        try {
            await identityLogin();
        } catch (error) {
            if (!error || error.code !== 'banned') setSignInError(signInErrorMessage(error));
            throw error;
        }
    }, []);

    const login = useCallback(async () => {
        try {
            await loginOrThrow();
        } catch (error) {
            // The global banner reports the failure for page-level sign-in buttons.
        }
    }, [loginOrThrow]);

    const logout = useCallback(async () => {
        await identityLogout();
    }, []);

    return (
        <UserContext.Provider
            value={{
                user,
                loading,
                login,
                loginOrThrow,
                logout,
                banMessage,
                dismissBan: () => setBanMessage(null),
                signInError,
                dismissSignInError: () => setSignInError('')
            }}
        >
            {children}
        </UserContext.Provider>
    );
};

const useUser = () => useContext(UserContext);

export {UserProvider, useUser, normalizeUser, signInErrorMessage};
