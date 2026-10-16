import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import React, {useEffect, useState} from 'react';
import {Link, useInRouterContext} from 'react-router-dom';
import {Gamepad2, Heart, Play} from 'lucide-react';
import {projectUrl} from '../api.js';
import {isPublicProject} from '../claw-links.js';
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
            setState(isPublicProject(project) ? {status: 'ready', project} : {status: 'missing', project: null});
        });
        return () => {
            active = false;
        };
    }, [ref.id, ref.slug]);
    useEffect(() => {
        if (state.status !== 'loading' && onLayoutChange) onLayoutChange();
    }, [state.status]);

    if (state.status === 'missing') return null;
    const project = state.project;
    const loading = !project;
    const title = project ? project.title || '' : '';
    const className = classNames(thumbOnly ? styles.thumbOnly : styles.card, {
        [styles.compact]: compact,
        [styles.loading]: loading
    });
    const thumb = (
        <span className={styles.thumb}>
            {project && project.thumbUrl ? (
                <ProjectThumbnail
                    project={{title, thumbUrl: project.thumbUrl}}
                    fallbackClassName={styles.placeholder}
                    lazy
                    onError={onLayoutChange}
                />
            ) : <Gamepad2 size={compact || thumbOnly ? 18 : 24} aria-hidden="true" />}
        </span>
    );
    if (loading) {
        return (
            <span className={className} aria-hidden="true">
                {thumb}
                {thumbOnly ? null : <span className={styles.body}><span className={styles.title} /></span>}
            </span>
        );
    }
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
                {project.owner ? (
                    <span className={styles.owner}>{communityText('by {value1}', {value1: project.owner})}</span>
                ) : null}
                {compact ? null : (
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
                )}
            </span>
        </React.Fragment>
    );
    const route = projectUrl(project);
    const linkProps = thumbOnly ? {'title': title, 'aria-label': title || communityText('MistWarp project')} : {};
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
        slug: PropTypes.string
    }).isRequired
};

export default PostProjectCard;
