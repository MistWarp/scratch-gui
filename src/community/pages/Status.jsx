/* eslint-disable max-len */
import React, {useCallback, useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import api from '../api';
import Button from '../components/ui/Button.jsx';
import styles from './InfoPage.module.css';

const Status = () => {
    const [apiStatus, setApiStatus] = useState('checking');
    const check = useCallback(() => {
        setApiStatus('checking');
        api.request('/health', {cache: false}).then(() => setApiStatus('ok')).catch(() => setApiStatus('bad'));
    }, []);
    useEffect(check, [check]);
    const label = apiStatus === 'ok' ? 'Operational' : apiStatus === 'bad' ? 'Unavailable' : 'Checking';
    return (
        <main className={styles.page}>
            <header className={styles.head}><h1>Service status</h1><p>A live check of the services needed by the MistWarp community.</p></header>
            <section className={styles.section}>
                <div className={styles.statusRow}><span>Community website</span><span className={styles.statusOk}>Operational</span></div>
                <div className={styles.statusRow}><span>MistWarp API</span><span className={styles[`status${apiStatus === 'ok' ? 'Ok' : apiStatus === 'bad' ? 'Bad' : 'Checking'}`]}>{label}</span></div>
                <div className={styles.actions}><Button onClick={check}>Check again</Button></div>
            </section>
            <section className={styles.section}><h2>Still having trouble?</h2><p>This check does not cover Rotur sign-in, git.rotur.dev, or project asset storage. If a problem continues, use the <Link to="/support">support page</Link>.</p></section>
        </main>
    );
};

export default Status;
