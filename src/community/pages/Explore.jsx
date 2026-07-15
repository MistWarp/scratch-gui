import React, {useEffect, useState} from 'react';
import {useSearchParams, Link} from 'react-router-dom';
import api from '../api';
import ProjectCard from '../components/ProjectCard.jsx';
import Avatar from '../components/Avatar.jsx';
import styles from './Explore.module.css';

const SORTS = [
    {key: 'trending', label: 'Trending'},
    {key: 'recent', label: 'Recent'},
    {key: 'loved', label: 'Most loved'}
];

const Explore = () => {
    const [params, setParams] = useSearchParams();
    const sort = params.get('sort') || 'trending';
    const q = params.get('q') || '';
    const [projects, setProjects] = useState([]);
    const [people, setPeople] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        api.explore({sort, q, limit: 48})
            .then(data => setProjects(data.projects || []))
            .catch(() => setProjects([]))
            .finally(() => setLoading(false));
        if (q.trim()) {
            api.searchUsers(q.trim())
                .then(data => setPeople(data.users || []))
                .catch(() => setPeople([]));
        } else {
            setPeople([]);
        }
    }, [sort, q]);

    const setSort = key => {
        const next = new URLSearchParams(params);
        next.set('sort', key);
        setParams(next);
    };

    return (
        <main className={styles.page}>
            <div className={styles.head}>
                <h1>{q ? `Results for "${q}"` : 'Explore'}</h1>
                <div className={styles.tabs}>
                    {SORTS.map(option => (
                        <button
                            key={option.key}
                            className={option.key === sort ? styles.tabActive : styles.tab}
                            onClick={() => setSort(option.key)}
                        >{option.label}</button>
                    ))}
                </div>
            </div>
            {people.length ? (
                <div className={styles.people}>
                    {people.map(person => (
                        <Link
                            key={person.username}
                            to={`/users/${person.username}`}
                            className={styles.person}
                        >
                            <Avatar
                                username={person.username}
                                size={44}
                            />
                            <div className={styles.personInfo}>
                                <span className={styles.personName}>{person.username}</span>
                                <span className={styles.personMeta}>
                                    {person.followers} {person.followers === 1 ? 'follower' : 'followers'}
                                    {' · '}
                                    {person.projects} {person.projects === 1 ? 'project' : 'projects'}
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            ) : null}
            {loading ? (
                <p className={styles.status}>Loading…</p>
            ) : projects.length ? (
                <div className={styles.grid}>
                    {projects.map(project => (
                        <ProjectCard
                            key={project.id}
                            project={project}
                        />
                    ))}
                </div>
            ) : (
                <p className={styles.status}>No projects found.</p>
            )}
        </main>
    );
};

export default Explore;
