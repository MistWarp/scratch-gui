import PropTypes from 'prop-types';
import React, {useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import api from '../api';
import rotur from '../rotur.js';
import {track} from '../analytics';
import {useCommunityIntl} from '../i18n.jsx';
import useAfterLogin from '../use-after-login.js';
import Avatar from './Avatar.jsx';
import Button from './ui/Button.jsx';
import styles from './HomeDiscovery.module.css';

const sameName = (a, b) => String(a).toLowerCase() === String(b).toLowerCase();

export const SuggestedCreators = ({viewerName, limit}) => {
    const {text} = useCommunityIntl();
    const [creators, setCreators] = useState(null);
    const [followed, setFollowed] = useState({});
    useEffect(() => {
        let active = true;
        Promise.all([
            api.leaderboard('loves'),
            viewerName ? rotur.myFollowing().catch(() => ({following: []})) : {following: []}
        ]).then(([board, follows]) => {
            if (!active) return;
            const following = follows.following || [];
            setCreators((board.users || [])
                .filter(creator => !sameName(creator.username, viewerName) &&
                    !following.some(name => sameName(name, creator.username)))
                .slice(0, limit));
        })
            .catch(() => active && setCreators([]));
        return () => {
            active = false;
        };
    }, [viewerName, limit]);
    const follow = useAfterLogin(async username => {
        setFollowed(current => ({...current, [username]: true}));
        try {
            await rotur.follow(username);
            track('suggested_creator_followed');
        } catch (e) {
            setFollowed(current => ({...current, [username]: false}));
        }
    }, 'follow');
    if (creators === null) {
        return (
            <ul
                className={styles.list}
                aria-hidden="true"
            >
                {Array.from({length: limit}, (_, index) => (
                    <li
                        key={index}
                        className={`${styles.row} ${styles.rowSkeleton}`}
                    ><span /><span /></li>
                ))}
            </ul>
        );
    }
    if (!creators.length) return null;
    return (
        <ul className={styles.list}>
            {creators.map(creator => (
                <li
                    key={creator.username}
                    className={styles.row}
                >
                    <Link to={`/users/${creator.username}`}><Avatar
                        username={creator.username}
                        size={36}
                    /></Link>
                    <Link
                        to={`/users/${creator.username}`}
                        className={styles.rowBody}
                    >
                        <strong>{creator.username}</strong>
                        <span>
                            {text('{value1} projects, {value2} hearts', {
                                value1: creator.projects,
                                value2: creator.loves
                            })}
                        </span>
                    </Link>
                    <Button
                        className={styles.rowAction}
                        size="small"
                        disabled={Boolean(followed[creator.username])}
                        onClick={() => follow(creator.username)}
                    >
                        {followed[creator.username] ? text('Following') : text('Follow')}
                    </Button>
                </li>
            ))}
        </ul>
    );
};

SuggestedCreators.propTypes = {
    limit: PropTypes.number,
    viewerName: PropTypes.string
};

SuggestedCreators.defaultProps = {
    limit: 5
};
