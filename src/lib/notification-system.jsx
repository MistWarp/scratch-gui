import React from 'react';
import bindAll from 'lodash.bindall';
import classNames from 'classnames';
import {Info, CheckCircle, TriangleAlert, X, XCircle} from 'lucide-react';
import PropTypes from 'prop-types';
import {defineMessages, injectIntl, intlShape} from 'react-intl';

import styles from './notification-system.css';

const messages = defineMessages({
    dismiss: {
        defaultMessage: 'Dismiss notification',
        description: 'Accessible label of the button that closes a notification in the corner of the editor',
        id: 'mw.notification.dismiss'
    }
});

// Matches the CSS transition, so the fade-out finishes before removal.
const FADE_MS = 300;

const ICONS = {
    info: Info,
    success: CheckCircle,
    warning: TriangleAlert,
    error: XCircle
};

class Notification extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'dismiss',
            'handleActionClick',
            'handleBlur',
            'handleClose',
            'handleFocus',
            'handleKeyDown',
            'handleMouseEnter',
            'handleMouseLeave'
        ]);
        this.state = {isVisible: false};
        this.remaining = props.duration;
        this.startedAt = null;
        this.hovered = false;
        this.focused = false;
        this.dismissing = false;
    }
    componentDidMount () {
        this.frame = requestAnimationFrame(() => {
            if (!this.dismissing) this.setState({isVisible: true});
        });
        this.resume();
    }
    componentWillUnmount () {
        cancelAnimationFrame(this.frame);
        clearTimeout(this.timeout);
        clearTimeout(this.fadeTimeout);
    }
    pause () {
        if (this.startedAt === null) return;
        this.remaining -= Date.now() - this.startedAt;
        this.startedAt = null;
        clearTimeout(this.timeout);
    }
    resume () {
        if (!(this.props.duration > 0) || this.dismissing || this.startedAt !== null) return;
        if (this.hovered || this.focused) return;
        this.startedAt = Date.now();
        this.timeout = setTimeout(this.dismiss, Math.max(0, this.remaining));
    }
    dismiss () {
        if (this.dismissing) return;
        this.dismissing = true;
        clearTimeout(this.timeout);
        this.setState({isVisible: false});
        this.fadeTimeout = setTimeout(() => this.props.onDismiss(this.props.id), FADE_MS);
    }
    handleMouseEnter () {
        this.hovered = true;
        this.pause();
    }
    handleMouseLeave () {
        this.hovered = false;
        this.resume();
    }
    handleFocus () {
        this.focused = true;
        this.pause();
    }
    handleBlur (event) {
        // Moving between the buttons of one notification keeps it paused.
        if (event.currentTarget.contains(event.relatedTarget)) return;
        this.focused = false;
        this.resume();
    }
    handleClose () {
        this.dismiss();
    }
    handleKeyDown (event) {
        if (event.key !== 'Escape') return;
        event.preventDefault();
        event.stopPropagation();
        this.dismiss();
    }
    handleActionClick (event) {
        const action = this.getActions()[Number(event.currentTarget.dataset.index)];
        if (action) action.onClick();
        this.dismiss();
    }
    getActions () {
        return this.props.actions || [];
    }
    render () {
        const {intl, message, type} = this.props;
        const actions = this.getActions();
        const Icon = ICONS[type] || ICONS.info;
        return (
            <div
                className={classNames(styles.notification, styles[type], {
                    [styles.visible]: this.state.isVisible
                })}
                role={type === 'error' ? 'alert' : 'status'}
                aria-atomic="true"
                onBlur={this.handleBlur}
                onFocus={this.handleFocus}
                onKeyDown={this.handleKeyDown}
                onMouseEnter={this.handleMouseEnter}
                onMouseLeave={this.handleMouseLeave}
            >
                <span className={styles.icon}>
                    <Icon size={16} />
                </span>
                <div className={styles.body}>
                    <span className={styles.message}>
                        {message}
                    </span>
                    {actions.length > 0 && (
                        <div className={styles.actions}>
                            {actions.map((action, index) => (
                                <button
                                    key={action.label}
                                    type="button"
                                    className={styles.action}
                                    data-index={index}
                                    onClick={this.handleActionClick}
                                >
                                    {action.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                <button
                    type="button"
                    className={styles.close}
                    aria-label={intl.formatMessage(messages.dismiss)}
                    title={intl.formatMessage(messages.dismiss)}
                    onClick={this.handleClose}
                >
                    <X size={14} />
                </button>
            </div>
        );
    }
}

Notification.propTypes = {
    /** Buttons under the message; clicking one runs it and dismisses the notification. */
    actions: PropTypes.arrayOf(PropTypes.shape({
        label: PropTypes.string.isRequired,
        onClick: PropTypes.func.isRequired
    })),
    /** How long to show it in ms; 0 or less keeps it until dismissed. */
    duration: PropTypes.number,
    id: PropTypes.string.isRequired,
    intl: intlShape.isRequired,
    message: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,
    onDismiss: PropTypes.func.isRequired,
    type: PropTypes.oneOf(['info', 'success', 'warning', 'error']).isRequired
};

export {Notification};

export default injectIntl(Notification);
