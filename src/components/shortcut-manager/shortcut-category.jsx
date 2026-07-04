import PropTypes from 'prop-types';
import React from 'react';

import ShortcutItem from './shortcut-item.jsx';

import styles from './shortcut-manager.css';

const ShortcutCategory = ({
    category,
    icon: Icon,
    shortcuts,
    onSave,
    onReset,
    getConflict
}) => (
    <div className={styles.section}>
        <h3 className={styles.sectionHeader}>
            {Icon && <Icon className={styles.sectionIcon} />}
            <span>{category}</span>
            <div className={styles.sectionDivider} />
        </h3>
        {shortcuts.map(shortcut => (
            <ShortcutItem
                key={shortcut.id}
                shortcut={shortcut}
                onSave={onSave}
                onReset={onReset}
                getConflict={getConflict}
            />
        ))}
    </div>
);

ShortcutCategory.propTypes = {
    category: PropTypes.string.isRequired,
    icon: PropTypes.elementType,
    shortcuts: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string,
        key: PropTypes.string,
        defaultKey: PropTypes.string,
        label: PropTypes.string
    })).isRequired,
    onSave: PropTypes.func.isRequired,
    onReset: PropTypes.func.isRequired,
    getConflict: PropTypes.func.isRequired
};

export default ShortcutCategory;
