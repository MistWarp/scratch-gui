import tokenStyles from './styles/tokens.module.css';
import React, {Suspense, useEffect, useRef} from 'react';
import {lazyWithReload as lazy} from '../lib/lazy-with-retry.js';
import {Navigate, Routes, Route, useLocation, useNavigationType} from 'react-router-dom';
import {UserProvider} from './UserContext.jsx';
import {setRouteMeta} from './page-meta.js';
import {initSiteErrorReporting} from '../lib/error-reporter.js';
import NavBar from './components/NavBar.jsx';
import RouteLoading from './components/RouteLoading.jsx';
import RouteErrorBoundary from './components/RouteErrorBoundary.jsx';
import AnnouncementBanner from './components/AnnouncementBanner.jsx';
import StandingBanner from './components/StandingBanner.jsx';
import UpgradeCelebration from './components/UpgradeCelebration.jsx';
import UpdateToast from '../components/update-toast/update-toast.jsx';
import Footer from './components/Footer.jsx';
import NotFound from './pages/NotFound.jsx';
import {useCommunityIntl} from './i18n.jsx';

const Home = lazy(() => import('./pages/Home.jsx'));
const Explore = lazy(() => import('./pages/Explore.jsx'));
const Search = lazy(() => import('./pages/Search.jsx'));
const Random = lazy(() => import('./pages/Random.jsx'));
const Bounties = lazy(() => import('./pages/Bounties.jsx'));
const Bounty = lazy(() => import('./pages/Bounty.jsx'));
const Project = lazy(() => import('./pages/Project.jsx'));
const PullRequest = lazy(() => import('./pages/PullRequest.jsx'));
const PullRequests = lazy(() => import('./pages/PullRequests.jsx'));
const Commit = lazy(() => import('./pages/Commit.jsx'));
const RemixTree = lazy(() => import('./pages/RemixTree.jsx'));
const Profile = lazy(() => import('./pages/Profile.jsx'));
const UserLibrary = lazy(() => import('./pages/UserLibrary.jsx'));
const Followers = lazy(() => import('./pages/Followers.jsx'));
const Settings = lazy(() => import('./pages/Settings.jsx'));
const MyStuff = lazy(() => import('./pages/MyStuff.jsx'));
const ManageProject = lazy(() => import('./pages/ManageProject.jsx'));
const Purchases = lazy(() => import('./pages/Purchases.jsx'));
const Notifications = lazy(() => import('./pages/Notifications.jsx'));
const Post = lazy(() => import('./pages/Post.jsx'));
const News = lazy(() => import('./pages/News.jsx'));
const NewsPost = lazy(() => import('./pages/NewsPost.jsx'));
const Stats = lazy(() => import('./pages/Stats.jsx'));
const Leaderboard = lazy(() => import('./pages/Leaderboard.jsx'));
const Admin = lazy(() => import('./pages/Admin.jsx'));
const Spaces = lazy(() => import('./pages/Spaces.jsx'));
const Space = lazy(() => import('./pages/Space.jsx'));
const ManageSpace = lazy(() => import('./pages/ManageSpace.jsx'));
const Roadmap = lazy(() => import('./pages/Roadmap.jsx'));
const Trust = lazy(() => import('./pages/Trust.jsx'));
const Compare = lazy(() => import('./pages/Compare.jsx'));
const Support = lazy(() => import('./pages/Support.jsx'));
const Status = lazy(() => import('./pages/Status.jsx'));
const PaidPerks = lazy(() => import('./pages/PaidPerks.jsx'));
const Themes = lazy(() => import('./pages/Themes.jsx'));
const Theme = lazy(() => import('./pages/Theme.jsx'));
const Groups = lazy(() => import('./pages/Groups.jsx'));
const Group = lazy(() => import('./pages/Group.jsx'));

const ROUTE_TITLES = [
    ['/bounties', 'Project bounties'],
    ['/explore', 'Explore'],
    ['/search', 'Search'],
    ['/random', 'Random project'],
    ['/themes/', 'Theme'],
    ['/themes', 'Themes'],
    ['/groups/', 'Group'],
    ['/groups', 'Groups'],
    ['/settings', 'Settings'],
    ['/perks', 'Memberships'],
    ['/mystuff/project/', 'Manage project'],
    ['/mystuff', 'My Stuff'],
    ['/purchases', 'Purchases'],
    ['/notifications', 'Notifications'],
    ['/posts/', 'Post'],
    ['/news', 'News'],
    ['/stats', 'MistWarp stats'],
    ['/leaderboard', 'Leaderboard'],
    ['/spaces/', 'Space'],
    ['/spaces', 'Spaces'],
    ['/roadmap', 'Roadmap'],
    ['/compare', 'Compare with Scratch'],
    ['/trust', 'Trust and safety'],
    ['/support', 'Support'],
    ['/status', 'Service status'],
    ['/admin', 'Admin'],
    ['/users/', 'Profile'],
    ['/p/', 'Project'],
    ['/project/', 'Project']
];

// Scroll positions by history entry, so Back and Forward return to where the reader was.
const scrollPositions = new Map();
const RESTORE_SCROLL_FOR = 2000;

// Pages fill in after their data loads, so keep scrolling until the page is tall enough,
// the time runs out, or the reader takes over.
const restoreScroll = top => {
    let frame = null;
    const started = Date.now();
    const userEvents = ['wheel', 'touchstart', 'keydown', 'mousedown'];
    const stop = () => {
        if (frame !== null) cancelAnimationFrame(frame);
        frame = null;
        userEvents.forEach(type => window.removeEventListener(type, stop));
    };
    const step = () => {
        frame = null;
        window.scrollTo(0, top);
        if (Math.abs(window.scrollY - top) > 1 && Date.now() - started < RESTORE_SCROLL_FOR) {
            frame = requestAnimationFrame(step);
        } else {
            stop();
        }
    };
    userEvents.forEach(type => window.addEventListener(type, stop, {passive: true}));
    step();
    return stop;
};

