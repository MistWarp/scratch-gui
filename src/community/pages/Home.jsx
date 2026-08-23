/* eslint-disable max-len */
import React, {useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import {Bell, Clock, GitFork, Github, Globe, Heart, Lightbulb, Megaphone, MessageCircle, Sparkles, Star, Users} from 'lucide-react';
import api, {editorUrl, projectUrl} from '../api';
import rotur from '../rotur';
import {fetchNotifications} from '../../lib/rotur/client.js';
import {useUser} from '../UserContext.jsx';
import {timeAgo} from '../format';
import Avatar from '../components/Avatar.jsx';
import Button from '../components/ui/Button.jsx';
import NewsItem from '../components/NewsItem.jsx';
import ProjectCard from '../components/ProjectCard.jsx';
import ChallengeCalendar from '../components/ChallengeCalendar.jsx';
import ReactionButtons from '../components/ReactionButtons.jsx';
import logo from '../assets/mistwarp-logo.png';
import styles from './Home.module.css';

const ACTIVITY_ICONS = {love: Heart, favorite: Star, share: Globe, remix: GitFork, review: Star};
const ROADMAP_STATUS_LABELS = {open: 'Suggested', planned: 'Planned', building: 'In progress', shipped: 'Shipped', declined: 'Not planned'};

const describeActivity = item => {
    switch (item.type) {
    case 'love': return <>loved <strong>{item.projectTitle}</strong></>;
    case 'favorite': return <>favorited <strong>{item.projectTitle}</strong></>;
    case 'share': return <>shared <strong>{item.projectTitle}</strong></>;
    case 'remix': return <>remixed <strong>{item.parentTitle || item.projectTitle}</strong></>;
    case 'review': return <>rated <strong>{item.projectTitle}</strong> {item.rating} out of 5</>;
    default: return <>posted an update</>;
    }
};

const SectionHead = ({icon: Icon, title, link, linkLabel}) => (
    <div className={styles.sectionHead}>
        <h2><Icon size={19} />{title}</h2>
        {link ? <Link to={link}>{linkLabel || 'See all'}</Link> : null}
    </div>
);

const PanelLoading = () => <div className={styles.feedScroll}>{[0, 1].map(i => <div key={i} className={styles.skeleton} />)}</div>;

const NewsSection = () => {
    const [items, setItems] = useState(null);
    const [failed, setFailed] = useState(false);
    const load = () => {
        setFailed(false);
        api.news().then(data => setItems(data.news || [])).catch(() => setFailed(true));
    };
    useEffect(load, []);
    return (
        <section className={styles.feedBox}>
            <SectionHead icon={Megaphone} title="News" link="/news" linkLabel="All updates" />
            {!items && !failed ? <PanelLoading /> : null}
            {failed ? <div className={styles.empty}>Couldn&apos;t load news. <Button onClick={load}>Try again</Button></div> : null}
            {items && !items.length ? <div className={styles.empty}>No updates yet.</div> : null}
            {items && items.length ? <div className={`${styles.newsList} ${styles.feedScroll}`}>{items.map(item => <NewsItem key={item.id} item={item} onChanged={load} />)}</div> : null}
        </section>
    );
};

const FriendsSection = ({user, login}) => {
    const [items, setItems] = useState(null);
    const [failed, setFailed] = useState(false);
    useEffect(() => {
        let active = true;
        if (!user) {
            setItems([]);
            return () => {};
        }
        setItems(null);
        setFailed(false);
        rotur.following(user.username).then(data => {
            const following = data.following || [];
            return following.length ? api.activity(following) : {activity: []};
        }).then(data => active && setItems(data.activity || [])).catch(() => active && setFailed(true));
        return () => {
            active = false;
        };
    }, [user]);
    return (
        <section className={styles.feedBox}>
            <SectionHead icon={Users} title="From people you follow" />
            {!user ? <div className={styles.empty}>Sign in to see projects, reviews, and activity from people you follow. <button onClick={login}>Sign in with Rotur</button></div> : null}
            {user && !items && !failed ? <PanelLoading /> : null}
            {failed ? <div className={styles.empty}>Couldn&apos;t load activity.</div> : null}
            {items && !items.length && user ? <div className={styles.empty}>No recent activity from people you follow.</div> : null}
            {items && items.length ? (
                <div className={`${styles.activityList} ${styles.feedScroll}`}>
                    {items.slice(0, 4).map((item, index) => {
                        const Icon = ACTIVITY_ICONS[item.type] || Heart;
                        return (
                            <div key={`${item.actor}-${item.created}-${index}`} className={styles.activityItem}>
                                <Link to={`/users/${item.actor}`}><Avatar username={item.actor} size={34} /></Link>
                                <span className={styles.activityIcon}><Icon size={14} /></span>
                                <span className={styles.activityText}>
                                    <Link to={`/users/${item.actor}`} className={styles.activityActor}>{item.actor}</Link>{' '}
                                    {item.projectId ? <Link to={projectUrl(item.projectId)}>{describeActivity(item)}</Link> : describeActivity(item)}
                                </span>
                                <span className={styles.activityTime}>{timeAgo(item.created)}</span>
                            </div>
                        );
                    })}
                </div>
            ) : null}
        </section>
    );
};

const RoadmapSection = () => {
    const [ideas, setIdeas] = useState(null);
    useEffect(() => {
        let active = true;
        api.roadmap().then(data => active && setIdeas(data.ideas || [])).catch(() => active && setIdeas([]));
        return () => {
            active = false;
        };
    }, []);
    return (
        <section className={styles.feedBox}>
            <SectionHead icon={Lightbulb} title="Roadmap" link="/roadmap" linkLabel="Suggest and vote" />
            {!ideas ? <PanelLoading /> : null}
            {ideas && !ideas.length ? <div className={styles.empty}>No suggestions yet. <Link to="/roadmap">Add the first one</Link></div> : null}
            {ideas && ideas.length ? (
                <div className={`${styles.roadmapList} ${styles.feedScroll}`}>
                    {ideas.slice(0, 4).map(idea => (
                        <Link key={idea._id} to={`/roadmap#idea-${idea._id}`} className={styles.roadmapItem}>
                            <ReactionButtons
                                variant="vertical"
                                heartKey="like"
                                downKey="dislike"
                                activeReaction={idea.myVote || ''}
                                showCounts={false}
                                interactive={false}
                                className={styles.roadmapVotes}
                                between={<strong>{idea.score || 0}</strong>}
                            />
                            <div className={styles.roadmapBody}>
                                <div className={styles.roadmapLabels}>
                                    <span>{idea.category}</span>
                                    <span className={styles[`roadmapStatus${idea.status}`]}>{ROADMAP_STATUS_LABELS[idea.status] || idea.status}</span>
                                    {idea.interested ? <span className={styles.roadmapOfficial}><Sparkles size={10} /> MistWarp is interested</span> : null}
                                </div>
                                <h3>{idea.title}</h3>
                                <p>{idea.description}</p>
                                <div className={styles.roadmapMeta}>
                                    <span><Avatar username={idea.author} size={22} />{idea.author}</span>
                                    <span>{timeAgo(idea.created)}</span>
                                    <span className={styles.roadmapComments}><MessageCircle size={13} />{idea.commentCount || 0}</span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            ) : null}
        </section>
    );
};

const notificationText = item => {
    if (item.type === 'project_review') return `rated ${item.projectTitle || 'your project'} ${item.rating} out of 5`;
    if (item.type === 'love') return `loved ${item.projectTitle || 'your project'}`;
    if (item.type === 'comment') return `commented on ${item.projectTitle || 'your project'}`;
    if (item.type === 'roadmap_comment') return `commented on ${item.roadmapTitle || 'your suggestion'}`;
    if (item.type === 'follow') return 'followed you';
    if (item.type === 'remix') return `remixed ${item.projectTitle || 'your project'}`;
    return item.body || 'sent you a notification';
};

const notificationLink = item => {
    if (item.roadmapId) return `/roadmap#idea-${item.roadmapId}`;
    if (item.projectId) return projectUrl(item.projectId);
    if (item.actor) return `/users/${item.actor}`;
    return '/notifications';
};

const NotificationsSection = ({user, login}) => {
    const [items, setItems] = useState(null);
    useEffect(() => {
        let active = true;
        if (!user) {
            setItems([]);
            return () => {};
        }
        fetchNotifications().then(data => active && setItems(data || [])).catch(() => active && setItems([]));
        return () => {
            active = false;
        };
    }, [user]);
    return (
        <section className={styles.feedBox}>
            <SectionHead icon={Bell} title="Recent notifications" link={user ? '/notifications' : null} linkLabel="See all" />
            {!user ? <div className={styles.empty}>Sign in to see your notifications. <button onClick={login}>Sign in with Rotur</button></div> : null}
            {user && !items ? <PanelLoading /> : null}
            {items && !items.length && user ? <div className={styles.empty}>Nothing new yet.</div> : null}
            {items && items.length ? (
                <div className={`${styles.activityList} ${styles.feedScroll}`}>
                    {items.slice(0, 4).map((item, index) => {
                        const actor = item.actor || item.title || 'MistWarp';
                        const target = notificationLink(item);
                        return (
                            <div key={item.id || index} className={styles.activityItem}>
                                <Link to={item.actor ? `/users/${item.actor}` : target}>
                                    {item.actor ? <Avatar username={item.actor} size={34} /> : <span className={styles.notificationAvatar}><Bell size={15} /></span>}
                                </Link>
                                <span className={styles.activityIcon}><Bell size={14} /></span>
                                <span className={styles.activityText}>
                                    {item.actor ? <Link to={`/users/${item.actor}`} className={styles.activityActor}>{actor}</Link> : <strong className={styles.activityActor}>{actor}</strong>}{' '}
                                    <Link to={target}>{notificationText(item)}</Link>
                                </span>
                                <span className={styles.activityTime}>{timeAgo(item.created || item.timestamp)}</span>
                            </div>
                        );
                    })}
                </div>
            ) : null}
        </section>
    );
};

const Home = () => {
    const {user, login} = useUser();
    const [projects, setProjects] = useState({trending: null, recent: null});
    const [projectAttempt, setProjectAttempt] = useState(0);
    const retryProjects = () => {
        setProjects({trending: null, recent: null});
        setProjectAttempt(value => value + 1);
    };
    useEffect(() => {
        let active = true;
        Promise.all([
            api.explore({sort: 'trending', limit: 8}).catch(() => null),
            api.explore({sort: 'recent', limit: 8}).catch(() => null)
        ]).then(([trending, recent]) => {
            if (!active) return;
            setProjects({trending: trending ? trending.projects || [] : false, recent: recent ? recent.projects || [] : false});
        });
        return () => {
            active = false;
        };
    }, [projectAttempt]);
    return (
        <main className={styles.page}>
            <section className={styles.hero}>
                <div className={styles.heroText}>
                    <h1>Build, share, and remix projects together.</h1>
                    <p>A visual coding community on the MistWarp editor, with version control, forking, and pull requests behind every project.</p>
                    <div className={styles.heroActions}>
                        <a className={styles.primaryButton} href={editorUrl()}>Start creating</a>
                        {user ? <Link className={styles.secondaryButton} to="/explore">Explore projects</Link> : <button className={styles.secondaryButton} onClick={login}>Sign in with Rotur</button>}
                        <a className={styles.secondaryButton} href="https://github.com/mistwarp" target="_blank" rel="noreferrer"><Github size={16} />Follow on GitHub</a>
                    </div>
                </div>
                <div className={styles.heroArt}><img src={logo} alt="" className={styles.heroLogo} /></div>
            </section>
            <div className={styles.dashboardGrid}>
                <NewsSection />
                <FriendsSection user={user} login={login} />
                <NotificationsSection user={user} login={login} />
                <RoadmapSection />
            </div>
            <ProjectRow
                title="Trending"
                icon={Sparkles}
                projects={projects.trending}
                link="/explore?sort=trending"
                onRetry={retryProjects}
            />
            <ChallengeCalendar className={styles.homeCalendar} />
            <ProjectRow
                title="Freshly shared"
                icon={Clock}
                projects={projects.recent}
                link="/explore?sort=recent"
                onRetry={retryProjects}
            />
        </main>
    );
};

const ProjectRow = ({title, icon: Icon, projects, link, onRetry}) => (
    <section className={styles.projectSection}>
        <SectionHead icon={Icon} title={title} link={link} />
        {projects === null ? <div className={styles.projectGrid}>{[0, 1, 2, 3].map(i => <div key={i} className={styles.projectSkeleton} />)}</div> : null}
        {projects === false ? <div className={styles.empty}>Couldn&apos;t load projects. <Button onClick={onRetry}>Try again</Button></div> : null}
        {Array.isArray(projects) && !projects.length ? <div className={styles.empty}>No shared projects yet.</div> : null}
        {Array.isArray(projects) && projects.length ? <div className={styles.projectGrid}>{projects.map(project => <ProjectCard key={project.id} project={project} />)}</div> : null}
    </section>
);

export default Home;
