import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import {Link} from 'react-router-dom';
import {Heart, Play} from 'lucide-react';
import {projectUrl} from '../api';
import {useCommunityIntl} from '../i18n.jsx';
import Avatar from './Avatar.jsx';
import ProjectThumbnail from './ProjectThumbnail.jsx';
import styles from './GameCard.module.css';

// Editor links leave the community app, so they can't be router links.
const CardLink = ({to, href, state, children, ...props}) => (href ?
    <a
        href={href}
        {...props}
    >{children}</a> :
    <Link
        to={to}
        state={state}
        {...props}
    >{children}</Link>);

CardLink.propTypes = {
    children: PropTypes.node,
    href: PropTypes.string,
    state: PropTypes.object,
    to: PropTypes.string
};

// One card for everything: games, your projects, starters, spaces and themes.
export const MediaCard = ({className, detail, href, media, meta, state, title, to, wrapMeta}) => (
    <article className={classNames(styles.card, className)}>
        <CardLink
            className={styles.thumb}
            to={to}
            href={href}
            state={state}
            tabIndex={-1}
            aria-hidden="true"
        >
            {media}
        </CardLink>
        <div className={styles.body}>
            <h3 className={styles.title}>
                <CardLink
                    to={to}
                    href={href}
                    state={state}
                    title={typeof title === 'string' ? title : null}
                >{title}</CardLink>
            </h3>
            {detail ? <p className={styles.detail}>{detail}</p> : null}
            {meta ? <div className={wrapMeta ? `${styles.meta} ${styles.metaWrap}` : styles.meta}>{meta}</div> : null}
        </div>
    </article>
);

MediaCard.propTypes = {
    className: PropTypes.string,
    detail: PropTypes.node,
    href: PropTypes.string,
    media: PropTypes.node,
    meta: PropTypes.node,
    state: PropTypes.object,
    title: PropTypes.node.isRequired,
    to: PropTypes.string,
    wrapMeta: PropTypes.bool
};

export const CardRow = ({children, className}) => (
    <div className={classNames(styles.row, className)}>{children}</div>
);

CardRow.propTypes = {
    children: PropTypes.node,
    className: PropTypes.string
};

export const CardTile = ({children}) => <span className={styles.tile}>{children}</span>;

CardTile.propTypes = {
    children: PropTypes.node
};

export const CardSkeleton = () => (
    <div
        className={styles.skeleton}
        aria-hidden="true"
    >
        <span className={styles.skeletonThumb} />
        <span className={styles.skeletonLine} />
        <span className={styles.skeletonLine} />
    </div>
);

export const CardRowSkeleton = ({className, count}) => (
    <CardRow className={className}>
        {Array.from({length: count}, (_, index) => (
            <CardSkeleton key={index} />
        ))}
    </CardRow>
);

CardRowSkeleton.propTypes = {
    className: PropTypes.string,
    count: PropTypes.number
};

CardRowSkeleton.defaultProps = {
    count: 4
};

export const OwnerLink = ({username}) => (
    <Link
        className={styles.owner}
        to={`/users/${username}`}
    >
        <Avatar
            className={styles.ownerAvatar}
            username={username}
            size={18}
        />
        <span className={styles.ownerName}>{username}</span>
    </Link>
);

OwnerLink.propTypes = {
    username: PropTypes.string.isRequired
};

// Small counts at the end of a card's meta line. Each one is an icon and a
// value, with the full wording as its title and for screen readers.
export const CardStats = ({items}) => (
    <span className={styles.stats}>
        {items.map(({icon: Icon, label, value}) => (
            <span
                key={label}
                title={label}
            >
                <Icon
                    size={12}
                    aria-hidden="true"
                />
                <span aria-hidden="true">{value}</span>
                <span className={styles.srOnly}>{label}</span>
            </span>
        ))}
    </span>
);

CardStats.propTypes = {
    items: PropTypes.arrayOf(PropTypes.shape({
        icon: PropTypes.elementType.isRequired,
        label: PropTypes.string.isRequired,
        value: PropTypes.node
    })).isRequired
};

export const GameMeta = ({project}) => {
    const {text: communityText} = useCommunityIntl();
    const loves = Number(project.loveCount) || 0;
    const plays = Number(project.views) || 0;
    return (
        <>
            <OwnerLink username={project.owner} />
            <span className={styles.stats}>
                <span title={communityText('{value1, plural, one {# love} other {# loves}}', {value1: loves})}>
                    <Heart
                        size={12}
                        aria-hidden="true"
                    />
                    {loves}
                </span>
                <span title={communityText('{value1, plural, one {# view} other {# views}}', {value1: plays})}>
                    <Play
                        size={12}
                        aria-hidden="true"
                    />
                    {plays}
                </span>
            </span>
        </>
    );
};

GameMeta.propTypes = {
    project: PropTypes.shape({
        loveCount: PropTypes.number,
        owner: PropTypes.string,
        views: PropTypes.number
    }).isRequired
};

const GameCard = ({project, className}) => (
    <MediaCard
        className={className}
        to={projectUrl(project)}
        title={project.title}
        media={<ProjectThumbnail
            project={project}
            fallbackClassName={styles.fallback}
            lazy
        />}
        meta={<GameMeta project={project} />}
    />
);

GameCard.propTypes = {
    className: PropTypes.string,
    project: PropTypes.shape({
        id: PropTypes.string,
        loveCount: PropTypes.number,
        owner: PropTypes.string,
        title: PropTypes.string,
        views: PropTypes.number
    }).isRequired
};

export default GameCard;
