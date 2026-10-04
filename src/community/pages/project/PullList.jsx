/* eslint-disable max-len */
import React, {useCallback, useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import {GitPullRequest, MessageSquare, Plus, Search} from 'lucide-react';
import {useCommunityIntl as useCommunityText} from '../../i18n.jsx';
import api, {projectUrl} from '../../api';
import {timeAgo} from '../../format';
import useLatest from '../../use-latest.js';
import Avatar from '../../components/Avatar.jsx';
import Button from '../../components/ui/Button.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import StatusMessage from '../../components/ui/StatusMessage.jsx';
import UserLink from '../../components/UserLink.jsx';
import styles from '../Project.module.css';

const PullList = ({id, baseUrl, onCount, onNew}) => {
    const {text: communityText} = useCommunityText();
    const [pulls, setPulls] = useState(null);
    const [loadError, setLoadError] = useState(false);
    const [state, setState] = useState('open');
    const [query, setQuery] = useState('');
    const beginLoad = useLatest();

    const reload = useCallback(() => {
        const fresh = beginLoad();
        setPulls(null);
        setLoadError(false);
        api.pulls(id)
            .then(fresh(d => {
                const loaded = d.pulls || [];
                setPulls(loaded);
                if (onCount) onCount(loaded.filter(pull => pull.state === 'open').length);
            }))
            .catch(fresh(() => setLoadError(true)));
    }, [beginLoad, id, onCount]);

    useEffect(() => {
        reload();
    }, [reload]);

    if (!pulls && !loadError) return <StatusMessage>{communityText('Loading pull requests…')}</StatusMessage>;
    if (loadError) return <StatusMessage error onRetry={reload}>{communityText('Could not load pull requests.')}</StatusMessage>;
    const openCount = pulls.filter(pull => pull.state === 'open').length;
    const closedCount = pulls.length - openCount;
    const needle = query.trim().toLowerCase();
    const filtered = pulls.filter(pull => {
        const stateMatches = state === 'open' ? pull.state === 'open' : pull.state !== 'open';
        return stateMatches && (!needle || `${pull.title} ${pull.user} ${pull.index}`.toLowerCase().includes(needle));
    });
    return (
        <section className={styles.pullBrowser}>
            <div className={styles.pullTools}>
                <label><Search size={16} /><input value={query} placeholder={communityText('Search pull requests')} onChange={event => setQuery(event.target.value)} /></label>
                <Button variant="primary" onClick={onNew}><Plus size={16} />{communityText('New pull request')}</Button>
            </div>
            <div className={styles.pullList}>
                <header>
                    <button type="button" className={state === 'open' ? styles.pullStateActive : ''} onClick={() => setState('open')}><GitPullRequest size={16} />{communityText('{value1} open', {value1: openCount})}</button>
                    <button type="button" className={state === 'closed' ? styles.pullStateActive : ''} onClick={() => setState('closed')}>{communityText('{value1} closed', {value1: closedCount})}</button>
                </header>
                {filtered.length ? filtered.map(pull => (
                    <article key={pull.index} id={`pull-${pull.index}`}>
                        <GitPullRequest className={pull.state === 'open' ? styles.pullOpen : styles.pullClosed} size={18} />
                        <div>
                            <Link to={`${baseUrl || projectUrl(id)}/pulls/${pull.index}`}>{pull.title}</Link>
                            <span>{communityText('#{value1} opened {value2} by', {value1: pull.index, value2: timeAgo(pull.created)})} <UserLink username={pull.user}><Avatar username={pull.user} size={18} /></UserLink> <UserLink username={pull.user}>{pull.user}</UserLink></span>
                        </div>
                        <span className={styles.pullComments}><MessageSquare size={14} /> {pull.commentCount || 0}</span>
                    </article>
                )) : (
                    <EmptyState
                        compact
                        icon={GitPullRequest}
                        className={styles.pullEmpty}
                        title={state === 'open' ? communityText('No open pull requests') : communityText('No closed pull requests')}
                    >
                        {needle ? communityText('No pull requests match your search.') : communityText('Pull requests sent to this project will appear here.')}
                    </EmptyState>
                )}
            </div>
        </section>
    );
};

export default PullList;
