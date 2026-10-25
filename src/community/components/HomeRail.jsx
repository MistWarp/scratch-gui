/* eslint-disable max-len */
import PropTypes from 'prop-types';
import React, {useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import {Plus} from 'lucide-react';
import api, {editorUrl, projectUrl} from '../api';
import {timeAgo} from '../format';
import {useCommunityIntl} from '../i18n.jsx';
import {postUrl} from '../following-feed.js';
import {richTranslator} from '../notification-text.jsx';
import {STARTERS} from '../../lib/starter-projects';
import fog from '../../lib/default-project/fog.svg';
import Avatar from './Avatar.jsx';
import ProjectThumbnail from './ProjectThumbnail.jsx';
import ScratchImport from './ScratchImport.jsx';
import {SuggestedCreators} from './HomeDiscovery.jsx';
import {DeviceBackup, useRecentProjects} from './HomeWorkspace.jsx';
import QuietLink from './ui/QuietLink.jsx';
import StatusMessage from './ui/StatusMessage.jsx';
import styles from './HomeRail.module.css';

export const RailCard = ({action, children, id, title}) => (
    <section
        className={styles.card}
        aria-labelledby={id}
    >
        <div className={styles.head}>
            <h2 id={id}>{title}</h2>
            {action}
        </div>
        {children}
    </section>
);

RailCard.propTypes = {
    action: PropTypes.node,
    children: PropTypes.node,
    id: PropTypes.string.isRequired,
    title: PropTypes.node.isRequired
};

const RowLink = ({href, to, children, ...props}) => (href ?
    <a
        href={href}
        {...props}
    >{children}</a> :
    <Link
        to={to}
        {...props}
    >{children}</Link>);

RowLink.propTypes = {
    children: PropTypes.node,
    href: PropTypes.string,
    to: PropTypes.string
};

const RailRow = ({href, media, meta, title, to}) => (
    <li className={styles.row}>
        <RowLink
            className={styles.thumb}
            href={href}
            to={to}
            tabIndex={-1}
            aria-hidden="true"
        >{media}</RowLink>
        <div className={styles.rowText}>
            <RowLink
                className={styles.rowTitle}
                href={href}
                to={to}
            >{title}</RowLink>
            {meta ? <span className={styles.rowMeta}>{meta}</span> : null}
        </div>
    </li>
);

RailRow.propTypes = {
    href: PropTypes.string,
    media: PropTypes.node,
    meta: PropTypes.node,
    title: PropTypes.node.isRequired,
    to: PropTypes.string
};

const RowsSkeleton = ({count}) => (
    <ul
        className={styles.rows}
        aria-hidden="true"
    >
        {Array.from({length: count}, (_, index) => (
            <li
                key={index}
                className={`${styles.row} ${styles.rowSkeleton}`}
            ><span /><span /></li>
        ))}
    </ul>
);

RowsSkeleton.propTypes = {
    count: PropTypes.number
};

const NewProjectRow = () => {
    const {text} = useCommunityIntl();
    return (
        <RailRow
            href={editorUrl()}
            title={text('New project')}
            meta={text('Start from an empty stage')}
            media={<span className={styles.tile}><Plus
                size={20}
                aria-hidden="true"
            /></span>}
        />
    );
};

const StarterRow = ({starter}) => (
    <RailRow
        href={editorUrl({starter: starter.id})}
        title={starter.title}
        meta={starter.kind}
        media={<span className={styles.tile}><img
            src={fog}
            alt=""
        /></span>}
    />
);

StarterRow.propTypes = {
    starter: PropTypes.shape({
        id: PropTypes.string,
        kind: PropTypes.string,
        title: PropTypes.string
    }).isRequired
};

export const RailProjects = ({username}) => {
    const {text} = useCommunityIntl();
    const [current, retry] = useRecentProjects(username);
    const projects = current.projects || [];
    return (
        <RailCard
            id="home-projects-heading"
            title={projects.length || current.failed ? text('Your projects') : text('Start a project')}
            action={projects.length ? <QuietLink to="/mystuff?section=projects">{text('All your projects')}</QuietLink> : null}
        >
            {current.projects === null && !current.failed ? <RowsSkeleton count={3} /> : null}
            {current.failed ? (
                <StatusMessage
                    className={styles.status}
                    compact
                    error
                    onRetry={retry}
                >{text('Could not load your projects.')}</StatusMessage>
            ) : null}
            {current.projects && !current.failed ? (
                <ul className={styles.rows}>
                    {projects.map(project => {
                        const saved = timeAgo(project.edited || project.created);
                        return (
                            <RailRow
                                key={project.id}
                                href={editorUrl({platformProject: project.id})}
                                title={project.title}
                                meta={project.shared ?
                                    text('Shared, saved {value1}', {value1: saved}) :
                                    text('Draft, saved {value1}', {value1: saved})}
                                media={<ProjectThumbnail
                                    project={project}
                                    fallbackClassName={styles.fallback}
                                    lazy
                                />}
                            />
                        );
                    })}
                    {STARTERS.slice(0, 3 - projects.length).map(starter => (
                        <StarterRow
                            key={starter.id}
                            starter={starter}
                        />
                    ))}
                </ul>
            ) : null}
            <DeviceBackup className={styles.backup} />
        </RailCard>
    );
};

RailProjects.propTypes = {
    username: PropTypes.string.isRequired
};

export const RailPlaying = ({username}) => {
    const {text} = useCommunityIntl();
    const [games, setGames] = useState(null);
    useEffect(() => {
        let active = true;
        setGames(null);
        api.getUser(username)
            .then(data => active && setGames((data.recentActivity || [])
                .filter(project => Number(project.lastPlayed) > 0)
                .sort((left, right) => Number(right.lastPlayed) - Number(left.lastPlayed))
                .slice(0, 3)))
            .catch(() => active && setGames([]));
        return () => {
            active = false;
        };
    }, [username]);
    if (!games || !games.length) return null;
    return (
        <RailCard
            id="home-playing-heading"
            title={text('Continue playing')}
            action={<QuietLink to={`/users/${username}/library`}>{text('Game library')}</QuietLink>}
        >
            <ul className={styles.rows}>
                {games.map(project => (
                    <RailRow
                        key={project.id}
                        to={projectUrl(project)}
                        title={project.title}
                        meta={project.owner}
                        media={<ProjectThumbnail
                            project={project}
                            fallbackClassName={styles.fallback}
                            lazy
                        />}
                    />
                ))}
            </ul>
        </RailCard>
    );
};

RailPlaying.propTypes = {
    username: PropTypes.string.isRequired
};

const describeActivity = (item, t, actor) => {
    const project = <strong>{item.projectTitle}</strong>;
    switch (item.type) {
    case 'love': return t('{actor} loved {project}', {actor, project});
    case 'favorite': return t('{actor} favorited {project}', {actor, project});
    case 'share': return t('{actor} shared {project}', {actor, project});
    case 'remix': return t('{actor} remixed {project}', {actor, project: <strong>{item.parentTitle || item.projectTitle}</strong>});
    case 'review': return t('{actor} rated {project} {rating} out of 5', {actor, project, rating: Number(item.rating) || 0});
    default: return t('{actor} posted an update', {actor});
    }
};

const UpdateRow = ({item}) => {
    const {text: communityText} = useCommunityIntl();
    const isPost = item.timelineType === 'following-post';
    const name = isPost ? item.user : item.actor;
    const actor = (<Link
        to={`/users/${name}`}
        className={styles.updateActor}
    >{name}</Link>);
    const to = isPost ? postUrl(item.id) : item.projectId ? projectUrl(item.projectId) : null;
    const t = richTranslator(communityText, to ? children => <Link to={to}>{children}</Link> : null);
    return (
        <li className={styles.update}>
            <Link
                to={`/users/${name}`}
                tabIndex={-1}
                aria-hidden="true"
            >
                <Avatar
                    username={name}
                    size={28}
                />
            </Link>
            <div className={styles.updateBody}>
                <p className={styles.updateText}>
                    {isPost ?
                        t('{actor} posted: {post}', {actor, post: item.content || communityText('View post')}) :
                        describeActivity(item, t, actor)}
                </p>
                <span className={styles.rowMeta}>{timeAgo(item.created || item.timestamp)}</span>
            </div>
        </li>
    );
};

UpdateRow.propTypes = {
    item: PropTypes.object.isRequired
};

export const RailCreators = ({viewerName, lead}) => {
    const {text} = useCommunityIntl();
    return (
        <RailCard
            id="home-creators-heading"
            title={text('Creators to follow')}
            action={<QuietLink to="/leaderboard">{text('See all')}</QuietLink>}
        >
            {lead ? <p className={styles.lead}>{lead}</p> : null}
            <SuggestedCreators
                viewerName={viewerName}
                limit={4}
            />
        </RailCard>
    );
};

RailCreators.propTypes = {
    lead: PropTypes.node,
    viewerName: PropTypes.string
};

export const RailFollowing = ({onRetry, state, viewerName}) => {
    const {text} = useCommunityIntl();
    if (state && !state.failed && !state.following.length) {
        return (
            <RailCreators
                viewerName={viewerName}
                lead={text('Their new games and posts will show up here.')}
            />
        );
    }
    const updates = state ? state.updates : [];
    const quiet = state && !state.failed && !updates.length;
    return (
        <RailCard
            id="home-following-heading"
            title={text('From people you follow')}
            action={<QuietLink to="/posts">{text('See all posts')}</QuietLink>}
        >
            {state ? null : <RowsSkeleton count={4} />}
            {state && state.failed ? (
                <StatusMessage
                    className={styles.status}
                    compact
                    error
                    onRetry={onRetry}
                >{text("Couldn't load activity.")}</StatusMessage>
            ) : null}
            {quiet ? (
                <p className={styles.lead}>
                    {text('Nothing new from people you follow lately.')}
                    {' '}
                    <QuietLink to="/explore?sort=recent">{text('See new games')}</QuietLink>
                </p>
            ) : null}
            {updates.length ? (
                <ul className={styles.rows}>
                    {updates.map((item, index) => (
                        <UpdateRow
                            key={item.timelineType === 'following-post' ? `post:${item.id}` : `${item.actor}-${item.created}-${index}`}
                            item={item}
                        />
                    ))}
                </ul>
            ) : null}
        </RailCard>
    );
};

RailFollowing.propTypes = {
    onRetry: PropTypes.func,
    state: PropTypes.shape({
        failed: PropTypes.bool,
        following: PropTypes.array,
        updates: PropTypes.array
    }),
    viewerName: PropTypes.string
};

export const RailStarters = () => {
    const {text} = useCommunityIntl();
    return (
        <RailCard
            id="starter-heading"
            title={text('Starter projects')}
        >
            <p className={styles.lead}>{text('Change one thing and save your own version. No sign-in needed.')}</p>
            <ul className={styles.rows}>
                <NewProjectRow />
                {STARTERS.map(starter => (
                    <StarterRow
                        key={starter.id}
                        starter={starter}
                    />
                ))}
            </ul>
            <div className={styles.import}>
                <ScratchImport source="home" />
                <QuietLink to="/compare">{text('Coming from Scratch or TurboWarp? See what is different')}</QuietLink>
            </div>
        </RailCard>
    );
};

export const RailNews = () => {
    const {text} = useCommunityIntl();
    const [items, setItems] = useState(null);
    const [attempt, setAttempt] = useState(0);
    useEffect(() => {
        let active = true;
        setItems(null);
        api.news()
            .then(data => active && setItems((data.news || []).filter(item => !item.archived).slice(0, 3)))
            .catch(() => active && setItems(false));
        return () => {
            active = false;
        };
    }, [attempt]);
    return (
        <RailCard
            id="home-news-heading"
            title={text('News')}
            action={<QuietLink to="/news">{text('All news')}</QuietLink>}
        >
            {items === null ? <RowsSkeleton count={3} /> : null}
            {items === false ? (
                <StatusMessage
                    className={styles.status}
                    compact
                    error
                    onRetry={() => setAttempt(value => value + 1)}
                >{text("Couldn't load news.")}</StatusMessage>
            ) : null}
            {items && !items.length ? <p className={styles.lead}>{text('News from MistWarp will show up here.')}</p> : null}
            {items && items.length ? (
                <ul className={styles.news}>
                    {items.map(item => (
                        <li key={item.id}>
                            <Link to={`/news/${item.id}`}>{item.title}</Link>
                            <span className={styles.rowMeta}>{timeAgo(item.created)}</span>
                        </li>
                    ))}
                </ul>
            ) : null}
        </RailCard>
    );
};
