import React from 'react';
import styles from './StatChart.module.css';

const dayLabel = dayIndex => {
    try {
        return new Date(Number(dayIndex) * 86400000).toLocaleDateString([], {month: 'short', day: 'numeric'});
    } catch (e) {
        return '';
    }
};

// Build a fixed run of day buckets ending today from a {dayIndex: value} map.
const historyRows = (history, days = 14) => {
    const map = history || {};
    const today = Math.floor(Date.now() / 86400000);
    const rows = [];
    for (let i = days - 1; i >= 0; i--) {
        const key = String(today - i);
        rows.push({key, label: dayLabel(key), value: Number(map[key]) || 0});
    }
    return rows;
};

const StatChart = ({title, rows, accent = 'var(--accent)', format, emptyText = 'No activity yet.'}) => {
    const max = rows.reduce((m, row) => Math.max(m, row.value), 0);
    const total = rows.reduce((sum, row) => sum + row.value, 0);
    return (
        <div className={styles.card}>
            <h3 className={styles.title}>{title}</h3>
            {total ? (
                <div className={styles.chart}>
                    {rows.map(row => (
                        <div
                            key={row.key}
                            className={styles.col}
                            title={`${row.label}: ${format ? format(row.value) : row.value}`}
                        >
                            <div className={styles.track}>
                                <div
                                    className={styles.bar}
                                    style={{
                                        height: `${max ? Math.max((row.value / max) * 100, row.value ? 6 : 0) : 0}%`,
                                        background: accent
                                    }}
                                />
                            </div>
                            <span className={styles.label}>{row.label}</span>
                        </div>
                    ))}
                </div>
            ) : (
                <p className={styles.empty}>{emptyText}</p>
            )}
        </div>
    );
};

export default StatChart;
export {historyRows};
