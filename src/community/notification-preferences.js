/* eslint-disable max-len */
const KEY = 'mw:notification-preferences';

const DEFAULTS = {social: true, projects: true, economy: true, system: true};

const getNotificationPreferences = () => {
    try {
        return {...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}')};
    } catch (e) {
        return {...DEFAULTS};
    }
};

const setNotificationPreferences = preferences => {
    try {
        localStorage.setItem(KEY, JSON.stringify({...DEFAULTS, ...preferences}));
        window.dispatchEvent(new Event('mw:notification-preferences'));
    } catch (e) {
        return false;
    }
    return true;
};

const categoryForNotification = type => {
    if (['standing', 'moderation', 'news', 'report_update'].includes(type)) return 'system';
    if (['purchase', 'donation', 'cosmetic_gift', 'item_received', 'item_sold', 'item_purchased'].includes(type)) return 'economy';
    if (['remix', 'contribution', 'project_feedback', 'project_review', 'roadmap_comment', 'space_project', 'space_comment', 'space_curator_invite', 'space_curator_accepted', 'space_curator_declined', 'space_curator_removed', 'release'].includes(type)) return 'projects';
    return 'social';
};

export {getNotificationPreferences, setNotificationPreferences, categoryForNotification};
