import React, {useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import rotur from '../rotur.js';
import styles from './GroupTag.module.css';

// rotur.js shares one lookup per person across every tag on the page.
const resolveTag = username => (
    typeof rotur.groupTag === 'function' ? rotur.groupTag(username) : Promise.resolve('')
);
const storeResolvedTag = (username, tag) => {
    if (typeof rotur.setGroupTag === 'function') rotur.setGroupTag(username, tag);
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
