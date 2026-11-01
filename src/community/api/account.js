import {request, loadSession, storeSession, logout} from '../../lib/community/api.js';
import {fetchCommunityNotifications, markCommunityNotificationsRead} from '../../lib/community/notifications.js';
import {SLOW_GET_TIMEOUT} from './query.js';

export default {
    loadSession,
    storeSession,
    logout,
    me: () => request('/me'),
    perks: () => request('/perks'),
    refreshPerks: () => request('/perks/refresh', {method: 'POST'}),
    perksSeen: () => request('/perks/seen', {method: 'POST'}),
    quota: () => request('/me/quota'),
    stats: () => request('/me/stats'),
    settings: {
        get: () => request('/me/settings'),
        put: settings => request('/me/settings', {method: 'PUT', body: settings})
    },
    exportMyData: () => request('/me/export', {timeoutMs: SLOW_GET_TIMEOUT}),
    deleteMyData: username => request('/me/data', {method: 'DELETE', body: {username}}),
    safety: () => request('/me/safety'),
    blockUser: name => request(`/me/blocks/${encodeURIComponent(name)}`, {method: 'POST'}),
    unblockUser: name => request(`/me/blocks/${encodeURIComponent(name)}`, {method: 'DELETE'}),
    muteUser: name => request(`/me/mutes/${encodeURIComponent(name)}`, {method: 'POST'}),
    unmuteUser: name => request(`/me/mutes/${encodeURIComponent(name)}`, {method: 'DELETE'}),
    notifications: fetchCommunityNotifications,
    checkFollowerMilestones: name => request(`/milestones/followers/${encodeURIComponent(name)}`, {method: 'POST'}),
    checkPostMilestones: id => request(`/milestones/posts/${encodeURIComponent(id)}`, {method: 'POST'}),
    checkThemeMilestones: id => request(`/milestones/themes/${encodeURIComponent(id)}`, {method: 'POST'}),
    readNotifications: markCommunityNotificationsRead,
    updateProfile: patch => request('/me/profile', {method: 'PUT', body: patch})
};
