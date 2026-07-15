import React, {useState} from 'react';
import {Menu, Palette, Radio, User, ShieldAlert} from 'lucide-react';
import {applyTheme, detectTheme} from '../../lib/themes/themePersistance.js';
import {ThemeAccentPanel} from '../../components/tw-settings-modal/theme-accent-panel.jsx';
import {useUser} from '../UserContext.jsx';
import {
    notifyLocalChange,
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
import {
    getSecurityWarningSettings,
    setSecurityWarningSetting
} from '../../lib/security-warning-settings.js';
import styles from './Settings.module.css';

const PRESENCE_LABELS = {
    presenceEnabled: 'Share editor presence',
    includeEditDuration: 'Include edit duration'
};

const SECURITY_WARNING_LABELS = {
    loadExtension: 'Project extensions or JavaScript patching',
    fetch: 'Contacting websites',
    openWindow: 'Opening websites',
    redirect: 'Redirecting this page',
    recordAudio: 'Microphone access',
    recordVideo: 'Camera access',
    readClipboard: 'Reading the clipboard',
    notify: 'Desktop notifications',
    geolocate: 'Location access',
    embed: 'Embedding websites',
    download: 'Project downloads'
};

const SECTIONS = [
    {key: 'theme', label: 'Theme', icon: Palette},
    {key: 'menu-bar', label: 'Menu bar', icon: Menu},
    {key: 'presence', label: 'Presence', icon: Radio},
    {key: 'security', label: 'Security warnings', icon: ShieldAlert},
    {key: 'identity', label: 'Identity', icon: User}
];

const Settings = () => {
    const {user} = useUser();
    const [theme, setTheme] = useState(detectTheme());
    const [username, setUsername] = useState(getUsernameOverride() || '');
    const [accentMenuBar, setAccentMenuBarState] = useState(getAccentMenuBar());
    const [menuBarText, setMenuBarTextState] = useState(getMenuBarText());
    const [presence, setPresence] = useState(getRoturSettings());
    const [securityWarnings, setSecurityWarnings] = useState(getSecurityWarningSettings());
    const [activeSection, setActiveSection] = useState(SECTIONS[0].key);
    const securityWarningEntries = Object.entries(securityWarnings).filter(([key]) => key !== 'disabled');
    const securitySettingsClass = `${styles.settingRows} ${securityWarnings.disabled ?
        styles.settingsDisabled : ''}`;

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
        notifyLocalChange();
    };
    const changeMenuBarText = value => {
        setMenuBarText(value);
        setMenuBarTextState(value);
        applyTheme(detectTheme());
        notifyLocalChange();
    };
    const changePresence = (key, enabled) => {
        updateRoturSettings({[key]: enabled});
        setPresence(current => ({...current, [key]: enabled}));
    };
    const changeSecurityWarning = (key, enabled) => {
        setSecurityWarnings(setSecurityWarningSetting(key, enabled));
    };
    const changeSecurityDisabled = enabled => {
        if (enabled && !window.confirm(
            'Disable all security protections? Projects and extensions will have full access without warnings.'
        )) return;
        changeSecurityWarning('disabled', enabled);
    };

    return (
        <main className={styles.page}>
            <h1>Settings</h1>
            <p className={styles.lead}>
                These settings apply across all of MistWarp, including the editor and site.
            </p>

            <div className={styles.layout}>
                <nav
                    className={styles.sidebar}
                    aria-label="Settings sections"
                >
                    {SECTIONS.map(section => {
                        const Icon = section.icon;
                        return (
                            <button
                                key={section.key}
                                type="button"
                                className={activeSection === section.key ? styles.sidebarActive : styles.sidebarItem}
                                onClick={() => setActiveSection(section.key)}
                                aria-current={activeSection === section.key ? 'page' : null}
                            >
                                <Icon size={18} />
                                <span>{section.label}</span>
                            </button>
                        );
                    })}
                </nav>

                <div className={styles.content}>
                    {activeSection === 'theme' ? (
                        <section className={styles.card}>
                            <ThemeAccentPanel
                                theme={theme}
                                onChangeTheme={applyAndPersist}
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

                    {activeSection === 'security' ? (
                        <section className={styles.card}>
                            <h2>Security warnings</h2>
                            <p className={styles.risk}>
                                At your own risk: turning off a warning lets projects perform that action without
                                asking first. Malicious projects may steal account data, spy on you, or take actions
                                you did not intend.
                            </p>
                            <label className={`${styles.settingRow} ${styles.masterSecurityToggle}`}>
                                <span>
                                    I know what I&apos;m doing and take full responsibility: disable all security
                                </span>
                                <input
                                    className={styles.checkbox}
                                    type="checkbox"
                                    checked={securityWarnings.disabled}
                                    onChange={event => changeSecurityDisabled(event.target.checked)}
                                />
                            </label>
                            <div className={securitySettingsClass}>
                                {securityWarningEntries.map(([key, enabled]) => (
                                    <label
                                        key={key}
                                        className={styles.settingRow}
                                    >
                                        <span>Warn before: {SECURITY_WARNING_LABELS[key] || key}</span>
                                        <input
                                            className={styles.checkbox}
                                            type="checkbox"
                                            checked={enabled}
                                            disabled={securityWarnings.disabled}
                                            onChange={event => changeSecurityWarning(key, event.target.checked)}
                                        />
                                    </label>
                                ))}
                            </div>
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
