import PropTypes from 'prop-types';
import React, {useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import {Plus} from 'lucide-react';
import api, {editorUrl, projectUrl} from '../api';
import {track} from '../analytics.js';
import {useCommunityIntl} from '../i18n.jsx';
import {getLastEditedProject} from '../../lib/mw/recent-projects';
import Button from './ui/Button.jsx';
import {DeviceBackup} from './HomeWorkspace.jsx';
import styles from './HomeHero.module.css';

const WALL_ROWS = 3;
const WALL_ROW_MIN = 10;

const wallRows = games => Array.from({length: WALL_ROWS}, (_, row) => {
    const offset = Math.floor((games.length * row) / WALL_ROWS);
    const rotated = [...games.slice(offset), ...games.slice(0, offset)];
    const own = games.length >= WALL_ROWS * 7 ? rotated.filter((game, index) => index % WALL_ROWS === 0) : rotated;
    const filled = [];
    while (filled.length < WALL_ROW_MIN) filled.push(...own);
    return filled;
});

const WallRow = ({games}) => (
    <div className={styles.wallRow}>
        {[...games, ...games].map((game, index) => (
            <Link
                key={index}
                to={projectUrl(game)}
                className={styles.wallTile}
                tabIndex={-1}
            >
                <img
                    src={game.thumbUrl}
                    alt=""
                    decoding="async"
                />
            </Link>
        ))}
    </div>
);

WallRow.propTypes = {
    games: PropTypes.arrayOf(PropTypes.object).isRequired
};

const useWallGames = () => {
    const [games, setGames] = useState(null);
    useEffect(() => {
        let active = true;
        api.explore({sort: 'loved', limit: 30})
            .then(data => active && setGames((data.projects || []).filter(game => game.thumbUrl)))
            .catch(() => active && setGames([]));
        return () => {
            active = false;
        };
    }, []);
    return games;
};

const SignedOutCard = ({login}) => {
    const {text} = useCommunityIntl();
    return (
        <>
            <h1>{text('Scratch Supercharged')}</h1>
            <p>{text('MistWarp is a free block-based editor for making games and sharing them with everyone.')}</p>
            <div className={styles.actions}>
                <Button
                    as="a"
                    variant="primary"
                    href={editorUrl()}
                    onClick={() => track('start_creating', {source: 'home'})}
                >
                    <Plus
                        size={16}
                        aria-hidden="true"
                    />
                    {text('Start creating')}
                </Button>
                <Button onClick={login}>{text('Sign in')}</Button>
            </div>
            <DeviceBackup className={styles.backup} />
        </>
    );
};

SignedOutCard.propTypes = {
    login: PropTypes.func
};

const SignedInCard = ({username}) => {
    const {text} = useCommunityIntl();
    const last = getLastEditedProject(username);
    return (
        <>
            <h1>{text('Welcome back, {username}', {username})}</h1>
            <div className={styles.actions}>
                <Button
                    as="a"
                    variant="primary"
                    href={editorUrl()}
                    onClick={() => track('start_creating', {source: 'home'})}
                >
                    <Plus
                        size={16}
                        aria-hidden="true"
                    />
                    {text('New project')}
                </Button>
                {last ? (
                    <Button
                        as="a"
                        href={editorUrl({platformProject: last.id})}
                    >
                        {text('Continue editing')}
                    </Button>
                ) : (
                    <Button
                        as={Link}
                        to="/mystuff"
                    >
                        {text('My stuff')}
                    </Button>
                )}
            </div>
        </>
    );
};

SignedInCard.propTypes = {
    username: PropTypes.string.isRequired
};

const HomeHero = ({loading, login, username}) => {
    const games = useWallGames();
    const empty = Array.isArray(games) && !games.length;
    if (loading && !(games && games.length)) return null;
    return (
        <section className={empty ? `${styles.hero} ${styles.plain}` : styles.hero}>
            {games && games.length ? (
                <div
                    className={styles.wall}
                    aria-hidden="true"
                >
                    {wallRows(games).map((row, index) => (
                        <WallRow
                            key={index}
                            games={row}
                        />
                    ))}
                </div>
            ) : null}
            {loading ? null : (
                <div className={styles.card}>
                    {username ? <SignedInCard username={username} /> : <SignedOutCard login={login} />}
                </div>
            )}
        </section>
    );
};

HomeHero.propTypes = {
    loading: PropTypes.bool,
    login: PropTypes.func,
    username: PropTypes.string
};

export default HomeHero;
