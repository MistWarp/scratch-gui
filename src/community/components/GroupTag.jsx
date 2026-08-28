import React, {useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import rotur from '../rotur.js';
import styles from './GroupTag.module.css';

const tagCache = new Map();
const resolveTag = username => {
    const key = String(username || '').trim().toLowerCase();
    if (!key) return Promise.resolve('');
    const cached = tagCache.get(key);
    if (cached && Date.now() - cached.at < 300000) return cached.promise;
    if (typeof rotur.profile !== 'function') return Promise.resolve('');
    const promise = rotur.profile(key).then(profile => profile.group_tag || '').catch(() => {
        if (tagCache.get(key)?.promise === promise) tagCache.delete(key);
        return '';
    });
    tagCache.set(key, {at: Date.now(), promise});
    return promise;
};
const storeResolvedTag = (username, tag) => {
    const key = String(username || '').trim().toLowerCase();
    if (key) {
        tagCache.set(key, {at: Date.now(), promise: Promise.resolve(String(tag || ''))});
    }
};

const GroupTag = ({tag, username, compact = false, linked = true, className = ''}) => {
    const supplied = String(tag || '').trim();
    const [resolved, setResolved] = useState(supplied);
    useEffect(() => {
        if (supplied) {
            setResolved(supplied);
            return () => {};
        }
        let active = true;
        resolveTag(username).then(value => {
            if (active) setResolved(value);
        });
        const onRepresentation = event => {
            if (String(event.detail?.username || '').toLowerCase() !== String(username || '').toLowerCase()) return;
            storeResolvedTag(username, event.detail?.tag);
            setResolved(event.detail?.tag || '');
        };
        window.addEventListener('mw:group-representation', onRepresentation);
        return () => {
            active = false;
            window.removeEventListener('mw:group-representation', onRepresentation);
        };
    }, [supplied, username]);
    const value = String(resolved || '').trim();
    if (!value) return null;
    const tagClassName = `${styles.tag} ${compact ? styles.compact : ''} ${className}`.trim();
    const contents = (
        <React.Fragment>
            <img src={`https://api.rotur.dev/groups/${encodeURIComponent(value)}/icon.jpg`} alt="" />
            <span>{value}</span>
        </React.Fragment>
    );
    const destination = `/groups/${encodeURIComponent(value)}`;
    if (!linked) {
        return <span className={tagClassName}>{contents}</span>;
    }
    return (
        <Link
            className={tagClassName}
            to={destination}
            onClick={event => event.stopPropagation()}
        >{contents}</Link>
    );
};

export default GroupTag;
