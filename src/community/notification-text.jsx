import React from 'react';
import {projectUrl} from './api';
import {postUrl} from './following-feed.js';
import {isMilestoneNotification, milestoneLink, milestoneText} from './milestone-notifications.js';
import {formatDate} from './format.js';

// Shared by the notifications page and the Home preview so both describe and
// link notifications the same way.

export const SYSTEM_TYPES = [
    'standing', 'moderation', 'project_hidden', 'project_restored', 'news', 'report_update',
    'post_milestone', 'claw_weekly_recap', 'claw_teen_lock',
    'classroom_retention_warning', 'classroom_turned_in', 'classroom_released', 'classroom_co_teacher',
    'classroom_transferred', 'classroom_returned'
];

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
    if (!n.projectId && (n.post_id || n.original_post_id)) return {to: postUrl(n.post_id || n.original_post_id)};
    if (GROUP_TYPES.includes(n.type) && groupUrl(n)) return {href: groupUrl(n)};
    if (n.spaceId) return {to: `/spaces/${n.spaceId}${commentAnchor(n)}`};
    if (n.roadmapId) return {to: `/roadmap#idea-${n.roadmapId}`};
    if (n.projectId && n.pull) return {to: `/project/${n.projectId}/pulls/${n.pull}${commentAnchor(n)}`};
    if (n.projectId) return {to: `${projectUrl(n.projectId)}${commentAnchor(n)}`};
    if (n.type === 'profile_comment' || n.profile) {
        return {to: `/users/${n.profile || viewerName}${commentAnchor(n)}`};
    }
    if (n.type === 'news') return {to: n.newsId ? `/news/${encodeURIComponent(n.newsId)}` : '/news'};
    if (typeof n.type === 'string' && n.type.startsWith('classroom_')) {
        const classPath = n.classId ? `/classroom/${encodeURIComponent(n.classId)}` : '/classroom';
        return {to: n.classId && n.assignmentId ?
            `${classPath}/assignments/${encodeURIComponent(n.assignmentId)}` : classPath};
    }
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
    t.text = (message, values) => String(translate(message, values));
    return t;
};

const reportOutcome = (action, t) => {
    switch (action) {
    case 'dismiss': return t('Your report was reviewed; no action was taken.');
    case 'warn_user': return t('Your report was actioned with a warning.');
    case 'ban_user': return t('Your report was actioned with a ban.');
    case 'unshare_project': return t('Your report was actioned; the project was unshared.');
    case 'hide_project': return t('Your report was actioned; the project was hidden.');
    default: return t('Your report was reviewed.');
    }
};

// Describes a notification as a whole translated sentence. `t` comes from
// richTranslator; `actor` is the node rendered for {actor} (unused by
// system notifications, which have no actor).
const count = value => {
    const number = Math.floor(Number(value));
    return Number.isFinite(number) && number > 0 ? number : 0;
};

export const describeNotification = (n, t, actor) => {
    if (isMilestoneNotification(n)) return t.plain(milestoneText(n));
    if (n.type === 'post_milestone') {
        return count(n.milestone) ?
            t('Your post passed {count, plural, one {# view} other {# views}}', {count: count(n.milestone)}) :
            t('Your post is reaching more people');
    }
    if (n.type === 'claw_weekly_recap') {
        const {text} = t;
        const summary = [
            text('{count, plural, one {# view} other {# views}}', {count: count(n.views)}),
            text('{count, plural, one {# pounce} other {# pounces}}', {count: count(n.pounces)}),
            text('{count, plural, one {# new follower} other {# new followers}}', {
                count: count(n.new_followers)
            })
        ].join(', ');
        return t('Your week on claw: {summary}', {summary});
    }
    if (n.type === 'claw_teen_lock') {
        return typeof n.body === 'string' && n.body.trim() ? t.plain(n.body) : t('Your claw settings changed');
    }
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
    case 'pounce': return t('{actor} pounced your post', {actor});
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
    case 'project_hidden':
        if (project) {
            return n.reason ?
                t('A moderator hid {project}: {reason}', {project, reason: n.reason}) :
                t('A moderator hid {project}.', {project});
        }
        return n.reason ?
            t('A moderator hid your project: {reason}', {reason: n.reason}) :
            t('A moderator hid your project.');
    case 'project_restored': return project ?
        t('A moderator restored {project}.', {project}) :
        t('A moderator restored your project.');
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
    case 'classroom_retention_warning': return t(
        // eslint-disable-next-line max-len
        '{className} will be deleted on {date} because no teacher has opened it for 11 months. Open the class to keep it.',
        {className: strong(n.className || t.text('A class')), date: formatDate(n.deleteAt, t.text('a date soon'))}
    );
    case 'classroom_turned_in': return n.assignmentTitle ?
        t('{student} turned in {assignment}', {
            student: strong(n.studentName || t.text('A student')),
            assignment: strong(n.assignmentTitle)
        }) :
        t('{student} turned in an assignment', {student: strong(n.studentName || t.text('A student'))});
    case 'classroom_released': return t('{student} moved to their own account from {className}', {
        student: strong(n.studentName || t.text('A student')),
        className: strong(n.className || '')
    });
    case 'classroom_co_teacher': return t('You were added as a co-teacher of {className}', {
        className: strong(n.className || '')
    });
    case 'classroom_transferred': return t('You are now the owner of {className}', {
        className: strong(n.className || '')
    });
    case 'classroom_returned': return n.assignmentTitle ?
        t('Your teacher returned {assignment}', {assignment: strong(n.assignmentTitle)}) :
        t('Your teacher returned your work');
    default: {
        const body = stripSender(actorFor(n), n.body || n.content || '');
        return body ?
            t('{actor} {message}', {actor, message: body}) :
            t('{actor} sent you a notification', {actor});
    }
    }
};

