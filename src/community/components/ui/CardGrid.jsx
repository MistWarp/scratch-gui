import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';

import styles from './CardGrid.module.css';

const CardGrid = ({as: Component, children, className, min, ...props}) => (
    <Component
        className={classNames(styles.grid, className)}
        style={min ? {'--card-min': `${min}px`} : null}
        {...props}
    >
        {children}
    </Component>
);

CardGrid.propTypes = {
    as: PropTypes.elementType,
    children: PropTypes.node,
    className: PropTypes.string,
    min: PropTypes.number
};

CardGrid.defaultProps = {
    as: 'div'
};

export default CardGrid;
