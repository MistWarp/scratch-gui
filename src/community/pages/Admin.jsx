import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
/* eslint-disable max-len */
import React, {useRef, useState} from 'react';
import {useSearchParams} from 'react-router-dom';
import {
    Activity, AlertTriangle, Ban, BarChart3, Flag, FolderOpen, HardDrive, Puzzle, ShieldCheck, User
} from 'lucide-react';
import api from '../api';
import {useUser} from '../UserContext.jsx';
import Sidebar from '../components/Sidebar.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Notice from '../components/ui/Notice.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import StatusMessage from '../components/ui/StatusMessage.jsx';
import styles from './Admin.module.css';
import {buildSeries} from './admin/admin-format.js';
import AnalyticsChart from './admin/AnalyticsChart.jsx';
import AdminActionDialog from './admin/AdminActionDialog.jsx';
import StatsOverview from './admin/StatsOverview.jsx';
import ProjectManager from './admin/ProjectManager.jsx';
import UserManager from './admin/UserManager.jsx';
import ExtensionManager from './admin/ExtensionManager.jsx';
import ErrorManager from './admin/ErrorManager.jsx';
import ReportsSection from './admin/ReportsSection.jsx';
import BansSection from './admin/BansSection.jsx';
import AdminsSection from './admin/AdminsSection.jsx';
import useAdminData from './admin/use-admin-data.js';

const SECTIONS = [
    {key: 'overview', label: 'Overview', icon: BarChart3},
    {key: 'storage', label: 'Storage and runtime', icon: HardDrive, group: 'System'},
    {key: 'activity', label: 'Activity', icon: Activity, group: 'System'},
    {key: 'errors', label: 'Errors', icon: AlertTriangle, group: 'System'},
    {key: 'reports', label: 'Reports', icon: Flag, group: 'Moderation'},
    {key: 'users', label: 'Users', icon: User, group: 'Moderation'},
    {key: 'bans', label: 'Bans', icon: Ban, group: 'Moderation'},
    {key: 'projects', label: 'Projects', icon: FolderOpen, group: 'Content'},
    {key: 'extensions', label: 'Extensions', icon: Puzzle, group: 'Content'},
    {key: 'admins', label: 'Admins', icon: ShieldCheck, group: 'Access'}
];

