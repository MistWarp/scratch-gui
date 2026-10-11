import PropTypes from 'prop-types';
import React from 'react';
import {Link} from 'react-router-dom';
import {House, RotateCcw, TriangleAlert, WifiOff} from 'lucide-react';
import log from '../../lib/utils/log.js';
import {reportSiteError} from '../../lib/error-reporter.js';
import {isChunkLoadError} from '../../lib/lazy-with-retry.js';
import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
import Button from './ui/Button.jsx';
import EmptyState from './ui/EmptyState.jsx';
import styles from '../pages/InfoPage.module.css';

const RouteErrorFallback = ({offline, onRetry}) => {
    const {text: communityText} = useCommunityText();
    return (
        <main className={`${styles.page} ${styles.notFound}`}>
            <EmptyState
                icon={offline ? WifiOff : TriangleAlert}
                title={offline ?
                    communityText('This page could not load.') :
                    communityText('Something went wrong on this page.')}
                action={(
                    <React.Fragment>
                        <Button variant="primary" onClick={onRetry}>
                            <RotateCcw size={16} aria-hidden="true" />
                            {communityText('Try again')}
                        </Button>
                        <Button as={Link} to="/" onClick={onRetry}>
                            <House size={16} aria-hidden="true" />
                            {communityText('Go to home')}
                        </Button>
                    </React.Fragment>
                )}
            >
                {offline ?
                    communityText('Part of the site did not download. Check your connection and try again.') :
                    communityText('The problem has been reported. Try again, or head back to the home page.')}
            </EmptyState>
        </main>
    );
};

RouteErrorFallback.propTypes = {
    offline: PropTypes.bool,
    onRetry: PropTypes.func.isRequired
};

// Catches a crash in one community page and keeps the navigation bar and footer usable. A new
// resetKey (the pathname) clears the error, so moving to another page leaves the crash behind.
class RouteErrorBoundary extends React.Component {
    static getDerivedStateFromError (error) {
        return {error: error || new Error('Unknown error')};
    }

    static getDerivedStateFromProps (props, state) {
        if (props.resetKey === state.resetKey) return null;
        return {error: null, resetKey: props.resetKey};
    }

    constructor (props) {
        super(props);
        this.state = {error: null, resetKey: props.resetKey};
        this.handleRetry = this.handleRetry.bind(this);
    }

    componentDidCatch (error, errorInfo) {
        const stack = (error && error.stack) || String(error);
        const componentStack = (errorInfo && errorInfo.componentStack) || '';
        log.error(`Community page crashed at ${this.props.resetKey}: ${stack}\nComponent stack: ${componentStack}`);
        if (isChunkLoadError(error)) return;
        reportSiteError({
            message: (error && error.message) || String(error),
            stack: (error && error.stack) || '',
            kind: 'react',
            componentStack
        });
    }

    handleRetry () {
        this.setState({error: null});
    }

    render () {
        if (this.state.error) {
            return (
                <RouteErrorFallback
                    offline={isChunkLoadError(this.state.error)}
                    onRetry={this.handleRetry}
                />
            );
        }
        return this.props.children;
    }
}

RouteErrorBoundary.propTypes = {
    children: PropTypes.node,
    resetKey: PropTypes.string
};

export default RouteErrorBoundary;
