import {loadSession, request} from '../community/api.js';
import {ORDER_KEY as MENU_BAR_ORDER_KEY, HIDDEN_KEY as MENU_BAR_HIDDEN_KEY} from '../mw-menu-bar-layout.js';
import {
    getAccentMenuBar,
    getMenuBarText,
    getCompactSave,
    setCompactSave,
    ACCENT_MENU_BAR_KEY,
    MENU_BAR_TEXT_KEY,
    MENU_BAR_TEXT_OPTIONS
} from '../themes/menu-bar-accent.js';
import {
    getRoturSettings,
    updateRoturSettings,
    subscribeRoturSettings
} from './settings.js';

let suppressPush = false;
let pushTimer = null;
let pushChain = Promise.resolve();

const USERNAME_OVERRIDE_KEY = 'tw:username-override';
const LOCAL_UPDATED_KEY = 'tw:settings-updated';

const stampLocalChange = () => {
    try {
        localStorage.setItem(LOCAL_UPDATED_KEY, String(Date.now()));
    } catch (_) {
        // ignore
    }
};

const readLocalUpdated = () => {
    try {
        return Number(localStorage.getItem(LOCAL_UPDATED_KEY)) || 0;
    } catch (_) {
        return 0;
    }
};

const setLocalUpdated = value => {
    try {
        localStorage.setItem(LOCAL_UPDATED_KEY, String(value || 0));
    } catch (_) {
        // ignore
    }
};

const getUsernameOverride = () => {
    try {
        return localStorage.getItem(USERNAME_OVERRIDE_KEY) || null;
    } catch (_) {
        return null;
    }
};

const readLocalJson = (key, fallback) => {
    try {
        const raw = localStorage.getItem(key);
        if (raw === null || typeof raw === 'undefined') return fallback;
        return JSON.parse(raw);
    } catch (_) {
        return fallback;
    }
};

const writeLocalJson = (key, value) => {
    try {
        if (value === null || typeof value === 'undefined') {
            localStorage.removeItem(key);
        } else {
            localStorage.setItem(key, JSON.stringify(value));
        }
    } catch (_) {
        // ignore
    }
};

const collectLocalSnapshot = () => {
    const username = getUsernameOverride();
    return {
        theme: readLocalJson('tw:theme', null),
        customThemes: (() => {
            const raw = readLocalJson('tw:custom-themes', []);
            return Array.isArray(raw) ? raw : [];
        })(),
        settings: Object.assign(
            {
                rotur: getRoturSettings(),
                menuBar: {
                    order: readLocalJson(MENU_BAR_ORDER_KEY, {}),
                    hidden: readLocalJson(MENU_BAR_HIDDEN_KEY, []),
                    accent: getAccentMenuBar(),
                    text: getMenuBarText(),
                    compactSave: getCompactSave()
                },
                version: 1,
                updatedAt: Date.now()
            },
            username ? {username} : {}
        )
    };
};

