import PropTypes from 'prop-types';
import React from 'react';
import {ArrowLeft, Layers3, Trophy} from 'lucide-react';
import {Link} from 'react-router-dom';
import ProjectCard from './ProjectCard.jsx';
import SpaceCard from './SpaceCard.jsx';
import Button from './ui/Button.jsx';
import styles from './MyStuffSpaces.module.css';

const MyStuffSpaces = ({
    mode, spaces, libraryProjects, libraryTotal, libraryHasMore, libraryBusy, libraryMoreFailed,
    username, error, libraryOpen, onLibraryOpenChange, onRetry, onLoadMoreLibrary
}) => {
    if (error) {
        return (
            <p className={styles.status}>
                Could not load your {mode}. <Button variant="secondary" onClick={onRetry}>Try again</Button>
            </p>
        );
    }
    if (!spaces || (mode === 'collections' && !libraryProjects)) return <p className={styles.status}>Loading…</p>;

    if (mode === 'collections') {
        const collections = spaces.filter(space => space.kind === 'collection' && space.canManage);
        if (libraryOpen) {
            return (
                <section>
                    <header className={styles.header}>
                        <div>
                            <button
                                type="button"
                                className={styles.back}
                                onClick={() => onLibraryOpenChange(false)}
                            ><ArrowLeft size={15} /> Collections</button>
                            <h2>Library</h2>
                            <p>Projects you bought or saved for later.</p>
                        </div>
                    </header>
                    {libraryProjects.length ? (
                        <React.Fragment>
                            <div className={styles.projectGrid}>
                                {libraryProjects.map(project => <ProjectCard key={project.id} project={project} />)}
                            </div>
                            {libraryHasMore ? (
                                <div className={styles.loadMore}>
                                    <Button
                                        variant="secondary"
                                        busy={libraryBusy}
                                        busyLabel="Loading…"
                                        onClick={onLoadMoreLibrary}
                                    >Load more projects</Button>
                                </div>
                            ) : null}
                            {libraryMoreFailed ? (
                                <p className={styles.moreError}>Could not load more projects. Try again.</p>
                            ) : null}
                        </React.Fragment>
                    ) : <p className={styles.empty}>Your library is empty.</p>}
                </section>
            );
        }
        const library = {
            _id: 'library',
            kind: 'library',
            title: 'Library',
            description: 'Projects you bought or saved for later.',
            owner: username,
            projects: libraryProjects,
            projectCount: libraryTotal
        };
        return (
            <section>
                <header className={styles.header}>
                    <div>
                        <h2>Collections</h2>
                        <p>Your project collections, including your personal library.</p>
                    </div>
                    <Link to="/spaces?kind=collection">Browse collections</Link>
                </header>
                <div className={styles.spaceGrid}>
                    <SpaceCard space={library} onClick={() => onLibraryOpenChange(true)} />
                    {collections.map(collection => (
                        <SpaceCard key={collection._id} space={collection} to={`/spaces/${collection._id}`} />
                    ))}
                </div>
            </section>
        );
    }

    const studios = spaces.filter(space => space.kind === 'studio');
    const challenges = spaces.filter(space => space.kind === 'challenge');
    return (
        <section>
            <header className={styles.header}>
                <div>
                    <h2>Spaces</h2>
                    <p>Studios you curate or follow, and challenges you host, join, judge, or follow.</p>
                </div>
                <Link to="/spaces?kind=studio">Browse studios</Link>
            </header>
            <div className={styles.groupHeading}>
                <Layers3 size={18} /><h3>Studios</h3><span>{studios.length}</span>
            </div>
            {studios.length ? (
                <div className={styles.spaceGrid}>
                    {studios.map(studio => <SpaceCard key={studio._id} space={studio} to={`/spaces/${studio._id}`} />)}
                </div>
            ) : <p className={styles.empty}>You do not have any studios yet.</p>}
            <div className={styles.groupHeading}>
                <Trophy size={18} /><h3>Challenges</h3><span>{challenges.length}</span>
            </div>
            {challenges.length ? (
                <div className={styles.spaceGrid}>
                    {challenges.map(challenge => (
                        <SpaceCard key={challenge._id} space={challenge} to={`/spaces/${challenge._id}`} />
                    ))}
                </div>
            ) : <p className={styles.empty}>You have not joined or followed any challenges yet.</p>}
        </section>
    );
};

MyStuffSpaces.propTypes = {
    mode: PropTypes.oneOf(['collections', 'spaces']).isRequired,
    spaces: PropTypes.arrayOf(PropTypes.object),
    libraryProjects: PropTypes.arrayOf(PropTypes.object),
    libraryTotal: PropTypes.number,
    libraryHasMore: PropTypes.bool,
    libraryBusy: PropTypes.bool,
    libraryMoreFailed: PropTypes.bool,
    libraryOpen: PropTypes.bool,
    username: PropTypes.string.isRequired,
    error: PropTypes.bool,
    onRetry: PropTypes.func.isRequired,
    onLibraryOpenChange: PropTypes.func.isRequired,
    onLoadMoreLibrary: PropTypes.func
};

MyStuffSpaces.defaultProps = {
    spaces: null,
    libraryProjects: null,
    libraryTotal: 0,
    libraryHasMore: false,
    libraryBusy: false,
    libraryMoreFailed: false,
    libraryOpen: false,
    error: false,
    onLoadMoreLibrary: null
};

export default MyStuffSpaces;
