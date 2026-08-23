import PropTypes from 'prop-types';
import React, {useEffect, useState} from 'react';
import {useParams, Link} from 'react-router-dom';
import {ArrowLeft} from 'lucide-react';
import rotur from '../rotur';
import Avatar from '../components/Avatar.jsx';
import Button from '../components/ui/Button.jsx';
import setPageMeta from '../page-meta.js';
import useLatest from '../use-latest.js';
import styles from './Followers.module.css';

const Followers = ({mode}) => {
    const {name} = useParams();
    const [followers, setFollowers] = useState(null);
    const [error, setError] = useState('');
    const [attempt, setAttempt] = useState(0);
    const beginLoad = useLatest();
    const following = mode === 'following';
    const label = following ? 'following' : 'followers';
    const emptyText = following ? `${name} is not following anyone yet.` : 'No followers yet.';

    useEffect(() => {
        setPageMeta({title: `${name}'s ${label}`, image: rotur.avatar(name, 256), card: 'summary'});
    }, [label, name]);

    useEffect(() => {
        const fresh = beginLoad();
        setFollowers(null);
        setError('');
        const request = following ? rotur.following(name) : rotur.followers(name);
        request
            .then(fresh(data => setFollowers(data[label] || [])))
            .catch(fresh(() => setError(`Could not load ${label}.`)));
    }, [name, beginLoad, attempt, following, label]);

    return (
        <main className={styles.page}>
            <Link
                to={`/users/${name}`}
                className={styles.backLink}
            >
                <ArrowLeft size={14} />
                {name}
            </Link>
            <h1>{name}&apos;s {label}</h1>
            {error ? (
                <p className={styles.status}>
                    {error}{' '}
                    <Button onClick={() => setAttempt(value => value + 1)}>Try again</Button>
                </p>
            ) : followers === null ? (
                <p className={styles.status}>Loading…</p>
            ) : followers.length ? (
                <div className={styles.grid}>
                    {followers.map(follower => (
                        <Link
                            key={follower}
                            to={`/users/${follower}`}
                            className={styles.cell}
                        >
                            <Avatar
                                username={follower}
                                size={72}
                            />
                            <span>{follower}</span>
                        </Link>
                    ))}
                </div>
            ) : (
                <p className={styles.status}>{emptyText}</p>
            )}
        </main>
    );
};

Followers.propTypes = {
    mode: PropTypes.oneOf(['followers', 'following'])
};

Followers.defaultProps = {
    mode: 'followers'
};

export default Followers;
