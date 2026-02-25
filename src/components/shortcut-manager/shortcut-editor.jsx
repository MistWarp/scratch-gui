import PropTypes from 'prop-types';
import React from 'react';
import classNames from 'classnames';
import bindAll from 'lodash.bindall';
import {Check, X} from 'lucide-react';

import {normalizeKey} from '../../lib/shortcuts/registry.js';

import styles from './shortcut-manager.css';

const keyCodeToDisplayName = {
    ' ': 'Space',
    'escape': 'Escape',
    'enter': 'Enter',
    'tab': 'Tab',
    'backspace': 'Backspace',
    'delete': 'Delete',
    'insert': 'Insert',
    'home': 'Home',
    'end': 'End',
    'pageup': 'Page Up',
    'pagedown': 'Page Down',
    'arrowup': '↑',
    'arrowdown': '↓',
    'arrowleft': '←',
    'arrowright': '→',
    'f1': 'F1',
    'f2': 'F2',
    'f3': 'F3',
    'f4': 'F4',
    'f5': 'F5',
    'f6': 'F6',
    'f7': 'F7',
    'f8': 'F8',
    'f9': 'F9',
    'f10': 'F10',
    'f11': 'F11',
    'f12': 'F12'
};

const formatDisplayKey = key => {
    const displayName = keyCodeToDisplayName[key] || key.toUpperCase();
    
    return displayName
        .replace(/Ctrl/g, navigator.platform.includes('Mac') ? '⌘' : 'Ctrl')
        .replace(/Alt/g, navigator.platform.includes('Mac') ? '⌥' : 'Alt')
        .replace(/Shift/g, '⇧');
};

class ShortcutEditor extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleKeyDown',
            'handleSave',
            'handleCancel',
            'handleClear'
        ]);

        this.state = {
            pressedKeys: [],
            lastKeyDown: null
        };
    }

    componentDidMount () {
        document.addEventListener('keydown', this.handleKeyDown);
        document.addEventListener('keyup', () => {
            this.setState({lastKeyDown: null});
        });
    }

    componentWillUnmount () {
        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('keyup', () => {
            this.setState({lastKeyDown: null});
        });
    }

    handleKeyDown (e) {
        e.preventDefault();
        e.stopPropagation();

        const key = e.key.toLowerCase();
        const ctrlKey = navigator.platform.includes('Mac') ? e.metaKey : e.ctrlKey;
        const altKey = e.altKey;
        const shiftKey = e.shiftKey;

        const pressedKeys = [];
        if (ctrlKey) pressedKeys.push('Ctrl');
        if (altKey) pressedKeys.push('Alt');
        if (shiftKey) pressedKeys.push('Shift');
        
        const keyName = keyCodeToDisplayName[key] || key;
        if (keyName !== 'Control' && keyName !== 'Alt' && keyName !== 'Shift' && keyName !== 'Meta') {
            pressedKeys.push(key);
        }

        if (key === 'enter') {
            this.handleSave();
            return;
        }

        if (key === 'escape') {
            this.handleCancel();
            return;
        }

        if (key === 'backspace' || key === 'delete') {
            this.handleClear();
            return;
        }

        this.setState({
            pressedKeys,
            lastKeyDown: Date.now()
        });
    }

    handleSave () {
        if (this.state.pressedKeys.length > 0) {
            const keyCombo = this.state.pressedKeys.join('+');
            this.props.onSave(keyCombo);
        }
    }

    handleCancel () {
        this.props.onCancel();
    }

    handleClear () {
        this.props.onSave('');
    }

    render () {
        const {pressedKeys, lastKeyDown} = this.state;
        const hasKeys = pressedKeys.length > 0;

        return (
            <div className={styles.shortcutEditor}>
                <div className={styles.editorDisplay}>
                    {hasKeys ? (
                        pressedKeys.map((key, index) => (
                            <span
                                key={index}
                                className={styles.keyPart}
                            >
                                {formatDisplayKey(key)}
                                {index < pressedKeys.length - 1 && <span className={styles.keySeparator}>+</span>}
                            </span>
                        ))
                    ) : (
                        <span className={styles.instruction}>
                            Press a key combination...
                        </span>
                    )}
                </div>

                <div className={styles.editorButtons}>
                    <button
                        onClick={this.handleClear}
                        className={styles.editorButton}
                        disabled={!hasKeys}
                    >
                        Clear
                    </button>
                    <button
                        onClick={this.handleCancel}
                        className={styles.editorButton}
                    >
                        <X size={14} />
                    </button>
                    <button
                        onClick={this.handleSave}
                        className={classNames(styles.editorButton, styles.saveButton)}
                        disabled={!hasKeys}
                    >
                        <Check size={14} />
                    </button>
                </div>

                <div className={styles.editorHint}>
                    {hasKeys ? (
                        lastKeyDown && Date.now() - lastKeyDown > 500 ? (
                            'Press Enter to save or Escape to cancel'
                        ) : null
                    ) : (
                        'Press Backspace or Delete to clear'
                    )}
                </div>
            </div>
        );
    }
}

ShortcutEditor.propTypes = {
    currentKey: PropTypes.string,
    onSave: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired
};

export default ShortcutEditor;
