import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
/* eslint-disable max-len */
import React, {useEffect, useRef, useState} from 'react';
import {Link, useSearchParams} from 'react-router-dom';
import api, {editorUrl} from '../api';
import {DISCORD_INVITE} from '../../lib/originchats/links.js';
import {Bug, LifeBuoy, MessagesSquare, Send} from 'lucide-react';
import {useUser} from '../UserContext.jsx';
import Button from '../components/ui/Button.jsx';
import Notice from '../components/ui/Notice.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import SectionHeading from '../components/ui/SectionHeading.jsx';
import styles from './InfoPage.module.css';

const TOPICS = ['account', 'safety', 'legal', 'appeal'];
const supportPayload = (form, user) => ({
    ...form,
    username: user && user.username ? user.username : form.username.trim(),
    subject: form.subject.trim(),
    message: form.message.trim()
});

const normalizeSupportParams = currentParams => {
    const next = new URLSearchParams(currentParams);
    const topic = next.get('topic');
    if (!TOPICS.includes(topic) || topic === 'account') next.delete('topic');
    return next;
};

const withSupportTopic = (currentParams, topic) => {
    const next = new URLSearchParams(currentParams);
    if (topic === 'account') next.delete('topic');
    else next.set('topic', topic);
    return next;
};

const resetSupportForm = (form, user) => ({
    ...form,
    username: user?.username || form.username,
    subject: '',
    message: ''
});

const Support = () => {
    const {text: communityText} = useCommunityText();
    const {user} = useUser();
    const [params, setParams] = useSearchParams();
    const requestedTopic = TOPICS.includes(params.get('topic')) ? params.get('topic') : 'account';
    const viewerName = (user && user.username) || '';
    const requestContext = `${viewerName}\u0000${requestedTopic || ''}`;
    const requestContextRef = useRef(requestContext);
    requestContextRef.current = requestContext;
    const [form, setForm] = useState({type: requestedTopic, username: user ? user.username : '', subject: '', message: ''});
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [sent, setSent] = useState(false);
    const submitLocks = useRef(new Set());
    const update = (key, value) => setForm(current => ({...current, [key]: value}));
    useEffect(() => {
        const normalized = normalizeSupportParams(params);
        if (normalized.toString() !== params.toString()) setParams(normalized, {replace: true});
    }, [params, setParams]);
    useEffect(() => {
        update('type', requestedTopic);
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
            setError(communityText('Complete every field before sending your request.'));
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
            if (requestContextRef.current === context) setError(e.message || communityText('Could not send your request.'));
        } finally {
            submitLocks.current.delete(context);
            if (requestContextRef.current === context) setBusy(false);
        }
    };
    return (
        <main className={styles.page}>
            <PageHeader
                icon={LifeBuoy}
                title={communityText('Support')}
                lead={communityText('Contact MistWarp about accounts, safety, legal questions, or moderation decisions.')}
            />
            <section className={styles.section}>
                <SectionHeading icon={Bug} title={communityText('Found a product bug?')} />
                <p>{communityText('Post it on the roadmap bug tracker. Other users can confirm it, add context, and follow its status.')}</p>
                <p><Link to="/roadmap?new=bug">{communityText('Open the roadmap bug tracker')}</Link></p>
            </section>
            <section className={styles.section}>
                <SectionHeading icon={MessagesSquare} title={communityText('Ask the community')} />
                <p>{communityText('The MistWarp chat is the best place to ask quick questions and talk with other creators. It runs on OriginChats, so you can open it beside your project with the Chat button in the editor, or use any OriginChats client with chats.mistwarp.org.')}</p>
                <p><a href={editorUrl({chat: true})}>{communityText('Open chat in the editor')}</a></p>
                <p>{communityText('Prefer Discord? The chat is bridged with the MistWarp Discord server, so you can join the same conversations there.')}</p>
                <p><a href={DISCORD_INVITE} target="_blank" rel="noreferrer">{communityText('Join the MistWarp Discord server')}</a></p>
            </section>
            <section className={styles.section}>
                <SectionHeading icon={Send} title={communityText('Send a private request')} />
                {sent ? (
                    <Notice
                        variant="success"
                        action={(
                            <Button
                                variant="secondary"
                                onClick={() => {
                                    setForm(current => resetSupportForm(current, user));
                                    setSent(false);
                                }}
                            >{communityText('Send another request')}</Button>
                        )}
                    >
                        {communityText('Your request was sent to the MistWarp moderators.')}
                    </Notice>
                ) : (
                    <form className={styles.form} onSubmit={submit}>
                        <label>{communityText('Topic')}<select value={form.type} disabled={busy} onChange={event => setParams(withSupportTopic(params, event.target.value))}><option value="account">{communityText('Account help')}</option><option value="safety">{communityText('Safety concern')}</option><option value="legal">{communityText('Legal or copyright')}</option><option value="appeal">{communityText('Moderation appeal')}</option></select></label>
                        <label>{communityText('Rotur username')}<input value={user ? user.username : form.username} disabled={Boolean(user) || busy} required maxLength={80} onChange={event => update('username', event.target.value)} /></label>
                        <label>{communityText('Subject')}<input value={form.subject} disabled={busy} required maxLength={120} onChange={event => update('subject', event.target.value)} /></label>
                        <label>{communityText('Message')}<textarea value={form.message} disabled={busy} required maxLength={3000} onChange={event => update('message', event.target.value)} /></label>
                        {error ? <Notice variant="error">{error}</Notice> : null}
                        <div className={styles.actions}><Button variant="primary" type="submit" busy={busy} busyLabel={communityText('Sending…')}><Send size={16} aria-hidden="true" />{communityText('Send request')}</Button></div>
                    </form>
                )}
            </section>
        </main>
    );
};

export {normalizeSupportParams, resetSupportForm, supportPayload, withSupportTopic};
export default Support;
