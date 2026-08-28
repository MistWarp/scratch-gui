/* eslint-disable max-len */
import PropTypes from 'prop-types';
import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Check, Plus, Search, X} from 'lucide-react';
import api from '../api';
import {useUser} from '../UserContext.jsx';
import ProjectThumbnail from './ProjectThumbnail.jsx';
import Button from './ui/Button.jsx';
import IconButton from './ui/IconButton.jsx';
import useLatest from '../use-latest.js';
import styles from '../pages/Spaces.module.css';

const projectIdsForSpace = space => new Set([
    ...(space.projectIds || []),
    ...((space.projects || []).map(project => project.id))
]);

const SpaceProjectPicker = ({space, onAdded}) => {
    const {user, login} = useUser();
    const [open, setOpen] = useState(false);
    const [tab, setTab] = useState('mine');
    const [mine, setMine] = useState(null);
    const [mineOffset, setMineOffset] = useState(0);
    const [mineTotal, setMineTotal] = useState(0);
    const [mineMoreBusy, setMineMoreBusy] = useState(false);
    const [mineMoreError, setMineMoreError] = useState(false);
    const [mineError, setMineError] = useState('');
    const [mineAttempt, setMineAttempt] = useState(0);
    const [results, setResults] = useState([]);
    const [query, setQuery] = useState('');
    const [searching, setSearching] = useState(false);
    const [adding, setAdding] = useState('');
    const [error, setError] = useState('');
    const username = (user && user.username) || '';
    const actionContext = `${space._id}\u0000${username}`;
    const currentContext = useRef(actionContext);
    currentContext.current = actionContext;
    const actionLocks = useRef(new Set());
    const beginSearch = useLatest();
    const existingIds = useMemo(() => projectIdsForSpace(space), [space]);

    useEffect(() => {
        beginSearch();
        setAdding('');
        setSearching(false);
        setError('');
    }, [actionContext, beginSearch]);

    useEffect(() => {
        if (!open || !username) {
            setMine(null);
            setMineError('');
            return () => {};
        }
        let active = true;
        setMine(null);
        setMineOffset(0);
        setMineTotal(0);
        setMineMoreBusy(false);
        setMineMoreError(false);
        setMineError('');
        api.myProjectPage(username, {offset: 0, limit: 24})
            .then(data => {
                if (active) {
                    setMine((data.projects || [])
                        .filter(project => project.shared || project.visibility === 'unlisted'));
                    setMineOffset(Number.isFinite(data.nextOffset) ? data.nextOffset : (data.projects || []).length);
                    setMineTotal(Number.isFinite(data.total) ? data.total : (data.projects || []).length);
                }
            })
            .catch(() => {
                if (active) setMineError('Could not load your projects.');
            });
        return () => {
            active = false;
        };
    }, [mineAttempt, open, username]);

    const loadMoreMine = async () => {
        if (mineMoreBusy || mineOffset >= mineTotal) return;
        const context = actionContext;
        setMineMoreBusy(true);
        setMineMoreError(false);
        try {
            const data = await api.myProjectPage(username, {offset: mineOffset, limit: 24});
            if (currentContext.current !== context) return;
            const eligible = (data.projects || [])
                .filter(project => project.shared || project.visibility === 'unlisted');
            setMine(current => {
                const byId = new Map((current || []).map(project => [project.id, project]));
                eligible.forEach(project => byId.set(project.id, project));
                return Array.from(byId.values());
            });
            setMineOffset(Number.isFinite(data.nextOffset) ? data.nextOffset : mineOffset + (data.projects || []).length);
            setMineTotal(Number.isFinite(data.total) ? data.total : mineTotal);
        } catch (e) {
            if (currentContext.current === context) setMineMoreError(true);
        } finally {
            if (currentContext.current === context) setMineMoreBusy(false);
        }
    };

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
        const actionKey = `${actionContext}\u0000search`;
        if (actionLocks.current.has(actionKey)) return;
        actionLocks.current.add(actionKey);
        const fresh = beginSearch();
        setSearching(true);
        setError('');
        try {
            const data = await api.explore({q: value, sort: 'recent', limit: 18});
            fresh(setResults)(data.projects || []);
        } catch (e) {
            fresh(setError)(e.message || 'Could not search projects.');
        } finally {
            actionLocks.current.delete(actionKey);
            fresh(setSearching)(false);
        }
    };

    const add = async project => {
        const context = actionContext;
        const actionKey = `${context}\u0000add`;
        if (actionLocks.current.has(actionKey)) return;
        actionLocks.current.add(actionKey);
        setAdding(project.id);
        setError('');
        try {
            await api.addSpaceProject(space._id, project.id);
            if (currentContext.current === context) await onAdded();
        } catch (e) {
            if (currentContext.current === context) {
                setError(e.message || 'Could not add this project.');
            }
        } finally {
            actionLocks.current.delete(actionKey);
            if (currentContext.current === context) setAdding('');
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
                <IconButton
                    variant="secondary"
                    className={styles.iconButton}
                    disabled={Boolean(adding)}
                    onClick={() => setOpen(false)}
                    label="Close project picker"
                ><X size={18} /></IconButton>
            </header>
            <div className={styles.pickerTabs}>
                <button type="button" className={tab === 'mine' ? styles.pickerTabActive : styles.pickerTab} onClick={() => setTab('mine')}>Your projects</button>
                {space.canManage ? <button type="button" className={tab === 'search' ? styles.pickerTabActive : styles.pickerTab} onClick={() => setTab('search')}>Search</button> : null}
            </div>
            {tab === 'search' ? (
                <form className={styles.projectSearch} onSubmit={search}>
                    <Search size={16} />
                    <input
                        value={query}
                        disabled={searching}
                        onChange={event => setQuery(event.target.value)}
                        placeholder="Search by title, creator, or tag"
                    />
                    <Button type="submit" variant="secondary" busy={searching} busyLabel="Searching…">Search</Button>
                </form>
            ) : null}
            {error ? <p className={styles.error}>{error}</p> : null}
            {tab === 'mine' && mine === null && !mineError ? <p className={styles.pickerEmpty}>Loading your projects…</p> : null}
            {tab === 'mine' && mineError ? <p className={styles.pickerEmpty}>{mineError} <button type="button" onClick={() => setMineAttempt(attempt => attempt + 1)}>Try again</button></p> : null}
            {tab === 'search' && !results.length && !searching ? <p className={styles.pickerEmpty}>Search for a public project to add.</p> : null}
            {tab === 'mine' && mine && !mine.length && !mineError && mineOffset >= mineTotal ? <p className={styles.pickerEmpty}>You do not have any shared or unlisted projects yet.</p> : null}
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
                            <Button
                                variant="secondary"
                                disabled={added || Boolean(adding)}
                                busy={adding === project.id}
                                busyLabel="Adding…"
                                onClick={() => add(project)}
                            >
                                {added ? <><Check size={14} /> Added</> : <><Plus size={14} /> Add</>}
                            </Button>
                        </article>
                    );
                })}
            </div>
            {tab === 'mine' && mineOffset < mineTotal ? (
                <Button variant="secondary" busy={mineMoreBusy} busyLabel="Loading…" onClick={loadMoreMine}>
                    Load more projects
                </Button>
            ) : null}
            {tab === 'mine' && mineMoreError ? <p className={styles.pickerEmpty}>Could not load more projects. Try again.</p> : null}
        </section>
    );
};

SpaceProjectPicker.propTypes = {
    space: PropTypes.object.isRequired,
    onAdded: PropTypes.func.isRequired
};

export {projectIdsForSpace};
export default SpaceProjectPicker;
