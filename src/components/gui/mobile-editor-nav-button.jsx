import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import {FormattedMessage} from 'react-intl';

import styles from './gui.css';

const MobileEditorNavButton = ({icon: Icon, label, message, selected, onClick}) => (
    <button
        type="button"
        className={classNames(styles.mobileEditorNavButton, {
            [styles.mobileEditorNavButtonSelected]: selected
        })}
        role="tab"
        aria-label={label}
        title={label}
        aria-selected={selected}
        onClick={onClick}
    >
        <Icon size={19} />
        <span className={styles.mobileEditorNavLabel}>
            <FormattedMessage {...message} />
        </span>
    </button>
);

MobileEditorNavButton.propTypes = {
    icon: PropTypes.elementType.isRequired,
    label: PropTypes.string.isRequired,
    message: PropTypes.shape({
        id: PropTypes.string.isRequired,
        defaultMessage: PropTypes.string,
        description: PropTypes.string
    }).isRequired,
    selected: PropTypes.bool.isRequired,
    onClick: PropTypes.func.isRequired
};

export default MobileEditorNavButton;
