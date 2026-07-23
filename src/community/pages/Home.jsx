import React, {useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import {Sparkles, Clock, Users, Heart, Star, Globe, GitFork, Megaphone, Github} from 'lucide-react';
import api, {editorUrl, projectUrl} from '../api';
import rotur from '../rotur';
import {useUser} from '../UserContext.jsx';
import {timeAgo} from '../format';
import Avatar from '../components/Avatar.jsx';
import Button from '../components/ui/Button.jsx';
import ProjectCard from '../components/ProjectCard.jsx';
import NewsItem from '../components/NewsItem.jsx';
import logo from '../assets/mistwarp-logo.png';
import styles from './Home.module.css';

const ACTIVITY_ICONS = {
    love: Heart,
    favorite: Star,
    share: Globe,
    remix: GitFork
};

const describeActivity = item => {
    switch (item.type) {
    case 'love': return <span>loved <strong>{item.projectTitle}</strong></span>;
    case 'favorite': return <span>favorited <strong>{item.projectTitle}</strong></span>;
    case 'share': return <span>shared <strong>{item.projectTitle}</strong></span>;
    case 'remix': return <span>remixed <strong>{item.parentTitle || item.projectTitle}</strong></span>;
    default: return <span>did something</span>;
    }
};

const Row = ({title, icon, action, projects, loading, failed, onRetry}) => {
    let body;
    if (loading) {
        body = (
            <div className={styles.grid}>
                {[0, 1, 2, 3].map(i => (
                    <div
                        key={i}
                        className={styles.skeleton}
                    />
                ))}
            </div>
        );
    } else if (failed) {
        body = (
            <div className={styles.empty}>
                Couldn&apos;t load projects.{' '}
                <Button onClick={onRetry}>Try again</Button>
            </div>
        );
    } else if (projects.length) {
        body = (
            <div className={styles.grid}>
                {projects.map(project => (
                    <ProjectCard
                        key={project.id}
                        project={project}
                    />
                ))}
            </div>
        );
    } else {
        body = <div className={styles.empty}>Nothing here yet. Be the first to share a project.</div>;
    }
    return (
        <section className={styles.row}>
            <div className={styles.rowHead}>
                <h2>{icon}{title}</h2>
                {action}
            </div>
            {body}
        </section>
    );
};

const ActivitySection = ({user, login}) => {
    const [items, setItems] = useState([]);
    const [loaded, setLoaded] = useState(false);
    const [failed, setFailed] = useState(false);
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        let cancelled = false;
        if (!user) {
            setItems([]);
            setLoaded(true);
            return () => {};
        }
        setLoaded(false);
        setFailed(false);
        rotur.following(user.username)
            .then(data => {
                if (cancelled) return;
                const following = data.following || [];
                if (!following.length) {
                    return {activity: []};
                }
                return api.activity(following);
            })
            .then(data => {
                if (cancelled) return;
                setItems(data.activity || []);
            })
            .catch(() => {
                if (cancelled) return;
                setFailed(true);
            })
            .finally(() => {
                if (!cancelled) setLoaded(true);
            });
        return () => {
            cancelled = true;
        };
    }, [user, attempt]);

    let body;
    if (!user) {
        body = (
            <div className={styles.feedMessage}>
                <span>Log in to see your friends&apos; activity.</span>
                <button
                    className={styles.feedSignIn}
                    onClick={login}
                >Sign in with Rotur</button>
            </div>
        );
    } else if (!loaded) {
        body = <div className={styles.feedMessage}>Loading…</div>;
    } else if (failed) {
        body = (
            <div className={styles.feedMessage}>
                Couldn&apos;t load.{' '}
                <Button onClick={() => setAttempt(a => a + 1)}>Try again</Button>
            </div>
        );
    } else if (!items.length) {
        body = <div className={styles.feedMessage}>No recent activity from people you follow yet.</div>;
    } else {
        body = (
            <div className={`${styles.activityList} ${styles.feedScroll}`}>
                {items.map((item, index) => {
                    const Icon = ACTIVITY_ICONS[item.type] || Heart;
                    return (
                        <div
                            key={`${item.actor}-${item.created}-${index}`}
                            className={styles.activityItem}
                        >
                            <Link to={`/users/${item.actor}`}>
                                <Avatar
                                    username={item.actor}
                                    size={34}
                                />
                            </Link>
                            <span className={styles.activityIcon}><Icon size={14} /></span>
                            <span className={styles.activityText}>
                                <Link
                                    to={`/users/${item.actor}`}
                                    className={styles.activityActor}
                                >{item.actor}</Link>
                                {' '}
                                {item.projectId ? (
                                    <Link to={projectUrl(item.projectId)}>{describeActivity(item)}</Link>
                                ) : describeActivity(item)}
                            </span>
                            <span className={styles.activityTime}>{timeAgo(item.created)}</span>
                        </div>
                    );
                })}
            </div>
        );
    }

    return (
        <section className={styles.feedBox}>
            <div className={styles.rowHead}>
                <h2>
                    <Users
                        size={19}
                        className={styles.rowIcon}
                    />
                    From people you follow
                </h2>
            </div>
            {body}
        </section>
    );
};

