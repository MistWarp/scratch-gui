import PropTypes from 'prop-types';
import React, {useEffect, useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import {SkipForward, Sparkles} from 'lucide-react';
import api, {projectUrl} from '../api';
import {track} from '../analytics';
import {useCommunityIntl} from '../i18n.jsx';
import ProjectThumbnail from './ProjectThumbnail.jsx';
import styles from './RelatedProjects.module.css';

const SEEN_KEY = 'mw:session-projects';

const seenProjects = () => {
    try {
        return JSON.parse(sessionStorage.getItem(SEEN_KEY)) || [];
    } catch (e) {
        return [];
    }
};

export const rememberProject = id => {
    try {
        const seen = seenProjects().filter(item => item !== id);
        seen.push(id);
        sessionStorage.setItem(SEEN_KEY, JSON.stringify(seen.slice(-40)));
    } catch (e) {
        return;
    }
};

export const NextProjectButton = ({id, className}) => {
    const {text} = useCommunityIntl();
    const navigate = useNavigate();
    const [busy, setBusy] = useState(false);
    const next = async () => {
        setBusy(true);
        try {
            const data = await api.relatedProjects(id, {exclude: seenProjects(), limit: 1});
            const project = (data.projects || [])[0];
            if (project) {
                track('next_project_click', {from: id, to: project.id});
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
    const [projects, setProjects] = useState([]);
    useEffect(() => {
        let active = true;
        setProjects([]);
        api.relatedProjects(id, {limit: 6})
            .then(data => active && setProjects(data.projects || []))
            .catch(() => active && setProjects([]));
        return () => {
            active = false;
        };
    }, [id]);
    if (!projects.length) return null;
    return (
        <section className={styles.related}>
            <div className={styles.head}>
                <h2><Sparkles size={17} />{text('More like this')}</h2>
                <NextProjectButton id={id} className={styles.next} />
            </div>
            <div className={styles.list}>
                {projects.map(project => (
                    <Link
                        key={project.id}
                        className={styles.item}
                        to={projectUrl(project)}
                        onClick={() => track('related_project_click', {from: id, to: project.id})}
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
