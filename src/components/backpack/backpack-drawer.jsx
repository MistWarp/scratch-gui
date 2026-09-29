import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {FormattedMessage, defineMessages, injectIntl, intlShape} from 'react-intl';
import {Backpack as BackpackIcon, Pin, PinOff, X} from 'lucide-react';

import {
    BackpackFilters,
    BackpackSearch,
    BackpackLayoutSwitch,
    BackpackStatus,
    BackpackItems
} from './backpack-controls.jsx';
import styles from './backpack-drawer.css';

const messages = defineMessages({
    open: {
        id: 'mw.backpack.openDrawer',
        defaultMessage: 'Open backpack',
        description: 'Accessible label of the handle that opens the backpack drawer'
    },
    close: {
        id: 'mw.backpack.closeDrawer',
        defaultMessage: 'Close backpack',
        description: 'Accessible label of the button that closes the backpack drawer'
    },
    pin: {
        id: 'mw.backpack.pinDrawer',
        defaultMessage: 'Keep the backpack open',
        description: 'Accessible label of the pin button in the backpack drawer'
    },
    unpin: {
        id: 'mw.backpack.unpinDrawer',
        defaultMessage: 'Let the backpack close on its own',
        description: 'Accessible label of the pin button in the backpack drawer while it is pinned'
    },
    title: {
        id: 'mw.backpack.drawerTitle',
        defaultMessage: 'Backpack',
        description: 'Heading of the backpack drawer'
    }
});

