/* eslint-disable max-len */
import PropTypes from 'prop-types';
import React, {useEffect, useMemo, useState} from 'react';
import {Check, Plus, Search, X} from 'lucide-react';
import api from '../api';
import {useUser} from '../UserContext.jsx';
import ProjectThumbnail from './ProjectThumbnail.jsx';
import Button from './ui/Button.jsx';
import styles from '../pages/Spaces.module.css';

const SpaceProjectPicker = ({space, onAdded}) => {
    const {user, login} = useUser();
    const [open, setOpen] = useState(false);
    const [tab, setTab] = useState('mine');
    const [mine, setMine] = useState(null);
    const [results, setResults] = useState([]);
    const [query, setQuery] = useState('');
    const [searching, setSearching] = useState(false);
    const [adding, setAdding] = useState('');
    const [error, setError] = useState('');
    const existingIds = useMemo(() => new Set(space.projectIds || space.projects.map(project => project.id)), [space]);

    useEffect(() => {
        if (!open || !user || mine !== null) return;
        api.myProjects(user.username)
            .then(data => setMine((data.projects || []).filter(project => project.shared || project.visibility === 'unlisted')))
            .catch(() => setMine([]));
    }, [mine, open, user]);

    const show = () => {
        if (!user) {
            login();
            return;
        }
        setOpen(true);
    };

    const search = async event => {
        event.preventDefault();
        const value = query.trim();
        if (!value) return;
        setSearching(true);
        setError('');
        try {
            const data = await api.explore({q: value, sort: 'recent', limit: 18});
            setResults(data.projects || []);
        } catch (e) {
            setError(e.message || 'Could not search projects.');
        } finally {
            setSearching(false);
        }
    };

    const add = async project => {
        setAdding(project.id);
        setError('');
        try {
            await api.addSpaceProject(space._id, project.id);
            await onAdded();
        } catch (e) {
            setError(e.message || 'Could not add this project.');
        } finally {
            setAdding('');
        }
    };

    const projects = tab === 'mine' ? (mine || []) : results;

    if (!open) {
        return <Button onClick={show}><Plus size={16} /> Add projects</Button>;
    }

    return (
        <section className={styles.projectPicker}>
            <header>
                <div>
                    <h2>Add projects</h2>
                    <p>Choose one of your shared or unlisted projects, or search public projects.</p>
                </div>
                <button type="button" className={styles.iconButton} onClick={() => setOpen(false)} aria-label="Close project picker"><X size={18} /></button>
            </header>
            <div className={styles.pickerTabs}>
                <button type="button" className={tab === 'mine' ? styles.pickerTabActive : styles.pickerTab} onClick={() => setTab('mine')}>Your projects</button>
                {space.canManage ? <button type="button" className={tab === 'search' ? styles.pickerTabActive : styles.pickerTab} onClick={() => setTab('search')}>Search</button> : null}
            </div>
            {tab === 'search' ? (
                <form className={styles.projectSearch} onSubmit={search}>
                    <Search size={16} />
                    <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search by title, creator, or tag" />
                    <Button type="submit" variant="secondary" disabled={searching}>{searching ? 'Searching…' : 'Search'}</Button>
                </form>
            ) : null}
            {error ? <p className={styles.error}>{error}</p> : null}
            {tab === 'mine' && mine === null ? <p className={styles.pickerEmpty}>Loading your projects…</p> : null}
            {tab === 'search' && !results.length && !searching ? <p className={styles.pickerEmpty}>Search for a public project to add.</p> : null}
            {tab === 'mine' && mine && !mine.length ? <p className={styles.pickerEmpty}>You do not have any shared or unlisted projects yet.</p> : null}
            <div className={styles.pickerResults}>
                {projects.map(project => {
                    const added = existingIds.has(project.id);
                    return (
                        <article key={project.id} className={styles.pickerProject}>
                            <ProjectThumbnail project={project} className={styles.pickerThumb} fallbackClassName={styles.pickerThumbFallback} lazy />
                            <div>
                                <strong>{project.title}</strong>
                                <span>by {project.owner}</span>
                                {project.visibility === 'unlisted' ? <small>Unlisted</small> : null}
                            </div>
                            <button type="button" disabled={added || adding === project.id} onClick={() => add(project)}>
                                {added ? <><Check size={14} /> Added</> : adding === project.id ? 'Adding…' : <><Plus size={14} /> Add</>}
                            </button>
                        </article>
                    );
                })}
            </div>
        </section>
    );
};

SpaceProjectPicker.propTypes = {
    space: PropTypes.object.isRequired,
    onAdded: PropTypes.func.isRequired
};

export default SpaceProjectPicker;
