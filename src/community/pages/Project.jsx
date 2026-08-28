/* eslint-disable max-len */
import React, {useEffect, useState, useCallback, useMemo, useRef} from 'react';
import {useParams, Link, useNavigate} from 'react-router-dom';
import {
    ArrowLeft, Play, GitFork, ExternalLink, EyeOff,
    MessageSquareOff, MessageSquare, ImageUp, MonitorPlay, Upload, Blocks, Flag,
    ShieldCheck, ShieldAlert, MoreHorizontal, Trash2, Link2, Link as LinkIcon, Lock, Coins, SlidersHorizontal,
    Palette, Bookmark, BookmarkCheck, Star, Library, Trophy, Plus, ChevronDown
} from 'lucide-react';
import api, {projectUrl, editorUrl, embedUrl, stashProjectHandoff, themeCustomFor} from '../api';
import {MULTIPLAYER_ENABLED} from '../../lib/mistwarp-games/config.js';
import {cachedFetchBuffer, preloadContent} from '../../lib/community/cached-fetch.js';
import {buyProject} from '../purchase';
import {
    isInsufficientFunds, openCreditCheckout, CREDIT_PACKS, sendCommercePayment, listCommerceBounties
} from '../credits';
import RoturConsentModal from '../components/RoturConsentModal.jsx';
import GameMarketplaceModal from '../components/GameMarketplaceModal.jsx';
import {getBalance} from '../../lib/rotur/client.js';
import {
    hasFullGrant, commitGrant, callRotur,
    activityAllowed, rememberActivityDecision, isActivityMethod
} from '../../lib/rotur/extension-bridge.js';
import {getRoturSettings, setRoturSetting} from '../../lib/rotur/settings.js';
import {getUsernameOverride} from '../../lib/rotur/cloud-sync.js';
import rotur from '../rotur';
import {Theme} from '../../lib/themes';
import {CustomTheme} from '../../lib/themes/custom-themes.js';
import {applyThemeVisuals, detectTheme} from '../../lib/themes/themePersistance';
import Avatar from '../components/Avatar.jsx';
import GroupTag from '../components/GroupTag.jsx';
import VisibilityMenu from '../components/VisibilityMenu.jsx';
import ProjectInfoPanel from '../components/ProjectInfoPanel.jsx';
import ProjectCompatibility from '../components/ProjectCompatibility.jsx';
import CollectionSaveModal from '../components/CollectionSaveModal.jsx';
import {useUser} from '../UserContext.jsx';
import {timeAgo, sameUser, formatDate, formatDateTime, formatPlaytime} from '../format';
import CommentThread from '../components/CommentThread.jsx';
import ReportModal from '../components/ReportModal.jsx';
import DiffView from '../components/DiffView.jsx';
import GitGraph from '../components/GitGraph.jsx';
import Button from '../components/ui/Button.jsx';
import Dropdown from '../components/ui/Dropdown.jsx';
import SelectMenu from '../components/ui/SelectMenu.jsx';
import Modal from '../components/ui/Modal.jsx';
import RichText from '../components/RichText.jsx';
import ReactionButtons from '../components/ReactionButtons.jsx';
import setPageMeta from '../page-meta.js';
import useLatest from '../use-latest.js';
import copyText from '../copy-text.js';
import scrollToAnchorWithRetry from '../scroll-to-anchor.js';
import {fetchWorkspace, hashExtensionUrl} from '../../lib/community/api.js';
import {
    loadProjectSave,
    saveProjectData,
    loadGlobalGameData,
    loadProjectInventory,
    grantProjectItem
} from '../../lib/mistwarp-games/data-client.js';
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

const EMBED_STORAGE_PREFIX = 'mw:embed-storage:';
const EMBED_STORAGE_BLOCKED_PREFIXES = ['mw:', 'tw:'];
const MAIN_ACTIVITY_TABS = ['Comments', 'Reviews', 'Releases'];
const MORE_ACTIVITY_TABS = ['History', 'Pull requests', 'Contribute'];

export const reviewPayload = (rating, message) => ({rating, message: message.trim()});
export const releasePayload = form => ({...form, version: form.version.trim(), notes: form.notes.trim()});
export const contributionPayload = (remixProjectId, title, body, bountyId = '') => {
    const payload = {
        remixProjectId: remixProjectId.trim(),
        title: title.trim(),
        body: body.trim()
    };
    if (bountyId) payload.bountyId = bountyId;
    return payload;
};
export const applyReactionResult = (project, result) => ({
    ...project,
    loveCount: result.hearts,
    brokenHeartCount: result.brokenHearts,
    myReaction: result.myReaction || ''
});
export const updateReviewSummary = (summary, previousRating, nextRating) => {
    const previous = Number(previousRating) || 0;
    const next = Number(nextRating) || 0;
    const count = Math.max(0, (Number(summary.count) || 0) + (previous ? 0 : 1) - (next ? 0 : 1));
    const total = ((Number(summary.average) || 0) * (Number(summary.count) || 0)) - previous + next;
    return {count, average: count ? total / count : 0};
};

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

const getCustomExtensions = async (urls, trustedExtensions) => {
    const custom = (urls || []).filter(url => typeof url === 'string' && !isGalleryExtensionUrl(url));
    const trusted = new Set(trustedExtensions || []);
    const hashes = await Promise.all(custom.map(hashExtensionUrl));
    return custom.filter((url, index) => !trusted.has(hashes[index]));
};

const analyzeBlocks = summary => ({total: Number(summary && summary.total) || 0});

