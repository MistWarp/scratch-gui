import React, {useEffect, useState, useCallback} from 'react';
import {Link} from 'react-router-dom';
import api, {projectUrl} from '../api';
import {useUser} from '../UserContext.jsx';
import Avatar from '../components/Avatar.jsx';
import {timeAgo} from '../format';
import useLatest from '../use-latest.js';
import styles from './Admin.module.css';

const STANDING_LEVELS = ['good', 'warning', 'suspended', 'banned'];

const UserManager = () => {
    const [query, setQuery] = useState('');
    const [data, setData] = useState(null);
    const [error, setError] = useState('');
    const [note, setNote] = useState('');
    const [level, setLevel] = useState('good');
    const [reason, setReason] = useState('');
    const [message, setMessage] = useState('');
    const [bio, setBio] = useState('');

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
            setBio(result.bio || '');
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
    const saveBio = () =>
        run(() => api.admin.updateUserProfile(data.username, {bio}), 'Bio saved.');
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

                    <label className={styles.fieldLabel}>Profile bio</label>
                    <div className={styles.field}>
                        <textarea
                            className={styles.textarea}
                            value={bio}
                            maxLength={300}
                            onChange={e => setBio(e.target.value)}
                        />
                        <button
                            className={styles.secondary}
                            onClick={saveBio}
                        >Save bio</button>
                    </div>
                    <button
                        className={styles.secondary}
                        onClick={toggleComments}
                    >{data.commentsOff ? 'Enable profile comments' : 'Disable profile comments'}</button>

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

const Admin = () => {
    const {user, loading} = useUser();
    const [reports, setReports] = useState(null);
    const [bans, setBans] = useState([]);
    const [admins, setAdmins] = useState([]);
    const [error, setError] = useState('');
    const [newAdmin, setNewAdmin] = useState('');
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

    return (
        <main className={styles.page}>
            <h1>Admin</h1>
            {error ? <p className={styles.error}>{error}</p> : null}

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
                                        <Link to={projectUrl(report.target)}>{`Project ${report.target}`}</Link>
                                    ) : report.type === 'user' ? (
                                        <Link to={`/users/${report.target}`}>{`@${report.target}`}</Link>
                                    ) : (
                                        `Comment ${report.target}`
                                    )}
                                </span>
                                <span className={styles.rowMeta}>
                                    {`Reported by @${report.reporter} · ${timeAgo(report.created)} ago`}
                                    {report.context ? ` · in ${report.context}` : ''}
                                </span>
                                <span className={styles.reason}>{report.reason}</span>
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

            <UserManager />

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
                            <span className={styles.rowMeta}>{admin.super ? 'Super admin' : 'Admin'}</span>
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
        </main>
    );
};

export default Admin;
