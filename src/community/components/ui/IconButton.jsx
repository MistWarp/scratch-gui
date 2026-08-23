import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';

import Button from './Button.jsx';
import styles from './IconButton.module.css';

const IconButton = ({children, className, label, title, ...props}) => (
    <Button
        className={classNames(styles.button, className)}
        aria-label={label}
        title={title || label}
        {...props}
    >
        {children}
    </Button>
);

IconButton.propTypes = {
    children: PropTypes.node.isRequired,
    className: PropTypes.string,
    label: PropTypes.string.isRequired,
    title: PropTypes.string
};

export default IconButton;
