import React from 'react';
import {Link} from 'react-router-dom';
import {Heart, Play, Coins, TrendingUp} from 'lucide-react';
import {projectUrl} from '../api';
import ProjectThumbnail from './ProjectThumbnail.jsx';
import styles from './ProjectCard.module.css';

const ProjectCard = ({project, showTrend = false}) => {
    const price = project.price || 0;
    return (
        <Link
            to={projectUrl(project.id)}
            className={styles.card}
        >
            <div className={styles.thumb}>
                {price > 0 ? (
                    <span className={styles.priceBadge}>
                        <Coins size={12} />
                        {project.bought ? 'Owned' : price}
                    </span>
                ) : null}
                {showTrend && project.weekViews > 0 ? (
                    <span className={styles.trendBadge} title="Views in the last seven days">
                        <TrendingUp size={12} />
                        {project.weekViews} this week
                    </span>
                ) : null}
                <ProjectThumbnail
                    project={project}
                    fallbackClassName={styles.placeholder}
                    lazy
                />
            </div>
            <div className={styles.body}>
                <div
                    className={styles.title}
                    title={project.title}
                >{project.title}</div>
                <div className={styles.owner}>by {project.owner}</div>
                {project.description ? (
                    <p className={styles.desc}>{project.description}</p>
                ) : null}
                <div className={styles.stats}>
                    <span className={styles.stat}>
                        <Heart size={13} />
                        {project.loveCount || 0}
                    </span>
                    <span className={styles.stat}>
                        <Play size={13} />
                        {project.views || 0}
                    </span>
                </div>
            </div>
        </Link>
    );
};

export default ProjectCard;
