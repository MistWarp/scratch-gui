import PropTypes from 'prop-types';
import React, {useEffect, useLayoutEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import {Plus} from 'lucide-react';
import api, {editorUrl, projectUrl} from '../api';
import {track} from '../analytics.js';
import {useCommunityIntl} from '../i18n.jsx';
import {getLastEditedProject} from '../../lib/mw/recent-projects';
import Button from './ui/Button.jsx';
import {DeviceBackup} from './HomeWorkspace.jsx';
import styles from './HomeHero.module.css';

const WALL_ANGLE = 5 * Math.PI / 180;
const WALL_GAP = 12;
const WALL_SPEED = 45;
const TILE_RATIO = 4 / 3;
const MIN_TILE = 48;

const wallLayout = (width, height) => {
    const sin = Math.sin(WALL_ANGLE);
    const cos = Math.cos(WALL_ANGLE);
    const band = Math.ceil((height * cos) + (width * sin)) + WALL_GAP;
    const length = Math.ceil((width * cos) + (height * sin));
    const target = width < 520 ? 112 : 150;
    const rows = Math.max(2, Math.round(band / (target + WALL_GAP)));
    const tile = Math.max(MIN_TILE, Math.floor((band - ((rows + 1) * WALL_GAP)) / rows));
    return {band, length, rows, tile};
};

const wallRows = (games, rows, perRow) => Array.from({length: rows}, (_, row) => {
    const own = games.filter((game, index) => index % rows === row);
    const source = own.length ? own : games;
    const filled = [];
    while (filled.length < perRow) filled.push(...source);
    return filled;
});

const useWallLayout = element => {
    const [layout, setLayout] = useState(null);
    useLayoutEffect(() => {
        if (!element) return;
        const measure = () => {
            const {width, height} = element.getBoundingClientRect();
            if (!width || !height) return;
            const next = wallLayout(width, height);
            setLayout(previous => (
                previous && previous.band === next.band && previous.length === next.length &&
                    previous.rows === next.rows && previous.tile === next.tile ? previous : next
            ));
        };
        measure();
        if (typeof ResizeObserver === 'undefined') return;
        const observer = new ResizeObserver(measure);
        observer.observe(element);
        return () => observer.disconnect();
    }, [element]);
    return layout;
};

const WallRow = ({games, tile}) => {
    const span = games.length * (Math.round(tile * TILE_RATIO) + WALL_GAP);
    return (
        <div
            className={styles.wallRow}
            style={{animationDuration: `${Math.round(span / WALL_SPEED)}s`}}
        >
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
};

WallRow.propTypes = {
    games: PropTypes.arrayOf(PropTypes.object).isRequired,
    tile: PropTypes.number.isRequired
};

const wallGames = projects => {
    const seen = new Set();
    return projects.filter(game => {
        if (!game.thumbUrl || game.projectShadowBanned || game.ownerShadowBanned || game.ownerBanned) return false;
        if (seen.has(game.id)) return false;
        seen.add(game.id);
        return true;
    });
};

const useWallGames = () => {
    const [games, setGames] = useState(null);
    useEffect(() => {
        let active = true;
        api.explore({sort: 'loved', limit: 50})
            .then(data => active && setGames(wallGames(data.projects || [])))
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
                    onClick={() => track('start_creating', {variant: 'home'})}
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
                    onClick={() => track('start_creating', {variant: 'home'})}
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
    const [hero, setHero] = useState(null);
    const layout = useWallLayout(hero);
    const empty = Array.isArray(games) && !games.length;
    if (loading && !(games && games.length)) return null;
    const perRow = layout ? Math.ceil(layout.length / (Math.round(layout.tile * TILE_RATIO) + WALL_GAP)) + 1 : 0;
    return (
        <section
            ref={setHero}
            className={empty ? `${styles.hero} ${styles.plain}` : styles.hero}
        >
            {games && games.length && layout ? (
                <div
                    className={styles.wall}
                    aria-hidden="true"
                    style={{
                        '--wall-band': `${layout.band}px`,
                        '--wall-length': `${layout.length}px`,
                        '--wall-tile': `${layout.tile}px`,
                        '--wall-gap': `${WALL_GAP}px`
                    }}
                >
                    {wallRows(games, layout.rows, perRow).map((row, index) => (
                        <WallRow
                            key={index}
                            games={row}
                            tile={layout.tile}
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