const Project = () => {
    const {id} = useParams();
    const {user, loading: userLoading, login} = useUser();
    const viewerName = (user && user.username) || '';
    const actionContext = `${id}\u0000${viewerName}`;
    const actionContextRef = useRef(actionContext);
    actionContextRef.current = actionContext;
    const actionLocks = useRef(new Set());
    const beginAction = name => {
        const key = `${actionContextRef.current}\u0000${name}`;
        if (actionLocks.current.has(key)) return null;
        actionLocks.current.add(key);
        return key;
    };
    const releaseAction = key => actionLocks.current.delete(key);
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [projectLoadContext, setProjectLoadContext] = useState('');
    const [versionHistory, setVersionHistory] = useState(null);
    const [error, setError] = useState(null);
    const [errorLoadContext, setErrorLoadContext] = useState('');
    const [actionError, setActionError] = useState(null);
    const [tab, setTab] = useState('Comments');
    const [title, setTitle] = useState('');
    const [savingTitle, setSavingTitle] = useState(false);
    const [thumbnailMenu, setThumbnailMenu] = useState(false);
    const [thumbnailStatus, setThumbnailStatus] = useState('idle');
    const [reporting, setReporting] = useState(false);
    const [copied, setCopied] = useState(false);
    const [collectionOpen, setCollectionOpen] = useState(false);
    const thumbMenuRef = useRef(null);
    const thumbInput = useRef(null);
    const stageFrame = useRef(null);
    const stageSource = useRef({key: null, url: null});
    const [stageHeightRatio, setStageHeightRatio] = useState(3 / 4);
    const [blockStats, setBlockStats] = useState(null);
    const [customExtensions, setCustomExtensions] = useState([]);
    const [contentError, setContentError] = useState(false);
    const [unsandboxed, setUnsandboxed] = useState(false);
    const [confirmUnsandboxed, setConfirmUnsandboxed] = useState(false);
    const [buying, setBuying] = useState(false);
    const [checkoutBusy, setCheckoutBusy] = useState(false);
    const [confirmBuy, setConfirmBuy] = useState(false);
    const [confirmBalance, setConfirmBalance] = useState(null);
    const [supportOpen, setSupportOpen] = useState(false);
    const [supportAmount, setSupportAmount] = useState('5');
    const [supporting, setSupporting] = useState(false);
    const [supportSent, setSupportSent] = useState(false);
    const [savingLibrary, setSavingLibrary] = useState(false);
    const [savingFeatured, setSavingFeatured] = useState(false);
    const [savingComments, setSavingComments] = useState(false);
    const [reactionBusy, setReactionBusy] = useState(false);
    const [savingVisibility, setSavingVisibility] = useState(false);
    const [featuredProject, setFeaturedProject] = useState('');
    const [projectThemeApplied, setProjectThemeApplied] = useState(false);
    const [revertTheme, setRevertTheme] = useState(false);
    const [followedOwner, setFollowedOwner] = useState(null);
    const [roturModal, setRoturModal] = useState(null);
    const [gameMarketplace, setGameMarketplace] = useState(null);
    const [forkSetup, setForkSetup] = useState(null);
    const [creatingFork, setCreatingFork] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(false);
    const [deletingProject, setDeletingProject] = useState(false);
    const themeMode = getProjectThemeMode();

    const beginLoad = useLatest();
    const beginHistoryLoad = useLatest();

    const load = useCallback(() => {
        const fresh = beginLoad();
        setError(null);
        setErrorLoadContext('');
        return api.getProject(id)
            .then(fresh(data => {
                if (!data || !data.project) throw new Error('Project response was incomplete.');
                setProject(data.project);
                setProjectLoadContext(actionContext);
                setError(null);
            }))
            .catch(fresh(e => {
                setErrorLoadContext(actionContext);
                setError(e && e.status === 404 ? 'Project not found.' : 'Could not load this project.');
            }));
    }, [actionContext, id, beginLoad]);

    const loadHistory = useCallback(() => {
        const fresh = beginHistoryLoad();
        return api.commits(id)
            .then(fresh(setVersionHistory))
            .catch(fresh(() => setVersionHistory({commits: [], error: true})));
    }, [beginHistoryLoad, id]);

    const refreshProjectAndHistory = useCallback(() => Promise.all([load(), loadHistory()]), [load, loadHistory]);

    useEffect(() => {
        setFeaturedProject((user && user.featuredProject) || '');
    }, [user]);

    useEffect(() => {
        if (userLoading) return;
        beginHistoryLoad();
        setProject(null);
        setVersionHistory(null);
        setError(null);
        setActionError(null);
        setReporting(false);
        setTab('Comments');
        setThumbnailMenu(false);
        setCollectionOpen(false);
        setConfirmBuy(false);
        setConfirmBalance(null);
        setForkSetup(null);
        setCreatingFork(false);
        setDeleteConfirm(false);
        setDeletingProject(false);
        setConfirmUnsandboxed(false);
        setBuying(false);
        setCheckoutBusy(false);
        setSavingTitle(false);
        setSavingLibrary(false);
        setSavingFeatured(false);
        setSavingComments(false);
        setSavingVisibility(false);
        setReactionBusy(false);
        setThumbnailStatus('idle');
        setCopied(false);
        setProjectThemeApplied(false);
        setRevertTheme(false);
        setFollowedOwner(null);
        setStageHeightRatio(3 / 4);
        restoreUserTheme();
        load();
    }, [actionContext, beginHistoryLoad, id, load, userLoading]);

    useEffect(() => {
        if (tab === 'History' && versionHistory === null) loadHistory();
    }, [loadHistory, tab, versionHistory]);

    useEffect(() => {
        if (userLoading) return;
        api.view(id).catch(() => {});
    }, [id, userLoading]);

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
        if (projectLoadContext !== actionContext) return;
        const hash = window.location.hash;
        if (!hash) return;
        return scrollToAnchorWithRetry(hash.replace('#', ''));
    }, [actionContext, projectLoadContext]);

    const owner = project && project.owner;
    useEffect(() => {
        if (themeMode !== 'followed' || !user || !owner) return;
        let active = true;
        const viewerKey = String(user.username).toLowerCase();
        const ownerKey = String(owner).toLowerCase();
        setFollowedOwner(null);
        rotur.following(user.username)
            .then(data => {
                if (!active) return;
                const list = (data.following || []).map(name => String(name).toLowerCase());
                setFollowedOwner({
                    owner: ownerKey,
                    value: list.includes(ownerKey),
                    viewer: viewerKey
                });
            })
            .catch(() => {
                if (active) setFollowedOwner({owner: ownerKey, value: false, viewer: viewerKey});
            });
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
            if (!event.data) return;
            if (event.data.type === 'mw:stage-size') {
                const width = Number(event.data.width);
                const height = Number(event.data.height);
                if (Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0) {
                    setStageHeightRatio(height / width);
                }
                return;
            }
            if (event.data.type === 'mw:diagnostic') {
                api.recordDiagnostic(id, event.data.diagnostic).catch(() => {});
            }
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
        setConfirmUnsandboxed(false);
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
        setConfirmUnsandboxed(true);
    };
    const confirmRunUnsandboxed = () => {
        setConfirmUnsandboxed(false);
        setUnsandboxed(true);
    };

    useEffect(() => {
        let timeout;
        if (thumbnailStatus === 'saved') {
            timeout = setTimeout(() => setThumbnailStatus('idle'), 2500);
        }
        return () => clearTimeout(timeout);
    }, [thumbnailStatus]);

    const saveTitle = async () => {
        if (!project || !project.isOwner) return;
        const context = actionContextRef.current;
        const next = title.trim();
        if (!next) {
            setTitle(project.title);
            setActionError('Project titles cannot be empty.');
            return;
        }
        if (next === project.title) return;
        const actionKey = beginAction('title');
        if (!actionKey) return;
        try {
            setSavingTitle(true);
            await api.updateProject(id, {title: next});
            if (actionContextRef.current !== context) return;
            setProject(current => ({...current, title: next}));
            setActionError(null);
        } catch (e) {
            if (actionContextRef.current === context) {
                setTitle(project.title);
                setActionError(e.message || 'Could not update the title.');
            }
        } finally {
            releaseAction(actionKey);
            if (actionContextRef.current === context) setSavingTitle(false);
        }
    };

    useEffect(() => {
        if (!project || !project.projectJsonUrl) return;
        preloadContent(project.projectJsonUrl).catch(() => null);
        const assetsBase = project.assetsBase ? `${project.assetsBase.replace(/\/+$/, '')}/` : null;
        const allowed = url => typeof url === 'string' &&
            (url === project.projectJsonUrl || (assetsBase && url.startsWith(assetsBase)));
        const onMessage = event => {
            const frame = stageFrame.current;
            if (!frame || event.source !== frame.contentWindow) return;
            const data = event.data;
            if (!data) return;
            if (data.type === 'mw:embed-ready') {
                cachedFetchBuffer(project.projectJsonUrl)
                    .then(buffer => {
                        try {
                            const copy = buffer.slice(0);
                            event.source.postMessage({
                                type: 'mw:preload-resource',
                                url: project.projectJsonUrl,
                                buffer: copy
                            }, '*', [copy]);
                        } catch (e) {
                            // ignore
                        }
                    })
                    .catch(() => null);
                return;
            }
            if (data.type !== 'mw:fetch' || !allowed(data.url)) return;
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

    const gamesUserMessage = useMemo(() => ({
        type: 'mw:games-user',
        user: userMessage.user
    }), [userMessage.user.loggedIn, userMessage.user.username, userMessage.user.id]);

    const gamesProjectId = String((project && project.id) || id || '');

    // MistWarp Games bridge for the sandboxed project player. Authentication
    // and short-lived save capabilities remain on this trusted project page;
    // project code only receives the result of the narrow operation it asked
    // for. Production saves are therefore separate from editor test saves.
    useEffect(() => {
        const projectId = gamesProjectId;
        if (!projectId) return;
        const reply = (source, payload) => {
            try {
                source.postMessage({type: 'mw:games-result', ...payload}, '*');
            } catch (e) {
                // ignore a player frame which navigated away during a request
            }
        };
        const onMessage = async event => {
            const frame = stageFrame.current;
            if (!frame || event.source !== frame.contentWindow) return;
            const data = event.data;
            if (!data || data.type !== 'mw:games') return;
            if (data.kind === 'hello') {
                if (!userLoading) {
                    try {
                        event.source.postMessage(gamesUserMessage, '*');
                    } catch (e) {
                        // ignore
                    }
                }
                return;
            }
            if (data.kind !== 'call') return;
            if (data.method === 'marketplace.open' || data.method === 'marketplace.purchase') {
                setGameMarketplace({
                    projectId,
                    productId: data.method === 'marketplace.purchase' ? String((data.args && data.args[0]) || '') : '',
                    onResult: result => reply(event.source, {id: data.id, ok: true, result})
                });
                return;
            }
            try {
                let result;
                if (data.method === 'data.load') {
                    result = await loadProjectSave(projectId, 'play');
                } else if (data.method === 'data.save') {
                    result = await saveProjectData(projectId, 'play', data.args && data.args[0]);
                } else if (data.method === 'data.global') {
                    result = await loadGlobalGameData(projectId, 'play');
                } else if (data.method === 'inventory.load') {
                    result = await loadProjectInventory(projectId, 'play');
                } else if (data.method === 'inventory.grant') {
                    const request = (data.args && data.args[0]) || {};
                    result = await grantProjectItem(projectId, 'play', request.item, request.requestId);
                } else if (data.method === 'multiplayer.connect') {
                    result = {
                        connected: false,
                        self: '',
                        players: [],
                        status: MULTIPLAYER_ENABLED ? 'multiplayer unavailable' : 'multiplayer disabled'
                    };
                } else if (data.method === 'multiplayer.disconnect') {
                    result = {connected: false};
                } else if (data.method === 'multiplayer.players') {
                    result = [];
                } else if (data.method === 'multiplayer.setState') {
                    result = false;
                } else if (data.method === 'multiplayer.sendEvent') {
                    result = false;
                } else if (data.method === 'marketplace.owns') {
                    const owned = await api.ownsGameProduct(projectId, String((data.args && data.args[0]) || ''));
                    result = owned.owned;
                } else {
                    throw new Error(`MistWarp Games method is not available: ${data.method}`);
                }
                reply(event.source, {id: data.id, ok: true, result});
            } catch (e) {
                reply(event.source, {
                    id: data.id,
                    ok: false,
                    error: String((e && e.message) || e)
                });
            }
        };
        window.addEventListener('message', onMessage);
        try {
            const frame = stageFrame.current;
            if (!userLoading && frame && frame.contentWindow) {
                frame.contentWindow.postMessage(gamesUserMessage, '*');
            }
        } catch (e) {
            // ignore
        }
        return () => {
            window.removeEventListener('message', onMessage);
        };
    }, [gamesProjectId, userLoading, gamesUserMessage]);

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
        const context = actionContextRef.current;
        const actionKey = beginAction('reaction');
        if (!actionKey) return;
        setReactionBusy(true);
        try {
            const result = await api.reactProject(id, type);
            if (actionContextRef.current === context) {
                setProject(current => (current ? applyReactionResult(current, result) : current));
            }
        } catch (e) {
            if (actionContextRef.current === context) setActionError(e.message || 'Could not react.');
        } finally {
            releaseAction(actionKey);
            if (actionContextRef.current === context) setReactionBusy(false);
        }
    };

    const remix = () => {
        if (userLoading) return;
        if (!user) {
            login();
            return;
        }
        setActionError(null);
        setForkSetup({
            title: `${project.title} fork`,
            branch: project.gitBranch || 'main'
        });
    };

    const createFork = async event => {
        event.preventDefault();
        if (!forkSetup) return;
        const context = actionContextRef.current;
        const actionKey = beginAction('fork');
        if (!actionKey) return;
        setCreatingFork(true);
        try {
            const result = await api.remix(id, {
                title: forkSetup.title.trim(),
                branch: forkSetup.branch.trim()
            });
            if (actionContextRef.current === context) {
                window.location.href = editorUrl({platformProject: result.id});
            }
        } catch (e) {
            if (actionContextRef.current === context) setActionError(e.message || 'Could not create this fork.');
        } finally {
            releaseAction(actionKey);
            if (actionContextRef.current === context) setCreatingFork(false);
        }
    };

    const changeVisibility = async value => {
        const context = actionContextRef.current;
        const actionKey = beginAction('visibility');
        if (!actionKey) return;
        setSavingVisibility(true);
        try {
            const data = await api.setVisibility(id, value);
            if (actionContextRef.current !== context) return;
            setActionError(null);
            setProject(data.project);
            setProjectLoadContext(context);
        } catch (e) {
            if (actionContextRef.current === context) {
                setActionError(e.message || 'Could not update visibility.');
            }
        } finally {
            releaseAction(actionKey);
            if (actionContextRef.current === context) setSavingVisibility(false);
        }
    };

    const openBuyConfirm = async () => {
        const context = actionContextRef.current;
        const actionKey = beginAction('balance');
        if (!actionKey) return;
        setActionError(null);
        setConfirmBalance(null);
        setConfirmBuy(true);
        try {
            const balance = await getBalance();
            if (actionContextRef.current === context) setConfirmBalance(balance);
        } catch (e) {
            // balance stays null; the purchase still guards on the server
        } finally {
            releaseAction(actionKey);
        }
    };

    const openCheckout = async () => {
        const context = actionContextRef.current;
        const actionKey = beginAction('checkout');
        if (!actionKey) return;
        setCheckoutBusy(true);
        setActionError(null);
        try {
            await openCreditCheckout(CREDIT_PACKS[1]);
        } catch (e) {
            if (actionContextRef.current === context) {
                setActionError(e.needsReauth ?
                    'Your current login cannot buy credits. Log out and back in, then try again.' :
                    (e.message || 'Could not open checkout.'));
            }
        } finally {
            releaseAction(actionKey);
            if (actionContextRef.current === context) setCheckoutBusy(false);
        }
    };

    const doBuy = async () => {
        const context = actionContextRef.current;
        const actionKey = beginAction('buy');
        if (!actionKey) return;
        setBuying(true);
        setActionError(null);
        try {
            const fresh = await buyProject(id);
            if (actionContextRef.current !== context) return;
            setProject(fresh);
            setProjectLoadContext(context);
            setConfirmBuy(false);
        } catch (e) {
            if (actionContextRef.current !== context) return;
            setConfirmBuy(false);
            if (isInsufficientFunds(e)) {
                openCheckout();
            } else if (e.needsReauth) {
                setActionError('Your current login cannot send credits. Log out and back in, then try again.');
            } else {
                setActionError(e.message || 'Could not complete the purchase.');
            }
        } finally {
            releaseAction(actionKey);
            if (actionContextRef.current === context) setBuying(false);
        }
    };

    const supportProject = async () => {
        const amount = Math.round(Number(supportAmount) * 100) / 100;
        if (!Number.isFinite(amount) || amount < 0.01) {
            setActionError('Enter an amount greater than 0.');
            return;
        }
        const context = actionContextRef.current;
        const actionKey = beginAction('support');
        if (!actionKey) return;
        setSupporting(true);
        setActionError(null);
        try {
            await sendCommercePayment({
                to: project.owner,
                amount,
                kind: 'project_tip',
                resourceType: 'project',
                resourceId: project.id,
                note: `Support for ${project.title}`
            });
            if (actionContextRef.current !== context) return;
            setSupportSent(true);
        } catch (e) {
            if (actionContextRef.current !== context) return;
            if (isInsufficientFunds(e)) {
                setSupportOpen(false);
                openCheckout();
            } else {
                setActionError(e.needsReauth ?
                    'Your current login cannot send credits. Log out and back in, then try again.' :
                    (e.message || 'Could not support this project.'));
            }
        } finally {
            releaseAction(actionKey);
            if (actionContextRef.current === context) setSupporting(false);
        }
    };

    const toggleComments = async () => {
        const context = actionContextRef.current;
        const actionKey = beginAction('comments');
        if (!actionKey) return;
        setSavingComments(true);
        try {
            const data = await api.updateProject(id, {commentsOff: !project.commentsOff});
            if (actionContextRef.current !== context) return;
            setActionError(null);
            setProject(data.project);
            setProjectLoadContext(context);
        } catch (e) {
            if (actionContextRef.current === context) {
                setActionError(e.message || 'Could not update comments.');
            }
        } finally {
            releaseAction(actionKey);
            if (actionContextRef.current === context) setSavingComments(false);
        }
    };

    const removeProject = async () => {
        const context = actionContextRef.current;
        const actionKey = beginAction('delete');
        if (!actionKey) return;
        setDeletingProject(true);
        setActionError(null);
        try {
            await api.deleteProject(id);
            if (actionContextRef.current === context) navigate(`/users/${project.owner}`);
        } catch (e) {
            if (actionContextRef.current === context) setActionError(e.message || 'Could not delete this project.');
        } finally {
            releaseAction(actionKey);
            if (actionContextRef.current === context) setDeletingProject(false);
        }
    };

    const toggleLibrary = async () => {
        const context = actionContextRef.current;
        const actionKey = beginAction('library');
        if (!actionKey) return;
        setSavingLibrary(true);
        try {
            if (project.saved) {
                await api.unsaveProject(id);
            } else {
                await api.saveProject(id);
            }
            if (actionContextRef.current !== context) return;
            setProject(current => ({...current, saved: !current.saved}));
            setActionError(null);
        } catch (e) {
            if (actionContextRef.current === context) {
                setActionError(e.message || 'Could not update your library.');
            }
        } finally {
            releaseAction(actionKey);
            if (actionContextRef.current === context) setSavingLibrary(false);
        }
    };

    const toggleFeatured = async () => {
        const context = actionContextRef.current;
        const actionKey = beginAction('featured');
        if (!actionKey) return;
        setSavingFeatured(true);
        const next = featuredProject === id ? '' : id;
        try {
            await api.updateProfile({featuredProject: next});
            if (actionContextRef.current !== context) return;
            setFeaturedProject(next);
            setActionError(null);
        } catch (e) {
            if (actionContextRef.current === context) {
                setActionError(e.message || 'Could not update your featured project.');
            }
        } finally {
            releaseAction(actionKey);
            if (actionContextRef.current === context) setSavingFeatured(false);
        }
    };

    const copyLink = () => {
        const context = actionContextRef.current;
        copyText(window.location.href)
            .then(() => {
                if (actionContextRef.current !== context) return;
                setActionError(null);
                setThumbnailStatus('idle');
                setCopied(true);
                window.setTimeout(() => {
                    if (actionContextRef.current === context) setCopied(false);
                }, 2000);
            })
            .catch(() => {
                if (actionContextRef.current === context) setActionError('Could not copy the link.');
            });
    };
    const menuRemix = () => {
        remix();
    };
    const menuReport = () => {
        setReporting(true);
    };

    useEffect(() => {
        const onDown = event => {
            if (thumbMenuRef.current && !thumbMenuRef.current.contains(event.target)) {
                setThumbnailMenu(false);
            }
        };
        window.addEventListener('mousedown', onDown);
        return () => window.removeEventListener('mousedown', onDown);
    }, []);

    const pickThumbnail = event => {
        const file = event.target.files && event.target.files[0];
        const context = actionContextRef.current;
        event.target.value = '';
        if (!file) return;
        setThumbnailStatus('saving');
        api.setThumbnail(id, file)
            .then(() => {
                if (actionContextRef.current !== context) return;
                setActionError(null);
                setThumbnailStatus('saved');
                load();
            })
            .catch(e => {
                if (actionContextRef.current !== context) return;
                setThumbnailStatus('idle');
                setActionError(e.message || 'Could not set thumbnail.');
            });
    };

    const useStageThumbnail = () => {
        setThumbnailMenu(false);
        const context = actionContextRef.current;
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
                    if (actionContextRef.current !== context) return;
                    setActionError(null);
                    setThumbnailStatus('saved');
                    load();
                })
                .catch(e => {
                    if (actionContextRef.current !== context) return;
                    setThumbnailStatus('idle');
                    setActionError(e.message || 'Could not set thumbnail.');
                });
        };
        timeout = setTimeout(() => {
            window.removeEventListener('message', onMessage);
            if (actionContextRef.current !== context) return;
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
        list: options => api.getComments(id, options),
        add: (content, parent, kind) => api.addComment(id, content, parent, kind),
        remove: commentId => api.deleteComment(id, commentId),
        edit: (commentId, content) => api.editComment(id, commentId, content),
        react: (commentId, type) => api.reactComment(id, commentId, type)
    }), [id]);

    if (error && errorLoadContext === actionContext && projectLoadContext !== actionContext) {
        return (
            <main className={styles.page}>
                <div className={styles.status}>
                    <p>{error}</p>
                    {error === 'Project not found.' ? <Link className={styles.primary} to="/explore">Browse projects</Link> : <Button onClick={load}>Try again</Button>}
                </div>
            </main>
        );
    }
    if (!project || projectLoadContext !== actionContext) {
        return <main className={styles.page}><p className={styles.status}>Loading…</p></main>;
    }

    const ownsProject = Boolean(user && String(user.username).toLowerCase() === String(project.owner).toLowerCase());
    const seeInsideHref = editorUrl({platformProject: project.id});

    const sharedDate = formatDate(project.sharedAt || project.created);
    const visibility = project.visibility || (project.shared ? 'public' : 'private');
    const price = project.price || 0;
    const locked = Boolean(project.locked);
    const hasContent = project.hasContent !== false;
    const followThemeDecision = themeMode === 'followed' && user && owner ?
        followedOwner &&
            followedOwner.viewer === String(user.username).toLowerCase() &&
            followedOwner.owner === String(owner).toLowerCase() ?
            followedOwner.value :
            null :
        false;
    const themeAllowed = !revertTheme && (
        themeMode === 'all' ||
        (themeMode === 'hearted' && project.myReaction === 'heart') ||
        (themeMode === 'followed' && followThemeDecision === true)
    );
    const stageSourceKey = JSON.stringify([
        project.id,
        project.projectJsonUrl,
        project.assetsBase,
        project.trustedExtensions || [],
        Boolean(unsandboxed),
        Boolean(themeAllowed)
    ]);
    if (stageSource.current.key !== stageSourceKey) {
        stageSource.current = {
            key: stageSourceKey,
            url: embedUrl(project, {
                unsandboxed,
                applyProjectTheme: themeAllowed,
                persistStorage: !unsandboxed
            })
        };
    }

    return (
        <main
            className={`${styles.page} ${project.branding?.accentColor ? styles.branded : ''}`}
            style={project.branding?.accentColor ? {'--project-accent': project.branding.accentColor} : null}
        >
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
                        <div className={styles.bylineRow}>
                            <Link
                                to={`/users/${project.owner}`}
                                className={styles.byline}
                            >by {project.owner}</Link>
                            <GroupTag className={styles.projectGroupTag} username={project.owner} compact />
                            {project.groupTag ? <Link className={styles.groupByline} to={`/groups/${project.groupTag}`}>for @{project.groupTag}</Link> : null}
                        </div>
                        {project.branding?.tagline ? <p className={styles.brandTagline}>{project.branding.tagline}</p> : null}
                    </div>
                </div>
                <div className={styles.topActions}>
                    {user && !project.isOwner ? (
                        <button
                            type="button"
                            className={styles.remixButton}
                            onClick={() => {
                                setSupportSent(false);
                                setSupportOpen(true);
                            }}
                        >
                            <Coins size={16} />
                            Support
                        </button>
                    ) : null}
                    {project.isOwner ? (
                        <VisibilityMenu
                            value={visibility}
                            onChange={changeVisibility}
                            disabled={savingVisibility}
                        />
                    ) : project.canRemix ? (
                        <button
                            type="button"
                            className={styles.remixButton}
                            onClick={remix}
                            disabled={userLoading}
                            title={!user && !userLoading ? 'Sign in to remix' : null}
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
                    <Dropdown
                        className={styles.menuWrap}
                        menuClassName={styles.actionMenu}
                        renderTrigger={({open, toggle}) => (
                            <button
                                type="button"
                                className={styles.remixButton}
                                title="More actions"
                                aria-label="More actions"
                                aria-expanded={open}
                                aria-haspopup="menu"
                                onClick={toggle}
                            >
                                <MoreHorizontal size={18} />
                            </button>
                        )}
                    >
                        {({close}) => (
                            <React.Fragment>
                                <button
                                    type="button"
                                    onClick={() => {
                                        close();
                                        copyLink();
                                    }}
                                >
                                    <Link2 size={15} />
                                    Copy link
                                </button>
                                {user ? (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            close();
                                            toggleLibrary();
                                        }}
                                        disabled={savingLibrary}
                                    >
                                        {project.saved ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
                                        {project.saved ? 'Remove from library' : 'Save to library'}
                                    </button>
                                ) : null}
                                {user ? (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            close();
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
                                        onClick={close}
                                    >
                                        <SlidersHorizontal size={15} />
                                        Manage &amp; analytics
                                    </Link>
                                ) : null}
                                {project.isOwner ? (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            close();
                                            menuRemix();
                                        }}
                                        disabled={!user}
                                    >
                                        <GitFork size={15} />
                                        Remix
                                    </button>
                                ) : null}
                                {project.isOwner && project.shared ? (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            close();
                                            toggleFeatured();
                                        }}
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
                                    <button
                                        type="button"
                                        onClick={() => {
                                            close();
                                            menuReport();
                                        }}
                                    >
                                        <Flag size={15} />
                                        Report
                                    </button>
                                ) : null}
                                {project.isOwner ? <div className={styles.menuSeparator} role="separator" /> : null}
                                {project.isOwner ? (
                                    <button
                                        type="button"
                                        className={styles.menuDanger}
                                        onClick={() => {
                                            close();
                                            setActionError(null);
                                            setDeleteConfirm(true);
                                        }}
                                    >
                                        <Trash2 size={15} />
                                        Delete project
                                    </button>
                                ) : null}
                            </React.Fragment>
                        )}
                    </Dropdown>
                </div>
            </div>

            {collectionOpen ? <CollectionSaveModal project={project} onClose={() => setCollectionOpen(false)} /> : null}

            {supportOpen ? (
                <Modal
                    title={`Support ${project.owner}`}
                    onClose={() => !supporting && setSupportOpen(false)}
                    dismissDisabled={supporting}
                    actions={supportSent ? (
                        <Button variant="primary" onClick={() => setSupportOpen(false)}>Done</Button>
                    ) : (
                        <React.Fragment>
                            <Button variant="secondary" disabled={supporting} onClick={() => setSupportOpen(false)}>
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                busy={supporting}
                                busyLabel="Sending…"
                                onClick={supportProject}
                            >
                                <Coins size={15} /> Send {supportAmount || 0} credits
                            </Button>
                        </React.Fragment>
                    )}
                >
                    {supportSent ? (
                        <p className={styles.confirmText}>
                            {`${supportAmount} credits sent to ${project.owner}.`}
                        </p>
                    ) : (
                        <React.Fragment>
                            <p className={styles.confirmText}>This project stays free. Your credits go to its creator.</p>
                            <div className={styles.supportPresets}>
                                {[1, 5, 10, 25].map(amount => (
                                    <button
                                        type="button"
                                        key={amount}
                                        className={Number(supportAmount) === amount ? styles.supportPresetActive : styles.supportPreset}
                                        onClick={() => setSupportAmount(String(amount))}
                                    >{amount}</button>
                                ))}
                                <input
                                    aria-label="Custom support amount"
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    value={supportAmount}
                                    onChange={event => setSupportAmount(event.target.value)}
                                />
                            </div>
                        </React.Fragment>
                    )}
                </Modal>
            ) : null}

            {deleteConfirm ? (
                <Modal
                    title="Delete project?"
                    onClose={() => setDeleteConfirm(false)}
                    dismissDisabled={deletingProject}
                    actions={(
                        <React.Fragment>
                            <Button
                                variant="secondary"
                                className={styles.confirmCancel}
                                disabled={deletingProject}
                                onClick={() => setDeleteConfirm(false)}
                            >Cancel</Button>
                            <Button
                                variant="danger"
                                className={`${styles.confirmButton} ${styles.deleteConfirmButton}`}
                                busy={deletingProject}
                                busyLabel="Deleting…"
                                onClick={removeProject}
                            >
                                <Trash2 size={15} />
                                Delete project
                            </Button>
                        </React.Fragment>
                    )}
                >
                    <p className={styles.confirmText}>
                        <strong>{project.title}</strong> will be deleted permanently. This cannot be undone.
                    </p>
                    {actionError ? <p className={styles.confirmError}>{actionError}</p> : null}
                </Modal>
            ) : null}

            {confirmUnsandboxed ? (
                <Modal
                    title="Run custom extensions without the sandbox?"
                    onClose={() => setConfirmUnsandboxed(false)}
                    actions={(
                        <React.Fragment>
                            <Button
                                variant="secondary"
                                className={styles.confirmCancel}
                                onClick={() => setConfirmUnsandboxed(false)}
                            >Keep sandbox</Button>
                            <Button
                                variant="primary"
                                className={styles.confirmButton}
                                onClick={confirmRunUnsandboxed}
                            >
                                <ShieldAlert size={15} />
                                Run anyway
                            </Button>
                        </React.Fragment>
                    )}
                >
                    <p className={styles.confirmText}>
                        This gives the project full access to your MistWarp account. It could read your login
                        session, act as you, or change your data. Continue only if you trust the creator.
                    </p>
                </Modal>
            ) : null}

            {forkSetup ? (
                <Modal
                    className={styles.forkModal}
                    title="Set up your fork"
                    onClose={() => setForkSetup(null)}
                    dismissDisabled={creatingFork}
                >
                    <form onSubmit={createFork}>
                        <p className={styles.forkIntro}>
                            This creates a private working copy with the full MistWarp history. You can send its changes back as a pull request.
                        </p>
                        <label className={styles.forkField}>
                            <span>Project name</span>
                            <input
                                value={forkSetup.title}
                                disabled={creatingFork}
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
                                disabled={creatingFork}
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
                            <Button className={styles.confirmCancel} onClick={() => setForkSetup(null)} disabled={creatingFork}>
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                className={styles.confirmButton}
                                type="submit"
                                busy={creatingFork}
                                busyLabel="Creating fork…"
                            >
                                <GitFork size={15} />
                                Create fork
                            </Button>
                        </div>
                    </form>
                </Modal>
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
            {gameMarketplace ? (
                <GameMarketplaceModal
                    projectId={gameMarketplace.projectId}
                    productId={gameMarketplace.productId}
                    onResult={result => {
                        gameMarketplace.onResult(result);
                        setGameMarketplace(null);
                    }}
                />
            ) : null}
            {confirmBuy ? (
                <Modal
                    title="Confirm purchase"
                    onClose={() => setConfirmBuy(false)}
                    dismissDisabled={buying || checkoutBusy}
                    actions={(
                        <React.Fragment>
                            <Button
                                variant="secondary"
                                className={styles.confirmCancel}
                                disabled={buying || checkoutBusy}
                                onClick={() => setConfirmBuy(false)}
                            >Cancel</Button>
                            {confirmBalance !== null && confirmBalance < price ? (
                                <Button
                                    variant="primary"
                                    className={styles.confirmButton}
                                    onClick={openCheckout}
                                    busy={checkoutBusy}
                                    busyLabel="Opening…"
                                >
                                    <Coins size={15} />
                                    Buy credits
                                </Button>
                            ) : (
                                <Button
                                    variant="primary"
                                    className={styles.confirmButton}
                                    onClick={doBuy}
                                    busy={buying}
                                    busyLabel="Processing…"
                                >
                                    <Coins size={15} />
                                    {`Pay ${price} credits`}
                                </Button>
                            )}
                        </React.Fragment>
                    )}
                >
                    <p className={styles.confirmText}>
                        {`Buy ${project.title} for ${price} credits?`}
                    </p>
                    {confirmBalance !== null ? (
                        <p className={styles.confirmBalance}>{`Your balance: ${confirmBalance} credits`}</p>
                    ) : null}
                </Modal>
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
                        type="button"
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
                    <div
                        className={styles.stageWrap}
                        style={{paddingBottom: `calc(${stageHeightRatio * 100}% + 48px)`}}
                    >
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
                                        type="button"
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
                            ) : followThemeDecision === null ? (
                                <div className={styles.paywall}>Loading project…</div>
                            ) : (
                                <iframe
                                    key={stageSourceKey}
                                    ref={stageFrame}
                                    className={styles.stage}
                                    src={stageSource.current.url}
                                    title={project.title}
                                    onLoad={sendThemeToStage}
                                    allow="autoplay; fullscreen"
                                    allowFullScreen
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
                                    type="button"
                                    className={styles.sandboxButton}
                                    onClick={() => setUnsandboxed(false)}
                                >Back to sandbox</button>
                            ) : (
                                <button
                                    type="button"
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
                            disabled={locked || reactionBusy}
                            disabledTitle={locked ? 'Buy this project to react' : 'Saving…'}
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
                                    type="button"
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
                                        <button type="button" onClick={useStageThumbnail}>
                                            <MonitorPlay size={15} />
                                            Use current stage
                                        </button>
                                        <button type="button" onClick={chooseThumbnailUpload}>
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
                        onSaved={updated => {
                            if (updated) setProject(updated);
                        }}
                    />
                </div>
            </div>

            <div className={styles.bottomGrid}>
                <section className={styles.commentsCol}>
                    <div className={styles.commentsHead}>
                        <nav className={styles.tabs} aria-label="Project activity">
                            {MAIN_ACTIVITY_TABS.map(name => (
                                <button
                                    type="button"
                                    key={name}
                                    className={name === tab ? styles.tabActive : styles.tab}
                                    onClick={() => setTab(name)}
                                >{name}</button>
                            ))}
                        </nav>
                        <Dropdown
                            align="right"
                            className={styles.moreTabs}
                            menuClassName={styles.activityMenu}
                            renderTrigger={({open, toggle}) => {
                                const selected = MORE_ACTIVITY_TABS.includes(tab);
                                return (
                                    <button
                                        type="button"
                                        className={selected ? styles.moreTabActive : styles.moreTab}
                                        aria-expanded={open}
                                        aria-haspopup="menu"
                                        onClick={toggle}
                                    >
                                        {selected ? tab : 'More'}
                                        <ChevronDown size={14} />
                                    </button>
                                );
                            }}
                        >
                            {({close}) => MORE_ACTIVITY_TABS.map(name => (
                                <button
                                    type="button"
                                    key={name}
                                    onClick={() => {
                                        setTab(name);
                                        close();
                                    }}
                                >{name}</button>
                            ))}
                        </Dropdown>
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
                                    type="button"
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
                            onChange={refreshProjectAndHistory}
                        />
                    )}
                    {tab === 'Reviews' && <ReviewPanel key={id} id={id} project={project} user={user} login={login} ownsProject={ownsProject} />}
                    {tab === 'Releases' && (
                        <ReleaseList
                            key={id}
                            id={id}
                            isOwner={project.isOwner}
                            viewerName={viewerName}
                        />
                    )}
                    {tab === 'Pull requests' && (
                        <PullList
                            id={id}
                            canMerge={project.isOwner}
                            onChange={load}
                        />
                    )}
                    {tab === 'Contribute' && (
                        <ContributionPanel
                            key={`${id}:${project.remixParent || ''}`}
                            id={project.remixParent || id}
                            sourceProjectId={project.remixParent ? id : ''}
                            user={user}
                            viewerName={viewerName}
                            login={login}
                        />
                    )}
                </section>

                <aside className={styles.remixCol}>
                    <ProjectBounties
                        project={project}
                        userLoading={userLoading}
                        onRemix={remix}
                        onCreate={() => navigate(`/mystuff/project/${id}?section=bounties`)}
                    />
                    <RemixTree id={id} />
                </aside>
            </div>
        </main>
    );
};

