/* eslint-disable max-len */
import PropTypes from 'prop-types';
import React, {useCallback, useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import {CircleCheck, CircleDot, MessageSquare, Plus, Search} from 'lucide-react';
import {useCommunityIntl as useCommunityText} from '../../i18n.jsx';
import api from '../../api';
import {timeAgo} from '../../format';
import useLatest from '../../use-latest.js';
import {useUser} from '../../UserContext.jsx';
import {commentIssueNumber, issueThreads, issueTitle} from '../../comment-issues.js';
import Avatar from '../../components/Avatar.jsx';
import UserLink from '../../components/UserLink.jsx';
import Button from '../../components/ui/Button.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import StatusMessage from '../../components/ui/StatusMessage.jsx';
import projectStyles from '../Project.module.css';
import styles from '../ProjectCode.module.css';

const NewIssue = ({id, onCreated, onCancel}) => {
    const {text: communityText} = useCommunityText();
    const [text, setText] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const submit = async event => {
        event.preventDefault();
        const content = text.trim();
        if (!content || busy) return;
        setBusy(true);
        setError('');
        try {
            const created = await api.addComment(id, content, '');
            const comment = created && created.comment ? created.comment : created;
            if (!comment || !comment.id) throw new Error(communityText('Could not open the issue.'));
            const tracked = await api.setCommentIssue(id, comment.id, 'open');
            onCreated(tracked && tracked.comment ? tracked.comment : comment);
        } catch (e) {
            setError(e.message || communityText('Could not open the issue.'));
            setBusy(false);
        }
    };
    return (
        <form className={styles.issueComposer} onSubmit={submit}>
            <textarea
                value={text}
                maxLength={500}
                rows={4}
                disabled={busy}
                aria-label={communityText('Describe the issue')}
                placeholder={communityText('Describe the bug or idea. It is posted as a comment on the project.')}
                onChange={event => setText(event.target.value)}
            />
            {error ? <StatusMessage error>{error}</StatusMessage> : null}
            <div className={styles.issueComposerActions}>
                <Button
                    type="button"
                    variant="secondary"
                    disabled={busy}
                    onClick={onCancel}
                >{communityText('Cancel')}</Button>
                <Button
                    type="submit"
                    variant="primary"
                    busy={busy}
                    busyLabel={communityText('Opening…')}
                    disabled={!text.trim()}
                ><CircleDot size={16} />{communityText('Open issue')}</Button>
            </div>
        </form>
    );
};

NewIssue.propTypes = {
    id: PropTypes.string.isRequired,
    onCancel: PropTypes.func.isRequired,
    onCreated: PropTypes.func.isRequired
};

const IssueList = ({id, baseUrl, project, onCounts}) => {
    const {text: communityText} = useCommunityText();
    const {user} = useUser();
    const [state, setState] = useState('open');
    const [query, setQuery] = useState('');
    const [data, setData] = useState(null);
    const [loadError, setLoadError] = useState(false);
    const [composing, setComposing] = useState(false);
    const beginLoad = useLatest();

    const reload = useCallback(() => {
        const fresh = beginLoad();
        setData(null);
        setLoadError(false);
        api.getComments(id, {all: true, issue: state})
            .then(fresh(result => {
                setData({threads: issueThreads(result.comments), counts: result.issueCounts || null});
                if (onCounts && result.issueCounts) onCounts(result.issueCounts);
            }))
            .catch(fresh(() => setLoadError(true)));
    }, [beginLoad, id, onCounts, state]);

    useEffect(() => {
        reload();
    }, [reload]);

    const canOpen = Boolean(user) && !project.issuesOff && !project.commentsOff;
    const counts = (data && data.counts) || {open: 0, done: 0};
    const needle = query.trim().toLowerCase();
    const threads = data ? data.threads.filter(({root}) => !needle ||
        `${root.content} ${root.author} ${commentIssueNumber(root)}`.toLowerCase().includes(needle)) : [];
    const issueUrl = number => `${baseUrl}/code/issues/${number}`;

    return (
        <section className={projectStyles.pullBrowser}>
            <div className={projectStyles.pullTools}>
                <label>
                    <Search size={16} />
                    <input
                        value={query}
                        placeholder={communityText('Search issues')}
                        onChange={event => setQuery(event.target.value)}
                    />
                </label>
                {canOpen && !composing ? (
                    <Button
                        variant="primary"
                        onClick={() => setComposing(true)}
                    ><Plus size={16} />{communityText('New issue')}</Button>
                ) : null}
            </div>
            {composing ? (
                <NewIssue
                    id={id}
                    onCancel={() => setComposing(false)}
                    onCreated={() => {
                        setComposing(false);
                        if (state === 'open') reload();
                        else setState('open');
                    }}
                />
            ) : null}
            <div className={projectStyles.pullList}>
                <header>
                    <button
                        type="button"
                        aria-pressed={state === 'open'}
                        className={state === 'open' ? projectStyles.pullStateActive : ''}
                        onClick={() => setState('open')}
                    ><CircleDot size={16} />{communityText('{value1} open', {value1: counts.open})}</button>
                    <button
                        type="button"
                        aria-pressed={state === 'done'}
                        className={state === 'done' ? projectStyles.pullStateActive : ''}
                        onClick={() => setState('done')}
                    ><CircleCheck size={16} />{communityText('{value1} done', {value1: counts.done})}</button>
                </header>
                {loadError ? (
                    <StatusMessage
                        error
                        onRetry={reload}
                    >{communityText('Could not load issues.')}</StatusMessage>
                ) : !data ? (
                    <StatusMessage>{communityText('Loading issues…')}</StatusMessage>
                ) : threads.length ? threads.map(({root, replies}) => {
                    const number = commentIssueNumber(root);
                    const latest = replies[replies.length - 1];
                    return (
                        <article
                            key={root.id}
                            className={styles.issueRow}
                        >
                            {state === 'open' ?
                                <CircleDot
                                    className={projectStyles.pullOpen}
                                    size={18}
                                /> :
                                <CircleCheck
                                    className={projectStyles.pullClosed}
                                    size={18}
                                />}
                            <div>
                                <Link to={issueUrl(number)}>{issueTitle(root.content) || communityText('Issue #{value1}', {value1: number})}</Link>
                                <span>
                                    {communityText('#{value1} opened {value2} by', {value1: number, value2: timeAgo(root.created)})}
                                    {' '}
                                    <UserLink username={root.author}><Avatar
                                        username={root.author}
                                        size={18}
                                    /></UserLink>
                                    {' '}
                                    <UserLink username={root.author}>{root.author}</UserLink>
                                </span>
                                {latest ? (
                                    <Link
                                        className={styles.issueLatest}
                                        to={issueUrl(number)}
                                    >
                                        <b>{latest.author}</b>
                                        <span>{issueTitle(latest.content, 160)}</span>
                                    </Link>
                                ) : null}
                            </div>
                            <span
                                className={projectStyles.pullComments}
                                aria-label={replies.length === 1 ? communityText('1 reply') : communityText('{value1} replies', {value1: replies.length})}
                            ><MessageSquare size={14} /> {replies.length}</span>
                        </article>
                    );
                }) : (
                    <EmptyState
                        compact
                        icon={state === 'open' ? CircleDot : CircleCheck}
                        className={projectStyles.pullEmpty}
                        title={needle ? communityText('No issues match your search') : state === 'open' ?
                            communityText('No open issues') : communityText('No finished issues')}
                    >
                        {project.issuesOff ?
                            communityText('The creator has turned off issues for this project.') :
                            communityText('Any comment can become an issue. Its author or the project team can track it from the comment menu.')}
                    </EmptyState>
                )}
            </div>
        </section>
    );
};

IssueList.propTypes = {
    baseUrl: PropTypes.string.isRequired,
    id: PropTypes.string.isRequired,
    onCounts: PropTypes.func,
    project: PropTypes.shape({
        commentsOff: PropTypes.bool,
        issuesOff: PropTypes.bool
    }).isRequired
};

export default IssueList;
