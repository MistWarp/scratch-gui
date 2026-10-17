import {loadSession, request} from '../community/api.js';
import {ORDER_KEY as MENU_BAR_ORDER_KEY, HIDDEN_KEY as MENU_BAR_HIDDEN_KEY} from '../mw-menu-bar-layout.js';
import {
    CHANGE_EVENT as MENU_BAR_SETTINGS_CHANGE_EVENT,
    DEFINITIONS as MENU_BAR_SETTINGS,
    STORAGE_PREFIX as MENU_BAR_SETTINGS_PREFIX,
    getSettings as getMenuBarSettings
} from '../menu-bar/settings.js';
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
    getRoturSettingsSnapshot,
    applyRoturSettingsSnapshot,
    subscribeRoturSettings
} from './settings.js';

let suppressPush = false;
let pushTimer = null;
let pushChain = Promise.resolve();

const USERNAME_OVERRIDE_KEY = 'tw:username-override';
const DIRTY_KEY = 'tw:settings-dirty';

const SECTIONS = ['theme', 'customThemes', 'rotur', 'menuBar', 'notificationPreferences', 'username'];
const ALL = 'all';

const readDirty = () => {
    let raw = null;
    try {
        raw = localStorage.getItem(DIRTY_KEY);
    } catch (_) {
        return [];
    }
    if (raw === null) return [];
    if (raw === '1') return ALL;
    try {
        const parsed = JSON.parse(raw);
        if (parsed === ALL) return ALL;
        return Array.isArray(parsed) ? parsed.filter(section => SECTIONS.includes(section)) : ALL;
    } catch (_) {
        return ALL;
    }
};

const writeDirty = dirty => {
    try {
        if (dirty === ALL || dirty.length) localStorage.setItem(DIRTY_KEY, JSON.stringify(dirty));
        else localStorage.removeItem(DIRTY_KEY);
    } catch (_) {
        // ignore
    }
};

const markDirty = section => {
    const current = readDirty();
    if (current === ALL || !SECTIONS.includes(section)) {
        writeDirty(ALL);
        return;
    }
    if (!current.includes(section)) writeDirty(current.concat(section));
};

const isDirty = () => {
    const dirty = readDirty();
    return dirty === ALL || dirty.length > 0;
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
                rotur: getRoturSettingsSnapshot(),
                menuBar: {
                    order: readLocalJson(MENU_BAR_ORDER_KEY, {}),
                    hidden: readLocalJson(MENU_BAR_HIDDEN_KEY, []),
                    accent: getAccentMenuBar(),
                    text: getMenuBarText(),
                    compactSave: getCompactSave(),
                    features: getMenuBarSettings()
                },
                notificationPreferences: readLocalJson('mw:notification-preferences', {}),
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
                applyRoturSettingsSnapshot(snapshot.settings.rotur);
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
                if (snapshot.settings.menuBar.features) {
                    for (const {id} of MENU_BAR_SETTINGS) {
                        if (typeof snapshot.settings.menuBar.features[id] === 'undefined') continue;
                        try {
                            localStorage.setItem(
                                `${MENU_BAR_SETTINGS_PREFIX}${id}`,
                                String(snapshot.settings.menuBar.features[id])
                            );
                        } catch (_) {
                            // ignore
                        }
                    }
                    window.dispatchEvent(new CustomEvent(MENU_BAR_SETTINGS_CHANGE_EVENT, {
                        detail: {id: 'cloud-sync'}
                    }));
                }
            }
            if (snapshot.settings.notificationPreferences) {
                writeLocalJson('mw:notification-preferences', snapshot.settings.notificationPreferences);
                window.dispatchEvent(new Event('mw:notification-preferences'));
            }
        }
    } finally {
        setTimeout(() => {
            suppressPush = false;
        }, 0);
    }
};

const emptySnapshot = snapshot => !snapshot || typeof snapshot !== 'object' || Object.keys(snapshot).length === 0;

const mergeSnapshot = (cloud, local, dirty) => {
    if (dirty === ALL || emptySnapshot(cloud)) return local;
    const cloudSettings = cloud.settings && typeof cloud.settings === 'object' ? cloud.settings : {};
    const merged = {
        theme: typeof cloud.theme === 'undefined' ? null : cloud.theme,
        customThemes: Array.isArray(cloud.customThemes) ? cloud.customThemes : [],
        settings: {...cloudSettings, version: 1, updatedAt: local.settings.updatedAt}
    };
    for (const section of dirty) {
        if (section === 'theme' || section === 'customThemes') {
            merged[section] = local[section];
        } else if (section === 'username') {
            if (local.settings.username) merged.settings.username = local.settings.username;
            else delete merged.settings.username;
        } else {
            merged.settings[section] = local.settings[section];
        }
    }
    return merged;
};

const cloudSnapshot = async () => {
    const response = await request('/me/settings', {cache: false});
    return response && response.settings;
};

const pushToCloud = () => {
    if (suppressPush || !loadSession()) return Promise.resolve(false);
    pushChain = pushChain.catch(() => null).then(async () => {
        if (suppressPush || !loadSession()) return false;
        const dirty = readDirty();
        try {
            const cloud = dirty === ALL ? null : await cloudSnapshot();
            const merged = mergeSnapshot(cloud, collectLocalSnapshot(), dirty);
            await request('/me/settings', {method: 'PUT', body: merged});
            writeDirty([]);
            if (dirty !== ALL && !emptySnapshot(cloud)) applySnapshotLocally(merged);
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

    if (isDirty()) {
        await pushToCloud();
        return {applied: false};
    }

    applySnapshotLocally(snapshot);
    return {applied: true};
};

/**
 * Debounced push after local preference writes.
 * @param {string|number} [sectionOrDelay] the settings section that changed, or the delay
 * @param {number} [delayMs] debounce delay in milliseconds
 */
const notifyLocalChange = (sectionOrDelay, delayMs = 800) => {
    if (suppressPush) return;
    if (!loadSession()) return;
    const section = typeof sectionOrDelay === 'string' ? sectionOrDelay : null;
    const delay = typeof sectionOrDelay === 'number' ? sectionOrDelay : delayMs;
    markDirty(section);
    if (pushTimer) clearTimeout(pushTimer);
    pushTimer = setTimeout(() => {
        pushTimer = null;
        pushToCloud().catch(err => {
            // eslint-disable-next-line no-console
            console.warn('[cloud-sync] push failed', err);
        });
    }, delay);
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
    notifyLocalChange('username');
};

// Keep cloud in sync when Rotur presence settings change (avoids circular require)
subscribeRoturSettings(() => {
    notifyLocalChange('rotur');
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
    writeDirty([]);
    try {
        localStorage.removeItem(USERNAME_OVERRIDE_KEY);
    } catch (_) {
        // ignore
    }
};

export {
    mergeSnapshot,
    notifyLocalChange,
    getUsernameOverride,
    setUsernameOverride,
    onRoturLogin,
    onRoturLogout
};
