import {getCommunityLocale} from '../locale.js';
import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
/* eslint-disable react/jsx-no-bind, max-len */
import React, {useCallback, useEffect, useState} from 'react';
import {
    ArrowLeft,
    CalendarDays,
    Coins,
    ExternalLink,
    FolderKanban,
    HeartHandshake,
    Layers3,
    Library,
    Megaphone,
    Plus,
    ShieldCheck,
    Trophy,
    Users
} from 'lucide-react';
import {Link, useParams, useSearchParams} from 'react-router-dom';
import api from '../api.js';
import rotur from '../rotur.js';
import useLatest from '../use-latest.js';
import {useUser} from '../UserContext.jsx';
import Avatar from '../components/Avatar.jsx';
import ProjectCard from '../components/ProjectCard.jsx';
import GroupTag from '../components/GroupTag.jsx';
import UnderlineTabs from '../components/UnderlineTabs.jsx';
import SpaceCard from '../components/SpaceCard.jsx';
import Button from '../components/ui/Button.jsx';
import CardGrid from '../components/ui/CardGrid.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Notice from '../components/ui/Notice.jsx';
import SectionHeading from '../components/ui/SectionHeading.jsx';
import StatusMessage from '../components/ui/StatusMessage.jsx';
import styles from './Group.module.css';

const TAB_KEYS = ['projects', 'studios', 'challenges', 'collections', 'members', 'support'];
const SPACE_KINDS = {
    studio: {
        icon: Layers3,
        title: 'Studios run by {group}',
        create: 'New studio',
        empty: 'No studios yet',
        emptyManager: 'Create the first studio for {group}.',
        emptyPublic: '{group} has not published any studios.'
    },
    challenge: {
        icon: Trophy,
        title: 'Challenges from {group}',
        create: 'New challenge',
        empty: 'No challenges yet',
        emptyManager: 'Create the first challenge for {group}.',
        emptyPublic: '{group} has not published any challenges.'
    },
    collection: {
        icon: Library,
        title: 'Collections by {group}',
        create: 'New collection',
        empty: 'No collections yet',
        emptyManager: 'Create the first collection for {group}.',
        emptyPublic: '{group} has not published any collections.'
    }
};
const formatNumber = value => new Intl.NumberFormat(getCommunityLocale(), {maximumFractionDigits: 2}).format(Number(value) || 0);

const normalizeGroupTabParams = currentParams => {
    const next = new URLSearchParams(currentParams);
    const tab = next.get('tab');
    if (!TAB_KEYS.includes(tab) || tab === 'projects') next.delete('tab');
    return next;
};

