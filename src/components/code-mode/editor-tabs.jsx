/* eslint-disable react/jsx-no-bind */
import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import {injectIntl, intlShape} from 'react-intl';
import {
    AudioWaveform,
    Blocks as BlocksIcon,
    FileCode2,
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
    extension: BlocksIcon
};

const EditorTabs = props => {
    const {activeKey, intl, previewKey, tabs} = props;
    const explorerLabel = intl.formatMessage(messages.toggleExplorer);
    return (
        <div className={styles.tabStrip}>
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
            <div
                aria-label={intl.formatMessage(messages.editorTabs)}
                className={styles.tabList}
                role="tablist"
            >
                {tabs.map(tab => {
                    const Icon = KIND_ICONS[tab.kind] || FileCode2;
                    const active = tab.key === activeKey;
                    return (
                        <div
                            aria-selected={active}
                            className={classNames(styles.editorTab, {
                                [styles.editorTabActive]: active,
                                [styles.editorTabPreview]: tab.key === previewKey
                            })}
                            key={tab.key}
                            role="tab"
                            tabIndex={active ? 0 : -1}
                            title={tab.detail ? `${tab.detail}/${tab.title}` : tab.title}
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
    intl: intlShape,
    previewKey: PropTypes.string,
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
    onToggleExplorer: PropTypes.func.isRequired
};

export default injectIntl(EditorTabs);
