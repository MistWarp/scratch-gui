/* eslint-disable max-len */
import React, {useEffect, useState, useCallback, useMemo} from 'react';
import {useParams, Link} from 'react-router-dom';
import {
    UserPlus, UserCheck, Calendar, MessageSquare, MessageSquareOff, ChevronRight, Pencil, Flag, Coins, X, Star, Ban, VolumeX
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
import ActivityCard from '../components/ActivityCard.jsx';
import FeaturedProject from '../components/FeaturedProject.jsx';
import useLatest from '../use-latest.js';
import useEscape from '../use-escape.js';
import setPageMeta from '../page-meta.js';
import safeIconSvg from '../safe-icon.js';
import {timeAgo} from '../format';
import styles from './Profile.module.css';

const FOLLOWER_STRIP_COUNT = 16;

const joinYear = ms => {
    if (!ms) return null;
    try {
        return new Date(ms).getFullYear();
    } catch (e) {
        return null;
    }
};

const Profile = () => {
    const {name} = useParams();
    const {user} = useUser();
    const [profile, setProfile] = useState(null);
    const [mwUser, setMwUser] = useState(null);
    const [followers, setFollowers] = useState([]);
    const [error, setError] = useState(null);
    const [actionError, setActionError] = useState(null);
    const [followBusy, setFollowBusy] = useState(false);
    const [commentsBusy, setCommentsBusy] = useState(false);
    const [reporting, setReporting] = useState(false);
    const [adminProjects, setAdminProjects] = useState([]);
    const [donating, setDonating] = useState(false);
    const [reviews, setReviews] = useState(null);
    const [safetyBusy, setSafetyBusy] = useState(false);

    const beginLoad = useLatest();

    const load = useCallback(() => {
        const fresh = beginLoad();
        rotur.profile(name, {includePosts: false})
            .then(fresh(setProfile))
            .catch(fresh(() => setError('This user does not exist on Rotur.')));
        api.getUser(name)
            .then(fresh(setMwUser))
            .catch(fresh(() => setMwUser(null)));
        api.userReviews(name)
            .then(fresh(data => setReviews(data.reviews || [])))
            .catch(fresh(() => setReviews([])));
        rotur.followers(name)
            .then(fresh(data => setFollowers(data.followers || [])))
            .catch(fresh(() => setFollowers([])));
    }, [name, beginLoad]);

    useEffect(() => {
        setProfile(null);
        setMwUser(null);
        setFollowers([]);
        setReviews(null);
        setError(null);
        setReporting(false);
        load();
    }, [name, load]);

    useEffect(() => {
        if (!user || !user.isAdmin) {
            setAdminProjects([]);
            return () => {};
        }
        let active = true;
        api.myProjects(name)
            .then(data => active && setAdminProjects(data.projects || []))
            .catch(() => active && setAdminProjects([]));
        return () => {
            active = false;
        };
    }, [name, user]);

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
        const hash = window.location.hash;
        if (!hash) return;
        const id = hash.replace('#', '');
        const tryScroll = (attempts = 0) => {
            const el = document.getElementById(id);
            if (el) {
                el.scrollIntoView({behavior: 'smooth', block: 'center'});
                return;
            }
            if (attempts < 20) {
                setTimeout(() => tryScroll(attempts + 1), 300);
            }
        };
        tryScroll();
    }, [profile, mwUser]);

    const toggleFollow = async () => {
        if (!user || !profile || followBusy) return;
        setFollowBusy(true);
        setActionError(null);
        try {
            const me = user.username;
            if (profile.followed) {
                await rotur.unfollow(name);
                setProfile(p => ({...p, followed: false, followers: Math.max(0, (p.followers || 1) - 1)}));
                setFollowers(fs => fs.filter(f => f.toLowerCase() !== me.toLowerCase()));
            } else {
                await rotur.follow(name);
                setProfile(p => ({...p, followed: true, followers: (p.followers || 0) + 1}));
                setFollowers(fs => [me, ...fs.filter(f => f.toLowerCase() !== me.toLowerCase())]);
            }
        } catch (e) {
            setActionError(e.message || 'Could not update follow.');
        } finally {
            setFollowBusy(false);
        }
    };

    const isSelf = Boolean(user && user.username && user.username.toLowerCase() === name.toLowerCase());
    const commentsOff = Boolean(mwUser && mwUser.commentsOff);

    const toggleComments = async () => {
        if (commentsBusy) return;
        setCommentsBusy(true);
        setActionError(null);
        try {
            await api.updateProfile({commentsOff: !commentsOff});
            load();
        } catch (e) {
            setActionError(e.message || 'Could not update comments.');
        } finally {
            setCommentsBusy(false);
        }
    };

    const toggleSafety = async kind => {
        if (!mwUser || safetyBusy) return;
        const active = kind === 'block' ? mwUser.viewerBlocked : mwUser.viewerMuted;
        if (kind === 'block' && !active && !window.confirm(`Block ${name} on MistWarp? You will no longer receive MistWarp comments or notifications from each other.`)) return;
        setSafetyBusy(true);
        setActionError(null);
        try {
            if (kind === 'block') {
                if (active) await api.unblockUser(name);
                else await api.blockUser(name);
                setMwUser(current => ({...current, viewerBlocked: !active}));
            } else {
                if (active) await api.unmuteUser(name);
                else await api.muteUser(name);
                setMwUser(current => ({...current, viewerMuted: !active}));
            }
        } catch (e) {
            setActionError(e.message || 'Could not update your safety settings.');
        } finally {
            setSafetyBusy(false);
        }
    };

    const commentSource = useMemo(() => ({
        list: () => api.getProfileComments(name),
        add: (content, parent) => api.addProfileComment(name, content, parent),
        remove: commentId => api.deleteProfileComment(name, commentId),
        react: (commentId, type) => api.reactProfileComment(name, commentId, type)
    }), [name]);

    if (error) {
        return <main className={styles.page}><p className={styles.status}>{error}</p></main>;
    }
    if (!profile) {
        return <main className={styles.page}><p className={styles.status}>Loading…</p></main>;
    }

    const projects = (mwUser && mwUser.projects) || [];
    const featuredProject = mwUser ? projects.find(project => project.id === mwUser.featuredProject) : null;
    const otherProjects = featuredProject ? projects.filter(project => project.id !== featuredProject.id) : projects;
    const unsharedProjects = adminProjects.filter(project => !project.shared);
    const onMistWarp = !mwUser || mwUser.exists !== false;
    const year = joinYear(profile.created);
    const presence = profile.status || null;
    const presenceState = presence && typeof presence.presence === 'string' ?
        presence.presence.toLowerCase() : 'offline';
    const statusDotClass = presenceState === 'online' ? styles.onlineDot :
        presenceState === 'idle' ? styles.idleDot :
            presenceState === 'dnd' ? styles.dndDot : styles.offlineDot;
    const rawStatusText = presence && typeof presence.status === 'string' ? presence.status : '';
    const hasStatusText = rawStatusText.replace(/[\s\u2800\u3164\uFFA0]/g, '').length > 0;
    const statusText = hasStatusText ? rawStatusText :
        `${presenceState.charAt(0).toUpperCase()}${presenceState.slice(1)}`;
    const activities = presence && Array.isArray(presence.activities) ? presence.activities : [];
    const badges = Array.isArray(profile.badges) ? profile.badges.slice(0, 6) : [];

    return (
        <main className={styles.page}>
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
                            Not on MistWarp yet. This is {profile.username || name}&apos;s Rotur profile.
                        </div>
                    ) : null}

                    {featuredProject ? (
                        <section className={styles.section}>
                            <FeaturedProject project={featuredProject} />
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
                        <section className={styles.section}>
                            <div className={styles.sectionHead}>
                                <h2 className={styles.sectionTitle}>Comments</h2>
                                {isSelf ? (
                                    <button
                                        className={styles.commentsToggle}
                                        onClick={toggleComments}
                                        disabled={commentsBusy}
                                    >
                                        {commentsOff ? <MessageSquare size={14} /> : <MessageSquareOff size={14} />}
                                        {commentsOff ? 'Turn on comments' : 'Turn off comments'}
                                    </button>
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
                </div>
                <aside className={styles.profileRail}>
                    <section className={styles.profileCard}>
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
                                <h1>{profile.username || name}</h1>
                                {profile.pronouns ? <span className={styles.pronouns}>{profile.pronouns}</span> : null}
                            </div>
                            {presence ? (
                                <span className={styles.userStatus}>
                                    <span className={statusDotClass} />
                                    <RichText text={statusText} />
                                </span>
                            ) : null}
                            {badges.length ? (
                                <div className={styles.badges}>
                                    {badges.map((badge, index) => {
                                        const badgeData = typeof badge === 'string' ? {name: badge} : badge;
                                        if (!badgeData.icon) return null;
                                        return (
                                            <span
                                                key={`${badgeData.name}-${index}`}
                                                className={styles.badge}
                                                title={badgeData.description || badgeData.name}
                                                aria-label={badgeData.name}
                                                // eslint-disable-next-line react/no-danger
                                                dangerouslySetInnerHTML={{
                                                    __html: safeIconSvg(badgeData.icon, {size: 2, viewSize: 20})
                                                }}
                                            />
                                        );
                                    })}
                                </div>
                            ) : null}
                            <div className={styles.profileStats}>
                                <div><strong>{profile.followers || 0}</strong><span>followers</span></div>
                                <div><strong>{profile.following || 0}</strong><span>following</span></div>
                                <div><strong>{profile.currency || 0}</strong><span>credits</span></div>
                            </div>
                            <div className={styles.actions}>
                                {user && !isSelf ? (
                                    <React.Fragment>
                                        <div className={styles.primaryActions}>
                                            <button
                                                className={profile.followed ? styles.followingButton : styles.followButton}
                                                disabled={followBusy}
                                                onClick={toggleFollow}
                                            >
                                                {profile.followed ? <UserCheck size={16} /> : <UserPlus size={16} />}
                                                {profile.followed ? 'Following' : 'Follow'}
                                            </button>
                                            <button
                                                className={styles.followButton}
                                                title={`Send credits to ${profile.username || name}`}
                                                onClick={() => setDonating(true)}
                                            >
                                                <Coins size={15} />
                                                Donate
                                            </button>
                                        </div>
                                        <div className={styles.utilityActions}>
                                            {mwUser && mwUser.exists !== false ? (
                                                <button
                                                    className={styles.iconButton}
                                                    disabled={safetyBusy}
                                                    onClick={() => toggleSafety('mute')}
                                                >
                                                    <VolumeX size={15} />
                                                    {mwUser.viewerMuted ? 'Unmute' : 'Mute'}
                                                </button>
                                            ) : null}
                                            {mwUser && mwUser.exists !== false ? (
                                                <button
                                                    className={mwUser.viewerBlocked ? styles.blockedButton : styles.iconButton}
                                                    disabled={safetyBusy}
                                                    onClick={() => toggleSafety('block')}
                                                >
                                                    <Ban size={15} />
                                                    {mwUser.viewerBlocked ? 'Unblock' : 'Block'}
                                                </button>
                                            ) : null}
                                            <button
                                                className={styles.iconButton}
                                                onClick={() => setReporting(true)}
                                            >
                                                <Flag size={15} />
                                                Report
                                            </button>
                                        </div>
                                    </React.Fragment>
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

const DonateModal = ({recipient, onClose}) => {
    const [amount, setAmount] = useState('');
    const [busy, setBusy] = useState(false);
    const [status, setStatus] = useState(null);
    const [sent, setSent] = useState(0);
    const [insufficient, setInsufficient] = useState(false);
    useEscape(onClose);

    const send = async () => {
        const value = Math.round((Number(amount) || 0) * 100) / 100;
        if (!value || value <= 0) {
            setStatus('Enter an amount greater than 0.');
            return;
        }
        setBusy(true);
        setStatus(null);
        setInsufficient(false);
        try {
            await payUser(recipient, value, `MistWarp donation to ${recipient}`);
            setSent(value);
        } catch (e) {
            if (isInsufficientFunds(e)) {
                setInsufficient(true);
            } else {
                setStatus(e.needsReauth ?
                    'Your current login cannot send credits. Log out and back in, then try again.' :
                    (e.message || 'Could not send credits.'));
            }
        } finally {
            setBusy(false);
        }
    };

    const buyCredits = async () => {
        if (busy) return;
        setBusy(true);
        setStatus(null);
        try {
            await openCreditCheckout(CREDIT_PACKS[1]);
        } catch (e) {
            setStatus(e.needsReauth ?
                'Your current login cannot buy credits. Log out and back in, then try again.' :
                (e.message || 'Could not open checkout.'));
        } finally {
            setBusy(false);
        }
    };

    return (
        <div
            className={styles.donateOverlay}
            onClick={onClose}
        >
            <div
                className={styles.donateModal}
                onClick={event => event.stopPropagation()}
                role="dialog"
                aria-modal="true"
            >
                <div className={styles.donateHead}>
                    <span className={styles.donateHeadTitle}>
                        <Coins size={17} />
                        {`Donate to ${recipient}`}
                    </span>
                    <button
                        className={styles.donateClose}
                        onClick={onClose}
                        aria-label="Close"
                    >
                        <X size={18} />
                    </button>
                </div>
                {sent ? (
                    <div className={styles.donateDone}>
                        <span className={styles.donateDoneIcon}><Coins size={28} /></span>
                        <p>{`Sent ${sent} credits to ${recipient}.`}</p>
                        <button
                            className={styles.donateSend}
                            onClick={onClose}
                        >Done</button>
                    </div>
                ) : (
                    <div className={styles.donateBody}>
                        <p className={styles.donateText}>
                            {`Send Rotur credits straight to ${recipient}. This transfers directly from your account.`}
                        </p>
                        <input
                            className={styles.donateInput}
                            type="number"
                            min="1"
                            step="1"
                            placeholder="Amount in credits"
                            value={amount}
                            onChange={event => setAmount(event.target.value)}
                        />
                        {status ? <p className={styles.donateStatus}>{status}</p> : null}
                        {insufficient ? (
                            <p className={styles.donateStatus}>
                                Not enough credits in your balance. Top up through Stripe, then send again.
                            </p>
                        ) : null}
                        <button
                            className={styles.donateSend}
                            onClick={insufficient ? buyCredits : send}
                            disabled={busy}
                        >
                            <Coins size={16} />
                            {busy ? 'Opening…' : insufficient ? 'Buy credits' : 'Send credits'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Profile;
