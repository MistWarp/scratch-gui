import React from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import log from '../utils/log';
import {getIsShowingProject} from '../../reducers/project-state';

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
 */
const SB3PostMessageHOC = function (WrappedComponent) {
    class SB3PostMessageComponent extends React.Component {
        constructor (props) {
            super(props);
            this.handleMessage = this.handleMessage.bind(this);
            this.lastMessageSource = null;
            this.lastMessageOrigin = null;
        }

        componentDidMount () {
            window.addEventListener('message', this.handleMessage);
        }

        componentWillUnmount () {
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
                    const port = parseInt(url.port) || (url.protocol === 'https:' ? 443 : 80);
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
                return;
            }

            const message = e.data;
            
            // Check if this is an SB3 loading message
            if (!message || message.type !== 'LOAD_SB3') {
                return;
            }

            log.info('Received SB3 load request via postMessage', message);

            // Store message source for response
            this.lastMessageSource = e.source;
            this.lastMessageOrigin = e.origin;

            // Validate message structure
            if (!message.data) {
                log.error('SB3 postMessage missing data field');
                return;
            }

            try {
                if (typeof message.data === 'string') {
                    // Data is a URL
                    this.loadSB3FromUrl(message.data, message.title);
                } else if (message.data instanceof ArrayBuffer || message.data instanceof Uint8Array) {
                    // Data is binary SB3 content
                    this.loadSB3Data(message.data, message.title);
                } else {
                    log.error('SB3 postMessage data must be a URL string, ArrayBuffer, or Uint8Array');
                }
            } catch (error) {
                log.error('Error processing SB3 postMessage:', error);
            }
        }

        loadSB3FromUrl (url, title) {
            if (!this.props.vm) {
                log.error('VM not available');
                this.sendResponse('error', 'VM not available');
                return;
            }

            log.info(`Loading SB3 from URL: ${url}`);
            
            fetch(url)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Failed to fetch: ${response.status}`);
                    }
                    return response.arrayBuffer();
                })
                .then(arrayBuffer => {
                    this.loadSB3Data(arrayBuffer, title);
                })
                .catch(error => {
                    log.error('Error loading SB3 from URL:', error);
                    this.sendResponse('error', `Failed to load SB3 from URL: ${error.message}`);
                });
        }

        loadSB3Data (data, title) {
            if (!this.props.vm) {
                log.error('VM not available');
                this.sendResponse('error', 'VM not available');
                return;
            }

            log.info('Loading SB3 data directly');
            
            // Convert Uint8Array to ArrayBuffer if needed
            let arrayBuffer = data;
            if (data instanceof Uint8Array) {
                arrayBuffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
            }

            // Stop current project and load new one
            this.props.vm.quit();
            this.props.vm.loadProject(arrayBuffer)
                .then(() => {
                    log.info('SB3 project loaded successfully via postMessage');
                    
                    // Draw the renderer if available
                    if (this.props.vm.renderer && this.props.vm.renderer.draw) {
                        this.props.vm.renderer.draw();
                    }

                    // Send success response to parent
                    this.sendResponse('success', 'SB3 project loaded successfully', title);
                })
                .catch(error => {
                    log.error('Error loading SB3 data:', error);
                    this.sendResponse('error', `Failed to load SB3 project: ${error.message}`);
                });
        }

        sendResponse (status, message, title) {
            const response = {
                type: 'LOAD_SB3_RESPONSE',
                status: status,
                message: message,
                title: title,
                timestamp: Date.now()
            };

            // Send response back to the specific message source first
            if (this.lastMessageSource && this.lastMessageOrigin) {
                try {
                    this.lastMessageSource.postMessage(response, this.lastMessageOrigin);
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
