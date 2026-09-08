import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
import React from 'react';
import {Link} from 'react-router-dom';
import {GitFork, GitPullRequest, Heart, Play, Coins, TrendingUp, Users} from 'lucide-react';
import {projectUrl} from '../api';
import ProjectThumbnail from './ProjectThumbnail.jsx';
import GroupTag from './GroupTag.jsx';
import UserLink from './UserLink.jsx';
import styles from './ProjectCard.module.css';

const ProjectCard = ({project, showTrend = false}) => {
    const {text: communityText} = useCommunityText();
    const price = project.price || 0;
    const teamSize = Math.max(1, Number(project.teamSize) || 1);
    const acceptedChanges = Number(project.acceptedChanges) || 0;
    return (
        <article className={styles.card}>
            <Link className={styles.cardLink} to={projectUrl(project)} aria-label={communityText("Open {value1}", {value1: project.title})} />
            <div className={styles.thumb}>
                {price > 0 ? (
                    <span className={styles.priceBadge}>
                        <Coins size={12} />
                        {project.bought ? communityText('Owned') : price}
                    </span>
                ) : null}
                {showTrend && project.weekViews > 0 ? (
                    <span className={styles.trendBadge} title={communityText('Views in the last seven days')}>
                        <TrendingUp size={12} />
                        {project.weekViews}{communityText(' this week')}</span>
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
                <div className={styles.owner}>{communityText('by ')}<UserLink username={project.owner}>{project.owner}</UserLink><GroupTag username={project.owner} compact linked={false} />
                </div>
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
                    {teamSize > 1 ? (
                        <span className={styles.stat} title={communityText("{value1} people have worked on this project", {value1: teamSize})}>
                            <Users size={13} />
                            {teamSize}
                        </span>
                    ) : null}
                    {acceptedChanges > 0 ? (
                        <span
                            className={styles.stat}
                            title={communityText("{value1} accepted {value2}", {value1: acceptedChanges, value2: acceptedChanges === 1 ?
                                'contribution' : 'contributions'})}
                        >
                            <GitPullRequest size={13} />
                            {acceptedChanges}
                        </span>
                    ) : null}
                    {project.remixParent ? (
                        <span className={styles.stat} title={communityText('Remixed from another MistWarp project')}>
                            <GitFork size={13} />{communityText('Remix')}</span>
                    ) : null}
                </div>
            </div>
        </article>
    );
};

export default ProjectCard;
