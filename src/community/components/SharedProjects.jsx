import React, {useEffect, useState} from 'react';
import PropTypes from 'prop-types';
import {Link} from 'react-router-dom';
import {ArrowUpRight, Pencil, Users} from 'lucide-react';
import api, {editorUrl, projectUrl} from '../api';
import ProjectThumbnail from './ProjectThumbnail.jsx';
import UserLink from './UserLink.jsx';
import Button from './ui/Button.jsx';
import styles from './SharedProjects.module.css';

const ACCESS = {
    editor: ['Editor', 'Edit and save, even when the owner is offline.'],
    maintainer: ['Maintainer', 'Edit, publish, and manage changes.'],
    contributor: ['Contributor', 'Contribute changes through pull requests.'],
    tester: ['Tester', 'Open and test private drafts.']
};

const SharedProjectCard = ({project}) => {
    const [role, description] = ACCESS[project.myRole] || ['Shared access', 'Open this project to see your access.'];
    return (
        <article className={styles.card}>
            <Link
                className={styles.preview}
                to={projectUrl(project.id)}
                aria-label={`View ${project.title}`}
            >
                <ProjectThumbnail project={project} lazy />
            </Link>
            <div className={styles.details}>
                <Link className={styles.title} to={projectUrl(project.id)}>{project.title}</Link>
                <div className={styles.owner}>
                    {'Shared by '}<UserLink username={project.owner}>{project.owner}</UserLink>
                </div>
                <div className={styles.footer}>
                    <span className={styles.role} title={description}>{role}</span>
                    <Button
                        as="a"
                        href={project.canSaveDirectly ?
                            editorUrl({platformProject: project.id}) : projectUrl(project.id)}
                        variant={project.canSaveDirectly ? 'primary' : 'secondary'}
                        aria-label={`${project.canSaveDirectly ? 'Edit' : 'Open'} ${project.title}`}
                    >
                        {project.canSaveDirectly ? <Pencil size={14} /> : <ArrowUpRight size={14} />}
                        {project.canSaveDirectly ? 'Edit project' : 'Open project'}
                    </Button>
                </div>
            </div>
        </article>
    );
};

SharedProjectCard.propTypes = {project: PropTypes.object.isRequired};

const SharedProjects = () => {
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
                if (active) setError(e.message || 'Could not load shared projects.');
            });
        return () => {
            active = false;
        };
    }, [attempt]);
    return (
        <section className={styles.section}>
            <header className={styles.header}>
                <div>
                    <h1>{'Shared with you'}</h1>
                    <p>{'Pick up where your team left off.'}</p>
                </div>
                {projects && projects.length ? <span className={styles.count}>
                    {`${projects.length} ${projects.length === 1 ? 'project' : 'projects'}`}
                </span> : null}
            </header>
            {error ? <div className={styles.empty} role="alert">
                <p>{error}</p>
                {/* eslint-disable-next-line react/jsx-no-bind */}
                <Button onClick={() => setAttempt(value => value + 1)}>{'Try again'}</Button>
            </div> : !projects ? (
                <p className={styles.loading} role="status">{'Loading shared projects…'}</p>
            ) : projects.length ? (
                <div className={styles.grid}>
                    {projects.map(project => (
                        <SharedProjectCard key={project.id} project={project} />
                    ))}
                </div>
            ) : <div className={styles.empty}>
                <Users size={28} aria-hidden="true" />
                <h2>{'No shared projects yet'}</h2>
                <p>{'Projects will appear here when someone adds you to their team.'}</p>
            </div>}
        </section>
    );
};

export default SharedProjects;
export {SharedProjectCard};
