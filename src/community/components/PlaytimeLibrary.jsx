import PropTypes from 'prop-types';
import React from 'react';
import {Clock3, Gamepad2} from 'lucide-react';
import {Link} from 'react-router-dom';
import {projectUrl} from '../api';
import {formatPlaytime, timeAgo} from '../format';
import ProjectThumbnail from './ProjectThumbnail.jsx';
import Button from './ui/Button.jsx';
import styles from './PlaytimeLibrary.module.css';

const lastPlayed = value => {
    const timestamp = Number(value);
    if (!(timestamp > 0)) return '';
    const relative = timeAgo(timestamp);
    return relative === 'just now' ? 'Played just now' : `Played ${relative} ago`;
};

const PlaytimeLibrary = ({
    projects, total, visible, self, loading, error, moreBusy, hasMore, onRetry, onLoadMore
}) => {
    if (loading) return <p className={styles.status}>Loading game library…</p>;
    if (error) {
        return (
            <div className={styles.empty} role="alert">
                <strong>Could not load this game library.</strong>
                <Button variant="secondary" onClick={onRetry}>Try again</Button>
            </div>
        );
    }
    if (!visible && !self) {
        return (
            <div className={styles.empty}>
                <Gamepad2 size={36} />
                <strong>This game library is private.</strong>
                <span>This user has chosen not to share what they play.</span>
            </div>
        );
    }
    const libraryProjects = projects.filter(project => typeof project.libraryPublic === 'boolean');
    if (!libraryProjects.length) {
        return (
            <div className={styles.empty}>
                <Gamepad2 size={36} />
                <strong>No library games with playtime yet.</strong>
                <span>Games must be added to the library before their playtime appears here.</span>
            </div>
        );
    }
    return (
        <React.Fragment>
            <div className={styles.summary}>
                <strong>{total.toLocaleString()}</strong> {total === 1 ? 'library game' : 'library games'} played
                {!visible && self ? <span>Only visible to you</span> : null}
            </div>
            <div className={styles.list}>
                {libraryProjects.map((project, index) => (
                    <article className={styles.row} key={project.id}>
                        <span className={styles.rank}>{index + 1}</span>
                        <Link to={projectUrl(project.id)}><ProjectThumbnail project={project} className={styles.thumb} fallbackClassName={styles.thumb} lazy /></Link>
                        <span className={styles.details}>
                            <Link to={projectUrl(project.id)}><strong>{project.title}</strong></Link>
                            <small>by <a href={`/users/${encodeURIComponent(project.owner)}`}>{project.owner}</a></small>
                        </span>
                        <span className={styles.playtime}>
                            <strong><Clock3 size={15} /> {formatPlaytime(project.duration, false)}</strong>
                            {lastPlayed(project.lastPlayed) ? <small>{lastPlayed(project.lastPlayed)}</small> : null}
                        </span>
                    </article>
                ))}
            </div>
            {hasMore ? (
                <div className={styles.more}>
                    <Button variant="secondary" busy={moreBusy} busyLabel="Loading…" onClick={onLoadMore}>
                        Load more games
                    </Button>
                </div>
            ) : null}
        </React.Fragment>
    );
};

PlaytimeLibrary.propTypes = {
    projects: PropTypes.arrayOf(PropTypes.object),
    total: PropTypes.number,
    visible: PropTypes.bool,
    self: PropTypes.bool,
    loading: PropTypes.bool,
    error: PropTypes.bool,
    moreBusy: PropTypes.bool,
    hasMore: PropTypes.bool,
    onRetry: PropTypes.func,
    onLoadMore: PropTypes.func
};

PlaytimeLibrary.defaultProps = {
    projects: [],
    total: 0,
    visible: true,
    self: false,
    loading: false,
    error: false,
    moreBusy: false,
    hasMore: false,
    onRetry: () => {},
    onLoadMore: () => {}
};

export {lastPlayed};
export default PlaytimeLibrary;
