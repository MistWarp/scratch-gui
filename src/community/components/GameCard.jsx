import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import {Link} from 'react-router-dom';
import {Heart, Play} from 'lucide-react';
import {projectUrl} from '../api';
import {useCommunityIntl} from '../i18n.jsx';
import ProjectThumbnail from './ProjectThumbnail.jsx';
import styles from './GameCard.module.css';

const GameCard = ({project, className, label}) => {
    const {text: communityText} = useCommunityIntl();
    const loves = Number(project.loveCount) || 0;
    const plays = Number(project.views) || 0;
    return (
        <article className={classNames(styles.card, className)}>
            <Link
                className={styles.thumb}
                to={projectUrl(project)}
                tabIndex={-1}
                aria-hidden="true"
            >
                <ProjectThumbnail
                    project={project}
                    fallbackClassName={styles.fallback}
                    lazy
                />
            </Link>
            <div className={styles.body}>
                <h3 className={styles.title}>
                    <Link
                        to={projectUrl(project)}
                        title={project.title}
                    >{project.title}</Link>
                </h3>
                <div className={styles.meta}>
                    {label ? <span className={styles.label}>{label}</span> : null}
                    <Link
                        className={styles.owner}
                        to={`/users/${project.owner}`}
                    >{project.owner}</Link>
                    <span className={styles.stats}>
                        <span title={communityText('{value1, plural, one {# love} other {# loves}}', {value1: loves})}>
                            <Heart
                                size={12}
                                aria-hidden="true"
                            />
                            {loves}
                        </span>
                        <span title={communityText('{value1, plural, one {# view} other {# views}}', {value1: plays})}>
                            <Play
                                size={12}
                                aria-hidden="true"
                            />
                            {plays}
                        </span>
                    </span>
                </div>
            </div>
        </article>
    );
};

GameCard.propTypes = {
    className: PropTypes.string,
    label: PropTypes.node,
    project: PropTypes.shape({
        id: PropTypes.string,
        loveCount: PropTypes.number,
        owner: PropTypes.string,
        title: PropTypes.string,
        views: PropTypes.number
    }).isRequired
};

export default GameCard;
