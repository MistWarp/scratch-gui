import React from 'react';
import {Routes, Route} from 'react-router-dom';
import {UserProvider} from './UserContext.jsx';
import NavBar from './components/NavBar.jsx';
import BetaBanner from './components/BetaBanner.jsx';
import Footer from './components/Footer.jsx';
import Home from './pages/Home.jsx';
import Explore from './pages/Explore.jsx';
import Project from './pages/Project.jsx';
import Profile from './pages/Profile.jsx';
import Followers from './pages/Followers.jsx';
import Settings from './pages/Settings.jsx';
import MyStuff from './pages/MyStuff.jsx';
import Notifications from './pages/Notifications.jsx';
import News from './pages/News.jsx';
import Leaderboard from './pages/Leaderboard.jsx';

const App = () => (
    <UserProvider>
        <NavBar />
        <BetaBanner />
        <div className="mw-app-content">
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/explore" element={<Explore />} />
                <Route path="/project/:id" element={<Project />} />
                <Route path="/users/:name" element={<Profile />} />
                <Route path="/users/:name/followers" element={<Followers />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/mystuff" element={<MyStuff />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/news" element={<News />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
            </Routes>
        </div>
        <Footer />
    </UserProvider>
);

export default App;
