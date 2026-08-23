import React, {useEffect, useRef, useState} from 'react';
import {ExternalLink, Heart, Play} from 'lucide-react';
import {Link} from 'react-router-dom';
import api, {embedUrl, projectUrl} from '../api';
import Avatar from './Avatar.jsx';
import ProjectThumbnail from './ProjectThumbnail.jsx';
import styles from './FeaturedProject.module.css';

const FeaturedProject = ({project}) => {
    const [details, setDetails] = useState(null);
    const [stageRatio, setStageRatio] = useState(0.75);
    const stageFrame = useRef(null);

    useEffect(() => {
        let active = true;
        setDetails(null);
        setStageRatio(0.75);
        api.getProject(project.id)
            .then(data => active && setDetails(data.project))
            .catch(() => active && setDetails(project));
        return () => {
            active = false;
        };
    }, [project]);

    useEffect(() => {
        const onMessage = event => {
            if (!stageFrame.current || event.source !== stageFrame.current.contentWindow) return;
            const data = event.data;
            if (!data || data.type !== 'mw:stage-size' || !(data.width > 0) || !(data.height > 0)) return;
            setStageRatio(data.height / data.width);
        };
        window.addEventListener('message', onMessage);
        return () => window.removeEventListener('message', onMessage);
    }, []);

    const displayProject = details || project;
    const canEmbed = Boolean(
        details && details.hasContent !== false && !details.locked && details.projectJsonUrl && details.assetsBase
    );

    return (
        <article className={styles.preview}>
            <div className={styles.topBar}>
                <Link to={`/users/${displayProject.owner}`}>
                    <Avatar username={displayProject.owner} size={38} />
                </Link>
                <div className={styles.identity}>
                    <Link to={projectUrl(displayProject.id)} className={styles.title}>
                        {displayProject.title}
                    </Link>
                    <Link to={`/users/${displayProject.owner}`} className={styles.owner}>
                        by {displayProject.owner}
                    </Link>
                </div>
                <Link to={projectUrl(displayProject.id)} className={styles.openProject}>
                    <ExternalLink size={14} />
                    Project page
                </Link>
            </div>
            <div
                className={styles.stageWrap}
                style={{paddingBottom: `calc(${stageRatio * 100}% + 52px)`}}
            >
                {canEmbed ? (
                    <iframe
                        ref={stageFrame}
                        className={styles.stage}
                        src={embedUrl(details, {bridge: false, profilePreview: true})}
                        title={displayProject.title}
                        allow="autoplay; fullscreen"
                        allowFullScreen
                        sandbox={'allow-scripts allow-same-origin allow-forms allow-pointer-lock allow-downloads ' +
                            'allow-popups allow-popups-to-escape-sandbox'}
                    />
                ) : (
                    <Link to={projectUrl(displayProject.id)} className={styles.thumbnail}>
                        <ProjectThumbnail
                            project={displayProject}
                            fallbackClassName={styles.thumbnailFallback}
                            lazy
                        />
                    </Link>
                )}
            </div>
            <div className={styles.footer}>
                <div className={styles.stats}>
                    <span><Heart size={14} />{displayProject.loveCount || 0}</span>
                    <span><Play size={14} />{displayProject.views || 0}</span>
                </div>
                {displayProject.description ? (
                    <p className={styles.description}>{displayProject.description}</p>
                ) : null}
            </div>
        </article>
    );
};

export default FeaturedProject;
