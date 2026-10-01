import React from 'react';
import PropTypes from 'prop-types';
import bindAll from 'lodash.bindall';
import classNames from 'classnames';
import {FormattedMessage, defineMessages, injectIntl, intlShape} from 'react-intl';
import {ContextMenuTrigger} from 'react-contextmenu';

import {DangerousMenuItem, ContextMenu, MenuItem} from '../context-menu/context-menu.jsx';
import DeleteButton from '../delete-button/delete-button.jsx';
import {isUnnamedScript} from '../../lib/backpack/script-name.js';
import styles from './backpack-item.css';

let contextMenuId = 0;

const messages = defineMessages({
    costume: {
        id: 'gui.backpack.costumeLabel',
        defaultMessage: 'costume',
        description: 'Label for costume backpack item'
    },
    sound: {
        id: 'gui.backpack.soundLabel',
        defaultMessage: 'sound',
        description: 'Label for sound backpack item'
    },
    script: {
        id: 'gui.backpack.scriptLabel',
        defaultMessage: 'script',
        description: 'Label for script backpack item'
    },
    sprite: {
        id: 'gui.backpack.spriteLabel',
        defaultMessage: 'sprite',
        description: 'Label for sprite backpack item'
    },
    unnamedScript: {
        id: 'mw.backpack.unnamedScript',
        defaultMessage: 'Script',
        description: 'Name shown for older backpack scripts that were saved without a name'
    },
    itemLabel: {
        id: 'mw.backpack.itemLabel',
        defaultMessage: '{name}, {type}. Press Enter to add it to the current sprite.',
        description: 'Accessible label for a backpack item'
    },
    deleteItem: {
        id: 'mw.backpack.deleteItem',
        defaultMessage: 'Delete {name}',
        description: 'Accessible label for the delete button on a backpack item'
    },
    renameField: {
        id: 'mw.backpack.renameField',
        defaultMessage: 'New name for {name}',
        description: 'Accessible label for the inline rename field on a backpack item'
    }
});

const DOUBLE_CLICK_DELAY = 250;

const getDisplayName = (item, intl) => {
    if (isUnnamedScript(item)) return intl.formatMessage(messages.unnamedScript);
    return item.name || intl.formatMessage(messages[item.type] || messages.unnamedScript);
};

const stopEvent = e => e.stopPropagation();

