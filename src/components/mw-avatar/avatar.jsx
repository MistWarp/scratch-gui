import React, {useState, useEffect, useCallback} from 'react';
import PropTypes from 'prop-types';
import styles from './avatar.css';

const AVATARS = 'https://avatars.rotur.dev';

const overlayStatus = new Map();

const Avatar = ({username, size = 40, className}) => {
    const name = encodeURIComponent((username || '').toLowerCase());
    const [overlayFailed, setOverlayFailed] = useState(() => overlayStatus.get(name) === false);
    useEffect(() => {
        setOverlayFailed(overlayStatus.get(name) === false);
    }, [name]);
    const handleOverlayError = useCallback(() => {
        overlayStatus.set(name, false);
        setOverlayFailed(true);
    }, [name]);
    const handleOverlayLoad = useCallback(() => overlayStatus.set(name, true), [name]);
    const imageSize = Math.max(64, size * 2);
    const imageRadius = Math.max(32, size);
    return (
        <span
            className={className ? `${styles.wrapper} ${className}` : styles.wrapper}
            style={{width: size, height: size}}
        >
            <img
                className={styles.avatar}
                src={`${AVATARS}/${name}?s=${imageSize}&radius=${imageRadius}`}
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
    size: PropTypes.number,
    className: PropTypes.string
};

export default Avatar;
