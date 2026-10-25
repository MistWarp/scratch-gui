/* eslint-disable max-len */
import React, {useEffect, useState} from 'react';
import api from '../api';
import rotur from '../rotur';
import {fetchFollowingFeed} from '../../lib/rotur/client.js';
import {useUser} from '../UserContext.jsx';
import HomeHero from '../components/HomeHero.jsx';
import HomeGames from '../components/HomeGames.jsx';
import {RailCreators, RailFollowing, RailNews, RailPlaying, RailProjects, RailStarters} from '../components/HomeRail.jsx';
import loadProjectPreview from '../project-preview.js';
import {track} from '../analytics.js';
import {normalizeFollowingPosts, timestampMs} from '../following-feed.js';
import styles from './Home.module.css';

const GAMES = 9;
const UPDATES = 6;

const newestFirst = (left, right) => timestampMs(right.created || right.timestamp) - timestampMs(left.created || left.timestamp);

export const loadFollowing = () => rotur.myFollowing().catch(() => ({following: []})).then(data => {
    const following = data.following || [];
    if (!following.length) return {following, games: [], updates: [], failed: false};
    return Promise.allSettled([api.activity(following), fetchFollowingFeed(40)]).then(([activity, posts]) => {
        const items = activity.status === 'fulfilled' ? activity.value.activity || [] : [];
        const seen = new Set();
        const shares = items
            .filter(item => item.type === 'share' && item.projectId && !seen.has(item.projectId) && seen.add(item.projectId))
            .sort(newestFirst)
            .slice(0, GAMES);
        const updates = [
            ...items.filter(item => item.type !== 'share').map(item => ({...item, timelineType: 'project-activity'})),
            ...(posts.status === 'fulfilled' ? normalizeFollowingPosts(posts.value) : [])
        ].sort(newestFirst).slice(0, UPDATES);
        return Promise.all(shares.map(item => loadProjectPreview({id: item.projectId}).catch(() => null)))
            .then(games => ({
                following,
                games: games.filter(Boolean),
                updates,
                failed: activity.status === 'rejected' && posts.status === 'rejected'
            }));
    });
});

export const useFollowing = viewerName => {
    const [state, setState] = useState(null);
    const [attempt, setAttempt] = useState(0);
    useEffect(() => {
        if (!viewerName) return () => {};
        let active = true;
        setState(null);
        loadFollowing()
            .then(result => active && setState({...result, viewerName}))
            .catch(() => active && setState({following: [], games: [], updates: [], failed: true, viewerName}));
        return () => {
            active = false;
        };
    }, [viewerName, attempt]);
    const current = state && state.viewerName === viewerName ? state : null;
    return [current, () => setAttempt(value => value + 1)];
};

const Home = () => {
    const {user, login, loading} = useUser();
    const viewerName = (user && user.username) || '';
    const signedIn = Boolean(!loading && user);
    const signedOut = !loading && !user;
    const [following, retryFollowing] = useFollowing(signedIn ? viewerName : '');
    useEffect(() => {
        track('home_view');
    }, []);
    return (
        <main className={styles.page}>
            <HomeHero
                loading={loading}
                login={login}
                username={signedIn ? viewerName : ''}
            />
            <div className={styles.board}>
                <HomeGames followingGames={signedIn && following ? following.games : null} />
                <aside className={styles.rail}>
                    {signedIn ? [
                        <RailProjects
                            key="projects"
                            username={viewerName}
                        />,
                        <RailPlaying
                            key="playing"
                            username={viewerName}
                        />,
                        <RailFollowing
                            key="following"
                            state={following}
                            viewerName={viewerName}
                            onRetry={retryFollowing}
                        />
                    ] : null}
                    {signedOut ? [
                        <RailStarters key="starters" />,
                        <RailCreators key="creators" />
                    ] : null}
                    <RailNews key="news" />
                </aside>
            </div>
        </main>
    );
};

export default Home;
