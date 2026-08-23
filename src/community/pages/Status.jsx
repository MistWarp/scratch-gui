/* eslint-disable max-len */
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {Link} from 'react-router-dom';
import Button from '../components/ui/Button.jsx';
import {useCommunityIntl} from '../i18n.jsx';
import styles from './InfoPage.module.css';

const STATUS_BASE = process.env.MW_STATUS_URL || '';

const Status = () => {
    const {t} = useCommunityIntl();
    const [status, setStatus] = useState(null);
    const [history, setHistory] = useState([]);
    const [failed, setFailed] = useState(false);
    const check = useCallback(() => {
        setFailed(false);
        Promise.all([
            fetch(`${STATUS_BASE}/v1/status`).then(response => (response.ok ? response.json() : Promise.reject(new Error('status failed')))),
            fetch(`${STATUS_BASE}/v1/history?hours=168`).then(response => (response.ok ? response.json() : Promise.reject(new Error('history failed'))))
        ]).then(([nextStatus, nextHistory]) => {
            setStatus(nextStatus);
            setHistory(nextHistory.buckets || []);
        }).catch(() => setFailed(true));
    }, []);
    useEffect(check, [check]);
    const uptimeByService = useMemo(() => {
        const totals = {};
        history.forEach(bucket => {
            const entry = totals[bucket.service] || {uptime: 0, samples: 0};
            entry.uptime += Number(bucket.uptime) * Number(bucket.samples);
            entry.samples += Number(bucket.samples);
            totals[bucket.service] = entry;
        });
        return Object.keys(totals).reduce((result, service) => ({
            ...result,
            [service]: totals[service].samples ? totals[service].uptime / totals[service].samples : 0
        }), {});
    }, [history]);
    const label = value => t(`status.${['operational', 'degraded', 'unavailable'].includes(value) ? value : 'unknown'}`);
    const statusClass = value => (value === 'operational' ? styles.statusOk : value === 'degraded' ? styles.statusWarn : value === 'unavailable' ? styles.statusBad : styles.statusChecking);
    return (
        <main className={styles.page}>
            <header className={styles.head}><h1>{t('status.title')}</h1><p>{t('status.lead')}</p></header>
            <section className={styles.section} aria-live="polite" aria-busy={!status && !failed}>
                {!status && !failed ? <p>{t('status.loading')}</p> : null}
                {failed ? <p className={styles.error} role="alert">{t('status.failed')}</p> : null}
                {(status?.services || []).map(service => (
                    <div className={styles.statusRow} key={service.service}>
                        <span><strong>{service.name}</strong><small>{service.latencyMs} ms · {t('status.history')} {uptimeByService[service.service]?.toFixed(2) || '0.00'}%</small></span>
                        <span className={statusClass(service.status)}>{label(service.status)}</span>
                    </div>
                ))}
                <div className={styles.actions}><Button onClick={check}>{t('status.retry')}</Button>{status?.generatedAt ? <time dateTime={new Date(status.generatedAt).toISOString()}>Updated {new Date(status.generatedAt).toLocaleString()}</time> : null}</div>
            </section>
            <section className={styles.section}>
                <h2>{t('status.incidents')}</h2>
                {status && !status.incidents?.length ? <p>{t('status.noIncidents')}</p> : null}
                {(status?.incidents || []).map(incident => <article className={styles.incident} key={incident.id}><div><strong>{incident.title}</strong><span className={statusClass(incident.status === 'resolved' ? 'operational' : 'unavailable')}>{incident.status}</span></div><p>{incident.body}</p><time dateTime={new Date(incident.createdAt).toISOString()}>{new Date(incident.createdAt).toLocaleString()}</time></article>)}
            </section>
            <section className={styles.section}><h2>Still having trouble?</h2><p>This monitor cannot detect browser-specific problems. If a problem continues, use the <Link to="/support">support page</Link>.</p></section>
        </main>
    );
};

export default Status;
