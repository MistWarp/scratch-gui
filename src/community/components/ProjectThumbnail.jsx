import React, {useState} from 'react';

const ProjectThumbnail = ({
    project,
    className,
    fallbackClassName,
    lazy = false,
    onError
}) => {
    const [failed, setFailed] = useState(false);
    if (!project.thumbUrl || failed) {
        return (
            <span className={fallbackClassName}>
                {(project.title || '?').slice(0, 5)}...
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

export default ProjectThumbnail;
