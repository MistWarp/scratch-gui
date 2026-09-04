import PropTypes from 'prop-types';
import React from 'react';
import classNames from 'classnames';

import styles from './delete-button.module.css';
import deleteIcon from './icon--delete.svg';

const DeleteButton = props => (
    <button
        aria-label="Delete"
        className={classNames(
            styles.deleteButton,
            props.className
        )}
        type="button"
        disabled={props.disabled}
        tabIndex={props.tabIndex}
        onClick={props.onClick}
    >
        <div className={styles.deleteButtonVisible}>
            <img
                className={styles.deleteIcon}
                src={deleteIcon}
                draggable={false}
                alt="Delete"
            />
        </div>
    </button>
);

DeleteButton.propTypes = {
    className: PropTypes.string,
    disabled: PropTypes.bool,
    onClick: PropTypes.func.isRequired,
    tabIndex: PropTypes.number
};

DeleteButton.defaultProps = {
    disabled: false,
    tabIndex: 0
};

export default DeleteButton;
