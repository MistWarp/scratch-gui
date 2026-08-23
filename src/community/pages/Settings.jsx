/* eslint-disable max-len */
import React, {useState, useEffect} from 'react';
import {Link} from 'react-router-dom';
import {Palette, Radio, User, Bell, Shield, Database} from 'lucide-react';
import {applyTheme, detectTheme} from '../../lib/themes/themePersistance.js';
import {ThemeAccentPanel} from '../../components/tw-settings-modal/theme-accent-panel.jsx';
import CustomThemesPage from '../../components/tw-settings-modal/custom-themes-page.jsx';
import WarpThemePanel from '../components/WarpThemePanel.jsx';
import Sidebar from '../components/Sidebar.jsx';
import SectionTabs from '../components/SectionTabs.jsx';
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
import {presenceSupported} from '../../lib/rotur/client.js';
import styles from './Settings.module.css';
import {getNotificationPreferences, setNotificationPreferences} from '../notification-preferences';
import api from '../api';
import {analyticsEnabled, setAnalyticsEnabled} from '../analytics.js';
import {LOCALES, useCommunityIntl} from '../i18n.jsx';

const PRESENCE_LABELS = {
    presenceEnabled: 'Share editor presence',
    includeEditDuration: 'Include edit duration'
};

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
    {key: 'custom', label: 'Custom'},
    {key: 'marketplace', label: 'Marketplace'}
];
const getProjectThemeMode = () => {
    try {
        return localStorage.getItem(PROJECT_THEME_MODE_KEY) || 'all';
    } catch (e) {
        return 'all';
    }
};

const SECTIONS = [
    {key: 'theme', label: 'Theme', icon: Palette},
    {key: 'presence', label: 'Presence', icon: Radio},
    {key: 'notifications', label: 'Notifications', icon: Bell},
    {key: 'safety', label: 'Safety', icon: Shield},
    {key: 'data', label: 'Your data', icon: Database},
    {key: 'identity', label: 'Identity', icon: User}
];