export const groupVerbs = translate => ({
    like: translate('liked'),
    love: translate('loved'),
    pounce: translate('pounced'),
    repost: translate('reposted'),
    remix: translate('remixed'),
    comment: translate('commented on'),
    reply: translate('replied to')
});

export const joinList = (parts, locale) => {
    if (typeof Intl !== 'undefined' && typeof Intl.ListFormat === 'function') {
        try {
            const lang = !locale || locale === 'en' ? 'en-GB' : locale;
            return new Intl.ListFormat(lang, {style: 'long', type: 'conjunction'}).format(parts);
        } catch (e) {
            return parts.join(', ');
        }
    }
    return parts.join(', ');
};

export const describeGroup = (row, t, actor, actions) => {
    const first = row.items.find(item => item.projectTitle);
    const project = first && row.targets.length === 1 ? <strong>{first.projectTitle}</strong> : null;
    if (row.object === 'mixed') return t('{actor} {actions} your posts and projects', {actor, actions});
    if (row.object === 'projects') {
        if (project) return t('{actor} {actions} {project}', {actor, actions, project});
        return row.targets.length === 1 ?
            t('{actor} {actions} your project', {actor, actions}) :
            t('{actor} {actions} your projects', {actor, actions});
    }
    return row.targets.length === 1 ?
        t('{actor} {actions} your post', {actor, actions}) :
        t('{actor} {actions} your posts', {actor, actions});
};

export const describeStack = (row, t, actor, other) => {
    const others = row.actors.length - 1;
    const two = others === 1;
    const first = row.items[0];
    const project = first.projectTitle ? <strong>{first.projectTitle}</strong> : null;
    const space = <strong>{first.spaceTitle}</strong>;
    switch (row.type) {
    case 'like': return two ?
        t('{actor} and {other} liked your post', {actor, other}) :
        t('{actor} and {count, plural, one {# other} other {# others}} liked your post', {actor, count: others});
    case 'repost': return two ?
        t('{actor} and {other} reposted your post', {actor, other}) :
        t('{actor} and {count, plural, one {# other} other {# others}} reposted your post', {actor, count: others});
    case 'pounce': return two ?
        t('{actor} and {other} pounced your post', {actor, other}) :
        t('{actor} and {count, plural, one {# other} other {# others}} pounced your post', {actor, count: others});
    case 'follow': return two ?
        t('{actor} and {other} followed you', {actor, other}) :
        t('{actor} and {count, plural, one {# other} other {# others}} followed you', {actor, count: others});
    case 'challenge_join': return two ?
        t('{actor} and {other} joined {space}', {actor, other, space}) :
        t('{actor} and {count, plural, one {# other} other {# others}} joined {space}', {actor, count: others, space});
    default:
        if (project) {
            return two ?
                t('{actor} and {other} loved {project}', {actor, other, project}) :
                t('{actor} and {count, plural, one {# other} other {# others}} loved {project}',
                    {actor, count: others, project});
        }
        return two ?
            t('{actor} and {other} loved your project', {actor, other}) :
            t('{actor} and {count, plural, one {# other} other {# others}} loved your project',
                {actor, count: others});
    }
};

export const describeAction = (n, t) => {
    const project = n.projectTitle ? <strong>{n.projectTitle}</strong> : null;
    switch (n.type) {
    case 'like': return t('Liked your post');
    case 'pounce': return t('Pounced your post');
    case 'repost': return t('Reposted your post');
    case 'reply': return t('Replied to your post');
    case 'love': return project ? t('Loved {project}', {project}) : t('Loved your project');
    case 'comment': return project ? t('Commented on {project}', {project}) : t('Commented on your project');
    case 'remix': return project ? t('Remixed {project}', {project}) : t('Remixed your project');
    default: return null;
    }
};
