import {canViewProjectSource} from '../../project-source-access';

const ACTIVITY_TABS = ['Comments', 'Files', 'Reviews', 'Version control', 'Bounties', 'Contribute'];
export const activityTabsFor = project => ACTIVITY_TABS.filter(name =>
    canViewProjectSource(project) || !['Files', 'Version control', 'Contribute'].includes(name));
export const VERSION_CONTROL_HASHES = {
    '#history': 'history',
    '#branches': 'branches',
    '#pull-requests': 'pulls',
    '#releases': 'releases'
};
const ACTIVITY_HASHES = {
    '#files': 'Files',
    '#reviews': 'Reviews',
    '#bounties': 'Bounties',
    '#contribute': 'Contribute'
};
export const activityTabForHash = hash => (
    VERSION_CONTROL_HASHES[hash] ? 'Version control' : ACTIVITY_HASHES[hash] || 'Comments'
);
// The address hash for a tab, so a tab can be linked to. Comments, the default, has none.
export const activityHash = (tab, versionControlTab) => {
    const hashes = tab === 'Version control' ? VERSION_CONTROL_HASHES : ACTIVITY_HASHES;
    const value = tab === 'Version control' ? versionControlTab : tab;
    return Object.keys(hashes).find(hash => hashes[hash] === value) || '';
};
export const initialActivityTab = () => activityTabForHash(window.location.hash);
export const initialVersionControlTab = () => VERSION_CONTROL_HASHES[window.location.hash] || 'history';
