import {request} from './api.js';

export const fetchCommunityNotifications = () => request('/notifications', {cache: false});

export const markCommunityNotificationsRead = () => request('/notifications/read', {method: 'POST'});
