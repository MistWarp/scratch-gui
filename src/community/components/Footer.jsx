import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
import React from 'react';
import {Link} from 'react-router-dom';
import {Github} from 'lucide-react';
import {editorUrl} from '../api';
import {BUILD_ID, BUILD_TIME, shortId} from '../../lib/build-version.js';
import logo from '../assets/mistwarp-logo.png';
import styles from './Footer.module.css';

const commitUrl = BUILD_ID && BUILD_ID !== 'dev' ?
    `https://github.com/MistWarp/scratch-gui/commit/${BUILD_ID}` : null;

const Footer = () => {
    const {text: communityText} = useCommunityText();
    return (<footer className={styles.footer}>
        <div className={styles.inner}>
            <div className={styles.brand}>
                <img
                    className={styles.logo}
                    src={logo}
                    alt=""
                />
                <div>
                    <span className={styles.wordmark}>{communityText('MistWarp')}</span>
                    <p className={styles.tagline}>{communityText('Build, share, and remix projects together.')}</p>
                </div>
            </div>

            <div className={styles.columns}>
                <div className={styles.column}>
                    <span className={styles.columnTitle}>{communityText('Create')}</span>
                    <a href={editorUrl()}>{communityText('Editor')}</a>
                    <Link to="/mystuff">{communityText('My stuff')}</Link>
                </div>
                <div className={styles.column}>
                    <span className={styles.columnTitle}>{communityText('Community')}</span>
                    <Link to="/explore">{communityText('Explore')}</Link>
                    <Link to="/spaces?kind=studio">{communityText('Studios')}</Link>
                    <Link to="/spaces?kind=challenge">{communityText('Challenges')}</Link>
                    <Link to="/themes">{communityText('Themes')}</Link>
                    <Link to="/leaderboard">{communityText('Leaderboard')}</Link>
                    <Link to="/news">{communityText('News')}</Link>
                    <Link to="/stats">{communityText('Stats')}</Link>
                    <Link to="/roadmap">{communityText('Roadmap')}</Link>
                    <Link to="/roadmap?new=bug">{communityText('Report a bug')}</Link>
                </div>
                <div className={styles.column}>
                    <span className={styles.columnTitle}>{communityText('More')}</span>
                    <Link to="/perks">{communityText('Paid perks')}</Link>
                    <a href="/docs/">{communityText('Documentation')}</a>
                    <a href="https://packager.warp.mistium.com/">{communityText('Packager')}</a>
                    <a
                        href="https://github.com/mistwarp"
                        target="_blank"
                        rel="noreferrer"
                        className={styles.iconRow}
                    >
                        <Github size={14} />{communityText('GitHub')}</a>
                    <a
                        href="https://rotur.dev"
                        target="_blank"
                        rel="noreferrer"
                    >{communityText('Rotur')}</a>
                    <a href="/credits">{communityText('Credits')}</a>
                </div>
                <div className={styles.column}>
                    <span className={styles.columnTitle}>{communityText('Help and safety')}</span>
                    <Link to="/support">{communityText('Support')}</Link>
                    <Link to="/trust">{communityText('Trust, privacy, and terms')}</Link>
                    <Link to="/status">{communityText('Service status')}</Link>
                </div>
            </div>
        </div>
        <div className={styles.legal}>{communityText(
            // eslint-disable-next-line max-len
            'MistWarp is a mod of TurboWarp and Scratch. Not affiliated with Scratch or the Scratch Foundation.'
        )}<span
            className={styles.version}
            title={BUILD_TIME ? communityText('Deployed {value1}', {value1: BUILD_TIME}) : BUILD_ID}
        >
            {communityText(' · Version ')}
            {commitUrl ? (
                <a
                    href={commitUrl}
                    target="_blank"
                    rel="noreferrer"
                >
                    {shortId(BUILD_ID)}
                </a>
            ) : shortId(BUILD_ID)}
        </span>
        </div>
    </footer>);
};

export default Footer;
