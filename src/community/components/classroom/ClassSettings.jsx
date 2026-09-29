import {useCommunityIntl as useCommunityText} from '../../i18n.jsx';
/* eslint-disable max-len */
import PropTypes from 'prop-types';
import React, {useEffect, useState} from 'react';
import {Archive, ArrowRightLeft, Check, Copy, Hash, History, Pencil, RefreshCw, Trash2, UserPlus, Users, X} from 'lucide-react';
import api from '../../api';
import {auditSentence, joinUrl, relativeTime} from '../../classroom.js';
import copyText from '../../copy-text.js';
import Avatar from '../Avatar.jsx';
import UserLink from '../UserLink.jsx';
import Button from '../ui/Button.jsx';
import ConfirmModal from '../ui/ConfirmModal.jsx';
import EmptyState from '../ui/EmptyState.jsx';
import IconButton from '../ui/IconButton.jsx';
import Notice from '../ui/Notice.jsx';
import SectionHeading from '../ui/SectionHeading.jsx';
import StatusMessage from '../ui/StatusMessage.jsx';
import {SwitchRow} from '../ui/Switch.jsx';
import styles from '../../pages/Classroom.module.css';

const CopyButton = ({label, value}) => {
    const {text: communityText} = useCommunityText();
    const [copied, setCopied] = useState(false);
    useEffect(() => {
        if (!copied) return () => {};
        const timer = setTimeout(() => setCopied(false), 1600);
        return () => clearTimeout(timer);
    }, [copied]);
    return (
        <IconButton
            label={copied ? communityText('Copied') : label}
            onClick={() => copyText(value).then(() => setCopied(true)).catch(() => setCopied(false))}
        >
            {copied ? <Check size={17} /> : <Copy size={17} />}
        </IconButton>
    );
};

CopyButton.propTypes = {
    label: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired
};

