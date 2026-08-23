/* eslint-disable max-len */
import React, {useEffect, useState, useCallback, useMemo, useRef} from 'react';
import {useParams, Link, useNavigate} from 'react-router-dom';
import {
    ArrowLeft, Play, GitFork, ExternalLink, EyeOff,
    MessageSquareOff, MessageSquare, ImageUp, MonitorPlay, Upload, Blocks, Flag,
    ShieldCheck, ShieldAlert, MoreHorizontal, Trash2, Link2, Link as LinkIcon, Lock, Coins, SlidersHorizontal,
    Palette, Bookmark, BookmarkCheck, Star, Library
} from 'lucide-react';
import api, {projectUrl, editorUrl, embedUrl, stashProjectHandoff, themeCustomFor} from '../api';
import {cachedFetchBuffer, preloadContent} from '../../lib/community/cached-fetch.js';
import {buyProject} from '../purchase';
import {isInsufficientFunds, openCreditCheckout, CREDIT_PACKS} from '../credits';
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
import ProjectCompatibility from '../components/ProjectCompatibility.jsx';
import CollectionSaveModal from '../components/CollectionSaveModal.jsx';
import {useUser} from '../UserContext.jsx';
import {timeAgo, sameUser, formatDate, formatPlaytime} from '../format';
import CommentThread from '../components/CommentThread.jsx';
import ReportModal from '../components/ReportModal.jsx';
import DiffView from '../components/DiffView.jsx';
import GitGraph from '../components/GitGraph.jsx';
import Button from '../components/ui/Button.jsx';
import RichText from '../components/RichText.jsx';
import ReactionButtons from '../components/ReactionButtons.jsx';
import setPageMeta from '../page-meta.js';
import useLatest from '../use-latest.js';
import {fetchWorkspace, hashExtensionUrl} from '../../lib/community/api.js';
import {
    cancelMwpMerge,
    chooseMergeBinary,
    finishMwpMerge,
    inspectMwpPull,
    restoreMwpVersion,
    startMwpMerge,
    updateMergeConflict
} from '../../lib/git/mwp.js';
import {isGalleryExtensionUrl} from '../../lib/trusted-extension.js';
import styles from './Project.module.css';

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
const EMBED_STORAGE_PREFIX = 'mw:embed-storage:';
const EMBED_STORAGE_BLOCKED_PREFIXES = ['mw:', 'tw:'];

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

const clearProjectStorage = projectId => {
    if (!projectId) return;
    const prefix = `${EMBED_STORAGE_PREFIX}${String(projectId)}:`;
    try {
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(prefix)) keys.push(key);
        }
        for (const key of keys) {
            localStorage.removeItem(key);
        }
    } catch (e) {
        // ignore
    }
};

const isBlockedProjectStorageKey = key => EMBED_STORAGE_BLOCKED_PREFIXES.some(prefix => key.startsWith(prefix));

const restoreUserTheme = () => {
    try {
        applyThemeVisuals(detectTheme());
    } catch (e) {
        // ignore
    }
};

const topFive = counts => Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);

const getCustomExtensions = async (urls, trustedExtensions) => {
    const custom = (urls || []).filter(url => typeof url === 'string' && !isGalleryExtensionUrl(url));
    const trusted = new Set(trustedExtensions || []);
    const hashes = await Promise.all(custom.map(hashExtensionUrl));
    return custom.filter((url, index) => !trusted.has(hashes[index]));
};

const analyzeBlocks = summary => {
    const categories = (summary && summary.categories) || {};
    const topCategories = topFive(categories)
        .map(([prefix, count]) => ({id: prefix, label: catLabel(prefix), count, color: catColor(prefix)}));
    return {total: Number(summary && summary.total) || 0, topCategories};
};

