import {useCommunityIntl as useCommunityText} from '../../i18n.jsx';
/* eslint-disable max-len */
import PropTypes from 'prop-types';
import React, {useEffect, useState} from 'react';
import {ClipboardList, FolderOpen, HardDrive, MessageSquareText, MonitorPlay, Play, Send, Undo2, Pencil, Users2} from 'lucide-react';
import api, {editorUrl} from '../../api';
import {isOverdue, relativeTime, submissionState} from '../../classroom.js';
import {formatBytes, formatDateTime} from '../../format.js';
import Button from '../ui/Button.jsx';
import EmptyState from '../ui/EmptyState.jsx';
import Notice from '../ui/Notice.jsx';
import PageHeader from '../ui/PageHeader.jsx';
import SectionHeading from '../ui/SectionHeading.jsx';
import UsageMeter from './UsageMeter.jsx';
import SubmissionBadge from './SubmissionBadge.jsx';
import styles from './StudentHome.module.css';

const openEditor = projectId => {
    window.location.href = editorUrl({platformProject: projectId});
};

const watchUrl = projectId => `/editor?collaborate=1#mw-${projectId}`;

const groupOf = assignment => (assignment.group && assignment.group.id ? assignment.group : null);

const otherMembers = (group, studentId) => (group.members || [])
    .filter(member => member.id !== studentId)
    .map(member => member.displayName);

const listNames = (names, and) => {
    if (names.length <= 1) return names.join('');
    return `${names.slice(0, -1).join(', ')} ${and} ${names[names.length - 1]}`;
};

const AssignmentCard = ({assignment, onChange, studentId}) => {
    const {text: communityText} = useCommunityText();
    const [busy, setBusy] = useState('');
    const [error, setError] = useState('');
    const submission = assignment.submission || null;
    const group = groupOf(assignment);
    const teammates = group ? otherMembers(group, studentId) : [];
    const state = submissionState(submission);
    const overdue = isOverdue(assignment.dueAt);
    const run = async (action, request) => {
        if (busy) return;
        setBusy(action);
        setError('');
        try {
            const data = await request();
            if (action === 'start') {
                openEditor(data.projectId || (data.submission && data.submission.projectId));
                return;
            }
            onChange(data.submission);
        } catch (e) {
            setError(e.message || communityText('That did not work. Please try again.'));
        } finally {
            setBusy('');
        }
    };
    const openButton = submission && submission.projectId ? (
        <Button as="a" href={editorUrl({platformProject: submission.projectId})} className={styles.bigButton}>
            <Pencil size={18} aria-hidden="true" />
            {communityText('Open')}
        </Button>
    ) : null;
    return (
        <article className={styles.assignment}>
            <div className={styles.assignmentTop}>
                <h3 className={styles.assignmentTitle}>{assignment.title}</h3>
                <SubmissionBadge submission={submission} large />
            </div>
            <p className={overdue && state !== 'returned' && state !== 'turned_in' && state !== 'late' ? styles.dueOverdue : styles.due}>
                {assignment.dueAt ?
                    (overdue ?
                        communityText('This was due on {value1}.', {value1: formatDateTime(assignment.dueAt)}) :
                        communityText('Due on {value1}.', {value1: formatDateTime(assignment.dueAt)})) :
                    communityText('There is no due date.')}
            </p>
            {assignment.instructions ? <p className={styles.instructions}>{assignment.instructions}</p> : null}
            {group ? (
                <p className={styles.group}>
                    <Users2 size={16} aria-hidden="true" />
                    {teammates.length ?
                        communityText('Working with {value1} in {value2}.', {value1: listNames(teammates, communityText('and')), value2: group.name}) :
                        communityText('You are in the group {value1}.', {value1: group.name})}
                </p>
            ) : null}
            {state === 'returned' && (submission.feedback || submission.grade) ? (
                <div className={styles.feedback}>
                    <span className={styles.feedbackTitle}>
                        <MessageSquareText size={16} aria-hidden="true" />
                        {communityText('From your teacher')}
                    </span>
                    {submission.feedback ? <p>{submission.feedback}</p> : null}
                    {submission.grade ? <p className={styles.grade}>{communityText('Grade: {value1}', {value1: submission.grade})}</p> : null}
                </div>
            ) : null}
            {error ? <Notice variant="error">{error}</Notice> : null}
            <div className={styles.actions}>
                {state === 'not_started' ? (
                    <Button variant="primary" className={styles.bigButton} busy={busy === 'start'} busyLabel={communityText('Opening…')} onClick={() => run('start', () => api.classroom.startAssignment(assignment.id))}>
                        <Play size={18} aria-hidden="true" />
                        {communityText('Start')}
                    </Button>
                ) : null}
                {state === 'started' || state === 'returned' ? (
                    <React.Fragment>
                        {openButton}
                        <Button variant="primary" className={styles.bigButton} busy={busy === 'turnIn'} busyLabel={communityText('Turning in…')} onClick={() => run('turnIn', () => api.classroom.turnIn(assignment.id))}>
                            <Send size={18} aria-hidden="true" />
                            {state === 'returned' ? communityText('Turn in again') : communityText('Turn in')}
                        </Button>
                    </React.Fragment>
                ) : null}
                {state === 'turned_in' || state === 'late' ? (
                    <React.Fragment>
                        {openButton}
                        <Button className={styles.bigButton} busy={busy === 'unsubmit'} busyLabel={communityText('Taking back…')} onClick={() => run('unsubmit', () => api.classroom.unsubmit(assignment.id))}>
                            <Undo2 size={18} aria-hidden="true" />
                            {communityText('Take back')}
                        </Button>
                    </React.Fragment>
                ) : null}
            </div>
        </article>
    );
};

