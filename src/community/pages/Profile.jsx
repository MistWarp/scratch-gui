/* eslint-disable max-len */
import React, {useEffect, useState, useCallback, useMemo, useRef} from 'react';
import {useLocation, useNavigate, useParams, Link} from 'react-router-dom';
import {
    UserPlus, UserCheck, Calendar, MessageSquare, MessageSquareOff, ChevronRight, Pencil, Flag, Coins, Star, Ban,
    VolumeX, FolderKanban, Palette, Gamepad2
} from 'lucide-react';
import api, {projectUrl} from '../api';
import rotur from '../rotur';
import {payUser} from '../../lib/rotur/client.js';
import {isInsufficientFunds, openCreditCheckout, CREDIT_PACKS} from '../credits';
import {useUser} from '../UserContext.jsx';
import ProjectCard from '../components/ProjectCard.jsx';
import CommentThread from '../components/CommentThread.jsx';
import ReportModal from '../components/ReportModal.jsx';
import Avatar from '../components/Avatar.jsx';
import RichText from '../components/RichText.jsx';
import Button from '../components/ui/Button.jsx';
import Modal from '../components/ui/Modal.jsx';
import ActivityCard from '../components/ActivityCard.jsx';
import FeaturedProject from '../components/FeaturedProject.jsx';
import ProfileBadges from '../components/ProfileBadges.jsx';
import ProfilePosts from '../components/ProfilePosts.jsx';
import ThemeCard from '../components/ThemeCard.jsx';
import GroupTag from '../components/GroupTag.jsx';
import UserLink from '../components/UserLink.jsx';
import UserStatus from '../components/UserStatus.jsx';
import useLatest from '../use-latest.js';
import setPageMeta from '../page-meta.js';
import scrollToAnchorWithRetry from '../scroll-to-anchor.js';
import {formatPlaytime, safeDate, timeAgo} from '../format';
import styles from './Profile.module.css';

