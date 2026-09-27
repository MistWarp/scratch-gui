/* eslint-disable react/jsx-no-bind */
import classNames from 'classnames';
import PropTypes from 'prop-types';
import React, {useEffect, useLayoutEffect, useRef, useState} from 'react';
import {defineMessages, intlShape} from 'react-intl';
import {Trash2} from 'lucide-react';

import styles from './chat-pane.css';

const messages = defineMessages({
    menu: {
        defaultMessage: 'Message options',
        description: 'Accessible label for the menu that opens when right clicking a chat message',
        id: 'mw.chat.menu'
    },
    reactWith: {
        defaultMessage: 'React with {emoji}',
        description: 'Accessible label for one emoji in the quick reaction row of the chat message menu',
        id: 'mw.chat.menuReactWith'
    },
    deleteTitle: {
        defaultMessage: 'Delete message',
        description: 'Heading of the dialog that confirms deleting a chat message',
        id: 'mw.chat.deleteTitle'
    },
    deleteBody: {
        defaultMessage: 'Are you sure you want to delete this message? This cannot be undone.',
        description: 'Explanation in the dialog that confirms deleting a chat message',
        id: 'mw.chat.deleteBody'
    },
    deleteHint: {
        defaultMessage: 'Hold Shift while clicking delete to skip this next time.',
        description: 'Tip in the dialog that confirms deleting a chat message',
        id: 'mw.chat.deleteHint'
    },
    deleteConfirm: {
        defaultMessage: 'Delete',
        description: 'Button that deletes a chat message after confirming',
        id: 'mw.chat.deleteConfirm'
    },
    deleteCancel: {
        defaultMessage: 'Cancel',
        description: 'Button that closes the delete confirmation without deleting the chat message',
        id: 'mw.chat.deleteCancel'
    }
});

const EDGE = 8;

const focusables = element => Array.from(element.querySelectorAll('[role="menuitem"]:not(:disabled)'));

const MessageMenu = ({intl, items, onClose, onReact, reactions, x, y}) => {
    const ref = useRef(null);
    const [position, setPosition] = useState(null);

    useLayoutEffect(() => {
        const element = ref.current;
        if (!element) return;
        const view = element.ownerDocument.defaultView;
        const origin = element.getBoundingClientRect();
        const width = element.offsetWidth;
        const height = element.offsetHeight;
        const left = Math.max(EDGE, Math.min(x, view.innerWidth - width - EDGE));
        const top = y + height > view.innerHeight - EDGE ? Math.max(EDGE, y - height) : y;
        setPosition({
            left: left - (origin.left - (position ? position.left : 0)),
            top: top - (origin.top - (position ? position.top : 0))
        });
    }, [x, y]);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;
        const first = focusables(element).find(item => !item.dataset.reaction) || focusables(element)[0];
        if (first) first.focus({preventScroll: true});
        const doc = element.ownerDocument;
        const view = doc.defaultView;
        const onPointer = event => {
            if (!element.contains(event.target)) onClose(false);
        };
        const onDismiss = () => onClose(false);
        doc.addEventListener('pointerdown', onPointer, true);
        doc.addEventListener('wheel', onPointer, true);
        view.addEventListener('resize', onDismiss);
        view.addEventListener('blur', onDismiss);
        return () => {
            doc.removeEventListener('pointerdown', onPointer, true);
            doc.removeEventListener('wheel', onPointer, true);
            view.removeEventListener('resize', onDismiss);
            view.removeEventListener('blur', onDismiss);
        };
    }, []);

    const onKeyDown = event => {
        event.stopPropagation();
        const list = focusables(ref.current);
        const index = list.indexOf(ref.current.ownerDocument.activeElement);
        const move = step => {
            event.preventDefault();
            const next = list[(index + step + list.length) % list.length];
            if (next) next.focus();
        };
        if (event.key === 'ArrowDown') move(1);
        else if (event.key === 'ArrowUp') move(index === -1 ? 0 : -1);
        else if (event.key === 'ArrowRight' && list[index] && list[index].dataset.reaction) move(1);
        else if (event.key === 'ArrowLeft' && list[index] && list[index].dataset.reaction) move(-1);
        else if (event.key === 'Home') move(-index);
        else if (event.key === 'End') move(list.length - 1 - index);
        else if (event.key === 'Escape' || event.key === 'Tab') {
            event.preventDefault();
            onClose(true);
        }
    };

    return (
        <div
            ref={ref}
            className={styles.menu}
            role="menu"
            aria-label={intl.formatMessage(messages.menu)}
            style={position ? {left: position.left, top: position.top} : {left: 0, top: 0, visibility: 'hidden'}}
            onKeyDown={onKeyDown}
            onContextMenu={event => event.preventDefault()}
        >
            {reactions && reactions.length ? (
                <div className={styles.menuReactions}>
                    {reactions.map(emoji => (
                        <button
                            key={emoji}
                            type="button"
                            role="menuitem"
                            data-reaction="1"
                            className={styles.menuReaction}
                            aria-label={intl.formatMessage(messages.reactWith, {emoji})}
                            title={intl.formatMessage(messages.reactWith, {emoji})}
                            onClick={() => {
                                onClose(false);
                                onReact(emoji);
                            }}
                        >{emoji}</button>
                    ))}
                </div>
            ) : null}
            {items.map(item => {
                if (item.separator) {
                    return (
                        <div
                            key={item.key}
                            role="separator"
                            className={styles.menuSeparator}
                        />
                    );
                }
                const Icon = item.icon;
                return (
                    <button
                        key={item.key}
                        type="button"
                        role="menuitem"
                        className={classNames(styles.menuItem, {[styles.menuDanger]: item.danger})}
                        onClick={event => {
                            onClose(false);
                            item.onSelect(event);
                        }}
                    >
                        <span className={styles.menuLabel}>{item.label}</span>
                        {item.hint ? <span className={styles.menuHint}>{item.hint}</span> : null}
                        {Icon ? <Icon size={15} /> : null}
                    </button>
                );
            })}
        </div>
    );
};

