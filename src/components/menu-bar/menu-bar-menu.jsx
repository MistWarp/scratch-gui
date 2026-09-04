import PropTypes from 'prop-types';
import React from 'react';
import {FormattedMessage} from 'react-intl';
import {ArrowLeft, X} from 'lucide-react';
import Menu from '../../containers/menu.jsx';
import styles from './menu-bar-menu.module.css';

const MenuBarMenu = ({
    children,
    className,
    mobileBack = false,
    mobileTitle,
    onMobileClose,
    open,
    place = 'right'
}) => (
    <div className={className}>
        {open && onMobileClose ? (
            <button
                type="button"
                className={styles.mobileBackdrop}
                onClick={onMobileClose}
            >
                <span className={styles.visuallyHidden}>
                    <FormattedMessage
                        defaultMessage="Close menu"
                        description="Accessible label for the backdrop closing a mobile menu"
                        id="gui.menu.closeBackdrop"
                    />
                </span>
            </button>
        ) : null}
        <Menu
            open={open}
            place={place}
        >
            {mobileTitle ? (
                <li
                    className={styles.mobileHeader}
                    role="presentation"
                >
                    <button
                        type="button"
                        className={styles.mobileHeaderButton}
                        onClick={onMobileClose}
                    >
                        {mobileBack ? <ArrowLeft size={18} /> : <X size={18} />}
                        <span className={mobileBack ? '' : styles.visuallyHidden}>
                            {mobileBack ? (
                                <FormattedMessage
                                    defaultMessage="All menus"
                                    description="Button returning to the mobile menu list"
                                    id="gui.menu.allMenus"
                                />
                            ) : (
                                <FormattedMessage
                                    defaultMessage="Close"
                                    description="Button closing a mobile menu"
                                    id="gui.menu.close"
                                />
                            )}
                        </span>
                    </button>
                    <strong className={styles.mobileTitle}>{mobileTitle}</strong>
                    <span className={styles.mobileHeaderSpacer} />
                </li>
            ) : null}
            {children}
        </Menu>
    </div>
);

MenuBarMenu.propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
    mobileBack: PropTypes.bool,
    mobileTitle: PropTypes.node,
    onMobileClose: PropTypes.func,
    open: PropTypes.bool,
    place: PropTypes.oneOf(['left', 'right'])
};

export default MenuBarMenu;
