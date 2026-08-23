/* eslint-disable max-len */
import React, {useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import api from '../api';
import Button from '../components/ui/Button.jsx';
import styles from './InfoPage.module.css';

const Trust = () => {
    const [agreement, setAgreement] = useState(null);
    const [attempt, setAttempt] = useState(0);
    useEffect(() => {
        let active = true;
        setAgreement(null);
        api.agreement()
            .then(data => active && setAgreement(data.agreement))
            .catch(() => active && setAgreement(false));
        return () => {
            active = false;
        };
    }, [attempt]);
    return (
        <main className={styles.page}>
            <header className={styles.head}>
                <h1>Trust, privacy, and terms</h1>
                <p>What MistWarp stores, how community moderation works, and the controls available to you.</p>
            </header>
            <div className={styles.grid}>
                <section className={styles.section}>
                    <h2>Your account</h2>
                    <p>Rotur provides MistWarp accounts and sign-in. MistWarp receives your Rotur username and account ID when you sign in. Rotur account security, credentials, and account recovery stay with Rotur.</p>
                    <p><a href="https://rotur.dev/me" target="_blank" rel="noreferrer">Manage your Rotur account</a></p>
                </section>
                <section className={styles.section}>
                    <h2>Your controls</h2>
                    <p>You can export the data tied to your MistWarp profile, delete that data, mute users, and block interactions from your settings or a user profile.</p>
                    <p><Link to="/settings?section=data">Open data settings</Link></p>
                </section>
            </div>
            <section className={styles.section}>
                <h2>Privacy</h2>
                <p>MistWarp stores the profile details you add, projects and their assets, comments, reactions, activity, notification history, settings, moderation records, and safety preferences. Project diagnostics may include load time, input device type, and a short runtime error. They do not include scripts, variable values, or the viewer&apos;s username.</p>
                <p>Project blobs may be stored in Cloudflare R2. Project repositories and contribution history may be stored on git.rotur.dev. MistWarp uses Rotur for identity and notifications.</p>
                <p>Public projects, profiles, comments, and activity can be seen by other people. Unlisted content is available to anyone with its link. Do not put private information in a project or public profile.</p>
                <p>Deleting your MistWarp data deletes your MistWarp projects and does not delete your Rotur account. Public comments are anonymized where removing them would break conversations.</p>
            </section>
            <section className={styles.section}>
                <h2>Community terms</h2>
                {agreement === null ? <p>Loading the current community agreement…</p> : null}
                {agreement === false ? <p>Could not load the current agreement. <Button onClick={() => setAttempt(value => value + 1)}>Try again</Button></p> : null}
                {agreement ? <div className={styles.agreement}>{agreement.text}</div> : null}
            </section>
            <section className={styles.section}>
                <h2>Moderation and appeals</h2>
                <p>Use the report button on a project, profile, or comment when another user or piece of content breaks the community rules. Reports go to MistWarp moderators.</p>
                <p>If you think an account action was wrong, send a moderation appeal through <Link to="/support?topic=appeal">support</Link>. Include the affected Rotur username and explain what you want reviewed.</p>
            </section>
        </main>
    );
};

export default Trust;
