import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
/* eslint-disable max-len */
import PropTypes from 'prop-types';
import React, {useCallback, useEffect, useState} from 'react';
import {Link, useNavigate, useParams} from 'react-router-dom';
import {ClipboardList, ExternalLink, MessageSquareText, Pencil, Save, Send, Trash2, Users, Users2} from 'lucide-react';
import api, {projectUrl} from '../api';
import {useUser} from '../UserContext.jsx';
import {initials, submissionState} from '../classroom.js';
import Button from '../components/ui/Button.jsx';
import ConfirmModal from '../components/ui/ConfirmModal.jsx';
import EmptyState, {SignInPrompt} from '../components/ui/EmptyState.jsx';
import Notice from '../components/ui/Notice.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import SectionHeading from '../components/ui/SectionHeading.jsx';
import StatusMessage from '../components/ui/StatusMessage.jsx';
import AssignmentModal from '../components/classroom/AssignmentModal.jsx';
import {AssignmentProgress, DueLabel} from '../components/classroom/ClassAssignments.jsx';
import SubmissionBadge from '../components/classroom/SubmissionBadge.jsx';
import styles from './Classroom.module.css';

const ReviewForm = ({assignmentId, classId, onSaved, submission}) => {
    const {text: communityText} = useCommunityText();
    const [feedback, setFeedback] = useState(submission.feedback || '');
    const [grade, setGrade] = useState(submission.grade || '');
    const [busy, setBusy] = useState('');
    const [error, setError] = useState('');
    const send = async returnWork => {
        if (busy) return;
        setBusy(returnWork ? 'return' : 'save');
        setError('');
        try {
            const data = await api.classroom.reviewSubmission(classId, assignmentId, submission.studentId, {
                feedback: feedback.trim(),
                grade: grade.trim(),
                ...(returnWork ? {return: true} : {})
            });
            onSaved(data.submission || {...submission, feedback: feedback.trim(), grade: grade.trim()});
        } catch (e) {
            setError(e.message || communityText('Could not save the review.'));
        } finally {
            setBusy('');
        }
    };
    const submitReview = event => {
        event.preventDefault();
        send(false);
    };
    return (
        <form className={styles.reviewForm} onSubmit={submitReview}>
            <div className={styles.reviewFields}>
                <label className={styles.field}>
                    <span>{communityText('Feedback')}</span>
                    <textarea value={feedback} rows={3} maxLength={4000} onChange={event => setFeedback(event.target.value)} />
                </label>
                <label className={`${styles.field} ${styles.gradeField}`}>
                    <span>{communityText('Grade')}</span>
                    <input value={grade} maxLength={20} placeholder={communityText('Optional')} onChange={event => setGrade(event.target.value)} />
                </label>
            </div>
            {error ? <Notice variant="error">{error}</Notice> : null}
            <div className={styles.formActions}>
                <Button type="submit" busy={busy === 'save'} busyLabel={communityText('Saving…')} disabled={Boolean(busy)}>
                    <Save size={15} aria-hidden="true" />
                    {communityText('Save')}
                </Button>
                <Button variant="primary" busy={busy === 'return'} busyLabel={communityText('Returning…')} disabled={Boolean(busy)} onClick={() => send(true)}>
                    <Send size={15} aria-hidden="true" />
                    {submission.state === 'returned' ? communityText('Return again') : communityText('Return to student')}
                </Button>
            </div>
        </form>
    );
};

ReviewForm.propTypes = {
    assignmentId: PropTypes.string.isRequired,
    classId: PropTypes.string.isRequired,
    onSaved: PropTypes.func.isRequired,
    submission: PropTypes.object.isRequired
};

const SubmissionRow = ({assignmentId, classId, onSaved, row}) => {
    const {text: communityText} = useCommunityText();
    const [open, setOpen] = useState(false);
    const submission = row.submission || null;
    const state = submissionState(submission);
    const reviewable = state !== 'not_started';
    return (
        <li className={styles.submissionRow}>
            <div className={styles.submissionMain}>
                <Link to={`/classroom/${classId}/students/${row.student.id}`} className={styles.nameCell}>
                    <span className={styles.initials} aria-hidden="true">{initials(row.student.displayName)}</span>
                    <span>{row.student.displayName}</span>
                </Link>
                <span className={styles.submissionMeta}>
                    <SubmissionBadge submission={submission} />
                    {submission && submission.grade ? <span className={styles.gradeChip}>{submission.grade}</span> : null}
                    {row.group && row.group.id ? (
                        <span className={styles.chip} title={communityText('Group work')}>
                            <Users2 size={12} aria-hidden="true" />
                            {row.group.name}
                        </span>
                    ) : null}
                </span>
                <span className={styles.listActions}>
                    {submission && submission.projectId ? (
                        <Button as={Link} to={projectUrl({id: submission.projectId})}>
                            <ExternalLink size={15} aria-hidden="true" />
                            {communityText('Open project')}
                        </Button>
                    ) : null}
                    {reviewable ? (
                        <Button onClick={() => setOpen(current => !current)} aria-expanded={open}>
                            <MessageSquareText size={15} aria-hidden="true" />
                            {open ? communityText('Hide review') : communityText('Review')}
                        </Button>
                    ) : null}
                </span>
            </div>
            {!open && submission && submission.feedback ? <p className={styles.feedbackPreview}>{submission.feedback}</p> : null}
            {open && reviewable ? (
                <ReviewForm
                    key={submission._id || row.student.id}
                    classId={classId}
                    assignmentId={assignmentId}
                    submission={submission}
                    onSaved={next => {
                        onSaved(next);
                        setOpen(false);
                    }}
                />
            ) : null}
        </li>
    );
};

