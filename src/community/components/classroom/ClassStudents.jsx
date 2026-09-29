import {useCommunityIntl as useCommunityText} from '../../i18n.jsx';
/* eslint-disable max-len */
import PropTypes from 'prop-types';
import React, {useState} from 'react';
import {Link} from 'react-router-dom';
import {ArrowRightLeft, KeyRound, LockOpen, MoreHorizontal, Trash2, UserCheck, UserPlus, Users, UserX} from 'lucide-react';
import api from '../../api';
import {freeSeats, initials, parseStudentNames, relativeTime} from '../../classroom.js';
import {formatBytes} from '../../format.js';
import Button from '../ui/Button.jsx';
import ConfirmModal from '../ui/ConfirmModal.jsx';
import Dropdown, {DropdownItem} from '../ui/Dropdown.jsx';
import EmptyState from '../ui/EmptyState.jsx';
import IconButton from '../ui/IconButton.jsx';
import Modal from '../ui/Modal.jsx';
import Notice from '../ui/Notice.jsx';
import SectionHeading from '../ui/SectionHeading.jsx';
import SelectMenu from '../ui/SelectMenu.jsx';
import CredentialsResult from './CredentialsResult.jsx';
import styles from '../../pages/Classroom.module.css';

const AddStudentsModal = ({classInfo, free, onClose, onAdded}) => {
    const {text: communityText} = useCommunityText();
    const [value, setValue] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState(null);
    const names = parseStudentNames(value);
    const tooMany = names.length > free;
    const submit = async event => {
        event.preventDefault();
        if (!names.length || tooMany || busy) return;
        setBusy(true);
        setError('');
        try {
            const data = await api.classroom.addStudents(classInfo.id, names.slice(0, 100));
            setResult(data);
        } catch (e) {
            setError(e.message || communityText('Could not add the students.'));
        } finally {
            setBusy(false);
        }
    };
    if (result) {
        return (
            <Modal title={communityText('Login details')} icon={KeyRound} onClose={onAdded} className={styles.wideModal}>
                <CredentialsResult
                    classTitle={classInfo.name}
                    code={classInfo.code}
                    loginMode={result.loginMode || classInfo.loginMode}
                    students={result.students || []}
                    onDone={onAdded}
                />
            </Modal>
        );
    }
    return (
        <Modal title={communityText('Add students')} icon={UserPlus} onClose={onClose} dismissDisabled={busy}>
            <form className={styles.form} onSubmit={submit}>
                <label className={styles.field}>
                    <span>{communityText('Student names, one per line')}</span>
                    <textarea
                        value={value}
                        rows={8}
                        autoFocus
                        placeholder={'Ada Okafor\nBen Carter'}
                        onChange={event => setValue(event.target.value)}
                    />
                </label>
                <p className={tooMany ? styles.hintWarning : styles.hint}>
                    {communityText('{value1, plural, =0 {No names yet.} one {# name entered.} other {# names entered.}}', {value1: names.length})}
                    {' '}
                    {communityText('{value1, plural, one {# seat is} other {# seats are}} free on your plan.', {value1: free})}
                </p>
                {tooMany ? <Notice variant="warning">{communityText('Remove some names or ask your school for more seats.')}</Notice> : null}
                {error ? <Notice variant="error">{error}</Notice> : null}
                <div className={styles.formActions}>
                    <Button onClick={onClose} disabled={busy}>{communityText('Cancel')}</Button>
                    <Button type="submit" variant="primary" disabled={!names.length || tooMany} busy={busy} busyLabel={communityText('Adding…')}>
                        <UserPlus size={16} aria-hidden="true" />
                        {communityText('{value1, plural, =0 {Add students} one {Add # student} other {Add # students}}', {value1: names.length})}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

AddStudentsModal.propTypes = {
    classInfo: PropTypes.object.isRequired,
    free: PropTypes.number.isRequired,
    onAdded: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired
};

const MoveStudentModal = ({classInfo, classes, onClose, onMoved, student}) => {
    const {text: communityText} = useCommunityText();
    const targets = classes.filter(item => item.id !== classInfo.id && item.loginMode === classInfo.loginMode && !item.archived);
    const [target, setTarget] = useState(targets.length ? targets[0].id : '');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const move = async () => {
        if (!target || busy) return;
        setBusy(true);
        setError('');
        try {
            await api.classroom.moveStudent(classInfo.id, student.id, target);
            onMoved();
        } catch (e) {
            setError(e.message || communityText('Could not move the student.'));
            setBusy(false);
        }
    };
    return (
        <Modal
            title={communityText('Move {value1}', {value1: student.displayName})}
            icon={ArrowRightLeft}
            onClose={onClose}
            dismissDisabled={busy}
            actions={(
                <React.Fragment>
                    <Button onClick={onClose} disabled={busy}>{communityText('Cancel')}</Button>
                    <Button variant="primary" onClick={move} disabled={!target} busy={busy} busyLabel={communityText('Moving…')}>
                        <ArrowRightLeft size={16} aria-hidden="true" />
                        {communityText('Move')}
                    </Button>
                </React.Fragment>
            )}
        >
            {targets.length ? (
                <div className={styles.field}>
                    <span>{communityText('Move to class')}</span>
                    <SelectMenu
                        ariaLabel={communityText('Move to class')}
                        value={target}
                        onChange={setTarget}
                        options={targets.map(item => ({value: item.id, label: item.name}))}
                    />
                    <small className={styles.hint}>{communityText('Only classes with the same sign-in method are listed. The login card keeps working with the new class code.')}</small>
                </div>
            ) : (
                <Notice>{communityText('There is no other class with the same sign-in method to move this student to.')}</Notice>
            )}
            {error ? <Notice variant="error">{error}</Notice> : null}
        </Modal>
    );
};

MoveStudentModal.propTypes = {
    classInfo: PropTypes.object.isRequired,
    classes: PropTypes.array.isRequired,
    onClose: PropTypes.func.isRequired,
    onMoved: PropTypes.func.isRequired,
    student: PropTypes.object.isRequired
};

const StudentStatus = ({student}) => {
    const {text: communityText} = useCommunityText();
    if (student.disabled) return <span className={styles.statusDisabled}>{communityText('Disabled')}</span>;
    if (student.locked) return <span className={styles.statusLocked}>{communityText('Locked')}</span>;
    return <span className={styles.statusActive}>{communityText('Active')}</span>;
};

StudentStatus.propTypes = {
    student: PropTypes.object.isRequired
};

const ClassStudents = ({classInfo, classes, onReload, plan, students, usage}) => {
    const {text: communityText} = useCommunityText();
    const [adding, setAdding] = useState(false);
    const [pending, setPending] = useState(null);
    const [resetResult, setResetResult] = useState(null);
    const [busyId, setBusyId] = useState('');
    const [error, setError] = useState('');
    const free = freeSeats(plan, usage);
    const addButton = (
        <Button variant="primary" onClick={() => setAdding(true)} disabled={classInfo.archived}>
            <UserPlus size={16} aria-hidden="true" />
            {communityText('Add students')}
        </Button>
    );

    const runAction = async (student, request, after) => {
        if (busyId) return;
        setBusyId(student.id);
        setError('');
        try {
            const data = await request();
            if (after) after(data);
            onReload();
        } catch (e) {
            setError(e.message || communityText('That change did not save. Please try again.'));
        } finally {
            setBusyId('');
        }
    };

    const confirmPending = () => {
        const {type, student} = pending;
        if (type === 'reset') {
            runAction(student, () => api.classroom.resetStudent(classInfo.id, student.id), data => {
                setResetResult({
                    loginMode: data.loginMode || classInfo.loginMode,
                    students: [{...(data.student || student), credentials: data.credentials}]
                });
            });
        } else if (type === 'delete') {
            runAction(student, () => api.classroom.deleteStudent(classInfo.id, student.id));
        }
        setPending(null);
    };

    return (
        <section aria-labelledby="classroom-students-heading">
            <SectionHeading id="classroom-students-heading" icon={Users} title={communityText('Students')} count={students.length} actions={addButton} />
            {error ? <Notice variant="error" className={styles.noticeBefore} onDismiss={() => setError('')}>{error}</Notice> : null}
            {students.length ? (
                <div className={styles.tableWrap}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th scope="col">{communityText('Name')}</th>
                                <th scope="col" className={styles.hideNarrow}>{communityText('Username')}</th>
                                <th scope="col">{communityText('Last sign-in')}</th>
                                <th scope="col" className={styles.numeric}>{communityText('Projects')}</th>
                                <th scope="col" className={`${styles.numeric} ${styles.hideNarrow}`}>{communityText('Storage')}</th>
                                <th scope="col">{communityText('Status')}</th>
                                <th scope="col"><span className={styles.visuallyHidden}>{communityText('Actions')}</span></th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.map(student => (
                                <tr key={student.id} className={student.disabled ? styles.rowDisabled : null}>
                                    <td>
                                        <Link to={`/classroom/${classInfo.id}/students/${student.id}`} className={styles.nameCell}>
                                            <span className={styles.initials} aria-hidden="true">{initials(student.displayName)}</span>
                                            <span>{student.displayName}</span>
                                        </Link>
                                    </td>
                                    <td className={`${styles.muted} ${styles.hideNarrow}`}>{student.username}</td>
                                    <td className={styles.muted}>{student.lastLoginAt ? relativeTime(student.lastLoginAt) : communityText('Never')}</td>
                                    <td className={styles.numeric}>{student.projectCount || 0}</td>
                                    <td className={`${styles.numeric} ${styles.hideNarrow}`}>{formatBytes(student.storageBytes)}</td>
                                    <td><StudentStatus student={student} /></td>
                                    <td className={styles.rowActions}>
                                        <Dropdown
                                            renderTrigger={({open, toggle}) => (
                                                <IconButton
                                                    label={communityText('Actions for {value1}', {value1: student.displayName})}
                                                    aria-haspopup="menu"
                                                    aria-expanded={open}
                                                    busy={busyId === student.id}
                                                    onClick={toggle}
                                                >
                                                    <MoreHorizontal size={18} />
                                                </IconButton>
                                            )}
                                        >
                                            {({close}) => (
                                                <React.Fragment>
                                                    <DropdownItem
                                                        onClick={() => {
                                                            close();
                                                            setPending({type: 'reset', student});
                                                        }}
                                                    >
                                                        <KeyRound size={15} aria-hidden="true" />
                                                        {communityText('Reset sign-in')}
                                                    </DropdownItem>
                                                    <DropdownItem
                                                        onClick={() => {
                                                            close();
                                                            runAction(student, () => api.classroom.updateStudent(classInfo.id, student.id, {disabled: !student.disabled}));
                                                        }}
                                                    >
                                                        {student.disabled ? <UserCheck size={15} aria-hidden="true" /> : <UserX size={15} aria-hidden="true" />}
                                                        {student.disabled ? communityText('Enable') : communityText('Disable')}
                                                    </DropdownItem>
                                                    {student.locked ? (
                                                        <DropdownItem
                                                            onClick={() => {
                                                                close();
                                                                runAction(student, () => api.classroom.updateStudent(classInfo.id, student.id, {unlock: true}));
                                                            }}
                                                        >
                                                            <LockOpen size={15} aria-hidden="true" />
                                                            {communityText('Unlock')}
                                                        </DropdownItem>
                                                    ) : null}
                                                    <DropdownItem
                                                        onClick={() => {
                                                            close();
                                                            setPending({type: 'move', student});
                                                        }}
                                                    >
                                                        <ArrowRightLeft size={15} aria-hidden="true" />
                                                        {communityText('Move to another class')}
                                                    </DropdownItem>
                                                    <DropdownItem
                                                        danger onClick={() => {
                                                            close();
                                                            setPending({type: 'delete', student});
                                                        }}
                                                    >
                                                        <Trash2 size={15} aria-hidden="true" />
                                                        {communityText('Delete')}
                                                    </DropdownItem>
                                                </React.Fragment>
                                            )}
                                        </Dropdown>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <EmptyState icon={Users} title={communityText('No students yet')} action={addButton}>
                    {communityText('Add your students by name. Each one gets a login card to print.')}
                </EmptyState>
            )}
            {adding ? (
                <AddStudentsModal
                    classInfo={classInfo}
                    free={free}
                    onClose={() => setAdding(false)}
                    onAdded={() => {
                        setAdding(false);
                        onReload();
                    }}
                />
            ) : null}
            {pending && pending.type === 'reset' ? (
                <ConfirmModal
                    title={communityText('Reset sign-in for {value1}?', {value1: pending.student.displayName})}
                    icon={KeyRound}
                    confirmLabel={communityText('Reset sign-in')}
                    onCancel={() => setPending(null)}
                    onConfirm={confirmPending}
                >
                    {classInfo.loginMode === 'picture' ?
                        communityText('{value1} will be signed out everywhere and get three new pictures. The old login card stops working.', {value1: pending.student.displayName}) :
                        communityText('{value1} will be signed out everywhere and get a new password. The old login card stops working.', {value1: pending.student.displayName})}
                </ConfirmModal>
            ) : null}
            {pending && pending.type === 'delete' ? (
                <ConfirmModal
                    destructive
                    title={communityText('Delete {value1}?', {value1: pending.student.displayName})}
                    confirmLabel={communityText('Delete account and projects')}
                    onCancel={() => setPending(null)}
                    onConfirm={confirmPending}
                >
                    {communityText('This permanently deletes the account of {value1} and every project in it. This cannot be undone.', {value1: pending.student.displayName})}
                </ConfirmModal>
            ) : null}
            {pending && pending.type === 'move' ? (
                <MoveStudentModal
                    classInfo={classInfo}
                    classes={classes}
                    student={pending.student}
                    onClose={() => setPending(null)}
                    onMoved={() => {
                        setPending(null);
                        onReload();
                    }}
                />
            ) : null}
            {resetResult ? (
                <Modal title={communityText('New login details')} icon={KeyRound} onClose={() => setResetResult(null)} className={styles.wideModal}>
                    <CredentialsResult
                        classTitle={classInfo.name}
                        code={classInfo.code}
                        loginMode={resetResult.loginMode}
                        students={resetResult.students}
                        onDone={() => setResetResult(null)}
                    />
                </Modal>
            ) : null}
        </section>
    );
};

ClassStudents.propTypes = {
    classInfo: PropTypes.object.isRequired,
    classes: PropTypes.array.isRequired,
    onReload: PropTypes.func.isRequired,
    plan: PropTypes.object.isRequired,
    students: PropTypes.array.isRequired,
    usage: PropTypes.object.isRequired
};

export {AddStudentsModal, MoveStudentModal};
export default ClassStudents;
