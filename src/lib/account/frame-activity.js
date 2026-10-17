import {ACCOUNT_ORIGIN} from './origins.js';

const MAX_TITLE = 120;
const MAX_PLACE = 120;
const MAX_AGE = 7 * 24 * 60 * 60 * 1000;
const MIN_INTERVAL = 2000;
const PROJECT_URL = /^\/project\/[A-Za-z0-9_-]{1,80}$/;
const DOING = /^Editing (?:code|costumes|backdrops|sounds|(?:costume|backdrop|sound) "[^"]*") in (.+)$/;
const ZWJ = '\u200d';

const BREAKS = /[\p{Cc}\p{Zl}\p{Zp}\s]+/gu;
const HIDDEN = /[\p{Cf}\p{Cs}\p{Co}]/gu;

const cleanText = (value, max) => {
    if (typeof value !== 'string') return '';
    const visible = value
        .replace(HIDDEN, character => (character === ZWJ ? character : ''))
        .replace(BREAKS, ' ')
        .trim();
    return Array.from(visible).slice(0, max)
        .join('')
        .trim();
};

const cleanDoing = value => {
    const text = cleanText(value, MAX_PLACE * 2);
    const match = DOING.exec(text);
    if (!match || Array.from(match[1]).length > MAX_PLACE) return null;
    return text;
};

const projectUrl = url => {
    if (typeof url !== 'string' || !url.startsWith(`${ACCOUNT_ORIGIN}/`)) return null;
    const path = url.slice(ACCOUNT_ORIGIN.length);
    return PROJECT_URL.test(path) ? url : null;
};

const cleanContext = (context, now) => {
    const ctx = context && typeof context === 'object' ? context : {};
    const since = Number(ctx.editingSince);
    return {
        projectTitle: cleanText(ctx.projectTitle, MAX_TITLE),
        doing: cleanDoing(ctx.doing),
        collaborating: ctx.collaborating === true,
        url: projectUrl(ctx.url),
        editingSince: Number.isFinite(since) && since <= now && since >= now - MAX_AGE ? since : now
    };
};

const sameContext = (a, b) => Boolean(a && b) && a.projectTitle === b.projectTitle && a.doing === b.doing &&
    a.collaborating === b.collaborating && a.url === b.url && a.editingSince === b.editingSince;

const memorySlot = () => {
    let value = -Infinity;
    return {
        get: () => value,
        set: next => {
            value = next;
        }
    };
};

const createFrameActivity = ({
    syncActivity,
    clearActivity,
    now = Date.now,
    setTimer = setTimeout,
    interval = MIN_INTERVAL,
    lastSent = memorySlot()
}) => {
    let shown = null;
    let pending = null;
    let timer = null;

    const waitFor = () => {
        const last = Number(lastSent.get());
        return (Number.isFinite(last) && last <= now() ? last : -Infinity) + interval - now();
    };

    const flush = () => {
        timer = null;
        if (!pending) return;
        const wait = waitFor();
        if (wait > 0) {
            timer = setTimer(flush, wait);
            return;
        }
        const next = pending;
        pending = null;
        lastSent.set(now());
        shown = next.context;
        Promise.resolve()
            .then(() => (next.context ? syncActivity(next.context) : clearActivity()))
            .catch(() => null);
    };

    const schedule = next => {
        pending = next;
        if (!timer) flush();
    };

    return {
        set: ({context}) => {
            const next = cleanContext(context, now());
            if (!pending && sameContext(next, shown)) return true;
            schedule({context: next});
            return true;
        },
        clear: () => {
            if (!pending && !shown) return true;
            schedule({context: null});
            return true;
        },
        refresh: () => {
            const latest = pending ? pending.context : shown;
            if (latest) schedule({context: latest});
        },
        forget: () => {
            shown = null;
            pending = null;
        }
    };
};

export {
    cleanContext,
    createFrameActivity
};