const ClassSettings = ({assignments, classInfo, onDeleted, onReload, students, viewer}) => {
    const {text: communityText} = useCommunityText();
    const isOwner = Boolean(classInfo.isOwner);
    const [name, setName] = useState(classInfo.name);
    const [nameBusy, setNameBusy] = useState(false);
    const [nameSaved, setNameSaved] = useState(false);
    const [archiveBusy, setArchiveBusy] = useState(false);
    const [teacherName, setTeacherName] = useState('');
    const [teacherBusy, setTeacherBusy] = useState('');
    const [transferName, setTransferName] = useState('');
    const [keepAsCoTeacher, setKeepAsCoTeacher] = useState(true);
    const [confirmation, setConfirmation] = useState(null);
    const [confirmBusy, setConfirmBusy] = useState(false);
    const [confirmError, setConfirmError] = useState('');
    const [error, setError] = useState('');
    const [events, setEvents] = useState(null);
    const [eventsError, setEventsError] = useState(false);
    const [eventsAttempt, setEventsAttempt] = useState(0);

    useEffect(() => {
        setName(classInfo.name);
    }, [classInfo.name]);

    useEffect(() => {
        let active = true;
        setEvents(null);
        setEventsError(false);
        api.classroom.audit(classInfo.id)
            .then(data => {
                if (active) setEvents(data.events || []);
            })
            .catch(() => {
                if (active) setEventsError(true);
            });
        return () => {
            active = false;
        };
    }, [classInfo.id, eventsAttempt]);

    const fail = (e, fallback) => setError((e && e.message) || fallback);
    const askConfirmation = payload => {
        setConfirmError('');
        setConfirmation(payload);
    };
    const requestTransfer = event => {
        event.preventDefault();
        const username = transferName.trim();
        if (username) askConfirmation({type: 'transfer', username});
    };

    const saveName = async event => {
        event.preventDefault();
        const trimmed = name.trim();
        if (!trimmed || trimmed === classInfo.name || nameBusy) return;
        setNameBusy(true);
        setError('');
        setNameSaved(false);
        try {
            await api.classroom.updateClass(classInfo.id, {name: trimmed});
            setNameSaved(true);
            onReload();
        } catch (e) {
            fail(e, communityText('Could not rename the class.'));
        } finally {
            setNameBusy(false);
        }
    };

    const setArchived = async archived => {
        if (archiveBusy) return;
        setArchiveBusy(true);
        setError('');
        try {
            await api.classroom.updateClass(classInfo.id, {archived});
            onReload();
        } catch (e) {
            fail(e, communityText('Could not change the archive setting.'));
        } finally {
            setArchiveBusy(false);
        }
    };

    const addTeacher = async event => {
        event.preventDefault();
        const username = teacherName.trim();
        if (!username || teacherBusy) return;
        setTeacherBusy('add');
        setError('');
        try {
            await api.classroom.addTeacher(classInfo.id, username);
            setTeacherName('');
            onReload();
        } catch (e) {
            fail(e, communityText('Could not add that co-teacher.'));
        } finally {
            setTeacherBusy('');
        }
    };

    const removeTeacher = async teacher => {
        if (teacherBusy) return;
        setTeacherBusy(teacher.userId);
        setError('');
        try {
            await api.classroom.removeTeacher(classInfo.id, teacher.userId);
            onReload();
        } catch (e) {
            fail(e, communityText('Could not remove that co-teacher.'));
        } finally {
            setTeacherBusy('');
        }
    };

    const runConfirmation = async () => {
        if (!confirmation || confirmBusy) return;
        setConfirmBusy(true);
        setConfirmError('');
        try {
            if (confirmation.type === 'reset-code') {
                await api.classroom.resetCode(classInfo.id);
                onReload();
            } else if (confirmation.type === 'transfer') {
                await api.classroom.transferClass(classInfo.id, confirmation.username, keepAsCoTeacher);
                setTransferName('');
                onReload();
            } else if (confirmation.type === 'delete') {
                await api.classroom.deleteClass(classInfo.id);
                onDeleted();
                return;
            }
            setConfirmation(null);
        } catch (e) {
            setConfirmError((e && e.message) || communityText('That change did not save. Please try again.'));
        } finally {
            setConfirmBusy(false);
        }
    };

    const studentName = studentId => {
        const student = students.find(item => item.id === studentId);
        return student ? student.displayName : communityText('a student');
    };
    const assignmentTitle = assignmentId => {
        const assignment = assignments.find(item => item.id === assignmentId);
        return assignment ? assignment.title : communityText('an assignment');
    };
    const coTeachers = (classInfo.coTeachers || []).map(teacher => (typeof teacher === 'string' ? {userId: teacher, username: teacher} : teacher));
    const viewerName = (viewer && viewer.username) || '';
    const link = joinUrl(classInfo.code);

    return (
        <div className={styles.settings}>
            {error ? <Notice variant="error" onDismiss={() => setError('')}>{error}</Notice> : null}
            <section className={styles.card} aria-labelledby="classroom-name-heading">
                <SectionHeading as="h3" id="classroom-name-heading" icon={Pencil} title={communityText('Class name')} />
                <form className={styles.inlineForm} onSubmit={saveName}>
                    <input
                        value={name} maxLength={80} aria-label={communityText('Class name')} onChange={event => {
                            setName(event.target.value); setNameSaved(false);
                        }}
                    />
                    <Button type="submit" variant="primary" disabled={!name.trim() || name.trim() === classInfo.name} busy={nameBusy} busyLabel={communityText('Saving…')}>
                        {nameSaved ? <Check size={16} aria-hidden="true" /> : null}
                        {nameSaved ? communityText('Saved') : communityText('Save')}
                    </Button>
                </form>
            </section>
            <section className={styles.card} aria-labelledby="classroom-code-heading">
                <SectionHeading as="h3" id="classroom-code-heading" icon={Hash} title={communityText('Class code')} lead={communityText('Students enter this code on the sign-in page. It is printed on every login card.')} />
                <div className={styles.codeBox}>
                    <span className={styles.codeValue}>{classInfo.code}</span>
                    <CopyButton label={communityText('Copy class code')} value={classInfo.code} />
                </div>
                <div className={styles.codeLink}>
                    <a href={link} target="_blank" rel="noreferrer">{link}</a>
                    <CopyButton label={communityText('Copy join link')} value={link} />
                </div>
                <div className={styles.cardActions}>
                    <Button onClick={() => askConfirmation({type: 'reset-code'})}>
                        <RefreshCw size={16} aria-hidden="true" />
                        {communityText('Reset code')}
                    </Button>
                </div>
            </section>
            <section className={styles.card} aria-labelledby="classroom-archive-heading">
                <SectionHeading as="h3" id="classroom-archive-heading" icon={Archive} title={communityText('Archive')} />
                <SwitchRow
                    label={communityText('Archive this class')}
                    description={communityText('An archived class is kept for your records and marked as finished. Unarchive it to keep working with it.')}
                    checked={Boolean(classInfo.archived)}
                    disabled={archiveBusy}
                    onChange={setArchived}
                />
            </section>
            <section className={styles.card} aria-labelledby="classroom-teachers-heading">
                <SectionHeading
                    as="h3"
                    id="classroom-teachers-heading"
                    icon={Users}
                    title={communityText('Co-teachers')}
                    lead={isOwner ?
                        communityText('Co-teachers can manage students and assignments. Only you can change these settings.') :
                        communityText('Only the class owner can add or remove co-teachers.')}
                />
                <ul className={styles.peopleList}>
                    <li className={styles.personRow}>
                        <UserLink username={classInfo.owner}><Avatar username={classInfo.owner} size={34} /></UserLink>
                        <span className={styles.personText}>
                            <UserLink username={classInfo.owner}><strong>{classInfo.owner}</strong></UserLink>
                            <span>{communityText('Owner')}</span>
                        </span>
                    </li>
                    {coTeachers.map(teacher => (
                        <li key={teacher.userId} className={styles.personRow}>
                            <UserLink username={teacher.username}><Avatar username={teacher.username} size={34} /></UserLink>
                            <span className={styles.personText}>
                                <UserLink username={teacher.username}><strong>{teacher.username}</strong></UserLink>
                                <span>{communityText('Co-teacher')}</span>
                            </span>
                            {isOwner || teacher.username.toLowerCase() === viewerName.toLowerCase() ? (
                                <IconButton
                                    label={isOwner ? communityText('Remove {value1}', {value1: teacher.username}) : communityText('Leave this class')}
                                    busy={teacherBusy === teacher.userId}
                                    onClick={() => removeTeacher(teacher)}
                                >
                                    <X size={16} />
                                </IconButton>
                            ) : null}
                        </li>
                    ))}
                </ul>
                {isOwner ? (
                    <form className={styles.inlineForm} onSubmit={addTeacher}>
                        <input value={teacherName} placeholder={communityText('Rotur username')} aria-label={communityText('Rotur username')} onChange={event => setTeacherName(event.target.value)} />
                        <Button type="submit" variant="primary" disabled={!teacherName.trim()} busy={teacherBusy === 'add'} busyLabel={communityText('Adding…')}>
                            <UserPlus size={16} aria-hidden="true" />
                            {communityText('Add co-teacher')}
                        </Button>
                    </form>
                ) : null}
            </section>
            {isOwner ? (
                <section className={styles.card} aria-labelledby="classroom-transfer-heading">
                    <SectionHeading as="h3" id="classroom-transfer-heading" icon={ArrowRightLeft} title={communityText('Transfer ownership')} lead={communityText('The new owner must have seats for these students on their plan.')} />
                    <form className={styles.inlineForm} onSubmit={requestTransfer}>
                        <input value={transferName} placeholder={communityText('Rotur username')} aria-label={communityText('New owner')} onChange={event => setTransferName(event.target.value)} />
                        <Button type="submit" disabled={!transferName.trim()}>
                            <ArrowRightLeft size={16} aria-hidden="true" />
                            {communityText('Transfer')}
                        </Button>
                    </form>
                    <label className={styles.checkbox}>
                        <input type="checkbox" checked={keepAsCoTeacher} onChange={event => setKeepAsCoTeacher(event.target.checked)} />
                        <span>{communityText('Keep me as a co-teacher')}</span>
                    </label>
                </section>
            ) : null}
            <section className={styles.card} aria-labelledby="classroom-activity-heading">
                <SectionHeading as="h3" id="classroom-activity-heading" icon={History} title={communityText('Recent activity')} />
                {events === null && !eventsError ? <StatusMessage compact /> : null}
                {eventsError ? <StatusMessage compact error onRetry={() => setEventsAttempt(n => n + 1)}>{communityText('Could not load the activity log.')}</StatusMessage> : null}
                {events && !events.length ? <EmptyState compact icon={History} title={communityText('No activity yet')} /> : null}
                {events && events.length ? (
                    <ul className={styles.activityList}>
                        {events.slice(0, 30).map(event => (
                            <li key={event._id} className={styles.activityRow}>
                                <span>{auditSentence(event, {text: communityText, studentName, assignmentTitle})}</span>
                                <time dateTime={new Date(event.at).toISOString()}>{relativeTime(event.at)}</time>
                            </li>
                        ))}
                    </ul>
                ) : null}
            </section>
            {isOwner ? (
                <section className={styles.dangerCard} aria-labelledby="classroom-delete-heading">
                    <SectionHeading
                        as="h3"
                        id="classroom-delete-heading"
                        icon={Trash2}
                        title={communityText('Delete class')}
                        lead={students.length ?
                            communityText('Move or delete every student before deleting the class. It still has {value1, plural, one {# student} other {# students}}.', {value1: students.length}) :
                            communityText('This class has no students, so it can be deleted. This cannot be undone.')}
                    />
                    <div className={styles.cardActions}>
                        <Button variant="danger" disabled={students.length > 0} onClick={() => askConfirmation({type: 'delete'})}>
                            <Trash2 size={16} aria-hidden="true" />
                            {communityText('Delete class')}
                        </Button>
                    </div>
                </section>
            ) : null}
            {confirmation && confirmation.type === 'reset-code' ? (
                <ConfirmModal
                    title={communityText('Reset the class code?')}
                    icon={RefreshCw}
                    confirmLabel={communityText('Reset code')}
                    busy={confirmBusy}
                    error={confirmError}
                    onCancel={() => setConfirmation(null)}
                    onConfirm={runConfirmation}
                >
                    {communityText('Printed login cards show the old code and will stop working. Students need the new code to sign in.')}
                </ConfirmModal>
            ) : null}
            {confirmation && confirmation.type === 'transfer' ? (
                <ConfirmModal
                    title={communityText('Transfer this class to {value1}?', {value1: confirmation.username})}
                    icon={ArrowRightLeft}
                    confirmLabel={communityText('Transfer')}
                    busy={confirmBusy}
                    error={confirmError}
                    onCancel={() => setConfirmation(null)}
                    onConfirm={runConfirmation}
                >
                    {keepAsCoTeacher ?
                        communityText('{value1} becomes the owner and you stay on as a co-teacher.', {value1: confirmation.username}) :
                        communityText('{value1} becomes the owner and you lose access to this class.', {value1: confirmation.username})}
                </ConfirmModal>
            ) : null}
            {confirmation && confirmation.type === 'delete' ? (
                <ConfirmModal
                    destructive
                    title={communityText('Delete this class?')}
                    confirmLabel={communityText('Delete class')}
                    busy={confirmBusy}
                    error={confirmError}
                    onCancel={() => setConfirmation(null)}
                    onConfirm={runConfirmation}
                >
                    {communityText('The class, its assignments, and its activity log are deleted permanently.')}
                </ConfirmModal>
            ) : null}
        </div>
    );
};

ClassSettings.propTypes = {
    assignments: PropTypes.array.isRequired,
    classInfo: PropTypes.object.isRequired,
    onDeleted: PropTypes.func.isRequired,
    onReload: PropTypes.func.isRequired,
    students: PropTypes.array.isRequired,
    viewer: PropTypes.object
};

ClassSettings.defaultProps = {
    viewer: null
};

export {CopyButton};
export default ClassSettings;
