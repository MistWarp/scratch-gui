import React from 'react';
import PropTypes from 'prop-types';
import styles from './checkbox.module.css';
import classNames from 'classnames';

const FancyCheckbox = props => (
    <input
        {...props}
        type="checkbox"
        className={classNames(props.className, styles.checkbox)}
    />
);

FancyCheckbox.propTypes = {
    className: PropTypes.string
};

export default FancyCheckbox;
