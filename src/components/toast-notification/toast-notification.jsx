import {intlShape, injectIntl} from 'react-intl';
import PropTypes from 'prop-types';
import React from 'react';
import bindAll from 'lodash.bindall';
import classNames from 'classnames';
import {AlertTriangle, CheckCircle2, Info, X, XCircle} from 'lucide-react';
import styles from './toast-notification.module.css';

const DURATIONS = {
    success: 4000,
    info: 4000,
    warning: 5000,
    error: 6000
};

const ICONS = {
    success: CheckCircle2,
    error: XCircle,
    warning: AlertTriangle,
    info: Info
};

class ToastNotificationComponent extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleMouseEnter',
            'handleMouseLeave',
            'scheduleDismiss'
        ]);
        this.remaining = DURATIONS[props.type] || DURATIONS.info;
        this.startedAt = null;
        this.timeout = null;
    }
    componentDidMount () {
        this.resetTimer(this.props);
        this.scheduleDismiss();
    }
    componentDidUpdate (prevProps) {
        if (!this.props.visible) {
            clearTimeout(this.timeout);
            this.timeout = null;
            this.startedAt = null;
            return;
        }
        const identityChanged =
            prevProps.message !== this.props.message ||
            prevProps.sequence !== this.props.sequence ||
            prevProps.type !== this.props.type ||
            prevProps.visible !== this.props.visible;
        if (identityChanged) {
            this.resetTimer(this.props);
            this.scheduleDismiss();
        }
        // Otherwise keep the pending timer untouched so unrelated
        // parent re-renders (e.g. menu updates) never extend it.
    }
    componentWillUnmount () {
        clearTimeout(this.timeout);
    }
    resetTimer (props) {
        clearTimeout(this.timeout);
        this.remaining = DURATIONS[props.type] || DURATIONS.info;
        this.startedAt = null;
    }
    scheduleDismiss () {
        clearTimeout(this.timeout);
        if (!this.props.visible || !this.props.message) return;
        this.startedAt = Date.now();
        this.timeout = setTimeout(this.props.onClose, this.remaining);
    }
    handleMouseEnter () {
        if (this.startedAt !== null) {
            this.remaining = Math.max(0, this.remaining - (Date.now() - this.startedAt));
            this.startedAt = null;
        }
        clearTimeout(this.timeout);
        this.timeout = null;
    }
    handleMouseLeave () {
        this.scheduleDismiss();
    }
    render () {
        const {message, sequence, type = 'info', visible, onClose} = this.props;
        if (!visible || !message) return null;
        const Icon = ICONS[type] || ICONS.info;
        const duration = DURATIONS[type] || DURATIONS.info;
        return (
            <div
                className={classNames(styles.toast, styles[type])}
                role={type === 'error' ? 'alert' : 'status'}
                aria-live={type === 'error' ? 'assertive' : 'polite'}
                onMouseEnter={this.handleMouseEnter}
                onMouseLeave={this.handleMouseLeave}
            >
                <span className={styles.iconBadge}>
                    <Icon size={18} />
                </span>
                <span className={styles.message}>
                    {message}
                </span>
                <button
                    type="button"
                    className={styles.closeButton}
                    onClick={onClose}
                    aria-label={this.props.intl.formatMessage({
                        defaultMessage: 'Close notification',
                        id: 'tw.toast.close'
                    })}
                >
                    <X size={14} />
                </button>
                <span className={styles.progress}>
                    <span
                        key={sequence}
                        className={styles.progressFill}
                        style={{animationDuration: `${duration}ms`}}
                    />
                </span>
            </div>
        );
    }
}

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
