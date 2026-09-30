import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
/* eslint-disable max-len */
import React, {useCallback, useEffect, useState} from 'react';
import {Link, useParams} from 'react-router-dom';
import {ClipboardList, ExternalLink, FolderOpen, Pencil, User} from 'lucide-react';
import api, {editorUrl, projectUrl} from '../api';
import {useUser} from '../UserContext.jsx';
import {relativeTime} from '../classroom.js';
import {formatBytes} from '../format.js';
import Button from '../components/ui/Button.jsx';
import EmptyState, {SignInPrompt} from '../components/ui/EmptyState.jsx';
import Notice from '../components/ui/Notice.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import SectionHeading from '../components/ui/SectionHeading.jsx';
import StatusMessage from '../components/ui/StatusMessage.jsx';
import SubmissionBadge from '../components/classroom/SubmissionBadge.jsx';
import ReleaseSection from '../components/classroom/ReleaseSection.jsx';
import DownloadDataButton from '../components/classroom/DownloadDataButton.jsx';
import styles from './Classroom.module.css';

const ClassroomStudent = () => {
    const {text: communityText} = useCommunityText();
    const {id, sid} = useParams();
    const {user, loading, login} = useUser();
    const [detail, setDetail] = useState(null);
    const [classData, setClassData] = useState(null);
    const [error, setError] = useState(null);
    const [attempt, setAttempt] = useState(0);
    const reload = useCallback(() => setAttempt(n => n + 1), []);
    const username = (user && user.username) || '';

    useEffect(() => {
        if (!username) return () => {};
        let active = true;
        setError(null);
        Promise.all([api.classroom.student(id, sid), api.classroom.class(id)])
            .then(([studentData, classInfo]) => {
                if (!active) return;
                setDetail(studentData);
                setClassData(classInfo);
            })
            .catch(e => {
                if (active) setError(e);
            });
        return () => {
            active = false;
        };
    }, [id, sid, username, attempt]);

    if (!user) {
        if (loading) return <main className={styles.page}><StatusMessage /></main>;
        return <main className={styles.page}><SignInPrompt title={communityText('Teachers sign in with Rotur to manage their classes.')} onSignIn={login} /></main>;
    }
    if (error) {
        return (
            <main className={styles.page}>
                <PageHeader backTo={`/classroom/${id}`} backLabel={communityText('Class')} title={communityText('Student')} />
                <StatusMessage error onRetry={reload}>{communityText('Could not load this student.')}</StatusMessage>
            </main>
        );
    }
    if (!detail) return <main className={styles.page}><StatusMessage /></main>;

    const student = detail.student || {};
    const projects = detail.projects || [];
    const submissions = detail.submissions || [];
    const assignments = (classData && classData.assignments) || [];
    const classInfo = (classData && classData.class) || {};
    const assignmentFor = submission => assignments.find(item => item.id === submission.assignmentId);
    const statusText = student.disabled ? communityText('This account is disabled, so the student cannot sign in.') :
        student.locked ? communityText('This account is locked after too many failed sign-ins. Unlock it from the class list.') : '';

    return (
        <main className={styles.page}>
            <PageHeader
                backTo={`/classroom/${id}`}
                backLabel={classInfo.name || communityText('Class')}
                icon={User}
                title={student.displayName || ''}
                lead={communityText('The username is {value1}.', {value1: student.username || ''})}
                actions={(
                    <DownloadDataButton
                        filename={`mistwarp-student-${sid}.json`}
                        label={communityText('Download their data')}
                        load={() => api.classroom.exportStudent(id, sid)}
                    />
                )}
            />
            {statusText ? <Notice variant="warning" className={styles.noticeBefore}>{statusText}</Notice> : null}
            <div className={styles.statRow}>
                <div className={styles.stat}>
                    <span className={styles.statLabel}>{communityText('Last sign-in')}</span>
                    <span className={styles.statValue}>{student.lastLoginAt ? relativeTime(student.lastLoginAt) : communityText('Never')}</span>
                </div>
                <div className={styles.stat}>
                    <span className={styles.statLabel}>{communityText('Projects')}</span>
                    <span className={styles.statValue}>{projects.length}</span>
                </div>
                <div className={styles.stat}>
                    <span className={styles.statLabel}>{communityText('Storage')}</span>
                    <span className={styles.statValue}>{formatBytes(student.storageBytes)}</span>
                </div>
            </div>
            <section className={styles.section} aria-labelledby="classroom-student-projects">
                <SectionHeading id="classroom-student-projects" icon={FolderOpen} title={communityText('Projects')} count={projects.length} />
                {projects.length ? (
                    <ul className={styles.list}>
                        {projects.map(project => (
                            <li key={project.id} className={styles.listRow}>
                                <span className={styles.listText}>
                                    <Link to={projectUrl(project)} className={styles.listTitle}>{project.title}</Link>
                                    <span className={styles.listMeta}>
                                        {project.edited ? communityText('Edited {value1}.', {value1: relativeTime(project.edited)}) : null}
                                        {' '}
                                        {communityText('{value1} used.', {value1: formatBytes(project.bytes)})}
                                    </span>
                                </span>
                                <span className={styles.listActions}>
                                    <Button as="a" href={editorUrl({platformProject: project.id})}>
                                        <Pencil size={15} aria-hidden="true" />
                                        {communityText('Open in editor')}
                                    </Button>
                                    <Button as={Link} to={projectUrl(project)}>
                                        <ExternalLink size={15} aria-hidden="true" />
                                        {communityText('Project page')}
                                    </Button>
                                </span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <EmptyState compact icon={FolderOpen} title={communityText('No projects yet')} />
                )}
            </section>
            <section className={styles.section} aria-labelledby="classroom-student-assignments">
                <SectionHeading id="classroom-student-assignments" icon={ClipboardList} title={communityText('Assignments')} count={submissions.length} />
                {submissions.length ? (
                    <ul className={styles.list}>
                        {submissions.map(submission => {
                            const assignment = assignmentFor(submission);
                            return (
                                <li key={submission._id || submission.assignmentId} className={styles.listRow}>
                                    <span className={styles.listText}>
                                        <Link to={`/classroom/${id}/assignments/${submission.assignmentId}`} className={styles.listTitle}>
                                            {assignment ? assignment.title : communityText('Assignment')}
                                        </Link>
                                        <span className={styles.listMeta}>
                                            {submission.grade ? communityText('Grade: {value1}', {value1: submission.grade}) : null}
                                            {submission.grade && submission.feedback ? ' ' : null}
                                            {submission.feedback ? submission.feedback : null}
                                        </span>
                                    </span>
                                    <span className={styles.listActions}>
                                        <SubmissionBadge submission={submission} />
                                        {submission.projectId ? (
                                            <Button as={Link} to={projectUrl({id: submission.projectId})}>
                                                <ExternalLink size={15} aria-hidden="true" />
                                                {communityText('Open project')}
                                            </Button>
                                        ) : null}
                                    </span>
                                </li>
                            );
                        })}
                    </ul>
                ) : (
                    <EmptyState compact icon={ClipboardList} title={communityText('No assignments started yet')} />
                )}
            </section>
            <div className={styles.section}>
                <ReleaseSection
                    classId={id}
                    student={student}
                    release={detail.release && detail.release.code ? detail.release : null}
                    onChange={release => setDetail(current => ({...current, release}))}
                />
            </div>
        </main>
    );
};

export default ClassroomStudent;
