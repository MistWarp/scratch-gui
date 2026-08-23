import PropTypes from 'prop-types';
import React from 'react';
import {Heart, ThumbsDown} from 'lucide-react';
import {useUser} from '../UserContext.jsx';
import {sameUser} from '../format';
import styles from './ReactionButtons.module.css';

const TYPES = [
    {kind: 'heart', Icon: Heart, label: 'Like'},
    {kind: 'down', Icon: ThumbsDown, label: 'Dislike'}
];

const ReactionButtons = ({
    reactions, counts, activeReaction, onReact, small, variant, heartKey, downKey, disabled,
    disabledTitle, showCounts, between, interactive, className
}) => {
    const {user, login} = useUser();
    const lists = reactions || {};
    const keys = {heart: heartKey, down: downKey};
    const classes = [styles.row, small ? styles.rowSmall : '', styles[variant] || '', className]
        .filter(Boolean).join(' ');
    return (
        <span className={classes}>
            {TYPES.map(({kind, Icon, label}, index) => {
                const key = keys[kind];
                const names = Array.isArray(lists[key]) ? lists[key] : [];
                const mine = typeof activeReaction === 'string' ?
                    activeReaction === key :
                    Boolean(user) && names.some(name => sameUser(name, user.username));
                const count = counts && Number.isFinite(counts[key]) ? counts[key] : names.length;
                const inactive = disabled;
                const signedOut = !user;
                let buttonTitle = label;
                if (inactive) buttonTitle = disabledTitle || 'Unavailable';
                else if (signedOut) buttonTitle = 'Sign in to react';
                const buttonClass = mine ? (kind === 'down' ? styles.buttonDownOn : styles.buttonOn) : styles.button;
                const content = (
                    <>
                        <Icon size={small ? 13 : 16} fill={mine ? 'currentColor' : 'none'} />
                        {showCounts ? count : null}
                    </>
                );
                return (
                    <React.Fragment key={key}>
                        {index === 1 && between ? between : null}
                        {interactive ? (
                            <button
                                type="button"
                                className={buttonClass}
                                disabled={inactive}
                                title={buttonTitle}
                                aria-label={label}
                                aria-pressed={mine}
                                onClick={() => (signedOut ? login() : onReact(key))}
                            >{content}</button>
                        ) : <span className={buttonClass}>{content}</span>}
                    </React.Fragment>
                );
            })}
        </span>
    );
};

ReactionButtons.propTypes = {
    reactions: PropTypes.object,
    counts: PropTypes.object,
    activeReaction: PropTypes.string,
    onReact: PropTypes.func,
    small: PropTypes.bool,
    variant: PropTypes.oneOf(['plain', 'bordered', 'vertical']),
    heartKey: PropTypes.string,
    downKey: PropTypes.string,
    disabled: PropTypes.bool,
    disabledTitle: PropTypes.string,
    showCounts: PropTypes.bool,
    between: PropTypes.node,
    interactive: PropTypes.bool,
    className: PropTypes.string
};

ReactionButtons.defaultProps = {
    reactions: null,
    counts: null,
    activeReaction: null,
    onReact: null,
    small: false,
    variant: 'plain',
    heartKey: 'heart',
    downKey: 'brokenheart',
    disabled: false,
    disabledTitle: '',
    showCounts: true,
    between: null,
    interactive: true,
    className: ''
};

export default ReactionButtons;
