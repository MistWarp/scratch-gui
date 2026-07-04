import PropTypes from 'prop-types';
import React from 'react';
import ReactDOM from 'react-dom';
import WindowManager from './window-manager.js';

class AddonWindow extends React.Component {
    constructor (props) {
        super(props);
        this.state = {ready: false};
        this.win = null;
        this.unmounting = false;
    }

    componentDidMount () {
        this.win = WindowManager.createWindow({
            id: this.props.id,
            title: this.props.title,
            width: this.props.width,
            height: this.props.height,
            minWidth: this.props.minWidth,
            minHeight: this.props.minHeight,
            maxWidth: this.props.maxWidth,
            maxHeight: this.props.maxHeight,
            x: this.props.x,
            y: this.props.y,
            className: this.props.className,
            minimizable: this.props.minimizable,
            maximizable: this.props.maximizable,
            closable: this.props.closable,
            resizable: this.props.resizable,
            onClose: () => {
                if (!this.unmounting) {
                    this.props.onClose();
                }
            },
            onMinimize: () => {
                if (!this.unmounting && this.props.onMinimize) {
                    this.props.onMinimize();
                }
            }
        });
        this.win.show().bringToFront();
        // eslint-disable-next-line react/no-did-mount-set-state
        this.setState({ready: true});
    }

    componentDidUpdate (prevProps) {
        if (this.win && prevProps.title !== this.props.title) {
            this.win.setTitle(this.props.title);
        }
    }

    componentWillUnmount () {
        this.unmounting = true;
        if (this.win) {
            this.win.destroy(false);
            this.win = null;
        }
    }

    render () {
        if (!this.state.ready || !this.win) {
            return null;
        }
        return ReactDOM.createPortal(this.props.children, this.win.getContentElement());
    }
}

AddonWindow.propTypes = {
    id: PropTypes.string,
    title: PropTypes.string,
    width: PropTypes.number,
    height: PropTypes.number,
    minWidth: PropTypes.number,
    minHeight: PropTypes.number,
    maxWidth: PropTypes.number,
    maxHeight: PropTypes.number,
    x: PropTypes.number,
    y: PropTypes.number,
    className: PropTypes.string,
    minimizable: PropTypes.bool,
    maximizable: PropTypes.bool,
    closable: PropTypes.bool,
    resizable: PropTypes.bool,
    onClose: PropTypes.func.isRequired,
    onMinimize: PropTypes.func,
    children: PropTypes.node
};

export default AddonWindow;
