import PropTypes from 'prop-types';
import React from 'react';
import classNames from 'classnames';

import styles from './close-button.css';
import {useIcon} from '../icon-provider/icons.jsx';

const CloseButton = props => {
    const ArrowLeft = useIcon('ArrowLeft');
    const X = useIcon('X');
    const iconSize = props.size === CloseButton.SIZE_SMALL ? 12 : 20;
    return (
        <div
            aria-label="Close"
            className={classNames(
                styles.closeButton,
                props.className,
                {
                    [styles.small]: props.size === CloseButton.SIZE_SMALL,
                    [styles.large]: props.size === CloseButton.SIZE_LARGE,
                    [styles.orange]: props.color === CloseButton.COLOR_ORANGE
                }
            )}
            role="button"
            tabIndex="0"
            onClick={props.onClick}
        >
            {props.buttonType === 'back' ? (
                ArrowLeft ? (
                    <ArrowLeft size={20} />
                ) : (
                    <span className={styles.closeText}>←</span>
                )
            ) : X ? (
                <X
                    className={classNames(
                        styles.closeIcon,
                        {
                            [styles[props.color]]: (props.color !== CloseButton.COLOR_NEUTRAL)
                        }
                    )}
                    size={iconSize}
                />
            ) : (
                <span className={classNames(styles.closeText, styles.closeIcon, {
                    [styles[props.color]]: (props.color !== CloseButton.COLOR_NEUTRAL)
                })}>✕</span>
            )}
        </div>
    );
};

CloseButton.SIZE_SMALL = 'small';
CloseButton.SIZE_LARGE = 'large';

CloseButton.COLOR_NEUTRAL = 'neutral';
CloseButton.COLOR_GREEN = 'green';
CloseButton.COLOR_ORANGE = 'orange';
// SVG assets replaced by lucide icons; color handled via CSS classes

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
