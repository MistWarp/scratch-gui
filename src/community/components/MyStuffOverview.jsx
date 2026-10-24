/* eslint-disable max-len */
import {getCommunityLocale} from '../locale.js';
import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import React, {useEffect, useState} from 'react';
import {storageRemaining, storageSize} from './MyStuffStorage.jsx';
import {getWallet} from '../../lib/rotur/wallet.js';
import StatChart, {historyRows} from './StatChart.jsx';
import {ContinueProjects} from './HomeWorkspace.jsx';
import QuietLink from './ui/QuietLink.jsx';
import SectionHeading from './ui/SectionHeading.jsx';
import StatusMessage from './ui/StatusMessage.jsx';
import styles from './MyStuffOverview.module.css';

const fmt = value => (Number(value) || 0).toLocaleString(getCommunityLocale());
const fmtCredits = value => (Math.round((Number(value) || 0) * 100) / 100).toLocaleString(getCommunityLocale());

const weekTrend = stats => {
    const rows = historyRows(stats.viewHistory, 14);
    const week = rows.slice(7).reduce((sum, row) => sum + row.value, 0);
    const previous = rows.slice(0, 7).reduce((sum, row) => sum + row.value, 0);
    const trend = previous > 0 ? Math.round(((week - previous) / previous) * 100) : null;
    return {rows, week, previous, trend};
};

const Stat = ({label, note, value}) => (
    <div className={styles.stat}>
        <span className={styles.value}>{value}</span>
        <span className={styles.label}>{label}</span>
        {note ? <span className={styles.note}>{note}</span> : null}
    </div>
);

Stat.propTypes = {
    label: PropTypes.node.isRequired,
    note: PropTypes.node,
    value: PropTypes.node.isRequired
};

const Views = ({stats}) => {
    const {text: communityText} = useCommunityText();
    const {rows, week, previous, trend} = weekTrend(stats);
    let note = null;
    if (trend !== null) {
        note = communityText('{value1}{value2}% on the week before', {value1: trend > 0 ? '+' : '', value2: trend});
    } else if (week > 0 && !previous) {
        note = communityText('New this week');
    }
    return (
        <div className={styles.views}>
            <div className={styles.stats}>
                <Stat value={fmt(week)} label={communityText('Views this week')} note={note} />
                <Stat value={fmt(stats.totalViews)} label={communityText('Total views')} />
                <Stat value={fmt(stats.totalHearts)} label={communityText('Hearts')} />
                <Stat
                    value={fmt(stats.projectCount)}
                    label={communityText('Projects')}
                    note={communityText('{value1} shared', {value1: fmt(stats.sharedCount)})}
                />
            </div>
            <figure className={styles.chart}>
                <StatChart
                    bare
                    title=""
                    rows={rows}
                    emptyText={communityText('No views yet. Share a project to get started.')}
                />
                <figcaption className={styles.caption}>{communityText('Views over the last 2 weeks')}</figcaption>
            </figure>
        </div>
    );
};

Views.propTypes = {
    stats: PropTypes.object.isRequired
};

const MyStuffOverview = ({onRetryStats, quota, stats, statsFailed, username}) => {
    const {text: communityText} = useCommunityText();
    const [wallet, setWallet] = useState(null);

    useEffect(() => {
        setWallet(null);
        if (!username) return () => {};
        let stale = false;
        getWallet()
            .then(data => !stale && setWallet(data))
            .catch(() => {});
        return () => {
            stale = true;
        };
    }, [username]);

    const known = Boolean(quota) && quota.known !== false && Number(quota.limit) > 0;
    const size = storageSize(quota);
    const limit = known ? Number(quota.limit) : 0;
    const pct = known ? ((quota.used + (quota.pending || 0)) / limit) * 100 : 0;

    return (
        <div className={styles.overview}>
            <section aria-labelledby="mystuff-views">
                <SectionHeading
                    id="mystuff-views"
                    title={communityText('Views')}
                />
                {stats ? <Views stats={stats} /> : statsFailed ? (
                    <StatusMessage compact error onRetry={onRetryStats}>{communityText('Could not load your views.')}</StatusMessage>
                ) : (
                    <div className={styles.statsSkeleton} aria-hidden="true">
                        {[0, 1, 2, 3].map(index => <span key={index} />)}
                    </div>
                )}
            </section>

            <ContinueProjects username={username} />

            <div className={styles.facts}>
                <section aria-labelledby="mystuff-storage">
                    <SectionHeading
                        as="h3"
                        id="mystuff-storage"
                        title={communityText('Storage')}
                        actions={<QuietLink to="/mystuff?section=uploads">{communityText('Manage storage')}</QuietLink>}
                    />
                    {known ? (
                        <React.Fragment>
                            <p className={styles.fact}>
                                <strong>{size(quota.used)}</strong>
                                {' '}
                                {quota.shared ?
                                    communityText('of {value1} used across Rotur', {value1: size(limit)}) :
                                    communityText('of {value1} used', {value1: size(limit)})}
                            </p>
                            <span className={classNames(styles.meter, {[styles.meterFull]: storageRemaining(quota) <= 0})} aria-hidden="true">
                                <span style={{width: `${Math.min(100, pct)}%`}} />
                            </span>
                            {quota.shared ? (
                                <p className={styles.factNote}>
                                    {communityText('MistWarp uses {value1} of it.', {value1: size(quota.mistwarp || 0)})}
                                </p>
                            ) : null}
                        </React.Fragment>
                    ) : (
                        <p className={styles.fact}>
                            {quota ? communityText('Rotur couldn’t say how much storage you have left just now. Try again in a minute.') :
                                communityText('Loading storage usage…')}
                        </p>
                    )}
                </section>
                <section aria-labelledby="mystuff-wallet">
                    <SectionHeading
                        as="h3"
                        id="mystuff-wallet"
                        title={communityText('Wallet')}
                        actions={<QuietLink to="/wallet">{communityText('Open wallet')}</QuietLink>}
                    />
                    <p className={styles.fact}>
                        {wallet && wallet.allowed ? (
                            <React.Fragment>
                                <strong>{fmtCredits(wallet.balance)}</strong>
                                {' '}
                                {communityText('credits on Rotur')}
                            </React.Fragment>
                        ) : communityText('Your Rotur credits, tips and purchases.')}
                    </p>
                </section>
            </div>
        </div>
    );
};

MyStuffOverview.propTypes = {
    onRetryStats: PropTypes.func.isRequired,
    quota: PropTypes.object,
    stats: PropTypes.object,
    statsFailed: PropTypes.bool,
    username: PropTypes.string.isRequired
};

export {weekTrend};
export default MyStuffOverview;
