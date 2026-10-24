import PropTypes from 'prop-types';
import React, {useEffect} from 'react';
import {X} from 'lucide-react';

import {useCommunityIntl} from '../../i18n.jsx';
import styles from './Toast.module.css';

const TOAST_TIME = 8000;

// A line at the bottom of the screen saying what just happened, with a way
// to take it back when there is one. It goes away by itself after a while,
// but not while the pointer or focus is on it.
const Toast = ({actionLabel, children, onAction, onDismiss}) => {
    const {text: communityText} = useCommunityIntl();
    const [paused, setPaused] = React.useState(false);
    useEffect(() => {
        if (paused) return () => {};
        const timer = setTimeout(onDismiss, TOAST_TIME);
        return () => clearTimeout(timer);
    }, [children, onDismiss, paused]);
    return (
        <div
            className={styles.toast}
            role="status"
            aria-live="polite"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocus={() => setPaused(true)}
            onBlur={() => setPaused(false)}
        >
            <span className={styles.text}>{children}</span>
            {onAction ? (
                <button
                    type="button"
                    className={styles.action}
                    onClick={onAction}
                >{actionLabel || communityText('Undo')}</button>
            ) : null}
            <button
                type="button"
                className={styles.dismiss}
                onClick={onDismiss}
                aria-label={communityText('Dismiss')}
            ><X size={15} /></button>
        </div>
    );
};

Toast.propTypes = {
    actionLabel: PropTypes.node,
    children: PropTypes.node,
    onAction: PropTypes.func,
    onDismiss: PropTypes.func.isRequired
};

export default Toast;
