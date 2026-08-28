import React, {lazy, Suspense, useEffect} from 'react';
import {Routes, Route, useLocation} from 'react-router-dom';
import {UserProvider} from './UserContext.jsx';
import setPageMeta from './page-meta.js';
import NavBar from './components/NavBar.jsx';
import BetaBanner from './components/BetaBanner.jsx';
import StandingBanner from './components/StandingBanner.jsx';
import Footer from './components/Footer.jsx';
import Home from './pages/Home.jsx';
import NotFound from './pages/NotFound.jsx';
import {useCommunityIntl} from './i18n.jsx';

const Explore = lazy(() => import('./pages/Explore.jsx'));
const Project = lazy(() => import('./pages/Project.jsx'));
const Profile = lazy(() => import('./pages/Profile.jsx'));
const Followers = lazy(() => import('./pages/Followers.jsx'));
const Settings = lazy(() => import('./pages/Settings.jsx'));
const MyStuff = lazy(() => import('./pages/MyStuff.jsx'));
const ManageProject = lazy(() => import('./pages/ManageProject.jsx'));
const Wallet = lazy(() => import('./pages/Wallet.jsx'));
const Notifications = lazy(() => import('./pages/Notifications.jsx'));
const News = lazy(() => import('./pages/News.jsx'));
const Leaderboard = lazy(() => import('./pages/Leaderboard.jsx'));
const Admin = lazy(() => import('./pages/Admin.jsx'));
const Spaces = lazy(() => import('./pages/Spaces.jsx'));
const Space = lazy(() => import('./pages/Space.jsx'));
const ManageSpace = lazy(() => import('./pages/ManageSpace.jsx'));
const Roadmap = lazy(() => import('./pages/Roadmap.jsx'));
const Trust = lazy(() => import('./pages/Trust.jsx'));
const Support = lazy(() => import('./pages/Support.jsx'));
const Status = lazy(() => import('./pages/Status.jsx'));
const PaidPerks = lazy(() => import('./pages/PaidPerks.jsx'));
const Themes = lazy(() => import('./pages/Themes.jsx'));
const Theme = lazy(() => import('./pages/Theme.jsx'));
const Groups = lazy(() => import('./pages/Groups.jsx'));
const Group = lazy(() => import('./pages/Group.jsx'));
const VanityProject = lazy(() => import('./pages/VanityProject.jsx'));

const ROUTE_TITLES = [
    ['/explore', 'Explore'],
    ['/themes/', 'Theme'],
    ['/themes', 'Themes'],
    ['/groups/', 'Group'],
    ['/groups', 'Groups'],
    ['/settings', 'Settings'],
    ['/perks', 'Membership perks'],
    ['/mystuff/project/', 'Manage project'],
    ['/mystuff', 'My Stuff'],
    ['/wallet', 'Wallet'],
    ['/notifications', 'Notifications'],
    ['/news', 'News'],
    ['/leaderboard', 'Leaderboard'],
    ['/spaces/', 'Space'],
    ['/spaces', 'Spaces'],
    ['/roadmap', 'Roadmap'],
    ['/trust', 'Trust and safety'],
    ['/support', 'Support'],
    ['/status', 'Service status'],
    ['/users/', 'Profile'],
    ['/project/', 'Project']
];

const RouteMeta = () => {
    const {pathname} = useLocation();
    useEffect(() => {
        const match = ROUTE_TITLES.find(([prefix]) => pathname.startsWith(prefix));
        setPageMeta({title: match ? match[1] : null});
        window.scrollTo(0, 0);
    }, [pathname]);
    return null;
};

const App = () => {
    const {t} = useCommunityIntl();
    return (<UserProvider>
        <a className="mw-skip-link" href="#mw-main-content">{t('a11y.skip')}</a>
        <RouteMeta />
        <NavBar />
        <BetaBanner />
        <StandingBanner />
        <div className="mw-app-content" id="mw-main-content" tabIndex="-1">
            <Suspense fallback={<p role="status">Loading…</p>}>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/explore" element={<Explore />} />
                    <Route path="/themes" element={<Themes />} />
                    <Route path="/themes/:id" element={<Theme />} />
                    <Route path="/groups" element={<Groups />} />
                    <Route path="/groups/:tag" element={<Group />} />
                    <Route path="/p/:slug" element={<VanityProject />} />
                    <Route path="/project/:id" element={<Project />} />
                    <Route path="/users/:name" element={<Profile />} />
                    <Route path="/users/:name/followers" element={<Followers />} />
                    <Route path="/users/:name/following" element={<Followers mode="following" />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/mystuff" element={<MyStuff />} />
                    <Route path="/mystuff/project/:id" element={<ManageProject />} />
                    <Route path="/wallet" element={<Wallet />} />
                    <Route path="/notifications" element={<Notifications />} />
                    <Route path="/news" element={<News />} />
                    <Route path="/leaderboard" element={<Leaderboard />} />
                    <Route path="/spaces" element={<Spaces />} />
                    <Route path="/spaces/:id" element={<Space />} />
                    <Route path="/spaces/:id/manage" element={<ManageSpace />} />
                    <Route path="/roadmap" element={<Roadmap />} />
                    <Route path="/trust" element={<Trust />} />
                    <Route path="/support" element={<Support />} />
                    <Route path="/status" element={<Status />} />
                    <Route path="/perks" element={<PaidPerks />} />
                    <Route path="/admin" element={<Admin />} />
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </Suspense>
        </div>
        <Footer />
    </UserProvider>);
};

export default App;
