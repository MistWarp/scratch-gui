/* eslint-disable react/jsx-no-bind, no-alert */
import PropTypes from 'prop-types';
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
    ArrowLeft, BookmarkPlus, Check, Download, Edit3, FileJson, Flag, Heart, LogIn,
    Palette, Search, Shield, Trash2, Upload, User, X
} from 'lucide-react';
import {useUser} from '../UserContext.jsx';
import {
    API, TOKEN_MANAGER, request, openSession, storeToken, gradientStyle, exportCurrentTheme
} from '../../lib/warptheme.js';
import {CustomTheme, customThemeManager} from '../../lib/themes/custom-themes.js';
import styles from './WarpThemePanel.module.css';

const TABS = [
    {key: 'browse', label: 'Browse', icon: Search},
    {key: 'mine', label: 'My themes', icon: User},
    {key: 'upload', label: 'Upload', icon: Upload}
];

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
            <span className={styles.themeStats}>
                <span><Heart size={12} /> {theme.likes || 0}</span>
                <span><Download size={12} /> {theme.downloads || 0}</span>
                <span>{theme.platform}</span>
            </span>
        </span>
    </button>
);

ThemeCard.propTypes = {
    onOpen: PropTypes.func.isRequired,
    theme: PropTypes.object.isRequired
};

