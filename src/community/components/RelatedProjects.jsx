import PropTypes from 'prop-types';
import React, {useEffect, useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import {Shapes, SkipForward} from 'lucide-react';
import api, {projectUrl} from '../api';
import {track} from '../analytics';
import {useCommunityIntl} from '../i18n.jsx';
import {rememberVisitProject, visitProjects} from '../visit-analytics.js';
import ProjectThumbnail from './ProjectThumbnail.jsx';
import SectionHeading from './ui/SectionHeading.jsx';
import styles from './RelatedProjects.module.css';

const RELATED_COUNT = 3;

export const rememberProject = id => rememberVisitProject(id);

export const NextProjectButton = ({id, className}) => {
    const {text} = useCommunityIntl();
    const navigate = useNavigate();
    const [busy, setBusy] = useState(false);
    const next = async () => {
        setBusy(true);
        try {
            const data = await api.relatedProjects(id, {exclude: visitProjects(), limit: 1});
            const project = (data.projects || [])[0];
            if (project) {
                track('next_project_click');
                navigate(projectUrl(project));
            }
        } catch (e) {
            navigate('/random');
        } finally {
            setBusy(false);
        }
    };
    return (
        <button type="button" className={className} disabled={busy} onClick={next}>
            <SkipForward size={15} />{text('Next project')}
        </button>
    );
};

NextProjectButton.propTypes = {
    id: PropTypes.string.isRequired,
    className: PropTypes.string
};

const RelatedProjects = ({id}) => {
    const {text} = useCommunityIntl();
    const [projects, setProjects] = useState(null);
    useEffect(() => {
        let active = true;
        setProjects(null);
        api.relatedProjects(id, {limit: RELATED_COUNT})
            .then(data => active && setProjects(data.projects || []))
            .catch(() => active && setProjects([]));
        return () => {
            active = false;
        };
    }, [id]);
    if (projects && !projects.length) return null;
    if (!projects) {
        return (
            <section className={styles.related} aria-busy="true">
                <SectionHeading
                    icon={Shapes}
                    title={text('More like this')}
                />
                <div className={styles.list}>
                    {Array.from({length: RELATED_COUNT}, (_, index) => (
                        <span key={index} className={`${styles.item} ${styles.skeleton}`}>
                            <span className={styles.thumb} />
                            <span className={styles.body}>
                                <span />
                                <span />
                            </span>
                        </span>
                    ))}
                </div>
            </section>
        );
    }
    return (
        <section className={styles.related}>
            <SectionHeading
                icon={Shapes}
                title={text('More like this')}
                actions={<NextProjectButton id={id} className={styles.next} />}
            />
            <div className={styles.list}>
                {projects.map(project => (
                    <Link
                        key={project.id}
                        className={styles.item}
                        to={projectUrl(project)}
                        onClick={() => track('related_project_click')}
                    >
                        <ProjectThumbnail
                            project={project}
                            className={styles.thumb}
                            fallbackClassName={styles.thumbFallback}
                            lazy
                        />
                        <span className={styles.body}>
                            <strong>{project.title}</strong>
                            <span>{text('by {value1}', {value1: project.owner})}</span>
                        </span>
                    </Link>
                ))}
            </div>
        </section>
    );
};

RelatedProjects.propTypes = {
    id: PropTypes.string.isRequired
};

export default RelatedProjects;
