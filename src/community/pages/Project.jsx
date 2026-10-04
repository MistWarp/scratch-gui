import {getCommunityLocale} from '../locale.js';
import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
/* eslint-disable max-len */
import React, {useEffect, useState, useMemo, useRef} from 'react';
import {useParams, Link, useLocation, useNavigate} from 'react-router-dom';
import {Blocks, CalendarDays, ShieldAlert, Trash2, Coins, SearchX} from 'lucide-react';
import api, {editorUrl, embedUrl} from '../api';
import {useResolvedProjectId, projectBaseUrl} from '../use-resolved-project-id.js';
import {buyProject} from '../purchase';
import {listCommerceBounties} from '../credits';
import ProjectInfoPanel from '../components/ProjectInfoPanel.jsx';
import {canViewProjectSource} from '../project-source-access';
import ProjectCompatibility from '../components/ProjectCompatibility.jsx';
import CollectionSaveModal from '../components/CollectionSaveModal.jsx';
import {useUser} from '../UserContext.jsx';
import useAfterLogin from '../use-after-login.js';
import {formatDate} from '../format';
import ReportModal from '../components/ReportModal.jsx';
import Button from '../components/ui/Button.jsx';
import ConfirmModal from '../components/ui/ConfirmModal.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import StatusMessage from '../components/ui/StatusMessage.jsx';
import setPageMeta from '../page-meta.js';
import copyText from '../copy-text.js';
import scrollToAnchorWithRetry from '../scroll-to-anchor.js';
import projectRealtime from '../project-realtime.js';
import styles from './Project.module.css';
import RelatedProjects, {rememberProject} from '../components/RelatedProjects.jsx';
import {track} from '../analytics';
import {
    activityHash, activityTabForHash, initialActivityTab, initialVersionControlTab, VERSION_CONTROL_HASHES
} from './project/activity-tabs.js';
import {
    applyReactionResult, bountyProjectId, contributionPayload, contributionRemixes, currentSession,
    openPullForRemix, releasePayload, rememberBountyClaim, reviewPayload, updateReviewSummary
} from './project/project-helpers.js';
import {restoreUserTheme} from './project/embed-helpers.js';
import RemixTree from './project/RemixTree.jsx';
import HistoryList from './project/HistoryList.jsx';
import PullList from './project/PullList.jsx';
import ReviewPanel from './project/ReviewPanel.jsx';
import ReleaseList from './project/ReleaseList.jsx';
import useProjectData from './project/use-project-data.js';
import useProjectRealtime from './project/use-project-realtime.js';
import useStageContent from './project/use-stage-content.js';
import useProjectTheme from './project/use-project-theme.js';
import usePlayerBridge from './project/use-player-bridge.js';
import ProjectHeader from './project/ProjectHeader.jsx';
import ForkSetupModal from './project/ForkSetupModal.jsx';
import PlayerPrompts from './project/PlayerPrompts.jsx';
import ProjectNotices from './project/ProjectNotices.jsx';
import ProjectStage from './project/ProjectStage.jsx';
import ProjectActivity from './project/ProjectActivity.jsx';

