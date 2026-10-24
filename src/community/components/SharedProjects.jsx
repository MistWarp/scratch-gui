import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
import React, {useEffect, useState} from 'react';
import PropTypes from 'prop-types';
import {ArrowUpRight, Pencil, Users} from 'lucide-react';
import api, {editorUrl, projectUrl} from '../api';
import ProjectThumbnail from './ProjectThumbnail.jsx';
import {CardSkeleton, MediaCard, OwnerLink} from './GameCard.jsx';
import EmptyState from './ui/EmptyState.jsx';
import SectionHeading from './ui/SectionHeading.jsx';
import StatusMessage from './ui/StatusMessage.jsx';
import styles from './SharedProjects.module.css';

// The same card as a game. People who can save straight to it go to the
// editor; everyone else goes to the project page, where their access lives.
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
    const edit = project.canSaveDirectly;
    return (
        <MediaCard
            href={edit ? editorUrl({platformProject: project.id}) : null}
            to={edit ? null : projectUrl(project)}
            title={project.title}
            detail={communityText('{value1}: {value2}', {value1: role, value2: description})}
            media={<ProjectThumbnail project={project} fallbackClassName={styles.fallback} lazy />}
            wrapMeta
            meta={(
                <React.Fragment>
                    <OwnerLink username={project.owner} />
                    <span className={styles.open}>
                        {edit ? <Pencil size={12} aria-hidden="true" /> : <ArrowUpRight size={12} aria-hidden="true" />}
                        {edit ? communityText('Edit project') : communityText('Open project')}
                    </span>
                </React.Fragment>
            )}
        />
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
        body = (
            <div className={styles.grid} role="status" aria-label={communityText('Loading shared projects…')}>
                {[0, 1, 2].map(index => <CardSkeleton key={index} />)}
            </div>
        );
    } else if (projects.length) {
        body = (
            <div className={styles.grid}>
                {projects.map(project => (
                    <SharedProjectCard key={project.id} project={project} />
                ))}
            </div>
        );
    } else {
        body = (
            <EmptyState icon={Users} title={communityText('No shared projects yet')}>
                {communityText('Projects will appear here when someone adds you to their team.')}
            </EmptyState>
        );
    }
    return (
        <section className={styles.section}>
            <SectionHeading
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
