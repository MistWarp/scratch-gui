/* eslint-disable max-len */
import React, {useState, useEffect, useRef} from 'react';
import {Link, useNavigate, useSearchParams} from 'react-router-dom';
import {
    Palette, Radio, User, Bell, Eye, Shield, Database, Trash2, ExternalLink, SlidersHorizontal,
    PanelTop, Paintbrush, Brush, Lock, Ban, VolumeX, Save, Package
} from 'lucide-react';
import {applyTheme, detectTheme} from '../../lib/themes/themePersistance.js';
import {ThemeAccentPanel} from '../../components/tw-settings-modal/theme-accent-panel.jsx';
import CustomThemesPage from '../../components/tw-settings-modal/custom-themes-page.jsx';
import Sidebar from '../components/Sidebar.jsx';
import UnderlineTabs from '../components/UnderlineTabs.jsx';
import Button from '../components/ui/Button.jsx';
import ConfirmModal from '../components/ui/ConfirmModal.jsx';
import EmptyState, {SignInPrompt} from '../components/ui/EmptyState.jsx';
import Notice from '../components/ui/Notice.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import SectionHeading from '../components/ui/SectionHeading.jsx';
import StatusMessage from '../components/ui/StatusMessage.jsx';
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
import {useCommunityIntl} from '../i18n.jsx';
import LanguagePicker from '../components/LanguagePicker.jsx';
import downloadBlob from '../../lib/utils/download-blob.js';
import {
    readBlockedProjectPrompts,
    unblockProjectPrompts
} from '../../lib/project-prompt-blocking.js';

