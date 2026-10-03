import React from 'react';
import {useLocation} from 'react-router-dom';
import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
import tokenStyles from '../styles/tokens.module.css';
import ExploreHeader from './ExploreHeader.jsx';
import StatusMessage from './ui/StatusMessage.jsx';
import styles from './RouteLoading.module.css';

// Shown by the route-level Suspense boundary while a lazily loaded page chunk
// is still downloading. Explore sections share one header and tab row, so when
// the destination is one of them we keep that shell on screen and only let the
// content area show the loading state.
const SECTION_LEADS = {
    studios: 'A shared place where curators organise projects and accept submissions.',
    challenges: 'A timed event where people make projects around a prompt.',
    collections: 'A curated project list with submissions closed by default.',
    groups: 'Organisations that share projects, spaces, members, and funding.',
    bounties: 'Funded improvements open across public MistWarp projects.',
    themes: 'Discover community-made looks for MistWarp.',
    mine: 'Spaces you own, curate, follow, or have been invited to.'
};

const getExploreSection = (pathname, search) => {
    if (pathname === '/explore') return {active: 'projects', lead: null};
    if (pathname === '/groups') return {active: 'groups', lead: 'groups'};
    if (pathname === '/bounties') return {active: 'bounties', lead: 'bounties'};
    if (pathname === '/themes') return {active: 'themes', lead: 'themes'};
    if (pathname === '/spaces') {
        const kind = new URLSearchParams(search).get('kind');
        if (kind === 'challenge') return {active: 'challenges', lead: 'challenges'};
        if (kind === 'collection') return {active: 'collections', lead: 'collections'};
        if (kind === 'mine') return {active: 'studios', lead: 'mine'};
        return {active: 'studios', lead: 'studios'};
    }
    return null;
};

const RouteLoading = () => {
    const {text: communityText} = useCommunityText();
    const {pathname, search} = useLocation();
    const section = getExploreSection(pathname, search);
    if (!section) {
        return (
            <p className={tokenStyles['mw-route-loading']} role="status">
                {communityText('Loading page…')}
            </p>
        );
    }
    return (
        <main className={styles.page}>
            <ExploreHeader
                active={section.active}
                lead={section.lead ? communityText(SECTION_LEADS[section.lead]) : null}
            />
            <StatusMessage />
        </main>
    );
};

export {getExploreSection, SECTION_LEADS};
export default RouteLoading;
