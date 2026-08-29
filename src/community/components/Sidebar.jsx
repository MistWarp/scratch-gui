import React from 'react';
import styles from './Sidebar.module.css';

// Shared vertical section nav used by My Stuff, Settings and Manage Project.
// sections: [{key, label, icon?, badge?}]
const Sidebar = ({sections, active, onChange, ariaLabel}) => (
    <nav
        className={styles.sidebar}
        aria-label={ariaLabel}
    >
        {sections.map((section, index) => {
            const Icon = section.icon;
            const previousGroup = index > 0 ? sections[index - 1].group : null;
            const showGroup = section.group && section.group !== previousGroup;
            return (
                <React.Fragment key={section.key}>
                    {showGroup ? <div className={styles.groupLabel}>{section.group}</div> : null}
                    <button
                        type="button"
                        className={section.key === active ? styles.active : styles.item}
                        onClick={() => onChange(section.key)}
                        aria-current={section.key === active ? 'page' : null}
                    >
                        {Icon ? <Icon size={18} /> : null}
                        <span>{section.label}</span>
                        {section.badge ? <span className={styles.badge}>{section.badge}</span> : null}
                    </button>
                </React.Fragment>
            );
        })}
    </nav>
);

export default Sidebar;
