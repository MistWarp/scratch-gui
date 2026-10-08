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
    const {text: communityText, rich: communityRich} = useCommunityText();
    const price = project.price || 0;
    const teamSize = Math.max(1, Number(project.teamSize) || 1);
    const acceptedChanges = Number(project.acceptedChanges) || 0;
    const loves = project.loveCount || 0;
    const views = project.views || 0;
    return (
        <article className={styles.card}>
            <Link
                className={styles.cardLink}
                to={projectUrl(project)}
                aria-label={communityText('Open {value1}', {value1: project.title})}
            />
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
                        {communityText('{value1} this week', {value1: project.weekViews})}
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
                <div className={styles.owner}>
                    <span>{communityRich('by {user}', {
                        user: <UserLink username={project.owner}>{project.owner}</UserLink>
                    })}</span>
                    <GroupTag username={project.owner} compact linked={false} />
                </div>
                {project.description ? (
                    <p className={styles.desc}>{project.description}</p>
                ) : null}
                <div className={styles.stats}>
                    <span className={styles.stat}>
                        <Heart size={13} />
                        <span aria-hidden="true">{loves}</span>
                        <span className={styles.srOnly}>
                            {communityText('{value1, plural, one {# love} other {# loves}}', {value1: loves})}
                        </span>
                    </span>
                    <span className={styles.stat}>
                        <Play size={13} />
                        <span aria-hidden="true">{views}</span>
                        <span className={styles.srOnly}>
                            {communityText('{value1, plural, one {# view} other {# views}}', {value1: views})}
                        </span>
                    </span>
                    {teamSize > 1 ? (
                        <span
                            className={styles.stat}
                            title={communityText('{value1} people have worked on this project', {value1: teamSize})}
                        >
                            <Users size={13} />
                            <span aria-hidden="true">{teamSize}</span>
                            <span className={styles.srOnly}>
                                {communityText('{value1} people have worked on this project', {value1: teamSize})}
                            </span>
                        </span>
                    ) : null}
                    {acceptedChanges > 0 ? (
                        <span
                            className={styles.stat}
                            title={acceptedChanges === 1 ?
                                communityText('1 accepted contribution') :
                                communityText('{value1} accepted contributions', {value1: acceptedChanges})}
                        >
                            <GitPullRequest size={13} />
                            <span aria-hidden="true">{acceptedChanges}</span>
                            <span className={styles.srOnly}>
                                {acceptedChanges === 1 ?
                                    communityText('1 accepted contribution') :
                                    communityText('{value1} accepted contributions', {value1: acceptedChanges})}
                            </span>
                        </span>
                    ) : null}
                    {project.remixParent ? (
                        <span className={styles.stat} title={communityText('Remixed from another MistWarp project')}>
                            <GitFork size={13} />
                            {communityText('Remix')}
                        </span>
                    ) : null}
                </div>
            </div>
        </article>
    );
};

export default ProjectCard;
