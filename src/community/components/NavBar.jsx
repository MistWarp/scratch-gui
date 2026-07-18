import React, {useState, useEffect, useRef} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import {Search, Compass, Plus, FolderOpen, Bell, LogIn, ShieldCheck, Wallet} from 'lucide-react';
import {useUser} from '../UserContext.jsx';
import api, {editorUrl} from '../api';
import rotur from '../rotur';
import logo from '../assets/mistwarp-logo.png';
import Avatar from './Avatar.jsx';
import {RoturAccount} from '../../components/menu-bar/mw-rotur-account.jsx';
import styles from './NavBar.module.css';

const NavBar = () => {
    const {user, loading, login, logout} = useUser();
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [projectSuggestions, setProjectSuggestions] = useState([]);
    const [suggestionsOpen, setSuggestionsOpen] = useState(false);
    const [accountOpen, setAccountOpen] = useState(false);
    const [unread, setUnread] = useState(0);
    const [openReports, setOpenReports] = useState(0);
    const navigate = useNavigate();
    const searchRef = useRef(null);

    useEffect(() => {
        if (!user) {
            setUnread(0);
            setOpenReports(0);
            return;
        }
        let stale = false;
        const refresh = () => {
            api.notifications()
                .then(data => {
                    if (!stale) setUnread((data.notifications || []).filter(n => !n.read).length);
                })
                .catch(() => {});
            if (user.isAdmin) {
                api.admin.reports()
                    .then(data => {
                        if (!stale) setOpenReports((data.reports || []).filter(r => !r.resolved).length);
                    })
                    .catch(() => {});
            }
        };
        refresh();
        const timer = setInterval(refresh, 60000);
        const onRead = () => setUnread(0);
        window.addEventListener('mw:notifications-read', onRead);
        window.addEventListener('mw:reports-updated', refresh);
        return () => {
            stale = true;
            clearInterval(timer);
            window.removeEventListener('mw:notifications-read', onRead);
            window.removeEventListener('mw:reports-updated', refresh);
        };
    }, [user]);

    useEffect(() => {
        const q = query.trim();
        if (q.length < 2) {
            setSuggestions([]);
            setProjectSuggestions([]);
            return;
        }
        let stale = false;
        const timer = setTimeout(() => {
            Promise.all([
                api.searchUsers(q).catch(() => ({users: []})),
                api.explore({q, limit: 5}).catch(() => ({projects: []}))
            ]).then(([u, p]) => {
                if (stale) return;
                const users = u.users || [];
                setSuggestions(users);
                setProjectSuggestions(p.projects || []);
                Promise.all(users.map(person =>
                    rotur.followerCount(person.username).then(followers => ({...person, followers}))
                )).then(enriched => {
                    if (!stale) setSuggestions(enriched);
                });
            });
        }, 200);
        return () => {
            stale = true;
            clearTimeout(timer);
        };
    }, [query]);

    useEffect(() => {
        const close = event => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setSuggestionsOpen(false);
            }
        };
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, []);

    const submitSearch = event => {
        event.preventDefault();
        setSuggestionsOpen(false);
        navigate(`/explore?q=${encodeURIComponent(query)}`);
    };

    const goToProfile = name => {
        setSuggestionsOpen(false);
        setQuery('');
        navigate(`/users/${name}`);
    };

    const goToProject = id => {
        setSuggestionsOpen(false);
        setQuery('');
        navigate(`/project/${id}`);
    };

    return (
        <header className={styles.bar}>
            <div className={styles.inner}>
                <Link
                    to="/"
                    className={styles.brand}
                >
                    <img
                        className={styles.logo}
                        src={logo}
                        alt=""
                    />
                    <span className={styles.wordmark}>MistWarp</span>
                </Link>

                <nav className={styles.links}>
                    <a
                        href={editorUrl()}
                        className={styles.link}
                    >
                        <Plus size={17} />
                        <span className={styles.linkLabel}>Create</span>
                    </a>
                    <Link
                        to="/explore"
                        className={styles.link}
                    >
                        <Compass size={17} />
                        <span className={styles.linkLabel}>Explore</span>
                    </Link>
                </nav>

                <form
                    className={styles.search}
                    onSubmit={submitSearch}
                    ref={searchRef}
                >
                    <Search
                        size={17}
                        className={styles.searchIcon}
                    />
                    <input
                        className={styles.searchInput}
                        placeholder="Search projects and people"
                        value={query}
                        onChange={e => {
                            setQuery(e.target.value);
                            setSuggestionsOpen(true);
                        }}
                        onFocus={() => setSuggestionsOpen(true)}
                    />
                    {suggestionsOpen && (suggestions.length || projectSuggestions.length) ? (
                        <div className={styles.suggestions}>
                            {projectSuggestions.map(project => (
                                <button
                                    key={project.id}
                                    type="button"
                                    className={styles.suggestion}
                                    onClick={() => goToProject(project.id)}
                                >
                                    <img
                                        className={styles.suggestionThumb}
                                        src={project.thumbUrl}
                                        alt=""
                                    />
                                    <span>{project.title}</span>
                                    <span className={styles.suggestionMeta}>by {project.owner}</span>
                                </button>
                            ))}
                            {suggestions.map(person => (
                                <button
                                    key={person.username}
                                    type="button"
                                    className={styles.suggestion}
                                    onClick={() => goToProfile(person.username)}
                                >
                                    <Avatar
                                        username={person.username}
                                        size={26}
                                    />
                                    <span>{person.username}</span>
                                    <span className={styles.suggestionMeta}>
                                        {person.followers ?? 0} followers · {person.projects} projects
                                    </span>
                                </button>
                            ))}
                        </div>
                    ) : null}
                </form>

                <div className={styles.account}>
                    {user ? (
                        <>
                            {user.isAdmin ? (
                                <Link
                                    to="/admin"
                                    className={`${styles.iconLink} ${styles.bellLink}`}
                                    title="Admin"
                                    aria-label={openReports > 0 ? `Admin (${openReports} open reports)` : 'Admin'}
                                >
                                    <ShieldCheck size={19} />
                                    {openReports > 0 ? (
                                        <span className={styles.bellBadge}>{openReports > 9 ? '9+' : openReports}</span>
                                    ) : null}
                                </Link>
                            ) : null}
                            <Link
                                to="/mystuff"
                                className={styles.iconLink}
                                title="My stuff"
                                aria-label="My stuff"
                            >
                                <FolderOpen size={19} />
                            </Link>
                            <Link
                                to="/wallet"
                                className={styles.iconLink}
                                title="Wallet"
                                aria-label="Wallet"
                            >
                                <Wallet size={19} />
                            </Link>
                            <Link
                                to="/notifications"
                                className={`${styles.iconLink} ${styles.bellLink}`}
                                title="Notifications"
                                aria-label={unread > 0 ? `Notifications (${unread} unread)` : 'Notifications'}
                            >
                                <Bell size={19} />
                                {unread > 0 ? (
                                    <span className={styles.bellBadge}>{unread > 9 ? '9+' : unread}</span>
                                ) : null}
                            </Link>
                            <RoturAccount
                                username={user.username}
                                menuOpen={accountOpen}
                                showEditorItems={false}
                                onOpenMenu={() => setAccountOpen(true)}
                                onCloseMenu={() => setAccountOpen(false)}
                                onOpenLogin={login}
                                onLogout={logout}
                            />
                        </>
                    ) : loading ? null : (
                        <button
                            className={styles.signIn}
                            onClick={login}
                            title="Sign in"
                            aria-label="Sign in"
                        >
                            <LogIn size={19} />
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
};

export default NavBar;
