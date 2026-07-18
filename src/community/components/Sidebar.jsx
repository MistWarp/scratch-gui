import React from 'react';
import styles from './Sidebar.module.css';

// Shared vertical section nav used by My Stuff, Settings and Manage Project.
// sections: [{key, label, icon?, badge?}]
const Sidebar = ({sections, active, onChange, ariaLabel}) => (
    <nav
        className={styles.sidebar}
        aria-label={ariaLabel}
    >
        {sections.map(section => {
            const Icon = section.icon;
            return (
                <button
                    key={section.key}
                    type="button"
                    className={section.key === active ? styles.active : styles.item}
                    onClick={() => onChange(section.key)}
                    aria-current={section.key === active ? 'page' : null}
                >
                    {Icon ? <Icon size={18} /> : null}
                    <span>{section.label}</span>
                    {section.badge ? <span className={styles.badge}>{section.badge}</span> : null}
                </button>
            );
        })}
    </nav>
);

export default Sidebar;
