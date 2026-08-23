import {intlShape, injectIntl} from 'react-intl';
import PropTypes from 'prop-types';
import React from 'react';
import classNames from 'classnames';
import styles from './toast-notification.css';

const ToastNotificationComponent = props => {
    const {message, sequence, type = 'info', visible, onClose} = props;
    const intl = props.intl;

    React.useEffect(() => {
        if (!visible || !message) return () => {};
        const timeout = setTimeout(() => {
            onClose();
        }, 3000);
        return () => clearTimeout(timeout);
    }, [visible, message, sequence, type, onClose]);

    if (!visible || !message) return null;

    return (
        <div
            className={classNames(styles.toast, styles[type])}
            role="alert"
            aria-live="polite"
        >
            <span className={styles.message}>
                {message}
            </span>
            <button
                type="button"
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
    sequence: PropTypes.number,
    type: PropTypes.oneOf(['success', 'error', 'info', 'warning']),
    visible: PropTypes.bool,
    onClose: PropTypes.func.isRequired
};

export {
    ToastNotificationComponent
};

export default injectIntl(ToastNotificationComponent);
