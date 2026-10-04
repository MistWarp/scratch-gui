/* eslint-disable max-len */
import React, {useState, useEffect, useLayoutEffect, useRef} from 'react';
import {Link, useLocation, useNavigate} from 'react-router-dom';
import {
    Search, Compass, Plus, FolderOpen, Bell, LogIn,
    Layers3, House, Crown, Shuffle
} from 'lucide-react';
import {useUser} from '../UserContext.jsx';
import api, {editorUrl, projectUrl} from '../api';
import rotur from '../rotur.js';
import {fetchNotifications} from '../../lib/rotur/client.js';
import logo from '../assets/mistwarp-logo.png';
import Avatar from './Avatar.jsx';
import GroupTag from './GroupTag.jsx';
import setFaviconBadge from '../faviconBadge';
import searchPath from '../search-path.js';
import {searchKeyAction} from '../search-keyboard.js';
import {rankSections} from '../search-rank.js';
import ProjectThumbnail from './ProjectThumbnail.jsx';
import Button from './ui/Button.jsx';
import {RoturAccount} from '../../components/menu-bar/mw-rotur-account.jsx';
import {useCommunityIntl} from '../i18n.jsx';
import styles from './NavBar.module.css';

const spaceKindLabel = (kind, communityText) => ({
    studio: communityText('Studio'),
    challenge: communityText('Challenge'),
    collection: communityText('Collection')
}[kind] || communityText('Space'));

// A combobox: focus stays in the input and the arrow keys move the highlighted option
// (aria-activedescendant), so every quick result is reachable from the keyboard.
const SearchBox = ({className, containerRef, inputRef, query, onQuery, onFocus, onOpen, onClose, onSubmit, open, projects, people, spaces, searching, searchReady, searchFailed, onProject, onProfile, onSpace, onSeeAll, placeholderLabel, searchLabel, suggestionId}) => {
    const {text: communityText} = useCommunityIntl();
    const [activeIndex, setActiveIndex] = useState(-1);
    const sections = rankSections([
        {
            key: 'projects',
            label: 'Projects',
            match: projects.map(project => project.title),
            items: projects.map(project => ({
                key: `project-${project.id}`,
                onSelect: () => onProject(project),
                content: (
                    <>
                        <ProjectThumbnail project={project} className={styles.suggestionThumb} fallbackClassName={styles.suggestionThumbFallback} />
                        <span>{project.title}</span>
                        <span className={styles.suggestionMeta}>{communityText('by ')}{project.owner}</span>
                    </>
                )
            }))
        },
        {
            key: 'people',
            label: 'People',
            match: people.map(person => person.username),
            items: people.map(person => ({
                key: `person-${person.username}`,
                onSelect: () => onProfile(person.username),
                content: (
                    <>
                        <Avatar username={person.username} size={26} />
                        <span>{person.username}</span>
                        {person.group_tag ? <GroupTag tag={person.group_tag} compact linked={false} /> : null}
                        <span className={styles.suggestionMeta}>{person.followers ?? 0}{communityText(' followers · ')}{person.projects}{communityText(' projects')}</span>
                    </>
                )
            }))
        },
        {
            key: 'spaces',
            label: 'Spaces',
            match: spaces.map(space => space.title),
            items: spaces.map(space => ({
                key: `space-${space._id}`,
                onSelect: () => onSpace(space._id),
                content: (
                    <>
                        <span className={styles.suggestionSpaceIcon}><Layers3 size={15} /></span>
                        <span>{space.title}</span>
                        <span className={styles.suggestionMeta}>{spaceKindLabel(space.kind, communityText)}{communityText(' · by ')}{space.owner}</span>
                    </>
                )
            }))
        }
    ].filter(section => section.items.length), query);
    const options = sections.reduce((all, section) => all.concat(section.items), []);
    if (sections.length) {
        options.push({
            key: 'all',
            className: styles.suggestionAll,
            onSelect: onSeeAll,
            content: communityText('See all results for "{value1}"', {value1: query.trim()})
        });
    }
    const listOpen = Boolean(open && query.trim().length >= 2 && (people.length || projects.length || spaces.length || searching || searchReady));
    const hasOptions = listOpen && options.length > 0;
    const optionId = option => `${suggestionId}-${option.key}`;
    const activeId = hasOptions && options[activeIndex] ? optionId(options[activeIndex]) : null;

    useEffect(() => {
        setActiveIndex(-1);
    }, [query, open, projects, people, spaces]);

    useEffect(() => {
        const option = activeId && document.getElementById(activeId);
        if (option && option.scrollIntoView) option.scrollIntoView({block: 'nearest'});
    }, [activeId]);

    const handleKeyDown = event => {
        const action = searchKeyAction(event.key, activeIndex, options.length, hasOptions);
        if (!action) return;
        event.preventDefault();
        if (action.type === 'close') {
            setActiveIndex(-1);
            onClose();
        } else if (action.type === 'open') {
            onOpen();
        } else if (action.type === 'select') {
            options[action.index].onSelect();
        } else {
            setActiveIndex(action.index);
        }
    };

    const renderOption = option => {
        const index = options.indexOf(option);
        return (
            <div
                key={option.key}
                id={optionId(option)}
                role="option"
                aria-selected={index === activeIndex}
                className={`${styles.suggestion} ${option.className || ''} ${index === activeIndex ? styles.suggestionActive : ''}`}
                // Keep focus in the input so the combobox stays in charge of the keyboard.
                onMouseDown={event => event.preventDefault()}
                onMouseMove={() => {
                    if (index !== activeIndex) setActiveIndex(index);
                }}
                onClick={() => option.onSelect()}
            >
                {option.content}
            </div>
        );
    };

    return (<form
        className={`${styles.search} ${className}`}
        role="search"
        onSubmit={onSubmit}
        ref={containerRef}
    >
        <Search size={17} className={styles.searchIcon} />
        <input
            ref={inputRef}
            className={styles.searchInput}
            placeholder={placeholderLabel || searchLabel}
            aria-label={searchLabel}
            role="combobox"
            aria-expanded={hasOptions}
            aria-controls={hasOptions ? suggestionId : null}
            aria-activedescendant={activeId}
            aria-autocomplete="list"
            autoComplete="off"
            value={query}
            onChange={event => onQuery(event.target.value)}
            onFocus={onFocus}
            onKeyDown={handleKeyDown}
        />
        {listOpen ? (
            <div className={styles.suggestions}>
                {searching ? <p className={styles.suggestionStatus}>{communityText('Searching…')}</p> : null}
                {!searching && searchFailed ? <p className={styles.suggestionStatus}>{communityText('Could not load quick results. Press Enter to search.')}</p> : null}
                {!searching && !searchFailed && searchReady && !sections.length ? <p className={styles.suggestionStatus}>{communityText('No quick matches. Press Enter to search everything.')}</p> : null}
                {hasOptions ? (
                    <div id={suggestionId} role="listbox" aria-label={searchLabel}>
                        {sections.map(section => (
                            <div
                                key={section.key}
                                className={styles.suggestionGroup}
                                role="group"
                                aria-labelledby={`${suggestionId}-group-${section.key}`}
                            >
                                <p className={styles.suggestionGroupLabel} id={`${suggestionId}-group-${section.key}`} role="presentation">{communityText(section.label)}</p>
                                {section.items.map(renderOption)}
                            </div>
                        ))}
                        {renderOption(options[options.length - 1])}
                    </div>
                ) : null}
            </div>
        ) : null}
    </form>);
};

