import PropTypes from 'prop-types';
import React from 'react';
import classNames from 'classnames';
import {avatarForCollabUser} from '../lib/collaboration/avatar.js';
import styles from './collaboration-sprite-indicator.css';

const MAX_SHOWN = 2;
const BADGE_STRIDE_PX = 14;

const getUsernameInitials = username => {
    if (!username) return '??';
    return username.replace(/^@/, '').substring(0, 2)
        .toUpperCase();
};

const hashUsername = username => {
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
        const char = username.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash);
};

const getUserColor = username => `hsl(${hashUsername(username) % 360}, 70%, 45%)`;

/**
 * The stack of little "who else is here" avatars. Used on sprites, on editor
 * tabs, and on individual costumes and sounds — same badges everywhere, so a
 * face means the same thing wherever it shows up.
 * @param {object} props Props.
 * @param {Array.<object>} props.users Users to show ({userId, username, handle}).
 * @param {string} [props.verb] What they are doing, for the tooltip.
 * @param {boolean} [props.inline] Sit in the layout instead of overlaying a tile.
 * @returns {React.ReactElement|null} The badges, or nothing when nobody is here.
 */
const CollaborationSpriteIndicator = ({users, verb = 'is editing this', inline = false}) => {
    if (!users || users.length === 0) return null;

    const shown = users.slice(0, MAX_SHOWN);
    const overflowCount = users.length - shown.length;
    const offset = index => (inline ? {} : {left: `${index * BADGE_STRIDE_PX}px`});

    return (
        <div className={classNames(styles.indicator, {[styles.inline]: inline})}>
            {shown.map((user, index) => {
                const avatarUrl = avatarForCollabUser(user);
                return (
                    <div
                        key={user.userId}
                        className={styles.badge}
                        style={Object.assign(
                            {backgroundColor: getUserColor(user.username || '')},
                            offset(index)
                        )}
                        title={`${user.username} ${verb}`}
                    >
                        {avatarUrl ? (
                            <img
                                className={styles.avatar}
                                src={avatarUrl}
                                alt=""
                                draggable={false}
                            />
                        ) : getUsernameInitials(user.username)}
                    </div>
                );
            })}
            {overflowCount > 0 && (
                <div
                    className={styles.overflowBadge}
                    style={offset(shown.length)}
                    title={`${overflowCount} more here`}
                >
                    {`+${overflowCount}`}
                </div>
            )}
        </div>
    );
};

CollaborationSpriteIndicator.propTypes = {
    inline: PropTypes.bool,
    users: PropTypes.arrayOf(PropTypes.shape({
        userId: PropTypes.string,
        username: PropTypes.string,
        handle: PropTypes.string
    })),
    verb: PropTypes.string
};

export default CollaborationSpriteIndicator;
