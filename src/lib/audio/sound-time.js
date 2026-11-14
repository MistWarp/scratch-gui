const splitMinutes = (seconds, decimals) => {
    const scale = Math.pow(10, decimals);
    const total = Math.round(Math.max(0, seconds) * scale) / scale;
    const minutes = Math.floor(total / 60);
    return [minutes, total - (minutes * 60)];
};

const formatSeconds = (seconds, decimals) => {
    const [minutes, rest] = splitMinutes(seconds, decimals);
    if (minutes > 0) {
        return `${minutes}:${rest.toFixed(decimals).padStart(decimals ? decimals + 3 : 2, '0')}`;
    }
    return rest.toFixed(decimals);
};

const formatClock = seconds => {
    const [minutes, rest] = splitMinutes(seconds, 3);
    return `${minutes}:${rest.toFixed(3).padStart(6, '0')}`;
};

const parseSeconds = text => {
    const value = String(text).trim();
    if (!value) return null;
    const parts = value.split(':');
    if (parts.length > 2) return null;
    const seconds = Number(parts[parts.length - 1]);
    const minutes = parts.length === 2 ? Number(parts[0]) : 0;
    if (!Number.isFinite(seconds) || !Number.isFinite(minutes) || seconds < 0 || minutes < 0) return null;
    return (minutes * 60) + seconds;
};

export {
    formatClock,
    formatSeconds,
    parseSeconds
};
