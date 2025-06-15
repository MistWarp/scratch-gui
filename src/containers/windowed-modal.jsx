import bindAll from 'lodash.bindall';
import PropTypes from 'prop-types';
import React from 'react';
import ReactDOM from 'react-dom';
import {connect, Provider} from 'react-redux';
import {FormattedMessage, IntlProvider} from 'react-intl';

import WindowManager from '../addons/window-system/window-manager';
import Box from '../components/box/box.jsx';
import './windowed-modal.css';

class WindowedModal extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'addEventListeners',
            'removeEventListeners',
            'handlePopState',
            'pushHistory',
            'handleWindowClose',
            'handleWindowMinimize'
        ]);
        this.window = null;
        this.contentContainer = null;
        this.createdWindow = false;
        this.addEventListeners();
    }
    
    componentDidMount () {
        // Only create window if visible prop is not false
        if (this.props.visible !== false) {
            this.createWindow();
            // Add a history event only if it's not currently for our modal. This
            // avoids polluting the history with many entries. We only need one.
            this.pushHistory(this.id, (history.state === null || history.state !== this.id));
        }
    }
    
    componentWillUnmount () {
        this.removeEventListeners();
        // Unmount React content before closing
        if (this.contentContainer && this.contentContainer.hasChildNodes()) {
            ReactDOM.unmountComponentAtNode(this.contentContainer);
        }
        // Only close the window if we created it, not if we reused an existing one
        if (this.window && this.createdWindow) {
            this.window.close();
        }
    }
    
    componentDidUpdate(prevProps) {
        // Handle visibility changes
        if (this.props.visible !== prevProps.visible) {
            if (this.props.visible && !this.window) {
                // Modal should be visible but window doesn't exist - create it
                this.createWindow();
                this.pushHistory(this.id, (history.state === null || history.state !== this.id));
            } else if (!this.props.visible && this.window) {
                // Modal should be hidden but window exists - close it only if we created it
                if (this.createdWindow) {
                    this.window.close();
                } else {
                    this.window.hide();
                }
                this.window = null;
                this.contentContainer = null;
                this.createdWindow = false;
                return;
            }
        }
        
        // Update content if window exists
        if (this.window && this.contentContainer) {
            // React will handle rendering through the portal
        }
    }
    
    createWindow() {
        // Prevent creating duplicate windows
        if (this.window) {
            return;
        }
        
        // Check if a window with this ID already exists
        const windowId = this.props.id || 'modal-window';
        this.windowId = windowId;
        const existingWindow = WindowManager.getWindow(windowId);
        if (existingWindow) {
            this.window = existingWindow;
            this.contentContainer = this.window.contentElement;
            this.createdWindow = false;
            this.window.show();
            return;
        }
        
        const {
            id,
            contentLabel,
            className = '',
            fullScreen = false,
            headerImage,
            onHelp,
            children
        } = this.props;
        
        // Determine window size based on content type
        let width = 600;
        let height = 500;
        let resizable = true;
        let maximizable = true;
        
        if (fullScreen) {
            width = Math.min(1200, window.innerWidth - 100);
            height = Math.min(800, window.innerHeight - 100);
        }
        
        // Adjust size for specific modal types
        if (className.includes('settings')) {
            width = 800;
            height = 600;
        } else if (className.includes('library')) {
            width = 1000;
            height = 750;
        } else if (className.includes('connection')) {
            width = 500;
            height = 400;
            resizable = false;
        }
        
        this.window = WindowManager.createWindow({
            id: id || 'modal-window',
            title: typeof contentLabel === 'string' ? contentLabel : 'Dialog',
            width,
            height,
            minWidth: 400,
            minHeight: 300,
            resizable,
            maximizable,
            closable: true,
            className: `modal-window ${className}`,
            onClose: this.handleWindowClose,
            onMinimize: this.handleWindowMinimize
        });
        this.createdWindow = true;
        
        // Create content container with modal styling
        this.contentContainer = document.createElement('div');
        this.contentContainer.className = 'modal-window-content windowed-modal-content';
        this.contentContainer.style.cssText = `
            height: 100%;
            display: flex;
            flex-direction: column;
            font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
            background: var(--ui-modal-background, #fff);
            color: var(--ui-modal-foreground, #000);
            overflow: hidden;
            min-height: 0;
        `;
        
        this.window.setContent(this.contentContainer);
        this.window.show();
    }
    
    renderContent() {
        if (!this.contentContainer) return null;
        
        const {
            children,
            headerImage,
            contentLabel,
            onHelp,
            onRequestClose,
            isRtl,
            fullScreen,
            showHeader = false,
            intl,
            locale,
            messages
        } = this.props;
        
        const modalContent = React.createElement(
            Box,
            {
                dir: isRtl ? 'rtl' : 'ltr',
                direction: 'column',
                grow: 1,
                style: {
                    height: '100%',
                    overflow: 'hidden'
                }
            },
            // Header (only if showHeader is true)
            showHeader && React.createElement(
                'div',
                {
                    style: {
                        display: 'flex',
                        alignItems: 'center',
                        padding: '1rem',
                        borderBottom: '1px solid var(--ui-tertiary, #ccc)',
                        background: 'var(--ui-secondary, #f8f8f8)',
                        flexShrink: 0
                    }
                },
                // Help button
                onHelp && React.createElement(
                    'button',
                    {
                        onClick: onHelp,
                        style: {
                            marginRight: '1rem',
                            padding: '0.5rem',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer'
                        }
                    },
                    React.createElement(FormattedMessage, {
                        defaultMessage: 'Help',
                        description: 'Help button in modal',
                        id: 'gui.modal.help'
                    })
                ),
                // Header image
                headerImage && React.createElement('img', {
                    src: headerImage,
                    style: { marginRight: '1rem', maxHeight: '24px' },
                    draggable: false
                }),
                // Title
                React.createElement(
                    'div',
                    {
                        style: {
                            flex: 1,
                            fontSize: '1.1rem',
                            fontWeight: 'bold'
                        }
                    },
                    typeof contentLabel === 'string' ? contentLabel : contentLabel
                )
            ),
            // Content
            React.createElement(
                'div',
                {
                    style: {
                        flex: 1,
                        overflow: 'hidden',
                        minHeight: 0,
                        padding: '0',
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column'
                    }
                },
                children
            )
        );
        
        // Wrap the content with both Redux Provider and IntlProvider to provide full context
        const wrappedContent = React.createElement(
            Provider,
            {
                store: this.props.store
            },
            React.createElement(
                IntlProvider,
                {
                    locale: locale || 'en',
                    messages: messages || {}
                },
                modalContent
            )
        );
        
        // Use React portal to render content into the window container
        return ReactDOM.createPortal(wrappedContent, this.contentContainer);
    }
    
    handleWindowClose = () => {
        // Clean up window state
        this.window = null;
        this.contentContainer = null;
        this.windowId = null;
        this.createdWindow = false;
        
        if (this.props.onRequestClose) {
            this.props.onRequestClose();
        }
    };
    
    handleWindowMinimize = () => {
        // When window is minimized, call onRequestClose to allow reopening
        if (this.props.onRequestClose) {
            this.props.onRequestClose();
        }
    };
    
    addEventListeners () {
        window.addEventListener('popstate', this.handlePopState);
    }
    
    removeEventListeners () {
        window.removeEventListener('popstate', this.handlePopState);
    }
    
    handlePopState () {
        // Whenever someone navigates, we want to be closed
        this.props.onRequestClose();
    }
    
    get id () {
        return `modal-${this.props.id}`;
    }
    
    pushHistory (state, push) {
        if (push) return history.pushState(state, this.id, null);
        history.replaceState(state, this.id, null);
    }
    
    render () {
        // Return the portal to render content in the window
        if (this.windowId && this.contentContainer) {
            return this.renderContent();
        }
        return null;
    }
}

WindowedModal.propTypes = {
    id: PropTypes.string.isRequired,
    isRtl: PropTypes.bool,
    onRequestClose: PropTypes.func,
    onRequestOpen: PropTypes.func,
    children: PropTypes.node,
    className: PropTypes.string,
    contentLabel: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.object
    ]).isRequired,
    fullScreen: PropTypes.bool,
    headerClassName: PropTypes.string,
    headerImage: PropTypes.string,
    onHelp: PropTypes.func,
    showHeader: PropTypes.bool,
    visible: PropTypes.bool,
    locale: PropTypes.string,
    messages: PropTypes.object,
    store: PropTypes.object.isRequired
};

const mapStateToProps = state => ({
    isRtl: state.locales.isRtl,
    locale: state.locales.locale,
    messages: state.locales.messages
});

const ConnectedWindowedModal = connect(
    mapStateToProps
)(WindowedModal);

// Wrapper component to access store from context
class WindowedModalWithStore extends React.Component {
    static contextTypes = {
        store: PropTypes.object
    };
    
    render () {
        return (
            <ConnectedWindowedModal
                {...this.props}
                store={this.context.store}
            />
        );
    }
}

export default WindowedModalWithStore;
