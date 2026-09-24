import React from 'react';
import PropTypes from 'prop-types';
import CrashMessageComponent from '../components/crash-message/crash-message.jsx';
import log from '../lib/utils/log.js';
import {reportSiteError} from '../lib/error-reporter.js';
import downloadBlob from '../lib/utils/download-blob.js';

// The VM usually survives a rendering crash, so the project can still be saved.
const getRecoverableVm = () => {
    const vm = typeof window === 'undefined' ? null : window.vm;
    if (vm && typeof vm.saveProjectSb3 === 'function' && vm.runtime && vm.runtime.targets &&
        vm.runtime.targets.length > 0) {
        return vm;
    }
    return null;
};

class ErrorBoundary extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            error: null,
            errorInfo: null,
            downloadState: null,
            resetKey: props.resetKey
        };
        this.handleDownloadProject = this.handleDownloadProject.bind(this);
    }

    static getDerivedStateFromProps (props, state) {
        if (props.resetKey === state.resetKey) return null;
        return {
            error: null,
            errorInfo: null,
            downloadState: null,
            resetKey: props.resetKey
        };
    }

    /**
     * Handle an error caught by this ErrorBoundary component.
     * @param {Error} error - the error that was caught.
     * @param {React.ErrorInfo} errorInfo - the React error info associated with the error.
     */
    componentDidCatch (error, errorInfo) {
        // Error object may be undefined (IE?)
        error = error || {
            stack: 'Unknown stack',
            message: 'Unknown error'
        };
        errorInfo = errorInfo || {
            componentStack: 'Unknown component stack'
        };

        // only remember the first error: later errors might just be side effects of that first one
        if (!this.state.error) {
            // store error & errorInfo for debugging
            this.setState({
                error,
                errorInfo
            });
        }

        // report every error in the console
        log.error([
            `Unhandled Error with action='${this.props.action}': ${error.stack}`,
            `Component stack: ${errorInfo.componentStack}`
        ].join('\n'));
        reportSiteError({
            message: error.message || String(error),
            stack: error.stack || '',
            kind: 'react',
            componentStack: errorInfo.componentStack || ''
        });
    }

    handleBack () {
        window.history.back();
    }

    handleReload () {
        window.location.reload();
    }

    handleDownloadProject () {
        const vm = getRecoverableVm();
        if (!vm || this.state.downloadState === 'saving') return;
        this.setState({downloadState: 'saving'});
        Promise.resolve()
            .then(() => vm.saveProjectSb3())
            .then(blob => {
                const title = (typeof document === 'undefined' ? '' : document.title) || 'Project';
                downloadBlob(`${title.replace(/[\\/:*?"<>|]+/g, '').trim() || 'Project'}.sb3`, blob);
                this.setState({downloadState: 'saved'});
            })
            .catch(downloadError => {
                log.error('Could not save the project after a crash:', downloadError);
                this.setState({downloadState: 'failed'});
            });
    }

    formatErrorMessage () {
        let message = '';

        if (this.state.error) {
            message += `${this.state.error}`;
        } else {
            message += 'Unknown error';
        }

        if (this.state.errorInfo) {
            const firstCoupleLines = this.state
                .errorInfo
                .componentStack
                .trim()
                .split('\n')
                .slice(0, 2)
                .map(i => i.trim());
            message += `\nComponent stack: ${firstCoupleLines.join(' ')} ...`;
        }

        return message;
    }

    render () {
        if (this.state.error) {
            return (
                <CrashMessageComponent
                    errorMessage={this.formatErrorMessage()}
                    downloadState={this.state.downloadState}
                    onDownloadProject={getRecoverableVm() ? this.handleDownloadProject : null}
                    onReload={this.handleReload}
                />
            );
        }
        return this.props.children;
    }
}

ErrorBoundary.propTypes = {
    action: PropTypes.string.isRequired, // Used for defining tracking action
    children: PropTypes.node,
    resetKey: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
};

export default ErrorBoundary;
