import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
/* eslint-disable max-len */
import React, {useCallback, useEffect, useState} from 'react';
import {Link, useSearchParams} from 'react-router-dom';
import {Building2, Download, History, School, ShieldCheck, ShieldOff, UserPlus, Users, X} from 'lucide-react';
import api from '../api';
import {useUser} from '../UserContext.jsx';
import {auditSentence, relativeTime} from '../classroom.js';
import {formatBytes, formatDate} from '../format.js';
import downloadBlob from '../../lib/utils/download-blob.js';
import Avatar from '../components/Avatar.jsx';
import UserLink from '../components/UserLink.jsx';
import UnderlineTabs from '../components/UnderlineTabs.jsx';
import Button from '../components/ui/Button.jsx';
import ConfirmModal from '../components/ui/ConfirmModal.jsx';
import EmptyState, {SignInPrompt} from '../components/ui/EmptyState.jsx';
import IconButton from '../components/ui/IconButton.jsx';
import Notice from '../components/ui/Notice.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import SectionHeading from '../components/ui/SectionHeading.jsx';
import StatusMessage from '../components/ui/StatusMessage.jsx';
import UsageMeter from '../components/classroom/UsageMeter.jsx';
import {tierLabel} from './Classroom.jsx';
import styles from './Classroom.module.css';

const TABS = ['teachers', 'classes', 'activity'];
const normalizeTab = value => (TABS.includes(value) ? value : 'teachers');

