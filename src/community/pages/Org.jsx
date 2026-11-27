import {getCommunityLocale} from '../locale.js';
import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
/* eslint-disable react/jsx-no-bind, max-len */
import React, {useCallback, useEffect, useState} from 'react';
import PropTypes from 'prop-types';
import {
    BookOpen,
    ExternalLink,
    FolderKanban,
    Layers3,
    Library,
    Link2,
    MapPin,
    Plus,
    Settings,
    Trophy,
    Users
} from 'lucide-react';
import {Link, useSearchParams} from 'react-router-dom';
import api from '../api';
import rotur from '../rotur.js';
import useLatest from '../use-latest.js';
import {useUser} from '../UserContext.jsx';
import setPageMeta from '../page-meta.js';
import Avatar from '../components/Avatar.jsx';
import Markdown from '../components/Markdown.jsx';
import OrgLabel from '../components/OrgLabel.jsx';
import ProjectCard from '../components/ProjectCard.jsx';
import UnderlineTabs from '../components/UnderlineTabs.jsx';
import {tabPanelProps} from '../components/SectionTabs.jsx';
import SpaceCard from '../components/SpaceCard.jsx';
import Button from '../components/ui/Button.jsx';
import CardGrid from '../components/ui/CardGrid.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import SectionHeading from '../components/ui/SectionHeading.jsx';
import StatusMessage from '../components/ui/StatusMessage.jsx';
import styles from './Org.module.css';

const TAB_KEYS = ['projects', 'studios', 'challenges', 'collections', 'members', 'about'];
const SPACE_KIND_ICONS = {studio: Layers3, challenge: Trophy, collection: Library};
const ROTUR = 'https://rotur.dev';
const formatNumber = value => new Intl.NumberFormat(getCommunityLocale(), {maximumFractionDigits: 2}).format(Number(value) || 0);

const normalizeOrgTabParams = currentParams => {
    const next = new URLSearchParams(currentParams);
    const tab = next.get('tab');
    if (!TAB_KEYS.includes(tab) || tab === 'projects') next.delete('tab');
    return next;
};

const safeLinks = links => (Array.isArray(links) ? links : []).filter(link => {
    try {
        return link && new URL(link.url).protocol === 'https:';
    } catch (e) {
        return false;
    }
});