SubmissionRow.propTypes = {
    assignmentId: PropTypes.string.isRequired,
    classId: PropTypes.string.isRequired,
    onSaved: PropTypes.func.isRequired,
    row: PropTypes.shape({
        group: PropTypes.object,
        student: PropTypes.object.isRequired,
        submission: PropTypes.object
    }).isRequired
};

const ClassroomAssignment = () => {
    const {text: communityText} = useCommunityText();
    const {id, aid} = useParams();
    const {user, loading, login} = useUser();
    const navigate = useNavigate();
    const [detail, setDetail] = useState(null);
    const [classData, setClassData] = useState(null);
    const [error, setError] = useState(null);
    const [attempt, setAttempt] = useState(0);
    const [editing, setEditing] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [deleteBusy, setDeleteBusy] = useState(false);
    const [deleteError, setDeleteError] = useState('');
    const reload = useCallback(() => setAttempt(n => n + 1), []);
    const username = (user && user.username) || '';

    useEffect(() => {
        if (!username) return () => {};
        let active = true;
        setError(null);
        Promise.all([api.classroom.assignment(id, aid), api.classroom.class(id)])
            .then(([assignmentData, classInfo]) => {
                if (!active) return;
                setDetail(assignmentData);
                setClassData(classInfo);
            })
            .catch(e => {
                if (active) setError(e);
            });
        return () => {
            active = false;
        };
    }, [id, aid, username, attempt]);

    const deleteAssignment = async () => {
        if (deleteBusy) return;
        setDeleteBusy(true);
        setDeleteError('');
        try {
            await api.classroom.deleteAssignment(id, aid);
            navigate(`/classroom/${id}?tab=assignments`);
        } catch (e) {
            setDeleteError(e.message || communityText('Could not delete the assignment.'));
            setDeleteBusy(false);
        }
    };

    if (!user) {
        if (loading) return <main className={styles.page}><StatusMessage /></main>;
        return <main className={styles.page}><SignInPrompt title={communityText('Teachers sign in with Rotur to manage their classes.')} onSignIn={login} /></main>;
    }
    if (error) {
        return (
            <main className={styles.page}>
                <PageHeader backTo={`/classroom/${id}?tab=assignments`} backLabel={communityText('Assignments')} title={communityText('Assignment')} />
                <StatusMessage error onRetry={reload}>{communityText('Could not load this assignment.')}</StatusMessage>
            </main>
        );
    }
    if (!detail) return <main className={styles.page}><StatusMessage /></main>;

    const assignment = detail.assignment;
    const rows = detail.rows || [];
    const classInfo = (classData && classData.class) || {};
    const updateRow = (studentId, submission) => {
        setDetail(current => ({
            ...current,
            rows: current.rows.map(row => (row.student.id === studentId ? {...row, submission} : row))
        }));
        reload();
    };

    return (
        <main className={styles.page}>
            <PageHeader
                backTo={`/classroom/${id}?tab=assignments`}
                backLabel={classInfo.name || communityText('Assignments')}
                icon={ClipboardList}
                title={assignment.title}
                actions={(
                    <React.Fragment>
                        <Button onClick={() => setEditing(true)}>
                            <Pencil size={16} aria-hidden="true" />
                            {communityText('Edit')}
                        </Button>
                        <Button
                            variant="danger" onClick={() => {
                                setDeleteError(''); setDeleting(true);
                            }}
                        >
                            <Trash2 size={16} aria-hidden="true" />
                            {communityText('Delete')}
                        </Button>
                    </React.Fragment>
                )}
            />
            <section className={styles.detailCard}>
                <DueLabel dueAt={assignment.dueAt} />
                {assignment.instructions ? <p className={styles.instructions}>{assignment.instructions}</p> : <p className={styles.muted}>{communityText('There are no instructions for this assignment.')}</p>}
                {assignment.starterProjectId ? (
                    <Link to={projectUrl({id: assignment.starterProjectId})} className={styles.inlineLink}>
                        <ExternalLink size={14} aria-hidden="true" />
                        {communityText('Starter project')}
                    </Link>
                ) : null}
                <AssignmentProgress counts={assignment.counts} />
            </section>
            <section className={styles.section} aria-labelledby="classroom-assignment-students">
                <SectionHeading id="classroom-assignment-students" icon={Users} title={communityText('Students')} count={rows.length} />
                {rows.length ? (
                    <ul className={styles.submissionList}>
                        {rows.map(row => (
                            <SubmissionRow
                                key={row.student.id}
                                row={row}
                                classId={id}
                                assignmentId={aid}
                                onSaved={submission => updateRow(row.student.id, submission)}
                            />
                        ))}
                    </ul>
                ) : (
                    <EmptyState icon={Users} title={communityText('No students yet')}>
                        {communityText('Add students to the class to see their work here.')}
                    </EmptyState>
                )}
            </section>
            {editing ? (
                <AssignmentModal
                    classId={id}
                    assignment={assignment}
                    onClose={() => setEditing(false)}
                    onSaved={() => {
                        setEditing(false);
                        reload();
                    }}
                />
            ) : null}
            {deleting ? (
                <ConfirmModal
                    destructive
                    title={communityText('Delete this assignment?')}
                    confirmLabel={communityText('Delete assignment')}
                    busy={deleteBusy}
                    error={deleteError}
                    onCancel={() => setDeleting(false)}
                    onConfirm={deleteAssignment}
                >
                    {communityText('Students keep their projects, but the assignment and its feedback are removed permanently.')}
                </ConfirmModal>
            ) : null}
        </main>
    );
};

export {ReviewForm, SubmissionRow};
export default ClassroomAssignment;
