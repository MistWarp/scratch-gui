import React from 'react';
import {Heart, ThumbsDown} from 'lucide-react';
import {useUser} from '../UserContext.jsx';
import {sameUser} from '../format';
import styles from './ReactionButtons.module.css';

const TYPES = [
    {key: 'heart', Icon: Heart},
    {key: 'brokenheart', Icon: ThumbsDown}
];

const ReactionButtons = ({reactions, onReact, small}) => {
    const {user} = useUser();
    const lists = reactions || {};
    return (
        <span className={small ? styles.rowSmall : styles.row}>
            {TYPES.map(({key, Icon}) => {
                const names = Array.isArray(lists[key]) ? lists[key] : [];
                const mine = Boolean(user) && names.some(name => sameUser(name, user.username));
                return (
                    <button
                        key={key}
                        className={mine ? styles.buttonOn : styles.button}
                        disabled={!user}
                        onClick={() => onReact(key)}
                    >
                        <Icon
                            size={small ? 13 : 15}
                            fill={mine ? 'currentColor' : 'none'}
                        />
                        {names.length}
                    </button>
                );
            })}
        </span>
    );
};

export default ReactionButtons;
