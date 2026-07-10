/**
 * Cloud sync for MistWarp themes + settings via Rotur OriginFS.
 * Root: /application data/mistwarp@mistium/
 *
 * localStorage is the offline cache; when signed into Rotur we also
 * read/write cloud copies so data follows the account.
 */

import {getRotur} from './client.js';
import {OriginFS} from './origin-fs.js';
import {
    getRoturSettings,
    updateRoturSettings,
    subscribeRoturSettings
} from './settings.js';

const APP_DATA = '/application data/mistwarp@mistium';
const PATHS = {
    theme: `${APP_DATA}/theme.json`,
    customThemes: `${APP_DATA}/custom-themes.json`,
    settings: `${APP_DATA}/settings.json`
};

/** @type {OriginFS|null} */
let fs = null;
let suppressPush = false;
let pushTimer = null;
let pushChain = Promise.resolve();

const isLoggedIn = () => {
    try {
        return getRotur().loggedIn;
    } catch (_) {
        return false;
    }
};

const getFS = () => {
    if (!isLoggedIn()) {
        fs = null;
        return null;
    }
    if (!fs) {
        const rotur = getRotur();
        if (!rotur || !rotur._http) return null;
        fs = new OriginFS(rotur._http);
    }
    return fs;
};

const resetFS = () => {
    fs = null;
};

const readLocalJson = (key, fallback) => {
    try {
        const raw = localStorage.getItem(key);
        if (raw === null || raw === undefined) return fallback;
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

async function loadJson (path, defaultValue) {
    const originFS = getFS();
    if (!originFS) return defaultValue;
    try {
        return JSON.parse(await originFS.readFileContent(path));
    } catch (_) {
        return defaultValue;
    }
}

async function saveJson (path, data) {
    const originFS = getFS();
    if (!originFS) return false;
    try {
        await originFS.writeFile(path, JSON.stringify(data));
        await originFS.commit();
        return true;
    } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('[cloud-sync] Failed to save', path, e);
        return false;
    }
}

const collectLocalSnapshot = () => ({
    theme: readLocalJson('tw:theme', null),
    customThemes: (() => {
        const raw = readLocalJson('tw:custom-themes', []);
        return Array.isArray(raw) ? raw : [];
    })(),
    settings: {
        rotur: getRoturSettings(),
        menuBar: {
            order: readLocalJson('mw:menu-bar-order-v3', {}),
            hidden: readLocalJson('mw:menu-bar-hidden', [])
        },
        version: 1,
        updatedAt: Date.now()
    }
});

const applySnapshotLocally = snapshot => {
    if (!snapshot || typeof snapshot !== 'object') return;
    suppressPush = true;
    try {
        if (snapshot.theme && typeof snapshot.theme === 'object') {
            writeLocalJson('tw:theme', snapshot.theme);
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
            if (snapshot.settings.menuBar) {
                if (snapshot.settings.menuBar.order) {
                    writeLocalJson('mw:menu-bar-order-v3', snapshot.settings.menuBar.order);
                }
                if (Array.isArray(snapshot.settings.menuBar.hidden)) {
                    writeLocalJson('mw:menu-bar-hidden', snapshot.settings.menuBar.hidden);
                }
            }
        }
    } finally {
        setTimeout(() => {
            suppressPush = false;
        }, 0);
    }
};

const pushToCloud = async () => {
    if (suppressPush || !isLoggedIn()) return false;
    pushChain = pushChain.catch(() => undefined).then(async () => {
        if (suppressPush || !isLoggedIn()) return false;
        const {theme, customThemes, settings} = collectLocalSnapshot();
        const results = await Promise.all([
            theme ? saveJson(PATHS.theme, theme) : Promise.resolve(true),
            saveJson(PATHS.customThemes, customThemes || []),
            saveJson(PATHS.settings, settings)
        ]);
        return results.every(Boolean);
    });
    return pushChain;
};

const pullFromCloud = async () => {
    if (!isLoggedIn()) {
        return {applied: false};
    }
    const originFS = getFS();
    if (!originFS) {
        return {applied: false};
    }

    try {
        await originFS.loadIndex();
    } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('[cloud-sync] Failed to load file index', e);
        return {applied: false};
    }

    const [theme, customThemes, settings] = await Promise.all([
        loadJson(PATHS.theme, null),
        loadJson(PATHS.customThemes, null),
        loadJson(PATHS.settings, null)
    ]);

    const hasCloud =
        (theme && typeof theme === 'object') ||
        (Array.isArray(customThemes) && customThemes.length > 0) ||
        (settings && typeof settings === 'object');

    if (!hasCloud) {
        // First login with empty cloud: seed from local
        await pushToCloud();
        return {applied: false};
    }

    applySnapshotLocally({theme, customThemes, settings});
    return {applied: true};
};

/** Debounced push after local preference writes. */
const notifyLocalChange = (delayMs = 800) => {
    if (suppressPush || !isLoggedIn()) return;
    if (pushTimer) clearTimeout(pushTimer);
    pushTimer = setTimeout(() => {
        pushTimer = null;
        pushToCloud().catch(err => {
            // eslint-disable-next-line no-console
            console.warn('[cloud-sync] push failed', err);
        });
    }, delayMs);
};

// Keep cloud in sync when Rotur presence settings change (avoids circular require)
subscribeRoturSettings(() => {
    notifyLocalChange();
});

const onRoturLogin = async () => {
    resetFS();
    const result = await pullFromCloud();
    return {applied: result.applied};
};

const onRoturLogout = () => {
    resetFS();
    if (pushTimer) {
        clearTimeout(pushTimer);
        pushTimer = null;
    }
};

export {
    notifyLocalChange,
    onRoturLogin,
    onRoturLogout
};