class BackpackItem extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleTileClick',
            'handleNameClick',
            'handleNameDoubleClick',
            'handleKeyDown',
            'handleInputChange',
            'handleInputKeyDown',
            'handleInputBlur',
            'handleDeleteClick',
            'handleInsertMenu',
            'handleRenameMenu',
            'handleDeleteMenu',
            'setInputRef'
        ]);
        this.menuId = `backpack-item-${contextMenuId++}`;
        this.input = null;
        this.clickTimer = null;
        this.submitted = false;
        this.state = {draft: ''};
    }
    componentDidMount () {
        if (this.props.renaming) this.beginRename();
    }
    componentDidUpdate (prevProps) {
        if (this.props.renaming && !prevProps.renaming) this.beginRename();
    }
    componentWillUnmount () {
        clearTimeout(this.clickTimer);
    }
    getName () {
        return getDisplayName(this.props.item, this.props.intl);
    }
    beginRename () {
        this.submitted = false;
        this.setState({draft: this.getName()}, () => {
            if (this.input) {
                this.input.focus();
                this.input.select();
            }
        });
    }
    insert () {
        this.props.onClick(this.props.item.id);
    }
    setInputRef (element) {
        this.input = element;
    }
    handleTileClick (e) {
        if (e.detail > 1 || this.props.renaming) return;
        this.insert();
    }
    handleNameClick (e) {
        e.stopPropagation();
        if (this.props.renaming) return;
        if (!this.props.canRename) {
            this.insert();
            return;
        }
        clearTimeout(this.clickTimer);
        if (e.detail === 1) {
            this.clickTimer = setTimeout(() => this.insert(), DOUBLE_CLICK_DELAY);
        }
    }
    handleNameDoubleClick (e) {
        e.stopPropagation();
        clearTimeout(this.clickTimer);
        if (this.props.canRename && !this.props.renaming) {
            this.props.onRenameStart(this.props.item.id);
        }
    }
    handleKeyDown (e) {
        if (this.props.renaming) return;
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this.insert();
        } else if (e.key === 'F2' && this.props.canRename) {
            e.preventDefault();
            this.props.onRenameStart(this.props.item.id);
        } else if (e.key === 'Delete') {
            e.preventDefault();
            this.props.onDelete(this.props.item.id);
        }
    }
    submitDraft () {
        if (this.submitted) return;
        this.submitted = true;
        this.props.onRenameSubmit(this.props.item.id, this.state.draft);
    }
    handleInputChange (e) {
        this.setState({draft: e.target.value});
    }
    handleInputKeyDown (e) {
        e.stopPropagation();
        if (e.key === 'Enter') {
            e.preventDefault();
            this.submitDraft();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            this.submitted = true;
            this.props.onRenameCancel();
        }
    }
    handleInputBlur () {
        this.submitDraft();
    }
    handleDeleteClick (e) {
        e.stopPropagation();
        this.props.onDelete(this.props.item.id);
    }
    handleInsertMenu (e) {
        if (e && e.stopPropagation) e.stopPropagation();
        this.insert();
    }
    handleRenameMenu (e) {
        if (e && e.stopPropagation) e.stopPropagation();
        this.props.onRenameStart(this.props.item.id);
    }
    handleDeleteMenu (e) {
        if (e && e.stopPropagation) e.stopPropagation();
        this.props.onDelete(this.props.item.id);
    }
    render () {
        const {
            busy,
            canRename,
            className,
            componentRef,
            intl,
            item,
            preventContextMenu,
            renaming,
            onMouseDown
        } = this.props;
        const name = this.getName();
        const typeLabel = intl.formatMessage(messages[item.type] || messages.script);

        return (
            <div
                className={classNames(className, styles.item, {
                    [styles.busy]: busy,
                    [styles.renaming]: renaming
                })}
            >
                <ContextMenuTrigger
                    attributes={{
                        'className': styles.tile,
                        'role': 'button',
                        'tabIndex': 0,
                        'aria-busy': busy,
                        'aria-label': intl.formatMessage(messages.itemLabel, {name, type: typeLabel}),
                        'onClick': this.handleTileClick,
                        'onKeyDown': this.handleKeyDown,
                        'onMouseDown': onMouseDown,
                        'onTouchStart': onMouseDown
                    }}
                    disable={preventContextMenu}
                    id={this.menuId}
                    ref={componentRef}
                    renderTag="div"
                >
                    <div className={styles.thumbnail}>
                        {item.thumbnailUrl ? (
                            <img
                                alt=""
                                className={styles.image}
                                draggable={false}
                                loading="lazy"
                                src={item.thumbnailUrl}
                            />
                        ) : null}
                    </div>
                    <div className={styles.info}>
                        {renaming ? (
                            <input
                                aria-label={intl.formatMessage(messages.renameField, {name})}
                                className={styles.renameInput}
                                maxLength={100}
                                ref={this.setInputRef}
                                type="text"
                                value={this.state.draft}
                                onBlur={this.handleInputBlur}
                                onChange={this.handleInputChange}
                                onClick={stopEvent}
                                onKeyDown={this.handleInputKeyDown}
                                onMouseDown={stopEvent}
                                onTouchStart={stopEvent}
                            />
                        ) : (
                            <div
                                className={styles.name}
                                title={name}
                                onClick={this.handleNameClick}
                                onDoubleClick={this.handleNameDoubleClick}
                            >
                                {name}
                            </div>
                        )}
                        <div className={styles.type}>{typeLabel}</div>
                    </div>
                </ContextMenuTrigger>
                <div
                    className={styles.deleteButtonWrapper}
                    title={intl.formatMessage(messages.deleteItem, {name})}
                    onMouseDown={stopEvent}
                >
                    <DeleteButton
                        className={styles.deleteButton}
                        onClick={this.handleDeleteClick}
                    />
                </div>
                <ContextMenu id={this.menuId}>
                    <MenuItem
                        icon="insert"
                        onClick={this.handleInsertMenu}
                    >
                        <FormattedMessage
                            defaultMessage="Add to current sprite"
                            description="Context menu item that adds a backpack item to the sprite being edited"
                            id="mw.backpack.contextInsert"
                        />
                    </MenuItem>
                    {canRename ? (
                        <MenuItem
                            icon="rename"
                            onClick={this.handleRenameMenu}
                        >
                            <FormattedMessage
                                defaultMessage="Rename"
                                description="Context menu item that renames a backpack item"
                                id="mw.backpack.contextRename"
                            />
                        </MenuItem>
                    ) : null}
                    <DangerousMenuItem
                        icon="delete"
                        onClick={this.handleDeleteMenu}
                    >
                        <FormattedMessage
                            defaultMessage="Delete"
                            description="Context menu item that deletes a backpack item"
                            id="mw.backpack.contextDelete"
                        />
                    </DangerousMenuItem>
                </ContextMenu>
            </div>
        );
    }
}

BackpackItem.propTypes = {
    busy: PropTypes.bool,
    canRename: PropTypes.bool,
    className: PropTypes.string,
    componentRef: PropTypes.func,
    intl: intlShape,
    item: PropTypes.shape({
        id: PropTypes.string,
        name: PropTypes.string,
        thumbnailUrl: PropTypes.string,
        type: PropTypes.string
    }).isRequired,
    preventContextMenu: PropTypes.bool,
    renaming: PropTypes.bool,
    onClick: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
    onMouseDown: PropTypes.func,
    onRenameCancel: PropTypes.func.isRequired,
    onRenameStart: PropTypes.func.isRequired,
    onRenameSubmit: PropTypes.func.isRequired
};

BackpackItem.defaultProps = {
    busy: false,
    canRename: false,
    preventContextMenu: false,
    renaming: false
};

export {getDisplayName};
export default injectIntl(BackpackItem);
