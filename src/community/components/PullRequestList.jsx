import PropTypes from 'prop-types';
import React from 'react';
import {Link} from 'react-router-dom';
import {GitMerge, GitPullRequest, GitPullRequestDraft, MessageCircle} from 'lucide-react';

import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
import {PULL_STATE_LABELS, pullState, pullTimestamp} from '../development.js';
import {timeAgo} from '../format.js';
import styles from './PullRequestList.module.css';

const STATE_ICONS = {
    open: GitPullRequest,
    draft: GitPullRequestDraft,
    merged: GitMerge,
    closed: GitPullRequest,
    unknown: GitPullRequest
};

const PullRequestRow = ({pull, entry}) => {
    const {text: communityText} = useCommunityText();
    const state = pullState(pull);
    const Icon = STATE_ICONS[state];
    const when = pullTimestamp(pull.mergedAt) || pullTimestamp(pull.updatedAt);
    return (
        <li className={styles.row}>
            <span className={`${styles.state} ${styles[state]}`}>
                <Icon size={13} />
                {communityText(PULL_STATE_LABELS[state])}
            </span>
            <span className={styles.body}>
                <a className={styles.title} href={pull.url} target="_blank" rel="noreferrer noopener">
                    {pull.title}
                </a>
                <span className={styles.meta}>
                    <span className={styles.repo}>
                        {pull.repo} <span className={styles.number}>{`#${pull.number}`}</span>
                    </span>
                    {pull.author ? (
                        <a className={styles.author} href={pull.authorUrl} target="_blank" rel="noreferrer noopener">
                            {pull.authorAvatar ? <img src={pull.authorAvatar} alt="" width={16} height={16} /> : null}
                            {pull.author}
                        </a>
                    ) : null}
                    {when ? <span>{timeAgo(when)}</span> : null}
                    {pull.comments ? (
                        <span className={styles.comments}>
                            <MessageCircle size={13} />{pull.comments}
                        </span>
                    ) : null}
                    {entry ? (
                        <Link className={styles.entry} to={`/roadmap/entry/${encodeURIComponent(entry._id)}`}>
                            {entry.title}
                        </Link>
                    ) : null}
                </span>
            </span>
        </li>
    );
};

PullRequestRow.propTypes = {
    entry: PropTypes.shape({_id: PropTypes.string, title: PropTypes.string}),
    pull: PropTypes.shape({
        author: PropTypes.string,
        authorAvatar: PropTypes.string,
        authorUrl: PropTypes.string,
        comments: PropTypes.number,
        mergedAt: PropTypes.string,
        number: PropTypes.number,
        repo: PropTypes.string,
        title: PropTypes.string,
        updatedAt: PropTypes.string,
        url: PropTypes.string
    }).isRequired
};

const PullRequestList = ({pulls, entryFor, className}) => (
    <ul className={[styles.list, className].filter(Boolean).join(' ')}>
        {pulls.map(pull => (
            <PullRequestRow key={pull.id} pull={pull} entry={entryFor ? entryFor(pull) : null} />
        ))}
    </ul>
);

PullRequestList.propTypes = {
    className: PropTypes.string,
    entryFor: PropTypes.func,
    pulls: PropTypes.arrayOf(PropTypes.object).isRequired
};

PullRequestList.defaultProps = {
    className: '',
    entryFor: null
};

export {PullRequestRow};
export default PullRequestList;
