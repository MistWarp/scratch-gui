import PropTypes from 'prop-types';
import React from 'react';

import styles from './settings-modal.css';

const Header = ({children}) => (
    <div className={styles.header}>
        {children}
        <div className={styles.divider} />
    </div>
);
Header.propTypes = {
    children: PropTypes.node
};

export default Header;
