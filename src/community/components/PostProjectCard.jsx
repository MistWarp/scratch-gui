import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import React, {useEffect, useState} from 'react';
import {Link, useInRouterContext} from 'react-router-dom';
import {Gamepad2, Heart, Play} from 'lucide-react';
import {projectUrl} from '../api.js';
import loadProjectPreview from '../project-preview.js';
import ProjectThumbnail from './ProjectThumbnail.jsx';
import styles from './PostProjectCard.module.css';

const SITE = 'https://mistwarp.org';

const PostProjectCard = ({project: ref, compact, thumbOnly, onLayoutChange}) => {
    const {text: communityText} = useCommunityText();
    const inRouter = useInRouterContext();
    const [state, setState] = useState({status: 'loading', project: null});
    useEffect(() => {
        let active = true;
        setState({status: 'loading', project: null});
        loadProjectPreview(ref).then(project => {
            if (!active) return;
            setState({status: project ? 'ready' : 'missing', project});
        });
        return () => {
            active = false;
        };
    }, [ref.id, ref.slug]);
    useEffect(() => {
        if (state.status !== 'loading' && onLayoutChange) onLayoutChange();
    }, [state.status]);

    const project = state.project;
    const title = (project && project.title) || ref.title || '';
    if (state.status === 'missing' && !title) return null;
    const route = project ? projectUrl(project) : (ref.id ? projectUrl(ref.id) : `/p/${ref.slug}`);
    const loading = state.status === 'loading' && !title;
    const thumbnail = {title, thumbUrl: (project && project.thumbUrl) || ref.image || ''};
    const className = classNames(thumbOnly ? styles.thumbOnly : styles.card, {
        [styles.compact]: compact,
        [styles.loading]: loading
    });
    const linkProps = thumbOnly ? {title, 'aria-label': title || communityText('MistWarp project')} : {};
    const thumb = (
        <span className={styles.thumb}>
            {thumbnail.thumbUrl ? (
                <ProjectThumbnail
                    project={thumbnail}
                    fallbackClassName={styles.placeholder}
                    lazy
                    onError={onLayoutChange}
                />
            ) : <Gamepad2 size={compact || thumbOnly ? 18 : 24} aria-hidden="true" />}
        </span>
    );
    const content = thumbOnly ? thumb : (
        <React.Fragment>
            {thumb}
            <span className={styles.body}>
                {compact ? null : (
                    <span className={styles.app}>
                        <Gamepad2 size={12} aria-hidden="true" />
                        {communityText('MistWarp project')}
                    </span>
                )}
                <span className={styles.title}>{title}</span>
                {project && project.owner ? (
                    <span className={styles.owner}>{communityText('by {value1}', {value1: project.owner})}</span>
                ) : null}
                {!compact && project ? (
                    <span className={styles.stats}>
                        <span>
                            <Heart size={12} aria-hidden="true" />
                            {communityText('{value1, plural, one {# love} other {# loves}}', {
                                value1: Number(project.loveCount) || 0
                            })}
                        </span>
                        <span>
                            <Play size={12} aria-hidden="true" />
                            {communityText('{value1, plural, one {# view} other {# views}}', {
                                value1: Number(project.views) || 0
                            })}
                        </span>
                    </span>
                ) : null}
            </span>
        </React.Fragment>
    );
    if (!inRouter) {
        return (
            <a
                className={className}
                href={`${SITE}${route}`}
                target="_blank"
                rel="noopener noreferrer"
                {...linkProps}
            >{content}</a>
        );
    }
    return <Link className={className} to={route} {...linkProps}>{content}</Link>;
};

PostProjectCard.propTypes = {
    compact: PropTypes.bool,
    thumbOnly: PropTypes.bool,
    onLayoutChange: PropTypes.func,
    project: PropTypes.shape({
        id: PropTypes.string,
        image: PropTypes.string,
        slug: PropTypes.string,
        title: PropTypes.string
    }).isRequired
};

export default PostProjectCard;
