const STATUS_BASE = process.env.MW_STATUS_URL || '';
const ANALYTICS_KEY = 'mw:anonymous-analytics';
const SESSION_KEY = 'mw:analytics-session';

const storage = () => {
    try {
        return localStorage;
    } catch (e) {
        return null;
    }
};

export const analyticsEnabled = () => {
    const saved = storage()?.getItem(ANALYTICS_KEY);
    if (saved === 'off') return false;
    if (typeof navigator !== 'undefined' && navigator.doNotTrack === '1') return false;
    return true;
};

export const setAnalyticsEnabled = enabled => {
    storage()?.setItem(ANALYTICS_KEY, enabled ? 'on' : 'off');
};

const sessionId = () => {
    const target = storage();
    if (!target) return '';
    let value = target.getItem(SESSION_KEY);
    if (!value) {
        value = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() :
            `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;
        target.setItem(SESSION_KEY, value);
    }
    return value;
};

export const track = (name, properties = {}) => {
    if (!STATUS_BASE || !analyticsEnabled()) return;
    const session = sessionId();
    if (!session) return;
    const body = JSON.stringify({name, session, properties});
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
        try {
            if (navigator.sendBeacon(`${STATUS_BASE}/v1/events`, new Blob([body], {type: 'application/json'}))) {
                return;
            }
        } catch (e) {
            // Fall back to fetch if the browser rejects the beacon.
        }
    }
    fetch(`${STATUS_BASE}/v1/events`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body,
        keepalive: true
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

export const trackApiSuccess = (path, method) => {
    if (method !== 'POST') return;
    if (path === '/projects') track('project_created', {source: 'editor'});
    else if (/^\/projects\/[^/]+\/publish$/.test(path)) track('project_published');
    else if (/^\/projects\/[^/]+\/remix$/.test(path)) track('project_remixed');
    else if (/^\/projects\/[^/]+\/contribute$/.test(path)) track('contribution_sent');
};
