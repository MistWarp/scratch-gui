import React, {useEffect, useState, useCallback, useRef} from 'react';
import {Link} from 'react-router-dom';
import {
    Plus, Trash2, Heart, ThumbsDown, Play, Upload, Star, MoreHorizontal, Pencil, ExternalLink, HardDrive,
    SlidersHorizontal, Coins, Eye, TrendingUp, Wallet, HeartHandshake, FolderOpen, Bookmark, LayoutDashboard,
    RefreshCw, AlertTriangle, CheckCircle
} from 'lucide-react';
import api, {editorUrl, projectUrl} from '../api';
import {formatBytes} from '../format';
import {getAccountSummary} from '../../lib/rotur/client.js';
import {useUser} from '../UserContext.jsx';
import ProjectCard from '../components/ProjectCard.jsx';
import ProjectThumbnail from '../components/ProjectThumbnail.jsx';
import StatChart, {historyRows} from '../components/StatChart.jsx';
import {KO_FI_SHOP_URL} from '../credits';
import Sidebar from '../components/Sidebar.jsx';
import useEscape from '../use-escape.js';
import styles from './MyStuff.module.css';

const fmt = value => (Number(value) || 0).toLocaleString();
const fmtCredits = value => Math.round((Number(value) || 0) * 100) / 100;

const visibilityLabel = project => {
    const v = project.visibility || (project.shared ? 'public' : 'private');
    if (v === 'public') return 'Shared';
    if (v === 'unlisted') return 'Unlisted';
    return 'Draft';
};