const Project = () => {
    const {id} = useParams();
    const {user, loading: userLoading, login} = useUser();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [versionHistory, setVersionHistory] = useState(null);
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
    const [collectionOpen, setCollectionOpen] = useState(false);
    const menuRef = useRef(null);
    const thumbMenuRef = useRef(null);
    const thumbInput = useRef(null);
    const stageFrame = useRef(null);
    const [blockStats, setBlockStats] = useState(null);
    const [customExtensions, setCustomExtensions] = useState([]);
    const [contentError, setContentError] = useState(false);
    const [unsandboxed, setUnsandboxed] = useState(false);
    const [buying, setBuying] = useState(false);
    const [checkoutBusy, setCheckoutBusy] = useState(false);
    const [confirmBuy, setConfirmBuy] = useState(false);
    const [confirmBalance, setConfirmBalance] = useState(null);
    const [savingLibrary, setSavingLibrary] = useState(false);
    const [savingFeatured, setSavingFeatured] = useState(false);
    const [savingComments, setSavingComments] = useState(false);
    const [featuredProject, setFeaturedProject] = useState('');
    const [projectThemeApplied, setProjectThemeApplied] = useState(false);
    const [revertTheme, setRevertTheme] = useState(false);
    const [followsOwner, setFollowsOwner] = useState(false);
    const [roturModal, setRoturModal] = useState(null);
    const [forkSetup, setForkSetup] = useState(null);
    const [creatingFork, setCreatingFork] = useState(false);
    const themeMode = getProjectThemeMode();
    useEscape(confirmBuy ? () => setConfirmBuy(false) : null);

    const beginLoad = useLatest();

    const load = useCallback(() => {
        const fresh = beginLoad();
        api.commits(id)
            .then(fresh(setVersionHistory))
            .catch(fresh(() => setVersionHistory({commits: []})));
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
        setFeaturedProject((user && user.featuredProject) || '');
    }, [user]);

    useEffect(() => {
        setProject(null);
        setVersionHistory(null);
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
        const onMessage = event => {
            const frame = stageFrame.current;
            if (!frame || event.source !== frame.contentWindow) return;
            if (!event.data || event.data.type !== 'mw:diagnostic') return;
            api.recordDiagnostic(id, event.data.diagnostic).catch(() => {});
        };
        window.addEventListener('message', onMessage);
        return () => window.removeEventListener('message', onMessage);
    }, [id]);

    useEffect(() => {
        if (!project) return;
        setPageMeta({
            title: `${project.title} by ${project.owner}`,
            description: project.instructions || project.description,
            image: project.cardUrl || project.thumbUrl,
            card: 'summary_large_image'
        });
    }, [project]);

    const projectJsonUrl = project && project.projectJsonUrl;
    useEffect(() => {
        setBlockStats(null);
        setCustomExtensions([]);
        setContentError(false);
        setUnsandboxed(false);
        let active = true;
        if (projectJsonUrl) {
            preloadContent(projectJsonUrl).catch(() => {
                if (active) setContentError(true);
            });
        }
        return () => {
            active = false;
        };
    }, [projectJsonUrl]);

    useEffect(() => {
        let cancelled = false;
        const onMessage = event => {
            const frame = stageFrame.current;
            if (!frame || event.source !== frame.contentWindow) return;
            const data = event.data;
            if (!data || data.type !== 'mw:project-metadata') return;
            setBlockStats(analyzeBlocks(data.blockStats));
            getCustomExtensions(data.customExtensions, (project && project.trustedExtensions) || [])
                .then(urls => {
                    if (!cancelled) setCustomExtensions(urls);
                })
                .catch(() => {
                    if (!cancelled) setCustomExtensions([]);
                });
        };
        window.addEventListener('message', onMessage);
        return () => {
            cancelled = true;
            window.removeEventListener('message', onMessage);
        };
    }, [projectJsonUrl, project && project.trustedExtensions]);

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
        const onMessage = async event => {
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
                if (meta.authenticatedOnly) {
                    try {
                        await commitGrant(meta, scopes);
                        reply({id: data.id, ok: true, result: true});
                    } catch (e) {
                        reply({id: data.id, ok: false, error: String((e && e.message) || e)});
                    }
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
                        data: {
                            label: (opts && opts.label) || method,
                            confirmation: (opts && opts.confirmation) || null,
                            username: identity.username
                        },
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
            const theme = localStorage.getItem('tw:theme');
            frame.contentWindow.postMessage({
                type: 'mw:apply-theme',
                theme,
                customThemes: theme ? themeCustomFor(theme) : ''
            }, '*');
            if (!userLoading) {
                frame.contentWindow.postMessage(userMessage, '*');
            }
        } catch (e) {
            // ignore
        }
    }, [userLoading, userMessage]);

    useEffect(() => {
        if (!project || !project.id) return;
        const projectId = String(project.id);
        const onMessage = event => {
            const frame = stageFrame.current;
            if (!frame || event.source !== frame.contentWindow) return;
            const data = event.data;
            if (!data || typeof data.type !== 'string') return;
            if (data.storageProject && String(data.storageProject) !== projectId) return;
            if (data.type === 'mw:storage-clear') {
                clearProjectStorage(projectId);
                return;
            }
            if (data.type !== 'mw:storage-set' && data.type !== 'mw:storage-remove') return;
            const key = typeof data.key === 'string' ? data.key : '';
            if (!key) return;
            if (isBlockedProjectStorageKey(key)) return;
            const storageKey = `${EMBED_STORAGE_PREFIX}${projectId}:${key}`;
            try {
                if (data.type === 'mw:storage-set') {
                    if (!Object.prototype.hasOwnProperty.call(data, 'value')) return;
                    localStorage.setItem(storageKey, String(data.value));
                    return;
                }
                localStorage.removeItem(storageKey);
            } catch (e) {
                // ignore
            }
        };
        window.addEventListener('message', onMessage);
        return () => window.removeEventListener('message', onMessage);
    }, [project && project.id]);

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

    const remix = () => {
        if (!user) return;
        setMenuOpen(false);
        setActionError(null);
        setForkSetup({
            title: `${project.title} fork`,
            branch: project.gitBranch || 'main'
        });
    };

    const createFork = async event => {
        event.preventDefault();
        if (!forkSetup || creatingFork) return;
        setCreatingFork(true);
        try {
            const result = await api.remix(id, {
                title: forkSetup.title.trim(),
                branch: forkSetup.branch.trim()
            });
            window.location.href = editorUrl({platformProject: result.id});
        } catch (e) {
            setActionError(e.message || 'Could not create this fork.');
            setCreatingFork(false);
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

    const openCheckout = async () => {
        if (checkoutBusy) return;
        setCheckoutBusy(true);
        setActionError(null);
        try {
            await openCreditCheckout(CREDIT_PACKS[1]);
        } catch (e) {
            setActionError(e.needsReauth ?
                'Your current login cannot buy credits. Log out and back in, then try again.' :
                (e.message || 'Could not open checkout.'));
        } finally {
            setCheckoutBusy(false);
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
                openCheckout();
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
        if (savingComments) return;
        setSavingComments(true);
        try {
            await api.updateProject(id, {commentsOff: !project.commentsOff});
            setActionError(null);
            load();
        } catch (e) {
            setActionError(e.message || 'Could not update comments.');
        } finally {
            setSavingComments(false);
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

    const toggleFeatured = async () => {
        setMenuOpen(false);
        if (savingFeatured) return;
        setSavingFeatured(true);
        const next = featuredProject === id ? '' : id;
        try {
            await api.updateProfile({featuredProject: next});
            setFeaturedProject(next);
            setActionError(null);
        } catch (e) {
            setActionError(e.message || 'Could not update your featured project.');
        } finally {
            setSavingFeatured(false);
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
        add: (content, parent, kind) => api.addComment(id, content, parent, kind),
        remove: commentId => api.deleteComment(id, commentId),
        react: (commentId, type) => api.reactComment(id, commentId, type)
    }), [id]);

    if (error && !project) {
        return <main className={styles.page}><p className={styles.status}>{error}</p></main>;
    }
    if (!project) {
        return <main className={styles.page}><p className={styles.status}>Loading…</p></main>;
    }

    const ownsProject = Boolean(user && String(user.username).toLowerCase() === String(project.owner).toLowerCase());
    const seeInsideHref = editorUrl({platformProject: project.id});

    const commentTabs = ['Comments', 'Reviews', 'Releases', 'History', 'Pull requests', 'Contribute'];
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
                    {!locked && project.canSeeInside !== false ? (
                        <a
                            className={styles.primary}
                            href={seeInsideHref}
                            onClick={() => stashProjectHandoff(project)}
                        >
                            <ExternalLink size={16} />
                            See inside
                        </a>
                    ) : null}
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
                                {user ? (
                                    <button
                                        onClick={() => {
                                            setMenuOpen(false);
                                            setCollectionOpen(true);
                                        }}
                                    >
                                        <Library size={15} />
                                        Save to collection
                                    </button>
                                ) : null}
                                {project.isOwner ? <div className={styles.menuSeparator} role="separator" /> : null}
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
                                {project.isOwner && project.shared ? (
                                    <button
                                        onClick={toggleFeatured}
                                        disabled={savingFeatured}
                                    >
                                        <Star
                                            size={15}
                                            fill={featuredProject === project.id ? 'currentColor' : 'none'}
                                        />
                                        {featuredProject === project.id ?
                                            'Remove profile feature' : 'Feature on profile'}
                                    </button>
                                ) : null}
                                {user && !sameUser(project.owner, user.username) ? <div className={styles.menuSeparator} role="separator" /> : null}
                                {user && !sameUser(project.owner, user.username) ? (
                                    <button onClick={menuReport}>
                                        <Flag size={15} />
                                        Report
                                    </button>
                                ) : null}
                                {project.isOwner ? <div className={styles.menuSeparator} role="separator" /> : null}
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

            {collectionOpen ? <CollectionSaveModal project={project} onClose={() => setCollectionOpen(false)} /> : null}

            {forkSetup ? (
                <div className={styles.confirmOverlay} onClick={() => !creatingFork && setForkSetup(null)}>
                    <form
                        className={`${styles.confirmModal} ${styles.forkModal}`}
                        onSubmit={createFork}
                        onClick={event => event.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="fork-setup-title"
                    >
                        <h3 className={styles.confirmTitle} id="fork-setup-title">Set up your fork</h3>
                        <p className={styles.forkIntro}>
                            This creates a private working copy with the full MistWarp history. You can send its changes back as a pull request.
                        </p>
                        <label className={styles.forkField}>
                            <span>Project name</span>
                            <input
                                value={forkSetup.title}
                                maxLength={100}
                                required
                                autoFocus
                                onChange={event => setForkSetup({...forkSetup, title: event.target.value})}
                            />
                        </label>
                        <label className={styles.forkField}>
                            <span>Working branch</span>
                            <input
                                value={forkSetup.branch}
                                maxLength={100}
                                required
                                pattern="[A-Za-z0-9][A-Za-z0-9._/-]*"
                                onChange={event => setForkSetup({...forkSetup, branch: event.target.value})}
                            />
                        </label>
                        <dl className={styles.forkSummary}>
                            <div><dt>Forked from</dt><dd>{project.owner}/{project.title}</dd></div>
                            <div><dt>Base commit</dt><dd><code>{project.gitHead ? project.gitHead.slice(0, 7) : 'Current version'}</code></dd></div>
                            <div><dt>Visibility</dt><dd>Private draft</dd></div>
                        </dl>
                        <div className={styles.confirmActions}>
                            <button type="button" className={styles.confirmCancel} onClick={() => setForkSetup(null)} disabled={creatingFork}>
                                Cancel
                            </button>
                            <button className={styles.confirmButton} type="submit" disabled={creatingFork}>
                                <GitFork size={15} />
                                {creatingFork ? 'Creating fork…' : 'Create fork'}
                            </button>
                        </div>
                    </form>
                </div>
            ) : null}

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
                                <button
                                    type="button"
                                    className={styles.confirmButton}
                                    onClick={openCheckout}
                                    disabled={checkoutBusy}
                                >
                                    <Coins size={15} />
                                    {checkoutBusy ? 'Opening…' : 'Buy credits'}
                                </button>
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
                            ) : contentError ? (
                                <div className={styles.paywall}>
                                    <ShieldAlert size={32} />
                                    <h2 className={styles.paywallTitle}>Project unavailable</h2>
                                    <p className={styles.paywallText}>
                                        The project file could not be loaded. The creator may need to save it again.
                                    </p>
                                </div>
                            ) : (
                                <iframe
                                    key={`${unsandboxed ? 'u' : 's'}-${themeAllowed ? 't' : 'n'}`}
                                    ref={stageFrame}
                                    className={styles.stage}
                                    src={embedUrl(project, {unsandboxed, applyProjectTheme: themeAllowed, persistStorage: !unsandboxed})}
                                    title={project.title}
                                    onLoad={sendThemeToStage}
                                    allow="autoplay; fullscreen"
                                    sandbox={unsandboxed ?
                                        null :
                                        'allow-scripts allow-forms allow-pointer-lock allow-downloads ' +
                                        'allow-popups allow-popups-to-escape-sandbox'}
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
                                    'Uses custom extensions, running in a sandbox. Saved data can persist to browser storage.'}
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
                        <ReactionButtons
                            variant="bordered"
                            counts={{heart: project.loveCount || 0, brokenheart: project.brokenHeartCount || 0}}
                            activeReaction={project.myReaction || ''}
                            onReact={react}
                            disabled={!user || locked}
                            disabledTitle={locked ? 'Buy this project to react' : 'Sign in to react'}
                        />
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
                        <ProjectCompatibility compatibility={project.compatibility} compact />
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
                            projectComments
                            source={commentSource}
                            canModerate={project.isOwner}
                            disabled={Boolean(project.commentsOff) || locked}
                            disabledReason={locked && !project.commentsOff ?
                                'Buy this project to comment.' : 'Comments are turned off.'}
                            reportContext={`project ${id}`}
                            composerAction={project.isOwner ? (
                                <button
                                    className={styles.commentsToggle}
                                    onClick={toggleComments}
                                    disabled={savingComments}
                                >
                                    {project.commentsOff ?
                                        <MessageSquare size={14} /> :
                                        <MessageSquareOff size={14} />}
                                    {project.commentsOff ? 'Turn on comments' : 'Turn off comments'}
                                </button>
                            ) : null}
                        />
                    )}
                    {tab === 'History' && (
                        <HistoryList
                            id={id}
                            history={versionHistory}
                            canRestore={project.isOwner}
                            onChange={load}
                        />
                    )}
                    {tab === 'Reviews' && <ReviewPanel id={id} project={project} user={user} login={login} ownsProject={ownsProject} />}
                    {tab === 'Releases' && <ReleaseList id={id} isOwner={project.isOwner} />}
                    {tab === 'Pull requests' && (
                        <PullList
                            id={id}
                            canMerge={project.isOwner}
                            onChange={load}
                        />
                    )}
                    {tab === 'Contribute' && (
                        <ContributionPanel
                            id={project.remixParent || id}
                            sourceProjectId={project.remixParent ? id : ''}
                            user={user}
                            login={login}
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

const HistoryList = ({id, history, canRestore, onChange}) => {
    const [restoring, setRestoring] = useState(null);
    const [restoreError, setRestoreError] = useState(null);
    const restore = async commit => {
        const label = (commit.message || 'this version').split('\n')[0];
        if (!window.confirm(`Restore "${label}"? MistWarp will keep the newer versions in your history.`)) return;
        setRestoring(commit.sha);
        setRestoreError(null);
        try {
            const {project} = await api.getProject(id);
            if (!project.workspaceUrl) throw new Error('This project does not have a saved version archive');
            const workspace = await fetchWorkspace(project.workspaceUrl);
            const result = await restoreMwpVersion({workspace, oid: commit.sha});
            await api.uploadProject(id, result.sb3, null, null, {
                workspace: result.mwp,
                git: result.manifest,
                expectedHead: result.expectedHead
            });
            if (onChange) await onChange();
        } catch (error) {
            setRestoreError(error.message || 'Could not restore this version.');
        } finally {
            setRestoring(null);
        }
    };
    if (!history) return <p className={styles.status}>Loading…</p>;
    const commits = history.commits || [];
    if (!commits.length) return <p className={styles.status}>No version history available.</p>;
    if (history.graph?.nodes?.length) {
        return (
            <>
                {restoreError ? <p className={styles.status}>{restoreError}</p> : null}
                <GitGraph
                    graph={history.graph}
                    currentBranch={history.branch}
                    onRestore={canRestore ? restore : null}
                    restoring={restoring}
                />
            </>
        );
    }
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
    const [mergeSession, setMergeSession] = useState(null);

    const loadPullFiles = async data => {
        const [target, source] = await Promise.all([
            fetchWorkspace(data.targetWorkspaceUrl),
            fetchWorkspace(data.sourceWorkspaceUrl)
        ]);
        return {target, source};
    };

    const reload = useCallback(() => {
        api.pulls(id).then(d => setPulls(d.pulls || [])).catch(() => setPulls([]));
    }, [id]);

    useEffect(reload, [reload]);

    const view = async pull => {
        setOpenPull(pull);
        setDiff(null);
        setMergeError(null);
        try {
            const data = await api.pullDiff(id, pull.index);
            const files = await loadPullFiles(data);
            const inspected = await inspectMwpPull({
                ...files,
                pullId: pull.index,
                baseCommit: data.pull.baseCommit,
                headCommit: data.pull.headCommit
            });
            setDiff(inspected.diff || 'No textual changes.');
        } catch (e) {
            setDiff('Could not load diff.');
        }
    };

    const uploadMerge = async (pull, data) => {
        const result = await finishMwpMerge();
        await api.uploadPullMerge(id, {
            sb3: result.sb3,
            mwp: result.mwp,
            git: result.manifest,
            expectedHead: data.expectedHead,
            pullId: pull.index
        });
        setMergeSession(null);
        setOpenPull(null);
        reload();
        onChange();
    };

    const merge = async pull => {
        if (merging) return;
        setMerging(true);
        setMergeError(null);
        try {
            const data = await api.mergePull(id, pull.index);
            const files = await loadPullFiles(data);
            const result = await startMwpMerge({
                ...files,
                pullId: pull.index,
                baseCommit: data.pull.baseCommit,
                headCommit: data.pull.headCommit
            });
            if (result.conflicts.length || result.binaryConflicts.length) {
                setMergeSession({
                    pull,
                    data,
                    conflicts: result.conflicts,
                    binaryConflicts: result.binaryConflicts.map(path => ({path, choice: ''}))
                });
            } else {
                await uploadMerge(pull, data);
            }
        } catch (e) {
            await cancelMwpMerge();
            setMergeError(e.message || 'Merge failed.');
        } finally {
            setMerging(false);
        }
    };

    const updateConflict = (path, content) => {
        setMergeSession(session => ({
            ...session,
            conflicts: session.conflicts.map(file => (file.path === path ? {...file, content} : file))
        }));
    };

    const resolveConflicts = async () => {
        if (!mergeSession || merging) return;
        setMerging(true);
        setMergeError(null);
        try {
            for (const file of mergeSession.conflicts) {
                await updateMergeConflict(file.path, file.content);
            }
            for (const file of mergeSession.binaryConflicts) {
                if (!file.choice) throw new Error(`Choose a version for ${file.path}`);
                await chooseMergeBinary(file.path, file.choice);
            }
            await uploadMerge(mergeSession.pull, mergeSession.data);
        } catch (e) {
            setMergeError(e.message || 'The conflicts could not be resolved.');
        } finally {
            setMerging(false);
        }
    };

    const closePull = async () => {
        await cancelMwpMerge();
        setMergeSession(null);
        setOpenPull(null);
    };

    if (!pulls) return <p className={styles.status}>Loading…</p>;
    if (openPull) {
        return (
            <div>
                <button
                    className={styles.backLink}
                    onClick={closePull}
                >
                    <ArrowLeft size={14} />
                    Back to pull requests
                </button>
                <h3>{openPull.title}</h3>
                <p className={styles.muted}>
                    #{openPull.index} by {openPull.user} into {openPull.baseBranch}
                </p>
                {mergeError ? <div className={styles.actionError}>{mergeError}</div> : null}
                {mergeSession ? (
                    <div className={styles.conflictEditor}>
                        <h4>Resolve merge conflicts</h4>
                        <p>Remove the conflict markers and leave the exact text this file should contain.</p>
                        {mergeSession.conflicts.map(file => (
                            <label key={file.path} className={styles.conflictFile}>
                                <span>{file.path}</span>
                                <textarea
                                    value={file.content}
                                    onChange={event => updateConflict(file.path, event.target.value)}
                                    spellCheck={false}
                                />
                            </label>
                        ))}
                        {mergeSession.binaryConflicts.map(file => (
                            <div key={file.path} className={styles.binaryConflict}>
                                <span>{file.path}</span>
                                <div>
                                    <button
                                        type="button"
                                        className={file.choice === 'ours' ? styles.binaryChoiceActive : ''}
                                        onClick={() => setMergeSession(session => ({
                                            ...session,
                                            binaryConflicts: session.binaryConflicts.map(item =>
                                                (item.path === file.path ? {...item, choice: 'ours'} : item))
                                        }))}
                                    >Keep current project</button>
                                    <button
                                        type="button"
                                        className={file.choice === 'theirs' ? styles.binaryChoiceActive : ''}
                                        onClick={() => setMergeSession(session => ({
                                            ...session,
                                            binaryConflicts: session.binaryConflicts.map(item =>
                                                (item.path === file.path ? {...item, choice: 'theirs'} : item))
                                        }))}
                                    >Use fork version</button>
                                </div>
                            </div>
                        ))}
                        <button className={styles.primary} onClick={resolveConflicts} disabled={merging}>
                            {merging ? 'Finishing merge…' : 'Save resolutions and merge'}
                        </button>
                    </div>
                ) : null}
                {canMerge && openPull.state === 'open' ? (
                    <button
                        className={styles.primary}
                        onClick={() => merge(openPull)}
                        disabled={merging || Boolean(mergeSession)}
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

const ReviewStars = ({rating, onChange}) => (
    <div className={onChange ? styles.reviewStarPicker : styles.reviewStars} aria-label={`${rating} out of 5 stars`}>
        {[1, 2, 3, 4, 5].map(value => {
            if (onChange) {
                return (
                    <button key={value} type="button" aria-label={`${value} stars`} onClick={() => onChange(value)}>
                        <Star size={20} fill={value <= rating ? 'currentColor' : 'none'} />
                    </button>
                );
            }
            return <Star key={value} size={15} fill={value <= rating ? 'currentColor' : 'none'} />;
        })}
    </div>
);

const ReviewPanel = ({id, user, login, ownsProject}) => {
    const [reviews, setReviews] = useState(null);
    const [summary, setSummary] = useState({average: 0, count: 0});
    const [rating, setRating] = useState(0);
    const [message, setMessage] = useState('');
    const [hasReview, setHasReview] = useState(false);
    const [status, setStatus] = useState('');

    const load = useCallback(() => {
        api.reviews(id)
            .then(data => {
                setReviews(data.reviews || []);
                setSummary({average: Number(data.average) || 0, count: Number(data.count) || 0});
                const mine = data.myReview && data.myReview._id ? data.myReview : null;
                setHasReview(Boolean(mine));
                setRating(mine ? Number(mine.rating) : 0);
                setMessage(mine ? mine.message || '' : '');
            })
            .catch(() => setReviews([]));
    }, [id]);

    useEffect(load, [load]);

    const submit = async event => {
        event.preventDefault();
        if (!user) {
            login();
            return;
        }
        if (!rating) {
            setStatus('Choose a star rating first.');
            return;
        }
        setStatus('Saving…');
        try {
            await api.saveReview(id, {rating, message});
            setStatus('Review saved.');
            load();
        } catch (e) {
            setStatus(e.message || 'Could not save your review.');
        }
    };

    const remove = async () => {
        if (!window.confirm('Delete your review?')) return;
        try {
            await api.deleteReview(id);
            setRating(0);
            setMessage('');
            setStatus('Review deleted.');
            load();
        } catch (e) {
            setStatus(e.message || 'Could not delete your review.');
        }
    };

    return (
        <div className={styles.reviewPanel}>
            <div className={styles.reviewSummary}>
                <strong>{summary.count ? summary.average.toFixed(1) : '0.0'}</strong>
                <div>
                    <ReviewStars rating={Math.round(summary.average)} />
                    <span>{summary.count} {summary.count === 1 ? 'review' : 'reviews'}</span>
                </div>
            </div>
            {!ownsProject ? (
                <form className={styles.reviewForm} onSubmit={submit}>
                    <div>
                        <h3>{hasReview ? 'Your review' : 'Review this project'}</h3>
                        <ReviewStars rating={rating} onChange={setRating} />
                    </div>
                    <textarea value={message} maxLength={2000} placeholder="What worked well? What should change?" onChange={event => setMessage(event.target.value)} />
                    <div className={styles.reviewActions}>
                        <Button type="submit">{user ? 'Save review' : 'Sign in to review'}</Button>
                        {hasReview ? <Button type="button" variant="secondary" onClick={remove}>Delete</Button> : null}
                        {status ? <span>{status}</span> : null}
                    </div>
                </form>
            ) : <p className={styles.reviewOwnerHint}>You cannot review your own project.</p>}
            {!reviews ? <p className={styles.status}>Loading reviews…</p> : null}
            {reviews && !reviews.length ? <p className={styles.reviewEmpty}>No reviews yet.</p> : null}
            {reviews && reviews.map(review => (
                <article key={review._id} className={styles.reviewCard}>
                    <Link to={`/users/${review.author}`}><Avatar username={review.author} size={34} /></Link>
                    <div>
                        <header>
                            <Link to={`/users/${review.author}`}>{review.author}</Link>
                            <span className={styles.reviewPlaytime}>{formatPlaytime(review.playtimeMs)}</span>
                            <span>{timeAgo(review.edited || review.created)}</span>
                        </header>
                        <ReviewStars rating={review.rating} />
                        {review.message ? <p><RichText text={review.message} /></p> : null}
                    </div>
                </article>
            ))}
        </div>
    );
};

const ReleaseList = ({id, isOwner}) => {
    const [releases, setReleases] = useState(null);
    const [form, setForm] = useState({version: '', channel: 'stable', notes: ''});
    const [error, setError] = useState('');
    const updateForm = (field, value) => setForm(current => ({...current, [field]: value}));

    const load = useCallback(() => {
        api.releases(id).then(data => setReleases(data.releases || [])).catch(() => setReleases([]));
    }, [id]);

    useEffect(load, [load]);

    const create = async event => {
        event.preventDefault();
        setError('');
        try {
            await api.createRelease(id, form);
            setForm({version: '', channel: 'stable', notes: ''});
            load();
        } catch (e) {
            setError(e.message || 'Could not create the release.');
        }
    };

    return (
        <div className={styles.toolPanel}>
            {isOwner ? (
                <form className={styles.inlineForm} onSubmit={create}>
                    <h3>Publish a release</h3>
                    <div className={styles.inlineFields}>
                        <input value={form.version} required maxLength={50} placeholder="Version, such as 1.2.0" onChange={event => updateForm('version', event.target.value)} />
                        <select value={form.channel} onChange={event => updateForm('channel', event.target.value)}>
                            <option value="stable">Stable</option>
                            <option value="beta">Beta</option>
                            <option value="development">Development</option>
                        </select>
                    </div>
                    <textarea value={form.notes} placeholder="What changed?" onChange={event => updateForm('notes', event.target.value)} />
                    <Button type="submit">Publish release</Button>
                    {error ? <p className={styles.actionError}>{error}</p> : null}
                </form>
            ) : null}
            {!releases ? <p className={styles.status}>Loading releases…</p> : null}
            {releases && !releases.length ? <p className={styles.status}>No releases yet.</p> : null}
            {releases && releases.map(release => (
                <article className={styles.release} key={release._id}>
                    <div><strong>{release.version}</strong> <span className={styles.releaseChannel}>{release.channel}</span></div>
                    <span className={styles.muted}>{timeAgo(release.created)}</span>
                    {release.notes ? <RichText text={release.notes} /> : null}
                    {release.jsonUrl ? <a className={styles.primary} href={embedUrl({id, projectJsonUrl: release.jsonUrl, assetsBase: release.assetsBase})}>Play this release</a> : null}
                </article>
            ))}
        </div>
    );
};

const ContributionPanel = ({id, sourceProjectId, user, login}) => {
    const [remixProjectId, setRemixProjectId] = useState(sourceProjectId);
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [status, setStatus] = useState('');

    useEffect(() => setRemixProjectId(sourceProjectId), [sourceProjectId]);

    const submit = async event => {
        event.preventDefault();
        if (!user) {
            login();
            return;
        }
        setStatus('Sending…');
        try {
            const data = await api.contribute(id, {remixProjectId, title, body});
            setStatus(`Contribution #${data.pull.index} sent.`);
            setTitle('');
            setBody('');
        } catch (e) {
            setStatus(e.message || 'Could not send the contribution.');
        }
    };

    return (
        <form className={styles.inlineForm} onSubmit={submit}>
            <h3>Send changes back</h3>
            <p className={styles.muted}>
                {sourceProjectId ?
                    'Describe the changes on this fork and send them to its parent project.' :
                    'Fork this project, make your changes, save them, then enter the fork project ID here.'}
            </p>
            {!sourceProjectId ? (
                <input
                    value={remixProjectId}
                    required
                    placeholder="Your fork project ID"
                    onChange={event => setRemixProjectId(event.target.value)}
                />
            ) : null}
            <input value={title} required maxLength={200} placeholder="What did you change?" onChange={event => setTitle(event.target.value)} />
            <textarea value={body} placeholder="Anything the creator should know" onChange={event => setBody(event.target.value)} />
            <Button type="submit">{user ? 'Send contribution' : 'Sign in to contribute'}</Button>
            {status ? <p className={styles.muted}>{status}</p> : null}
        </form>
    );
};

export default Project;
