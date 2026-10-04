const UNITS = ['B', 'KB', 'MB', 'GB', 'TB'];

/**
 * Format a byte count for display, such as "512 B", "1.5 MB" or "2 GB".
 *
 * Sizes use binary multiples (1 KB = 1024 bytes) unless `decimal` is set, in
 * which case 1 KB = 1000 bytes. Anything above bytes keeps at most one decimal
 * place, dropping a trailing ".0". The number is formatted the same way in every
 * locale.
 * @param {number|string} bytes Number of bytes. Invalid values count as 0.
 * @param {object} [options] Formatting options.
 * @param {boolean} [options.decimal] Use powers of 1000 instead of 1024, for limits that are sold in decimal units.
 * @returns {string} The formatted size.
 */
const formatBytes = (bytes, {decimal = false} = {}) => {
    const value = Number(bytes);
    if (!Number.isFinite(value)) return '0 B';
    const base = decimal ? 1000 : 1024;
    // Whole bytes, one decimal place for anything larger.
    const rounded = (amount, unitIndex) => (unitIndex === 0 ? Math.round(amount) : Number(amount.toFixed(1)));
    let size = Math.abs(value);
    let unit = 0;
    // Pick the unit after rounding so that 1023.96 KB shows as "1 MB" rather than "1024 KB".
    while (unit < UNITS.length - 1 && rounded(size, unit) >= base) {
        size /= base;
        unit++;
    }
    const shown = rounded(size, unit);
    return `${value < 0 && shown ? '-' : ''}${shown} ${UNITS[unit]}`;
};

export {
    formatBytes
};
