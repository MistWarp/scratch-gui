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

export {timeAgo, sameUser};
