import classNames from 'classnames';
import PropTypes from 'prop-types';
import React, {useCallback, useMemo, useState} from 'react';
import {FormattedMessage, intlShape} from 'react-intl';

import {
    Download,
    Pencil,
    Plus,
    Trash2,
    Upload
} from 'lucide-react';

import ChevronDown from './ChevronDown.jsx';

const ICON_SIZE = 16;
const CARET_SIZE = 12;

import {MenuItem, MenuSection} from '../menu/menu.jsx';

import styles from './workspace-bookmarks-menu.css';

const formatDate = timestamp => {
    try {
        return new Date(timestamp).toLocaleDateString();
    } catch {
        return null;
    }
};

const stopPropagation = e => {
    e.stopPropagation();
};

const WorkspaceBookmarksMenu = props => {
    const {
        bookmarks,
        categories,
        collapsedCategories,
        enableCategories,
        showSearch,
        onAddBookmark,
        onSwitchToBookmark,
        onEditBookmark,
        onDeleteBookmark,
        onToggleCategoryCollapsed,
        onExport,
        onImport,
        onClearAll
    } = props;

    const [searchTerm, setSearchTerm] = useState('');

    const handleSearchChange = useCallback(e => {
        setSearchTerm(e.target.value);
    }, []);

    const makeSwitchHandler = index => () => onSwitchToBookmark(index);
    const makeToggleCategoryHandler = category => () => onToggleCategoryCollapsed(category);
    const makeEditHandler = index => e => {
        e.stopPropagation();
        onEditBookmark(index);
    };
    const makeDeleteHandler = index => e => {
        e.stopPropagation();
        onDeleteBookmark(index);
    };

    const filtered = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();
        if (!term) return bookmarks;
        return bookmarks.filter(b => {
            const name = (b.name || '').toLowerCase();
            const category = (b.category || '').toLowerCase();
            return name.includes(term) || category.includes(term);
        });
    }, [bookmarks, searchTerm]);

    const grouped = useMemo(() => {
        if (!enableCategories) return null;
        const byCategory = new Map();
        for (const bookmark of filtered) {
            const category = bookmark.category || 'General';
            if (!byCategory.has(category)) byCategory.set(category, []);
            byCategory.get(category).push(bookmark);
        }
        const sortedCategories = [...categories].sort((a, b) => a.localeCompare(b));
        return {byCategory, sortedCategories};
    }, [enableCategories, filtered, categories]);

    const renderBookmark = (bookmark, indexInAll) => {
        const date = bookmark.timestamp ? formatDate(bookmark.timestamp) : null;
        return (
            <MenuItem
                className={styles.bookmarkItem}
                key={`${bookmark.name}-${indexInAll}-${bookmark.timestamp || 0}`}
                onClick={makeSwitchHandler(indexInAll)}
            >
                <div className={styles.bookmarkItemContent}>
                    <div className={styles.bookmarkItemMain}>
                        <span
                            className={styles.bookmarkItemText}
                            title={bookmark.name}
                        >
                            {bookmark.name}
                            {date ? (
                                <span className={styles.bookmarkMeta}>
                                    {' '}
                                    {'('}{date}{')'}
                                </span>
                            ) : null}
                        </span>
                    </div>
                    <div className={styles.bookmarkButtons}>
                        <button
                            className={styles.bookmarkButton}
                            onClick={makeEditHandler(indexInAll)}
                            type="button"
                            title={props.intl.formatMessage({
                                defaultMessage: 'Edit bookmark',
                                description: 'Tooltip for edit bookmark button',
                                id: 'tw.workspaceBookmarks.editTooltip'
                            })}
                        >
                            <Pencil size={ICON_SIZE} />
                        </button>
                        <button
                            className={styles.bookmarkButton}
                            onClick={makeDeleteHandler(indexInAll)}
                            type="button"
                            title={props.intl.formatMessage({
                                defaultMessage: 'Delete bookmark',
                                description: 'Tooltip for delete bookmark button',
                                id: 'tw.workspaceBookmarks.deleteTooltip'
                            })}
                        >
                            <Trash2 size={ICON_SIZE} />
                        </button>
                    </div>
                </div>
            </MenuItem>
        );
    };

    const renderBookmarksWithoutCategories = () => {
        if (filtered.length === 0) {
            return (
                <MenuItem className={styles.emptyItem}>
                    {searchTerm ? (
                        <FormattedMessage
                            defaultMessage="No matching bookmarks"
                            description="Empty state text in bookmarks menu"
                            id="tw.workspaceBookmarks.noMatching"
                        />
                    ) : (
                        <FormattedMessage
                            defaultMessage="No bookmarks yet"
                            description="Empty state text in bookmarks menu"
                            id="tw.workspaceBookmarks.none"
                        />
                    )}
                </MenuItem>
            );
        }

        return filtered.map(bookmark => {
            const indexInAll = bookmarks.indexOf(bookmark);
            return renderBookmark(bookmark, indexInAll);
        });
    };

    const renderBookmarksWithCategories = () => {
        if (!grouped) return null;
        const {byCategory, sortedCategories} = grouped;

        const any = sortedCategories.some(category => (byCategory.get(category) || []).length > 0);
        if (!any) {
            return (
                <MenuItem className={styles.emptyItem}>
                    {searchTerm ? (
                        <FormattedMessage
                            defaultMessage="No matching bookmarks"
                            description="Empty state text in bookmarks menu"
                            id="tw.workspaceBookmarks.noMatching"
                        />
                    ) : (
                        <FormattedMessage
                            defaultMessage="No bookmarks yet"
                            description="Empty state text in bookmarks menu"
                            id="tw.workspaceBookmarks.none"
                        />
                    )}
                </MenuItem>
            );
        }

        return sortedCategories.flatMap(category => {
            const list = byCategory.get(category);
            if (!list || list.length === 0) return [];

            const isCollapsed = collapsedCategories.includes(category);
            
            const header = (
                <MenuItem
                    className={classNames(styles.categoryHeader, {
                        [styles.categoryHeaderCollapsed]: isCollapsed
                    })}
                    key={`cat-${category}`}
                    onClick={makeToggleCategoryHandler(category)}
                >
                    <div className={styles.categoryHeaderContent}>
                        <span className={styles.categoryName}>{category}</span>
                        <span
                            className={classNames(styles.categoryToggle, {
                                [styles.categoryToggleCollapsed]: isCollapsed
                            })}
                        >
                            <ChevronDown size={CARET_SIZE} />
                        </span>
                    </div>
                </MenuItem>
            );

            if (isCollapsed) {
                return [header];
            }

            const items = list.map(bookmark => {
                const indexInAll = bookmarks.indexOf(bookmark);
                return renderBookmark(bookmark, indexInAll);
            });

            return [header, ...items];
        });
    };

    return (
        <React.Fragment>
            {showSearch ? (
                <li
                    className={styles.searchRow}
                    onClick={stopPropagation}
                    onMouseDown={stopPropagation}
                >
                    <input
                        className={styles.searchInput}
                        onChange={handleSearchChange}
                        onClick={stopPropagation}
                        onKeyDown={stopPropagation}
                        placeholder={props.intl.formatMessage({
                            defaultMessage: 'Search bookmarks...',
                            description: 'Placeholder for bookmarks search input',
                            id: 'tw.workspaceBookmarks.searchPlaceholder'
                        })}
                        type="text"
                        value={searchTerm}
                    />
                </li>
            ) : null}

            <MenuItem onClick={onAddBookmark}>
                <Plus size={ICON_SIZE} />
                <FormattedMessage
                    defaultMessage="Add Current Position"
                    description="Menu item in bookmarks menu"
                    id="tw.workspaceBookmarks.add"
                />
            </MenuItem>

            <MenuSection>
                {enableCategories ? renderBookmarksWithCategories() : renderBookmarksWithoutCategories()}
            </MenuSection>

            <MenuSection>
                <MenuItem onClick={onExport}>
                    <Download size={ICON_SIZE} />
                    <FormattedMessage
                        defaultMessage="Export"
                        description="Export bookmarks menu item"
                        id="tw.workspaceBookmarks.export"
                    />
                </MenuItem>
                <MenuItem onClick={onImport}>
                    <Upload size={ICON_SIZE} />
                    <FormattedMessage
                        defaultMessage="Import"
                        description="Import bookmarks menu item"
                        id="tw.workspaceBookmarks.import"
                    />
                </MenuItem>
                <MenuItem onClick={onClearAll}>
                    <Trash2 size={ICON_SIZE} />
                    <FormattedMessage
                        defaultMessage="Clear all"
                        description="Clear all bookmarks menu item"
                        id="tw.workspaceBookmarks.clearAll"
                    />
                </MenuItem>
            </MenuSection>
        </React.Fragment>
    );
};

WorkspaceBookmarksMenu.propTypes = {
    bookmarks: PropTypes.arrayOf(PropTypes.shape({
        name: PropTypes.string,
        category: PropTypes.string,
        state: PropTypes.object,
        timestamp: PropTypes.number
    })).isRequired,
    categories: PropTypes.arrayOf(PropTypes.string).isRequired,
    collapsedCategories: PropTypes.arrayOf(PropTypes.string).isRequired,
    enableCategories: PropTypes.bool.isRequired,
    showSearch: PropTypes.bool.isRequired,
    intl: intlShape.isRequired,
    onAddBookmark: PropTypes.func.isRequired,
    onSwitchToBookmark: PropTypes.func.isRequired,
    onEditBookmark: PropTypes.func.isRequired,
    onDeleteBookmark: PropTypes.func.isRequired,
    onToggleCategoryCollapsed: PropTypes.func.isRequired,
    onExport: PropTypes.func.isRequired,
    onImport: PropTypes.func.isRequired,
    onClearAll: PropTypes.func.isRequired
};

export default WorkspaceBookmarksMenu;