const PRESENCE_LABELS = {
    presenceEnabled: 'Share editor presence',
    includeEditDuration: 'Include edit duration',
    friendsVisible: "Let friends see when I'm in the editor and invite me"
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

const formatProjectName = (key, value) => {
    if (value && typeof value === 'object' && value.name) return String(value.name);
    if (key.startsWith('name:')) return key.slice('name:'.length);
    if (key.startsWith('id:')) return key.slice('id:'.length);
    return key;
};

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
    if (value === 'permissions') return 'safety';
    if (value === 'smart') return SECTIONS[0].key;
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
    const {text: communityText} = useCommunityIntl();
    const {user, login, loginOrThrow, logout} = useUser();
    const viewerName = (user && user.username) || '';
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const {t} = useCommunityIntl();
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
    const [blockedProjectPrompts, setBlockedProjectPrompts] = useState(readBlockedProjectPrompts);
    const handleUnblockProjectPrompt = key => {
        unblockProjectPrompts(key);
        setBlockedProjectPrompts(readBlockedProjectPrompts());
    };
    const [dataStatus, setDataStatus] = useState('');
    const [dataBusy, setDataBusy] = useState('');
    const [gameSaves, setGameSaves] = useState([]);
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
        setPortableItems([]);
        Promise.all([api.gameSaves(), api.gameInventory()])
            .then(([savesResult, inventoryResult]) => {
                if (cancelled) return;
                setGameSaves(savesResult.saves || []);
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
                setPrivacyStatus(enabled ?
                    'Your game activity and library are visible on your profile.' :
                    'Your game activity and library are hidden from other users.');
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
            <PageHeader
                icon={SlidersHorizontal}
                title={communityText('Settings')}
                lead={communityText('These settings apply across all of MistWarp, including the editor and site.')}
            />

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
                            <UnderlineTabs items={THEME_TABS} value={themeTab} onChange={setThemeTab} className={styles.themeTabs} ariaLabel="Theme sections" />
                            {themeTab === 'appearance' ? <div className={`${styles.themeContent} ${styles.appearance}`}>
                                <ThemeAccentPanel theme={theme} onChangeTheme={applyAndPersist} />
                                <div className={styles.appearanceSection}>
                                    <SectionHeading icon={PanelTop} title={communityText('Menu bar')} />
                                    <div className={styles.settingRows}>
                                        <SwitchRow
                                            checked={accentMenuBar}
                                            label={communityText('Accent-colored menu bar')}
                                            onChange={changeAccentMenuBar}
                                        />
                                        <label className={styles.settingRow}>
                                            <span>{communityText('Menu bar text')}</span>
                                            <select className={styles.select} value={menuBarText} onChange={event => changeMenuBarText(event.target.value)}>
                                                {MENU_BAR_TEXT_OPTIONS.map(option => <option key={option} value={option}>{option[0].toUpperCase() + option.slice(1)}</option>)}
                                            </select>
                                        </label>
                                    </div>
                                </div>
                            </div> : null}
                            {themeTab === 'projects' ? <div className={styles.themeContent}>
                                <SectionHeading
                                    icon={Paintbrush}
                                    title={communityText('Project themes')}
                                    lead={communityText('Some projects come with their own MistWarp theme. Choose when the player should switch to it.')}
                                />
                                <label className={styles.field}>
                                    <span>{communityText('Apply project themes for')}</span>
                                    <select className={styles.input} value={projectThemeMode} onChange={event => changeProjectThemeMode(event.target.value)}>
                                        {PROJECT_THEME_MODES.map(mode => <option key={mode.value} value={mode.value}>{communityText(mode.label)}</option>)}
                                    </select>
                                </label>
                            </div> : null}
                            {themeTab === 'custom' ? <div className={styles.themeContent}>
                                <SectionHeading icon={Brush} title={communityText('Custom themes')} />
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
                            <SectionHeading icon={Radio} title={communityText('Presence')} />
                            {user && !presenceOk ? (
                                <Notice
                                    variant="warning"
                                    className={styles.noticeBefore}
                                    action={(
                                        <Button
                                            busy={presenceBusy}
                                            busyLabel={communityText('Logging in…')}
                                            onClick={reloginForPresence}
                                        >
                                            {communityText('Log in again')}
                                        </Button>
                                    )}
                                >
                                    {communityText('Your current Rotur login is missing the account:profile permission, so your editor activity cannot be shared. Log in again to grant it.')}
                                </Notice>
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
                                    <span>{communityText('Let projects show activity on your profile')}</span>
                                    <select
                                        className={styles.select}
                                        value={presence.activitySharing}
                                        onChange={event => changeActivitySharing(event.target.value)}
                                    >
                                        {ACTIVITY_SHARING_OPTIONS.map(option => (
                                            <option key={option.value} value={option.value}>{communityText(option.label)}</option>
                                        ))}
                                    </select>
                                </label>
                            </div>
                            {activityGrantCount > 0 ? (
                                <Button className={styles.sectionAction} onClick={resetActivityGrants}>
                                    {communityText('Reset per-project choices ({value1})', {value1: activityGrantCount})}
                                </Button>
                            ) : null}
                        </section>
                    ) : null}

                    {activeSection === 'notifications' ? (
                        <section className={styles.card}>
                            <SectionHeading
                                icon={Bell}
                                title={communityText('Notifications')}
                                lead={communityText('Hidden categories stay out of your notification list. Account and moderation messages remain available when you turn system messages back on.')}
                            />
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
                            <SectionHeading
                                icon={Eye}
                                title={communityText('Privacy')}
                                lead={communityText('Choose which MistWarp activity appears publicly on your profile.')}
                            />
                            {!user ? <p className={styles.note}>{communityText('Sign in to manage profile privacy.')}</p> : (
                                <div className={styles.settingRows}>
                                    <SwitchRow
                                        checked={showRecentActivity}
                                        disabled={privacyBusy}
                                        label={communityText('Show game activity and library')}
                                        description={communityText('Display playtime for games you have added to your public library.')}
                                        onChange={changeRecentActivityPrivacy}
                                    />
                                </div>
                            )}
                            {privacyStatus && privacyLoadError ? (
                                <Notice
                                    variant="error"
                                    className={styles.noticeAfter}
                                    action={<Button onClick={() => setPrivacyAttempt(value => value + 1)}>{communityText('Try again')}</Button>}
                                >
                                    {privacyStatus}
                                </Notice>
                            ) : privacyStatus ? (
                                <p className={styles.note} aria-live="polite">{privacyStatus}</p>
                            ) : null}
                        </section>
                    ) : null}

                    {activeSection === 'identity' ? (
                        <section className={styles.card}>
                            <SectionHeading
                                icon={User}
                                title={communityText('Identity')}
                                lead={communityText('Your Rotur username identifies your account. You can use a different name inside projects without renaming your account.')}
                            />
                            {user ? (
                                <div className={styles.accountRow}>
                                    <div>
                                        <strong>@{user.username}</strong>
                                        <small>{communityText('To rename your account, change your username on rotur.dev. MistWarp moves your profile, projects and comments to the new name within a few minutes.')}</small>
                                    </div>
                                    <a
                                        href="https://rotur.dev/me"
                                        target="_blank"
                                        rel="noreferrer"
                                    >{communityText('Change username')}<ExternalLink size={13} /></a>
                                </div>
                            ) : null}
                            <label
                                className={styles.field}
                                htmlFor="username-override"
                            >
                                <span>{communityText('Project username')}</span>
                                <input
                                    id="username-override"
                                    className={styles.input}
                                    type="text"
                                    value={username}
                                    onChange={event => changeUsername(event.target.value)}
                                    placeholder={communityText('Use account username')}
                                />
                                <small>{communityText('Changes the value reported by the username block in projects. Leave this blank to use your Rotur username.')}</small>
                            </label>
                            <LanguagePicker id="settings-community-language" />
                            <small>{t('settings.languageHelp')}</small>
                        </section>
                    ) : null}

                    {activeSection === 'safety' ? (
                        <section className={styles.card}>
                            <SectionHeading
                                icon={Shield}
                                title={communityText('Safety')}
                                lead={communityText('Block or mute someone from their MistWarp profile. Blocking stops MistWarp comments and notifications between you. Muting only hides their MistWarp notifications.')}
                            />
                            {!user ? <p className={styles.note}>{communityText('Sign in to manage blocked and muted users.')}</p> : null}
                            {safetyError ? (
                                <Notice
                                    variant="error"
                                    className={styles.noticeBefore}
                                    action={<Button onClick={() => setSafetyAttempt(value => value + 1)}>{communityText('Try again')}</Button>}
                                >
                                    {safetyError}
                                </Notice>
                            ) : null}
                            {user && !safetyError ? <div className={styles.safetyGroups}>
                                <div>
                                    <SectionHeading as="h3" icon={Ban} title={communityText('Blocked users')} />
                                    {safety.blocked.length ? safety.blocked.map(name => (
                                        <div className={styles.safetyRow} key={name}>
                                            <Link to={`/users/${name}`}>@{name}</Link>
                                            <Button
                                                busy={safetyBusy === `blocked:${name}`}
                                                busyLabel={communityText('Removing…')}
                                                disabled={Boolean(safetyBusy)}
                                                onClick={() => removeSafetyEntry('blocked', name)}
                                            >{communityText('Unblock')}</Button>
                                        </div>
                                    )) : (
                                        <EmptyState compact title={communityText('No blocked users')}>
                                            {communityText('You have not blocked anyone.')}
                                        </EmptyState>
                                    )}
                                </div>
                                <div>
                                    <SectionHeading as="h3" icon={VolumeX} title={communityText('Muted users')} />
                                    {safety.muted.length ? safety.muted.map(name => (
                                        <div className={styles.safetyRow} key={name}>
                                            <Link to={`/users/${name}`}>@{name}</Link>
                                            <Button
                                                busy={safetyBusy === `muted:${name}`}
                                                busyLabel={communityText('Removing…')}
                                                disabled={Boolean(safetyBusy)}
                                                onClick={() => removeSafetyEntry('muted', name)}
                                            >{communityText('Unmute')}</Button>
                                        </div>
                                    )) : (
                                        <EmptyState compact title={communityText('No muted users')}>
                                            {communityText('You have not muted anyone.')}
                                        </EmptyState>
                                    )}
                                </div>
                            </div> : null}
                            <div className={styles.safetySection}>
                                <SectionHeading
                                    as="h3"
                                    icon={Lock}
                                    title={communityText('Project permissions')}
                                    lead={communityText('Projects listed here cannot show security prompts. Allow prompts again if you blocked one by mistake.')}
                                />
                                {Object.entries(blockedProjectPrompts).length > 0 ? (
                                    <div>
                                        {Object.entries(blockedProjectPrompts).map(([key, value]) => (
                                            <div className={styles.safetyRow} key={key}>
                                                <span>{formatProjectName(key, value)}</span>
                                                <Button onClick={() => handleUnblockProjectPrompt(key)}>{communityText('Allow prompts again')}</Button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <EmptyState compact title={communityText('No blocked projects')}>
                                        {communityText('No projects are blocked from asking for permission.')}
                                    </EmptyState>
                                )}
                            </div>
                            <p className={styles.note}>
                                {communityText('Contact MistWarp support for immediate safety concerns.')}
                                {' '}
                                <Link to="/support?topic=safety">{communityText('Contact support')}</Link>
                            </p>
                        </section>
                    ) : null}

                    {activeSection === 'data' ? (
                        <section className={styles.card}>
                            <SectionHeading
                                icon={Database}
                                title={communityText('Your MistWarp data')}
                                lead={communityText('These controls apply to MistWarp. Your Rotur account and Rotur data are managed separately on rotur.dev.')}
                            />
                            <UnderlineTabs items={DATA_TABS} value={dataTab} onChange={setDataTab} className={styles.themeTabs} ariaLabel="Data sections" />
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
                                    <SignInPrompt compact onSignIn={login}>
                                        {communityText('Sign in to download or delete your MistWarp data.')}
                                    </SignInPrompt>
                                ) : (
                                    <React.Fragment>
                                        <div className={styles.dataAction}>
                                            <div>
                                                <h3>{communityText('Download your data')}</h3>
                                                <p>{communityText('Get a JSON copy of your MistWarp profile, project metadata, comments, activity, settings, notifications, and safety list.')}</p>
                                            </div>
                                            <Button
                                                busy={dataBusy === 'export'}
                                                busyLabel={communityText('Preparing…')}
                                                disabled={Boolean(dataBusy)}
                                                onClick={downloadData}
                                            >{communityText('Download')}</Button>
                                        </div>
                                        <div className={styles.dangerZone}>
                                            <SectionHeading
                                                as="h3"
                                                icon={Trash2}
                                                title={communityText('Delete your MistWarp data')}
                                                lead={communityText('This deletes your MistWarp projects and profile data, anonymizes your public comments, and signs you out. Your Rotur account remains active, and signing in later creates a fresh MistWarp profile.')}
                                            />
                                            <label className={styles.field}>
                                                <span>{communityText('Type {value1} to confirm', {value1: user.username})}</span>
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
                                            ><Trash2 size={15} />{communityText('Delete MistWarp data')}</Button>
                                        </div>
                                    </React.Fragment>
                                )}
                                {dataStatus && !deleteModalOpen ? <p className={styles.note} aria-live="polite">{dataStatus}</p> : null}
                                <p className={styles.noteLinks}>
                                    <Link to="/trust">{communityText('Privacy and community terms')}</Link>
                                    <a href="https://rotur.dev/me" target="_blank" rel="noreferrer">{communityText('Manage your Rotur account')}</a>
                                </p>
                            </React.Fragment> : null}
                            {dataTab === 'games' ? <React.Fragment>
                                {!user ? (
                                    <SignInPrompt compact onSignIn={login}>
                                        {communityText('Sign in to manage your game saves and portable items.')}
                                    </SignInPrompt>
                                ) : gameDataState === 'loading' ? (
                                    <StatusMessage compact>{communityText('Loading game data…')}</StatusMessage>
                                ) : gameDataState === 'error' ? (
                                    <StatusMessage compact error onRetry={() => setGameDataAttempt(value => value + 1)}>
                                        {gameDataError}
                                    </StatusMessage>
                                ) : (
                                    <React.Fragment>
                                        <SectionHeading as="h3" icon={Save} title={communityText('Project saves')} />
                                        {gameSaves.length ? gameSaves.map(save => (
                                            <div className={styles.dataAction} key={save.projectId}>
                                                <div>
                                                    <h3>{save.title}</h3>
                                                    <p>{save.owner ?
                                                        communityText('by @{value1} · {value2} bytes · revision {value3}', {value1: save.owner, value2: save.bytes, value3: save.revision}) :
                                                        communityText('{value1} bytes · revision {value2}', {value1: save.bytes, value2: save.revision})}</p>
                                                </div>
                                                <Button
                                                    variant="danger"
                                                    disabled={Boolean(dataBusy)}
                                                    onClick={() => setSaveToDelete(save)}
                                                >{communityText('Delete save')}</Button>
                                            </div>
                                        )) : (
                                            <EmptyState compact title={communityText('No project saves')}>
                                                {communityText('You do not have any project save data yet.')}
                                            </EmptyState>
                                        )}
                                        <SectionHeading
                                            as="h3"
                                            icon={Package}
                                            className={styles.subheading}
                                            title={communityText('Portable items')}
                                            lead={communityText('Games see only items they define or explicitly allow from other projects.')}
                                        />
                                        {portableItems.length ? portableItems.map(item => (
                                            <div className={styles.dataAction} key={item.id}>
                                                <div>
                                                    <h3>{item.name}</h3>
                                                    <p>{communityText('{value1} · quantity {value2} · from {value3}', {value1: item.id, value2: item.quantity, value3: item.originProjectTitle})}</p>
                                                </div>
                                                {item.visual && item.visual.url ? <img className={styles.itemVisual} alt="" src={item.visual.url} width="56" height="56" /> : null}
                                            </div>
                                        )) : (
                                            <EmptyState compact title={communityText('No portable items')}>
                                                {communityText('You do not own any portable game items yet.')}
                                            </EmptyState>
                                        )}
                                    </React.Fragment>
                                )}
                            </React.Fragment> : null}
                        </section>
                    ) : null}

                    {!user ? (
                        <p className={styles.note}>{communityText('Sign in to sync your settings across devices through your Rotur account.')}</p>
                    ) : null}
                </div>
            </div>
            {deleteModalOpen && user ? (
                <ConfirmModal
                    icon={Trash2}
                    title={communityText('Delete MistWarp data?')}
                    destructive
                    busy={dataBusy === 'delete'}
                    busyLabel={communityText('Deleting…')}
                    confirmLabel={communityText('Delete permanently')}
                    error={dataBusy === 'delete' ? '' : dataStatus}
                    onConfirm={deleteData}
                    onCancel={closeDeleteModal}
                >
                    {communityText('MistWarp will delete projects and profile data for @{value1}. Public comments and other shared history will be anonymized. This cannot be undone.', {value1: user.username})}
                </ConfirmModal>
            ) : null}
            {saveToDelete ? (
                <ConfirmModal
                    icon={Trash2}
                    title={communityText('Delete game save?')}
                    destructive
                    busy={dataBusy === `game-delete:${saveToDelete.projectId}`}
                    busyLabel={communityText('Deleting…')}
                    confirmLabel={communityText('Delete save')}
                    onConfirm={deleteGameSave}
                    onCancel={() => setSaveToDelete(null)}
                >
                    {communityText('Delete your production save for {value1}? The project will start you with a new save next time.', {value1: saveToDelete.title})}
                </ConfirmModal>
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
