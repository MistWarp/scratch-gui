/* eslint-disable max-len */
import React, {useEffect, useRef, useState, useCallback} from 'react';
import {useParams, Link} from 'react-router-dom';
import {
    ArrowLeft, ExternalLink, Eye, Coins, Users, Heart, Check, BarChart3, SlidersHorizontal, Bookmark,
    Bug, Link2, UserCog, Plus, Trash2, MessageCircle
} from 'lucide-react';
import api, {projectUrl} from '../api';
import {useUser} from '../UserContext.jsx';
import Avatar from '../components/Avatar.jsx';
import VisibilityMenu from '../components/VisibilityMenu.jsx';
import ProjectInfoPanel from '../components/ProjectInfoPanel.jsx';
import ProjectThumbnail from '../components/ProjectThumbnail.jsx';
import StatChart, {historyRows} from '../components/StatChart.jsx';
import Sidebar from '../components/Sidebar.jsx';
import Button from '../components/ui/Button.jsx';
import IconButton from '../components/ui/IconButton.jsx';
import {SwitchRow} from '../components/ui/Switch.jsx';
import useLatest from '../use-latest.js';
import styles from './ManageProject.module.css';

const roundCredits = value => Math.round((Number(value) || 0) * 100) / 100;
const normalizeCollaborators = team => team
    .filter(member => member.username.trim())
    .map(member => ({...member, username: member.username.trim()}));
const ROLE_DESCRIPTIONS = {
    maintainer: 'Can edit, publish, and merge changes.',
    contributor: 'Can work through pull requests.',
    tester: 'Can open and test private drafts.'
};

const SECTIONS = [
    {key: 'overview', label: 'Overview', icon: BarChart3},
    {key: 'buyers', label: 'Buyers', icon: Users},
    {key: 'diagnostics', label: 'Diagnostics', icon: Bug},
    {key: 'feedback', label: 'Feedback', icon: MessageCircle},
    {key: 'preview', label: 'Preview links', icon: Link2},
    {key: 'team', label: 'Team', icon: UserCog},
    {key: 'settings', label: 'Settings', icon: SlidersHorizontal}
];

