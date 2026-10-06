/* eslint-disable max-len */
import PropTypes from 'prop-types';
import React, {useEffect, useRef, useState} from 'react';
import {Link} from 'react-router-dom';
import {useCommunityIntl as useCommunityText} from '../../i18n.jsx';
import {getCommunityLocale} from '../../locale.js';
import {
    Activity, ArrowLeft, Copy, ExternalLink, Flag, FolderOpen, Gavel, LayoutDashboard,
    MessageSquare, NotebookPen, UserCog
} from 'lucide-react';
import api, {projectUrl} from '../../api';
import Avatar from '../../components/Avatar.jsx';
import UnderlineTabs from '../../components/UnderlineTabs.jsx';
import {tabPanelProps} from '../../components/SectionTabs.jsx';
import Button from '../../components/ui/Button.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Notice from '../../components/ui/Notice.jsx';
import SectionHeading from '../../components/ui/SectionHeading.jsx';
import StatusMessage from '../../components/ui/StatusMessage.jsx';
import {formatBytes, formatDate, formatDateTime, timeAgo} from '../../format';
import styles from '../Admin.module.css';
import AdminActionDialog from './AdminActionDialog.jsx';
import {commentLocation} from './admin-links.js';

const STANDING_LEVELS = ['good', 'warning', 'suspended', 'banned'];

const count = value => (Number(value) || 0).toLocaleString(getCommunityLocale());

const commentHref = comment => {
    const where = commentLocation(comment.key);
    const anchor = `#comment-id-${comment.id}`;
    if (where.kind === 'project') return `${projectUrl(where.id)}${anchor}`;
    if (where.kind === 'profile') return `/users/${where.id}${anchor}`;
    if (where.kind === 'space') return `/spaces/${where.id}${anchor}`;
    if (where.kind === 'bounty') return `/bounties/${where.id}${anchor}`;
    if (where.kind === 'roadmap') return `/roadmap/entry/${where.id}`;
    if (where.kind === 'pull') return `/project/${where.id}/pulls/${where.index}`;
    return '';
};

const Fact = ({label, value, detail}) => (
    <div className={styles.fact}>
        <span className={styles.factLabel}>{label}</span>
        <span className={styles.factValue}>{value}</span>
        {detail ? <span className={styles.factDetail}>{detail}</span> : null}
    </div>
);

Fact.propTypes = {
    label: PropTypes.node.isRequired,
    value: PropTypes.node,
    detail: PropTypes.node
};

const ReportList = ({reports, empty, communityText}) => (
    reports.length ? (
        <div className={styles.flatList}>
            {reports.map(report => (
                <div key={report.id} className={styles.flatRow}>
                    <div className={styles.rowInfo}>
                        <span className={styles.rowTitle}>
                            {report.category || report.type}
                            <span className={`${styles.badge} ${report.resolved ? '' : styles.badgeWarn}`}>
                                {report.resolved ? communityText('Closed') : communityText('Open')}
                            </span>
                        </span>
                        <span className={styles.rowMeta}>
                            {report.subject && report.subject !== report.reporter ?
                                communityText('Report on a {value1} by @{value2} about @{value3}', {value1: report.type, value2: report.reporter, value3: report.subject}) :
                                communityText('Report on a {value1} by @{value2}', {value1: report.type, value2: report.reporter})}
                            {' · '}{formatDateTime(report.created)}
                            {report.resolved && report.action ? ` · ${report.action.replace(/_/g, ' ')}${report.resolvedBy ? ` by @${report.resolvedBy}` : ''}` : ''}
                        </span>
                        {report.reason ? <span className={styles.reason}>{report.reason}</span> : null}
                        {report.snapshot ? <span className={styles.snapshot}>{report.snapshot}</span> : null}
                    </div>
                </div>
            ))}
        </div>
    ) : <p className={styles.mutedLine}>{empty}</p>
);

ReportList.propTypes = {
    reports: PropTypes.arrayOf(PropTypes.object).isRequired,
    empty: PropTypes.node.isRequired,
    communityText: PropTypes.func.isRequired
};

