import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import {LogIn} from 'lucide-react';

import {useCommunityIntl} from '../../i18n.jsx';
import Button from './Button.jsx';
import styles from './EmptyState.module.css';

const EmptyState = ({action, children, className, compact, icon: Icon, title}) => (
    <div className={classNames(styles.empty, {[styles.compact]: compact}, className)}>
        {Icon ? <span className={styles.icon}><Icon size={compact ? 18 : 24} aria-hidden="true" /></span> : null}
        <div className={styles.text}>
            {title ? <p className={styles.title}>{title}</p> : null}
            {children ? <p className={styles.body}>{children}</p> : null}
            {action ? <div className={styles.action}>{action}</div> : null}
        </div>
    </div>
);

EmptyState.propTypes = {
    action: PropTypes.node,
    children: PropTypes.node,
    className: PropTypes.string,
    compact: PropTypes.bool,
    icon: PropTypes.elementType,
    title: PropTypes.node
};

EmptyState.defaultProps = {
    compact: false
};

const SignInPrompt = ({children, className, compact, onSignIn, title}) => {
    const {text: communityText} = useCommunityIntl();
    const heading = title || children || communityText('Sign in to continue');
    return (
        <EmptyState
            icon={LogIn}
            title={heading}
            compact={compact}
            className={className}
            action={<Button variant="primary" onClick={onSignIn}>{communityText('Sign in with Rotur')}</Button>}
        >
            {title ? children : null}
        </EmptyState>
    );
};

SignInPrompt.propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
    compact: PropTypes.bool,
    onSignIn: PropTypes.func.isRequired,
    title: PropTypes.node
};

SignInPrompt.defaultProps = {
    compact: false
};

export {SignInPrompt};
export default EmptyState;
