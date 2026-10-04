import PropTypes from 'prop-types';
import React from 'react';
import classNames from 'classnames';
import {ArrowLeft, X} from 'lucide-react';
import {defineMessages, injectIntl, intlShape} from 'react-intl';

import styles from './close-button.css';

const messages = defineMessages({
    back: {
        defaultMessage: 'Back',
        description: 'Accessible label of the arrow button that goes back',
        id: 'mw.closeButton.back'
    },
    close: {
        defaultMessage: 'Close',
        description: 'Accessible label of the X button that closes a window or message',
        id: 'mw.closeButton.close'
    }
});

const iconSize = size => (size === 'small' ? 8 : 16);

const CloseButton = props => (
    <button
        aria-label={props.intl.formatMessage(props.buttonType === 'back' ? messages.back : messages.close)}
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
    intl: intlShape.isRequired,
    onClick: PropTypes.func.isRequired,
    size: PropTypes.oneOf([CloseButton.SIZE_SMALL, CloseButton.SIZE_LARGE])
};

CloseButton.defaultProps = {
    color: CloseButton.COLOR_NEUTRAL,
    size: CloseButton.SIZE_LARGE,
    buttonType: 'close'
};

const IntlCloseButton = injectIntl(CloseButton);
// Keep the size and colour constants reachable through the wrapped component.
Object.assign(IntlCloseButton, {
    SIZE_SMALL: CloseButton.SIZE_SMALL,
    SIZE_LARGE: CloseButton.SIZE_LARGE,
    COLOR_NEUTRAL: CloseButton.COLOR_NEUTRAL,
    COLOR_GREEN: CloseButton.COLOR_GREEN,
    COLOR_ORANGE: CloseButton.COLOR_ORANGE
});

export {CloseButton as CloseButtonComponent};

export default IntlCloseButton;
