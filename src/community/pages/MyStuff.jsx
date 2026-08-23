import React, {useEffect, useState, useCallback, useRef} from 'react';
import {Link, useSearchParams} from 'react-router-dom';
import {
    Plus, Trash2, Heart, ThumbsDown, Play, Upload, Star, MoreHorizontal, Pencil, ExternalLink, HardDrive,
    SlidersHorizontal, Coins, Eye, TrendingUp, Wallet, HeartHandshake, FolderOpen, LayoutDashboard,
    RefreshCw, AlertTriangle, CheckCircle, Library, Layers3
} from 'lucide-react';
import api, {editorUrl, projectUrl} from '../api';
import {formatBytes} from '../format';
import {getAccountSummary} from '../../lib/rotur/client.js';
import {useUser} from '../UserContext.jsx';
import Button from '../components/ui/Button.jsx';
import Dropdown from '../components/ui/Dropdown.jsx';
import IconButton from '../components/ui/IconButton.jsx';
import Modal from '../components/ui/Modal.jsx';
import ProjectThumbnail from '../components/ProjectThumbnail.jsx';
import CollectionSaveModal from '../components/CollectionSaveModal.jsx';
import MyStuffSpaces from '../components/MyStuffSpaces.jsx';
import StatChart, {historyRows} from '../components/StatChart.jsx';
import {CREDIT_PACKS, openCreditCheckout} from '../credits';
import Sidebar from '../components/Sidebar.jsx';
import useLatest from '../use-latest.js';
import styles from './MyStuff.module.css';

const fmt = value => (Number(value) || 0).toLocaleString();
const fmtCredits = value => Math.round((Number(value) || 0) * 100) / 100;

const uploadErrorTarget = (agreementAccepted, error) => {
    const message = error && error.message;
    return agreementAccepted ? {
        actionError: message || 'Could not upload that project.',
        agreementError: ''
    } : {
        actionError: '',
        agreementError: message || 'Could not accept agreement.'
    };
};

const uploadProgressLabel = (loaded, total) => {
    if (!(total > 0)) return 'Uploading…';
    const percent = Math.min(100, Math.max(0, Math.round((loaded / total) * 100)));
    return percent >= 100 ? 'Processing on server…' : `Uploading ${percent}%`;
};

const shouldRefreshProjectsAfterUploadError = error =>
    Boolean(error && error.code === 'upload_processing_timeout');

const visibilityLabel = project => {
    const v = project.visibility || (project.shared ? 'public' : 'private');
    if (v === 'public') return 'Shared';
    if (v === 'unlisted') return 'Unlisted';
    return 'Draft';
};

const Overview = ({stats, account, quota}) => {
    const [buyBusy, setBuyBusy] = useState(false);
    const [buyError, setBuyError] = useState('');
    const buyInFlight = useRef(false);
    const weekViews = historyRows(stats.viewHistory, 7).reduce((sum, row) => sum + row.value, 0);
    const pct = quota ? (quota.used / quota.limit) * 100 : 0;

    const buyCredits = async () => {
        if (buyInFlight.current) return;
        const releaseBuy = () => {
            buyInFlight.current = false;
        };
        buyInFlight.current = true;
        setBuyBusy(true);
        setBuyError('');
        try {
            await openCreditCheckout(CREDIT_PACKS[1]);
        } catch (e) {
            setBuyError(e.needsReauth ?
                'Your current login cannot buy credits. Log out and back in, then try again.' :
                (e.message || 'Could not open checkout.'));
        } finally {
            releaseBuy();
            setBuyBusy(false);
        }
    };
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
                        <Button
                            variant="secondary"
                            className={styles.dashBuy}
                            onClick={buyCredits}
                            busy={buyBusy}
                            busyLabel="Opening…"
                        >Buy credits</Button>
                        {buyError ? <span className={styles.error}>{buyError}</span> : null}
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
    const resetInFlight = useRef(false);

    const pct = quota ? (quota.used / quota.limit) * 100 : 0;

    const dailyMap = Object.fromEntries((quota?.daily || []).map(d => [d.day, d.bytes]));

    // shared boilerplate for both reset actions
    const runReset = useCallback(async (fn, errorPrefix) => {
        if (resetInFlight.current) return;
        const releaseReset = () => {
            resetInFlight.current = false;
        };
        resetInFlight.current = true;
        setResetting(true);
        setResetError('');
        try {
            await fn();
        } catch (e) {
            setResetError(e.message || errorPrefix);
        } finally {
            releaseReset();
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
                        <Button
                            variant="secondary"
                            className={styles.secondary}
                            onClick={() => setResetError('')}
                        >Dismiss</Button>
                    </div>
                ) : (
                    <Button
                        variant="primary"
                        className={styles.uploadResetBtn}
                        onClick={handleReset}
                        busy={resetting}
                        busyLabel="Starting…"
                    >
                        <RefreshCw size={16} />
                        Reset quota
                    </Button>
                )}
            </div>

            {showConfirm ? (
                <Modal
                    title="Reset upload quota?"
                    onClose={dismiss}
                    dismissDisabled={resetting}
                    actions={(
                        <React.Fragment>
                            <Button
                                variant="secondary"
                                className={styles.secondary}
                                onClick={dismiss}
                                disabled={resetting}
                            >Cancel</Button>
                            <Button
                                variant="primary"
                                className={styles.uploadResetBtn}
                                onClick={confirmReset}
                                busy={resetting}
                                busyLabel="Resetting…"
                            >
                                {`Spend ${amount} credits`}
                            </Button>
                        </React.Fragment>
                    )}
                >
                    <p className={styles.confirmText}>
                        This will cost <strong>{amount} credits</strong>
                        {payTo ? <> sent to <code>{payTo}</code></> : ''}.
                        Your upload usage will be reset to zero. Continue?
                    </p>
                </Modal>
            ) : null}
        </section>
    );
};

