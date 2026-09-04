/* eslint-disable max-len */
import React, {useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import {ArrowRight, Cloud, Gamepad2, HardDrive, MousePointer2, Sparkles, Trophy} from 'lucide-react';
import api, {editorUrl} from '../api';
import {formatDate, sameUser, timeAgo} from '../format';
import {STARTERS} from '../../lib/starter-projects';
import {getLastEditedProject} from '../../lib/mw/recent-projects';
import ProjectThumbnail from './ProjectThumbnail.jsx';
import Button from './ui/Button.jsx';
import {track} from '../analytics';
import fog from '../../lib/default-project/fog.svg';
import styles from './HomeWorkspace.module.css';

export const ContinueProjects = ({username, onProjectCount}) => {
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
    return (
        <section className={styles.section} aria-label="Continue editing">
            <div className={styles.heading}>
                <div><h1>Continue editing</h1></div>
                <Link to="/mystuff?section=projects">All your projects <ArrowRight size={16} /></Link>
            </div>
            {current.projects === null ? <p role="status">Loading your projects…</p> : null}
            {current.failed ? <p role="alert">Couldn&apos;t load your projects. <Button onClick={() => setAttempt(value => value + 1)}>Try again</Button></p> : null}
            {current.projects && !current.projects.length && !current.failed ? (
                <div className={styles.empty}><Cloud size={22} /><div><strong>Your first project starts here.</strong><p>Try a starter below. Save it to MistWarp and continue here next time.</p></div></div>
            ) : null}
            <div className={styles.projectGrid}>
                {(current.projects || []).map((project, index) => (
                    <a className={styles.resumeCard} key={project.id} href={editorUrl({platformProject: project.id})}>
                        <ProjectThumbnail project={project} className={styles.thumbnail} fallbackClassName={styles.thumbnailFallback} />
                        <div><span className={styles.meta}>{project.shared ? 'Shared' : 'Draft'} · Saved {timeAgo(project.edited || project.created)}</span>
                            <h2>{project.title}</h2><span className={index === 0 ? styles.continueButton : styles.continueLink}>Continue editing <ArrowRight size={16} /></span></div>
                    </a>
                ))}
            </div>
        </section>
    );
};

export const DeviceBackup = () => {
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
    return <aside className={styles.backup}><HardDrive size={20} /><div><strong>Device backup available</strong><p>{backup.title} · {timeAgo(backup.created * 1000)} · This browser only</p></div><a href={editorUrl({restore: backup.id})}>Open backup <ArrowRight size={16} /></a></aside>;
};

const STARTER_ICONS = {clicker: MousePointer2, explorer: Gamepad2, animation: Sparkles};

export const StarterGallery = () => (
    <section className={styles.section} id="starters" aria-labelledby="starter-heading">
        <div className={styles.heading}><div><h2 id="starter-heading">Starter projects</h2><p>Run a project, change one thing, and save your own version. No sign-in needed to try.</p></div><a href={editorUrl()}>Start a blank project <ArrowRight size={16} /></a></div>
        <div className={styles.starterGrid}>
            {STARTERS.map(starter => {
                const Icon = STARTER_ICONS[starter.id];
                return (<a key={starter.id} className={styles.starterCard} href={editorUrl({starter: starter.id})}>
                    <div className={`${styles.starterArt} ${styles[starter.accent]}`}><span className={styles.kind}><Icon size={16} />{starter.kind}</span><img src={fog} alt="" /><span className={styles.controls}>{starter.control}</span></div>
                    <div className={styles.starterBody}><h3>{starter.title}</h3><p>{starter.description}</p><span>Try this starter <ArrowRight size={16} /></span></div>
                </a>);
            })}
        </div>
    </section>
);

export const selectActiveChallenge = (spaces, now = Date.now()) => spaces
    .filter(space => Number(space.startsAt) <= now && Number(space.endsAt) > now && !space.resultsPublishedAt)
    .sort((a, b) => (Number(b.participantCount) || 0) - (Number(a.participantCount) || 0) || Number(a.endsAt) - Number(b.endsAt))[0];

export const ActiveChallenge = () => {
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
    return <section className={styles.challenge}><Trophy size={32} /><div><h2>{challenge.title}</h2><p>{challenge.theme ? `Theme: ${challenge.theme} · ` : ''}Submissions close {formatDate(challenge.endsAt)}. {challenge.participantCount || 0} creators have joined.</p></div><Link to={`/spaces/${challenge._id}`} onClick={() => track('challenge_open', {source: 'home'})}>View challenge &amp; enter <ArrowRight size={16} /></Link></section>;
};
