import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
/* eslint-disable max-len */
import PropTypes from 'prop-types';
import React, {useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import {HardDrive, Plus} from 'lucide-react';
import api, {editorUrl, projectUrl} from '../api';
import {formatDate, sameUser, timeAgo} from '../format';
import {STARTERS} from '../../lib/starter-projects';
import {getLastEditedProject} from '../../lib/mw/recent-projects';
import {MOVED_KEY} from '../../lib/account/frame-editor-data.js';
import ProjectThumbnail from './ProjectThumbnail.jsx';
import Button from './ui/Button.jsx';
import EmptyState from './ui/EmptyState.jsx';
import SectionHeading from './ui/SectionHeading.jsx';
import StatusMessage from './ui/StatusMessage.jsx';
import {track} from '../analytics';
import styles from './HomeWorkspace.module.css';

const editorDataMoved = () => {
    try {
        return Boolean(localStorage.getItem(MOVED_KEY));
    } catch (e) {
        return false;
    }
};

export const DeviceBackup = ({className}) => {
    const {text: communityText} = useCommunityText();
    const [backup, setBackup] = useState(null);
    useEffect(() => {
        let active = true;
        if (editorDataMoved()) return;
        import('../../lib/api/restore-points').then(({default: backups}) => backups.getAllRestorePoints())
            .then(({restorePoints}) => {
                if (active) setBackup(restorePoints[0] || null);
            })
            .catch(() => {});
        return () => {
            active = false;
        };
    }, []);
    if (!backup) return null;
    return (
        <p className={`${styles.backup} ${className || ''}`}>
            <HardDrive
                size={15}
                aria-hidden="true"
            />
            <span>
                {communityText('{value1}, {value2}, on this browser only', {value1: backup.title, value2: timeAgo(backup.created * 1000)})}
            </span>
            <a
                className={styles.quietLink}
                href={editorUrl({restore: backup.id})}
            >
                {communityText('Open backup')}
            </a>
        </p>
    );
};

DeviceBackup.propTypes = {
    className: PropTypes.string
};

const ResumeCard = ({project}) => {
    const {text: communityText} = useCommunityText();
    const saved = timeAgo(project.edited || project.created);
    return (
        <a
            className={styles.card}
            href={editorUrl({platformProject: project.id})}
        >
            <div className={styles.cardThumb}>
                <ProjectThumbnail
                    project={project}
                    fallbackClassName={styles.thumbFallback}
                />
            </div>
            <div className={styles.cardText}>
                <h3>{project.title}</h3>
                <p>
                    {project.shared ?
                        communityText('Shared, saved {value1}', {value1: saved}) :
                        communityText('Draft, saved {value1}', {value1: saved})}
                </p>
            </div>
            <Button
                as="span"
                size="small"
                className={styles.cardAction}
            >
                {communityText('Open')}
            </Button>
        </a>
    );
};

ResumeCard.propTypes = {
    project: PropTypes.shape({
        created: PropTypes.number,
        edited: PropTypes.number,
        id: PropTypes.string,
        shared: PropTypes.bool,
        title: PropTypes.string
    }).isRequired
};

export const ContinueProjects = ({username, onProjectCount, welcome}) => {
    const {text: communityText} = useCommunityText();
    const [result, setResult] = useState({username: '', projects: null, failed: false});
    const [attempt, setAttempt] = useState(0);
    useEffect(() => {
        if (!username) return () => {};
        let active = true;
        setResult({username, projects: null, failed: false});
        const last = getLastEditedProject(username);
        const recent = last ? api.getProject(last.id).then(data => data.project).catch(() => null) : Promise.resolve(null);
        Promise.allSettled([api.myProjectPage(username, {limit: 12}), recent]).then(([page, edited]) => {
            if (!active) return;
            const projects = page.status === 'fulfilled' ? (page.value.projects || []).slice() : [];
            projects.sort((a, b) => Number(b.edited || b.created || 0) - Number(a.edited || a.created || 0));
            if (edited.status === 'fulfilled' && edited.value && sameUser(edited.value.owner, username)) {
                projects.unshift(edited.value);
            }
            const seen = new Set();
            const owned = projects.filter(project => {
                if (!sameUser(project.owner, username) || seen.has(project.id) || project.hasContent === false) return false;
                seen.add(project.id);
                return true;
            }).slice(0, 3);
            setResult({username, projects: owned, failed: page.status === 'rejected'});
            if (page.status === 'fulfilled' && onProjectCount) {
                onProjectCount({username,
                    total: Number.isFinite(page.value.total) ?
                        page.value.total : (page.value.projects || []).length});
            }
        });
        return () => {
            active = false;
        };
    }, [username, attempt, onProjectCount]);
    if (!username) return null;
    const current = result.username === username ? result : {projects: null, failed: false};
    const retry = () => setAttempt(value => value + 1);
    return (
        <section
            className={styles.section}
            aria-labelledby="home-continue-heading"
        >
            <SectionHeading
                id="home-continue-heading"
                title={welcome ? communityText('Welcome to MistWarp, {value1}', {value1: username}) : communityText('Continue editing')}
                actions={(
                    <>
                        <Link
                            to="/mystuff?section=projects"
                            className={styles.quietLink}
                        >
                            {communityText('All your projects')}
                        </Link>
                        <Button
                            as="a"
                            size="small"
                            href={editorUrl()}
                        >
                            <Plus
                                size={15}
                                aria-hidden="true"
                            />
                            {communityText('New project')}
                        </Button>
                    </>
                )}
            />
            {current.projects === null ? (
                <div className={styles.cards}>
                    {[0, 1, 2].map(index => (<div
                        key={index}
                        className={styles.cardSkeleton}
                    />))}
                </div>
            ) : null}
            {current.failed ? (
                <StatusMessage
                    compact
                    error
                    onRetry={retry}
                >{communityText('Could not load your projects.')}</StatusMessage>
            ) : null}
            {current.projects && !current.projects.length && !current.failed ? (
                <EmptyState
                    compact
                    title={communityText('Your first project starts here')}
                    action={<Button
                        as="a"
                        variant="primary"
                        href={editorUrl()}
                    >{communityText('Start creating')}</Button>}
                >
                    {communityText('Try a starter below. Save it to MistWarp and continue here next time.')}
                </EmptyState>
            ) : null}
            {current.projects && current.projects.length ? (
                <div className={styles.cards}>
                    {current.projects.map(project => (
                        <ResumeCard
                            key={project.id}
                            project={project}
                        />
                    ))}
                </div>
            ) : null}
            <DeviceBackup />
        </section>
    );
};

ContinueProjects.propTypes = {
    onProjectCount: PropTypes.func,
    username: PropTypes.string,
    welcome: PropTypes.bool
};

export const StarterGallery = ({children}) => {
    const {text: communityText} = useCommunityText();
    return (
        <section
            className={styles.section}
            id="starters"
            aria-labelledby="starter-heading"
        >
            <SectionHeading
                id="starter-heading"
                title={communityText('Starter projects')}
                lead={communityText('Run a project, change one thing, and save your own version. No sign-in needed to try.')}
                actions={(
                    <a
                        className={styles.quietLink}
                        href={editorUrl()}
                    >
                        {communityText('Start a blank project')}
                    </a>
                )}
            />
            <div className={styles.cards}>
                {STARTERS.map(starter => (
                    <a
                        key={starter.id}
                        className={`${styles.card} ${styles.starter}`}
                        href={editorUrl({starter: starter.id})}
                    >
                        <div className={styles.cardText}>
                            <p className={styles.kind}>{starter.kind}</p>
                            <h3>{starter.title}</h3>
                            <p>{starter.description}</p>
                        </div>
                        <Button
                            as="span"
                            size="small"
                            className={styles.cardAction}
                        >
                            {communityText('Open')}
                        </Button>
                    </a>
                ))}
            </div>
            {children}
        </section>
    );
};

StarterGallery.propTypes = {
    children: PropTypes.node
};

export const runningChallenges = (spaces, now = Date.now()) => spaces
    .filter(space => Number(space.startsAt) <= now && Number(space.endsAt) > now && !space.resultsPublishedAt)
    .sort((a, b) => (Number(b.participantCount) || 0) - (Number(a.participantCount) || 0) || Number(a.endsAt) - Number(b.endsAt));

export const selectActiveChallenge = (spaces, now = Date.now()) => runningChallenges(spaces, now)[0];

export const WINNER_SHOWCASE_MS = 14 * 86400000;

export const selectRecentWinner = (spaces, now = Date.now()) => spaces
    .filter(space => space.winner && space.winner.id && Number(space.resultsPublishedAt) >= now - WINNER_SHOWCASE_MS)
    .sort((a, b) => Number(b.resultsPublishedAt) - Number(a.resultsPublishedAt))[0];

const JamRow = ({to, image, title, meta, action, onOpen}) => (
    <li className={styles.row}>
        <Link
            className={styles.rowThumb}
            to={to}
            tabIndex={-1}
            aria-hidden="true"
            onClick={onOpen}
        >
            {image}
        </Link>
        <div className={styles.rowText}>
            <h3><Link
                to={to}
                onClick={onOpen}
            >{title}</Link></h3>
            <p>{meta}</p>
        </div>
        <Button
            as={Link}
            size="small"
            to={to}
            className={styles.rowAction}
            onClick={onOpen}
        >{action}</Button>
    </li>
);

JamRow.propTypes = {
    action: PropTypes.node,
    image: PropTypes.node,
    meta: PropTypes.node,
    onOpen: PropTypes.func,
    title: PropTypes.node,
    to: PropTypes.string
};

export const Jams = ({limit}) => {
    const {text: communityText} = useCommunityText();
    const [state, setState] = useState(null);
    useEffect(() => {
        let active = true;
        const now = Date.now();
        Promise.allSettled([
            api.spaces({kind: 'challenge', limit: 100, endsAfter: now, startsBefore: now}),
            api.spaces({kind: 'challenge', limit: 5, resultsAfter: now - WINNER_SHOWCASE_MS})
        ]).then(([running, finished]) => {
            if (!active) return;
            setState({
                running: running.status === 'fulfilled' ? runningChallenges(running.value.spaces || []).slice(0, limit) : [],
                winner: finished.status === 'fulfilled' ? selectRecentWinner(finished.value.spaces || []) || null : null,
                failed: running.status === 'rejected' && finished.status === 'rejected'
            });
        });
        return () => {
            active = false;
        };
    }, [limit]);
    const open = () => track('challenge_open', {source: 'home'});
    return (
        <section
            className={styles.panel}
            aria-labelledby="home-jams-heading"
        >
            <SectionHeading
                id="home-jams-heading"
                title={communityText('Jams and challenges')}
                actions={<Link
                    className={styles.quietLink}
                    to="/spaces?kind=challenge"
                >{communityText('See all')}</Link>}
            />
            {state === null ? <div className={styles.listSkeleton} /> : null}
            {state && state.failed ? <StatusMessage compact>{communityText("Couldn't load challenges.")}</StatusMessage> : null}
            {state && !state.failed && !state.running.length && !state.winner ? (
                <p className={styles.empty}>
                    {communityText('No jams are running right now.')}
                    {' '}
                    <Link
                        className={styles.quietLink}
                        to="/spaces?kind=challenge"
                    >{communityText('See past challenges')}</Link>
                </p>
            ) : null}
            {state && (state.running.length || state.winner) ? (
                <ul className={styles.list}>
                    {state.running.map(space => {
                        const joined = Number(space.participantCount) || 0;
                        return (
                            <JamRow
                                key={space._id}
                                to={`/spaces/${space._id}`}
                                onOpen={open}
                                image={space.thumbnailUrl ? <img
                                    src={space.thumbnailUrl}
                                    alt=""
                                    loading="lazy"
                                /> : <span className={styles.thumbFallback}>{(space.title || '?').slice(0, 1)}</span>}
                                title={space.title}
                                meta={joined === 1 ?
                                    communityText('Ends {value1}, 1 creator has joined', {value1: formatDate(space.endsAt)}) :
                                    communityText('Ends {value1}, {value2} creators have joined', {value1: formatDate(space.endsAt), value2: joined})}
                                action={communityText('Enter')}
                            />
                        );
                    })}
                    {state.winner ? (
                        <JamRow
                            to={projectUrl(state.winner.winner)}
                            onOpen={() => track('challenge_winner_open', {source: 'home'})}
                            image={<ProjectThumbnail
                                project={state.winner.winner}
                                fallbackClassName={styles.thumbFallback}
                                lazy
                            />}
                            title={state.winner.winner.title}
                            meta={communityText('Won {value1}, by {value2}', {value1: state.winner.title, value2: state.winner.winner.owner})}
                            action={communityText('Play')}
                        />
                    ) : null}
                </ul>
            ) : null}
        </section>
    );
};

Jams.propTypes = {
    limit: PropTypes.number
};

Jams.defaultProps = {
    limit: 3
};
