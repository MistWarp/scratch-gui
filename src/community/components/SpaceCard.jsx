import PropTypes from 'prop-types';
import React from 'react';
import {Bookmark, Clock3, Layers3, Library, Trophy} from 'lucide-react';
import {Link} from 'react-router-dom';
import {formatDate, formatPlaytime, safeDate} from '../format';
import styles from './SpaceCard.module.css';
import GroupTag from './GroupTag.jsx';

const KIND_ICONS = {studio: Layers3, challenge: Trophy, collection: Library, library: Bookmark};
const KIND_LABELS = {studio: 'Studio', challenge: 'Challenge', collection: 'Collection', library: 'Library'};
const spaceProjectCount = space => (
    Number.isFinite(space.projectCount) ? space.projectCount : (space.projects || []).length
);
const spaceFollowerCount = space => (
    Number.isFinite(space.followerCount) ? space.followerCount : (space.followers || []).length
);

const SpaceCard = ({space, to, onClick}) => {
    const Icon = KIND_ICONS[space.kind] || Layers3;
    const projects = space.projects || [];
    const thumbnailUrl = space.thumbnailUrl || (projects.find(project => project.thumbUrl) || {}).thumbUrl;
    const projectCount = spaceProjectCount(space);
    const followerCount = spaceFollowerCount(space);
    const deadline = safeDate(space.endsAt);
    const projectLabel = space.kind === 'challenge' ?
        (projectCount === 1 ? 'submission' : 'submissions') :
        (projectCount === 1 ? 'project' : 'projects');
    const Component = to ? Link : 'button';
    const componentProps = to ? {to} : {type: 'button', onClick};
    return (
        <Component className={styles.card} {...componentProps}>
            {thumbnailUrl ? <img className={styles.thumbnail} src={thumbnailUrl} alt="" loading="lazy" /> : null}
            <div className={styles.heading}>
                <span className={styles.icon}><Icon size={17} /></span>
                <span className={styles.kind}>{KIND_LABELS[space.kind] || space.kind}</span>
            </div>
            <h3>{space.title}</h3>
            <p>{space.description || 'No description yet.'}</p>
            {space.owner ? (
                <span className={styles.owner}>
                    by {space.owner}<GroupTag username={space.owner} compact linked={false} />
                </span>
            ) : null}
            <div className={styles.meta}>
                <span>{projectCount} {projectLabel}</span>
                {space.kind === 'challenge' ? <span>{space.participantCount || 0} joined</span> : null}
                {space.kind !== 'library' ? (
                    <span>{followerCount} {followerCount === 1 ? 'follower' : 'followers'}</span>
                ) : null}
                {space.kind === 'studio' && Number.isFinite(space.totalPlaytimeMs) ? (
                    <span className={styles.playtime}>
                        <Clock3 size={12} /> {formatPlaytime(space.totalPlaytimeMs)}
                    </span>
                ) : null}
                {space.kind === 'challenge' && deadline && deadline.getTime() > Date.now() ? (
                    <span>Ends {formatDate(deadline)}</span>
                ) : null}
            </div>
        </Component>
    );
};

SpaceCard.propTypes = {
    space: PropTypes.object.isRequired,
    to: PropTypes.string,
    onClick: PropTypes.func
};

SpaceCard.defaultProps = {
    to: '',
    onClick: null
};

export default SpaceCard;
export {spaceFollowerCount, spaceProjectCount};
