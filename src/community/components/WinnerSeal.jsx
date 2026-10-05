import React from 'react';
import classNames from 'classnames';
import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
import styles from './WinnerSeal.module.css';

// A first-place award seal, pinned to the corner of a winning entry's art.
const WinnerSeal = ({className, small = false}) => {
    const {text: communityText} = useCommunityText();
    return (
        <span
            className={classNames(small ? styles.sealSmall : styles.seal, className)}
            role="img"
            aria-label={communityText('First place')}
        >
            <span aria-hidden="true">{communityText('1st')}</span>
        </span>
    );
};

export default WinnerSeal;
