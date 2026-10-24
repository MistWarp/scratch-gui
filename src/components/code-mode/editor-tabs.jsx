/* eslint-disable react/jsx-no-bind */
import classNames from 'classnames';
import PropTypes from 'prop-types';
import React, {useState} from 'react';
import {injectIntl, intlShape} from 'react-intl';
import {
    AudioWaveform,
    Blocks as BlocksIcon,
    BookOpen,
    FileCode2,
    FileText,
    Image as ImageIcon,
    PanelLeft,
    X
} from 'lucide-react';

import messages from './messages.js';
import styles from './workbench.css';

const KIND_ICONS = {
    script: FileCode2,
    costume: ImageIcon,
    sound: AudioWaveform,
    extension: BlocksIcon,
    reference: BookOpen,
    customAsset: FileText
};

const TAB_DRAG_TYPE = 'application/x-mw-editor-tab';

const hasTabDrag = event => Array.from(event.dataTransfer.types || []).includes(TAB_DRAG_TYPE);

const dropIndex = (list, clientX, rtl) => {
    const items = Array.from(list.children);
    const index = items.findIndex(node => {
        const rect = node.getBoundingClientRect();
        const middle = rect.left + (rect.width / 2);
        return rtl ? clientX > middle : clientX < middle;
    });
    return index === -1 ? items.length : index;
};

const EditorTabs = props => {
    const {activeKey, intl, previewKey, tabs} = props;
    const [dropAt, setDropAt] = useState(null);
    const explorerLabel = intl.formatMessage(messages.toggleExplorer);
    return (
        <div
            className={classNames(styles.tabStrip, {[styles.tabStripUnfocused]: !props.focused})}
            data-floating-stage-avoid="top"
        >
            {props.onToggleExplorer ? (
                <button
                    aria-label={explorerLabel}
                    aria-pressed={props.explorerOpen}
                    className={styles.iconButton}
                    title={props.explorerHint ? `${explorerLabel} (${props.explorerHint})` : explorerLabel}
                    type="button"
                    onClick={props.onToggleExplorer}
                >
                    <PanelLeft size={15} />
                </button>
            ) : null}
            <div
                aria-label={intl.formatMessage(messages.editorTabs)}
                className={styles.tabList}
                role="tablist"
                onDragLeave={event => {
                    if (!event.currentTarget.contains(event.relatedTarget)) setDropAt(null);
                }}
                onDragOver={event => {
                    if (!props.onTabDrop || !hasTabDrag(event)) return;
                    event.preventDefault();
                    event.dataTransfer.dropEffect = 'move';
                    const index = dropIndex(event.currentTarget, event.clientX, props.rtl);
                    if (index !== dropAt) setDropAt(index);
                }}
                onDrop={event => {
                    if (!props.onTabDrop || !hasTabDrag(event)) return;
                    event.preventDefault();
                    setDropAt(null);
                    props.onTabDrop(dropIndex(event.currentTarget, event.clientX, props.rtl));
                }}
            >
                {tabs.map((tab, index) => {
                    const Icon = KIND_ICONS[tab.kind] || FileCode2;
                    const active = tab.key === activeKey;
                    return (
                        <div
                            aria-selected={active}
                            className={classNames(styles.editorTab, {
                                [styles.editorTabActive]: active,
                                [styles.editorTabPreview]: tab.key === previewKey,
                                [styles.editorTabDropBefore]: dropAt === index,
                                [styles.editorTabDropAfter]: dropAt === tabs.length && index === tabs.length - 1
                            })}
                            draggable={Boolean(props.onTabDragStart)}
                            key={tab.key}
                            role="tab"
                            tabIndex={active ? 0 : -1}
                            title={tab.detail ? `${tab.detail}/${tab.title}` : tab.title}
                            onDragEnd={() => {
                                setDropAt(null);
                                if (props.onTabDragEnd) props.onTabDragEnd();
                            }}
                            onDragStart={event => {
                                event.dataTransfer.effectAllowed = 'move';
                                event.dataTransfer.setData(TAB_DRAG_TYPE, tab.key);
                                props.onTabDragStart(tab.key);
                            }}
                            onAuxClick={event => {
                                if (event.button === 1) {
                                    event.preventDefault();
                                    props.onClose(tab.key);
                                }
                            }}
                            onClick={() => props.onActivate(tab.key)}
                            onContextMenu={event => {
                                event.preventDefault();
                                props.onContextMenu(tab.key, event);
                            }}
                            onDoubleClick={() => props.onPin(tab.key)}
                            onKeyDown={event => {
                                if (event.key === 'Enter' || event.key === ' ') {
                                    event.preventDefault();
                                    props.onActivate(tab.key);
                                }
                            }}
                            onMouseDown={event => {
                                if (event.button === 1) event.preventDefault();
                            }}
                        >
                            <Icon size={13} />
                            <span className={styles.editorTabTitle}>{tab.title}</span>
                            {tab.detail ? <span className={styles.editorTabDetail}>{tab.detail}</span> : null}
                            {tab.dirty ? <span className={styles.dirtyDot} /> : null}
                            <button
                                aria-label={intl.formatMessage(messages.close)}
                                className={styles.tabClose}
                                tabIndex={-1}
                                title={intl.formatMessage(messages.close)}
                                type="button"
                                onClick={event => {
                                    event.stopPropagation();
                                    props.onClose(tab.key);
                                }}
                            >
                                <X size={12} />
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

EditorTabs.propTypes = {
    activeKey: PropTypes.string,
    explorerHint: PropTypes.string,
    explorerOpen: PropTypes.bool,
    focused: PropTypes.bool,
    intl: intlShape,
    previewKey: PropTypes.string,
    rtl: PropTypes.bool,
    tabs: PropTypes.arrayOf(PropTypes.shape({
        detail: PropTypes.string,
        dirty: PropTypes.bool,
        key: PropTypes.string.isRequired,
        kind: PropTypes.string.isRequired,
        title: PropTypes.string.isRequired
    })).isRequired,
    onActivate: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
    onContextMenu: PropTypes.func.isRequired,
    onPin: PropTypes.func.isRequired,
    onTabDragEnd: PropTypes.func,
    onTabDragStart: PropTypes.func,
    onTabDrop: PropTypes.func,
    onToggleExplorer: PropTypes.func
};

EditorTabs.defaultProps = {
    focused: true
};

export {TAB_DRAG_TYPE, hasTabDrag};
export default injectIntl(EditorTabs);
