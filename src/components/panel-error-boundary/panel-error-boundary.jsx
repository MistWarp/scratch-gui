import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import {FormattedMessage} from 'react-intl';

import log from '../../lib/utils/log.js';
import {reportSiteError} from '../../lib/error-reporter.js';

import styles from './panel-error-boundary.css';

/**
 * Error boundary for optional parts of the editor, such as modals, the chat dock and the menu bar.
 * A crash inside one of them shows a small message instead of replacing the whole editor,
 * so the workspace and the project stay usable.
 */
class PanelErrorBoundary extends React.Component {
    static getDerivedStateFromError (error) {
        return {
            error: error || new Error('Unknown error'),
            dismissed: false
        };
    }

    constructor (props) {
        super(props);
        this.state = {
            error: null,
            dismissed: false
        };
        // Set while the panel re-renders after Close, to tell a closed panel apart from one that crashes when hidden.
        this.closing = false;
        this.handleClose = this.handleClose.bind(this);
        this.handleRetry = this.handleRetry.bind(this);
    }

    componentDidUpdate () {
        if (this.closing && !this.state.error) {
            this.closing = false;
        }
    }

    componentDidCatch (error, errorInfo) {
        error = error || {
            stack: 'Unknown stack',
            message: 'Unknown error'
        };
        const componentStack = (errorInfo && errorInfo.componentStack) || 'Unknown component stack';
        log.error([
            `Panel '${this.props.name}' crashed: ${error.stack}`,
            `Component stack: ${componentStack}`
        ].join('\n'));
        reportSiteError({
            message: error.message || String(error),
            stack: error.stack || '',
            kind: 'react',
            componentStack
        });
        if (this.closing) {
            // The panel crashed again after it was closed, so keep it hidden instead of showing the message again.
            this.closing = false;
            this.setState({dismissed: true});
        }
    }

    handleClose () {
        if (this.props.onClose) {
            // A closed panel renders nothing, so the next open starts from a clean state.
            this.closing = true;
            this.props.onClose();
            this.setState({error: null, dismissed: false});
        } else {
            this.setState({dismissed: true});
        }
    }

    handleRetry () {
        this.setState({error: null, dismissed: false});
    }

    render () {
        if (!this.state.error) {
            return this.props.children;
        }
        if (this.state.dismissed) {
            return null;
        }
        const inline = this.props.variant === 'inline';
        return (
            <div
                className={classNames(styles.panelError, inline ? styles.inline : styles.floating)}
                role="alert"
            >
                <div className={styles.text}>
                    <div className={styles.title}>
                        <FormattedMessage
                            defaultMessage="This panel ran into a problem"
                            description="Shown in place of a part of the editor that crashed"
                            id="mw.panelError.title"
                        />
                    </div>
                    {inline ? null : (
                        <div className={styles.detail}>
                            <FormattedMessage
                                defaultMessage="The rest of the editor and your project are still working."
                                description="Shown below the message for a part of the editor that crashed"
                                id="mw.panelError.detail"
                            />
                        </div>
                    )}
                </div>
                <div className={styles.actions}>
                    <button
                        type="button"
                        className={classNames(styles.button, styles.primary)}
                        onClick={this.handleRetry}
                    >
                        <FormattedMessage
                            defaultMessage="Try again"
                            description="Button that reloads a part of the editor that crashed"
                            id="mw.panelError.retry"
                        />
                    </button>
                    {this.props.closable ? (
                        <button
                            type="button"
                            className={styles.button}
                            onClick={this.handleClose}
                        >
                            <FormattedMessage
                                defaultMessage="Close"
                                description="Button that hides a part of the editor that crashed"
                                id="mw.panelError.close"
                            />
                        </button>
                    ) : null}
                </div>
            </div>
        );
    }
}

PanelErrorBoundary.propTypes = {
    children: PropTypes.node,
    closable: PropTypes.bool,
    name: PropTypes.string.isRequired,
    onClose: PropTypes.func,
    variant: PropTypes.oneOf(['floating', 'inline'])
};

PanelErrorBoundary.defaultProps = {
    closable: true,
    variant: 'floating'
};

export default PanelErrorBoundary;
