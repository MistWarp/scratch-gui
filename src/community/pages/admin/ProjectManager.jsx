/* eslint-disable max-len */
import React, {useEffect, useRef, useState, useCallback} from 'react';
import {Link} from 'react-router-dom';
import {useCommunityIntl as useCommunityText} from '../../i18n.jsx';
import {FolderOpen} from 'lucide-react';
import api, {projectUrl} from '../../api';
import Button from '../../components/ui/Button.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Notice from '../../components/ui/Notice.jsx';
import SectionHeading from '../../components/ui/SectionHeading.jsx';
import StatusMessage from '../../components/ui/StatusMessage.jsx';
import useLatest from '../../use-latest.js';
import styles from '../Admin.module.css';
import AdminActionDialog from './AdminActionDialog.jsx';
import ProjectModerationDialog from './ProjectModerationDialog.jsx';

const ProjectManager = () => {
    const {text: communityText} = useCommunityText();
    const [query, setQuery] = useState('');
    const [projects, setProjects] = useState(null);
    const [error, setError] = useState('');
    const [note, setNote] = useState('');
    const [dialog, setDialog] = useState(null);
    const [dialogError, setDialogError] = useState('');
    const [dialogBusy, setDialogBusy] = useState(false);
    const [moderation, setModeration] = useState(null);
    const actionInFlight = useRef(false);
    const beginSearch = useLatest();

    const search = useCallback(async q => {
        const fresh = beginSearch();
        setError('');
        setNote('');
        try {
            const data = await api.admin.searchProjects(q || '');
            fresh(setProjects)(data.projects || []);
        } catch (e) {
            fresh(setError)(e.message || 'Could not load projects.');
        }
    }, [beginSearch]);

    useEffect(() => {
        search('');
    }, [search]);

    const moderate = (kind, project) => {
        if (actionInFlight.current) return;
        setError('');
        setNote('');
        setModeration({kind, project});
    };

    const moderationDone = kind => {
        setModeration(null);
        if (kind === 'hide') setNote(communityText('Project hidden. Its creator was told why.'));
        else if (kind === 'restore') setNote(communityText('Project restored.'));
        else if (kind === 'shadow') setNote(communityText('Project shadow banned.'));
        else setNote(communityText('Shadow ban lifted.'));
        search(query);
    };

    const remove = id => {
        if (actionInFlight.current) return;
        const project = (projects || []).find(item => item.id === id);
        setDialogError('');
        setDialog({
            id,
            title: communityText('Delete project?'),
            description: communityText('Delete {value1} permanently?', {value1: project ? project.title : communityText('this project')}),
            action: communityText('Delete project'),
            danger: true,
            icon: FolderOpen
        });
    };

    const confirmRemove = async () => {
        if (!dialog || actionInFlight.current) return;
        const releaseAction = () => {
            actionInFlight.current = false;
        };
        actionInFlight.current = true;
        setDialogBusy(true);
        try {
            setDialogError('');
            await api.deleteProject(dialog.id);
            setDialog(null);
            setNote(communityText('Project deleted.'));
            search(query);
        } catch (e) {
            setDialogError(e.message || 'Could not delete that project.');
        } finally {
            releaseAction();
            setDialogBusy(false);
        }
    };

    return (
        <div>
            <AdminActionDialog
                dialog={dialog}
                busy={dialogBusy}
                error={dialogError}
                onChange={() => {}}
                onCancel={() => {
                    if (!actionInFlight.current) setDialog(null);
                }}
                onConfirm={confirmRemove}
            />
            <ProjectModerationDialog
                kind={moderation ? moderation.kind : null}
                project={moderation ? moderation.project : null}
                onClose={() => setModeration(null)}
                onDone={moderationDone}
            />
            <SectionHeading icon={FolderOpen} title={communityText('Projects')} />
            <div className={styles.addAdmin}>
                <input
                    className={styles.input}
                    placeholder={communityText('Search title, owner, or id')}
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onKeyDown={e => {
                        if (e.key === 'Enter') search(query);
                    }}
                />
                <Button onClick={() => search(query)}>{communityText('Search')}</Button>
            </div>
            {error ? <Notice variant="error" className={styles.notice}>{error}</Notice> : null}
            {note ? <Notice variant="success" className={styles.notice}>{note}</Notice> : null}
            {projects === null ? (
                <StatusMessage />
            ) : projects.length ? (
                <div className={styles.list}>
                    {projects.map(project => (
                        <div
                            key={project.id}
                            className={styles.row}
                        >
                            <div className={styles.rowInfo}>
                                <span className={styles.rowTitle}>
                                    <Link to={projectUrl(project)}>{project.title || project.id}</Link>
                                    {project.moderationHidden ? <span className={`${styles.badge} ${styles.badgeWarn}`}>{communityText('Hidden')}</span> : null}
                                    {project.projectShadowBanned ? <span className={`${styles.badge} ${styles.badgeWarn}`}>{communityText('Shadow banned')}</span> : null}
                                    {project.ownerShadowBanned ? <span className={`${styles.badge} ${styles.badgeWarn}`}>{communityText('Creator shadow banned')}</span> : null}
                                    {project.ownerBanned ? <span className={`${styles.badge} ${styles.badgeDanger}`}>{communityText('Creator banned')}</span> : null}
                                </span>
                                <span className={styles.rowMeta}>
                                    {communityText('by @{value1} · {value2}', {value1: project.owner, value2: project.shared ? communityText('Shared') : communityText('Unshared')})}
                                </span>
                            </div>
                            <div className={styles.rowActions}>
                                {project.moderationHidden ? (
                                    <Button onClick={() => moderate('restore', project)}>{communityText('Restore')}</Button>
                                ) : (
                                    <Button onClick={() => moderate('hide', project)}>{communityText('Hide')}</Button>
                                )}
                                {project.projectShadowBanned ? (
                                    <Button onClick={() => moderate('unshadow', project)}>{communityText('Lift shadow ban')}</Button>
                                ) : (
                                    <Button onClick={() => moderate('shadow', project)}>{communityText('Shadow ban')}</Button>
                                )}
                                <Button variant="danger" onClick={() => remove(project.id)}>{communityText('Delete')}</Button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <EmptyState compact icon={FolderOpen} title={communityText('No projects found')}>
                    {communityText('Try a different title, owner, or id.')}
                </EmptyState>
            )}
        </div>
    );
};

export default ProjectManager;
