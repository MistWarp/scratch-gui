import React, {useState, useEffect} from 'react';
import {Menu, Palette, Radio, Store, SwatchBook, User, Brush} from 'lucide-react';
import {applyTheme, detectTheme} from '../../lib/themes/themePersistance.js';
import {ThemeAccentPanel} from '../../components/tw-settings-modal/theme-accent-panel.jsx';
import CustomThemesPage from '../../components/tw-settings-modal/custom-themes-page.jsx';
import WarpThemePanel from '../components/WarpThemePanel.jsx';
import Sidebar from '../components/Sidebar.jsx';
import {useUser} from '../UserContext.jsx';
import {
    getUsernameOverride,
    setUsernameOverride
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
const getProjectThemeMode = () => {
    try {
        return localStorage.getItem(PROJECT_THEME_MODE_KEY) || 'all';
    } catch (e) {
        return 'all';
    }
};

const SECTIONS = [
    {key: 'theme', label: 'Theme', icon: Palette},
    {key: 'project-themes', label: 'Project themes', icon: Brush},
    {key: 'custom-themes', label: 'Custom themes', icon: SwatchBook},
    {key: 'warptheme', label: 'WarpTheme', icon: Store},
    {key: 'menu-bar', label: 'Menu bar', icon: Menu},
    {key: 'presence', label: 'Presence', icon: Radio},
    {key: 'identity', label: 'Identity', icon: User}
];

const Settings = () => {
    const {user, login, logout} = useUser();
    const [theme, setTheme] = useState(detectTheme());
    const [username, setUsername] = useState(getUsernameOverride() || '');
    const [accentMenuBar, setAccentMenuBarState] = useState(getAccentMenuBar());
    const [menuBarText, setMenuBarTextState] = useState(getMenuBarText());
    const [presence, setPresence] = useState(getRoturSettings());
    const [projectThemeMode, setProjectThemeMode] = useState(getProjectThemeMode());
    const [activeSection, setActiveSection] = useState(SECTIONS[0].key);
    const [presenceOk, setPresenceOk] = useState(true);

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
                            <ThemeAccentPanel
                                theme={theme}
                                onChangeTheme={applyAndPersist}
                            />
                        </section>
                    ) : null}

                    {activeSection === 'custom-themes' ? (
                        <section className={styles.card}>
                            <h2>Custom themes</h2>
                            <CustomThemesPage
                                theme={theme}
                                onChangeTheme={applyAndPersist}
                                onOpenWarpThemeMarketplace={() => setActiveSection('warptheme')}
                            />
                        </section>
                    ) : null}

                    {activeSection === 'warptheme' ? (
                        <section className={styles.card}>
                            <h2>WarpTheme marketplace</h2>
                            <WarpThemePanel
                                theme={theme}
                                onThemeChange={applyAndPersist}
                            />
                        </section>
                    ) : null}

                    {activeSection === 'menu-bar' ? (
                        <section className={styles.card}>
                            <h2>Menu bar</h2>
                            <div className={styles.settingRows}>
                                <label className={styles.settingRow}>
                                    <span>Accent-colored menu bar</span>
                                    <input
                                        className={styles.checkbox}
                                        type="checkbox"
                                        checked={accentMenuBar}
                                        onChange={event => changeAccentMenuBar(event.target.checked)}
                                    />
                                </label>
                                <label className={styles.settingRow}>
                                    <span>Menu bar text</span>
                                    <select
                                        className={styles.select}
                                        value={menuBarText}
                                        onChange={event => changeMenuBarText(event.target.value)}
                                    >
                                        {MENU_BAR_TEXT_OPTIONS.map(option => (
                                            <option
                                                key={option}
                                                value={option}
                                            >
                                                {option[0].toUpperCase() + option.slice(1)}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            </div>
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

                    {activeSection === 'project-themes' ? (
                        <section className={styles.card}>
                            <h2>Project themes</h2>
                            <p className={styles.lead}>
                                Some projects come with their own MistWarp theme. Choose when the player should
                                switch to a project&apos;s theme automatically.
                            </p>
                            <label className={styles.field}>
                                <span>Apply project themes for</span>
                                <select
                                    className={styles.input}
                                    value={projectThemeMode}
                                    onChange={event => changeProjectThemeMode(event.target.value)}
                                >
                                    {PROJECT_THEME_MODES.map(mode => (
                                        <option
                                            key={mode.value}
                                            value={mode.value}
                                        >{mode.label}</option>
                                    ))}
                                </select>
                            </label>
                        </section>
                    ) : null}

                    {activeSection === 'identity' ? (
                        <section className={styles.card}>
                            <h2>Identity</h2>
                            <label
                                className={styles.field}
                                htmlFor="username-override"
                            >
                                <span>Username override</span>
                                <input
                                    id="username-override"
                                    className={styles.input}
                                    type="text"
                                    value={username}
                                    onChange={event => changeUsername(event.target.value)}
                                    placeholder="Use account username"
                                />
                            </label>
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
