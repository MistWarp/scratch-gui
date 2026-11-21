/* eslint-disable max-len */
import PropTypes from 'prop-types';
import React, {useCallback, useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import {ArrowLeft, CircleCheck, CircleDot, MessageSquare, RotateCcw, SearchX} from 'lucide-react';
import {useCommunityIntl as useCommunityText} from '../../i18n.jsx';
import api from '../../api';
import {timeAgo} from '../../format';
import useLatest from '../../use-latest.js';
import {useUser} from '../../UserContext.jsx';
import projectRealtime from '../../project-realtime.js';
import {
    canChangeIssue, commentIssueNumber, commentIssueState, issueThreads, issueTitle, mergeCommentUpdate
} from '../../comment-issues.js';
import Avatar from '../../components/Avatar.jsx';
import RichText from '../../components/RichText.jsx';
import UserLink from '../../components/UserLink.jsx';
import Button from '../../components/ui/Button.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import StatusMessage from '../../components/ui/StatusMessage.jsx';
import styles from '../ProjectCode.module.css';

const ThreadComment = ({comment, first}) => {
    const {text: communityText} = useCommunityText();
    return (
        <article
            id={`issue-comment-${comment.id}`}
            className={first ? styles.issueComment : `${styles.issueComment} ${styles.issueReply}`}
        >
            <UserLink username={comment.author}><Avatar
                username={comment.author}
                size={first ? 36 : 28}
            /></UserLink>
            <div>
                <header>
                    <UserLink username={comment.author}>{comment.author}</UserLink>
                    <span>{first ?
                        communityText('opened this {value1}', {value1: timeAgo(comment.created)}) :
                        timeAgo(comment.created)}</span>
                </header>
                <p><RichText text={comment.content} /></p>
            </div>
        </article>
    );
};

ThreadComment.propTypes = {
    comment: PropTypes.shape({
        author: PropTypes.string,
        content: PropTypes.string,
        created: PropTypes.number,
        id: PropTypes.string
    }).isRequired,
    first: PropTypes.bool
};

const IssueThread = ({id, baseUrl, number, project, onChange}) => {
    const {text: communityText} = useCommunityText();
    const {user} = useUser();
    const [thread, setThread] = useState(null);
    const [missing, setMissing] = useState(false);
    const [loadError, setLoadError] = useState(false);
    const [reply, setReply] = useState('');
    const [busy, setBusy] = useState('');
    const [actionError, setActionError] = useState('');
    const beginLoad = useLatest();

    const load = useCallback(() => {
        const fresh = beginLoad();
        setLoadError(false);
        setMissing(false);
        api.getComments(id, {all: true, issue: 'any', number})
            .then(fresh(result => {
                const found = issueThreads(result.comments).find(item => commentIssueNumber(item.root) === number);
                setThread(found || null);
                setMissing(!found);
            }))
            .catch(fresh(() => setLoadError(true)));
    }, [beginLoad, id, number]);

    useEffect(() => {
        setThread(null);
        load();
    }, [load]);

    const rootId = thread ? thread.root.id : '';
    useEffect(() => {
        if (!rootId) return;
        const key = new URLSearchParams(window.location.search).get('k') || '';
        return projectRealtime.subscribe(id, event => {
            if (event.type === 'comment_created' && event.comment && event.comment.parent === rootId) {
                setThread(current => (current && !current.replies.some(item => item.id === event.comment.id) ?
                    {...current, replies: [...current.replies, event.comment]} : current));
                return;
            }
            if (event.type === 'comment_edited' && event.comment) {
                setThread(current => {
                    if (!current) return current;
                    if (current.root.id === event.comment.id) {
                        return {...current, root: mergeCommentUpdate(current.root, event.comment)};
                    }
                    return {
                        ...current,
                        replies: current.replies.map(item => (item.id === event.comment.id ?
                            mergeCommentUpdate(item, event.comment) : item))
                    };
                });
                return;
            }
            if (event.type === 'comment_deleted' && event.commentId) {
                if (event.commentId === rootId) {
                    setThread(null);
                    setMissing(true);
                    return;
                }
                setThread(current => (current ?
                    {...current, replies: current.replies.filter(item => item.id !== event.commentId)} : current));
            }
        }, key);
    }, [id, rootId]);

    const changeState = async state => {
        if (!thread || busy) return;
        setBusy(state);
        setActionError('');
        try {
            const result = await api.setCommentIssue(id, thread.root.id, state);
            if (result && result.comment) {
                setThread(current => (current ? {...current, root: mergeCommentUpdate(current.root, result.comment)} : current));
            }
            if (onChange) onChange();
        } catch (e) {
            setActionError(e.message || communityText('Could not update the issue.'));
        } finally {
            setBusy('');
        }
    };

    const sendReply = async event => {
        event.preventDefault();
        const content = reply.trim();
        if (!thread || !content || busy) return;
        setBusy('reply');
        setActionError('');
        try {
            const created = await api.addComment(id, content, thread.root.id);
            const comment = created && created.comment;
            if (comment) {
                setThread(current => (current && !current.replies.some(item => item.id === comment.id) ?
                    {...current, replies: [...current.replies, comment]} : current));
            }
            setReply('');
        } catch (e) {
            setActionError(e.message || communityText('Could not post reply.'));
        } finally {
            setBusy('');
        }
    };

    const backLink = (
        <Link
            className={styles.issueBack}
            to={`${baseUrl}/code/issues`}
        ><ArrowLeft size={16} />{communityText('All issues')}</Link>
    );

    if (loadError) {
        return (
            <section className={styles.issueThread}>
                {backLink}
                <StatusMessage
                    error
                    onRetry={load}
                >{communityText('Could not load this issue.')}</StatusMessage>
            </section>
        );
    }
    if (missing) {
        return (
            <section className={styles.issueThread}>
                {backLink}
                <EmptyState
                    icon={SearchX}
                    title={communityText('Issue not found')}
                >{communityText('It may have been deleted or turned back into a plain comment.')}</EmptyState>
            </section>
        );
    }
    if (!thread) return <StatusMessage>{communityText('Loading issue…')}</StatusMessage>;

    const {root, replies} = thread;
    const state = commentIssueState(root);
    const canChange = canChangeIssue(root, user, project.isOwner);
    const canReply = Boolean(user) && !project.commentsOff;
    const title = issueTitle(root.content) || communityText('Issue #{value1}', {value1: number});

    return (
        <section className={styles.issueThread}>
            {backLink}
            <header className={styles.issueHead}>
                <h2>{title} <span>{`#${number}`}</span></h2>
                <div className={styles.issueMeta}>
                    <span className={state === 'done' ? `${styles.issueState} ${styles.issueStateDone}` : styles.issueState}>
                        {state === 'done' ? <CircleCheck size={15} /> : <CircleDot size={15} />}
                        {state === 'done' ? communityText('Done') : communityText('Open')}
                    </span>
                    <span>
                        {state === 'done' && root.issue.closedBy ?
                            communityText('{value1} marked this done {value2}', {
                                value1: root.issue.closedBy,
                                value2: timeAgo(root.issue.closedAt)
                            }) :
                            communityText('{value1} opened this {value2}', {value1: root.author, value2: timeAgo(root.created)})}
                    </span>
                    <span><MessageSquare size={14} />{replies.length === 1 ?
                        communityText('1 reply') : communityText('{value1} replies', {value1: replies.length})}</span>
                </div>
            </header>
            <div className={styles.issueComments}>
                <ThreadComment
                    first
                    comment={root}
                />
                {replies.map(item => (
                    <ThreadComment
                        key={item.id}
                        comment={item}
                    />
                ))}
            </div>
            {actionError ? <StatusMessage error>{actionError}</StatusMessage> : null}
            {canReply || canChange ? (
                <form
                    className={styles.issueComposer}
                    onSubmit={sendReply}
                >
                    {canReply ? (
                        <textarea
                            value={reply}
                            maxLength={500}
                            rows={3}
                            disabled={busy === 'reply'}
                            aria-label={communityText('Reply to this issue')}
                            placeholder={communityText('Reply to this issue')}
                            onChange={event => setReply(event.target.value)}
                        />
                    ) : null}
                    <div className={styles.issueComposerActions}>
                        {canChange && state === 'open' ? (
                            <Button
                                type="button"
                                variant="secondary"
                                busy={busy === 'done'}
                                busyLabel={communityText('Saving…')}
                                onClick={() => changeState('done')}
                            ><CircleCheck size={16} />{communityText('Mark as done')}</Button>
                        ) : null}
                        {canChange && state === 'done' ? (
                            <Button
                                type="button"
                                variant="secondary"
                                busy={busy === 'open'}
                                busyLabel={communityText('Saving…')}
                                onClick={() => changeState('open')}
                            ><RotateCcw size={16} />{communityText('Reopen issue')}</Button>
                        ) : null}
                        {canReply ? (
                            <Button
                                type="submit"
                                variant="primary"
                                busy={busy === 'reply'}
                                busyLabel={communityText('Posting…')}
                                disabled={!reply.trim()}
                            >{communityText('Reply')}</Button>
                        ) : null}
                    </div>
                </form>
            ) : null}
            <Link
                className={styles.issueBack}
                to={`${baseUrl}#comment-id-${root.id}`}
            >{communityText('See it with the other comments')}</Link>
        </section>
    );
};

IssueThread.propTypes = {
    baseUrl: PropTypes.string.isRequired,
    id: PropTypes.string.isRequired,
    number: PropTypes.number.isRequired,
    onChange: PropTypes.func,
    project: PropTypes.shape({
        commentsOff: PropTypes.bool,
        isOwner: PropTypes.bool
    }).isRequired
};

export default IssueThread;
