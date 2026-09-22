import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
/* eslint-disable max-len */
import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Link} from 'react-router-dom';
import {Clock3, FolderOpen, MessageCircle, Settings, UserMinus, UserPlus, Users} from 'lucide-react';
import api from '../api';
import Avatar from '../components/Avatar.jsx';
import GroupTag from '../components/GroupTag.jsx';
import CommentThread from '../components/CommentThread.jsx';
import ProjectCard from '../components/ProjectCard.jsx';
import ProjectThumbnail from '../components/ProjectThumbnail.jsx';
import RichText from '../components/RichText.jsx';
import SpaceProjectPicker from '../components/SpaceProjectPicker.jsx';
import UnderlineTabs from '../components/UnderlineTabs.jsx';
import Button from '../components/ui/Button.jsx';
import CardGrid from '../components/ui/CardGrid.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Notice from '../components/ui/Notice.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import SectionHeading from '../components/ui/SectionHeading.jsx';
import {formatPlaytime} from '../format';
import styles from './Studio.module.css';

const Studio = ({id, space, user, login, load}) => {
    const {text: communityText} = useCommunityText();
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
                setError(requestError.message || communityText('Could not update follow status.'));
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
                setError(requestError.message || communityText('Could not respond to the invitation.'));
            }
        } finally {
            actionLocks.current.delete(actionId);
            if (currentId.current === actionId) setActionBusy('');
        }
    };

    const tabs = [
        {key: 'projects', label: <React.Fragment>{communityText('Projects')} <b>{space.projects.length}</b></React.Fragment>},
        {key: 'comments', label: <React.Fragment>{communityText('Comments')} <b>{space.commentCount || 0}</b></React.Fragment>},
        {key: 'curators', label: <React.Fragment>{communityText('Curators')} <b>{(space.managers || []).length + 1}</b></React.Fragment>}
    ];
    const coverProject = space.projects[0];

    return (
        <main className={styles.page}>
            <PageHeader
                compact
                icon={FolderOpen}
                backTo="/spaces?kind=studio"
                backLabel={communityText('All studios')}
                title={space.title}
            />
            {space.invited ? (
                <Notice
                    icon={Users}
                    title={communityText('You have been invited to curate this studio.')}
                    action={(
                        <React.Fragment>
                            <Button variant="primary" busy={actionBusy === 'invite'} busyLabel={communityText('Responding…')} disabled={Boolean(actionBusy)} onClick={() => respondToInvite(true)}>{communityText('Accept')}</Button>
                            <Button disabled={Boolean(actionBusy)} onClick={() => respondToInvite(false)}>{communityText('Decline')}</Button>
                        </React.Fragment>
                    )}
                    className={styles.invite}
                >
                    {communityText('Curators can organise projects and update studio details.')}
                </Notice>
            ) : null}
            <div className={styles.layout}>
                <aside className={styles.sidebar}>
                    <div className={styles.cover}>{space.thumbnailUrl ? <img className={styles.coverImage} src={space.thumbnailUrl} alt="" /> : coverProject ? <ProjectThumbnail project={coverProject} className={styles.coverImage} fallbackClassName={styles.coverFallback} /> : <FolderOpen size={44} />}</div>
                    <div className={styles.description}><RichText text={space.description || communityText('No description yet.')} /></div>
                    <div className={styles.actions}>
                        <Button variant={space.following ? 'secondary' : 'primary'} busy={actionBusy === 'follow'} busyLabel={communityText('Updating…')} disabled={Boolean(actionBusy)} onClick={follow}>{space.following ? <UserMinus size={16} /> : <UserPlus size={16} />}{space.following ? communityText('Following') : communityText('Follow studio')}</Button>
                        {space.canManage ? <Button as={Link} to={`/spaces/${id}/manage`}><Settings size={16} />{communityText('Manage')}</Button> : null}
                    </div>
                    <dl className={styles.stats}>
                        <div><dt><Clock3 size={16} />{communityText('Total play time')}</dt><dd>{formatPlaytime(space.totalPlaytimeMs, false)}</dd></div>
                        <div><dt><Users size={16} />{communityText('Followers')}</dt><dd>{space.followerCount || 0}</dd></div>
                        <div><dt>{communityText('Created by')}</dt><dd><Link to={`/users/${space.owner}`}>{space.owner}</Link> <GroupTag username={space.owner} compact /></dd></div>
                    </dl>
                </aside>
                <section className={styles.content}>
                    <UnderlineTabs items={tabs} value={tab} onChange={setTab} className={styles.tabs} ariaLabel="Studio sections" />
                    {error ? <Notice variant="error">{error}</Notice> : null}
                    {tab === 'projects' ? (
                        <section>
                            <SectionHeading
                                icon={FolderOpen}
                                title={communityText('Projects')}
                                lead={communityText('Projects collected and shared by this studio.')}
                                actions={space.openSubmissions || space.canManage ? <SpaceProjectPicker space={space} onAdded={load} /> : null}
                            />
                            {space.projects.length ? (
                                <CardGrid>{space.projects.map(project => <ProjectCard key={project.id} project={project} />)}</CardGrid>
                            ) : (
                                <EmptyState icon={FolderOpen} title={communityText('No projects yet')}>
                                    {space.openSubmissions ? communityText('Add the first project to this studio.') : communityText('The curators have not added anything yet.')}
                                </EmptyState>
                            )}
                        </section>
                    ) : null}
                    {tab === 'comments' ? (
                        <section>
                            <SectionHeading icon={MessageCircle} title={communityText('Comments')} lead={communityText('Talk with the studio community.')} />
                            <CommentThread source={commentSource} canModerate={Boolean(space.canManage)} reportContext={`studio ${space.title}`} />
                        </section>
                    ) : null}
                    {tab === 'curators' ? (
                        <section className={styles.curators}>
                            <SectionHeading icon={Users} title={communityText('Curators')} lead={communityText('The people who organise this studio.')} />
                            <div>{[space.owner, ...(space.managers || [])].map((name, index) => <Link key={name} to={`/users/${name}`}><Avatar username={name} size={42} /><span><strong>{name}</strong><GroupTag username={name} compact linked={false} /><small>{index === 0 ? communityText('Owner') : communityText('Curator')}</small></span></Link>)}</div>
                        </section>
                    ) : null}
                </section>
            </div>
        </main>
    );
};

export default Studio;
