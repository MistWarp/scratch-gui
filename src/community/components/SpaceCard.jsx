import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
import PropTypes from 'prop-types';
import React from 'react';
import {Bookmark, CalendarClock, Clock3, FolderOpen, Layers3, Library, Trophy, UserCheck, Users} from 'lucide-react';
import {formatDate, formatPlaytime, safeDate} from '../format';
import {CardStats, CardTile, MediaCard, OwnerLink} from './GameCard.jsx';
import styles from './SpaceCard.module.css';

const KIND_ICONS = {studio: Layers3, challenge: Trophy, collection: Library, library: Bookmark};
const KIND_LABELS = {studio: 'Studio', challenge: 'Challenge', collection: 'Collection', library: 'Library'};
const spaceProjectCount = space => (
    Number.isFinite(space.projectCount) ? space.projectCount : (space.projects || []).length
);
const spaceFollowerCount = space => (
    Number.isFinite(space.followerCount) ? space.followerCount : (space.followers || []).length
);

// The same card as a game: a cover, the title, a line about it, then the
// owner and a few counts. Lists that mix kinds name the kind before the line.
const SpaceCard = ({space, to, showKind}) => {
    const {text: communityText} = useCommunityText();
    const Icon = KIND_ICONS[space.kind] || Layers3;
    const projects = space.projects || [];
    const thumbnailUrl = space.thumbnailUrl || (projects.find(project => project.thumbUrl) || {}).thumbUrl;
    const projectCount = spaceProjectCount(space);
    const followerCount = spaceFollowerCount(space);
    const deadline = safeDate(space.endsAt);
    const challenge = space.kind === 'challenge';
    const projectLabel = challenge ?
        communityText('{value1, plural, one {# submission} other {# submissions}}', {value1: projectCount}) :
        communityText('{count, plural, one {# project} other {# projects}}', {count: projectCount});
    const stats = [{icon: FolderOpen, label: projectLabel, value: projectCount}];
    if (challenge) {
        stats.push({
            icon: UserCheck,
            label: communityText('{value1} joined', {value1: space.participantCount || 0}),
            value: space.participantCount || 0
        });
    } else if (space.kind !== 'library') {
        const followers = communityText('{count, plural, one {# follower} other {# followers}}', {
            count: followerCount
        });
        stats.push({icon: Users, label: followers, value: followerCount});
    }
    if (!challenge && Number(space.totalPlaytimeMs) > 0) {
        stats.push({
            icon: Clock3,
            label: formatPlaytime(space.totalPlaytimeMs),
            value: formatPlaytime(space.totalPlaytimeMs, false)
        });
    }
    if (challenge && deadline && deadline.getTime() > Date.now()) {
        const ends = formatDate(deadline);
        stats.push({
            icon: CalendarClock,
            label: communityText('Ends {value1}', {value1: ends}),
            value: ends
        });
    }
    const kind = communityText(KIND_LABELS[space.kind] || space.kind || '');
    const description = (space.description || '').trim();
    let detail = description;
    if (showKind) detail = description ? `${kind} · ${description}` : kind;
    return (
        <MediaCard
            to={to}
            title={space.title}
            media={thumbnailUrl ? (
                <img
                    src={thumbnailUrl}
                    alt=""
                    loading="lazy"
                />
            ) : (
                <CardTile>
                    <Icon
                        className={styles.kindIcon}
                        size={36}
                        strokeWidth={1.5}
                        aria-hidden="true"
                    />
                </CardTile>
            )}
            detail={detail || null}
            wrapMeta
            meta={(
                <>
                    {space.owner ? <OwnerLink username={space.owner} /> : null}
                    <CardStats items={stats} />
                </>
            )}
        />
    );
};

SpaceCard.propTypes = {
    showKind: PropTypes.bool,
    space: PropTypes.object.isRequired,
    to: PropTypes.string.isRequired
};

SpaceCard.defaultProps = {
    showKind: false
};

export default SpaceCard;
export {spaceFollowerCount, spaceProjectCount};
