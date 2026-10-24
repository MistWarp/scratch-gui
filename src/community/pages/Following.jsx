import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
import React, {useEffect, useState} from 'react';
import {useParams, Link, Navigate} from 'react-router-dom';
import {Users} from 'lucide-react';
import rotur from '../rotur';
import {useUser} from '../UserContext.jsx';
import Avatar from '../components/Avatar.jsx';
import CardGrid from '../components/ui/CardGrid.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import StatusMessage from '../components/ui/StatusMessage.jsx';
import setPageMeta from '../page-meta.js';
import useLatest from '../use-latest.js';
import styles from './Following.module.css';

// Your own following is the one follow list Rotur gives out; anyone else's
// following page goes back to their profile, which shows the counts.
const Following = () => {
    const {text: communityText} = useCommunityText();
    const {name} = useParams();
    const {user, loading} = useUser();
    const [following, setFollowing] = useState(null);
    const [error, setError] = useState('');
    const [attempt, setAttempt] = useState(0);
    const beginLoad = useLatest();
    const isSelf = Boolean(user && user.username && user.username.toLowerCase() === name.toLowerCase());
    const title = communityText('Users {name} follows', {name});

    useEffect(() => {
        setPageMeta({title, image: rotur.avatar(name, 256), card: 'summary'});
    }, [title, name]);

    useEffect(() => {
        if (!isSelf) return;
        const fresh = beginLoad();
        setFollowing(null);
        setError('');
        rotur.myFollowing()
            .then(fresh(data => setFollowing(data.following || [])))
            .catch(fresh(() => setError(communityText('Could not load who this user follows.'))));
    }, [isSelf, beginLoad, attempt]);

    if (!loading && !isSelf) {
        return (<Navigate
            to={`/users/${name}`}
            replace
        />);
    }

    return (
        <main className={styles.page}>
            <PageHeader
                compact
                icon={Users}
                backTo={`/users/${name}`}
                backLabel={name}
                title={title}
            />
            {error ? (
                <StatusMessage error onRetry={() => setAttempt(value => value + 1)}>{error}</StatusMessage>
            ) : following === null ? (
                <CardGrid
                    min={96}
                    role="status"
                    aria-busy="true"
                >
                    <span className={styles.srOnly}>{communityText('Loading…')}</span>
                    {Array.from({length: 12}, (_, index) => (
                        <span
                            key={index}
                            className={styles.skeleton}
                            aria-hidden="true"
                        >
                            <span />
                            <span />
                        </span>
                    ))}
                </CardGrid>
            ) : following.length ? (
                <CardGrid min={96}>
                    {following.map(person => (
                        <Link
                            key={person}
                            to={`/users/${person}`}
                            className={styles.cell}
                        >
                            <Avatar
                                username={person}
                                size={72}
                            />
                            <span>{person}</span>
                        </Link>
                    ))}
                </CardGrid>
            ) : (
                <EmptyState icon={Users} title={communityText('{name} is not following anyone yet', {name})}>
                    {communityText('Profiles this user follows will show up here.')}
                </EmptyState>
            )}
        </main>
    );
};

export default Following;
