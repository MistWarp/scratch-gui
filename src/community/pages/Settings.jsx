/* eslint-disable max-len */
import React, {useState, useEffect, useRef} from 'react';
import {Link, useNavigate, useSearchParams} from 'react-router-dom';
import {Palette, Radio, User, Bell, Eye, Shield, Database, Trash2} from 'lucide-react';
import {applyTheme, detectTheme} from '../../lib/themes/themePersistance.js';
import {ThemeAccentPanel} from '../../components/tw-settings-modal/theme-accent-panel.jsx';
import CustomThemesPage from '../../components/tw-settings-modal/custom-themes-page.jsx';
import Sidebar from '../components/Sidebar.jsx';
import SectionTabs from '../components/SectionTabs.jsx';
import Modal from '../components/ui/Modal.jsx';
import Button from '../components/ui/Button.jsx';
import {Switch, SwitchRow} from '../components/ui/Switch.jsx';
import {useUser} from '../UserContext.jsx';
import {
    getUsernameOverride,
    setUsernameOverride,
    notifyLocalChange
} from '../../lib/rotur/cloud-sync.js';
import {
    getAccentMenuBar,
    setAccentMenuBar,
    getMenuBarText,
    setMenuBarText,
    MENU_BAR_TEXT_OPTIONS
} from '../../lib/themes/menu-bar-accent.js';
import {getRoturSettings, updateRoturSettings} from '../../lib/rotur/settings.js';
import {readActivityGrants, writeActivityGrants} from '../../lib/rotur/extension-bridge.js';
import {presenceSupported} from '../../lib/rotur/client.js';
import styles from './Settings.module.css';
import {getNotificationPreferences, setNotificationPreferences} from '../notification-preferences';
import api from '../api';
import {analyticsEnabled, setAnalyticsEnabled} from '../analytics.js';
import {LOCALES, useCommunityIntl} from '../i18n.jsx';
import downloadBlob from '../../lib/utils/download-blob.js';

const PRESENCE_LABELS = {
    presenceEnabled: 'Share editor presence',
    includeEditDuration: 'Include edit duration'
};
const ACTIVITY_SHARING_OPTIONS = [
    {value: 'ask', label: 'Ask each project'},
    {value: 'all', label: 'Always allow'},
    {value: 'off', label: 'Never'}
];
const NOTIFICATION_SETTINGS = [
    ['social', 'Comments, mentions, follows, and reactions'],
    ['projects', 'Remixes, contributions, feedback, and spaces'],
    ['economy', 'Purchases, donations, and items'],
    ['system', 'Moderation, reports, and announcements']
];

const PROJECT_THEME_MODE_KEY = 'mw:project-theme-mode';
const PROJECT_THEME_MODES = [
    {value: 'all', label: 'All projects'},
    {value: 'followed', label: 'Only creators I follow'},
    {value: 'hearted', label: 'Only projects I have hearted'},
    {value: 'none', label: 'Never'}
];
const THEME_TABS = [
    {key: 'appearance', label: 'Appearance'},
    {key: 'projects', label: 'Projects'},
    {key: 'custom', label: 'Custom'}
];
const DATA_TABS = [
    {key: 'account', label: 'Account data'},
    {key: 'games', label: 'Games'}
];
const CUSTOM_THEME_ACTIONS = new Set(['create', 'import']);
const getProjectThemeMode = () => {
    try {
        const value = localStorage.getItem(PROJECT_THEME_MODE_KEY);
        return PROJECT_THEME_MODES.some(mode => mode.value === value) ? value : 'all';
    } catch (e) {
        return 'all';
    }
};
const matchesDeleteConfirmation = (value, username) => (
    String(value).trim().toLowerCase() === String(username).toLowerCase()
);

