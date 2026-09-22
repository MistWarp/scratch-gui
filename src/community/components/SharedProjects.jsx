import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
import React, {useEffect, useState} from 'react';
import PropTypes from 'prop-types';
import {Link} from 'react-router-dom';
import {ArrowUpRight, Pencil, Users} from 'lucide-react';
import api, {editorUrl, projectUrl} from '../api';
import ProjectThumbnail from './ProjectThumbnail.jsx';
import UserLink from './UserLink.jsx';
import Button from './ui/Button.jsx';
import CardGrid from './ui/CardGrid.jsx';
import EmptyState from './ui/EmptyState.jsx';
import SectionHeading from './ui/SectionHeading.jsx';
import StatusMessage from './ui/StatusMessage.jsx';
import styles from './SharedProjects.module.css';

const SharedProjectCard = ({project}) => {
    const {text: communityText} = useCommunityText();
    const access = {
        editor: [communityText('Editor'), communityText('Edit and save, even when the owner is offline.')],
        maintainer: [communityText('Maintainer'), communityText('Edit, publish, and manage changes.')],
        contributor: [communityText('Contributor'), communityText('Contribute changes through pull requests.')],
        tester: [communityText('Tester'), communityText('Open and test private drafts.')]
    };
    const [role, description] = access[project.myRole] ||
        [communityText('Shared access'), communityText('Open this project to see your access.')];
    return (
        <article className={styles.card}>
            <Link
                className={styles.preview}
                to={projectUrl(project)}
                aria-label={communityText('View {value1}', {value1: project.title})}
            >
                <ProjectThumbnail project={project} lazy />
            </Link>
            <div className={styles.details}>
                <Link className={styles.title} to={projectUrl(project)}>{project.title}</Link>
                <div className={styles.owner}>
                    <span>{communityText('Shared by')}</span>
                    <UserLink username={project.owner}>{project.owner}</UserLink>
                </div>
                <div className={styles.footer}>
                    <span className={styles.role} title={description}>{role}</span>
                    <Button
                        as="a"
                        href={project.canSaveDirectly ?
                            editorUrl({platformProject: project.id}) : projectUrl(project)}
                        variant={project.canSaveDirectly ? 'primary' : 'secondary'}
                        aria-label={project.canSaveDirectly ?
                            communityText('Edit {value1}', {value1: project.title}) :
                            communityText('Open {value1}', {value1: project.title})}
                    >
                        {project.canSaveDirectly ? <Pencil size={14} /> : <ArrowUpRight size={14} />}
                        {project.canSaveDirectly ? communityText('Edit project') : communityText('Open project')}
                    </Button>
                </div>
            </div>
        </article>
    );
};

SharedProjectCard.propTypes = {project: PropTypes.object.isRequired};

const SharedProjects = () => {
    const {text: communityText} = useCommunityText();
    const [projects, setProjects] = useState(null);
    const [error, setError] = useState('');
    const [attempt, setAttempt] = useState(0);
    useEffect(() => {
        let active = true;
        setError('');
        api.request('/me/shared-projects', {cache: false})
            .then(result => {
                if (active) setProjects(result.projects);
            })
            .catch(e => {
                if (active) setError(e.message || communityText('Could not load shared projects.'));
            });
        return () => {
            active = false;
        };
    }, [attempt]);
    const retry = () => setAttempt(value => value + 1);
    let body;
    if (error) {
        body = <StatusMessage compact error onRetry={retry}>{error}</StatusMessage>;
    } else if (!projects) {
        body = <StatusMessage compact>{communityText('Loading shared projects…')}</StatusMessage>;
    } else if (projects.length) {
        body = (
            <CardGrid min={260}>
                {projects.map(project => (
                    <SharedProjectCard key={project.id} project={project} />
                ))}
            </CardGrid>
        );
    } else {
        body = (
            <EmptyState compact icon={Users} title={communityText('No shared projects yet')}>
                {communityText('Projects will appear here when someone adds you to their team.')}
            </EmptyState>
        );
    }
    return (
        <section className={styles.section}>
            <SectionHeading
                icon={Users}
                title={communityText('Shared with you')}
                lead={communityText('Pick up where your team left off.')}
                actions={projects && projects.length ? (
                    <span className={styles.count}>
                        {projects.length === 1 ?
                            communityText('1 project') :
                            communityText('{value1} projects', {value1: projects.length})}
                    </span>
                ) : null}
            />
            {body}
        </section>
    );
};

export default SharedProjects;
export {SharedProjectCard};
