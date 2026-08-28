/* eslint-disable max-len */
import React, {useEffect, useRef, useState, useCallback} from 'react';
import {useParams, Link, useNavigate, useSearchParams} from 'react-router-dom';
import {
    ArrowLeft, ExternalLink, Eye, Coins, Users, Heart, Check, BarChart3, SlidersHorizontal, Bookmark,
    Link2, UserCog, Plus, Trash2, MessageCircle
} from 'lucide-react';
import api, {projectUrl} from '../api';
import {useUser} from '../UserContext.jsx';
import Avatar from '../components/Avatar.jsx';
import VisibilityMenu from '../components/VisibilityMenu.jsx';
import ProjectInfoPanel from '../components/ProjectInfoPanel.jsx';
import ProjectThumbnail from '../components/ProjectThumbnail.jsx';
import StatChart, {historyRows} from '../components/StatChart.jsx';
import Sidebar from '../components/Sidebar.jsx';
import SectionTabs from '../components/SectionTabs.jsx';
import Button from '../components/ui/Button.jsx';
import IconButton from '../components/ui/IconButton.jsx';
import Modal from '../components/ui/Modal.jsx';
import {SwitchRow} from '../components/ui/Switch.jsx';
import useLatest from '../use-latest.js';
import {formatDate, formatDateTime} from '../format.js';
import {createCommerceBounty, listCommerceBounties, cancelCommerceBounty} from '../credits';
import styles from './ManageProject.module.css';

