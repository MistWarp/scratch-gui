/* eslint-disable max-len */
import React, {useEffect, useMemo, useState} from 'react';
import {Link} from 'react-router-dom';
import api from '../api';
import styles from './ChallengeCalendar.module.css';

const DAY_MS = 86400000;
const CALENDAR_COLORS = ['#b83f88', '#328da1', '#526bb8', '#aa762d', '#35866b', '#804baa'];

const calendarDay = value => {
    const normalized = typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value;
    const date = new Date(normalized);
    if (Number.isNaN(date.getTime())) return null;
    return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY_MS);
};

const calendarDate = day => {
    const utc = new Date(day * DAY_MS);
    return new Date(utc.getUTCFullYear(), utc.getUTCMonth(), utc.getUTCDate());
};

const buildChallengeCalendar = (source, now = Date.now()) => {
    if (!source) return null;
    const today = calendarDay(now);
    const dated = source.map(space => ({
        ...space,
        startDay: calendarDay(space.startsAt),
        endDay: calendarDay(space.endsAt)
    }))
        .filter(space => space.startDay !== null && space.endDay !== null && space.endDay >= space.startDay)
        .filter(space => space.endDay >= today - 14 && space.startDay <= today + 90)
        .sort((a, b) => a.startDay - b.startDay);
    if (!dated.length) return false;
    const earliest = Math.min(...dated.map(space => space.startDay));
    const latest = Math.max(...dated.map(space => space.endDay));
    const rangeStart = Math.min(today - 7, earliest);
    const rangeEnd = Math.max(rangeStart + 35, Math.min(latest, rangeStart + 90));
    const dayCount = rangeEnd - rangeStart + 1;
    const days = Array.from({length: dayCount}, (_, index) => ({
        day: rangeStart + index,
        date: calendarDate(rangeStart + index)
    }));
    const months = [];
    days.forEach(({date}) => {
        const key = `${date.getFullYear()}-${date.getMonth()}`;
        const current = months[months.length - 1];
        if (current && current.key === key) current.span += 1;
        else months.push({key, label: date.toLocaleDateString([], {month: 'long', year: 'numeric'}), span: 1});
    });
    const laneEnds = [];
    const events = dated.map((space, index) => {
        const start = Math.max(space.startDay, rangeStart);
        const end = Math.min(space.endDay, rangeEnd);
        let lane = laneEnds.findIndex(laneEnd => laneEnd < start);
        if (lane === -1) {
            lane = laneEnds.length;
            laneEnds.push(end);
        } else {
            laneEnds[lane] = end;
        }
        return {
            ...space,
            lane,
            column: start - rangeStart + 1,
            span: Math.max(1, end - start + 1),
            color: CALENDAR_COLORS[index % CALENDAR_COLORS.length]
        };
    });
    return {today, rangeStart, days, months, events, lanes: laneEnds.length};
};

const ChallengeCalendar = ({spaces, className = ''}) => {
    const [loadedSpaces, setLoadedSpaces] = useState(null);
    const [loadError, setLoadError] = useState(false);
    const [attempt, setAttempt] = useState(0);
    useEffect(() => {
        if (typeof spaces !== 'undefined') return () => {};
        let active = true;
        setLoadedSpaces(null);
        setLoadError(false);
        api.spaces({kind: 'challenge'})
            .then(data => {
                if (active) setLoadedSpaces(data.spaces || []);
            })
            .catch(() => {
                if (active) setLoadError(true);
            });
        return () => {
            active = false;
        };
    }, [spaces, attempt]);
    const source = typeof spaces === 'undefined' ? loadedSpaces : spaces;
    const calendar = useMemo(() => buildChallengeCalendar(source), [source]);

    if (loadError) return <div className={`${styles.empty}${className ? ` ${className}` : ''}`} role="alert">Could not load the challenge calendar. <button type="button" onClick={() => setAttempt(value => value + 1)}>Try again</button></div>;
    if (calendar === null) return <div className={`${styles.skeleton}${className ? ` ${className}` : ''}`} role="status" aria-label="Loading challenge calendar" />;
    if (calendar === false) return <p className={`${styles.empty}${className ? ` ${className}` : ''}`}>No challenges are scheduled.</p>;
    const todayOffset = calendar.today - calendar.rangeStart;
    return (
        <section className={`${styles.section}${className ? ` ${className}` : ''}`}>
            <div className={styles.head}><div><h2>Challenge calendar</h2><p>See what is running now and what starts next.</p></div><Link to="/spaces?kind=challenge">All challenges</Link></div>
            <div className={styles.scroll}>
                <div className={styles.calendar} style={{'--mw-calendar-days': calendar.days.length}}>
                    <div className={styles.months}>{calendar.months.map(month => <span key={month.key} style={{gridColumn: `span ${month.span}`}}>{month.label}</span>)}</div>
                    <div className={styles.days}>{calendar.days.map(({day, date}) => <span key={day} className={day === calendar.today ? styles.today : ''}><strong>{date.toLocaleDateString([], {weekday: 'short'})}</strong>{date.getDate()}</span>)}</div>
                    <div className={styles.plot} style={{gridTemplateRows: `repeat(${calendar.lanes}, 34px)`}}>{todayOffset >= 0 && todayOffset < calendar.days.length ? <i className={styles.todayBand} style={{'--mw-today-offset': todayOffset}} /> : null}{calendar.events.map(event => {
                        const submissions = (event.projects || []).length;
                        return <Link key={event._id} to={`/spaces/${event._id}`} className={styles.event} style={{'--mw-calendar-column': event.column, '--mw-calendar-span': event.span, '--mw-calendar-row': event.lane + 1, '--mw-challenge-color': event.color}} title={`${event.title}, ${new Date(event.startsAt).toLocaleDateString()} to ${new Date(event.endsAt).toLocaleDateString()}`}><strong>{event.title}</strong><span>{event.participantCount || 0} joined, {submissions} {submissions === 1 ? 'submission' : 'submissions'}</span></Link>;
                    })}</div>
                </div>
            </div>
        </section>
    );
};

export {buildChallengeCalendar, calendarDay};
export default ChallengeCalendar;