const Project = () => {
    const {text: communityText} = useCommunityText();
    const {slug} = useParams();
    const {projectId: resolvedId, resolving: resolvingVanity, resolveError: vanityError} = useResolvedProjectId();
    const id = resolvedId || '';
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
    const location = useLocation();
    const {
        project, setProject, projectLoadContext, setProjectLoadContext, versionHistory, setVersionHistory,
        error, setError, errorLoadContext, beginHistoryLoad, load, loadHistory, refreshProjectAndHistory
    } = useProjectData(id);
    const [actionError, setActionError] = useState(null);
    const [tab, setTab] = useState(initialActivityTab);
    const [versionControlTab, setVersionControlTab] = useState(initialVersionControlTab);
    const [openPullCount, setOpenPullCount] = useState(null);
    const [openBountyCount, setOpenBountyCount] = useState(null);
    const [projectFileCount, setProjectFileCount] = useState(null);
    const [title, setTitle] = useState('');
    const [savingTitle, setSavingTitle] = useState(false);
    const [thumbnailStatus, setThumbnailStatus] = useState('idle');
    const [reporting, setReporting] = useState(false);
    const [copied, setCopied] = useState(false);
    const [collectionOpen, setCollectionOpen] = useState(false);
    const thumbInput = useRef(null);
    const stageFrame = useRef(null);
    const stageSource = useRef({key: null, url: null});
    const [buying, setBuying] = useState(false);
    const [confirmBuy, setConfirmBuy] = useState(false);
    const [savingLibrary, setSavingLibrary] = useState(false);
    const [savingFeatured, setSavingFeatured] = useState(false);
    const [savingComments, setSavingComments] = useState(false);
    const [reactionBusy, setReactionBusy] = useState(false);
    const [savingVisibility, setSavingVisibility] = useState(false);
    const [featuredProject, setFeaturedProject] = useState('');
    const [forkSetup, setForkSetup] = useState(null);
    const [forkBounty, setForkBounty] = useState(null);
    const [preferredBountyId, setPreferredBountyId] = useState('');
    const [creatingFork, setCreatingFork] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(false);
    const [deletingProject, setDeletingProject] = useState(false);
    const {
        stageHeightRatio, setStageHeightRatio, blockStats, customExtensions, contentError,
        unsandboxed, setUnsandboxed, confirmUnsandboxed, setConfirmUnsandboxed, runUnsandboxed, confirmRunUnsandboxed
    } = useStageContent(id, project, stageFrame);
    const owner = project && project.owner;
    const {
        themeMode, projectThemeApplied, setProjectThemeApplied, revertTheme, setRevertTheme, followedOwner, setFollowedOwner
    } = useProjectTheme(user, owner);
    const projectBountyId = project ? bountyProjectId(project) : '';
    // Stays on the /p/slug form while loading; canonical vanitySlug wins after load.
    const baseProjectUrl = projectBaseUrl({project, projectId: id, vanitySlug: slug});

    useProjectRealtime(id, viewerName, setProject);

    useEffect(() => {
        setFeaturedProject((user && user.featuredProject) || '');
    }, [user]);

    // The open pull request count is only shown in version control, so count them when it opens.
    const pullCountFor = useRef('');
    useEffect(() => {
        if (!id || tab !== 'Version control' || pullCountFor.current === id) return () => {};
        pullCountFor.current = id;
        let current = true;
        let settled = false;
        setOpenPullCount(null);
        api.pulls(id).then(data => {
            if (current) setOpenPullCount((data.pulls || []).filter(pull => pull.state === 'open').length);
        }).catch(() => {}).finally(() => {
            settled = true;
        });
        return () => {
            // Leaving before the count arrived: count again next time.
            if (!settled && pullCountFor.current === id) pullCountFor.current = '';
            current = false;
        };
    }, [id, tab]);

    useEffect(() => {
        if (!projectBountyId) return () => {};
        let current = true;
        setOpenBountyCount(null);
        listCommerceBounties({
            source: 'mistwarp',
            resource_type: 'project',
            resource_id: projectBountyId,
            status: 'open'
        }).then(data => {
            if (current) setOpenBountyCount((data.bounties || []).length);
        }).catch(() => {
            if (current) setOpenBountyCount(0);
        });
        return () => {
            current = false;
        };
    }, [projectBountyId]);

    // Load straight away with the stored session instead of waiting for sign-in to finish. Once
    // sign-in settles, load again only if it changed the session the project was loaded with.
    const loadedFor = useRef({id: '', session: null});
    useEffect(() => {
        if (!id) return;
        const session = currentSession();
        const previous = loadedFor.current;
        if (previous.id === id && (userLoading || previous.session === session)) return;
        loadedFor.current = {id, session};
        beginHistoryLoad();
        setProject(null);
        setProjectLoadContext('');
        setVersionHistory(null);
        setProjectFileCount(null);
        setError(null);
        setActionError(null);
        setReporting(false);
        setTab(initialActivityTab());
        setVersionControlTab(initialVersionControlTab());
        setCollectionOpen(false);
        setConfirmBuy(false);
        setForkSetup(null);
        setForkBounty(null);
        setPreferredBountyId('');
        setCreatingFork(false);
        setDeleteConfirm(false);
        setDeletingProject(false);
        setConfirmUnsandboxed(false);
        setBuying(false);
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
    }, [beginHistoryLoad, id, load, userLoading, viewerName]);

    // Follow the address when the hash changes, such as Back to an earlier tab or a pasted link.
    useEffect(() => {
        setTab(activityTabForHash(location.hash));
        if (VERSION_CONTROL_HASHES[location.hash]) setVersionControlTab(VERSION_CONTROL_HASHES[location.hash]);
    }, [location.hash]);

    const showActivity = (nextTab, nextVersionControlTab = versionControlTab) => {
        setTab(nextTab);
        setVersionControlTab(nextVersionControlTab);
        const hash = activityHash(nextTab, nextVersionControlTab);
        // Keep a comment link's anchor while the comments stay open.
        if (hash === location.hash || (!hash && activityTabForHash(location.hash) === nextTab)) return;
        navigate({search: location.search, hash}, {replace: true});
    };

    useEffect(() => {
        if (!project) return;
        if (!canViewProjectSource(project) && ['Files', 'Version control', 'Contribute'].includes(tab)) {
            setTab('Comments');
            setVersionHistory(null);
            return;
        }
        if (tab === 'Version control' && versionControlTab === 'history' && versionHistory === null) loadHistory();
    }, [loadHistory, tab, versionControlTab, versionHistory, project]);

    useEffect(() => {
        if (userLoading || !id) return;
        api.view(id).catch(() => {});
        rememberProject(id);
        track('project_view', {project: id, signedIn: Boolean(user)});
    }, [id, userLoading]);

    // Scroll to a comment anchor after the comments section renders
    useEffect(() => {
        if (projectLoadContext !== id) return;
        const hash = window.location.hash;
        if (!hash) return;
        return scrollToAnchorWithRetry(hash.replace('#', ''));
    }, [id, projectLoadContext]);

    useEffect(() => {
        if (project) setTitle(project.title || '');
    }, [project]);

    useEffect(() => {
        if (!project) return;
        setPageMeta({
            title: `${project.title} by ${project.owner}`,
            description: project.instructions || project.description,
            image: project.cardUrl || project.thumbUrl,
            card: 'summary_large_image'
        });
    }, [project]);

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

    const {roturModal, gameMarketplace, setGameMarketplace, sendThemeToStage} = usePlayerBridge({
        id, project, user, userLoading, stageFrame
    });

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

    const startRemix = () => {
        setActionError(null);
        setForkSetup({
            title: `${project.title} fork`,
            branch: project.gitBranch || 'main'
        });
    };

    const remixAfterLogin = useAfterLogin(startRemix, 'remix');
    const remix = () => {
        if (!userLoading) remixAfterLogin();
    };

    const remixForBounty = bounty => {
        setForkBounty(bounty);
        remix();
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
                rememberBountyClaim(result.id, forkBounty && forkBounty.id);
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

    const openBuyConfirm = () => {
        setActionError(null);
        setConfirmBuy(true);
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
            setActionError(e.cancelled ? communityText('Payment cancelled.') : (e.message || 'Could not complete the purchase.'));
        } finally {
            releaseAction(actionKey);
            if (actionContextRef.current === context) setBuying(false);
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
            let result;
            if (project.saved) {
                result = await api.unsaveProject(id);
            } else {
                result = await api.saveProject(id);
            }
            if (actionContextRef.current !== context) return;
            setProject(current => {
                const wasSaved = Boolean(current.saved);
                const fallbackCount = Math.max(0, (Number(current.saveCount) || 0) + (wasSaved ? -1 : 1));
                return {
                    ...current,
                    saved: !wasSaved,
                    saveCount: Number.isFinite(result.saves) ? result.saves : fallbackCount
                };
            });
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
    const saveAfterLogin = useAfterLogin(toggleLibrary, 'library');

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

    const copyLink = (text = window.location.href) => {
        const context = actionContextRef.current;
        copyText(text)
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
        thumbInput.current.click();
    };

    const commentSource = useMemo(() => ({
        list: options => api.getComments(id, options),
        add: (content, parent, kind, donation) => api.addComment(id, content, parent, kind, donation),
        donationIntent: (amount, returnUrl) => api.commentDonationIntent(id, amount, returnUrl),
        remove: commentId => api.deleteComment(id, commentId),
        edit: (commentId, content) => api.editComment(id, commentId, content),
        react: (commentId, type) => api.reactComment(id, commentId, type),
        pin: (commentId, pinned) => api.pinComment(id, commentId, pinned),
        subscribe: listener => projectRealtime.subscribe(
            id,
            listener,
            new URLSearchParams(window.location.search).get('k') || ''
        )
    }), [id]);

    if (vanityError && !project) {
        return (
            <main className={styles.page}>
                <EmptyState
                    icon={SearchX}
                    title={communityText('Project not found')}
                    action={<Button as={Link} to="/explore">{communityText('Browse projects')}</Button>}
                >{communityText('This project link does not exist.')}</EmptyState>
            </main>
        );
    }
    if (error && errorLoadContext === id && projectLoadContext !== id) {
        return (
            <main className={styles.page}>
                {error === 'Project not found.' ? (
                    <EmptyState
                        icon={SearchX}
                        title={communityText('Project not found')}
                        action={<Button as={Link} to="/explore">{communityText('Browse projects')}</Button>}
                    >{communityText('This project may have been deleted or unshared.')}</EmptyState>
                ) : (
                    <StatusMessage error onRetry={load}>{communityText('Could not load this project.')}</StatusMessage>
                )}
            </main>
        );
    }
    if (!project || projectLoadContext !== id) {
        return (
            <main className={styles.page}>
                <StatusMessage>{resolvingVanity ? communityText('Finding project…') : communityText('Loading…')}</StatusMessage>
            </main>
        );
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
            <ProjectHeader
                project={project}
                user={user}
                userLoading={userLoading}
                title={title}
                setTitle={setTitle}
                savingTitle={savingTitle}
                saveTitle={saveTitle}
                visibility={visibility}
                changeVisibility={changeVisibility}
                savingVisibility={savingVisibility}
                remix={remix}
                toggleLibrary={toggleLibrary}
                savingLibrary={savingLibrary}
                seeInsideHref={seeInsideHref}
                copyLink={copyLink}
                setCollectionOpen={setCollectionOpen}
                thumbnailStatus={thumbnailStatus}
                useStageThumbnail={useStageThumbnail}
                chooseThumbnailUpload={chooseThumbnailUpload}
                menuRemix={menuRemix}
                toggleFeatured={toggleFeatured}
                savingFeatured={savingFeatured}
                featuredProject={featuredProject}
                menuReport={menuReport}
                setActionError={setActionError}
                setDeleteConfirm={setDeleteConfirm}
            />

            {collectionOpen ? <CollectionSaveModal project={project} onClose={() => setCollectionOpen(false)} /> : null}

            {deleteConfirm ? (
                <ConfirmModal
                    destructive
                    title={communityText('Delete project?')}
                    confirmLabel={<React.Fragment><Trash2 size={15} />{communityText('Delete project')}</React.Fragment>}
                    busy={deletingProject}
                    busyLabel={communityText('Deleting…')}
                    error={actionError}
                    onConfirm={removeProject}
                    onCancel={() => setDeleteConfirm(false)}
                >{communityText('{value1} will be deleted permanently. This cannot be undone.', {value1: project.title})}</ConfirmModal>
            ) : null}

            {confirmUnsandboxed ? (
                <ConfirmModal
                    icon={ShieldAlert}
                    title={communityText('Run custom extensions without the sandbox?')}
                    cancelLabel={communityText('Keep sandbox')}
                    confirmLabel={<React.Fragment><ShieldAlert size={15} />{communityText('Run anyway')}</React.Fragment>}
                    onConfirm={confirmRunUnsandboxed}
                    onCancel={() => setConfirmUnsandboxed(false)}
                >{communityText('This gives the project full access to your MistWarp account. It could read your login session, act as you, or change your data. Continue only if you trust the creator.')}</ConfirmModal>
            ) : null}

            {forkSetup ? (
                <ForkSetupModal
                    project={project}
                    forkSetup={forkSetup}
                    setForkSetup={setForkSetup}
                    forkBounty={forkBounty}
                    setForkBounty={setForkBounty}
                    creatingFork={creatingFork}
                    createFork={createFork}
                />
            ) : null}

            {reporting ? (
                <ReportModal
                    type="project"
                    target={id}
                    onClose={() => setReporting(false)}
                />
            ) : null}
            <PlayerPrompts
                roturModal={roturModal}
                gameMarketplace={gameMarketplace}
                setGameMarketplace={setGameMarketplace}
            />
            {confirmBuy ? (
                <ConfirmModal
                    icon={Coins}
                    title={communityText('Confirm purchase')}
                    confirmLabel={(
                        <React.Fragment>
                            <Coins size={15} />
                            {communityText('Pay {value1} credits', {value1: price})}
                        </React.Fragment>
                    )}
                    busy={buying}
                    busyLabel={communityText('Waiting for Rotur…')}
                    onConfirm={doBuy}
                    onCancel={() => setConfirmBuy(false)}
                >
                    <p className={styles.confirmText}>
                        {communityText('Buy {value1} for a one-time payment of {value2} credits and support its creator?', {value1: project.title, value2: price})}
                    </p>
                    <p className={styles.confirmBalance}>{communityText('Rotur opens in a new window to take the payment.')}</p>
                </ConfirmModal>
            ) : null}
            <ProjectNotices
                project={project}
                visibility={visibility}
                price={price}
                actionError={actionError}
                setActionError={setActionError}
                copied={copied}
                thumbnailStatus={thumbnailStatus}
                projectThemeApplied={projectThemeApplied}
                revertTheme={revertTheme}
                setRevertTheme={setRevertTheme}
            />

            <div className={styles.stageRow}>
                <ProjectStage
                    project={project}
                    user={user}
                    userLoading={userLoading}
                    locked={locked}
                    hasContent={hasContent}
                    price={price}
                    buying={buying}
                    openBuyConfirm={openBuyConfirm}
                    contentError={contentError}
                    followThemeDecision={followThemeDecision}
                    stageHeightRatio={stageHeightRatio}
                    stageSourceKey={stageSourceKey}
                    stageFrame={stageFrame}
                    stageSource={stageSource}
                    sendThemeToStage={sendThemeToStage}
                    unsandboxed={unsandboxed}
                    setUnsandboxed={setUnsandboxed}
                    runUnsandboxed={runUnsandboxed}
                    customExtensions={customExtensions}
                    react={react}
                    reactionBusy={reactionBusy}
                    savingLibrary={savingLibrary}
                    saveAfterLogin={saveAfterLogin}
                    thumbInput={thumbInput}
                    pickThumbnail={pickThumbnail}
                />

                <div className={styles.sideCol}>
                    <ProjectInfoPanel
                        project={project}
                        facts={(
                            <React.Fragment>
                                {sharedDate ? <span><CalendarDays size={15} />{sharedDate}</span> : null}
                                {blockStats ? (
                                    <span>
                                        <Blocks size={15} />
                                        {communityText('{value1} blocks', {value1: blockStats.total.toLocaleString(getCommunityLocale())})}
                                    </span>
                                ) : null}
                                <ProjectCompatibility compatibility={project.compatibility} compact />
                            </React.Fragment>
                        )}
                        onSaved={updated => {
                            if (updated) setProject(updated);
                        }}
                    />
                </div>
            </div>

            <div className={`${styles.bottomGrid} ${tab === 'Files' || tab === 'Version control' ? styles.filesGrid : ''}`}>
                <ProjectActivity
                    id={id}
                    project={project}
                    user={user}
                    login={login}
                    userLoading={userLoading}
                    viewerName={viewerName}
                    ownsProject={ownsProject}
                    locked={locked}
                    baseProjectUrl={baseProjectUrl}
                    tab={tab}
                    showActivity={showActivity}
                    openBountyCount={openBountyCount}
                    projectFileCount={projectFileCount}
                    setProjectFileCount={setProjectFileCount}
                    commentSource={commentSource}
                    toggleComments={toggleComments}
                    savingComments={savingComments}
                    versionControlTab={versionControlTab}
                    versionHistory={versionHistory}
                    refreshProjectAndHistory={refreshProjectAndHistory}
                    openPullCount={openPullCount}
                    setOpenPullCount={setOpenPullCount}
                    remix={remix}
                    remixForBounty={remixForBounty}
                    preferredBountyId={preferredBountyId}
                    setPreferredBountyId={setPreferredBountyId}
                    navigate={navigate}
                />

                <aside className={styles.remixCol}>
                    <RemixTree id={id} baseUrl={baseProjectUrl} />
                    {project.shared ? <RelatedProjects id={project.id} /> : null}
                </aside>
            </div>
        </main>
    );
};

export {
    activityHash,
    activityTabForHash,
    applyReactionResult,
    bountyProjectId,
    contributionPayload,
    contributionRemixes,
    openPullForRemix,
    releasePayload,
    reviewPayload,
    updateReviewSummary,
    HistoryList,
    PullList,
    ReleaseList,
    ReviewPanel
};
export default Project;
