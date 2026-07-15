import React, {useState, useEffect, useRef} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import {Search, Compass, Plus, FolderOpen, Bell, Trophy} from 'lucide-react';
import {useUser} from '../UserContext.jsx';
import api, {editorUrl} from '../api';
import logo from '../assets/mistwarp-logo.png';
import Avatar from './Avatar.jsx';
import {RoturAccount} from '../../components/menu-bar/mw-rotur-account.jsx';
import styles from './NavBar.module.css';

const NavBar = () => {
    const {user, login, logout} = useUser();
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [suggestionsOpen, setSuggestionsOpen] = useState(false);
    const [accountOpen, setAccountOpen] = useState(false);
    const navigate = useNavigate();
    const searchRef = useRef(null);

    useEffect(() => {
        const q = query.trim();
        if (q.length < 2) {
            setSuggestions([]);
            return;
        }
        const timer = setTimeout(() => {
            api.searchUsers(q)
                .then(data => setSuggestions(data.users || []))
                .catch(() => setSuggestions([]));
        }, 200);
        return () => clearTimeout(timer);
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
                        Create
                    </a>
                    <Link
                        to="/explore"
                        className={styles.link}
                    >
                        <Compass size={17} />
                        Explore
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
                    {suggestionsOpen && suggestions.length ? (
                        <div className={styles.suggestions}>
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
                                        {person.followers} followers · {person.projects} projects
                                    </span>
                                </button>
                            ))}
                        </div>
                    ) : null}
                </form>

                <div className={styles.account}>
                    <Link
                        to="/leaderboard"
                        className={styles.iconLink}
                        title="Leaderboard"
                        aria-label="Leaderboard"
                    >
                        <Trophy size={19} />
                    </Link>
                    {user ? (
                        <>
                            <Link
                                to="/mystuff"
                                className={styles.iconLink}
                                title="My stuff"
                                aria-label="My stuff"
                            >
                                <FolderOpen size={19} />
                            </Link>
                            <Link
                                to="/notifications"
                                className={styles.iconLink}
                                title="Notifications"
                                aria-label="Notifications"
                            >
                                <Bell size={19} />
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
                    ) : (
                        <button
                            className={styles.signIn}
                            onClick={login}
                        >Sign in</button>
                    )}
                </div>
            </div>
        </header>
    );
};

export default NavBar;
