import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import {ChevronDown} from 'lucide-react';

import styles from './modal-sidebar.css';

const ModalSidebarLayout = ({children, className}) => (
    <div className={classNames(styles.layout, className)}>
        {children}
    </div>
);

ModalSidebarLayout.propTypes = {
    children: PropTypes.node,
    className: PropTypes.string
};

const ModalSidebar = ({
    ariaLabel,
    children,
    className,
    footer,
    header,
    width = 'default'
}) => {
    const widthClass = width === 'wide' ?
        styles.sidebarWide :
        width === 'narrow' ?
            styles.sidebarNarrow :
            null;

    return (
        <div className={classNames(styles.sidebar, widthClass, className)}>
            {header}
            <nav
                aria-label={ariaLabel}
                className={styles.items}
            >
                {children}
            </nav>
            {footer}
        </div>
    );
};

ModalSidebar.propTypes = {
    ariaLabel: PropTypes.string,
    children: PropTypes.node,
    className: PropTypes.string,
    footer: PropTypes.node,
    header: PropTypes.node,
    width: PropTypes.oneOf(['default', 'wide', 'narrow'])
};

const ModalSidebarItem = ({
    badge,
    count,
    icon: Icon,
    iconSize = 18,
    label,
    onClick,
    selected,
    title
}) => (
    <button
        className={classNames(styles.item, {[styles.itemSelected]: selected})}
        onClick={onClick}
        title={title || label}
        type="button"
    >
        {Icon && (
            <Icon
                className={styles.icon}
                size={iconSize}
            />
        )}
        <span className={styles.label}>{label}</span>
        {typeof count === 'number' && (
            <span className={styles.count}>{count}</span>
        )}
        {badge > 0 && (
            <span className={styles.badge}>{badge}</span>
        )}
    </button>
);

ModalSidebarItem.propTypes = {
    badge: PropTypes.number,
    count: PropTypes.number,
    icon: PropTypes.elementType,
    iconSize: PropTypes.number,
    label: PropTypes.node.isRequired,
    onClick: PropTypes.func.isRequired,
    selected: PropTypes.bool,
    title: PropTypes.string
};

const ModalSidebarGroup = ({children, className}) => (
    <div className={classNames(styles.group, className)}>
        {children}
    </div>
);

ModalSidebarGroup.propTypes = {
    children: PropTypes.node,
    className: PropTypes.string
};

const ModalSidebarGroupHeader = ({
    children,
    collapsed,
    collapsible,
    label,
    onClick
}) => {
    if (collapsible) {
        return (
            <button
                aria-expanded={!collapsed}
                className={classNames(styles.groupHeader, styles.groupHeaderButton)}
                onClick={onClick}
                type="button"
            >
                <ChevronDown
                    className={classNames(
                        styles.groupChevron,
                        {[styles.groupChevronCollapsed]: collapsed}
                    )}
                    size={14}
                />
                <span>{label || children}</span>
            </button>
        );
    }

    return (
        <div className={styles.groupHeader}>
            {label || children}
        </div>
    );
};

ModalSidebarGroupHeader.propTypes = {
    children: PropTypes.node,
    collapsed: PropTypes.bool,
    collapsible: PropTypes.bool,
    label: PropTypes.node,
    onClick: PropTypes.func
};

const ModalSidebarFooter = ({children, className}) => (
    <div className={classNames(styles.footer, className)}>
        {children}
    </div>
);

ModalSidebarFooter.propTypes = {
    children: PropTypes.node,
    className: PropTypes.string
};

const ModalSidebarAccount = ({avatarUrl, badge, name, subtitle}) => (
    <div className={styles.account}>
        {avatarUrl ? (
            <img
                alt=""
                className={styles.accountImg}
                src={avatarUrl}
            />
        ) : (
            <div className={styles.accountImg} />
        )}
        <div className={styles.accountMeta}>
            <strong>{name}</strong>
            {subtitle && <span>{subtitle}</span>}
        </div>
        {badge && (
            <span className={styles.accountBadge}>{badge}</span>
        )}
    </div>
);

ModalSidebarAccount.propTypes = {
    avatarUrl: PropTypes.string,
    badge: PropTypes.node,
    name: PropTypes.node.isRequired,
    subtitle: PropTypes.node
};

const ModalSidebarContent = ({children, className}) => (
    <div className={classNames(styles.content, className)}>
        {children}
    </div>
);

ModalSidebarContent.propTypes = {
    children: PropTypes.node,
    className: PropTypes.string
};

export {
    ModalSidebar,
    ModalSidebarAccount,
    ModalSidebarContent,
    ModalSidebarFooter,
    ModalSidebarGroup,
    ModalSidebarGroupHeader,
    ModalSidebarItem,
    ModalSidebarLayout
};

export default ModalSidebar;
