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
import ClawSidebar from '../components/ClawSidebar.jsx';
import PostComposer from '../components/PostComposer.jsx';
import SocialPost from '../components/SocialPost.jsx';
import styles from './Posts.module.css';

const PERIODS = [
    {key: '24', label: 'Popular today'},
    {key: '168', label: 'Popular this week'},
    {key: '720', label: 'Popular this month'},
    {key: '8760', label: 'Popular this year'}
];
const DEFAULT_PERIOD = '720';
const FOR_YOU = 'for-you';
const PAGE_SIZE = 40;
const FOR_YOU_PAGE = 20;
let forYouKnown = null;

const Posts = () => {
    const {text: communityText} = useCommunityText();
    const {user, login} = useUser();
    const navigate = useNavigate();
    const [params, setParams] = useSearchParams();
    const q = (params.get('q') || '').trim();
    const requestedPeriod = params.get('period');
    const hasPeriod = PERIODS.some(option => option.key === requestedPeriod);
    const period = hasPeriod ? requestedPeriod : DEFAULT_PERIOD;
    const [forYou, setForYou] = useState(forYouKnown);
    const mode = q ? 'search' : (hasPeriod || forYou === false ? 'top' : FOR_YOU);
    const [query, setQuery] = useState(q);
    const [posts, setPosts] = useState(null);
    const [cursor, setCursor] = useState(null);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState('');
    const [moreError, setMoreError] = useState('');
    const [attempt, setAttempt] = useState(0);
    const [composing, setComposing] = useState(false);
    const viewerName = user ? user.username : '';
    const visible = list => (Array.isArray(list) ? list.filter(post => post && post.id && post.user) : []);

    useEffect(() => setQuery(q), [q]);
    useEffect(() => {
        let active = true;
        setPosts(null);
        setCursor(null);
        setError('');
        setMoreError('');
        const request = mode === 'search' ? rotur.searchPosts(q, PAGE_SIZE) :
            mode === 'top' ? rotur.topPosts(PAGE_SIZE, Number(period)) :
                rotur.forYou({limit: FOR_YOU_PAGE});
        Promise.resolve(request).then(data => {
            if (!active) return;
            if (mode === FOR_YOU) {
                forYouKnown = Boolean(data);
                setForYou(forYouKnown);
                if (!data) return;
                setPosts(visible(data.items));
                setCursor(data.next_cursor);
                return;
            }
            setPosts(visible(data));
        }).catch(cause => {
            if (active) setError(cause.message || communityText('Could not load posts.'));
        });
        return () => {
            active = false;
        };
    }, [mode, q, period, attempt, viewerName]);

    const loadMore = async () => {
        if (!cursor || loadingMore) return;
        setLoadingMore(true);
        setMoreError('');
        try {
            const page = await rotur.forYou({cursor});
            if (!page) {
                setCursor(null);
                return;
            }
            setPosts(current => {
                const seen = new Set((current || []).map(post => post.id));
                return [...(current || []), ...visible(page.items).filter(post => !seen.has(post.id))];
            });
            setCursor(page.next_cursor);
        } catch (cause) {
            setMoreError(cause.message || communityText('Could not load posts.'));
        } finally {
            setLoadingMore(false);
        }
    };

    let emptyText = communityText('Nobody has posted much in this time range. Try a longer one.');
    if (mode === 'search') emptyText = communityText('Try a different search term.');
    else if (mode === FOR_YOU) emptyText = communityText('Nothing new from the last week. Try Popular this month.');

    const feedOptions = [
        ...(forYou === false ? [] : [{value: FOR_YOU, label: communityText('For you')}]),
        ...PERIODS.map(option => ({value: option.key, label: communityText(option.label)}))
    ];

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
                lead={mode === FOR_YOU ?
                    communityText('Posts from claw, the Rotur social network, picked for you.') :
                    communityText('Popular posts from claw, the Rotur social network.')}
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
                        ariaLabel={communityText('Show posts')}
                        className={styles.period}
                        value={mode === FOR_YOU ? FOR_YOU : period}
                        onChange={value => setParam('period', value === FOR_YOU ? '' : value)}
                        options={feedOptions}
                    />
                )}
            </ExploreHeader>
            <div className={styles.layout}>
                <div className={styles.feed}>
                    {error ? (
                        <StatusMessage error onRetry={() => setAttempt(value => value + 1)}>{error}</StatusMessage>
                    ) : null}
                    {!posts && !error ? <StatusMessage>{communityText('Loading posts…')}</StatusMessage> : null}
                    {posts && !posts.length ? (
                        <EmptyState icon={MessageSquare} title={communityText('No posts found')}>
                            {emptyText}
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
                    {moreError ? <StatusMessage error onRetry={loadMore}>{moreError}</StatusMessage> : null}
                    {posts && cursor && mode === FOR_YOU ? (
                        <Button className={styles.more} busy={loadingMore} onClick={loadMore}>
                            {communityText('Show more posts')}
                        </Button>
                    ) : null}
                </div>
                {user || forYou ? <ClawSidebar user={user} /> : null}
            </div>
        </main>
    );
};

export default Posts;