const WarpThemePanel = ({theme, onThemeChange}) => {
    const {user, login} = useUser();
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
    const [notice, setNotice] = useState('');
    const [uploadName, setUploadName] = useState('');
    const [uploadDescription, setUploadDescription] = useState('');
    const [uploadFile, setUploadFile] = useState(null);
    const [uploadSource, setUploadSource] = useState('current');
    const [editing, setEditing] = useState(null);
    const [reporting, setReporting] = useState(null);
    const [reportReason, setReportReason] = useState('');
    const [savedIds, setSavedIds] = useState(() => new Set());

    const username = user && user.username;

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
        if (!username) {
            storeToken(null);
            setAccount(null);
            setToken(null);
            return;
        }
        setBusy(true);
        setError('');
        setPermissionMissing(false);
        openSession(username)
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
    }, [loadMyThemes, loadReports, loadThemes, username, sessionAttempt]);

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
            .filter(item => platform === 'all' || item.platform === platform)
            .filter(item => !query || [item.name, item.description, item.authorName]
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

    const currentExport = useMemo(() => exportCurrentTheme(theme), [theme]);

    const fetchSelectedExport = async () => {
        const response = await fetch(
            `${API}/theme/export?uuid=${encodeURIComponent(selected.uuid)}&platform=mistwarp`,
            {headers: {Authorization: `Bearer ${token}`}}
        );
        if (!response.ok) throw new Error('Failed to export this theme.');
        return response.json();
    };

    const applySelected = () => run(async () => {
        const data = await fetchSelectedExport();
        if (!data || !data.themes || data.themes.length === 0) {
            throw new Error('Invalid theme data format');
        }
        onThemeChange(CustomTheme.import(data.themes[0]));
        setNotice(`Applied “${selected.name}”.`);
    });

    const saveSelectedToLibrary = () => run(async () => {
        if (savedIds.has(selected.uuid)) return;
        const data = await fetchSelectedExport();
        const saved = customThemeManager.addFromExportData(data, {
            name: selected.name,
            description: selected.description || '',
            author: selected.authorName || selected.author || 'WarpTheme'
        });
        setSavedIds(prev => new Set(prev).add(selected.uuid));
        setNotice(`“${saved.name}” added to your custom theme library.`);
    });

    const parseThemeFile = async file => {
        if (!file) return;
        try {
            const parsed = JSON.parse(await file.text());
            setUploadFile(parsed);
            setError('');
            const first = Array.isArray(parsed.themes) ? parsed.themes[0] : parsed;
            if (first && first.name && !uploadName.trim()) {
                setUploadName(String(first.name).slice(0, 100));
            }
            if (first && first.description && !uploadDescription.trim()) {
                setUploadDescription(String(first.description).slice(0, 500));
            }
        } catch (_) {
            setUploadFile(null);
            setError('That file is not valid theme JSON.');
        }
    };

    const uploadTheme = () => run(async () => {
        if (uploadSource === 'file' && !uploadFile) {
            throw new Error('Choose a theme JSON file, or switch to your current theme.');
        }
        const source = uploadSource === 'file' ? uploadFile : currentExport;
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
        setUploadSource('current');
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

    const deleteTheme = item => {
        if (!window.confirm(`Delete “${item.name}”? This cannot be undone.`)) return;
        run(async () => {
            await request(`/theme?uuid=${encodeURIComponent(item.uuid)}`, token, {method: 'DELETE'});
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
        setNotice('Report sent. Thanks for helping keep WarpTheme safe.');
    });

    const resolveReport = (report, action) => run(async () => {
        await request('/admin/report/resolve', token, {
            method: 'POST',
            body: JSON.stringify({id: report.id, action})
        });
        if (action === 'delete-theme') setSelected(null);
        await refresh();
    });

    const goToTab = nextTab => {
        setTab(nextTab);
        setSelected(null);
        setEditing(null);
        setReporting(null);
        setNotice('');
    };

    if (!username) {
        return (
            <div className={styles.gate}>
                <User size={26} />
                <h3>Sign in to WarpTheme</h3>
                <p>The theme marketplace uses your Rotur account for uploads, reports, and ownership.</p>
                <button
                    className={styles.primaryButton}
                    onClick={login}
                    type="button"
                >
                    <LogIn size={15} /> Sign in with Rotur
                </button>
            </div>
        );
    }

    if (permissionMissing) {
        return (
            <div className={styles.gate}>
                <Shield size={26} />
                <h3>WarpTheme needs one more permission</h3>
                <p>
                    Edit your current token in Rotur Token Manager and enable
                    {' '}<strong>validators:generate</strong>. Then return here and retry.
                </p>
                <div className={styles.gateActions}>
                    <a
                        className={styles.primaryButton}
                        href={TOKEN_MANAGER}
                        target="_blank"
                        rel="noreferrer"
                    >Open Token Manager</a>
                    <button
                        className={styles.secondaryButton}
                        onClick={() => setSessionAttempt(value => value + 1)}
                        type="button"
                    >Retry</button>
                </div>
            </div>
        );
    }

    if (!account) {
        return (
            <div className={styles.gate}>
                {busy ? (
                    <p>Connecting to WarpTheme…</p>
                ) : (
                    <React.Fragment>
                        <X size={26} />
                        <h3>Could not connect to WarpTheme</h3>
                        <p>{error}</p>
                        <button
                            className={styles.primaryButton}
                            onClick={() => setSessionAttempt(value => value + 1)}
                            type="button"
                        >Retry</button>
                    </React.Fragment>
                )}
            </div>
        );
    }

    const tabs = account.isAdmin ? [...TABS, {key: 'admin', label: 'Reports', icon: Shield}] : TABS;

    const detail = selected && (
        <div className={styles.detail}>
            <button
                className={styles.backButton}
                onClick={() => {
                    setSelected(null);
                    setEditing(null);
                    setReporting(null);
                    setNotice('');
                }}
                type="button"
            ><ArrowLeft size={15} /> Back</button>
            <div
                className={styles.detailBanner}
                style={gradientStyle(selected)}
            />
            <h3>{selected.name}</h3>
            <p className={styles.byline}>
                by {selected.authorName || selected.author} · {selected.platform}
            </p>
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
                ><Palette size={14} /> Apply theme</button>
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
                {selected.author === account.userId && (
                    <button
                        className={styles.secondaryButton}
                        onClick={() => setEditing({...selected})}
                        type="button"
                    ><Edit3 size={14} /> Edit</button>
                )}
                {(selected.author === account.userId || account.isAdmin) && (
                    <button
                        className={styles.dangerButton}
                        onClick={() => deleteTheme(selected)}
                        type="button"
                    ><Trash2 size={14} /> Delete</button>
                )}
            </div>

            {editing && (
                <form
                    className={styles.inlineForm}
                    onSubmit={event => {
                        event.preventDefault();
                        saveEdit();
                    }}
                >
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
                    <div className={styles.formActions}>
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
            )}

            {reporting && (
                <form
                    className={styles.inlineForm}
                    onSubmit={event => {
                        event.preventDefault();
                        submitReport();
                    }}
                >
                    <label>What is wrong with this theme?<textarea
                        required
                        maxLength="500"
                        value={reportReason}
                        onChange={e => setReportReason(e.target.value)}
                    /></label>
                    <div className={styles.formActions}>
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
            )}
        </div>
    );

    const browser = (tab === 'browse' || tab === 'mine') && !selected && (
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
            {visibleThemes.length === 0 ? (
                <div className={styles.empty}>
                    <Search size={24} />
                    <p>{tab === 'mine' ? 'Upload your current theme to get started.' : 'No themes found.'}</p>
                </div>
            ) : (
                <div className={styles.grid}>
                    {visibleThemes.map(item => (
                        <ThemeCard
                            key={item.uuid}
                            theme={item}
                            onOpen={setSelected}
                        />
                    ))}
                </div>
            )}
        </React.Fragment>
    );

    const uploadPreviewSource = uploadSource === 'file' && uploadFile ?
        (Array.isArray(uploadFile.themes) ? uploadFile.themes[0] : uploadFile) :
        currentExport;

    const uploadPage = tab === 'upload' && (
        <form
            className={styles.uploadForm}
            onSubmit={event => {
                event.preventDefault();
                uploadTheme();
            }}
        >
            <div className={styles.sourceRow}>
                <button
                    className={uploadSource === 'current' ? styles.sourceActive : styles.sourceCard}
                    onClick={() => setUploadSource('current')}
                    type="button"
                >
                    <Palette size={17} />
                    <span>
                        <strong>Current theme</strong>
                        <em>Share what you have applied right now</em>
                    </span>
                </button>
                <button
                    className={uploadSource === 'file' ? styles.sourceActive : styles.sourceCard}
                    onClick={() => setUploadSource('file')}
                    type="button"
                >
                    <FileJson size={17} />
                    <span>
                        <strong>JSON file</strong>
                        <em>Upload an exported theme file</em>
                    </span>
                </button>
            </div>

            <div
                className={styles.uploadPreview}
                style={gradientStyle(uploadPreviewSource)}
            >
                <strong>
                    {uploadName.trim() || (uploadPreviewSource && uploadPreviewSource.name) || 'Untitled theme'}
                </strong>
            </div>

            <label className={styles.field}>Name<input
                maxLength="100"
                placeholder={(currentExport && currentExport.name) || 'Theme name'}
                value={uploadName}
                onChange={e => setUploadName(e.target.value)}
            /></label>
            <label className={styles.field}>Description<textarea
                maxLength="500"
                placeholder="What makes this theme special?"
                value={uploadDescription}
                onChange={e => setUploadDescription(e.target.value)}
            /></label>

            {uploadSource === 'file' && (
                <label className={styles.field}>Theme JSON file<input
                    accept="application/json,.json"
                    type="file"
                    onChange={e => parseThemeFile(e.target.files[0])}
                /></label>
            )}

            <div className={styles.formActions}>
                <button
                    className={styles.primaryButton}
                    disabled={busy || (uploadSource === 'file' && !uploadFile)}
                    type="submit"
                >
                    <Upload size={14} />
                    {uploadSource === 'file' ? 'Upload JSON' : 'Upload current theme'}
                </button>
            </div>
        </form>
    );

    const adminPage = tab === 'admin' && (
        <div className={styles.reportList}>
            {reports.length === 0 ? (
                <div className={styles.empty}>
                    <Shield size={24} />
                    <p>No open reports.</p>
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
                    <div className={styles.formActions}>
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
    );

    return (
        <div className={styles.panel}>
            <div
                className={styles.tabs}
                role="tablist"
            >
                {tabs.map(item => {
                    const Icon = item.icon;
                    return (
                        <button
                            key={item.key}
                            role="tab"
                            type="button"
                            aria-selected={tab === item.key}
                            className={tab === item.key ? styles.tabActive : styles.tab}
                            onClick={() => goToTab(item.key)}
                        >
                            <Icon size={15} />
                            <span>{item.label}</span>
                            {item.key === 'admin' && reports.length > 0 && (
                                <span className={styles.tabBadge}>{reports.length}</span>
                            )}
                        </button>
                    );
                })}
            </div>

            {error && (
                <div className={styles.error}>
                    {error}
                    <button
                        onClick={() => setError('')}
                        type="button"
                        aria-label="Dismiss error"
                    ><X size={14} /></button>
                </div>
            )}
            {notice && !error && (
                <div className={styles.notice}>{notice}</div>
            )}

            {detail || browser || uploadPage || adminPage}
        </div>
    );
};

WarpThemePanel.propTypes = {
    theme: PropTypes.object,
    onThemeChange: PropTypes.func.isRequired
};

export default WarpThemePanel;
