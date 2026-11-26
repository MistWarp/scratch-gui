/* eslint-disable max-len */
import {BUILD_ID} from './build-version.js';

const ERRORS_URL = `${process.env.MW_API_BASE || 'https://api.mistwarp.org/v1'}/errors`;

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

const SITE_ERROR_PATH_WORDS = new Set([
    'about', 'admin', 'assignments', 'bounties', 'changes', 'claim', 'classroom', 'code', 'commits', 'compare', 'dpa',
    'editor', 'editor.html', 'embed', 'embed.html', 'entry', 'explore', 'followers', 'following', 'fullscreen',
    'fullscreen.html', 'groups', 'index.html', 'join', 'leaderboard', 'library', 'manage', 'mystuff', 'news',
    'notifications', 'p', 'perks', 'player', 'player.html', 'posts', 'privacy', 'project', 'pulls', 'purchases',
    'random', 'remixes', 'roadmap', 'school', 'search', 'settings', 'simple.html', 'spaces', 'stats', 'status',
    'students', 'subprocessors', 'support', 'terms', 'themes', 'trust', 'users', 'wallet'
]);

const SITE_ERROR_ID_PARENTS = new Set([
    'assignments', 'bounties', 'claim', 'commits', 'entry', 'groups', 'join', 'news', 'p', 'posts', 'project',
    'pulls', 'spaces', 'students', 'themes', 'users'
]);

const API_ID_PARENTS = new Set([
    'assignments', 'blocks', 'bounties', 'claim', 'classes', 'commits', 'curators', 'extensions', 'followers',
    'following', 'game-saves', 'groups', 'invitations', 'join', 'judges', 'library', 'mutes', 'news', 'posts',
    'profile', 'profiles', 'project', 'projects', 'pulls', 'spaces', 'students', 'teachers', 'themes', 'users',
    'vanity'
]);

const stripQueryAndHash = value => {
    const withoutHash = String(value || '').trim()
        .split('#')[0];
    return withoutHash.split('?')[0];
};

const scrubPageUrl = href => {
    const raw = stripQueryAndHash(href);
    if (!raw) return '';
    try {
        const parsed = new URL(raw);
        if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return '';
        const segments = parsed.pathname.split('/').filter(Boolean);
        let idNext = false;
        const cleanSegments = segments.map(segment => {
            const lower = segment.toLowerCase();
            if (!idNext && SITE_ERROR_PATH_WORDS.has(lower)) {
                idNext = SITE_ERROR_ID_PARENTS.has(lower);
                return lower;
            }
            idNext = false;
            return ':id';
        });
        const path = cleanSegments.length ? `/${cleanSegments.join('/')}` : '/';
        return `${parsed.protocol}//${parsed.host.toLowerCase()}${path}`;
    } catch (e) {
        return raw;
    }
};

const scrubApiPath = path => {
    const raw = stripQueryAndHash(path);
    if (!raw) return '/';
    const segments = raw.split('/').filter(Boolean);
    let idNext = false;
    const cleanSegments = segments.map(segment => {
        const lower = segment.toLowerCase();
        if (idNext) {
            idNext = false;
            return ':id';
        }
        if (API_ID_PARENTS.has(lower)) {
            idNext = true;
            return lower;
        }
        return segment;
    });
    return `/${cleanSegments.join('/')}`;
};

