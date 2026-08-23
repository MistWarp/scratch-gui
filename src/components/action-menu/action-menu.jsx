import PropTypes from 'prop-types';
import React from 'react';
import classNames from 'classnames';
import bindAll from 'lodash.bindall';
import {Tooltip} from 'react-tooltip';

import styles from './action-menu.css';

const CLOSE_DELAY = 300; // ms

class ActionMenu extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'clickDelayer',
            'handleBlur',
            'handleClosePopover',
            'handleFocus',
            'handleKeyDown',
            'handleToggleOpenState',
            'handleTouchStart',
            'handleTouchOutside',
            'hideTooltips',
            'setButtonRef',
            'setContainerRef'
        ]);
        this.state = {
            isOpen: false,
            forceHide: false
        };
        this.mainTooltipId = `tooltip-${Math.random()}`;
        this.moreTooltipId = `${this.mainTooltipId}-more`;
        this.comingSoonTooltipId = `${this.mainTooltipId}-coming-soon`;
        this.tooltipRefs = [React.createRef(), React.createRef(), React.createRef()];
    }
    componentDidMount () {
        // Touch start on the main button is caught to trigger open and not click
        this.buttonRef.addEventListener('touchstart', this.handleTouchStart);
        // Touch start on document is used to trigger close if it is outside
        document.addEventListener('touchstart', this.handleTouchOutside);
    }
    componentWillUnmount () {
        if (this.closeTimeoutId) clearTimeout(this.closeTimeoutId);
        if (this.forceHideTimeoutId) clearTimeout(this.forceHideTimeoutId);
        this.buttonRef.removeEventListener('touchstart', this.handleTouchStart);
        document.removeEventListener('touchstart', this.handleTouchOutside);
    }
    hideTooltips () {
        for (const ref of this.tooltipRefs) {
            if (ref.current) ref.current.close();
        }
    }
    handleFocus () {
        if (this.closeTimeoutId) {
            clearTimeout(this.closeTimeoutId);
            this.closeTimeoutId = null;
        }
        if (!this.state.isOpen) {
            this.setState({isOpen: true, forceHide: false});
        }
    }
    handleBlur (event) {
        if (this.containerRef && this.containerRef.contains(event.relatedTarget)) return;
        if (this.closeTimeoutId) {
            clearTimeout(this.closeTimeoutId);
            this.closeTimeoutId = null;
        }
        this.setState({isOpen: false});
    }
    handleKeyDown (event) {
        if (event.key === 'Escape') {
            this.hideTooltips();
            if (this.buttonRef) this.buttonRef.focus();
            this.setState({isOpen: false});
            event.preventDefault();
            return;
        }
        if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
        const buttons = Array.from(this.containerRef.querySelectorAll('[data-action-menu-more]:not(:disabled)'));
        if (!buttons.length) return;
        const currentIndex = buttons.indexOf(document.activeElement);
        let nextIndex;
        if (event.key === 'Home') nextIndex = 0;
        else if (event.key === 'End') nextIndex = buttons.length - 1;
        else if (event.key === 'ArrowDown') nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % buttons.length;
        else nextIndex = currentIndex < 0 ? buttons.length - 1 : (currentIndex - 1 + buttons.length) % buttons.length;
        event.preventDefault();
        buttons[nextIndex].focus();
    }
    handleClosePopover () {
        this.closeTimeoutId = setTimeout(() => {
            this.setState({isOpen: false});
            this.closeTimeoutId = null;
        }, CLOSE_DELAY);
    }
    handleToggleOpenState () {
        // Mouse enter back in after timeout was started prevents it from closing.
        if (this.closeTimeoutId) {
            clearTimeout(this.closeTimeoutId);
            this.closeTimeoutId = null;
        } else if (!this.state.isOpen) {
            this.setState({
                isOpen: true,
                forceHide: false
            });
        }
    }
    handleTouchOutside (e) {
        if (this.state.isOpen && this.containerRef && !this.containerRef.contains(e.target)) {
            this.setState({isOpen: false});
            this.hideTooltips();
        }
    }
    clickDelayer (fn) {
        // Return a wrapped action that manages the menu closing.
        // @todo we may be able to use react-transition for this in the future
        // for now all this work is to ensure the menu closes BEFORE the
        // (possibly slow) action is started.
        return event => {
            this.hideTooltips();
            if (fn) fn(event);
            // Blur the button so it does not keep focus after being clicked
            // This prevents keyboard events from triggering the button
            this.buttonRef.blur();
            this.setState({forceHide: true, isOpen: false}, () => {
                this.forceHideTimeoutId = setTimeout(() => {
                    this.forceHideTimeoutId = null;
                    this.setState({forceHide: false});
                });
            });
        };
    }
    handleTouchStart (e) {
        // Prevent this touch from becoming a click if menu is closed
        if (!this.state.isOpen) {
            e.preventDefault();
            this.handleToggleOpenState();
        }
    }
    setButtonRef (ref) {
        this.buttonRef = ref;
    }
    setContainerRef (ref) {
        this.containerRef = ref;
    }
    render () {
        const {
            className,
            img: mainImg,
            title: mainTitle,
            moreButtons,
            tooltipPlace,
            onClick
        } = this.props;

        return (
            <div
                className={classNames(styles.menuContainer, className, {
                    [styles.expanded]: this.state.isOpen,
                    [styles.forceHidden]: this.state.forceHide
                })}
                ref={this.setContainerRef}
                onBlur={this.handleBlur}
                onFocus={this.handleFocus}
                onKeyDown={this.handleKeyDown}
                onMouseEnter={this.handleToggleOpenState}
                onMouseLeave={this.handleClosePopover}
            >
                <button
                    type="button"
                    aria-label={mainTitle}
                    aria-expanded={this.state.isOpen}
                    aria-haspopup="menu"
                    className={classNames(styles.button, styles.mainButton)}
                    data-tooltip-content={mainTitle}
                    data-tooltip-id={this.mainTooltipId}
                    ref={this.setButtonRef}
                    onClick={this.clickDelayer(onClick)}
                >
                    {typeof mainImg === 'string' ? (
                        <img
                            className={styles.mainIcon}
                            draggable={false}
                            src={mainImg}
                        />
                    ) : mainImg ? (
                        React.createElement(mainImg, {className: styles.mainIcon, size: 28})
                    ) : null}
                </button>
                <Tooltip
                    className={styles.tooltip}
                    classNameArrow={styles.tooltipArrow}
                    id={this.mainTooltipId}
                    place={tooltipPlace || 'left'}
                    ref={this.tooltipRefs[0]}
                />
                <div
                    className={styles.moreButtonsOuter}
                    aria-hidden={!this.state.isOpen}
                >
                    <div className={styles.moreButtons}>
                        {(moreButtons || []).map(({img, title, onClick: handleClick,
                            fileAccept, fileChange, fileInput, fileMultiple}, keyId) => {
                            const isComingSoon = !handleClick;
                            const hasFileInput = fileInput;
                            const tooltipId = isComingSoon ? this.comingSoonTooltipId : this.moreTooltipId;
                            return (
                                <div key={`${tooltipId}-${title}-${keyId}`}>
                                    <button
                                        type="button"
                                        aria-label={title}
                                        className={classNames(styles.button, styles.moreButton, {
                                            [styles.comingSoon]: isComingSoon
                                        })}
                                        data-tooltip-content={title}
                                        data-tooltip-id={tooltipId}
                                        data-action-menu-more
                                        disabled={isComingSoon}
                                        tabIndex={this.state.isOpen && !this.state.forceHide && !isComingSoon ? 0 : -1}
                                        title={isComingSoon ?
                                            (typeof title === 'string' ? `${title} (coming soon)` : 'Coming soon') :
                                            null}
                                        onClick={this.clickDelayer(handleClick)}
                                    >
                                        {typeof img === 'string' ? (
                                            <img
                                                className={styles.moreIcon}
                                                draggable={false}
                                                src={img}
                                            />
                                        ) : img ? (
                                            React.createElement(img, {className: styles.moreIcon, size: 20})
                                        ) : null}
                                    </button>
                                    {hasFileInput ? (
                                        <input
                                            accept={fileAccept}
                                            className={styles.fileInput}
                                            multiple={fileMultiple}
                                            ref={fileInput}
                                            type="file"
                                            onChange={fileChange}
                                        />) : null}
                                </div>
                            );
                        })}
                    </div>
                </div>
                <Tooltip
                    className={styles.tooltip}
                    classNameArrow={styles.tooltipArrow}
                    id={this.moreTooltipId}
                    place={tooltipPlace || 'left'}
                    ref={this.tooltipRefs[1]}
                />
                <Tooltip
                    className={classNames(styles.tooltip, styles.comingSoonTooltip)}
                    classNameArrow={classNames(styles.tooltipArrow, styles.comingSoonTooltipArrow)}
                    id={this.comingSoonTooltipId}
                    place={tooltipPlace || 'left'}
                    ref={this.tooltipRefs[2]}
                />
            </div>
        );
    }
}

ActionMenu.propTypes = {
    className: PropTypes.string,
    img: PropTypes.oneOfType([PropTypes.string, PropTypes.elementType]),
    moreButtons: PropTypes.arrayOf(PropTypes.shape({
        img: PropTypes.oneOfType([PropTypes.string, PropTypes.elementType]),
        title: PropTypes.node.isRequired,
        onClick: PropTypes.func, // Optional, "coming soon" if no callback provided
        fileAccept: PropTypes.string, // Optional, only for file upload
        fileChange: PropTypes.func, // Optional, only for file upload
        fileInput: PropTypes.func, // Optional, only for file upload
        fileMultiple: PropTypes.bool // Optional, only for file upload
    })),
    onClick: PropTypes.func.isRequired,
    title: PropTypes.node.isRequired,
    tooltipPlace: PropTypes.string
};

export default ActionMenu;
