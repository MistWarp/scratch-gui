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

const ROUTE_TITLES = [
    ['/explore', 'Explore'],
    ['/settings', 'Settings'],
    ['/mystuff/project/', 'Manage project'],
    ['/mystuff', 'My Stuff'],
    ['/wallet', 'Wallet'],
    ['/notifications', 'Notifications'],
    ['/news', 'News'],
    ['/leaderboard', 'Leaderboard'],
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
                <Route path="/admin" element={<Admin />} />
            </Routes>
        </div>
        <Footer />
    </UserProvider>
);

export default App;
