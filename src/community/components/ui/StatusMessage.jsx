import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import {AlertCircle} from 'lucide-react';

import {useCommunityIntl} from '../../i18n.jsx';
import Button from './Button.jsx';
import styles from './StatusMessage.module.css';

const StatusMessage = ({children, className, compact, error, onRetry, retryLabel}) => {
    const {text: communityText} = useCommunityIntl();
    return (
        <div
            className={classNames(styles.status, {[styles.error]: error, [styles.compact]: compact}, className)}
            role={error ? 'alert' : 'status'}
            aria-live="polite"
        >
            {error ? (
                <AlertCircle size={18} aria-hidden="true" />
            ) : (
                <span className={styles.spinner} aria-hidden="true" />
            )}
            <span className={styles.text}>
                {children || (error ? communityText('Something went wrong.') : communityText('Loading…'))}
            </span>
            {error && onRetry ? <Button onClick={onRetry}>{retryLabel || communityText('Try again')}</Button> : null}
        </div>
    );
};

StatusMessage.propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
    compact: PropTypes.bool,
    error: PropTypes.bool,
    onRetry: PropTypes.func,
    retryLabel: PropTypes.node
};

StatusMessage.defaultProps = {
    compact: false,
    error: false
};

export default StatusMessage;
