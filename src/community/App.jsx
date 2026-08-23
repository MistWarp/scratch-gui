import React, {useEffect} from 'react';
import {Routes, Route, useLocation} from 'react-router-dom';
import {UserProvider} from './UserContext.jsx';
import setPageMeta from './page-meta.js';
import NavBar from './components/NavBar.jsx';
import BetaBanner from './components/BetaBanner.jsx';
import StandingBanner from './components/StandingBanner.jsx';
import Footer from './components/Footer.jsx';
import Home from './pages/Home.jsx';
import Explore from './pages/Explore.jsx';
import Project from './pages/Project.jsx';
import Profile from './pages/Profile.jsx';
import Followers from './pages/Followers.jsx';
import Settings from './pages/Settings.jsx';
import MyStuff from './pages/MyStuff.jsx';
import ManageProject from './pages/ManageProject.jsx';
import Wallet from './pages/Wallet.jsx';
import Notifications from './pages/Notifications.jsx';
import News from './pages/News.jsx';
import Leaderboard from './pages/Leaderboard.jsx';
import Admin from './pages/Admin.jsx';
import Spaces from './pages/Spaces.jsx';
import Space from './pages/Space.jsx';
import ManageSpace from './pages/ManageSpace.jsx';
import Roadmap from './pages/Roadmap.jsx';
import Trust from './pages/Trust.jsx';
import Support from './pages/Support.jsx';
import Status from './pages/Status.jsx';
import NotFound from './pages/NotFound.jsx';

const ROUTE_TITLES = [
    ['/explore', 'Explore'],
    ['/settings', 'Settings'],
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

const App = () => (
    <UserProvider>
        <RouteMeta />
        <NavBar />
        <BetaBanner />
        <StandingBanner />
        <div className="mw-app-content">
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/explore" element={<Explore />} />
                <Route path="/project/:id" element={<Project />} />
                <Route path="/users/:name" element={<Profile />} />
                <Route path="/users/:name/followers" element={<Followers />} />
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
                <Route path="/admin" element={<Admin />} />
                <Route path="*" element={<NotFound />} />
            </Routes>
        </div>
        <Footer />
    </UserProvider>
);

export default App;