MessageMenu.propTypes = {
    intl: intlShape.isRequired,
    items: PropTypes.arrayOf(PropTypes.shape({
        key: PropTypes.string.isRequired,
        danger: PropTypes.bool,
        hint: PropTypes.string,
        icon: PropTypes.elementType,
        label: PropTypes.string,
        onSelect: PropTypes.func,
        separator: PropTypes.bool
    })).isRequired,
    onClose: PropTypes.func.isRequired,
    onReact: PropTypes.func,
    reactions: PropTypes.arrayOf(PropTypes.string),
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired
};

const DeleteDialog = ({children, intl, onCancel, onConfirm}) => {
    const confirmRef = useRef(null);
    useEffect(() => {
        if (confirmRef.current) confirmRef.current.focus();
    }, []);
    return (
        <div
            className={styles.dialogBackdrop}
            onPointerDown={event => {
                if (event.target === event.currentTarget) onCancel();
            }}
        >
            <div
                className={styles.dialog}
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="mw-chat-delete-title"
                onKeyDown={event => {
                    event.stopPropagation();
                    if (event.key === 'Escape') {
                        event.preventDefault();
                        onCancel();
                    }
                }}
            >
                <p
                    id="mw-chat-delete-title"
                    className={styles.dialogTitle}
                >
                    <Trash2 size={16} />
                    {intl.formatMessage(messages.deleteTitle)}
                </p>
                <p className={styles.dialogBody}>{intl.formatMessage(messages.deleteBody)}</p>
                <div className={styles.dialogPreview}>{children}</div>
                <p className={styles.dialogHint}>{intl.formatMessage(messages.deleteHint)}</p>
                <div className={styles.dialogActions}>
                    <button
                        type="button"
                        className={styles.textButton}
                        onClick={onCancel}
                    >{intl.formatMessage(messages.deleteCancel)}</button>
                    <button
                        ref={confirmRef}
                        type="button"
                        className={classNames(styles.cardButton, styles.dangerButton)}
                        onClick={onConfirm}
                    >
                        <Trash2 size={14} />
                        {intl.formatMessage(messages.deleteConfirm)}
                    </button>
                </div>
            </div>
        </div>
    );
};

DeleteDialog.propTypes = {
    children: PropTypes.node,
    intl: intlShape.isRequired,
    onCancel: PropTypes.func.isRequired,
    onConfirm: PropTypes.func.isRequired
};

export {DeleteDialog, MessageMenu};
