import React from 'react';
import PropTypes from 'prop-types';
import bindAll from 'lodash.bindall';
import classNames from 'classnames';

import styles from './menu-bar.css';

class MenuLabel extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleClick',
            'handleMouseDown',
            'handleMouseUp',
            'menuRef'
        ]);
        this.mouseDownInsideMenu = false;
    }
    componentDidMount () {
        if (this.props.open) this.addListeners();
    }
    componentDidUpdate (prevProps) {
        if (this.props.open && !prevProps.open) this.addListeners();
        if (!this.props.open && prevProps.open) this.removeListeners();
    }
    componentWillUnmount () {
        this.removeListeners();
    }
    addListeners () {
        document.addEventListener('mousedown', this.handleMouseDown);
        document.addEventListener('mouseup', this.handleMouseUp);
        document.addEventListener('pointerdown', this.handleMouseDown);
        document.addEventListener('pointerup', this.handleMouseUp);
        document.addEventListener('touchstart', this.handleMouseDown);
        document.addEventListener('touchend', this.handleMouseUp);
    }
    removeListeners () {
        document.removeEventListener('mousedown', this.handleMouseDown);
        document.removeEventListener('mouseup', this.handleMouseUp);
        document.removeEventListener('pointerdown', this.handleMouseDown);
        document.removeEventListener('pointerup', this.handleMouseUp);
        document.removeEventListener('touchstart', this.handleMouseDown);
        document.removeEventListener('touchend', this.handleMouseUp);
    }
    handleClick (e) {
        // this is a bit sketchy, but we want to allow clicking on the menu itself and the images
        // and text directly inside it, but not the items inside the menu, which are under the button
        // in the DOM.
        if (e.target.closest('div') === this.menuEl) {
            if (this.props.open) {
                this.props.onClose();
            } else {
                this.props.onOpen();
            }
        }
    }
    handleMouseDown (e) {
        // Track whether the mousedown happened inside the menu
        this.mouseDownInsideMenu = this.menuEl && this.menuEl.contains(e.target);
    }
    handleMouseUp (e) {
        // Only close the menu if:
        // 1. The menu is open
        // 2. The mouseup is outside the menu
        // 3. The initial mousedown was also outside the menu (indicating a click outside)
        if (this.props.open && 
            !this.menuEl.contains(e.target) && 
            !this.mouseDownInsideMenu) {
            this.props.onClose();
        }
        // Reset the flag for the next interaction
        this.mouseDownInsideMenu = false;
    }
    menuRef (c) {
        this.menuEl = c;
    }
    render () {
        return (
            <div
                className={classNames(styles.menuBarItem, styles.hoverable, {
                    [styles.active]: this.props.open
                })}
                onClick={this.handleClick}
                ref={this.menuRef}
            >
                {this.props.children}
            </div>
        );
    }
}

MenuLabel.propTypes = {
    children: PropTypes.node,
    open: PropTypes.bool,
    onOpen: PropTypes.func,
    onClose: PropTypes.func
};

export default MenuLabel;
