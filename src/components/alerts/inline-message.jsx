import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import Spinner from '../spinner/spinner.jsx';
import {AlertLevels} from '../../lib/alerts/index.jsx';

import styles from './inline-message.css';

const InlineMessageComponent = ({
    className,
    content,
    iconSpinner,
    level
}) => (
    <div
        aria-atomic="true"
        className={classNames(styles.inlineMessage, styles[level], className)}
        // Save and git progress next to the save button; a failure interrupts.
        role={level === AlertLevels.WARN ? 'alert' : 'status'}
    >
        {/* TODO: implement Rtl handling */}
        {iconSpinner && (
            <Spinner
                small
                className={styles.spinner}
                level={'info'}
            />
        )}
        <span className={styles.content}>{content}</span>
    </div>
);

InlineMessageComponent.propTypes = {
    className: PropTypes.string,
    content: PropTypes.element,
    iconSpinner: PropTypes.bool,
    level: PropTypes.string
};

InlineMessageComponent.defaultProps = {
    level: AlertLevels.INFO
};

export default InlineMessageComponent;
