import PropTypes from 'prop-types';
import React from 'react';

import ShortcutItem from './shortcut-item.jsx';

import styles from './shortcut-manager.css';

const ShortcutCategory = ({
    category,
    shortcuts
}) => (
    <div className={styles.category}>
        <h3 className={styles.categoryTitle}>{category}</h3>
        <div className={styles.categoryItems}>
            {shortcuts.map(shortcut => (
                <ShortcutItem
                    key={shortcut.id}
                    shortcut={shortcut}
                />
            ))}
        </div>
    </div>
);

ShortcutCategory.propTypes = {
    category: PropTypes.string.isRequired,
    shortcuts: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string,
        key: PropTypes.string,
        defaultKey: PropTypes.string,
        label: PropTypes.string
    })).isRequired
};

export default ShortcutCategory;
