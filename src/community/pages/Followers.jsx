import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
import PropTypes from 'prop-types';
import React, {useEffect, useState} from 'react';
import {useParams, Link} from 'react-router-dom';
import {Users} from 'lucide-react';
import rotur from '../rotur';
import Avatar from '../components/Avatar.jsx';
import CardGrid from '../components/ui/CardGrid.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import StatusMessage from '../components/ui/StatusMessage.jsx';
import setPageMeta from '../page-meta.js';
import useLatest from '../use-latest.js';
import styles from './Followers.module.css';

const Followers = ({mode}) => {
    const {text: communityText} = useCommunityText();
    const {name} = useParams();
    const [followers, setFollowers] = useState(null);
    const [error, setError] = useState('');
    const [attempt, setAttempt] = useState(0);
    const beginLoad = useLatest();
    const following = mode === 'following';
    const label = following ? 'following' : 'followers';
    const title = following ?
        communityText('Users {name} follows', {name}) :
        communityText("{name}'s followers", {name});
    const emptyTitle = following ?
        communityText('{name} is not following anyone yet', {name}) :
        communityText('No followers yet');

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
            .catch(fresh(() => setError(following ?
                communityText('Could not load who this user follows.') :
                communityText('Could not load followers.'))));
    }, [name, beginLoad, attempt, following, label]);

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
            ) : followers === null ? (
                <StatusMessage />
            ) : followers.length ? (
                <CardGrid min={96}>
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
                </CardGrid>
            ) : (
                <EmptyState icon={Users} title={emptyTitle}>
                    {following ?
                        communityText('Profiles this user follows will show up here.') :
                        communityText('People who follow this profile will show up here.')}
                </EmptyState>
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
