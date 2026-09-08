import {getCommunityLocale} from '../locale.js';
import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
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
    const {text: communityText} = useCommunityText();
    if (loading) return <p className={styles.status}>{communityText('Loading game library…')}</p>;
    if (error) {
        return (
            <div className={styles.empty} role="alert">
                <strong>{communityText('Could not load this game library.')}</strong>
                <Button variant="secondary" onClick={onRetry}>{communityText('Try again')}</Button>
            </div>
        );
    }
    if (!visible && !self) {
        return (
            <div className={styles.empty}>
                <Gamepad2 size={36} />
                <strong>{communityText('This game library is private.')}</strong>
                <span>{communityText('This user has chosen not to share what they play.')}</span>
            </div>
        );
    }
    const libraryProjects = projects.filter(project => typeof project.libraryPublic === 'boolean');
    if (!libraryProjects.length) {
        return (
            <div className={styles.empty}>
                <Gamepad2 size={36} />
                <strong>{communityText('No library games with playtime yet.')}</strong>
                <span>{communityText('Games must be added to the library before their playtime appears here.')}</span>
            </div>
        );
    }
    return (
        <React.Fragment>
            <div className={styles.summary}>
                <strong>{total.toLocaleString(getCommunityLocale())}</strong> {total === 1 ? communityText('library game') : communityText('library games')}{communityText(' played')}{!visible && self ? <span>{communityText('Only visible to you')}</span> : null}
            </div>
            <div className={styles.list}>
                {libraryProjects.map((project, index) => (
                    <article className={styles.row} key={project.id}>
                        <span className={styles.rank}>{index + 1}</span>
                        <Link to={projectUrl(project)}>
                            <ProjectThumbnail
                                project={project}
                                className={styles.thumb}
                                fallbackClassName={styles.thumb}
                                lazy
                            />
                        </Link>
                        <span className={styles.details}>
                            <Link to={projectUrl(project)}><strong>{project.title}</strong></Link>
                            <small>{communityText('by ')}<a href={`/users/${encodeURIComponent(project.owner)}`}>{project.owner}</a></small>
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
                    <Button variant="secondary" busy={moreBusy} busyLabel={communityText('Loading…')} onClick={onLoadMore}>{communityText('Load more games')}</Button>
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
