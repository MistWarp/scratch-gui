/* eslint-disable max-len */
import {getCommunityLocale} from '../../locale.js';

const dayLabel = dayNumber => {
    const d = new Date(dayNumber * 86400000);
    return d.toLocaleDateString(getCommunityLocale(), {month: 'short', day: 'numeric', timeZone: 'UTC'});
};

export const buildSeries = (byDay, days, samplesByDay) => {
    const today = Math.floor(Date.now() / 86400000);
    return Array.from({length: days}, (unused, idx) => {
        const dayNumber = today - (days - 1 - idx);
        const key = String(dayNumber);
        return {
            key,
            label: dayLabel(dayNumber),
            fullLabel: new Date(dayNumber * 86400000).toLocaleDateString(getCommunityLocale(), {
                year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC'
            }),
            value: samplesByDay && !Number(samplesByDay[key]) ? null : Number(byDay && byDay[key]) || 0,
            samples: Number(samplesByDay && samplesByDay[key]) || 0
        };
    });
};

export const num = v => Number(v || 0).toLocaleString(getCommunityLocale());
export const percent = (part, total, digits = 1) => (total ? `${((part / total) * 100).toFixed(digits)}%` : '0%');
export const formatCompact = value => new Intl.NumberFormat(getCommunityLocale(), {notation: 'compact', maximumFractionDigits: 1}).format(value);
export const formatLoadTime = value => (value < 1000 ? `${Math.round(value)} ms` : `${(value / 1000).toFixed(2)} s`);