const Settings = () => {
    const {user, login, logout} = useUser();
    const {preference: localePreference, setPreference: setLocalePreference, t} = useCommunityIntl();
    const [theme, setTheme] = useState(detectTheme());
    const [username, setUsername] = useState(getUsernameOverride() || '');
    const [accentMenuBar, setAccentMenuBarState] = useState(getAccentMenuBar());
    const [menuBarText, setMenuBarTextState] = useState(getMenuBarText());
    const [presence, setPresence] = useState(getRoturSettings());
    const [projectThemeMode, setProjectThemeMode] = useState(getProjectThemeMode());
    const [activeSection, setActiveSection] = useState(SECTIONS[0].key);
    const [themeTab, setThemeTab] = useState(THEME_TABS[0].key);
    const [presenceOk, setPresenceOk] = useState(true);
    const [notificationPreferences, setNotificationPreferencesState] = useState(getNotificationPreferences());
    const [safety, setSafety] = useState({blocked: [], muted: []});
    const [safetyError, setSafetyError] = useState('');
    const [dataStatus, setDataStatus] = useState('');
    const [deleteConfirmation, setDeleteConfirmation] = useState('');
    const [shareAnalytics, setShareAnalytics] = useState(analyticsEnabled());

    useEffect(() => {
        if (!user) {
            setSafety({blocked: [], muted: []});
            return;
        }
        api.safety().then(data => setSafety({blocked: data.blocked || [], muted: data.muted || []})).catch(() => setSafetyError('Could not load your safety settings.'));
    }, [user]);

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
        try {
            await logout();
            await login();
        } catch (e) {
            // ignore
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
    const removeSafetyEntry = async (kind, name) => {
        setSafetyError('');
        try {
            const data = kind === 'blocked' ? await api.unblockUser(name) : await api.unmuteUser(name);
            setSafety({blocked: data.blocked || [], muted: data.muted || []});
        } catch (e) {
            setSafetyError(e.message || 'Could not update your safety settings.');
        }
    };
    const downloadData = async () => {
        setDataStatus('Preparing your export…');
        try {
            const data = await api.exportMyData();
            const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `mistwarp-${user.username}-data.json`;
            link.click();
            URL.revokeObjectURL(url);
            setDataStatus('Your export was downloaded.');
        } catch (e) {
            setDataStatus(e.message || 'Could not export your data.');
        }
    };
    const deleteData = async () => {
        if (!user || deleteConfirmation.toLowerCase() !== user.username.toLowerCase()) return;
        if (!window.confirm('Delete your MistWarp data? Public history will be anonymized. This cannot be undone.')) return;
        setDataStatus('Deleting your MistWarp data…');
        try {
            await api.deleteMyData(deleteConfirmation);
            await logout();
            window.location.assign('/');
        } catch (e) {
            setDataStatus(e.message || 'Could not delete your data.');
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
                                        <label className={styles.settingRow}>
                                            <span>Accent-colored menu bar</span>
                                            <input className={styles.checkbox} type="checkbox" checked={accentMenuBar} onChange={event => changeAccentMenuBar(event.target.checked)} />
                                        </label>
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
                                <CustomThemesPage theme={theme} onChangeTheme={applyAndPersist} onOpenWarpThemeMarketplace={() => setThemeTab('marketplace')} />
                            </div> : null}
                            {themeTab === 'marketplace' ? <div className={styles.themeContent}>
                                <h2>WarpTheme marketplace</h2>
                                <WarpThemePanel theme={theme} onThemeChange={applyAndPersist} />
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
                                        <button
                                            className={styles.riskAction}
                                            type="button"
                                            onClick={reloginForPresence}
                                        >
                                            {'Log in again'}
                                        </button>
                                    </div>
                                </div>
                            ) : null}
                            <div className={styles.settingRows}>
                                {Object.entries(presence).map(([key, enabled]) => (
                                    <label
                                        key={key}
                                        className={styles.settingRow}
                                    >
                                        <span>{PRESENCE_LABELS[key] || key}</span>
                                        <input
                                            className={styles.checkbox}
                                            type="checkbox"
                                            checked={enabled}
                                            onChange={event => changePresence(key, event.target.checked)}
                                        />
                                    </label>
                                ))}
                            </div>
                        </section>
                    ) : null}

                    {activeSection === 'notifications' ? (
                        <section className={styles.card}>
                            <h2>Notifications</h2>
                            <p className={styles.lead}>Hidden categories stay out of your notification list. Account and moderation messages remain available when you turn system messages back on.</p>
                            <div className={styles.settingRows}>
                                {[
                                    ['social', 'Comments, mentions, follows, and reactions'],
                                    ['projects', 'Remixes, contributions, feedback, and spaces'],
                                    ['economy', 'Purchases, donations, and items'],
                                    ['system', 'Moderation, reports, and announcements']
                                ].map(([key, label]) => (
                                    <label key={key} className={styles.settingRow}>
                                        <span>{label}</span>
                                        <input className={styles.checkbox} type="checkbox" checked={notificationPreferences[key]} onChange={event => changeNotificationPreference(key, event.target.checked)} />
                                    </label>
                                ))}
                            </div>
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
                            {safetyError ? <p className={styles.error}>{safetyError}</p> : null}
                            {user ? <div className={styles.safetyGroups}>
                                <div><h3>Blocked users</h3>{safety.blocked.length ? safety.blocked.map(name => <div className={styles.safetyRow} key={name}><Link to={`/users/${name}`}>@{name}</Link><button type="button" onClick={() => removeSafetyEntry('blocked', name)}>Unblock</button></div>) : <p className={styles.note}>You have not blocked anyone.</p>}</div>
                                <div><h3>Muted users</h3>{safety.muted.length ? safety.muted.map(name => <div className={styles.safetyRow} key={name}><Link to={`/users/${name}`}>@{name}</Link><button type="button" onClick={() => removeSafetyEntry('muted', name)}>Unmute</button></div>) : <p className={styles.note}>You have not muted anyone.</p>}</div>
                            </div> : null}
                            <p className={styles.note}>For immediate safety concerns, <Link to="/support?topic=safety">contact MistWarp support</Link>.</p>
                        </section>
                    ) : null}

                    {activeSection === 'data' ? (
                        <section className={styles.card}>
                            <h2>Your MistWarp data</h2>
                            <p className={styles.lead}>These controls apply to MistWarp. Your Rotur account and Rotur data are managed separately on rotur.dev.</p>
                            <div className={styles.dataAction}><div><h3>{t('settings.analytics')}</h3><p>{t('settings.analyticsHelp')}</p></div><label><span className={styles.srOnly}>{t('settings.analytics')}</span><input className={styles.checkbox} type="checkbox" checked={shareAnalytics} onChange={event => changeAnalytics(event.target.checked)} /></label></div>
                            {!user ? <button className={styles.riskAction} type="button" onClick={login}>Sign in with Rotur</button> : <React.Fragment>
                                <div className={styles.dataAction}><div><h3>Download your data</h3><p>Get a JSON copy of your MistWarp profile, project metadata, comments, activity, settings, notifications, and safety list.</p></div><button type="button" onClick={downloadData}>Download</button></div>
                                <div className={styles.dangerZone}><h3>Delete your MistWarp data</h3><p>This deletes your MistWarp projects and profile data, anonymizes your public comments, and signs you out. Your Rotur account remains active, and signing in later creates a fresh MistWarp profile.</p><label className={styles.field}>Type <strong>{user.username}</strong> to confirm<input className={styles.input} value={deleteConfirmation} onChange={event => setDeleteConfirmation(event.target.value)} /></label><button type="button" className={styles.deleteButton} disabled={deleteConfirmation.toLowerCase() !== user.username.toLowerCase()} onClick={deleteData}>Delete MistWarp data</button></div>
                            </React.Fragment>}
                            {dataStatus ? <p className={styles.note} aria-live="polite">{dataStatus}</p> : null}
                            <p className={styles.note}>Read the <Link to="/trust">privacy and community terms</Link>, or <a href="https://rotur.dev/me" target="_blank" rel="noreferrer">manage your Rotur account</a>.</p>
                        </section>
                    ) : null}

                    {!user ? (
                        <p className={styles.note}>
                            Sign in to sync your settings across devices through your Rotur account.
                        </p>
                    ) : null}
                </div>
            </div>
        </main>
    );
};

export default Settings;