const BackpackDrawer = ({
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
    intl,
    layout,
    loading,
    notice,
    panelRef,
    pinned,
    renamingId,
    searchQuery,
    showMore,
    totalCount,
    onClose,
    onDelete,
    onFilterChange,
    onInsert,
    onLayoutChange,
    onMore,
    onPanelKeyDown,
    onPinToggle,
    onRenameCancel,
    onRenameStart,
    onRenameSubmit,
    onSearchChange,
    onToggle
}) => (
    <div
        className={classNames(styles.drawer, {
            [styles.expanded]: expanded,
            [styles.dragActive]: dragActive
        })}
    >
        {expanded ? (
            <section
                aria-label={intl.formatMessage(messages.title)}
                className={classNames(styles.panel, {[styles.dragOver]: dragOver})}
                data-backpack-drop-zone="true"
                ref={panelRef}
                onKeyDown={onPanelKeyDown}
            >
                <div className={styles.header}>
                    <BackpackIcon
                        className={styles.headerIcon}
                        size={18}
                    />
                    <h2 className={styles.title}>
                        <FormattedMessage {...messages.title} />
                    </h2>
                    <span className={styles.count}>{totalCount}</span>
                    <div className={styles.headerSpacer} />
                    <button
                        aria-label={intl.formatMessage(pinned ? messages.unpin : messages.pin)}
                        aria-pressed={pinned}
                        className={classNames(styles.iconButton, {[styles.iconButtonActive]: pinned})}
                        title={intl.formatMessage(pinned ? messages.unpin : messages.pin)}
                        type="button"
                        onClick={onPinToggle}
                    >
                        {pinned ? <Pin size={16} /> : <PinOff size={16} />}
                    </button>
                    <button
                        aria-label={intl.formatMessage(messages.close)}
                        className={styles.iconButton}
                        title={intl.formatMessage(messages.close)}
                        type="button"
                        onClick={onClose}
                    >
                        <X size={16} />
                    </button>
                </div>
                <div className={styles.toolbar}>
                    <BackpackFilters
                        filter={filter}
                        onFilterChange={onFilterChange}
                    />
                </div>
                <div className={styles.toolbar}>
                    <BackpackSearch
                        className={styles.search}
                        searchQuery={searchQuery}
                        onSearchChange={onSearchChange}
                    />
                </div>
                <div className={styles.body}>
                    <BackpackStatus
                        error={error}
                        filter={filter}
                        hasItems={contents.length > 0}
                        loading={loading}
                        searchQuery={searchQuery}
                    />
                    <div className={styles.list}>
                        <BackpackItems
                            busyId={busyId}
                            canRename={canRename}
                            contents={contents}
                            renamingId={renamingId}
                            showMore={showMore}
                            variant="card"
                            onDelete={onDelete}
                            onInsert={onInsert}
                            onMore={onMore}
                            onRenameCancel={onRenameCancel}
                            onRenameStart={onRenameStart}
                            onRenameSubmit={onRenameSubmit}
                        />
                    </div>
                    {dragActive ? (
                        <div className={styles.dropOverlay}>
                            <BackpackIcon size={28} />
                            <FormattedMessage
                                defaultMessage="Drop here to save it to your backpack."
                                description="Text shown over the backpack while something is being dragged"
                                id="mw.backpack.dropHere"
                            />
                        </div>
                    ) : null}
                </div>
                <div className={styles.footer}>
                    <BackpackLayoutSwitch
                        layout={layout}
                        onLayoutChange={onLayoutChange}
                    />
                </div>
            </section>
        ) : (
            <button
                aria-expanded={false}
                aria-label={intl.formatMessage(messages.open)}
                className={classNames(styles.edgeTab, {
                    [styles.edgeTabDropZone]: dragActive,
                    [styles.dragOver]: dragOver
                })}
                data-backpack-drop-zone="true"
                disabled={!canToggle}
                ref={handleRef}
                title={intl.formatMessage(messages.open)}
                type="button"
                onClick={onToggle}
            >
                <BackpackIcon size={dragActive ? 28 : 18} />
                {dragActive ? (
                    <span className={styles.edgeTabText}>
                        <FormattedMessage
                            defaultMessage="Drop here to save it to your backpack."
                            description="Text shown over the backpack while something is being dragged"
                            id="mw.backpack.dropHere"
                        />
                    </span>
                ) : (
                    <React.Fragment>
                        <span className={styles.edgeTabLabel}>
                            <FormattedMessage {...messages.title} />
                        </span>
                        {totalCount > 0 ? <span className={styles.edgeTabCount}>{totalCount}</span> : null}
                    </React.Fragment>
                )}
            </button>
        )}
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

BackpackDrawer.propTypes = {
    busyId: PropTypes.string,
    canRename: PropTypes.bool,
    canToggle: PropTypes.bool,
    contents: PropTypes.arrayOf(PropTypes.object).isRequired,
    dragActive: PropTypes.bool,
    dragOver: PropTypes.bool,
    error: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
    expanded: PropTypes.bool,
    filter: PropTypes.string.isRequired,
    handleRef: PropTypes.func,
    intl: intlShape,
    layout: PropTypes.string.isRequired,
    loading: PropTypes.bool,
    notice: PropTypes.string,
    panelRef: PropTypes.func,
    pinned: PropTypes.bool,
    renamingId: PropTypes.string,
    searchQuery: PropTypes.string,
    showMore: PropTypes.bool,
    totalCount: PropTypes.number,
    onClose: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
    onFilterChange: PropTypes.func.isRequired,
    onInsert: PropTypes.func.isRequired,
    onLayoutChange: PropTypes.func.isRequired,
    onMore: PropTypes.func,
    onPanelKeyDown: PropTypes.func,
    onPinToggle: PropTypes.func.isRequired,
    onRenameCancel: PropTypes.func.isRequired,
    onRenameStart: PropTypes.func.isRequired,
    onRenameSubmit: PropTypes.func.isRequired,
    onSearchChange: PropTypes.func.isRequired,
    onToggle: PropTypes.func.isRequired
};

BackpackDrawer.defaultProps = {
    canToggle: true,
    dragActive: false,
    dragOver: false,
    expanded: false,
    pinned: false,
    totalCount: 0
};

export default injectIntl(BackpackDrawer);
