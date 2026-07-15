import React, {useEffect, useState, useCallback, useRef} from 'react';
import {Link} from 'react-router-dom';
import {Plus, Trash2, Heart, HeartCrack, Play, Upload, Star, MoreHorizontal, Pencil, ExternalLink} from 'lucide-react';
import api, {editorUrl, projectUrl} from '../api';
import {useUser} from '../UserContext.jsx';
import ProjectCard from '../components/ProjectCard.jsx';
import styles from './MyStuff.module.css';

const TABS = [
    {key: 'projects', label: 'Projects'},
    {key: 'loves', label: 'Hearted'}
];

const MyStuff = () => {
    const {user, loading} = useUser();
    const [tab, setTab] = useState('projects');
    const [projects, setProjects] = useState(null);
    const [featuredProject, setFeaturedProject] = useState(user ? user.featuredProject : '');
    const [uploading, setUploading] = useState(false);
    const [actionError, setActionError] = useState('');
    const [openMenu, setOpenMenu] = useState('');
    const uploadInput = useRef(null);

    useEffect(() => {
        setFeaturedProject(user ? user.featuredProject : '');
    }, [user]);

    const load = useCallback(() => {
        if (!user) {
            return;
        }
        setProjects(null);
        const fetchTab = tab === 'loves' ?
            api.userLoves(user.username) :
            api.myProjects(user.username);
        fetchTab
            .then(data => setProjects(data.projects || []))
            .catch(() => setProjects([]));
    }, [user, tab]);

    useEffect(() => {
        load();
    }, [load]);

    const unpublish = async id => {
        try {
            await api.unpublish(id);
            if (featuredProject === id) {
                setFeaturedProject('');
            }
            load();
        } catch (e) {
            setActionError(e.message);
        }
    };

    const publish = async id => {
        try {
            setActionError('');
            await api.publish(id);
            load();
        } catch (e) {
            setActionError(e.message);
        }
    };

    const deleteProject = async id => {
        setOpenMenu('');
        if (!window.confirm('Delete this project forever? This cannot be undone.')) {
            return;
        }
        try {
            setActionError('');
            await api.deleteProject(id);
            load();
        } catch (e) {
            setActionError(e.message);
        }
    };

    const toggleFeatured = async id => {
        setOpenMenu('');
        const next = featuredProject === id ? '' : id;
        try {
            setActionError('');
            await api.updateProfile({featuredProject: next});
            setFeaturedProject(next);
        } catch (e) {
            setActionError(e.message);
        }
    };

    const uploadSb3 = async event => {
        const file = event.target.files[0];
        event.target.value = '';
        if (!file) return;
        if (!file.name.toLowerCase().endsWith('.sb3')) {
            setActionError('Choose a Scratch .sb3 project file.');
            return;
        }
        let created;
        try {
            setActionError('');
            setUploading(true);
            created = await api.createProject({title: file.name.replace(/\.sb3$/i, '') || 'Untitled'});
            await api.uploadProject(created.id, file);
            await api.publish(created.id);
            setTab('projects');
            load();
        } catch (e) {
            if (created) {
                api.deleteProject(created.id).catch(() => {});
            }
            setActionError(e.message || 'Could not upload that project.');
        } finally {
            setUploading(false);
        }
    };

    if (loading) {
        return <main className={styles.page}><p className={styles.status}>Loading…</p></main>;
    }
    if (!user) {
        return <main className={styles.page}><p className={styles.status}>Sign in to see your projects.</p></main>;
    }

    return (
        <main className={styles.page}>
            <div className={styles.head}>
                <h1>My stuff</h1>
                <div className={styles.headActions}>
                    <input
                        ref={uploadInput}
                        className={styles.hiddenInput}
                        type="file"
                        accept=".sb3,application/x.scratch.sb3"
                        onChange={uploadSb3}
                    />
                    <button
                        className={styles.uploadButton}
                        disabled={uploading}
                        onClick={() => uploadInput.current.click()}
                    >
                        <Upload size={16} />
                        {uploading ? 'Uploading…' : 'Upload .sb3'}
                    </button>
                    <a
                        className={styles.newButton}
                        href={editorUrl()}
                    >
                        <Plus size={16} />
                        New project
                    </a>
                </div>
            </div>

            {actionError ? <p className={styles.error}>{actionError}</p> : null}

            <div className={styles.tabs}>
                {TABS.map(option => (
                    <button
                        key={option.key}
                        className={option.key === tab ? styles.tabActive : styles.tab}
                        onClick={() => setTab(option.key)}
                    >{option.label}</button>
                ))}
            </div>

            {projects === null ? (
                <p className={styles.status}>Loading…</p>
            ) : tab !== 'projects' ? (
                projects.length ? (
                    <div className={styles.grid}>
                        {projects.map(project => (
                            <ProjectCard
                                key={project.id}
                                project={project}
                            />
                        ))}
                    </div>
                ) : (
                    <p className={styles.status}>Projects you heart show up here.</p>
                )
            ) : projects.length ? (
                <div className={styles.list}>
                    {projects.map(project => (
                        <div
                            key={project.id}
                            className={styles.row}
                        >
                            <Link
                                to={projectUrl(project.id)}
                                className={styles.thumb}
                            >
                                {project.thumbUrl ? (
                                    <img
                                        src={project.thumbUrl}
                                        alt=""
                                    />
                                ) : <span>{(project.title || '?')[0]}</span>}
                            </Link>
                            <div className={styles.info}>
                                <Link
                                    to={projectUrl(project.id)}
                                    className={styles.title}
                                >{project.title}</Link>
                                <span className={project.shared ? styles.shared : styles.draft}>
                                    {project.shared ? 'Shared' : 'Draft'}
                                </span>
                                <span className={styles.rowStats}>
                                    <span className={styles.rowStat}>
                                        <Heart size={13} />
                                        {project.loveCount || 0}
                                    </span>
                                    <span className={styles.rowStat}>
                                        <HeartCrack size={13} />
                                        {project.brokenHeartCount || 0}
                                    </span>
                                    <span className={styles.rowStat}>
                                        <Play size={13} />
                                        {project.views || 0}
                                    </span>
                                </span>
                            </div>
                            <div className={styles.rowActions}>
                                {project.shared ? (
                                    <button
                                        className={styles.secondary}
                                        onClick={() => unpublish(project.id)}
                                    >Unshare</button>
                                ) : (
                                    <button
                                        className={styles.secondary}
                                        onClick={() => publish(project.id)}
                                    >Share</button>
                                )}
                                <div className={styles.actionMenuWrap}>
                                    <button
                                        className={styles.moreButton}
                                        aria-label={`Actions for ${project.title}`}
                                        aria-expanded={openMenu === project.id}
                                        onClick={() => setOpenMenu(openMenu === project.id ? '' : project.id)}
                                    >
                                        <MoreHorizontal size={18} />
                                    </button>
                                    {openMenu === project.id ? (
                                        <div className={styles.actionMenu}>
                                            <a href={editorUrl({platformProject: project.id})}>
                                                <Pencil size={14} />
                                                Edit
                                            </a>
                                            <Link to={projectUrl(project.id)}>
                                                <ExternalLink size={14} />
                                                Project page
                                            </Link>
                                            {project.shared ? (
                                                <button onClick={() => toggleFeatured(project.id)}>
                                                    <Star
                                                        size={14}
                                                        fill={featuredProject === project.id ? 'currentColor' : 'none'}
                                                    />
                                                    {featuredProject === project.id ?
                                                        'Remove profile feature' : 'Feature on profile'}
                                                </button>
                                            ) : (
                                                <button
                                                    className={styles.danger}
                                                    onClick={() => deleteProject(project.id)}
                                                >
                                                    <Trash2 size={14} />
                                                    Delete
                                                </button>
                                            )}
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className={styles.status}>You have not created any projects yet.</p>
            )}
        </main>
    );
};

export default MyStuff;