const UserDetailCard = ({username, onBack}) => {
    const {text: communityText} = useCommunityText();
    const [data, setData] = useState(null);
    const [error, setError] = useState('');
    const [note, setNote] = useState('');
    const [tab, setTab] = useState('overview');
    const [level, setLevel] = useState('good');
    const [reasonText, setReasonText] = useState('');
    const [message, setMessage] = useState('');
    const [adminNote, setAdminNote] = useState('');
    const [noteBusy, setNoteBusy] = useState(false);
    const [dialog, setDialog] = useState(null);
    const [dialogBusy, setDialogBusy] = useState(false);
    const [dialogError, setDialogError] = useState('');
    const deleteInFlight = useRef(false);
    const currentUsername = useRef(username);
    currentUsername.current = username;

    useEffect(() => {
        if (!username) return;
        let active = true;
        setData(null);
        setError('');
        setNote('');
        setTab('overview');
        setDialog(null);
        setDialogError('');
        setDialogBusy(false);
        api.admin.getUser(username)
            .then(result => {
                if (!active) return;
                setData(result);
                setLevel((result.standing && result.standing.level) || 'good');
                setAdminNote((result.note && result.note.text) || '');
                setReasonText('');
                setMessage('');
            })
            .catch(e => {
                if (!active) return;
                setData(null);
                setError(e.message || 'Could not load that user.');
            });
        return () => {
            active = false;
        };
    }, [username]);

    const refresh = () => {
        if (!data) return;
        const actionUsername = data.username;
        api.admin.getUser(actionUsername)
            .then(result => {
                if (currentUsername.current === actionUsername) setData(result);
            })
            .catch(() => {});
    };

    const run = async (action, success) => {
        setError('');
        setNote('');
        try {
            await action();
            if (success) setNote(success);
            refresh();
        } catch (e) {
            setError(e.message || 'Action failed.');
        }
    };

    const applyStanding = () => run(
        () => api.admin.setStanding(data.username, level, reasonText.trim()),
        communityText('Standing updated.')
    );

    const sendMessage = async () => {
        if (!message.trim()) return;
        await run(() => api.admin.messageUser(data.username, message.trim()), communityText('Message sent.'));
        setMessage('');
    };

    const toggleComments = () => run(() => api.admin.updateUserProfile(data.username, {commentsOff: !data.commentsOff}));

    const saveNote = async () => {
        setNoteBusy(true);
        await run(() => api.admin.setUserNote(data.username, adminNote.trim()), communityText('Note saved.'));
        setNoteBusy(false);
    };

    const copyId = () => {
        if (navigator.clipboard && data.userId) navigator.clipboard.writeText(data.userId).catch(() => {});
    };

    const unshareProject = pid => run(() => api.unpublish(pid), communityText('Project unshared.'));

    const deleteProject = pid => {
        if (deleteInFlight.current) return;
        const project = (data.projects || []).find(item => item.id === pid);
        setDialogError('');
        setDialog({
            id: pid,
            title: communityText('Delete project?'),
            description: communityText('Delete {value1} permanently?', {value1: project ? project.title : communityText('this project')}),
            action: communityText('Delete project'),
            danger: true,
            icon: FolderOpen
        });
    };

    const confirmDeleteProject = async () => {
        if (!dialog || deleteInFlight.current) return;
        const releaseDelete = () => {
            deleteInFlight.current = false;
        };
        deleteInFlight.current = true;
        setDialogBusy(true);
        try {
            setDialogError('');
            await api.deleteProject(dialog.id);
            setDialog(null);
            setNote(communityText('Project deleted.'));
            refresh();
        } catch (e) {
            setDialogError(e.message || 'Could not delete.');
        } finally {
            releaseDelete();
            setDialogBusy(false);
        }
    };

    if (error && !data) {
        return (
            <div>
                <Notice variant="error" className={styles.notice}>{error}</Notice>
                <Button onClick={onBack}>
                    <ArrowLeft size={15} />
                    {communityText('Back to list')}
                </Button>
            </div>
        );
    }
    if (!data) return <StatusMessage>{communityText('Loading user details…')}</StatusMessage>;

    const reports = data.reports || {about: [], filed: [], aboutCount: 0, filedCount: 0, openAboutCount: 0};
    const totals = data.totals || {};
    const sessions = data.sessions || {};
    const plan = data.plan || {};
    const standing = data.standing || {level: 'good', history: []};
    const projects = data.projects || [];
    const comments = data.comments || [];
    const activity = data.activity || [];
    const quota = data.quota;
    const quotaPct = quota && quota.limit > 0 ? Math.min(100, (quota.used / quota.limit) * 100) : 0;

    const activityText = item => {
        const title = item.projectTitle || item.projectId || '';
        if (item.type === 'love') return communityText('Loved {value1}', {value1: title});
        if (item.type === 'favorite') return communityText('Favorited {value1}', {value1: title});
        if (item.type === 'share') return communityText('Shared {value1}', {value1: title});
        if (item.type === 'remix') return communityText('Remixed {value1} as {value2}', {value1: item.parentTitle || item.parentId || '', value2: title});
        if (item.type === 'release') return communityText('Released {value1} of {value2}', {value1: item.version || '', value2: title});
        return item.type;
    };

    const commentPlace = comment => {
        const where = commentLocation(comment.key);
        if (where.kind === 'project') return communityText('On project {value1}', {value1: where.id});
        if (where.kind === 'profile') return communityText('On the profile of @{value1}', {value1: where.id});
        if (where.kind === 'space') return communityText('In space {value1}', {value1: where.id});
        if (where.kind === 'bounty') return communityText('On bounty {value1}', {value1: where.id});
        if (where.kind === 'roadmap') return communityText('On a roadmap idea');
        if (where.kind === 'pull') return communityText('On pull request {value1} of project {value2}', {value1: where.index, value2: where.id});
        return comment.key;
    };

    const tabs = [
        {key: 'overview', label: communityText('Overview')},
        {key: 'projects', label: <>{communityText('Projects')} <b>{projects.length}</b></>},
        {key: 'reports', label: <>{communityText('Reports')} <b>{reports.aboutCount + reports.filedCount}</b></>},
        {key: 'comments', label: <>{communityText('Comments')} <b>{comments.length}</b></>},
        {key: 'activity', label: communityText('Activity')},
        {key: 'moderation', label: communityText('Moderation')}
    ];

    return (
        <div className={styles.dossier}>
            <AdminActionDialog
                dialog={dialog}
                busy={dialogBusy}
                error={dialogError}
                onChange={() => {}}
                onCancel={() => {
                    if (!deleteInFlight.current) setDialog(null);
                }}
                onConfirm={confirmDeleteProject}
            />
            <Button className={styles.backButton} onClick={onBack}>
                <ArrowLeft size={15} />
                {communityText('Back to list')}
            </Button>

            <div className={styles.dossierHead}>
                <Avatar username={data.username} size={56} />
                <div className={styles.dossierIdentity}>
                    <h3 className={styles.dossierName}>
                        {`@${data.username}`}
                        {data.admin ? <span className={styles.badge}>{communityText('Admin')}</span> : null}
                        {data.banned ? (
                            <span className={`${styles.badge} ${styles.badgeDanger}`}>{communityText('Banned')}</span>
                        ) : standing.level !== 'good' ? (
                            <span className={`${styles.badge} ${styles.badgeWarn}`}>{standing.level}</span>
                        ) : null}
                        {data.student ? <span className={styles.badge}>{communityText('Student')}</span> : null}
                        {data.minor && !data.student ? <span className={styles.badge}>{communityText('Under 18')}</span> : null}
                    </h3>
                    <span className={styles.rowMeta}>
                        {data.userId ? (
                            <button type="button" className={styles.idButton} onClick={copyId} title={communityText('Copy Rotur ID')}>
                                <code>{data.userId}</code>
                                <Copy size={13} aria-hidden="true" />
                            </button>
                        ) : communityText('No Rotur ID recorded')}
                    </span>
                    {data.bio ? <p className={styles.dossierBio}>{data.bio}</p> : null}
                </div>
                <div className={styles.rowActions}>
                    <Button as={Link} to={`/users/${data.username}`}>
                        <ExternalLink size={15} />{communityText('Public profile')}</Button>
                </div>
            </div>

            <div className={styles.facts}>
                <Fact
                    label={communityText('Joined MistWarp')}
                    value={data.created ? formatDate(data.created) : communityText('Unknown')}
                    detail={timeAgo(data.created) ? communityText('{value1} ago', {value1: timeAgo(data.created)}) : null}
                />
                <Fact
                    label={communityText('Last signed in')}
                    value={sessions.lastSignIn ? communityText('{value1} ago', {value1: timeAgo(sessions.lastSignIn)}) : communityText('Not in the last 7 days')}
                    detail={sessions.active ? communityText('{value1} active sessions', {value1: sessions.active}) : null}
                />
                <Fact
                    label={communityText('Plan')}
                    value={plan.tier || communityText('Free')}
                    detail={plan.known === false ? communityText('Last known; Rotur did not answer') : null}
                />
                <Fact
                    label={communityText('Storage')}
                    value={quota ? formatBytes(quota.used) : communityText('Unknown')}
                    detail={quota ? communityText('{value1} of {value2}', {value1: `${Math.round(quotaPct)}%`, value2: formatBytes(quota.limit)}) : null}
                />
                <Fact
                    label={communityText('Projects')}
                    value={count(totals.projects)}
                    detail={communityText('{value1} shared · {value2} views · {value3} hearts', {value1: count(totals.shared), value2: count(totals.views), value3: count(totals.hearts)})}
                />
                <Fact
                    label={communityText('Reports about them')}
                    value={count(reports.aboutCount)}
                    detail={reports.openAboutCount ? communityText('{value1} open', {value1: reports.openAboutCount}) : communityText('None open')}
                />
            </div>

            {error ? <Notice variant="error" className={styles.notice}>{error}</Notice> : null}
            {note ? <Notice variant="success" className={styles.notice}>{note}</Notice> : null}

            <UnderlineTabs items={tabs} value={tab} onChange={setTab} className={styles.tabs} ariaLabel="User sections" idPrefix="admin-user" />
            <div {...tabPanelProps('admin-user', tab)}>
                {tab === 'overview' ? (
                    <div className={styles.dossierGrid}>
                        <section className={styles.panel}>
                            <SectionHeading as="h3" icon={NotebookPen} title={communityText('Admin note')} />
                            <textarea
                                className={styles.textarea}
                                placeholder={communityText('Only admins see this. Note context for whoever looks at this account next.')}
                                value={adminNote}
                                maxLength={4000}
                                onChange={e => setAdminNote(e.target.value)}
                            />
                            <div className={styles.panelFooter}>
                                <span className={styles.rowMeta}>
                                    {data.note && data.note.updated ? communityText('Last edited by @{value1} {value2} ago', {value1: data.note.by, value2: timeAgo(data.note.updated)}) : ''}
                                </span>
                                <Button
                                    onClick={saveNote}
                                    busy={noteBusy}
                                    disabled={adminNote.trim() === ((data.note && data.note.text) || '')}
                                >{communityText('Save note')}</Button>
                            </div>
                        </section>
                        <section className={styles.panel}>
                            <SectionHeading as="h3" icon={LayoutDashboard} title={communityText('Account')} />
                            <dl className={styles.detailList}>
                                <dt>{communityText('Followers')}</dt>
                                <dd>{count(data.followerCount)}</dd>
                                <dt>{communityText('Following')}</dt>
                                <dd>{count(data.followingCount)}</dd>
                                <dt>{communityText('Credits earned')}</dt>
                                <dd>{count(totals.revenue)}</dd>
                                <dt>{communityText('Profile comments')}</dt>
                                <dd>{data.commentsOff ? communityText('Off') : communityText('On')}</dd>
                                <dt>{communityText('Reports they filed')}</dt>
                                <dd>{count(reports.filedCount)}</dd>
                                <dt>{communityText('Spaces')}</dt>
                                <dd>
                                    {(data.spaces || []).length ? data.spaces.map(space => (
                                        <Link key={space.id} to={`/spaces/${space.id}`} className={styles.inlineLink}>{space.title}</Link>
                                    )) : communityText('None')}
                                </dd>
                                <dt>{communityText('Classes they teach')}</dt>
                                <dd>{(data.classes || []).length ? data.classes.map(klass => klass.name).join(', ') : communityText('None')}</dd>
                            </dl>
                            {data.minor && !data.student ? (
                                <p className={styles.mutedLine}>
                                    {communityText('Rotur marks accounts without a date of birth as under 18, so this may be an adult who has not added one.')}
                                </p>
                            ) : null}
                        </section>
                    </div>
                ) : null}

                {tab === 'projects' ? (
                    projects.length ? (
                        <div className={styles.flatList}>
                            {projects.map(project => (
                                <div key={project.id} className={styles.flatRow}>
                                    <div className={styles.rowInfo}>
                                        <span className={styles.rowTitle}>
                                            <Link to={projectUrl(project)}>{project.title || project.id}</Link>
                                            <span className={styles.badge}>{project.shared ? communityText('Shared') : communityText('Not shared')}</span>
                                        </span>
                                        <span className={styles.rowMeta}>
                                            {communityText('{value1} views · {value2} hearts · {value3} · edited {value4}', {
                                                value1: count(project.views),
                                                value2: count(project.loveCount),
                                                value3: formatBytes(project.sizeBytes || 0),
                                                value4: formatDate(project.edited)
                                            })}
                                        </span>
                                    </div>
                                    <div className={styles.rowActions}>
                                        {project.shared ? (
                                            <Button onClick={() => unshareProject(project.id)}>{communityText('Unshare')}</Button>
                                        ) : null}
                                        <Button variant="danger" onClick={() => deleteProject(project.id)}>{communityText('Delete')}</Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyState compact icon={FolderOpen} title={communityText('No projects')}>
                            {communityText('This account has not saved any projects.')}
                        </EmptyState>
                    )
                ) : null}

                {tab === 'reports' ? (
                    <div className={styles.stack}>
                        <section>
                            <SectionHeading as="h3" icon={Flag} title={communityText('About @{value1}', {value1: data.username})} count={reports.aboutCount} />
                            <ReportList reports={reports.about} empty={communityText('Nobody has reported this account or its content.')} communityText={communityText} />
                        </section>
                        <section>
                            <SectionHeading as="h3" icon={Flag} title={communityText('Filed by @{value1}', {value1: data.username})} count={reports.filedCount} />
                            <ReportList reports={reports.filed} empty={communityText('This account has not filed any reports.')} communityText={communityText} />
                        </section>
                    </div>
                ) : null}

                {tab === 'comments' ? (
                    comments.length ? (
                        <div className={styles.flatList}>
                            {comments.map(comment => {
                                const href = commentHref(comment);
                                return (
                                    <div key={`${comment.key}-${comment.id}`} className={styles.flatRow}>
                                        <div className={styles.rowInfo}>
                                            <span className={styles.commentText}>{comment.content}</span>
                                            <span className={styles.rowMeta}>
                                                {href ? <Link to={href}>{commentPlace(comment)}</Link> : commentPlace(comment)}
                                                {comment.parent ? ` · ${communityText('reply')}` : ''}
                                                {' · '}{formatDateTime(comment.created)}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <EmptyState compact icon={MessageSquare} title={communityText('No comments')}>
                            {communityText('This account has not posted any comments that are still up.')}
                        </EmptyState>
                    )
                ) : null}

                {tab === 'activity' ? (
                    activity.length ? (
                        <div className={styles.flatList}>
                            {activity.map((item, index) => (
                                <div key={`${item.type}-${item.created}-${index}`} className={styles.flatRow}>
                                    <div className={styles.rowInfo}>
                                        <span className={styles.rowTitle}>
                                            {item.projectId ? <Link to={projectUrl(item.projectId)}>{activityText(item)}</Link> : activityText(item)}
                                        </span>
                                        <span className={styles.rowMeta}>
                                            {item.projectOwner ? `@${item.projectOwner} · ` : ''}{formatDateTime(item.created)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyState compact icon={Activity} title={communityText('No recent activity')}>
                            {communityText('Hearts, favorites, shares, remixes and releases show up here.')}
                        </EmptyState>
                    )
                ) : null}

                {tab === 'moderation' ? (
                    <div className={styles.dossierGrid}>
                        <section className={styles.panel}>
                            <SectionHeading as="h3" icon={Gavel} title={communityText('Account standing')} />
                            <div className={styles.field}>
                                <select className={styles.select} value={level} onChange={e => setLevel(e.target.value)} aria-label={communityText('Standing')}>
                                    {STANDING_LEVELS.map(l => (
                                        <option key={l} value={l}>{l}</option>
                                    ))}
                                </select>
                                <input
                                    className={styles.input}
                                    placeholder={communityText('Reason (shown to the user)')}
                                    value={reasonText}
                                    onChange={e => setReasonText(e.target.value)}
                                />
                                <Button onClick={applyStanding}>{communityText('Apply')}</Button>
                            </div>
                            {standing.recoverAt ? (
                                <p className={styles.mutedLine}>{communityText('Goes back to good standing on {value1}.', {value1: formatDate(standing.recoverAt)})}</p>
                            ) : null}
                            {data.banned && data.ban && data.ban.created ? (
                                <p className={styles.mutedLine}>
                                    {communityText('Banned by @{value1} on {value2}.', {value1: data.ban.by || '', value2: formatDate(data.ban.created)})}
                                    {data.ban.reason ? ` ${data.ban.reason}` : ''}
                                </p>
                            ) : null}
                            {(standing.history || []).length ? (
                                <div className={styles.flatList}>
                                    {standing.history.map((entry, index) => (
                                        <div key={`${entry.created}-${index}`} className={styles.flatRow}>
                                            <div className={styles.rowInfo}>
                                                <span className={styles.rowTitle}>{communityText('Changed from {value1} to {value2}', {value1: entry.previous || 'good', value2: entry.level})}</span>
                                                <span className={styles.rowMeta}>{communityText('By @{value1} · {value2}', {value1: entry.by || '', value2: formatDateTime(entry.created)})}</span>
                                                {entry.reason ? <span className={styles.reason}>{entry.reason}</span> : null}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : <p className={styles.mutedLine}>{communityText('No standing changes recorded.')}</p>}
                        </section>
                        <section className={styles.panel}>
                            <SectionHeading as="h3" icon={MessageSquare} title={communityText('Message')} />
                            <textarea
                                className={styles.textarea}
                                placeholder={communityText('Sent to their notifications as a moderation message.')}
                                value={message}
                                maxLength={1000}
                                onChange={e => setMessage(e.target.value)}
                            />
                            <div className={styles.panelFooter}>
                                <span />
                                <Button disabled={!message.trim()} onClick={sendMessage}>{communityText('Send')}</Button>
                            </div>
                        </section>
                        <section className={styles.panel}>
                            <SectionHeading as="h3" icon={UserCog} title={communityText('Profile')} />
                            <Button className={styles.inlineAction} onClick={toggleComments}>
                                {data.commentsOff ? communityText('Turn on profile comments') : communityText('Turn off profile comments')}
                            </Button>
                        </section>
                    </div>
                ) : null}
            </div>
        </div>
    );
};

UserDetailCard.propTypes = {
    username: PropTypes.string.isRequired,
    onBack: PropTypes.func.isRequired
};

export default UserDetailCard;
