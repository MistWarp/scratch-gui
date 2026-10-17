import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
/* eslint-disable max-len */
import PropTypes from 'prop-types';
import React, {useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import {HardDrive, Plus} from 'lucide-react';
import api, {editorUrl} from '../api';
import {sameUser, timeAgo} from '../format';
import {STARTERS} from '../../lib/starter-projects';
import {getLastEditedProject} from '../../lib/mw/recent-projects';
import {MOVED_KEY} from '../../lib/account/frame-editor-data.js';
import ProjectThumbnail from './ProjectThumbnail.jsx';
import Button from './ui/Button.jsx';
import EmptyState from './ui/EmptyState.jsx';
import SectionHeading from './ui/SectionHeading.jsx';
import StatusMessage from './ui/StatusMessage.jsx';
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
