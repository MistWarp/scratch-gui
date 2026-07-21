import React, {useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import {Users, Trophy, Heart, Play} from 'lucide-react';
import rotur from '../rotur';
import api from '../api';
import useLatest from '../use-latest.js';
import Avatar from '../components/Avatar.jsx';
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

const Stat = ({board, person}) => {
    if (board === 'loves') {
        return (
            <span className={styles.stat}>
                <Heart size={16} />
                {(person.loves || 0).toLocaleString()} loves
            </span>
        );
    }
    if (board === 'views') {
        return (
            <span className={styles.stat}>
                <Play size={16} />
                {(person.views || 0).toLocaleString()} views
            </span>
        );
    }
    return (
        <span className={styles.stat}>
            <Users size={16} />
            {(person.follower_count || 0).toLocaleString()} followers
        </span>
    );
};

const Leaderboard = () => {
    const [board, setBoard] = useState('followers');
    const [users, setUsers] = useState(null);
    const [error, setError] = useState('');
    const beginLoad = useLatest();
    const active = BOARDS.find(item => item.key === board);

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
                setError('Could not load the leaderboard.');
            }));
    }, [board]);

    return (
        <main className={styles.page}>
            <h1>{active.title}</h1>
            <p className={styles.lead}>{active.lead}</p>
            <div className={styles.tabs}>
                {BOARDS.map(item => (
                    <button
                        key={item.key}
                        className={item.key === board ? styles.tabActive : styles.tab}
                        onClick={() => setBoard(item.key)}
                    >
                        {item.label}
                    </button>
                ))}
            </div>
            {users === null ? (
                <p className={styles.status}>Loading…</p>
            ) : error ? (
                <p className={styles.status}>{error}</p>
            ) : !users.length ? (
                <p className={styles.status}>No one on this leaderboard yet.</p>
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
                                            `Account #${person.index}` : 'Account number unavailable'}</span>
                                    ) : (
                                        <span>
                                            {`${person.projects || 0} shared `}
                                            {person.projects === 1 ? 'project' : 'projects'}
                                        </span>
                                    )}
                                    {board === 'followers' && person.status ? (
                                        <span>{person.status.status || person.status.presence}</span>
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
