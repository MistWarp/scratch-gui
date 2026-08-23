import React from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import log from '../utils/log';
import RestorePointAPI from '../api/restore-points';

/**
 * Higher Order Component to handle postMessage events for loading SB3 files.
 * This allows external applications to send SB3 data or URLs to Mistwarp for loading.
 *
 * Expected message format:
 * {
 *   type: 'LOAD_SB3',
 *   data: ArrayBuffer | string (URL) | Uint8Array,
 *   title?: string
 * }
 * @param {React.Component} WrappedComponent component to add external project loading to
 * @returns {React.Component} connected component with external project loading support
 */
const SB3PostMessageHOC = function (WrappedComponent) {
    class SB3PostMessageComponent extends React.Component {
        constructor (props) {
            super(props);
            this.handleMessage = this.handleMessage.bind(this);
            this.loadGeneration = 0;
            this.fetchController = null;
            this._isMounted = false;
        }

        componentDidMount () {
            this._isMounted = true;
            window.addEventListener('message', this.handleMessage);
        }

        componentWillUnmount () {
            this._isMounted = false;
            this.loadGeneration++;
            if (this.fetchController) {
                this.fetchController.abort();
                this.fetchController = null;
            }
            window.removeEventListener('message', this.handleMessage);
        }

        isAllowedParentOrigin (origin) {
            // More permissive validation for parent pages
            // This allows legitimate websites to open Mistwarp and send SB3 data
            
            // Block obviously malicious origins
            if (!origin || origin === 'null') {
                return false;
            }

            try {
                const url = new URL(origin);
                
                // Block non-HTTP(S) protocols except for known safe ones
                if (!['http:', 'https:'].includes(url.protocol)) {
                    return false;
                }

                // Block localhost with non-standard ports (except our known dev ports)
                if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
                    const port = parseInt(url.port, 10) || (url.protocol === 'https:' ? 443 : 80);
                    const allowedLocalPorts = [80, 443, 3000, 8080, 8601];
                    return allowedLocalPorts.includes(port);
                }

                // Allow all other HTTPS origins (more permissive for parent pages)
                if (url.protocol === 'https:') {
                    return true;
                }

                // Allow HTTP for localhost and development
                if (url.protocol === 'http:' && (
                    url.hostname === 'localhost' ||
                    url.hostname === '127.0.0.1' ||
                    url.hostname.endsWith('.local')
                )) {
                    return true;
                }

                // Block all other HTTP origins for security
                return false;
            } catch (error) {
                log.warn('Invalid origin URL:', origin, error);
                return false;
            }
        }

        handleMessage (e) {
            const message = e.data;

            // Check if this is an SB3 loading message before validating the
            // origin so unrelated messages do not log warnings.
            if (!message || message.type !== 'LOAD_SB3') {
                return false;
            }

            // Allow messages from various sources:
            // 1. Same origin (iframe scenarios)
            // 2. Localhost development servers
            // 3. Parent pages that opened this tab/window
            // 4. File protocol for local testing

            const allowedOrigins = [
                window.location.origin,
                'http://localhost:3000',
                'http://localhost:8080',
                'http://localhost:8601',
                'https://localhost:8601'
            ];

            // Allow file:// protocol for local testing
            if (e.origin === 'null' && window.location.protocol === 'file:') {
                // Allow local file testing
            } else if (allowedOrigins.includes(e.origin)) {
                // Allow explicitly listed origins
            } else if (this.isAllowedParentOrigin(e.origin)) {
                // Allow parent pages (more permissive for cross-origin scenarios)
            } else {
                log.warn(`Blocked postMessage from unauthorized origin: ${e.origin}`);
                return false;
            }

            log.info('Received SB3 load request via postMessage', message);

            const request = {
                generation: ++this.loadGeneration,
                origin: e.origin,
                source: e.source
            };
            if (this.fetchController) {
                this.fetchController.abort();
                this.fetchController = null;
            }

            // Validate message structure
            if (!message.data) {
                log.error('SB3 postMessage missing data field');
                this.sendResponse(request, 'error', 'SB3 load request is missing project data', message.title);
                return false;
            }

            try {
                if (typeof message.data === 'string') {
                    // Data is a URL
                    return this.loadSB3FromUrl(message.data, message.title, request);
                }
                if (message.data instanceof ArrayBuffer || message.data instanceof Uint8Array) {
                    // Data is binary SB3 content
                    return this.loadSB3Data(message.data, message.title, request);
                }
                log.error('SB3 postMessage data must be a URL string, ArrayBuffer, or Uint8Array');
                this.sendResponse(
                    request,
                    'error',
                    'SB3 project data must be a URL, ArrayBuffer, or Uint8Array',
                    message.title
                );
                return false;
            } catch (error) {
                log.error('Error processing SB3 postMessage:', error);
                this.sendResponse(request, 'error', `Failed to process SB3 project: ${error.message}`, message.title);
                return false;
            }
        }

        loadSB3FromUrl (url, title, request) {
            if (!this.props.vm) {
                log.error('VM not available');
                this.sendResponse(request, 'error', 'VM not available', title);
                return Promise.resolve(false);
            }

            log.info(`Loading SB3 from URL: ${url}`);

            const controller = typeof AbortController === 'undefined' ? null : new AbortController();
            this.fetchController = controller;
            const fetchPromise = controller ? fetch(url, {signal: controller.signal}) : fetch(url);
            return fetchPromise
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Failed to fetch: ${response.status}`);
                    }
                    return response.arrayBuffer();
                })
                .then(arrayBuffer => {
                    if (!this.isCurrentRequest(request)) {
                        return false;
                    }
                    return this.loadSB3Data(arrayBuffer, title, request);
                })
                .catch(error => {
                    if (!this.isCurrentRequest(request) || error.name === 'AbortError') {
                        return false;
                    }
                    log.error('Error loading SB3 from URL:', error);
                    this.sendResponse(request, 'error', `Failed to load SB3 from URL: ${error.message}`, title);
                    return false;
                })
                .then(result => {
                    if (this.fetchController === controller) {
                        this.fetchController = null;
                    }
                    return result;
                });
        }

        loadSB3Data (data, title, request) {
            if (!this.props.vm) {
                log.error('VM not available');
                this.sendResponse(request, 'error', 'VM not available', title);
                return Promise.resolve(false);
            }

            log.info('Loading SB3 data directly');
            
            // Convert Uint8Array to ArrayBuffer if needed
            let arrayBuffer = data;
            if (data instanceof Uint8Array) {
                arrayBuffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
            }

            // Stop current project and load new one
            return RestorePointAPI.createSafetyRestorePoint(this.props.vm, 'Before external load')
                .catch(error => {
                    log.warn('Could not create a restore point before external load:', error);
                })
                .then(() => {
                    if (!this.isCurrentRequest(request)) {
                        return false;
                    }
                    this.props.vm.quit();
                    return this.props.vm.loadProject(arrayBuffer);
                })
                .then(loadResult => {
                    if (loadResult === false || !this.isCurrentRequest(request)) {
                        return false;
                    }
                    log.info('SB3 project loaded successfully via postMessage');
                    
                    // Draw the renderer if available
                    if (this.props.vm.renderer && this.props.vm.renderer.draw) {
                        try {
                            this.props.vm.renderer.draw();
                        } catch (error) {
                            log.warn('Could not redraw the externally loaded project:', error);
                        }
                    }

                    // Send success response to parent
                    this.sendResponse(request, 'success', 'SB3 project loaded successfully', title);
                    return true;
                })
                .catch(error => {
                    if (!this.isCurrentRequest(request)) {
                        return false;
                    }
                    log.error('Error loading SB3 data:', error);
                    this.sendResponse(request, 'error', `Failed to load SB3 project: ${error.message}`, title);
                    return false;
                });
        }

        isCurrentRequest (request) {
            return this._isMounted && request.generation === this.loadGeneration;
        }

        sendResponse (request, status, message, title) {
            const response = {
                type: 'LOAD_SB3_RESPONSE',
                status: status,
                message: message,
                title: title,
                timestamp: Date.now()
            };

            // Send response back to the specific message source first
            if (request.source && request.origin) {
                try {
                    request.source.postMessage(response, request.origin);
                    log.info('Sent response to message source:', response);
                    return; // Successfully sent to specific source
                } catch (error) {
                    log.warn('Failed to send response to message source:', error);
                }
            }

            // Fallback: Send response to parent window if available
            if (window.opener) {
                try {
                    window.opener.postMessage(response, '*');
                    log.info('Sent response to parent window:', response);
                } catch (error) {
                    log.warn('Failed to send response to parent window:', error);
                }
            }

            // Also send to parent frame if in iframe
            if (window !== window.parent) {
                try {
                    window.parent.postMessage(response, '*');
                    log.info('Sent response to parent frame:', response);
                } catch (error) {
                    log.warn('Failed to send response to parent frame:', error);
                }
            }
        }

        render () {
            // This HOC doesn't add any props to the wrapped component
            return <WrappedComponent {...this.props} />;
        }
    }

    SB3PostMessageComponent.propTypes = {
        vm: PropTypes.shape({
            loadProject: PropTypes.func,
            quit: PropTypes.func,
            renderer: PropTypes.shape({
                draw: PropTypes.func
            })
        })
    };

    const mapStateToProps = state => ({
        vm: state.scratchGui.vm
    });

    const mapDispatchToProps = () => ({});

    return connect(
        mapStateToProps,
        mapDispatchToProps
    )(SB3PostMessageComponent);
};

export default SB3PostMessageHOC;
