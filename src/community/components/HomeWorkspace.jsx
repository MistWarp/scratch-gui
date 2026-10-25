import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
/* eslint-disable max-len */
import PropTypes from 'prop-types';
import React, {useEffect, useState} from 'react';
import {HardDrive, Plus} from 'lucide-react';
import api, {editorUrl} from '../api';
import {sameUser, timeAgo} from '../format';
import {STARTERS} from '../../lib/starter-projects';
import {getLastEditedProject} from '../../lib/mw/recent-projects';
import {MOVED_KEY} from '../../lib/account/frame-editor-data.js';
import fog from '../../lib/default-project/fog.svg';
import {CardRow, CardRowSkeleton, CardTile, MediaCard} from './GameCard.jsx';
import ProjectThumbnail from './ProjectThumbnail.jsx';
import QuietLink from './ui/QuietLink.jsx';
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
            <QuietLink href={editorUrl({restore: backup.id})}>{communityText('Open backup')}</QuietLink>
        </p>
    );
};

DeviceBackup.propTypes = {
    className: PropTypes.string
};

const NewProjectCard = () => {
    const {text: communityText} = useCommunityText();
    return (
        <MediaCard
            href={editorUrl()}
            title={communityText('New project')}
            meta={<span>{communityText('Start from an empty stage')}</span>}
            media={<CardTile><Plus
                size={32}
                aria-hidden="true"
            /></CardTile>}
        />
    );
};

const StarterCard = ({starter}) => (
    <MediaCard
        href={editorUrl({starter: starter.id})}
        title={starter.title}
        meta={<span>{starter.kind}</span>}
        media={<CardTile><img
            src={fog}
            alt=""
            className={styles[starter.id]}
        /></CardTile>}
    />
);

StarterCard.propTypes = {
    starter: PropTypes.shape({
        id: PropTypes.string,
        kind: PropTypes.string,
        title: PropTypes.string
    }).isRequired
};

const ResumeCard = ({project}) => {
    const {text: communityText} = useCommunityText();
    const saved = timeAgo(project.edited || project.created);
    return (
        <MediaCard
            href={editorUrl({platformProject: project.id})}
            title={project.title}
            meta={<span>
                {project.shared ?
                    communityText('Shared, saved {value1}', {value1: saved}) :
                    communityText('Draft, saved {value1}', {value1: saved})}
            </span>}
            media={<ProjectThumbnail
                project={project}
                fallbackClassName={styles.thumbFallback}
                lazy
            />}
        />
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

export const useRecentProjects = (username, limit = 3) => {
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
            }).slice(0, limit);
            setResult({username, projects: owned, failed: page.status === 'rejected'});
        });
        return () => {
            active = false;
        };
    }, [username, attempt, limit]);
    const current = result.username === username ? result : {projects: null, failed: false};
    return [current, () => setAttempt(value => value + 1)];
};

// A new project, your latest three, then starters to fill the row while you
// have fewer than three.
export const ContinueProjects = ({username}) => {
    const {text: communityText} = useCommunityText();
    const [current, retry] = useRecentProjects(username);
    if (!username) return null;
    const projects = current.projects || [];
    return (
        <section
            className={styles.section}
            aria-labelledby="home-continue-heading"
        >
            <SectionHeading
                id="home-continue-heading"
                title={projects.length ? communityText('Continue editing') :
                    current.projects && !current.failed ? communityText('Start a project') : communityText('Your projects')}
                actions={projects.length ? (
                    <QuietLink to="/mystuff?section=projects">{communityText('All your projects')}</QuietLink>
                ) : null}
            />
            {current.projects === null && !current.failed ? <CardRowSkeleton /> : null}
            {current.failed ? (
                <StatusMessage
                    className={styles.status}
                    compact
                    error
                    onRetry={retry}
                >{communityText('Could not load your projects.')}</StatusMessage>
            ) : null}
            {current.projects && !current.failed ? (
                <CardRow>
                    <NewProjectCard />
                    {projects.map(project => (
                        <ResumeCard
                            key={project.id}
                            project={project}
                        />
                    ))}
                    {STARTERS.slice(0, 3 - projects.length).map(starter => (
                        <StarterCard
                            key={starter.id}
                            starter={starter}
                        />
                    ))}
                </CardRow>
            ) : null}
            <DeviceBackup />
        </section>
    );
};

ContinueProjects.propTypes = {
    username: PropTypes.string
};
