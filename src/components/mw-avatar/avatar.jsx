import React, {useState, useEffect, useCallback} from 'react';
import PropTypes from 'prop-types';
import {initialsAvatar} from '../../community/classroom.js';
import styles from './avatar.css';

const AVATARS = 'https://avatars.rotur.dev';

const overlayStatus = new Map();

const isStudentName = username => String(username || '').includes('~');

const Avatar = ({username, src, size = 40, className}) => {
    const student = isStudentName(username);
    const name = encodeURIComponent((username || '').toLowerCase());
    const [overlayFailed, setOverlayFailed] = useState(() => student || !name || overlayStatus.get(name) === false);
    useEffect(() => {
        setOverlayFailed(student || !name || overlayStatus.get(name) === false);
    }, [name, student]);
    const handleOverlayError = useCallback(() => {
        overlayStatus.set(name, false);
        setOverlayFailed(true);
    }, [name]);
    const handleOverlayLoad = useCallback(() => overlayStatus.set(name, true), [name]);
    const imageSize = Math.max(64, size * 2);
    const imageRadius = Math.max(32, size);
    const remote = `${AVATARS}/${name}?s=${imageSize}&radius=${imageRadius}`;
    const imageSource = src || (student ? initialsAvatar(String(username).split('~')[0]) : remote);
    return (
        <span
            className={className ? `${styles.wrapper} ${className}` : styles.wrapper}
            style={{width: size, height: size}}
        >
            <img
                className={styles.avatar}
                src={imageSource}
                alt=""
                loading="lazy"
            />
            {overlayFailed ? null : (
                <img
                    className={styles.overlay}
                    src={`${AVATARS}/.overlay/${name}`}
                    alt=""
                    loading="lazy"
                    onError={handleOverlayError}
                    onLoad={handleOverlayLoad}
                />
            )}
        </span>
    );
};

Avatar.propTypes = {
    username: PropTypes.string,
    src: PropTypes.string,
    size: PropTypes.number,
    className: PropTypes.string
};

export default Avatar;
