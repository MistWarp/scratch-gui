import React, {useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import {Users, Trophy} from 'lucide-react';
import rotur from '../rotur';
import Avatar from '../components/Avatar.jsx';
import styles from './Leaderboard.module.css';

const PODIUM_CLASSES = [styles.podium1, styles.podium2, styles.podium3];

const Leaderboard = () => {
    const [users, setUsers] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        rotur.followerLeaderboard()
            .then(setUsers)
            .catch(() => {
                setUsers([]);
                setError('Could not load the leaderboard.');
            });
    }, []);

    return (
        <main className={styles.page}>
            <h1>Most followed users</h1>
            <p className={styles.lead}>The most followed public Rotur accounts.</p>
            {users === null ? (
                <p className={styles.status}>Loading…</p>
            ) : error ? (
                <p className={styles.status}>{error}</p>
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
                                    <span>{typeof person.index === 'number' ?
                                        `Account #${person.index}` : 'Account number unavailable'}</span>
                                    {person.status ? (
                                        <span>{person.status.status || person.status.presence}</span>
                                    ) : null}
                                </span>
                                <span className={styles.followers}>
                                    <Users size={16} />
                                    {person.follower_count.toLocaleString()} followers
                                </span>
                            </Link>
                        </li>
                    ))}
                </ol>
            )}
        </main>
    );
};

export default Leaderboard;
