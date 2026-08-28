import PropTypes from 'prop-types';
import React, {useEffect, useState} from 'react';
import {Check, ExternalLink, Palette, Settings, Trash2} from 'lucide-react';
import {Link, useSearchParams} from 'react-router-dom';
import api from '../api.js';
import {customThemeManager} from '../../lib/themes/custom-themes.js';
import {applyTheme, detectTheme, THEME_CHANGE_EVENT} from '../../lib/themes/themePersistance.js';
import Button from './ui/Button.jsx';
import IconButton from './ui/IconButton.jsx';
import Modal from './ui/Modal.jsx';
import SectionTabs from './SectionTabs.jsx';
import ThemeCard from './ThemeCard.jsx';
import ThemePreview from './ThemePreview.jsx';
import styles from '../pages/MyStuff.module.css';

const VIEWS = [
    {key: 'library', label: 'Local library'},
    {key: 'published', label: 'Published on WarpTheme'}
];

const previewTheme = theme => {
    try {
        return {name: theme.name, visual: theme.export()};
    } catch (error) {
        return {name: theme.name, visual: theme};
    }
};

const activeLocalThemeId = themes => {
    try {
        const current = detectTheme();
        return themes.some(theme => theme.uuid === current?.uuid) ? current.uuid : '';
    } catch (error) {
        return '';
    }
};

const storedCustomThemeId = () => {
    try {
        const stored = JSON.parse(localStorage.getItem('tw:theme') || '{}');
        return stored.isCustom ? stored.customThemeUuid || '' : '';
    } catch (error) {
        return '';
    }
};

