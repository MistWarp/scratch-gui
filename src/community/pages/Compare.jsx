/* eslint-disable max-len */
import React from 'react';
import {Link} from 'react-router-dom';
import {ArrowRight, Blocks, Download, Gauge, GitCompareArrows, History, Palette, Play, Trophy, Users, UsersRound} from 'lucide-react';
import {editorUrl} from '../api';
import {useCommunityIntl} from '../i18n.jsx';
import ScratchImport from '../components/ScratchImport.jsx';
import Button from '../components/ui/Button.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import styles from './Compare.module.css';

const FEATURES = [
    {
        icon: Gauge,
        title: 'Faster projects',
        body: 'Projects are compiled instead of interpreted block by block, so heavy projects run much faster than on Scratch.'
    },
    {
        icon: Users,
        title: 'A community next to the editor',
        body: 'TurboWarp has no place to share. MistWarp adds project pages, comments, reviews, remixes, and profiles.',
        to: '/explore',
        action: 'Explore projects'
    },
    {
        icon: History,
        title: 'Project history',
        body: 'Look back through earlier versions of a project and compare what changed. Find it under Project history in the editor menu.'
    },
    {
        icon: UsersRound,
        title: 'Live collaboration',
        body: 'Invite someone into your project and edit it together at the same time, from Live Collaboration in the editor menu.'
    },
    {
        icon: Trophy,
        title: 'Studios and challenges',
        body: 'Collect projects in studios, or join a challenge and submit a project before the deadline.',
        to: '/spaces',
        action: 'Browse spaces'
    },
    {
        icon: Blocks,
        title: 'Extra blocks',
        body: 'Switch and case blocks sit in Control next to the standard Scratch blocks, and the extension gallery adds more.'
    },
    {
        icon: Palette,
        title: 'Themes',
        body: 'Pick an accent, use a community theme, or build your own. One theme covers the editor and the site.',
        to: '/themes',
        action: 'Browse themes'
    },
    {
        icon: Download,
        title: 'Packager',
        body: 'Turn a finished project into a standalone page or app.',
        href: 'https://packager.warp.mistium.com/',
        action: 'Open the packager'
    }
];

const Compare = () => {
    const {text} = useCommunityIntl();
    return (
        <main className={styles.page}>
            <PageHeader
                icon={GitCompareArrows}
                title={text('MistWarp compared with Scratch and TurboWarp')}
                lead={text('MistWarp is a Scratch mod built on TurboWarp. Your Scratch projects open as they are.')}
            >
                <ScratchImport source="compare" />
            </PageHeader>
            <div className={styles.grid}>
                {FEATURES.map(({icon: Icon, title, body, to, href, action}) => (
                    <section key={title} className={styles.feature}>
                        <span className={styles.icon}><Icon size={20} /></span>
                        <div>
                            <h2>{text(title)}</h2>
                            <p>{text(body)}</p>
                            {to ? <Link to={to}>{text(action)}<ArrowRight size={14} /></Link> : null}
                            {href ? <a href={href}>{text(action)}<ArrowRight size={14} /></a> : null}
                        </div>
                    </section>
                ))}
            </div>
            <section className={styles.cta}>
                <div>
                    <h2>{text('Try it without an account')}</h2>
                    <p>{text('The editor works without signing in. You only need an account to share or save to MistWarp.')}</p>
                </div>
                <Button as="a" variant="primary" href={editorUrl({starter: 'clicker'})}>
                    <Play size={16} aria-hidden="true" />
                    {text('Open a starter project')}
                </Button>
            </section>
        </main>
    );
};

export default Compare;
