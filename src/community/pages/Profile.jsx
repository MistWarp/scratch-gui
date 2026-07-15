import React, {useEffect, useState, useCallback, useMemo} from 'react';
import {useParams, Link} from 'react-router-dom';
import {UserPlus, UserCheck, Calendar, MessageSquare, MessageSquareOff, ChevronRight, Pencil} from 'lucide-react';
import api from '../api';
import rotur from '../rotur';
import {useUser} from '../UserContext.jsx';
import ProjectCard from '../components/ProjectCard.jsx';
import CommentThread from '../components/CommentThread.jsx';
import Avatar from '../components/Avatar.jsx';
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

    const load = useCallback(() => {
        rotur.profile(name, {includePosts: false})
            .then(setProfile)
            .catch(() => setError('This user does not exist on Rotur.'));
        api.getUser(name)
            .then(setMwUser)
            .catch(() => setMwUser(null));
        rotur.followers(name)
            .then(data => setFollowers(data.followers || []))
            .catch(() => setFollowers([]));
    }, [name]);

    useEffect(() => {
        setProfile(null);
        setMwUser(null);
        setFollowers([]);
        setError(null);
        load();
    }, [name, load]);

    const toggleFollow = async () => {
        if (!user || !profile) return;
        try {
            if (profile.followed) {
                await rotur.unfollow(name);
            } else {
                await rotur.follow(name);
            }
            load();
        } catch (e) {
            return;
        }
    };

    const isSelf = Boolean(user && user.username && user.username.toLowerCase() === name.toLowerCase());
    const commentsOff = Boolean(mwUser && mwUser.commentsOff);

    const toggleComments = async () => {
        try {
            await api.updateProfile({commentsOff: !commentsOff});
            load();
        } catch (e) {
            return;
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
    const onMistWarp = !mwUser || mwUser.exists !== false;
    const year = joinYear(profile.created);
    const statusDotClass = profile.status && profile.status.presence === 'online' ?
        styles.onlineDot : styles.offlineDot;

    return (
        <main className={styles.page}>
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
                        <p className={styles.bio}>{profile.bio || 'No bio yet.'}</p>
                        {profile.status ? (
                            <span className={styles.userStatus}>
                                <span className={statusDotClass} />
                                {profile.status.status || profile.status.presence}
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
                            onClick={toggleFollow}
                        >
                            {profile.followed ? <UserCheck size={16} /> : <UserPlus size={16} />}
                            {profile.followed ? 'Following' : 'Follow'}
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
                        />
                    </div>
                </section>
            ) : null}
        </main>
    );
};

export default Profile;
