import {isMinorAccount} from '../lib/minor-account.js';
import {isStudentSession} from '../lib/rotur/student-flag.js';
import {isSplitEditor} from '../lib/account/origins.js';

const EVENTS_URL = `${process.env.MW_API_BASE || 'https://api.mistwarp.org/v1'}/events`;
const ANALYTICS_KEY = 'mw:anonymous-analytics';

let editorChoiceSynced = false;

const storage = () => {
    try {
        return localStorage;
    } catch (e) {
        return null;
    }
};

const writeChoice = enabled => {
    try {
        storage()?.setItem(ANALYTICS_KEY, enabled ? 'on' : 'off');
    } catch (e) {
        return;
    }
};

const callAccount = args => import('../lib/account/bridge.js').then(({call}) => call('analytics', args));

export const analyticsChoice = () => {
    try {
        return storage()?.getItem(ANALYTICS_KEY) !== 'off';
    } catch (e) {
        return true;
    }
};

export const analyticsEnabled = () => {
    if (isMinorAccount() || isStudentSession()) return false;
    if (!analyticsChoice()) return false;
    if (typeof navigator !== 'undefined' && navigator.doNotTrack === '1') return false;
    return true;
};

export const setAnalyticsEnabled = enabled => {
    writeChoice(enabled);
    if (isSplitEditor()) callAccount({enabled: enabled === true}).catch(() => {});
};

export const syncAnalyticsChoice = () => {
    if (!isSplitEditor()) return Promise.resolve();
    return callAccount({})
        .then(result => {
            if (result && typeof result.enabled === 'boolean') {
                writeChoice(result.enabled);
                editorChoiceSynced = true;
            }
        })
        .catch(() => {});
};

const countedHost = () => typeof location !== 'undefined' && /(^|\.)mistwarp\.org$/.test(location.hostname);

export const track = (name, {variant} = {}) => {
    if (!countedHost() || !analyticsEnabled() || typeof fetch !== 'function') return;
    if (isSplitEditor() && !editorChoiceSynced) return;
    fetch(EVENTS_URL, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(variant ? {name, variant} : {name}),
        keepalive: true,
        credentials: 'omit'
    }).catch(() => {});
};

export const trackOnce = (name, properties = {}) => {
    try {
        const key = `mw:analytics-once:${name}`;
        if (sessionStorage.getItem(key)) return;
        sessionStorage.setItem(key, '1');
    } catch (e) {
        // send the event when session storage is unavailable
    }
    track(name, properties);
};

export const trackDaily = (name, properties = {}) => {
    if (!analyticsEnabled()) return;
    try {
        const day = new Date().toISOString().slice(0, 10);
        const key = `mw:analytics-day:${name}`;
        if (sessionStorage.getItem(key) === day) return;
        sessionStorage.setItem(key, day);
    } catch (e) {
        // Storage restrictions must not break editing.
    }
    track(name, properties);
};

export const trackApiSuccess = (path, method) => {
    if (method !== 'POST') return;
    if (path === '/projects') track('project_created');
    else if (/^\/projects\/[^/]+\/publish$/.test(path)) track('project_published');
    else if (/^\/projects\/[^/]+\/remix$/.test(path)) track('project_remixed');
    else if (/^\/projects\/[^/]+\/contribute$/.test(path)) track('contribution_sent');
};
