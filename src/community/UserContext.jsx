import React, {createContext, useContext, useEffect, useState, useCallback, useRef} from 'react';
import api from './api';
import {applyThemeVisuals, detectTheme} from '../lib/themes/themePersistance.js';
import {customThemeManager} from '../lib/themes/custom-themes.js';
import {onRoturLogin} from '../lib/rotur/cloud-sync.js';
import {subscribeNotifications, subscribeNotificationRemovals} from '../lib/rotur/client.js';
import rotur from './rotur.js';
import {track} from './analytics.js';
import {setMinorAccount} from '../lib/minor-account.js';
import {
    subscribe as subscribeIdentity,
    restore as identityRestore,
    login as identityLogin,
    loginStudent as identityLoginStudent,
    logout as identityLogout
} from '../lib/rotur/identity.js';
import {takeRedirectError} from '../lib/rotur/oauth.js';

const UserContext = createContext({user: null, login: () => {}, loginOrThrow: () => {}, logout: () => {}});

const normalizeUser = user => user && {...user, isAdmin: user.isAdmin === true, isStudent: user.isStudent === true};
const signInErrorMessage = error => (
    error && /popup|blocked|window/i.test(String(error.message || '')) ?
        'Sign-in window was blocked. Allow popups for this site and try again.' :
        (error && error.message) || 'Sign-in did not complete. Please try again.'
);
const optionalRequest = request => Promise.resolve().then(request).catch(() => null);

const NEW_ACCOUNT_WINDOW = 30 * 60 * 1000;
const isNewAccount = me => Boolean(me && me.created > 0 && Date.now() - me.created < NEW_ACCOUNT_WINDOW);
const trackSignupOnce = username => {
    try {
        const key = `mw:signup-tracked:${username.toLowerCase()}`;
        if (localStorage.getItem(key)) return;
        localStorage.setItem(key, '1');
    } catch (e) {
        return;
    }
    track('signup_completed');
};

const UserProvider = ({children}) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [banMessage, setBanMessage] = useState(null);
    const [reconnect, setReconnect] = useState(false);
    const [signInError, setSignInError] = useState('');
    const notificationsUnsub = useRef(null);
    const removalsUnsub = useRef(null);
    const identityVersion = useRef(0);
    const signingIn = useRef(false);

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
        const student = Boolean(identityUser && identityUser.isStudent);
        let me = null;
        let roturProfile = null;
        [me, roturProfile] = await Promise.all([
            optionalRequest(() => api.me()),
            identityUser?.username && !student ? optionalRequest(() => rotur.profile(identityUser.username)) : null
        ]);
        if (version !== identityVersion.current) return;
        if (me) setMinorAccount(me.minor === true);
        if (signingIn.current && me) {
            signingIn.current = false;
            track('signin_completed');
        }
        if (student) {
            setUser(normalizeUser({...identityUser, ...(me || {})}));
            return;
        }
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
        const baseUser = me || (identityUser ? {username: identityUser.username} : null);
        if (isNewAccount(me)) trackSignupOnce(me.username);
        setUser(normalizeUser(baseUser ? {
            ...baseUser,
            isNew: isNewAccount(me),
            group_tag: roturProfile?.group_tag || '',
            subscription: roturProfile?.subscription || baseUser.subscription || ''
        } : null));
    }, []);

    const refreshUser = useCallback(async () => {
        if (!user?.username) return null;
        const version = identityVersion.current;
        const username = user.username;
        const [me, roturProfile] = await Promise.all([
            optionalRequest(() => api.me()),
            user.isStudent ? null : optionalRequest(() => rotur.profile(username))
        ]);
        if (version !== identityVersion.current) return null;
        if (me) setMinorAccount(me.minor === true);
        const nextUser = normalizeUser({
            ...user,
            ...(me || {}),
            group_tag: roturProfile?.group_tag || '',
            subscription: roturProfile?.subscription || (me && me.subscription) || user.subscription || ''
        });
        setUser(nextUser);
        return nextUser;
    }, [user]);

    const handleIdentity = useCallback(state => {
        const version = ++identityVersion.current;
        setBanMessage(state.banMessage || null);
        setReconnect(Boolean(state.user && state.reconnect));
        if (state.user) {
            const username = state.user.username;
            const isStudent = Boolean(state.user.isStudent);
            setUser(current => (
                current && current.username === username ? current : normalizeUser({username, isStudent})
            ));
            if (!notificationsUnsub.current && !isStudent) {
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
        Promise.resolve(identityRestore())
            .catch(() => null)
            .then(() => {
                const message = takeRedirectError();
                if (message) setSignInError(signInErrorMessage({message}));
            });
        return unsubscribe;
    }, [handleIdentity]);

    useEffect(() => () => {
        clearNotificationSub();
    }, [clearNotificationSub]);

    const loginOrThrow = useCallback(async () => {
        setSignInError('');
        try {
            signingIn.current = true;
            await identityLogin();
        } catch (error) {
            signingIn.current = false;
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

    const loginStudent = useCallback(session => {
        setSignInError('');
        return identityLoginStudent(session);
    }, []);

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
                loginStudent,
                logout,
                refreshUser,
                setSubscription: subscription => setUser(current => current && {...current, subscription}),
                banMessage,
                dismissBan: () => setBanMessage(null),
                reconnect,
                dismissReconnect: () => setReconnect(false),
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
