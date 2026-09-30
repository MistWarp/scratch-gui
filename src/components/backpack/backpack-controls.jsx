import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {FormattedMessage, defineMessages, injectIntl, intlShape} from 'react-intl';
import {Search} from 'lucide-react';

import BackpackItem from '../../containers/backpack-item.jsx';
import FilterButton from './backpack-filter-button.jsx';
import {FILTERS} from '../../lib/backpack/preferences.js';
import styles from './backpack-controls.css';

const filterMessages = defineMessages({
    all: {
        id: 'mw.backpack.filterAll',
        defaultMessage: 'All',
        description: 'Backpack filter tab that shows every item'
    },
    script: {
        id: 'mw.backpack.filterScripts',
        defaultMessage: 'Scripts',
        description: 'Backpack filter tab that shows only scripts'
    },
    sprite: {
        id: 'mw.backpack.filterSprites',
        defaultMessage: 'Sprites',
        description: 'Backpack filter tab that shows only sprites'
    },
    costume: {
        id: 'mw.backpack.filterCostumes',
        defaultMessage: 'Costumes',
        description: 'Backpack filter tab that shows only costumes'
    },
    sound: {
        id: 'mw.backpack.filterSounds',
        defaultMessage: 'Sounds',
        description: 'Backpack filter tab that shows only sounds'
    }
});

const messages = defineMessages({
    filters: {
        id: 'mw.backpack.filterGroup',
        defaultMessage: 'Filter backpack items by type',
        description: 'Accessible label for the row of backpack filter tabs'
    },
    search: {
        id: 'gui.backpack.searchPlaceholder',
        defaultMessage: 'Search backpack...',
        description: 'Placeholder of the backpack search field'
    }
});

const BackpackFiltersComponent = ({className, filter, intl, onFilterChange}) => (
    <div
        aria-label={intl.formatMessage(messages.filters)}
        className={classNames(styles.filters, className)}
        role="group"
    >
        {FILTERS.map(value => (
            <FilterButton
                active={filter === value}
                key={value}
                label={intl.formatMessage(filterMessages[value])}
                value={value}
                onSelect={onFilterChange}
            />
        ))}
    </div>
);

BackpackFiltersComponent.propTypes = {
    className: PropTypes.string,
    filter: PropTypes.oneOf(FILTERS).isRequired,
    intl: intlShape,
    onFilterChange: PropTypes.func.isRequired
};

const BackpackSearchComponent = ({className, intl, searchQuery, onSearchChange}) => (
    <label className={classNames(styles.search, className)}>
        <Search
            className={styles.searchIcon}
            size={14}
        />
        <input
            aria-label={intl.formatMessage(messages.search)}
            autoComplete="off"
            className={styles.searchInput}
            placeholder={intl.formatMessage(messages.search)}
            type="search"
            value={searchQuery}
            onChange={onSearchChange}
        />
    </label>
);

BackpackSearchComponent.propTypes = {
    className: PropTypes.string,
    intl: intlShape,
    searchQuery: PropTypes.string,
    onSearchChange: PropTypes.func.isRequired
};

const BackpackFilters = injectIntl(BackpackFiltersComponent);
const BackpackSearch = injectIntl(BackpackSearchComponent);

const BackpackStatus = ({error, loading, searchQuery, filter, hasItems}) => {
    if (error !== false) {
        return (
            <div className={styles.status}>
                <FormattedMessage
                    defaultMessage="Error loading backpack"
                    description="Error backpack message"
                    id="gui.backpack.errorBackpack"
                />
                <div className={styles.errorMessage}>{error}</div>
            </div>
        );
    }
    if (loading) {
        return (
            <div className={styles.status}>
                <FormattedMessage
                    defaultMessage="Loading..."
                    description="Loading backpack message"
                    id="gui.backpack.loadingBackpack"
                />
            </div>
        );
    }
    if (hasItems) return null;
    if (searchQuery || filter !== 'all') {
        return (
            <div className={styles.status}>
                <FormattedMessage
                    defaultMessage="No matching backpack items"
                    id="gui.backpack.noSearchResults"
                />
            </div>
        );
    }
    return (
        <div className={styles.status}>
            <FormattedMessage
                defaultMessage="Backpack is empty"
                description="Empty backpack message"
                id="gui.backpack.emptyBackpack"
            />
            <div className={styles.statusHint}>
                <FormattedMessage
                    defaultMessage="Drag scripts, sprites, costumes or sounds here to keep them for later."
                    description="Hint shown in an empty backpack"
                    id="mw.backpack.emptyHint"
                />
            </div>
        </div>
    );
};

BackpackStatus.propTypes = {
    error: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
    filter: PropTypes.string,
    hasItems: PropTypes.bool,
    loading: PropTypes.bool,
    searchQuery: PropTypes.string
};

const BackpackItems = ({
    busyId,
    canRename,
    contents,
    itemClassName,
    renamingId,
    showMore,
    onDelete,
    onInsert,
    onMore,
    onRenameCancel,
    onRenameStart,
    onRenameSubmit
}) => (
    <React.Fragment>
        {contents.map(item => (
            <BackpackItem
                busy={busyId === item.id}
                canRename={canRename}
                className={itemClassName}
                item={item}
                key={item.id}
                renaming={renamingId === item.id}
                onClick={onInsert}
                onDelete={onDelete}
                onRenameCancel={onRenameCancel}
                onRenameStart={onRenameStart}
                onRenameSubmit={onRenameSubmit}
            />
        ))}
        {showMore ? (
            <button
                className={styles.more}
                type="button"
                onClick={onMore}
            >
                <FormattedMessage
                    defaultMessage="More"
                    description="Load more from backpack"
                    id="gui.backpack.more"
                />
            </button>
        ) : null}
    </React.Fragment>
);

BackpackItems.propTypes = {
    busyId: PropTypes.string,
    canRename: PropTypes.bool,
    contents: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string,
        name: PropTypes.string,
        thumbnailUrl: PropTypes.string,
        type: PropTypes.string
    })).isRequired,
    itemClassName: PropTypes.string,
    renamingId: PropTypes.string,
    showMore: PropTypes.bool,
    onDelete: PropTypes.func.isRequired,
    onInsert: PropTypes.func.isRequired,
    onMore: PropTypes.func,
    onRenameCancel: PropTypes.func.isRequired,
    onRenameStart: PropTypes.func.isRequired,
    onRenameSubmit: PropTypes.func.isRequired
};

export {
    FILTERS,
    BackpackFilters,
    BackpackSearch,
    BackpackStatus,
    BackpackItems
};
