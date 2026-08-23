/* eslint-disable max-len */
import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Link} from 'react-router-dom';
import {ArrowLeft, Library, MessageCircle, Settings, UserMinus, UserPlus} from 'lucide-react';
import api from '../api';
import Avatar from '../components/Avatar.jsx';
import CommentThread from '../components/CommentThread.jsx';
import ProjectCard from '../components/ProjectCard.jsx';
import RichText from '../components/RichText.jsx';
import SpaceProjectPicker from '../components/SpaceProjectPicker.jsx';
import SectionTabs from '../components/SectionTabs.jsx';
import Button from '../components/ui/Button.jsx';
import styles from './Collection.module.css';

const Collection = ({id, space, user, login, load}) => {
    const [view, setView] = useState('projects');
    const [error, setError] = useState('');
    const [followBusy, setFollowBusy] = useState(false);
    const followLocks = useRef(new Set());
    const currentId = useRef(id);
    currentId.current = id;
    const commentSource = useMemo(() => ({
        list: () => api.spaceComments(id),
        add: (content, parent) => api.addSpaceComment(id, content, parent),
        remove: commentId => api.deleteSpaceComment(id, commentId),
        react: (commentId, type) => api.reactSpaceComment(id, commentId, type)
    }), [id]);
    useEffect(() => {
        setFollowBusy(false);
        setError('');
    }, [id]);
    const tabs = [
        {key: 'projects', label: `Projects ${space.projects.length}`},
        {key: 'discussion', label: `Discussion ${space.commentCount || 0}`}
    ];

    const follow = async () => {
        if (!user) {
            login();
            return;
        }
        const actionId = id;
        if (followLocks.current.has(actionId)) return;
        followLocks.current.add(actionId);
        setFollowBusy(true);
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
            followLocks.current.delete(actionId);
            if (currentId.current === actionId) setFollowBusy(false);
        }
    };

    return (
        <main className={styles.page}>
            <Link to="/spaces?kind=collection" className={styles.back}><ArrowLeft size={15} /> All collections</Link>
            <header className={styles.hero}>
                <Library size={30} />
                <div><span>Collection</span><h1>{space.title}</h1><div className={styles.description}><RichText text={space.description || 'No description yet.'} /></div><div className={styles.owner}><Avatar username={space.owner} size={28} /><span>Curated by <Link to={`/users/${space.owner}`}>{space.owner}</Link></span></div></div>
                <div className={styles.actions}><Button variant={space.following ? 'secondary' : 'primary'} busy={followBusy} busyLabel="Updating…" onClick={follow}>{space.following ? <UserMinus size={16} /> : <UserPlus size={16} />}{space.following ? 'Following' : 'Follow'}</Button>{space.canManage ? <Link to={`/spaces/${id}/manage`}><Settings size={16} /> Manage</Link> : null}</div>
            </header>
            <SectionTabs items={tabs} value={view} onChange={setView} className={styles.tabs} activeClassName={styles.tabActive} ariaLabel="Collection sections" />
            {error ? <p className={styles.error}>{error}</p> : null}
            {view === 'projects' ? <section className={styles.projects}><header><div><h2>In this collection</h2><p>A curated set of MistWarp projects.</p></div>{space.openSubmissions || space.canManage ? <SpaceProjectPicker space={space} onAdded={load} /> : null}</header>{space.projects.length ? <div className={styles.grid}>{space.projects.map(project => <ProjectCard key={project.id} project={project} />)}</div> : <div className={styles.empty}><Library size={28} /><strong>This collection is empty</strong><span>The curator has not added any projects yet.</span></div>}</section> : null}
            {view === 'discussion' ? <section className={styles.discussion}><header><MessageCircle size={19} /><div><h2>Discussion</h2><p>Talk about the projects in this collection.</p></div></header><CommentThread source={commentSource} canModerate={Boolean(space.canManage)} reportContext={`collection ${space.title}`} /></section> : null}
        </main>
    );
};

export default Collection;
