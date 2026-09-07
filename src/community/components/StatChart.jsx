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

const compact = value => {
    if (value >= 1000000) return `${Math.round((value / 1000000) * 10) / 10}M`;
    if (value >= 1000) return `${Math.round((value / 1000) * 10) / 10}k`;
    return String(Math.round(value));
};

const width = 600;
const height = 180;
const plot = {left: 44, right: 12, top: 12, bottom: 26};
const plotWidth = width - plot.left - plot.right;
const plotHeight = height - plot.top - plot.bottom;

const StatChart = ({title, rows, accent = 'var(--accent)', format, emptyText = 'No activity yet.', bare = false}) => {
    const points = rows || [];
    const max = points.reduce((m, row) => Math.max(m, Number(row.value) || 0), 0);
    const total = points.reduce((sum, row) => sum + (Number(row.value) || 0), 0);
    const formatValue = format || (value => value.toLocaleString());
    if (!total) {
        return (
            <div className={bare ? styles.bare : styles.card}>
                {title ? <h3 className={styles.title}>{title}</h3> : null}
                <p className={styles.empty}>{emptyText}</p>
            </div>
        );
    }
    const scaleMax = max || 1;
    const x = index => (points.length > 1 ?
        plot.left + ((index / (points.length - 1)) * plotWidth) :
        plot.left + (plotWidth / 2));
    const y = value => plot.top + plotHeight - (((Number(value) || 0) / scaleMax) * plotHeight);
    const linePath = points.map((row, index) => {
        const prefix = index === 0 ? 'M' : 'L';
        return `${prefix} ${x(index).toFixed(1)} ${y(row.value).toFixed(1)}`;
    }).join(' ');
    const base = plot.top + plotHeight;
    const areaPath = `${linePath} L ${x(points.length - 1).toFixed(1)} ${base} L ${x(0).toFixed(1)} ${base} Z`;
    const tickIndexes = [...new Set([
        0,
        Math.floor((points.length - 1) / 3),
        Math.floor(((points.length - 1) * 2) / 3),
        points.length - 1
    ])].filter(index => points[index]);
    const last = points[points.length - 1];
    return (
        <div className={bare ? styles.bare : styles.card}>
            {title ? <h3 className={styles.title}>{title}</h3> : null}
            <svg
                className={styles.plot}
                viewBox={`0 0 ${width} ${height}`}
                role="img"
                aria-label={title ? `${title} by date` : 'Activity by date'}
            >
                {[0, 0.5, 1].map(ratio => {
                    const gy = plot.top + plotHeight - (ratio * plotHeight);
                    return (
                        <g key={ratio}>
                            <line
                                className={styles.gridLine}
                                x1={plot.left}
                                x2={plot.left + plotWidth}
                                y1={gy}
                                y2={gy}
                            />
                            <text
                                className={styles.tick}
                                x={plot.left - 8}
                                y={gy + 4}
                                textAnchor="end"
                            >
                                {compact(scaleMax * ratio)}
                            </text>
                        </g>
                    );
                })}
                <path
                    d={areaPath}
                    fill={accent}
                    opacity="0.14"
                    stroke="none"
                />
                <path
                    d={linePath}
                    fill="none"
                    stroke={accent}
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    className={styles.line}
                />
                {points.map((row, index) => (
                    <circle
                        key={row.key}
                        cx={x(index)}
                        cy={y(row.value)}
                        r="9"
                        fill="transparent"
                        stroke="transparent"
                    >
                        <title>{`${row.label}: ${formatValue(row.value)}`}</title>
                    </circle>
                ))}
                <circle
                    className={styles.endpoint}
                    cx={x(points.length - 1)}
                    cy={y(last.value)}
                    r="4.5"
                    fill={accent}
                    stroke="var(--bg-card)"
                    strokeWidth="2"
                >
                    <title>{`${last.label}: ${formatValue(last.value)}`}</title>
                </circle>
                {tickIndexes.map(index => (
                    <text
                        key={points[index].key}
                        className={styles.tick}
                        x={x(index)}
                        y={height - 8}
                        textAnchor={index === 0 ? 'start' : index === points.length - 1 ? 'end' : 'middle'}
                    >
                        {points[index].label}
                    </text>
                ))}
            </svg>
        </div>
    );
};

export default StatChart;
export {historyRows};