const SECTIONS = [
    {key: 'theme', label: 'Theme', icon: Palette},
    {key: 'presence', label: 'Presence', icon: Radio},
    {key: 'notifications', label: 'Notifications', icon: Bell},
    {key: 'privacy', label: 'Privacy', icon: Eye},
    {key: 'safety', label: 'Safety', icon: Shield},
    {key: 'data', label: 'Your data', icon: Database},
    {key: 'identity', label: 'Identity', icon: User}
];
const settingsSection = value => {
    if (SECTIONS.some(section => section.key === value)) return value;
    return SECTIONS[0].key;
};
const settingsThemeTab = value => {
    if (THEME_TABS.some(tab => tab.key === value)) return value;
    return THEME_TABS[0].key;
};
const settingsDataTab = value => {
    if (DATA_TABS.some(tab => tab.key === value)) return value;
    return DATA_TABS[0].key;
};
const normalizeSettingsParams = params => {
    const next = new URLSearchParams(params);
    const section = settingsSection(next.get('section'));
    if (section === SECTIONS[0].key) next.delete('section');
    else next.set('section', section);
    if (section === 'theme') {
        const tab = settingsThemeTab(next.get('tab'));
        if (tab === THEME_TABS[0].key) next.delete('tab');
        else next.set('tab', tab);
        if (tab !== 'custom' || !CUSTOM_THEME_ACTIONS.has(next.get('themeAction'))) next.delete('themeAction');
    } else if (section === 'data') {
        const tab = settingsDataTab(next.get('tab'));
        if (tab === DATA_TABS[0].key) next.delete('tab');
        else next.set('tab', tab);
        next.delete('themeAction');
    } else {
        next.delete('tab');
        next.delete('themeAction');
    }
    return next;
};
const settingsParamsForSection = (params, section) => {
    const next = new URLSearchParams(params);
    next.delete('tab');
    next.delete('themeAction');
    if (section === SECTIONS[0].key) next.delete('section');
    else next.set('section', section);
    return next;
};
const settingsLoadState = (loading, error) => (loading ? 'loading' : (error ? 'error' : 'ready'));

