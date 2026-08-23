import React, {useEffect, useState} from 'react';

const fallbackTitle = title => {
    const text = title || '?';
    return text.length > 5 ? `${text.slice(0, 5)}…` : text;
};

const ProjectThumbnail = ({
    project,
    className,
    fallbackClassName,
    lazy = false,
    onError
}) => {
    const [failed, setFailed] = useState(false);
    const thumbUrl = project.thumbUrl;
    useEffect(() => setFailed(false), [thumbUrl]);
    if (!project.thumbUrl || failed) {
        return (
            <span className={fallbackClassName}>
                {fallbackTitle(project.title)}
            </span>
        );
    }
    return (
        <img
            className={className}
            src={project.thumbUrl}
            alt=""
            loading={lazy ? 'lazy' : 'eager'}
            onError={e => {
                setFailed(true);
                if (onError) onError(e);
            }}
        />
    );
};

export {fallbackTitle};
export default ProjectThumbnail;
