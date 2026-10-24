import {useCommunityIntl as useCommunityText} from '../../i18n.jsx';
/* eslint-disable max-len */
import PropTypes from 'prop-types';
import React, {useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import {ExternalLink, Plus, Trash2, Users2} from 'lucide-react';
import api, {projectUrl} from '../../api';
import Button from '../ui/Button.jsx';
import ConfirmModal from '../ui/ConfirmModal.jsx';
import EmptyState from '../ui/EmptyState.jsx';
import IconButton from '../ui/IconButton.jsx';
import Modal from '../ui/Modal.jsx';
import Notice from '../ui/Notice.jsx';
import SectionHeading from '../ui/SectionHeading.jsx';
import SelectMenu from '../ui/SelectMenu.jsx';
import StatusMessage from '../ui/StatusMessage.jsx';
import styles from '../../pages/Classroom.module.css';

const MIN_MEMBERS = 2;
const MAX_MEMBERS = 6;

const memberNames = members => (members || []).map(member => member.displayName);

const NewGroupModal = ({assignments, classId, onClose, onCreated, students}) => {
    const {text: communityText} = useCommunityText();
    const [name, setName] = useState('');
    const [selected, setSelected] = useState([]);
    const [assignmentId, setAssignmentId] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const toggle = studentId => setSelected(current => (
        current.includes(studentId) ? current.filter(id => id !== studentId) : [...current, studentId]
    ));
    const valid = name.trim() && selected.length >= MIN_MEMBERS && selected.length <= MAX_MEMBERS;
    const submit = async event => {
        event.preventDefault();
        if (!valid || busy) return;
        setBusy(true);
        setError('');
        try {
            const data = await api.classroom.createGroup(classId, {
                name: name.trim(),
                studentIds: selected,
                ...(assignmentId ? {assignmentId} : {})
            });
            onCreated(data.group);
        } catch (e) {
            setError(e.message || communityText('Could not create the group.'));
            setBusy(false);
        }
    };
    return (
        <Modal title={communityText('New group')} icon={Users2} onClose={onClose} dismissDisabled={busy} className={styles.wideModal}>
            <form className={styles.form} onSubmit={submit}>
                <label className={styles.field}>
                    <span>{communityText('Group name')}</span>
                    <input value={name} maxLength={60} autoFocus onChange={event => setName(event.target.value)} />
                </label>
                <fieldset className={styles.fieldGroup}>
                    <legend>{communityText('Members')}</legend>
                    <p className={selected.length > MAX_MEMBERS ? styles.hintWarning : styles.hint}>
                        {communityText('{value1, plural, =0 {Nobody picked yet.} one {# student picked.} other {# students picked.}}', {value1: selected.length})}
                        {' '}
                        {communityText('Pick between {value1} and {value2} students.', {value1: MIN_MEMBERS, value2: MAX_MEMBERS})}
                    </p>
                    <div className={styles.checkList}>
                        {students.map(student => (
                            <label key={student.id} className={styles.checkbox}>
                                <input
                                    type="checkbox"
                                    checked={selected.includes(student.id)}
                                    disabled={student.disabled || (!selected.includes(student.id) && selected.length >= MAX_MEMBERS)}
                                    onChange={() => toggle(student.id)}
                                />
                                <span>{student.displayName}</span>
                            </label>
                        ))}
                    </div>
                </fieldset>
                <div className={styles.field}>
                    <span>{communityText('Assignment (optional)')}</span>
                    <SelectMenu
                        ariaLabel={communityText('Assignment (optional)')}
                        value={assignmentId}
                        onChange={setAssignmentId}
                        options={[
                            {value: '', label: communityText('No assignment')},
                            ...assignments.map(assignment => ({value: assignment.id, label: assignment.title}))
                        ]}
                    />
                    <small className={styles.hint}>{communityText('When linked to an assignment, the group turns in one shared project together.')}</small>
                </div>
                {error ? <Notice variant="error">{error}</Notice> : null}
                <div className={styles.formActions}>
                    <Button onClick={onClose} disabled={busy}>{communityText('Cancel')}</Button>
                    <Button type="submit" variant="primary" disabled={!valid} busy={busy} busyLabel={communityText('Creating…')}>
                        <Plus size={16} aria-hidden="true" />
                        {communityText('Create group')}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

NewGroupModal.propTypes = {
    assignments: PropTypes.array.isRequired,
    classId: PropTypes.string.isRequired,
    onClose: PropTypes.func.isRequired,
    onCreated: PropTypes.func.isRequired,
    students: PropTypes.array.isRequired
};

const ClassGroups = ({assignments, classInfo, students}) => {
    const {text: communityText} = useCommunityText();
    const [data, setData] = useState(null);
    const [error, setError] = useState(false);
    const [attempt, setAttempt] = useState(0);
    const [creating, setCreating] = useState(false);
    const [deleting, setDeleting] = useState(null);
    const [deleteBusy, setDeleteBusy] = useState(false);
    const [deleteError, setDeleteError] = useState('');

    useEffect(() => {
        let active = true;
        setError(false);
        api.classroom.groups(classInfo.id)
            .then(result => {
                if (active) setData(result);
            })
            .catch(() => {
                if (active) setError(true);
            });
        return () => {
            active = false;
        };
    }, [classInfo.id, attempt]);

    const groups = (data && data.groups) || [];
    const liveCollaboration = !data || data.liveCollaboration !== false;
    const assignmentTitle = assignmentId => {
        const assignment = assignments.find(item => item.id === assignmentId);
        return assignment ? assignment.title : '';
    };
    const newButton = (
        <Button variant="primary" onClick={() => setCreating(true)} disabled={classInfo.archived || students.length < MIN_MEMBERS}>
            <Plus size={16} aria-hidden="true" />
            {communityText('New group')}
        </Button>
    );
    const askDelete = group => {
        setDeleteError('');
        setDeleting(group);
    };
    const removeGroup = async () => {
        if (!deleting || deleteBusy) return;
        setDeleteBusy(true);
        setDeleteError('');
        try {
            await api.classroom.deleteGroup(classInfo.id, deleting.id);
            setDeleting(null);
            setAttempt(n => n + 1);
        } catch (e) {
            setDeleteError(e.message || communityText('Could not delete the group.'));
        } finally {
            setDeleteBusy(false);
        }
    };

    return (
        <section aria-labelledby="classroom-groups-heading">
            <SectionHeading
                id="classroom-groups-heading"
                icon={Users2}
                title={communityText('Groups')}
                count={data ? groups.length : null}
                lead={communityText('A group shares one project and works on it together.')}
                actions={newButton}
            />
            {!liveCollaboration ? (
                <Notice className={styles.noticeBefore}>
                    {communityText('Groups can share a project, but editing it together live needs a Classroom plan.')}
                </Notice>
            ) : null}
            {error ? <StatusMessage error onRetry={() => setAttempt(n => n + 1)}>{communityText('Could not load the groups.')}</StatusMessage> : null}
            {!data && !error ? <StatusMessage /> : null}
            {data && !groups.length ? (
                <EmptyState icon={Users2} title={communityText('No groups yet')} action={newButton}>
                    {communityText('Put two to six students together so they can build one project as a team.')}
                </EmptyState>
            ) : null}
            {groups.length ? (
                <ul className={styles.list}>
                    {groups.map(group => (
                        <li key={group.id} className={styles.listRow}>
                            <span className={styles.listText}>
                                <span className={styles.listTitle}>{group.name}</span>
                                <span className={styles.listMeta}>
                                    {communityText('Members: {value1}.', {value1: memberNames(group.members).join(', ')})}
                                    {group.assignmentId && assignmentTitle(group.assignmentId) ? (
                                        <React.Fragment>
                                            {' '}
                                            {communityText('Working on {value1}.', {value1: assignmentTitle(group.assignmentId)})}
                                        </React.Fragment>
                                    ) : null}
                                </span>
                            </span>
                            <span className={styles.listActions}>
                                {group.projectId ? (
                                    <Button as={Link} to={projectUrl({id: group.projectId})}>
                                        <ExternalLink size={15} aria-hidden="true" />
                                        {communityText('Open project')}
                                    </Button>
                                ) : null}
                                <IconButton label={communityText('Delete {value1}', {value1: group.name})} onClick={() => askDelete(group)}>
                                    <Trash2 size={16} />
                                </IconButton>
                            </span>
                        </li>
                    ))}
                </ul>
            ) : null}
            {creating ? (
                <NewGroupModal
                    classId={classInfo.id}
                    students={students}
                    assignments={assignments}
                    onClose={() => setCreating(false)}
                    onCreated={() => {
                        setCreating(false);
                        setAttempt(n => n + 1);
                    }}
                />
            ) : null}
            {deleting ? (
                <ConfirmModal
                    destructive
                    title={communityText('Delete the group {value1}?', {value1: deleting.name})}
                    confirmLabel={communityText('Delete group')}
                    busy={deleteBusy}
                    error={deleteError}
                    onCancel={() => setDeleting(null)}
                    onConfirm={removeGroup}
                >
                    {communityText('The shared project stays with its members, but they stop working on it as a group.')}
                </ConfirmModal>
            ) : null}
        </section>
    );
};

ClassGroups.propTypes = {
    assignments: PropTypes.array.isRequired,
    classInfo: PropTypes.object.isRequired,
    students: PropTypes.array.isRequired
};

export {NewGroupModal, memberNames};
export default ClassGroups;
