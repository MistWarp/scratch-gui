/* eslint-disable max-len */
import React, {useCallback, useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import api from '../api';
import Button from '../components/ui/Button.jsx';
import styles from './InfoPage.module.css';

const Status = () => {
    const [health, setHealth] = useState(null);
    const [failed, setFailed] = useState(false);
    const check = useCallback(() => {
        setHealth(null);
        setFailed(false);
        api.request('/health/dependencies', {cache: false})
            .then(setHealth)
            .catch(() => setFailed(true));
    }, []);
    useEffect(check, [check]);
    const dependencies = health?.dependencies || {};
    const rows = [
        ['Community website', {status: 'operational'}],
        ['MistWarp API', failed ? {status: 'unavailable'} : dependencies.api],
        ['Project metadata', dependencies.storage],
        ['Project assets', dependencies.assets],
        ['Rotur sign-in', dependencies.rotur],
        ['Git and pull requests', dependencies.gitea]
    ];
    const statusLabel = status => status === 'operational' ? 'Operational' : status === 'misconfigured' ? 'Misconfigured' : status === 'unavailable' ? 'Unavailable' : 'Checking';
    const statusClass = status => status === 'operational' ? styles.statusOk : status === 'unavailable' || status === 'misconfigured' ? styles.statusBad : styles.statusChecking;
    return (
        <main className={styles.page}>
            <header className={styles.head}><h1>Service status</h1><p>A live check of the services needed by the MistWarp community.</p></header>
            <section className={styles.section} aria-live="polite" aria-busy={!health && !failed}>
                {rows.map(([name, dependency]) => (
                    <div className={styles.statusRow} key={name}>
                        <span>{name}</span>
                        <span className={statusClass(dependency?.status)}>{statusLabel(dependency?.status)}</span>
                    </div>
                ))}
                <div className={styles.actions}><Button onClick={check}>Check again</Button></div>
            </section>
            <section className={styles.section}><h2>Still having trouble?</h2><p>This check cannot detect browser-specific problems. If a problem continues, use the <Link to="/support">support page</Link>.</p></section>
        </main>
    );
};

export default Status;
