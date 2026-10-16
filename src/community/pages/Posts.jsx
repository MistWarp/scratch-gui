import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
import React, {useEffect, useState} from 'react';
import {useNavigate, useSearchParams} from 'react-router-dom';
import {MessageSquare, PenSquare} from 'lucide-react';
import rotur from '../rotur.js';
import {postUrl} from '../following-feed.js';
import {useUser} from '../UserContext.jsx';
import Button from '../components/ui/Button.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Modal from '../components/ui/Modal.jsx';
import SelectMenu from '../components/ui/SelectMenu.jsx';
import StatusMessage from '../components/ui/StatusMessage.jsx';
import ExploreHeader, {ExploreSearch} from '../components/ExploreHeader.jsx';
import PostComposer from '../components/PostComposer.jsx';
import SocialPost from '../components/SocialPost.jsx';
import styles from './Posts.module.css';

const PERIODS = [
    {key: '24', label: 'Today'},
    {key: '168', label: 'This week'},
    {key: '720', label: 'This month'},
    {key: '8760', label: 'This year'}
];
const DEFAULT_PERIOD = '720';
const PAGE_SIZE = 40;

const Posts = () => {
    const {text: communityText} = useCommunityText();
    const {user, login} = useUser();
    const navigate = useNavigate();
    const [params, setParams] = useSearchParams();
    const q = (params.get('q') || '').trim();
    const requestedPeriod = params.get('period');
    const period = PERIODS.some(option => option.key === requestedPeriod) ? requestedPeriod : DEFAULT_PERIOD;
    const [query, setQuery] = useState(q);
    const [posts, setPosts] = useState(null);
    const [error, setError] = useState('');
    const [attempt, setAttempt] = useState(0);
    const [composing, setComposing] = useState(false);

    useEffect(() => setQuery(q), [q]);
    useEffect(() => {
        let active = true;
        setPosts(null);
        setError('');
        const request = q ? rotur.searchPosts(q, PAGE_SIZE) : rotur.topPosts(PAGE_SIZE, Number(period));
        Promise.resolve(request).then(data => {
            if (active) setPosts(Array.isArray(data) ? data.filter(post => post && post.id && post.user) : []);
        }).catch(cause => {
            if (active) setError(cause.message || communityText('Could not load posts.'));
        });
        return () => {
            active = false;
        };
    }, [q, period, attempt]);

    const setParam = (key, value) => {
        const next = new URLSearchParams(params);
        if (value) next.set(key, value);
        else next.delete(key);
        setParams(next);
    };

    return (
        <main className={styles.page}>
            {composing && user ? (
                <Modal icon={PenSquare} title={communityText('New post')} onClose={() => setComposing(false)}>
                    <PostComposer
                        bare
                        user={user}
                        onPosted={post => {
                            setComposing(false);
                            if (post && post.id) navigate(postUrl(post.id));
                        }}
                    />
                </Modal>
            ) : null}
            <ExploreHeader
                active="posts"
                lead={communityText('Popular posts from claw, the Rotur social network.')}
                actions={(
                    <Button variant="primary" onClick={() => (user ? setComposing(true) : login())}>
                        <PenSquare size={16} />
                        {communityText('New post')}
                    </Button>
                )}
            >
                <ExploreSearch
                    ariaLabel={communityText('Search posts')}
                    value={query}
                    onChange={setQuery}
                    onSubmit={value => setParam('q', value.trim())}
                />
                {q ? null : (
                    <SelectMenu
                        align="right"
                        ariaLabel={communityText('Time range')}
                        className={styles.period}
                        value={period}
                        onChange={value => setParam('period', value === DEFAULT_PERIOD ? '' : value)}
                        options={PERIODS.map(option => ({value: option.key, label: communityText(option.label)}))}
                    />
                )}
            </ExploreHeader>
            {error ? (
                <StatusMessage error onRetry={() => setAttempt(value => value + 1)}>{error}</StatusMessage>
            ) : null}
            {!posts && !error ? <StatusMessage>{communityText('Loading posts…')}</StatusMessage> : null}
            {posts && !posts.length ? (
                <EmptyState icon={MessageSquare} title={communityText('No posts found')}>
                    {q ?
                        communityText('Try a different search term.') :
                        communityText('Nobody has posted much in this time range. Try a longer one.')}
                </EmptyState>
            ) : null}
            {posts && posts.length ? (
                <div className={styles.list}>
                    {posts.map(post => (
                        <SocialPost
                            key={post.id}
                            initialPost={post}
                            onDelete={id => setPosts(current => current.filter(item => item.id !== id))}
                        />
                    ))}
                </div>
            ) : null}
        </main>
    );
};

export default Posts;
