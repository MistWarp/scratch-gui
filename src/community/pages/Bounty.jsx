import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
/* eslint-disable max-len */
import React, {useCallback, useEffect, useState} from 'react';
import {Coins, Flag, Hammer, MessageSquare, Trash2, Trophy, Users, Wrench} from 'lucide-react';
import {Link, useParams} from 'react-router-dom';
import api, {projectUrl} from '../api.js';
import {listCommerceBounties} from '../credits.js';
import Avatar from '../components/Avatar.jsx';
import RichText from '../components/RichText.jsx';
import Button from '../components/ui/Button.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import SectionHeading from '../components/ui/SectionHeading.jsx';
import StatusMessage from '../components/ui/StatusMessage.jsx';
import ReportModal from '../components/ReportModal.jsx';
import UserLink from '../components/UserLink.jsx';
import {useUser} from '../UserContext.jsx';
import {timeAgo} from '../format.js';
import styles from './Bounty.module.css';

const Bounty = () => {
    const {text: communityText} = useCommunityText();
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
            if (!found) throw new Error(communityText('Bounty not found.'));
            const projectData = await api.getProject(found.resource_id);
            const loadedProject = projectData.project || projectData;
            if (!loadedProject.shared || (loadedProject.visibility || 'public') !== 'public') throw new Error(communityText('Bounty not found.'));
            setBounty(found);
            setProject(loadedProject);
            await refreshActivity();
        } catch (loadError) {
            setError(loadError.message || communityText('Could not load this bounty.'));
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
            setError(actionError.message || communityText('Could not update your registration.'));
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
            setError(actionError.message || communityText('Could not post your comment.'));
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
            setError(actionError.message || communityText('Could not delete that comment.'));
        } finally {
            setBusy(false);
        }
    };

    if (error && !bounty) {
        return (
            <main className={styles.page}>
                <PageHeader compact backTo="/bounties" backLabel={communityText('All bounties')} title={communityText('Bounty')} />
                <StatusMessage error onRetry={load}>{error}</StatusMessage>
            </main>
        );
    }
    if (!bounty || !project) return <main className={styles.page}><StatusMessage>{communityText('Loading bounty…')}</StatusMessage></main>;

    return (
        <main className={styles.page}>
            <PageHeader
                icon={Trophy}
                backTo="/bounties"
                backLabel={communityText('All bounties')}
                title={bounty.title}
                lead={(
                    <React.Fragment>
                        <span className={styles.reward}><Coins size={15} /> {communityText('{amount} credits', {amount: bounty.amount})}</span>
                        {' · '}
                        {communityText('On')} <Link to={projectUrl(project)}>{project.title}</Link> <UserLink username={project.owner}>{communityText('by {owner}', {owner: project.owner})}</UserLink>
                    </React.Fragment>
                )}
                actions={(
                    <React.Fragment>
                        {user && user.username.toLowerCase() !== project.owner.toLowerCase() ? (
                            <Button
                                variant="secondary"
                                onClick={() => setReporting({
                                    type: 'bounty',
                                    target: bounty.id,
                                    targetUser: project.owner,
                                    context: `project ${project.id}: ${bounty.title}\n${bounty.description || ''}`
                                })}
                            ><Flag size={15} />{communityText('Report')}</Button>
                        ) : null}
                        <Button variant={registered ? 'secondary' : 'primary'} busy={busy} busyLabel={communityText('Updating…')} onClick={toggleRegistration}><Hammer size={16} />{registered ? communityText('Stop working on this') : communityText('I’m working on this')}</Button>
                    </React.Fragment>
                )}
            />
            <div className={styles.layout}>
                <section className={styles.main}>
                    <article className={styles.details}><SectionHeading as="h3" icon={Wrench} title={communityText('What needs doing')} /><p>{bounty.description || communityText('No additional details were provided.')}</p></article>
                    <section className={styles.conversation}>
                        <SectionHeading icon={MessageSquare} title={communityText('Conversation')} count={activity.comments.length} />
                        {activity.comments.length ? activity.comments.map(item => (
                            <article className={styles.message} key={item.id}>
                                <header><Link to={`/users/${item.author}`}><Avatar username={item.author} size={28} /><strong>{item.author}</strong></Link><span>{timeAgo(item.created)}</span>{user && user.username.toLowerCase() !== item.author.toLowerCase() ? <button disabled={busy} title={communityText('Report comment')} onClick={() => setReporting({type: 'comment', target: item.id, targetUser: item.author, context: `bounty ${bounty.id}`})}><Flag size={14} /></button> : null}{item.canDelete ? <button disabled={busy} title={communityText('Delete comment')} onClick={() => deleteComment(item.id)}><Trash2 size={14} /></button> : null}</header>
                                <div><RichText text={item.content} /></div>
                            </article>
                        )) : <EmptyState compact icon={MessageSquare} title={communityText('No comments yet')}>{communityText('Ask a question or coordinate the work.')}</EmptyState>}
                        <form className={styles.composer} onSubmit={submitComment}>
                            {user ? <Avatar username={user.username} size={32} /> : null}
                            <div><textarea maxLength={1000} value={comment} placeholder={communityText('Discuss this bounty')} disabled={busy} onChange={event => setComment(event.target.value)} /><footer>{error ? <span>{error}</span> : <span>{comment.length}/1000</span>}<Button type="submit" disabled={!comment.trim()}>{user ? communityText('Comment') : communityText('Sign in to comment')}</Button></footer></div>
                        </form>
                    </section>
                </section>
                <aside className={styles.workers}>
                    <SectionHeading as="h3" icon={Users} title={communityText('Working on this')} count={activity.workers.length} className={styles.workersHead} />
                    {activity.workers.length ? activity.workers.map(worker => <Link key={worker.username} to={`/users/${worker.username}`}><Avatar username={worker.username} size={30} /><span><strong>{worker.username}</strong><small>{communityText('Joined {time}', {time: timeAgo(worker.created)})}</small></span></Link>) : <p>{communityText('Nobody has registered yet.')}</p>}
                    <Button as={Link} className={styles.projectLink} to={`${projectUrl(project)}#contribute`}>{communityText('Open project contribution tools')}</Button>
                </aside>
            </div>
            {reporting ? <ReportModal {...reporting} onClose={() => setReporting(null)} /> : null}
        </main>
    );
};

export default Bounty;
