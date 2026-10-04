/* eslint-disable max-len */
import React from 'react';
import {useCommunityIntl as useCommunityText} from '../../i18n.jsx';
import styles from '../Admin.module.css';
import {num, formatCompact} from './admin-format.js';

const AnalyticsChart = ({
    title, description, series, yLabel, formatValue = num, accent = 'var(--accent)', estimateToday = false
}) => {
    const {text: communityText} = useCommunityText();
    const width = 640;
    const height = 220;
    const plot = {left: 58, right: 16, top: 14, bottom: 42};
    const plotWidth = width - plot.left - plot.right;
    const plotHeight = height - plot.top - plot.bottom;
    const max = series.reduce((highest, point) => Math.max(highest, Number(point.value) || 0), 0);
    const latestSeriesPoint = series[series.length - 1];
    const recentValues = series.slice(-8, -1)
        .filter(point => Number.isFinite(point.value))
        .map(point => point.value);
    const recentAverage = recentValues.length ?
        recentValues.reduce((total, value) => total + value, 0) / recentValues.length : 0;
    const now = new Date();
    const elapsedToday = (now.getUTCHours() * 3600) + (now.getUTCMinutes() * 60) + now.getUTCSeconds();
    const dayFraction = Math.max(1 / 24, elapsedToday / 86400);
    const paceWeight = Math.min(.9, Math.max(.35, dayFraction));
    const estimatedValue = estimateToday && latestSeriesPoint && Number.isFinite(latestSeriesPoint.value) ?
        Math.max(latestSeriesPoint.value, Math.round(
            ((latestSeriesPoint.value / dayFraction) * paceWeight) + (recentAverage * (1 - paceWeight))
        )) : null;
    const scaleMax = Math.max(max, estimatedValue || 0) || 1;
    const coordinates = series.map((point, index) => ({
        ...point,
        x: plot.left + ((index / Math.max(1, series.length - 1)) * plotWidth),
        y: Number.isFinite(point.value) ? plot.top + plotHeight - ((point.value / scaleMax) * plotHeight) : null
    }));
    const availablePoints = coordinates.filter(point => Number.isFinite(point.y));
    const latestPoint = availablePoints[availablePoints.length - 1];
    const previousPoint = availablePoints[availablePoints.length - 2];
    const estimatedY = Number.isFinite(estimatedValue) ?
        plot.top + plotHeight - ((estimatedValue / scaleMax) * plotHeight) : null;
    let segmentOpen = false;
    const linePath = coordinates.map(point => {
        if (!Number.isFinite(point.y)) {
            segmentOpen = false;
            return '';
        }
        const command = segmentOpen ? 'L' : 'M';
        segmentOpen = true;
        return `${command} ${point.x} ${point.y}`;
    }).join(' ');
    const tickIndexes = [...new Set([0, Math.floor((series.length - 1) / 2), series.length - 1])];
    return (
        <div className={styles.chart} role="group" aria-label={`${title}. ${description}`}>
            <div className={styles.chartHeader}>
                <div>
                    <h3 className={styles.chartTitle}>{title}</h3>
                    <p>{description}</p>
                </div>
                <div className={styles.chartSummary}>
                    <span>{estimateToday ? communityText('Today') : communityText('Latest')} <strong>{latestPoint ? formatValue(latestPoint.value) : communityText('No data')}</strong></span>
                    {Number.isFinite(estimatedValue) ?
                        <span className={styles.chartEstimate}>{communityText('Est. close')} <strong>{formatValue(estimatedValue)}</strong></span> : null}
                </div>
            </div>
            <svg className={styles.chartPlot} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={communityText('{value1} by date', {value1: title})}>
                {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
                    const y = plot.top + plotHeight - (ratio * plotHeight);
                    return (
                        <g key={ratio}>
                            <line className={styles.chartGridLine} x1={plot.left} x2={plot.left + plotWidth} y1={y} y2={y} />
                            <text className={styles.chartTick} x={plot.left - 9} y={y + 4} textAnchor="end">
                                {formatCompact(scaleMax * ratio)}
                            </text>
                        </g>
                    );
                })}
                <path d={linePath} fill="none" stroke={accent} className={styles.chartLine} />
                {previousPoint && Number.isFinite(estimatedY) ? (
                    <path
                        d={`M ${previousPoint.x} ${previousPoint.y} L ${latestPoint.x} ${estimatedY}`}
                        fill="none"
                        stroke={accent}
                        className={styles.chartProjection}
                    >
                        <title>{communityText('Estimated end of today: {value1}', {value1: formatValue(estimatedValue)})}</title>
                    </path>
                ) : null}
                {coordinates.filter(point => Number.isFinite(point.y)).map(point => (
                    <circle key={point.key} cx={point.x} cy={point.y} r="5" fill="transparent" stroke="transparent">
                        <title>{`${point.fullLabel}: ${formatValue(point.value)}${point.samples ? ` from ${num(point.samples)} samples` : ''}`}</title>
                    </circle>
                ))}
                {latestPoint ? (
                    <circle
                        className={styles.chartEndpoint}
                        cx={latestPoint.x}
                        cy={latestPoint.y}
                        r="4"
                        fill={accent}
                    />
                ) : null}
                {latestPoint && Number.isFinite(estimatedY) ? (
                    <circle
                        className={styles.chartEstimatePoint}
                        cx={latestPoint.x}
                        cy={estimatedY}
                        r="4"
                        fill="var(--bg-card)"
                        stroke={accent}
                    >
                        <title>{communityText('Estimated end of today: {value1}', {value1: formatValue(estimatedValue)})}</title>
                    </circle>
                ) : null}
                {tickIndexes.map(index => (coordinates[index] ? (
                    <text
                        key={coordinates[index].key}
                        className={styles.chartTick}
                        x={coordinates[index].x}
                        y={height - 19}
                        textAnchor={index === 0 ? 'start' : index === series.length - 1 ? 'end' : 'middle'}
                    >
                        {coordinates[index].label}
                    </text>
                ) : null))}
                <text className={styles.chartAxisLabel} x={plot.left + (plotWidth / 2)} y={height - 2} textAnchor="middle">{communityText('Date')}</text>
                <text
                    className={styles.chartAxisLabel}
                    x="13"
                    y={plot.top + (plotHeight / 2)}
                    textAnchor="middle"
                    transform={`rotate(-90 13 ${plot.top + (plotHeight / 2)})`}
                >
                    {yLabel}
                </text>
            </svg>
        </div>
    );
};

export default AnalyticsChart;
