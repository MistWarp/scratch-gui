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
import SectionTabs from '../components/SectionTabs.jsx';
import SpaceCard from '../components/SpaceCard.jsx';
import Button from '../components/ui/Button.jsx';
import styles from './Group.module.css';

const TAB_KEYS = ['projects', 'studios', 'challenges', 'collections', 'members', 'support'];
const formatNumber = value => new Intl.NumberFormat('en-GB', {maximumFractionDigits: 2}).format(Number(value) || 0);

const normalizeGroupTabParams = currentParams => {
    const next = new URLSearchParams(currentParams);
    const tab = next.get('tab');
    if (!TAB_KEYS.includes(tab) || tab === 'projects') next.delete('tab');
    return next;
};

const EmptyState = ({icon: Icon, title, children, action}) => (
    <div className={styles.emptyState}>
        <span className={styles.emptyIcon}><Icon size={23} /></span>
        <div><h2>{title}</h2><p>{children}</p>{action}</div>
    </div>
);

const Group = () => {
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
            .catch(fresh(e => setError(e.message || 'Could not load this group.')));
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
            setError(e.message || 'Could not update membership.');
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
            setMessage(representing ? 'This group is no longer shown with your MistWarp identity.' : `You now represent ${data.group.name} across MistWarp.`);
        } catch (e) {
            setError(e.message || 'Could not update your represented group.');
        } finally {
            setBusy('');
        }
    };

    const contribute = async campaign => {
        if (!user) return login();
        const amount = Number(amounts[campaign.id]);
        if (!(amount > 0)) return setError('Enter an amount to contribute.');
        setBusy(campaign.id);
        setError('');
        try {
            await rotur.groups.contribute(tag, campaign.id, amount);
            await load();
        } catch (e) {
            setError(e.message || 'Contribution failed.');
        } finally {
            setBusy('');
        }
    };

    if (error && !data) return <main className={styles.page}><p className={styles.error}>{error} <Button onClick={load}>Try again</Button></p></main>;
    if (!data) return <main className={styles.page}><p className={styles.loading}>Loading group…</p></main>;

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
        {key: 'projects', label: <span>Projects <b>{projects.length}</b></span>},
        {key: 'studios', label: <span>Studios <b>{studios.length}</b></span>},
        {key: 'challenges', label: <span>Challenges <b>{challenges.length}</b></span>},
        {key: 'collections', label: <span>Collections <b>{collections.length}</b></span>},
        {key: 'members', label: <span>Members <b>{memberCount}</b></span>},
        {key: 'support', label: <span>Support <b>{campaigns.length + products.length}</b></span>}
    ];

    const createLink = (kind, label) => (manager ? (
        <Link className={styles.createAction} to={`/spaces?create=1&group=${encodeURIComponent(tag)}&kind=${kind}`}><Plus size={15} /> New {label}</Link>
    ) : null);

    const spacePanel = (items, kind, title, Icon) => (
        <section className={styles.contentSection}>
            <div className={styles.sectionHeading}><div><span>{kind}</span><h1>{title}</h1></div>{createLink(kind, kind)}</div>
            {items.length ? <div className={styles.spaceGrid}>{items.map(space => <SpaceCard key={space._id} space={space} to={`/spaces/${space._id}`} />)}</div> : <EmptyState icon={Icon} title={`No ${kind}s yet`} action={createLink(kind, kind)}>{manager ? `Create the first ${kind} for ${group.name}.` : `${group.name} has not published any ${kind}s.`}</EmptyState>}
        </section>
    );

    return (
        <main className={styles.page}>
            <Link className={styles.backLink} to="/groups"><ArrowLeft size={16} /> All groups</Link>
            <div className={styles.layout}>
                <div className={styles.mainColumn}>
                    <SectionTabs items={tabItems} value={activeTab} onChange={selectTab} className={styles.tabs} itemClassName={styles.tab} activeClassName={styles.activeTab} ariaLabel="Group content" />

                    {error ? <p className={styles.error}>{error}</p> : null}
                    {message ? <p className={styles.message}>{message}</p> : null}

                    {activeTab === 'projects' ? (
                        <section className={styles.contentSection}>
                            <div className={styles.sectionHeading}><div><span>Projects</span><h1>Projects by {group.name}</h1></div>{manager ? <small>Assign a project from its metadata settings</small> : null}</div>
                            {projects.length ? <div className={styles.projectGrid}>{projects.map(project => <ProjectCard key={project.id} project={project} />)}</div> : <EmptyState icon={FolderKanban} title="No projects yet">Projects assigned to this group will appear here.</EmptyState>}
                        </section>
                    ) : null}

                    {activeTab === 'studios' ? spacePanel(studios, 'studio', `Studios run by ${group.name}`, Layers3) : null}
                    {activeTab === 'challenges' ? spacePanel(challenges, 'challenge', `Challenges from ${group.name}`, Trophy) : null}
                    {activeTab === 'collections' ? spacePanel(collections, 'collection', `Collections by ${group.name}`, Library) : null}

                    {activeTab === 'members' ? (
                        <section className={styles.contentSection}>
                            <div className={styles.sectionHeading}><div><span>Members</span><h1>{formatNumber(memberCount)} people</h1></div></div>
                            {members.length ? <div className={styles.memberGrid}>{members.map(name => <Link to={`/users/${name}`} key={name}><Avatar username={name} size={44} /><span><strong>{name}</strong><GroupTag username={name} compact linked={false} /><small>Member of {group.tag}</small></span></Link>)}</div> : data.membershipLive ? <EmptyState icon={Users} title="No members yet">Members will appear here after they join.</EmptyState> : null}
                            {!members.length && !data.membershipLive ? <EmptyState icon={Users} title={`${formatNumber(memberCount)} members`}>{user ? 'The member directory is private.' : 'Join this group to browse its member directory.'}</EmptyState> : null}
                        </section>
                    ) : null}

                    {activeTab === 'support' ? (
                        <div className={styles.supportSections}>
                            <section className={styles.contentSection}>
                                <div className={styles.sectionHeading}><div><span>Fundraisers</span><h1>Support {group.name}</h1></div></div>
                                {campaigns.length ? <div className={styles.cardGrid}>{campaigns.map(campaign => <article className={styles.dataCard} key={campaign.id}><span className={styles.cardType}><HeartHandshake size={14} /> {campaign.status === 'ACTIVE' ? 'Accepting support' : campaign.status}</span><h2>{campaign.title}</h2><p>{campaign.description}</p><div className={styles.progress}><i style={{width: `${Math.min(100, (campaign.raised_credits / campaign.goal_credits) * 100)}%`}} /></div><small>{formatNumber(campaign.raised_credits)} of {formatNumber(campaign.goal_credits)} credits</small>{campaign.status === 'ACTIVE' ? <div className={styles.fund}><input min="0.01" step="0.01" type="number" aria-label={`Credits for ${campaign.title}`} placeholder="Credits" value={amounts[campaign.id] || ''} onChange={event => setAmounts({...amounts, [campaign.id]: event.target.value})} /><Button busy={busy === campaign.id} onClick={() => contribute(campaign)}>Contribute</Button></div> : null}</article>)}</div> : <EmptyState icon={HeartHandshake} title="No active fundraisers">You can still support this group through its Rotur page.</EmptyState>}
                            </section>
                            {products.length ? <section className={styles.contentSection}><div className={styles.sectionHeading}><div><span>Memberships</span><h1>Join in another way</h1></div></div><div className={styles.cardGrid}>{products.map(product => <article className={styles.dataCard} key={product.id}><span className={styles.cardType}><Coins size={14} /> {formatNumber(product.price_credits || product.price)} credits</span><h2>{product.name || product.title}</h2><p>{product.description}</p><a href={roturGroupUrl} target="_blank" rel="noreferrer">Purchase on Rotur <ExternalLink size={13} /></a></article>)}</div></section> : null}
                            {announcements.length || events.length ? <section className={styles.contentSection}><div className={styles.sectionHeading}><div><span>Updates</span><h1>From the group</h1></div></div><div className={styles.cardGrid}>{announcements.map(item => <article className={styles.dataCard} key={item.id}><span className={styles.cardType}><Megaphone size={14} /> Announcement</span><h2>{item.title}</h2><p>{item.body}</p></article>)}{events.map(item => <article className={styles.dataCard} key={item.id}><span className={styles.cardType}><CalendarDays size={14} /> Event</span><h2>{item.title}</h2><p>{item.description}</p></article>)}</div></section> : null}
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
                            <p className={styles.description}>{group.description || 'No description yet.'}</p>
                            <div className={styles.stats}>
                                <button type="button" onClick={() => selectTab('members')}><Users size={16} /><strong>{formatNumber(memberCount)}</strong><span>members</span></button>
                                <span><Coins size={16} /><strong>{formatNumber(group.credits_balance)}</strong><span>credits</span></span>
                            </div>
                            <div className={styles.actions}>
                                {!member ? <Button busy={busy === 'join'} onClick={() => membership('join')}>{group.join_policy === 'REQUEST' ? 'Request to join' : 'Join group'}</Button> : null}
                                {member ? <Button variant={representing ? 'secondary' : 'primary'} busy={busy === 'represent'} busyLabel="Saving…" onClick={toggleRepresentation}>{representing ? 'Stop representing' : 'Represent group'}</Button> : null}
                                {data.isMember && !manager ? <Button variant="secondary" busy={busy === 'leave'} onClick={() => membership('leave')}>Leave group</Button> : null}
                            </div>
                            {representing ? <p className={styles.representing}><ShieldCheck size={15} /> Shown with your identity across MistWarp</p> : null}
                            <div className={styles.externalLinks}>
                                <a href={roturGroupUrl} target="_blank" rel="noreferrer"><ExternalLink size={15} /> View on rotur.dev</a>
                                {manager ? <a href={roturGroupUrl} target="_blank" rel="noreferrer"><ShieldCheck size={15} /> Manage group</a> : null}
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
