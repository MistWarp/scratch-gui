import PropTypes from 'prop-types';
import React from 'react';
import {BookmarkMinus, Clock3, Eye, EyeOff, MoreHorizontal} from 'lucide-react';
import {Link} from 'react-router-dom';
import {formatPlaytime, timeAgo} from '../format';
import {projectUrl} from '../api';
import ProjectThumbnail from './ProjectThumbnail.jsx';
import Button from './ui/Button.jsx';
import Dropdown, {DropdownItem} from './ui/Dropdown.jsx';
import styles from './MyStuffLibrary.module.css';

const playtimeLabel = project => {
    if (!(project.duration > 0)) return 'Not played yet';
    return `${formatPlaytime(project.duration, false)} played`;
};

const lastPlayedLabel = project => {
    if (!(project.lastPlayed > 0)) return '';
    const relative = timeAgo(project.lastPlayed);
    return relative === 'just now' ? 'Played just now' : `Last played ${relative} ago`;
};

const MyStuffLibrary = ({
    projects, total, loading, error, moreBusy, hasMore, actionBusy, actionError,
    onRetry, onLoadMore, onChangeVisibility, onRemove
}) => (
    <section className={styles.library}>
        <header className={styles.header}>
            <div>
                <h1>Library</h1>
                <p>Games you saved, with your playtime and public profile controls.</p>
            </div>
            {!loading && !error ? <span>{total.toLocaleString()} {total === 1 ? 'game' : 'games'}</span> : null}
        </header>
        {loading ? <p className={styles.status}>Loading your library…</p> : error ? (
            <div className={styles.status} role="alert">
                <strong>Could not load your library.</strong>
                <Button variant="secondary" onClick={onRetry}>Try again</Button>
            </div>
        ) : projects.length ? (
            <React.Fragment>
                <div className={styles.list}>
                    {projects.map(project => (
                        <article className={styles.row} key={project.id}>
                            <Link className={styles.project} to={projectUrl(project.id)}>
                                <ProjectThumbnail project={project} className={styles.thumb} lazy />
                                <span className={styles.details}>
                                    <strong>{project.title}</strong>
                                    <small>by {project.owner}</small>
                                </span>
                            </Link>
                            <span className={styles.playtime}>
                                <strong><Clock3 size={15} /> {playtimeLabel(project)}</strong>
                                {lastPlayedLabel(project) ? <small>{lastPlayedLabel(project)}</small> : null}
                            </span>
                            <span className={project.libraryPublic === false ? styles.hidden : styles.public}>
                                {project.libraryPublic === false ? <EyeOff size={14} /> : <Eye size={14} />}
                                {project.libraryPublic === false ? 'Hidden' : 'Public'}
                            </span>
                            <Dropdown
                                renderTrigger={({open, toggle}) => (
                                    <button
                                        type="button"
                                        className={styles.menuButton}
                                        aria-label={`Library options for ${project.title}`}
                                        aria-expanded={open}
                                        aria-haspopup="menu"
                                        onClick={toggle}
                                    ><MoreHorizontal size={19} /></button>
                                )}
                            >
                                {({close}) => (
                                    <React.Fragment>
                                        <DropdownItem
                                            disabled={Boolean(actionBusy)}
                                            onClick={() => {
                                                close(false);
                                                onChangeVisibility(project);
                                            }}
                                        >
                                            {project.libraryPublic === false ? <Eye size={15} /> : <EyeOff size={15} />}
                                            {project.libraryPublic === false ?
                                                'Show in public library' : 'Hide from public library'}
                                        </DropdownItem>
                                        <DropdownItem
                                            danger
                                            disabled={Boolean(actionBusy)}
                                            onClick={() => {
                                                close(false);
                                                onRemove(project);
                                            }}
                                        ><BookmarkMinus size={15} /> Remove from library</DropdownItem>
                                    </React.Fragment>
                                )}
                            </Dropdown>
                        </article>
                    ))}
                </div>
                {actionError ? <p className={styles.error} role="alert">{actionError}</p> : null}
                {hasMore ? (
                    <div className={styles.more}>
                        <Button variant="secondary" busy={moreBusy} busyLabel="Loading…" onClick={onLoadMore}>
                            Load more games
                        </Button>
                    </div>
                ) : null}
            </React.Fragment>
        ) : (
            <div className={styles.status}>
                <strong>Your library is empty.</strong>
                <span>Use &quot;Save to library&quot; on a project to add it here.</span>
            </div>
        )}
    </section>
);

MyStuffLibrary.propTypes = {
    projects: PropTypes.arrayOf(PropTypes.object),
    total: PropTypes.number,
    loading: PropTypes.bool,
    error: PropTypes.bool,
    moreBusy: PropTypes.bool,
    hasMore: PropTypes.bool,
    actionBusy: PropTypes.string,
    actionError: PropTypes.string,
    onRetry: PropTypes.func,
    onLoadMore: PropTypes.func,
    onChangeVisibility: PropTypes.func,
    onRemove: PropTypes.func
};

MyStuffLibrary.defaultProps = {
    projects: [],
    total: 0,
    loading: false,
    error: false,
    moreBusy: false,
    hasMore: false,
    actionBusy: '',
    actionError: '',
    onRetry: () => {},
    onLoadMore: () => {},
    onChangeVisibility: () => {},
    onRemove: () => {}
};

export {lastPlayedLabel, playtimeLabel};
export default MyStuffLibrary;
