/* eslint-disable max-len */
import React, {useCallback, useEffect, useState} from 'react';
import {ArrowLeft, Coins, Flag, MessageSquare, Trash2, Trophy, Users} from 'lucide-react';
import {Link, useParams} from 'react-router-dom';
import api, {projectUrl} from '../api.js';
import {listCommerceBounties} from '../credits.js';
import Avatar from '../components/Avatar.jsx';
import RichText from '../components/RichText.jsx';
import Button from '../components/ui/Button.jsx';
import ReportModal from '../components/ReportModal.jsx';
import UserLink from '../components/UserLink.jsx';
import {useUser} from '../UserContext.jsx';
import {timeAgo} from '../format.js';
import styles from './Bounty.module.css';

const Bounty = () => {
    const {id} = useParams();
    const {user, login} = useUser();
    const [bounty, setBounty] = useState(null);
    const [project, setProject] = useState(null);
    const [activity, setActivity] = useState({comments: [], workers: []});
    const [comment, setComment] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [reporting, setReporting] = useState(null);

    const refreshActivity = useCallback(async () => {
        const data = await api.bountyActivity(id);
        setActivity({comments: data.comments || [], workers: data.workers || []});
    }, [id]);

    const load = useCallback(async () => {
        setError('');
        try {
            const data = await listCommerceBounties({source: 'mistwarp', resource_type: 'project', status: ''});
            const found = (data.bounties || []).find(item => item.id === id);
            if (!found) throw new Error('Bounty not found.');
            const projectData = await api.getProject(found.resource_id);
            const loadedProject = projectData.project || projectData;
            if (!loadedProject.shared || (loadedProject.visibility || 'public') !== 'public') throw new Error('Bounty not found.');
            setBounty(found);
            setProject(loadedProject);
            await refreshActivity();
        } catch (loadError) {
            setError(loadError.message || 'Could not load this bounty.');
        }
    }, [id, refreshActivity]);

    useEffect(() => {
        load();
    }, [load]);

    const registered = activity.workers.some(worker => worker.isViewer || (user && worker.username.toLowerCase() === user.username.toLowerCase()));
    const toggleRegistration = async () => {
        if (!user) {
            login();
            return;
        }
        setBusy(true);
        setError('');
        try {
            const data = registered ? await api.leaveBounty(id) : await api.joinBounty(id);
            setActivity(current => ({...current, workers: data.workers || []}));
        } catch (actionError) {
            setError(actionError.message || 'Could not update your registration.');
        } finally {
            setBusy(false);
        }
    };
    const submitComment = async event => {
        event.preventDefault();
        if (!user) return login();
        if (!comment.trim()) return;
        setBusy(true);
        setError('');
        try {
            await api.addBountyComment(id, comment.trim());
            setComment('');
            await refreshActivity();
        } catch (actionError) {
            setError(actionError.message || 'Could not post your comment.');
        } finally {
            setBusy(false);
        }
    };
    const deleteComment = async commentId => {
        setBusy(true);
        try {
            await api.deleteBountyComment(id, commentId);
            await refreshActivity();
        } catch (actionError) {
            setError(actionError.message || 'Could not delete that comment.');
        } finally {
            setBusy(false);
        }
    };

    if (error && !bounty) return <main className={styles.page}><Link className={styles.back} to="/bounties"><ArrowLeft size={15} /> Bounties</Link><div className={styles.state}><p>{error}</p><Button onClick={load}>Try again</Button></div></main>;
    if (!bounty || !project) return <main className={styles.page}><p className={styles.state}>Loading bounty…</p></main>;

    return (
        <main className={styles.page}>
            <Link className={styles.back} to="/bounties"><ArrowLeft size={15} /> All bounties</Link>
            <header className={styles.hero}>
                <div className={styles.heroMain}><span className={styles.icon}><Trophy size={22} /></span><div><div className={styles.reward}><Coins size={15} /> {bounty.amount} credits</div><h1>{bounty.title}</h1><p>On <Link to={projectUrl(project.id)}>{project.title}</Link> by <UserLink username={project.owner}>{project.owner}</UserLink></p></div></div>
                <div className={styles.heroActions}>
                    {user && user.username.toLowerCase() !== project.owner.toLowerCase() ? (
                        <Button
                            variant="secondary"
                            onClick={() => setReporting({
                                type: 'bounty',
                                target: bounty.id,
                                targetUser: project.owner,
                                context: `project ${project.id}: ${bounty.title}\n${bounty.description || ''}`
                            })}
                        ><Flag size={15} /> Report</Button>
                    ) : null}
                    <Button variant={registered ? 'secondary' : 'primary'} busy={busy} busyLabel="Updating…" onClick={toggleRegistration}>{registered ? 'Stop working on this' : 'I’m working on this'}</Button>
                </div>
            </header>
            <div className={styles.layout}>
                <section className={styles.main}>
                    <article className={styles.details}><h2>What needs doing</h2><p>{bounty.description || 'No additional details were provided.'}</p></article>
                    <section className={styles.conversation}>
                        <h2><MessageSquare size={17} /> Conversation <span>{activity.comments.length}</span></h2>
                        {activity.comments.length ? activity.comments.map(item => (
                            <article className={styles.message} key={item.id}>
                                <header><Link to={`/users/${item.author}`}><Avatar username={item.author} size={28} /><strong>{item.author}</strong></Link><span>{timeAgo(item.created)}</span>{user && user.username.toLowerCase() !== item.author.toLowerCase() ? <button disabled={busy} title="Report comment" onClick={() => setReporting({type: 'comment', target: item.id, targetUser: item.author, context: `bounty ${bounty.id}`})}><Flag size={14} /></button> : null}{item.canDelete ? <button disabled={busy} title="Delete comment" onClick={() => deleteComment(item.id)}><Trash2 size={14} /></button> : null}</header>
                                <div><RichText text={item.content} /></div>
                            </article>
                        )) : <p className={styles.empty}>No comments yet. Ask a question or coordinate the work.</p>}
                        <form className={styles.composer} onSubmit={submitComment}>
                            {user ? <Avatar username={user.username} size={32} /> : null}
                            <div><textarea maxLength={1000} value={comment} placeholder="Discuss this bounty" disabled={busy} onChange={event => setComment(event.target.value)} /><footer>{error ? <span>{error}</span> : <span>{comment.length}/1000</span>}<Button type="submit" disabled={!comment.trim()}>{user ? 'Comment' : 'Sign in to comment'}</Button></footer></div>
                        </form>
                    </section>
                </section>
                <aside className={styles.workers}>
                    <h2><Users size={17} /> Working on this <span>{activity.workers.length}</span></h2>
                    {activity.workers.length ? activity.workers.map(worker => <Link key={worker.username} to={`/users/${worker.username}`}><Avatar username={worker.username} size={30} /><span><strong>{worker.username}</strong><small>Joined {timeAgo(worker.created)}</small></span></Link>) : <p>Nobody has registered yet.</p>}
                    <Link className={styles.projectLink} to={`${projectUrl(project.id)}#contribute`}>Open project contribution tools</Link>
                </aside>
            </div>
            {reporting ? <ReportModal {...reporting} onClose={() => setReporting(null)} /> : null}
        </main>
    );
};

export default Bounty;
