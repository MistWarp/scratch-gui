import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
/* eslint-disable max-len */
import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Link} from 'react-router-dom';
import {Library, MessageCircle, Settings, UserMinus, UserPlus} from 'lucide-react';
import api from '../api';
import Avatar from '../components/Avatar.jsx';
import GroupTag from '../components/GroupTag.jsx';
import CommentThread from '../components/CommentThread.jsx';
import ProjectCard from '../components/ProjectCard.jsx';
import RichText from '../components/RichText.jsx';
import SpaceProjectPicker from '../components/SpaceProjectPicker.jsx';
import UnderlineTabs from '../components/UnderlineTabs.jsx';
import Button from '../components/ui/Button.jsx';
import CardGrid from '../components/ui/CardGrid.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Notice from '../components/ui/Notice.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import SectionHeading from '../components/ui/SectionHeading.jsx';
import styles from './Collection.module.css';

const Collection = ({id, space, user, login, load}) => {
    const {text: communityText} = useCommunityText();
    const [view, setView] = useState('projects');
    const [error, setError] = useState('');
    const [followBusy, setFollowBusy] = useState(false);
    const followLocks = useRef(new Set());
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
        setFollowBusy(false);
        setError('');
    }, [id]);
    const tabs = [
        {key: 'projects', label: <React.Fragment>{communityText('Projects')} <b>{space.projects.length}</b></React.Fragment>},
        {key: 'discussion', label: <React.Fragment>{communityText('Discussion')} <b>{space.commentCount || 0}</b></React.Fragment>}
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
                setError(requestError.message || communityText('Could not update follow status.'));
            }
        } finally {
            followLocks.current.delete(actionId);
            if (currentId.current === actionId) setFollowBusy(false);
        }
    };

    return (
        <main className={styles.page}>
            <PageHeader
                backTo="/spaces?kind=collection"
                backLabel={communityText('All collections')}
                icon={Library}
                title={space.title}
                lead={<RichText text={space.description || communityText('No description yet.')} />}
                actions={(
                    <React.Fragment>
                        <Button variant={space.following ? 'secondary' : 'primary'} busy={followBusy} busyLabel={communityText('Updating…')} onClick={follow}>{space.following ? <UserMinus size={16} /> : <UserPlus size={16} />}{space.following ? communityText('Following') : communityText('Follow')}</Button>
                        {space.canManage ? <Button as={Link} to={`/spaces/${id}/manage`}><Settings size={16} />{communityText('Manage')}</Button> : null}
                    </React.Fragment>
                )}
            >
                <div className={styles.owner}><Avatar username={space.owner} size={28} /><span>{communityText('Curated by')} <Link to={`/users/${space.owner}`}>{space.owner}</Link> <GroupTag username={space.owner} compact /></span></div>
            </PageHeader>
            <UnderlineTabs items={tabs} value={view} onChange={setView} className={styles.tabs} ariaLabel="Collection sections" />
            {error ? <Notice variant="error">{error}</Notice> : null}
            {view === 'projects' ? (
                <section>
                    <SectionHeading
                        icon={Library}
                        title={communityText('In this collection')}
                        lead={communityText('A curated set of MistWarp projects.')}
                        actions={space.openSubmissions || space.canManage ? <SpaceProjectPicker space={space} onAdded={load} /> : null}
                    />
                    {space.projects.length ? (
                        <CardGrid>{space.projects.map(project => <ProjectCard key={project.id} project={project} />)}</CardGrid>
                    ) : (
                        <EmptyState icon={Library} title={communityText('This collection is empty')}>{communityText('The curator has not added any projects yet.')}</EmptyState>
                    )}
                </section>
            ) : null}
            {view === 'discussion' ? (
                <section>
                    <SectionHeading
                        icon={MessageCircle}
                        title={communityText('Discussion')}
                        lead={communityText('Talk about the projects in this collection.')}
                    />
                    <CommentThread source={commentSource} canModerate={Boolean(space.canManage)} reportContext={`collection ${space.title}`} />
                </section>
            ) : null}
        </main>
    );
};

export default Collection;
