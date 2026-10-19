import classNames from 'classnames';
import PropTypes from 'prop-types';
import React, {useCallback} from 'react';
import {injectIntl, intlShape} from 'react-intl';
import {connect} from 'react-redux';
import {Blocks as BlocksIcon, Code as CodeIcon} from 'lucide-react';

import {switchToBlocks, switchToCode} from '../../lib/code-mode/mode-switch.js';
import {isBlocksEditorVisible, isCodeMode} from '../../lib/editor-visibility.js';
import {getShortcutKey} from '../../lib/shortcuts/registry.js';
import formatShortcutDisplay from '../../lib/shortcuts/display.js';
import messages from './messages.js';
import styles from './mode-switch.css';

const ModeSwitch = props => {
    const {blocksVisible, className, compact, customShortcuts, dispatch, intl, isCode, onSurface, vm} = props;
    const shortcut = formatShortcutDisplay(getShortcutKey('toggleEditorMode', customShortcuts));
    const handleBlocks = useCallback(() => {
        if (isCode) switchToBlocks({dispatch, vm});
    }, [dispatch, isCode, vm]);
    const handleCode = useCallback(() => {
        if (!isCode) switchToCode({dispatch, vm, blocksVisible});
    }, [blocksVisible, dispatch, isCode, vm]);
    const tooltip = label => (shortcut ? `${label} (${shortcut})` : label);
    const blocksLabel = intl.formatMessage(messages.blocksMode);
    const codeLabel = intl.formatMessage(messages.codeMode);
    return (
        <div
            aria-label={intl.formatMessage(messages.editorMode)}
            className={classNames(styles.modeSwitch, className, {
                [styles.compact]: compact,
                [styles.onSurface]: onSurface
            })}
            role="group"
        >
            <button
                aria-pressed={!isCode}
                className={classNames(styles.modeButton, {[styles.modeButtonActive]: !isCode})}
                title={tooltip(blocksLabel)}
                type="button"
                onClick={handleBlocks}
            >
                <BlocksIcon size={16} />
                <span className={styles.modeLabel}>{blocksLabel}</span>
            </button>
            <button
                aria-pressed={isCode}
                className={classNames(styles.modeButton, {[styles.modeButtonActive]: isCode})}
                title={tooltip(codeLabel)}
                type="button"
                onClick={handleCode}
            >
                <CodeIcon size={16} />
                <span className={styles.modeLabel}>{codeLabel}</span>
            </button>
        </div>
    );
};

ModeSwitch.propTypes = {
    blocksVisible: PropTypes.bool,
    className: PropTypes.string,
    compact: PropTypes.bool,
    customShortcuts: PropTypes.object,
    dispatch: PropTypes.func.isRequired,
    intl: intlShape,
    isCode: PropTypes.bool,
    onSurface: PropTypes.bool,
    vm: PropTypes.object.isRequired
};

const mapStateToProps = state => ({
    blocksVisible: isBlocksEditorVisible(state),
    customShortcuts: state.scratchGui.shortcuts && state.scratchGui.shortcuts.customShortcuts,
    isCode: isCodeMode(state),
    vm: state.scratchGui.vm
});

export default injectIntl(connect(mapStateToProps)(ModeSwitch));
