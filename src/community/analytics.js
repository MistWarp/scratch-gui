import {isMinorAccount} from '../lib/minor-account.js';
import {isStudentSession} from '../lib/rotur/student-flag.js';
import {isSplitEditor} from '../lib/account/origins.js';
import {local, session} from '../modules/storage';

const EVENTS_URL = `${process.env.MW_API_BASE || 'https://api.mistwarp.org/v1'}/events`;
const ANALYTICS_KEY = 'mw:anonymous-analytics';

let editorChoiceSynced = false;

const writeChoice = enabled => {
    local.writeString(ANALYTICS_KEY, enabled ? 'on' : 'off');
};

const callAccount = args => import('../lib/account/bridge.js').then(({call}) => call('analytics', args));

export const analyticsChoice = () => local.readString(ANALYTICS_KEY) !== 'off';

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
    const key = `mw:analytics-once:${name}`;
    if (session.readString(key)) return;
    session.writeString(key, '1');
    track(name, properties);
};

export const trackDaily = (name, properties = {}) => {
    if (!analyticsEnabled()) return;
    const day = new Date().toISOString().slice(0, 10);
    const key = `mw:analytics-day:${name}`;
    if (session.readString(key) === day) return;
    session.writeString(key, day);
    track(name, properties);
};

export const trackApiSuccess = (path, method) => {
    if (method !== 'POST') return;
    if (path === '/projects') track('project_created');
    else if (/^\/projects\/[^/]+\/publish$/.test(path)) track('project_published');
    else if (/^\/projects\/[^/]+\/remix$/.test(path)) track('project_remixed');
    else if (/^\/projects\/[^/]+\/contribute$/.test(path)) track('contribution_sent');
};
