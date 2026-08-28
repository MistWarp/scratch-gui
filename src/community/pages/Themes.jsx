/* eslint-disable react/jsx-no-bind, max-len */
import React, {useEffect, useMemo, useRef, useState} from 'react';
import {ArrowLeft, FileJson, LogIn, Palette, Plus, Search, Upload} from 'lucide-react';
import {useNavigate, useSearchParams} from 'react-router-dom';
import api from '../api.js';
import ExploreNav from '../components/ExploreNav.jsx';
import ThemeCard from '../components/ThemeCard.jsx';
import Button from '../components/ui/Button.jsx';
import {useUser} from '../UserContext.jsx';
import {exportCurrentTheme} from '../theme-utils.js';
import {detectTheme} from '../../lib/themes/themePersistance.js';
import styles from './Themes.module.css';

const SORTS = [
    {key: 'likes', label: 'Most liked'},
    {key: 'newest', label: 'Newest'},
    {key: 'downloads', label: 'Most downloaded'}
];
const normalizeThemeBrowseParams = params => {
    const next = new URLSearchParams(params);
    if (next.get('tab') !== 'publish') next.delete('tab');
    const requestedSort = next.get('sort');
    if (!SORTS.some(item => item.key === requestedSort) || requestedSort === 'likes') next.delete('sort');
    return next;
};
const themeVisual = theme => theme.visual || theme.theme || {};
const filterThemes = (items, {appearance = 'all', blocks = 'all', query = ''} = {}) => {
    const needle = query.trim().toLowerCase();
    return items.filter(item => {
        const visual = themeVisual(item);
        if (appearance !== 'all' && visual.gui !== appearance) return false;
        if (blocks !== 'all' && visual.blocks !== blocks) return false;
        return !needle || [item.name, item.description, item.owner]
            .some(value => String(value || '').toLowerCase().includes(needle));
    });
};