const SchoolTeachers = ({onReload, teachers, viewer}) => {
    const {text: communityText} = useCommunityText();
    const [username, setUsername] = useState('');
    const [busy, setBusy] = useState('');
    const [error, setError] = useState('');
    const [removing, setRemoving] = useState(null);
    const run = async (key, request) => {
        if (busy) return;
        setBusy(key);
        setError('');
        try {
            await request();
            onReload();
        } catch (e) {
            setError(e.message || communityText('That change did not save. Please try again.'));
        } finally {
            setBusy('');
        }
    };
    const add = event => {
        event.preventDefault();
        const name = username.trim();
        if (!name) return;
        run('add', async () => {
            await api.classroom.addSchoolTeacher(name);
            setUsername('');
        });
    };
    const viewerName = ((viewer && viewer.username) || '').toLowerCase();
    return (
        <section aria-labelledby="school-teachers-heading">
            <SectionHeading id="school-teachers-heading" icon={Users} title={communityText('Teachers')} count={teachers.length} />
            {error ? <Notice variant="error" className={styles.noticeBefore} onDismiss={() => setError('')}>{error}</Notice> : null}
            <div className={styles.tableWrap}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th scope="col">{communityText('Teacher')}</th>
                            <th scope="col" className={styles.numeric}>{communityText('Classes')}</th>
                            <th scope="col" className={styles.numeric}>{communityText('Students')}</th>
                            <th scope="col">{communityText('Role')}</th>
                            <th scope="col"><span className={styles.visuallyHidden}>{communityText('Actions')}</span></th>
                        </tr>
                    </thead>
                    <tbody>
                        {teachers.map(teacher => (
                            <tr key={teacher.userId}>
                                <td>
                                    <UserLink username={teacher.username} className={styles.nameCell}>
                                        <Avatar username={teacher.username} size={32} />
                                        <span>{teacher.username}</span>
                                    </UserLink>
                                </td>
                                <td className={styles.numeric}>{teacher.classes || 0}</td>
                                <td className={styles.numeric}>{teacher.students || 0}</td>
                                <td>{teacher.isAdmin ? <span className={styles.chip}>{communityText('Admin')}</span> : <span className={styles.muted}>{communityText('Teacher')}</span>}</td>
                                <td className={styles.rowActions}>
                                    <span className={styles.listActions}>
                                        <Button
                                            busy={busy === `admin-${teacher.userId}`}
                                            disabled={Boolean(busy)}
                                            onClick={() => run(`admin-${teacher.userId}`, () => api.classroom.setSchoolAdmin(teacher.userId, !teacher.isAdmin))}
                                        >
                                            {teacher.isAdmin ? <ShieldOff size={15} aria-hidden="true" /> : <ShieldCheck size={15} aria-hidden="true" />}
                                            {teacher.isAdmin ? communityText('Remove admin') : communityText('Make admin')}
                                        </Button>
                                        <IconButton
                                            label={communityText('Remove {value1}', {value1: teacher.username})}
                                            disabled={Boolean(busy) || teacher.username.toLowerCase() === viewerName}
                                            onClick={() => setRemoving(teacher)}
                                        >
                                            <X size={16} />
                                        </IconButton>
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <form className={`${styles.inlineForm} ${styles.formAfter}`} onSubmit={add}>
                <input value={username} placeholder={communityText('Rotur username')} aria-label={communityText('Rotur username')} onChange={event => setUsername(event.target.value)} />
                <Button type="submit" variant="primary" disabled={!username.trim()} busy={busy === 'add'} busyLabel={communityText('Adding…')}>
                    <UserPlus size={16} aria-hidden="true" />
                    {communityText('Add teacher')}
                </Button>
            </form>
            {removing ? (
                <ConfirmModal
                    destructive
                    title={communityText('Remove {value1} from the school?', {value1: removing.username})}
                    confirmLabel={communityText('Remove teacher')}
                    busy={busy === 'remove'}
                    onCancel={() => setRemoving(null)}
                    onConfirm={() => run('remove', async () => {
                        await api.classroom.removeSchoolTeacher(removing.userId);
                        setRemoving(null);
                    })}
                >
                    {communityText('{value1} loses access to the school plan. Their classes stay with them.', {value1: removing.username})}
                </ConfirmModal>
            ) : null}
        </section>
    );
};

const ClassroomSchool = () => {
    const {text: communityText} = useCommunityText();
    const {user, loading, login} = useUser();
    const [searchParams, setSearchParams] = useSearchParams();
    const tab = normalizeTab(searchParams.get('tab'));
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [attempt, setAttempt] = useState(0);
    const [events, setEvents] = useState(null);
    const [eventsError, setEventsError] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [exportError, setExportError] = useState('');
    const reload = useCallback(() => setAttempt(n => n + 1), []);
    const username = (user && user.username) || '';

    useEffect(() => {
        if (!username) return () => {};
        let active = true;
        setError(null);
        api.classroom.school()
            .then(result => {
                if (active) setData(result);
            })
            .catch(e => {
                if (active) setError(e);
            });
        return () => {
            active = false;
        };
    }, [username, attempt]);

    useEffect(() => {
        if (!username || tab !== 'activity') return () => {};
        let active = true;
        setEvents(null);
        setEventsError(false);
        api.classroom.schoolAudit(60)
            .then(result => {
                if (active) setEvents(result.events || []);
            })
            .catch(() => {
                if (active) setEventsError(true);
            });
        return () => {
            active = false;
        };
    }, [username, tab, attempt]);

    const setTab = next => {
        const params = new URLSearchParams(searchParams);
        if (next === 'teachers') params.delete('tab');
        else params.set('tab', next);
        setSearchParams(params, {replace: true});
    };

    const exportData = async () => {
        if (exporting) return;
        setExporting(true);
        setExportError('');
        try {
            const response = await api.classroom.schoolExport();
            if (!response.ok) throw new Error(communityText('The download could not be prepared.'));
            const blob = await response.blob();
            downloadBlob(`${(data && data.school && data.school.name) || 'school'}-classroom-data.json`, blob);
        } catch (e) {
            setExportError(e.message || communityText('The download could not be prepared.'));
        } finally {
            setExporting(false);
        }
    };

    if (!user) {
        if (loading) return <main className={styles.page}><StatusMessage /></main>;
        return <main className={styles.page}><SignInPrompt title={communityText('Teachers sign in with Rotur to manage their classes.')} onSignIn={login} /></main>;
    }
    if (error) {
        return (
            <main className={styles.page}>
                <PageHeader backTo="/classroom" backLabel={communityText('Classroom')} icon={Building2} title={communityText('School')} />
                {error.status === 404 ?
                    <EmptyState icon={Building2} title={communityText('Only school admins can open this page.')} /> :
                    <StatusMessage error onRetry={reload}>{communityText('Could not load the school.')}</StatusMessage>}
            </main>
        );
    }
    if (!data) return <main className={styles.page}><StatusMessage /></main>;

    const plan = data.plan || {};
    const usage = data.usage || {};
    const teachers = data.teachers || [];
    const classes = data.classes || [];
    const classNames = new Map(classes.map(item => [item.id, item.name]));
    const tabs = [
        {key: 'teachers', label: <React.Fragment>{communityText('Teachers')} <b>{teachers.length}</b></React.Fragment>},
        {key: 'classes', label: <React.Fragment>{communityText('Classes')} <b>{classes.length}</b></React.Fragment>},
        {key: 'activity', label: communityText('Activity')}
    ];

    return (
        <main className={styles.page}>
            <PageHeader
                backTo="/classroom"
                backLabel={communityText('Classroom')}
                icon={Building2}
                title={data.school ? data.school.name : communityText('School')}
                lead={communityText('Everyone on the school plan shares these seats and this storage.')}
                actions={(
                    <Button onClick={exportData} busy={exporting} busyLabel={communityText('Preparing…')}>
                        <Download size={16} aria-hidden="true" />
                        {communityText('Download data')}
                    </Button>
                )}
            >
                <UnderlineTabs items={tabs} value={tab} onChange={setTab} ariaLabel={communityText('School sections')} />
            </PageHeader>
            {exportError ? <Notice variant="error" className={styles.noticeBefore} onDismiss={() => setExportError('')}>{exportError}</Notice> : null}
            <section className={styles.planCard} aria-label={communityText('Plan summary')}>
                <div className={styles.planTier}>
                    <span className={styles.planTierName}>{communityText(tierLabel(plan.tier))}</span>
                    {plan.expiresAt ? <span className={styles.planTierMeta}>{communityText('Renews on {value1}.', {value1: formatDate(plan.expiresAt)})}</span> : null}
                </div>
                <div className={styles.planMeters}>
                    <UsageMeter label={communityText('Seats')} used={Number(usage.seats) || 0} total={Number(plan.seats) || 0} valueLabel={communityText('{value1} of {value2}', {value1: Number(usage.seats) || 0, value2: Number(plan.seats) || 0})} />
                    <UsageMeter label={communityText('Storage')} used={Number(usage.storageBytes) || 0} total={Number(plan.storageBytes) || 0} valueLabel={communityText('{value1} of {value2}', {value1: formatBytes(usage.storageBytes), value2: formatBytes(plan.storageBytes)})} />
                    <UsageMeter label={communityText('Classes')} used={Number(usage.classes) || classes.length} total={Number(plan.maxClasses) || 0} valueLabel={communityText('{value1} of {value2}', {value1: Number(usage.classes) || classes.length, value2: Number(plan.maxClasses) || 0})} />
                </div>
            </section>
            {tab === 'teachers' ? <SchoolTeachers teachers={teachers} viewer={user} onReload={reload} /> : null}
            {tab === 'classes' ? (
                <section aria-labelledby="school-classes-heading">
                    <SectionHeading id="school-classes-heading" icon={School} title={communityText('Classes')} count={classes.length} />
                    {classes.length ? (
                        <div className={styles.tableWrap}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th scope="col">{communityText('Class')}</th>
                                        <th scope="col">{communityText('Owner')}</th>
                                        <th scope="col" className={styles.numeric}>{communityText('Students')}</th>
                                        <th scope="col">{communityText('Status')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {classes.map(item => (
                                        <tr key={item.id} className={item.archived ? styles.rowDisabled : null}>
                                            <td><Link to={`/classroom/${item.id}`} className={styles.nameCell}>{item.name}</Link></td>
                                            <td><UserLink username={item.owner}>{item.owner}</UserLink></td>
                                            <td className={styles.numeric}>{item.studentCount || 0}</td>
                                            <td>{item.archived ? <span className={styles.statusDisabled}>{communityText('Archived')}</span> : <span className={styles.statusActive}>{communityText('Active')}</span>}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : <EmptyState icon={School} title={communityText('No classes yet')} />}
                </section>
            ) : null}
            {tab === 'activity' ? (
                <section aria-labelledby="school-activity-heading">
                    <SectionHeading id="school-activity-heading" icon={History} title={communityText('Recent activity')} />
                    {events === null && !eventsError ? <StatusMessage /> : null}
                    {eventsError ? <StatusMessage error onRetry={reload}>{communityText('Could not load the activity log.')}</StatusMessage> : null}
                    {events && !events.length ? <EmptyState icon={History} title={communityText('No activity yet')} /> : null}
                    {events && events.length ? (
                        <div className={styles.card}>
                            <ul className={styles.activityList}>
                                {events.map(event => (
                                    <li key={event._id} className={styles.activityRow}>
                                        <span>
                                            {auditSentence(event, {
                                                text: communityText,
                                                studentName: () => communityText('a student'),
                                                assignmentTitle: () => communityText('an assignment')
                                            })}
                                            {classNames.get(event.classId) ? (
                                                <React.Fragment>
                                                    {' '}
                                                    <span className={styles.muted}>{communityText('In {value1}.', {value1: classNames.get(event.classId)})}</span>
                                                </React.Fragment>
                                            ) : null}
                                        </span>
                                        <time dateTime={new Date(event.at).toISOString()}>{relativeTime(event.at)}</time>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : null}
                </section>
            ) : null}
        </main>
    );
};

export {normalizeTab as normalizeSchoolTab};
export default ClassroomSchool;