const Settings = () => {
    const {user, login, loginOrThrow, logout} = useUser();
    const viewerName = (user && user.username) || '';
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const {preference: localePreference, setPreference: setLocalePreference, t} = useCommunityIntl();
    const [theme, setTheme] = useState(detectTheme());
    const [username, setUsername] = useState(getUsernameOverride() || '');
    const [accentMenuBar, setAccentMenuBarState] = useState(getAccentMenuBar());
    const [menuBarText, setMenuBarTextState] = useState(getMenuBarText());
    const [presence, setPresence] = useState(getRoturSettings());
    const [activityGrantCount, setActivityGrantCount] = useState(
        () => Object.keys(readActivityGrants()).length
    );
    const [projectThemeMode, setProjectThemeMode] = useState(getProjectThemeMode());
    const activeSection = settingsSection(searchParams.get('section'));
    const themeTab = settingsThemeTab(searchParams.get('tab'));
    const dataTab = settingsDataTab(searchParams.get('tab'));
    const [presenceOk, setPresenceOk] = useState(true);
    const [presenceBusy, setPresenceBusy] = useState(false);
    const [notificationPreferences, setNotificationPreferencesState] = useState(getNotificationPreferences());
    const [safety, setSafety] = useState({blocked: [], muted: []});
    const [safetyError, setSafetyError] = useState('');
    const [safetyBusy, setSafetyBusy] = useState('');
    const [safetyAttempt, setSafetyAttempt] = useState(0);
    const [dataStatus, setDataStatus] = useState('');
    const [dataBusy, setDataBusy] = useState('');
    const [gameSaves, setGameSaves] = useState([]);
    const [globalGameData, setGlobalGameData] = useState(null);
    const [portableItems, setPortableItems] = useState([]);
    const [gameDataError, setGameDataError] = useState('');
    const [gameDataAttempt, setGameDataAttempt] = useState(0);
    const [saveToDelete, setSaveToDelete] = useState(null);
    const [deleteConfirmation, setDeleteConfirmation] = useState('');
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [shareAnalytics, setShareAnalytics] = useState(analyticsEnabled());
    const [showRecentActivity, setShowRecentActivity] = useState(true);
    const [privacyBusy, setPrivacyBusy] = useState(false);
    const [privacyStatus, setPrivacyStatus] = useState('');
    const [privacyLoadError, setPrivacyLoadError] = useState(false);
    const [privacyAttempt, setPrivacyAttempt] = useState(0);
    const gameDataState = settingsLoadState(dataBusy === 'game-load', gameDataError);
    const dataContext = useRef((user && user.username) || '');
    dataContext.current = (user && user.username) || '';
    const safetyContext = useRef((user && user.username) || '');
    safetyContext.current = (user && user.username) || '';
    const actionLocks = useRef(new Set());

    useEffect(() => {
        const normalized = normalizeSettingsParams(searchParams);
        if (normalized.toString() !== searchParams.toString()) {
            setSearchParams(normalized, {replace: true});
        }
    }, [searchParams, setSearchParams]);

    useEffect(() => {
        setDataStatus('');
        setDataBusy('');
        setDeleteConfirmation('');
        setDeleteModalOpen(false);
        setGameSaves([]);
        setGlobalGameData(null);
        setPortableItems([]);
        setGameDataError('');
        setSaveToDelete(null);
    }, [user]);

    const setActiveSection = section => {
        setSearchParams(settingsParamsForSection(searchParams, section));
    };
    const setThemeTab = tab => {
        const next = new URLSearchParams(searchParams);
        next.delete('themeAction');
        if (tab === THEME_TABS[0].key) next.delete('tab');
        else next.set('tab', tab);
        setSearchParams(next);
    };
    const setDataTab = tab => {
        const next = new URLSearchParams(searchParams);
        next.delete('themeAction');
        if (tab === DATA_TABS[0].key) next.delete('tab');
        else next.set('tab', tab);
        setSearchParams(next);
    };
    const setCustomThemeTab = tab => {
        const next = new URLSearchParams(searchParams);
        if (tab === 'library') next.delete('themeAction');
        else next.set('themeAction', tab);
        if (next.toString() !== searchParams.toString()) setSearchParams(next);
    };

    useEffect(() => {
        if (!viewerName || activeSection !== 'data' || dataTab !== 'games') return () => {};
        let cancelled = false;
        setGameDataError('');
        setDataBusy('game-load');
        setGameSaves([]);
        setGlobalGameData(null);
        setPortableItems([]);
        Promise.all([api.gameSaves(), api.globalGameData(), api.gameInventory()])
            .then(([savesResult, globalResult, inventoryResult]) => {
                if (cancelled) return;
                setGameSaves(savesResult.saves || []);
                setGlobalGameData(globalResult.data || {revision: 0, value: {}, updatedAt: 0});
                setPortableItems((inventoryResult.inventory && inventoryResult.inventory.items) || []);
            })
            .catch(e => {
                if (!cancelled) setGameDataError(e.message || 'Could not load game data.');
            })
            .finally(() => {
                if (!cancelled) setDataBusy('');
            });
        return () => {
            cancelled = true;
        };
    }, [activeSection, dataTab, gameDataAttempt, viewerName]);

    useEffect(() => {
        setSafetyError('');
        setSafetyBusy('');
        setSafety({blocked: [], muted: []});
        if (!viewerName) {
            return () => {};
        }
        let cancelled = false;
        api.safety()
            .then(data => {
                if (!cancelled) setSafety({blocked: data.blocked || [], muted: data.muted || []});
            })
            .catch(() => {
                if (!cancelled) setSafetyError('Could not load your safety settings.');
            });
        return () => {
            cancelled = true;
        };
    }, [safetyAttempt, viewerName]);

    useEffect(() => {
        setPrivacyStatus('');
        setPrivacyLoadError(false);
        setPrivacyBusy(false);
        setShowRecentActivity(true);
        if (!viewerName) {
            return () => {};
        }
        let cancelled = false;
        api.getUser(viewerName)
            .then(data => {
                if (!cancelled) setShowRecentActivity(data.recentActivityVisible !== false);
            })
            .catch(() => {
                if (!cancelled) {
                    setPrivacyLoadError(true);
                    setPrivacyStatus('Could not load your profile privacy settings.');
                }
            });
        return () => {
            cancelled = true;
        };
    }, [privacyAttempt, viewerName]);

    useEffect(() => {
        if (!user) {
            setPresenceOk(true);
            return;
        }
        let cancelled = false;
        presenceSupported().then(supported => {
            if (!cancelled) setPresenceOk(supported);
        });
        return () => {
            cancelled = true;
        };
    }, [user]);

    const reloginForPresence = async () => {
        const context = dataContext.current;
        const actionKey = `${context}\u0000presence-login`;
        if (actionLocks.current.has(actionKey)) return;
        actionLocks.current.add(actionKey);
        setPresenceBusy(true);
        try {
            await logout();
            await loginOrThrow();
        } catch (e) {
            // ignore
        } finally {
            actionLocks.current.delete(actionKey);
            setPresenceBusy(false);
        }
    };

    const changeProjectThemeMode = value => {
        setProjectThemeMode(value);
        try {
            localStorage.setItem(PROJECT_THEME_MODE_KEY, value);
        } catch (e) {
            // ignore
        }
    };

    useEffect(() => {
        setTheme(detectTheme());
        setUsername(getUsernameOverride() || '');
        setAccentMenuBarState(getAccentMenuBar());
        setMenuBarTextState(getMenuBarText());
        setPresence(getRoturSettings());
    }, [user]);

    const applyAndPersist = next => {
        applyTheme(next);
        setTheme(detectTheme());
    };

    const changeUsername = value => {
        setUsername(value);
        setUsernameOverride(value || null);
    };
    const changeAccentMenuBar = enabled => {
        setAccentMenuBar(enabled);
        setAccentMenuBarState(enabled);
        applyTheme(detectTheme());
    };
    const changeMenuBarText = value => {
        setMenuBarText(value);
        setMenuBarTextState(value);
        applyTheme(detectTheme());
    };
    const changePresence = (key, enabled) => {
        updateRoturSettings({[key]: enabled});
        setPresence(current => ({...current, [key]: enabled}));
    };
    const changeActivitySharing = value => {
        updateRoturSettings({activitySharing: value});
        setPresence(current => ({...current, activitySharing: value}));
    };
    const resetActivityGrants = () => {
        writeActivityGrants({});
        setActivityGrantCount(0);
    };
    const changeNotificationPreference = (key, enabled) => {
        const next = {...notificationPreferences, [key]: enabled};
        setNotificationPreferencesState(next);
        setNotificationPreferences(next);
        notifyLocalChange();
    };
    const changeAnalytics = enabled => {
        setAnalyticsEnabled(enabled);
        setShareAnalytics(enabled);
    };
    const changeRecentActivityPrivacy = async enabled => {
        if (!user || privacyBusy) return;
        const context = dataContext.current;
        setPrivacyBusy(true);
        setPrivacyStatus('');
        try {
            await api.updateProfile({showRecentActivity: enabled});
            if (dataContext.current === context) {
                setShowRecentActivity(enabled);
                setPrivacyStatus(enabled ? 'Recent activity is visible on your profile.' : 'Recent activity is hidden from other users.');
            }
        } catch (e) {
            if (dataContext.current === context) setPrivacyStatus(e.message || 'Could not update your privacy setting.');
        } finally {
            if (dataContext.current === context) setPrivacyBusy(false);
        }
    };
    const removeSafetyEntry = async (kind, name) => {
        const context = safetyContext.current;
        const actionKey = `${context}\u0000safety`;
        if (actionLocks.current.has(actionKey)) return;
        actionLocks.current.add(actionKey);
        setSafetyBusy(`${kind}:${name}`);
        setSafetyError('');
        try {
            const data = kind === 'blocked' ? await api.unblockUser(name) : await api.unmuteUser(name);
            if (safetyContext.current === context) {
                setSafety({blocked: data.blocked || [], muted: data.muted || []});
            }
        } catch (e) {
            if (safetyContext.current === context) {
                setSafetyError(e.message || 'Could not update your safety settings.');
            }
        } finally {
            actionLocks.current.delete(actionKey);
            if (safetyContext.current === context) setSafetyBusy('');
        }
    };
    const downloadData = async () => {
        if (!user) return;
        const usernameContext = dataContext.current;
        const actionKey = `${usernameContext}\u0000data`;
        if (actionLocks.current.has(actionKey)) return;
        actionLocks.current.add(actionKey);
        setDataBusy('export');
        setDataStatus('Preparing your export…');
        try {
            const data = await api.exportMyData();
            if (dataContext.current !== usernameContext) return;
            const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
            downloadBlob(`mistwarp-${usernameContext}-data.json`, blob);
            setDataStatus('Your export was downloaded.');
        } catch (e) {
            if (dataContext.current === usernameContext) setDataStatus(e.message || 'Could not export your data.');
        } finally {
            actionLocks.current.delete(actionKey);
            if (dataContext.current === usernameContext) setDataBusy('');
        }
    };
    const deleteData = async () => {
        if (!user || !matchesDeleteConfirmation(deleteConfirmation, user.username)) return;
        const usernameContext = dataContext.current;
        const confirmation = deleteConfirmation.trim();
        const actionKey = `${usernameContext}\u0000data`;
        if (actionLocks.current.has(actionKey)) return;
        actionLocks.current.add(actionKey);
        setDataBusy('delete');
        setDataStatus('Deleting your MistWarp data…');
        try {
            await api.deleteMyData(confirmation);
            if (dataContext.current !== usernameContext) return;
            try {
                await logout();
            } catch (e) {
                // The data deletion already succeeded. Reloading clears the local session state.
            }
            window.location.assign('/');
        } catch (e) {
            if (dataContext.current === usernameContext) setDataStatus(e.message || 'Could not delete your data.');
        } finally {
            actionLocks.current.delete(actionKey);
            if (dataContext.current === usernameContext) setDataBusy('');
        }
    };
    const openDeleteModal = () => {
        setDataStatus('');
        setDeleteModalOpen(true);
    };
    const closeDeleteModal = () => {
        if (dataBusy !== 'delete') setDeleteModalOpen(false);
    };
    const deleteGameSave = async () => {
        if (!saveToDelete) return;
        const projectId = saveToDelete.projectId;
        setDataBusy(`game-delete:${projectId}`);
        setGameDataError('');
        try {
            await api.deleteGameSave(projectId);
            setGameSaves(current => current.filter(save => save.projectId !== projectId));
            setSaveToDelete(null);
        } catch (e) {
            setGameDataError(e.message || 'Could not delete this game save.');
        } finally {
            setDataBusy('');
        }
    };
    return (
        <main className={styles.page}>
            <h1>Settings</h1>
            <p className={styles.lead}>
                These settings apply across all of MistWarp, including the editor and site.
            </p>

            <div className={styles.layout}>
                <Sidebar
                    sections={SECTIONS}
                    active={activeSection}
                    onChange={setActiveSection}
                    ariaLabel="Settings sections"
                />

                <div className={styles.content}>
                    {activeSection === 'theme' ? (
                        <section className={styles.card}>
                            <SectionTabs items={THEME_TABS} value={themeTab} onChange={setThemeTab} className={styles.themeTabs} itemClassName={styles.themeTab} activeClassName={styles.themeTabActive} ariaLabel="Theme sections" />
                            {themeTab === 'appearance' ? <div className={styles.themeContent}>
                                <ThemeAccentPanel theme={theme} onChangeTheme={applyAndPersist} />
                                <div className={styles.appearanceSection}>
                                    <h2>Menu bar</h2>
                                    <div className={styles.settingRows}>
                                        <SwitchRow
                                            checked={accentMenuBar}
                                            label="Accent-colored menu bar"
                                            onChange={changeAccentMenuBar}
                                        />
                                        <label className={styles.settingRow}>
                                            <span>Menu bar text</span>
                                            <select className={styles.select} value={menuBarText} onChange={event => changeMenuBarText(event.target.value)}>
                                                {MENU_BAR_TEXT_OPTIONS.map(option => <option key={option} value={option}>{option[0].toUpperCase() + option.slice(1)}</option>)}
                                            </select>
                                        </label>
                                    </div>
                                </div>
                            </div> : null}
                            {themeTab === 'projects' ? <div className={styles.themeContent}>
                                <h2>Project themes</h2>
                                <p className={styles.lead}>Some projects come with their own MistWarp theme. Choose when the player should switch to it.</p>
                                <label className={styles.field}>
                                    <span>Apply project themes for</span>
                                    <select className={styles.input} value={projectThemeMode} onChange={event => changeProjectThemeMode(event.target.value)}>
                                        {PROJECT_THEME_MODES.map(mode => <option key={mode.value} value={mode.value}>{mode.label}</option>)}
                                    </select>
                                </label>
                            </div> : null}
                            {themeTab === 'custom' ? <div className={styles.themeContent}>
                                <h2>Custom themes</h2>
                                <CustomThemesPage
                                    initialTab={searchParams.get('themeAction') || 'library'}
                                    theme={theme}
                                    onChangeTheme={applyAndPersist}
                                    onOpenThemeMarketplace={() => navigate('/themes')}
                                    onTabChange={setCustomThemeTab}
                                />
                            </div> : null}
                        </section>
                    ) : null}

                    {activeSection === 'presence' ? (
                        <section className={styles.card}>
                            <h2>Presence</h2>
                            {user && !presenceOk ? (
                                <div className={styles.risk}>
                                    {'Your current Rotur login is missing the '}
                                    <strong>{'account:profile'}</strong>
                                    {' permission, so your editor activity cannot be shared. '}
                                    {'Log in again to grant it.'}
                                    <div>
                                        <Button
                                            className={styles.riskAction}
                                            busy={presenceBusy}
                                            busyLabel="Logging in…"
                                            onClick={reloginForPresence}
                                        >
                                            {'Log in again'}
                                        </Button>
                                    </div>
                                </div>
                            ) : null}
                            <div className={styles.settingRows}>
                                {Object.entries(PRESENCE_LABELS).map(([key, label]) => (
                                    <SwitchRow
                                        key={key}
                                        checked={Boolean(presence[key])}
                                        label={label}
                                        onChange={value => changePresence(key, value)}
                                    />
                                ))}
                                <label className={styles.settingRow}>
                                    <span>Let projects show activity on your profile</span>
                                    <select
                                        className={styles.select}
                                        value={presence.activitySharing}
                                        onChange={event => changeActivitySharing(event.target.value)}
                                    >
                                        {ACTIVITY_SHARING_OPTIONS.map(option => (
                                            <option key={option.value} value={option.value}>{option.label}</option>
                                        ))}
                                    </select>
                                </label>
                            </div>
                            {activityGrantCount > 0 ? (
                                <Button onClick={resetActivityGrants}>
                                    Reset per-project choices ({activityGrantCount})
                                </Button>
                            ) : null}
                        </section>
                    ) : null}

                    {activeSection === 'notifications' ? (
                        <section className={styles.card}>
                            <h2>Notifications</h2>
                            <p className={styles.lead}>Hidden categories stay out of your notification list. Account and moderation messages remain available when you turn system messages back on.</p>
                            <div className={styles.settingRows}>
                                {NOTIFICATION_SETTINGS.map(([key, label]) => (
                                    <SwitchRow
                                        key={key}
                                        checked={Boolean(notificationPreferences[key])}
                                        label={label}
                                        onChange={value => changeNotificationPreference(key, value)}
                                    />
                                ))}
                            </div>
                        </section>
                    ) : null}

                    {activeSection === 'privacy' ? (
                        <section className={styles.card}>
                            <h2>Privacy</h2>
                            <p className={styles.lead}>Choose which MistWarp activity appears publicly on your profile.</p>
                            {!user ? <p className={styles.note}>Sign in to manage profile privacy.</p> : (
                                <div className={styles.settingRows}>
                                    <SwitchRow
                                        checked={showRecentActivity}
                                        disabled={privacyBusy}
                                        label="Show recent project activity"
                                        description="Display recently played public projects, total play time, and when you last played them."
                                        onChange={changeRecentActivityPrivacy}
                                    />
                                </div>
                            )}
                            {privacyStatus ? (
                                <p className={styles.note} aria-live="polite">
                                    {privacyStatus}{' '}
                                    {privacyLoadError ? (
                                        <Button onClick={() => setPrivacyAttempt(value => value + 1)}>Try again</Button>
                                    ) : null}
                                </p>
                            ) : null}
                        </section>
                    ) : null}

                    {activeSection === 'identity' ? (
                        <section className={styles.card}>
                            <h2>Identity</h2>
                            <p className={styles.lead}>Your Rotur username identifies your account. You can use a different name inside projects without renaming your account.</p>
                            <label
                                className={styles.field}
                                htmlFor="username-override"
                            >
                                <span>Project username</span>
                                <input
                                    id="username-override"
                                    className={styles.input}
                                    type="text"
                                    value={username}
                                    onChange={event => changeUsername(event.target.value)}
                                    placeholder="Use account username"
                                />
                                <small>Changes the value reported by the username block in projects. Leave this blank to use your Rotur username.</small>
                            </label>
                            <label className={styles.field} htmlFor="community-locale">
                                <span>{t('settings.language')}</span>
                                <select id="community-locale" className={styles.input} value={localePreference} onChange={event => setLocalePreference(event.target.value)}>
                                    {LOCALES.map(locale => <option value={locale.value} key={locale.value}>{locale.label}</option>)}
                                </select>
                                <small>{t('settings.languageHelp')}</small>
                            </label>
                        </section>
                    ) : null}

                    {activeSection === 'safety' ? (
                        <section className={styles.card}>
                            <h2>Safety</h2>
                            <p className={styles.lead}>Block or mute someone from their MistWarp profile. Blocking stops MistWarp comments and notifications between you. Muting only hides their MistWarp notifications.</p>
                            {!user ? <p className={styles.note}>Sign in to manage blocked and muted users.</p> : null}
                            {safetyError ? (
                                <p className={styles.error}>
                                    {safetyError}{' '}
                                    <Button onClick={() => setSafetyAttempt(value => value + 1)}>Try again</Button>
                                </p>
                            ) : null}
                            {user && !safetyError ? <div className={styles.safetyGroups}>
                                <div>
                                    <h3>Blocked users</h3>
                                    {safety.blocked.length ? safety.blocked.map(name => (
                                        <div className={styles.safetyRow} key={name}>
                                            <Link to={`/users/${name}`}>@{name}</Link>
                                            <Button
                                                busy={safetyBusy === `blocked:${name}`}
                                                busyLabel="Removing…"
                                                disabled={Boolean(safetyBusy)}
                                                onClick={() => removeSafetyEntry('blocked', name)}
                                            >
                                                Unblock
                                            </Button>
                                        </div>
                                    )) : <p className={styles.note}>You have not blocked anyone.</p>}
                                </div>
                                <div>
                                    <h3>Muted users</h3>
                                    {safety.muted.length ? safety.muted.map(name => (
                                        <div className={styles.safetyRow} key={name}>
                                            <Link to={`/users/${name}`}>@{name}</Link>
                                            <Button
                                                busy={safetyBusy === `muted:${name}`}
                                                busyLabel="Removing…"
                                                disabled={Boolean(safetyBusy)}
                                                onClick={() => removeSafetyEntry('muted', name)}
                                            >
                                                Unmute
                                            </Button>
                                        </div>
                                    )) : <p className={styles.note}>You have not muted anyone.</p>}
                                </div>
                            </div> : null}
                            <p className={styles.note}>For immediate safety concerns, <Link to="/support?topic=safety">contact MistWarp support</Link>.</p>
                        </section>
                    ) : null}

                    {activeSection === 'data' ? (
                        <section className={styles.card}>
                            <h2>Your MistWarp data</h2>
                            <p className={styles.lead}>These controls apply to MistWarp. Your Rotur account and Rotur data are managed separately on rotur.dev.</p>
                            <SectionTabs items={DATA_TABS} value={dataTab} onChange={setDataTab} className={styles.themeTabs} itemClassName={styles.themeTab} activeClassName={styles.themeTabActive} ariaLabel="Data sections" />
                            {dataTab === 'account' ? <React.Fragment>
                                <div className={styles.dataAction}>
                                    <div>
                                        <h3>{t('settings.analytics')}</h3>
                                        <p>{t('settings.analyticsHelp')}</p>
                                    </div>
                                    <Switch
                                        ariaLabel={t('settings.analytics')}
                                        checked={shareAnalytics}
                                        onChange={changeAnalytics}
                                    />
                                </div>
                                {!user ? (
                                    <Button className={styles.riskAction} onClick={login}>Sign in with Rotur</Button>
                                ) : (
                                    <React.Fragment>
                                        <div className={styles.dataAction}>
                                            <div>
                                                <h3>Download your data</h3>
                                                <p>Get a JSON copy of your MistWarp profile, project metadata, comments,
                                                    activity, settings, notifications, and safety list.</p>
                                            </div>
                                            <Button
                                                busy={dataBusy === 'export'}
                                                busyLabel="Preparing…"
                                                disabled={Boolean(dataBusy)}
                                                onClick={downloadData}
                                            >
                                                Download
                                            </Button>
                                        </div>
                                        <div className={styles.dangerZone}>
                                            <h3>Delete your MistWarp data</h3>
                                            <p>This deletes your MistWarp projects and profile data, anonymizes your public
                                                comments, and signs you out. Your Rotur account remains active, and signing
                                                in later creates a fresh MistWarp profile.</p>
                                            <label className={styles.field}>
                                                Type <strong>{user.username}</strong> to confirm
                                                <input
                                                    className={styles.input}
                                                    disabled={Boolean(dataBusy)}
                                                    value={deleteConfirmation}
                                                    onChange={event => setDeleteConfirmation(event.target.value)}
                                                />
                                            </label>
                                            <Button
                                                variant="danger"
                                                className={styles.deleteButton}
                                                disabled={Boolean(dataBusy) ||
                                                !matchesDeleteConfirmation(deleteConfirmation, user.username)}
                                                onClick={openDeleteModal}
                                            >
                                                Delete MistWarp data
                                            </Button>
                                        </div>
                                    </React.Fragment>
                                )}
                                {dataStatus && !deleteModalOpen ? <p className={styles.note} aria-live="polite">{dataStatus}</p> : null}
                                <p className={styles.note}>Read the <Link to="/trust">privacy and community terms</Link>, or <a href="https://rotur.dev/me" target="_blank" rel="noreferrer">manage your Rotur account</a>.</p>
                            </React.Fragment> : null}
                            {dataTab === 'games' ? <React.Fragment>
                                {!user ? (
                                    <Button className={styles.riskAction} onClick={login}>Sign in with Rotur</Button>
                                ) : gameDataState === 'loading' ? (
                                    <p className={styles.note}>Loading game data…</p>
                                ) : gameDataState === 'error' ? (
                                    <p className={styles.note} aria-live="polite">
                                        {gameDataError}{' '}
                                        <Button onClick={() => setGameDataAttempt(value => value + 1)}>Try again</Button>
                                    </p>
                                ) : (
                                    <React.Fragment>
                                        <div className={styles.dataAction}>
                                            <div>
                                                <h3>Global account game data</h3>
                                                <p>Projects can read this only while you are playing or an owner or collaborator is editing. Projects cannot change it.</p>
                                                <pre className={styles.gameDataJson}>{JSON.stringify((globalGameData && globalGameData.value) || {}, null, 2)}</pre>
                                            </div>
                                        </div>
                                        <h3>Project saves</h3>
                                        {gameSaves.length ? gameSaves.map(save => (
                                            <div className={styles.dataAction} key={save.projectId}>
                                                <div>
                                                    <h3>{save.title}</h3>
                                                    <p>{save.owner ? `by @${save.owner} · ` : ''}{save.bytes} bytes · revision {save.revision}</p>
                                                </div>
                                                <Button
                                                    variant="danger"
                                                    disabled={Boolean(dataBusy)}
                                                    onClick={() => setSaveToDelete(save)}
                                                >Delete save</Button>
                                            </div>
                                        )) : <p className={styles.note}>You do not have any project save data yet.</p>}
                                        <h3>Portable items</h3>
                                        <p className={styles.note}>Games see only items they define or explicitly allow from other projects.</p>
                                        {portableItems.length ? portableItems.map(item => (
                                            <div className={styles.dataAction} key={item.id}>
                                                <div>
                                                    <h3>{item.name}</h3>
                                                    <p>{item.id} · quantity {item.quantity} · from {item.originProjectTitle}</p>
                                                </div>
                                                {item.visual && item.visual.url ? <img alt="" src={item.visual.url} width="56" height="56" style={{objectFit: 'contain', borderRadius: 8}} /> : null}
                                            </div>
                                        )) : <p className={styles.note}>You do not own any portable game items yet.</p>}
                                    </React.Fragment>
                                )}
                            </React.Fragment> : null}
                        </section>
                    ) : null}

                    {!user ? (
                        <p className={styles.note}>
                            Sign in to sync your settings across devices through your Rotur account.
                        </p>
                    ) : null}
                </div>
            </div>
            {deleteModalOpen && user ? (
                <Modal
                    icon={Trash2}
                    title="Delete MistWarp data?"
                    onClose={closeDeleteModal}
                    dismissDisabled={dataBusy === 'delete'}
                    actions={(
                        <React.Fragment>
                            <Button
                                variant="danger"
                                className={styles.deleteButton}
                                busy={dataBusy === 'delete'}
                                busyLabel="Deleting…"
                                onClick={deleteData}
                            >
                                Delete permanently
                            </Button>
                            <Button
                                disabled={dataBusy === 'delete'}
                                onClick={closeDeleteModal}
                            >
                                Cancel
                            </Button>
                        </React.Fragment>
                    )}
                >
                    <p className={styles.modalText}>
                        MistWarp will delete projects and profile data for <strong>{user.username}</strong>.
                        {' '}Public comments and other shared history will be anonymized. This cannot be undone.
                    </p>
                    {dataStatus ? <p className={styles.note} aria-live="polite">{dataStatus}</p> : null}
                </Modal>
            ) : null}
            {saveToDelete ? (
                <Modal
                    icon={Trash2}
                    title="Delete game save?"
                    onClose={() => setSaveToDelete(null)}
                    dismissDisabled={dataBusy === `game-delete:${saveToDelete.projectId}`}
                    actions={(
                        <React.Fragment>
                            <Button
                                variant="danger"
                                busy={dataBusy === `game-delete:${saveToDelete.projectId}`}
                                busyLabel="Deleting…"
                                onClick={deleteGameSave}
                            >Delete save</Button>
                            <Button disabled={Boolean(dataBusy)} onClick={() => setSaveToDelete(null)}>Cancel</Button>
                        </React.Fragment>
                    )}
                >
                    <p className={styles.modalText}>Delete your production save for <strong>{saveToDelete.title}</strong>? The project will start you with a new save next time.</p>
                </Modal>
            ) : null}
        </main>
    );
};

export {
    getProjectThemeMode,
    matchesDeleteConfirmation,
    normalizeSettingsParams,
    settingsParamsForSection,
    settingsLoadState,
    settingsSection,
    settingsThemeTab
};
export default Settings;