const Themes = () => {
    const {user, login} = useUser();
    const navigate = useNavigate();
    const [params, setParams] = useSearchParams();
    const tab = params.get('tab') === 'publish' ? 'publish' : 'browse';
    const requestedSort = params.get('sort') || 'likes';
    const sort = SORTS.some(item => item.key === requestedSort) ? requestedSort : 'likes';
    const [themes, setThemes] = useState([]);
    const [query, setQuery] = useState(params.get('q') || '');
    const [loading, setLoading] = useState(true);
    const [browseError, setBrowseError] = useState('');
    const [publishError, setPublishError] = useState('');
    const [loadAttempt, setLoadAttempt] = useState(0);
    const [publishing, setPublishing] = useState(false);
    const [source, setSource] = useState('current');
    const [themeFile, setThemeFile] = useState(null);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const publishInFlight = useRef(false);
    const mounted = useRef(true);
    const fileReadSequence = useRef(0);
    const releasePublish = () => {
        publishInFlight.current = false;
    };

    useEffect(() => () => {
        mounted.current = false;
    }, []);

    useEffect(() => {
        const normalized = normalizeThemeBrowseParams(params);
        if (normalized.toString() !== params.toString()) setParams(normalized, {replace: true});
    }, [params, setParams]);

    useEffect(() => {
        let active = true;
        setLoading(true);
        setBrowseError('');
        setThemes([]);
        api.themes({sort}).then(all => {
            if (!active) return;
            setThemes(all.themes || []);
        }).catch(requestError => {
            if (active) setBrowseError(requestError.message || 'Could not load themes.');
        }).finally(() => active && setLoading(false));
        return () => {
            active = false;
        };
    }, [loadAttempt, sort]);

    useEffect(() => setQuery(params.get('q') || ''), [params]);

    const visible = useMemo(() => filterThemes(themes, {query}), [query, themes]);

    const setTab = nextTab => {
        const next = new URLSearchParams(params);
        if (nextTab === 'browse') next.delete('tab');
        else next.set('tab', nextTab);
        setParams(next);
    };
    const setSort = nextSort => {
        const next = new URLSearchParams(params);
        if (nextSort === 'likes') next.delete('sort');
        else next.set('sort', nextSort);
        setParams(next);
    };
    const selectSource = nextSource => {
        fileReadSequence.current += 1;
        setSource(nextSource);
        setPublishError('');
    };
    const setSearch = value => {
        setQuery(value);
        const next = new URLSearchParams(params);
        if (value) next.set('q', value);
        else next.delete('q');
        setParams(next, {replace: true});
    };
    const readThemeFile = async file => {
        const sequence = fileReadSequence.current + 1;
        fileReadSequence.current = sequence;
        if (!file) {
            setThemeFile(null);
            return;
        }
        try {
            const parsed = JSON.parse(await file.text());
            if (fileReadSequence.current !== sequence) return;
            const config = Array.isArray(parsed.themes) ? parsed.themes[0] : parsed;
            setThemeFile(config);
            if (!name && config?.name) setName(config.name.slice(0, 100));
            if (!description && config?.description) setDescription(config.description.slice(0, 500));
            setPublishError('');
        } catch (parseError) {
            if (fileReadSequence.current !== sequence) return;
            setThemeFile(null);
            setPublishError('That file is not valid MistWarp theme JSON.');
        }
    };
    const publish = async event => {
        event.preventDefault();
        if (publishInFlight.current) return;
        const config = source === 'file' ? themeFile : exportCurrentTheme(detectTheme());
        if (!config) {
            setPublishError('Choose a MistWarp theme JSON file.');
            return;
        }
        publishInFlight.current = true;
        setPublishing(true);
        setPublishError('');
        try {
            const created = await api.createTheme({
                name: name.trim() || config.name || 'Untitled theme',
                description: description.trim(),
                theme: config
            });
            if (mounted.current) navigate(`/themes/${encodeURIComponent(created.theme.id)}`);
        } catch (requestError) {
            if (mounted.current) setPublishError(requestError.message || 'Could not publish this theme.');
        } finally {
            releasePublish();
            if (mounted.current) setPublishing(false);
        }
    };

    return (
        <main className={styles.page}>
            <ExploreNav active="themes" />
            <header className={styles.hero}>
                <div><h1>{tab === 'publish' ? 'Publish a theme' : 'Themes'}</h1><p>{tab === 'publish' ? 'Share your current look with the WarpTheme community.' : 'Discover community-made looks for MistWarp.'}</p></div>
                {tab === 'publish' ? (
                    <Button variant="secondary" onClick={() => setTab('browse')}><ArrowLeft size={16} /> Browse themes</Button>
                ) : (
                    <Button variant="primary" onClick={() => (user ? setTab('publish') : login())}><Plus size={16} /> Publish</Button>
                )}
            </header>
            {tab === 'browse' ? (
                <React.Fragment>
                    <div className={styles.tools}>
                        <div className={styles.search}><Search size={17} /><input aria-label="Search themes" placeholder="Search by theme or creator" type="search" value={query} onChange={event => setSearch(event.target.value)} /></div>
                        <select aria-label="Sort themes" value={sort} onChange={event => setSort(event.target.value)}>{SORTS.map(item => <option key={item.key} value={item.key}>{item.label}</option>)}</select>
                        <span className={styles.resultCount}>{loading ? 'Loading…' : browseError ? 'Unavailable' : `${visible.length} ${visible.length === 1 ? 'theme' : 'themes'}`}</span>
                    </div>
                    {loading ? <p className={styles.status}>Loading themes…</p> : browseError ? (
                        <div className={styles.empty} role="alert">
                            <h2>Could not load themes</h2>
                            <p>{browseError}</p>
                            <Button variant="secondary" onClick={() => setLoadAttempt(value => value + 1)}>Try again</Button>
                        </div>
                    ) : visible.length ? <div className={styles.grid}>{visible.map(item => <ThemeCard key={item.id} returnLabel="All themes" theme={item} />)}</div> : <div className={styles.empty}><Search size={26} /><h2>No themes found</h2><p>Try a broader search.</p></div>}
                </React.Fragment>
            ) : user ? (
                <form className={styles.publish} onSubmit={publish}>
                    {publishError ? <p className={styles.error} role="alert">{publishError}</p> : null}
                    <div className={styles.publishIntro}><div><h2>Publish a theme</h2><p>WarpTheme builds the marketplace preview from your theme colours.</p></div><Upload size={24} /></div>
                    <div className={styles.sourceRow}>
                        <button className={source === 'current' ? styles.sourceActive : styles.source} onClick={() => selectSource('current')} type="button"><Palette size={19} /><span><strong>Current theme</strong><small>Use the look you have applied now</small></span></button>
                        <button className={source === 'file' ? styles.sourceActive : styles.source} onClick={() => selectSource('file')} type="button"><FileJson size={19} /><span><strong>Theme JSON</strong><small>Upload a MistWarp theme export</small></span></button>
                    </div>
                    <label>Name<input maxLength="100" required value={name} onChange={event => setName(event.target.value)} /></label>
                    <label>Description<textarea maxLength="500" value={description} onChange={event => setDescription(event.target.value)} /></label>
                    {source === 'file' ? <label>Theme JSON<input accept="application/json,.json" required type="file" onChange={event => readThemeFile(event.target.files[0])} /></label> : null}
                    <Button busy={publishing} busyLabel="Publishing…" type="submit" variant="primary"><Upload size={16} /> Publish theme</Button>
                </form>
            ) : <div className={styles.gate}><LogIn size={28} /><h2>Sign in to publish</h2><p>Publishing uses your Rotur account on WarpTheme.</p><Button onClick={login}>Sign in with Rotur</Button></div>}
        </main>
    );
};

export {filterThemes, normalizeThemeBrowseParams};
export default Themes;
