import {local} from '../modules/storage';
import {analyticsEnabled, track} from './analytics';

const FIRST_VISIT_KEY = 'mw:first-visit-day';
const VISIT_KEY = 'mw:visit';
const VISIT_IDLE_MS = 30 * 60 * 1000;
const MAX_SEEN = 40;
const DEPTHS = [2, 3, 5, 10];

const today = () => new Date().toISOString()
    .slice(0, 10);

const stringList = value => Array.isArray(value) && value.every(item => typeof item === 'string');

const validVisit = value => Boolean(value && typeof value === 'object' &&
    Number(value.last) > 0 && stringList(value.seen) && stringList(value.tracked));

export const visitKind = (firstVisitDay, day) => (firstVisitDay && firstVisitDay < day ? 'returning' : 'new');

export const depthMilestone = count => (DEPTHS.includes(count) ? String(count) : '');

export const currentVisit = (now = Date.now()) => {
    const stored = local.readJSON(VISIT_KEY, null);
    if (!validVisit(stored)) return {last: now, seen: [], tracked: []};
    const idle = now - Number(stored.last);
    if (idle > VISIT_IDLE_MS || idle < -VISIT_IDLE_MS) return {last: now, seen: [], tracked: []};
    return stored;
};

const saveVisit = (visit, now) => {
    local.writeJSON(VISIT_KEY, {last: now, seen: visit.seen, tracked: visit.tracked});
};

export const visitProjects = (now = Date.now()) => currentVisit(now).seen;

export const rememberVisitProject = (id, now = Date.now()) => {
    const visit = currentVisit(now);
    const earlier = visit.seen;
    const seen = [...earlier.filter(item => item !== id), id].slice(-MAX_SEEN);
    saveVisit({...visit, seen}, now);
    return earlier.length >= MAX_SEEN ? 0 : seen.length;
};

const trackOncePerVisit = (name, variant, now) => {
    const visit = currentVisit(now);
    const key = `${name}:${variant}`;
    if (visit.tracked.includes(key)) {
        saveVisit(visit, now);
        return;
    }
    saveVisit({...visit, tracked: [...visit.tracked, key]}, now);
    track(name, {variant});
};

export const trackVisitStart = (now = Date.now()) => {
    if (!analyticsEnabled()) return;
    const day = today();
    const firstVisitDay = local.readString(FIRST_VISIT_KEY);
    if (!firstVisitDay) local.writeString(FIRST_VISIT_KEY, day);
    trackOncePerVisit('visit_start', visitKind(firstVisitDay, day), now);
};

export const trackVisitDepth = (count, now = Date.now()) => {
    const depth = depthMilestone(count);
    if (!depth || !analyticsEnabled()) return;
    trackOncePerVisit('visit_depth', depth, now);
};