const scrubSensitiveText = text => {
    let value = String(text || '');
    if (!value) return '';
    value = value.replace(/\bdata:[^\s)'"`<>]+/gi, 'data:[redacted]');
    value = value.replace(/\bBearer\s+[A-Za-z0-9._~+/-]+=*/gi, 'Bearer [redacted]');
    value = value.replace(/(https?:\/\/)[^/\s@]+@/gi, '$1');
    value = value.replace(
        /(https?:\/\/[^\s?#()<>"']+)[?#][^\s()<>"']*?((?::\d+){1,2})?(?=[\s)<>"']|$)/g,
        (_, base, lineCol) => `${base}${lineCol || ''}`
    );
    value = value.replace(
        /(https?:\/\/(?:[a-z0-9-]+\.)*mistwarp\.org)\/(p|project|users|spaces|groups|bounties|news|posts|themes|claim|join)\/[^/?#\s:()<>"']+/gi,
        '$1/$2/:id'
    );
    value = value.replace(/(https?:\/\/editor\.mistwarp\.org)\/\d+/gi, '$1/:id');
    value = value.replace(/(https?:\/\/avatars\.rotur\.dev)\/[^/?#\s:()<>"']+/gi, '$1/:id');
    value = value.replace(
        /\/(users|blocks|mutes|followers|following|curators|invitations|judges|profiles?|projects|classes|students|teachers|claim|join|vanity|game-saves|library)\/[^/?#\s:()<>"']+/gi,
        '/$1/:id'
    );
    value = value.replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/g, '[email]');
    return value;
};

const isBenignResizeObserverLoop = (message, stack) => {
    // Chrome fires "ResizeObserver loop completed with undelivered notifications"
    // as a window error when an observer callback affects layout in the same frame.
    // It is benign and has no file/line (reported as editor:0:0). Never report it.
    const text = `${String(message || '')}\n${String(stack || '')}`;
    return text.includes('ResizeObserver loop') || text.includes('undelivered notifications');
};

const CRAWLER_AGENT = /googlebot|bingbot|yandexbot|duckduckbot|baiduspider|applebot|petalbot|ahrefsbot|semrushbot|facebookexternalhit|slurp|crawler|spider/i;

const isCrawler = () => {
    try {
        return CRAWLER_AGENT.test(String(window.navigator.userAgent || ''));
    } catch (e) {
        return false;
    }
};

const BROWSER_EXTENSION_FRAME = /(?:chrome|moz|safari|safari-web)-extension:\/\//;

const ERROR_PREFIX = /^(?:Uncaught\s+)?(?:[A-Za-z]*Error:\s*)?/;

const withoutErrorPrefixes = message => {
    let text = message;
    let previous;
    do {
        previous = text;
        text = text.replace(ERROR_PREFIX, '');
    } while (text !== previous);
    return text;
};

const SANDBOXED_EXTENSION_ERROR = /^(?:[A-Za-z]*Error:\s*)+Uncaught\s/;

const isUnactionable = (message, stack) => {
    if (withoutErrorPrefixes(message) === 'Script error.') return true;
    if (/unsandboxed/i.test(message) || SANDBOXED_EXTENSION_ERROR.test(message)) return true;
    const frames = String(stack || '')
        .split('\n')
        .filter(line => /:\d+:\d+\)?\s*$/.test(line));
    return frames.length > 0 && BROWSER_EXTENSION_FRAME.test(frames[0]);
};

// The URL this bundle was actually loaded from, taken from the first stack frame at module load.
// It is empty outside a browser bundle (for example under jest), which disables the check.
const bundleHost = (() => {
    try {
        const match = String(new Error().stack || '').match(/https?:\/\/([^/\s]+)\//);
        return match ? match[1] : '';
    } catch (e) {
        return '';
    }
})();

// Rewriting proxies serve MistWarp's bundles from their own host while spoofing window.location.
// Their copies are stale and outside our control, so their errors are noise.
const isRehostedCopy = () => {
    try {
        return Boolean(bundleHost) && bundleHost !== window.location.host;
    } catch (e) {
        return false;
    }
};

const FRAME_URL = /(https?:\/\/[^\s()]+?):\d+:\d+/g;

// MistWarp pages run no inline script beyond the splash theme. Stacks that only point at the page
// itself come from code a browser or a browser extension injected, such as Brave's ad blocker.
const isInjectedPageScript = stack => {
    try {
        const urls = Array.from(String(stack || '').matchAll(FRAME_URL), match => match[1]);
        const page = window.location.href.split('#')[0];
        return urls.length > 0 && urls.every(url => url === page);
    } catch (e) {
        return false;
    }
};

const PROJECT_THREAD_FRAME = /stepThread|executeBlock|executeInCompatibilityLayer/;

// A ReferenceError or SyntaxError raised while a project thread runs comes from JavaScript
// typed into a project block (a typo like "runtimr", or Node-only "require"), not from MistWarp.
const isProjectScriptError = (name, stack) => (
    (name === 'ReferenceError' || name === 'SyntaxError') && PROJECT_THREAD_FRAME.test(String(stack || ''))
);

// NotAllowedError is the browser refusing an action such as autoplay without a user gesture.
// NetworkError is a transport failure with no stack, so nothing in it can be acted on.
const BROWSER_REFUSAL = /^(NotAllowedError|NetworkError)$/;

const BROWSER_NOISE = /window\.ethereum|^Can't find variable: EmptyRanges$|lock the pointer|pointer lock/i;
const DETACHED_NODE = /(?:removeChild|insertBefore).*not a child of this node/;

const isMachineTranslated = () => {
    try {
        return /\btranslated-(?:ltr|rtl)\b/.test(document.documentElement.className);
    } catch (e) {
        return false;
    }
};

const isOutsideMistWarp = (message, name, stack, kind) => (
    BROWSER_NOISE.test(message) ||
    name === 'AbortError' ||
    (kind === 'rejection' && message === 'Unhandled promise rejection' && !stack) ||
    (DETACHED_NODE.test(message) && isMachineTranslated())
);

const SITE_HOSTS = new Set(['mistwarp.org', 'www.mistwarp.org']);

const isOffSite = () => {
    try {
        return !SITE_HOSTS.has(window.location.hostname);
    } catch (e) {
        return true;
    }
};

const NON_ACTIONABLE_CODES = new Set([
    'account_blocked',
    'agreement_required',
    'cancelled',
    'debounced',
    'empty',
    'head_changed',
    'network',
    'no_changes',
    'project_not_exact',
    'project_operation_active',
    'project_too_large',
    'storage_full',
    'timeout',
    'upload_stalled',
    'worktree_assets_unavailable'
]);

const EXPECTED_CAUGHT_MESSAGES = /^(Your live editing access ended\.|The (?:open )?workspace changed\.|Upload cancelled$|Add a short note)/;

const NETWORK_FAILURE_MESSAGE = /^(failed to fetch|load failed|networkerror when attempting to fetch resource|network error|the internet connection appears to be offline)/i;

const FIRST_PARTY_EXTENSION_HOST = /(?:^|\.)(?:mistwarp\.org|mistium\.com|rotur\.dev)$/i;

const reportedErrors = new WeakSet();

const isActionableExtensionError = error => {
    if (error.extensionOrigin === 'data' || error.extensionOrigin === 'blob') return true;
    try {
        const parsed = new URL(String(error.extensionUrl || ''));
        return FIRST_PARTY_EXTENSION_HOST.test(parsed.hostname);
    } catch (e) {
        return false;
    }
};

const isActionableCaughtError = error => {
    if (!error) return false;
    if (typeof error === 'object' && reportedErrors.has(error)) return false;
    if (error.name === 'AbortError' || error.name === 'TimeoutError' || error.name === 'NotAllowedError') {
        return false;
    }
    if (error.code === 'extension_source_unavailable') {
        return isActionableExtensionError(error);
    }
    if (error.code && NON_ACTIONABLE_CODES.has(error.code)) return false;
    if (typeof error.status === 'number' && error.status >= 400 && error.status < 500) return false;
    if (typeof error.status === 'number' && error.status >= 500) return true;
    if (error.code === 'upload_processing_timeout') return true;
    const message = String(error.message || (typeof error === 'string' ? error : '')).trim();
    if (!message) return false;
    if (NETWORK_FAILURE_MESSAGE.test(message)) return false;
    if (EXPECTED_CAUGHT_MESSAGES.test(message)) return false;
    return true;
};

const formatActionableMessage = (error, {context = '', method = '', path = ''} = {}) => {
    const label = context ? `[${context}] ` : '';
    const safePath = path ? scrubApiPath(path) : '';
    if (typeof error.status === 'number' && error.status >= 500) {
        const route = [method ? method.toUpperCase() : '', safePath].filter(Boolean).join(' ');
        const codePart = error.code ? ` (${error.code})` : '';
        return `${label}${route ? `${route} -> ` : ''}HTTP ${error.status}${codePart}`;
    }
    if (error.code === 'upload_processing_timeout') {
        return `${label}Upload processing timeout${safePath ? ` (${safePath})` : ''}`;
    }
    const raw = String(error.message || error).trim();
    return `${label}${raw}`;
};

export const reportSiteError = ({message, stack = '', kind = 'uncaught', url = '', componentStack = '', name = ''}) => {
    try {
        const text = String(message || '').trim();
        if (!text || sending) return;
        if (isBenignResizeObserverLoop(text, stack)) return;
        if (isOffSite() || isUnactionable(text, stack) || isCrawler() || isRehostedCopy() || isInjectedPageScript(stack)) return;
        if (isProjectScriptError(name, stack) || BROWSER_REFUSAL.test(String(name || ''))) return;
        if (isOutsideMistWarp(text, name, stack, kind)) return;
        const href = scrubPageUrl(url || window.location.href).slice(0, 2000);
        if (href.includes('/errors')) return;
        const cleanMessage = scrubSensitiveText(text).slice(0, 2000);
        const cleanStack = scrubSensitiveText(stack).slice(0, 20000);
        const cleanComponentStack = scrubSensitiveText(componentStack).slice(0, 10000);
        if (!cleanMessage) return;
        const signature = `${cleanMessage.slice(0, 200)}|${href.slice(0, 200)}|${cleanStack.slice(0, 200)}`;
        if (!shouldSend(signature)) return;
        sending = true;
        const payload = {
            message: cleanMessage,
            stack: cleanStack,
            kind,
            url: href,
            viewport: viewport(),
            componentStack: cleanComponentStack,
            appVersion: BUILD_ID
        };
        const controller = typeof AbortController === 'function' ? new AbortController() : null;
        const timer = controller ? setTimeout(() => controller.abort(), 8000) : null;
        fetch(ERRORS_URL, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload),
            credentials: 'omit',
            ...(controller ? {signal: controller.signal} : {})
        })
            .catch(() => {})
            .finally(() => {
                if (timer) clearTimeout(timer);
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

export const reportActionableError = (error, options = {}) => {
    if (!isActionableCaughtError(error)) return false;
    if (typeof error === 'object' && error !== null) reportedErrors.add(error);
    reportSiteError({
        message: formatActionableMessage(error, options),
        stack: toStack(error),
        name: error && error.name ? error.name : '',
        kind: 'manual',
        url: options.url || ''
    });
    return true;
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
            name: error && error.name,
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
            name: reason && reason.name,
            kind: 'rejection'
        });
    });
};
