import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
/* eslint-disable max-len */
import React, {useCallback, useEffect, useState} from 'react';
import {Link, useParams} from 'react-router-dom';
import {CalendarDays, Library, MessageCircle, Settings, UserMinus, UserPlus, Users} from 'lucide-react';
import api from '../api';
import {useUser} from '../UserContext.jsx';
import Avatar from '../components/Avatar.jsx';
import GroupTag from '../components/GroupTag.jsx';
import CommentThread from '../components/CommentThread.jsx';
import useSpaceCommentSource from '../space-comments.js';
import ProjectCard from '../components/ProjectCard.jsx';
import SpaceProjectPicker from '../components/SpaceProjectPicker.jsx';
import Button from '../components/ui/Button.jsx';
import CardGrid from '../components/ui/CardGrid.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Notice from '../components/ui/Notice.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import SectionHeading from '../components/ui/SectionHeading.jsx';
import StatusMessage from '../components/ui/StatusMessage.jsx';
import ReactionButtons from '../components/ReactionButtons.jsx';
import Challenge from './Challenge.jsx';
import Collection from './Collection.jsx';
import Studio from './Studio.jsx';
import useLatest from '../use-latest.js';
import {formatDate, safeDate} from '../format.js';
import styles from './Spaces.module.css';

const spaceLoadMessage = error => {
    if (error && error.status === 404) return 'Space not found.';
    return 'Could not load this space.';
};

const normalizeSpace = space => ({
    ...space,
    projectIds: Array.isArray(space.projectIds) ? space.projectIds : [],
    projects: Array.isArray(space.projects) ? space.projects : [],
    followers: Array.isArray(space.followers) ? space.followers : [],
    managers: Array.isArray(space.managers) ? space.managers : [],
    criteria: Array.isArray(space.criteria) ? space.criteria : [],
    judges: Array.isArray(space.judges) ? space.judges : [],
    judgeInvites: Array.isArray(space.judgeInvites) ? space.judgeInvites : [],
    curatorInvites: Array.isArray(space.curatorInvites) ? space.curatorInvites : [],
    followerCount: Number.isFinite(space.followerCount) ? space.followerCount :
        (Array.isArray(space.followers) ? space.followers.length : 0)
});

const loadMissingProjects = async space => {
    const normalized = normalizeSpace(space);
    const ids = normalized.projectIds;
    const projects = normalized.projects;
    if (!ids.length || projects.length === ids.length) return normalized;
    const byId = new Map(projects.map(project => [project.id, project]));
    const missing = ids.filter(projectId => !byId.has(projectId));
    const loaded = await Promise.all(missing.map(projectId => api.getProject(projectId)
        .then(data => data.project)
        .catch(() => null)));
    loaded.filter(Boolean).forEach(project => byId.set(project.id, project));
    return {...normalized, projects: ids.map(projectId => byId.get(projectId)).filter(Boolean)};
};