const NewsSection = () => {
    const [items, setItems] = useState(null);
    const [failed, setFailed] = useState(false);

    const load = () => {
        setFailed(false);
        api.news()
            .then(data => setItems(data.news || []))
            .catch(() => setFailed(true));
    };

    useEffect(() => {
        let cancelled = false;
        setFailed(false);
        api.news()
            .then(data => {
                if (!cancelled) setItems(data.news || []);
            })
            .catch(() => {
                if (!cancelled) setFailed(true);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    if (failed) {
        return (
            <section className={styles.feedBox}>
                <div className={styles.rowHead}>
                    <h2>
                        <Megaphone
                            size={19}
                            className={styles.rowIcon}
                        />
                        News
                    </h2>
                </div>
                <div className={styles.feedMessage}>Couldn&apos;t load news.</div>
            </section>
        );
    }
    if (!items) {
        return (
            <section className={styles.feedBox}>
                <div className={styles.rowHead}>
                    <h2>
                        <Megaphone
                            size={19}
                            className={styles.rowIcon}
                        />
                        News
                    </h2>
                </div>
                <div className={styles.feedMessage}>Loading…</div>
            </section>
        );
    }
    if (!items.length) {
        return null;
    }

    return (
        <section className={styles.feedBox}>
            <div className={styles.rowHead}>
                <h2>
                    <Megaphone
                        size={19}
                        className={styles.rowIcon}
                    />
                    News
                </h2>
                <Link
                    to="/news"
                    className={styles.seeAll}
                >All updates</Link>
            </div>
            <div className={`${styles.newsList} ${styles.feedScroll}`}>
                {items.map(item => (
                    <NewsItem
                        key={item.id}
                        item={item}
                        onChanged={load}
                    />
                ))}
            </div>
        </section>
    );
};

const Home = () => {
    const {user, login} = useUser();
    const [recent, setRecent] = useState([]);
    const [trending, setTrending] = useState([]);
    const [loading, setLoading] = useState(true);
    const [failed, setFailed] = useState({trending: false, recent: false});
    const [attempt, setAttempt] = useState(0);
    const retry = () => setAttempt(a => a + 1);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setFailed({trending: false, recent: false});
        Promise.all([
            api.explore({sort: 'trending', limit: 8}).catch(() => null),
            api.explore({sort: 'recent', limit: 8}).catch(() => null)
        ]).then(([t, r]) => {
            if (cancelled) return;
            if (t) setTrending(t.projects || []);
            if (r) setRecent(r.projects || []);
            setFailed({trending: !t, recent: !r});
        }).finally(() => {
            if (!cancelled) setLoading(false);
        });
        return () => {
            cancelled = true;
        };
    }, [attempt]);

    return (
        <main className={styles.page}>
            <section className={styles.hero}>
                <div className={styles.heroText}>
                    <h1>Build, share, and remix projects together.</h1>
                    <p>
                        A visual coding community on the MistWarp editor, with version control,
                        forking, and pull requests behind every project.
                    </p>
                    <div className={styles.heroActions}>
                        <a
                            className={styles.primaryButton}
                            href={editorUrl()}
                        >Start creating</a>
                        {user ? (
                            <Link
                                className={styles.secondaryButton}
                                to="/explore"
                            >Explore projects</Link>
                        ) : (
                            <button
                                className={styles.secondaryButton}
                                onClick={login}
                            >Sign in with Rotur</button>
                        )}
                        <a
                            className={styles.secondaryButton}
                            href="https://github.com/mistwarp"
                            target="_blank"
                            rel="noreferrer"
                        >
                            <Github size={16} />
                            Follow on GitHub
                        </a>
                    </div>
                </div>
                <div className={styles.heroArt}>
                    <img
                        src={logo}
                        alt=""
                        className={styles.heroLogo}
                    />
                </div>
            </section>

            <div className={styles.homeFeeds}>
                <NewsSection />
                <ActivitySection
                    user={user}
                    login={login}
                />
            </div>

            <Row
                title="Trending"
                icon={<Sparkles
                    size={19}
                    className={styles.rowIcon}
                />}
                projects={trending}
                loading={loading}
                failed={failed.trending}
                onRetry={retry}
                action={<Link
                    to="/explore?sort=trending"
                    className={styles.seeAll}
                >See all</Link>}
            />
            <Row
                title="Freshly shared"
                icon={<Clock
                    size={19}
                    className={styles.rowIcon}
                />}
                projects={recent}
                loading={loading}
                failed={failed.recent}
                onRetry={retry}
                action={<Link
                    to="/explore?sort=recent"
                    className={styles.seeAll}
                >See all</Link>}
            />
        </main>
    );
};

export default Home;
