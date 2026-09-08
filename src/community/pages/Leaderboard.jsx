import {getCommunityLocale} from '../locale.js';
import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
import React, {useEffect, useState} from 'react';
import {Link, useSearchParams} from 'react-router-dom';
import {Users, Trophy, Heart, Play} from 'lucide-react';
import rotur from '../rotur';
import api from '../api';
import useLatest from '../use-latest.js';
import SectionTabs from '../components/SectionTabs.jsx';
import Avatar from '../components/Avatar.jsx';
import Button from '../components/ui/Button.jsx';
import UserStatus from '../components/UserStatus.jsx';
import styles from './Leaderboard.module.css';

const PODIUM_CLASSES = [styles.podium1, styles.podium2, styles.podium3];

const BOARDS = [
    {
        key: 'followers',
        label: 'Followers',
        title: 'Most followed users',
        lead: 'The most followed public Rotur accounts.'
    },
    {
        key: 'loves',
        label: 'Loves',
        title: 'Most loved creators',
        lead: 'Creators with the most loves across all their shared projects.'
    },
    {
        key: 'views',
        label: 'Views',
        title: 'Most viewed creators',
        lead: 'Creators with the most views across all their shared projects.'
    }
];

export const leaderboardBoard = value => (BOARDS.some(item => item.key === value) ? value : 'followers');

export const normalizeLeaderboardParams = currentParams => {
    const next = new URLSearchParams(currentParams);
    const board = leaderboardBoard(next.get('board'));
    if (board === 'followers') next.delete('board');
    else next.set('board', board);
    return next;
};

const Stat = ({board, person}) => {
    const {text: communityText} = useCommunityText();
    if (board === 'loves') {
        return (
            <span className={styles.stat}>
                <Heart size={16} />
                {(person.loves || 0).toLocaleString(getCommunityLocale())}{communityText(' loves')}</span>
        );
    }
    if (board === 'views') {
        return (
            <span className={styles.stat}>
                <Play size={16} />
                {(person.views || 0).toLocaleString(getCommunityLocale())}{communityText(' views')}</span>
        );
    }
    return (
        <span className={styles.stat}>
            <Users size={16} />
            {(person.follower_count || 0).toLocaleString(getCommunityLocale())}{communityText(' followers')}</span>
    );
};

const Leaderboard = () => {
    const {text: communityText} = useCommunityText();
    const [searchParams, setSearchParams] = useSearchParams();
    const board = leaderboardBoard(searchParams.get('board'));
    const [users, setUsers] = useState(null);
    const [error, setError] = useState('');
    const [attempt, setAttempt] = useState(0);
    const beginLoad = useLatest();
    const active = BOARDS.find(item => item.key === board);

    useEffect(() => {
        const normalized = normalizeLeaderboardParams(searchParams);
        if (normalized.toString() !== searchParams.toString()) setSearchParams(normalized, {replace: true});
    }, [searchParams, setSearchParams]);

    useEffect(() => {
        const fresh = beginLoad();
        setUsers(null);
        setError('');
        const load = board === 'followers' ?
            rotur.followerLeaderboard() :
            api.leaderboard(board).then(data => data.users || []);
        load
            .then(fresh(setUsers))
            .catch(fresh(() => {
                setUsers([]);
                setError(communityText("Could not load the leaderboard."));
            }));
    }, [attempt, board, beginLoad]);

    const selectBoard = nextBoard => {
        const next = new URLSearchParams(searchParams);
        if (nextBoard === 'followers') next.delete('board');
        else next.set('board', nextBoard);
        setSearchParams(next);
    };

    return (
        <main className={styles.page}>
            <h1>{active.title}</h1>
            <p className={styles.lead}>{active.lead}</p>
            <SectionTabs
                items={BOARDS}
                value={board}
                onChange={selectBoard}
                className={styles.tabs}
                itemClassName={styles.tab}
                activeClassName={styles.tabActive}
                ariaLabel="Leaderboard type"
            />
            {users === null ? (
                <p className={styles.status}>{communityText('Loading…')}</p>
            ) : error ? (
                <div className={styles.status}>
                    <p>{error}</p>
                    <Button onClick={() => setAttempt(value => value + 1)}>{communityText('Try again')}</Button>
                </div>
            ) : !users.length ? (
                <p className={styles.status}>{communityText('No one on this leaderboard yet.')}</p>
            ) : (
                <ol className={styles.list}>
                    {users.map((person, position) => (
                        <li key={person.username}>
                            <Link
                                to={`/users/${person.username}`}
                                className={styles.row}
                            >
                                <span className={`${styles.rank} ${PODIUM_CLASSES[position] || ''}`}>
                                    {position < 3 ? <Trophy size={22} /> : position + 1}
                                </span>
                                <Avatar
                                    username={person.username}
                                    size={52}
                                />
                                <span className={styles.identity}>
                                    <strong>{person.username}</strong>
                                    {board === 'followers' ? (
                                        <span>{typeof person.index === 'number' ?
                                            communityText("Account #{value1}", {value1: person.index}) : communityText('Account number unavailable')}</span>
                                    ) : (
                                        <span>
                                            {communityText("{value1} shared ", {value1: person.projects || 0})}
                                            {person.projects === 1 ? communityText('project') : communityText('projects')}
                                        </span>
                                    )}
                                    {board === 'followers' && person.status ? (
                                        <UserStatus status={person.status} className={styles.userStatus} />
                                    ) : null}
                                </span>
                                <Stat
                                    board={board}
                                    person={person}
                                />
                            </Link>
                        </li>
                    ))}
                </ol>
            )}
        </main>
    );
};

export default Leaderboard;
