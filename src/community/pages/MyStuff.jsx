import {getCommunityLocale} from '../locale.js';
import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
/* eslint-disable max-len */
import React, {useEffect, useState, useCallback, useRef} from 'react';
import {Link, useSearchParams} from 'react-router-dom';
import {
    Plus, Trash2, Heart, ThumbsDown, Play, Upload, Star, MoreHorizontal, Pencil, ExternalLink, HardDrive,
    SlidersHorizontal, Coins, Eye, TrendingUp, Wallet, HeartHandshake, FolderOpen, LayoutDashboard,
    RefreshCw, AlertTriangle, Library, Layers3, RotateCcw, Package, Image, Palette, Bookmark, Clock3
} from 'lucide-react';
import api, {editorUrl, projectUrl} from '../api';
import {formatBytes, formatCountdown, formatDate} from '../format';
import {getAccountSummary} from '../../lib/rotur/client.js';
import {useUser} from '../UserContext.jsx';
import Button from '../components/ui/Button.jsx';
import CardGrid from '../components/ui/CardGrid.jsx';
import ConfirmModal from '../components/ui/ConfirmModal.jsx';
import Dropdown from '../components/ui/Dropdown.jsx';
import EmptyState, {SignInPrompt} from '../components/ui/EmptyState.jsx';
import IconButton from '../components/ui/IconButton.jsx';
import Modal from '../components/ui/Modal.jsx';
import Notice from '../components/ui/Notice.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import SectionHeading from '../components/ui/SectionHeading.jsx';
import StatusMessage from '../components/ui/StatusMessage.jsx';
import ProjectThumbnail from '../components/ProjectThumbnail.jsx';
import CollectionSaveModal from '../components/CollectionSaveModal.jsx';
import MyStuffSpaces from '../components/MyStuffSpaces.jsx';
import MyStuffThemes from '../components/MyStuffThemes.jsx';
import MyStuffLibrary from '../components/MyStuffLibrary.jsx';
import SharedProjects from '../components/SharedProjects.jsx';
import StatChart, {historyRows} from '../components/StatChart.jsx';
import Markdown from '../components/Markdown.jsx';
import {CREDIT_PACKS, openCreditCheckout} from '../credits';
import Sidebar from '../components/Sidebar.jsx';
import useLatest from '../use-latest.js';
import styles from './MyStuff.module.css';

const fmt = value => (Number(value) || 0).toLocaleString(getCommunityLocale());
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

const replaceProjectById = (projects, replacement) =>
    (projects || []).map(project => (project.id === replacement.id ? replacement : project));
const removeProjectById = (projects, id) =>
    (projects || []).filter(project => project.id !== id);
const trashPurgeConfirmation = project => ({
    title: 'Delete forever?',
    body: `Permanently delete "${project.title}"? This cannot be undone.`,
    action: 'Delete forever'
});

const visibilityLabel = project => {
    if (project.contributionOnly) return 'Contribution only';
    const v = project.visibility || (project.shared ? 'public' : 'private');
    if (v === 'public') return 'Shared';
    if (v === 'unlisted') return 'Unlisted';
    return 'Draft';
};