const Group = () => {
    const {text: communityText} = useCommunityText();
    const {tag} = useParams();
    const {user, login, refreshUser} = useUser();
    const includeMembers = Boolean(user);
    const [searchParams, setSearchParams] = useSearchParams();
    const [data, setData] = useState(null);
    const [campaigns, setCampaigns] = useState([]);
    const [announcements, setAnnouncements] = useState([]);
    const [events, setEvents] = useState([]);
    const [products, setProducts] = useState([]);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [busy, setBusy] = useState('');
    const [amounts, setAmounts] = useState({});
    const requestedTab = searchParams.get('tab');
    const activeTab = TAB_KEYS.includes(requestedTab) ? requestedTab : 'projects';
    const beginLoad = useLatest();

    const load = useCallback(() => {
        const fresh = beginLoad();
        setError('');
        return Promise.all([
            api.group(tag),
            rotur.groups.bundle(tag, {includeMembers})
        ])
            .then(fresh(([groupData, bundle]) => {
                const memberData = bundle.members;
                const liveMembers = Array.isArray(memberData?.members) ?
                    memberData.members.map(member => member.username).filter(Boolean) : null;
                setData(liveMembers ? {...groupData, members: liveMembers, membershipLive: true} : groupData);
                setCampaigns(Array.isArray(bundle.campaigns) ? bundle.campaigns : []);
                setAnnouncements(Array.isArray(bundle.announcements) ? bundle.announcements : []);
                setEvents(Array.isArray(bundle.events) ? bundle.events : []);
                setProducts(Array.isArray(bundle.products) ? bundle.products : []);
            }))
            .catch(fresh(e => setError(e.message || communityText('Could not load this group.'))));
    }, [beginLoad, includeMembers, tag]);

    useEffect(() => {
        const normalized = normalizeGroupTabParams(searchParams);
        if (normalized.toString() !== searchParams.toString()) setSearchParams(normalized, {replace: true});
    }, [searchParams, setSearchParams]);

    useEffect(() => {
        setData(null);
        setError('');
        setMessage('');
        load();
    }, [load]);

    const selectTab = nextTab => {
        const next = new URLSearchParams(searchParams);
        if (nextTab === 'projects') next.delete('tab');
        else next.set('tab', nextTab);
        setSearchParams(next);
    };

    const membership = async action => {
        if (!user) return login();
        setBusy(action);
        setError('');
        setMessage('');
        try {
            if (action === 'leave') await rotur.groups.leave(tag);
            else if (data.group.join_policy === 'REQUEST') await rotur.groups.requestJoin(tag);
            else await rotur.groups.join(tag);
            await load();
        } catch (e) {
            setError(e.message || communityText('Could not update membership.'));
        } finally {
            setBusy('');
        }
    };

    const toggleRepresentation = async () => {
        if (!user) return login();
        const representing = String(user.group_tag || '').toLowerCase() === String(tag).toLowerCase();
        setBusy('represent');
        setError('');
        setMessage('');
        try {
            if (representing) await rotur.groups.stopRepresenting(tag);
            else await rotur.groups.represent(tag);
            const refreshed = await refreshUser();
            window.dispatchEvent(new CustomEvent('mw:group-representation', {
                detail: {username: refreshed?.username, tag: refreshed?.group_tag || ''}
            }));
            setMessage(representing ? communityText('This group is no longer shown with your MistWarp identity.') : communityText('You now represent {group} across MistWarp.', {group: data.group.name}));
        } catch (e) {
            setError(e.message || communityText('Could not update your represented group.'));
        } finally {
            setBusy('');
        }
    };

    const contribute = async campaign => {
        if (!user) return login();
        const amount = Number(amounts[campaign.id]);
        if (!(amount > 0)) return setError(communityText('Enter an amount to contribute.'));
        setBusy(campaign.id);
        setError('');
        try {
            await rotur.groups.contribute(tag, campaign.id, amount);
            await load();
        } catch (e) {
            setError(e.message || communityText('Contribution failed.'));
        } finally {
            setBusy('');
        }
    };

    if (error && !data) return <main className={styles.page}><StatusMessage error onRetry={load}>{error}</StatusMessage></main>;
    if (!data) return <main className={styles.page}><StatusMessage>{communityText('Loading group…')}</StatusMessage></main>;

    const {group, members = [], projects = [], spaces = []} = data;
    const studios = spaces.filter(space => space.kind === 'studio');
    const challenges = spaces.filter(space => space.kind === 'challenge');
    const collections = spaces.filter(space => space.kind === 'collection');
    const manager = data.canManage;
    const member = data.isMember || manager;
    const representing = String(user?.group_tag || '').toLowerCase() === String(tag).toLowerCase();
    const memberCount = Number(group.member_count) || members.length;
    const roturGroupUrl = `https://rotur.dev/groups/${encodeURIComponent(tag)}`;
    const groupIcon = group.icon_url || `https://api.rotur.dev/groups/${encodeURIComponent(tag)}/icon.jpg`;

    const tabItems = [
        {key: 'projects', label: <>{communityText('Projects')} <b>{projects.length}</b></>},
        {key: 'studios', label: <>{communityText('Studios')} <b>{studios.length}</b></>},
        {key: 'challenges', label: <>{communityText('Challenges')} <b>{challenges.length}</b></>},
        {key: 'collections', label: <>{communityText('Collections')} <b>{collections.length}</b></>},
        {key: 'members', label: <>{communityText('Members')} <b>{memberCount}</b></>},
        {key: 'support', label: <>{communityText('Support')} <b>{campaigns.length + products.length}</b></>}
    ];

    const createLink = kind => (manager ? (
        <Button as={Link} variant="primary" to={`/spaces?create=1&group=${encodeURIComponent(tag)}&kind=${kind}`}><Plus size={16} />{communityText(SPACE_KINDS[kind].create)}</Button>
    ) : null);

    const spacePanel = (items, kind) => {
        const config = SPACE_KINDS[kind];
        return (
            <section className={styles.contentSection}>
                <SectionHeading icon={config.icon} title={communityText(config.title, {group: group.name})} actions={createLink(kind)} />
                {items.length ? (
                    <CardGrid>{items.map(space => <SpaceCard key={space._id} space={space} to={`/spaces/${space._id}`} />)}</CardGrid>
                ) : (
                    <EmptyState icon={config.icon} title={communityText(config.empty)} action={createLink(kind)}>
                        {manager ? communityText(config.emptyManager, {group: group.name}) : communityText(config.emptyPublic, {group: group.name})}
                    </EmptyState>
                )}
            </section>
        );
    };

    return (
        <main className={styles.page}>
            <Link className={styles.backLink} to="/groups"><ArrowLeft size={16} />{communityText('All groups')}</Link>
            <div className={styles.layout}>
                <div className={styles.mainColumn}>
                    <UnderlineTabs items={tabItems} value={activeTab} onChange={selectTab} ariaLabel="Group content" />

                    {error ? <Notice variant="error" className={styles.notice}>{error}</Notice> : null}
                    {message ? <Notice variant="success" className={styles.notice}>{message}</Notice> : null}

                    {activeTab === 'projects' ? (
                        <section className={styles.contentSection}>
                            <SectionHeading icon={FolderKanban} title={communityText('Projects by {group}', {group: group.name})} lead={manager ? communityText('Assign a project from its metadata settings.') : null} />
                            {projects.length ? <CardGrid>{projects.map(project => <ProjectCard key={project.id} project={project} />)}</CardGrid> : <EmptyState icon={FolderKanban} title={communityText('No projects yet')}>{communityText('Projects assigned to this group will appear here.')}</EmptyState>}
                        </section>
                    ) : null}

                    {activeTab === 'studios' ? spacePanel(studios, 'studio') : null}
                    {activeTab === 'challenges' ? spacePanel(challenges, 'challenge') : null}
                    {activeTab === 'collections' ? spacePanel(collections, 'collection') : null}

                    {activeTab === 'members' ? (
                        <section className={styles.contentSection}>
                            <SectionHeading icon={Users} title={communityText('{count} members', {count: formatNumber(memberCount)})} />
                            {members.length ? <CardGrid min={205} className={styles.memberGrid}>{members.map(name => <Link to={`/users/${name}`} key={name}><Avatar username={name} size={44} /><span><strong>{name}</strong><GroupTag username={name} compact linked={false} /><small>{communityText('Member of {tag}', {tag: group.tag})}</small></span></Link>)}</CardGrid> : data.membershipLive ? <EmptyState icon={Users} title={communityText('No members yet')}>{communityText('Members will appear here after they join.')}</EmptyState> : null}
                            {!members.length && !data.membershipLive ? <EmptyState icon={Users} title={communityText('{value1} members', {value1: formatNumber(memberCount)})}>{user ? communityText('The member directory is private.') : communityText('Join this group to browse its member directory.')}</EmptyState> : null}
                        </section>
                    ) : null}

                    {activeTab === 'support' ? (
                        <div className={styles.supportSections}>
                            <section className={styles.contentSection}>
                                <SectionHeading icon={HeartHandshake} title={communityText('Support {group}', {group: group.name})} />
                                {campaigns.length ? <div className={styles.cardGrid}>{campaigns.map(campaign => <article className={styles.dataCard} key={campaign.id}><span className={styles.cardType}><HeartHandshake size={14} /> {campaign.status === 'ACTIVE' ? communityText('Accepting support') : campaign.status}</span><h2>{campaign.title}</h2><p>{campaign.description}</p><div className={styles.progress}><i style={{width: `${Math.min(100, (campaign.raised_credits / campaign.goal_credits) * 100)}%`}} /></div><small>{communityText('{raised} of {goal} credits', {raised: formatNumber(campaign.raised_credits), goal: formatNumber(campaign.goal_credits)})}</small>{campaign.status === 'ACTIVE' ? <div className={styles.fund}><input min="0.01" step="0.01" type="number" aria-label={communityText('Credits for {value1}', {value1: campaign.title})} placeholder={communityText('Credits')} value={amounts[campaign.id] || ''} onChange={event => setAmounts({...amounts, [campaign.id]: event.target.value})} /><Button busy={busy === campaign.id} onClick={() => contribute(campaign)}>{communityText('Contribute')}</Button></div> : null}</article>)}</div> : <EmptyState icon={HeartHandshake} title={communityText('No active fundraisers')}>{communityText('You can still support this group through its Rotur page.')}</EmptyState>}
                            </section>
                            {products.length ? <section className={styles.contentSection}><SectionHeading icon={Coins} title={communityText('Join with a membership')} /><div className={styles.cardGrid}>{products.map(product => <article className={styles.dataCard} key={product.id}><span className={styles.cardType}><Coins size={14} /> {communityText('{amount} credits', {amount: formatNumber(product.price_credits || product.price)})}</span><h2>{product.name || product.title}</h2><p>{product.description}</p><a href={roturGroupUrl} target="_blank" rel="noreferrer">{communityText('Purchase on Rotur')}<ExternalLink size={13} /></a></article>)}</div></section> : null}
                            {announcements.length || events.length ? <section className={styles.contentSection}><SectionHeading icon={Megaphone} title={communityText('Updates from {group}', {group: group.name})} /><div className={styles.cardGrid}>{announcements.map(item => <article className={styles.dataCard} key={item.id}><span className={styles.cardType}><Megaphone size={14} />{communityText('Announcement')}</span><h2>{item.title}</h2><p>{item.body}</p></article>)}{events.map(item => <article className={styles.dataCard} key={item.id}><span className={styles.cardType}><CalendarDays size={14} />{communityText('Event')}</span><h2>{item.title}</h2><p>{item.description}</p></article>)}</div></section> : null}
                        </div>
                    ) : null}
                </div>

                <aside className={styles.profileRail}>
                    <section className={styles.profileCard}>
                        <div className={`${styles.banner} ${group.banner_url ? '' : styles.defaultBanner}`} style={group.banner_url ? {backgroundImage: `url(${group.banner_url})`} : null} />
                        <div className={styles.profileBody}>
                            <img className={styles.groupIcon} src={groupIcon} alt="" />
                            <span className={styles.handle}>@{group.tag}</span>
                            <h1>{group.name}</h1>
                            <p className={styles.description}>{group.description || communityText('No description yet.')}</p>
                            <div className={styles.stats}>
                                <button type="button" onClick={() => selectTab('members')}><Users size={16} /><strong>{formatNumber(memberCount)}</strong><span>{communityText('members')}</span></button>
                                <span><Coins size={16} /><strong>{formatNumber(group.credits_balance)}</strong><span>{communityText('credits')}</span></span>
                            </div>
                            <div className={styles.actions}>
                                {!member ? <Button variant="primary" busy={busy === 'join'} onClick={() => membership('join')}><Plus size={16} />{group.join_policy === 'REQUEST' ? communityText('Request to join') : communityText('Join group')}</Button> : null}
                                {member ? <Button variant={representing ? 'secondary' : 'primary'} busy={busy === 'represent'} busyLabel={communityText('Saving…')} onClick={toggleRepresentation}>{representing ? communityText('Stop representing') : communityText('Represent group')}</Button> : null}
                                {data.isMember && !manager ? <Button variant="secondary" busy={busy === 'leave'} onClick={() => membership('leave')}>{communityText('Leave group')}</Button> : null}
                            </div>
                            {representing ? <p className={styles.representing}><ShieldCheck size={15} />{communityText('Shown with your identity across MistWarp')}</p> : null}
                            <div className={styles.externalLinks}>
                                <a href={roturGroupUrl} target="_blank" rel="noreferrer"><ExternalLink size={15} />{communityText('View on rotur.dev')}</a>
                                {manager ? <a href={roturGroupUrl} target="_blank" rel="noreferrer"><ShieldCheck size={15} />{communityText('Manage group')}</a> : null}
                            </div>
                        </div>
                    </section>
                </aside>
            </div>
        </main>
    );
};

export {normalizeGroupTabParams};
export default Group;
