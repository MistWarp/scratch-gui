import React, {useEffect, useState, useCallback} from 'react';
import {Link} from 'react-router-dom';
import {Flag, User, FolderOpen, Ban, ShieldCheck, BarChart3} from 'lucide-react';
import api, {projectUrl, embedUrl} from '../api';
import {useUser} from '../UserContext.jsx';
import Avatar from '../components/Avatar.jsx';
import {timeAgo, formatBytes} from '../format';
import useLatest from '../use-latest.js';
import styles from './Admin.module.css';

const STANDING_LEVELS = ['good', 'warning', 'suspended', 'banned'];

const SECTIONS = [
    {key: 'overview', label: 'Overview', icon: BarChart3},
    {key: 'reports', label: 'Reports', icon: Flag},
    {key: 'users', label: 'Users', icon: User},
    {key: 'projects', label: 'Projects', icon: FolderOpen},
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
                {pct >= 80 ? '⚠ ' : ''}{Math.round(pct)}% full
            </span>
        </div>
    );
};

const StatsOverview = () => {
    const [stats, setStats] = useState(null);
    const [quota, setQuota] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        api.admin.stats()
            .then(setStats)
            .catch(e => setError(e.message || 'Could not load stats.'));
        api.quota()
            .then(setQuota)
            .catch(() => {});
    }, []);

    if (error) {
        return <div><h2>Overview</h2><p className={styles.error}>{error}</p></div>;
    }
    if (!stats) {
        return <div><h2>Overview</h2><p className={styles.status}>Loading…</p></div>;
    }
    return (
        <div>
            <h2>Overview</h2>

            {quota && (quota.used / quota.limit) * 100 >= 80 ? (
                <p className={styles.quotaWarning}>
                    ⚠ You've used {formatBytes(quota.used)} of your {formatBytes(quota.limit)} upload quota
                    ({Math.round((quota.used / quota.limit) * 100)}%).{' '}
                    {quota.used >= quota.limit
                        ? 'You cannot upload new projects until usage drops.'
                        : 'Consider managing your projects to free up space.'}
                </p>
            ) : null}

            <div className={styles.statGrid}>
                <StatTile
                    label="Projects"
                    value={stats.totalProjects.toLocaleString()}
                />
                <StatTile
                    label="Shared"
                    value={stats.sharedProjects.toLocaleString()}
                />
                <StatTile
                    label="Unshared"
                    value={stats.unsharedProjects.toLocaleString()}
                />
                <StatTile
                    label="Users"
                    value={stats.totalUsers.toLocaleString()}
                />
                <StatTile
                    label="Storage used"
                    value={formatBytes(stats.totalBytes)}
                />
                <StatTile
                    label="Total views"
                    value={stats.totalViews.toLocaleString()}
                />
                <StatTile
                    label="Total loves"
                    value={stats.totalLoves.toLocaleString()}
                />
                <StatTile
                    label="Active sessions"
                    value={stats.activeSessions.toLocaleString()}
                />
                <StatTile
                    label="Open reports"
                    value={stats.openReports.toLocaleString()}
                />
                <StatTile
                    label="Banned users"
                    value={stats.bannedUsers.toLocaleString()}
                />
                <StatTile
                    label="News posts"
                    value={stats.newsPosts.toLocaleString()}
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

    const search = useCallback(async q => {
        setError('');
        setNote('');
        try {
            const data = await api.admin.searchProjects(q || '');
            setProjects(data.projects || []);
        } catch (e) {
            setError(e.message || 'Could not load projects.');
        }
    }, []);

    useEffect(() => {
        search('');
    }, [search]);

    const unshare = async id => {
        try {
            setError('');
            await api.unpublish(id);
            setNote('Project unshared.');
            search(query);
        } catch (e) {
            setError(e.message || 'Could not unshare that project.');
        }
    };

    const remove = async id => {
        if (!window.confirm('Delete this project? This cannot be undone.')) return;
        try {
            setError('');
            await api.deleteProject(id);
            setNote('Project deleted.');
            search(query);
        } catch (e) {
            setError(e.message || 'Could not delete that project.');
        }
    };

    return (
        <div>
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

const UserManager = () => {
    const [query, setQuery] = useState('');
    const [data, setData] = useState(null);
    const [error, setError] = useState('');
    const [note, setNote] = useState('');
    const [level, setLevel] = useState('good');
    const [reason, setReason] = useState('');
    const [message, setMessage] = useState('');

    const loadUser = useCallback(async name => {
        const target = (name || '').trim();
        if (!target) return;
        setError('');
        setNote('');
        try {
            const result = await api.admin.getUser(target);
            setData(result);
            setLevel((result.standing && result.standing.level) || 'good');
            setReason('');
            setMessage('');
        } catch (e) {
            setData(null);
            setError(e.message || 'Could not load that user.');
        }
    }, []);

    const run = async (fn, ok) => {
        setError('');
        setNote('');
        try {
            await fn();
            if (ok) setNote(ok);
            await loadUser(data.username);
        } catch (e) {
            setError(e.message || 'Action failed.');
        }
    };

    const applyStanding = () =>
        run(() => api.admin.setStanding(data.username, level, reason.trim()), 'Standing updated.');
    const sendMessage = () =>
        run(() => api.admin.messageUser(data.username, message.trim()), 'Message sent.');
    const toggleComments = () =>
        run(() => api.admin.updateUserProfile(data.username, {commentsOff: !data.commentsOff}));
    const unshareProject = pid => run(() => api.unpublish(pid), 'Project unshared.');
    const deleteProject = pid => run(() => api.deleteProject(pid), 'Project deleted.');

    return (
        <div>
            <h2>Users</h2>
            <div className={styles.addAdmin}>
                <input
                    className={styles.input}
                    placeholder="username"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onKeyDown={e => {
                        if (e.key === 'Enter') loadUser(query);
                    }}
                />
                <button
                    className={styles.secondary}
                    onClick={() => loadUser(query)}
                >Look up</button>
            </div>
            {error ? <p className={styles.error}>{error}</p> : null}
            {note ? <p className={styles.status}>{note}</p> : null}
            {data ? (
                <div className={styles.userCard}>
                    <div className={styles.userHead}>
                        <Avatar
                            username={data.username}
                            size={44}
                        />
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
                        <select
                            className={styles.select}
                            value={level}
                            onChange={e => setLevel(e.target.value)}
                        >
                            {STANDING_LEVELS.map(l => (
                                <option
                                    key={l}
                                    value={l}
                                >{l}</option>
                            ))}
                        </select>
                        <input
                            className={styles.input}
                            placeholder="Reason (shown to the user)"
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                        />
                        <button
                            className={styles.secondary}
                            onClick={applyStanding}
                        >Apply</button>
                    </div>

                    <label className={styles.fieldLabel}>Send a message to their notifications</label>
                    <div className={styles.field}>
                        <input
                            className={styles.input}
                            placeholder="Message"
                            value={message}
                            onChange={e => setMessage(e.target.value)}
                        />
                        <button
                            className={styles.secondary}
                            disabled={!message.trim()}
                            onClick={sendMessage}
                        >Send</button>
                    </div>

                    <button
                        className={styles.secondary}
                        onClick={toggleComments}
                    >{data.commentsOff ? 'Enable profile comments' : 'Disable profile comments'}</button>

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
                                <div
                                    key={project.id}
                                    className={styles.row}
                                >
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
                </div>
            ) : null}
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

const Admin = () => {
    const {user, loading} = useUser();
    const [reports, setReports] = useState(null);
    const [bans, setBans] = useState([]);
    const [admins, setAdmins] = useState([]);
    const [error, setError] = useState('');
    const [newAdmin, setNewAdmin] = useState('');
    const [active, setActive] = useState('overview');
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

    const act = async (id, action) => {
        try {
            setError('');
            await api.admin.reportAction(id, action);
            window.dispatchEvent(new Event('mw:reports-updated'));
            load();
        } catch (e) {
            setError(e.message || 'Action failed.');
        }
    };

    const banByName = async () => {
        const username = window.prompt('Ban which user?');
        if (!username) return;
        const reason = window.prompt('Reason for the ban?') || '';
        try {
            setError('');
            await api.admin.ban(username.trim(), reason.trim());
            load();
        } catch (e) {
            setError(e.message || 'Could not ban that user.');
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
                                                    {report.type === 'project' ? (
                                                        <Link
                                                            to={projectUrl(report.target)}
                                                        >{`Project ${report.target}`}</Link>
                                                    ) : report.type === 'user' ? (
                                                        <Link
                                                            to={`/users/${report.target}`}
                                                        >{`@${report.target}`}</Link>
                                                    ) : (
                                                        `Comment ${report.target}`
                                                    )}
                                                </span>
                                                <span className={styles.rowMeta}>
                                                    {`Reported by @${report.reporter} · ${timeAgo(report.created)} ago`}
                                                    {report.context ? ` · in ${report.context}` : ''}
                                                </span>
                                                <span className={styles.reason}>{report.reason}</span>
                                                {report.type === 'project' ? (
                                                    <EvidencePanel target={report.target} />
                                                ) : null}
                                            </div>
                                            <div className={styles.rowActions}>
                                                {report.type === 'project' ? (
                                                    <button
                                                        className={styles.secondary}
                                                        onClick={() => act(report.id, 'unshare_project')}
                                                    >Unshare</button>
                                                ) : null}
                                                <button
                                                    className={styles.secondary}
                                                    onClick={() => act(report.id, 'warn_user')}
                                                >{report.type === 'project' ? 'Warn owner' : 'Warn user'}</button>
                                                <button
                                                    className={styles.danger}
                                                    onClick={() => act(report.id, 'ban_user')}
                                                >{report.type === 'project' ? 'Ban owner' : 'Ban user'}</button>
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