const MyStuffThemes = ({username}) => {
    const [params, setParams] = useSearchParams();
    const view = params.get('themeView') === 'published' ? 'published' : 'library';
    const [localThemes, setLocalThemes] = useState(() => customThemeManager.getAllThemes());
    const [published, setPublished] = useState(null);
    const [publishedError, setPublishedError] = useState(false);
    const [applied, setApplied] = useState(() => activeLocalThemeId(customThemeManager.getAllThemes()));
    const [attempt, setAttempt] = useState(0);
    const [removeTheme, setRemoveTheme] = useState(null);
    const [removeError, setRemoveError] = useState('');

    useEffect(() => {
        const requestedView = params.get('themeView');
        if (requestedView && requestedView !== 'published') {
            const next = new URLSearchParams(params);
            next.delete('themeView');
            setParams(next, {replace: true});
        }
    }, [params, setParams]);

    useEffect(() => {
        const syncThemes = () => {
            const themes = customThemeManager.getAllThemes();
            const missingStoredTheme = storedCustomThemeId() &&
                !themes.some(theme => theme.uuid === storedCustomThemeId());
            if (missingStoredTheme) applyTheme(detectTheme());
            setLocalThemes(themes);
            setApplied(activeLocalThemeId(themes));
        };
        const unsubscribe = customThemeManager.subscribe(syncThemes);
        window.addEventListener(THEME_CHANGE_EVENT, syncThemes);
        return () => {
            unsubscribe();
            window.removeEventListener(THEME_CHANGE_EVENT, syncThemes);
        };
    }, []);

    useEffect(() => {
        if (view !== 'published') return;
        let active = true;
        setPublished(null);
        setPublishedError(false);
        api.themes({owner: username, sort: 'newest'})
            .then(data => {
                if (active) setPublished(data.themes || []);
            })
            .catch(() => {
                if (active) setPublishedError(true);
            });
        return () => {
            active = false;
        };
    }, [attempt, username, view]);

    const applyLocalTheme = theme => {
        applyTheme(theme);
        setApplied(theme.uuid);
    };
    const setView = nextView => {
        const next = new URLSearchParams(params);
        if (nextView === 'published') next.set('themeView', 'published');
        else next.delete('themeView');
        setParams(next);
    };
    const confirmRemove = () => {
        try {
            customThemeManager.removeTheme(removeTheme.uuid);
            setRemoveTheme(null);
            setRemoveError('');
        } catch (error) {
            setRemoveError(error.message || 'Could not remove this theme.');
        }
    };

    return (
        <section className={styles.themePanel}>
            <header className={styles.themeHeader}>
                <div>
                    <h1>Themes</h1>
                    <p>Your saved themes live here. Discover more on WarpTheme.</p>
                </div>
                <div className={styles.themeHeaderActions}>
                    <Link className={styles.themeBrowseLink} to="/settings?section=theme&tab=custom">
                        <Settings size={14} /> Edit library
                    </Link>
                    <Link className={styles.themeBrowseLink} to="/themes">
                        Browse themes <ExternalLink size={14} />
                    </Link>
                </div>
            </header>
            <SectionTabs
                items={VIEWS}
                value={view}
                onChange={setView}
                className={styles.themeTabs}
                itemClassName={styles.themeTab}
                activeClassName={styles.themeTabActive}
                ariaLabel="Theme library sections"
            />
            {view === 'library' ? localThemes.length ? (
                <div className={styles.localThemeGrid}>
                    {localThemes.map(theme => (
                        <article className={styles.localThemeCard} key={theme.uuid}>
                            <ThemePreview className={styles.localThemePreview} theme={previewTheme(theme)} />
                            <div className={styles.localThemeBody}>
                                <div>
                                    <strong>{theme.name}</strong>
                                    <span>{theme.description || 'Saved on this device'}</span>
                                </div>
                                <div className={styles.localThemeActions}>
                                    <Button
                                        disabled={applied === theme.uuid}
                                        variant="primary"
                                        onClick={() => applyLocalTheme(theme)}
                                    >
                                        {applied === theme.uuid ? <Check size={15} /> : <Palette size={15} />}
                                        {applied === theme.uuid ? 'Applied' : 'Apply'}
                                    </Button>
                                    <IconButton
                                        className={styles.localThemeRemove}
                                        label={`Remove ${theme.name}`}
                                        variant="danger"
                                        onClick={() => {
                                            setRemoveError('');
                                            setRemoveTheme(theme);
                                        }}
                                    ><Trash2 size={15} /></IconButton>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            ) : (
                <div className={styles.themeEmpty}>
                    <Palette size={26} />
                    <strong>Your library is empty</strong>
                    <span>Save a theme from WarpTheme or create one in Theme settings.</span>
                    <div className={styles.themeEmptyActions}>
                        <Link to="/settings?section=theme&tab=custom&themeAction=create">Create a theme</Link>
                        <Link to="/themes">Browse themes</Link>
                    </div>
                </div>
            ) : publishedError ? (
                <div className={styles.themeEmpty} role="alert">
                    <strong>Could not load your published themes</strong>
                    <Button onClick={() => setAttempt(value => value + 1)}>Try again</Button>
                </div>
            ) : published === null ? (
                <p className={styles.status}>Loading published themes…</p>
            ) : published.length ? (
                <div className={styles.publishedThemeGrid}>
                    {published.map(theme => <ThemeCard key={theme.id} returnLabel="Your themes" theme={theme} />)}
                </div>
            ) : (
                <div className={styles.themeEmpty}>
                    <strong>You have not published a theme yet</strong>
                    <span>Share your current theme with the WarpTheme community.</span>
                    <Link to="/themes?tab=publish">Publish a theme</Link>
                </div>
            )}
            {removeTheme ? (
                <Modal
                    title="Remove saved theme?"
                    icon={Trash2}
                    onClose={() => setRemoveTheme(null)}
                    onDismiss={() => setRemoveTheme(null)}
                    actions={(
                        <React.Fragment>
                            <Button variant="secondary" onClick={() => setRemoveTheme(null)}>Cancel</Button>
                            <Button variant="danger" onClick={confirmRemove}>Remove theme</Button>
                        </React.Fragment>
                    )}
                >
                    <p>{applied === removeTheme.uuid ?
                        `"${removeTheme.name}" is active. Removing it will switch MistWarp to its fallback theme.` :
                        `"${removeTheme.name}" will be removed from this device.`}</p>
                    {removeError ? <p className={styles.error} role="alert">{removeError}</p> : null}
                </Modal>
            ) : null}
        </section>
    );
};

MyStuffThemes.propTypes = {
    username: PropTypes.string.isRequired
};

export {activeLocalThemeId, previewTheme, storedCustomThemeId};
export default MyStuffThemes;