const Space = () => {
    const {text: communityText} = useCommunityText();
    const {id} = useParams();
    const {user, login} = useUser();
    const viewerName = (user && user.username) || '';
    const loadContext = `${id}\u0000${viewerName}`;
    const [space, setSpace] = useState(null);
    const [spaceLoadContext, setSpaceLoadContext] = useState('');
    const [failed, setFailed] = useState('');
    const [failedLoadContext, setFailedLoadContext] = useState('');
    const [error, setError] = useState('');
    const beginLoad = useLatest();

    const commentSource = useSpaceCommentSource(id);

    const load = useCallback(() => {
        const fresh = beginLoad();
        return api.getSpace(id)
            .then(data => {
                if (!data || !data.space) throw new Error('Space response was incomplete.');
                return loadMissingProjects(data.space);
            })
            .then(fresh(loadedSpace => {
                setSpace(loadedSpace);
                setSpaceLoadContext(loadContext);
                setFailed('');
                setFailedLoadContext('');
                return loadedSpace;
            }))
            .catch(fresh(e => {
                setFailed(spaceLoadMessage(e));
                setFailedLoadContext(loadContext);
                throw e;
            }));
    }, [beginLoad, id, loadContext]);

    useEffect(() => {
        setSpace(null);
        setFailed('');
        setError('');
        load().catch(() => {});
    }, [load, viewerName]);

    const follow = async () => {
        if (!user) {
            login();
            return;
        }
        setError('');
        try {
            if (space.following) await api.unfollowSpace(id);
            else await api.followSpace(id);
            await load();
        } catch (e) {
            setError(e.message || communityText('Could not update follow status.'));
        }
    };

    const respondToInvite = async accepted => {
        setError('');
        try {
            await api.respondSpaceInvitation(id, accepted);
            await load();
        } catch (e) {
            setError(e.message || communityText('Could not respond to the invitation.'));
        }
    };

    const react = async type => {
        if (!user) {
            login();
            return;
        }
        setError('');
        try {
            const data = await api.reactSpace(id, type);
            setSpace(current => ({
                ...current,
                likeCount: data.likeCount,
                brokenHeartCount: data.brokenHeartCount,
                myReaction: data.myReaction
            }));
        } catch (e) {
            setError(e.message || communityText('Could not rate this space.'));
        }
    };

    if (failed && failedLoadContext === loadContext) {
        return (
            <main className={styles.page}>
                <StatusMessage
                    error
                    onRetry={failed === 'Space not found.' ? null : () => {
                        setFailed('');
                        load().catch(() => {});
                    }}
                >{communityText(failed)}</StatusMessage>
            </main>
        );
    }
    if (!space || spaceLoadContext !== loadContext) return <main className={styles.page}><StatusMessage>{communityText('Loading space…')}</StatusMessage></main>;
    if (space.kind === 'challenge') return <Challenge id={id} space={space} user={user} login={login} load={load} />;
    if (space.kind === 'studio') return <Studio id={id} space={space} user={user} login={login} load={load} />;
    if (space.kind === 'collection') return <Collection id={id} space={space} user={user} login={login} load={load} />;

    const curators = space.managers || [];
    const canAdd = space.openSubmissions || space.canManage;
    const deadline = safeDate(space.endsAt);

    return (
        <main className={`${styles.page} ${styles.spacePage}`}>
            <PageHeader
                backTo="/spaces"
                backLabel={communityText('All spaces')}
                icon={Library}
                title={space.title}
                lead={space.description || communityText('No description yet.')}
                actions={(
                    <React.Fragment>
                        <Button variant={space.following ? 'secondary' : 'primary'} onClick={follow}>
                            {space.following ? <UserMinus size={16} /> : <UserPlus size={16} />}
                            {space.following ? communityText('Following') : communityText('Follow')}
                        </Button>
                        {space.canManage ? <Button as={Link} to={`/spaces/${id}/manage`}><Settings size={16} />{communityText('Manage space')}</Button> : null}
                    </React.Fragment>
                )}
            >
                <div className={styles.spaceOwner}>
                    <Avatar username={space.owner} size={30} />
                    <span>{communityText('Created by')} <Link to={`/users/${space.owner}`}>{space.owner}</Link> <GroupTag username={space.owner} compact /></span>
                </div>
            </PageHeader>
            {space.invited ? (
                <Notice
                    icon={Users}
                    title={communityText('You have been invited to curate this space.')}
                    action={(
                        <React.Fragment>
                            <Button variant="primary" onClick={() => respondToInvite(true)}>{communityText('Accept invitation')}</Button>
                            <Button variant="secondary" onClick={() => respondToInvite(false)}>{communityText('Decline')}</Button>
                        </React.Fragment>
                    )}
                >
                    {communityText('Curators can add and remove projects and update its details.')}
                </Notice>
            ) : null}
            {error ? <Notice variant="error">{error}</Notice> : null}

            <div className={styles.spaceReactions}>
                <ReactionButtons
                    variant="bordered"
                    counts={{heart: space.likeCount || 0, brokenheart: space.brokenHeartCount || 0}}
                    activeReaction={space.myReaction || ''}
                    onReact={react}
                />
                <a href="#space-comments"><MessageCircle size={16} />{communityText('{count} comments', {count: space.commentCount || 0})}</a>
            </div>

            <section className={styles.spaceOverview}>
                <div><strong>{space.projects.length}</strong><span>{communityText('{count, plural, one {project} other {projects}}', {count: space.projects.length})}</span></div>
                <div><strong>{space.followerCount}</strong><span>{communityText('{count, plural, one {follower} other {followers}}', {count: space.followerCount})}</span></div>
                <div><strong>{curators.length + 1}</strong><span>{communityText('{count, plural, one {team member} other {team members}}', {count: curators.length + 1})}</span></div>
                {space.kind === 'challenge' && deadline ? (
                    <div><CalendarDays size={18} /><span>{communityText('Ends {date}', {date: formatDate(deadline)})}</span></div>
                ) : null}
            </section>

            <section className={styles.curatorStrip}>
                <SectionHeading
                    icon={Users}
                    title={communityText('Curated by')}
                    lead={communityText('The people who choose and organise projects in this space.')}
                    className={styles.curatorHeading}
                />
                <div className={styles.curatorFaces}>
                    {[space.owner, ...curators].map(name => (
                        <Link key={name} to={`/users/${name}`} title={name}><Avatar username={name} size={34} /><span>{name}<GroupTag username={name} compact linked={false} /></span></Link>
                    ))}
                </div>
            </section>

            <section>
                <SectionHeading
                    icon={Library}
                    title={communityText('Projects')}
                    lead={space.openSubmissions ? communityText('This space is open for project submissions.') : communityText('Curators choose the projects shown here.')}
                    actions={canAdd ? <SpaceProjectPicker space={space} onAdded={load} /> : null}
                />
                {space.projects.length ? (
                    <CardGrid>{space.projects.map(project => <ProjectCard key={project.id} project={project} />)}</CardGrid>
                ) : (
                    <EmptyState icon={Library} title={communityText('No projects yet')}>
                        {canAdd ? communityText('Add the first project to get this space started.') : communityText('The curators have not added anything yet.')}
                    </EmptyState>
                )}
            </section>
            <section id="space-comments" className={styles.spaceComments}>
                <SectionHeading icon={MessageCircle} title={communityText('Comments')} lead={communityText('Talk about this space and reply to other people.')} />
                <CommentThread source={commentSource} canModerate={Boolean(space.canManage)} canPin={Boolean(space.canManage)} reportContext={`${space.kind} ${space.title}`} />
            </section>
        </main>
    );
};

export {normalizeSpace, spaceLoadMessage};
export default Space;
