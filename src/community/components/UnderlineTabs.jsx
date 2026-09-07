import PropTypes from 'prop-types';
import React from 'react';

import SectionTabs from './SectionTabs.jsx';
import styles from './UnderlineTabs.module.css';

// Shared underline tabs: transparent buttons over a 1px rule, active tab
// marked with a 2px accent underline. Same look as ExploreNav, but for
// <button> tablists (ExploreNav styles target links and don't reset button
// defaults, so they render unstyled gray buttons when reused here).
// Counts render as pills via a plain <b> in the label:
//   {key: 'projects', label: <>Projects <b>{count}</b></>}
const UnderlineTabs = ({items, value, onChange, ariaLabel, className}) => (
    <SectionTabs
        items={items}
        value={value}
        onChange={onChange}
        className={[styles.tabs, className].filter(Boolean).join(' ')}
        itemClassName={styles.tab}
        activeClassName={styles.tabActive}
        ariaLabel={ariaLabel}
    />
);

UnderlineTabs.propTypes = {
    items: PropTypes.arrayOf(PropTypes.shape({
        key: PropTypes.string.isRequired,
        label: PropTypes.node.isRequired
    })).isRequired,
    value: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    ariaLabel: PropTypes.string.isRequired,
    className: PropTypes.string
};

UnderlineTabs.defaultProps = {
    className: ''
};

export default UnderlineTabs;
