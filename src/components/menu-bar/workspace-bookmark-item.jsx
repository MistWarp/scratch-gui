/* eslint-disable react/no-multi-comp */
import bindAll from 'lodash.bindall';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import {defineMessages, intlShape} from 'react-intl';
import {Bookmark, Pencil, Trash2} from 'lucide-react';

import {MenuItem} from '../menu/menu.jsx';
import ChevronDown from './ChevronDown.jsx';
import {isMac} from '../../lib/utils/browser';

import styles from './menu-bar.css';

const bookmarkMessages = defineMessages({
    rename: {
        id: 'tw.workspaceBookmarks.rename',
        defaultMessage: 'Rename {name}',
        description: 'Accessible label for the button that renames a workspace bookmark'
    },
    remove: {
        id: 'tw.workspaceBookmarks.remove',
        defaultMessage: 'Delete {name}',
        description: 'Accessible label for the button that deletes a workspace bookmark'
    }
});

// Ctrl+Alt is Control+Option on macOS, not Command+Option.
const bookmarkShortcutHint = key => (isMac ? `⌃⌥${key}` : `Ctrl+Alt+${key}`);

class WorkspaceBookmarkItem extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleDelete',
            'handleRename',
            'handleSwitch'
        ]);
    }
    handleSwitch () {
        this.props.onSwitch(this.props.index);
    }
    handleRename (e) {
        e.stopPropagation();
        this.props.onRename(this.props.index);
    }
    handleDelete (e) {
        e.stopPropagation();
        this.props.onDelete(this.props.index);
    }
    render () {
        const {disabled, index, intl, name} = this.props;
        return (
            <MenuItem
                className={styles.bookmarkItem}
                disabled={disabled}
                onClick={this.handleSwitch}
                shortcut={index < 10 ? bookmarkShortcutHint((index + 1) % 10) : null}
            >
                <Bookmark />
                <span className={styles.bookmarkName}>{name}</span>
                <button
                    type="button"
                    className={styles.bookmarkAction}
                    aria-label={intl.formatMessage(bookmarkMessages.rename, {name})}
                    title={intl.formatMessage(bookmarkMessages.rename, {name})}
                    onClick={this.handleRename}
                >
                    <Pencil size={14} />
                </button>
                <button
                    type="button"
                    className={styles.bookmarkAction}
                    aria-label={intl.formatMessage(bookmarkMessages.remove, {name})}
                    title={intl.formatMessage(bookmarkMessages.remove, {name})}
                    onClick={this.handleDelete}
                >
                    <Trash2 size={14} />
                </button>
            </MenuItem>
        );
    }
}

class WorkspaceBookmarkCategory extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, ['handleToggle']);
    }
    handleToggle () {
        this.props.onToggle(this.props.category);
    }
    render () {
        return (
            <MenuItem
                className={styles.bookmarkCategory}
                onClick={this.handleToggle}
            >
                <ChevronDown
                    className={classNames(styles.bookmarkCategoryCaret, {
                        [styles.bookmarkCategoryCollapsed]: this.props.collapsed
                    })}
                    size={8}
                />
                {this.props.category}
            </MenuItem>
        );
    }
}

WorkspaceBookmarkCategory.propTypes = {
    category: PropTypes.string.isRequired,
    collapsed: PropTypes.bool,
    onToggle: PropTypes.func.isRequired
};

WorkspaceBookmarkItem.propTypes = {
    disabled: PropTypes.bool,
    index: PropTypes.number.isRequired,
    intl: intlShape.isRequired,
    name: PropTypes.string.isRequired,
    onDelete: PropTypes.func.isRequired,
    onRename: PropTypes.func.isRequired,
    onSwitch: PropTypes.func.isRequired
};

export {
    bookmarkShortcutHint,
    WorkspaceBookmarkCategory,
    WorkspaceBookmarkItem
};