const AgreementTab = () => {
    const [agreement, setAgreement] = useState(null);
    const [loadError, setLoadError] = useState(false);
    const [attempt, setAttempt] = useState(0);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        let stale = false;
        setAgreement(null);
        setLoadError(false);
        api.agreement()
            .then(data => {
                if (!stale) setAgreement(data.agreement);
            })
            .catch(() => {
                if (!stale) setLoadError(true);
            });
        return () => {
            stale = true;
        };
    }, [attempt]);

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

    if (loadError) {
        return (
            <p className={styles.status}>
                Could not load the agreement.{' '}
                <button
                    type="button"
                    className={styles.secondary}
                    onClick={() => setAttempt(value => value + 1)}
                >Try again</button>
            </p>
        );
    }

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
                        <Button
                            variant="primary"
                            className={styles.agreementAcceptBtn}
                            onClick={handleAccept}
                            busy={busy}
                            busyLabel="Accepting…"
                        >
                            {`Accept v${agreement.version}`}
                        </Button>
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
    {key: 'collections', label: 'Collections', icon: Library},
    {key: 'spaces', label: 'Spaces', icon: Layers3}
];
const getMyStuffSection = value => {
    if (SECTIONS.some(section => section.key === value)) return value;
    return 'overview';
};

const MyStuff = () => {
    const {user, loading, login} = useUser();
    const [searchParams, setSearchParams] = useSearchParams();
    const tab = getMyStuffSection(searchParams.get('section'));
    const setTab = nextTab => {
        const next = new URLSearchParams(searchParams);
        if (nextTab === 'overview') next.delete('section');
        else next.set('section', nextTab);
        setSearchParams(next);
    };
    const [projects, setProjects] = useState(null);
    const [featuredProject, setFeaturedProject] = useState(user ? user.featuredProject : '');
    const [uploading, setUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState('');
    const [actionError, setActionError] = useState('');
    const [failed, setFailed] = useState(false);
    const [collectionProject, setCollectionProject] = useState(null);
    const [quota, setQuota] = useState(null);
    const [stats, setStats] = useState(null);
    const [account, setAccount] = useState(null);
    const [pendingUploadFile, setPendingUploadFile] = useState(null);
    const [showAgreeModal, setShowAgreeModal] = useState(false);
    const [agreeData, setAgreeData] = useState(null);
    const [agreeBusy, setAgreeBusy] = useState(false);
    const [agreeError, setAgreeError] = useState('');
    const [mySpaces, setMySpaces] = useState(null);
    const [libraryProjects, setLibraryProjects] = useState(null);
    const [spacesFailed, setSpacesFailed] = useState(false);
    const [libraryFailed, setLibraryFailed] = useState(false);
    const [directoriesLoading, setDirectoriesLoading] = useState(false);
    const [projectAction, setProjectAction] = useState('');
    const [deleteConfirmProject, setDeleteConfirmProject] = useState(null);
    const uploadInput = useRef(null);
    const beginProjectLoad = useLatest();
    const beginDirectoryLoad = useLatest();
    const username = user ? user.username : '';
    const accountContextRef = useRef(username);
    accountContextRef.current = username;
    const actionLocks = useRef(new Set());

    const beginAccountAction = name => {
        const key = `${accountContextRef.current}\u0000${name}`;
        if (actionLocks.current.has(key)) return null;
        actionLocks.current.add(key);
        return key;
    };
    const releaseAccountAction = key => actionLocks.current.delete(key);

    useEffect(() => {
        beginDirectoryLoad();
        setMySpaces(null);
        setLibraryProjects(null);
        setSpacesFailed(false);
        setLibraryFailed(false);
        setDirectoriesLoading(false);
        setProjectAction('');
        setDeleteConfirmProject(null);
        setUploading(false);
        setUploadStatus('');
        setPendingUploadFile(null);
        setShowAgreeModal(false);
        setAgreeData(null);
        setAgreeBusy(false);
        setAgreeError('');
        setCollectionProject(null);
        setActionError('');
    }, [beginDirectoryLoad, username]);

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
        const fresh = beginProjectLoad();
        if (!user || tab !== 'projects') {
            return;
        }
        setProjects(null);
        setFailed(false);
        api.myProjects(user.username)
            .then(fresh(data => setProjects(data.projects || [])))
            .catch(fresh(() => setFailed(true)));
    }, [beginProjectLoad, user, tab]);

    useEffect(() => {
        load();
    }, [load]);

    const loadDirectories = useCallback(() => {
        const fresh = beginDirectoryLoad();
        setDirectoriesLoading(true);
        setSpacesFailed(false);
        setLibraryFailed(false);
        Promise.allSettled([api.mySpaces(), api.library()]).then(fresh(([spacesResult, libraryResult]) => {
            if (spacesResult.status === 'fulfilled') setMySpaces(spacesResult.value.spaces || []);
            else setSpacesFailed(true);
            if (libraryResult.status === 'fulfilled') setLibraryProjects(libraryResult.value.projects || []);
            else setLibraryFailed(true);
            setDirectoriesLoading(false);
        }));
    }, [beginDirectoryLoad]);

    useEffect(() => {
        if (!user || !['collections', 'spaces'].includes(tab)) return;
        if (directoriesLoading || spacesFailed || (tab === 'collections' && libraryFailed)) return;
        if (mySpaces !== null && (tab === 'spaces' || libraryProjects !== null)) return;
        loadDirectories();
    }, [directoriesLoading, libraryFailed, libraryProjects, loadDirectories, mySpaces, spacesFailed, tab, user]);

    const retryDirectories = () => {
        setMySpaces(null);
        setLibraryProjects(null);
        loadDirectories();
    };

    const refreshUsage = useCallback(() => {
        if (!user) return;
        const context = accountContextRef.current;
        api.quota()
            .then(data => {
                if (accountContextRef.current === context) setQuota(data);
            })
            .catch(() => {});
        api.stats()
            .then(data => {
                if (accountContextRef.current === context) setStats(data.stats || null);
            })
            .catch(() => {});
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
        const actionKey = beginAccountAction('project');
        if (!actionKey) return;
        const context = accountContextRef.current;
        setProjectAction(`visibility:${id}`);
        try {
            setActionError('');
            await api.unpublish(id);
            if (accountContextRef.current !== context) return;
            await clearFeaturedIf(id);
            load();
            refreshUsage();
        } catch (e) {
            if (accountContextRef.current === context) {
                setActionError(e.message || 'Could not unshare this project.');
            }
        } finally {
            releaseAccountAction(actionKey);
            if (accountContextRef.current === context) setProjectAction('');
        }
    };

    const publish = async id => {
        const actionKey = beginAccountAction('project');
        if (!actionKey) return;
        const context = accountContextRef.current;
        setProjectAction(`visibility:${id}`);
        try {
            setActionError('');
            await api.publish(id);
            if (accountContextRef.current !== context) return;
            load();
            refreshUsage();
        } catch (e) {
            if (accountContextRef.current === context) {
                setActionError(e.message || 'Could not share this project.');
            }
        } finally {
            releaseAccountAction(actionKey);
            if (accountContextRef.current === context) setProjectAction('');
        }
    };

    const deleteProject = async id => {
        const actionKey = beginAccountAction('project');
        if (!actionKey) return;
        const context = accountContextRef.current;
        setProjectAction(`delete:${id}`);
        try {
            setActionError('');
            await api.deleteProject(id);
            if (accountContextRef.current !== context) return;
            await clearFeaturedIf(id);
            load();
            refreshUsage();
        } catch (e) {
            if (accountContextRef.current === context) {
                setActionError(e.message || 'Could not delete this project.');
            }
        } finally {
            releaseAccountAction(actionKey);
            if (accountContextRef.current === context) {
                setProjectAction('');
                setDeleteConfirmProject(null);
            }
        }
    };

    const toggleFeatured = async id => {
        const actionKey = beginAccountAction('project');
        if (!actionKey) return;
        const context = accountContextRef.current;
        const next = featuredProject === id ? '' : id;
        setProjectAction(`feature:${id}`);
        try {
            setActionError('');
            await api.updateProfile({featuredProject: next});
            if (accountContextRef.current === context) setFeaturedProject(next);
        } catch (e) {
            if (accountContextRef.current === context) {
                setActionError(e.message || 'Could not update the featured project.');
            }
        } finally {
            releaseAccountAction(actionKey);
            if (accountContextRef.current === context) setProjectAction('');
        }
    };

    const createFromSb3 = useCallback(async (file, onUploadProgress) => {
        let created;
        try {
            created = await api.createProject({title: file.name.replace(/\.sb3$/i, '') || 'Untitled'});
            let uploadFile = file;
            try {
                uploadFile = await api.prepareSparseProjectUpload(created.id, file);
            } catch (e) {
                // The server can still validate and store the original archive if sparse preparation fails.
            }
            await api.uploadProject(created.id, uploadFile, null, onUploadProgress);
            return created;
        } catch (e) {
            if (created && e.code !== 'upload_processing_timeout') {
                await api.deleteProject(created.id).catch(() => {});
            }
            throw e;
        }
    }, []);

    const uploadSb3 = async event => {
        const file = event.target.files[0];
        const context = accountContextRef.current;
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
        const actionKey = beginAccountAction('upload');
        if (!actionKey) return;

        setActionError('');
        setUploading(true);
        setUploadStatus('Uploading…');

        // Check agreement acceptance before allowing upload, show modal if needed
        try {
            const agreementData = await api.agreement();
            if (accountContextRef.current !== context) {
                releaseAccountAction(actionKey);
                return;
            }
            const ag = agreementData.agreement;
            if (ag.version > 0 && !ag.accepted) {
                setAgreeData(ag);
                setPendingUploadFile(file);
                setShowAgreeModal(true);
                setUploading(false);
                setUploadStatus('');
                releaseAccountAction(actionKey);
                return;
            }
        } catch (e) {
            if (accountContextRef.current === context) {
                setActionError('Could not check the community agreement. Try the upload again.');
                setUploading(false);
                setUploadStatus('');
            }
            releaseAccountAction(actionKey);
            return;
        }

        try {
            await createFromSb3(file, (loaded, total) => {
                if (accountContextRef.current === context) {
                    setUploadStatus(uploadProgressLabel(loaded, total));
                }
            });
            if (accountContextRef.current !== context) return;
            setTab('projects');
            load();
        } catch (e) {
            if (accountContextRef.current === context) {
                setActionError(e.message || 'Could not upload that project.');
                if (shouldRefreshProjectsAfterUploadError(e)) {
                    setTab('projects');
                    load();
                }
            }
        } finally {
            releaseAccountAction(actionKey);
            if (accountContextRef.current === context) {
                setUploading(false);
                setUploadStatus('');
            }
        }
    };

    const confirmAgreeAndUpload = useCallback(async () => {
        const actionKey = beginAccountAction('upload');
        if (!actionKey) return;
        const context = accountContextRef.current;
        setAgreeBusy(true);
        setAgreeError('');
        let agreementAccepted = false;
        try {
            await api.acceptAgreement();
            if (accountContextRef.current !== context) return;
            agreementAccepted = true;
            // Now proceed with the stored upload
            const file = pendingUploadFile;
            setPendingUploadFile(null);
            setShowAgreeModal(false);
            setAgreeData(null);
            // Run the upload
            setActionError('');
            setUploading(true);
            setUploadStatus('Uploading…');
            if (!file) throw new Error('Choose the project file again.');
            await createFromSb3(file, (loaded, total) => {
                if (accountContextRef.current === context) {
                    setUploadStatus(uploadProgressLabel(loaded, total));
                }
            });
            if (accountContextRef.current !== context) return;
            setTab('projects');
            load();
        } catch (e) {
            if (accountContextRef.current === context) {
                const target = uploadErrorTarget(agreementAccepted, e);
                if (target.actionError) setActionError(target.actionError);
                if (target.agreementError) setAgreeError(target.agreementError);
                if (agreementAccepted && shouldRefreshProjectsAfterUploadError(e)) {
                    setTab('projects');
                    load();
                }
            }
        } finally {
            releaseAccountAction(actionKey);
            if (accountContextRef.current === context) {
                setAgreeBusy(false);
                setUploading(false);
                setUploadStatus('');
            }
        }
    }, [pendingUploadFile, load, createFromSb3]);

    const cancelAgreeModal = useCallback(() => {
        setPendingUploadFile(null);
        setShowAgreeModal(false);
        setAgreeData(null);
        setAgreeError('');
    }, []);
    const deleteBusy = deleteConfirmProject && projectAction === `delete:${deleteConfirmProject.id}`;
    const dismissDeleteConfirm = useCallback(() => {
        if (!projectAction) setDeleteConfirmProject(null);
    }, [projectAction]);

    if (loading) {
        return <main className={styles.page}><p className={styles.status}>Loading…</p></main>;
    }
    if (!user) {
        return (
            <main className={styles.page}>
                <p className={styles.status}>Sign in to see your projects. <Button onClick={login}>Sign in</Button></p>
            </main>
        );
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
                    <Button
                        variant="primary"
                        className={styles.uploadButton}
                        busy={uploading}
                        busyLabel={uploadStatus || 'Uploading…'}
                        onClick={() => uploadInput.current && uploadInput.current.click()}
                    >
                        <Upload size={16} />
                        Upload .sb3
                    </Button>
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
                <Modal
                    className={styles.agreeModal}
                    title={`Upload agreement v${agreeData.version}`}
                    onClose={cancelAgreeModal}
                    dismissDisabled={agreeBusy}
                    actions={(
                        <React.Fragment>
                            <Button
                                variant="secondary"
                                className={styles.secondary}
                                onClick={cancelAgreeModal}
                                disabled={agreeBusy}
                            >Cancel</Button>
                            <Button
                                variant="primary"
                                className={styles.agreementAcceptBtn}
                                onClick={confirmAgreeAndUpload}
                                busy={agreeBusy}
                                busyLabel="Accepting…"
                            >
                                {`Accept v${agreeData.version} & upload`}
                            </Button>
                        </React.Fragment>
                    )}
                >
                    <div className={styles.agreeModalBody}>
                        <pre className={styles.agreementText}>{agreeData.text}</pre>
                    </div>
                    {agreeError ? <p className={styles.error}>{agreeError}</p> : null}
                    <p className={styles.agreementPrompt}>
                        You must accept this agreement before you can upload projects.
                    </p>
                </Modal>
            ) : null}

            {deleteConfirmProject ? (
                <Modal
                    title="Delete project?"
                    onClose={dismissDeleteConfirm}
                    dismissDisabled={Boolean(deleteBusy)}
                    actions={(
                        <React.Fragment>
                            <Button
                                variant="secondary"
                                className={styles.secondary}
                                disabled={Boolean(deleteBusy)}
                                onClick={dismissDeleteConfirm}
                            >Cancel</Button>
                            <Button
                                variant="danger"
                                className={`${styles.secondary} ${styles.danger}`}
                                busy={Boolean(deleteBusy)}
                                busyLabel="Deleting…"
                                onClick={() => deleteProject(deleteConfirmProject.id)}
                            >Delete project</Button>
                        </React.Fragment>
                    )}
                >
                    <p className={styles.confirmText}>
                        <strong>{deleteConfirmProject.title}</strong> will be deleted permanently.
                        {' '}This cannot be undone.
                    </p>
                </Modal>
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
                        <AgreementTab key={username} />
                    ) : tab === 'collections' || tab === 'spaces' ? (
                        <MyStuffSpaces
                            key={tab}
                            mode={tab}
                            spaces={mySpaces}
                            libraryProjects={libraryProjects}
                            username={user.username}
                            error={spacesFailed || (tab === 'collections' && libraryFailed)}
                            onRetry={retryDirectories}
                        />
                    ) : failed ? (
                        <p className={styles.status}>
                            Couldn&apos;t load.{' '}
                            <button
                                type="button"
                                className={styles.secondary}
                                onClick={load}
                            >Try again</button>
                        </p>
                    ) : projects === null ? (
                        <p className={styles.status}>Loading…</p>
                    ) : projects.length ? (
                        <div className={styles.list}>
                            {projects.map(project => {
                                const featured = featuredProject === project.id;
                                const visibilityBusy = projectAction === `visibility:${project.id}`;
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
                                                <Button
                                                    variant="secondary"
                                                    className={styles.secondary}
                                                    disabled={Boolean(projectAction)}
                                                    busy={visibilityBusy}
                                                    busyLabel="Updating…"
                                                    onClick={() => unpublish(project.id)}
                                                >
                                                    Unshare
                                                </Button>
                                            ) : (
                                                <Button
                                                    variant="secondary"
                                                    className={styles.secondary}
                                                    disabled={Boolean(projectAction)}
                                                    busy={visibilityBusy}
                                                    busyLabel="Updating…"
                                                    onClick={() => publish(project.id)}
                                                >
                                                    Share
                                                </Button>
                                            )}
                                            <Dropdown
                                                className={styles.actionMenuWrap}
                                                menuClassName={styles.actionMenu}
                                                renderTrigger={({open, toggle}) => (
                                                    <IconButton
                                                        variant="secondary"
                                                        className={styles.moreButton}
                                                        label={`Actions for ${project.title}`}
                                                        aria-expanded={open}
                                                        aria-haspopup="menu"
                                                        disabled={Boolean(projectAction)}
                                                        onClick={toggle}
                                                    >
                                                        <MoreHorizontal size={18} />
                                                    </IconButton>
                                                )}
                                            >
                                                {({close}) => (
                                                    <React.Fragment>
                                                        <a
                                                            href={editorUrl({platformProject: project.id})}
                                                            onClick={close}
                                                        >
                                                            <Pencil size={14} />
                                                            Open in editor
                                                        </a>
                                                        <Link to={projectUrl(project.id)} onClick={close}>
                                                            <ExternalLink size={14} />
                                                            Project page
                                                        </Link>
                                                        <div className={styles.menuSeparator} role="separator" />
                                                        <Link to={`/mystuff/project/${project.id}`} onClick={close}>
                                                            <SlidersHorizontal size={14} />
                                                            Manage &amp; analytics
                                                        </Link>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                close();
                                                                setCollectionProject(project);
                                                            }}
                                                        >
                                                            <Library size={14} />
                                                            Save to collection
                                                        </button>
                                                        {project.shared ? (
                                                            <button
                                                                type="button"
                                                                disabled={Boolean(projectAction)}
                                                                onClick={() => {
                                                                    close();
                                                                    toggleFeatured(project.id);
                                                                }}
                                                            >
                                                                <Star
                                                                    size={14}
                                                                    fill={featured ? 'currentColor' : 'none'}
                                                                />
                                                                {featured ?
                                                                    'Remove profile feature' : 'Feature on profile'}
                                                            </button>
                                                        ) : null}
                                                        <div className={styles.menuSeparator} role="separator" />
                                                        <button
                                                            type="button"
                                                            className={styles.danger}
                                                            disabled={Boolean(projectAction)}
                                                            onClick={() => {
                                                                close();
                                                                setDeleteConfirmProject(project);
                                                            }}
                                                        >
                                                            <Trash2 size={14} />
                                                            Delete
                                                        </button>
                                                    </React.Fragment>
                                                )}
                                            </Dropdown>
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
            {collectionProject ? (
                <CollectionSaveModal
                    project={collectionProject}
                    onClose={() => setCollectionProject(null)}
                />
            ) : null}
        </main>
    );
};

export {
    getMyStuffSection,
    shouldRefreshProjectsAfterUploadError,
    uploadErrorTarget,
    uploadProgressLabel
};
export default MyStuff;
