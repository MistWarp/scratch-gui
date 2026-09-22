import PropTypes from 'prop-types';
import React from 'react';
import classNames from 'classnames';
import {ArrowLeft, X} from 'lucide-react';

import styles from './close-button.css';

const iconSize = size => (size === 'small' ? 8 : 16);

const CloseButton = props => (
    <button
        aria-label={props.buttonType === 'back' ? 'Back' : 'Close'}
        className={classNames(
            styles.closeButton,
            props.className,
            {
                [styles.small]: props.size === CloseButton.SIZE_SMALL,
                [styles.large]: props.size === CloseButton.SIZE_LARGE,
                [styles.orange]: props.color === CloseButton.COLOR_ORANGE
            }
        )}
        type="button"
        onClick={props.onClick}
    >
        {props.buttonType === 'back' ? (
            <span className={styles.closeText}><ArrowLeft size={iconSize(props.size)} /></span>
        ) : (
            <span
                className={classNames(styles.closeText, styles.closeIcon, {
                    [styles[props.color]]: (props.color !== CloseButton.COLOR_NEUTRAL)
                })}
            >
                <X
                    size={iconSize(props.size)}
                    strokeWidth={2.5}
                />
            </span>
        )}
    </button>
);

CloseButton.SIZE_SMALL = 'small';
CloseButton.SIZE_LARGE = 'large';

CloseButton.COLOR_NEUTRAL = 'neutral';
CloseButton.COLOR_GREEN = 'green';
CloseButton.COLOR_ORANGE = 'orange';

CloseButton.propTypes = {
    buttonType: PropTypes.oneOf(['back', 'close']),
    className: PropTypes.string,
    color: PropTypes.string,
    onClick: PropTypes.func.isRequired,
    size: PropTypes.oneOf([CloseButton.SIZE_SMALL, CloseButton.SIZE_LARGE])
};

CloseButton.defaultProps = {
    color: CloseButton.COLOR_NEUTRAL,
    size: CloseButton.SIZE_LARGE,
    buttonType: 'close'
};

export default CloseButton;
