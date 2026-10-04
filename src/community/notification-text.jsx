import React from 'react';
import {projectUrl} from './api';
import {isMilestoneNotification, milestoneLink, milestoneText} from './milestone-notifications.js';

// Shared by the notifications page and the Home preview so both describe and
// link notifications the same way.

export const SYSTEM_TYPES = ['standing', 'moderation', 'news', 'report_update'];

export const GROUP_TYPES = [
    'group_invite',
    'group_request_accepted',
    'group_request_declined',
    'group_kicked',
    'group_banned',
    'group_ownership_transferred'
];

// Rotur / usernames follow this shape; titles that don't match are app
// messages rather than account names.
export const USERNAME_RE = /^[A-Za-z0-9][A-Za-z0-9_-]{0,19}$/;

const escapeRegex = s => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Generic notifications carry the sender in `title` (MistWarp posts
// title = actor) and the full sentence in `body`; drop the duplicated
// prefix so "shima" + "shima commented on your project" reads cleanly.
export const stripSender = (sender, text) => {
    if (!sender || !text) {
        return text;
    }
    return text.replace(new RegExp(`^${escapeRegex(sender)}[\\s:.,\\u2014-]*`, 'i'), '');
};

// Prefer a username-shaped title (real actor) over the app account that
// posted the notification ("MistWarp"). Returns null when no actor is known.
export const actorFor = n => {
    const title = typeof n.title === 'string' ? n.title : '';
    if (title && USERNAME_RE.test(title) && title.toLowerCase() !== 'mistwarp') {
        return title;
    }
    return n.actor || n.from || title || null;
};

export const commentAnchor = n => (n.commentId ? `#comment-id-${n.commentId}` : '');

const groupUrl = n => (n.group_tag ? `https://rotur.dev/groups/${encodeURIComponent(n.group_tag)}` : null);

// Where a notification leads: {to} for in-app routes, {href} for external
// pages, or null when there is nothing to open.
export const targetFor = (n, viewerName) => {
    if (isMilestoneNotification(n)) return {to: milestoneLink(n)};
    if (GROUP_TYPES.includes(n.type) && groupUrl(n)) return {href: groupUrl(n)};
    if (n.spaceId) return {to: `/spaces/${n.spaceId}${commentAnchor(n)}`};
    if (n.roadmapId) return {to: `/roadmap#idea-${n.roadmapId}`};
    if (n.projectId && n.pull) return {to: `/project/${n.projectId}/pulls/${n.pull}${commentAnchor(n)}`};
    if (n.projectId) return {to: `${projectUrl(n.projectId)}${commentAnchor(n)}`};
    if (n.type === 'profile_comment' || n.profile) {
        return {to: `/users/${n.profile || viewerName}${commentAnchor(n)}`};
    }
    if (n.type === 'news') return {to: n.newsId ? `/news/${encodeURIComponent(n.newsId)}` : '/news'};
    return null;
};

const OPEN = '';
const CLOSE = '';
const MARKER = /(\w+)/;

// Keeps the spaces around a linked run outside the link.
const wrapRun = (run, wrap, key) => {
    if (!run.some(part => typeof part !== 'string' || part.trim())) return run;
    const before = typeof run[0] === 'string' ? run[0].match(/^\s*/)[0] : '';
    const last = run[run.length - 1];
    const after = typeof last === 'string' ? last.match(/\s*$/)[0] : '';
    const inner = run.map((part, index) => {
        if (typeof part !== 'string') return part;
        let text = part;
        if (index === 0) text = text.slice(before.length);
        if (index === run.length - 1 && after) text = text.slice(0, text.length - after.length);
        return text;
    }).filter(part => part !== '');
    return [before, React.cloneElement(wrap(inner), {key}), after].filter(Boolean);
};

// Wraps a translator so values may be React nodes (linked names, emphasis).
// Nodes stand in as markers while the whole sentence is translated, and the
// result is split back around them, so translators can reorder placeholders.
// With `wrap`, the text around the {actor} placeholder becomes a link
// (wrap(children)) while the actor keeps its own link.
export const richTranslator = (translate, wrap) => {
    const assemble = (text, nodes) => {
        // A capture group makes split() alternate between text and marker names.
        const pieces = String(text).split(MARKER);
        const parts = [];
        let run = [];
        const flush = () => {
            parts.push(...(wrap ? wrapRun(run, wrap, `run-${parts.length}`) : run));
            run = [];
        };
        pieces.forEach((piece, index) => {
            if (index % 2 === 0) {
                if (piece) run.push(piece);
                return;
            }
            const node = nodes[piece] ? React.cloneElement(nodes[piece], {key: `${piece}-${index}`}) : piece;
            if (piece === 'actor') {
                flush();
                parts.push(node);
            } else {
                run.push(node);
            }
        });
        flush();
        return parts;
    };
    const t = (message, values = {}) => {
        const nodes = {};
        const formatted = {};
        Object.keys(values).forEach(name => {
            if (React.isValidElement(values[name])) {
                nodes[name] = values[name];
                formatted[name] = `${OPEN}${name}${CLOSE}`;
            } else {
                formatted[name] = values[name];
            }
        });
        return assemble(translate(message, formatted), nodes);
    };
    // Text that is already translated or written by someone (a moderator's
    // message), laid out like a translated sentence.
    t.plain = text => assemble(text, {});
    return t;
};

const reportOutcome = (action, t) => {
    switch (action) {
    case 'dismiss': return t('Your report was reviewed; no action was taken.');
    case 'warn_user': return t('Your report was actioned with a warning.');
    case 'ban_user': return t('Your report was actioned with a ban.');
    case 'unshare_project': return t('Your report was actioned; the project was unshared.');
    default: return t('Your report was reviewed.');
    }
};

// Describes a notification as a whole translated sentence. `t` comes from
// richTranslator; `actor` is the node rendered for {actor} (unused by
// system notifications, which have no actor).
export const describeNotification = (n, t, actor) => {
    if (isMilestoneNotification(n)) return t.plain(milestoneText(n));
    const strong = value => <strong>{value}</strong>;
    const project = n.projectTitle ? strong(n.projectTitle) : null;
    const pull = n.pull ? String(n.pull) : '';
    const space = strong(n.spaceTitle);
    const group = strong(n.group_name);
    const amount = Number(n.amount) || 0;
    switch (n.type) {
    case 'project_shared': return project ?
        t('{actor} shared {project} with you', {actor, project}) :
        t('{actor} shared a project with you', {actor});
    case 'love': return project ?
        t('{actor} loved {project}', {actor, project}) :
        t('{actor} loved your project', {actor});
    case 'comment':
        if (pull) {
            return project ?
                t('{actor} commented on PR #{pull} in {project}', {actor, pull, project}) :
                t('{actor} commented on PR #{pull}', {actor, pull});
        }
        return project ?
            t('{actor} commented on {project}', {actor, project}) :
            t('{actor} commented on your project', {actor});
    case 'profile_comment': return t('{actor} commented on your profile', {actor});
    case 'reply':
        if (n.post_id) return t('{actor} replied to your post', {actor});
        if (pull) {
            return project ?
                t('{actor} replied to your comment on PR #{pull} in {project}', {actor, pull, project}) :
                t('{actor} replied to your comment on PR #{pull}', {actor, pull});
        }
        return project ?
            t('{actor} replied to your comment on {project}', {actor, project}) :
            t('{actor} replied to your comment', {actor});
    case 'purchase':
        if (amount) {
            return project ?
                t('{actor} bought {project} for {amount, plural, one {# credit} other {# credits}}',
                    {actor, project, amount}) :
                t('{actor} bought your project for {amount, plural, one {# credit} other {# credits}}',
                    {actor, amount});
        }
        return project ?
            t('{actor} bought {project}', {actor, project}) :
            t('{actor} bought your project', {actor});
    case 'donation': return amount ?
        t('{actor} donated {amount, plural, one {# credit} other {# credits}} to you', {actor, amount}) :
        t('{actor} donated credits to you', {actor});
    case 'remix': return project ?
        t('{actor} remixed {project}', {actor, project}) :
        t('{actor} remixed your project', {actor});
    case 'follow': return t('{actor} followed you', {actor});
    case 'mention':
        if (n.post_id) return t('{actor} mentioned you in a post', {actor});
        if (pull) {
            return project ?
                t('{actor} mentioned you on PR #{pull} in {project}', {actor, pull, project}) :
                t('{actor} mentioned you on PR #{pull}', {actor, pull});
        }
        return project ?
            t('{actor} mentioned you on {project}', {actor, project}) :
            t('{actor} mentioned you in a comment', {actor});
    case 'like': return t('{actor} liked your post', {actor});
    case 'repost': return t('{actor} reposted your post', {actor});
    case 'group_invite': return t('{actor} invited you to join {group}', {actor, group});
    case 'group_request_accepted': return t('{actor} accepted your request to join {group}', {actor, group});
    case 'group_request_declined': return t('{actor} declined your request to join {group}', {actor, group});
    case 'group_kicked': return t('{actor} removed you from {group}', {actor, group});
    case 'group_banned': return t('{actor} banned you from {group}', {actor, group});
    case 'group_ownership_transferred': return t('{actor} transferred {group} to you', {actor, group});
    case 'cosmetic_gift': return t('{actor} sent you {item}', {actor, item: strong(n.cosmetic_name)});
    case 'item_received': return t('{actor} sent you {item}', {actor, item: strong(n.item_name)});
    case 'item_sold': return t('{actor} bought {item} from you', {actor, item: strong(n.item_name)});
    case 'item_purchased': return t('You bought {item} from {actor}', {actor, item: strong(n.item_name)});
    case 'standing': return n.reason ?
        t('Your account standing is now {level}: {reason}', {level: strong(n.level), reason: n.reason}) :
        t('Your account standing is now {level}.', {level: strong(n.level)});
    case 'moderation': return n.message ?
        t.plain(n.message) :
        t('A moderator sent you a message.');
    case 'news': return t('New announcement: {title}', {title: strong(n.title)});
    case 'report_update': return reportOutcome(n.action, t);
    case 'contribution':
        if (pull) {
            return project ?
                t('{actor} sent changes for {project} in PR #{pull}', {actor, pull, project}) :
                t('{actor} sent changes in PR #{pull}', {actor, pull});
        }
        return project ?
            t('{actor} sent changes for {project}', {actor, project}) :
            t('{actor} sent changes', {actor});
    case 'contribution_merged':
        if (pull) {
            return project ?
                t('{actor} merged changes for {project} in PR #{pull}', {actor, pull, project}) :
                t('{actor} merged changes in PR #{pull}', {actor, pull});
        }
        return project ?
            t('{actor} merged changes for {project}', {actor, project}) :
            t('{actor} merged changes', {actor});
    case 'space_project': return project ?
        t('{actor} added {project} to {space}', {actor, project, space}) :
        t('{actor} added a project to {space}', {actor, space});
    case 'space_comment': return t('{actor} commented on {space}', {actor, space});
    case 'space_curator_invite': return t('{actor} invited you to curate {space}', {actor, space});
    case 'space_curator_accepted': return t('{actor} accepted your invitation to curate {space}', {actor, space});
    case 'space_curator_declined': return t('{actor} declined your invitation to curate {space}', {actor, space});
    case 'space_curator_removed': return t('{actor} removed you as a curator of {space}', {actor, space});
    case 'challenge_judge_invite': return t('{actor} invited you to judge {space}', {actor, space});
    case 'challenge_judge_accepted': return t('{actor} accepted your invitation to judge {space}', {actor, space});
    case 'challenge_join': return t('{actor} joined {space}', {actor, space});
    case 'project_feedback': return project ?
        t('{actor} sent feedback for {project}', {actor, project}) :
        t('{actor} sent feedback for your project', {actor});
    case 'project_review': return project ?
        t('{actor} rated {project} {rating} out of 5', {actor, project, rating: Number(n.rating) || 0}) :
        t('{actor} rated your project {rating} out of 5', {actor, rating: Number(n.rating) || 0});
    case 'roadmap_comment': return n.roadmapTitle ?
        t('{actor} commented on {suggestion}', {actor, suggestion: strong(n.roadmapTitle)}) :
        t('{actor} commented on your suggestion', {actor});
    default: {
        const body = stripSender(actorFor(n), n.body || n.content || '');
        return body ?
            t('{actor} {message}', {actor, message: body}) :
            t('{actor} sent you a notification', {actor});
    }
    }
};
