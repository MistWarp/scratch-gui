/* eslint-disable max-len */
import React, {useEffect, useMemo, useState} from 'react';
import {Link} from 'react-router-dom';
import api from '../api';
import styles from './ChallengeCalendar.module.css';

const DAY_MS = 86400000;
const CALENDAR_COLORS = ['#b83f88', '#328da1', '#526bb8', '#aa762d', '#35866b', '#804baa'];

const dayStart = value => {
    const date = new Date(value);
    date.setHours(0, 0, 0, 0);
    return date.getTime();
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
    const calendar = useMemo(() => {
        if (!source) return null;
        const today = dayStart(Date.now());
        const dated = source.filter(space => space.startsAt > 0 && space.endsAt > 0)
            .filter(space => space.endsAt >= today - (14 * DAY_MS) && space.startsAt <= today + (90 * DAY_MS))
            .sort((a, b) => a.startsAt - b.startsAt);
        if (!dated.length) return false;
        const earliest = Math.min(...dated.map(space => dayStart(space.startsAt)));
        const latest = Math.max(...dated.map(space => dayStart(space.endsAt)));
        const rangeStart = Math.min(today - (7 * DAY_MS), earliest);
        const rangeEnd = Math.max(rangeStart + (35 * DAY_MS), Math.min(latest, rangeStart + (90 * DAY_MS)));
        const dayCount = Math.ceil((rangeEnd - rangeStart) / DAY_MS) + 1;
        const days = Array.from({length: dayCount}, (_, index) => new Date(rangeStart + (index * DAY_MS)));
        const months = [];
        days.forEach(date => {
            const key = `${date.getFullYear()}-${date.getMonth()}`;
            const current = months[months.length - 1];
            if (current && current.key === key) current.span += 1;
            else months.push({key, label: date.toLocaleDateString([], {month: 'long', year: 'numeric'}), span: 1});
        });
        const laneEnds = [];
        const events = dated.map((space, index) => {
            const start = Math.max(dayStart(space.startsAt), rangeStart);
            const end = Math.min(dayStart(space.endsAt), rangeEnd);
            let lane = laneEnds.findIndex(laneEnd => laneEnd < start);
            if (lane === -1) {
                lane = laneEnds.length;
                laneEnds.push(end);
            } else {
                laneEnds[lane] = end;
            }
            return {...space, lane, column: Math.floor((start - rangeStart) / DAY_MS) + 1, span: Math.max(1, Math.ceil((end - start) / DAY_MS) + 1), color: CALENDAR_COLORS[index % CALENDAR_COLORS.length]};
        });
        return {today, rangeStart, days, months, events, lanes: laneEnds.length};
    }, [source]);

    if (loadError) return <div className={`${styles.empty}${className ? ` ${className}` : ''}`} role="alert">Could not load the challenge calendar. <button type="button" onClick={() => setAttempt(value => value + 1)}>Try again</button></div>;
    if (calendar === null) return <div className={`${styles.skeleton}${className ? ` ${className}` : ''}`} role="status" aria-label="Loading challenge calendar" />;
    if (calendar === false) return <p className={`${styles.empty}${className ? ` ${className}` : ''}`}>No challenges are scheduled.</p>;
    const todayOffset = Math.floor((calendar.today - calendar.rangeStart) / DAY_MS);
    return (
        <section className={`${styles.section}${className ? ` ${className}` : ''}`}>
            <div className={styles.head}><div><h2>Challenge calendar</h2><p>See what is running now and what starts next.</p></div><Link to="/spaces?kind=challenge">All challenges</Link></div>
            <div className={styles.scroll}>
                <div className={styles.calendar} style={{'--mw-calendar-days': calendar.days.length}}>
                    <div className={styles.months}>{calendar.months.map(month => <span key={month.key} style={{gridColumn: `span ${month.span}`}}>{month.label}</span>)}</div>
                    <div className={styles.days}>{calendar.days.map(date => <span key={date.getTime()} className={date.getTime() === calendar.today ? styles.today : ''}><strong>{date.toLocaleDateString([], {weekday: 'short'})}</strong>{date.getDate()}</span>)}</div>
                    <div className={styles.plot} style={{gridTemplateRows: `repeat(${calendar.lanes}, 34px)`}}>{todayOffset >= 0 && todayOffset < calendar.days.length ? <i className={styles.todayBand} style={{'--mw-today-offset': todayOffset}} /> : null}{calendar.events.map(event => {
                        const submissions = (event.projects || []).length;
                        return <Link key={event._id} to={`/spaces/${event._id}`} className={styles.event} style={{'--mw-calendar-column': event.column, '--mw-calendar-span': event.span, '--mw-calendar-row': event.lane + 1, '--mw-challenge-color': event.color}} title={`${event.title}, ${new Date(event.startsAt).toLocaleDateString()} to ${new Date(event.endsAt).toLocaleDateString()}`}><strong>{event.title}</strong><span>{event.participantCount || 0} joined, {submissions} {submissions === 1 ? 'submission' : 'submissions'}</span></Link>;
                    })}</div>
                </div>
            </div>
        </section>
    );
};

export default ChallengeCalendar;
