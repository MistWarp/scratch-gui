/* eslint-disable max-len */
import React, {useEffect, useRef, useState} from 'react';
import {useCommunityIntl as useCommunityText} from '../../i18n.jsx';
import {
    Activity, AlertTriangle, Ban, BarChart3, Cloud, Database, Download, Eye, Flag, FolderOpen, HardDrive,
    Heart, MemoryStick, Newspaper, RefreshCw, TrendingUp, User
} from 'lucide-react';
import api from '../../api';
import Button from '../../components/ui/Button.jsx';
import Notice from '../../components/ui/Notice.jsx';
import SectionHeading from '../../components/ui/SectionHeading.jsx';
import StatusMessage from '../../components/ui/StatusMessage.jsx';
import {timeAgoText, formatBytes, formatPlaytime} from '../../format';
import styles from '../Admin.module.css';
import {buildSeries, num, percent, formatLoadTime} from './admin-format.js';
import StatTile from './StatTile.jsx';
import StorageBreakdown from './StorageBreakdown.jsx';
import AnalyticsChart from './AnalyticsChart.jsx';
import QuotaTile from './QuotaTile.jsx';

const StatsOverview = ({view}) => {
    const {text: communityText} = useCommunityText();
    const [stats, setStats] = useState(null);
    const [storage, setStorage] = useState(null);
    const [storageError, setStorageError] = useState('');
    const [storageSyncBusy, setStorageSyncBusy] = useState(false);
    const [quota, setQuota] = useState(null);
    const [error, setError] = useState('');
    const [days, setDays] = useState(30);
    const [statsBusy, setStatsBusy] = useState(false);
    const [showDailyData, setShowDailyData] = useState(false);
    const mounted = useRef(true);
    const currentDays = useRef(days);
    currentDays.current = days;

    useEffect(() => () => {
        mounted.current = false;
    }, []);

    useEffect(() => {
        let active = true;
        setStatsBusy(true);
        setError('');
        api.admin.stats(days)
            .then(result => {
                if (active) setStats(result);
            })
            .catch(e => {
                if (active) setError(e.message || 'Could not load stats.');
            })
            .finally(() => {
                if (active) setStatsBusy(false);
            });
        return () => {
            active = false;
        };
    }, [days]);

    useEffect(() => {
        if (view !== 'storage') return () => {};
        let active = true;
        setStorageError('');
        api.admin.storage()
            .then(result => {
                if (active) {
                    const nextStorage = result.storage || null;
                    setStorage(nextStorage);
                    if (nextStorage && nextStorage.inventorySync && nextStorage.inventorySync.ok === false) {
                        setStorageError(nextStorage.inventorySync.error || 'Could not sync the R2 inventory.');
                    }
                }
            })
            .catch(e => {
                if (active) setStorageError(e.message || 'Could not load storage stats.');
            });
        return () => {
            active = false;
        };
    }, [view]);

    useEffect(() => {
        let active = true;
        api.quota()
            .then(result => {
                if (active) setQuota(result);
            })
            .catch(() => {});
        return () => {
            active = false;
        };
    }, []);

    const syncR2Storage = async () => {
        if (storageSyncBusy) return;
        setStorageSyncBusy(true);
        setStorageError('');
        try {
            const result = await api.admin.syncStorage();
            if (mounted.current) setStorage(result.storage || null);
        } catch (e) {
            if (mounted.current) setStorageError(e.message || 'Could not sync the R2 inventory.');
        } finally {
            if (mounted.current) setStorageSyncBusy(false);
        }
    };

    if (error && !stats) {
        return <StatusMessage error>{error}</StatusMessage>;
    }
    if (!stats) {
        return <StatusMessage />;
    }
    const projectSeries = buildSeries(stats.projectsByDay, days);
    const updateSeries = buildSeries(stats.projectUpdatesByDay, days);
    const userSeries = buildSeries(stats.usersByDay, days);
    const loginSeries = buildSeries(stats.loginsByDay, days);
    const loadSeries = buildSeries(stats.loadsByDay, days);
    const loadTimeSeries = buildSeries(stats.averageLoadMsByDay, days, stats.loadSamplesByDay);
    const startSeries = buildSeries(stats.startsByDay, days);
    const crashSeries = buildSeries(stats.crashesByDay, days);
    const dailyRows = projectSeries.map((projectPoint, index) => ({
        date: projectPoint.fullLabel,
        projects: projectPoint.value,
        updates: updateSeries[index].value,
        users: userSeries[index].value,
        sessions: loginSeries[index].value,
        loads: loadSeries[index].value,
        averageLoadMs: loadTimeSeries[index].value,
        loadSamples: loadTimeSeries[index].samples,
        starts: startSeries[index].value,
        crashes: crashSeries[index].value
    }));
    const deviceLoads = Object.values(stats.loadsByDevice || {})
        .reduce((total, value) => total + Number(value || 0), 0);
    const exportDailyData = () => {
        const headings = ['Date', 'Projects uploaded', 'Projects updated', 'Users joined', 'Current sessions created', 'Player loads', 'Average load ms', 'Load samples', 'Player starts', 'Crashes'];
        const lines = dailyRows.map(row => [row.date, row.projects, row.updates, row.users, row.sessions, row.loads, row.loadSamples ? Math.round(row.averageLoadMs) : '', row.loadSamples, row.starts, row.crashes].join(','));
        const url = URL.createObjectURL(new Blob([[headings.join(','), ...lines].join('\n')], {type: 'text/csv'}));
        const link = document.createElement('a');
        link.href = url;
        link.download = `mistwarp-analytics-${days}-days.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };
    const viewHeading = {
        overview: [communityText('System overview'), communityText('Current platform health and totals.'), BarChart3],
        storage: [communityText('Storage and runtime'), communityText('Local cache, durable R2 objects, upload queue, and memory.'), HardDrive],
        activity: [communityText('Activity'), communityText('Traffic, publishing, sessions, and player performance over time.'), Activity]
    }[view || 'overview'];

    return (
        <div>
            <SectionHeading
                className={styles.overviewHeader}
                icon={viewHeading[2]}
                title={viewHeading[0]}
                lead={viewHeading[1]}
                actions={(!view || view === 'activity') ? (
                    <div className={styles.rangePicker} aria-label={communityText('Analytics date range')}>
                        {[7, 30, 90, 365].map(option => (
                            <button
                                key={option}
                                type="button"
                                className={days === option ? styles.rangeActive : styles.rangeButton}
                                aria-pressed={days === option}
                                onClick={() => setDays(option)}
                            >
                                {option === 365 ? communityText('1 year') : communityText('{value1} days', {value1: option})}
                            </button>
                        ))}
                    </div>
                ) : null}
            />
            {statsBusy ? <p className={styles.refreshStatus}>{communityText('Updating charts…')}</p> : null}
            {error ? <Notice variant="error" className={styles.notice}>{error}</Notice> : null}

            {view === 'storage' && storage ? (
                <section className={styles.overviewSection} aria-labelledby="admin-storage-heading">
                    <SectionHeading
                        as="h3"
                        id="admin-storage-heading"
                        icon={HardDrive}
                        title={communityText('Storage and memory')}
                        lead={communityText('Local disk is the hot layer. R2 holds durable, content-addressed objects.')}
                        actions={storage.r2Configured ? (
                            <Button
                                busy={storageSyncBusy}
                                busyLabel={communityText('Syncing…')}
                                onClick={syncR2Storage}
                            >
                                <RefreshCw size={15} />
                                {communityText('Sync R2 inventory')}
                            </Button>
                        ) : null}
                    />
                    <div className={styles.storageGrid}>
                        <StorageBreakdown
                            title={communityText('Local data')}
                            icon={Database}
                            data={storage.local}
                            detail={communityText('{value1} disk free', {value1: formatBytes(storage.local.diskFreeBytes)})}
                        />
                        <StorageBreakdown
                            title={communityText('R2 storage')}
                            icon={Cloud}
                            data={storage.r2}
                            detail={storage.r2Configured ? (storage.r2SyncedAt ?
                                communityText('{value1} objects · synced {value2}', {value1: num(storage.r2.objects), value2: timeAgoText(storage.r2SyncedAt)}) :
                                communityText('{value1} objects', {value1: num(storage.r2.objects)})) : communityText('Local mode')}
                        />
                        <StorageBreakdown
                            title={communityText('Upload queue')}
                            icon={HardDrive}
                            data={storage.queued}
                            detail={communityText('{value1} waiting', {value1: num(storage.queued.objects)})}
                        />
                        <article className={styles.storagePanel}>
                            <header className={styles.storageHeader}>
                                <span className={styles.storageIcon}><MemoryStick size={18} /></span>
                                <div><h4>{communityText('RAM')}</h4><strong>{formatBytes(storage.local.memory.systemBytes)}</strong></div>
                                <span>{communityText('{value1} goroutines', {value1: num(storage.local.memory.goroutines)})}</span>
                            </header>
                            <dl className={styles.memoryStats}>
                                <div><dt>{communityText('Heap')}</dt><dd>{formatBytes(storage.local.memory.heapBytes)}</dd></div>
                                <div><dt>{communityText('Stacks')}</dt><dd>{formatBytes(storage.local.memory.stackBytes)}</dd></div>
                            </dl>
                        </article>
                    </div>
                </section>
            ) : null}
            {view === 'storage' && !storage && !storageError ? <StatusMessage compact>{communityText('Loading storage…')}</StatusMessage> : null}
            {view === 'storage' && storageError ? <Notice variant="error" className={styles.notice}>{storageError}</Notice> : null}

            {(!view || view === 'overview') ? <React.Fragment>
                {quota && (quota.used / quota.limit) * 100 >= 80 ? (
                    <div className={styles.alerts} aria-label={communityText('Items needing attention')}>
                        {quota && (quota.used / quota.limit) * 100 >= 80 ? (
                            <Notice variant="warning">
                                {communityText('Your projects use {value1}% of your storage.', {value1: Math.round((quota.used / quota.limit) * 100)})}
                            </Notice>
                        ) : null}
                    </div>
                ) : null}

                <section className={styles.overviewSection} aria-labelledby="admin-summary-heading">
                    <SectionHeading
                        as="h3"
                        id="admin-summary-heading"
                        icon={BarChart3}
                        title={communityText('At a glance')}
                        lead={communityText('Current platform totals.')}
                    />
                    <div className={styles.primaryStatGrid}>
                        <StatTile
                            prominent icon={FolderOpen} label={communityText('Projects')} value={num(stats.totalProjects)}
                            detail={communityText('{value1} shared', {value1: num(stats.sharedProjects)})}
                        />
                        <StatTile
                            prominent icon={User} label={communityText('Users')} value={num(stats.totalUsers)}
                            detail={communityText('{value1} banned', {value1: num(stats.bannedUsers)})}
                        />
                        <StatTile
                            prominent icon={Activity} label={communityText('Active sessions')} value={num(stats.activeSessions)}
                            detail={communityText('Signed in now')}
                        />
                        <StatTile
                            prominent icon={Flag} label={communityText('Open reports')} value={num(stats.openReports)}
                            detail={stats.openReports ? communityText('Needs review') : communityText('Queue is clear')}
                        />
                        <StatTile
                            prominent icon={AlertTriangle} label={communityText('Open errors')} value={num(stats.openErrors)}
                            detail={stats.openErrors ? communityText('Needs review') : communityText('Queue is clear')}
                        />
                    </div>
                </section>

                <div className={styles.summaryColumns}>
                    <section className={styles.summaryPanel} aria-labelledby="admin-content-heading">
                        <SectionHeading
                            as="h3"
                            id="admin-content-heading"
                            icon={FolderOpen}
                            title={communityText('Projects and storage')}
                            lead={communityText('Publishing state and disk use.')}
                        />
                        <div className={styles.compactStatGrid}>
                            <StatTile label={communityText('Shared')} value={num(stats.sharedProjects)} />
                            <StatTile label={communityText('Unshared')} value={num(stats.unsharedProjects)} />
                            <StatTile label={communityText('Storage used')} value={formatBytes(stats.totalBytes)} />
                            {quota ? <QuotaTile quota={quota} /> : null}
                        </div>
                    </section>
                    <section className={styles.summaryPanel} aria-labelledby="admin-community-heading">
                        <SectionHeading
                            as="h3"
                            id="admin-community-heading"
                            icon={Heart}
                            title={communityText('Community activity')}
                            lead={communityText('Engagement, publishing, and moderation totals.')}
                        />
                        <div className={styles.compactStatGrid}>
                            <StatTile icon={Eye} label={communityText('Views')} value={num(stats.totalViews)} />
                            <StatTile icon={Heart} label={communityText('Loves')} value={num(stats.totalLoves)} />
                            <StatTile icon={Ban} label={communityText('Banned users')} value={num(stats.bannedUsers)} />
                            <StatTile icon={Newspaper} label={communityText('News posts')} value={num(stats.newsPosts)} />
                        </div>
                    </section>
                </div>
            </React.Fragment> : null}

            {view === 'activity' ? <React.Fragment>
                <section className={styles.overviewSection} aria-labelledby="admin-insights-heading">
                    <SectionHeading
                        as="h3"
                        id="admin-insights-heading"
                        icon={Activity}
                        title={communityText('Operational insights')}
                        lead={communityText('Rates and averages that make the raw totals easier to judge.')}
                    />
                    <div className={styles.insightGrid}>
                        <StatTile
                            label={communityText('Projects published')}
                            value={percent(stats.sharedProjects, stats.totalProjects)}
                            detail={communityText('{value1} of {value2} projects', {value1: num(stats.sharedProjects), value2: num(stats.totalProjects)})}
                        />
                        <StatTile
                            label={communityText('Average load, {value1} days', {value1: days})}
                            value={formatLoadTime(stats.averageLoadMs || 0)}
                            detail={communityText('{value1} completed samples', {value1: num(stats.loadTimeSamples)})}
                        />
                        <StatTile
                            label={communityText('Loads reaching start')}
                            value={percent(stats.totalStarts, stats.totalLoads)}
                            detail={communityText('{value1} starts from {value2} loads', {value1: num(stats.totalStarts), value2: num(stats.totalLoads)})}
                        />
                        <StatTile
                            label={communityText('Crashes per 100 loads')}
                            value={stats.totalLoads ? ((stats.totalCrashes / stats.totalLoads) * 100).toFixed(2) : '0.00'}
                            detail={communityText('{value1} crashes recorded', {value1: num(stats.totalCrashes)})}
                        />
                        <StatTile
                            label={communityText('Touch traffic')}
                            value={percent((stats.loadsByDevice || {}).touch, deviceLoads)}
                            detail={communityText('{value1} of {value2} device-tagged loads', {value1: num((stats.loadsByDevice || {}).touch), value2: num(deviceLoads)})}
                        />
                        <StatTile
                            label={communityText('Average project size')}
                            value={formatBytes(stats.averageProjectBytes || 0)}
                            detail={communityText('Across all projects')}
                        />
                        <StatTile
                            label={communityText('Views per project')}
                            value={Number(stats.averageViews || 0).toFixed(1)}
                            detail={communityText('{value1} views total', {value1: num(stats.totalViews)})}
                        />
                        <StatTile
                            label={communityText('Loves per project')}
                            value={Number(stats.averageLoves || 0).toFixed(1)}
                            detail={communityText('{value1} loves total', {value1: num(stats.totalLoves)})}
                        />
                        <StatTile
                            label={communityText('Projects remixed')}
                            value={percent(stats.totalRemixes, stats.totalProjects)}
                            detail={communityText('{value1} remix projects', {value1: num(stats.totalRemixes)})}
                        />
                        <StatTile
                            label={communityText('Recorded playtime')}
                            value={formatPlaytime(stats.totalPlaytimeMs || 0, false)}
                            detail={communityText('All time')}
                        />
                    </div>
                </section>

                <section className={styles.overviewSection} aria-labelledby="admin-trends-heading">
                    <SectionHeading
                        as="h3"
                        id="admin-trends-heading"
                        icon={TrendingUp}
                        title={communityText('Trends')}
                        lead={communityText("Dashed lines estimate today's UTC close from its current pace and the prior seven days.")}
                    />
                    <div className={styles.charts}>
                        <AnalyticsChart
                            title={communityText('Average project load time')}
                            description={communityText('{value1} completed player loads in this period. Days without a sample appear as gaps.', {value1: num(stats.loadTimeSamples)})}
                            series={loadTimeSeries}
                            yLabel={communityText('Milliseconds')}
                            formatValue={formatLoadTime}
                            estimateToday={false}
                        />
                        <AnalyticsChart
                            title={communityText('Project uploads')}
                            description={communityText('Projects created each day, including shared and unshared projects.')}
                            series={projectSeries}
                            yLabel={communityText('Projects')}
                            estimateToday
                        />
                        <AnalyticsChart
                            title={communityText('Project updates')}
                            description={communityText('Projects grouped by their latest edit date. Each project appears once.')}
                            series={updateSeries}
                            yLabel={communityText('Projects')}
                            accent="#8b7cf6"
                            estimateToday
                        />
                        <AnalyticsChart
                            title={communityText('Player loads')}
                            description={communityText('Completed loads from embedded MistWarp project players.')}
                            series={loadSeries}
                            yLabel={communityText('Loads')}
                            accent="#36b37e"
                            estimateToday
                        />
                        <AnalyticsChart
                            title={communityText('New users')}
                            description={communityText('Accounts grouped by the date their MistWarp profile was created.')}
                            series={userSeries}
                            yLabel={communityText('Users')}
                            accent="#e5a84b"
                            estimateToday
                        />
                        <AnalyticsChart
                            title={communityText('Current sessions by sign-in date')}
                            description={communityText('Unexpired sign-in sessions only. MistWarp removes sessions after seven days.')}
                            series={loginSeries}
                            yLabel={communityText('Sessions')}
                            accent="#dc6d9a"
                            estimateToday
                        />
                    </div>
                </section>

                <SectionHeading
                    className={styles.dataHeader}
                    icon={Database}
                    title={communityText('Daily data')}
                    lead={communityText('Exact values behind the charts. Load averages only use completed loads with a recorded duration.')}
                    actions={(
                        <React.Fragment>
                            <Button onClick={() => setShowDailyData(!showDailyData)}>
                                {showDailyData ? communityText('Hide data') : communityText('View data')}
                            </Button>
                            <Button onClick={exportDailyData}>
                                <Download size={15} />
                                {communityText('Download CSV')}
                            </Button>
                        </React.Fragment>
                    )}
                />
                {showDailyData ? (
                    <div className={styles.dataTableWrap}>
                        <table className={styles.dataTable}>
                            <thead><tr><th>{communityText('Date')}</th><th>{communityText('Uploads')}</th><th>{communityText('Updates')}</th><th>{communityText('Users')}</th><th>{communityText('Sessions')}</th><th>{communityText('Loads')}</th><th>{communityText('Average load')}</th><th>{communityText('Samples')}</th><th>{communityText('Starts')}</th><th>{communityText('Crashes')}</th></tr></thead>
                            <tbody>{dailyRows.map(row => (
                                <tr key={row.date}>
                                    <th scope="row">{row.date}</th><td>{num(row.projects)}</td><td>{num(row.updates)}</td><td>{num(row.users)}</td><td>{num(row.sessions)}</td><td>{num(row.loads)}</td><td>{row.loadSamples ? formatLoadTime(row.averageLoadMs) : communityText('No sample')}</td><td>{num(row.loadSamples)}</td><td>{num(row.starts)}</td><td>{num(row.crashes)}</td>
                                </tr>
                            ))}</tbody>
                        </table>
                    </div>
                ) : null}
            </React.Fragment> : null}
        </div>
    );
};

export default StatsOverview;
