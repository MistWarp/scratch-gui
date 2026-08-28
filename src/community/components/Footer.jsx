import React from 'react';
import {Link} from 'react-router-dom';
import {Github} from 'lucide-react';
import {editorUrl} from '../api';
import logo from '../assets/mistwarp-logo.png';
import styles from './Footer.module.css';

const Footer = () => (
    <footer className={styles.footer}>
        <div className={styles.inner}>
            <div className={styles.brand}>
                <img
                    className={styles.logo}
                    src={logo}
                    alt=""
                />
                <div>
                    <span className={styles.wordmark}>MistWarp</span>
                    <p className={styles.tagline}>Build, share, and remix projects together.</p>
                </div>
            </div>

            <div className={styles.columns}>
                <div className={styles.column}>
                    <span className={styles.columnTitle}>Create</span>
                    <a href={editorUrl()}>Editor</a>
                    <Link to="/mystuff">My stuff</Link>
                </div>
                <div className={styles.column}>
                    <span className={styles.columnTitle}>Community</span>
                    <Link to="/explore">Explore</Link>
                    <Link to="/spaces?kind=studio">Studios</Link>
                    <Link to="/spaces?kind=challenge">Challenges</Link>
                    <Link to="/themes">Themes</Link>
                    <Link to="/leaderboard">Leaderboard</Link>
                    <Link to="/news">News</Link>
                    <Link to="/roadmap">Roadmap</Link>
                    <Link to="/roadmap?new=bug">Report a bug</Link>
                </div>
                <div className={styles.column}>
                    <span className={styles.columnTitle}>More</span>
                    <Link to="/perks">Paid perks</Link>
                    <a href="/docs/">Documentation</a>
                    <a href="https://packager.warp.mistium.com/">Packager</a>
                    <a
                        href="https://github.com/mistwarp"
                        target="_blank"
                        rel="noreferrer"
                        className={styles.iconRow}
                    >
                        <Github size={14} />
                        GitHub
                    </a>
                    <a
                        href="https://rotur.dev"
                        target="_blank"
                        rel="noreferrer"
                    >Rotur</a>
                    <a href="/credits">Credits</a>
                </div>
                <div className={styles.column}>
                    <span className={styles.columnTitle}>Help and safety</span>
                    <Link to="/support">Support</Link>
                    <Link to="/trust">Trust, privacy, and terms</Link>
                    <Link to="/status">Service status</Link>
                </div>
            </div>
        </div>
        <div className={styles.legal}>
            MistWarp is a mod of TurboWarp and Scratch. Not affiliated with Scratch or the Scratch Foundation.
        </div>
    </footer>
);

export default Footer;
