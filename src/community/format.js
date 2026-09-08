import {getCommunityLocale, formatCommunityMessage} from './locale';

const timeAgo = ms => {
    const timestamp = Number(ms);
    if (!Number.isFinite(timestamp) || timestamp <= 0) return '';
    const mins = Math.floor((Date.now() - timestamp) / 60000);
    const locale = getCommunityLocale();
    if (locale !== 'en' && typeof Intl.RelativeTimeFormat === 'function') {
        const seconds = Math.floor((timestamp - Date.now()) / 1000);
        const [size, unit] = Math.abs(seconds) < 60 ? [1, 'second'] :
            Math.abs(seconds) < 3600 ? [60, 'minute'] :
                Math.abs(seconds) < 86400 ? [3600, 'hour'] :
                    Math.abs(seconds) < 31536000 ? [86400, 'day'] : [31536000, 'year'];
        return new Intl.RelativeTimeFormat(locale, {numeric: 'auto', style: 'short'})
            .format(Math.trunc(seconds / size), unit);
    }
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 365) return `${days}d`;
    return `${Math.floor(days / 365)}y`;
};

const sameUser = (a, b) => Boolean(a && b) && a.toLowerCase() === b.toLowerCase();

const formatBytes = bytes => {
    const value = Number(bytes) || 0;
    if (value >= 1048576) return `${(value / 1048576).toFixed(1)} MB`;
    if (value >= 1024) return `${Math.round(value / 1024)} KB`;
    return `${value} B`;
};

const safeDate = value => {
    if (!value) return null;
    const normalized = typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value;
    if (typeof normalized === 'number' && (!Number.isFinite(normalized) || normalized <= 0)) return null;
    const date = new Date(normalized);
    return Number.isNaN(date.getTime()) ? null : date;
};

const formatDate = (value, fallback = '') => {
    const date = safeDate(value);
    if (!date) return fallback;
    return date.toLocaleDateString(getCommunityLocale(), {year: 'numeric', month: 'short', day: 'numeric'});
};

const formatDateTime = (value, fallback = '') => {
    const date = safeDate(value);
    if (!date) return fallback;
    return date.toLocaleString(getCommunityLocale(), {dateStyle: 'medium', timeStyle: 'short'});
};

const formatPlaytime = (value, includeLabel = true) => {
    const milliseconds = Number(value);
    const hasPlaytime = Number.isFinite(milliseconds) && milliseconds > 0;
    const minutes = hasPlaytime ? Math.floor(milliseconds / 60000) : 0;
    let duration;
    if (hasPlaytime && minutes === 0) duration = '<1m';
    else if (minutes < 60) duration = `${minutes}m`;
    else {
        const hours = Math.floor(minutes / 60);
        const remainder = minutes % 60;
        duration = remainder ? `${hours}h ${remainder}m` : `${hours}h`;
    }
    const locale = getCommunityLocale();
    if (locale !== 'en') {
        const unit = (amount, name) => new Intl.NumberFormat(locale, {
            style: 'unit', unit: name, unitDisplay: 'narrow'
        }).format(amount);
        if (hasPlaytime && minutes === 0) duration = `<${unit(1, 'minute')}`;
        else if (minutes < 60) duration = unit(minutes, 'minute');
        else {
            const hours = unit(Math.floor(minutes / 60), 'hour');
            duration = minutes % 60 ? `${hours} ${unit(minutes % 60, 'minute')}` : hours;
        }
    }
    return includeLabel ? formatCommunityMessage('{duration} played', {duration}) : duration;
};

export {timeAgo, sameUser, formatBytes, formatDate, formatDateTime, formatPlaytime, safeDate};
