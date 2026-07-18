import React, {useEffect, useState, useCallback} from 'react';
import {useParams, Link} from 'react-router-dom';
import {
    ArrowLeft, ExternalLink, Eye, Coins, Users, Heart, Check, BarChart3, SlidersHorizontal, Bookmark
} from 'lucide-react';
import api, {projectUrl} from '../api';
import {useUser} from '../UserContext.jsx';
import Avatar from '../components/Avatar.jsx';
import VisibilityMenu from '../components/VisibilityMenu.jsx';
import ProjectInfoPanel from '../components/ProjectInfoPanel.jsx';
import StatChart, {historyRows} from '../components/StatChart.jsx';
import Sidebar from '../components/Sidebar.jsx';
import styles from './ManageProject.module.css';

const roundCredits = value => Math.round((Number(value) || 0) * 100) / 100;

const SECTIONS = [
    {key: 'overview', label: 'Overview', icon: BarChart3},
    {key: 'buyers', label: 'Buyers', icon: Users},
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
            visibility: project.visibility || (project.shared ? 'public' : 'private')
        });
    }, [project]);

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
    const sections = SECTIONS.filter(item => item.key !== 'buyers' || paywalled);
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
                                {project.thumbUrl ? (
                                    <img
                                        className={styles.heroThumb}
                                        src={project.thumbUrl}
                                        alt=""
                                    />
                                ) : (
                                    <span className={styles.heroThumbFallback}>{(project.title || '?')[0]}</span>
                                )}
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
                </div>
            </div>
        </main>
    );
};

export default ManageProject;
