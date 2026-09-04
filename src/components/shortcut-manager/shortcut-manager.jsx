import PropTypes from 'prop-types';
import React from 'react';
import bindAll from 'lodash.bindall';
import {connect} from 'react-redux';
import {defineMessages, FormattedMessage, injectIntl} from 'react-intl';
import {
    Search,
    Keyboard,
    FileText,
    Pencil,
    Eye,
    Play,
    PanelsTopLeft,
    Library,
    Shapes,
    AppWindow,
    RotateCcw
} from 'lucide-react';

import {
    getDefaultShortcuts,
    getCategoryLabel,
    normalizeKey,
    SHORTCUT_CATEGORIES
} from '../../lib/shortcuts/registry.js';
import {updateShortcuts} from '../../lib/shortcuts/event-router.js';
import {setShortcut, resetShortcut, resetAllShortcuts} from '../../reducers/shortcuts';

import Input from '../forms/input.jsx';
import ShortcutCategory from './shortcut-category.jsx';
import {isMac} from './key-combo.jsx';

import styles from './shortcut-manager.module.css';

const CATEGORY_ICONS = {
    [SHORTCUT_CATEGORIES.FILE]: FileText,
    [SHORTCUT_CATEGORIES.EDIT]: Pencil,
    [SHORTCUT_CATEGORIES.VIEW]: Eye,
    [SHORTCUT_CATEGORIES.PROJECT_CONTROLS]: Play,
    [SHORTCUT_CATEGORIES.EDITOR_NAVIGATION]: PanelsTopLeft,
    [SHORTCUT_CATEGORIES.LIBRARY_ACCESS]: Library,
    [SHORTCUT_CATEGORIES.SPRITE_MANAGEMENT]: Shapes,
    [SHORTCUT_CATEGORIES.WINDOW_MANAGEMENT]: AppWindow
};

const messages = defineMessages({
    search: {
        defaultMessage: 'Search shortcuts',
        description: 'Placeholder text for search input',
        id: 'shortcut-manager.search'
    },
    noResults: {
        defaultMessage: 'No shortcuts found',
        description: 'Message when no shortcuts match search',
        id: 'shortcut-manager.noResults'
    },
    resetAll: {
        defaultMessage: 'Reset all to defaults',
        description: 'Label for the button that resets every shortcut to its default',
        id: 'shortcut-manager.resetAll'
    }
});

