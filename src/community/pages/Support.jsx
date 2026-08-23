/* eslint-disable max-len */
import React, {useEffect, useRef, useState} from 'react';
import {Link, useSearchParams} from 'react-router-dom';
import api from '../api';
import {useUser} from '../UserContext.jsx';
import Button from '../components/ui/Button.jsx';
import styles from './InfoPage.module.css';

const TOPICS = ['account', 'safety', 'legal', 'appeal'];
const supportPayload = (form, user) => ({
    ...form,
    username: user && user.username ? user.username : form.username.trim(),
    subject: form.subject.trim(),
    message: form.message.trim()
});

const Support = () => {
    const {user} = useUser();
    const [params] = useSearchParams();
    const requestedTopic = params.get('topic');
    const viewerName = (user && user.username) || '';
    const requestContext = `${viewerName}\u0000${requestedTopic || ''}`;
    const requestContextRef = useRef(requestContext);
    requestContextRef.current = requestContext;
    const [form, setForm] = useState({type: TOPICS.includes(requestedTopic) ? requestedTopic : 'account', username: user ? user.username : '', subject: '', message: ''});
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [sent, setSent] = useState(false);
    const submitLocks = useRef(new Set());
    const update = (key, value) => setForm(current => ({...current, [key]: value}));
    useEffect(() => {
        if (TOPICS.includes(requestedTopic)) update('type', requestedTopic);
        setSent(false);
        setError('');
        setBusy(false);
    }, [requestedTopic]);
    useEffect(() => {
        setForm(current => ({...current, username: viewerName, subject: '', message: ''}));
        setSent(false);
        setError('');
        setBusy(false);
    }, [viewerName]);
    const submit = async event => {
        event.preventDefault();
        const context = requestContextRef.current;
        const payload = supportPayload(form, user);
        if (!payload.username || !payload.subject || !payload.message) {
            setError('Complete every field before sending your request.');
            return;
        }
        if (submitLocks.current.has(context)) return;
        submitLocks.current.add(context);
        setBusy(true);
        setError('');
        try {
            await api.support(payload);
            if (requestContextRef.current === context) setSent(true);
        } catch (e) {
            if (requestContextRef.current === context) setError(e.message || 'Could not send your request.');
        } finally {
            submitLocks.current.delete(context);
            if (requestContextRef.current === context) setBusy(false);
        }
    };
    return (
        <main className={styles.page}>
            <header className={styles.head}>
                <h1>Support</h1>
                <p>Contact MistWarp about accounts, safety, legal questions, or moderation decisions.</p>
            </header>
            <section className={styles.section}>
                <h2>Found a product bug?</h2>
                <p>Post it on the <Link to="/roadmap?new=bug">Roadmap bug tracker</Link>. Other users can confirm it, add context, and follow its status.</p>
            </section>
            <section className={styles.section}>
                <h2>Send a private request</h2>
                {sent ? <p className={styles.success}>Your request was sent to the MistWarp moderators.</p> : (
                    <form className={styles.form} onSubmit={submit}>
                        <label>Topic<select value={form.type} disabled={busy} onChange={event => update('type', event.target.value)}><option value="account">Account help</option><option value="safety">Safety concern</option><option value="legal">Legal or copyright</option><option value="appeal">Moderation appeal</option></select></label>
                        <label>Rotur username<input value={user ? user.username : form.username} disabled={Boolean(user) || busy} required maxLength={80} onChange={event => update('username', event.target.value)} /></label>
                        <label>Subject<input value={form.subject} disabled={busy} required maxLength={120} onChange={event => update('subject', event.target.value)} /></label>
                        <label>Message<textarea value={form.message} disabled={busy} required maxLength={3000} onChange={event => update('message', event.target.value)} /></label>
                        {error ? <p className={styles.error}>{error}</p> : null}
                        <div className={styles.actions}><Button variant="primary" type="submit" busy={busy} busyLabel="Sending…">Send request</Button></div>
                    </form>
                )}
            </section>
        </main>
    );
};

export {supportPayload};
export default Support;
