import {useCommunityIntl as useCommunityText} from '../../i18n.jsx';
/* eslint-disable max-len */
import PropTypes from 'prop-types';
import React, {useState} from 'react';
import {Link} from 'react-router-dom';
import {CalendarClock, ClipboardList, Plus} from 'lucide-react';
import {isOverdue} from '../../classroom.js';
import {formatDateTime} from '../../format.js';
import Button from '../ui/Button.jsx';
import EmptyState from '../ui/EmptyState.jsx';
import SectionHeading from '../ui/SectionHeading.jsx';
import AssignmentModal from './AssignmentModal.jsx';
import styles from '../../pages/Classroom.module.css';

const progressStates = counts => {
    const total = Math.max(0, Number((counts && counts.students) || 0));
    const started = Math.max(0, Number((counts && counts.started) || 0));
    const returned = Math.max(0, Number((counts && counts.returned) || 0));
    const waiting = Math.max(0, Number((counts && counts.turnedIn) || 0));
    const inProgress = Math.max(0, started - waiting - returned);
    const notStarted = Math.max(0, total - started);
    return {total, returned, waiting, inProgress, notStarted};
};

const AssignmentProgress = ({counts}) => {
    const {text: communityText} = useCommunityText();
    const {total, returned, waiting, inProgress, notStarted} = progressStates(counts);
    const share = value => (total > 0 ? `${Math.min(100, (value / total) * 100)}%` : '0%');
    return (
        <div className={styles.progress}>
            <div className={styles.progressTrack} aria-hidden="true">
                <span className={styles.progressReturned} style={{width: share(returned)}} />
                <span className={styles.progressWaiting} style={{width: share(waiting)}} />
                <span className={styles.progressInProgress} style={{width: share(inProgress)}} />
            </div>
            <p className={styles.progressText}>
                {communityText('{value1, plural, one {# returned} other {# returned}}, {value2, plural, one {# waiting for review} other {# waiting for review}}, {value3, plural, one {# in progress} other {# in progress}}, and {value4, plural, one {# not started} other {# not started}}.', {value1: returned, value2: waiting, value3: inProgress, value4: notStarted})}
            </p>
        </div>
    );
};

AssignmentProgress.propTypes = {
    counts: PropTypes.shape({
        returned: PropTypes.number,
        started: PropTypes.number,
        students: PropTypes.number,
        turnedIn: PropTypes.number
    })
};

AssignmentProgress.defaultProps = {
    counts: null
};

const DueLabel = ({dueAt}) => {
    const {text: communityText} = useCommunityText();
    if (!dueAt) return <span className={styles.due}><CalendarClock size={14} aria-hidden="true" />{communityText('No due date')}</span>;
    const overdue = isOverdue(dueAt);
    return (
        <span className={overdue ? styles.dueOverdue : styles.due}>
            <CalendarClock size={14} aria-hidden="true" />
            {overdue ?
                communityText('Was due {value1}', {value1: formatDateTime(dueAt)}) :
                communityText('Due {value1}', {value1: formatDateTime(dueAt)})}
        </span>
    );
};

DueLabel.propTypes = {
    dueAt: PropTypes.number
};

DueLabel.defaultProps = {
    dueAt: 0
};

const ClassAssignments = ({assignments, classInfo, onReload}) => {
    const {text: communityText} = useCommunityText();
    const [creating, setCreating] = useState(false);
    const sorted = [...assignments].sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
    const newButton = (
        <Button variant="primary" onClick={() => setCreating(true)} disabled={classInfo.archived}>
            <Plus size={16} aria-hidden="true" />
            {communityText('New assignment')}
        </Button>
    );
    return (
        <section aria-labelledby="classroom-assignments-heading">
            <SectionHeading id="classroom-assignments-heading" icon={ClipboardList} title={communityText('Assignments')} count={assignments.length} actions={newButton} />
            {sorted.length ? (
                <div className={styles.assignmentList}>
                    {sorted.map(assignment => (
                        <Link key={assignment.id} to={`/classroom/${classInfo.id}/assignments/${assignment.id}`} className={styles.assignmentRow}>
                            <span className={styles.assignmentText}>
                                <strong className={styles.assignmentTitle}>{assignment.title}</strong>
                                <DueLabel dueAt={assignment.dueAt} />
                            </span>
                            <AssignmentProgress counts={assignment.counts} />
                        </Link>
                    ))}
                </div>
            ) : (
                <EmptyState icon={ClipboardList} title={communityText('No assignments yet')} action={newButton}>
                    {communityText('Set a task with instructions, a due date, and an optional starter project.')}
                </EmptyState>
            )}
            {creating ? (
                <AssignmentModal
                    classId={classInfo.id}
                    onClose={() => setCreating(false)}
                    onSaved={() => {
                        setCreating(false);
                        onReload();
                    }}
                />
            ) : null}
        </section>
    );
};

ClassAssignments.propTypes = {
    assignments: PropTypes.array.isRequired,
    classInfo: PropTypes.object.isRequired,
    onReload: PropTypes.func.isRequired
};

export {AssignmentProgress, DueLabel, progressStates};
export default ClassAssignments;
