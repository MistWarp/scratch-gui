import {formatDate, formatDateTime, safeDate, timeAgoText} from './format';

const RELATIVE_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const UPDATE_GAP_MS = 60 * 1000;

const timeOf = value => {
    const date = safeDate(value);
    return date ? date.getTime() : 0;
};

export const projectPublishedAt = project => {
    if (!project) return 0;
    return timeOf(project.shared ? (project.sharedAt || project.created) : project.created);
};

export const projectUpdatedAt = project => {
    const published = projectPublishedAt(project);
    const uploaded = timeOf(project && project.lastUploadAt);
    if (!published || !uploaded || uploaded - published < UPDATE_GAP_MS) return 0;
    return uploaded;
};

export const shortTime = (ms, now = Date.now()) => {
    const shown = Math.min(ms, now);
    return now - shown < RELATIVE_WINDOW_MS ? timeAgoText(shown) : formatDate(shown);
};

export const fullTime = ms => formatDateTime(ms);

export const isoTime = ms => new Date(ms).toISOString();
