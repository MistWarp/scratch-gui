import {formatDate, formatDateTime, safeDate, timeAgoText} from './format';

const RELATIVE_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const UPDATE_GAP_MS = 60 * 1000;

export const projectPublishedAt = project => {
    if (!project) return 0;
    const value = project.shared ? (project.sharedAt || project.created) : project.created;
    const date = safeDate(value);
    return date ? date.getTime() : 0;
};

export const projectUpdatedAt = project => {
    const published = projectPublishedAt(project);
    const edited = safeDate(project && project.edited);
    if (!published || !edited || edited.getTime() - published < UPDATE_GAP_MS) return 0;
    return edited.getTime();
};

export const shortTime = (ms, now = Date.now()) => (now - ms < RELATIVE_WINDOW_MS ? timeAgoText(ms) : formatDate(ms));

export const fullTime = ms => formatDateTime(ms);

export const isoTime = ms => new Date(ms).toISOString();
