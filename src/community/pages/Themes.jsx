import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
/* eslint-disable react/jsx-no-bind, max-len */
import React, {useEffect, useMemo, useRef, useState} from 'react';
import {ArrowLeft, FileJson, Palette, Plus, Search, Upload} from 'lucide-react';
import {useNavigate, useSearchParams} from 'react-router-dom';
import api from '../api.js';
import ExploreNav from '../components/ExploreNav.jsx';
import ThemeCard from '../components/ThemeCard.jsx';
import Button from '../components/ui/Button.jsx';
import CardGrid from '../components/ui/CardGrid.jsx';
import EmptyState, {SignInPrompt} from '../components/ui/EmptyState.jsx';
import Notice from '../components/ui/Notice.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import SectionHeading from '../components/ui/SectionHeading.jsx';
import SelectMenu from '../components/ui/SelectMenu.jsx';
import StatusMessage from '../components/ui/StatusMessage.jsx';
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
    const {text: communityText} = useCommunityText();
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
            if (active) setBrowseError(requestError.message || communityText('Could not load themes.'));
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
            setPublishError(communityText('That file is not valid MistWarp theme JSON.'));
        }
    };
    const publish = async event => {
        event.preventDefault();
        if (publishInFlight.current) return;
        const config = source === 'file' ? themeFile : exportCurrentTheme(detectTheme());
        if (!config) {
            setPublishError(communityText('Choose a MistWarp theme JSON file.'));
            return;
        }
        publishInFlight.current = true;
        setPublishing(true);
        setPublishError('');
        try {
            const created = await api.createTheme({
                name: name.trim() || config.name || communityText('Untitled theme'),
                description: description.trim(),
                theme: config
            });
            if (mounted.current) navigate(`/themes/${encodeURIComponent(created.theme.id)}`);
        } catch (requestError) {
            if (mounted.current) setPublishError(requestError.message || communityText('Could not publish this theme.'));
        } finally {
            releasePublish();
            if (mounted.current) setPublishing(false);
        }
    };

    return (
        <main className={styles.page}>
            <ExploreNav active="themes" />
            <PageHeader
                icon={tab === 'publish' ? Upload : Palette}
                title={tab === 'publish' ? communityText('Publish a theme') : communityText('Themes')}
                lead={tab === 'publish' ? communityText('Share your current look with the WarpTheme community.') : communityText('Discover community-made looks for MistWarp.')}
                actions={tab === 'publish' ? (
                    <Button variant="secondary" onClick={() => setTab('browse')}><ArrowLeft size={16} />{communityText('Browse themes')}</Button>
                ) : (
                    <Button variant="primary" onClick={() => (user ? setTab('publish') : login())}><Plus size={16} />{communityText('Publish')}</Button>
                )}
            >
                {tab === 'browse' ? (
                    <div className={styles.tools}>
                        <div className={styles.search}><Search size={17} /><input aria-label={communityText('Search themes')} placeholder={communityText('Search by theme or creator')} type="search" value={query} onChange={event => setSearch(event.target.value)} /></div>
                        <SelectMenu
                            ariaLabel={communityText('Sort themes')}
                            value={sort}
                            onChange={setSort}
                            options={SORTS.map(item => ({value: item.key, label: communityText(item.label)}))}
                        />
                        <span className={styles.resultCount}>{loading ? communityText('Loading…') : browseError ? communityText('Unavailable') : communityText('{count, plural, one {# theme} other {# themes}}', {count: visible.length})}</span>
                    </div>
                ) : null}
            </PageHeader>
            {tab === 'browse' ? (
                loading ? <StatusMessage>{communityText('Loading themes…')}</StatusMessage> : browseError ? (
                    <StatusMessage error onRetry={() => setLoadAttempt(value => value + 1)}>{browseError}</StatusMessage>
                ) : visible.length ? (
                    <CardGrid>{visible.map(item => <ThemeCard key={item.id} returnLabel="All themes" theme={item} />)}</CardGrid>
                ) : (
                    <EmptyState icon={Search} title={communityText('No themes found')}>{communityText('Try a broader search.')}</EmptyState>
                )
            ) : user ? (
                <form className={styles.publish} onSubmit={publish}>
                    {publishError ? <Notice variant="error">{publishError}</Notice> : null}
                    <SectionHeading icon={Upload} title={communityText('Publish a theme')} lead={communityText('WarpTheme builds the marketplace preview from your theme colours.')} />
                    <div className={styles.sourceRow}>
                        <button className={source === 'current' ? styles.sourceActive : styles.source} onClick={() => selectSource('current')} type="button"><Palette size={19} /><span><strong>{communityText('Current theme')}</strong><small>{communityText('Use the look you have applied now')}</small></span></button>
                        <button className={source === 'file' ? styles.sourceActive : styles.source} onClick={() => selectSource('file')} type="button"><FileJson size={19} /><span><strong>{communityText('Theme JSON')}</strong><small>{communityText('Upload a MistWarp theme export')}</small></span></button>
                    </div>
                    <label>{communityText('Name')}<input maxLength="100" required value={name} onChange={event => setName(event.target.value)} /></label>
                    <label>{communityText('Description')}<textarea maxLength="500" value={description} onChange={event => setDescription(event.target.value)} /></label>
                    {source === 'file' ? <label>{communityText('Theme JSON')}<input accept="application/json,.json" required type="file" onChange={event => readThemeFile(event.target.files[0])} /></label> : null}
                    <Button busy={publishing} busyLabel={communityText('Publishing…')} type="submit" variant="primary"><Upload size={16} />{communityText('Publish theme')}</Button>
                </form>
            ) : (
                <SignInPrompt onSignIn={login} title={communityText('Sign in to publish')}>
                    {communityText('Publishing uses your Rotur account on WarpTheme.')}
                </SignInPrompt>
            )}
        </main>
    );
};

export {filterThemes, normalizeThemeBrowseParams};
export default Themes;