const ManageProject = () => {
    const {id} = useParams();
    const {user, loading, login} = useUser();
    const viewerName = (user && user.username) || '';
    const loadContext = `${id}\u0000${viewerName}`;
    const [project, setProject] = useState(null);
    const [projectLoadContext, setProjectLoadContext] = useState('');
    const [error, setError] = useState(null);
    const [errorLoadContext, setErrorLoadContext] = useState('');
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState(null);
    const [section, setSection] = useState('overview');
    const [form, setForm] = useState(null);
    const [diagnostics, setDiagnostics] = useState(null);
    const [diagnosticsError, setDiagnosticsError] = useState('');
    const [feedback, setFeedback] = useState(null);
    const [feedbackError, setFeedbackError] = useState('');
    const [feedbackBusy, setFeedbackBusy] = useState('');
    const [preview, setPreview] = useState(null);
    const [previewBusy, setPreviewBusy] = useState(false);
    const [team, setTeam] = useState([]);
    const [teamSaving, setTeamSaving] = useState(false);
    const [teamStatus, setTeamStatus] = useState('');
    const actionLocks = useRef(new Set());
    const currentLoadContext = useRef(loadContext);
    currentLoadContext.current = loadContext;
    const beginLoad = useLatest();
    const beginDiagnostics = useLatest();
    const beginFeedback = useLatest();
    const beginPreview = useLatest();

    const load = useCallback(() => {
        const fresh = beginLoad();
        return api.getProject(id)
            .then(fresh(data => {
                if (!data || !data.project) throw new Error('Project response was incomplete.');
                setProject(data.project);
                setProjectLoadContext(loadContext);
                setError(null);
                setErrorLoadContext('');
            }))
            .catch(fresh(e => {
                setErrorLoadContext(loadContext);
                setError(e && e.status === 404 ? 'Project not found.' : 'Could not load this project.');
            }));
    }, [beginLoad, id, loadContext]);

    useEffect(() => {
        beginDiagnostics();
        beginFeedback();
        beginPreview();
        setProject(null);
        setError(null);
        setSection('overview');
        setDiagnostics(null);
        setDiagnosticsError('');
        setFeedback(null);
        setFeedbackError('');
        setFeedbackBusy('');
        setPreview(null);
        setPreviewBusy(false);
        setSaving(false);
        setTeamSaving(false);
        setStatus(null);
        setTeamStatus('');
        if (loading || !viewerName) return;
        load();
    }, [beginDiagnostics, beginFeedback, beginPreview, id, load, loading, viewerName]);

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

    const loadDiagnostics = useCallback(() => {
        const fresh = beginDiagnostics();
        setDiagnostics(null);
        setDiagnosticsError('');
        api.diagnostics(id)
            .then(fresh(setDiagnostics))
            .catch(fresh(() => setDiagnosticsError('Could not load diagnostics.')));
    }, [beginDiagnostics, id]);

    const loadFeedback = useCallback(() => {
        const fresh = beginFeedback();
        setFeedback(null);
        setFeedbackError('');
        api.feedback(id)
            .then(fresh(data => setFeedback(data.feedback || [])))
            .catch(fresh(() => setFeedbackError('Could not load feedback.')));
    }, [beginFeedback, id]);

    useEffect(() => {
        if (section === 'diagnostics' && diagnostics === null && !diagnosticsError) loadDiagnostics();
        if (section === 'feedback' && feedback === null && !feedbackError) loadFeedback();
    }, [section, diagnostics, diagnosticsError, feedback, feedbackError, loadDiagnostics, loadFeedback]);

    const set = (key, value) => setForm(current => ({...current, [key]: value}));

    const beginAction = name => {
        const key = `${loadContext}\u0000${name}`;
        if (actionLocks.current.has(key)) return null;
        actionLocks.current.add(key);
        return key;
    };

    const releaseAction = key => actionLocks.current.delete(key);

    const save = async () => {
        const actionKey = beginAction('save');
        if (!actionKey) return;
        if (!form.title.trim()) {
            setStatus('Project titles cannot be empty.');
            releaseAction(actionKey);
            return;
        }
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
            if (currentLoadContext.current === loadContext) {
                setStatus('Saved.');
                load();
            }
        } catch (e) {
            if (currentLoadContext.current === loadContext) {
                setStatus(e.message || 'Could not save changes.');
            }
        } finally {
            releaseAction(actionKey);
            if (currentLoadContext.current === loadContext) setSaving(false);
        }
    };

    const saveTeam = async () => {
        const actionKey = beginAction('team');
        if (!actionKey) return;
        const collaborators = normalizeCollaborators(team);
        setTeamSaving(true);
        setTeamStatus('');
        try {
            await api.updateProject(id, {collaborators});
            if (currentLoadContext.current === loadContext) {
                setTeamStatus('Team saved.');
                load();
            }
        } catch (e) {
            if (currentLoadContext.current === loadContext) {
                setTeamStatus(e.message || 'Could not save the team.');
            }
        } finally {
            releaseAction(actionKey);
            if (currentLoadContext.current === loadContext) setTeamSaving(false);
        }
    };

    const createPreview = async () => {
        const actionKey = beginAction('preview');
        if (!actionKey) return;
        const fresh = beginPreview();
        setPreviewBusy(true);
        setStatus(null);
        try {
            const result = await api.createPreview(id, 24);
            fresh(setPreview)(`${location.origin}${projectUrl(id)}?k=${encodeURIComponent(result.key)}`);
        } catch (e) {
            fresh(setStatus)(e.message || 'Could not create a preview link.');
        } finally {
            releaseAction(actionKey);
            fresh(setPreviewBusy)(false);
        }
    };

    const updateFeedbackStatus = async (item, nextStatus) => {
        const actionKey = beginAction('feedback');
        if (!actionKey) return;
        setFeedbackBusy(item._id);
        setFeedbackError('');
        try {
            await api.updateFeedback(id, item._id, nextStatus);
            if (currentLoadContext.current === loadContext) {
                setFeedback(current => current.map(entry => (
                    entry._id === item._id ? {...entry, status: nextStatus} : entry
                )));
            }
        } catch (e) {
            if (currentLoadContext.current === loadContext) {
                setFeedbackError(e.message || 'Could not update this feedback.');
            }
        } finally {
            releaseAction(actionKey);
            if (currentLoadContext.current === loadContext) setFeedbackBusy('');
        }
    };

    if (loading) {
        return <main className={styles.page}><p className={styles.statusMsg}>Loading…</p></main>;
    }
    if (!user) {
        return (
            <main className={styles.page}>
                <p className={styles.statusMsg}>Sign in to manage your projects. <button type="button" onClick={login}>Sign in</button></p>
            </main>
        );
    }
    if (error && errorLoadContext === loadContext) {
        return (
            <main className={styles.page}>
                <p className={styles.statusMsg}>
                    {error}{' '}
                    <button
                        type="button"
                        onClick={() => {
                            setError(null);
                            load();
                        }}
                    >Try again</button>
                </p>
            </main>
        );
    }
    if (!project || !form || projectLoadContext !== loadContext) {
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
                    to="/mystuff?section=projects"
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
                    onChange={nextSection => {
                        setSection(nextSection);
                        setStatus(null);
                    }}
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
                                            disabled={saving}
                                            value={form.title}
                                            maxLength={100}
                                            onChange={e => set('title', e.target.value)}
                                        />
                                    </label>
                                    <div className={styles.fieldRow}>
                                        <div className={styles.field}>
                                            <span>Visibility</span>
                                            <VisibilityMenu
                                                disabled={saving}
                                                value={form.visibility}
                                                onChange={v => set('visibility', v)}
                                            />
                                        </div>
                                        <label className={`${styles.field} ${styles.priceField}`}>
                                            <span>Price in credits (0 is free)</span>
                                            <input
                                                disabled={saving}
                                                type="number"
                                                min="0"
                                                step="1"
                                                value={form.price}
                                                onChange={e => set('price', e.target.value)}
                                            />
                                        </label>
                                    </div>
                                    <div className={styles.switches}>
                                        <SwitchRow
                                            checked={form.remixable}
                                            disabled={saving}
                                            label="Allow others to remix this project"
                                            onChange={value => set('remixable', value)}
                                        />
                                        <SwitchRow
                                            checked={form.seeInside}
                                            disabled={saving}
                                            label="Allow others to see inside this project"
                                            onChange={value => set('seeInside', value)}
                                        />
                                        <SwitchRow
                                            checked={form.commentsOff}
                                            disabled={saving}
                                            label="Turn off comments"
                                            onChange={value => set('commentsOff', value)}
                                        />
                                    </div>
                                    <div className={styles.formActions}>
                                        {status ? <span className={styles.formStatus}>{status}</span> : null}
                                        <Button
                                            variant="primary"
                                            className={styles.save}
                                            busy={saving}
                                            busyLabel="Saving…"
                                            onClick={save}
                                        >
                                            <Check size={16} />
                                            Save changes
                                        </Button>
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
                                ) : diagnosticsError ? (
                                    <p className={styles.empty}>{diagnosticsError}{' '}<button type="button" onClick={loadDiagnostics}>Try again</button></p>
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
                            {!feedback && !feedbackError ? <p className={styles.empty}>Loading feedback…</p> : null}
                            {feedbackError ? <p className={styles.empty}>{feedbackError}{' '}<button type="button" onClick={loadFeedback}>Try again</button></p> : null}
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
                                                    value={item.status || 'open'}
                                                    disabled={Boolean(feedbackBusy)}
                                                    onChange={event => updateFeedbackStatus(item, event.target.value)}
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
                            <Button
                                variant="primary"
                                className={styles.save}
                                busy={previewBusy}
                                busyLabel="Creating…"
                                onClick={createPreview}
                            ><Link2 size={16} /> Create preview link</Button>
                            {preview ? <div className={styles.form}><input value={preview} readOnly onFocus={event => event.target.select()} /><span className={styles.formStatus}>Expires in 24 hours.</span></div> : null}
                            {status ? <p className={styles.empty}>{status}</p> : null}
                        </div>
                    ) : null}
                    {activeSection === 'team' ? (
                        <div className={`${styles.card} ${styles.teamCard}`}>
                            <div className={styles.teamHead}>
                                <div><h2 className={styles.cardTitle}>Project team</h2><p>Give other people access without sharing your account.</p></div>
                                <Button
                                    className={styles.addTeam}
                                    disabled={teamSaving}
                                    onClick={() => setTeam(current => [
                                        ...current,
                                        {username: '', role: 'contributor'}
                                    ])}
                                >
                                    <Plus size={15} /> Add teammate
                                </Button>
                            </div>
                            {team.length ? (
                                <div className={styles.teamList}>
                                    {team.map((member, index) => (
                                        <div key={index} className={styles.teamMember}>
                                            <label className={styles.teamUser}>
                                                <span>Username</span>
                                                <input
                                                    disabled={teamSaving}
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
                                                    disabled={teamSaving}
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
                                            <IconButton
                                                variant="danger"
                                                className={styles.removeTeam}
                                                label={`Remove ${member.username || 'teammate'}`}
                                                disabled={teamSaving}
                                                onClick={() => setTeam(current => current.filter(
                                                    (item, itemIndex) => itemIndex !== index
                                                ))}
                                            >
                                                <Trash2 size={15} />
                                            </IconButton>
                                        </div>
                                    ))}
                                </div>
                            ) : <div className={styles.teamEmpty}><Users size={22} /><strong>No teammates yet</strong><span>Add someone when you are ready to work together.</span></div>}
                            <div className={styles.teamFooter}>
                                <span>{teamStatus}</span>
                                <Button
                                    variant="primary"
                                    className={styles.save}
                                    busy={teamSaving}
                                    busyLabel="Saving…"
                                    onClick={saveTeam}
                                >
                                    <Check size={15} /> Save team
                                </Button>
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>
        </main>
    );
};

export {SECTIONS, normalizeCollaborators};
export default ManageProject;