const NAV_GAP = 18;
const MIN_CENTRED_SEARCH = 280;

const NavBar = () => {
    const {text: communityText} = useCommunityIntl();
    const {user, loading, loginOrThrow, logout} = useUser();
    const {t} = useCommunityIntl();
    const [signingIn, setSigningIn] = useState(false);
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [projectSuggestions, setProjectSuggestions] = useState([]);
    const [spaceSuggestions, setSpaceSuggestions] = useState([]);
    const [suggestionsOpen, setSuggestionsOpen] = useState(false);
    const [suggestionsSearching, setSuggestionsSearching] = useState(false);
    const [suggestionsReady, setSuggestionsReady] = useState(false);
    const [suggestionsFailed, setSuggestionsFailed] = useState(false);
    const [accountOpen, setAccountOpen] = useState(false);
    const [unread, setUnread] = useState(0);
    const [openReports, setOpenReports] = useState(0);
    const [openErrors, setOpenErrors] = useState(0);
    const navigate = useNavigate();
    const location = useLocation();
    const exploreActive = ['/explore', '/spaces', '/themes', '/groups', '/bounties'].some(path => location.pathname.startsWith(path));
    const innerRef = useRef(null);
    const linksRef = useRef(null);
    const accountRef = useRef(null);
    const desktopSearchRef = useRef(null);
    const mobileSearchRef = useRef(null);
    const desktopSearchInputRef = useRef(null);
    const mobileSearchInputRef = useRef(null);
    const loginInFlight = useRef(false);
    // The query the results page was opened with: shown in the box, but not looked up again.
    const seededQuery = useRef('');
    const releaseLogin = () => {
        loginInFlight.current = false;
    };

    // Centre the desktop search in the bar. It needs equal room on both sides, so reserve the wider of the
    // left group (logo and links) and the account area, and fall back to sitting between them when too tight.
    useLayoutEffect(() => {
        const inner = innerRef.current;
        const links = linksRef.current;
        const account = accountRef.current;
        if (!inner || !links || !account || typeof ResizeObserver === 'undefined') return;
        const measure = () => {
            const box = inner.getBoundingClientRect();
            const side = Math.max(
                links.getBoundingClientRect().right - box.left,
                box.right - account.getBoundingClientRect().left
            ) + NAV_GAP;
            inner.style.setProperty('--nav-side', `${Math.ceil(side)}px`);
            inner.dataset.centredSearch = box.width - (2 * side) >= MIN_CENTRED_SEARCH ? 'true' : 'false';
        };
        measure();
        const observer = new ResizeObserver(measure);
        [inner, links, account].forEach(element => observer.observe(element));
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const seeded = location.pathname === '/search' ?
            (new URLSearchParams(location.search).get('q') || '').trim() : '';
        seededQuery.current = seeded;
        setQuery(seeded);
        setSuggestions([]);
        setProjectSuggestions([]);
        setSpaceSuggestions([]);
        setSuggestionsOpen(false);
        setSuggestionsSearching(false);
        setSuggestionsReady(false);
        setSuggestionsFailed(false);
    }, [location.pathname, location.search]);

    useEffect(() => {
        const focusSearch = event => {
            const target = event.target;
            const typing = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
            if ((event.key === '/' && !typing) || (event.key.toLowerCase() === 'k' && (event.ctrlKey || event.metaKey))) {
                event.preventDefault();
                // Focus whichever search box the stylesheet is showing at this width.
                const input = [desktopSearchInputRef.current, mobileSearchInputRef.current]
                    .find(element => element && element.offsetParent !== null) || desktopSearchInputRef.current;
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
            setOpenErrors(0);
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
                api.admin.siteErrors('open')
                    .then(data => {
                        if (!stale) setOpenErrors(Number(data.openCount || 0));
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
        window.addEventListener('mw:errors-updated', refresh);
        document.addEventListener('visibilitychange', refresh);
        return () => {
            stale = true;
            clearInterval(timer);
            window.removeEventListener('mw:notifications-read', onRead);
            window.removeEventListener('mw:notifications-push', onPush);
            window.removeEventListener('mw:notifications-removed', onRemoved);
            window.removeEventListener('mw:reports-updated', refresh);
            window.removeEventListener('mw:errors-updated', refresh);
            document.removeEventListener('visibilitychange', refresh);
        };
    }, [user]);

    useEffect(() => {
        setFaviconBadge(unread > 0);
    }, [unread]);

    useEffect(() => {
        const q = query.trim();
        if (q.length < 2 || q === seededQuery.current) {
            setSuggestions([]);
            setProjectSuggestions([]);
            setSpaceSuggestions([]);
            setSuggestionsSearching(false);
            setSuggestionsReady(false);
            setSuggestionsFailed(false);
            return;
        }
        let stale = false;
        setSuggestions([]);
        setProjectSuggestions([]);
        setSpaceSuggestions([]);
        setSuggestionsSearching(true);
        setSuggestionsReady(false);
        setSuggestionsFailed(false);
        const timer = setTimeout(() => {
            Promise.allSettled([
                api.searchUsers(q, {limit: 5}),
                api.explore({q, sort: 'relevance', limit: 5}),
                api.spaces({q, limit: 4})
            ]).then(async results => {
                if (stale) return;
                const [userResult, projectResult, spaceResult] = results;
                const u = userResult.status === 'fulfilled' ? userResult.value : {users: []};
                const p = projectResult.status === 'fulfilled' ? projectResult.value : {projects: []};
                const s = spaceResult.status === 'fulfilled' ? spaceResult.value : {spaces: []};
                const representedUsers = await rotur.withGroupTags(u.users || []);
                if (stale) return;
                setSuggestions(representedUsers);
                setProjectSuggestions(p.projects || []);
                setSpaceSuggestions((s.spaces || []).slice(0, 4));
                setSuggestionsFailed(results.every(result => result.status === 'rejected'));
                setSuggestionsSearching(false);
                setSuggestionsReady(true);
            }).catch(() => {
                if (stale) return;
                setSuggestions([]);
                setProjectSuggestions([]);
                setSpaceSuggestions([]);
                setSuggestionsFailed(true);
                setSuggestionsSearching(false);
                setSuggestionsReady(true);
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

    const runSearch = () => {
        setSuggestionsOpen(false);
        navigate(searchPath(query));
    };

    const submitSearch = event => {
        event.preventDefault();
        runSearch();
    };

    const doLogin = async () => {
        if (loginInFlight.current) return;
        loginInFlight.current = true;
        setSigningIn(true);
        try {
            await loginOrThrow();
        } catch (e) {
            // The standing banner reports sign-in and ban errors.
        } finally {
            releaseLogin();
            setSigningIn(false);
        }
    };

    const goToProfile = name => {
        setSuggestionsOpen(false);
        setQuery('');
        navigate(`/users/${name}`);
    };

    const goToProject = project => {
        setSuggestionsOpen(false);
        setQuery('');
        navigate(projectUrl(project));
    };

    const goToSpace = id => {
        setSuggestionsOpen(false);
        setQuery('');
        navigate(`/spaces/${id}`);
    };

    const updateQuery = value => {
        seededQuery.current = '';
        setQuery(value);
        setSuggestionsOpen(true);
    };

    const linkClass = active => `${styles.link} ${active ? styles.linkActive : ''}`;
    const randomActive = location.pathname === '/random';

    const mobileItemClass = path => `${styles.mobileDockItem} ${
        location.pathname === path || (path !== '/' && location.pathname.startsWith(`${path}/`)) ? styles.mobileDockItemActive : ''
    }`;

    return (
        <header className={styles.bar}>
            <div className={styles.inner} ref={innerRef}>
                <Link
                    to="/"
                    className={styles.brand}
                    aria-label={communityText('MistWarp')}
                >
                    <img
                        className={styles.logo}
                        src={logo}
                        alt=""
                    />
                    <span className={styles.brandText}>
                        <span className={styles.wordmark}>{communityText('MistWarp')}</span>
                        <span className={styles.beta}>{communityText('Beta')}</span>
                    </span>
                </Link>

                <nav className={styles.links} ref={linksRef} aria-label={t('nav.main')}>
                    <a href={editorUrl()} className={styles.link} aria-label={t('nav.create')} title={t('nav.create')}>
                        <Plus size={17} />
                        <span className={styles.linkLabel}>{t('nav.create')}</span>
                    </a>
                    <Link
                        to="/explore"
                        className={linkClass(exploreActive)}
                        aria-current={exploreActive ? 'page' : null}
                        aria-label={t('nav.explore')}
                        title={t('nav.explore')}
                    >
                        <Compass size={17} />
                        <span className={styles.linkLabel}>{t('nav.explore')}</span>
                    </Link>
                    <Link
                        to="/random"
                        className={linkClass(randomActive)}
                        aria-current={randomActive ? 'page' : null}
                        aria-label={t('nav.random')}
                        title={t('nav.random')}
                    >
                        <Shuffle size={17} />
                        <span className={styles.linkLabel}>{t('nav.random')}</span>
                    </Link>
                </nav>

                <SearchBox
                    className={styles.desktopSearch}
                    containerRef={desktopSearchRef}
                    inputRef={desktopSearchInputRef}
                    query={query}
                    onQuery={updateQuery}
                    onFocus={() => setSuggestionsOpen(true)}
                    onOpen={() => setSuggestionsOpen(true)}
                    onClose={() => setSuggestionsOpen(false)}
                    onSubmit={submitSearch}
                    open={suggestionsOpen}
                    projects={projectSuggestions}
                    people={suggestions}
                    spaces={spaceSuggestions}
                    searching={suggestionsSearching}
                    searchReady={suggestionsReady}
                    searchFailed={suggestionsFailed}
                    onProject={goToProject}
                    onProfile={goToProfile}
                    onSpace={goToSpace}
                    onSeeAll={runSearch}
                    searchLabel={t('nav.search')}
                    suggestionId="mw-search-suggestions-desktop"
                />

                <div className={styles.account} ref={accountRef}>
                    <Link
                        to="/perks"
                        className={styles.iconLink}
                        title={communityText('Memberships')}
                        aria-label={communityText('Memberships')}
                    >
                        <Crown size={19} />
                    </Link>
                    {user ? (
                        <>
                            <Link
                                to="/notifications"
                                className={`${styles.iconLink} ${styles.bellLink}`}
                                title={communityText('Notifications')}
                                aria-label={unread > 0 ? communityText('Notifications ({value1} unread)', {value1: unread}) : communityText('Notifications')}
                            >
                                <Bell size={19} />
                                {unread > 0 ? (
                                    <span className={styles.bellBadge}>{unread > 9 ? '9+' : unread}</span>
                                ) : null}
                            </Link>
                            <Link
                                to="/mystuff"
                                className={styles.iconLink}
                                title={communityText('My stuff')}
                                aria-label={communityText('My stuff')}
                            >
                                <FolderOpen size={19} />
                            </Link>
                            <RoturAccount
                                username={user.username}
                                isAdmin={user.isAdmin}
                                openReports={openReports}
                                openErrors={openErrors}
                                menuOpen={accountOpen}
                                showEditorItems={false}
                                onOpenMenu={() => setAccountOpen(true)}
                                onCloseMenu={() => setAccountOpen(false)}
                                onOpenLogin={doLogin}
                                onLogout={logout}
                            />
                        </>
                    ) : loading ? null : (
                        <Button
                            variant="primary"
                            className={styles.signIn}
                            onClick={doLogin}
                            busy={signingIn}
                            busyLabel={communityText('Signing in…')}
                            title={signingIn ? communityText('Signing in') : communityText('Sign in')}
                        >
                            <LogIn size={19} />
                            <span className={styles.signInLabel}>{communityText('Sign in')}</span>
                        </Button>
                    )}
                </div>
            </div>
            <SearchBox
                className={`${styles.mobileSearch} ${user ? styles.mobileSearchLoggedIn : ''}`}
                containerRef={mobileSearchRef}
                inputRef={mobileSearchInputRef}
                query={query}
                onQuery={updateQuery}
                onFocus={() => setSuggestionsOpen(true)}
                onOpen={() => setSuggestionsOpen(true)}
                onClose={() => setSuggestionsOpen(false)}
                onSubmit={submitSearch}
                open={suggestionsOpen}
                projects={projectSuggestions}
                people={suggestions}
                spaces={spaceSuggestions}
                searching={suggestionsSearching}
                searchReady={suggestionsReady}
                searchFailed={suggestionsFailed}
                onProject={goToProject}
                onProfile={goToProfile}
                onSpace={goToSpace}
                onSeeAll={runSearch}
                placeholderLabel={communityText('Search')}
                searchLabel={t('nav.search')}
                suggestionId="mw-search-suggestions-mobile"
            />
            <nav className={styles.mobileDock} aria-label={communityText('Mobile navigation')}>
                <Link to="/" className={mobileItemClass('/')} aria-current={location.pathname === '/' ? 'page' : null} aria-label={communityText('Home')} title={communityText('Home')}>
                    <House size={25} />
                </Link>
                <Link to="/explore" className={`${styles.mobileDockItem} ${exploreActive ? styles.mobileDockItemActive : ''}`} aria-current={exploreActive ? 'page' : null} aria-label={communityText('Explore')} title={communityText('Explore')}>
                    <Compass size={25} />
                </Link>
                <a href={editorUrl()} className={`${styles.mobileDockItem} ${styles.mobileCreate}`} aria-label={communityText('Create')} title={communityText('Create')}>
                    <span className={styles.mobileCreateIcon}><Plus size={28} /></span>
                </a>
                <Link
                    to="/notifications"
                    className={`${mobileItemClass('/notifications')} ${styles.mobileNotification}`}
                    aria-current={location.pathname.startsWith('/notifications') ? 'page' : null}
                    aria-label={unread > 0 ? communityText('Notifications ({value1} unread)', {value1: unread}) : communityText('Notifications')}
                    title={communityText('Notifications')}
                >
                    <Bell size={25} />
                    {unread > 0 ? (
                        <span className={styles.mobileNotificationBadge}>{unread > 9 ? '9+' : unread}</span>
                    ) : null}
                </Link>
                {user ? (
                    <Link to="/mystuff" className={mobileItemClass('/mystuff')} aria-current={location.pathname.startsWith('/mystuff') ? 'page' : null} aria-label={communityText('My stuff')} title={communityText('My stuff')}>
                        <FolderOpen size={25} />
                    </Link>
                ) : (
                    <button type="button" className={styles.mobileDockItem} onClick={doLogin} disabled={signingIn} aria-label={signingIn ? communityText('Signing in') : communityText('Sign in')} title={signingIn ? communityText('Signing in') : communityText('Sign in')}>
                        <LogIn size={25} />
                    </button>
                )}
            </nav>
        </header>
    );
};

export default NavBar;
