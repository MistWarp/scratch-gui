import PropTypes from 'prop-types';
import React, {useEffect, useState} from 'react';
import {Gamepad2} from 'lucide-react';
import api from '../api';
import {useCommunityIntl} from '../i18n.jsx';
import GameCard, {CardSkeleton} from './GameCard.jsx';
import UnderlineTabs from './UnderlineTabs.jsx';
import {tabPanelProps} from './SectionTabs.jsx';
import QuietLink from './ui/QuietLink.jsx';
import SectionHeading from './ui/SectionHeading.jsx';
import StatusMessage from './ui/StatusMessage.jsx';
import styles from './HomeGames.module.css';

const COUNT = 9;

const LOADERS = {
    featured: () => Promise.all([
        api.featuredProject().catch(() => ({})),
        api.explore({sort: 'trending', limit: COUNT + 1})
    ]).then(([pick, trending]) => {
        const featured = pick && pick.project;
        const rest = (trending.projects || []).filter(game => !featured || game.id !== featured.id);
        return (featured ? [featured, ...rest] : rest).slice(0, COUNT);
    }),
    trending: () => api.explore({sort: 'trending', limit: COUNT}).then(data => data.projects || []),
    recent: () => api.explore({sort: 'recent', limit: COUNT}).then(data => data.projects || [])
};

const LINKS = {
    featured: '/explore',
    trending: '/explore',
    recent: '/explore?sort=recent'
};

const evenGrid = games => Boolean(games && games.length >= 3 && !(games.length % 2));

const fitGrid = games => {
    if (games.length >= COUNT) return games.slice(0, COUNT);
    if (games.length >= 6) return games.slice(0, 6);
    if (games.length >= 3) return games.slice(0, 3);
    return games;
};

const Bento = ({games}) => (
    <>
        {games.map((game, index) => (
            <GameCard
                key={game.id}
                className={index === 0 && games.length >= 3 ? `${styles.card} ${styles.lead}` : styles.card}
                style={{'--delay': `${index * 30}ms`}}
                project={game}
            />
        ))}
    </>
);

Bento.propTypes = {
    games: PropTypes.arrayOf(PropTypes.object).isRequired
};

const HomeGames = ({followingGames}) => {
    const {text} = useCommunityIntl();
    const [tab, setTab] = useState('featured');
    const [lists, setLists] = useState({});
    const [attempt, setAttempt] = useState(0);
    const hasFollowing = Boolean(followingGames && followingGames.length);
    const current = tab === 'following' && !hasFollowing ? 'featured' : tab;
    useEffect(() => {
        if (!hasFollowing && tab === 'following') setTab('featured');
    }, [hasFollowing, tab]);
    useEffect(() => {
        if (current === 'following' || Array.isArray(lists[current])) return () => {};
        let active = true;
        setLists(value => ({...value, [current]: null}));
        LOADERS[current]()
            .then(games => active && setLists(value => ({...value, [current]: games})))
            .catch(() => active && setLists(value => ({...value, [current]: false})));
        return () => {
            active = false;
        };
    }, [current, attempt]);
    const loaded = current === 'following' ? followingGames : lists[current];
    const games = Array.isArray(loaded) ? fitGrid(loaded) : loaded;
    const tabs = [
        {key: 'featured', label: text('Featured')},
        {key: 'trending', label: text('Trending')},
        {key: 'recent', label: text('New')},
        ...(hasFollowing ? [{key: 'following', label: text('Following')}] : [])
    ];
    return (
        <section
            className={styles.section}
            aria-labelledby="home-games-heading"
        >
            <SectionHeading
                id="home-games-heading"
                icon={Gamepad2}
                title={text('Games')}
                actions={LINKS[current] ? <QuietLink to={LINKS[current]}>{text('Browse all games')}</QuietLink> : null}
            />
            <UnderlineTabs
                className={styles.tabs}
                items={tabs}
                value={current}
                onChange={setTab}
                ariaLabel="Games"
                idPrefix="home-games"
            />
            <div
                {...tabPanelProps('home-games', current)}
                aria-busy={!games}
            >
                {games === false ? (
                    <StatusMessage
                        className={styles.status}
                        compact
                        error
                        onRetry={() => {
                            setLists(value => ({...value, [current]: null}));
                            setAttempt(value => value + 1);
                        }}
                    >{text("Couldn't load games.")}</StatusMessage>
                ) : null}
                {games && !games.length ? (
                    <p className={styles.empty}>{text('No games have been shared yet.')}</p>
                ) : null}
                {games === false || (games && !games.length) ? null : (
                    <div
                        key={current}
                        className={evenGrid(games) ? `${styles.bento} ${styles.even}` : styles.bento}
                    >
                        {games ? <Bento games={games} /> : Array.from({length: COUNT}, (_, index) => (
                            <div
                                key={index}
                                className={index === 0 ? `${styles.lead} ${styles.leadSkeleton}` : null}
                            >
                                <CardSkeleton />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
};

HomeGames.propTypes = {
    followingGames: PropTypes.arrayOf(PropTypes.object)
};

export default HomeGames;