const ProjectBounties = ({project, userLoading, onRemix, onCreate}) => {
    const [items, setItems] = useState(null);

    useEffect(() => {
        let active = true;
        setItems(null);
        listCommerceBounties({
            source: 'mistwarp',
            resource_type: 'project',
            resource_id: project.id,
            status: 'open'
        })
            .then(data => {
                if (active) setItems(data.bounties || []);
            })
            .catch(() => {
                if (active) setItems([]);
            });
        return () => {
            active = false;
        };
    }, [project.id]);

    if (items === null || (!items.length && !project.isOwner)) return null;

    return (
        <section className={styles.bountyPanel} aria-labelledby="project-bounties-title">
            <div className={styles.bountyHeader}>
                <h2 id="project-bounties-title">
                    <Trophy size={17} />
                    Open bounties
                    <span>{items.length}</span>
                </h2>
                {project.isOwner ? (
                    <button type="button" className={styles.bountyAction} onClick={onCreate}>
                        <Plus size={14} /> New bounty
                    </button>
                ) : project.canRemix ? (
                    <button
                        type="button"
                        className={styles.bountyActionPrimary}
                        disabled={userLoading}
                        onClick={onRemix}
                    >
                        <GitFork size={14} /> Remix
                    </button>
                ) : null}
            </div>
            {items.length ? (
                <ul className={styles.bountyList}>
                    {items.map(item => (
                        <li key={item.id}>
                            <div>
                                <strong>{item.title}</strong>
                                {item.description ? <p>{item.description}</p> : null}
                            </div>
                            <span className={styles.bountyReward}>{item.amount} credits</span>
                        </li>
                    ))}
                </ul>
            ) : <p className={styles.bountyEmpty}>No active bounties. Create one for work you want done.</p>}
        </section>
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
    const [failed, setFailed] = useState(false);
    const [attempt, setAttempt] = useState(0);
    useEffect(() => {
        let active = true;
        setTree(null);
        setFailed(false);
        api.remixTree(id)
            .then(data => active && setTree(data))
            .catch(() => active && setFailed(true));
        return () => {
            active = false;
        };
    }, [attempt, id]);
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
    if (!tree && !failed) return null;
    if (failed) return <p className={styles.sideEmpty}>Could not load remixes. <button type="button" onClick={() => setAttempt(value => value + 1)}>Try again</button></p>;
    const nodes = tree.nodes || [];
    if (nodes.length < 2) return null;
    const childrenOf = parentId => childMap.get(parentId) || [];
    const root = nodes.find(node => node.id === tree.root);
    if (!root) return null;
    return (
        <section className={styles.remixPanel}>
            <h2 className={styles.colTitle}>Remixes</h2>
            <ul className={styles.tree}>
                <RemixTreeNode
                    node={root}
                    childrenOf={childrenOf}
                    currentId={id}
                />
            </ul>
        </section>
    );
};

const HistoryList = ({id, history, canRestore, onChange}) => {
    const [restoring, setRestoring] = useState(null);
    const [restoreError, setRestoreError] = useState(null);
    const [restoreCandidate, setRestoreCandidate] = useState(null);
    const [checkpointName, setCheckpointName] = useState('');
    const [checkpoints, setCheckpoints] = useState([]);
    const [checkpointPerk, setCheckpointPerk] = useState(false);
    const [checkpointBusy, setCheckpointBusy] = useState(false);
    const checkpointLocks = useRef(new Set());
    const restoreLocks = useRef(new Set());
    const idRef = useRef(id);
    idRef.current = id;
    useEffect(() => {
        restoreLocks.current.clear();
        setRestoring(null);
        setRestoreError(null);
        setRestoreCandidate(null);
        setCheckpointName('');
        setCheckpoints([]);
        setCheckpointPerk(false);
        setCheckpointBusy(false);
    }, [id]);
    useEffect(() => {
        if (!canRestore) return () => {};
        let active = true;
        Promise.all([api.perks(), api.releases(id)]).then(([perkData, releaseData]) => {
            if (!active) return;
            setCheckpointPerk(Boolean(perkData.current?.mistwarp?.historyCheckpoints));
            setCheckpoints((releaseData.releases || []).filter(release => release.channel === 'checkpoint'));
        }).catch(() => {});
        return () => {
            active = false;
        };
    }, [canRestore, id]);
    const createCheckpoint = async event => {
        event.preventDefault();
        const version = checkpointName.trim();
        const actionId = id;
        if (!version || checkpointLocks.current.has(actionId)) return;
        checkpointLocks.current.add(actionId);
        setCheckpointBusy(true);
        setRestoreError(null);
        try {
            const data = await api.createRelease(actionId, {version, channel: 'checkpoint', notes: ''});
            if (idRef.current !== actionId) return;
            setCheckpoints(current => [data.release, ...current]);
            setCheckpointName('');
        } catch (error) {
            if (idRef.current === actionId) {
                setRestoreError(error.message || 'Could not create the checkpoint.');
            }
        } finally {
            checkpointLocks.current.delete(actionId);
            if (idRef.current === actionId) setCheckpointBusy(false);
        }
    };
    const checkpointPanel = canRestore ? (
        <section className={styles.checkpointPanel}>
            <div><strong>Named checkpoints</strong><span>{checkpointPerk ? 'Included with your Rotur plan.' : 'Available with Rotur Lite, Plus, or Pro.'}</span></div>
            {checkpointPerk ? <form onSubmit={createCheckpoint}><input maxLength={50} placeholder="Checkpoint name" value={checkpointName} onChange={event => setCheckpointName(event.target.value)} /><Button busy={checkpointBusy} busyLabel="Saving…" type="submit">Save checkpoint</Button></form> : null}
            {checkpoints.length ? <div className={styles.checkpointList}>{checkpoints.map(checkpoint => <a href={embedUrl({id, projectJsonUrl: checkpoint.jsonUrl, assetsBase: checkpoint.assetsBase})} key={checkpoint._id}>{checkpoint.version}<small>{formatDateTime(checkpoint.created, 'Date unavailable')}</small></a>)}</div> : null}
        </section>
    ) : null;
    const requestRestore = commit => {
        if (restoring) return;
        setRestoreError(null);
        setRestoreCandidate(commit);
    };
    const restore = async commit => {
        const actionId = id;
        const lockId = `${actionId}\u0000${commit.sha}`;
        if (restoreLocks.current.has(lockId)) return;
        restoreLocks.current.add(lockId);
        setRestoring(commit.sha);
        setRestoreError(null);
        try {
            const {project} = await api.getProject(actionId);
            if (!project.workspaceUrl) throw new Error('This project does not have a saved version archive');
            const workspace = await fetchWorkspace(project.workspaceUrl);
            const result = await restoreMwpVersion({workspace, oid: commit.sha});
            await api.uploadProject(actionId, result.sb3, null, null, {
                workspace: result.mwp,
                git: result.manifest,
                expectedHead: result.expectedHead
            });
            if (idRef.current !== actionId) return;
            setRestoreCandidate(null);
            if (onChange) await onChange();
        } catch (error) {
            if (idRef.current === actionId) {
                setRestoreError(error.message || 'Could not restore this version.');
            }
        } finally {
            restoreLocks.current.delete(lockId);
            if (idRef.current === actionId) setRestoring(null);
        }
    };
    if (!history) return <p className={styles.status}>Loading…</p>;
    if (history.error) return <p className={styles.status}>Could not load version history. <button type="button" onClick={onChange}>Try again</button></p>;
    const commits = history.commits || [];
    if (!commits.length) return <React.Fragment>{checkpointPanel}<p className={styles.status}>No version history available.</p></React.Fragment>;
    if (history.graph?.nodes?.length) {
        return (
            <>
                {checkpointPanel}
                {restoreError ? <p className={styles.status}>{restoreError}</p> : null}
                <GitGraph
                    graph={history.graph}
                    currentBranch={history.branch}
                    onRestore={canRestore ? requestRestore : null}
                    restoring={restoring}
                />
                {restoreCandidate ? (
                    <Modal
                        title="Restore this version?"
                        onClose={() => setRestoreCandidate(null)}
                        dismissDisabled={Boolean(restoring)}
                        actions={(
                            <React.Fragment>
                                <Button
                                    variant="secondary"
                                    className={styles.confirmCancel}
                                    disabled={Boolean(restoring)}
                                    onClick={() => setRestoreCandidate(null)}
                                >Cancel</Button>
                                <Button
                                    variant="primary"
                                    className={styles.confirmButton}
                                    busy={Boolean(restoring)}
                                    busyLabel="Restoring…"
                                    onClick={() => restore(restoreCandidate)}
                                >Restore version</Button>
                            </React.Fragment>
                        )}
                    >
                        <p className={styles.confirmText}>
                            <strong>{(restoreCandidate.message || 'Saved version').split('\n')[0]}</strong>
                            {' '}will become the current project. Newer versions will stay in the history.
                        </p>
                        {restoreError ? <p className={styles.confirmError}>{restoreError}</p> : null}
                    </Modal>
                ) : null}
            </>
        );
    }
    return (
        <React.Fragment>
            {checkpointPanel}
            <ul className={styles.commitList}>
                {commits.map(commit => (
                    <li key={commit.sha}>
                        <code>{commit.sha.slice(0, 7)}</code>
                        <span className={styles.commitMsg}>{commit.message.split('\n')[0]}</span>
                        <span className={styles.muted}>{commit.author}</span>
                    </li>
                ))}
            </ul>
        </React.Fragment>
    );
};

const PullList = ({id, canMerge, onChange}) => {
    const [pulls, setPulls] = useState(null);
    const [loadError, setLoadError] = useState(false);
    const [openPull, setOpenPull] = useState(null);
    const [diff, setDiff] = useState(null);
    const [merging, setMerging] = useState(false);
    const [mergeError, setMergeError] = useState(null);
    const [mergeSession, setMergeSession] = useState(null);
    const actionLocks = useRef(new Set());
    const idRef = useRef(id);
    idRef.current = id;
    const beginLoad = useLatest();
    const beginView = useLatest();

    const loadPullFiles = async data => {
        const [target, source] = await Promise.all([
            fetchWorkspace(data.targetWorkspaceUrl),
            fetchWorkspace(data.sourceWorkspaceUrl)
        ]);
        return {target, source};
    };

    const reload = useCallback(() => {
        const fresh = beginLoad();
        setPulls(null);
        setLoadError(false);
        api.pulls(id)
            .then(fresh(d => setPulls(d.pulls || [])))
            .catch(fresh(() => setLoadError(true)));
    }, [beginLoad, id]);

    useEffect(() => {
        actionLocks.current.clear();
        beginView();
        setOpenPull(null);
        setDiff(null);
        setMerging(false);
        setMergeError(null);
        setMergeSession(null);
        cancelMwpMerge().catch(() => {});
        reload();
        return () => {
            beginView();
            cancelMwpMerge().catch(() => {});
        };
    }, [beginView, id, reload]);

    const view = async pull => {
        const viewLock = `view:${id}:${pull.index}`;
        if (actionLocks.current.has(viewLock)) return;
        actionLocks.current.add(viewLock);
        const fresh = beginView();
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
            fresh(setDiff)(inspected.diff || 'No textual changes.');
        } catch (e) {
            fresh(setDiff)('Could not load diff.');
        } finally {
            actionLocks.current.delete(viewLock);
        }
    };

    const uploadMerge = async (pull, data, actionId) => {
        const result = await finishMwpMerge();
        if (idRef.current !== actionId) return;
        await api.uploadPullMerge(actionId, {
            sb3: result.sb3,
            mwp: result.mwp,
            git: result.manifest,
            expectedHead: data.expectedHead,
            pullId: pull.index
        });
        if (idRef.current !== actionId) return;
        setMergeSession(null);
        setOpenPull(null);
        reload();
        onChange();
    };

    const merge = async pull => {
        const actionId = id;
        const mergeLock = `merge:${actionId}`;
        if (actionLocks.current.has(mergeLock)) return;
        actionLocks.current.add(mergeLock);
        setMerging(true);
        setMergeError(null);
        try {
            const data = await api.mergePull(actionId, pull.index);
            if (idRef.current !== actionId) return;
            const files = await loadPullFiles(data);
            if (idRef.current !== actionId) return;
            const result = await startMwpMerge({
                ...files,
                pullId: pull.index,
                baseCommit: data.pull.baseCommit,
                headCommit: data.pull.headCommit
            });
            if (idRef.current !== actionId) {
                await cancelMwpMerge();
                return;
            }
            if (result.conflicts.length || result.binaryConflicts.length) {
                setMergeSession({
                    pull,
                    data,
                    conflicts: result.conflicts,
                    binaryConflicts: result.binaryConflicts.map(path => ({path, choice: ''}))
                });
            } else {
                await uploadMerge(pull, data, actionId);
            }
        } catch (e) {
            await cancelMwpMerge();
            if (idRef.current === actionId) setMergeError(e.message || 'Merge failed.');
        } finally {
            actionLocks.current.delete(mergeLock);
            if (idRef.current === actionId) setMerging(false);
        }
    };

    const updateConflict = (path, content) => {
        setMergeSession(session => ({
            ...session,
            conflicts: session.conflicts.map(file => (file.path === path ? {...file, content} : file))
        }));
    };

    const resolveConflicts = async () => {
        if (!mergeSession) return;
        const actionId = id;
        const mergeLock = `merge:${actionId}`;
        if (actionLocks.current.has(mergeLock)) return;
        actionLocks.current.add(mergeLock);
        const session = mergeSession;
        setMerging(true);
        setMergeError(null);
        try {
            for (const file of session.conflicts) {
                await updateMergeConflict(file.path, file.content);
            }
            for (const file of session.binaryConflicts) {
                if (!file.choice) throw new Error(`Choose a version for ${file.path}`);
                await chooseMergeBinary(file.path, file.choice);
            }
            if (idRef.current !== actionId) return;
            await uploadMerge(session.pull, session.data, actionId);
        } catch (e) {
            if (idRef.current === actionId) {
                setMergeError(e.message || 'The conflicts could not be resolved.');
            }
        } finally {
            actionLocks.current.delete(mergeLock);
            if (idRef.current === actionId) setMerging(false);
        }
    };

    const closePull = async () => {
        const closeLock = `close:${id}`;
        if (actionLocks.current.has(`merge:${id}`) || actionLocks.current.has(closeLock)) return;
        actionLocks.current.add(closeLock);
        try {
            await cancelMwpMerge();
            if (idRef.current !== id) return;
            setMergeSession(null);
            setOpenPull(null);
        } finally {
            actionLocks.current.delete(closeLock);
        }
    };

    if (!pulls && !loadError) return <p className={styles.status}>Loading…</p>;
    if (loadError) return <p className={styles.status}>Could not load pull requests. <button type="button" onClick={reload}>Try again</button></p>;
    if (openPull) {
        return (
            <div>
                <button
                    type="button"
                    className={styles.backLink}
                    onClick={closePull}
                    disabled={merging}
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
                                    disabled={merging}
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
                                        disabled={merging}
                                        onClick={() => setMergeSession(session => ({
                                            ...session,
                                            binaryConflicts: session.binaryConflicts.map(item =>
                                                (item.path === file.path ? {...item, choice: 'ours'} : item))
                                        }))}
                                    >Keep current project</button>
                                    <button
                                        type="button"
                                        className={file.choice === 'theirs' ? styles.binaryChoiceActive : ''}
                                        disabled={merging}
                                        onClick={() => setMergeSession(session => ({
                                            ...session,
                                            binaryConflicts: session.binaryConflicts.map(item =>
                                                (item.path === file.path ? {...item, choice: 'theirs'} : item))
                                        }))}
                                    >Use fork version</button>
                                </div>
                            </div>
                        ))}
                        <Button
                            variant="primary"
                            className={styles.primary}
                            onClick={resolveConflicts}
                            busy={merging}
                            busyLabel="Finishing merge…"
                        >Save resolutions and merge</Button>
                    </div>
                ) : null}
                {canMerge && openPull.state === 'open' ? (
                    <Button
                        variant="primary"
                        className={styles.primary}
                        onClick={() => merge(openPull)}
                        disabled={merging || Boolean(mergeSession)}
                        busy={merging}
                        busyLabel="Merging…"
                    >Merge</Button>
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
                        type="button"
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
    const viewerName = (user && user.username) || '';
    const reviewContext = `${id}\u0000${viewerName}`;
    const reviewContextRef = useRef(reviewContext);
    reviewContextRef.current = reviewContext;
    const [reviews, setReviews] = useState(null);
    const [summary, setSummary] = useState({average: 0, count: 0});
    const [rating, setRating] = useState(0);
    const [message, setMessage] = useState('');
    const [hasReview, setHasReview] = useState(false);
    const [status, setStatus] = useState('');
    const [loadError, setLoadError] = useState(false);
    const [busy, setBusy] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState(false);
    const actionLocks = useRef(new Set());
    const beginLoad = useLatest();

    const load = useCallback(() => {
        const fresh = beginLoad();
        setReviews(null);
        setLoadError(false);
        api.reviews(id)
            .then(fresh(data => {
                setReviews(data.reviews || []);
                setSummary({average: Number(data.average) || 0, count: Number(data.count) || 0});
                const mine = data.myReview && data.myReview._id ? data.myReview : null;
                setHasReview(Boolean(mine));
                setRating(mine ? Number(mine.rating) : 0);
                setMessage(mine ? mine.message || '' : '');
            }))
            .catch(fresh(() => setLoadError(true)));
    }, [beginLoad, id, viewerName]);

    useEffect(() => {
        actionLocks.current.clear();
        setBusy('');
        setStatus('');
        setDeleteConfirm(false);
        load();
    }, [load]);

    const submit = async event => {
        event.preventDefault();
        const actionContext = reviewContextRef.current;
        if (actionLocks.current.has(actionContext)) return;
        if (!user) {
            login();
            return;
        }
        if (!rating) {
            setStatus('Choose a star rating first.');
            return;
        }
        actionLocks.current.add(actionContext);
        setBusy('save');
        setStatus('');
        try {
            const data = await api.saveReview(id, reviewPayload(rating, message));
            if (reviewContextRef.current !== actionContext) return;
            const previousRating = hasReview ? Number(
                (reviews || []).find(review =>
                    String(review.author).toLowerCase() === viewerName.toLowerCase())?.rating || rating
            ) : 0;
            setSummary(current => updateReviewSummary(current, previousRating, rating));
            setReviews(current => {
                const withoutMine = (current || []).filter(review =>
                    String(review.author).toLowerCase() !== viewerName.toLowerCase());
                return [data.review, ...withoutMine];
            });
            setHasReview(true);
            setStatus('Review saved.');
        } catch (e) {
            if (reviewContextRef.current === actionContext) {
                setStatus(e.message || 'Could not save your review.');
            }
        } finally {
            actionLocks.current.delete(actionContext);
            if (reviewContextRef.current === actionContext) setBusy('');
        }
    };

    const remove = async () => {
        const actionContext = reviewContextRef.current;
        if (actionLocks.current.has(actionContext)) return;
        actionLocks.current.add(actionContext);
        setBusy('delete');
        setStatus('');
        try {
            await api.deleteReview(id);
            if (reviewContextRef.current !== actionContext) return;
            const previousRating = Number(
                (reviews || []).find(review =>
                    String(review.author).toLowerCase() === viewerName.toLowerCase())?.rating || rating
            );
            setSummary(current => updateReviewSummary(current, previousRating, 0));
            setReviews(current => (current || []).filter(review =>
                String(review.author).toLowerCase() !== viewerName.toLowerCase()));
            setRating(0);
            setMessage('');
            setHasReview(false);
            setStatus('Review deleted.');
            setDeleteConfirm(false);
        } catch (e) {
            if (reviewContextRef.current === actionContext) {
                setStatus(e.message || 'Could not delete your review.');
            }
        } finally {
            actionLocks.current.delete(actionContext);
            if (reviewContextRef.current === actionContext) setBusy('');
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
                        <ReviewStars rating={rating} onChange={busy ? null : setRating} />
                    </div>
                    <textarea value={message} disabled={Boolean(busy)} maxLength={2000} placeholder="What worked well? What should change?" onChange={event => setMessage(event.target.value)} />
                    <div className={styles.reviewActions}>
                        <Button
                            type="submit"
                            disabled={busy === 'delete'}
                            busy={busy === 'save'}
                            busyLabel="Saving…"
                        >{user ? 'Save review' : 'Sign in to review'}</Button>
                        {hasReview ? (
                            <Button
                                type="button"
                                variant="secondary"
                                disabled={Boolean(busy)}
                                onClick={() => {
                                    setStatus('');
                                    setDeleteConfirm(true);
                                }}
                            >Delete</Button>
                        ) : null}
                        {status ? <span>{status}</span> : null}
                    </div>
                </form>
            ) : <p className={styles.reviewOwnerHint}>You cannot review your own project.</p>}
            {!reviews && !loadError ? <p className={styles.status}>Loading reviews…</p> : null}
            {loadError ? <p className={styles.status}>Could not load reviews. <button type="button" onClick={load}>Try again</button></p> : null}
            {reviews && !reviews.length ? <p className={styles.reviewEmpty}>No reviews yet.</p> : null}
            {reviews && reviews.map(review => (
                <article key={review._id} className={styles.reviewCard}>
                    <Link to={`/users/${review.author}`}><Avatar username={review.author} size={34} /></Link>
                    <div>
                        <header>
                            <Link to={`/users/${review.author}`}>{review.author}</Link>
                            {Number.isFinite(review.playtimeMs) && review.playtimeMs > 0 ? (
                                <span className={styles.reviewPlaytime}>{formatPlaytime(review.playtimeMs)}</span>
                            ) : null}
                            <span>{timeAgo(review.edited || review.created)}</span>
                        </header>
                        <ReviewStars rating={review.rating} />
                        {review.message ? <p><RichText text={review.message} /></p> : null}
                    </div>
                </article>
            ))}
            {deleteConfirm ? (
                <Modal
                    title="Delete your review?"
                    onClose={() => setDeleteConfirm(false)}
                    dismissDisabled={Boolean(busy)}
                    actions={(
                        <React.Fragment>
                            <Button
                                variant="secondary"
                                className={styles.confirmCancel}
                                disabled={Boolean(busy)}
                                onClick={() => setDeleteConfirm(false)}
                            >Cancel</Button>
                            <Button
                                variant="danger"
                                className={`${styles.confirmButton} ${styles.deleteConfirmButton}`}
                                busy={busy === 'delete'}
                                busyLabel="Deleting…"
                                onClick={remove}
                            >Delete review</Button>
                        </React.Fragment>
                    )}
                >
                    <p className={styles.confirmText}>Your rating and review text will be removed.</p>
                    {status ? <p className={styles.confirmError}>{status}</p> : null}
                </Modal>
            ) : null}
        </div>
    );
};