const Org = ({name}) => {
    const {text: communityText} = useCommunityText();
    const [searchParams, setSearchParams] = useSearchParams();
    const [data, setData] = useState(null);
    const [error, setError] = useState('');
    const requestedTab = searchParams.get('tab');
    const activeTab = TAB_KEYS.includes(requestedTab) ? requestedTab : 'projects';
    const beginLoad = useLatest();
    const {user} = useUser();
    const viewer = user ? user.username : '';

    const load = useCallback(() => {
        const fresh = beginLoad();
        setError('');
        return api.org(name)
            .then(fresh(setData))
            .catch(fresh(e => setError(e.message || communityText('Could not load this organisation.'))));
    }, [beginLoad, name, viewer]);

    useEffect(() => {
        const normalized = normalizeOrgTabParams(searchParams);
        if (normalized.toString() !== searchParams.toString()) setSearchParams(normalized, {replace: true});
    }, [searchParams, setSearchParams]);

    useEffect(() => {
        setData(null);
    }, [name, viewer]);

    useEffect(() => {
        load();
    }, [load]);

    useEffect(() => {
        const org = data && data.org;
        if (!org) return;
        setPageMeta({
            title: org.displayName || org.username,
            description: org.bio,
            image: rotur.avatar(org.username, 256),
            card: 'summary'
        });
    }, [data]);

    const selectTab = nextTab => {
        const next = new URLSearchParams(searchParams);
        if (nextTab === 'projects') next.delete('tab');
        else next.set('tab', nextTab);
        setSearchParams(next);
    };

    if (error && !data) return <main className={styles.page}><StatusMessage error onRetry={load}>{error}</StatusMessage></main>;
    if (!data) return <main className={styles.page}><StatusMessage>{communityText('Loading organisation…')}</StatusMessage></main>;

    const {org, members = [], projects = [], spaces = []} = data;
    const handle = org.username || name;
    const title = org.displayName || handle;
    const studios = spaces.filter(space => space.kind === 'studio');
    const challenges = spaces.filter(space => space.kind === 'challenge');
    const collections = spaces.filter(space => space.kind === 'collection');
    const manager = data.canManage;
    const memberCount = Number(org.memberCount) || members.length;
    const links = safeLinks(org.links);
    const roturPage = `${ROTUR}/@${encodeURIComponent(handle)}`;
    const roturSettings = `${ROTUR}/orgs/${encodeURIComponent(handle)}/settings`;

    const tabItems = [
        {key: 'projects', label: <>{communityText('Projects')} <b>{projects.length}</b></>},
        {key: 'studios', label: <>{communityText('Studios')} <b>{studios.length}</b></>},
        {key: 'challenges', label: <>{communityText('Challenges')} <b>{challenges.length}</b></>},
        {key: 'collections', label: <>{communityText('Collections')} <b>{collections.length}</b></>},
        {key: 'members', label: <>{communityText('Members')} <b>{memberCount}</b></>},
        {key: 'about', label: communityText('About')}
    ];

    const spaceCopy = {
        studio: {
            title: communityText('Studios run by {org}', {org: title}),
            create: communityText('New studio'),
            empty: communityText('No studios yet'),
            emptyManager: communityText('Create the first studio for {org}.', {org: title}),
            emptyPublic: communityText('{org} has not published any studios.', {org: title})
        },
        challenge: {
            title: communityText('Challenges from {org}', {org: title}),
            create: communityText('New challenge'),
            empty: communityText('No challenges yet'),
            emptyManager: communityText('Create the first challenge for {org}.', {org: title}),
            emptyPublic: communityText('{org} has not published any challenges.', {org: title})
        },
        collection: {
            title: communityText('Collections by {org}', {org: title}),
            create: communityText('New collection'),
            empty: communityText('No collections yet'),
            emptyManager: communityText('Create the first collection for {org}.', {org: title}),
            emptyPublic: communityText('{org} has not published any collections.', {org: title})
        }
    };

    const createLink = kind => (manager ? (
        <Button as={Link} variant="primary" to={`/spaces?create=1&org=${encodeURIComponent(handle)}&kind=${kind}`}><Plus size={16} />{spaceCopy[kind].create}</Button>
    ) : null);

    const spacePanel = (items, kind) => {
        const copy = spaceCopy[kind];
        const icon = SPACE_KIND_ICONS[kind];
        return (
            <section className={styles.contentSection}>
                <SectionHeading icon={icon} title={copy.title} actions={createLink(kind)} />
                {items.length ? (
                    <CardGrid>{items.map(space => <SpaceCard key={space._id} space={space} to={`/spaces/${space._id}`} />)}</CardGrid>
                ) : (
                    <EmptyState icon={icon} title={copy.empty} action={createLink(kind)}>
                        {manager ? copy.emptyManager : copy.emptyPublic}
                    </EmptyState>
                )}
            </section>
        );
    };

    return (
        <main className={styles.page}>
            <div className={styles.layout}>
                <div className={styles.mainColumn}>
                    <UnderlineTabs items={tabItems} value={activeTab} onChange={selectTab} ariaLabel={communityText('Organisation content')} idPrefix="org" />

                    <div {...tabPanelProps('org', activeTab)}>
                        {activeTab === 'projects' ? (
                            <section className={styles.contentSection}>
                                <SectionHeading icon={FolderKanban} title={communityText('Projects by {org}', {org: title})} lead={manager ? communityText('Move one of your projects here from its Ownership settings.') : null} />
                                {projects.length ? <CardGrid>{projects.map(project => <ProjectCard key={project.id} project={project} />)}</CardGrid> : <EmptyState icon={FolderKanban} title={communityText('No projects yet')}>{communityText('Projects this organisation owns will appear here.')}</EmptyState>}
                            </section>
                        ) : null}

                        {activeTab === 'studios' ? spacePanel(studios, 'studio') : null}
                        {activeTab === 'challenges' ? spacePanel(challenges, 'challenge') : null}
                        {activeTab === 'collections' ? spacePanel(collections, 'collection') : null}

                        {activeTab === 'members' ? (
                            <section className={styles.contentSection}>
                                <SectionHeading icon={Users} title={communityText('{count, plural, one {# member} other {# members}}', {count: memberCount})} lead={data.isMember ? null : communityText('Only members who chose to be listed are shown.')} />
                                {members.length ? (
                                    <CardGrid min={205} className={styles.memberGrid}>{members.map(member => (
                                        <Link to={`/users/${encodeURIComponent(member.username)}`} key={member.username}>
                                            <Avatar username={member.username} size={44} />
                                            <span><strong>{member.displayName || member.username}</strong><small>{member.admin ? communityText('Admin') : communityText('Member')}</small></span>
                                        </Link>
                                    ))}</CardGrid>
                                ) : <EmptyState icon={Users} title={communityText('No listed members')}>{communityText('Members of this organisation have chosen not to be listed.')}</EmptyState>}
                            </section>
                        ) : null}

                        {activeTab === 'about' ? (
                            <section className={styles.contentSection}>
                                <SectionHeading icon={BookOpen} title={communityText('About {org}', {org: title})} />
                                {org.bio ? <Markdown className={styles.readme} headingOffset={1}>{org.bio}</Markdown> : <EmptyState icon={BookOpen} title={communityText('No README yet')}>{communityText('This organisation has not written about itself yet.')}</EmptyState>}
                            </section>
                        ) : null}
                    </div>
                </div>

                <aside className={styles.profileRail}>
                    <section className={styles.profileCard}>
                        <div className={styles.banner} style={{backgroundImage: `url(${rotur.banner(handle)})`}} />
                        <div className={styles.profileBody}>
                            <img className={styles.orgIcon} src={rotur.avatar(handle, 152)} alt="" />
                            <span className={styles.handle}>@{handle}</span>
                            <h1>{title}</h1>
                            <OrgLabel owned />
                            {org.location ? <p className={styles.location}><MapPin size={14} />{org.location}</p> : null}
                            <div className={styles.stats}>
                                <button type="button" onClick={() => selectTab('members')}><Users size={16} /><strong>{formatNumber(memberCount)}</strong><span>{communityText('members')}</span></button>
                                <span><FolderKanban size={16} /><strong>{formatNumber(projects.length)}</strong><span>{communityText('projects')}</span></span>
                            </div>
                            {links.length ? (
                                <div className={styles.externalLinks}>
                                    {links.map(link => <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer"><Link2 size={15} />{link.name || link.url}</a>)}
                                </div>
                            ) : null}
                            <div className={styles.externalLinks}>
                                <a href={roturPage} target="_blank" rel="noopener noreferrer"><ExternalLink size={15} />{communityText('View on rotur.dev')}</a>
                                {data.isMember ? <a href={roturSettings} target="_blank" rel="noopener noreferrer"><Settings size={15} />{communityText('Manage organisation')}</a> : null}
                            </div>
                        </div>
                    </section>
                </aside>
            </div>
        </main>
    );
};

Org.propTypes = {
    name: PropTypes.string.isRequired
};

export {normalizeOrgTabParams, safeLinks};
export default Org;
