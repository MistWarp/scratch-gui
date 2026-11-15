import {local} from '../modules/storage';

const RECENT_PLAYS_KEY = 'mw:recent-plays';
const MAX_RECENT_PLAYS = 12;

const validPlay = item => Boolean(item && typeof item === 'object' && typeof item.id === 'string' && item.id);

export const recentPlays = () => {
    const stored = local.readJSON(RECENT_PLAYS_KEY, []);
    return Array.isArray(stored) ? stored.filter(validPlay) : [];
};

export const rememberPlay = (project, now = Date.now()) => {
    if (!project || !project.id || project.shared !== true || project.visibility !== 'public') return;
    const entry = {
        id: project.id,
        title: project.title || '',
        owner: project.owner || '',
        thumbUrl: project.thumbUrl || '',
        vanitySlug: project.vanitySlug || '',
        edited: Number(project.edited) || 0,
        lastPlayed: now
    };
    const rest = recentPlays().filter(item => item.id !== project.id);
    local.writeJSON(RECENT_PLAYS_KEY, [entry, ...rest].slice(0, MAX_RECENT_PLAYS));
};

export const updatedSincePlayed = project => {
    const edited = Number(project && project.edited);
    const lastPlayed = Number(project && project.lastPlayed);
    return edited > 0 && lastPlayed > 0 && edited > lastPlayed;
};
