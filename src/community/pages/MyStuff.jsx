import React, {useEffect, useState, useCallback, useRef} from 'react';
import {Link} from 'react-router-dom';
import {
    Plus, Trash2, Heart, ThumbsDown, Play, Upload, Star, MoreHorizontal, Pencil, ExternalLink, HardDrive,
    SlidersHorizontal, Coins, Eye, TrendingUp, Wallet, HeartHandshake, FolderOpen, Bookmark, LayoutDashboard
} from 'lucide-react';
import api, {editorUrl, projectUrl} from '../api';
import {formatBytes} from '../format';
import {getAccountSummary} from '../../lib/rotur/client.js';
import {useUser} from '../UserContext.jsx';
import ProjectCard from '../components/ProjectCard.jsx';
import StatChart, {historyRows} from '../components/StatChart.jsx';
import BuyCreditsModal from '../components/BuyCreditsModal.jsx';
import Sidebar from '../components/Sidebar.jsx';
import styles from './MyStuff.module.css';

const fmt = value => (Number(value) || 0).toLocaleString();
const fmtCredits = value => Math.round((Number(value) || 0) * 100) / 100;

const visibilityLabel = project => {
    const v = project.visibility || (project.shared ? 'public' : 'private');
    if (v === 'public') return 'Shared';
    if (v === 'unlisted') return 'Unlisted';
    return 'Draft';
};

const Overview = ({stats, account, quota, onBuyCredits}) => {
    const weekViews = historyRows(stats.viewHistory, 7).reduce((sum, row) => sum + row.value, 0);
    const pct = quota ? (quota.used / quota.limit) * 100 : 0;
    return (
        <section className={styles.dashboard}>
            <div className={styles.dashGrid}>
                <div className={`${styles.dashTile} ${styles.tileMonth}`}>
                    <span className={styles.dashIcon}><TrendingUp size={18} /></span>
                    <span className={styles.dashNumber}>{fmt(weekViews)}</span>
                    <span className={styles.dashLabel}>Views this week</span>
                </div>
                <div className={`${styles.dashTile} ${styles.tileViews}`}>
                    <span className={styles.dashIcon}><Eye size={18} /></span>
                    <span className={styles.dashNumber}>{fmt(stats.totalViews)}</span>
                    <span className={styles.dashLabel}>Total views</span>
                </div>
                <div className={`${styles.dashTile} ${styles.tileHearts}`}>
                    <span className={styles.dashIcon}><Heart size={18} /></span>
                    <span className={styles.dashNumber}>{fmt(stats.totalHearts)}</span>
                    <span className={styles.dashLabel}>Hearts</span>
                </div>
                {stats.totalRevenue > 0 ? (
                    <div className={`${styles.dashTile} ${styles.tileEarned}`}>
                        <span className={styles.dashIcon}><Coins size={18} /></span>
                        <span className={styles.dashNumber}>{fmtCredits(stats.totalRevenue)}</span>
                        <span className={styles.dashLabel}>Credits earned</span>
                    </div>
                ) : null}
                {quota ? (
                    <div className={`${styles.dashTile} ${styles.tileQuota}`}>
                        <span className={styles.dashIcon}><HardDrive size={18} /></span>
                        <span className={styles.dashNumber}>{formatBytes(quota.used)}</span>
                        <span className={styles.dashLabel}>of {formatBytes(quota.limit)} used</span>
                        <div className={styles.quotaBarBg}>
                            <div
                                className={styles.quotaBarFill}
                                style={{width: `${Math.min(100, pct)}%`}}
                            />
                        </div>
                        <span className={pct >= 80 ? styles.quotaWarn : styles.quotaPct}>
                            {pct >= 80 ? '⚠ ' : ''}{Math.round(pct)}% full
                        </span>
                    </div>
                ) : null}
                {account && account.balance !== null ? (
                    <div className={`${styles.dashTile} ${styles.tileBalance}`}>
                        <span className={styles.dashIcon}><Wallet size={18} /></span>
                        <span className={styles.dashNumber}>{fmtCredits(account.balance)}</span>
                        <span className={styles.dashLabel}>Balance</span>
                        <button
                            className={styles.dashBuy}
                            onClick={onBuyCredits}
                        >Buy credits</button>
                    </div>
                ) : null}
                {account && account.donationsReceived > 0 ? (
                    <div className={`${styles.dashTile} ${styles.tileDonations}`}>
                        <span className={styles.dashIcon}><HeartHandshake size={18} /></span>
                        <span className={styles.dashNumber}>{fmtCredits(account.donationsReceived)}</span>
                        <span className={styles.dashLabel}>Donations received</span>
                    </div>
                ) : null}
            </div>
            <StatChart
                title="Views over the last 2 weeks"
                rows={historyRows(stats.viewHistory, 14)}
                accent="#4C97FF"
                emptyText="No views yet. Share a project to get started."
            />
        </section>
    );
};