class ShortcutManager extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleSearchChange',
            'handleSaveShortcut',
            'handleResetShortcut',
            'handleResetAll',
            'getConflict'
        ]);

        this.state = {
            searchQuery: ''
        };
    }

    handleSearchChange (e) {
        this.setState({searchQuery: e.target.value});
    }

    handleSaveShortcut (id, key) {
        const defaultKey = this.getDefaultKey(id);
        const nextCustom = {...this.props.customShortcuts};

        if (normalizeKey(key) === normalizeKey(defaultKey)) {
            delete nextCustom[id];
            this.props.onResetShortcut(id);
        } else {
            nextCustom[id] = key;
            this.props.onSetShortcut(id, key);
        }

        updateShortcuts(nextCustom);
    }

    handleResetShortcut (id) {
        const nextCustom = {...this.props.customShortcuts};
        delete nextCustom[id];
        this.props.onResetShortcut(id);
        updateShortcuts(nextCustom);
    }

    handleResetAll () {
        this.props.onResetAllShortcuts();
        updateShortcuts({});
    }

    getDefaultKey (id) {
        const match = getDefaultShortcuts().find(shortcut => shortcut.id === id);
        return match ? match.defaultKey : '';
    }

    getConflict (key, selfId) {
        const normalized = normalizeKey(key);
        const match = this.getAllShortcuts().find(shortcut =>
            shortcut.id !== selfId && normalizeKey(shortcut.key) === normalized
        );
        return match ? match.label : null;
    }

    getAllShortcuts () {
        const defaultShortcuts = getDefaultShortcuts();
        const customShortcuts = this.props.customShortcuts || {};

        return defaultShortcuts.map(shortcut => {
            if (customShortcuts[shortcut.id]) {
                return {
                    ...shortcut,
                    key: customShortcuts[shortcut.id]
                };
            }
            return shortcut;
        });
    }

    getFilteredShortcuts () {
        const allShortcuts = this.getAllShortcuts();
        const {searchQuery} = this.state;

        if (!searchQuery) return allShortcuts;

        const query = searchQuery.toLowerCase();
        return allShortcuts.filter(shortcut =>
            shortcut.label.toLowerCase().includes(query) ||
            shortcut.key.toLowerCase().includes(query) ||
            getCategoryLabel(shortcut.category).toLowerCase().includes(query)
        );
    }

    render () {
        const {searchQuery} = this.state;
        const shortcuts = this.getFilteredShortcuts();
        const hasCustom = Object.keys(this.props.customShortcuts || {}).length > 0;

        const groupedShortcuts = shortcuts.reduce((groups, shortcut) => {
            if (!groups[shortcut.category]) {
                groups[shortcut.category] = [];
            }
            groups[shortcut.category].push(shortcut);
            return groups;
        }, {});

        const hasResults = shortcuts.length > 0;

        return (
            <div className={styles.page}>
                <div className={styles.toolbar}>
                    <div className={styles.searchField}>
                        <Search
                            size={15}
                            className={styles.searchIcon}
                        />
                        <Input
                            type="text"
                            placeholder={this.props.intl.formatMessage(messages.search)}
                            value={searchQuery}
                            onChange={this.handleSearchChange}
                            className={styles.searchInput}
                        />
                    </div>
                    {hasCustom && (
                        <button
                            className={styles.resetAllButton}
                            onClick={this.handleResetAll}
                            type="button"
                        >
                            <RotateCcw size={14} />
                            <FormattedMessage {...messages.resetAll} />
                        </button>
                    )}
                </div>

                <div className={styles.pageBody}>
                    {isMac && (
                        <div className={styles.hint}>
                            <FormattedMessage
                                defaultMessage="On macOS, {cmd} is Command, {opt} is Option and {shift} is Shift."
                                description="Explains what the macOS modifier key symbols mean"
                                id="shortcut-manager.macHint"
                                values={{
                                    cmd: <kbd className={styles.hintKey}>{'⌘'}</kbd>,
                                    opt: <kbd className={styles.hintKey}>{'⌥'}</kbd>,
                                    shift: <kbd className={styles.hintKey}>{'⇧'}</kbd>
                                }}
                            />
                        </div>
                    )}

                    {hasResults ? (
                        Object.entries(groupedShortcuts).map(([categoryId, categoryShortcuts]) => (
                            <ShortcutCategory
                                key={categoryId}
                                category={getCategoryLabel(categoryId)}
                                icon={CATEGORY_ICONS[categoryId] || Keyboard}
                                shortcuts={categoryShortcuts}
                                onSave={this.handleSaveShortcut}
                                onReset={this.handleResetShortcut}
                                getConflict={this.getConflict}
                            />
                        ))
                    ) : (
                        <div className={styles.noResults}>
                            <Search size={28} />
                            <FormattedMessage {...messages.noResults} />
                        </div>
                    )}
                </div>
            </div>
        );
    }
}

ShortcutManager.propTypes = {
    customShortcuts: PropTypes.object,
    onSetShortcut: PropTypes.func.isRequired,
    onResetShortcut: PropTypes.func.isRequired,
    onResetAllShortcuts: PropTypes.func.isRequired,
    intl: PropTypes.shape({
        formatMessage: PropTypes.func
    }).isRequired
};

const mapStateToProps = state => ({
    customShortcuts: state.scratchGui.shortcuts.customShortcuts
});

const mapDispatchToProps = dispatch => ({
    onSetShortcut: (id, key) => dispatch(setShortcut(id, key)),
    onResetShortcut: id => dispatch(resetShortcut(id)),
    onResetAllShortcuts: () => dispatch(resetAllShortcuts())
});

export default injectIntl(connect(
    mapStateToProps,
    mapDispatchToProps
)(ShortcutManager));
