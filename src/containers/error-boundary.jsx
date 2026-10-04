import React from 'react';
import PropTypes from 'prop-types';
import CrashMessageComponent from '../components/crash-message/crash-message.jsx';
import log from '../lib/utils/log.js';
import {reportSiteError} from '../lib/error-reporter.js';
import downloadBlob from '../lib/utils/download-blob.js';
import {projectFilename} from '../lib/utils/safe-filename.js';

// The VM usually survives a rendering crash, so the project can still be saved.
const getRecoverableVm = () => {
    const vm = typeof window === 'undefined' ? null : window.vm;
    if (vm && typeof vm.saveProjectSb3 === 'function' && vm.runtime && vm.runtime.targets &&
        vm.runtime.targets.length > 0) {
        return vm;
    }
    return null;
};

/**
 * Catches render errors below it. By default it shows the editor crash screen.
 * Pass `renderFallback({error, reset})` to render your own fallback instead
 * (e.g. a small panel or a community page); call `reset()` to try rendering
 * the children again. Changing `resetKey` also resets it.
 */
class ErrorBoundary extends React.Component {
    constructor (props, context) {
        super(props, context);
        this.state = {
            error: null,
            errorInfo: null,
            downloadState: null,
            resetKey: props.resetKey
        };
        this.handleDownloadProject = this.handleDownloadProject.bind(this);
        this.handleReset = this.handleReset.bind(this);
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

    handleReset () {
        this.setState({
            error: null,
            errorInfo: null,
            downloadState: null
        });
    }

    // The editor's project title, rather than document.title which carries the app name.
    getProjectTitle () {
        try {
            const store = this.context && this.context.store;
            const state = store && store.getState();
            const title = state && state.scratchGui && state.scratchGui.projectTitle;
            return typeof title === 'string' ? title : '';
        } catch (e) {
            return '';
        }
    }

    handleDownloadProject () {
        const vm = getRecoverableVm();
        if (!vm || this.state.downloadState === 'saving') return;
        this.setState({downloadState: 'saving'});
        Promise.resolve()
            .then(() => vm.saveProjectSb3())
            .then(blob => {
                // .sb3 rather than .mwp: building a .mwp needs the project history code,
                // which may be what crashed, and every Scratch editor can open an .sb3.
                downloadBlob(projectFilename(this.getProjectTitle(), 'Project', 'sb3'), blob);
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
        if (this.state.error && this.props.renderFallback) {
            return this.props.renderFallback({error: this.state.error, reset: this.handleReset});
        }
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
    renderFallback: PropTypes.func,
    resetKey: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
};

// react-redux 5 passes the store through legacy context; optional because the
// community site renders this outside the editor.
ErrorBoundary.contextTypes = {
    store: PropTypes.object
};

export default ErrorBoundary;