const FOLLOWER_STRIP_COUNT = 16;
const PROFILE_TABS = ['projects', 'posts', 'themes'];
export const profileTabFromHash = hash => {
    const requested = String(hash || '').replace(/^#/, '').toLowerCase();
    return PROFILE_TABS.includes(requested) ? requested : 'projects';
};
export const mergeProjects = (current, incoming) => {
    const byId = new Map((current || []).map(project => [project.id, project]));
    for (const project of incoming || []) byId.set(project.id, project);
    return Array.from(byId.values());
};
export const profileLoadMessage = error => (
    error && error.status === 404 ? 'This user does not exist on Rotur.' : 'Could not load this profile.'
);

const normalizeThemeColor = value => {
    const color = typeof value === 'string' ? value.trim() : '';
    if (/^#[0-9a-f]{6}$/i.test(color)) return color.toLowerCase();
    if (/^#[0-9a-f]{3}$/i.test(color)) {
        return `#${color.slice(1).split('').map(part => part + part).join('')}`.toLowerCase();
    }
    return null;
};

const accentContrast = color => {
    const channels = [1, 3, 5].map(index => parseInt(color.slice(index, index + 2), 16) / 255);
    const luminance = channels.reduce((total, channel, index) => (
        total + ((channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4)) *
            [0.2126, 0.7152, 0.0722][index])
    ), 0);
    return luminance > 0.48 ? '#090a0b' : '#ffffff';
};

export const profileThemeStyle = theme => {
    if (!theme || typeof theme !== 'object') return {};
    const accent = normalizeThemeColor(theme.accent);
    const background = normalizeThemeColor(theme.background);
    const primary = normalizeThemeColor(theme.primary);
    const secondary = normalizeThemeColor(theme.secondary);
    const tertiary = normalizeThemeColor(theme.tertiary);
    const text = normalizeThemeColor(theme.text);
    return {
        ...(accent ? {
            '--accent': accent,
            '--accent-strong': accent,
            '--accent-border': accent,
            '--accent-soft': `color-mix(in srgb, ${accent} 18%, transparent)`,
            '--accent-softer': `color-mix(in srgb, ${accent} 10%, transparent)`,
            '--accent-contrast': accentContrast(accent)
        } : {}),
        ...(background ? {'--profile-card-background': background} : {}),
        ...(primary ? {'--bg-card': primary, '--mw-panel': primary} : {}),
        ...(secondary ? {'--bg-raised': secondary} : {}),
        ...(tertiary ? {
            '--border': tertiary,
            '--border-soft': `color-mix(in srgb, ${tertiary} 68%, transparent)`,
            '--mw-border': tertiary
        } : {}),
        ...(text ? {
            '--mw-text': text,
            '--text-dim': `color-mix(in srgb, ${text} 72%, transparent)`,
            '--text-faint': `color-mix(in srgb, ${text} 52%, transparent)`,
            '--mw-text-muted': `color-mix(in srgb, ${text} 66%, transparent)`
        } : {})
    };
};

const joinYear = ms => {
    const date = safeDate(ms);
    return date ? date.getFullYear() : null;
};

const lastPlayedLabel = value => {
    const timestamp = Number(value);
    if (!(timestamp > 0)) return '';
    const relative = timeAgo(timestamp);
    return relative === 'just now' ? 'last played just now' : `last played ${relative} ago`;
};

const scrollToCommentAnchor = id => scrollToAnchorWithRetry(id);

const parseDonationAmount = value => {
    const amount = Math.round(Number(value) * 100) / 100;
    return Number.isFinite(amount) && amount > 0 ? amount : null;
};

const Profile = () => {
    const {name} = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const {user, loading: userLoading, login} = useUser();
    const viewerName = (user && user.username) || '';
    const loadContext = `${name}\u0000${viewerName}`;
    const [profile, setProfile] = useState(null);
    const [profileLoadContext, setProfileLoadContext] = useState('');
    const [mwUser, setMwUser] = useState(null);
    const [followers, setFollowers] = useState([]);
    const [error, setError] = useState(null);
    const [errorLoadContext, setErrorLoadContext] = useState('');
    const [actionError, setActionError] = useState(null);
    const [followBusy, setFollowBusy] = useState(false);
    const [commentsBusy, setCommentsBusy] = useState(false);
    const [reporting, setReporting] = useState(false);
    const [adminProjects, setAdminProjects] = useState([]);
    const [adminUser, setAdminUser] = useState(null);
    const [adminLevel, setAdminLevel] = useState('good');
    const [adminReason, setAdminReason] = useState('');
    const [adminMessage, setAdminMessage] = useState('');
    const [adminBusy, setAdminBusy] = useState('');
    const [adminNote, setAdminNote] = useState('');
    const [donating, setDonating] = useState(false);
    const [reviews, setReviews] = useState(null);
    const [safetyBusy, setSafetyBusy] = useState(false);
    const [blockConfirmOpen, setBlockConfirmOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('projects');
    const [profileBadges, setProfileBadges] = useState([]);
    const [profilePosts, setProfilePosts] = useState([]);
    const [profileThemes, setProfileThemes] = useState(null);
    const [profileThemesError, setProfileThemesError] = useState(false);
    const [projectsBusy, setProjectsBusy] = useState(false);
    const [projectsError, setProjectsError] = useState('');
    const actionContext = `${name}\u0000${viewerName}`;
    const actionContextRef = useRef(actionContext);
    actionContextRef.current = actionContext;
    const actionLocks = useRef(new Set());

    const beginLoad = useLatest();

    useEffect(() => {
        setActiveTab(profileTabFromHash(location.hash));
    }, [location.hash, name]);

    const loadThemes = useCallback(() => {
        const context = loadContext;
        setProfileThemes(null);
        setProfileThemesError(false);
        api.themes({owner: name})
            .then(data => {
                if (actionContextRef.current !== context) return;
                setProfileThemes(data && Array.isArray(data.themes) ? data.themes : []);
            })
            .catch(() => {
                if (actionContextRef.current !== context) return;
                setProfileThemes([]);
                setProfileThemesError(true);
            });
    }, [loadContext, name]);

    const load = useCallback(() => {
        const fresh = beginLoad();
        setError(null);
        setErrorLoadContext('');
        setProjectsError('');
        rotur.profile(name, {includePosts: true})
            .then(fresh(data => {
                if (!data || typeof data !== 'object') throw new Error('Profile response was incomplete.');
                setProfile(data);
                setProfileBadges(Array.isArray(data.badges) ? data.badges : []);
                setProfilePosts(Array.isArray(data.posts) ? data.posts : []);
                setProfileLoadContext(loadContext);
            }))
            .catch(fresh(requestError => {
                setErrorLoadContext(loadContext);
                setError(profileLoadMessage(requestError));
            }));
        api.getUser(name)
            .then(fresh(data => setMwUser(data ? {
                ...data,
                projects: Array.isArray(data.projects) ? data.projects : []
            } : null)))
            .catch(fresh(() => setMwUser(null)));
        api.userReviews(name)
            .then(fresh(data => setReviews(data && Array.isArray(data.reviews) ? data.reviews : [])))
            .catch(fresh(() => setReviews([])));
        loadThemes();
        rotur.followers(name)
            .then(fresh(data => setFollowers(data && Array.isArray(data.followers) ? data.followers : [])))
            .catch(fresh(() => setFollowers([])));
    }, [loadContext, name, beginLoad, loadThemes]);

    useEffect(() => {
        setProfile(null);
        setMwUser(null);
        setFollowers([]);
        setReviews(null);
        setError(null);
        setActionError(null);
        setFollowBusy(false);
        setCommentsBusy(false);
        setSafetyBusy(false);
        setBlockConfirmOpen(false);
        setReporting(false);
        setDonating(false);
        setActiveTab(profileTabFromHash(window.location.hash));
        setProfileBadges([]);
        setProfilePosts([]);
        setProfileThemes(null);
        setProfileThemesError(false);
        setProjectsBusy(false);
        setProjectsError('');
        load();
    }, [name, viewerName, load]);

    useEffect(() => {
        if (!user || !user.isAdmin) {
            setAdminProjects([]);
            setAdminUser(null);
            return () => {};
        }
        let active = true;
        api.admin.getUser(name)
            .then(data => {
                if (!active) return;
                setAdminUser(data);
                setAdminLevel((data.standing && data.standing.level) || 'good');
                setAdminProjects(data.projects || []);
            })
            .catch(() => {
                if (!active) return;
                setAdminUser(null);
                setAdminProjects([]);
            });
        return () => {
            active = false;
        };
    }, [name, user]);

    const refreshAdminUser = useCallback(async () => {
        const data = await api.admin.getUser(name);
        setAdminUser(data);
        setAdminLevel((data.standing && data.standing.level) || 'good');
        setAdminProjects(data.projects || []);
    }, [name]);

    const runAdminAction = useCallback(async (key, action, success) => {
        if (adminBusy) return;
        setAdminBusy(key);
        setAdminNote('');
        try {
            await action();
            await refreshAdminUser();
            setAdminNote(success);
        } catch (requestError) {
            setAdminNote(requestError.message || 'Moderation action failed.');
        } finally {
            setAdminBusy('');
        }
    }, [adminBusy, refreshAdminUser]);

    useEffect(() => {
        if (!profile) return;
        setPageMeta({
            title: profile.username || name,
            description: profile.bio,
            image: rotur.avatar(name, 256),
            card: 'summary'
        });
    }, [profile, name]);

    // Scroll to a comment anchor after the comments section renders
    useEffect(() => {
        if (profileLoadContext !== loadContext) return;
        const hash = window.location.hash;
        if (!hash) return;
        return scrollToCommentAnchor(hash.replace('#', ''));
    }, [loadContext, profileLoadContext]);

    const toggleFollow = async () => {
        const context = actionContextRef.current;
        const actionKey = `${context}\u0000follow`;
        if (!user || !profile || actionLocks.current.has(actionKey)) return;
        actionLocks.current.add(actionKey);
        setFollowBusy(true);
        setActionError(null);
        try {
            const me = user.username;
            if (profile.followed) {
                await rotur.unfollow(name);
                if (actionContextRef.current !== context) return;
                setProfile(p => ({...p, followed: false, followers: Math.max(0, (p.followers || 1) - 1)}));
                setFollowers(fs => fs.filter(f => f.toLowerCase() !== me.toLowerCase()));
            } else {
                await rotur.follow(name);
                if (actionContextRef.current !== context) return;
                setProfile(p => ({...p, followed: true, followers: (p.followers || 0) + 1}));
                setFollowers(fs => [me, ...fs.filter(f => f.toLowerCase() !== me.toLowerCase())]);
            }
        } catch (e) {
            if (actionContextRef.current === context) {
                setActionError(e.message || 'Could not update follow.');
            }
        } finally {
            actionLocks.current.delete(actionKey);
            if (actionContextRef.current === context) setFollowBusy(false);
        }
    };

    const loadMoreProjects = async () => {
        if (!mwUser || projectsBusy) return;
        const context = actionContextRef.current;
        const offset = Number.isFinite(mwUser.projectOffset) ? mwUser.projectOffset : mwUser.projects.length;
        setProjectsBusy(true);
        setProjectsError('');
        try {
            const data = await api.userProjects(name, {offset, limit: 24});
            if (actionContextRef.current !== context) return;
            setMwUser(current => (current ? {
                ...current,
                projects: mergeProjects(current.projects, data.projects),
                projectTotal: Number.isFinite(data.total) ? data.total : current.projectTotal,
                projectOffset: Number.isFinite(data.nextOffset) ? data.nextOffset : offset + 24
            } : current));
        } catch (e) {
            if (actionContextRef.current === context) setProjectsError('Could not load more projects.');
        } finally {
            if (actionContextRef.current === context) setProjectsBusy(false);
        }
    };

    const isSelf = Boolean(user && user.username && user.username.toLowerCase() === name.toLowerCase());
    const commentsOff = Boolean(mwUser && mwUser.commentsOff);

    const toggleComments = async () => {
        const context = actionContextRef.current;
        const actionKey = `${context}\u0000comments`;
        if (actionLocks.current.has(actionKey)) return;
        actionLocks.current.add(actionKey);
        setCommentsBusy(true);
        setActionError(null);
        try {
            await api.updateProfile({commentsOff: !commentsOff});
            if (actionContextRef.current === context) load();
        } catch (e) {
            if (actionContextRef.current === context) {
                setActionError(e.message || 'Could not update comments.');
            }
        } finally {
            actionLocks.current.delete(actionKey);
            if (actionContextRef.current === context) setCommentsBusy(false);
        }
    };

    const toggleSafety = async (kind, confirmed = false) => {
        const context = actionContextRef.current;
        if (!mwUser) return;
        const active = kind === 'block' ? mwUser.viewerBlocked : mwUser.viewerMuted;
        if (kind === 'block' && !active && !confirmed) {
            setActionError(null);
            setBlockConfirmOpen(true);
            return;
        }
        const actionKey = `${context}\u0000safety`;
        if (actionLocks.current.has(actionKey)) return;
        actionLocks.current.add(actionKey);
        setSafetyBusy(true);
        setActionError(null);
        try {
            if (kind === 'block') {
                if (active) await api.unblockUser(name);
                else await api.blockUser(name);
                if (actionContextRef.current !== context) return;
                setMwUser(current => ({...current, viewerBlocked: !active}));
                setBlockConfirmOpen(false);
            } else {
                if (active) await api.unmuteUser(name);
                else await api.muteUser(name);
                if (actionContextRef.current !== context) return;
                setMwUser(current => ({...current, viewerMuted: !active}));
            }
        } catch (e) {
            if (actionContextRef.current === context) {
                setActionError(e.message || 'Could not update your safety settings.');
            }
        } finally {
            actionLocks.current.delete(actionKey);
            if (actionContextRef.current === context) setSafetyBusy(false);
        }
    };

    const commentSource = useMemo(() => ({
        list: options => api.getProfileComments(name, options),
        add: (content, parent) => api.addProfileComment(name, content, parent),
        remove: commentId => api.deleteProfileComment(name, commentId),
        edit: (commentId, content) => api.editProfileComment(name, commentId, content),
        react: (commentId, type) => api.reactProfileComment(name, commentId, type)
    }), [name]);

    if (error && errorLoadContext === loadContext && profileLoadContext !== loadContext) {
        return (
            <main className={styles.page}>
                <div className={styles.status}>
                    <p>{error}</p>
                    {error === 'Could not load this profile.' ? <Button onClick={load}>Try again</Button> : <Link to="/explore">Browse projects</Link>}
                </div>
            </main>
        );
    }
    if (!profile || profileLoadContext !== loadContext) {
        return <main className={styles.page}><p className={styles.status}>Loading…</p></main>;
    }

    const projects = (mwUser && mwUser.projects) || [];
    const projectTotal = mwUser && Number.isFinite(mwUser.projectTotal) ? mwUser.projectTotal : projects.length;
    const projectOffset = mwUser && Number.isFinite(mwUser.projectOffset) ? mwUser.projectOffset : projects.length;
    const featuredProject = mwUser ? projects.find(project => project.id === mwUser.featuredProject) : null;
    const otherProjects = featuredProject ? projects.filter(project => project.id !== featuredProject.id) : projects;
    const unsharedProjects = adminProjects.filter(project => !project.shared);
    const onMistWarp = !mwUser || mwUser.exists !== false;
    const year = joinYear(profile.created);
    const presence = profile.status || null;
    const activities = presence && Array.isArray(presence.activities) ? presence.activities : [];
    const showRecentActivity = Boolean(mwUser && onMistWarp);
    const recentActivity = mwUser && Array.isArray(mwUser.recentActivity) ?
        mwUser.recentActivity.filter(item => typeof item.libraryPublic === 'boolean') : [];
    const profileTheme = profileThemeStyle(profile.theme);
    const hasProfileTheme = Object.keys(profileTheme).length > 0;
    const selectTab = tab => {
        setActiveTab(tab);
        navigate({pathname: location.pathname, search: location.search, hash: `#${tab}`});
    };

    return (
        <main className={styles.page}>
            {blockConfirmOpen ? (
                <Modal
                    icon={Ban}
                    title={`Block ${profile.username || name}?`}
                    onClose={() => setBlockConfirmOpen(false)}
                    dismissDisabled={safetyBusy}
                    actions={(
                        <React.Fragment>
                            <Button
                                variant="danger"
                                className={styles.blockedButton}
                                busy={safetyBusy}
                                busyLabel="Blocking…"
                                onClick={() => toggleSafety('block', true)}
                            >Block user</Button>
                            <Button
                                variant="secondary"
                                className={styles.iconButton}
                                disabled={safetyBusy}
                                onClick={() => setBlockConfirmOpen(false)}
                            >Cancel</Button>
                        </React.Fragment>
                    )}
                >
                    <p className={styles.modalText}>
                        You will stop receiving MistWarp comments and notifications from each other.
                    </p>
                    {actionError ? <p className={styles.actionError}>{actionError}</p> : null}
                </Modal>
            ) : null}
            {reporting ? (
                <ReportModal
                    type="user"
                    target={name}
                    onClose={() => setReporting(false)}
                />
            ) : null}
            {donating ? (
                <DonateModal
                    recipient={profile.username || name}
                    onClose={() => setDonating(false)}
                />
            ) : null}
            <div className={styles.layout}>
                <div className={styles.mainColumn}>
                    {actionError ? <p className={styles.status}>{actionError}</p> : null}

                    {!onMistWarp ? (
                        <div className={styles.notOnMistwarp}>
                            Not on MistWarp yet. This is <UserLink username={profile.username || name}>{profile.username || name}</UserLink>&apos;s Rotur profile.
                        </div>
                    ) : null}

                    {user && user.isAdmin && adminUser ? (
                        <section className={styles.adminPanel} aria-labelledby="profile-admin-heading">
                            <div className={styles.adminPanelHead}>
                                <div>
                                    <span>Admin only</span>
                                    <h2 id="profile-admin-heading">Moderate @{adminUser.username}</h2>
                                </div>
                                <strong>{adminUser.banned ? 'Banned' : (adminUser.standing?.level || 'Good standing')}</strong>
                            </div>
                            <div className={styles.adminFields}>
                                <label>
                                    <span>Account standing</span>
                                    <select value={adminLevel} onChange={event => setAdminLevel(event.target.value)}>
                                        {['good', 'warning', 'suspended', 'banned'].map(level => (
                                            <option key={level} value={level}>{level}</option>
                                        ))}
                                    </select>
                                </label>
                                <label className={styles.adminReason}>
                                    <span>Reason shown to the user</span>
                                    <input value={adminReason} onChange={event => setAdminReason(event.target.value)} />
                                </label>
                                <Button
                                    variant="secondary"
                                    busy={adminBusy === 'standing'}
                                    onClick={() => runAdminAction(
                                        'standing',
                                        () => api.admin.setStanding(adminUser.username, adminLevel, adminReason.trim()),
                                        'Standing updated.'
                                    )}
                                >Apply</Button>
                            </div>
                            <div className={styles.adminFields}>
                                <label className={styles.adminReason}>
                                    <span>Private moderation message</span>
                                    <input value={adminMessage} onChange={event => setAdminMessage(event.target.value)} />
                                </label>
                                <Button
                                    variant="secondary"
                                    disabled={!adminMessage.trim()}
                                    busy={adminBusy === 'message'}
                                    onClick={() => runAdminAction(
                                        'message',
                                        () => api.admin.messageUser(adminUser.username, adminMessage.trim()).then(() => setAdminMessage('')),
                                        'Message sent.'
                                    )}
                                >Send message</Button>
                            </div>
                            <div className={styles.adminActions}>
                                <Button
                                    variant="secondary"
                                    busy={adminBusy === 'comments'}
                                    onClick={() => runAdminAction(
                                        'comments',
                                        () => api.admin.updateUserProfile(adminUser.username, {commentsOff: !adminUser.commentsOff}),
                                        adminUser.commentsOff ? 'Profile comments enabled.' : 'Profile comments disabled.'
                                    )}
                                >{adminUser.commentsOff ? 'Enable comments' : 'Disable comments'}</Button>
                                <Button
                                    variant={adminUser.banned ? 'secondary' : 'danger'}
                                    busy={adminBusy === 'ban'}
                                    onClick={() => runAdminAction(
                                        'ban',
                                        () => (adminUser.banned ? api.admin.unban(adminUser.username) :
                                            api.admin.ban(adminUser.username, adminReason.trim())),
                                        adminUser.banned ? 'User unbanned.' : 'User banned.'
                                    )}
                                >{adminUser.banned ? 'Unban user' : 'Ban user'}</Button>
                            </div>
                            {adminNote ? <p className={styles.adminNote}>{adminNote}</p> : null}
                        </section>
                    ) : null}

                    <div className={styles.tabs} role="tablist" aria-label="Profile content">
                        <button type="button" role="tab" aria-selected={activeTab === 'projects'} className={activeTab === 'projects' ? styles.tabActive : styles.tab} onClick={() => selectTab('projects')}>
                            <FolderKanban size={15} /> Projects <span>{projectTotal}</span>
                        </button>
                        <button type="button" role="tab" aria-selected={activeTab === 'posts'} className={activeTab === 'posts' ? styles.tabActive : styles.tab} onClick={() => selectTab('posts')}>
                            <MessageSquare size={15} /> Posts <span>{profilePosts.length}</span>
                        </button>
                        <button type="button" role="tab" aria-selected={activeTab === 'themes'} className={activeTab === 'themes' ? styles.tabActive : styles.tab} onClick={() => selectTab('themes')}>
                            <Palette size={15} /> Themes <span>{profileThemes?.length || 0}</span>
                        </button>
                    </div>

                    {activeTab === 'projects' ? (
                        <React.Fragment>

                            {featuredProject ? (
                                <section className={styles.section}>
                                    <FeaturedProject project={featuredProject} />
                                </section>
                            ) : null}

                            {showRecentActivity ? (
                                <section className={styles.section}>
                                    <div className={styles.sectionHead}>
                                        <h2 className={styles.sectionTitle}>Recent activity</h2>
                                        <div className={styles.activityActions}>
                                            {isSelf && mwUser.recentActivityVisible === false ? <span className={styles.privateActivity}>Only visible to you</span> : null}
                                            <Link className={styles.libraryLink} to={`/users/${name}/library`}>
                                                <Gamepad2 size={14} /> View game library
                                            </Link>
                                        </div>
                                    </div>
                                    {recentActivity.length ? (
                                        <div className={styles.recentActivity}>
                                            {recentActivity.map(item => {
                                                const projectId = item.projectId || item.id || item._id;
                                                return (
                                                    <article className={styles.recentActivityItem} key={projectId}>
                                                        <Link className={styles.recentActivityLink} to={projectUrl(projectId)} aria-label={`Open ${item.title}`} />
                                                        <img src={item.thumbUrl} alt="" loading="lazy" />
                                                        <span className={styles.recentActivityCopy}>
                                                            <strong>{item.title}</strong>
                                                            <small className={styles.recentActivityOwner}>by <UserLink username={item.owner}>{item.owner}</UserLink></small>
                                                        </span>
                                                        <span className={styles.recentActivityStats}>
                                                            {item.duration > 0 ?
                                                                <strong>{formatPlaytime(item.duration, false)}</strong> : null}
                                                            {Number(item.lastPlayed) > 0 ?
                                                                <small>{lastPlayedLabel(item.lastPlayed)}</small> : null}
                                                        </span>
                                                    </article>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <p className={styles.sectionEmpty}>
                                            {mwUser.recentActivityVisible === false && !isSelf ?
                                                'This user has chosen not to share what they play.' :
                                                'Games added to the library will appear here after they are played.'}
                                        </p>
                                    )}
                                </section>
                            ) : null}

                            {otherProjects.length ? (
                                <section className={styles.section}>
                                    <h2 className={styles.sectionTitle}>Projects</h2>
                                    <div className={styles.grid}>
                                        {otherProjects.map(project => (
                                            <ProjectCard
                                                key={project.id}
                                                project={project}
                                            />
                                        ))}
                                    </div>
                                    {projectOffset < projectTotal ? (
                                        <div className={styles.loadMore}>
                                            <Button
                                                variant="secondary"
                                                busy={projectsBusy}
                                                busyLabel="Loading…"
                                                onClick={loadMoreProjects}
                                            >Load more projects</Button>
                                        </div>
                                    ) : null}
                                    {projectsError ? <p className={styles.sectionEmpty}>{projectsError}</p> : null}
                                </section>
                            ) : null}

                            {user && user.isAdmin && unsharedProjects.length ? (
                                <section className={styles.section}>
                                    <h2 className={styles.sectionTitle}>Unshared projects (admin only)</h2>
                                    <div className={styles.grid}>
                                        {unsharedProjects.map(project => (
                                            <ProjectCard
                                                key={project.id}
                                                project={project}
                                            />
                                        ))}
                                    </div>
                                </section>
                            ) : null}

                            {onMistWarp ? (
                                <section className={styles.section}>
                                    <h2 className={styles.sectionTitle}>Recent reviews</h2>
                                    {reviews === null ? <p className={styles.sectionEmpty}>Loading reviews…</p> : null}
                                    {reviews && !reviews.length ? <p className={styles.sectionEmpty}>No reviews yet.</p> : null}
                                    {reviews && reviews.length ? (
                                        <div className={styles.reviewGrid}>
                                            {reviews.slice(0, 6).map(review => (
                                                <Link
                                                    key={review._id}
                                                    to={projectUrl(review.projectId)}
                                                    className={styles.reviewCard}
                                                >
                                                    <div className={styles.reviewHead}>
                                                        <strong>{review.projectTitle}</strong>
                                                        <span>{timeAgo(review.edited || review.created)}</span>
                                                    </div>
                                                    <div
                                                        className={styles.reviewStars}
                                                        aria-label={`${review.rating} out of 5 stars`}
                                                    >
                                                        {[1, 2, 3, 4, 5].map(value => (
                                                            <Star
                                                                key={value}
                                                                size={14}
                                                                fill={value <= review.rating ? 'currentColor' : 'none'}
                                                            />
                                                        ))}
                                                    </div>
                                                    {review.message ? (
                                                        <p><RichText text={review.message} /></p>
                                                    ) : (
                                                        <p className={styles.reviewNoText}>No written review.</p>
                                                    )}
                                                </Link>
                                            ))}
                                        </div>
                                    ) : null}
                                </section>
                            ) : null}

                            <section className={styles.section}>
                                <div className={styles.sectionHead}>
                                    <h2 className={styles.sectionTitle}>
                                        Followers - {profile.followers || followers.length}
                                    </h2>
                                    {followers.length ? (
                                        <Link
                                            to={`/users/${name}/followers`}
                                            className={styles.seeAll}
                                        >
                                            See all
                                            <ChevronRight size={14} />
                                        </Link>
                                    ) : null}
                                </div>
                                {followers.length ? (
                                    <div className={styles.followersRow}>
                                        {followers.slice(0, FOLLOWER_STRIP_COUNT).map(follower => (
                                            <Link
                                                key={follower}
                                                to={`/users/${follower}`}
                                                className={styles.followerChip}
                                            >
                                                <Avatar
                                                    username={follower}
                                                    size={56}
                                                />
                                                <span>{follower}</span>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <p className={styles.sectionEmpty}>No followers yet.</p>
                                )}
                            </section>

                            {onMistWarp ? (
                                <section className={styles.section} id="comments">
                                    <div className={styles.sectionHead}>
                                        <h2 className={styles.sectionTitle}>Comments</h2>
                                        {isSelf ? (
                                            <Button
                                                variant="secondary"
                                                className={styles.commentsToggle}
                                                onClick={toggleComments}
                                                busy={commentsBusy}
                                                busyLabel={commentsOff ? 'Turning on…' : 'Turning off…'}
                                            >
                                                {commentsOff ? <MessageSquare size={14} /> : <MessageSquareOff size={14} />}
                                                {commentsOff ? 'Turn on comments' : 'Turn off comments'}
                                            </Button>
                                        ) : null}
                                    </div>
                                    <div className={styles.feed}>
                                        <CommentThread
                                            source={commentSource}
                                            canModerate={isSelf}
                                            disabled={commentsOff}
                                            reportContext={`profile ${name}`}
                                        />
                                    </div>
                                </section>
                            ) : null}

                        </React.Fragment>
                    ) : null}

                    {activeTab === 'posts' ? (
                        <section className={styles.section}>
                            <ProfilePosts
                                posts={profilePosts}
                                username={profile.username || name}
                                viewer={user}
                                editable={isSelf}
                                onChange={setProfilePosts}
                                onLogin={login}
                            />
                        </section>
                    ) : null}

                    {activeTab === 'themes' ? (
                        <section className={styles.section}>
                            <h2 className={styles.sectionTitle}>Published themes</h2>
                            {profileThemes === null ? (
                                <p className={styles.sectionEmpty}>Loading themes…</p>
                            ) : profileThemesError ? (
                                <div className={styles.sectionEmpty} role="alert">
                                    <p>Could not load published themes.</p>
                                    <Button variant="secondary" onClick={loadThemes}>Try again</Button>
                                </div>
                            ) : profileThemes.length ? (
                                <div className={styles.themeGrid}>
                                    {profileThemes.map(item => <ThemeCard key={item.id} theme={item} />)}
                                </div>
                            ) : <p className={styles.sectionEmpty}>No published themes yet.</p>}
                        </section>
                    ) : null}

                </div>
                <aside className={styles.profileRail}>
                    <section
                        className={`${styles.profileCard} ${hasProfileTheme ? styles.profileCardThemed : ''}`}
                        style={profileTheme}
                    >
                        {profile.profile_video ? (
                            <video
                                className={styles.profileVideo}
                                src={profile.profile_video}
                                autoPlay
                                muted
                                loop
                                playsInline
                            />
                        ) : null}
                        <div
                            className={styles.banner}
                            style={{backgroundImage: `url(${profile.banner || rotur.banner(name)})`}}
                        />
                        <div className={styles.profileBody}>
                            <Avatar
                                username={name}
                                src={profile.pfp}
                                size={88}
                                className={styles.avatar}
                            />
                            <div className={styles.nameRow}>
                                <h1><UserLink username={profile.username || name}>{profile.username || name}</UserLink></h1>
                                {profile.group_tag ? (
                                    <GroupTag tag={profile.group_tag} className={styles.profileGroupTag} />
                                ) : null}
                            </div>
                            <div className={styles.profileMeta}>
                                {profile.pronouns ? <span className={styles.pronouns}>{profile.pronouns}</span> : null}
                                <UserStatus status={presence} className={styles.userStatus} />
                            </div>
                            {profileBadges.length || isSelf ? (
                                <ProfileBadges
                                    badges={profileBadges}
                                    editable={isSelf}
                                    onChange={setProfileBadges}
                                />
                            ) : null}
                            <div className={styles.profileStats}>
                                <Link className={styles.profileStatLink} to={`/users/${name}/followers`}><strong>{profile.followers || 0}</strong><span>followers</span></Link>
                                <Link className={styles.profileStatLink} to={`/users/${name}/following`}><strong>{profile.following || 0}</strong><span>following</span></Link>
                            </div>
                            <div className={styles.actions}>
                                {user && !isSelf ? (
                                    <React.Fragment>
                                        <div className={styles.primaryActions}>
                                            <Button
                                                variant="primary"
                                                className={profile.followed ? styles.followingButton : styles.followButton}
                                                busy={followBusy}
                                                busyLabel={profile.followed ? 'Unfollowing…' : 'Following…'}
                                                onClick={toggleFollow}
                                            >
                                                {profile.followed ? <UserCheck size={16} /> : <UserPlus size={16} />}
                                                {profile.followed ? 'Following' : 'Follow'}
                                            </Button>
                                            <Button
                                                variant="primary"
                                                className={styles.followButton}
                                                title={`Send credits to ${profile.username || name}`}
                                                onClick={() => setDonating(true)}
                                            >
                                                <Coins size={15} />
                                                Donate
                                            </Button>
                                        </div>
                                        <div className={styles.utilityActions}>
                                            {mwUser && mwUser.exists !== false ? (
                                                <Button
                                                    variant="secondary"
                                                    className={styles.iconButton}
                                                    disabled={safetyBusy}
                                                    onClick={() => toggleSafety('mute')}
                                                >
                                                    <VolumeX size={15} />
                                                    {mwUser.viewerMuted ? 'Unmute' : 'Mute'}
                                                </Button>
                                            ) : null}
                                            {mwUser && mwUser.exists !== false ? (
                                                <Button
                                                    variant={mwUser.viewerBlocked ? 'secondary' : 'danger'}
                                                    className={mwUser.viewerBlocked ? styles.blockedButton : styles.iconButton}
                                                    disabled={safetyBusy}
                                                    onClick={() => toggleSafety('block')}
                                                >
                                                    <Ban size={15} />
                                                    {mwUser.viewerBlocked ? 'Unblock' : 'Block'}
                                                </Button>
                                            ) : null}
                                            <Button
                                                variant="secondary"
                                                className={styles.iconButton}
                                                onClick={() => setReporting(true)}
                                            >
                                                <Flag size={15} />
                                                Report
                                            </Button>
                                        </div>
                                    </React.Fragment>
                                ) : !user && !userLoading ? (
                                    <Button variant="primary" className={styles.followButton} onClick={login}>
                                        <UserPlus size={16} />
                                        Sign in to follow
                                    </Button>
                                ) : null}
                                {isSelf ? (
                                    <a
                                        className={styles.followButton}
                                        href="https://rotur.dev/me"
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        <Pencil size={15} />
                                        Edit profile
                                    </a>
                                ) : null}
                            </div>
                            <div className={styles.railSection}>
                                <h2>About me</h2>
                                <div className={styles.bio}>
                                    {profile.bio ? <RichText text={profile.bio} /> : 'No bio yet.'}
                                </div>
                            </div>
                            <div className={styles.accountMeta}>
                                {year ? (
                                    <span><Calendar size={14} />Joined {year}</span>
                                ) : null}
                                {typeof profile.index === 'number' ? <span>Account #{profile.index}</span> : null}
                            </div>
                            {activities.length ? (
                                <div className={styles.railSection}>
                                    <h2>Activity</h2>
                                    <div className={styles.activityList}>
                                        {activities.slice(0, 3).map((activity, index) => (
                                            <ActivityCard key={activity.id || index} activity={activity} />
                                        ))}
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    </section>
                </aside>
            </div>
        </main>
    );
};

export const DonateModal = ({recipient, onClose}) => {
    const [amount, setAmount] = useState('');
    const [busy, setBusy] = useState(false);
    const [status, setStatus] = useState(null);
    const [sent, setSent] = useState(0);
    const [insufficient, setInsufficient] = useState(false);
    const actionLocks = useRef(new Set());
    const currentRecipient = useRef(recipient);
    currentRecipient.current = recipient;
    useEffect(() => {
        setAmount('');
        setBusy(false);
        setStatus(null);
        setSent(0);
        setInsufficient(false);
    }, [recipient]);
    const close = () => {
        if (!busy) onClose();
    };

    const send = async () => {
        const value = parseDonationAmount(amount);
        if (value === null) {
            setStatus('Enter an amount greater than 0.');
            return;
        }
        const actionRecipient = recipient;
        const actionKey = `${recipient}\u0000payment`;
        if (actionLocks.current.has(actionKey)) return;
        actionLocks.current.add(actionKey);
        setBusy(true);
        setStatus(null);
        setInsufficient(false);
        try {
            await payUser(recipient, value, `MistWarp donation to ${recipient}`);
            if (currentRecipient.current === actionRecipient) setSent(value);
        } catch (e) {
            if (currentRecipient.current === actionRecipient) {
                if (isInsufficientFunds(e)) {
                    setInsufficient(true);
                } else {
                    setStatus(e.needsReauth ?
                        'Your current login cannot send credits. Log out and back in, then try again.' :
                        (e.message || 'Could not send credits.'));
                }
            }
        } finally {
            actionLocks.current.delete(actionKey);
            if (currentRecipient.current === actionRecipient) setBusy(false);
        }
    };

    const buyCredits = async () => {
        const actionRecipient = recipient;
        const actionKey = `${recipient}\u0000payment`;
        if (actionLocks.current.has(actionKey)) return;
        actionLocks.current.add(actionKey);
        setBusy(true);
        setStatus(null);
        try {
            await openCreditCheckout(CREDIT_PACKS[1]);
        } catch (e) {
            if (currentRecipient.current === actionRecipient) {
                setStatus(e.needsReauth ?
                    'Your current login cannot buy credits. Log out and back in, then try again.' :
                    (e.message || 'Could not open checkout.'));
            }
        } finally {
            actionLocks.current.delete(actionKey);
            if (currentRecipient.current === actionRecipient) setBusy(false);
        }
    };

    const submit = event => {
        event.preventDefault();
        return insufficient ? buyCredits() : send();
    };

    return (
        <Modal
            className={styles.donateModal}
            dismissDisabled={busy}
            icon={Coins}
            onClose={close}
            title={`Donate to ${recipient}`}
        >
            {sent ? (
                <div className={styles.donateDone}>
                    <span className={styles.donateDoneIcon}><Coins size={28} /></span>
                    <p>{`Sent ${sent} credits to ${recipient}.`}</p>
                    <Button
                        variant="primary"
                        className={styles.donateSend}
                        onClick={close}
                    >Done</Button>
                </div>
            ) : (
                <form className={styles.donateBody} onSubmit={submit}>
                    <p className={styles.donateText}>
                        {`Send Rotur credits straight to ${recipient}. This transfers directly from your account.`}
                    </p>
                    <input
                        className={styles.donateInput}
                        type="number"
                        min="0.01"
                        step="0.01"
                        placeholder="Amount in credits"
                        value={amount}
                        disabled={busy}
                        required
                        onChange={event => setAmount(event.target.value)}
                    />
                    {status ? <p className={styles.donateStatus}>{status}</p> : null}
                    {insufficient ? (
                        <p className={styles.donateStatus}>
                            Not enough credits in your balance. Top up through Stripe, then send again.
                        </p>
                    ) : null}
                    <Button
                        variant="primary"
                        className={styles.donateSend}
                        type="submit"
                        busy={busy}
                        busyLabel={insufficient ? 'Opening…' : 'Sending…'}
                    >
                        <Coins size={16} />
                        {insufficient ? 'Buy credits' : 'Send credits'}
                    </Button>
                </form>
            )}
        </Modal>
    );
};

export {scrollToCommentAnchor, parseDonationAmount};
export default Profile;