const Admin = () => {
    const {text: communityText} = useCommunityText();
    const {user, loading} = useUser();
    const {reports, openErrors, bans, admins, error, setError, load} = useAdminData(user);
    const [newAdmin, setNewAdmin] = useState('');
    const [searchParams, setSearchParams] = useSearchParams();
    const requested = searchParams.get('section');
    const active = SECTIONS.some(section => section.key === requested) ? requested : 'overview';
    const selectedUser = searchParams.get('user') || null;
    const setActive = key => {
        const params = new URLSearchParams();
        if (key !== 'overview') params.set('section', key);
        setSearchParams(params);
    };
    const selectUser = name => {
        const params = new URLSearchParams();
        params.set('section', 'users');
        if (name) params.set('user', name);
        setSearchParams(params);
    };
    const [dialog, setDialog] = useState(null);
    const [dialogBusy, setDialogBusy] = useState(false);
    const [dialogError, setDialogError] = useState('');
    const actionLocks = useRef(new Set());

    const act = async (id, action, reason) => {
        const actionKey = `report:${id}`;
        if (actionLocks.current.has(actionKey)) return;
        actionLocks.current.add(actionKey);
        try {
            setError('');
            await api.admin.reportAction(id, action, reason);
            window.dispatchEvent(new Event('mw:reports-updated'));
            load();
        } catch (e) {
            setError(e.message || 'Action failed.');
        } finally {
            actionLocks.current.delete(actionKey);
        }
    };

    const replyToSupport = report => {
        setDialogError('');
        setDialog({
            kind: 'support-reply',
            report,
            title: communityText('Reply to @{value1}', {value1: report.reporter}),
            description: communityText('The reply is sent as a private moderation message. Sending it closes the support request.'),
            action: communityText('Send and close'),
            fields: [{key: 'message', label: communityText('Message'), value: '', multiline: true, maxLength: 2000}],
            icon: Flag
        });
    };

    const warnFromReport = report => {
        setDialogError('');
        setDialog({
            kind: 'warn-report',
            report,
            title: communityText('Warn user?'),
            description: communityText('The user will see this reason in their moderation notice.'),
            action: communityText('Send warning'),
            fields: [{key: 'reason', label: communityText('Reason'), value: '', multiline: true, maxLength: 1000}],
            icon: AlertTriangle
        });
    };

    const banFromReport = report => {
        const who = report.type === 'project' ? communityText('the owner of this project') :
            `@${report.targetUser || report.target}`;
        setDialogError('');
        setDialog({
            kind: 'ban-report',
            report,
            title: communityText('Ban {value1}?', {value1: who}),
            description: communityText('They will be locked out of MistWarp until an admin unbans them.'),
            action: communityText('Ban user'),
            danger: true,
            icon: Ban
        });
    };

    const banByName = () => {
        setDialogError('');
        setDialog({
            kind: 'ban-user',
            title: communityText('Ban user'),
            description: communityText('The user will be locked out of MistWarp until an admin unbans them.'),
            action: communityText('Ban user'),
            danger: true,
            fields: [
                {key: 'username', label: communityText('Username'), value: '', maxLength: 80},
                {key: 'reason', label: communityText('Reason'), value: '', multiline: true, maxLength: 1000}
            ],
            icon: Ban
        });
    };

    const updateDialogField = (key, value) => {
        setDialog(current => ({
            ...current,
            fields: current.fields.map(field => (field.key === key ? {...field, value} : field))
        }));
        setDialogError('');
    };

    const confirmDialog = async () => {
        if (!dialog) return;
        const actionKey = `dialog:${dialog.kind}:${dialog.report ? dialog.report.id : 'user'}`;
        if (actionLocks.current.has(actionKey)) return;
        const values = Object.fromEntries((dialog.fields || []).map(field => [field.key, field.value.trim()]));
        if (dialog.kind === 'support-reply' && !values.message) {
            setDialogError(communityText('Enter a reply.'));
            return;
        }
        if (dialog.kind === 'warn-report' && !values.reason) {
            setDialogError(communityText('Enter a warning reason.'));
            return;
        }
        if (dialog.kind === 'ban-user' && !values.username) {
            setDialogError(communityText('Enter a username.'));
            return;
        }
        actionLocks.current.add(actionKey);
        setDialogBusy(true);
        setDialogError('');
        try {
            if (dialog.kind === 'support-reply') {
                await api.admin.messageUser(dialog.report.reporter, values.message);
                await api.admin.reportAction(dialog.report.id, 'dismiss');
                window.dispatchEvent(new Event('mw:reports-updated'));
            } else if (dialog.kind === 'warn-report') {
                await api.admin.reportAction(dialog.report.id, 'warn_user', values.reason);
                window.dispatchEvent(new Event('mw:reports-updated'));
            } else if (dialog.kind === 'ban-report') {
                await api.admin.reportAction(dialog.report.id, 'ban_user');
                window.dispatchEvent(new Event('mw:reports-updated'));
            } else if (dialog.kind === 'ban-user') {
                await api.admin.ban(values.username, values.reason);
            }
            setDialog(null);
            load();
        } catch (e) {
            setDialogError(e.message || 'Action failed.');
        } finally {
            actionLocks.current.delete(actionKey);
            setDialogBusy(false);
        }
    };

    const unban = async username => {
        try {
            setError('');
            await api.admin.unban(username);
            load();
        } catch (e) {
            setError(e.message || 'Could not unban that user.');
        }
    };

    const addAdmin = async () => {
        const name = newAdmin.trim();
        if (!name) return;
        try {
            setError('');
            await api.admin.addAdmin(name);
            setNewAdmin('');
            load();
        } catch (e) {
            setError(e.message || 'Could not add that admin.');
        }
    };

    const removeAdmin = async username => {
        try {
            setError('');
            await api.admin.removeAdmin(username);
            load();
        } catch (e) {
            setError(e.message || 'Could not remove that admin.');
        }
    };

    if (loading) {
        return <main className={styles.page}><StatusMessage /></main>;
    }
    if (!user || !user.isAdmin) {
        return (
            <main className={styles.page}>
                <EmptyState icon={ShieldCheck} title={communityText('Admins only')}>
                    {communityText('This page is for admins.')}
                </EmptyState>
            </main>
        );
    }

    const openCount = reports ? reports.length : 0;
    const badgeFor = count => (count > 0 ? {badge: count > 99 ? '99+' : count} : null);
    const sidebarSections = SECTIONS.map(section => {
        if (section.key === 'reports' && openCount) return {...section, ...badgeFor(openCount)};
        if (section.key === 'errors' && openErrors) return {...section, ...badgeFor(openErrors)};
        return section;
    });

    return (
        <main className={styles.page}>
            <AdminActionDialog
                dialog={dialog}
                busy={dialogBusy}
                error={dialogError}
                onChange={updateDialogField}
                onCancel={() => {
                    if (!dialogBusy) setDialog(null);
                }}
                onConfirm={confirmDialog}
            />
            <PageHeader icon={ShieldCheck} title={communityText('Admin')} />
            {error ? <Notice variant="error" className={styles.notice}>{error}</Notice> : null}

            <div className={styles.layout}>
                <Sidebar
                    sections={sidebarSections}
                    active={active}
                    onChange={setActive}
                    ariaLabel="Admin sections"
                />

                <div className={styles.content}>
                    {['overview', 'storage', 'activity'].includes(active) ? (
                        <section className={styles.card}>
                            <StatsOverview view={active} />
                        </section>
                    ) : null}

                    {active === 'reports' ? (
                        <ReportsSection
                            reports={reports}
                            openCount={openCount}
                            replyToSupport={replyToSupport}
                            act={act}
                            warnFromReport={warnFromReport}
                            banFromReport={banFromReport}
                        />
                    ) : null}

                    {active === 'users' ? (
                        <section className={styles.card}>
                            <UserManager selected={selectedUser} onSelect={selectUser} onUserChanged={load} />
                        </section>
                    ) : null}

                    {active === 'projects' ? (
                        <section className={styles.card}>
                            <ProjectManager />
                        </section>
                    ) : null}

                    {active === 'extensions' ? (
                        <section className={styles.card}>
                            <ExtensionManager />
                        </section>
                    ) : null}

                    {active === 'errors' ? (
                        <section className={styles.card}>
                            <ErrorManager />
                        </section>
                    ) : null}

                    {active === 'bans' ? (
                        <BansSection
                            bans={bans}
                            banByName={banByName}
                            unban={unban}
                        />
                    ) : null}

                    {active === 'admins' ? (
                        <AdminsSection
                            admins={admins}
                            newAdmin={newAdmin}
                            setNewAdmin={setNewAdmin}
                            addAdmin={addAdmin}
                            removeAdmin={removeAdmin}
                        />
                    ) : null}
                </div>
            </div>
        </main>
    );
};

export {AdminActionDialog, AnalyticsChart, buildSeries, ErrorManager, UserManager};
export default Admin;
