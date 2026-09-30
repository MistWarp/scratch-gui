import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {FormattedMessage, defineMessages, injectIntl, intlShape} from 'react-intl';
import {Backpack as BackpackIcon, ChevronDown, ChevronUp} from 'lucide-react';

import {
    BackpackFilters,
    BackpackSearch,
    BackpackStatus,
    BackpackItems
} from './backpack-controls.jsx';
import {FILTERS} from '../../lib/backpack/preferences.js';
import styles from './backpack.css';

const messages = defineMessages({
    title: {
        id: 'gui.backpack.header',
        defaultMessage: 'Backpack',
        description: 'Button to open the backpack'
    },
    expand: {
        id: 'mw.backpack.expandStrip',
        defaultMessage: 'Show backpack items',
        description: 'Accessible label of the button that expands the backpack strip'
    },
    collapse: {
        id: 'mw.backpack.collapseStrip',
        defaultMessage: 'Hide backpack items',
        description: 'Accessible label of the button that collapses the backpack strip'
    },
    resize: {
        id: 'mw.backpack.resizeStrip',
        defaultMessage: 'Resize the backpack',
        description: 'Accessible label of the handle that resizes the backpack strip'
    }
});

const MULTI_ROW_HEIGHT = 17 * 16;

const noop = () => {};

const Backpack = ({
    busyId,
    canRename,
    canToggle,
    contents,
    dragActive,
    dragOver,
    error,
    expanded,
    filter,
    handleRef,
    height,
    intl,
    loading,
    notice,
    panelRef,
    renamingId,
    searchQuery,
    showMore,
    totalCount,
    onDelete,
    onFilterChange,
    onInsert,
    onMore,
    onRenameCancel,
    onRenameStart,
    onRenameSubmit,
    onResizePointerDown,
    onSearchChange,
    onToggle
}) => {
    const collapsedDropZone = !expanded && dragActive;
    const multiRow = height >= MULTI_ROW_HEIGHT;
    return (
        <div
            className={classNames(styles.backpackContainer, {
                [styles.expanded]: expanded,
                [styles.dragActive]: dragActive
            })}
        >
            {expanded ? (
                <div
                    aria-label={intl.formatMessage(messages.resize)}
                    className={styles.resizeHandle}
                    role="separator"
                    aria-orientation="horizontal"
                    onPointerDown={onResizePointerDown}
                />
            ) : null}
            <div
                className={classNames(styles.backpackHeader, {
                    [styles.headerDropZone]: collapsedDropZone,
                    [styles.dragOver]: collapsedDropZone && dragOver
                })}
                data-backpack-drop-zone="true"
                ref={expanded ? null : handleRef}
            >
                <button
                    aria-expanded={expanded}
                    aria-label={intl.formatMessage(expanded ? messages.collapse : messages.expand)}
                    className={styles.headerToggle}
                    disabled={!canToggle}
                    type="button"
                    onClick={onToggle}
                >
                    <BackpackIcon
                        className={styles.headerIcon}
                        size={16}
                    />
                    <span className={styles.headerTitle}>
                        <FormattedMessage {...messages.title} />
                    </span>
                    <span className={styles.headerCount}>{totalCount}</span>
                    {expanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                </button>
                {expanded ? (
                    <React.Fragment>
                        <BackpackFilters
                            className={styles.headerFilters}
                            filter={filter}
                            onFilterChange={onFilterChange}
                        />
                        <BackpackSearch
                            className={styles.headerSearch}
                            searchQuery={searchQuery}
                            onSearchChange={onSearchChange}
                        />
                    </React.Fragment>
                ) : null}
            </div>
            {expanded ? (
                <div
                    className={classNames(styles.backpackList, {
                        [styles.dragOver]: dragOver,
                        [styles.multiRow]: multiRow
                    })}
                    data-backpack-drop-zone="true"
                    ref={panelRef}
                    style={height ? {height: `${height}px`} : null}
                >
                    <BackpackStatus
                        error={error}
                        filter={filter}
                        hasItems={contents.length > 0}
                        loading={loading}
                        searchQuery={searchQuery}
                    />
                    {contents.length > 0 || showMore ? (
                        <div className={styles.backpackListInner}>
                            <BackpackItems
                                busyId={busyId}
                                canRename={canRename}
                                contents={contents}
                                itemClassName={styles.backpackItem}
                                renamingId={renamingId}
                                showMore={showMore}
                                onDelete={onDelete}
                                onInsert={onInsert}
                                onMore={onMore}
                                onRenameCancel={onRenameCancel}
                                onRenameStart={onRenameStart}
                                onRenameSubmit={onRenameSubmit}
                            />
                        </div>
                    ) : null}
                    {dragActive ? <div className={styles.dropOverlay} /> : null}
                </div>
            ) : null}
            {notice ? (
                <div
                    aria-live="polite"
                    className={styles.notice}
                    role="status"
                >
                    {notice}
                </div>
            ) : null}
        </div>
    );
};

Backpack.propTypes = {
    busyId: PropTypes.string,
    canRename: PropTypes.bool,
    canToggle: PropTypes.bool,
    contents: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string,
        thumbnailUrl: PropTypes.string,
        type: PropTypes.string,
        name: PropTypes.string
    })),
    dragActive: PropTypes.bool,
    dragOver: PropTypes.bool,
    error: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
    expanded: PropTypes.bool,
    filter: PropTypes.oneOf(FILTERS),
    handleRef: PropTypes.func,
    height: PropTypes.number,
    intl: intlShape,
    loading: PropTypes.bool,
    notice: PropTypes.string,
    panelRef: PropTypes.func,
    renamingId: PropTypes.string,
    searchQuery: PropTypes.string,
    showMore: PropTypes.bool,
    totalCount: PropTypes.number,
    onDelete: PropTypes.func,
    onFilterChange: PropTypes.func,
    onInsert: PropTypes.func,
    onMore: PropTypes.func,
    onRenameCancel: PropTypes.func,
    onRenameStart: PropTypes.func,
    onRenameSubmit: PropTypes.func,
    onResizePointerDown: PropTypes.func,
    onSearchChange: PropTypes.func,
    onToggle: PropTypes.func
};

Backpack.defaultProps = {
    canRename: false,
    canToggle: true,
    contents: [],
    dragActive: false,
    dragOver: false,
    error: false,
    expanded: false,
    filter: 'all',
    height: null,
    loading: false,
    notice: null,
    searchQuery: '',
    showMore: false,
    totalCount: 0,
    onDelete: noop,
    onFilterChange: noop,
    onInsert: noop,
    onMore: noop,
    onRenameCancel: noop,
    onRenameStart: noop,
    onRenameSubmit: noop,
    onResizePointerDown: noop,
    onSearchChange: noop,
    onToggle: noop
};

export default injectIntl(Backpack);
