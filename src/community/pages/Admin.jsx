/* eslint-disable max-len */
import React, {useEffect, useRef, useState, useCallback} from 'react';
import {Link} from 'react-router-dom';
import {Flag, User, FolderOpen, Ban, ShieldCheck, BarChart3, AlertTriangle, Puzzle} from 'lucide-react';
import api, {projectUrl, embedUrl} from '../api';
import {useUser} from '../UserContext.jsx';
import Avatar from '../components/Avatar.jsx';
import Modal from '../components/ui/Modal.jsx';
import {timeAgo, formatBytes} from '../format';
import useLatest from '../use-latest.js';
import styles from './Admin.module.css';

const STANDING_LEVELS = ['good', 'warning', 'suspended', 'banned'];

const SECTIONS = [
    {key: 'overview', label: 'Overview', icon: BarChart3},
    {key: 'reports', label: 'Reports', icon: Flag},
    {key: 'users', label: 'Users', icon: User},
    {key: 'projects', label: 'Projects', icon: FolderOpen},
    {key: 'extensions', label: 'Extensions', icon: Puzzle},
    {key: 'bans', label: 'Bans', icon: Ban},
    {key: 'admins', label: 'Admins', icon: ShieldCheck}
];

const dayLabel = dayNumber => {
    const d = new Date(dayNumber * 86400000);
    return `${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
};

const buildSeries = (byDay, days) => {
    const today = Math.floor(Date.now() / 86400000);
    return Array.from({length: days}, (unused, idx) => {
        const dayNumber = today - (days - 1 - idx);
        return {label: dayLabel(dayNumber), value: (byDay && byDay[String(dayNumber)]) || 0};
    });
};

const StatTile = ({label, value}) => (
    <div className={styles.statTile}>
        <span className={styles.statValue}>{value}</span>
        <span className={styles.statLabel}>{label}</span>
    </div>
);

const MiniChart = ({title, series}) => {
    const max = series.reduce((m, point) => Math.max(m, point.value), 0);
    return (
        <div className={styles.chart}>
            <h3 className={styles.chartTitle}>{title}</h3>
            <div className={styles.chartBars}>
                {series.map((point, idx) => (
                    <div
                        key={idx}
                        className={styles.chartCol}
                        title={`${point.label}: ${point.value}`}
                    >
                        <div
                            className={styles.chartBar}
                            style={{height: `${max ? (point.value / max) * 100 : 0}%`}}
                        />
                        <span className={styles.chartLabel}>{point.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const QuotaTile = ({quota}) => {
    const pct = (quota.used / quota.limit) * 100;
    return (
        <div className={styles.statTile}>
            <span className={styles.statValue}>{formatBytes(quota.used)}</span>
            <span className={styles.statLabel}>of {formatBytes(quota.limit)} used</span>
            <div className={styles.quotaBarBg}>
                <div
                    className={styles.quotaBarFill}
                    style={{width: `${Math.min(100, pct)}%`}}
                />
            </div>
            <span className={pct >= 80 ? styles.quotaWarnText : styles.quotaPctText}>
                {pct >= 80 ? <AlertTriangle size={14} /> : null}{Math.round(pct)}% full
            </span>
        </div>
    );
};

const num = v => Number(v || 0).toLocaleString();

const AdminActionDialog = ({dialog, busy, error, onChange, onCancel, onConfirm}) => {
    if (!dialog) return null;
    const Icon = dialog.icon || AlertTriangle;
    return (
        <Modal
            icon={Icon}
            title={dialog.title}
            dismissDisabled={busy}
            onClose={onCancel}
            actions={<React.Fragment>
                <button className={styles.secondary} disabled={busy} onClick={onCancel}>Cancel</button>
                <button className={dialog.danger ? styles.danger : styles.primary} disabled={busy} onClick={onConfirm}>
                    {busy ? 'Working…' : dialog.action}
                </button>
            </React.Fragment>}
        >
            {dialog.description ? <p>{dialog.description}</p> : null}
            {(dialog.fields || []).map(field => (
                <label key={field.key} className={styles.field}>
                    <span>{field.label}</span>
                    {field.multiline ? (
                        <textarea
                            className={styles.textarea}
                            maxLength={field.maxLength || 1000}
                            value={field.value}
                            onChange={event => onChange(field.key, event.target.value)}
                        />
                    ) : (
                        <input
                            className={styles.input}
                            maxLength={field.maxLength || 100}
                            value={field.value}
                            onChange={event => onChange(field.key, event.target.value)}
                        />
                    )}
                </label>
            ))}
            {error ? <p className={styles.error}>{error}</p> : null}
        </Modal>
    );
};

export {AdminActionDialog};

const StatsOverview = () => {
    const [stats, setStats] = useState(null);
    const [quota, setQuota] = useState(null);
    const [error, setError] = useState('');
    const [payoutBusy, setPayoutBusy] = useState(false);
    const [payoutNote, setPayoutNote] = useState('');
    const payoutLocks = useRef(new Set());

    useEffect(() => {
        api.admin.stats()
            .then(setStats)
            .catch(e => setError(e.message || 'Could not load stats.'));
        api.quota()
            .then(setQuota)
            .catch(() => {});
    }, []);

    const retryPayouts = async () => {
        if (payoutLocks.current.has('retry')) return;
        payoutLocks.current.add('retry');
        setPayoutBusy(true);
        setPayoutNote('');
        try {
            const result = await api.admin.retryPayouts();
            setPayoutNote(`Paid ${result.paid}, ${result.remaining} still pending.`);
            const fresh = await api.admin.stats();
            setStats(fresh);
        } catch (e) {
            setPayoutNote(e.message || 'Could not retry payouts.');
        } finally {
            payoutLocks.current.delete('retry');
            setPayoutBusy(false);
        }
    };

    if (error) {
        return <div><h2>Overview</h2><p className={styles.error}>{error}</p></div>;
    }
    if (!stats) {
        return <div><h2>Overview</h2><p className={styles.status}>Loading…</p></div>;
    }
    return (
        <div>
            <h2>Overview</h2>

            {stats.pendingPayouts > 0 ? (
                <div className={styles.quotaWarning}>
                    <AlertTriangle size={14} /> {stats.pendingPayouts} creator payout
                    {stats.pendingPayouts === 1 ? '' : 's'} failed and{' '}
                    {stats.pendingPayouts === 1 ? 'is' : 'are'} owed
                    ({Math.round((stats.pendingPayoutAmount || 0) * 100) / 100} credits total).{' '}
                    <button
                        className={styles.secondary}
                        onClick={retryPayouts}
                        disabled={payoutBusy}
                    >{payoutBusy ? 'Retrying…' : 'Retry now'}</button>
                    {payoutNote ? <span>{` ${payoutNote}`}</span> : null}
                </div>
            ) : null}

            {quota && (quota.used / quota.limit) * 100 >= 80 ? (
                <p className={styles.quotaWarning}>
                    <AlertTriangle size={14} /> You&apos;ve used {formatBytes(quota.used)} of
                    your {formatBytes(quota.limit)} upload quota
                    ({Math.round((quota.used / quota.limit) * 100)}%).{' '}
                    {quota.used >= quota.limit ?
                        'You cannot upload new projects until usage drops.' :
                        'Consider managing your projects to free up space.'}
                </p>
            ) : null}

            <div className={styles.statGrid}>
                <StatTile
                    label="Projects"
                    value={num(stats.totalProjects)}
                />
                <StatTile
                    label="Shared"
                    value={num(stats.sharedProjects)}
                />
                <StatTile
                    label="Unshared"
                    value={num(stats.unsharedProjects)}
                />
                <StatTile
                    label="Users"
                    value={num(stats.totalUsers)}
                />
                <StatTile
                    label="Storage used"
                    value={formatBytes(stats.totalBytes)}
                />
                <StatTile
                    label="Total views"
                    value={num(stats.totalViews)}
                />
                <StatTile
                    label="Total loves"
                    value={num(stats.totalLoves)}
                />
                <StatTile
                    label="Active sessions"
                    value={num(stats.activeSessions)}
                />
                <StatTile
                    label="Open reports"
                    value={num(stats.openReports)}
                />
                <StatTile
                    label="Banned users"
                    value={num(stats.bannedUsers)}
                />
                <StatTile
                    label="News posts"
                    value={num(stats.newsPosts)}
                />
                {quota ? <QuotaTile quota={quota} /> : null}
            </div>
            <div className={styles.charts}>
                <MiniChart
                    title="Projects uploaded (14 days)"
                    series={buildSeries(stats.projectsByDay, 14)}
                />
                <MiniChart
                    title="Logins (7 days)"
                    series={buildSeries(stats.loginsByDay, 7)}
                />
            </div>
        </div>
    );
};

const ProjectManager = () => {
    const [query, setQuery] = useState('');
    const [projects, setProjects] = useState(null);
    const [error, setError] = useState('');
    const [note, setNote] = useState('');
    const [dialog, setDialog] = useState(null);
    const [dialogError, setDialogError] = useState('');
    const [dialogBusy, setDialogBusy] = useState(false);
    const actionInFlight = useRef(false);
    const beginSearch = useLatest();

    const search = useCallback(async q => {
        const fresh = beginSearch();
        setError('');
        setNote('');
        try {
            const data = await api.admin.searchProjects(q || '');
            fresh(setProjects)(data.projects || []);
        } catch (e) {
            fresh(setError)(e.message || 'Could not load projects.');
        }
    }, [beginSearch]);

    useEffect(() => {
        search('');
    }, [search]);

    const unshare = async id => {
        if (actionInFlight.current) return;
        const releaseAction = () => {
            actionInFlight.current = false;
        };
        actionInFlight.current = true;
        try {
            setError('');
            await api.unpublish(id);
            setNote('Project unshared.');
            search(query);
        } catch (e) {
            setError(e.message || 'Could not unshare that project.');
        } finally {
            releaseAction();
        }
    };

    const remove = id => {
        if (actionInFlight.current) return;
        const project = (projects || []).find(item => item.id === id);
        setDialogError('');
        setDialog({
            id,
            title: 'Delete project?',
            description: `Delete ${project ? project.title : 'this project'} permanently?`,
            action: 'Delete project',
            danger: true,
            icon: FolderOpen
        });
    };

    const confirmRemove = async () => {
        if (!dialog || actionInFlight.current) return;
        const releaseAction = () => {
            actionInFlight.current = false;
        };
        actionInFlight.current = true;
        setDialogBusy(true);
        try {
            setDialogError('');
            await api.deleteProject(dialog.id);
            setDialog(null);
            setNote('Project deleted.');
            search(query);
        } catch (e) {
            setDialogError(e.message || 'Could not delete that project.');
        } finally {
            releaseAction();
            setDialogBusy(false);
        }
    };

    return (
        <div>
            <AdminActionDialog
                dialog={dialog}
                busy={dialogBusy}
                error={dialogError}
                onChange={() => {}}
                onCancel={() => {
                    if (!actionInFlight.current) setDialog(null);
                }}
                onConfirm={confirmRemove}
            />
            <h2>Projects</h2>
            <div className={styles.addAdmin}>
                <input
                    className={styles.input}
                    placeholder="Search title, owner, or id"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onKeyDown={e => {
                        if (e.key === 'Enter') search(query);
                    }}
                />
                <button
                    className={styles.secondary}
                    onClick={() => search(query)}
                >Search</button>
            </div>
            {error ? <p className={styles.error}>{error}</p> : null}
            {note ? <p className={styles.status}>{note}</p> : null}
            {projects === null ? (
                <p className={styles.status}>Loading…</p>
            ) : projects.length ? (
                <div className={styles.list}>
                    {projects.map(project => (
                        <div
                            key={project.id}
                            className={styles.row}
                        >
                            <div className={styles.rowInfo}>
                                <span className={styles.rowTitle}>
                                    <Link to={projectUrl(project.id)}>{project.title || project.id}</Link>
                                </span>
                                <span className={styles.rowMeta}>
                                    {`by @${project.owner} · ${project.shared ? 'Shared' : 'Unshared'}`}
                                </span>
                            </div>
                            <div className={styles.rowActions}>
                                {project.shared ? (
                                    <button
                                        className={styles.secondary}
                                        onClick={() => unshare(project.id)}
                                    >Unshare</button>
                                ) : null}
                                <button
                                    className={styles.danger}
                                    onClick={() => remove(project.id)}
                                >Delete</button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className={styles.status}>No projects found.</p>
            )}
        </div>
    );
};

const UserDetailCard = ({username, onBack}) => {
    const [data, setData] = useState(null);
    const [error, setError] = useState('');
    const [note, setNote] = useState('');
    const [level, setLevel] = useState('good');
    const [reasonText, setReasonText] = useState('');
    const [message, setMessage] = useState('');
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
        setDialog(null);
        setDialogError('');
        setDialogBusy(false);
        api.admin.getUser(username)
            .then(result => {
                if (!active) return;
                setData(result);
                setLevel((result.standing && result.standing.level) || 'good');
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

    const applyStanding = async () => {
        if (!data) return;
        setError('');
        setNote('');
        try {
            await api.admin.setStanding(data.username, level, reasonText.trim());
            setNote('Standing updated.');
            refresh();
        } catch (e) {
            setError(e.message || 'Action failed.');
        }
    };

    const sendMessage = async () => {
        if (!data || !message.trim()) return;
        setError('');
        setNote('');
        try {
            await api.admin.messageUser(data.username, message.trim());
            setNote('Message sent.');
            setMessage('');
        } catch (e) {
            setError(e.message || 'Action failed.');
        }
    };

    const toggleComments = async () => {
        if (!data) return;
        setError('');
        setNote('');
        try {
            await api.admin.updateUserProfile(data.username, {commentsOff: !data.commentsOff});
            refresh();
        } catch (e) {
            setError(e.message || 'Action failed.');
        }
    };

    const unshareProject = async pid => {
        try {
            await api.unpublish(pid);
            setNote('Project unshared.');
            refresh();
        } catch (e) {
            setError(e.message || 'Could not unshare.');
        }
    };

    const deleteProject = pid => {
        if (deleteInFlight.current) return;
        const project = (data.projects || []).find(item => item.id === pid);
        setDialogError('');
        setDialog({
            id: pid,
            title: 'Delete project?',
            description: `Delete ${project ? project.title : 'this project'} permanently?`,
            action: 'Delete project',
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
            setNote('Project deleted.');
            refresh();
        } catch (e) {
            setDialogError(e.message || 'Could not delete.');
        } finally {
            releaseDelete();
            setDialogBusy(false);
        }
    };

    if (error) {
        return (
            <div>
                <p className={styles.error}>{error}</p>
                <button className={styles.secondary} onClick={onBack}>Back to list</button>
            </div>
        );
    }
    if (!data) return <p className={styles.status}>Loading user details…</p>;

    return (
        <div>
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
            <button className={styles.secondary} onClick={onBack} style={{marginBottom: 10}}>← Back to list</button>
            <div className={styles.userCard}>
                <div className={styles.userHead}>
                    <Avatar username={data.username} size={44} />
                    <div className={styles.rowInfo}>
                        <span className={styles.rowTitle}>
                            <Link to={`/users/${data.username}`}>{`@${data.username}`}</Link>
                            {data.admin ? <span className={styles.badge}>admin</span> : null}
                            <span className={styles.badge}>{(data.standing && data.standing.level) || 'good'}</span>
                        </span>
                        <span className={styles.rowMeta}>
                            {`${data.followerCount || 0} followers · ${data.followingCount || 0} following`}
                        </span>
                    </div>
                </div>

                <label className={styles.fieldLabel}>Account standing</label>
                <div className={styles.field}>
                    <select className={styles.select} value={level} onChange={e => setLevel(e.target.value)}>
                        {STANDING_LEVELS.map(l => (
                            <option key={l} value={l}>{l}</option>
                        ))}
                    </select>
                    <input
                        className={styles.input}
                        placeholder="Reason (shown to the user)"
                        value={reasonText}
                        onChange={e => setReasonText(e.target.value)}
                    />
                    <button className={styles.secondary} onClick={applyStanding}>Apply</button>
                </div>

                <label className={styles.fieldLabel}>Send a message to their notifications</label>
                <div className={styles.field}>
                    <input
                        className={styles.input}
                        placeholder="Message"
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                    />
                    <button className={styles.secondary} disabled={!message.trim()} onClick={sendMessage}>Send</button>
                </div>

                <button className={styles.secondary} onClick={toggleComments}>
                    {data.commentsOff ? 'Enable profile comments' : 'Disable profile comments'}
                </button>

                {data.quota ? (
                    <div className={styles.quota}>
                        <span className={styles.fieldLabel}>Upload quota</span>
                        <span className={styles.quotaBar}>
                            <span className={styles.quotaFillBg}>
                                <span
                                    className={styles.quotaFill}
                                    style={{width: `${Math.min(100, (data.quota.used / data.quota.limit) * 100)}%`}}
                                />
                            </span>
                            <span className={styles.quotaText}>
                                {`${formatBytes(data.quota.used)} of ${formatBytes(data.quota.limit)}`}
                            </span>
                        </span>
                    </div>
                ) : null}

                {(data.projects || []).length ? (
                    <div className={styles.list}>
                        {data.projects.map(project => (
                            <div key={project.id} className={styles.row}>
                                <div className={styles.rowInfo}>
                                    <span className={styles.rowTitle}>
                                        <Link to={projectUrl(project.id)}>{project.title || project.id}</Link>
                                    </span>
                                    <span className={styles.rowMeta}>
                                        {project.shared ? 'Shared' : 'Not shared'}
                                    </span>
                                </div>
                                <div className={styles.rowActions}>
                                    {project.shared ? (
                                        <button
                                            className={styles.secondary}
                                            onClick={() => unshareProject(project.id)}
                                        >Unshare</button>
                                    ) : null}
                                    <button
                                        className={styles.danger}
                                        onClick={() => deleteProject(project.id)}
                                    >Delete</button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : null}

                {note ? <p className={styles.status} style={{marginTop: 8}}>{note}</p> : null}
            </div>
        </div>
    );
};

const UserManager = () => {
    const [query, setQuery] = useState('');
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selected, setSelected] = useState(null);

    useEffect(() => {
        setLoading(true);
        setError('');
        api.admin.users()
            .then(data => {
                setUsers(data.users || []);
                setLoading(false);
            })
            .catch(e => {
                setError(e.message || 'Could not load users.');
                setLoading(false);
            });
    }, []);

    const filtered = query.trim() ?
        users.filter(u => u.username.toLowerCase().includes(query.toLowerCase())) :
        users;

    if (selected) {
        return (
            <div>
                <h2>Users</h2>
                <UserDetailCard username={selected} onBack={() => setSelected(null)} />
            </div>
        );
    }

    return (
        <div>
            <h2>Users</h2>
            <div className={styles.addAdmin}>
                <input
                    className={styles.input}
                    placeholder="Filter by username…"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                />
                <span className={styles.status} style={{fontSize: 13, alignSelf: 'center'}}>
                    {users.length} total
                </span>
            </div>
            {error ? <p className={styles.error}>{error}</p> : null}
            {loading ? (
                <p className={styles.status}>Loading users…</p>
            ) : filtered.length ? (
                <div className={styles.list}>
                    {filtered.map(user => {
                        const pct = user.quotaLimit > 0 ? (user.quotaUsed / user.quotaLimit) * 100 : 0;
                        return (
                            <div
                                key={user.username}
                                className={styles.row}
                                style={{cursor: 'pointer'}}
                                onClick={() => setSelected(user.username)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={e => {
                                    if (e.key === 'Enter') setSelected(user.username);
                                }}
                            >
                                <Avatar username={user.username} size={32} />
                                <div className={styles.rowInfo}>
                                    <span className={styles.rowTitle}>
                                        {`@${user.username}`}
                                        {user.banned ? (
                                            <span
                                                className={styles.badge}
                                                style={{borderColor: '#e25555', color: '#e25555'}}
                                            >banned</span>
                                        ) : null}
                                    </span>
                                    <span className={styles.rowMeta}>
                                        {`${user.followerCount} followers · ${user.projectCount} projects`}
                                    </span>
                                </div>
                                <div className={styles.resetInfo}>
                                    <div className={styles.quotaBar}>
                                        <span className={styles.quotaFillBg} style={{width: 100}}>
                                            <span
                                                className={styles.quotaFill}
                                                style={{width: `${Math.min(100, pct)}%`}}
                                            />
                                        </span>
                                        <span className={styles.quotaText}>
                                            {formatBytes(user.quotaUsed)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <p className={styles.status}>No users match that filter.</p>
            )}
        </div>
    );
};

const EvidenceDetails = ({data}) => {
    const config = data.config || {};
    const buyers = config.buyers || [];
    const visibility = config.visibility || (config.shared ? 'public' : 'private');
    return (
        <div className={styles.evidenceBody}>
            <ul className={styles.evidenceMeta}>
                <li><strong>Title:</strong> {` ${config.title || ''}`}</li>
                <li><strong>Owner:</strong> {` @${config.owner || ''}`}</li>
                <li><strong>Price:</strong> {` ${config.price || 0} credits`}</li>
                <li><strong>Visibility:</strong> {` ${visibility}`}</li>
                {config.revenue ? <li><strong>Revenue:</strong> {` ${config.revenue} credits`}</li> : null}
                {buyers.length ? <li><strong>Buyers:</strong> {` ${buyers.length}`}</li> : null}
                {config.snapshotAt ? (
                    <li><strong>Captured:</strong> {` ${new Date(config.snapshotAt).toLocaleString()}`}</li>
                ) : null}
            </ul>
            {config.description ? <p className={styles.evidenceText}>{config.description}</p> : null}
            {config.instructions ? <p className={styles.evidenceText}>{config.instructions}</p> : null}
            <iframe
                className={styles.evidenceStage}
                src={embedUrl({projectJsonUrl: data.projectJsonUrl, assetsBase: data.assetsBase})}
                title="Reported project copy"
                sandbox="allow-scripts allow-pointer-lock"
            />
        </div>
    );
};

const EvidencePanel = ({target}) => {
    const [open, setOpen] = useState(false);
    const [state, setState] = useState({status: 'idle', data: null});
    const toggle = async () => {
        setOpen(value => !value);
        if (state.status !== 'idle') return;
        setState({status: 'loading', data: null});
        try {
            const result = await api.admin.reportEvidence(target);
            setState(result.exists ? {status: 'ready', data: result} : {status: 'none', data: null});
        } catch (e) {
            setState({status: 'none', data: null});
        }
    };
    return (
        <div className={styles.evidence}>
            <button
                className={styles.secondary}
                onClick={toggle}
            >{open ? 'Hide reported copy' : 'View reported copy'}</button>
            {open && state.status === 'loading' ? (
                <p className={styles.status}>Loading…</p>
            ) : null}
            {open && state.status === 'none' ? (
                <p className={styles.status}>No preserved copy for this report.</p>
            ) : null}
            {open && state.status === 'ready' ? (
                <EvidenceDetails data={state.data} />
            ) : null}
        </div>
    );
};

const ExtensionManager = () => {
    const [data, setData] = useState(null);
    const [tab, setTab] = useState('untrusted');
    const [error, setError] = useState('');
    const [note, setNote] = useState('');
    const [source, setSource] = useState(null);
    const [blockedUrl, setBlockedUrl] = useState('');
    const [query, setQuery] = useState('');
    const [dialog, setDialog] = useState(null);
    const [dialogBusy, setDialogBusy] = useState(false);
    const [dialogError, setDialogError] = useState('');
    const policyInFlight = useRef(false);

    const load = useCallback(() => {
        setError('');
        return api.admin.extensions()
            .then(setData)
            .catch(e => setError(e.message || 'Could not load extensions.'));
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const applyPolicy = async (hash, status) => {
        if (policyInFlight.current) return;
        const releasePolicy = () => {
            policyInFlight.current = false;
        };
        policyInFlight.current = true;
        setDialogBusy(true);
        setDialogError('');
        try {
            const result = await api.admin.setExtensionPolicy(hash, status);
            setNote(result.affected ?
                `Made ${result.affected} affected projects private and notified their owners.` :
                'Extension policy updated.');
            setSource(null);
            setDialog(null);
            setData(current => ({
                ...current,
                extensions: (current.extensions || []).map(extension => {
                    if (extension.hash === hash) return {...extension, status};
                    return extension;
                })
            }));
        } catch (e) {
            if (dialog) setDialogError(e.message || 'Could not update extension policy.');
            else setError(e.message || 'Could not update extension policy.');
        } finally {
            releasePolicy();
            setDialogBusy(false);
        }
    };

    const setPolicy = (hash, status) => {
        if (status === 'blocked') {
            setDialogError('');
            setDialog({
                kind: 'hash',
                hash,
                status,
                title: 'Block extension?',
                description: 'This makes every project using the extension private and notifies its owner.',
                action: 'Block extension',
                danger: true,
                icon: Puzzle
            });
            return;
        }
        applyPolicy(hash, status);
    };

    const applyUrlPolicy = async (url, blocked) => {
        if (policyInFlight.current) return;
        const releasePolicy = () => {
            policyInFlight.current = false;
        };
        policyInFlight.current = true;
        setDialogBusy(true);
        setDialogError('');
        try {
            const result = await api.admin.setExtensionUrlPolicy(url, blocked);
            setNote(result.affected ?
                `Made ${result.affected} affected projects private and notified their owners.` :
                'URL policy updated.');
            setBlockedUrl('');
            setDialog(null);
            setData(current => ({
                ...current,
                blockedUrls: blocked ?
                    [...new Set([...(current.blockedUrls || []), url])] :
                    (current.blockedUrls || []).filter(blockedEntry => blockedEntry !== url)
            }));
        } catch (e) {
            if (dialog) setDialogError(e.message || 'Could not update URL policy.');
            else setError(e.message || 'Could not update URL policy.');
        } finally {
            releasePolicy();
            setDialogBusy(false);
        }
    };

    const setUrlPolicy = (url, blocked) => {
        if (blocked) {
            setDialogError('');
            setDialog({
                kind: 'url',
                url,
                blocked,
                title: 'Block extension URL?',
                description: 'This makes every project using the URL private and notifies its owner.',
                action: 'Block URL',
                danger: true,
                icon: Puzzle
            });
            return;
        }
        applyUrlPolicy(url, blocked);
    };

    const confirmPolicy = () => {
        if (!dialog) return;
        if (dialog.kind === 'hash') return applyPolicy(dialog.hash, dialog.status);
        return applyUrlPolicy(dialog.url, dialog.blocked);
    };

    const viewSource = async hash => {
        try {
            setError('');
            setSource({hash, text: 'Loading…'});
            setSource({hash, text: await api.admin.extensionSource(hash)});
        } catch (e) {
            setSource(null);
            setError(e.message || 'Could not load extension source.');
        }
    };

    if (!data) {
        return (
            <div>
                <h2>Extensions</h2>
                <p className={error ? styles.error : styles.status}>{error || 'Loading…'}</p>
            </div>
        );
    }

    const allExtensions = data.extensions || [];
    const search = query.trim().toLowerCase();
    const extensions = allExtensions.filter(extension => {
        if (extension.status !== tab) return false;
        if (!search) return true;
        const metadata = extension.metadata || {};
        return [
            extension.hash,
            ...(extension.urls || []),
            metadata.name,
            metadata.id,
            metadata.description,
            metadata.author,
            metadata.license
        ].some(value => typeof value === 'string' && value.toLowerCase().includes(search));
    });
    const tabs = [
        {status: 'untrusted', label: 'To be verified'},
        {status: 'ignored', label: 'Ignored'},
        {status: 'trusted', label: 'Trusted'},
        {status: 'blocked', label: 'Blocked'}
    ];

    return (
        <div>
            <AdminActionDialog
                dialog={dialog}
                busy={dialogBusy}
                error={dialogError}
                onChange={() => {}}
                onCancel={() => {
                    if (!policyInFlight.current) setDialog(null);
                }}
                onConfirm={confirmPolicy}
            />
            <h2>Extensions</h2>
            <input
                type="search"
                className={`${styles.input} ${styles.extensionSearch}`}
                placeholder="Search extensions"
                aria-label="Search extensions"
                value={query}
                onChange={e => setQuery(e.target.value)}
            />
            <div className={styles.extensionTabs}>
                {tabs.map(item => (
                    <button
                        key={item.status}
                        className={tab === item.status ? styles.extensionTabActive : styles.extensionTab}
                        onClick={() => setTab(item.status)}
                    >
                        {`${item.label} (${
                            allExtensions.filter(extension => extension.status === item.status).length
                        })`}
                    </button>
                ))}
            </div>
            <div className={styles.addAdmin}>
                <input
                    className={styles.input}
                    placeholder="Block an extension URL"
                    value={blockedUrl}
                    onChange={e => setBlockedUrl(e.target.value)}
                />
                <button
                    className={styles.danger}
                    onClick={() => blockedUrl.trim() && setUrlPolicy(blockedUrl.trim(), true)}
                >Block URL</button>
            </div>
            {error ? <p className={styles.error}>{error}</p> : null}
            {note ? <p className={styles.status}>{note}</p> : null}
            {extensions.length ? (
                <div className={styles.list}>
                    {extensions.map(extension => (
                        <div
                            key={extension.hash}
                            className={styles.extensionRow}
                        >
                            <div className={styles.row}>
                                <div className={styles.rowInfo}>
                                    {extension.metadata && extension.metadata.name ? (
                                        <span className={styles.rowTitle}>{extension.metadata.name}</span>
                                    ) : null}
                                    {extension.metadata && extension.metadata.id ? (
                                        <span className={styles.rowMeta}>{`ID: ${extension.metadata.id}`}</span>
                                    ) : null}
                                    {extension.metadata && extension.metadata.description ? (
                                        <span className={styles.rowMeta}>{extension.metadata.description}</span>
                                    ) : null}
                                    {extension.metadata && extension.metadata.author ? (
                                        <span className={styles.rowMeta}>{`By: ${extension.metadata.author}`}</span>
                                    ) : null}
                                    {extension.metadata && extension.metadata.license ? (
                                        <span className={styles.rowMeta}>
                                            {`License: ${extension.metadata.license}`}
                                        </span>
                                    ) : null}
                                    <span className={styles.extensionHash}>{extension.hash}</span>
                                    <span className={styles.rowMeta}>
                                        {`Used in ${extension.projectCount} ${
                                            extension.projectCount === 1 ? 'project' : 'projects'
                                        }`}
                                    </span>
                                    {extension.urls.map(url => (
                                        <span
                                            key={url}
                                            className={styles.extensionUrl}
                                        >
                                            {url}
                                            {!extension.gallery && /^https?:\/\//.test(url) ? (
                                                <button
                                                    className={styles.linkButton}
                                                    onClick={() => setUrlPolicy(url, true)}
                                                >Block URL</button>
                                            ) : null}
                                        </span>
                                    ))}
                                </div>
                                <div className={styles.rowActions}>
                                    {extension.sourceAvailable ? (
                                        <button
                                            className={styles.secondary}
                                            onClick={() => viewSource(extension.hash)}
                                        >View source</button>
                                    ) : null}
                                    {!extension.gallery && tab !== 'trusted' ? (
                                        <button
                                            className={styles.secondary}
                                            onClick={() => setPolicy(extension.hash, 'trusted')}
                                        >Trust</button>
                                    ) : !extension.gallery ? (
                                        <button
                                            className={styles.secondary}
                                            onClick={() => setPolicy(extension.hash, 'untrusted')}
                                        >Untrust</button>
                                    ) : null}
                                    {tab === 'untrusted' ? (
                                        <button
                                            className={styles.secondary}
                                            onClick={() => setPolicy(extension.hash, 'ignored')}
                                        >Ignore</button>
                                    ) : tab === 'ignored' ? (
                                        <button
                                            className={styles.secondary}
                                            onClick={() => setPolicy(extension.hash, 'untrusted')}
                                        >Review again</button>
                                    ) : null}
                                    {!extension.gallery && tab !== 'blocked' ? (
                                        <button
                                            className={styles.danger}
                                            onClick={() => setPolicy(extension.hash, 'blocked')}
                                        >Block hash</button>
                                    ) : !extension.gallery ? (
                                        <button
                                            className={styles.secondary}
                                            onClick={() => setPolicy(extension.hash, 'untrusted')}
                                        >Unblock</button>
                                    ) : null}
                                </div>
                            </div>
                            {source && source.hash === extension.hash ? (
                                <pre className={styles.extensionSource}>{source.text}</pre>
                            ) : null}
                        </div>
                    ))}
                </div>
            ) : (
                <p className={styles.status}>
                    {search ?
                        'No matching extensions.' :
                        (tab === 'untrusted' ? 'No extensions to verify.' : `No ${tab} extension hashes.`)}
                </p>
            )}
            {tab === 'blocked' && data.blockedUrls && data.blockedUrls.length ? (
                <div className={styles.list}>
                    {data.blockedUrls.map(url => (
                        <div
                            key={url}
                            className={styles.row}
                        >
                            <span className={styles.extensionUrl}>{url}</span>
                            <button
                                className={styles.secondary}
                                onClick={() => setUrlPolicy(url, false)}
                            >Unblock URL</button>
                        </div>
                    ))}
                </div>
            ) : null}
        </div>
    );
};

const Admin = () => {
    const {user, loading} = useUser();
    const [reports, setReports] = useState(null);
    const [bans, setBans] = useState([]);
    const [admins, setAdmins] = useState([]);
    const [error, setError] = useState('');
    const [newAdmin, setNewAdmin] = useState('');
    const [active, setActive] = useState('overview');
    const [dialog, setDialog] = useState(null);
    const [dialogBusy, setDialogBusy] = useState(false);
    const [dialogError, setDialogError] = useState('');
    const actionLocks = useRef(new Set());
    const beginLoad = useLatest();

    const load = useCallback(() => {
        const fresh = beginLoad();
        api.admin.reports()
            .then(fresh(data => setReports((data.reports || []).filter(report => !report.resolved))))
            .catch(fresh(e => setError(e.message || 'Could not load reports.')));
        api.admin.bans()
            .then(fresh(data => setBans(data.bans || [])))
            .catch(() => {});
        api.admin.admins()
            .then(fresh(data => setAdmins(data.admins || [])))
            .catch(() => {});
    }, [beginLoad]);

    useEffect(() => {
        if (user && user.isAdmin) load();
    }, [user, load]);

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
            title: `Reply to @${report.reporter}`,
            description: 'The reply is sent as a private moderation message. Sending it closes the support request.',
            action: 'Send and close',
            fields: [{key: 'message', label: 'Message', value: '', multiline: true, maxLength: 2000}],
            icon: Flag
        });
    };

    const warnFromReport = report => {
        setDialogError('');
        setDialog({
            kind: 'warn-report',
            report,
            title: 'Warn user?',
            description: 'The user will see this reason in their moderation notice.',
            action: 'Send warning',
            fields: [{key: 'reason', label: 'Reason', value: '', multiline: true, maxLength: 1000}],
            icon: AlertTriangle
        });
    };

    const banFromReport = report => {
        const who = report.type === 'project' ? 'the owner of this project' : `@${report.target}`;
        setDialogError('');
        setDialog({
            kind: 'ban-report',
            report,
            title: `Ban ${who}?`,
            description: 'They will be locked out of MistWarp until an admin unbans them.',
            action: 'Ban user',
            danger: true,
            icon: Ban
        });
    };

    const banByName = () => {
        setDialogError('');
        setDialog({
            kind: 'ban-user',
            title: 'Ban user',
            description: 'The user will be locked out of MistWarp until an admin unbans them.',
            action: 'Ban user',
            danger: true,
            fields: [
                {key: 'username', label: 'Username', value: '', maxLength: 80},
                {key: 'reason', label: 'Reason', value: '', multiline: true, maxLength: 1000}
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
            setDialogError('Enter a reply.');
            return;
        }
        if (dialog.kind === 'warn-report' && !values.reason) {
            setDialogError('Enter a warning reason.');
            return;
        }
        if (dialog.kind === 'ban-user' && !values.username) {
            setDialogError('Enter a username.');
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
        return <main className={styles.page}><p className={styles.status}>Loading…</p></main>;
    }
    if (!user || !user.isAdmin) {
        return <main className={styles.page}><p className={styles.status}>This page is for admins.</p></main>;
    }

    const openCount = reports ? reports.length : 0;

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
            <h1>Admin</h1>
            {error ? <p className={styles.error}>{error}</p> : null}

            <div className={styles.layout}>
                <nav
                    className={styles.sidebar}
                    aria-label="Admin sections"
                >
                    {SECTIONS.map(section => {
                        const Icon = section.icon;
                        const count = section.key === 'reports' ? openCount : 0;
                        return (
                            <button
                                key={section.key}
                                type="button"
                                className={active === section.key ? styles.sidebarActive : styles.sidebarItem}
                                onClick={() => setActive(section.key)}
                            >
                                <Icon size={18} />
                                <span className={styles.sidebarLabel}>{section.label}</span>
                                {count > 0 ? (
                                    <span className={styles.sidebarCount}>{count > 99 ? '99+' : count}</span>
                                ) : null}
                            </button>
                        );
                    })}
                </nav>

                <div className={styles.content}>
                    {active === 'overview' ? (
                        <section className={styles.card}>
                            <StatsOverview />
                        </section>
                    ) : null}

                    {active === 'reports' ? (
                        <section className={styles.card}>
                            <h2>Open reports</h2>
                            {reports === null ? (
                                <p className={styles.status}>Loading…</p>
                            ) : reports.length ? (
                                <div className={styles.list}>
                                    {reports.map(report => (
                                        <div
                                            key={report.id}
                                            className={styles.row}
                                        >
                                            <div className={styles.rowInfo}>
                                                <span className={styles.rowTitle}>
                                                    {report.type === 'support' ? `${report.supportType || 'Support'} request from @${report.reporter}` : report.type === 'project' ? (
                                                        <Link
                                                            to={projectUrl(report.target)}
                                                        >{`Project ${report.target}`}</Link>
                                                    ) : report.type === 'user' ? (
                                                        <Link
                                                            to={`/users/${report.target}`}
                                                        >{`@${report.target}`}</Link>
                                                    ) : report.type === 'comment' && report.context ? (
                                                        (() => {
                                                            const ctx = report.context;
                                                            const target = report.target;
                                                            if (ctx.startsWith('project ')) {
                                                                const pid = ctx.slice(8);
                                                                return (
                                                                    <Link
                                                                        to={`${projectUrl(pid)}#comment-id-${target}`}
                                                                    >{`Comment ${target}`}</Link>
                                                                );
                                                            }
                                                            if (ctx.startsWith('profile ')) {
                                                                const uname = ctx.slice(8);
                                                                return (
                                                                    <Link
                                                                        to={`/users/${uname}#comment-id-${target}`}
                                                                    >{`Comment ${target}`}</Link>
                                                                );
                                                            }
                                                            return `Comment ${target}`;
                                                        })()
                                                    ) : (
                                                        `Comment ${report.target}`
                                                    )}
                                                </span>
                                                <span className={styles.rowMeta}>
                                                    {`Reported by @${report.reporter} · ${timeAgo(report.created)} ago`}
                                                    {report.type !== 'support' && report.context ? ` · in ${report.context}` : ''}
                                                </span>
                                                <span className={styles.reason}>{report.reason}</span>
                                                {report.type === 'support' && report.context ? <span className={styles.reason}>{report.context}</span> : null}
                                                {report.type === 'project' ? (
                                                    <EvidencePanel target={report.target} />
                                                ) : null}
                                            </div>
                                            <div className={styles.rowActions}>
                                                {report.type === 'support' ? <button className={styles.secondary} onClick={() => replyToSupport(report)}>Reply and close</button> : null}
                                                {report.type === 'project' ? (
                                                    <button
                                                        className={styles.secondary}
                                                        onClick={() => act(report.id, 'unshare_project')}
                                                    >Unshare</button>
                                                ) : null}
                                                {report.type !== 'support' ? <button
                                                    className={styles.secondary}
                                                    onClick={() => warnFromReport(report)}
                                                >{report.type === 'project' ? 'Warn owner' : 'Warn user'}</button> : null}
                                                {report.type !== 'support' ? <button
                                                    className={styles.danger}
                                                    onClick={() => banFromReport(report)}
                                                >{report.type === 'project' ? 'Ban owner' : 'Ban user'}</button> : null}
                                                <button
                                                    className={styles.secondary}
                                                    onClick={() => act(report.id, 'dismiss')}
                                                >Dismiss</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className={styles.status}>No open reports.</p>
                            )}
                        </section>
                    ) : null}

                    {active === 'users' ? (
                        <section className={styles.card}>
                            <UserManager />
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

                    {active === 'bans' ? (
                        <section className={styles.card}>
                            <h2>Bans</h2>
                            <button
                                className={styles.secondary}
                                onClick={banByName}
                            >Ban a user…</button>
                            {bans.length ? (
                                <div className={styles.list}>
                                    {bans.map(ban => (
                                        <div
                                            key={ban.username}
                                            className={styles.row}
                                        >
                                            <Avatar
                                                username={ban.username}
                                                size={28}
                                            />
                                            <div className={styles.rowInfo}>
                                                <span className={styles.rowTitle}>{`@${ban.username}`}</span>
                                                <span className={styles.rowMeta}>
                                                    {`Banned by @${ban.by} · ${timeAgo(ban.created)} ago`}
                                                    {ban.reason ? ` · ${ban.reason}` : ''}
                                                </span>
                                            </div>
                                            <div className={styles.rowActions}>
                                                <button
                                                    className={styles.secondary}
                                                    onClick={() => unban(ban.username)}
                                                >Unban</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className={styles.status}>Nobody is banned.</p>
                            )}
                        </section>
                    ) : null}

                    {active === 'admins' ? (
                        <section className={styles.card}>
                            <h2>Admins</h2>
                            <div className={styles.addAdmin}>
                                <input
                                    className={styles.input}
                                    placeholder="username"
                                    value={newAdmin}
                                    onChange={e => setNewAdmin(e.target.value)}
                                />
                                <button
                                    className={styles.secondary}
                                    onClick={addAdmin}
                                >Add admin</button>
                            </div>
                            <div className={styles.list}>
                                {admins.map(admin => (
                                    <div
                                        key={admin.username}
                                        className={styles.row}
                                    >
                                        <Avatar
                                            username={admin.username}
                                            size={28}
                                        />
                                        <div className={styles.rowInfo}>
                                            <span className={styles.rowTitle}>{`@${admin.username}`}</span>
                                            <span className={styles.rowMeta}>
                                                {admin.super ? 'Super admin' : 'Admin'}
                                            </span>
                                        </div>
                                        <div className={styles.rowActions}>
                                            {admin.super ? null : (
                                                <button
                                                    className={styles.secondary}
                                                    onClick={() => removeAdmin(admin.username)}
                                                >Remove</button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    ) : null}
                </div>
            </div>
        </main>
    );
};

export default Admin;
