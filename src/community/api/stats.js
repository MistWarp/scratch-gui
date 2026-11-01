import {request} from '../../lib/community/api.js';

export default {
    publicStats: (days = 30) => request(`/stats?days=${encodeURIComponent(days)}`),
    leaderboard: by => request(`/leaderboard?by=${by}`)
};
