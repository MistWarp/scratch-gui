/* eslint-disable max-len */
import React, {useState, useEffect, useRef} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import {Search, Compass, Plus, FolderOpen, Bell, LogIn, ShieldCheck, Wallet, Layers3} from 'lucide-react';
import {useUser} from '../UserContext.jsx';
import api, {editorUrl} from '../api';
import {fetchNotifications} from '../../lib/rotur/client.js';
import logo from '../assets/mistwarp-logo.png';
import Avatar from './Avatar.jsx';
import setFaviconBadge from '../faviconBadge';
import ProjectThumbnail from './ProjectThumbnail.jsx';
import {RoturAccount} from '../../components/menu-bar/mw-rotur-account.jsx';
import {useCommunityIntl} from '../i18n.jsx';
import styles from './NavBar.module.css';

const SPACE_KIND_LABELS = {studio: 'Studio', challenge: 'Challenge', collection: 'Collection'};

const SearchBox = ({className, containerRef, inputRef, query, onQuery, onFocus, onSubmit, open, projects, people, spaces, onProject, onProfile, onSpace, searchLabel, suggestionId}) => (
    <form className={`${styles.search} ${className}`} onSubmit={onSubmit} ref={containerRef}>
        <Search size={17} className={styles.searchIcon} />
        <input
            ref={inputRef}
            className={styles.searchInput}
            placeholder={searchLabel}
            aria-label={searchLabel}
            role="combobox"
            aria-expanded={Boolean(open)}
            aria-controls={suggestionId}
            aria-autocomplete="list"
            value={query}
            onChange={event => onQuery(event.target.value)}
            onFocus={onFocus}
        />
        {open && (people.length || projects.length || spaces.length) ? (
            <div className={styles.suggestions} id={suggestionId} role="listbox">
                {projects.map(project => (
                    <button key={project.id} type="button" className={styles.suggestion} onClick={() => onProject(project.id)}>
                        <ProjectThumbnail project={project} className={styles.suggestionThumb} fallbackClassName={styles.suggestionThumbFallback} />
                        <span>{project.title}</span>
                        <span className={styles.suggestionMeta}>by {project.owner}</span>
                    </button>
                ))}
                {people.map(person => (
                    <button key={person.username} type="button" className={styles.suggestion} onClick={() => onProfile(person.username)}>
                        <Avatar username={person.username} size={26} />
                        <span>{person.username}</span>
                        <span className={styles.suggestionMeta}>{person.followers ?? 0} followers · {person.projects} projects</span>
                    </button>
                ))}
                {spaces.map(space => (
                    <button key={space._id} type="button" className={styles.suggestion} onClick={() => onSpace(space._id)}>
                        <span className={styles.suggestionSpaceIcon}><Layers3 size={15} /></span>
                        <span>{space.title}</span>
                        <span className={styles.suggestionMeta}>{SPACE_KIND_LABELS[space.kind] || 'Space'} · by {space.owner}</span>
                    </button>
                ))}
            </div>
        ) : null}
    </form>
);

