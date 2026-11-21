import {sameUser} from './format';

export const ISSUE_FILTERS = ['open', 'done'];

export const commentIssueState = comment => {
    const state = comment && comment.issue && comment.issue.state;
    return state === 'open' || state === 'done' ? state : '';
};

export const commentIssueNumber = comment => {
    if (!commentIssueState(comment)) return 0;
    const number = Number(comment.issue.number);
    return Number.isFinite(number) && number > 0 ? number : 0;
};

export const issueTitle = (content, limit = 120) => {
    const line = String(content || '').split('\n')
        .map(part => part.trim())
        .find(Boolean) || '';
    return line.length > limit ? `${line.slice(0, limit - 1).trimEnd()}…` : line;
};

export const canChangeIssue = (comment, user, canTriage) => Boolean(user && comment && !comment.parent) &&
    (Boolean(canTriage) || sameUser(comment.author, user.username));

export const mergeCommentUpdate = (comment, update) => {
    const next = {...comment, ...update};
    if (!update || !update.issue) delete next.issue;
    return next;
};

export const issueThreads = comments => {
    const replies = new Map();
    for (const comment of comments || []) {
        if (!comment.parent) continue;
        if (!replies.has(comment.parent)) replies.set(comment.parent, []);
        replies.get(comment.parent).push(comment);
    }
    for (const list of replies.values()) list.sort((a, b) => (a.created || 0) - (b.created || 0));
    return (comments || [])
        .filter(comment => !comment.parent && commentIssueState(comment))
        .sort((a, b) => commentIssueNumber(b) - commentIssueNumber(a))
        .map(root => ({root, replies: replies.get(root.id) || []}));
};