const Overview = ({stats, account, quota}) => {
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
                            {pct >= 80 ? <AlertTriangle size={14} /> : null}{Math.round(pct)}% full
                        </span>
                    </div>
                ) : null}
                {account && account.balance !== null ? (
                    <div className={`${styles.dashTile} ${styles.tileBalance}`}>
                        <span className={styles.dashIcon}><Wallet size={18} /></span>
                        <span className={styles.dashNumber}>{fmtCredits(account.balance)}</span>
                        <span className={styles.dashLabel}>Balance</span>
                        <a
                            className={styles.dashBuy}
                            href={KO_FI_SHOP_URL}
                        >Buy credits</a>
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

const UploadUsage = ({quota, onRefresh}) => {
    const [showConfirm, setShowConfirm] = useState(false);
    const [amount, setAmount] = useState(20);
    const [resetting, setResetting] = useState(false);
    const [resetKey, setResetKey] = useState('');
    const [payTo, setPayTo] = useState('');
    const [resetError, setResetError] = useState('');
    const [resetDone, setResetDone] = useState(false);

    const pct = quota ? (quota.used / quota.limit) * 100 : 0;

    const dailyMap = Object.fromEntries((quota?.daily || []).map(d => [d.day, d.bytes]));

    // shared boilerplate for both reset actions
    const runReset = useCallback(async (fn, errorPrefix) => {
        setResetting(true);
        setResetError('');
        try {
            await fn();
        } catch (e) {
            setResetError(e.message || errorPrefix);
        } finally {
            setResetting(false);
        }
    }, []);

    const handleReset = useCallback(() => {
        runReset(async () => {
            const data = await api.quotaReset();
            setResetKey(data.key);
            setPayTo(data.payTo);
            setAmount(data.amount);
            setShowConfirm(true);
        }, 'Could not start reset');
    }, [runReset]);

    const confirmReset = useCallback(() => {
        runReset(async () => {
            await api.quotaResetConfirm(resetKey);
            setShowConfirm(false);
            setResetDone(true);
            onRefresh();
        }, 'Reset failed');
    }, [runReset, resetKey, onRefresh]);

    const dismiss = useCallback(() => {
        setShowConfirm(false);
        setResetKey('');
        setResetError('');
    }, []);
    useEscape(showConfirm ? dismiss : null);

    const oldestDate = quota && quota.oldestEventMs ?
        new Date(quota.oldestEventMs).toLocaleDateString() :
        null;

    if (!quota) {
        return <p className={styles.status}>Loading upload info…</p>;
    }

    const summaryStats = [
        {value: formatBytes(quota.used), label: 'Used'},
        {value: formatBytes(quota.limit), label: 'Limit'},
        ...(oldestDate ? [{value: oldestDate, label: 'Oldest upload'}] : []),
        {value: quota.eventCount || 0, label: 'Uploads this week'}
    ];

    return (
        <section className={styles.uploads}>
            <div className={styles.uploadSummary}>
                {summaryStats.map(s => (
                    <div key={s.label} className={styles.uploadStat}>
                        <span className={styles.uploadStatNum}>{s.value}</span>
                        <span className={styles.uploadStatLabel}>{s.label}</span>
                    </div>
                ))}
            </div>

            <div className={styles.uploadBarSection}>
                <div className={styles.uploadBarLabel}>
                    {Math.round(pct)}% full
                    {pct >= 80 ? (
                        <span className={styles.uploadWarn}> <AlertTriangle size={14} /> Nearly full</span>
                    ) : null}
                </div>
                <div className={styles.uploadBarBg}>
                    <div
                        className={styles.uploadBarFill}
                        style={{width: `${Math.min(100, pct)}%`}}
                    />
                </div>
            </div>

            <StatChart
                title="Daily upload volume"
                rows={historyRows(dailyMap, 14)}
                format={formatBytes}
                accent="#4C97FF"
                emptyText="No uploads in the current window."
            />

            <div className={styles.uploadReset}>
                <h3 className={styles.uploadChartTitle}>Reset upload quota</h3>
                <p className={styles.uploadResetDesc}>
                    Reset your weekly upload usage back to zero. This costs{' '}
                    <strong>{amount || 20} credits</strong>.
                </p>

                {resetDone ? (
                    <div className={styles.uploadResetDone}>
                        <p><CheckCircle size={16} /> Quota reset successfully! Your upload usage is now 0.</p>
                    </div>
                ) : resetError ? (
                    <div className={styles.uploadResetError}>
                        <p><AlertTriangle size={14} /> {resetError}</p>
                        <button
                            className={styles.secondary}
                            onClick={() => setResetError('')}
                        >Dismiss</button>
                    </div>
                ) : (
                    <button
                        className={styles.uploadResetBtn}
                        onClick={handleReset}
                        disabled={resetting}
                    >
                        <RefreshCw size={16} />
                        {resetting ? 'Starting…' : 'Reset quota'}
                    </button>
                )}
            </div>

            {showConfirm ? (
                <div className={styles.confirmOverlay} onClick={dismiss}>
                    <div
                        className={styles.confirmModal}
                        onClick={e => e.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                    >
                        <h3 className={styles.confirmTitle}>Reset upload quota?</h3>
                        <p className={styles.confirmText}>
                            This will cost <strong>{amount} credits</strong>
                            {payTo ? <> sent to <code>{payTo}</code></> : ''}.
                            Your upload usage will be reset to zero. Continue?
                        </p>
                        <div className={styles.confirmActions}>
                            <button
                                className={styles.uploadResetBtn}
                                onClick={confirmReset}
                                disabled={resetting}
                            >
                                {resetting ? 'Resetting…' : `Spend ${amount} credits`}
                            </button>
                            <button
                                className={styles.secondary}
                                onClick={dismiss}
                                disabled={resetting}
                            >Cancel</button>
                        </div>
                    </div>
                </div>
            ) : null}
        </section>
    );
};

const AgreementTab = () => {
    const [agreement, setAgreement] = useState(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        let stale = false;
        api.agreement()
            .then(data => {
                if (!stale) setAgreement(data.agreement);
            })
            .catch(() => {});
        return () => {
            stale = true;
        };
    }, []);

    const handleAccept = async () => {
        setBusy(true);
        setError('');
        try {
            const data = await api.acceptAgreement();
            setAgreement(prev => ({...prev, accepted: true}));
            if (data.already) {
                // already accepted, just update the local state
            }
        } catch (e) {
            setError(e.message || 'Could not accept agreement.');
        } finally {
            setBusy(false);
        }
    };

    if (!agreement) {
        return <p className={styles.status}>Loading agreement…</p>;
    }

    if (!agreement.text && agreement.version === 0) {
        return (
            <section>
                <p className={styles.status}>No agreement has been set yet.</p>
            </section>
        );
    }

    const alreadyAccepted = agreement.accepted === true;

    return (
        <section className={styles.agreementSection}>
            <div className={styles.agreementContent}>
                <pre className={styles.agreementText}>{agreement.text}</pre>
            </div>
            <div className={styles.agreementFooter}>
                {alreadyAccepted ? (
                    <p className={styles.agreementAccepted}>
                        <CheckCircle size={16} /> You have accepted version {agreement.version} (updated{' '}
                        {new Date(agreement.updatedAt).toLocaleDateString()}).
                    </p>
                ) : (
                    <>
                        <p className={styles.agreementPrompt}>
                            To continue using the platform, please accept this agreement.
                        </p>
                        {error ? <p className={styles.error}>{error}</p> : null}
                        <button
                            className={styles.agreementAcceptBtn}
                            onClick={handleAccept}
                            disabled={busy}
                        >
                            {busy ? 'Accepting…' : `Accept v${agreement.version}`}
                        </button>
                    </>
                )}
            </div>
        </section>
    );
};

const SECTIONS = [
    {key: 'overview', label: 'Overview', icon: LayoutDashboard},
    {key: 'projects', label: 'My Projects', icon: FolderOpen},
    {key: 'uploads', label: 'Uploads', icon: HardDrive},
    {key: 'agreement', label: 'Agreement', icon: HeartHandshake},
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
    const [pendingUploadFile, setPendingUploadFile] = useState(null);
    const [showAgreeModal, setShowAgreeModal] = useState(false);
    const [agreeData, setAgreeData] = useState(null);
    const [agreeBusy, setAgreeBusy] = useState(false);
    const [agreeError, setAgreeError] = useState('');
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
    }, [user]);

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
        return () => {
            stale = true;
        };
    }, [user]);

    useEffect(() => {
        if (!user) return;
        let stale = false;
        getAccountSummary()
            .then(data => !stale && setAccount(data))
            .catch(() => {});
        return () => {
            stale = true;
        };
    }, [user]);

    const load = useCallback(() => {
        if (!user || tab === 'overview' || tab === 'uploads') {
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

    const refreshUsage = useCallback(() => {
        if (!user) return;
        api.quota().then(data => setQuota(data)).catch(() => {});
        api.stats().then(data => setStats(data.stats || null)).catch(() => {});
    }, [user]);

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
            refreshUsage();
        } catch (e) {
            setActionError(e.message);
        }
    };

    const publish = async id => {
        try {
            setActionError('');
            await api.publish(id);
            load();
            refreshUsage();
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
            refreshUsage();
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

    const createFromSb3 = useCallback(async file => {
        let created;
        try {
            created = await api.createProject({title: file.name.replace(/\.sb3$/i, '') || 'Untitled'});
            await api.uploadProject(created.id, file);
            return created;
        } catch (e) {
            if (created) {
                await api.deleteProject(created.id).catch(() => {});
            }
            throw e;
        }
    }, []);

    const uploadSb3 = async event => {
        const file = event.target.files[0];
        event.target.value = '';
        if (!file) return;
        if (!file.name.toLowerCase().endsWith('.sb3')) {
            setActionError('Choose a Scratch .sb3 project file.');
            return;
        }
        if (quota && quota.used >= quota.limit) {
            setActionError('Your weekly upload quota is full. Free up space or reset it before uploading.');
            return;
        }

        // Check agreement acceptance before allowing upload, show modal if needed
        try {
            const agreementData = await api.agreement();
            const ag = agreementData.agreement;
            if (ag.version > 0 && !ag.accepted) {
                setAgreeData(ag);
                setPendingUploadFile(file);
                setShowAgreeModal(true);
                return;
            }
        } catch (e) {
            // If the agreement endpoint fails, we let the upload proceed
            // rather than blocking on a network error.
        }

        try {
            setActionError('');
            setUploading(true);
            await createFromSb3(file);
            setTab('projects');
            load();
        } catch (e) {
            setActionError(e.message || 'Could not upload that project.');
        } finally {
            setUploading(false);
        }
    };

    const confirmAgreeAndUpload = useCallback(async () => {
        setAgreeBusy(true);
        setAgreeError('');
        try {
            await api.acceptAgreement();
            // Now proceed with the stored upload
            const file = pendingUploadFile;
            setPendingUploadFile(null);
            setShowAgreeModal(false);
            setAgreeData(null);
            // Run the upload
            setActionError('');
            setUploading(true);
            await createFromSb3(file);
            setTab('projects');
            load();
        } catch (e) {
            setAgreeError(e.message || 'Could not accept agreement.');
        } finally {
            setAgreeBusy(false);
            setUploading(false);
        }
    }, [pendingUploadFile, load, createFromSb3]);

    const cancelAgreeModal = useCallback(() => {
        setPendingUploadFile(null);
        setShowAgreeModal(false);
        setAgreeData(null);
        setAgreeError('');
    }, []);
    useEscape(showAgreeModal ? cancelAgreeModal : null);

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
                    <AlertTriangle size={14} /> You&apos;ve used {formatBytes(quota.used)} of
                    your {formatBytes(quota.limit)} upload quota
                    ({Math.round((quota.used / quota.limit) * 100)}%).{' '}
                    {quota.used >= quota.limit ?
                        'You cannot upload new projects until usage drops.' :
                        'Consider managing your projects to free up space.'}
                </p>
            ) : null}

            {showAgreeModal && agreeData ? (
                <div className={styles.confirmOverlay} onClick={cancelAgreeModal}>
                    <div
                        className={styles.agreeModal}
                        onClick={e => e.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                    >
                        <h2 className={styles.confirmTitle}>
                            Upload agreement v{agreeData.version}
                        </h2>
                        <div className={styles.agreeModalBody}>
                            <pre className={styles.agreementText}>{agreeData.text}</pre>
                        </div>
                        {agreeError ? (
                            <p className={styles.error}>{agreeError}</p>
                        ) : null}
                        <p className={styles.agreementPrompt}>
                            You must accept this agreement before you can upload projects.
                        </p>
                        <div className={styles.confirmActions}>
                            <button
                                className={styles.agreementAcceptBtn}
                                onClick={confirmAgreeAndUpload}
                                disabled={agreeBusy}
                            >
                                {agreeBusy ? 'Accepting…' : `Accept v${agreeData.version} & upload`}
                            </button>
                            <button
                                className={styles.secondary}
                                onClick={cancelAgreeModal}
                                disabled={agreeBusy}
                            >Cancel</button>
                        </div>
                    </div>
                </div>
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
                            />
                        ) : (
                            <p className={styles.status}>Loading…</p>
                        )
                    ) : tab === 'uploads' ? (
                        <UploadUsage
                            quota={quota}
                            onRefresh={refreshUsage}
                        />
                    ) : tab === 'agreement' ? (
                        <AgreementTab />
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
                                            <ProjectThumbnail
                                                project={project}
                                                lazy
                                            />
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
                                                        ) : null}
                                                        <button
                                                            className={styles.danger}
                                                            onClick={() => deleteProject(project.id)}
                                                        >
                                                            <Trash2 size={14} />
                                                            Delete
                                                        </button>
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
