import PropTypes from 'prop-types';
import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Play} from 'lucide-react';
import {useCommunityIntl as useCommunityText} from '../../i18n.jsx';
import {embedUrl} from '../../api';
import ProjectThumbnail from '../../components/ProjectThumbnail.jsx';
import {useEmbedFetchBridge, useEmbedStorageBridge} from './use-embed-bridges.js';
import styles from '../ProjectCode.module.css';

const SANDBOX = 'allow-scripts allow-forms allow-pointer-lock allow-downloads ' +
    'allow-popups allow-popups-to-escape-sandbox';

const ProjectPreview = ({project}) => {
    const {text: communityText} = useCommunityText();
    const [playing, setPlaying] = useState(false);
    const [ratio, setRatio] = useState(3 / 4);
    const frame = useRef(null);
    const bridged = playing ? project : null;
    useEmbedFetchBridge(bridged, frame);
    useEmbedStorageBridge(bridged, frame);
    const {id, projectJsonUrl, assetsBase} = project;
    const src = useMemo(
        () => (playing ? embedUrl(project, {applyProjectTheme: false, persistStorage: true}) : ''),
        [playing, id, projectJsonUrl, assetsBase]
    );
    useEffect(() => {
        if (!playing) return;
        const onMessage = event => {
            if (!frame.current || event.source !== frame.current.contentWindow) return;
            const data = event.data;
            if (!data || data.type !== 'mw:stage-size') return;
            const width = Number(data.width);
            const height = Number(data.height);
            if (Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0) {
                setRatio(Math.min(2, Math.max(0.25, height / width)));
            }
        };
        window.addEventListener('message', onMessage);
        return () => window.removeEventListener('message', onMessage);
    }, [playing]);
    if (project.hasContent === false || !projectJsonUrl) return null;
    return (
        <section className={styles.preview}>
            <h2>{communityText('Preview')}</h2>
            <div
                className={styles.previewFrame}
                style={{paddingBottom: `calc(${ratio * 100}% + 100px)`}}
            >
                {playing ? (
                    <iframe
                        ref={frame}
                        className={styles.previewStage}
                        src={src}
                        title={project.title}
                        allow="autoplay; fullscreen"
                        sandbox={SANDBOX}
                    />
                ) : (
                    <button
                        type="button"
                        className={styles.previewStart}
                        aria-label={communityText('Play {value1}', {value1: project.title})}
                        onClick={() => setPlaying(true)}
                    >
                        <ProjectThumbnail
                            project={project}
                            className={styles.previewThumb}
                            fallbackClassName={styles.previewThumb}
                        />
                        <span className={styles.previewPlay}><Play size={20} /></span>
                    </button>
                )}
            </div>
        </section>
    );
};

ProjectPreview.propTypes = {
    project: PropTypes.shape({
        assetsBase: PropTypes.string,
        hasContent: PropTypes.bool,
        id: PropTypes.string,
        projectJsonUrl: PropTypes.string,
        thumbUrl: PropTypes.string,
        title: PropTypes.string
    }).isRequired
};

export default ProjectPreview;