const roundCredits = value => Math.round((Number(value) || 0) * 100) / 100;
const exportAnalyticsCsv = (project, analytics) => {
    const days = [...new Set([
        ...Object.keys(analytics.viewHistory || {}),
        ...Object.keys(analytics.saleHistory || {})
    ])].sort();
    const rows = ['date,views,revenue', ...days.map(day => {
        const date = new Date(Number(day) * 86400000).toISOString().slice(0, 10);
        return `${date},${analytics.viewHistory?.[day] || 0},${analytics.saleHistory?.[day] || 0}`;
    })];
    const url = URL.createObjectURL(new Blob([rows.join('\n')], {type: 'text/csv'}));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${project.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-analytics.csv`;
    link.click();
    URL.revokeObjectURL(url);
};
const normalizeCollaborators = team => team
    .filter(member => member.username.trim())
    .map(member => ({
        ...member,
        username: member.username.trim(),
        share: Math.max(0, Math.min(50, Number(member.share) || 0))
    }));
const ROLE_DESCRIPTIONS = {
    maintainer: 'Can edit, publish, and merge changes.',
    contributor: 'Can work through pull requests.',
    tester: 'Can open and test private drafts.'
};
const projectTransferConfirmation = (project, nextOwner) => ({
    title: 'Transfer project?',
    body: `Transfer "${project.title}" to @${nextOwner}? You will lose owner access.`,
    action: `Transfer to @${nextOwner}`
});

const SECTIONS = [
    {key: 'overview', label: 'Overview', icon: BarChart3},
    {key: 'page', label: 'Project page', icon: SlidersHorizontal},
    {key: 'publishing', label: 'Publishing', icon: Eye},
    {key: 'sales', label: 'Sales', icon: Coins},
    {key: 'collaboration', label: 'Collaboration', icon: Users},
    {key: 'activity', label: 'Activity', icon: MessageCircle},
    {key: 'ownership', label: 'Ownership', icon: UserCog}
];

const SECTION_ALIASES = {
    settings: 'page',
    preview: 'publishing',
    buyers: 'sales',
    team: 'collaboration',
    bounties: 'collaboration',
    feedback: 'activity',
    diagnostics: 'activity'
};
const SUBTAB_ROUTES = new Set(['buyers', 'bounties', 'diagnostics']);
const resolveSection = value => {
    const resolved = SECTION_ALIASES[value] || value;
    return SECTIONS.some(item => item.key === resolved) ? resolved : 'overview';
};
const normalizeProjectSectionParam = value => {
    if (!value) return '';
    if (SUBTAB_ROUTES.has(value)) return value;
    const resolved = SECTION_ALIASES[value] || value;
    return SECTIONS.some(item => item.key === resolved) ? resolved : '';
};
const projectNavigationState = value => ({
    section: resolveSection(value),
    salesTab: value === 'buyers' ? 'buyers' : 'pricing',
    collaborationTab: value === 'bounties' ? 'bounties' : 'team',
    activityTab: value === 'diagnostics' ? 'diagnostics' : 'feedback'
});

const PageHeading = ({title, description}) => (
    <header className={styles.pageHeading}>
        <h1>{title}</h1>
        <p>{description}</p>
    </header>
);

const PageTabs = ({items, value, onChange, label}) => (
    <SectionTabs
        items={items}
        value={value}
        onChange={onChange}
        className={styles.pageTabs}
        itemClassName={styles.pageTab}
        activeClassName={styles.pageTabActive}
        ariaLabel={label}
    />
);

const ManageProject = () => {
    const {id} = useParams();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const requestedSection = searchParams.get('section');
    const {user, loading, login} = useUser();
    const viewerName = (user && user.username) || '';
    const loadContext = `${id}\u0000${viewerName}`;
    const [project, setProject] = useState(null);
    const [projectLoadContext, setProjectLoadContext] = useState('');
    const [error, setError] = useState(null);
    const [errorLoadContext, setErrorLoadContext] = useState('');
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState(null);
    const initialNavigation = projectNavigationState(requestedSection);
    const [section, setSection] = useState(initialNavigation.section);
    const [salesTab, setSalesTab] = useState(initialNavigation.salesTab);
    const [collaborationTab, setCollaborationTab] = useState(initialNavigation.collaborationTab);
    const [activityTab, setActivityTab] = useState(initialNavigation.activityTab);
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
    const [transferOwner, setTransferOwner] = useState('');
    const [transferBusy, setTransferBusy] = useState(false);
    const [transferConfirm, setTransferConfirm] = useState('');
    const [transferError, setTransferError] = useState('');
    const [perks, setPerks] = useState(null);
    const actionLocks = useRef(new Set());
    const currentLoadContext = useRef(loadContext);
    currentLoadContext.current = loadContext;
    const beginLoad = useLatest();
    const beginDiagnostics = useLatest();
    const beginFeedback = useLatest();
    const beginPreview = useLatest();

    const setRouteSection = useCallback((value, {replace = false} = {}) => {
        const next = new URLSearchParams(searchParams);
        if (value) next.set('section', value);
        else next.delete('section');
        setSearchParams(next, {replace});
    }, [searchParams, setSearchParams]);

    useEffect(() => {
        const normalized = normalizeProjectSectionParam(requestedSection);
        if ((requestedSection || '') !== normalized) setRouteSection(normalized, {replace: true});
    }, [requestedSection, setRouteSection]);

    useEffect(() => {
        const navigation = projectNavigationState(requestedSection);
        setSection(navigation.section);
        setSalesTab(navigation.salesTab);
        setCollaborationTab(navigation.collaborationTab);
        setActivityTab(navigation.activityTab);
        setStatus(null);
    }, [requestedSection]);

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
        setDiagnostics(null);
        setDiagnosticsError('');
        setFeedback(null);
        setFeedbackError('');
        setFeedbackBusy('');
        setPreview(null);
        setPreviewBusy(false);
        setSaving(false);
        setTeamSaving(false);
        setTransferBusy(false);
        setTransferConfirm('');
        setTransferError('');
        setStatus(null);
        setTeamStatus('');
        if (loading || !viewerName) return;
        load();
    }, [beginDiagnostics, beginFeedback, beginPreview, id, load, loading, viewerName]);

    useEffect(() => {
        let active = true;
        if (!user) {
            setPerks(null);
            return () => {};
        }
        api.perks()
            .then(data => active && setPerks(data.current || null))
            .catch(() => active && setPerks(null));
        return () => {
            active = false;
        };
    }, [user]);

    useEffect(() => {
        if (!project) return;
        setForm({
            title: project.title || '',
            groupTag: project.groupTag || '',
            vanitySlug: project.vanitySlug || '',
            brandingAccent: project.branding?.accentColor || '#855cd6',
            brandingTagline: project.branding?.tagline || '',
            price: project.price || 0,
            remixShare: project.remixShare || 0,
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
        if (section === 'activity' && activityTab === 'diagnostics' && diagnostics === null && !diagnosticsError) loadDiagnostics();
        if (section === 'activity' && activityTab === 'feedback' && feedback === null && !feedbackError) loadFeedback();
    }, [section, activityTab, diagnostics, diagnosticsError, feedback, feedbackError, loadDiagnostics, loadFeedback]);

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
            let data = await api.updateProject(id, {
                title: form.title.trim(),
                groupTag: form.groupTag.trim(),
                vanitySlug: form.vanitySlug.trim(),
                branding: form.brandingTagline.trim() || form.brandingAccent !== '#855cd6' ? {
                    accentColor: form.brandingAccent,
                    tagline: form.brandingTagline.trim()
                } : {},
                commentsOff: form.commentsOff,
                remixable: form.remixable,
                seeInside: form.seeInside,
                price: Math.max(0, Math.floor(Number(form.price) || 0)),
                remixShare: Math.max(0, Math.min(50, Number(form.remixShare) || 0))
            });
            if (form.visibility !== (project.visibility || (project.shared ? 'public' : 'private'))) {
                data = await api.setVisibility(id, form.visibility);
            }
            if (currentLoadContext.current === loadContext) {
                setStatus('Saved.');
                setProject(data.project);
                setProjectLoadContext(loadContext);
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

    const requestProjectTransfer = () => {
        const nextOwner = transferOwner.trim();
        if (!nextOwner || transferBusy) return;
        setTransferError('');
        setTransferConfirm(nextOwner);
    };

    const transferProject = async () => {
        const nextOwner = transferConfirm;
        if (!nextOwner || transferBusy) return;
        const actionKey = beginAction('transfer');
        if (!actionKey) return;
        const context = loadContext;
        setTransferBusy(true);
        setTransferError('');
        try {
            await api.updateProject(id, {owner: nextOwner});
            if (currentLoadContext.current === context) navigate(`/project/${id}`);
        } catch (e) {
            if (currentLoadContext.current === context) {
                setTransferError(e.message || 'Could not transfer this project.');
            }
        } finally {
            releaseAction(actionKey);
            if (currentLoadContext.current === context) setTransferBusy(false);
        }
    };

    const saveTeam = async () => {
        const actionKey = beginAction('team');
        if (!actionKey) return;
        const collaborators = normalizeCollaborators(team);
        setTeamSaving(true);
        setTeamStatus('');
        try {
            const data = await api.updateProject(id, {collaborators});
            if (currentLoadContext.current === loadContext) {
                setTeamStatus('Team saved.');
                setProject(data.project);
                setProjectLoadContext(loadContext);
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
        if (item.key === 'collaboration' || item.key === 'ownership') return project.myRole === 'owner';
        return true;
    });
    const activeSection = section;
    const transferDetails = transferConfirm ? projectTransferConfirmation(project, transferConfirm) : null;

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

            {transferDetails ? (
                <Modal
                    icon={UserCog}
                    title={transferDetails.title}
                    dismissDisabled={transferBusy}
                    onClose={() => setTransferConfirm('')}
                    onDismiss={() => setTransferConfirm('')}
                    actions={(
                        <React.Fragment>
                            <Button disabled={transferBusy} variant="secondary" onClick={() => setTransferConfirm('')}>Cancel</Button>
                            <Button busy={transferBusy} busyLabel="Transferring…" variant="danger" onClick={transferProject}>{transferDetails.action}</Button>
                        </React.Fragment>
                    )}
                >
                    <p>{transferDetails.body}</p>
                    {transferError ? <p className={styles.formStatus} role="alert">{transferError}</p> : null}
                </Modal>
            ) : null}

            <div className={styles.layout}>
                <Sidebar
                    sections={sections.map(item => ({
                        ...item,
                        badge: item.key === 'sales' && buyers.length ? buyers.length : null
                    }))}
                    active={activeSection}
                    onChange={nextSection => {
                        setSection(nextSection);
                        setStatus(null);
                        setRouteSection(nextSection === 'overview' ? '' : nextSection);
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
                                {perks?.mistwarp?.advancedAnalytics ? <div className={styles.stat}><span className={styles.statIcon}><BarChart3 size={20} /></span><span className={styles.statNumber}>{views > 0 ? `${((buyers.length / views) * 100).toFixed(1)}%` : '0%'}</span><span className={styles.statLabel}>View-to-buyer conversion</span></div> : null}
                                {perks?.mistwarp?.advancedAnalytics && buyers.length ? <div className={styles.stat}><span className={styles.statIcon}><Coins size={20} /></span><span className={styles.statNumber}>{roundCredits(revenue / buyers.length)}</span><span className={styles.statLabel}>Credits per buyer</span></div> : null}
                            </div>
                            {perks?.mistwarp?.analyticsExport ? <div className={styles.analyticsTools}><span>Advanced analytics are included with your {perks.tier} Rotur plan.</span><Button variant="secondary" onClick={() => exportAnalyticsCsv(project, analytics)}>Export CSV</Button></div> : <p className={styles.empty}>Rotur Plus adds conversion insights and downloadable analytics. Your current plan keeps {analytics.historyDays === 0 ? 'all-time' : `${analytics.historyDays}-day`} history.</p>}
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

                    {activeSection === 'page' ? (
                        <div className={styles.stack}>
                            <PageHeading title="Project page" description="Edit the name, branding, instructions, and public details people see." />
                            <div className={styles.card}>
                                <h2 className={styles.cardTitle}>Name and address</h2>
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
                                    <label className={styles.field}>
                                        <span>Vanity URL</span>
                                        <div className={styles.vanityField}><span>/p/</span><input disabled={saving || !perks?.mistwarp?.vanityProjectUrls} maxLength={40} value={form.vanitySlug} placeholder="my-project" onChange={e => set('vanitySlug', e.target.value)} /></div>
                                        <small>{perks?.mistwarp?.vanityProjectUrls ? `Your ${perks.tier} plan includes a vanity URL.` : 'Vanity project URLs are included with Rotur Pro.'}</small>
                                    </label>
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
                            <div className={styles.card}>
                                <h2 className={styles.cardTitle}>Branding</h2>
                                <div className={styles.brandingGrid}>
                                    <label className={styles.field}>
                                        <span>Brand colour</span>
                                        <input type="color" disabled={saving || !perks?.mistwarp?.customProjectBranding} value={form.brandingAccent} onChange={e => set('brandingAccent', e.target.value)} />
                                    </label>
                                    <label className={styles.field}>
                                        <span>Tagline</span>
                                        <input disabled={saving || !perks?.mistwarp?.customProjectBranding} maxLength={120} value={form.brandingTagline} placeholder="A short line above your project" onChange={e => set('brandingTagline', e.target.value)} />
                                    </label>
                                </div>
                                <p className={styles.cardHint}>{perks?.mistwarp?.customProjectBranding ? `Included with your ${perks.tier} Rotur plan.` : 'Custom branding is included with Rotur Plus and Pro.'}</p>
                            </div>
                            <ProjectInfoPanel
                                project={project}
                                onSaved={updated => {
                                    if (updated) setProject(updated);
                                }}
                                embedded
                            />
                        </div>
                    ) : null}

                    {activeSection === 'publishing' ? (
                        <div className={styles.stack}>
                            <PageHeading title="Publishing" description="Control who can open the project and what they can do with it." />
                            <div className={styles.card}>
                                <h2 className={styles.cardTitle}>Access</h2>
                                <div className={styles.form}>
                                    <div className={styles.field}>
                                        <span>Visibility</span>
                                        <VisibilityMenu
                                            disabled={saving}
                                            value={form.visibility}
                                            onChange={value => set('visibility', value)}
                                        />
                                    </div>
                                    <div className={styles.switches}>
                                        <SwitchRow checked={form.remixable} disabled={saving} label="Allow remixes" onChange={value => set('remixable', value)} />
                                        <SwitchRow checked={form.seeInside} disabled={saving} label="Allow people to see inside" onChange={value => set('seeInside', value)} />
                                        <SwitchRow checked={form.commentsOff} disabled={saving} label="Turn off comments" onChange={value => set('commentsOff', value)} />
                                    </div>
                                    <div className={styles.formActions}>
                                        {status ? <span className={styles.formStatus}>{status}</span> : null}
                                        <Button variant="primary" className={styles.save} busy={saving} busyLabel="Saving…" onClick={save}>
                                            <Check size={16} /> Save publishing settings
                                        </Button>
                                    </div>
                                </div>
                            </div>
                            <div className={styles.card}>
                                <h2 className={styles.cardTitle}>Private preview</h2>
                                <p className={styles.empty}>Create a private play link that expires after 24 hours.</p>
                                <div className={styles.inlineAction}>
                                    <Button variant="secondary" busy={previewBusy} busyLabel="Creating…" onClick={createPreview}>
                                        <Link2 size={16} /> Create preview link
                                    </Button>
                                </div>
                                {preview ? <div className={styles.previewResult}><input value={preview} readOnly onFocus={event => event.target.select()} /><span>Expires in 24 hours.</span></div> : null}
                            </div>
                        </div>
                    ) : null}

                    {activeSection === 'sales' ? (
                        <div className={styles.stack}>
                            <PageHeading title="Sales" description="Set the price and review who has bought the project." />
                            <PageTabs
                                items={[{key: 'pricing', label: 'Pricing'}, {key: 'buyers', label: `Buyers${buyers.length ? ` (${buyers.length})` : ''}`}]}
                                value={salesTab}
                                onChange={nextTab => {
                                    setSalesTab(nextTab);
                                    setRouteSection(nextTab === 'buyers' ? 'buyers' : 'sales');
                                }}
                                label="Sales sections"
                            />
                            {salesTab === 'pricing' ? (
                                <div className={styles.card}>
                                    <h2 className={styles.cardTitle}>Pricing</h2>
                                    <div className={styles.form}>
                                        <div className={styles.settingsGrid}>
                                            <label className={styles.field}>
                                                <span>Price in credits</span>
                                                <input disabled={saving} type="number" min="0" max={perks?.mistwarp?.maxProjectPrice} step="1" value={form.price} onChange={event => set('price', event.target.value)} />
                                                <small>Set the price to 0 to make the project free.</small>
                                            </label>
                                            {project.remixParent ? (
                                                <label className={styles.field}>
                                                    <span>Original creator share</span>
                                                    <input disabled={saving} type="number" min="0" max="50" step="1" value={form.remixShare} onChange={event => set('remixShare', event.target.value)} />
                                                    <small>Percentage of each sale paid to the original project.</small>
                                                </label>
                                            ) : null}
                                        </div>
                                        {perks ? <p className={styles.cardHint}>Your {perks.tier} plan allows prices up to {perks.mistwarp.maxProjectPrice} credits. MistWarp takes a {perks.mistwarp.salesFeeBasisPoints / 100}% fee.</p> : null}
                                        <div className={styles.formActions}>
                                            {status ? <span className={styles.formStatus}>{status}</span> : null}
                                            <Button variant="primary" className={styles.save} busy={saving} busyLabel="Saving…" onClick={save}><Check size={16} /> Save price</Button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className={styles.card}>
                                    {buyers.length ? (
                                        <ul className={styles.buyers}>
                                            {buyers.slice().reverse().map((buyer, index) => (
                                                <li key={`${buyer.user}-${index}`} className={styles.buyerRow}>
                                                    <Link to={`/users/${buyer.user}`} className={styles.buyer}><Avatar username={buyer.user} size={30} /><span>{buyer.user}</span></Link>
                                                    <span className={styles.buyerMeta}>
                                                        <span className={styles.buyerAmount}><Coins size={13} />{roundCredits(buyer.amount)}</span>
                                                        {buyer.at ? <span className={styles.buyerDate}>{formatDate(buyer.at, 'Date unavailable')}</span> : null}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : <p className={styles.empty}>{paywalled ? 'No one has bought this project yet.' : 'This project is free. Set a price to start selling it.'}</p>}
                                </div>
                            )}
                        </div>
                    ) : null}

                    {activeSection === 'ownership' ? (
                        <div className={styles.stack}>
                            <PageHeading title="Ownership" description="Move the project to a group or transfer it to someone else." />
                            <div className={styles.card}>
                                <h2 className={styles.cardTitle}>Owning group</h2>
                                <div className={styles.form}>
                                    <label className={styles.field}>
                                        <span>Rotur group tag</span>
                                        <input disabled={saving} value={form.groupTag} maxLength={32} placeholder="Optional group tag" onChange={event => set('groupTag', event.target.value)} />
                                        <small>Clear this field to move the project back to your account.</small>
                                    </label>
                                    <div className={styles.formActions}>
                                        {status ? <span className={styles.formStatus}>{status}</span> : null}
                                        <Button variant="primary" className={styles.save} busy={saving} busyLabel="Saving…" onClick={save}><Check size={16} /> Save group</Button>
                                    </div>
                                </div>
                            </div>
                            <div className={`${styles.card} ${styles.dangerCard}`}>
                                <h2 className={styles.cardTitle}>Transfer project</h2>
                                <p className={styles.empty}>The new owner gets the project. You will lose owner access.</p>
                                <div className={styles.transferAction}>
                                    <input disabled={transferBusy} value={transferOwner} placeholder="Rotur username" aria-label="New owner username" onChange={event => setTransferOwner(event.target.value)} />
                                    <Button variant="secondary" disabled={!transferOwner.trim() || transferBusy} onClick={requestProjectTransfer}>Transfer</Button>
                                </div>
                            </div>
                        </div>
                    ) : null}

                    {activeSection === 'activity' && activityTab === 'diagnostics' ? (
                        <div className={styles.stack}>
                            <PageHeading title="Activity" description="Review player feedback and recent runtime health." />
                            <PageTabs
                                items={[{key: 'feedback', label: 'Feedback'}, {key: 'diagnostics', label: 'Diagnostics'}]}
                                value={activityTab}
                                onChange={nextTab => {
                                    setActivityTab(nextTab);
                                    setRouteSection(nextTab === 'diagnostics' ? 'diagnostics' : 'activity');
                                }}
                                label="Activity sections"
                            />
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
                                        {diagnostics.recent.filter(item => item.error).slice(0, 20).map(item => <li key={item._id} className={styles.buyerRow}><span>{item.error}</span><span className={styles.buyerDate}>{formatDateTime(item.created, 'Date unavailable')}</span></li>)}
                                    </ul>
                                </div>
                            ) : null}
                        </div>
                    ) : null}
                    {activeSection === 'activity' && activityTab === 'feedback' ? (
                        <div className={styles.stack}>
                            <PageHeading title="Activity" description="Review player feedback and recent runtime health." />
                            <PageTabs
                                items={[{key: 'feedback', label: 'Feedback'}, {key: 'diagnostics', label: 'Diagnostics'}]}
                                value={activityTab}
                                onChange={nextTab => {
                                    setActivityTab(nextTab);
                                    setRouteSection(nextTab === 'diagnostics' ? 'diagnostics' : 'activity');
                                }}
                                label="Activity sections"
                            />
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
                                                    <span className={styles.buyerDate}>{formatDate(item.created, 'Date unavailable')}</span>
                                                    <select value={item.status || 'open'} disabled={Boolean(feedbackBusy)} onChange={event => updateFeedbackStatus(item, event.target.value)}>
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
                        </div>
                    ) : null}
                    {activeSection === 'collaboration' && collaborationTab === 'team' ? (
                        <div className={styles.stack}>
                            <PageHeading title="Collaboration" description="Manage project access and funded work." />
                            <PageTabs
                                items={[{key: 'team', label: 'Team'}, {key: 'bounties', label: 'Bounties'}]}
                                value={collaborationTab}
                                onChange={nextTab => {
                                    setCollaborationTab(nextTab);
                                    setRouteSection(nextTab === 'bounties' ? 'bounties' : 'collaboration');
                                }}
                                label="Collaboration sections"
                            />
                            <div className={`${styles.card} ${styles.teamCard}`}>
                                <div className={styles.teamHead}>
                                    <div><h2 className={styles.cardTitle}>Project team</h2><p>Give other people access without sharing your account.</p></div>
                                    <Button
                                        className={styles.addTeam}
                                        disabled={teamSaving}
                                        onClick={() => setTeam(current => [
                                            ...current,
                                            {username: '', role: 'contributor', share: 0}
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
                                                <label className={styles.teamShare}>
                                                    <span>Sale share</span>
                                                    <div className={styles.shareInput}>
                                                        <input
                                                            disabled={teamSaving}
                                                            type="number"
                                                            min="0"
                                                            max="50"
                                                            step="1"
                                                            value={member.share || 0}
                                                            onChange={event => {
                                                                const {value} = event.target;
                                                                setTeam(current => current.map((item, itemIndex) => (
                                                                    itemIndex === index ? {...item, share: value} : item
                                                                )));
                                                            }}
                                                        />
                                                        <span>%</span>
                                                    </div>
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
                        </div>
                    ) : null}
                    {activeSection === 'collaboration' && collaborationTab === 'bounties' ? (
                        <div className={styles.stack}>
                            <PageHeading title="Collaboration" description="Manage project access and funded work." />
                            <PageTabs
                                items={[{key: 'team', label: 'Team'}, {key: 'bounties', label: 'Bounties'}]}
                                value={collaborationTab}
                                onChange={nextTab => {
                                    setCollaborationTab(nextTab);
                                    setRouteSection(nextTab === 'bounties' ? 'bounties' : 'collaboration');
                                }}
                                label="Collaboration sections"
                            />
                            <BountiesPanel project={project} />
                        </div>
                    ) : null}
                </div>
            </div>
        </main>
    );
};

const BountiesPanel = ({project}) => {
    const [items, setItems] = useState(null);
    const [form, setForm] = useState({title: '', description: '', amount: '10'});
    const [busy, setBusy] = useState(false);
    const [status, setStatus] = useState('');

    const load = useCallback(() => {
        setItems(null);
        listCommerceBounties({source: 'mistwarp', resource_type: 'project', resource_id: project.id, status: ''})
            .then(data => setItems(data.bounties || []))
            .catch(error => {
                setItems([]);
                setStatus(error.message || 'Could not load bounties.');
            });
    }, [project.id]);

    useEffect(load, [load]);

    const create = async event => {
        event.preventDefault();
        const amount = Math.round(Number(form.amount) * 100) / 100;
        if (!form.title.trim() || !Number.isFinite(amount) || amount < 0.01) {
            setStatus('Add a title and an amount greater than 0.');
            return;
        }
        setBusy(true);
        setStatus('');
        try {
            await createCommerceBounty({
                title: form.title.trim(),
                description: form.description.trim(),
                amount,
                source: 'mistwarp',
                resource_type: 'project',
                resource_id: project.id
            });
            setForm({title: '', description: '', amount: '10'});
            setStatus('Bounty funded. A merged contribution can claim it.');
            load();
        } catch (error) {
            setStatus(error.message || 'Could not create the bounty.');
        } finally {
            setBusy(false);
        }
    };

    const cancel = async id => {
        setBusy(true);
        setStatus('');
        try {
            await cancelCommerceBounty(id);
            setStatus('Bounty cancelled and refunded.');
            load();
        } catch (error) {
            setStatus(error.message || 'Could not cancel the bounty.');
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className={styles.stack}>
            <div className={styles.card}>
                <h2 className={styles.cardTitle}>Fund some work</h2>
                <p className={styles.empty}>A contributor can attach this bounty when sending changes. Merging those changes pays them automatically.</p>
                <form className={styles.form} onSubmit={create}>
                    <input
                        disabled={busy}
                        maxLength={120}
                        value={form.title}
                        placeholder="What needs doing?"
                        onChange={event => {
                            const {value} = event.currentTarget;
                            setForm(current => ({...current, title: value}));
                        }}
                    />
                    <textarea
                        disabled={busy}
                        maxLength={2000}
                        value={form.description}
                        placeholder="Describe what counts as done"
                        onChange={event => {
                            const {value} = event.currentTarget;
                            setForm(current => ({...current, description: value}));
                        }}
                    />
                    <label className={`${styles.field} ${styles.priceField}`}>
                        <span>Reward in credits</span>
                        <input
                            disabled={busy}
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={form.amount}
                            onChange={event => {
                                const {value} = event.currentTarget;
                                setForm(current => ({...current, amount: value}));
                            }}
                        />
                    </label>
                    <Button type="submit" variant="primary" busy={busy} busyLabel="Funding…"><Coins size={15} /> Fund bounty</Button>
                </form>
                {status ? <p className={styles.formStatus}>{status}</p> : null}
            </div>
            <div className={styles.card}>
                <h2 className={styles.cardTitle}>Project bounties</h2>
                {items === null ? <p className={styles.empty}>Loading…</p> : items.length ? (
                    <ul className={styles.buyers}>
                        {items.map(item => (
                            <li key={item.id} className={styles.buyerRow}>
                                <div><strong>{item.title}</strong><p className={styles.empty}>{item.description}</p></div>
                                <span className={styles.buyerMeta}>
                                    <strong className={styles.buyerAmount}><Coins size={13} />{item.amount}</strong>
                                    <span>{item.status}</span>
                                    {item.status === 'open' ? <Button variant="secondary" disabled={busy} onClick={() => cancel(item.id)}>Cancel</Button> : null}
                                </span>
                            </li>
                        ))}
                    </ul>
                ) : <p className={styles.empty}>No bounties yet.</p>}
            </div>
        </div>
    );
};

export {
    SECTIONS,
    normalizeCollaborators,
    normalizeProjectSectionParam,
    projectNavigationState,
    projectTransferConfirmation
};
export default ManageProject;
