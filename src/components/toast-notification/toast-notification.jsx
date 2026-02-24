import {intlShape, injectIntl} from 'react-intl';
import PropTypes from 'prop-types';
import React from 'react';
import classNames from 'classnames';
import styles from './toast-notification.css';

const ToastNotificationComponent = props => {
    const {message, type = 'info', visible, onClose} = props;
    const intl = props.intl;

    if (!visible || !message) return null;

    React.useEffect(() => {
        const timeout = setTimeout(() => {
            onClose();
        }, 3000);
        return () => clearTimeout(timeout);
    }, [onClose]);

    return (
        <div
            className={classNames(styles.toast, styles[type])}
            role="alert"
            aria-live="polite"
        >
            <span className={styles.message}>
                {typeof message === 'string' ? message : message}
            </span>
            <button
                className={styles.closeButton}
                onClick={onClose}
                aria-label={intl.formatMessage({
                    defaultMessage: 'Close notification',
                    id: 'tw.toast.close'
                })}
            >
                {'×'}
            </button>
        </div>
    );
};

ToastNotificationComponent.propTypes = {
    intl: intlShape,
    message: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    type: PropTypes.oneOf(['success', 'error', 'info', 'warning']),
    visible: PropTypes.bool,
    onClose: PropTypes.func.isRequired
};

export default injectIntl(ToastNotificationComponent);
