import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import styles from './backpack-controls.css';

class FilterButton extends React.Component {
    constructor (props) {
        super(props);
        this.handleClick = this.handleClick.bind(this);
    }
    handleClick () {
        this.props.onSelect(this.props.value);
    }
    render () {
        const {active, label} = this.props;
        return (
            <button
                aria-pressed={active}
                className={classNames(styles.filterButton, {
                    [styles.filterActive]: active
                })}
                type="button"
                onClick={this.handleClick}
            >
                {label}
            </button>
        );
    }
}

FilterButton.propTypes = {
    active: PropTypes.bool,
    label: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired,
    onSelect: PropTypes.func.isRequired
};

export default FilterButton;
