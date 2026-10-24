/* eslint-disable react/jsx-no-bind */
import classNames from 'classnames';
import PropTypes from 'prop-types';
import React, {useEffect, useRef} from 'react';
import {injectIntl, intlShape} from 'react-intl';
import {
    AudioWaveform,
    Blocks as BlocksIcon,
    ChevronDown,
    ChevronRight,
    FileCode2,
    Folder,
    FolderTree,
    Image as ImageIcon,
    Monitor,
    Package,
    Plus,
    Puzzle,
    Shapes
} from 'lucide-react';

import {DRAG_TYPE} from '../../lib/code-mode/editor-units.js';
import messages from './messages.js';
import styles from './workbench.css';

const ROW_ICONS = {
    stage: Monitor,
    target: Shapes,
    script: FileCode2,
    folder: null,
    costume: ImageIcon,
    sound: AudioWaveform,
    extensions: Puzzle,
    extension: BlocksIcon,
    assets: Package,
    assetFolder: Folder
};

const RenameInput = ({initial, onCancel, onCommit}) => {
    const ref = useRef(null);
    useEffect(() => {
        if (ref.current) {
            ref.current.focus();
            ref.current.select();
        }
    }, []);
    return (
        <input
            className={styles.renameInput}
            defaultValue={initial}
            ref={ref}
            onBlur={event => onCommit(event.target.value)}
            onClick={event => event.stopPropagation()}
            onKeyDown={event => {
                event.stopPropagation();
                if (event.key === 'Enter') onCommit(event.target.value);
                else if (event.key === 'Escape') onCancel();
            }}
        />
    );
};

RenameInput.propTypes = {
    initial: PropTypes.string,
    onCancel: PropTypes.func.isRequired,
    onCommit: PropTypes.func.isRequired
};

