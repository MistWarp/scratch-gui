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
    recent: '/explore?sort=recent',
    following: '/posts'
};

const Bento = ({games}) => (
    <>
        {games.map((game, index) => (
            <GameCard
                key={game.id}
                className={index === 0 && games.length >= 5 ? `${styles.card} ${styles.lead}` : styles.card}
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
    const games = current === 'following' ? followingGames : lists[current];
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
                actions={<QuietLink to={LINKS[current]}>{text('Browse all games')}</QuietLink>}
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
                        className={styles.bento}
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
