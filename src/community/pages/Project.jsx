import React, {useEffect, useState, useCallback, useMemo, useRef} from 'react';
import {useParams, Link, useNavigate} from 'react-router-dom';
import {
    Heart, ThumbsDown, ArrowLeft, Play, GitFork, ExternalLink, EyeOff,
    MessageSquareOff, MessageSquare, ImageUp, MonitorPlay, Upload, Blocks, Flag,
    ShieldCheck, ShieldAlert, MoreHorizontal, Trash2, Link2, Link as LinkIcon, Lock, Coins, SlidersHorizontal,
    Palette, Bookmark, BookmarkCheck
} from 'lucide-react';
import api, {projectUrl, editorUrl, embedUrl, stashProjectHandoff} from '../api';
import {cachedFetchBuffer, cachedFetchJson} from '../../lib/community/cached-fetch.js';
import {buyProject} from '../purchase';
import {isInsufficientFunds, KO_FI_SHOP_URL} from '../credits';
import RoturConsentModal from '../components/RoturConsentModal.jsx';
import {getBalance} from '../../lib/rotur/client.js';
import {
    hasFullGrant, commitGrant, callRotur,
    activityAllowed, rememberActivityDecision, isActivityMethod
} from '../../lib/rotur/extension-bridge.js';
import {getRoturSettings, setRoturSetting} from '../../lib/rotur/settings.js';
import {getUsernameOverride} from '../../lib/rotur/cloud-sync.js';
import useEscape from '../use-escape.js';
import rotur from '../rotur';
import {Theme} from '../../lib/themes';
import {CustomTheme} from '../../lib/themes/custom-themes.js';
import {applyThemeVisuals, detectTheme} from '../../lib/themes/themePersistance';
import Avatar from '../components/Avatar.jsx';
import VisibilityMenu from '../components/VisibilityMenu.jsx';
import ProjectInfoPanel from '../components/ProjectInfoPanel.jsx';
import {useUser} from '../UserContext.jsx';
import {timeAgo, sameUser} from '../format';
import CommentThread from '../components/CommentThread.jsx';
import ReportModal from '../components/ReportModal.jsx';
import DiffView from '../components/DiffView.jsx';
import isTrustedExtensionUrl from '../../lib/trusted-extension.js';
import setPageMeta from '../page-meta.js';
import useLatest from '../use-latest.js';
import styles from './Project.module.css';

const formatDate = ms => {
    if (!ms) return null;
    try {
        return new Date(ms).toLocaleDateString([], {year: 'numeric', month: 'short', day: 'numeric'});
    } catch (e) {
        return null;
    }
};

const CATEGORY_NAMES = {
    motion: 'Motion',
    looks: 'Looks',
    sound: 'Sound',
    event: 'Events',
    control: 'Control',
    sensing: 'Sensing',
    operator: 'Operators',
    data: 'Variables',
    procedures: 'My Blocks',
    argument: 'My Blocks',
    pen: 'Pen',
    music: 'Music'
};

const CATEGORY_COLORS = {
    motion: '#4C97FF',
    looks: '#9966FF',
    sound: '#CF63CF',
    event: '#FFBF00',
    control: '#FFAB19',
    sensing: '#5CB1D6',
    operator: '#59C059',
    data: '#FF8C1A',
    procedures: '#FF6680',
    argument: '#FF6680',
    pen: '#0FBD8C'
};

const catLabel = prefix => CATEGORY_NAMES[prefix] || (prefix.charAt(0).toUpperCase() + prefix.slice(1));
const catColor = prefix => CATEGORY_COLORS[prefix] || 'var(--accent-strong)';

const PROJECT_THEME_MODE_KEY = 'mw:project-theme-mode';
const getProjectThemeMode = () => {
    try {
        return localStorage.getItem(PROJECT_THEME_MODE_KEY) || 'all';
    } catch (e) {
        return 'all';
    }
};

const buildProjectTheme = payload => {
    try {
        if (payload && payload.kind === 'custom' && payload.data) {
            return CustomTheme.import(payload.data);
        }
        if (payload && payload.kind === 'standard' && payload.data) {
            const d = payload.data;
            return new Theme(d.accent, d.gui, d.blocks, d.menuBarAlign, d.wallpaper, d.fonts, null, d.appearance || {});
        }
    } catch (e) {
        // ignore malformed payloads
    }
    return null;
};

const restoreUserTheme = () => {
    try {
        applyThemeVisuals(detectTheme());
    } catch (e) {
        // ignore
    }
};

const topFive = counts => Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);

const getCustomExtensions = data => {
    const urls = {...(data.extensionURLs || {})};
    for (const target of data.targets || []) {
        Object.assign(urls, target.extensionURLs || {});
    }
    return Object.values(urls).filter(url => typeof url === 'string' && !isTrustedExtensionUrl(url));
};

const analyzeBlocks = data => {
    const categories = {};
    let total = 0;
    for (const target of data.targets || []) {
        for (const block of Object.values(target.blocks || {})) {
            if (!block || typeof block !== 'object' || !block.opcode) continue;
            total += 1;
            const prefix = block.opcode.split('_')[0];
            categories[prefix] = (categories[prefix] || 0) + 1;
        }
    }
    const topCategories = topFive(categories)
        .map(([prefix, count]) => ({id: prefix, label: catLabel(prefix), count, color: catColor(prefix)}));
    return {total, topCategories};
};

