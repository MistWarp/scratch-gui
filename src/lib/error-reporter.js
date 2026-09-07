/* eslint-disable max-len */
import {request} from './community/api.js';

let installed = false;
let sending = false;
const seen = new Set();
let sentTimes = [];

const viewport = () => {
    try {
        return `${window.innerWidth}x${window.innerHeight}`;
    } catch (e) {
        return '';
    }
};

const shouldSend = signature => {
    const now = Date.now();
    sentTimes = sentTimes.filter(at => now - at < 60000);
    if (sentTimes.length >= 5) return false;
    if (seen.has(signature)) return false;
    seen.add(signature);
    if (seen.size > 50) {
        const first = seen.values().next().value;
        seen.delete(first);
    }
    sentTimes.push(now);
    return true;
};

const projectIdFromUrl = href => {
    try {
        const match = String(href || '').match(/\/project\/([A-Za-z0-9_-]{1,80})/);
        return match ? match[1] : '';
    } catch (e) {
        return '';
    }
};

export const reportSiteError = ({message, stack = '', kind = 'uncaught', url = '', projectId = '', componentStack = ''}) => {
    try {
        const text = String(message || '').trim();
        if (!text || sending) return;
        const href = String(url || window.location.href || '').slice(0, 2000);
        if (href.includes('/errors')) return;
        const signature = `${text.slice(0, 200)}|${href.slice(0, 200)}|${String(stack).slice(0, 200)}`;
        if (!shouldSend(signature)) return;
        sending = true;
        const payload = {
            message: text.slice(0, 2000),
            stack: String(stack || '').slice(0, 20000),
            kind,
            url: href,
            projectId: String(projectId || projectIdFromUrl(href) || '').slice(0, 120),
            viewport: viewport(),
            componentStack: String(componentStack || '').slice(0, 10000)
        };
        request('/errors', {method: 'POST', body: payload, timeoutMs: 8000, cache: false})
            .catch(() => {})
            .finally(() => {
                sending = false;
            });
    } catch (e) {
        sending = false;
    }
};

const toStack = error => {
    if (!error) return '';
    if (typeof error.stack === 'string' && error.stack) return error.stack;
    return String(error);
};

export const initSiteErrorReporting = () => {
    if (installed || typeof window === 'undefined') return;
    installed = true;
    window.__mwErrorReporting = true;
    window.addEventListener('error', event => {
        if (!event) return;
        if (event.filename && event.filename.includes('errors')) return;
        const error = event.error;
        reportSiteError({
            message: (error && error.message) || event.message || 'Uncaught error',
            stack: toStack(error || event.error) || `${event.filename || ''}:${event.lineno || 0}:${event.colno || 0}`,
            kind: 'uncaught',
            url: event.filename && event.filename !== window.location.href ? window.location.href : window.location.href
        });
    });
    window.addEventListener('unhandledrejection', event => {
        const reason = event && event.reason;
        const message = (reason && reason.message) || String(reason || 'Unhandled promise rejection');
        if (String(message).includes('/errors')) return;
        reportSiteError({
            message,
            stack: toStack(reason),
            kind: 'rejection'
        });
    });
};
