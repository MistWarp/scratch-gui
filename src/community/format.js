const timeAgo = ms => {
    const mins = Math.floor((Date.now() - ms) / 60000);
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

const formatDate = (value, fallback = '') => {
    if (!value) return fallback;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return fallback;
    return date.toLocaleDateString([], {year: 'numeric', month: 'short', day: 'numeric'});
};

const formatPlaytime = (value, includeLabel = true) => {
    const milliseconds = Number(value);
    const minutes = Number.isFinite(milliseconds) && milliseconds > 0 ? Math.floor(milliseconds / 60000) : 0;
    let duration;
    if (minutes < 60) duration = `${minutes}m`;
    else {
        const hours = Math.floor(minutes / 60);
        const remainder = minutes % 60;
        duration = remainder ? `${hours}h ${remainder}m` : `${hours}h`;
    }
    return includeLabel ? `${duration} played` : duration;
};

export {timeAgo, sameUser, formatBytes, formatDate, formatPlaytime};