const ReleaseList = ({id, isOwner, viewerName}) => {
    const actionContext = `${id}\u0000${viewerName}`;
    const actionContextRef = useRef(actionContext);
    actionContextRef.current = actionContext;
    const [releases, setReleases] = useState(null);
    const [form, setForm] = useState({version: '', channel: 'stable', notes: ''});
    const [error, setError] = useState('');
    const [loadError, setLoadError] = useState(false);
    const [busy, setBusy] = useState(false);
    const actionLocks = useRef(new Set());
    const beginLoad = useLatest();
    const updateForm = (field, value) => setForm(current => ({...current, [field]: value}));

    const load = useCallback(() => {
        const fresh = beginLoad();
        setReleases(null);
        setLoadError(false);
        api.releases(id)
            .then(fresh(data => setReleases(data.releases || [])))
            .catch(fresh(() => setLoadError(true)));
    }, [beginLoad, id, viewerName]);

    useEffect(() => {
        actionLocks.current.clear();
        setForm({version: '', channel: 'stable', notes: ''});
        setError('');
        setBusy(false);
        load();
    }, [load]);

    const create = async event => {
        event.preventDefault();
        const context = actionContextRef.current;
        if (actionLocks.current.has(context)) return;
        const payload = releasePayload(form);
        if (!payload.version) {
            setError('Enter a version before publishing.');
            return;
        }
        actionLocks.current.add(context);
        setBusy(true);
        setError('');
        try {
            const data = await api.createRelease(id, payload);
            if (actionContextRef.current !== context) return;
            setForm({version: '', channel: 'stable', notes: ''});
            setReleases(current => [data.release, ...(current || []).filter(item => item._id !== data.release._id)]);
        } catch (e) {
            if (actionContextRef.current === context) {
                setError(e.message || 'Could not create the release.');
            }
        } finally {
            actionLocks.current.delete(context);
            if (actionContextRef.current === context) setBusy(false);
        }
    };

    return (
        <div className={styles.toolPanel}>
            {isOwner ? (
                <form className={styles.inlineForm} onSubmit={create}>
                    <h3>Publish a release</h3>
                    <div className={styles.inlineFields}>
                        <input value={form.version} disabled={busy} required maxLength={50} placeholder="Version, such as 1.2.0" onChange={event => updateForm('version', event.target.value)} />
                        <SelectMenu
                            options={[
                                {value: 'stable', label: 'Stable'},
                                {value: 'beta', label: 'Beta'},
                                {value: 'development', label: 'Development'}
                            ]}
                            value={form.channel}
                            disabled={busy}
                            onChange={value => updateForm('channel', value)}
                            ariaLabel="Release channel"
                        />
                    </div>
                    <textarea value={form.notes} disabled={busy} placeholder="What changed?" onChange={event => updateForm('notes', event.target.value)} />
                    <Button type="submit" disabled={busy}>{busy ? 'Publishing…' : 'Publish release'}</Button>
                    {error ? <p className={styles.actionError}>{error}</p> : null}
                </form>
            ) : null}
            {!releases && !loadError ? <p className={styles.status}>Loading releases…</p> : null}
            {loadError ? <p className={styles.status}>Could not load releases. <button type="button" onClick={load}>Try again</button></p> : null}
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

const ContributionPanel = ({id, sourceProjectId, user, viewerName, login}) => {
    const actionContext = `${id}\u0000${sourceProjectId}\u0000${viewerName}`;
    const actionContextRef = useRef(actionContext);
    actionContextRef.current = actionContext;
    const [remixProjectId, setRemixProjectId] = useState(sourceProjectId);
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [status, setStatus] = useState('');
    const [busy, setBusy] = useState(false);
    const [bounties, setBounties] = useState([]);
    const [bountyId, setBountyId] = useState('');
    const actionLocks = useRef(new Set());

    useEffect(() => {
        actionLocks.current.clear();
        setRemixProjectId(sourceProjectId);
        setTitle('');
        setBody('');
        setStatus('');
        setBusy(false);
        setBountyId('');
        if (user) {
            listCommerceBounties({source: 'mistwarp', resource_type: 'project', resource_id: id})
                .then(data => setBounties(data.bounties || []))
                .catch(() => setBounties([]));
        } else {
            setBounties([]);
        }
    }, [id, sourceProjectId, viewerName]);

    const submit = async event => {
        event.preventDefault();
        const context = actionContextRef.current;
        if (actionLocks.current.has(context)) return;
        if (!user) {
            login();
            return;
        }
        const payload = contributionPayload(remixProjectId, title, body, bountyId);
        if (!payload.remixProjectId || !payload.title) {
            setStatus('Add a fork project ID and title before sending.');
            return;
        }
        actionLocks.current.add(context);
        setBusy(true);
        setStatus('');
        try {
            const data = await api.contribute(id, payload);
            if (actionContextRef.current !== context) return;
            setStatus(`Contribution #${data.pull.index} sent.`);
            setTitle('');
            setBody('');
        } catch (e) {
            if (actionContextRef.current === context) {
                setStatus(e.message || 'Could not send the contribution.');
            }
        } finally {
            actionLocks.current.delete(context);
            if (actionContextRef.current === context) setBusy(false);
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
                    disabled={busy}
                    required
                    placeholder="Your fork project ID"
                    onChange={event => setRemixProjectId(event.target.value)}
                />
            ) : null}
            <input value={title} disabled={busy} required maxLength={200} placeholder="What did you change?" onChange={event => setTitle(event.target.value)} />
            <textarea value={body} disabled={busy} placeholder="Anything the creator should know" onChange={event => setBody(event.target.value)} />
            {bounties.length ? (
                <SelectMenu
                    options={[
                        {value: '', label: 'No bounty'},
                        ...bounties.map(bounty => ({
                            value: bounty.id,
                            label: `${bounty.amount} credits: ${bounty.title}`
                        }))
                    ]}
                    value={bountyId}
                    disabled={busy}
                    onChange={setBountyId}
                    ariaLabel="Link a bounty"
                    width={320}
                />
            ) : null}
            <Button type="submit" disabled={busy}>{busy ? 'Sending…' : user ? 'Send contribution' : 'Sign in to contribute'}</Button>
            {status ? <p className={styles.muted}>{status}</p> : null}
        </form>
    );
};

export {HistoryList, PullList, ReviewPanel};
export default Project;