AssignmentCard.propTypes = {
    assignment: PropTypes.shape({
        dueAt: PropTypes.number,
        group: PropTypes.object,
        id: PropTypes.string.isRequired,
        instructions: PropTypes.string,
        submission: PropTypes.object,
        title: PropTypes.string.isRequired
    }).isRequired,
    onChange: PropTypes.func.isRequired,
    studentId: PropTypes.string
};

AssignmentCard.defaultProps = {
    studentId: ''
};

const StudentHome = ({data, onReload}) => {
    const {text: communityText} = useCommunityText();
    const [assignments, setAssignments] = useState(data.assignments || []);
    useEffect(() => {
        setAssignments(data.assignments || []);
    }, [data]);
    const student = data.student || {};
    const classInfo = data.class || {};
    const storage = data.storage || {};
    const projects = data.projects || [];
    const presentation = data.presentation && data.presentation.projectId ? data.presentation : null;
    const updateSubmission = (assignmentId, submission) => {
        setAssignments(current => current.map(item => (item.id === assignmentId ? {...item, submission} : item)));
        onReload();
    };
    return (
        <main className={styles.page}>
            <PageHeader
                title={communityText('Hi, {value1}!', {value1: student.displayName || student.username || ''})}
                lead={classInfo.teacher ?
                    communityText('You are in {value1}. Your teacher is {value2}.', {value1: classInfo.name || '', value2: classInfo.teacher}) :
                    communityText('You are in {value1}.', {value1: classInfo.name || ''})}
            />
            {presentation ? (
                <section className={styles.watchCard} aria-label={communityText('Presentation')}>
                    <span className={styles.watchIcon}><MonitorPlay size={28} aria-hidden="true" /></span>
                    <div className={styles.watchText}>
                        <h2 className={styles.watchTitle}>{communityText('Your class is watching {value1}.', {value1: presentation.title})}</h2>
                        <p className={styles.watchLead}>
                            {presentation.presenterName ?
                                communityText('{value1} is presenting. Join to follow along.', {value1: presentation.presenterName}) :
                                communityText('Join to follow along.')}
                        </p>
                    </div>
                    <Button as="a" href={watchUrl(presentation.projectId)} variant="primary" className={styles.bigButton}>
                        <Play size={18} aria-hidden="true" />
                        {communityText('Join')}
                    </Button>
                </section>
            ) : null}
            <section className={styles.section}>
                <SectionHeading icon={ClipboardList} title={communityText('Assignments')} count={assignments.length} />
                {assignments.length ? (
                    <div className={styles.assignmentList}>
                        {assignments.map(assignment => (
                            <AssignmentCard
                                key={assignment.id}
                                assignment={assignment}
                                studentId={student.id}
                                onChange={submission => updateSubmission(assignment.id, submission)}
                            />
                        ))}
                    </div>
                ) : (
                    <EmptyState icon={ClipboardList} title={communityText('No assignments yet')}>
                        {communityText('When your teacher sets an assignment, it will show up here.')}
                    </EmptyState>
                )}
            </section>
            <section className={styles.section}>
                <SectionHeading icon={FolderOpen} title={communityText('My projects')} count={projects.length} />
                {projects.length ? (
                    <ul className={styles.projectList}>
                        {projects.map(project => (
                            <li key={project.id} className={styles.projectRow}>
                                <span className={styles.projectText}>
                                    <a href={editorUrl({platformProject: project.id})} className={styles.projectTitle}>
                                        {project.title}
                                    </a>
                                    {project.edited ? <span className={styles.projectMeta}>{communityText('Edited {value1}.', {value1: relativeTime(project.edited)})}</span> : null}
                                </span>
                                <span className={styles.projectActions}>
                                    <Button as="a" href={editorUrl({platformProject: project.id})}>
                                        <Pencil size={16} aria-hidden="true" />
                                        {communityText('Open')}
                                    </Button>
                                </span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <EmptyState icon={FolderOpen} title={communityText('No projects yet')}>
                        {communityText('Start an assignment or make something new in the editor.')}
                    </EmptyState>
                )}
            </section>
            <section className={styles.section}>
                <SectionHeading icon={HardDrive} title={communityText('Storage')} />
                <div className={styles.storageCard}>
                    <UsageMeter
                        label={communityText('Space used')}
                        used={Number(storage.used) || 0}
                        total={Number(storage.limit) || 0}
                        valueLabel={communityText('{value1} of {value2}', {value1: formatBytes(storage.used), value2: formatBytes(storage.limit)})}
                    />
                </div>
            </section>
        </main>
    );
};

StudentHome.propTypes = {
    data: PropTypes.shape({
        assignments: PropTypes.array,
        class: PropTypes.object,
        projects: PropTypes.array,
        storage: PropTypes.object,
        student: PropTypes.object
    }).isRequired,
    onReload: PropTypes.func.isRequired
};

export {AssignmentCard, listNames, watchUrl};
export default StudentHome;
