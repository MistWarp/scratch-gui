import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import {Link} from 'react-router-dom';
import {MoreHorizontal} from 'lucide-react';
import ProjectThumbnail from './ProjectThumbnail.jsx';
import Dropdown from './ui/Dropdown.jsx';
import styles from './StuffRow.module.css';

// One line of a My Stuff list: a small cover, the title over a line of plain
// words about it, then anything quiet at the end and the row's menu. Lists
// of projects, saved games and the trash all use it, like the groups list.
const StuffRow = ({
    checked, dimmed, menu, menuLabel, meta, onCheck, project, selecting, title, to, trailing
}) => (
    <li className={classNames(styles.row, {[styles.dimmed]: dimmed, [styles.checked]: selecting && checked})}>
        {selecting ? (
            <label className={styles.check}>
                <input
                    type="checkbox"
                    checked={checked}
                    onChange={event => onCheck(event.target.checked)}
                    aria-label={typeof title === 'string' ? title : null}
                />
            </label>
        ) : null}
        {to ? (
            <Link
                to={to}
                className={styles.thumb}
                tabIndex={-1}
                aria-hidden="true"
            >
                <ProjectThumbnail project={project} fallbackClassName={styles.fallback} lazy />
            </Link>
        ) : (
            <span className={styles.thumb} aria-hidden="true">
                <ProjectThumbnail project={project} fallbackClassName={styles.fallback} lazy />
            </span>
        )}
        <span className={styles.text}>
            {to ? (
                <Link to={to} className={styles.title}>{title}</Link>
            ) : (
                <span className={styles.title}>{title}</span>
            )}
            {meta ? <span className={styles.meta}>{meta}</span> : null}
        </span>
        {trailing ? <span className={styles.trailing}>{trailing}</span> : null}
        {menu ? (
            <Dropdown
                portal
                menuClassName={styles.menu}
                renderTrigger={({open, toggle}) => (
                    <button
                        type="button"
                        className={styles.more}
                        aria-label={menuLabel}
                        title={menuLabel}
                        aria-expanded={open}
                        aria-haspopup="menu"
                        onClick={toggle}
                    ><MoreHorizontal size={18} aria-hidden="true" /></button>
                )}
            >
                {menu}
            </Dropdown>
        ) : null}
    </li>
);

StuffRow.propTypes = {
    checked: PropTypes.bool,
    dimmed: PropTypes.bool,
    menu: PropTypes.func,
    menuLabel: PropTypes.string,
    meta: PropTypes.node,
    onCheck: PropTypes.func,
    project: PropTypes.object.isRequired,
    selecting: PropTypes.bool,
    title: PropTypes.node.isRequired,
    to: PropTypes.string,
    trailing: PropTypes.node
};

StuffRow.defaultProps = {
    checked: false,
    dimmed: false,
    selecting: false,
    onCheck: () => {}
};

// Words joined into one meta line, skipping the empty ones.
const MetaLine = ({parts}) => {
    const shown = parts.filter(Boolean);
    return (
        <React.Fragment>
            {shown.map((part, index) => (
                <React.Fragment key={index}>
                    {index ? <span className={styles.dot} aria-hidden="true">·</span> : null}
                    {part}
                </React.Fragment>
            ))}
        </React.Fragment>
    );
};

MetaLine.propTypes = {
    parts: PropTypes.arrayOf(PropTypes.node).isRequired
};

const StuffList = ({children, busy, className}) => (
    <ul
        className={classNames(styles.list, {[styles.busy]: busy}, className)}
        aria-busy={busy || null}
    >{children}</ul>
);

StuffList.propTypes = {
    busy: PropTypes.bool,
    children: PropTypes.node,
    className: PropTypes.string
};

// Links and buttons inside a row's menu, styled like Dropdown items.
const MenuLink = ({children, danger, href, onClick, to}) => {
    const className = classNames(styles.menuItem, {[styles.menuDanger]: danger});
    if (href) return <a role="menuitem" className={className} href={href} onClick={onClick}>{children}</a>;
    if (to) return <Link role="menuitem" className={className} to={to} onClick={onClick}>{children}</Link>;
    return <button type="button" role="menuitem" className={className} onClick={onClick}>{children}</button>;
};

MenuLink.propTypes = {
    children: PropTypes.node,
    danger: PropTypes.bool,
    href: PropTypes.string,
    onClick: PropTypes.func,
    to: PropTypes.string
};

const MenuSeparator = () => <span className={styles.menuSeparator} role="separator" />;

export {MenuLink, MenuSeparator, MetaLine, StuffList};
export default StuffRow;
