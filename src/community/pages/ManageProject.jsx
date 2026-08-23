/* eslint-disable max-len */
import React, {useEffect, useState, useCallback} from 'react';
import {useParams, Link} from 'react-router-dom';
import {
    ArrowLeft, ExternalLink, Eye, Coins, Users, Heart, Check, BarChart3, SlidersHorizontal, Bookmark,
    Bug, Link2, UserCog, Plus, Trash2
} from 'lucide-react';
import api, {projectUrl} from '../api';
import {useUser} from '../UserContext.jsx';
import Avatar from '../components/Avatar.jsx';
import VisibilityMenu from '../components/VisibilityMenu.jsx';
import ProjectInfoPanel from '../components/ProjectInfoPanel.jsx';
import ProjectThumbnail from '../components/ProjectThumbnail.jsx';
import StatChart, {historyRows} from '../components/StatChart.jsx';
import Sidebar from '../components/Sidebar.jsx';
import styles from './ManageProject.module.css';

const roundCredits = value => Math.round((Number(value) || 0) * 100) / 100;
const ROLE_DESCRIPTIONS = {
    maintainer: 'Can edit, publish, and merge changes.',
    contributor: 'Can work through pull requests.',
    tester: 'Can open and test private drafts.'
};

const SECTIONS = [
    {key: 'overview', label: 'Overview', icon: BarChart3},
    {key: 'buyers', label: 'Buyers', icon: Users},
    {key: 'diagnostics', label: 'Diagnostics', icon: Bug},
    {key: 'preview', label: 'Preview links', icon: Link2},
    {key: 'team', label: 'Team', icon: UserCog},
    {key: 'settings', label: 'Settings', icon: SlidersHorizontal}
];