const Overview = ({stats, account, quota, username, onNavigate}) => {
    const {text: communityText} = useCommunityText();
    const [buyBusy, setBuyBusy] = useState(false);
    const [buyError, setBuyError] = useState('');
    const [recent, setRecent] = useState(null);
    const [recentFailed, setRecentFailed] = useState(false);
    const buyInFlight = useRef(false);
    const rows14 = historyRows(stats.viewHistory, 14);
    const weekViews = rows14.slice(7).reduce((sum, row) => sum + row.value, 0);
    const prevWeekViews = rows14.slice(0, 7).reduce((sum, row) => sum + row.value, 0);
    const trend = prevWeekViews > 0 ?
        Math.round(((weekViews - prevWeekViews) / prevWeekViews) * 100) :
        (weekViews > 0 ? 100 : 0);
    const pct = quota ? (quota.used / quota.limit) * 100 : 0;
    const go = section => {
        if (onNavigate) onNavigate(section);
    };

    useEffect(() => {
        if (!username) {
            setRecent(null);
            setRecentFailed(false);
            return;
        }
        let stale = false;
        setRecent(null);
        setRecentFailed(false);
        api.myProjectPage(username, {limit: 4})
            .then(data => {
                if (!stale) setRecent(data.projects || []);
            })
            .catch(() => {
                if (!stale) setRecentFailed(true);
            });
        return () => {
            stale = true;
        };
    }, [username]);

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
        <section className={styles.overview}>
            <div className={styles.ovMain}>
                <div className={styles.ovCard}>
                    <SectionHeading
                        icon={TrendingUp}
                        title={communityText('Performance')}
                        className={styles.cardHeading}
                        actions={weekViews > 0 || prevWeekViews > 0 ? (
                            <span className={trend < 0 ? styles.ovTrendDown : styles.ovTrendUp}>
                                <TrendingUp size={14} />
                                {prevWeekViews > 0 ?
                                    communityText('{value1}{value2}% vs prior week', {value1: trend >= 0 ? '+' : '', value2: trend}) :
                                    communityText('New this week')}
                            </span>
                        ) : null}
                    />
                    <div className={styles.ovStats}>
                        <div className={styles.ovStat}>
                            <Eye size={16} aria-hidden="true" />
                            <span className={styles.ovStatNum}>{fmt(weekViews)}</span>
                            <span className={styles.ovStatLabel}>{communityText('Views this week')}</span>
                        </div>
                        <div className={styles.ovStat}>
                            <TrendingUp size={16} aria-hidden="true" />
                            <span className={styles.ovStatNum}>{fmt(stats.totalViews)}</span>
                            <span className={styles.ovStatLabel}>{communityText('Total views')}</span>
                        </div>
                        <div className={styles.ovStat}>
                            <Heart size={16} aria-hidden="true" />
                            <span className={styles.ovStatNum}>{fmt(stats.totalHearts)}</span>
                            <span className={styles.ovStatLabel}>{communityText('Hearts')}</span>
                        </div>
                    </div>
                    <StatChart
                        title=""
                        rows={rows14}
                        accent="#4C97FF"
                        emptyText="No views yet. Share a project to get started."
                    />
                    <p className={styles.ovCaption}>{communityText('Views over the last 2 weeks')}</p>
                </div>
                <div className={styles.ovCard}>
                    <SectionHeading
                        icon={FolderOpen}
                        title={communityText('Recent projects')}
                        className={styles.cardHeading}
                        actions={stats.projectCount > 0 ? (
                            <span className={styles.ovCount}>
                                {communityText('{value1} total, {value2} shared', {value1: fmt(stats.projectCount), value2: fmt(stats.sharedCount)})}
                            </span>
                        ) : null}
                    />
                    {recentFailed ? (
                        <StatusMessage compact error>{communityText('Could not load recent projects.')}</StatusMessage>
                    ) : recent === null ? (
                        <StatusMessage compact>{communityText('Loading projects…')}</StatusMessage>
                    ) : recent.length ? (
                        <div className={styles.ovRecentList}>
                            {recent.map(project => (
                                <Link
                                    key={project.id}
                                    to={projectUrl(project)}
                                    className={styles.ovRecentItem}
                                >
                                    <span className={styles.ovRecentThumb}>
                                        <ProjectThumbnail project={project} lazy />
                                    </span>
                                    <span className={styles.ovRecentInfo}>
                                        <strong className={styles.ovRecentTitle}>{project.title}</strong>
                                        <span className={styles.ovRecentMeta}>
                                            {communityText('{value1} · {value2} views · {value3} hearts', {value1: visibilityLabel(project), value2: fmt(project.views || 0), value3: fmt(project.loveCount || 0)})}
                                        </span>
                                    </span>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <EmptyState
                            compact
                            icon={FolderOpen}
                            title={communityText('No projects yet')}
                            action={(
                                <Button variant="primary" as="a" href={editorUrl()}>
                                    <Plus size={14} />{communityText('Start a new project')}</Button>
                            )}
                        >
                            {communityText('You have not created any projects yet.')}
                        </EmptyState>
                    )}
                    <div className={styles.ovCardActions}>
                        <Button onClick={() => go('projects')}>
                            <FolderOpen size={14} />{communityText('View all projects')}</Button>
                    </div>
                </div>
            </div>
            <div className={styles.ovSide}>
                <div className={styles.ovCard}>
                    <SectionHeading icon={Wallet} title={communityText('Wallet')} className={styles.cardHeading} />
                    {account && account.balance !== null ? (
                        <div className={styles.ovWalletTop}>
                            <span className={styles.ovWalletBalance}>
                                <Wallet size={16} aria-hidden="true" />
                                {fmtCredits(account.balance)}
                            </span>
                            <span className={styles.ovStatLabel}>{communityText('Balance')}</span>
                            <Button
                                onClick={buyCredits}
                                busy={buyBusy}
                                busyLabel={communityText('Opening…')}
                            ><Coins size={14} />{communityText('Buy credits')}</Button>
                            {buyError ? <Notice variant="error">{buyError}</Notice> : null}
                        </div>
                    ) : null}
                    <div className={styles.ovWalletRows}>
                        {stats.totalRevenue > 0 ? (
                            <div className={styles.ovWalletRow}>
                                <span><Coins size={15} aria-hidden="true" />{communityText('Credits earned')}</span>
                                <strong>{fmtCredits(stats.totalRevenue)}</strong>
                            </div>
                        ) : null}
                        {account && account.donationsReceived > 0 ? (
                            <div className={styles.ovWalletRow}>
                                <span><HeartHandshake size={15} aria-hidden="true" />{communityText('Donations received')}</span>
                                <strong>{fmtCredits(account.donationsReceived)}</strong>
                            </div>
                        ) : null}
                        {!(stats.totalRevenue > 0) &&
                            !(account && account.donationsReceived > 0) &&
                            !(account && account.balance !== null) ? (
                                <EmptyState compact icon={Coins} title={communityText('No earnings yet')}>
                                    {communityText('Offer a project for purchase so people can support your work.')}
                                </EmptyState>
                            ) : null}
                    </div>
                </div>
                {quota ? (
                    <div className={styles.ovCard}>
                        <SectionHeading icon={HardDrive} title={communityText('Storage')} className={styles.cardHeading} />
                        <div className={styles.ovStorageTop}>
                            <span className={styles.ovStatNum}>{formatBytes(quota.used)}</span>
                            <span className={styles.ovStatLabel}>{communityText('of {value1} used', {value1: formatBytes(quota.limit)})}</span>
                        </div>
                        <div className={styles.quotaBarBg}>
                            <div
                                className={styles.quotaBarFill}
                                style={{width: `${Math.min(100, pct)}%`}}
                            />
                        </div>
                        <span className={pct >= 80 ? styles.quotaWarn : styles.ovStatLabel}>
                            {pct >= 80 ? <AlertTriangle size={14} /> : null}{communityText('{value1}% full', {value1: Math.round(pct)})}</span>
                        <div className={styles.ovCardActions}>
                            <Button onClick={() => go('uploads')}>
                                <HardDrive size={14} />{communityText('Manage uploads')}</Button>
                        </div>
                    </div>
                ) : null}
            </div>
        </section>
    );
};

const Inventory = ({items, error, onRetry}) => {
    const {text: communityText} = useCommunityText();
    return (<section className={styles.inventory}>
        <SectionHeading
            icon={Package}
            title={communityText('Inventory')}
            lead={communityText('Items collected across MistWarp games.')}
            actions={items ? (
                <span className={styles.inventoryCount}>
                    {items.length === 1 ? communityText('1 item type') : communityText('{value1} item types', {value1: items.length})}
                </span>
            ) : null}
        />
        {error ? (
            <StatusMessage error onRetry={onRetry}>{communityText('Could not load your inventory.')}</StatusMessage>
        ) : items === null ? (
            <StatusMessage>{communityText('Loading inventory…')}</StatusMessage>
        ) : items.length ? (
            <CardGrid min={150}>
                {items.map(item => (
                    <Link
                        key={item.id}
                        to={projectUrl(item.originProjectId)}
                        className={styles.inventoryItem}
                        aria-label={communityText('{value1}, from {value2}, quantity {value3}', {value1: item.name, value2: item.originProjectTitle, value3: item.quantity})}
                    >
                        {item.visual && item.visual.url ? (
                            <img src={item.visual.url} alt="" loading="lazy" />
                        ) : (
                            <Image className={styles.inventoryFallback} aria-hidden="true" />
                        )}
                        <span className={styles.inventoryQuantity}>×{item.quantity}</span>
                        <span className={styles.inventoryDetails}>
                            <strong>{item.name}</strong>
                            <small>{communityText('From {value1}', {value1: item.originProjectTitle})}</small>
                        </span>
                    </Link>
                ))}
            </CardGrid>
        ) : (
            <EmptyState icon={Package} title={communityText('Your inventory is empty')}>
                {communityText('Items you collect in MistWarp games will appear here.')}
            </EmptyState>
        )}
    </section>);
};

const UploadUsage = ({error, onRetry, quota, onRefresh, perks}) => {
    const {text: communityText} = useCommunityText();
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

    const nextFreesIn = quota && quota.nextExpiryInMs > 0 && quota.nextReleaseBytes > 0 ?
        communityText('{value1} in {value2}', {value1: formatBytes(quota.nextReleaseBytes), value2: formatCountdown(quota.nextExpiryInMs)}) : null;

    if (error) {
        return <StatusMessage error onRetry={onRetry}>{communityText('Could not load upload usage.')}</StatusMessage>;
    }
    if (!quota) {
        return <StatusMessage>{communityText('Loading upload info…')}</StatusMessage>;
    }

    const remaining = quota.remaining ?? Math.max(0, (quota.limit || 0) - (quota.used || 0));
    const releases = (quota.releases || []).slice(0, 5);
    const summaryStats = [
        {value: formatBytes(quota.used), label: communityText('Used')},
        {value: formatBytes(quota.limit), label: communityText('Limit')},
        {value: formatBytes(remaining), label: communityText('Remaining')},
        ...(nextFreesIn ? [{value: nextFreesIn, label: communityText('Frees up next')}] : []),
        {value: quota.eventCount || 0, label: communityText('Uploads this week')}
    ];

    return (
        <section className={styles.uploads}>
            {perks ? (
                <Notice variant="info">
                    {communityText('Your Rotur {value1} membership includes {value2} of weekly uploads, {value3} of assets per project, and {value4} per asset.', {
                        value1: perks.tier,
                        value2: formatBytes(perks.mistwarp.weeklyUploadBytes),
                        value3: formatBytes(perks.mistwarp.maxProjectAssetsBytes),
                        value4: formatBytes(perks.mistwarp.maxProjectAssetBytes)
                    })}
                </Notice>
            ) : null}
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
                    {communityText('{value1}% full', {value1: Math.round(pct)})}{pct >= 80 ? (
                        <span className={styles.uploadWarn}><AlertTriangle size={14} />{communityText('Nearly full')}</span>
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
                title={communityText('Daily upload volume')}
                rows={historyRows(dailyMap, 14)}
                format={formatBytes}
                accent="#4C97FF"
                emptyText="No uploads in the current window."
            />

            {releases.length ? (
                <div className={styles.uploadReset}>
                    <SectionHeading as="h3" icon={Clock3} title={communityText('When space frees up')} className={styles.cardHeading} />
                    <p className={styles.uploadResetDesc}>
                        {communityText('Uploads leave your weekly budget 7 days after each save. The next space back is {value1}.', {value1: nextFreesIn})}
                    </p>
                    <ul className={styles.ovRecentList}>
                        {releases.map(release => (
                            <li key={release.atMs} className={styles.ovRecentItem}>
                                <span>{formatBytes(release.bytes)}</span>
                                <span className={styles.ovRecentMeta}>{communityText('Frees in {value1}', {value1: formatCountdown(release.inMs)})}</span>
                            </li>
                        ))}
                    </ul>
                    <p className={styles.uploadResetDesc}>{communityText('Saves that fail validation or change nothing are free and never touch this budget.')}</p>
                </div>
            ) : (
                <p className={styles.uploadResetDesc}>{communityText('Nothing on the clock: saves that fail validation or change nothing are free and never touch this budget.')}</p>
            )}

            <div className={styles.uploadReset}>
                <SectionHeading as="h3" icon={RefreshCw} title={communityText('Reset upload quota')} className={styles.cardHeading} />
                <p className={styles.uploadResetDesc}>
                    {communityText('Reset your weekly upload usage back to zero. This costs {value1} credits.', {value1: amount || 20})}
                </p>

                {resetDone ? (
                    <Notice variant="success">{communityText('Quota reset successfully. Your upload usage is now 0.')}</Notice>
                ) : resetError && !showConfirm ? (
                    <Notice variant="error" onDismiss={() => setResetError('')}>{resetError}</Notice>
                ) : (
                    <Button
                        variant="primary"
                        className={styles.uploadResetBtn}
                        onClick={handleReset}
                        busy={resetting}
                        busyLabel={communityText('Starting…')}
                    >
                        <RefreshCw size={16} />{communityText('Reset quota')}</Button>
                )}
            </div>

            {showConfirm ? (
                <ConfirmModal
                    title={communityText('Reset upload quota?')}
                    confirmLabel={communityText('Spend {value1} credits', {value1: amount})}
                    busy={resetting}
                    busyLabel={communityText('Resetting…')}
                    error={resetError}
                    onConfirm={confirmReset}
                    onCancel={dismiss}
                >
                    {payTo ?
                        communityText('This will cost {value1} credits sent to {value2}. Your upload usage will be reset to zero. Continue?', {value1: amount, value2: payTo}) :
                        communityText('This will cost {value1} credits. Your upload usage will be reset to zero. Continue?', {value1: amount})}
                </ConfirmModal>
            ) : null}
        </section>
    );
};

const AgreementTab = () => {
    const {text: communityText} = useCommunityText();
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
            <StatusMessage error onRetry={() => setAttempt(value => value + 1)}>
                {communityText('Could not load the agreement.')}
            </StatusMessage>
        );
    }

    if (!agreement) {
        return <StatusMessage>{communityText('Loading agreement…')}</StatusMessage>;
    }

    if (!agreement.text && agreement.version === 0) {
        return (
            <EmptyState icon={HeartHandshake} title={communityText('No agreement yet')}>
                {communityText('No agreement has been set yet.')}
            </EmptyState>
        );
    }

    const alreadyAccepted = agreement.accepted === true;

    return (
        <section className={styles.agreementSection}>
            <div className={styles.agreementContent}>
                <Markdown className={styles.agreementText}>{agreement.text}</Markdown>
            </div>
            <div className={styles.agreementFooter}>
                {alreadyAccepted ? (
                    <Notice variant="success">
                        {communityText('You have accepted version {value1} (updated {value2}).', {value1: agreement.version, value2: formatDate(agreement.updatedAt, 'date unavailable')})}
                    </Notice>
                ) : (
                    <>
                        <p className={styles.agreementPrompt}>{communityText('To continue using the platform, please accept this agreement.')}</p>
                        {error ? <Notice variant="error">{error}</Notice> : null}
                        <Button
                            variant="primary"
                            className={styles.agreementAcceptBtn}
                            onClick={handleAccept}
                            busy={busy}
                            busyLabel={communityText('Accepting…')}
                        >
                            {communityText('Accept v{value1}', {value1: agreement.version})}
                        </Button>
                    </>
                )}
            </div>
        </section>
    );
};

const SECTIONS = [
    {key: 'overview', label: 'Overview', icon: LayoutDashboard},
    {key: 'projects', label: 'My Projects', icon: FolderOpen, group: 'Projects'},
    {key: 'shared', label: 'Shared with you', icon: HeartHandshake, group: 'Projects'},
    {key: 'library', label: 'Library', icon: Bookmark, group: 'Projects'},
    {key: 'collections', label: 'Collections', icon: Library, group: 'Projects'},
    {key: 'spaces', label: 'Spaces', icon: Layers3, group: 'Projects'},
    {key: 'themes', label: 'Themes', icon: Palette, group: 'Assets'},
    {key: 'inventory', label: 'Inventory', icon: Package, group: 'Assets'},
    {key: 'uploads', label: 'Uploads', icon: HardDrive, group: 'Account'},
    {key: 'trash', label: 'Trash', icon: Trash2, group: 'Account'},
    {key: 'agreement', label: 'Agreement', icon: HeartHandshake, group: 'Account'}
];
const getMyStuffSection = value => {
    if (value === 'playtime') return 'library';
    if (SECTIONS.some(section => section.key === value)) return value;
    return 'overview';
};
const normalizeMyStuffParams = params => {
    const next = new URLSearchParams(params);
    let section = getMyStuffSection(next.get('section'));
    if (section === 'collections' && next.get('collectionView') === 'library') section = 'library';
    if (section === 'overview') next.delete('section');
    else next.set('section', section);
    if (section !== 'themes' || next.get('themeView') !== 'published') next.delete('themeView');
    next.delete('collectionView');
    return next;
};

const MyStuff = () => {
    const {text: communityText} = useCommunityText();
    const {user, loading, login} = useUser();
    const [searchParams, setSearchParams] = useSearchParams();
    const tab = getMyStuffSection(searchParams.get('section'));
    const [projects, setProjects] = useState(null);
    const [projectTotal, setProjectTotal] = useState(0);
    const [projectOffset, setProjectOffset] = useState(0);
    const [projectsMoreBusy, setProjectsMoreBusy] = useState(false);
    const [projectsMoreFailed, setProjectsMoreFailed] = useState(false);
    const [featuredProject, setFeaturedProject] = useState(user ? user.featuredProject : '');
    const [uploading, setUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState('');
    const [actionError, setActionError] = useState('');
    const [failed, setFailed] = useState(false);
    const [collectionProject, setCollectionProject] = useState(null);
    const [quota, setQuota] = useState(null);
    const [quotaFailed, setQuotaFailed] = useState(false);
    const [usageAttempt, setUsageAttempt] = useState(0);
    const [perks, setPerks] = useState(null);
    const [stats, setStats] = useState(null);
    const [statsFailed, setStatsFailed] = useState(false);
    const [account, setAccount] = useState(null);
    const [inventoryItems, setInventoryItems] = useState(null);
    const [inventoryFailed, setInventoryFailed] = useState(false);
    const [pendingUploadFile, setPendingUploadFile] = useState(null);
    const [showAgreeModal, setShowAgreeModal] = useState(false);
    const [agreeData, setAgreeData] = useState(null);
    const [agreeBusy, setAgreeBusy] = useState(false);
    const [agreeError, setAgreeError] = useState('');
    const [mySpaces, setMySpaces] = useState(null);
    const [libraryProjects, setLibraryProjects] = useState(null);
    const [libraryTotal, setLibraryTotal] = useState(0);
    const [libraryOffset, setLibraryOffset] = useState(0);
    const [libraryBusy, setLibraryBusy] = useState(false);
    const [libraryVisibilityBusy, setLibraryVisibilityBusy] = useState('');
    const [libraryVisibilityError, setLibraryVisibilityError] = useState('');
    const [spacesFailed, setSpacesFailed] = useState(false);
    const [libraryFailed, setLibraryFailed] = useState(false);
    const [directoriesLoading, setDirectoriesLoading] = useState(false);
    const [projectAction, setProjectAction] = useState('');
    const [deleteConfirmProject, setDeleteConfirmProject] = useState(null);
    const [deleteError, setDeleteError] = useState('');
    const [trashedProjects, setTrashedProjects] = useState(null);
    const [trashBusy, setTrashBusy] = useState('');
    const [trashFailed, setTrashFailed] = useState(false);
    const [purgeConfirmProject, setPurgeConfirmProject] = useState(null);
    const [purgeError, setPurgeError] = useState('');
    const uploadInput = useRef(null);
    const beginProjectLoad = useLatest();
    const beginDirectoryLoad = useLatest();
    const beginStatsLoad = useLatest();
    const beginTrashLoad = useLatest();
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
    const setTab = (nextTab, {preserveError = false} = {}) => {
        const next = new URLSearchParams(searchParams);
        if (nextTab === 'overview') next.delete('section');
        else next.set('section', nextTab);
        if (nextTab !== 'themes') next.delete('themeView');
        next.delete('collectionView');
        if (!preserveError) setActionError('');
        setSearchParams(next);
    };
    useEffect(() => {
        const normalized = normalizeMyStuffParams(searchParams);
        if (normalized.toString() !== searchParams.toString()) {
            setSearchParams(normalized, {replace: true});
        }
    }, [searchParams, setSearchParams]);

    useEffect(() => {
        beginDirectoryLoad();
        setMySpaces(null);
        setLibraryProjects(null);
        setLibraryTotal(0);
        setLibraryOffset(0);
        setLibraryBusy(false);
        setLibraryVisibilityBusy('');
        setLibraryVisibilityError('');
        setSpacesFailed(false);
        setLibraryFailed(false);
        setDirectoriesLoading(false);
        setProjectAction('');
        setDeleteConfirmProject(null);
        setDeleteError('');
        setTrashedProjects(null);
        setTrashBusy('');
        setTrashFailed(false);
        setPurgeConfirmProject(null);
        setPurgeError('');
        setUploading(false);
        setUploadStatus('');
        setPendingUploadFile(null);
        setShowAgreeModal(false);
        setAgreeData(null);
        setAgreeBusy(false);
        setAgreeError('');
        setCollectionProject(null);
        setActionError('');
        setInventoryItems(null);
        setInventoryFailed(false);
    }, [beginDirectoryLoad, beginStatsLoad, beginTrashLoad, username]);

    useEffect(() => {
        if (!user) {
            setQuota(null);
            setQuotaFailed(false);
            setPerks(null);
            return;
        }
        let stale = false;
        setQuota(null);
        setQuotaFailed(false);
        setPerks(null);
        Promise.allSettled([api.quota(), api.perks()]).then(([quotaResult, perksResult]) => {
            if (stale) return;
            if (quotaResult.status === 'fulfilled') setQuota(quotaResult.value);
            else setQuotaFailed(true);
            if (perksResult.status === 'fulfilled') setPerks(perksResult.value.current || null);
        });
        return () => {
            stale = true;
        };
    }, [usageAttempt, user]);

    useEffect(() => {
        setFeaturedProject(user ? user.featuredProject : '');
    }, [user]);

    const loadStats = useCallback(() => {
        if (!username) {
            setStats(null);
            setStatsFailed(false);
            setAccount(null);
            return;
        }
        const context = accountContextRef.current;
        const fresh = beginStatsLoad();
        setStats(null);
        setStatsFailed(false);
        api.stats()
            .then(fresh(data => {
                if (accountContextRef.current !== context) return;
                if (data && data.stats) setStats(data.stats);
                else setStatsFailed(true);
            }))
            .catch(fresh(() => {
                if (accountContextRef.current === context) setStatsFailed(true);
            }));
    }, [beginStatsLoad, username]);

    useEffect(() => {
        loadStats();
    }, [loadStats]);

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
        setProjectTotal(0);
        setProjectOffset(0);
        setProjectsMoreBusy(false);
        setProjectsMoreFailed(false);
        setFailed(false);
        api.myProjectPage(user.username)
            .then(fresh(data => {
                const page = data.projects || [];
                setProjects(page);
                setProjectTotal(Number.isFinite(data.total) ? data.total : page.length);
                setProjectOffset(Number.isFinite(data.nextOffset) ? data.nextOffset : page.length);
            }))
            .catch(fresh(() => setFailed(true)));
    }, [beginProjectLoad, user, tab]);

    useEffect(() => {
        load();
    }, [load]);

    const loadInventory = useCallback(() => {
        if (!user || tab !== 'inventory') return;
        const context = accountContextRef.current;
        setInventoryItems(null);
        setInventoryFailed(false);
        api.gameInventory()
            .then(result => {
                if (accountContextRef.current === context) {
                    setInventoryItems((result.inventory && result.inventory.items) || []);
                }
            })
            .catch(() => {
                if (accountContextRef.current === context) setInventoryFailed(true);
            });
    }, [tab, user]);

    useEffect(() => {
        loadInventory();
    }, [loadInventory]);

    const loadTrash = useCallback(() => {
        if (!user || tab !== 'trash') return;
        const fresh = beginTrashLoad();
        setTrashedProjects(null);
        setTrashFailed(false);
        api.trash()
            .then(fresh(data => setTrashedProjects(data.projects || [])))
            .catch(fresh(() => setTrashFailed(true)));
    }, [beginTrashLoad, tab, user]);

    useEffect(() => {
        if (tab === 'trash') loadTrash();
        else beginTrashLoad();
    }, [beginTrashLoad, loadTrash, tab]);

    const restoreTrashedProject = async id => {
        const context = accountContextRef.current;
        const actionKey = beginAccountAction(`trash:restore:${id}`);
        if (!actionKey) return;
        setTrashBusy(`restore:${id}`);
        setActionError('');
        try {
            await api.restoreProject(id);
            if (accountContextRef.current === context) {
                setTrashedProjects(current => removeProjectById(current, id));
            }
        } catch (e) {
            if (accountContextRef.current === context) {
                setActionError(e.message || 'Could not restore this project.');
            }
        } finally {
            releaseAccountAction(actionKey);
            if (accountContextRef.current === context) setTrashBusy('');
        }
    };

    const purgeTrashedProject = async project => {
        const context = accountContextRef.current;
        const actionKey = beginAccountAction(`trash:purge:${project.id}`);
        if (!actionKey) return;
        setTrashBusy(`purge:${project.id}`);
        setPurgeError('');
        try {
            await api.purgeProject(project.id);
            if (accountContextRef.current === context) {
                setTrashedProjects(current => removeProjectById(current, project.id));
                setPurgeConfirmProject(null);
            }
        } catch (e) {
            if (accountContextRef.current === context) {
                setPurgeError(e.message || 'Could not permanently delete this project.');
            }
        } finally {
            releaseAccountAction(actionKey);
            if (accountContextRef.current === context) setTrashBusy('');
        }
    };

    const loadMoreProjects = async () => {
        if (!user || projectsMoreBusy || projectOffset >= projectTotal) return;
        const context = accountContextRef.current;
        setProjectsMoreBusy(true);
        setProjectsMoreFailed(false);
        try {
            const data = await api.myProjectPage(user.username, {offset: projectOffset, limit: 24});
            if (accountContextRef.current !== context) return;
            setProjects(current => {
                const byId = new Map((current || []).map(project => [project.id, project]));
                for (const project of data.projects || []) byId.set(project.id, project);
                return Array.from(byId.values());
            });
            setProjectTotal(Number.isFinite(data.total) ? data.total : projectTotal);
            setProjectOffset(Number.isFinite(data.nextOffset) ? data.nextOffset : projectOffset + 24);
        } catch (e) {
            if (accountContextRef.current === context) setProjectsMoreFailed(true);
        } finally {
            if (accountContextRef.current === context) setProjectsMoreBusy(false);
        }
    };

    const loadDirectories = useCallback(() => {
        const fresh = beginDirectoryLoad();
        setDirectoriesLoading(true);
        setSpacesFailed(false);
        api.mySpaces().then(fresh(spacesResult => {
            setMySpaces(spacesResult.spaces || []);
            setDirectoriesLoading(false);
        })).catch(fresh(() => {
            setSpacesFailed(true);
            setDirectoriesLoading(false);
        }));
    }, [beginDirectoryLoad]);

    const loadLibrary = useCallback(() => {
        if (!user || tab !== 'library') return;
        const context = accountContextRef.current;
        setLibraryProjects(null);
        setLibraryFailed(false);
        api.library().then(data => {
            if (accountContextRef.current !== context) return;
            const items = data.projects || [];
            setLibraryProjects(items);
            setLibraryTotal(Number.isFinite(data.total) ? data.total : items.length);
            setLibraryOffset(Number.isFinite(data.nextOffset) ? data.nextOffset : items.length);
        }).catch(() => {
            if (accountContextRef.current === context) setLibraryFailed(true);
        });
    }, [tab, user]);

    useEffect(() => {
        loadLibrary();
    }, [loadLibrary]);

    useEffect(() => {
        if (!user || !['collections', 'spaces'].includes(tab)) return;
        if (directoriesLoading || spacesFailed || mySpaces !== null) return;
        loadDirectories();
    }, [directoriesLoading, loadDirectories, mySpaces, spacesFailed, tab, user]);

    const retryDirectories = () => {
        setMySpaces(null);
        loadDirectories();
    };

    const retryLibrary = () => {
        setLibraryProjects(null);
        setLibraryTotal(0);
        setLibraryOffset(0);
        loadLibrary();
    };

    const loadMoreLibrary = async () => {
        if (libraryBusy || libraryOffset >= libraryTotal) return;
        const context = accountContextRef.current;
        setLibraryBusy(true);
        setLibraryVisibilityError('');
        try {
            const data = await api.library({offset: libraryOffset, limit: 24});
            if (accountContextRef.current !== context) return;
            setLibraryProjects(current => {
                const byId = new Map((current || []).map(project => [project.id, project]));
                for (const project of data.projects || []) byId.set(project.id, project);
                return Array.from(byId.values());
            });
            setLibraryTotal(Number.isFinite(data.total) ? data.total : libraryTotal);
            setLibraryOffset(Number.isFinite(data.nextOffset) ? data.nextOffset : libraryOffset + 24);
        } catch (e) {
            if (accountContextRef.current === context) {
                setLibraryVisibilityError(e.message || 'Could not load more library games.');
            }
        } finally {
            if (accountContextRef.current === context) setLibraryBusy(false);
        }
    };

    const changeLibraryProjectVisibility = async project => {
        const actionKey = beginAccountAction(`library-visibility:${project.id}`);
        if (!actionKey) return;
        const context = accountContextRef.current;
        const nextPublic = project.libraryPublic === false;
        setLibraryVisibilityBusy(project.id);
        setLibraryVisibilityError('');
        try {
            const result = await api.setLibraryProjectVisibility(project.id, nextPublic);
            if (accountContextRef.current !== context) return;
            const updateVisibility = item => {
                if (item.id !== project.id) return item;
                return {...item, libraryPublic: result.public !== false};
            };
            setLibraryProjects(current => (current || []).map(updateVisibility));
        } catch (e) {
            if (accountContextRef.current === context) {
                setLibraryVisibilityError(e.message || 'Could not update this library item.');
            }
        } finally {
            if (accountContextRef.current === context) setLibraryVisibilityBusy('');
            releaseAccountAction(actionKey);
        }
    };

    const removeLibraryProject = async project => {
        const actionKey = beginAccountAction(`library-remove:${project.id}`);
        if (!actionKey) return;
        const context = accountContextRef.current;
        setLibraryVisibilityBusy(project.id);
        setLibraryVisibilityError('');
        try {
            await api.unsaveProject(project.id);
            if (accountContextRef.current !== context) return;
            setLibraryProjects(current => (current || []).filter(item => item.id !== project.id));
            setLibraryTotal(total => Math.max(0, total - 1));
            setLibraryOffset(offset => Math.max(0, offset - 1));
        } catch (e) {
            if (accountContextRef.current === context) {
                setLibraryVisibilityError(e.message || 'Could not remove this game from your library.');
            }
        } finally {
            if (accountContextRef.current === context) setLibraryVisibilityBusy('');
            releaseAccountAction(actionKey);
        }
    };

    const refreshUsage = useCallback(() => {
        if (!user) return;
        const context = accountContextRef.current;
        api.quota()
            .then(data => {
                if (accountContextRef.current === context) {
                    setQuota(data);
                    setQuotaFailed(false);
                }
            })
            .catch(() => {
                if (accountContextRef.current === context) setQuotaFailed(true);
            });
        api.stats()
            .then(data => {
                if (accountContextRef.current === context) setStats(data.stats || null);
            })
            .catch(() => {});
    }, [user]);

    const unpublish = async id => {
        const actionKey = beginAccountAction('project');
        if (!actionKey) return;
        const context = accountContextRef.current;
        setProjectAction(`visibility:${id}`);
        try {
            setActionError('');
            const data = await api.unpublish(id);
            if (accountContextRef.current !== context) return;
            setProjects(current => replaceProjectById(current, data.project));
            if (featuredProject === id) setFeaturedProject('');
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
            const data = await api.publish(id);
            if (accountContextRef.current !== context) return;
            setProjects(current => replaceProjectById(current, data.project));
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
        setDeleteError('');
        try {
            await api.deleteProject(id);
            if (accountContextRef.current !== context) return;
            setProjects(current => removeProjectById(current, id));
            setProjectTotal(total => Math.max(0, total - 1));
            setProjectOffset(offset => Math.max(0, offset - 1));
            if (featuredProject === id) setFeaturedProject('');
            setDeleteConfirmProject(null);
            refreshUsage();
        } catch (e) {
            if (accountContextRef.current === context) {
                setDeleteError(e.message || 'Could not delete this project.');
            }
        } finally {
            releaseAccountAction(actionKey);
            if (accountContextRef.current === context) setProjectAction('');
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
                    setTab('projects', {preserveError: true});
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
                    setTab('projects', {preserveError: true});
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
        if (!projectAction) {
            setDeleteConfirmProject(null);
            setDeleteError('');
        }
    }, [projectAction]);
    const purgeBusy = purgeConfirmProject && trashBusy === `purge:${purgeConfirmProject.id}`;
    const purgeDetails = purgeConfirmProject ? trashPurgeConfirmation(purgeConfirmProject) : null;
    const dismissPurgeConfirm = useCallback(() => {
        if (!trashBusy) {
            setPurgeConfirmProject(null);
            setPurgeError('');
        }
    }, [trashBusy]);

    if (loading) {
        return <main className={styles.page}><StatusMessage /></main>;
    }
    if (!user) {
        return (
            <main className={styles.page}>
                <SignInPrompt onSignIn={login}>{communityText('Sign in to see your projects.')}</SignInPrompt>
            </main>
        );
    }

    return (
        <main className={styles.page}>
            <PageHeader
                title={communityText('My stuff')}
                actions={(
                    <React.Fragment>
                        <input
                            ref={uploadInput}
                            className={styles.hiddenInput}
                            type="file"
                            accept=".sb3,application/x.scratch.sb3"
                            onChange={uploadSb3}
                        />
                        <Button
                            variant="primary"
                            busy={uploading}
                            busyLabel={uploadStatus || communityText('Uploading…')}
                            onClick={() => uploadInput.current && uploadInput.current.click()}
                        >
                            <Upload size={16} />{communityText('Upload .sb3')}</Button>
                        <Button as="a" variant="primary" href={editorUrl()}>
                            <Plus size={16} />{communityText('New project')}</Button>
                    </React.Fragment>
                )}
            />

            {actionError ? (
                <Notice variant="error" className={styles.pageNotice} onDismiss={() => setActionError('')}>{actionError}</Notice>
            ) : null}

            {quota && (quota.used / quota.limit) * 100 >= 80 ? (
                <Notice variant="warning" className={styles.pageNotice}>
                    {communityText('You have used {value1} of your {value2} upload quota ({value3}%).', {
                        value1: formatBytes(quota.used),
                        value2: formatBytes(quota.limit),
                        value3: Math.round((quota.used / quota.limit) * 100)
                    })}{' '}
                    {quota.used >= quota.limit ?
                        communityText('You cannot upload new projects until usage drops.') :
                        communityText('Consider managing your projects to free up space.')}
                </Notice>
            ) : null}

            {showAgreeModal && agreeData ? (
                <Modal
                    className={styles.agreeModal}
                    title={communityText('Upload agreement v{value1}', {value1: agreeData.version})}
                    onClose={cancelAgreeModal}
                    dismissDisabled={agreeBusy}
                    actions={(
                        <React.Fragment>
                            <Button
                                onClick={cancelAgreeModal}
                                disabled={agreeBusy}
                            >{communityText('Cancel')}</Button>
                            <Button
                                variant="primary"
                                onClick={confirmAgreeAndUpload}
                                busy={agreeBusy}
                                busyLabel={communityText('Accepting…')}
                            >
                                {communityText('Accept v{value1} & upload', {value1: agreeData.version})}
                            </Button>
                        </React.Fragment>
                    )}
                >
                    <div className={styles.agreeModalBody}>
                        <Markdown className={styles.agreementText}>{agreeData.text}</Markdown>
                    </div>
                    {agreeError ? <Notice variant="error">{agreeError}</Notice> : null}
                    <p className={styles.agreementPrompt}>{communityText('You must accept this agreement before you can upload projects.')}</p>
                </Modal>
            ) : null}

            {deleteConfirmProject ? (
                <ConfirmModal
                    destructive
                    title={communityText('Delete project?')}
                    confirmLabel={communityText('Delete project')}
                    busy={Boolean(deleteBusy)}
                    busyLabel={communityText('Deleting…')}
                    error={deleteError}
                    onConfirm={() => deleteProject(deleteConfirmProject.id)}
                    onCancel={dismissDeleteConfirm}
                >
                    {communityText('{value1} will move to Trash. You can restore it until its recovery period ends.', {value1: deleteConfirmProject.title})}
                </ConfirmModal>
            ) : null}

            {purgeConfirmProject ? (
                <ConfirmModal
                    destructive
                    icon={Trash2}
                    title={purgeDetails.title}
                    confirmLabel={purgeDetails.action}
                    busy={Boolean(purgeBusy)}
                    busyLabel={communityText('Deleting…')}
                    error={purgeError}
                    onConfirm={() => purgeTrashedProject(purgeConfirmProject)}
                    onCancel={dismissPurgeConfirm}
                >
                    {purgeDetails.body}
                </ConfirmModal>
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
                                username={username}
                                onNavigate={setTab}
                            />
                        ) : statsFailed ? (
                            <StatusMessage error onRetry={loadStats}>{communityText('Could not load your overview.')}</StatusMessage>
                        ) : (
                            <StatusMessage />
                        )
                    ) : tab === 'shared' ? (
                        <SharedProjects key={username} />
                    ) : tab === 'library' ? (
                        <MyStuffLibrary
                            projects={libraryProjects || []}
                            total={libraryTotal}
                            loading={libraryProjects === null && !libraryFailed}
                            error={libraryFailed}
                            hasMore={libraryOffset < libraryTotal}
                            moreBusy={libraryBusy}
                            actionBusy={libraryVisibilityBusy}
                            actionError={libraryVisibilityError}
                            onRetry={retryLibrary}
                            onLoadMore={loadMoreLibrary}
                            onChangeVisibility={changeLibraryProjectVisibility}
                            onRemove={removeLibraryProject}
                        />
                    ) : tab === 'uploads' ? (
                        <UploadUsage
                            error={quotaFailed}
                            quota={quota}
                            perks={perks}
                            onRetry={() => setUsageAttempt(value => value + 1)}
                            onRefresh={refreshUsage}
                        />
                    ) : tab === 'agreement' ? (
                        <AgreementTab key={username} />
                    ) : tab === 'themes' ? (
                        <MyStuffThemes username={username} />
                    ) : tab === 'inventory' ? (
                        <Inventory items={inventoryItems} error={inventoryFailed} onRetry={loadInventory} />
                    ) : tab === 'trash' ? (
                        trashFailed ? (
                            <StatusMessage error onRetry={loadTrash}>{communityText('Could not load Trash.')}</StatusMessage>
                        ) : trashedProjects === null ? <StatusMessage>{communityText('Loading Trash…')}</StatusMessage> :
                            trashedProjects.length ? <div className={styles.list}>{trashedProjects.map(project => (
                                <div className={styles.row} key={project.id}>
                                    <div className={styles.thumb}><ProjectThumbnail project={project} lazy /></div>
                                    <div className={styles.info}>
                                        <strong className={styles.title}>{project.title}</strong>
                                        <span className={styles.rowStats}>{communityText('Deletes forever {value1}', {value1: formatDate(project.purgeAt, 'date unavailable')})}</span>
                                    </div>
                                    <div className={styles.rowActions}>
                                        <Button variant="primary" busy={trashBusy === `restore:${project.id}`} disabled={Boolean(trashBusy)} onClick={() => restoreTrashedProject(project.id)}><RotateCcw size={14} />{communityText('Restore')}</Button>
                                        <Button
                                            variant="danger"
                                            disabled={Boolean(trashBusy)}
                                            onClick={() => {
                                                setPurgeError('');
                                                setPurgeConfirmProject(project);
                                            }}
                                        ><Trash2 size={14} />{communityText('Delete forever')}</Button>
                                    </div>
                                </div>
                            ))}</div> : (
                                <EmptyState icon={Trash2} title={communityText('No deleted projects')}>
                                    {communityText('Trash is empty. Projects you delete stay here until their recovery period ends.')}
                                </EmptyState>
                            )
                    ) : tab === 'collections' || tab === 'spaces' ? (
                        <MyStuffSpaces
                            key={tab}
                            mode={tab}
                            spaces={mySpaces}
                            error={spacesFailed}
                            onRetry={retryDirectories}
                        />
                    ) : failed ? (
                        <StatusMessage error onRetry={load}>{communityText('Could not load your projects.')}</StatusMessage>
                    ) : projects === null ? (
                        <StatusMessage />
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
                                            to={projectUrl(project)}
                                            className={styles.thumb}
                                        >
                                            <ProjectThumbnail
                                                project={project}
                                                lazy
                                            />
                                        </Link>
                                        <div className={styles.info}>
                                            <Link
                                                to={projectUrl(project)}
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
                                                        {communityText('{value1} earned', {value1: Math.round(project.revenue * 100) / 100})}
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
                                            {project.contributionOnly ? (
                                                <Button
                                                    disabled
                                                    title={communityText('Remixes of projects offered for purchase stay private. Contribute your changes back to the original creator.')}
                                                >{communityText('Contribution only')}</Button>
                                            ) : project.shared ? (
                                                <Button
                                                    disabled={Boolean(projectAction)}
                                                    busy={visibilityBusy}
                                                    busyLabel={communityText('Updating…')}
                                                    onClick={() => unpublish(project.id)}
                                                >{communityText('Unshare')}</Button>
                                            ) : (
                                                <Button
                                                    disabled={Boolean(projectAction)}
                                                    busy={visibilityBusy}
                                                    busyLabel={communityText('Updating…')}
                                                    onClick={() => publish(project.id)}
                                                >{communityText('Share')}</Button>
                                            )}
                                            <Dropdown
                                                className={styles.actionMenuWrap}
                                                menuClassName={styles.actionMenu}
                                                renderTrigger={({open, toggle}) => (
                                                    <IconButton
                                                        className={styles.moreButton}
                                                        label={communityText('Actions for {value1}', {value1: project.title})}
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
                                                            <Pencil size={14} />{communityText('Open in editor')}</a>
                                                        <Link to={projectUrl(project)} onClick={close}>
                                                            <ExternalLink size={14} />{communityText('Project page')}</Link>
                                                        <div className={styles.menuSeparator} role="separator" />
                                                        <Link to={`/mystuff/project/${project.id}`} onClick={close}>
                                                            <SlidersHorizontal size={14} />{communityText('Manage & analytics')}</Link>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                close();
                                                                setCollectionProject(project);
                                                            }}
                                                        >
                                                            <Library size={14} />{communityText('Save to collection')}</button>
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
                                                                    communityText('Remove profile feature') : communityText('Feature on profile')}
                                                            </button>
                                                        ) : null}
                                                        <div className={styles.menuSeparator} role="separator" />
                                                        <button
                                                            type="button"
                                                            className={styles.danger}
                                                            disabled={Boolean(projectAction)}
                                                            onClick={() => {
                                                                close();
                                                                setDeleteError('');
                                                                setDeleteConfirmProject(project);
                                                            }}
                                                        >
                                                            <Trash2 size={14} />{communityText('Delete')}</button>
                                                    </React.Fragment>
                                                )}
                                            </Dropdown>
                                        </div>
                                    </div>
                                );
                            })}
                            {projectOffset < projectTotal ? (
                                <div className={styles.loadMore}>
                                    <Button
                                        variant="secondary"
                                        busy={projectsMoreBusy}
                                        busyLabel={communityText('Loading…')}
                                        onClick={loadMoreProjects}
                                    >{communityText('Load more projects')}</Button>
                                </div>
                            ) : null}
                            {projectsMoreFailed ? (
                                <Notice variant="error">{communityText('Could not load more projects.')}</Notice>
                            ) : null}
                        </div>
                    ) : (
                        <EmptyState
                            icon={FolderOpen}
                            title={communityText('No projects yet')}
                            action={(
                                <Button variant="primary" as="a" href={editorUrl()}>
                                    <Plus size={16} />{communityText('New project')}</Button>
                            )}
                        >
                            {communityText('You have not created any projects yet.')}
                        </EmptyState>
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
    normalizeMyStuffParams,
    removeProjectById,
    replaceProjectById,
    shouldRefreshProjectsAfterUploadError,
    trashPurgeConfirmation,
    uploadErrorTarget,
    uploadProgressLabel
};
export default MyStuff;
