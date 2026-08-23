/* eslint-disable react/jsx-no-bind, react/jsx-no-literals, max-len */
import React, {useEffect, useMemo, useState} from 'react';
import PropTypes from 'prop-types';
import api from '../../community/api';
import CommentThread from '../../community/components/CommentThread.jsx';
import styles from './mw-project-activity.css';

const MwProjectActivity = ({projectId}) => {
    const [tab, setTab] = useState('comments');
    const [pulls, setPulls] = useState(null);
    const source = useMemo(() => ({
        list: () => api.getComments(projectId),
        add: (content, parent, kind) => api.addComment(projectId, content, parent, kind),
        remove: commentId => api.deleteComment(projectId, commentId),
        react: (commentId, type) => api.reactComment(projectId, commentId, type)
    }), [projectId]);

    useEffect(() => {
        if (tab !== 'pulls') return;
        api.pulls(projectId).then(data => setPulls(data.pulls || []))
            .catch(() => setPulls([]));
    }, [tab, projectId]);

    return (
        <div className={styles.page}>
            <div className={styles.tabs}>
                <button
                    type="button"
                    className={tab === 'comments' ? styles.active : ''}
                    onClick={() => setTab('comments')}
                >Comments</button>
                <button
                    type="button"
                    className={tab === 'pulls' ? styles.active : ''}
                    onClick={() => setTab('pulls')}
                >Pull requests</button>
            </div>
            {tab === 'comments' ? <CommentThread
                projectComments
                source={source}
                reportContext={`project ${projectId}`}
            /> : null}
            {tab === 'pulls' && pulls === null ? <p>Loading pull requests…</p> : null}
            {tab === 'pulls' && pulls && !pulls.length ? <p>No pull requests.</p> : null}
            {tab === 'pulls' && pulls ? (
                <ul className={styles.pulls}>
                    {pulls.map(pull => <li key={pull.index}><strong>#{pull.index} {pull.title}</strong><span>{pull.user} · {pull.state}</span></li>)}
                </ul>
            ) : null}
        </div>
    );
};

MwProjectActivity.propTypes = {
    projectId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired
};

export default MwProjectActivity;
