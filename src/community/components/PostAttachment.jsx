import PropTypes from 'prop-types';
import React, {useEffect, useRef, useState} from 'react';

const videoUrl = url => /\.(?:mp4|webm)(?:[?#].*)?$/i.test(url);

const PostAttachment = ({url, className, onPreviewChange}) => {
    const [kind, setKind] = useState(videoUrl(url) ? 'video' : 'image');
    const [failed, setFailed] = useState(false);
    const previewChangeRef = useRef(onPreviewChange);
    previewChangeRef.current = onPreviewChange;
    useEffect(() => {
        if (previewChangeRef.current) previewChangeRef.current();
    }, [failed, kind]);
    if (failed) {
        return <a className={className} href={url} target="_blank" rel="noreferrer">Open attachment</a>;
    }
    if (kind === 'video') {
        return (
            <video
                className={className}
                src={url}
                controls
                preload="metadata"
                onLoadedMetadata={onPreviewChange}
                onError={() => setFailed(true)}
            />
        );
    }
    return (
        <a className={className} href={url} target="_blank" rel="noreferrer">
            <img
                src={url}
                alt="Post attachment"
                loading="lazy"
                onLoad={onPreviewChange}
                onError={() => setKind('video')}
            />
        </a>
    );
};

PostAttachment.propTypes = {
    url: PropTypes.string.isRequired,
    className: PropTypes.string,
    onPreviewChange: PropTypes.func
};

export default PostAttachment;
