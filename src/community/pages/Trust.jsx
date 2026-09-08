import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
/* eslint-disable max-len */
import React, {useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import api from '../api';
import Button from '../components/ui/Button.jsx';
import Markdown from '../components/Markdown.jsx';
import styles from './InfoPage.module.css';

const Trust = () => {
    const {text: communityText} = useCommunityText();
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
                <h1>{communityText('Trust, privacy, and terms')}</h1>
                <p>{communityText('What MistWarp stores, how community moderation works, and the controls available to you.')}</p>
            </header>
            <div className={styles.grid}>
                <section className={styles.section}>
                    <h2>{communityText('Your account')}</h2>
                    <p>{communityText('Rotur provides MistWarp accounts and sign-in. MistWarp receives your Rotur username and account ID when you sign in. Rotur account security, credentials, and account recovery stay with Rotur.')}</p>
                    <p>{communityText('MistWarp is made by Sophie, who uses the names Mist and Mistium online. Official moderation messages come through MistWarp itself, not lookalike accounts or projects.')}</p>
                    <p><a href="https://rotur.dev/me" target="_blank" rel="noreferrer">{communityText('Manage your Rotur account')}</a></p>
                </section>
                <section className={styles.section}>
                    <h2>{communityText('Your controls')}</h2>
                    <p>{communityText('You can export the data tied to your MistWarp profile, delete that data, mute users, and block interactions from your settings or a user profile.')}</p>
                    <p><Link to="/settings?section=data">{communityText('Open data settings')}</Link></p>
                </section>
            </div>
            <section className={styles.section}>
                <h2>{communityText('Privacy')}</h2>
                <p>{communityText("MistWarp stores the profile details you add, projects and their assets, comments, reactions, activity, notification history, settings, moderation records, and safety preferences. Project diagnostics may include load time, input device type, and a short runtime error. They do not include scripts, variable values, or the viewer's username.")}</p>
                <p>{communityText('Project blobs may be stored in Cloudflare R2. Project repositories and contribution history may be stored on git.rotur.dev. MistWarp uses Rotur for identity and notifications.')}</p>
                <p>{communityText('Public projects, profiles, comments, and activity can be seen by other people. Unlisted content is available to anyone with its link. Do not put private information in a project or public profile.')}</p>
                <p>{communityText('Deleting your MistWarp data deletes your MistWarp projects and does not delete your Rotur account. Public comments are anonymized where removing them would break conversations.')}</p>
            </section>
            <section className={styles.section}>
                <h2>{communityText('Community terms')}</h2>
                {agreement === null ? <p>{communityText('Loading the current community agreement…')}</p> : null}
                {agreement === false ? <p>{communityText('Could not load the current agreement. ')}<Button onClick={() => setAttempt(value => value + 1)}>{communityText('Try again')}</Button></p> : null}
                {agreement ? <Markdown className={styles.agreement}>{agreement.text}</Markdown> : null}
            </section>
            <section className={styles.section}>
                <h2>{communityText('Moderation and appeals')}</h2>
                <p>{communityText('Use the report button on a project, profile, or comment when another user or piece of content breaks the community rules. Reports go to MistWarp moderators.')}</p>
                <p>{communityText('If you think an account action was wrong, send a moderation appeal through ')}<Link to="/support?topic=appeal">{communityText('support')}</Link>{communityText('. Include the affected Rotur username and explain what you want reviewed.')}</p>
            </section>
        </main>
    );
};

export default Trust;