const SECTIONS = [
    {key: 'overview', label: 'Overview', icon: LayoutDashboard},
    {key: 'projects', label: 'My Projects', icon: FolderOpen},
    {key: 'library', label: 'My Library', icon: Bookmark},
    {key: 'loves', label: 'My Loved', icon: Heart}
];

const MyStuff = () => {
    const {user, loading} = useUser();
    const [tab, setTab] = useState('overview');
    const [projects, setProjects] = useState(null);
    const [featuredProject, setFeaturedProject] = useState(user ? user.featuredProject : '');
    const [uploading, setUploading] = useState(false);
    const [actionError, setActionError] = useState('');
    const [failed, setFailed] = useState(false);
    const [openMenu, setOpenMenu] = useState('');
    const [quota, setQuota] = useState(null);
    const [stats, setStats] = useState(null);
    const [account, setAccount] = useState(null);
    const [showBuyCredits, setShowBuyCredits] = useState(false);
    const uploadInput = useRef(null);
    const menuRef = useRef(null);

    useEffect(() => {
        if (!user) {
            setQuota(null);
            return;
        }
        let stale = false;
        api.quota()
            .then(data => {
                if (!stale) setQuota(data);
            })
            .catch(() => {});
        return () => {
            stale = true;
        };
    }, [user, projects]);

    useEffect(() => {
        setFeaturedProject(user ? user.featuredProject : '');
    }, [user]);

    useEffect(() => {
        if (!user) {
            setStats(null);
            setAccount(null);
            return () => {};
        }
        let stale = false;
        api.stats()
            .then(data => !stale && setStats(data.stats || null))
            .catch(() => {});
        getAccountSummary()
            .then(data => !stale && setAccount(data))
            .catch(() => {});
        return () => {
            stale = true;
        };
    }, [user, projects]);

    const load = useCallback(() => {
        if (!user || tab === 'overview') {
            return;
        }
        setProjects(null);
        setFailed(false);
        const fetchTab = tab === 'loves' ?
            api.userLoves(user.username) :
            tab === 'library' ?
                api.library() :
                api.myProjects(user.username);
        fetchTab
            .then(data => setProjects(data.projects || []))
            .catch(() => setFailed(true));
    }, [user, tab]);

    useEffect(() => {
        load();
    }, [load]);

    useEffect(() => {
        if (!openMenu) return () => {};
        const onDown = event => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setOpenMenu('');
            }
        };
        window.addEventListener('mousedown', onDown);
        return () => window.removeEventListener('mousedown', onDown);
    }, [openMenu]);

    const clearFeaturedIf = async id => {
        if (featuredProject !== id) return;
        setFeaturedProject('');
        try {
            await api.updateProfile({featuredProject: ''});
        } catch (e) {
            // ignore
        }
    };

    const unpublish = async id => {
        try {
            setActionError('');
            await api.unpublish(id);
            await clearFeaturedIf(id);
            load();
        } catch (e) {
            setActionError(e.message);
        }
    };

    const publish = async id => {
        try {
            setActionError('');
            await api.publish(id);
            load();
        } catch (e) {
            setActionError(e.message);
        }
    };

    const deleteProject = async id => {
        setOpenMenu('');
        if (!window.confirm('Delete this project forever? This cannot be undone.')) {
            return;
        }
        try {
            setActionError('');
            await api.deleteProject(id);
            await clearFeaturedIf(id);
            load();
        } catch (e) {
            setActionError(e.message);
        }
    };

    const toggleFeatured = async id => {
        setOpenMenu('');
        const next = featuredProject === id ? '' : id;
        try {
            setActionError('');
            await api.updateProfile({featuredProject: next});
            setFeaturedProject(next);
        } catch (e) {
            setActionError(e.message);
        }
    };

    const uploadSb3 = async event => {
        const file = event.target.files[0];
        event.target.value = '';
        if (!file) return;
        if (!file.name.toLowerCase().endsWith('.sb3')) {
            setActionError('Choose a Scratch .sb3 project file.');
            return;
        }
        let created;
        try {
            setActionError('');
            setUploading(true);
            created = await api.createProject({title: file.name.replace(/\.sb3$/i, '') || 'Untitled'});
            await api.uploadProject(created.id, file);
            setTab('projects');
            load();
        } catch (e) {
            if (created) {
                api.deleteProject(created.id).catch(() => {});
            }
            setActionError(e.message || 'Could not upload that project.');
        } finally {
            setUploading(false);
        }
    };

    if (loading) {
        return <main className={styles.page}><p className={styles.status}>Loading…</p></main>;
    }
    if (!user) {
        return <main className={styles.page}><p className={styles.status}>Sign in to see your projects.</p></main>;
    }

    return (
        <main className={styles.page}>
            <div className={styles.head}>
                <h1>My stuff</h1>
                <div className={styles.headActions}>
                    <input
                        ref={uploadInput}
                        className={styles.hiddenInput}
                        type="file"
                        accept=".sb3,application/x.scratch.sb3"
                        onChange={uploadSb3}
                    />
                    <button
                        className={styles.uploadButton}
                        disabled={uploading}
                        onClick={() => uploadInput.current.click()}
                    >
                        <Upload size={16} />
                        {uploading ? 'Uploading…' : 'Upload .sb3'}
                    </button>
                    <a
                        className={styles.newButton}
                        href={editorUrl()}
                    >
                        <Plus size={16} />
                        New project
                    </a>
                </div>
            </div>

            {actionError ? <p className={styles.error}>{actionError}</p> : null}

            {quota && (quota.used / quota.limit) * 100 >= 80 ? (
                <p className={styles.quotaWarning}>
                    ⚠ You've used {formatBytes(quota.used)} of your {formatBytes(quota.limit)} upload quota
                    ({Math.round((quota.used / quota.limit) * 100)}%).{' '}
                    {quota.used >= quota.limit
                        ? 'You cannot upload new projects until usage drops.'
                        : 'Consider managing your projects to free up space.'}
                </p>
            ) : null}

            {showBuyCredits ? (
                <BuyCreditsModal
                    balance={account && account.balance}
                    onClose={() => setShowBuyCredits(false)}
                />
            ) : null}

            <div className={styles.layout}>
                <Sidebar
                    sections={SECTIONS}
                    active={tab}
                    onChange={setTab}
                    ariaLabel="My stuff sections"
                />
                <div className={styles.content}>
                    {tab === 'overview' ? (
                        stats ? (
                            <Overview
                                stats={stats}
                                account={account}
                                quota={quota}
                                onBuyCredits={() => setShowBuyCredits(true)}
                            />
                        ) : (
                            <p className={styles.status}>Loading…</p>
                        )
                    ) : failed ? (
                        <p className={styles.status}>
                            Couldn&apos;t load.{' '}
                            <button
                                className={styles.secondary}
                                onClick={load}
                            >Try again</button>
                        </p>
                    ) : projects === null ? (
                        <p className={styles.status}>Loading…</p>
                    ) : tab !== 'projects' ? (
                        projects.length ? (
                            <div className={styles.grid}>
                                {projects.map(project => (
                                    <ProjectCard
                                        key={project.id}
                                        project={project}
                                    />
                                ))}
                            </div>
                        ) : (
                            <p className={styles.status}>
                                {tab === 'library' ?
                                    'Projects you buy or save to your library show up here.' :
                                    'Projects you heart show up here.'}
                            </p>
                        )
                    ) : projects.length ? (
                        <div className={styles.list}>
                            {projects.map(project => {
                                const featured = featuredProject === project.id;
                                const isMenuOpen = openMenu === project.id;
                                return (
                                    <div
                                        key={project.id}
                                        className={styles.row}
                                    >
                                        <Link
                                            to={projectUrl(project.id)}
                                            className={styles.thumb}
                                        >
                                            {project.thumbUrl ? (
                                                <img
                                                    src={project.thumbUrl}
                                                    alt=""
                                                />
                                            ) : <span>{(project.title || '?')[0]}</span>}
                                        </Link>
                                        <div className={styles.info}>
                                            <Link
                                                to={projectUrl(project.id)}
                                                className={styles.title}
                                            >{project.title}</Link>
                                            <span className={project.shared ? styles.shared : styles.draft}>
                                                {visibilityLabel(project)}
                                            </span>
                                            <span className={styles.rowStats}>
                                                <span className={styles.rowStat}>
                                                    <Heart size={13} />
                                                    {project.loveCount || 0}
                                                </span>
                                                <span className={styles.rowStat}>
                                                    <ThumbsDown size={13} />
                                                    {project.brokenHeartCount || 0}
                                                </span>
                                                <span className={styles.rowStat}>
                                                    <Play size={13} />
                                                    {project.views || 0}
                                                </span>
                                                {project.price ? (
                                                    <span className={styles.rowStat}>
                                                        <Coins size={13} />
                                                        {project.price}
                                                    </span>
                                                ) : null}
                                                {project.revenue ? (
                                                    <span className={styles.rowStat}>
                                                        {`${Math.round(project.revenue * 100) / 100} earned`}
                                                    </span>
                                                ) : null}
                                                {project.sizeBytes ? (
                                                    <span className={styles.rowStat}>
                                                        <HardDrive size={13} />
                                                        {formatBytes(project.sizeBytes)}
                                                    </span>
                                                ) : null}
                                            </span>
                                        </div>
                                        <div className={styles.rowActions}>
                                            {project.shared ? (
                                                <button
                                                    className={styles.secondary}
                                                    onClick={() => unpublish(project.id)}
                                                >Unshare</button>
                                            ) : (
                                                <button
                                                    className={styles.secondary}
                                                    onClick={() => publish(project.id)}
                                                >Share</button>
                                            )}
                                            <div
                                                className={styles.actionMenuWrap}
                                                ref={isMenuOpen ? menuRef : null}
                                            >
                                                <button
                                                    className={styles.moreButton}
                                                    aria-label={`Actions for ${project.title}`}
                                                    aria-expanded={isMenuOpen}
                                                    onClick={() => setOpenMenu(isMenuOpen ? '' : project.id)}
                                                >
                                                    <MoreHorizontal size={18} />
                                                </button>
                                                {isMenuOpen ? (
                                                    <div className={styles.actionMenu}>
                                                        <a href={editorUrl({platformProject: project.id})}>
                                                            <Pencil size={14} />
                                                            Open in editor
                                                        </a>
                                                        <Link to={`/mystuff/project/${project.id}`}>
                                                            <SlidersHorizontal size={14} />
                                                            Manage &amp; analytics
                                                        </Link>
                                                        <Link to={projectUrl(project.id)}>
                                                            <ExternalLink size={14} />
                                                            Project page
                                                        </Link>
                                                        {project.shared ? (
                                                            <button onClick={() => toggleFeatured(project.id)}>
                                                                <Star
                                                                    size={14}
                                                                    fill={featured ? 'currentColor' : 'none'}
                                                                />
                                                                {featured ?
                                                                    'Remove profile feature' : 'Feature on profile'}
                                                            </button>
                                                        ) : (
                                                            <button
                                                                className={styles.danger}
                                                                onClick={() => deleteProject(project.id)}
                                                            >
                                                                <Trash2 size={14} />
                                                                Delete
                                                            </button>
                                                        )}
                                                    </div>
                                                ) : null}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className={styles.status}>You have not created any projects yet.</p>
                    )}
                </div>
            </div>
        </main>
    );
};

export default MyStuff;
