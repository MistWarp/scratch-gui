import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
import PropTypes from 'prop-types';
import React, {useEffect, useState} from 'react';
import {Check, ExternalLink, Palette, Plus, Settings, Trash2, Upload} from 'lucide-react';
import {Link, useSearchParams} from 'react-router-dom';
import api from '../api.js';
import {customThemeManager} from '../../lib/themes/custom-themes.js';
import {applyTheme, detectTheme, THEME_CHANGE_EVENT} from '../../lib/themes/themePersistance.js';
import Button from './ui/Button.jsx';
import CardGrid from './ui/CardGrid.jsx';
import ConfirmModal from './ui/ConfirmModal.jsx';
import EmptyState from './ui/EmptyState.jsx';
import IconButton from './ui/IconButton.jsx';
import SectionHeading from './ui/SectionHeading.jsx';
import StatusMessage from './ui/StatusMessage.jsx';
import UnderlineTabs from './UnderlineTabs.jsx';
import ThemeCard from './ThemeCard.jsx';
import ThemePreview from './ThemePreview.jsx';
import styles from '../pages/MyStuff.module.css';

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
    const {text: communityText} = useCommunityText();
    const [params, setParams] = useSearchParams();
    const view = params.get('themeView') === 'published' ? 'published' : 'library';
    const [localThemes, setLocalThemes] = useState(() => customThemeManager.getAllThemes());
    const [published, setPublished] = useState(null);
    const [publishedError, setPublishedError] = useState(false);
    const [applied, setApplied] = useState(() => activeLocalThemeId(customThemeManager.getAllThemes()));
    const [attempt, setAttempt] = useState(0);
    const [removeTheme, setRemoveTheme] = useState(null);
    const [removeError, setRemoveError] = useState('');
    const views = [
        {key: 'library', label: communityText('Local library')},
        {key: 'published', label: communityText('Published on WarpTheme')}
    ];

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
            setRemoveError(error.message || communityText('Could not remove this theme.'));
        }
    };

    let body;
    if (view === 'library') {
        body = localThemes.length ? (
            <CardGrid>
                {localThemes.map(theme => (
                    <article className={styles.localThemeCard} key={theme.uuid}>
                        <ThemePreview className={styles.localThemePreview} theme={previewTheme(theme)} />
                        <div className={styles.localThemeBody}>
                            <div>
                                <strong>{theme.name}</strong>
                                <span>{theme.description || communityText('Saved on this device')}</span>
                            </div>
                            <div className={styles.localThemeActions}>
                                <Button
                                    disabled={applied === theme.uuid}
                                    variant="primary"
                                    onClick={() => applyLocalTheme(theme)}
                                >
                                    {applied === theme.uuid ? <Check size={15} /> : <Palette size={15} />}
                                    {applied === theme.uuid ? communityText('Applied') : communityText('Apply')}
                                </Button>
                                <IconButton
                                    className={styles.localThemeRemove}
                                    label={communityText('Remove {value1}', {value1: theme.name})}
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
            </CardGrid>
        ) : (
            <EmptyState
                compact
                icon={Palette}
                title={communityText('Your library is empty')}
                action={(
                    <React.Fragment>
                        <Button as={Link} variant="primary" to="/settings?section=theme&tab=custom&themeAction=create">
                            <Plus size={15} />
                            {communityText('Create a theme')}
                        </Button>
                        <Button as={Link} to="/themes">{communityText('Browse themes')}</Button>
                    </React.Fragment>
                )}
            >
                {communityText('Save a theme from WarpTheme or create one in Theme settings.')}
            </EmptyState>
        );
    } else if (publishedError) {
        body = (
            <StatusMessage compact error onRetry={() => setAttempt(value => value + 1)}>
                {communityText('Could not load your published themes.')}
            </StatusMessage>
        );
    } else if (published === null) {
        body = <StatusMessage compact>{communityText('Loading published themes…')}</StatusMessage>;
    } else if (published.length) {
        body = (
            <CardGrid>
                {published.map(theme => (
                    <ThemeCard key={theme.id} returnLabel={communityText('Your themes')} theme={theme} />
                ))}
            </CardGrid>
        );
    } else {
        body = (
            <EmptyState
                compact
                icon={Upload}
                title={communityText('You have not published a theme yet')}
                action={(
                    <Button as={Link} variant="primary" to="/themes?tab=publish">
                        <Upload size={15} />
                        {communityText('Publish a theme')}
                    </Button>
                )}
            >
                {communityText('Share your current theme with the WarpTheme community.')}
            </EmptyState>
        );
    }

    return (
        <section className={styles.themePanel}>
            <SectionHeading
                icon={Palette}
                title={communityText('Themes')}
                lead={communityText('Your saved themes live here. Discover more on WarpTheme.')}
                actions={(
                    <React.Fragment>
                        <Link className={styles.themeBrowseLink} to="/settings?section=theme&tab=custom">
                            <Settings size={14} />
                            {communityText('Edit library')}
                        </Link>
                        <Link className={styles.themeBrowseLink} to="/themes">
                            {communityText('Browse themes')}
                            <ExternalLink size={14} />
                        </Link>
                    </React.Fragment>
                )}
            />
            <UnderlineTabs
                items={views}
                value={view}
                onChange={setView}
                className={styles.themeTabs}
                ariaLabel={communityText('Theme library sections')}
            />
            {body}
            {removeTheme ? (
                <ConfirmModal
                    destructive
                    icon={Trash2}
                    title={communityText('Remove saved theme?')}
                    confirmLabel={communityText('Remove theme')}
                    error={removeError}
                    onConfirm={confirmRemove}
                    onCancel={() => setRemoveTheme(null)}
                >
                    {applied === removeTheme.uuid ?
                        communityText('"{value1}" is active. Removing it will switch MistWarp to its fallback theme.', {
                            value1: removeTheme.name
                        }) :
                        communityText('"{value1}" will be removed from this device.', {value1: removeTheme.name})}
                </ConfirmModal>
            ) : null}
        </section>
    );
};

MyStuffThemes.propTypes = {
    username: PropTypes.string.isRequired
};

export {activeLocalThemeId, previewTheme, storedCustomThemeId};
export default MyStuffThemes;
