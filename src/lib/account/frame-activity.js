import {ACCOUNT_ORIGIN} from './origins.js';

const MAX_TEXT = 200;
const MAX_AGE = 7 * 24 * 60 * 60 * 1000;
const PROJECT_URL = /^\/project\/[A-Za-z0-9_-]{1,80}$/;

const printable = character => character.charCodeAt(0) > 31 && character.charCodeAt(0) !== 127;

const cleanText = value => {
    if (typeof value !== 'string') return '';
    return Array.from(value, character => (printable(character) ? character : ' ')).join('')
        .trim()
        .slice(0, MAX_TEXT);
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
        projectTitle: cleanText(ctx.projectTitle),
        doing: cleanText(ctx.doing) || null,
        collaborating: ctx.collaborating === true,
        url: projectUrl(ctx.url),
        editingSince: Number.isFinite(since) && since <= now && since >= now - MAX_AGE ? since : now
    };
};

const createFrameActivity = ({syncActivity, clearActivity, now = Date.now}) => ({
    set: async ({context}) => {
        await syncActivity(cleanContext(context, now()));
        return true;
    },
    clear: () => {
        clearActivity();
        return true;
    }
});

export {
    cleanContext,
    createFrameActivity
};
