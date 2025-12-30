import classNames from 'classnames';
import {FormattedMessage} from 'react-intl';
import PropTypes from 'prop-types';
import React from 'react';
import Button from '../button/button.jsx';

import {Binoculars} from 'lucide-react';

import styles from './tw-see-inside.css';

const SeeInsideButton = ({
    className,
    onClick
}) => (
    <Button
        className={classNames(
            className,
            styles.seeInsideButton
        )}
        iconClassName={styles.seeInsideButtonIcon}
        iconElem={Binoculars}
        onClick={onClick}
    >
        <FormattedMessage
            defaultMessage="See inside"
            description="Label for see inside button"
            id="tw.menuBar.seeInside"
        />
    </Button>
);

SeeInsideButton.propTypes = {
    className: PropTypes.string,
    onClick: PropTypes.func
};

SeeInsideButton.defaultProps = {
    onClick: () => {}
};

export default SeeInsideButton;