const Project = () => {
    const {id} = useParams();
    const {user, loading: userLoading} = useUser();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [error, setError] = useState(null);
    const [actionError, setActionError] = useState(null);
    const [tab, setTab] = useState('Comments');
    const [title, setTitle] = useState('');
    const [savingTitle, setSavingTitle] = useState(false);
    const [thumbnailMenu, setThumbnailMenu] = useState(false);
    const [thumbnailStatus, setThumbnailStatus] = useState('idle');
    const [reporting, setReporting] = useState(false);
    const [copied, setCopied] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);
    const thumbMenuRef = useRef(null);
    const thumbInput = useRef(null);
    const stageFrame = useRef(null);
    const [blockStats, setBlockStats] = useState(null);
    const [customExtensions, setCustomExtensions] = useState([]);
    const [unsandboxed, setUnsandboxed] = useState(false);
    const [buying, setBuying] = useState(false);
    const [confirmBuy, setConfirmBuy] = useState(false);
    const [confirmBalance, setConfirmBalance] = useState(null);
    const [savingLibrary, setSavingLibrary] = useState(false);
    const [projectThemeApplied, setProjectThemeApplied] = useState(false);
    const [revertTheme, setRevertTheme] = useState(false);
    const [followsOwner, setFollowsOwner] = useState(false);
    const [roturModal, setRoturModal] = useState(null);
    const themeMode = getProjectThemeMode();
    useEscape(confirmBuy ? () => setConfirmBuy(false) : null);

    const beginLoad = useLatest();

    const load = useCallback(() => {
        const fresh = beginLoad();
        return api.getProject(id)
            .then(fresh(data => {
                setProject(data.project);
                setError(null);
            }))
            .catch(fresh(e => setError(
                e && e.status === 404 ? 'Project not found.' : 'Could not load this project.'
            )));
    }, [id, beginLoad]);

    useEffect(() => {
        setProject(null);
        setError(null);
        setActionError(null);
        setReporting(false);
        setTab('Comments');
        setProjectThemeApplied(false);
        setRevertTheme(false);
        setFollowsOwner(false);
        restoreUserTheme();
        load();
        api.view(id).catch(() => {});
    }, [id, load]);

    useEffect(() => {
        const onMessage = event => {
            if (event.data && event.data.type === 'mw:project-theme-applied') {
                setProjectThemeApplied(true);
                const theme = buildProjectTheme(event.data.theme);
                if (theme) {
                    try {
                        applyThemeVisuals(theme);
                    } catch (e) {
                        // ignore
                    }
                }
            }
        };
        window.addEventListener('message', onMessage);
        return () => window.removeEventListener('message', onMessage);
    }, []);

    // Always hand the viewer's own theme back when leaving the project.
    useEffect(() => () => restoreUserTheme(), []);

    // Scroll to a comment anchor after the comments section renders
    useEffect(() => {
        const hash = window.location.hash;
        if (!hash) return;
        const anchorId = hash.replace('#', '');
        const tryScroll = (attempts = 0) => {
            const el = document.getElementById(anchorId);
            if (el) {
                el.scrollIntoView({behavior: 'smooth', block: 'center'});
                return;
            }
            if (attempts < 20) {
                setTimeout(() => tryScroll(attempts + 1), 300);
            }
        };
        tryScroll();
    }, [project]); // re-run when project data loads (which triggers comment rendering)

    const owner = project && project.owner;
    useEffect(() => {
        if (themeMode !== 'followed' || !user || !owner) return;
        let active = true;
        rotur.following(user.username)
            .then(data => {
                if (!active) return;
                const list = (data.following || []).map(name => String(name).toLowerCase());
                setFollowsOwner(list.includes(String(owner).toLowerCase()));
            })
            .catch(() => {});
        return () => {
            active = false;
        };
    }, [themeMode, user, owner]);

    useEffect(() => {
        if (project) setTitle(project.title || '');
    }, [project]);

    useEffect(() => {
        if (!project) return;
        setPageMeta({
            title: `${project.title} by ${project.owner}`,
            description: project.instructions || project.description,
            image: project.thumbUrl
        });
    }, [project]);

    const projectJsonUrl = project && project.projectJsonUrl;
    const projectJsonBytes = project && project.jsonBytes;
    useEffect(() => {
        setBlockStats(null);
        setCustomExtensions([]);
        setUnsandboxed(false);
        let cancelled = false;
        if (projectJsonUrl && !(projectJsonBytes > 5 * 1024 * 1024)) {
            cachedFetchJson(projectJsonUrl)
                .then(data => {
                    if (cancelled) return;
                    setBlockStats(analyzeBlocks(data));
                    setCustomExtensions(getCustomExtensions(data));
                })
                .catch(() => !cancelled && setBlockStats(null));
        }
        return () => {
            cancelled = true;
        };
    }, [projectJsonUrl, projectJsonBytes]);

    const runUnsandboxed = () => {
        // eslint-disable-next-line no-alert
        const ok = window.confirm(
            'This project uses custom extensions.\n\n' +
            'Running it without the sandbox gives it full access to your MistWarp account. ' +
            'It could read your login session, act as you, or change your data. ' +
            'Only continue if you trust the person who made this project.'
        );
        if (ok) setUnsandboxed(true);
    };

    useEffect(() => {
        let timeout;
        if (thumbnailStatus === 'saved') {
            timeout = setTimeout(() => setThumbnailStatus('idle'), 2500);
        }
        return () => clearTimeout(timeout);
    }, [thumbnailStatus]);

    const saveTitle = async () => {
        if (!project || !project.isOwner || savingTitle) return;
        const next = title.trim();
        if (!next) {
            setTitle(project.title);
            setActionError('Project titles cannot be empty.');
            return;
        }
        if (next === project.title) return;
        try {
            setSavingTitle(true);
            await api.updateProject(id, {title: next});
            setProject(current => ({...current, title: next}));
            setActionError(null);
        } catch (e) {
            setTitle(project.title);
            setActionError(e.message || 'Could not update the title.');
        } finally {
            setSavingTitle(false);
        }
    };

    useEffect(() => {
        if (!project || !project.projectJsonUrl) return;
        const assetsBase = project.assetsBase ? `${project.assetsBase.replace(/\/+$/, '')}/` : null;
        const allowed = url => typeof url === 'string' &&
            (url === project.projectJsonUrl || (assetsBase && url.startsWith(assetsBase)));
        const onMessage = event => {
            const frame = stageFrame.current;
            if (!frame || event.source !== frame.contentWindow) return;
            const data = event.data;
            if (!data || data.type !== 'mw:fetch' || !allowed(data.url)) return;
            const reply = (message, transfer) => {
                try {
                    event.source.postMessage(message, '*', transfer);
                } catch (e) {
                    // ignore
                }
            };
            cachedFetchBuffer(data.url)
                .then(buffer => reply({type: 'mw:fetch-result', id: data.id, buffer}, [buffer]))
                .catch(() => reply({type: 'mw:fetch-result', id: data.id}));
        };
        window.addEventListener('message', onMessage);
        return () => window.removeEventListener('message', onMessage);
    }, [project]);

    const userMessage = useMemo(() => ({
        type: 'mw:rotur-user',
        user: {
            loggedIn: Boolean(user && user.username),
            username: (user && user.username) || '',
            id: (user && user.id) || ''
        },
        displayName: user && user.username ? getUsernameOverride() || `@${user.username}` : '',
        projectId: (project && project.id) || id || '',
        projectName: (project && (project.title || project.name)) || '',
        projectImage: (project && project.thumbUrl) || ''
    }), [user, project, id]);

    // Rotur bridge for the embedded player. The project iframe cannot hold the
    // token or render trusted UI, so its Rotur blocks post requests up here; this
    // page holds the token (via lib/rotur/client) and renders consent/confirm UI
    // that the sandboxed project cannot read or approve on its own.
    useEffect(() => {
        const identity = userMessage.user;
        const onMessage = event => {
            const frame = stageFrame.current;
            if (!frame || event.source !== frame.contentWindow) return;
            const data = event.data;
            if (!data || data.type !== 'mw:rotur') return;
            const source = event.source;
            const reply = payload => {
                try {
                    source.postMessage({type: 'mw:rotur-result', ...payload}, '*');
                } catch (e) {
                    // ignore
                }
            };

            if (data.kind === 'hello') {
                // While identity is still restoring, stay silent: answering now
                // would settle the embed's cache as logged-out. The proactive
                // push below runs once loading finishes and answers instead.
                if (userLoading) return;
                try {
                    source.postMessage(userMessage, '*');
                } catch (e) {
                    // ignore
                }
                return;
            }

            if (data.kind === 'consent') {
                const scopes = data.scopes || [];
                const meta = data.meta || {};
                if (!identity.loggedIn) {
                    reply({id: data.id, ok: true, result: false});
                    return;
                }
                if (hasFullGrant(meta, scopes)) {
                    reply({id: data.id, ok: true, result: true});
                    return;
                }
                setRoturModal({
                    type: 'consent',
                    data: {scopes, username: identity.username, name: meta.name},
                    onAllow: async () => {
                        setRoturModal(null);
                        try {
                            await commitGrant(meta, scopes);
                            reply({id: data.id, ok: true, result: true});
                        } catch (e) {
                            reply({id: data.id, ok: false, error: String((e && e.message) || e)});
                        }
                    },
                    onDeny: () => {
                        setRoturModal(null);
                        reply({id: data.id, ok: true, result: false});
                    }
                });
                return;
            }

            if (data.kind === 'call') {
                const {method, args, opts} = data;
                const perform = async () => {
                    try {
                        const result = await callRotur(method, args);
                        reply({id: data.id, ok: true, result});
                    } catch (e) {
                        reply({id: data.id, ok: false, error: String((e && e.message) || e)});
                    }
                };
                if (isActivityMethod(method)) {
                    const key = (project && project.id) || id || `name:${(project && project.title) || ''}`;
                    const decision = activityAllowed(getRoturSettings().activitySharing, key);
                    if (decision === true) {
                        perform();
                        return;
                    }
                    if (decision === false) {
                        reply({id: data.id, ok: true, result: ''});
                        return;
                    }
                    setRoturModal({
                        type: 'share',
                        data: {username: identity.username, name: (project && project.title) || ''},
                        onShareThis: () => {
                            setRoturModal(null);
                            rememberActivityDecision(key, true);
                            perform();
                        },
                        onShareAll: () => {
                            setRoturModal(null);
                            setRoturSetting('activitySharing', 'all');
                            perform();
                        },
                        onShareNo: () => {
                            setRoturModal(null);
                            rememberActivityDecision(key, false);
                            reply({id: data.id, ok: true, result: ''});
                        }
                    });
                    return;
                }
                if (opts && opts.sensitive) {
                    setRoturModal({
                        type: 'confirm',
                        data: {label: (opts && opts.label) || method, username: identity.username},
                        onAllow: () => {
                            setRoturModal(null);
                            perform();
                        },
                        onDeny: () => {
                            setRoturModal(null);
                            reply({id: data.id, ok: false, error: 'You cancelled this Rotur action'});
                        }
                    });
                } else {
                    perform();
                }
            }
        };
        window.addEventListener('message', onMessage);
        // Push identity proactively so a login (or logout) after the embed has
        // loaded refreshes its cache, instead of waiting for a hello that only
        // fires once.
        try {
            const frame = stageFrame.current;
            if (!userLoading && frame && frame.contentWindow) {
                frame.contentWindow.postMessage(userMessage, '*');
            }
        } catch (e) {
            // ignore
        }
        return () => window.removeEventListener('message', onMessage);
    }, [user, userLoading, project, id, userMessage]);

    const sendThemeToStage = useCallback(() => {
        try {
            const frame = stageFrame.current;
            if (!frame || !frame.contentWindow) return;
            frame.contentWindow.postMessage({
                type: 'mw:apply-theme',
                theme: localStorage.getItem('tw:theme'),
                customThemes: localStorage.getItem('tw:custom-themes')
            }, '*');
            if (!userLoading) {
                frame.contentWindow.postMessage(userMessage, '*');
            }
        } catch (e) {
            // ignore
        }
    }, [userLoading, userMessage]);

    const handleTitleKeyDown = event => {
        if (event.key === 'Enter') {
            event.currentTarget.blur();
        }
    };

    const react = async type => {
        if (!user) return;
        try {
            await api.reactProject(id, type);
            load();
        } catch (e) {
            setActionError(e.message || 'Could not react.');
        }
    };

    const remix = async () => {
        if (!user) return;
        try {
            const result = await api.remix(id);
            window.location.href = editorUrl({platformProject: result.id});
        } catch (e) {
            setActionError('Could not remix this project.');
        }
    };

    const changeVisibility = async value => {
        try {
            await api.setVisibility(id, value);
            setActionError(null);
            load();
        } catch (e) {
            setActionError(e.message || 'Could not update visibility.');
        }
    };

    const openBuyConfirm = async () => {
        setActionError(null);
        setConfirmBalance(null);
        setConfirmBuy(true);
        try {
            setConfirmBalance(await getBalance());
        } catch (e) {
            // balance stays null; the purchase still guards on the server
        }
    };

    const doBuy = async () => {
        if (buying) return;
        setBuying(true);
        setActionError(null);
        try {
            const fresh = await buyProject(id);
            setProject(fresh);
            setConfirmBuy(false);
        } catch (e) {
            setConfirmBuy(false);
            if (isInsufficientFunds(e)) {
                window.location.assign(KO_FI_SHOP_URL);
            } else if (e.needsReauth) {
                setActionError('Your current login cannot send credits. Log out and back in, then try again.');
            } else {
                setActionError(e.message || 'Could not complete the purchase.');
            }
        } finally {
            setBuying(false);
        }
    };

    const toggleComments = async () => {
        try {
            await api.updateProject(id, {commentsOff: !project.commentsOff});
            setActionError(null);
            load();
        } catch (e) {
            setActionError(e.message || 'Could not update comments.');
        }
    };

    const removeProject = async () => {
        setMenuOpen(false);
        if (!window.confirm('Delete this project? This cannot be undone.')) return;
        try {
            await api.deleteProject(id);
            navigate(`/users/${project.owner}`);
        } catch (e) {
            setActionError(e.message || 'Could not delete this project.');
        }
    };

    const toggleLibrary = async () => {
        setMenuOpen(false);
        if (savingLibrary) return;
        setSavingLibrary(true);
        try {
            if (project.saved) {
                await api.unsaveProject(id);
            } else {
                await api.saveProject(id);
            }
            setProject(current => ({...current, saved: !current.saved}));
            setActionError(null);
        } catch (e) {
            setActionError(e.message || 'Could not update your library.');
        } finally {
            setSavingLibrary(false);
        }
    };

    const copyLink = () => {
        setMenuOpen(false);
        navigator.clipboard.writeText(window.location.href)
            .then(() => {
                setActionError(null);
                setThumbnailStatus('idle');
                setCopied(true);
                window.setTimeout(() => setCopied(false), 2000);
            })
            .catch(() => setActionError('Could not copy the link.'));
    };
    const menuRemix = () => {
        setMenuOpen(false);
        remix();
    };
    const menuComments = () => {
        setMenuOpen(false);
        toggleComments();
    };
    const menuReport = () => {
        setMenuOpen(false);
        setReporting(true);
    };

    useEffect(() => {
        const onDown = event => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setMenuOpen(false);
            }
            if (thumbMenuRef.current && !thumbMenuRef.current.contains(event.target)) {
                setThumbnailMenu(false);
            }
        };
        window.addEventListener('mousedown', onDown);
        return () => window.removeEventListener('mousedown', onDown);
    }, []);

    const pickThumbnail = event => {
        const file = event.target.files && event.target.files[0];
        event.target.value = '';
        if (!file) return;
        setThumbnailStatus('saving');
        api.setThumbnail(id, file)
            .then(() => {
                setActionError(null);
                setThumbnailStatus('saved');
                load();
            })
            .catch(e => {
                setThumbnailStatus('idle');
                setActionError(e.message || 'Could not set thumbnail.');
            });
    };

    const useStageThumbnail = () => {
        setThumbnailMenu(false);
        const frame = stageFrame.current;
        if (!frame || !frame.contentWindow) {
            setActionError('Stage is not ready yet.');
            return;
        }
        setThumbnailStatus('saving');
        let timeout = 0;
        const onMessage = event => {
            if (event.source !== frame.contentWindow || !event.data || event.data.type !== 'mw:stage-capture') {
                return;
            }
            window.removeEventListener('message', onMessage);
            clearTimeout(timeout);
            if (event.data.error || !event.data.dataURL) {
                setThumbnailStatus('idle');
                setActionError('Could not capture the current stage.');
                return;
            }
            fetch(event.data.dataURL)
                .then(response => response.blob())
                .then(blob => api.setThumbnail(id, blob))
                .then(() => {
                    setActionError(null);
                    setThumbnailStatus('saved');
                    load();
                })
                .catch(e => {
                    setThumbnailStatus('idle');
                    setActionError(e.message || 'Could not set thumbnail.');
                });
        };
        timeout = setTimeout(() => {
            window.removeEventListener('message', onMessage);
            setThumbnailStatus('idle');
            setActionError('Could not capture the current stage.');
        }, 5000);
        window.addEventListener('message', onMessage);
        frame.contentWindow.postMessage({type: 'mw:capture-stage'}, '*');
    };

    const chooseThumbnailUpload = () => {
        setThumbnailMenu(false);
        thumbInput.current.click();
    };

    const commentSource = useMemo(() => ({
        list: () => api.getComments(id),
        add: (content, parent) => api.addComment(id, content, parent),
        remove: commentId => api.deleteComment(id, commentId),
        react: (commentId, type) => api.reactComment(id, commentId, type)
    }), [id]);

    if (error && !project) {
        return <main className={styles.page}><p className={styles.status}>{error}</p></main>;
    }
    if (!project) {
        return <main className={styles.page}><p className={styles.status}>Loading…</p></main>;
    }

    const seeInsideHref = editorUrl({platformProject: project.id});

    const commentTabs = project.repo ? ['Comments', 'History', 'Pull requests'] : ['Comments'];
    const sharedDate = formatDate(project.sharedAt || project.created);
    const visibility = project.visibility || (project.shared ? 'public' : 'private');
    const price = project.price || 0;
    const locked = Boolean(project.locked);
    const hasContent = project.hasContent !== false;
    const themeAllowed = !revertTheme && (
        themeMode === 'all' ||
        (themeMode === 'hearted' && project.myReaction === 'heart') ||
        (themeMode === 'followed' && followsOwner)
    );

    return (
        <main className={styles.page}>
            <div className={styles.topBar}>
                <div className={styles.titleBlock}>
                    <Link to={`/users/${project.owner}`}>
                        <Avatar
                            username={project.owner}
                            size={44}
                        />
                    </Link>
                    <div className={styles.titleText}>
                        <div className={styles.titleRow}>
                            {project.isOwner ? (
                                <input
                                    className={styles.titleInput}
                                    value={title}
                                    maxLength={100}
                                    aria-label="Project title"
                                    disabled={savingTitle}
                                    onChange={event => setTitle(event.target.value)}
                                    onBlur={saveTitle}
                                    onKeyDown={handleTitleKeyDown}
                                />
                            ) : <h1>{project.title}</h1>}
                        </div>
                        <Link
                            to={`/users/${project.owner}`}
                            className={styles.byline}
                        >by {project.owner}</Link>
                    </div>
                </div>
                <div className={styles.topActions}>
                    {project.isOwner ? (
                        <VisibilityMenu
                            value={visibility}
                            onChange={changeVisibility}
                        />
                    ) : project.canRemix ? (
                        <button
                            className={styles.remixButton}
                            onClick={remix}
                            disabled={!user}
                            title={!user ? 'Sign in to remix' : null}
                        >
                            <GitFork size={16} />
                            Remix
                        </button>
                    ) : null}
                    {locked ? null : (
                        <a
                            className={styles.primary}
                            href={seeInsideHref}
                            onClick={() => stashProjectHandoff(project)}
                        >
                            <ExternalLink size={16} />
                            See inside
                        </a>
                    )}
                    <div
                        className={styles.menuWrap}
                        ref={menuRef}
                    >
                        <button
                            className={styles.remixButton}
                            title="More actions"
                            aria-label="More actions"
                            onClick={() => setMenuOpen(open => !open)}
                        >
                            <MoreHorizontal size={18} />
                        </button>
                        {menuOpen ? (
                            <div className={styles.actionMenu}>
                                <button onClick={copyLink}>
                                    <Link2 size={15} />
                                    Copy link
                                </button>
                                {user ? (
                                    <button
                                        onClick={toggleLibrary}
                                        disabled={savingLibrary}
                                    >
                                        {project.saved ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
                                        {project.saved ? 'Remove from library' : 'Save to library'}
                                    </button>
                                ) : null}
                                {project.isOwner ? (
                                    <Link
                                        to={`/mystuff/project/${project.id}`}
                                        onClick={() => setMenuOpen(false)}
                                    >
                                        <SlidersHorizontal size={15} />
                                        Manage &amp; analytics
                                    </Link>
                                ) : null}
                                {project.isOwner ? (
                                    <button
                                        onClick={menuRemix}
                                        disabled={!user}
                                    >
                                        <GitFork size={15} />
                                        Remix
                                    </button>
                                ) : null}
                                {project.isOwner ? (
                                    <button onClick={menuComments}>
                                        {project.commentsOff ?
                                            <MessageSquare size={15} /> :
                                            <MessageSquareOff size={15} />}
                                        {project.commentsOff ? 'Turn on comments' : 'Turn off comments'}
                                    </button>
                                ) : null}
                                {user && !sameUser(project.owner, user.username) ? (
                                    <button onClick={menuReport}>
                                        <Flag size={15} />
                                        Report
                                    </button>
                                ) : null}
                                {project.isOwner ? (
                                    <button
                                        className={styles.menuDanger}
                                        onClick={removeProject}
                                    >
                                        <Trash2 size={15} />
                                        Delete project
                                    </button>
                                ) : null}
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>

            {reporting ? (
                <ReportModal
                    type="project"
                    target={id}
                    onClose={() => setReporting(false)}
                />
            ) : null}
            {roturModal ? (
                <RoturConsentModal
                    type={roturModal.type}
                    data={roturModal.data}
                    onAllow={() => roturModal.onAllow && roturModal.onAllow()}
                    onDeny={() => roturModal.onDeny && roturModal.onDeny()}
                    onShareThis={() => roturModal.onShareThis && roturModal.onShareThis()}
                    onShareAll={() => roturModal.onShareAll && roturModal.onShareAll()}
                    onShareNo={() => roturModal.onShareNo && roturModal.onShareNo()}
                />
            ) : null}
            {confirmBuy ? (
                <div
                    className={styles.confirmOverlay}
                    onClick={() => setConfirmBuy(false)}
                >
                    <div
                        className={styles.confirmModal}
                        onClick={event => event.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                    >
                        <h3 className={styles.confirmTitle}>Confirm purchase</h3>
                        <p className={styles.confirmText}>
                            {`Buy ${project.title} for ${price} credits?`}
                        </p>
                        {confirmBalance !== null ? (
                            <p className={styles.confirmBalance}>{`Your balance: ${confirmBalance} credits`}</p>
                        ) : null}
                        <div className={styles.confirmActions}>
                            <button
                                className={styles.confirmCancel}
                                onClick={() => setConfirmBuy(false)}
                            >Cancel</button>
                            {confirmBalance !== null && confirmBalance < price ? (
                                <a
                                    className={styles.confirmButton}
                                    href={KO_FI_SHOP_URL}
                                >
                                    <Coins size={15} />
                                    Buy credits
                                </a>
                            ) : (
                                <button
                                    className={styles.confirmButton}
                                    onClick={doBuy}
                                    disabled={buying}
                                >
                                    <Coins size={15} />
                                    {buying ? 'Processing…' : `Pay ${price} credits`}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            ) : null}
            {actionError ? <div className={styles.actionError}>{actionError}</div> : null}
            {copied ? <div className={styles.actionSuccess}>Link copied to clipboard.</div> : null}
            {thumbnailStatus !== 'idle' ? (
                <div className={styles.actionSuccess}>
                    {thumbnailStatus === 'saving' ? 'Saving thumbnail…' : 'Thumbnail updated.'}
                </div>
            ) : null}

            {visibility === 'unlisted' ? (
                <div className={styles.visibilityNotice}>
                    <LinkIcon size={16} />
                    <span>Unlisted. Hidden from search and profiles, but anyone with the link can open it.</span>
                </div>
            ) : null}
            {visibility === 'private' ? (
                <div className={styles.visibilityNotice}>
                    <EyeOff size={16} />
                    <span>Unshared. Only you can see this project.</span>
                </div>
            ) : null}
            {price > 0 ? (
                <div className={styles.visibilityNotice}>
                    <Coins size={16} />
                    <span>
                        {project.isOwner ?
                            `Paywalled at ${price} credits.` :
                            project.bought ?
                                'You own this project.' :
                                `${price} credits to play this project.`}
                    </span>
                </div>
            ) : null}
            {projectThemeApplied && !revertTheme ? (
                <div className={styles.themeNotice}>
                    <Palette size={16} />
                    <span className={styles.themeNoticeText}>This project applied its own theme.</span>
                    <button
                        className={styles.themeNoticeButton}
                        onClick={() => {
                            setRevertTheme(true);
                            restoreUserTheme();
                        }}
                    >Use my theme</button>
                    <Link
                        to="/settings"
                        className={styles.themeNoticeButton}
                    >Preferences</Link>
                </div>
            ) : null}

            <div className={styles.stageRow}>
                <div className={styles.stageCol}>
                    <div className={styles.stageWrap}>
                        <div className={styles.stageSizer}>
                            {!locked && !hasContent ? (
                                <div className={styles.paywall}>
                                    <Upload size={32} />
                                    <h2 className={styles.paywallTitle}>Nothing here yet</h2>
                                    <p className={styles.paywallText}>
                                        {project.isOwner ?
                                            'No content yet. Open it in the editor and save to upload.' :
                                            'This project has not been uploaded yet.'}
                                    </p>
                                    {project.isOwner ? (
                                        <a
                                            className={styles.paywallButton}
                                            href={editorUrl({platformProject: project.id})}
                                            onClick={() => stashProjectHandoff(project)}
                                        >
                                            <ExternalLink size={16} />
                                            Open in editor
                                        </a>
                                    ) : null}
                                </div>
                            ) : locked ? (
                                <div className={styles.paywall}>
                                    <Lock size={32} />
                                    <h2 className={styles.paywallTitle}>{price} credits to play</h2>
                                    <p className={styles.paywallText}>
                                        Buy once to play {project.title} whenever you like.
                                    </p>
                                    <button
                                        className={styles.paywallButton}
                                        onClick={openBuyConfirm}
                                        disabled={!user || buying}
                                    >
                                        <Coins size={16} />
                                        {`Buy for ${price} credits`}
                                    </button>
                                    {!user ? (
                                        <p className={styles.paywallHint}>Log in to buy this project.</p>
                                    ) : null}
                                </div>
                            ) : (
                                <iframe
                                    key={`${unsandboxed ? 'u' : 's'}-${themeAllowed ? 't' : 'n'}`}
                                    ref={stageFrame}
                                    className={styles.stage}
                                    src={embedUrl(project, {unsandboxed, applyProjectTheme: themeAllowed})}
                                    title={project.title}
                                    onLoad={sendThemeToStage}
                                    allow="autoplay; fullscreen"
                                    sandbox={unsandboxed ?
                                        null :
                                        'allow-scripts allow-forms allow-pointer-lock allow-downloads'}
                                />
                            )}
                        </div>
                    </div>
                    {customExtensions.length ? (
                        <div className={unsandboxed ? styles.sandboxNoticeOpen : styles.sandboxNotice}>
                            {unsandboxed ? <ShieldAlert size={16} /> : <ShieldCheck size={16} />}
                            <span className={styles.sandboxText}>
                                {unsandboxed ?
                                    'Running with full access to your account. Only for projects you trust.' :
                                    'Uses custom extensions, running in a sandbox. Saved data will not persist.'}
                            </span>
                            {unsandboxed ? (
                                <button
                                    className={styles.sandboxButton}
                                    onClick={() => setUnsandboxed(false)}
                                >Back to sandbox</button>
                            ) : (
                                <button
                                    className={styles.sandboxButton}
                                    onClick={runUnsandboxed}
                                >Run without sandbox</button>
                            )}
                        </div>
                    ) : null}
                    <div className={styles.statsBar}>
                        <button
                            className={project.myReaction === 'heart' ? styles.statOn : styles.statButton}
                            onClick={() => react('heart')}
                            disabled={!user || locked}
                            title={locked ? 'Buy this project to react' : (!user ? 'Sign in to react' : null)}
                        >
                            <Heart
                                size={16}
                                fill={project.myReaction === 'heart' ? 'currentColor' : 'none'}
                            />
                            {project.loveCount || 0}
                        </button>
                        <button
                            className={project.myReaction === 'brokenheart' ? styles.statOn : styles.statButton}
                            onClick={() => react('brokenheart')}
                            disabled={!user || locked}
                            title={locked ? 'Buy this project to react' : (!user ? 'Sign in to react' : null)}
                        >
                            <ThumbsDown
                                size={16}
                                fill={project.myReaction === 'brokenheart' ? 'currentColor' : 'none'}
                            />
                            {project.brokenHeartCount || 0}
                        </button>
                        <span className={styles.statMuted}>
                            <Play size={15} />
                            {project.views || 0}
                        </span>
                        {blockStats ? (
                            <span className={styles.statMuted}>
                                <Blocks size={15} />
                                {blockStats.total.toLocaleString()} blocks
                            </span>
                        ) : null}
                        <span className={styles.statSpacer} />
                        {project.isOwner ? (
                            <div
                                className={styles.thumbnailPicker}
                                ref={thumbMenuRef}
                            >
                                <button
                                    className={styles.statButton}
                                    title="Set the project thumbnail"
                                    disabled={thumbnailStatus === 'saving'}
                                    onClick={() => setThumbnailMenu(open => !open)}
                                >
                                    <ImageUp size={15} />
                                    {thumbnailStatus === 'saving' ? 'Saving…' : 'Thumbnail'}
                                </button>
                                {thumbnailMenu ? (
                                    <div className={styles.thumbnailMenu}>
                                        <button onClick={useStageThumbnail}>
                                            <MonitorPlay size={15} />
                                            Use current stage
                                        </button>
                                        <button onClick={chooseThumbnailUpload}>
                                            <Upload size={15} />
                                            Upload image
                                        </button>
                                    </div>
                                ) : null}
                            </div>
                        ) : null}
                        <input
                            ref={thumbInput}
                            className={styles.hiddenInput}
                            type="file"
                            accept="image/png,image/jpeg"
                            onChange={pickThumbnail}
                        />
                        {sharedDate ? <span className={styles.statMuted}>{sharedDate}</span> : null}
                    </div>
                </div>

                <div className={styles.sideCol}>
                    <ProjectInfoPanel
                        project={project}
                        onSaved={load}
                    />
                </div>
            </div>

            <div className={styles.bottomGrid}>
                <section className={styles.commentsCol}>
                    <div className={styles.commentsHead}>
                        {commentTabs.length > 1 ? (
                            <nav className={styles.tabs}>
                                {commentTabs.map(name => (
                                    <button
                                        key={name}
                                        className={name === tab ? styles.tabActive : styles.tab}
                                        onClick={() => setTab(name)}
                                    >{name}</button>
                                ))}
                            </nav>
                        ) : (
                            <h2 className={styles.colTitle}>Comments</h2>
                        )}
                    </div>
                    {tab === 'Comments' && (
                        <CommentThread
                            source={commentSource}
                            canModerate={project.isOwner}
                            disabled={Boolean(project.commentsOff) || locked}
                            disabledReason={locked && !project.commentsOff ?
                                'Buy this project to comment.' : 'Comments are turned off.'}
                            reportContext={`project ${id}`}
                        />
                    )}
                    {tab === 'History' && <HistoryList id={id} />}
                    {tab === 'Pull requests' && (
                        <PullList
                            id={id}
                            canMerge={project.isOwner}
                            onChange={load}
                        />
                    )}
                </section>

                <aside className={styles.remixCol}>
                    <BlockStats stats={blockStats} />
                    <h2 className={styles.colTitle}>Remixes</h2>
                    <RemixTree id={id} />
                </aside>
            </div>
        </main>
    );
};

const BarChart = ({title, rows}) => {
    const max = rows.length ? rows[0].count : 0;
    return (
        <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>{title}</h3>
            <ul className={styles.chartRows}>
                {rows.map(row => (
                    <li
                        key={row.id}
                        className={styles.chartRow}
                    >
                        <span
                            className={styles.chartLabel}
                            title={row.label}
                        >{row.label}</span>
                        <span className={styles.chartTrack}>
                            <span
                                className={styles.chartBar}
                                style={{width: `${max ? (row.count / max) * 100 : 0}%`, background: row.color}}
                            />
                        </span>
                        <span className={styles.chartCount}>{row.count}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
};

const BlockStats = ({stats}) => {
    if (!stats || stats.total < 500) return null;
    return (
        <div className={styles.chartStack}>
            <BarChart
                title="Top categories"
                rows={stats.topCategories}
            />
        </div>
    );
};

const RemixTreeNode = ({node, childrenOf, currentId}) => (
    <li>
        <Link
            className={node.id === currentId ? styles.treeNodeCurrent : styles.treeNode}
            to={projectUrl(node.id)}
        >
            <Avatar
                username={node.owner}
                size={22}
            />
            <span className={styles.treeTitle}>{node.title}</span>
            <span className={styles.treeMeta}>
                {node.owner} · {timeAgo(node.sharedAt || node.created || node.edited)}
            </span>
        </Link>
        {childrenOf(node.id).length ? (
            <ul className={styles.treeChildren}>
                {childrenOf(node.id).map(child => (
                    <RemixTreeNode
                        key={child.id}
                        node={child}
                        childrenOf={childrenOf}
                        currentId={currentId}
                    />
                ))}
            </ul>
        ) : null}
    </li>
);

const RemixTree = ({id}) => {
    const [tree, setTree] = useState(null);
    useEffect(() => {
        setTree(null);
        api.remixTree(id).then(setTree).catch(() => setTree({nodes: []}));
    }, [id]);
    const childMap = useMemo(() => {
        const map = new Map();
        for (const node of (tree && tree.nodes) || []) {
            if (!map.has(node.remixParent)) map.set(node.remixParent, []);
            map.get(node.remixParent).push(node);
        }
        for (const list of map.values()) {
            list.sort((a, b) => (a.sharedAt || a.created || 0) - (b.sharedAt || b.created || 0));
        }
        return map;
    }, [tree]);
    if (!tree) return <p className={styles.status}>Loading…</p>;
    const nodes = tree.nodes || [];
    if (nodes.length < 2) return <p className={styles.sideEmpty}>No remixes yet.</p>;
    const childrenOf = parentId => childMap.get(parentId) || [];
    const root = nodes.find(node => node.id === tree.root);
    if (!root) return <p className={styles.sideEmpty}>No remixes yet.</p>;
    return (
        <ul className={styles.tree}>
            <RemixTreeNode
                node={root}
                childrenOf={childrenOf}
                currentId={id}
            />
        </ul>
    );
};

const HistoryList = ({id}) => {
    const [commits, setCommits] = useState(null);
    useEffect(() => {
        api.commits(id).then(d => setCommits(d.commits || [])).catch(() => setCommits([]));
    }, [id]);
    if (!commits) return <p className={styles.status}>Loading…</p>;
    if (!commits.length) return <p className={styles.status}>No commit history available.</p>;
    return (
        <ul className={styles.commitList}>
            {commits.map(commit => (
                <li key={commit.sha}>
                    <code>{commit.sha.slice(0, 7)}</code>
                    <span className={styles.commitMsg}>{commit.message.split('\n')[0]}</span>
                    <span className={styles.muted}>{commit.author}</span>
                </li>
            ))}
        </ul>
    );
};

const PullList = ({id, canMerge, onChange}) => {
    const [pulls, setPulls] = useState(null);
    const [openPull, setOpenPull] = useState(null);
    const [diff, setDiff] = useState(null);
    const [merging, setMerging] = useState(false);
    const [mergeError, setMergeError] = useState(null);

    const reload = useCallback(() => {
        api.pulls(id).then(d => setPulls(d.pulls || [])).catch(() => setPulls([]));
    }, [id]);

    useEffect(reload, [reload]);

    const view = async pull => {
        setOpenPull(pull);
        setDiff(null);
        setMergeError(null);
        try {
            setDiff(await api.pullDiff(id, pull.index));
        } catch (e) {
            setDiff('Could not load diff.');
        }
    };

    const merge = async pull => {
        if (merging) return;
        setMerging(true);
        setMergeError(null);
        try {
            await api.mergePull(id, pull.index);
            setOpenPull(null);
            reload();
            onChange();
        } catch (e) {
            setMergeError(e.code === 'conflict' ?
                'This pull request has conflicts. Open it in the editor and pull to resolve.' :
                'Merge failed.');
        } finally {
            setMerging(false);
        }
    };

    if (!pulls) return <p className={styles.status}>Loading…</p>;
    if (openPull) {
        return (
            <div>
                <button
                    className={styles.backLink}
                    onClick={() => setOpenPull(null)}
                >
                    <ArrowLeft size={14} />
                    Back to pull requests
                </button>
                <h3>{openPull.title}</h3>
                <p className={styles.muted}>
                    #{openPull.index} by {openPull.user} into {openPull.baseBranch}
                </p>
                {mergeError ? <div className={styles.actionError}>{mergeError}</div> : null}
                {canMerge && openPull.state === 'open' ? (
                    <button
                        className={styles.primary}
                        onClick={() => merge(openPull)}
                        disabled={merging}
                    >{merging ? 'Merging…' : 'Merge'}</button>
                ) : null}
                <DiffView diff={diff} />
            </div>
        );
    }
    if (!pulls.length) return <p className={styles.status}>No pull requests.</p>;
    return (
        <ul className={styles.plainList}>
            {pulls.map(pull => (
                <li key={pull.index}>
                    <button
                        className={styles.linkButton}
                        onClick={() => view(pull)}
                    >
                        #{pull.index} {pull.title}
                    </button>
                    <span className={styles.muted}> by {pull.user} · {pull.state}</span>
                </li>
            ))}
        </ul>
    );
};

export default Project;
