/* eslint-disable max-len, no-alert, no-negated-condition, react/jsx-no-bind, react/jsx-no-literals */
import PropTypes from 'prop-types';
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {defineMessages, injectIntl, intlShape} from 'react-intl';
import {
    ArrowLeft, BookmarkPlus, Check, Download, Edit3, Flag, Heart, LogIn,
    Search, Shield, Trash2, Upload, User, X
} from 'lucide-react';

import Modal from '../../containers/windowed-modal.jsx';
import Box from '../box/box.jsx';
import Spinner from '../spinner/spinner.jsx';
import {getRotur} from '../../lib/rotur/client.js';
// eslint-disable-next-line import/no-commonjs
const {needsValidatorPermission} = require('../../lib/warptheme-auth.js');

import styles from './warptheme-modal.css';

const API = 'https://warptheme.mistium.com/api';
const TOKEN_KEY = 'mw:warptheme-token';
const TOKEN_MANAGER = 'https://rotur.dev/token-manager';

const messages = defineMessages({
    title: {
        defaultMessage: 'WarpTheme Marketplace',
        description: 'Title of the WarpTheme marketplace modal',
        id: 'mw.warptheme.title'
    }
});

const readToken = () => {
    try {
        return localStorage.getItem(TOKEN_KEY);
    } catch (_) {
        return null;
    }
};

const storeToken = token => {
    try {
        if (token) localStorage.setItem(TOKEN_KEY, token);
        else localStorage.removeItem(TOKEN_KEY);
    } catch (_) {
        // Storage can be unavailable in private mode.
    }
};