const Explorer = props => {
    const {
        activeKey,
        dropKey,
        intl,
        renamingKey,
        rows,
        selectedKey
    } = props;
    const listRef = useRef(null);

    useEffect(() => {
        if (!selectedKey || !listRef.current) return;
        const node = Array.from(listRef.current.children).find(child => child.dataset.rowKey === selectedKey);
        if (node && typeof node.scrollIntoView === 'function') node.scrollIntoView({block: 'nearest'});
    }, [selectedKey]);

    const handleKeyDown = event => {
        if (event.target.tagName === 'INPUT') return;
        const index = rows.findIndex(row => row.key === selectedKey);
        const row = rows[index] || null;
        let handled = true;
        switch (event.key) {
        case 'ArrowDown':
            if (rows.length) props.onSelect(rows[Math.min(rows.length - 1, index + 1)]);
            break;
        case 'ArrowUp':
            if (rows.length) props.onSelect(rows[Math.max(0, index - 1)]);
            break;
        case 'ArrowRight':
            if (row && row.expandable && !row.expanded) props.onToggle(row);
            else if (row && rows[index + 1]) props.onSelect(rows[index + 1]);
            break;
        case 'ArrowLeft':
            if (row && row.expandable && row.expanded) props.onToggle(row);
            else if (row && row.parentKey) {
                const parent = rows.find(item => item.key === row.parentKey);
                if (parent) props.onSelect(parent);
            }
            break;
        case 'Enter':
            if (row) props.onOpen(row, {preview: false});
            break;
        case 'F2':
            if (row) props.onRename(row);
            break;
        case 'Delete':
        case 'Backspace':
            if (row) props.onDelete(row);
            break;
        default:
            handled = false;
        }
        if (handled) {
            event.preventDefault();
            event.stopPropagation();
        } else if (event.key.length > 1 || !(event.ctrlKey || event.metaKey)) {
            event.stopPropagation();
        }
    };

    const dragOver = (row, event) => {
        if (!props.canDrop(row, event)) return;
        event.preventDefault();
        event.stopPropagation();
        event.dataTransfer.dropEffect = 'copy';
        props.onDragHover(row ? row.key : 'root');
    };

    const drop = (row, event) => {
        event.preventDefault();
        event.stopPropagation();
        props.onDragHover(null);
        props.onDrop(row, event);
    };

    return (
        <div
            className={styles.explorer}
            data-mw-region="explorer"
            style={props.style}
        >
            <div className={styles.explorerHeader}>
                <FolderTree
                    className={styles.headerIcon}
                    size={15}
                />
                <h2 className={styles.explorerHeading}>{intl.formatMessage(messages.explorer)}</h2>
                <button
                    aria-label={intl.formatMessage(messages.addSprite)}
                    className={styles.iconButton}
                    title={intl.formatMessage(messages.addSprite)}
                    type="button"
                    onClick={event => props.onRootMenu(event)}
                >
                    <Plus size={15} />
                </button>
            </div>
            <div
                aria-label={intl.formatMessage(messages.explorer)}
                className={classNames(styles.tree, {[styles.dropHover]: dropKey === 'root'})}
                ref={listRef}
                role="tree"
                tabIndex={rows.length ? 0 : -1}
                onContextMenu={event => {
                    if (event.target === event.currentTarget) {
                        event.preventDefault();
                        props.onRootMenu(event);
                    }
                }}
                onDragLeave={event => {
                    if (!event.currentTarget.contains(event.relatedTarget)) props.onDragHover(null);
                }}
                onDragOver={event => dragOver(null, event)}
                onDrop={event => drop(null, event)}
                onFocus={event => {
                    if (event.target === event.currentTarget && !selectedKey && rows.length) props.onSelect(rows[0]);
                }}
                onKeyDown={handleKeyDown}
            >
                {rows.map(row => {
                    const Icon = row.icon ||
                        (row.type === 'target' && row.isStage ? ROW_ICONS.stage : ROW_ICONS[row.type]);
                    const selected = row.key === selectedKey;
                    return (
                        <div
                            aria-expanded={row.expandable ? row.expanded : null}
                            aria-level={row.depth + 1}
                            aria-selected={selected}
                            className={classNames(styles.row, {
                                [styles.rowSelected]: selected,
                                [styles.rowActive]: row.key === activeKey,
                                [styles.rowMuted]: row.muted,
                                [styles.rowTarget]: row.type === 'target',
                                [styles.dropHover]: dropKey === row.key
                            })}
                            data-row-key={row.key}
                            draggable={Boolean(row.draggable)}
                            key={row.key}
                            role="treeitem"
                            style={{paddingInlineStart: `${0.5 + (row.depth * 0.85)}rem`}}
                            title={row.tooltip || null}
                            onAuxClick={event => {
                                if (event.button === 1) event.preventDefault();
                            }}
                            onClick={() => {
                                props.onSelect(row);
                                if (row.expandable && !row.openable) props.onToggle(row);
                                else props.onOpen(row, {preview: true});
                            }}
                            onContextMenu={event => {
                                event.preventDefault();
                                event.stopPropagation();
                                props.onSelect(row);
                                props.onContextMenu(row, event);
                            }}
                            onDoubleClick={() => {
                                if (row.openable) props.onOpen(row, {preview: false});
                            }}
                            onDragOver={event => dragOver(row, event)}
                            onDragStart={event => props.onDragStart(row, event)}
                            onDrop={event => drop(row, event)}
                        >
                            {row.expandable ? (
                                <button
                                    aria-hidden="true"
                                    className={styles.twisty}
                                    tabIndex={-1}
                                    type="button"
                                    onClick={event => {
                                        event.stopPropagation();
                                        props.onToggle(row);
                                    }}
                                >
                                    {row.expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                                </button>
                            ) : <span className={styles.twistySpace} />}
                            {row.thumbnail ? (
                                <img
                                    alt=""
                                    className={styles.thumbnail}
                                    draggable={false}
                                    src={row.thumbnail}
                                />
                            ) : (Icon ? (
                                <Icon
                                    className={styles.rowIcon}
                                    size={14}
                                />
                            ) : null)}
                            {renamingKey === row.key ? (
                                <RenameInput
                                    initial={row.label}
                                    onCancel={props.onCancelRename}
                                    onCommit={value => props.onCommitRename(row, value)}
                                />
                            ) : (
                                <span className={styles.rowLabel}>{row.label}</span>
                            )}
                            {row.meta ? <span className={styles.rowMeta}>{row.meta}</span> : null}
                            {row.problems ? (
                                <span
                                    className={classNames(styles.problemBadge, {
                                        [styles.problemBadgeError]: row.problems.errors
                                    })}
                                    title={intl.formatMessage(messages.problemCount, {count: row.problems.total})}
                                >
                                    {row.problems.total}
                                </span>
                            ) : null}
                        </div>
                    );
                })}
            </div>
            {props.footer}
        </div>
    );
};

Explorer.propTypes = {
    activeKey: PropTypes.string,
    footer: PropTypes.node,
    canDrop: PropTypes.func.isRequired,
    dropKey: PropTypes.string,
    intl: intlShape,
    renamingKey: PropTypes.string,
    rows: PropTypes.arrayOf(PropTypes.object).isRequired,
    selectedKey: PropTypes.string,
    style: PropTypes.object,
    onCancelRename: PropTypes.func.isRequired,
    onCommitRename: PropTypes.func.isRequired,
    onContextMenu: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
    onDragHover: PropTypes.func.isRequired,
    onDragStart: PropTypes.func.isRequired,
    onDrop: PropTypes.func.isRequired,
    onOpen: PropTypes.func.isRequired,
    onRename: PropTypes.func.isRequired,
    onRootMenu: PropTypes.func.isRequired,
    onSelect: PropTypes.func.isRequired,
    onToggle: PropTypes.func.isRequired
};

export {DRAG_TYPE};
export default injectIntl(Explorer);
