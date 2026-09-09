import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
import PropTypes from 'prop-types';
import React, {useEffect, useRef, useState} from 'react';

const videoUrl = url => /\.(?:mp4|webm)(?:[?#].*)?$/i.test(url);

const PostAttachment = ({url, className, onPreviewChange}) => {
    const {text: communityText} = useCommunityText();
    const [kind, setKind] = useState(videoUrl(url) ? 'video' : 'image');
    const [failed, setFailed] = useState(false);
    const previewChange = typeof onPreviewChange === 'function' ? onPreviewChange : null;
    const previewChangeRef = useRef(previewChange);
    previewChangeRef.current = previewChange;
    useEffect(() => {
        if (previewChangeRef.current) previewChangeRef.current();
    }, [failed, kind]);
    if (failed) {
        return (
            <a className={className} href={url} target="_blank" rel="noreferrer">
                {communityText('Open attachment')}
            </a>
        );
    }
    if (kind === 'video') {
        return (
            <video
                className={className}
                src={url}
                controls
                preload="metadata"
                onLoadedMetadata={previewChange}
                onError={() => setFailed(true)}
            />
        );
    }
    return (
        <a className={className} href={url} target="_blank" rel="noreferrer">
            <img
                src={url}
                alt={communityText('Post attachment')}
                loading="lazy"
                onLoad={previewChange}
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
