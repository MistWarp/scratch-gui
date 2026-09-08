import {getCommunityLocale} from '../locale.js';
import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
import React, {useEffect, useState} from 'react';
import {Eye, FolderOpen, Heart, Play, Users} from 'lucide-react';
import api from '../api.js';
import Button from '../components/ui/Button.jsx';
import {AnalyticsChart, buildSeries} from './Admin.jsx';
import styles from './Stats.module.css';

const Stat = ({icon: Icon, label, value}) => (
    <div className={styles.stat}>
        <Icon size={18} />
        <span>{label}</span>
        <strong>{Number(value || 0).toLocaleString(getCommunityLocale())}</strong>
    </div>
);

const Stats = () => {
    const {text: communityText} = useCommunityText();
    const [stats, setStats] = useState(null);
    const [error, setError] = useState('');
    const load = () => {
        setError('');
        api.publicStats(30)
            .then(setStats)
            .catch(cause => setError(cause.message || 'Could not load platform stats.'));
    };
    useEffect(load, []);

    return (
        <main className={styles.page}>
            <header className={styles.head}>
                <h1>{communityText('MistWarp by the numbers')}</h1>
                <p>{communityText('A public look at what the community is building and playing.')}</p>
            </header>
            {error ? <div className={styles.state}><p>{error}</p><Button onClick={load}>{communityText('Try again')}</Button></div> : null}
            {!error && !stats ? <p className={styles.state}>{communityText('Loading stats…')}</p> : null}
            {stats ? <>
                <section className={styles.statGrid} aria-label={communityText('Platform totals')}>
                    <Stat icon={FolderOpen} label={communityText('Public projects')} value={stats.sharedProjects} />
                    <Stat icon={Users} label={communityText('Community members')} value={stats.totalUsers} />
                    <Stat icon={Eye} label={communityText('Project views')} value={stats.totalViews} />
                    <Stat icon={Heart} label={communityText('Project likes')} value={stats.totalLoves} />
                    <Stat icon={Play} label={communityText('Player loads this month')} value={stats.totalLoads} />
                </section>
                <section className={styles.charts} aria-label={communityText('Platform trends')}>
                    <AnalyticsChart
                        title={communityText('New public projects')}
                        description={communityText('Public projects created each day.')}
                        series={buildSeries(stats.projectsByDay, 30)}
                        yLabel="Projects"
                        estimateToday
                    />
                    <AnalyticsChart
                        title={communityText('New community members')}
                        description={communityText('MistWarp profiles created each day.')}
                        series={buildSeries(stats.usersByDay, 30)}
                        yLabel="Members"
                        accent="#e5a84b"
                        estimateToday
                    />
                    <AnalyticsChart
                        title={communityText('Project player loads')}
                        description={communityText('Completed player loads across public MistWarp projects.')}
                        series={buildSeries(stats.loadsByDay, 30)}
                        yLabel="Loads"
                        accent="#36b37e"
                        estimateToday
                    />
                    <AnalyticsChart
                        title={communityText('Projects started')}
                        description={communityText('Players pressing start after a project loads.')}
                        series={buildSeries(stats.startsByDay, 30)}
                        yLabel="Starts"
                        accent="#8b7cf6"
                        estimateToday
                    />
                </section>
                <p className={styles.note}>{communityText('Charts show the last 30 days and refresh from cached aggregate data.')}</p>
            </> : null}
        </main>
    );
};

export default Stats;