const request = async (path, token, options = {}) => {
    const response = await fetch(`${API}${path}`, {
        ...options,
        headers: {
            ...(options.body ? {'Content-Type': 'application/json'} : {}),
            ...(token ? {Authorization: `Bearer ${token}`} : {}),
            ...options.headers
        }
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.ok === false) {
        throw new Error(data.error || `WarpTheme request failed (${response.status})`);
    }
    return data;
};

const openSession = async expectedUsername => {
    let token = readToken();
    if (token) {
        try {
            const account = await request('/user', token);
            if (account.user.username.toLowerCase() === expectedUsername.toLowerCase()) return {token, ...account};
        } catch (_) {
            storeToken(null);
        }
    }

    const roturToken = getRotur().token;
    if (!roturToken) throw new Error('Sign in with Rotur first.');
    const validatorResponse = await fetch(
        `https://social.rotur.dev/generate_validator?key=warptheme&auth=${encodeURIComponent(roturToken)}`
    );
    const validatorData = await validatorResponse.json().catch(() => ({}));
    if (!validatorResponse.ok || !validatorData.validator) {
        const message = String(validatorData.error || validatorData.message || '');
        const permissionError = new Error(
            'Your Rotur token needs the validators:generate permission before it can access WarpTheme.'
        );
        if (needsValidatorPermission(validatorResponse.status, validatorData)) {
            permissionError.code = 'validator-permission';
            throw permissionError;
        }
        throw new Error(message || 'Rotur could not authorize WarpTheme.');
    }

    const auth = await request(`/auth?v=${encodeURIComponent(validatorData.validator)}`, null, {method: 'POST'});
    token = auth.token;
    storeToken(token);
    const account = await request('/user', token);
    return {token, ...account};
};

const gradientStyle = theme => {
    const colors = theme.colors && theme.colors.gradient;
    if (!Array.isArray(colors) || colors.length < 1) return {};
    const stops = [...colors]
        .sort((a, b) => Number(a.position) - Number(b.position))
        .map(color => `${color.color} ${color.position}%`)
        .join(', ');
    return {background: `linear-gradient(${theme.colors.gradientDirection || 135}deg, ${stops})`};
};

const exportCurrentTheme = theme => {
    const colors = theme && typeof theme.getGuiColors === 'function' ? theme.getGuiColors() : {};
    const exported = theme && typeof theme.export === 'function' ? theme.export() : null;
    if (exported && exported.accent && Array.isArray(exported.accent.colors)) return exported;
    return {
        ...exported,
        name: (exported && exported.name) || (theme && theme.name) || 'My MistWarp Theme',
        description: (exported && exported.description) || '',
        accent: {
            colors: [
                {color: colors['looks-secondary'] || '#4c97ff', position: 0},
                {color: colors['looks-tertiary'] || '#9966ff', position: 100}
            ],
            direction: 135
        },
        gui: (theme && theme.gui) || 'light',
        blocks: (theme && theme.blocks) || 'three',
        menuBarAlign: (theme && theme.menuBarAlign) || 'center',
        wallpaper: (theme && theme.wallpaper) || {},
        fonts: (theme && theme.fonts) || {system: [], google: []}
    };
};

const ThemeCard = ({onOpen, theme}) => (
    <button
        className={styles.themeCard}
        onClick={() => onOpen(theme)}
        type="button"
    >
        <span
            className={styles.themeHeader}
            style={gradientStyle(theme)}
        />
        <span className={styles.themeContent}>
            <strong className={styles.themeName}>{theme.name}</strong>
            <span className={styles.themeAuthor}>by {theme.authorName || theme.author}</span>
            <span className={styles.themeDescription}>{theme.description || 'No description'}</span>
            <span className={styles.themeStats}>
                <span><Heart size={12} /> {theme.likes || 0}</span>
                <span><Download size={12} /> {theme.downloads || 0}</span>
                <span className={styles.platform}>{theme.platform}</span>
            </span>
        </span>
    </button>
);

ThemeCard.propTypes = {
    onOpen: PropTypes.func.isRequired,
    theme: PropTypes.object.isRequired
};

const SidebarItem = ({active, badge, icon: Icon, label, onClick}) => (
    <button
        className={`${styles.sidebarItem}${active ? ` ${styles.selected}` : ''}`}
        onClick={onClick}
        title={label}
        type="button"
    >
        <Icon
            className={styles.sidebarIcon}
            size={18}
        />
        <span className={styles.sidebarLabel}>{label}</span>
        {badge > 0 && <span className={styles.sidebarBadge}>{badge}</span>}
    </button>
);

SidebarItem.propTypes = {
    active: PropTypes.bool,
    badge: PropTypes.number,
    icon: PropTypes.elementType.isRequired,
    label: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired
};

const WarpThemeModal = props => {
    const [account, setAccount] = useState(null);
    const [token, setToken] = useState(null);
    const [themes, setThemes] = useState([]);
    const [myThemes, setMyThemes] = useState([]);
    const [reports, setReports] = useState([]);
    const [tab, setTab] = useState('browse');
    const [selected, setSelected] = useState(null);
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState('newest');
    const [platform, setPlatform] = useState('all');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [permissionMissing, setPermissionMissing] = useState(false);
    const [sessionAttempt, setSessionAttempt] = useState(0);
    const [uploadName, setUploadName] = useState('');
    const [uploadDescription, setUploadDescription] = useState('');
    const [uploadFile, setUploadFile] = useState(null);
    const [editing, setEditing] = useState(null);
    const [reporting, setReporting] = useState(null);
    const [reportReason, setReportReason] = useState('');
    const [savedIds, setSavedIds] = useState(() => new Set());
    const [saveNotice, setSaveNotice] = useState('');

    const loadThemes = useCallback(async sessionToken => {
        const data = await request('/themes', sessionToken);
        setThemes(data.themes || []);
    }, []);

    const loadMyThemes = useCallback(async (sessionToken, userId) => {
        const data = await request(
            `/user/themes?username=${encodeURIComponent(userId)}&authType=rotur`,
            sessionToken
        );
        setMyThemes(data.themes || []);
    }, []);

    const loadReports = useCallback(async sessionToken => {
        const data = await request('/admin/reports?status=open', sessionToken);
        setReports(data.reports || []);
    }, []);

    useEffect(() => {
        let active = true;
        if (!props.roturUsername) {
            storeToken(null);
            setAccount(null);
            setToken(null);
            return;
        }
        setBusy(true);
        setError('');
        setPermissionMissing(false);
        openSession(props.roturUsername)
            .then(async session => {
                if (!active) return;
                setAccount(session);
                setToken(session.token);
                await Promise.all([
                    loadThemes(session.token),
                    loadMyThemes(session.token, session.userId),
                    session.isAdmin ? loadReports(session.token) : Promise.resolve()
                ]);
            })
            .catch(err => {
                if (!active) return;
                setPermissionMissing(err.code === 'validator-permission');
                setError(err.message);
            })
            .finally(() => active && setBusy(false));
        return () => {
            active = false;
        };
    }, [loadMyThemes, loadReports, loadThemes, props.roturUsername, sessionAttempt]);

    const refresh = async () => {
        await Promise.all([
            loadThemes(token),
            loadMyThemes(token, account.userId),
            account.isAdmin ? loadReports(token) : Promise.resolve()
        ]);
    };

    const visibleThemes = useMemo(() => {
        const source = tab === 'mine' ? myThemes : themes;
        const query = search.trim().toLowerCase();
        return source
            .filter(theme => platform === 'all' || theme.platform === platform)
            .filter(theme => !query || [theme.name, theme.description, theme.authorName]
                .some(value => String(value || '').toLowerCase()
                    .includes(query)))
            .sort((a, b) => {
                if (sort === 'likes') return (b.likes || 0) - (a.likes || 0);
                if (sort === 'name') return a.name.localeCompare(b.name);
                return Number(b.createdAt || 0) - Number(a.createdAt || 0);
            });
    }, [myThemes, platform, search, sort, tab, themes]);

    const run = async action => {
        setBusy(true);
        setError('');
        try {
            await action();
        } catch (err) {
            setError(err.message);
        } finally {
            setBusy(false);
        }
    };

    const uploadTheme = () => run(async () => {
        const source = uploadFile || exportCurrentTheme(props.currentTheme);
        const sourceThemes = Array.isArray(source.themes) ? source.themes : [source];
        const items = sourceThemes.map((item, index) => ({
            name: (index === 0 && uploadName.trim()) || item.name || `Theme ${index + 1}`,
            description: (index === 0 && uploadDescription.trim()) || item.description || '',
            platform: source.platform || 'mistwarp',
            themeJson: Array.isArray(source.themes) ? {...source, themes: [item]} : source
        }));
        await request('/theme', token, {method: 'POST', body: JSON.stringify({themes: items})});
        setUploadFile(null);
        setUploadName('');
        setUploadDescription('');
        setTab('mine');
        await refresh();
    });

    const saveEdit = () => run(async () => {
        await request('/theme/name', token, {
            method: 'PUT',
            body: JSON.stringify({uuid: editing.uuid, name: editing.name, description: editing.description})
        });
        setEditing(null);
        setSelected(null);
        await refresh();
    });

    const deleteTheme = theme => {
        if (!window.confirm(`Delete “${theme.name}”? This cannot be undone.`)) return;
        run(async () => {
            await request(`/theme?uuid=${encodeURIComponent(theme.uuid)}`, token, {method: 'DELETE'});
            setSelected(null);
            await refresh();
        });
    };

    const submitReport = () => run(async () => {
        await request('/report', token, {
            method: 'POST',
            body: JSON.stringify({uuid: reporting.uuid, reason: reportReason})
        });
        setReporting(null);
        setReportReason('');
    });

    const resolveReport = (report, action) => run(async () => {
        await request('/admin/report/resolve', token, {
            method: 'POST',
            body: JSON.stringify({id: report.id, action})
        });
        if (action === 'delete-theme') setSelected(null);
        await refresh();
    });

    const fetchSelectedExport = async () => {
        const response = await fetch(
            `${API}/theme/export?uuid=${encodeURIComponent(selected.uuid)}&platform=mistwarp`,
            {headers: {Authorization: `Bearer ${token}`}}
        );
        if (!response.ok) throw new Error('Failed to export this theme.');
        return response.json();
    };

    const applySelected = () => run(async () => {
        props.onThemeApply(await fetchSelectedExport());
    });

    const saveSelectedToLibrary = () => run(async () => {
        if (!props.onThemeSave) throw new Error('Saving to library is unavailable.');
        if (savedIds.has(selected.uuid)) return;
        const saved = props.onThemeSave(await fetchSelectedExport(), {
            name: selected.name,
            description: selected.description || '',
            author: selected.authorName || selected.author || 'WarpTheme'
        });
        setSavedIds(prev => new Set(prev).add(selected.uuid));
        setSaveNotice(`“${saved.name}” added to your custom theme library.`);
    });

    const loginGate = (
        <div className={styles.gate}>
            <div className={styles.gateIcon}><User size={22} /></div>
            <h2>Sign in to WarpTheme</h2>
            <p>The marketplace uses your Rotur account for uploads, reports, and ownership.</p>
            <button
                className={styles.primaryButton}
                onClick={props.onRoturLogin}
                type="button"
            >
                <LogIn size={15} /> Continue with Rotur
            </button>
        </div>
    );

    const permissionGate = (
        <div className={styles.gate}>
            <div className={styles.gateIcon}><Shield size={22} /></div>
            <h2>WarpTheme needs one more permission</h2>
            <p>
                Edit your current token in Rotur Token Manager and enable
                {' '}<strong>validators:generate</strong>. Then return here and retry.
            </p>
            <div className={styles.gateActions}>
                <button
                    className={styles.primaryButton}
                    onClick={() => window.open(TOKEN_MANAGER, '_blank', 'noopener,noreferrer')}
                    type="button"
                >Open Token Manager</button>
                <button
                    className={styles.secondaryButton}
                    onClick={() => setSessionAttempt(value => value + 1)}
                    type="button"
                >Retry</button>
            </div>
        </div>
    );

    const uploadPage = tab === 'upload' && (
        <div className={styles.pageContent}>
            <form
                className={styles.uploadForm}
                onSubmit={event => {
                    event.preventDefault();
                    uploadTheme();
                }}
            >
                <div className={styles.formIntro}>
                    <div className={styles.formIcon}><Upload size={18} /></div>
                    <div>
                        <h2>Upload a theme</h2>
                        <p>Share the theme currently applied, or choose an exported JSON file.</p>
                    </div>
                </div>
                <label>Name<input
                    maxLength="100"
                    placeholder="Current theme name"
                    value={uploadName}
                    onChange={e => setUploadName(e.target.value)}
                /></label>
                <label>Description<textarea
                    maxLength="500"
                    placeholder="What makes this theme special?"
                    value={uploadDescription}
                    onChange={e => setUploadDescription(e.target.value)}
                /></label>
                <label className={styles.fileField}>Theme JSON (optional)<input
                    accept="application/json,.json"
                    type="file"
                    onChange={async e => {
                        const file = e.target.files[0];
                        if (!file) return;
                        try {
                            setUploadFile(JSON.parse(await file.text()));
                            setError('');
                        } catch (_) {
                            setUploadFile(null);
                            setError('That file is not valid JSON.');
                        }
                    }}
                /></label>
                {uploadFile && <div className={styles.fileReady}><Check size={14} /> JSON ready to upload</div>}
                <div className={styles.panelActions}>
                    <button
                        className={styles.primaryButton}
                        disabled={busy}
                        type="submit"
                    ><Upload size={14} /> Upload {uploadFile ? 'JSON' : 'current theme'}</button>
                </div>
            </form>
        </div>
    );

    const editPanel = editing && (
        <div className={styles.overlay}>
            <form
                className={styles.panel}
                onSubmit={event => {
                    event.preventDefault();
                    saveEdit();
                }}
            >
                <div className={styles.panelTitle}>
                    <h2>Edit theme</h2>
                    <button
                        type="button"
                        onClick={() => setEditing(null)}
                    ><X size={16} /></button>
                </div>
                <label>Name<input
                    required
                    maxLength="100"
                    value={editing.name}
                    onChange={e => setEditing({...editing, name: e.target.value})}
                /></label>
                <label>Description<textarea
                    maxLength="500"
                    value={editing.description}
                    onChange={e => setEditing({...editing, description: e.target.value})}
                /></label>
                <div className={styles.panelActions}>
                    <button
                        type="button"
                        className={styles.secondaryButton}
                        onClick={() => setEditing(null)}
                    >Cancel</button>
                    <button
                        className={styles.primaryButton}
                        disabled={busy}
                        type="submit"
                    ><Check size={14} /> Save</button>
                </div>
            </form>
        </div>
    );

    const reportPanel = reporting && (
        <div className={styles.overlay}>
            <form
                className={styles.panel}
                onSubmit={event => {
                    event.preventDefault();
                    submitReport();
                }}
            >
                <div className={styles.panelTitle}>
                    <h2>Report {reporting.name}</h2>
                    <button
                        type="button"
                        onClick={() => setReporting(null)}
                    ><X size={16} /></button>
                </div>
                <label>What is wrong?<textarea
                    required
                    autoFocus
                    maxLength="500"
                    value={reportReason}
                    onChange={e => setReportReason(e.target.value)}
                /></label>
                <div className={styles.panelActions}>
                    <button
                        type="button"
                        className={styles.secondaryButton}
                        onClick={() => setReporting(null)}
                    >Cancel</button>
                    <button
                        className={styles.dangerButton}
                        disabled={busy || !reportReason.trim()}
                        type="submit"
                    ><Flag size={14} /> Send report</button>
                </div>
            </form>
        </div>
    );

    const detail = selected && (
        <div className={styles.detail}>
            <button
                className={styles.backButton}
                onClick={() => {
                    setSelected(null);
                    setSaveNotice('');
                }}
                type="button"
            ><ArrowLeft size={15} /> Back</button>
            <div
                className={styles.detailBanner}
                style={gradientStyle(selected)}
            />
            <div className={styles.detailBody}>
                <span className={styles.platform}>{selected.platform}</span>
                <h2>{selected.name}</h2>
                <p className={styles.byline}>by {selected.authorName || selected.author}</p>
                <p>{selected.description || 'No description provided.'}</p>
                <div className={styles.detailStats}>
                    <span><Heart size={14} /> {selected.likes || 0}</span>
                    <span><Download size={14} /> {selected.downloads || 0}</span>
                </div>
                <div className={styles.detailActions}>
                    <button
                        className={styles.primaryButton}
                        disabled={busy}
                        onClick={applySelected}
                        type="button"
                    >Apply theme</button>
                    <button
                        className={styles.secondaryButton}
                        disabled={busy || savedIds.has(selected.uuid)}
                        onClick={saveSelectedToLibrary}
                        type="button"
                    >
                        {savedIds.has(selected.uuid) ? (
                            <React.Fragment><Check size={14} /> In library</React.Fragment>
                        ) : (
                            <React.Fragment><BookmarkPlus size={14} /> Add to library</React.Fragment>
                        )}
                    </button>
                    <button
                        className={styles.secondaryButton}
                        onClick={() => setReporting(selected)}
                        type="button"
                    ><Flag size={14} /> Report</button>
                    {account && selected.author === account.userId && (
                        <button
                            className={styles.secondaryButton}
                            onClick={() => setEditing({...selected})}
                            type="button"
                        ><Edit3 size={14} /> Edit</button>
                    )}
                    {account && (selected.author === account.userId || account.isAdmin) && (
                        <button
                            className={styles.dangerButton}
                            onClick={() => deleteTheme(selected)}
                            type="button"
                        ><Trash2 size={14} /> Delete</button>
                    )}
                </div>
                {saveNotice && selected && (
                    <p className={styles.saveNotice}>{saveNotice}</p>
                )}
            </div>
        </div>
    );

    const reportsPage = tab === 'admin' && (
        <div className={styles.pageContent}>
            <div className={styles.reportList}>
                {reports.length === 0 ? (
                    <div className={styles.empty}>
                        <Shield size={28} />
                        <h2>No open reports</h2>
                    </div>
                ) : reports.map(report => (
                    <article
                        className={styles.report}
                        key={report.id}
                    >
                        <div>
                            <strong>{report.themeName}</strong>
                            <p>{report.reason}</p>
                            <small>Reported by {report.reporterName}</small>
                        </div>
                        <div className={styles.reportActions}>
                            <button
                                className={styles.secondaryButton}
                                onClick={() => resolveReport(report, 'dismiss')}
                                type="button"
                            ><Check size={14} /> Dismiss</button>
                            <button
                                className={styles.dangerButton}
                                onClick={() => resolveReport(report, 'delete-theme')}
                                type="button"
                            ><Trash2 size={14} /> Delete theme</button>
                        </div>
                    </article>
                ))}
            </div>
        </div>
    );

    const goToTab = nextTab => {
        setTab(nextTab);
        setSelected(null);
        setSaveNotice('');
    };

    const openTheme = theme => {
        setSelected(theme);
        setSaveNotice('');
    };

    const browserPage = (tab === 'browse' || tab === 'mine') && (
        <React.Fragment>
            <div className={styles.toolbar}>
                <div className={styles.searchBox}>
                    <Search size={15} />
                    <input
                        aria-label="Search themes"
                        placeholder="Search themes or creators"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <select
                    aria-label="Sort themes"
                    value={sort}
                    onChange={e => setSort(e.target.value)}
                >
                    <option value="newest">Newest</option>
                    <option value="likes">Most liked</option>
                    <option value="name">Name</option>
                </select>
                <select
                    aria-label="Filter platform"
                    value={platform}
                    onChange={e => setPlatform(e.target.value)}
                >
                    <option value="all">All platforms</option>
                    <option value="mistwarp">MistWarp</option>
                    <option value="nitrobolt">NitroBolt</option>
                </select>
            </div>
            <main className={styles.grid}>
                {busy && visibleThemes.length === 0 ? (
                    <div className={styles.center}><Spinner large /></div>
                ) : visibleThemes.length === 0 ? (
                    <div className={styles.empty}>
                        <Search size={28} />
                        <h2>No themes found</h2>
                        <p>{tab === 'mine' ? 'Upload your current theme to get started.' : 'Try another search.'}</p>
                    </div>
                ) : visibleThemes.map(theme => (
                    <ThemeCard
                        key={theme.uuid}
                        theme={theme}
                        onOpen={openTheme}
                    />
                ))}
            </main>
        </React.Fragment>
    );

    return (
        <Modal
            className={styles.modalContent}
            contentLabel={props.intl.formatMessage(messages.title)}
            id="warpthemeModal"
            width={960}
            height={600}
            onRequestClose={props.onClose}
        >
            {!props.roturUsername ? loginGate : permissionMissing ? permissionGate : busy && !account ? (
                <div className={styles.gate}><Spinner large /><p>Connecting to WarpTheme…</p></div>
            ) : !account ? (
                <div className={styles.gate}>
                    <div className={styles.gateIcon}><X size={22} /></div>
                    <h2>Could not connect to WarpTheme</h2>
                    <p>{error}</p>
                    <button
                        className={styles.primaryButton}
                        onClick={() => setSessionAttempt(value => value + 1)}
                        type="button"
                    >Retry</button>
                </div>
            ) : (
                <Box className={styles.sidebarLayout}>
                    <div className={styles.sidebar}>
                        <nav
                            className={styles.sidebarItems}
                            aria-label="WarpTheme sections"
                        >
                            <div className={styles.sidebarGroup}>
                                <div className={styles.sidebarGroupHeader}>Marketplace</div>
                                <SidebarItem
                                    active={tab === 'browse'}
                                    icon={Search}
                                    label="Browse"
                                    onClick={() => goToTab('browse')}
                                />
                                <SidebarItem
                                    active={tab === 'mine'}
                                    icon={User}
                                    label="My themes"
                                    onClick={() => goToTab('mine')}
                                />
                                <SidebarItem
                                    active={tab === 'upload'}
                                    icon={Upload}
                                    label="Upload"
                                    onClick={() => goToTab('upload')}
                                />
                            </div>
                            {account.isAdmin && (
                                <div className={styles.sidebarGroup}>
                                    <div className={styles.sidebarGroupHeader}>Administration</div>
                                    <SidebarItem
                                        active={tab === 'admin'}
                                        badge={reports.length}
                                        icon={Shield}
                                        label="Reports"
                                        onClick={() => goToTab('admin')}
                                    />
                                </div>
                            )}
                        </nav>
                        <div className={styles.sidebarAccount}>
                            <img
                                alt=""
                                src={`https://avatars.rotur.dev/${encodeURIComponent(account.user.username)}`}
                            />
                            <div>
                                <strong>{account.user.username}</strong>
                                <span>Rotur</span>
                            </div>
                            {account.isAdmin && <Shield size={14} />}
                        </div>
                    </div>
                    <div className={styles.contentArea}>
                        {error && (
                            <div className={styles.error}>
                                {error}
                                <button
                                    onClick={() => setError('')}
                                    type="button"
                                ><X size={14} /></button>
                            </div>
                        )}
                        {detail || browserPage || uploadPage || reportsPage}
                    </div>
                    {editPanel}
                    {reportPanel}
                </Box>
            )}
        </Modal>
    );
};

WarpThemeModal.propTypes = {
    currentTheme: PropTypes.object,
    intl: intlShape,
    onClose: PropTypes.func.isRequired,
    onRoturLogin: PropTypes.func.isRequired,
    onThemeApply: PropTypes.func.isRequired,
    onThemeSave: PropTypes.func,
    roturUsername: PropTypes.string
};

export default injectIntl(WarpThemeModal);