export const RouteMeta = () => {
    const {text} = useCommunityIntl();
    const {key, pathname} = useLocation();
    const navigationType = useNavigationType();
    const locationKey = useRef(key);
    locationKey.current = key;
    const metaPath = useRef(null);
    const firstRoute = useRef(true);

    useEffect(() => {
        const match = ROUTE_TITLES.find(([prefix]) => pathname.startsWith(prefix));
        const navigated = metaPath.current !== pathname;
        metaPath.current = pathname;
        setRouteMeta({title: match ? text(match[1]) : null}, navigated);
    }, [pathname, text]);

    useEffect(() => {
        if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual';
        const save = () => scrollPositions.set(locationKey.current, window.scrollY);
        window.addEventListener('scroll', save, {passive: true});
        return () => window.removeEventListener('scroll', save);
    }, []);

    useEffect(() => {
        if (firstRoute.current) {
            firstRoute.current = false;
            return;
        }
        let stopRestoring = null;
        if (navigationType === 'POP') stopRestoring = restoreScroll(scrollPositions.get(key) || 0);
        else window.scrollTo(0, 0);
        // Start keyboard and screen reader users at the new page rather than the link they left.
        const main = document.getElementById('mw-main-content');
        if (main && !main.contains(document.activeElement)) main.focus({preventScroll: true});
        return () => {
            if (stopRestoring) stopRestoring();
        };
    // Only a new page moves the scroll position and focus; tab and filter changes keep them.
    }, [pathname]);
    return null;
};

const App = () => {
    const {pathname} = useLocation();
    const {t} = useCommunityIntl();
    useEffect(() => {
        initSiteErrorReporting();
    }, []);
    return (<UserProvider>
        <a className={tokenStyles['mw-skip-link']} href="#mw-main-content">{t('a11y.skip')}</a>
        <RouteMeta />
        <NavBar />
        <AnnouncementBanner />
        <StandingBanner />
        <UpdateToast />
        <UpgradeCelebration />
        <div className={tokenStyles['mw-app-content']} id="mw-main-content" tabIndex="-1">
            <RouteErrorBoundary resetKey={pathname}>
                <Suspense fallback={<RouteLoading />}>
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/explore" element={<Explore />} />
                        <Route path="/search" element={<Search />} />
                        <Route path="/random" element={<Random />} />
                        <Route path="/bounties/:id" element={<Bounty />} />
                        <Route path="/bounties" element={<Bounties />} />
                        <Route path="/themes" element={<Themes />} />
                        <Route path="/themes/:id" element={<Theme />} />
                        <Route path="/groups" element={<Groups />} />
                        <Route path="/groups/:tag" element={<Group />} />
                        <Route path="/p/:slug" element={<Project />} />
                        <Route path="/p/:slug/remixes" element={<RemixTree />} />
                        <Route path="/p/:slug/pulls" element={<PullRequests />} />
                        <Route path="/p/:slug/pulls/:index" element={<PullRequest />} />
                        <Route path="/p/:slug/commits/:sha" element={<Commit />} />
                        <Route path="/project/:id" element={<Project />} />
                        <Route path="/project/:id/remixes" element={<RemixTree />} />
                        <Route path="/project/:id/pulls/:index" element={<PullRequest />} />
                        <Route path="/project/:id/pulls" element={<PullRequests />} />
                        <Route path="/project/:id/commits/:sha" element={<Commit />} />
                        <Route path="/users/:name" element={<Profile />} />
                        <Route path="/users/:name/library" element={<UserLibrary />} />
                        <Route path="/users/:name/followers" element={<Followers />} />
                        <Route path="/users/:name/following" element={<Followers mode="following" />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="/mystuff" element={<MyStuff />} />
                        <Route path="/mystuff/project/:id" element={<ManageProject />} />
                        <Route path="/purchases" element={<Purchases />} />
                        <Route path="/wallet" element={<Navigate to="/purchases" replace />} />
                        <Route path="/notifications" element={<Notifications />} />
                        <Route path="/posts/:id" element={<Post />} />
                        <Route path="/news" element={<News />} />
                        <Route path="/news/manage" element={<News manager />} />
                        <Route path="/news/:id" element={<NewsPost />} />
                        <Route path="/stats" element={<Stats />} />
                        <Route path="/leaderboard" element={<Leaderboard />} />
                        <Route path="/spaces" element={<Spaces />} />
                        <Route path="/spaces/:id" element={<Space />} />
                        <Route path="/spaces/:id/manage" element={<ManageSpace />} />
                        <Route path="/roadmap" element={<Roadmap />} />
                        <Route path="/roadmap/changes" element={<Roadmap changes />} />
                        <Route path="/roadmap/entry/:entryId" element={<Roadmap />} />
                        <Route path="/roadmap/:status" element={<Roadmap />} />
                        <Route path="/compare" element={<Compare />} />
                        <Route path="/trust" element={<Trust />} />
                        <Route path="/support" element={<Support />} />
                        <Route path="/status" element={<Status />} />
                        <Route path="/perks" element={<PaidPerks />} />
                        <Route path="/admin" element={<Admin />} />
                        <Route path="*" element={<NotFound />} />
                    </Routes>
                </Suspense>
            </RouteErrorBoundary>
        </div>
        <Footer />
    </UserProvider>);
};

export default App;
