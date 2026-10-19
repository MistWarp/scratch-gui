import {isMilestoneNotification} from './milestone-notifications.js';
import {SYSTEM_TYPES, actorFor} from './notification-text.jsx';
import {timestampMs} from './following-feed.js';

export const GROUP_WINDOW = 60 * 60 * 1000;
export const STACK_WINDOW = 24 * 60 * 60 * 1000;

const CLAW_NOTICE_TYPES = ['post_milestone', 'claw_weekly_recap', 'claw_teen_lock'];

const CLAW_POST_TYPES = ['like', 'reply', 'repost', 'pounce', 'mention'];

const ACTION_ORDER = ['like', 'love', 'pounce', 'repost', 'remix', 'comment', 'reply'];

const STACK_TYPES = ['like', 'repost', 'pounce', 'love', 'follow', 'challenge_join'];

export const CONVERSATION_TYPES = [
    'reply', 'mention', 'comment', 'profile_comment', 'space_comment', 'roadmap_comment'
];

export const notificationTime = n => timestampMs(n && (n.created || n.timestamp));

export const clawPostId = n => {
    const id = n && (n.post_id || n.original_post_id);
    return typeof id === 'string' && id ? id : null;
};

const isClawPost = n => !n.projectId && CLAW_POST_TYPES.includes(n.type) && Boolean(clawPostId(n));

export const isSystemNotification = n => isMilestoneNotification(n) || SYSTEM_TYPES.includes(n.type);

export const surfaceOf = n => {
    if (n.timelineType === 'following-post') return 'claw';
    if (isClawPost(n) || n.type === 'follow' || CLAW_NOTICE_TYPES.includes(n.type)) return 'claw';
    if (SYSTEM_TYPES.includes(n.type)) return 'system';
    return 'projects';
};

export const isConversation = n => CONVERSATION_TYPES.includes(n.type);

export const matchesFilter = (n, filter) => {
    if (!filter || filter === 'all') return true;
    if (filter === 'mentions') return n.timelineType !== 'following-post' && isConversation(n);
    return surfaceOf(n) === filter;
};

export const groupActor = n => {
    if (isSystemNotification(n)) return null;
    if (n.type === 'follow' && n.follower) return String(n.follower);
    const actor = n.user && isClawPost(n) ? n.user : actorFor(n);
    return actor ? String(actor) : null;
};

export const targetKey = n => {
    if (isClawPost(n)) return `post:${clawPostId(n)}`;
    if (n.type === 'follow') return 'you';
    if (n.projectId) return `project:${n.projectId}`;
    if (n.spaceId) return `space:${n.spaceId}`;
    return null;
};

const canCluster = n => {
    if (isClawPost(n)) return n.type !== 'mention';
    return ['love', 'comment', 'remix'].includes(n.type) && Boolean(n.projectId) && !n.pull;
};

const canStack = n => STACK_TYPES.includes(n.type) && Boolean(targetKey(n)) &&
    (n.type !== 'love' || Boolean(n.projectId));

export const excerptOf = n => {
    if (!n || !isConversation(n)) return '';
    const text = [n.preview, n.content].find(value => typeof value === 'string' && value.trim());
    return text ? text.trim() : '';
};

const sameActor = (a, b) => Boolean(a && b) && a.toLowerCase() === b.toLowerCase();

const single = n => ({kind: 'single', items: [n], time: notificationTime(n)});

const finishCluster = cluster => {
    if (cluster.items.length === 1) return single(cluster.items[0]);
    const types = ACTION_ORDER.filter(type => cluster.items.some(item => item.type === type));
    const targets = [...new Set(cluster.items.map(targetKey))];
    const surfaces = new Set(cluster.items.map(item => (isClawPost(item) ? 'posts' : 'projects')));
    const conversation = cluster.items.find(item => isConversation(item));
    if (types.length === 1 && targets.length === 1 && !conversation) return single(cluster.items[0]);
    return {
        kind: 'actor',
        actor: cluster.actor,
        items: cluster.items,
        types,
        targets,
        object: surfaces.size > 1 ? 'mixed' : [...surfaces][0],
        excerpt: cluster.items.map(excerptOf).find(Boolean) || '',
        conversation: conversation || null,
        time: cluster.time
    };
};

const clusterByActor = items => {
    const rows = [];
    let open = null;
    const close = () => {
        if (open) rows.push(finishCluster(open));
        open = null;
    };
    for (const n of items) {
        const actor = groupActor(n);
        const time = notificationTime(n);
        if (open && actor && sameActor(open.actor, actor) && open.time - time <= GROUP_WINDOW) {
            if (canCluster(n)) {
                open.items.push(n);
            } else {
                rows.push(single(n));
            }
            continue;
        }
        if (open && actor && !sameActor(open.actor, actor)) close();
        if (open && open.time - time > GROUP_WINDOW) close();
        if (actor && canCluster(n)) {
            close();
            open = {actor, time, items: [n]};
        } else {
            rows.push(single(n));
        }
    }
    close();
    return rows;
};

const stackSingles = rows => {
    const out = [];
    const stacks = new Map();
    for (const row of rows) {
        const n = row.items[0];
        if (row.kind !== 'single' || !canStack(n) || !groupActor(n)) {
            out.push(row);
            continue;
        }
        const key = `${n.type}|${targetKey(n)}`;
        const stack = stacks.get(key);
        if (stack && stack.time - row.time <= STACK_WINDOW) {
            stack.items.push(n);
            if (!stack.actors.some(actor => sameActor(actor, groupActor(n)))) stack.actors.push(groupActor(n));
            continue;
        }
        const next = {
            kind: 'stack',
            type: n.type,
            target: targetKey(n),
            actors: [groupActor(n)],
            items: [n],
            time: row.time
        };
        stacks.set(key, next);
        out.push(next);
    }
    return out.map(row => (row.kind === 'stack' && row.actors.length === 1 ? single(row.items[0]) : row));
};

export const sortNewestFirst = items => items
    .map((item, index) => ({item, index, time: notificationTime(item)}))
    .sort((a, b) => (b.time - a.time) || (a.index - b.index))
    .map(entry => entry.item);

const stableKey = row => {
    const oldest = row.items[row.items.length - 1];
    return `${row.kind}:${oldest.id || notificationTime(oldest)}`;
};

export const groupNotifications = (items, {cluster = true} = {}) => {
    const sorted = sortNewestFirst((items || []).filter(Boolean));
    const rows = cluster ? stackSingles(clusterByActor(sorted)) : sorted.map(single);
    return rows
        .map((row, index) => ({row: {...row, key: stableKey(row)}, index}))
        .sort((a, b) => (b.row.time - a.row.time) || (a.index - b.index))
        .map(entry => entry.row);
};
