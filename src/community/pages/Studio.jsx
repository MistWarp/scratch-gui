/* eslint-disable max-len */
import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Link} from 'react-router-dom';
import {ArrowLeft, Clock3, FolderOpen, MessageCircle, Settings, UserMinus, UserPlus, Users} from 'lucide-react';
import api from '../api';
import Avatar from '../components/Avatar.jsx';
import GroupTag from '../components/GroupTag.jsx';
import CommentThread from '../components/CommentThread.jsx';
import ProjectCard from '../components/ProjectCard.jsx';
import ProjectThumbnail from '../components/ProjectThumbnail.jsx';
import RichText from '../components/RichText.jsx';
import SpaceProjectPicker from '../components/SpaceProjectPicker.jsx';
import SectionTabs from '../components/SectionTabs.jsx';
import Button from '../components/ui/Button.jsx';
import {formatPlaytime} from '../format';
import styles from './Studio.module.css';

const Studio = ({id, space, user, login, load}) => {
    const [tab, setTab] = useState('projects');
    const [error, setError] = useState('');
    const [actionBusy, setActionBusy] = useState('');
    const actionLocks = useRef(new Set());
    const currentId = useRef(id);
    currentId.current = id;
    const commentSource = useMemo(() => ({
        list: options => api.spaceComments(id, options),
        add: (content, parent) => api.addSpaceComment(id, content, parent),
        remove: commentId => api.deleteSpaceComment(id, commentId),
        edit: (commentId, content) => api.editSpaceComment(id, commentId, content),
        react: (commentId, type) => api.reactSpaceComment(id, commentId, type)
    }), [id]);

    useEffect(() => {
        setActionBusy('');
        setError('');
    }, [id]);

    const follow = async () => {
        if (!user) {
            login();
            return;
        }
        const actionId = id;
        if (actionLocks.current.has(actionId)) return;
        actionLocks.current.add(actionId);
        setActionBusy('follow');
        setError('');
        try {
            if (space.following) await api.unfollowSpace(id);
            else await api.followSpace(id);
            if (currentId.current === actionId) await load();
        } catch (requestError) {
            if (currentId.current === actionId) {
                setError(requestError.message || 'Could not update follow status.');
            }
        } finally {
            actionLocks.current.delete(actionId);
            if (currentId.current === actionId) setActionBusy('');
        }
    };

    const respondToInvite = async accepted => {
        const actionId = id;
        if (actionLocks.current.has(actionId)) return;
        actionLocks.current.add(actionId);
        setActionBusy('invite');
        setError('');
        try {
            await api.respondSpaceInvitation(id, accepted);
            if (currentId.current === actionId) await load();
        } catch (requestError) {
            if (currentId.current === actionId) {
                setError(requestError.message || 'Could not respond to the invitation.');
            }
        } finally {
            actionLocks.current.delete(actionId);
            if (currentId.current === actionId) setActionBusy('');
        }
    };

    const tabs = [
        {key: 'projects', label: `Projects ${space.projects.length}`},
        {key: 'comments', label: `Comments ${space.commentCount || 0}`},
        {key: 'curators', label: `Curators ${(space.managers || []).length + 1}`}
    ];
    const coverProject = space.projects[0];

    return (
        <main className={styles.page}>
            <Link to="/spaces?kind=studio" className={styles.back}><ArrowLeft size={15} /> All studios</Link>
            {space.invited ? <section className={styles.invite}><Users size={20} /><div><strong>You have been invited to curate this studio.</strong><span>Curators can organise projects and update studio details.</span></div><Button variant="primary" busy={actionBusy === 'invite'} busyLabel="Responding…" disabled={Boolean(actionBusy)} onClick={() => respondToInvite(true)}>Accept</Button><Button disabled={Boolean(actionBusy)} onClick={() => respondToInvite(false)}>Decline</Button></section> : null}
            <div className={styles.layout}>
                <aside className={styles.sidebar}>
                    <h1>{space.title}</h1>
                    <div className={styles.cover}>{space.thumbnailUrl ? <img className={styles.coverImage} src={space.thumbnailUrl} alt="" /> : coverProject ? <ProjectThumbnail project={coverProject} className={styles.coverImage} fallbackClassName={styles.coverFallback} /> : <FolderOpen size={44} />}</div>
                    <div className={styles.description}><RichText text={space.description || 'No description yet.'} /></div>
                    <div className={styles.actions}>
                        <Button variant={space.following ? 'secondary' : 'primary'} busy={actionBusy === 'follow'} busyLabel="Updating…" disabled={Boolean(actionBusy)} onClick={follow}>{space.following ? <UserMinus size={16} /> : <UserPlus size={16} />}{space.following ? 'Following' : 'Follow studio'}</Button>
                        {space.canManage ? <Link to={`/spaces/${id}/manage`}><Settings size={16} /> Manage</Link> : null}
                    </div>
                    <dl className={styles.stats}>
                        <div><dt><Clock3 size={16} /> Total play time</dt><dd>{formatPlaytime(space.totalPlaytimeMs, false)}</dd></div>
                        <div><dt><Users size={16} /> Followers</dt><dd>{space.followerCount || 0}</dd></div>
                        <div><dt>Created by</dt><dd><Link to={`/users/${space.owner}`}>{space.owner}</Link> <GroupTag username={space.owner} compact /></dd></div>
                    </dl>
                </aside>
                <section className={styles.content}>
                    <SectionTabs items={tabs} value={tab} onChange={setTab} className={styles.tabs} activeClassName={styles.tabActive} ariaLabel="Studio sections" />
                    {error ? <p className={styles.error}>{error}</p> : null}
                    {tab === 'projects' ? <section className={styles.projects}><header><div><h2>Projects</h2><p>Projects collected and shared by this studio.</p></div>{space.openSubmissions || space.canManage ? <SpaceProjectPicker space={space} onAdded={load} /> : null}</header>{space.projects.length ? <div className={styles.projectGrid}>{space.projects.map(project => <ProjectCard key={project.id} project={project} />)}</div> : <div className={styles.empty}><FolderOpen size={28} /><strong>No projects yet</strong><span>{space.openSubmissions ? 'Add the first project to this studio.' : 'The curators have not added anything yet.'}</span></div>}</section> : null}
                    {tab === 'comments' ? <section className={styles.comments}><header><MessageCircle size={19} /><div><h2>Comments</h2><p>Talk with the studio community.</p></div></header><CommentThread source={commentSource} canModerate={Boolean(space.canManage)} reportContext={`studio ${space.title}`} /></section> : null}
                    {tab === 'curators' ? <section className={styles.curators}><header><h2>Curators</h2><p>The people who organise this studio.</p></header><div>{[space.owner, ...(space.managers || [])].map((name, index) => <Link key={name} to={`/users/${name}`}><Avatar username={name} size={42} /><span><strong>{name}</strong><GroupTag username={name} compact linked={false} /><small>{index === 0 ? 'Owner' : 'Curator'}</small></span></Link>)}</div></section> : null}
                </section>
            </div>
        </main>
    );
};

export default Studio;
