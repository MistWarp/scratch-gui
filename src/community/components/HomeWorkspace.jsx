import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
/* eslint-disable max-len */
import React, {useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import {ArrowRight, Cloud, Gamepad2, HardDrive, MousePointer2, Sparkles, Trophy} from 'lucide-react';
import api, {editorUrl} from '../api';
import {formatDate, sameUser, timeAgo} from '../format';
import {STARTERS} from '../../lib/starter-projects';
import {getLastEditedProject} from '../../lib/mw/recent-projects';
import ProjectThumbnail from './ProjectThumbnail.jsx';
import CardGrid from './ui/CardGrid.jsx';
import EmptyState from './ui/EmptyState.jsx';
import Notice from './ui/Notice.jsx';
import PageHeader from './ui/PageHeader.jsx';
import SectionHeading from './ui/SectionHeading.jsx';
import StatusMessage from './ui/StatusMessage.jsx';
import {track} from '../analytics';
import fog from '../../lib/default-project/fog.svg';
import styles from './HomeWorkspace.module.css';

export const ContinueProjects = ({username, onProjectCount}) => {
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
        <section className={styles.section} aria-label={communityText('Continue editing')}>
            <PageHeader
                compact
                title={communityText('Continue editing')}
                actions={(
                    <Link to="/mystuff?section=projects" className={styles.link}>
                        {communityText('All your projects')}
                        <ArrowRight size={16} />
                    </Link>
                )}
            />
            {current.projects === null ? <StatusMessage compact>{communityText('Loading your projects…')}</StatusMessage> : null}
            {current.failed ? (
                <StatusMessage compact error onRetry={retry}>{communityText('Could not load your projects.')}</StatusMessage>
            ) : null}
            {current.projects && !current.projects.length && !current.failed ? (
                <EmptyState compact icon={Cloud} title={communityText('Your first project starts here')}>
                    {communityText('Try a starter below. Save it to MistWarp and continue here next time.')}
                </EmptyState>
            ) : null}
            {current.projects && current.projects.length ? (
                <CardGrid min={300}>
                    {current.projects.map((project, index) => {
                        const saved = timeAgo(project.edited || project.created);
                        return (
                            <a className={styles.resumeCard} key={project.id} href={editorUrl({platformProject: project.id})}>
                                <ProjectThumbnail project={project} className={styles.thumbnail} fallbackClassName={styles.thumbnailFallback} />
                                <div>
                                    <span className={styles.meta}>
                                        {project.shared ?
                                            communityText('Shared · Saved {value1}', {value1: saved}) :
                                            communityText('Draft · Saved {value1}', {value1: saved})}
                                    </span>
                                    <h2>{project.title}</h2>
                                    <span className={index === 0 ? styles.continueButton : styles.continueLink}>
                                        {communityText('Continue editing')}
                                        <ArrowRight size={16} />
                                    </span>
                                </div>
                            </a>
                        );
                    })}
                </CardGrid>
            ) : null}
        </section>
    );
};

export const DeviceBackup = () => {
    const {text: communityText} = useCommunityText();
    const [backup, setBackup] = useState(null);
    useEffect(() => {
        let active = true;
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
        <Notice
            icon={HardDrive}
            className={styles.backup}
            title={communityText('Device backup available')}
            action={(
                <a className={styles.link} href={editorUrl({restore: backup.id})}>
                    {communityText('Open backup')}
                    <ArrowRight size={16} />
                </a>
            )}
        >
            {communityText('{value1} · {value2} · This browser only', {value1: backup.title, value2: timeAgo(backup.created * 1000)})}
        </Notice>
    );
};

const STARTER_ICONS = {clicker: MousePointer2, explorer: Gamepad2, animation: Sparkles};

export const StarterGallery = () => {
    const {text: communityText} = useCommunityText();
    return (
        <section className={styles.section} id="starters" aria-labelledby="starter-heading">
            <SectionHeading
                id="starter-heading"
                icon={Sparkles}
                title={communityText('Starter projects')}
                lead={communityText('Run a project, change one thing, and save your own version. No sign-in needed to try.')}
                actions={(
                    <a className={styles.link} href={editorUrl()}>
                        {communityText('Start a blank project')}
                        <ArrowRight size={16} />
                    </a>
                )}
            />
            <CardGrid min={300}>
                {STARTERS.map(starter => {
                    const Icon = STARTER_ICONS[starter.id];
                    return (
                        <a key={starter.id} className={styles.starterCard} href={editorUrl({starter: starter.id})}>
                            <div className={`${styles.starterArt} ${styles[starter.accent]}`}>
                                <span className={styles.kind}><Icon size={16} />{starter.kind}</span>
                                <img src={fog} alt="" />
                                <span className={styles.controls}>{starter.control}</span>
                            </div>
                            <div className={styles.starterBody}>
                                <h3>{starter.title}</h3>
                                <p>{starter.description}</p>
                                <span>
                                    {communityText('Try this starter')}
                                    <ArrowRight size={16} />
                                </span>
                            </div>
                        </a>
                    );
                })}
            </CardGrid>
        </section>
    );
};

export const selectActiveChallenge = (spaces, now = Date.now()) => spaces
    .filter(space => Number(space.startsAt) <= now && Number(space.endsAt) > now && !space.resultsPublishedAt)
    .sort((a, b) => (Number(b.participantCount) || 0) - (Number(a.participantCount) || 0) || Number(a.endsAt) - Number(b.endsAt))[0];

export const ActiveChallenge = () => {
    const {text: communityText} = useCommunityText();
    const [challenge, setChallenge] = useState(null);
    useEffect(() => {
        let active = true;
        api.spaces({kind: 'challenge', limit: 100, endsAfter: Date.now(), startsBefore: Date.now()})
            .then(data => {
                if (active) setChallenge(selectActiveChallenge(data.spaces || []));
            })
            .catch(() => {});
        return () => {
            active = false;
        };
    }, []);
    if (!challenge) return null;
    const joined = Number(challenge.participantCount) || 0;
    const summary = [
        challenge.theme ? communityText('Theme: {value1}.', {value1: challenge.theme}) : '',
        communityText('Submissions close {value1}.', {value1: formatDate(challenge.endsAt)}),
        joined === 1 ? communityText('1 creator has joined.') : communityText('{value1} creators have joined.', {value1: joined})
    ].filter(Boolean).join(' ');
    return (
        <section className={styles.challenge}>
            <Trophy size={32} />
            <div>
                <h2>{challenge.title}</h2>
                <p>{summary}</p>
            </div>
            <Link className={styles.link} to={`/spaces/${challenge._id}`} onClick={() => track('challenge_open', {source: 'home'})}>
                {communityText('View challenge and enter')}
                <ArrowRight size={16} />
            </Link>
        </section>
    );
};