const ManageProject = () => {
    const {id} = useParams();
    const {user, loading} = useUser();
    const [project, setProject] = useState(null);
    const [error, setError] = useState(null);
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState(null);
    const [section, setSection] = useState('overview');
    const [form, setForm] = useState(null);
    const [diagnostics, setDiagnostics] = useState(null);
    const [feedback, setFeedback] = useState(null);
    const [preview, setPreview] = useState(null);
    const [team, setTeam] = useState([]);
    const [teamSaving, setTeamSaving] = useState(false);
    const [teamStatus, setTeamStatus] = useState('');

    const load = useCallback(() => {
        api.getProject(id)
            .then(data => {
                setProject(data.project);
                setError(null);
            })
            .catch(e => setError(e && e.status === 404 ? 'Project not found.' : 'Could not load this project.'));
    }, [id]);

    useEffect(() => {
        setProject(null);
        setError(null);
        load();
    }, [id, load]);

    useEffect(() => {
        if (!project) return;
        setForm({
            title: project.title || '',
            price: project.price || 0,
            commentsOff: Boolean(project.commentsOff),
            remixable: project.remixable !== false,
            seeInside: project.seeInside !== false,
            visibility: project.visibility || (project.shared ? 'public' : 'private')
        });
        setTeam(project.collaborators || []);
    }, [project]);

    useEffect(() => {
        if (section === 'diagnostics' && diagnostics === null) {
            api.diagnostics(id).then(setDiagnostics).catch(() => setDiagnostics({counts: {}, recent: []}));
        }
        if (section === 'feedback' && feedback === null) {
            api.feedback(id).then(data => setFeedback(data.feedback || [])).catch(() => setFeedback([]));
        }
    }, [section, id, diagnostics, feedback]);

    const set = (key, value) => setForm(current => ({...current, [key]: value}));

    const save = async () => {
        if (saving) return;
        setSaving(true);
        setStatus(null);
        try {
            await api.updateProject(id, {
                title: form.title.trim(),
                commentsOff: form.commentsOff,
                remixable: form.remixable,
                seeInside: form.seeInside,
                price: Math.max(0, Math.floor(Number(form.price) || 0))
            });
            if (form.visibility !== (project.visibility || (project.shared ? 'public' : 'private'))) {
                await api.setVisibility(id, form.visibility);
            }
            setStatus('Saved.');
            load();
        } catch (e) {
            setStatus(e.message || 'Could not save changes.');
        } finally {
            setSaving(false);
        }
    };

    const saveTeam = async () => {
        if (teamSaving) return;
        setTeamSaving(true);
        setTeamStatus('');
        try {
            await api.updateProject(id, {collaborators: team.filter(member => member.username.trim())});
            setTeamStatus('Team saved.');
            load();
        } catch (e) {
            setTeamStatus(e.message || 'Could not save the team.');
        } finally {
            setTeamSaving(false);
        }
    };

    if (loading) {
        return <main className={styles.page}><p className={styles.statusMsg}>Loading…</p></main>;
    }
    if (!user) {
        return <main className={styles.page}><p className={styles.statusMsg}>Log in to manage your projects.</p></main>;
    }
    if (error) {
        return <main className={styles.page}><p className={styles.statusMsg}>{error}</p></main>;
    }
    if (!project || !form) {
        return <main className={styles.page}><p className={styles.statusMsg}>Loading…</p></main>;
    }
    if (!project.isOwner) {
        return <main className={styles.page}><p className={styles.statusMsg}>This is not your project.</p></main>;
    }

    const analytics = project.analytics || {};
    const buyers = analytics.buyers || [];
    const revenue = roundCredits(analytics.revenue || 0);
    const paywalled = project.price > 0 || revenue > 0;
    const views = (project.views || 0).toLocaleString();
    const hearts = (project.loveCount || 0).toLocaleString();
    const sections = SECTIONS.filter(item => {
        if (item.key === 'buyers') return paywalled;
        if (item.key === 'team') return project.myRole === 'owner';
        return true;
    });
    const activeSection = section === 'buyers' && !paywalled ? 'overview' : section;

    return (
        <main className={styles.page}>
            <div className={styles.head}>
                <Link
                    to="/mystuff"
                    className={styles.back}
                >
                    <ArrowLeft size={15} />
                    My Stuff
                </Link>
                <Link
                    to={projectUrl(id)}
                    className={styles.viewLink}
                >
                    <ExternalLink size={15} />
                    Project page
                </Link>
            </div>

            <div className={styles.layout}>
                <Sidebar
                    sections={sections.map(item => ({
                        ...item,
                        badge: item.key === 'buyers' && buyers.length ? buyers.length : null
                    }))}
                    active={activeSection}
                    onChange={setSection}
                    ariaLabel="Project sections"
                />

                <div className={styles.content}>
                    {activeSection === 'overview' ? (
                        <div className={styles.stack}>
                            <div className={styles.hero}>
                                <ProjectThumbnail
                                    project={project}
                                    className={styles.heroThumb}
                                    fallbackClassName={styles.heroThumbFallback}
                                />
                                <div className={styles.heroText}>
                                    <h1 className={styles.title}>{project.title}</h1>
                                    <p className={styles.heroSub}>See how your project is doing.</p>
                                </div>
                            </div>
                            <div className={styles.statGrid}>
                                <div className={`${styles.stat} ${styles.statViews}`}>
                                    <span className={styles.statIcon}><Eye size={20} /></span>
                                    <span className={styles.statNumber}>{views}</span>
                                    <span className={styles.statLabel}>Views</span>
                                </div>
                                <div className={`${styles.stat} ${styles.statHearts}`}>
                                    <span className={styles.statIcon}><Heart size={20} /></span>
                                    <span className={styles.statNumber}>{hearts}</span>
                                    <span className={styles.statLabel}>Hearts</span>
                                </div>
                                <div className={`${styles.stat} ${styles.statSaves}`}>
                                    <span className={styles.statIcon}><Bookmark size={20} /></span>
                                    <span className={styles.statNumber}>{(analytics.saves || 0).toLocaleString()}</span>
                                    <span className={styles.statLabel}>Library saves</span>
                                </div>
                                {paywalled ? (
                                    <div className={`${styles.stat} ${styles.statRevenue}`}>
                                        <span className={styles.statIcon}><Coins size={20} /></span>
                                        <span className={styles.statNumber}>{revenue.toLocaleString()}</span>
                                        <span className={styles.statLabel}>Credits earned</span>
                                    </div>
                                ) : null}
                                {paywalled ? (
                                    <div className={`${styles.stat} ${styles.statBuyers}`}>
                                        <span className={styles.statIcon}><Users size={20} /></span>
                                        <span className={styles.statNumber}>{buyers.length.toLocaleString()}</span>
                                        <span className={styles.statLabel}>Buyers</span>
                                    </div>
                                ) : null}
                            </div>
                            <StatChart
                                title="Views over the last 2 weeks"
                                rows={historyRows(analytics.viewHistory)}
                                accent="#4C97FF"
                                emptyText="No views in the last two weeks."
                            />
                            <div className={styles.card}>
                                <h2 className={styles.cardTitle}>Publish checklist</h2>
                                <ul className={styles.checklist}>
                                    {[
                                        ['Project uploaded', project.hasContent],
                                        ['Clear title', project.title && !/^untitled$/i.test(project.title)],
                                        ['Instructions added', Boolean(project.instructions)],
                                        ['Description or notes added', Boolean(project.description || project.notes)],
                                        ['Tags added', Boolean(project.tags && project.tags.length)],
                                        ['Thumbnail ready', Boolean(project.thumbUrl)]
                                    ].map(([label, done]) => (
                                        <li key={label} className={done ? styles.checkDone : styles.checkTodo}>
                                            <Check size={15} /> {label}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            {paywalled ? (
                                <StatChart
                                    title="Revenue over the last 2 weeks"
                                    rows={historyRows(analytics.saleHistory)}
                                    accent="#FF8C1A"
                                    format={value => `${roundCredits(value)} credits`}
                                    emptyText="No sales in the last two weeks."
                                />
                            ) : null}
                        </div>
                    ) : null}

                    {activeSection === 'buyers' ? (
                        <div className={styles.card}>
                            <h2 className={styles.cardTitle}>Buyers</h2>
                            {buyers.length ? (
                                <ul className={styles.buyers}>
                                    {buyers.slice().reverse().map((buyer, index) => (
                                        <li
                                            key={`${buyer.user}-${index}`}
                                            className={styles.buyerRow}
                                        >
                                            <Link
                                                to={`/users/${buyer.user}`}
                                                className={styles.buyer}
                                            >
                                                <Avatar
                                                    username={buyer.user}
                                                    size={30}
                                                />
                                                <span>{buyer.user}</span>
                                            </Link>
                                            <span className={styles.buyerMeta}>
                                                <span className={styles.buyerAmount}>
                                                    <Coins size={13} />
                                                    {roundCredits(buyer.amount)}
                                                </span>
                                                {buyer.at ? (
                                                    <span className={styles.buyerDate}>
                                                        {new Date(buyer.at).toLocaleDateString()}
                                                    </span>
                                                ) : null}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className={styles.empty}>
                                    {paywalled ?
                                        'No one has bought this project yet.' :
                                        'This project is free. Set a price in Settings to start selling it.'}
                                </p>
                            )}
                        </div>
                    ) : null}

                    {activeSection === 'settings' ? (
                        <div className={styles.stack}>
                            <div className={styles.card}>
                                <h2 className={styles.cardTitle}>Project</h2>
                                <div className={styles.form}>
                                    <label className={styles.field}>
                                        <span>Title</span>
                                        <input
                                            value={form.title}
                                            maxLength={100}
                                            onChange={e => set('title', e.target.value)}
                                        />
                                    </label>
                                    <div className={styles.fieldRow}>
                                        <div className={styles.field}>
                                            <span>Visibility</span>
                                            <VisibilityMenu
                                                value={form.visibility}
                                                onChange={v => set('visibility', v)}
                                            />
                                        </div>
                                        <label className={`${styles.field} ${styles.priceField}`}>
                                            <span>Price in credits (0 is free)</span>
                                            <input
                                                type="number"
                                                min="0"
                                                step="1"
                                                value={form.price}
                                                onChange={e => set('price', e.target.value)}
                                            />
                                        </label>
                                    </div>
                                    <label className={styles.checkboxField}>
                                        <input
                                            type="checkbox"
                                            checked={form.remixable}
                                            onChange={e => set('remixable', e.target.checked)}
                                        />
                                        <span>Allow others to remix this project</span>
                                    </label>
                                    <label className={styles.checkboxField}>
                                        <input
                                            type="checkbox"
                                            checked={form.seeInside}
                                            onChange={e => set('seeInside', e.target.checked)}
                                        />
                                        <span>Allow others to see inside this project</span>
                                    </label>
                                    <label className={styles.checkboxField}>
                                        <input
                                            type="checkbox"
                                            checked={form.commentsOff}
                                            onChange={e => set('commentsOff', e.target.checked)}
                                        />
                                        <span>Turn off comments</span>
                                    </label>
                                    <div className={styles.formActions}>
                                        {status ? <span className={styles.formStatus}>{status}</span> : null}
                                        <button
                                            className={styles.save}
                                            onClick={save}
                                            disabled={saving}
                                        >
                                            <Check size={16} />
                                            {saving ? 'Saving…' : 'Save changes'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <ProjectInfoPanel
                                project={project}
                                onSaved={load}
                                embedded
                            />
                        </div>
                    ) : null}
                    {activeSection === 'diagnostics' ? (
                        <div className={styles.stack}>
                            <div className={styles.card}>
                                <h2 className={styles.cardTitle}>Player diagnostics</h2>
                                <p className={styles.empty}>Anonymous runtime events from the most recent 500 sessions.</p>
                                {diagnostics ? (
                                    <div className={styles.statGrid}>
                                        <div className={styles.stat}><span className={styles.statNumber}>{diagnostics.counts.load || 0}</span><span className={styles.statLabel}>Loads</span></div>
                                        <div className={styles.stat}><span className={styles.statNumber}>{diagnostics.counts.start || 0}</span><span className={styles.statLabel}>Green flags</span></div>
                                        <div className={styles.stat}><span className={styles.statNumber}>{diagnostics.counts.crash || 0}</span><span className={styles.statLabel}>Errors</span></div>
                                        <div className={styles.stat}><span className={styles.statNumber}>{Math.round(diagnostics.averageLoadMs || 0)} ms</span><span className={styles.statLabel}>Average load</span></div>
                                    </div>
                                ) : <p className={styles.empty}>Loading diagnostics…</p>}
                            </div>
                            {diagnostics && diagnostics.recent.some(item => item.error) ? (
                                <div className={styles.card}>
                                    <h2 className={styles.cardTitle}>Recent errors</h2>
                                    <ul className={styles.buyers}>
                                        {diagnostics.recent.filter(item => item.error).slice(0, 20).map(item => <li key={item._id} className={styles.buyerRow}><span>{item.error}</span><span className={styles.buyerDate}>{new Date(item.created).toLocaleString()}</span></li>)}
                                    </ul>
                                </div>
                            ) : null}
                        </div>
                    ) : null}
                    {activeSection === 'feedback' ? (
                        <div className={styles.card}>
                            <h2 className={styles.cardTitle}>Tracked feedback</h2>
                            {!feedback ? <p className={styles.empty}>Loading feedback…</p> : null}
                            {feedback && !feedback.length ? <p className={styles.empty}>No feedback yet.</p> : null}
                            {feedback && feedback.length ? (
                                <ul className={styles.buyers}>
                                    {feedback.map(item => (
                                        <li key={item._id} className={styles.buyerRow}>
                                            <div><strong>{item.type}</strong><p>{item.message}</p></div>
                                            <span className={styles.buyerMeta}>
                                                {item.author}
                                                <span className={styles.buyerDate}>{new Date(item.created).toLocaleDateString()}</span>
                                                <select
                                                    value={item.status || 'open'} onChange={async event => {
                                                        const nextStatus = event.target.value;
                                                        await api.updateFeedback(id, item._id, nextStatus);
                                                        setFeedback(current => current.map(entry => (entry._id === item._id ? {...entry, status: nextStatus} : entry)));
                                                    }}
                                                >
                                                    <option value="open">Open</option>
                                                    <option value="working">Working</option>
                                                    <option value="done">Done</option>
                                                    <option value="dismissed">Dismissed</option>
                                                </select>
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            ) : null}
                        </div>
                    ) : null}
                    {activeSection === 'preview' ? (
                        <div className={styles.card}>
                            <h2 className={styles.cardTitle}>Draft preview</h2>
                            <p className={styles.empty}>Create a private link that expires after 24 hours. Anyone with the link can play the current draft.</p>
                            <button
                                className={styles.save} onClick={async () => {
                                    const result = await api.createPreview(id, 24);
                                    setPreview(`${location.origin}${projectUrl(id)}?k=${encodeURIComponent(result.key)}`);
                                }}
                            ><Link2 size={16} /> Create preview link</button>
                            {preview ? <div className={styles.form}><input value={preview} readOnly onFocus={event => event.target.select()} /><span className={styles.formStatus}>Expires in 24 hours.</span></div> : null}
                        </div>
                    ) : null}
                    {activeSection === 'team' ? (
                        <div className={`${styles.card} ${styles.teamCard}`}>
                            <div className={styles.teamHead}>
                                <div><h2 className={styles.cardTitle}>Project team</h2><p>Give other people access without sharing your account.</p></div>
                                <button className={styles.addTeam} onClick={() => setTeam(current => [...current, {username: '', role: 'contributor'}])}><Plus size={15} /> Add teammate</button>
                            </div>
                            {team.length ? (
                                <div className={styles.teamList}>
                                    {team.map((member, index) => (
                                        <div key={index} className={styles.teamMember}>
                                            <label className={styles.teamUser}>
                                                <span>Username</span>
                                                <input
                                                    value={member.username}
                                                    placeholder="Rotur username"
                                                    onChange={event => {
                                                        const {value} = event.target;
                                                        setTeam(current => current.map((item, itemIndex) => (itemIndex === index ? {...item, username: value} : item)));
                                                    }}
                                                />
                                            </label>
                                            <label className={styles.teamRole}>
                                                <span>Role</span>
                                                <select
                                                    value={member.role}
                                                    onChange={event => {
                                                        const {value} = event.target;
                                                        setTeam(current => current.map((item, itemIndex) => (itemIndex === index ? {...item, role: value} : item)));
                                                    }}
                                                >
                                                    <option value="maintainer">Maintainer</option>
                                                    <option value="contributor">Contributor</option>
                                                    <option value="tester">Tester</option>
                                                </select>
                                                <small>{ROLE_DESCRIPTIONS[member.role]}</small>
                                            </label>
                                            <button className={styles.removeTeam} title="Remove teammate" aria-label="Remove teammate" onClick={() => setTeam(current => current.filter((item, itemIndex) => itemIndex !== index))}><Trash2 size={15} /></button>
                                        </div>
                                    ))}
                                </div>
                            ) : <div className={styles.teamEmpty}><Users size={22} /><strong>No teammates yet</strong><span>Add someone when you are ready to work together.</span></div>}
                            <div className={styles.teamFooter}>
                                <span>{teamStatus}</span>
                                <button className={styles.save} disabled={teamSaving} onClick={saveTeam}><Check size={15} /> {teamSaving ? 'Saving…' : 'Save team'}</button>
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>
        </main>
    );
};

export default ManageProject;
