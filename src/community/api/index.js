import {exchangeValidator, friendlyError, loadSession, request, storeSession} from '../../lib/community/api.js';
import warpthemeApi from '../../lib/warptheme-api.js';
import account from './account.js';
import admin from './admin.js';
import bounties from './bounties.js';
import classroom from './classroom.js';
import comments from './comments.js';
import feedback from './feedback.js';
import games from './games.js';
import git from './git.js';
import news from './news.js';
import projects from './projects.js';
import roadmap from './roadmap.js';
import spaces from './spaces.js';
import stats from './stats.js';
import support from './support.js';
import users from './users.js';
import {editorUrl, embedUrl, projectUrl, themeCustomFor} from './urls.js';

const api = {
    ...account,
    ...support,
    ...stats,
    ...projects,
    ...games,
    ...warpthemeApi,
    ...users,
    ...comments,
    admin,
    ...news,
    ...feedback,
    ...spaces,
    ...roadmap,
    ...git,
    ...bounties,
    classroom,
    request
};

export default api;
export {
    editorUrl, embedUrl, projectUrl, loadSession, storeSession, exchangeValidator,
    request, themeCustomFor, friendlyError
};