const NavBar = () => {
    const {user, loading, login, logout} = useUser();
    const {t} = useCommunityIntl();
    const [loginError, setLoginError] = useState('');
    const [signingIn, setSigningIn] = useState(false);
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [projectSuggestions, setProjectSuggestions] = useState([]);
    const [spaceSuggestions, setSpaceSuggestions] = useState([]);
    const [suggestionsOpen, setSuggestionsOpen] = useState(false);
    const [accountOpen, setAccountOpen] = useState(false);
    const [unread, setUnread] = useState(0);
    const [openReports, setOpenReports] = useState(0);
    const navigate = useNavigate();
    const desktopSearchRef = useRef(null);
    const mobileSearchRef = useRef(null);
    const desktopSearchInputRef = useRef(null);
    const mobileSearchInputRef = useRef(null);

    useEffect(() => {
        const focusSearch = event => {
            const target = event.target;
            const typing = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
            if ((event.key === '/' && !typing) || (event.key.toLowerCase() === 'k' && (event.ctrlKey || event.metaKey))) {
                event.preventDefault();
                const mobile = window.matchMedia('(max-width: 680px)').matches;
                const input = mobile ? mobileSearchInputRef.current : desktopSearchInputRef.current;
                input?.focus();
                setSuggestionsOpen(true);
            }
        };
        window.addEventListener('keydown', focusSearch);
        return () => window.removeEventListener('keydown', focusSearch);
    }, []);

    useEffect(() => {
        if (!user) {
            setUnread(0);
            setOpenReports(0);
            return;
        }
        let stale = false;
        const refresh = () => {
            if (document.hidden) return;
            fetchNotifications()
                .then(items => {
                    if (!stale) setUnread(items.filter(n => !n.read).length);
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
        const timer = setInterval(refresh, 300000);
        const onPush = () => {
            setUnread(u => (u > 0 ? u + 1 : 1));
        };
        const onRead = () => setUnread(0);
        const onRemoved = event => {
            if (event.detail && event.detail.read) {
                return;
            }
            setUnread(u => (u > 0 ? u - 1 : 0));
        };
        window.addEventListener('mw:notifications-read', onRead);
        window.addEventListener('mw:notifications-push', onPush);
        window.addEventListener('mw:notifications-removed', onRemoved);
        window.addEventListener('mw:reports-updated', refresh);
        document.addEventListener('visibilitychange', refresh);
        return () => {
            stale = true;
            clearInterval(timer);
            window.removeEventListener('mw:notifications-read', onRead);
            window.removeEventListener('mw:notifications-push', onPush);
            window.removeEventListener('mw:notifications-removed', onRemoved);
            window.removeEventListener('mw:reports-updated', refresh);
            document.removeEventListener('visibilitychange', refresh);
        };
    }, [user]);

    useEffect(() => {
        setFaviconBadge(unread > 0);
    }, [unread]);

    useEffect(() => {
        const q = query.trim();
        if (q.length < 2) {
            setSuggestions([]);
            setProjectSuggestions([]);
            setSpaceSuggestions([]);
            return;
        }
        let stale = false;
        const timer = setTimeout(() => {
            Promise.all([
                api.searchUsers(q).catch(() => ({users: []})),
                api.explore({q, limit: 5}).catch(() => ({projects: []})),
                api.spaces({q}).catch(() => ({spaces: []}))
            ]).then(([u, p, s]) => {
                if (stale) return;
                setSuggestions(u.users || []);
                setProjectSuggestions(p.projects || []);
                setSpaceSuggestions((s.spaces || []).slice(0, 5));
            });
        }, 200);
        return () => {
            stale = true;
            clearTimeout(timer);
        };
    }, [query]);

    useEffect(() => {
        const close = event => {
            const outsideDesktop = desktopSearchRef.current && !desktopSearchRef.current.contains(event.target);
            const outsideMobile = mobileSearchRef.current && !mobileSearchRef.current.contains(event.target);
            if (outsideDesktop && outsideMobile) {
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

    const doLogin = async () => {
        if (signingIn) return;
        setLoginError('');
        setSigningIn(true);
        try {
            await login();
        } catch (e) {
            if (e && e.code === 'banned') {
                // handled by the global ban banner
            } else {
                setLoginError(
                    e && /popup|blocked|window/i.test(String(e.message || '')) ?
                        'Sign-in window was blocked. Allow popups for this site and try again.' :
                        (e && e.message) || 'Sign-in did not complete. Please try again.'
                );
            }
        } finally {
            setSigningIn(false);
        }
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

    const goToSpace = id => {
        setSuggestionsOpen(false);
        setQuery('');
        navigate(`/spaces/${id}`);
    };

    return (
        <header className={styles.bar}>
            <div className={styles.inner}>
                <Link
                    to="/"
                    className={styles.brand}
                    aria-label="MistWarp"
                >
                    <img
                        className={styles.logo}
                        src={logo}
                        alt=""
                    />
                    <span className={styles.wordmark}>MistWarp</span>
                </Link>

                <nav className={styles.links} aria-label={t('nav.main')}>
                    <a href={editorUrl()} className={styles.link} aria-label={t('nav.create')}>
                        <Plus size={17} />
                        <span className={styles.linkLabel}>{t('nav.create')}</span>
                    </a>
                    <Link
                        to="/explore"
                        className={styles.link}
                        aria-label={t('nav.explore')}
                    >
                        <Compass size={17} />
                        <span className={styles.linkLabel}>{t('nav.explore')}</span>
                    </Link>
                    <Link
                        to="/spaces"
                        className={styles.link}
                        aria-label={t('nav.spaces')}
                    >
                        <Layers3 size={17} />
                        <span className={styles.linkLabel}>{t('nav.spaces')}</span>
                    </Link>
                </nav>

                <SearchBox
                    className={styles.desktopSearch}
                    containerRef={desktopSearchRef}
                    inputRef={desktopSearchInputRef}
                    query={query}
                    onQuery={value => {
                        setQuery(value);
                        setSuggestionsOpen(true);
                    }}
                    onFocus={() => setSuggestionsOpen(true)}
                    onSubmit={submitSearch}
                    open={suggestionsOpen}
                    projects={projectSuggestions}
                    people={suggestions}
                    spaces={spaceSuggestions}
                    onProject={goToProject}
                    onProfile={goToProfile}
                    onSpace={goToSpace}
                    searchLabel={t('nav.search')}
                    suggestionId="mw-search-suggestions-desktop"
                />

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
                                onOpenLogin={doLogin}
                                onLogout={logout}
                            />
                        </>
                    ) : loading ? null : (
                        <button
                            className={styles.signIn}
                            onClick={doLogin}
                            disabled={signingIn}
                            title="Sign in"
                            aria-label="Sign in"
                        >
                            <LogIn size={19} />
                        </button>
                    )}
                </div>
            </div>
            <SearchBox
                className={styles.mobileSearch}
                containerRef={mobileSearchRef}
                inputRef={mobileSearchInputRef}
                query={query}
                onQuery={value => {
                    setQuery(value);
                    setSuggestionsOpen(true);
                }}
                onFocus={() => setSuggestionsOpen(true)}
                onSubmit={submitSearch}
                open={suggestionsOpen}
                projects={projectSuggestions}
                people={suggestions}
                spaces={spaceSuggestions}
                onProject={goToProject}
                onProfile={goToProfile}
                onSpace={goToSpace}
                searchLabel={t('nav.search')}
                suggestionId="mw-search-suggestions-mobile"
            />
            {loginError ? (
                <div
                    className={styles.loginError}
                    role="alert"
                >
                    <span>{loginError}</span>
                    <button
                        className={styles.loginErrorClose}
                        onClick={() => setLoginError('')}
                        aria-label="Dismiss"
                    >×</button>
                </div>
            ) : null}
        </header>
    );
};

export default NavBar;
