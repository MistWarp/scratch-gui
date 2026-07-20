import React, {useEffect, useState, useCallback, useMemo} from 'react';
import {useParams, Link} from 'react-router-dom';
import {
    UserPlus, UserCheck, Calendar, MessageSquare, MessageSquareOff, ChevronRight, Pencil, Flag, Coins, X
} from 'lucide-react';
import api from '../api';
import rotur from '../rotur';
import {payUser} from '../../lib/rotur/client.js';
import {isInsufficientFunds} from '../credits';
import BuyCreditsModal from '../components/BuyCreditsModal.jsx';
import {useUser} from '../UserContext.jsx';
import ProjectCard from '../components/ProjectCard.jsx';
import CommentThread from '../components/CommentThread.jsx';
import ReportModal from '../components/ReportModal.jsx';
import Avatar from '../components/Avatar.jsx';
import RichText from '../components/RichText.jsx';
import useLatest from '../use-latest.js';
import setPageMeta from '../page-meta.js';
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
    const [reporting, setReporting] = useState(false);
    const [adminProjects, setAdminProjects] = useState([]);
    const [presence, setPresence] = useState(null);
    const [donating, setDonating] = useState(false);

    const beginLoad = useLatest();

    const load = useCallback(() => {
        const fresh = beginLoad();
        rotur.profile(name, {includePosts: false})
            .then(fresh(setProfile))
            .catch(fresh(() => setError('This user does not exist on Rotur.')));
        api.getUser(name)
            .then(fresh(setMwUser))
            .catch(fresh(() => setMwUser(null)));
        rotur.followers(name)
            .then(fresh(data => setFollowers(data.followers || [])))
            .catch(fresh(() => setFollowers([])));
    }, [name, beginLoad]);

    useEffect(() => {
        setProfile(null);
        setMwUser(null);
        setFollowers([]);
        setError(null);
        setReporting(false);
        load();
    }, [name, load]);

    useEffect(() => {
        setPresence(null);
        let active = true;
        rotur.status(name)
            .then(data => active && setPresence(data))
            .catch(() => active && setPresence(null));
        return () => {
            active = false;
        };
    }, [name]);

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
            if (profile.followed) {
                await rotur.unfollow(name);
            } else {
                await rotur.follow(name);
            }
            load();
        } catch (e) {
            setActionError(e.message || 'Could not update follow.');
        } finally {
            setFollowBusy(false);
        }
    };

    const isSelf = Boolean(user && user.username && user.username.toLowerCase() === name.toLowerCase());
    const commentsOff = Boolean(mwUser && mwUser.commentsOff);

    const toggleComments = async () => {
        setActionError(null);
        try {
            await api.updateProfile({commentsOff: !commentsOff});
            load();
        } catch (e) {
            setActionError(e.message || 'Could not update comments.');
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
    const isOnline = Boolean(presence && presence.presence && presence.presence !== 'offline');
    const statusDotClass = isOnline ? styles.onlineDot : styles.offlineDot;
    const statusText = presence ? (presence.status || presence.presence) : '';

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
            <section className={styles.profileCard}>
                <div
                    className={styles.banner}
                    style={{backgroundImage: `url(${rotur.banner(name)})`}}
                />
                <header className={styles.header}>
                    <Avatar
                        username={name}
                        size={96}
                        className={styles.avatar}
                    />
                    <div className={styles.identity}>
                        <h1>{profile.username || name}</h1>
                        {profile.pronouns ? <span className={styles.pronouns}>{profile.pronouns}</span> : null}
                        <p className={styles.bio}>{profile.bio ? <RichText text={profile.bio} /> : 'No bio yet.'}</p>
                        {presence ? (
                            <span className={styles.userStatus}>
                                <span className={statusDotClass} />
                                <RichText text={statusText || (isOnline ? 'Online' : 'Offline')} />
                            </span>
                        ) : null}
                        <div className={styles.meta}>
                            <span className={styles.stat}>
                                <strong>{profile.followers || 0}</strong> followers
                            </span>
                            <span className={styles.stat}>
                                <strong>{profile.following || 0}</strong> following
                            </span>
                            {year ? (
                                <span className={styles.metaItem}>
                                    <Calendar size={14} />
                                    Joined {year}
                                </span>
                            ) : null}
                            {typeof profile.index === 'number' ? (
                                <span className={styles.metaItem}>Account #{profile.index}</span>
                            ) : null}
                        </div>
                    </div>
                    {user && !isSelf ? (
                        <button
                            className={profile.followed ? styles.followingButton : styles.followButton}
                            disabled={followBusy}
                            onClick={toggleFollow}
                        >
                            {profile.followed ? <UserCheck size={16} /> : <UserPlus size={16} />}
                            {profile.followed ? 'Following' : 'Follow'}
                        </button>
                    ) : null}
                    {user && !isSelf ? (
                        <button
                            className={styles.followButton}
                            title={`Send credits to ${profile.username || name}`}
                            onClick={() => setDonating(true)}
                        >
                            <Coins size={15} />
                            Donate
                        </button>
                    ) : null}
                    {user && !isSelf ? (
                        <button
                            className={styles.followingButton}
                            title="Report this user"
                            onClick={() => setReporting(true)}
                        >
                            <Flag size={15} />
                            Report
                        </button>
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
                </header>
            </section>

            {actionError ? <p className={styles.status}>{actionError}</p> : null}

            {!onMistWarp ? (
                <div className={styles.notOnMistwarp}>
                    Not on MistWarp yet. This is {profile.username || name}&apos;s Rotur profile.
                </div>
            ) : null}

            {featuredProject ? (
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Featured project</h2>
                    <div className={styles.grid}>
                        <ProjectCard project={featuredProject} />
                    </div>
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
        </main>
    );
};

const DonateModal = ({recipient, onClose}) => {
    const [amount, setAmount] = useState('');
    const [busy, setBusy] = useState(false);
    const [status, setStatus] = useState(null);
    const [sent, setSent] = useState(0);
    const [needCredits, setNeedCredits] = useState(0);

    const send = async () => {
        const value = Math.round((Number(amount) || 0) * 100) / 100;
        if (!value || value <= 0) {
            setStatus('Enter an amount greater than 0.');
            return;
        }
        setBusy(true);
        setStatus(null);
        try {
            await payUser(recipient, value, `MistWarp donation to ${recipient}`);
            setSent(value);
        } catch (e) {
            if (isInsufficientFunds(e)) {
                setNeedCredits(value);
            } else {
                setStatus(e.needsReauth ?
                    'Your current login cannot send credits. Log out and back in, then try again.' :
                    (e.message || 'Could not send credits.'));
            }
        } finally {
            setBusy(false);
        }
    };

    if (needCredits) {
        return (
            <BuyCreditsModal
                needed={needCredits}
                onClose={onClose}
            />
        );
    }

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
                        <button
                            className={styles.donateSend}
                            onClick={send}
                            disabled={busy}
                        >
                            <Coins size={16} />
                            {busy ? 'Sending…' : 'Send credits'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Profile;
