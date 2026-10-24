/* eslint-disable react/jsx-no-bind */
import classNames from 'classnames';
import PropTypes from 'prop-types';
import React, {useEffect, useRef, useState} from 'react';
import ReactDOM from 'react-dom';
import {injectIntl, intlShape} from 'react-intl';
import {Check, CheckCheck, Play, Square} from 'lucide-react';

import CodeEditor from '../extension-dev/code-editor.jsx';
import DiffView from './diff-view.jsx';
import messages from './messages.js';
import styles from './workbench.css';

const MorePopover = ({anchor, items, onClose}) => {
    const ref = useRef(null);
    const [position, setPosition] = useState(null);
    useEffect(() => {
        const rect = anchor.getBoundingClientRect();
        const node = ref.current;
        const width = node ? node.offsetWidth : 280;
        const height = node ? node.offsetHeight : 120;
        const left = Math.min(Math.max(8, rect.left), window.innerWidth - width - 8);
        const below = rect.bottom + 4;
        const top = below + height > window.innerHeight ? Math.max(8, rect.top - height - 4) : below;
        setPosition({left, top});
        const close = event => {
            if (node && !node.contains(event.target) && !anchor.contains(event.target)) onClose();
        };
        const key = event => {
            if (event.key === 'Escape') onClose();
        };
        document.addEventListener('pointerdown', close, true);
        document.addEventListener('keydown', key, true);
        return () => {
            document.removeEventListener('pointerdown', close, true);
            document.removeEventListener('keydown', key, true);
        };
    }, [anchor]);
    return ReactDOM.createPortal(
        <div
            className={styles.morePopover}
            ref={ref}
            role="dialog"
            style={position ? {left: `${position.left}px`, top: `${position.top}px`} : {visibility: 'hidden'}}
        >
            {items.map(item => {
                const Icon = item.icon;
                return (
                    <div
                        className={classNames(styles.moreItem, {[styles.messageError]: item.error})}
                        key={item.key}
                    >
                        {Icon ? <Icon size={13} /> : null}
                        <span className={styles.moreText}>{item.text}</span>
                        {item.action ? (
                            <button
                                className={styles.slotAction}
                                type="button"
                                onClick={() => {
                                    onClose();
                                    item.action.onClick();
                                }}
                            >
                                {item.action.label}
                            </button>
                        ) : null}
                    </div>
                );
            })}
        </div>,
        document.body
    );
};

MorePopover.propTypes = {
    anchor: PropTypes.object.isRequired,
    items: PropTypes.arrayOf(PropTypes.object).isRequired,
    onClose: PropTypes.func.isRequired
};

const MessageSlot = ({intl, items}) => {
    const [moreAnchor, setMoreAnchor] = useState(null);
    const first = items[0] || null;
    if (!first) return <div className={styles.messageSlot} />;
    const Icon = first.icon;
    const ActionIcon = first.action && first.action.icon;
    return (
        <div
            className={classNames(styles.messageSlot, {[styles.messageError]: first.error})}
            title={first.tooltip || first.text}
        >
            {Icon ? <Icon size={13} /> : null}
            <span className={styles.messageText}>{first.text}</span>
            {first.action ? (
                <button
                    className={styles.slotAction}
                    type="button"
                    onClick={() => first.action.onClick()}
                >
                    {ActionIcon ? <ActionIcon size={13} /> : null}
                    <span>{first.action.label}</span>
                </button>
            ) : null}
            {items.length > 1 ? (
                <button
                    aria-expanded={Boolean(moreAnchor)}
                    className={styles.slotMore}
                    type="button"
                    onClick={event => setMoreAnchor(moreAnchor ? null : event.currentTarget)}
                >
                    {intl.formatMessage(messages.moreMessages, {count: items.length - 1})}
                </button>
            ) : null}
            {moreAnchor ? (
                <MorePopover
                    anchor={moreAnchor}
                    items={items.slice(1)}
                    onClose={() => setMoreAnchor(null)}
                />
            ) : null}
        </div>
    );
};

