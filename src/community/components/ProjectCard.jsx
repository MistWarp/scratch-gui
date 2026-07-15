import React, {useState} from 'react';
import {Link} from 'react-router-dom';
import {Heart, Play} from 'lucide-react';
import {projectUrl} from '../api';
import styles from './ProjectCard.module.css';

const ProjectCard = ({project}) => {
    const [broken, setBroken] = useState(false);
    return (
        <Link
            to={projectUrl(project.id)}
            className={styles.card}
        >
            <div className={styles.thumb}>
                {project.thumbUrl && !broken ? (
                    <img
                        src={project.thumbUrl}
                        alt=""
                        loading="lazy"
                        onError={() => setBroken(true)}
                    />
                ) : (
                    <div className={styles.placeholder}>{(project.title || '?')[0]}</div>
                )}
            </div>
            <div className={styles.body}>
                <div className={styles.title}>{project.title}</div>
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
