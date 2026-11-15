import {local, session} from '../modules/storage';
import {analyticsEnabled, track} from './analytics';

const FIRST_VISIT_KEY = 'mw:first-visit-day';
const DEPTHS = [2, 3, 5, 10];

const today = () => new Date().toISOString()
    .slice(0, 10);

export const visitKind = (firstVisitDay, day) => (firstVisitDay && firstVisitDay < day ? 'returning' : 'new');

export const depthMilestone = count => (DEPTHS.includes(count) ? String(count) : '');

const trackOncePerVisit = (key, name, variant) => {
    if (session.readString(key)) return;
    session.writeString(key, '1');
    track(name, {variant});
};

export const trackVisitStart = () => {
    if (!analyticsEnabled()) return;
    const day = today();
    const firstVisitDay = local.readString(FIRST_VISIT_KEY);
    if (!firstVisitDay) local.writeString(FIRST_VISIT_KEY, day);
    trackOncePerVisit('mw:analytics-once:visit_start', 'visit_start', visitKind(firstVisitDay, day));
};

export const trackVisitDepth = count => {
    const depth = depthMilestone(count);
    if (!depth || !analyticsEnabled()) return;
    trackOncePerVisit(`mw:analytics-once:visit_depth:${depth}`, 'visit_depth', depth);
};