MessageSlot.propTypes = {
    intl: intlShape,
    items: PropTypes.arrayOf(PropTypes.shape({
        action: PropTypes.object,
        error: PropTypes.bool,
        icon: PropTypes.elementType,
        key: PropTypes.string.isRequired,
        text: PropTypes.string.isRequired,
        tooltip: PropTypes.string
    })).isRequired
};

const TextTab = props => {
    const {applyAllHint, applyHint, intl, overlay} = props;
    const applyLabel = intl.formatMessage(messages.apply);
    const applyAllLabel = intl.formatMessage(messages.applyAll);
    const runAllLabel = intl.formatMessage(messages.runAll);
    const stopLabel = intl.formatMessage(messages.stop);
    return (
        <div
            className={styles.textTab}
            data-mw-region="text"
            data-mw-text-tab="true"
            ref={props.containerRef}
        >
            <div
                className={styles.headerStrip}
                data-floating-stage-avoid="top"
            >
                <MessageSlot
                    intl={intl}
                    items={props.messages}
                />
                <div className={styles.buttonGroup}>
                    <button
                        aria-label={applyLabel}
                        className={styles.stripButton}
                        disabled={props.applyDisabled}
                        title={applyHint ? `${applyLabel} (${applyHint})` : applyLabel}
                        type="button"
                        onClick={props.onApply}
                    >
                        <Check size={14} />
                        <span>{applyLabel}</span>
                    </button>
                    {props.onApplyAll ? (
                        <button
                            aria-label={applyAllLabel}
                            className={styles.stripButton}
                            disabled={props.applyAllDisabled}
                            title={applyAllHint ? `${applyAllLabel} (${applyAllHint})` : applyAllLabel}
                            type="button"
                            onClick={props.onApplyAll}
                        >
                            <CheckCheck size={14} />
                            <span>{applyAllLabel}</span>
                        </button>
                    ) : null}
                    {props.onRunAll ? (
                        <button
                            aria-label={runAllLabel}
                            className={styles.stripButton}
                            title={runAllLabel}
                            type="button"
                            onClick={props.onRunAll}
                        >
                            <Play size={14} />
                            <span>{runAllLabel}</span>
                        </button>
                    ) : null}
                    {props.onStop ? (
                        <button
                            aria-label={stopLabel}
                            className={styles.stripButton}
                            title={stopLabel}
                            type="button"
                            onClick={props.onStop}
                        >
                            <Square size={13} />
                            <span>{stopLabel}</span>
                        </button>
                    ) : null}
                </div>
            </div>
            <div
                className={styles.textBody}
                onContextMenu={props.onContextMenu}
            >
                {overlay ? (
                    <DiffView {...overlay} />
                ) : (
                    <CodeEditor
                        quietSync
                        completion={props.completion}
                        dark={props.dark}
                        diagnostics={props.diagnostics}
                        documentKey={props.tabKey}
                        editable={!props.readOnly}
                        extensions={props.extensions}
                        focus={props.focus}
                        keymap={props.keymap}
                        language={props.language}
                        readOnly={props.readOnly}
                        stateKey={props.tabKey}
                        value={props.value}
                        onChange={props.onChange}
                        onReady={props.onReady}
                    />
                )}
            </div>
        </div>
    );
};

TextTab.propTypes = {
    applyAllDisabled: PropTypes.bool,
    applyAllHint: PropTypes.string,
    applyDisabled: PropTypes.bool,
    applyHint: PropTypes.string,
    completion: PropTypes.func,
    containerRef: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
    dark: PropTypes.bool,
    diagnostics: PropTypes.arrayOf(PropTypes.object),
    extensions: PropTypes.array,
    focus: PropTypes.object,
    intl: intlShape,
    keymap: PropTypes.arrayOf(PropTypes.object),
    language: PropTypes.string,
    messages: PropTypes.arrayOf(PropTypes.object).isRequired,
    overlay: PropTypes.object,
    readOnly: PropTypes.bool,
    tabKey: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired,
    onApply: PropTypes.func,
    onApplyAll: PropTypes.func,
    onChange: PropTypes.func,
    onContextMenu: PropTypes.func,
    onReady: PropTypes.func,
    onRunAll: PropTypes.func,
    onStop: PropTypes.func
};

TextTab.defaultProps = {
    diagnostics: [],
    language: 'fractch'
};

export default injectIntl(TextTab);
