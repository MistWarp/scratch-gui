import PropTypes from 'prop-types';
import React from 'react';

import styles from './shortcut-manager.css';

const formatDisplayKey = key => {
    if (!key) return '';
    return key
        .replace(/Ctrl/g, navigator.platform.includes('Mac') ? '⌘' : 'Ctrl')
        .replace(/Alt/g, navigator.platform.includes('Mac') ? '⌥' : 'Alt')
        .replace(/Shift/g, '⇧')
        .replace(/ /g, '');
};

const ShortcutItem = ({
    shortcut
}) => (
    <div className={styles.shortcutItem}>
        <div className={styles.shortcutInfo}>
            <div className={styles.shortcutLabel}>{shortcut.label}</div>
            <div className={styles.shortcutKey}>
                <span className={styles.keyDisplay}>
                    {formatDisplayKey(shortcut.key)}
                </span>
            </div>
        </div>
    </div>
);

ShortcutItem.propTypes = {
    shortcut: PropTypes.shape({
        id: PropTypes.string,
        key: PropTypes.string,
        defaultKey: PropTypes.string,
        label: PropTypes.string
    }).isRequired
};

export default ShortcutItem;