const applySnapshotLocally = snapshot => {
    if (!snapshot || typeof snapshot !== 'object') return;
    suppressPush = true;
    try {
        if (snapshot.theme && typeof snapshot.theme === 'object') {
            writeLocalJson('tw:theme', snapshot.theme);
        } else if (snapshot.theme === null) {
            writeLocalJson('tw:theme', null);
        }
        if (Array.isArray(snapshot.customThemes)) {
            writeLocalJson(
                'tw:custom-themes',
                snapshot.customThemes.length === 0 ? null : snapshot.customThemes
            );
        }
        if (snapshot.settings && typeof snapshot.settings === 'object') {
            if (snapshot.settings.rotur) {
                updateRoturSettings(snapshot.settings.rotur);
            }
            try {
                if (typeof snapshot.settings.username === 'string' && snapshot.settings.username) {
                    localStorage.setItem(USERNAME_OVERRIDE_KEY, snapshot.settings.username);
                } else {
                    localStorage.removeItem(USERNAME_OVERRIDE_KEY);
                }
            } catch (_) {
                // ignore
            }
            if (snapshot.settings.menuBar) {
                if (snapshot.settings.menuBar.order) {
                    writeLocalJson(MENU_BAR_ORDER_KEY, snapshot.settings.menuBar.order);
                }
                if (Array.isArray(snapshot.settings.menuBar.hidden)) {
                    writeLocalJson(MENU_BAR_HIDDEN_KEY, snapshot.settings.menuBar.hidden);
                }
                if (typeof snapshot.settings.menuBar.accent === 'boolean') {
                    try {
                        localStorage.setItem(
                            ACCENT_MENU_BAR_KEY,
                            snapshot.settings.menuBar.accent ? 'true' : 'false'
                        );
                    } catch (_) {
                        // ignore
                    }
                }
                if (typeof snapshot.settings.menuBar.compactSave === 'boolean') {
                    setCompactSave(snapshot.settings.menuBar.compactSave);
                }
                if (MENU_BAR_TEXT_OPTIONS.includes(snapshot.settings.menuBar.text)) {
                    try {
                        localStorage.setItem(MENU_BAR_TEXT_KEY, snapshot.settings.menuBar.text);
                    } catch (_) {
                        // ignore
                    }
                }
            }
        }
    } finally {
        setTimeout(() => {
            suppressPush = false;
        }, 0);
    }
};

const pushToCloud = () => {
    if (suppressPush || !loadSession()) return Promise.resolve(false);
    pushChain = pushChain.catch(() => null).then(async () => {
        if (suppressPush || !loadSession()) return false;
        try {
            await request('/me/settings', {method: 'PUT', body: collectLocalSnapshot()});
            return true;
        } catch (e) {
            // eslint-disable-next-line no-console
            console.warn('[cloud-sync] Failed to save settings', e);
            return false;
        }
    });
    return pushChain;
};

const pullFromCloud = async () => {
    if (!loadSession()) {
        return {applied: false};
    }

    let snapshot;
    try {
        const response = await request('/me/settings');
        snapshot = response.settings;
    } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('[cloud-sync] Failed to load settings', e);
        return {applied: false};
    }

    if (!snapshot || typeof snapshot !== 'object' || Object.keys(snapshot).length === 0) {
        // First login with empty cloud: seed from local
        await pushToCloud();
        return {applied: false};
    }

    const cloudUpdated = (snapshot.settings && Number(snapshot.settings.updatedAt)) || 0;
    if (readLocalUpdated() > cloudUpdated) {
        await pushToCloud();
        return {applied: false};
    }

    applySnapshotLocally(snapshot);
    setLocalUpdated(cloudUpdated);
    return {applied: true};
};

/**
 * Debounced push after local preference writes.
 * @param {number} delayMs debounce delay in milliseconds
 */
const notifyLocalChange = (delayMs = 800) => {
    if (suppressPush || !loadSession()) return;
    stampLocalChange();
    if (pushTimer) clearTimeout(pushTimer);
    pushTimer = setTimeout(() => {
        pushTimer = null;
        pushToCloud().catch(err => {
            // eslint-disable-next-line no-console
            console.warn('[cloud-sync] push failed', err);
        });
    }, delayMs);
};

const setUsernameOverride = value => {
    try {
        if (value) {
            localStorage.setItem(USERNAME_OVERRIDE_KEY, value);
        } else {
            localStorage.removeItem(USERNAME_OVERRIDE_KEY);
        }
    } catch (_) {
        // ignore
    }
    notifyLocalChange();
};

// Keep cloud in sync when Rotur presence settings change (avoids circular require)
subscribeRoturSettings(() => {
    notifyLocalChange();
});

const onRoturLogin = async () => {
    const result = await pullFromCloud();
    return {applied: result.applied};
};

const onRoturLogout = () => {
    if (pushTimer) {
        clearTimeout(pushTimer);
        pushTimer = null;
    }
    try {
        localStorage.removeItem(USERNAME_OVERRIDE_KEY);
    } catch (_) {
        // ignore
    }
};

export {
    notifyLocalChange,
    getUsernameOverride,
    setUsernameOverride,
    onRoturLogin,
    onRoturLogout
};
