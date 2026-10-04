/* eslint-disable max-len */
import React, {useEffect, useRef, useState} from 'react';
import {Link} from 'react-router-dom';
import {History} from 'lucide-react';
import {useCommunityIntl as useCommunityText} from '../../i18n.jsx';
import api, {projectUrl} from '../../api';
import {buildSb3FromFileEntries} from '../../../lib/git/mwp.js';
import GitGraph from '../../components/GitGraph.jsx';
import ConfirmModal from '../../components/ui/ConfirmModal.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Notice from '../../components/ui/Notice.jsx';
import StatusMessage from '../../components/ui/StatusMessage.jsx';
import UserLink from '../../components/UserLink.jsx';
import styles from '../Project.module.css';

const HistoryList = ({id, history, canRestore, onChange, baseUrl}) => {
    const {text: communityText} = useCommunityText();
    const [restoring, setRestoring] = useState(null);
    const [restoreError, setRestoreError] = useState(null);
    const [restoreCandidate, setRestoreCandidate] = useState(null);
    const restoreLocks = useRef(new Set());
    const idRef = useRef(id);
    idRef.current = id;
    useEffect(() => {
        restoreLocks.current.clear();
        setRestoring(null);
        setRestoreError(null);
        setRestoreCandidate(null);
    }, [id]);
    const requestRestore = commit => {
        if (restoring) return;
        setRestoreError(null);
        setRestoreCandidate(commit);
    };
    const restore = async commit => {
        const actionId = id;
        const lockId = `${actionId}\u0000${commit.sha}`;
        if (restoreLocks.current.has(lockId)) return;
        restoreLocks.current.add(lockId);
        setRestoring(commit.sha);
        setRestoreError(null);
        try {
            const {project} = await api.getProject(actionId);
            if (!project.gitHead) throw new Error('This project does not have server-side history');
            const tree = await api.commitTree(actionId, commit.sha);
            const files = await Promise.all((tree.files || []).map(async file => {
                const result = await api.commitFile(actionId, commit.sha, file.path);
                const binary = atob(result.content || '');
                const data = new Uint8Array(binary.length);
                for (let index = 0; index < binary.length; index++) data[index] = binary.charCodeAt(index);
                return {path: file.path, data};
            }));
            const sb3 = await buildSb3FromFileEntries(files);
            await api.uploadProject(actionId, sb3, null, null, {
                expectedHead: project.gitHead,
                restoreCommit: commit.sha,
                restoreMessage: `Restored version ${commit.sha.slice(0, 7)}`
            });
            if (idRef.current !== actionId) return;
            setRestoreCandidate(null);
            if (onChange) await onChange();
        } catch (error) {
            if (idRef.current === actionId) {
                setRestoreError(error.message || 'Could not restore this version.');
            }
        } finally {
            restoreLocks.current.delete(lockId);
            if (idRef.current === actionId) setRestoring(null);
        }
    };
    if (!history) return <StatusMessage />;
    if (history.error) {
        return <StatusMessage error onRetry={onChange}>{communityText('Could not load version history.')}</StatusMessage>;
    }
    const commits = history.commits || [];
    if (!commits.length) {
        return (
            <EmptyState icon={History} title={communityText('No version history yet')}>
                {communityText('Saved versions of this project will appear here.')}
            </EmptyState>
        );
    }
    if (history.graph?.nodes?.length) {
        return (
            <>
                {restoreError ? <Notice variant="error" className={styles.pageNotice}>{restoreError}</Notice> : null}
                <GitGraph
                    projectId={id}
                    graph={history.graph}
                    currentBranch={history.branch}
                    onRestore={canRestore ? requestRestore : null}
                    restoring={restoring}
                />
                {restoreCandidate ? (
                    <ConfirmModal
                        icon={History}
                        title={communityText('Restore this version?')}
                        confirmLabel={communityText('Restore version')}
                        busy={Boolean(restoring)}
                        busyLabel={communityText('Restoring…')}
                        error={restoreError}
                        onConfirm={() => restore(restoreCandidate)}
                        onCancel={() => setRestoreCandidate(null)}
                    >
                        {communityText('{value1} will become the current project. Newer versions will stay in the history.', {
                            value1: (restoreCandidate.message || communityText('Saved version')).split('\n')[0]
                        })}
                    </ConfirmModal>
                ) : null}
            </>
        );
    }
    return (
        <React.Fragment>
            <ul className={styles.commitList}>
                {commits.map(commit => (
                    <li key={commit.sha}>
                        <Link className={styles.commitLink} to={`${baseUrl || projectUrl(id)}/commits/${commit.sha}`}>
                            <code>{commit.sha.slice(0, 7)}</code>
                            <span className={styles.commitMsg}>{commit.message.split('\n')[0]}</span>
                        </Link>
                        <UserLink className={styles.muted} username={commit.author}>{commit.author}</UserLink>
                    </li>
                ))}
            </ul>
        </React.Fragment>
    );
};

export default HistoryList;
