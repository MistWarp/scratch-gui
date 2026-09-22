import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import {AlertCircle, AlertTriangle, CheckCircle2, Info, X} from 'lucide-react';

import {useCommunityIntl} from '../../i18n.jsx';
import styles from './Notice.module.css';

const ICONS = {
    info: Info,
    success: CheckCircle2,
    warning: AlertTriangle,
    error: AlertCircle
};

const Notice = ({action, children, className, icon, onDismiss, title, variant}) => {
    const {text: communityText} = useCommunityIntl();
    const Icon = icon === null ? null : (icon || ICONS[variant] || Info);
    return (
        <div
            className={classNames(styles.notice, styles[variant], className)}
            role={variant === 'error' ? 'alert' : 'status'}
        >
            {Icon ? <Icon size={17} className={styles.icon} aria-hidden="true" /> : null}
            <div className={styles.content}>
                {title ? <strong className={styles.title}>{title}</strong> : null}
                {children ? <div className={styles.body}>{children}</div> : null}
            </div>
            {action ? <div className={styles.action}>{action}</div> : null}
            {onDismiss ? (
                <button
                    type="button"
                    className={styles.dismiss}
                    onClick={onDismiss}
                    aria-label={communityText('Dismiss')}
                >
                    <X size={15} />
                </button>
            ) : null}
        </div>
    );
};

Notice.propTypes = {
    action: PropTypes.node,
    children: PropTypes.node,
    className: PropTypes.string,
    icon: PropTypes.elementType,
    onDismiss: PropTypes.func,
    title: PropTypes.node,
    variant: PropTypes.oneOf(['info', 'success', 'warning', 'error'])
};

Notice.defaultProps = {
    variant: 'info'
};

export default Notice;
