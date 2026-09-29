import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import {Image as ImageIcon} from 'lucide-react';

import {PICTURE_ICONS, pictureLabel} from '../../classroom.js';
import {useCommunityIntl} from '../../i18n.jsx';
import styles from './PictureIcon.module.css';

const PictureIcon = ({className, name, size}) => {
    const {text: communityText} = useCommunityIntl();
    const Icon = PICTURE_ICONS[name] || ImageIcon;
    return (
        <span
            className={classNames(styles.picture, className)}
            role="img"
            aria-label={communityText(pictureLabel(name))}
            style={{width: size, height: size}}
        >
            <Icon size={Math.round(size * 0.58)} strokeWidth={1.75} aria-hidden="true" />
        </span>
    );
};

PictureIcon.propTypes = {
    className: PropTypes.string,
    name: PropTypes.string.isRequired,
    size: PropTypes.number
};

PictureIcon.defaultProps = {
    size: 40
};

export default PictureIcon;
