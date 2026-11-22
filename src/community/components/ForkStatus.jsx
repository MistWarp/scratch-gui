import PropTypes from 'prop-types';
import React, {useEffect, useRef, useState} from 'react';
import {Link} from 'react-router-dom';
import {GitFork, RefreshCw} from 'lucide-react';
import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
import api from '../api';
import {buildProjectArtifactsFromFileEntries} from '../../lib/git/mwp.js';
import {
    materializeMerge, resolvedMergeFiles, unresolvedBinaryConflict, withBinaryChoice, withTextResolution
} from '../merge-session.js';
import {remixDivergenceSentence, remixParentLabel} from '../remix-origin.js';
import MergeConflicts from './MergeConflicts.jsx';
import Button from './ui/Button.jsx';
import Notice from './ui/Notice.jsx';
import styles from './ForkStatus.module.css';

const RESTART_CODES = ['head_changed', 'original_changed', 'uncommitted_changes'];

const ForkStatus = ({canContribute, canSync, contributeHref, hasUncommitted, onSynced, projectId, remixFrom}) => {
    const {text: communityText} = useCommunityText();
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [session, setSession] = useState(null);
    const mounted = useRef(true);
    useEffect(() => () => {
        mounted.current = false;
    }, []);
    const original = remixParentLabel(remixFrom);
    const hintId = `fork-sync-hint-${projectId}`;
    const showSync = canSync && remixFrom.behind > 0 && !session;
    // eslint-disable-next-line max-len
    const conflictLead = communityText('This remix and {value1} changed the same files. Edit the text conflicts and choose which version of each asset to keep.', {value1: original});

    const syncErrorMessage = syncError => {
        if (syncError.code === 'uncommitted_changes') {
            return communityText('Commit your saved changes in the editor before syncing, so they are not replaced.');
        }
        if (syncError.code === 'head_changed') {
            return communityText('This remix changed while it was syncing. Sync again to include the new changes.');
        }
        if (syncError.code === 'original_changed') {
            return communityText(
                '{value1} changed while this remix was syncing. Sync again to get its latest changes.',
                {value1: original}
            );
        }
        return syncError.message || communityText('Could not sync this remix.');
    };

    const fail = async syncError => {
        if (!mounted.current) return;
        setError(syncErrorMessage(syncError));
        if (RESTART_CODES.includes(syncError.code)) {
            setSession(null);
            if (onSynced) await onSynced();
        }
    };

    const upload = async (data, files) => {
        const artifacts = await buildProjectArtifactsFromFileEntries(
            [...files].map(([path, fileData]) => ({path, data: fileData}))
        );
        await api.uploadRemixSync(projectId, {
            sb3: artifacts.sb3,
            mergeTree: artifacts.tree,
            expectedHead: data.expectedHead,
            syncHead: data.sourceHead
        });
        if (!mounted.current) return;
        setSession(null);
        setNotice(communityText('Brought in the latest changes from {value1}.', {value1: original}));
        if (onSynced) await onSynced();
    };

    const sync = async () => {
        if (busy) return;
        setBusy(true);
        setError('');
        setNotice('');
        try {
            const data = await api.syncRemix(projectId);
            if (!mounted.current) return;
            if (data.merge.alreadyMerged) {
                setNotice(communityText('This remix already has every change from {value1}.', {value1: original}));
                if (onSynced) await onSynced();
                return;
            }
            const prepared = await materializeMerge(data);
            if (!mounted.current) return;
            if (prepared.conflicts.length || prepared.binaryConflicts.length) {
                setSession({...prepared, data});
            } else {
                await upload(data, prepared.files);
            }
        } catch (syncError) {
            await fail(syncError);
        } finally {
            if (mounted.current) setBusy(false);
        }
    };

    const resolve = async () => {
        if (!session || busy) return;
        setBusy(true);
        setError('');
        try {
            const unresolved = unresolvedBinaryConflict(session);
            if (unresolved) {
                setError(communityText('Choose a version for {value1}.', {value1: unresolved.path}));
                return;
            }
            await upload(session.data, resolvedMergeFiles(session));
        } catch (resolveError) {
            await fail(resolveError);
        } finally {
            if (mounted.current) setBusy(false);
        }
    };

    return (
        <div className={styles.forkStatusGroup}>
            <div className={styles.forkStatus}>
                <p className={styles.forkMessage}>
                    <GitFork size={15} aria-hidden="true" />
                    <span>{remixDivergenceSentence(remixFrom, communityText)}</span>
                </p>
                {canContribute ? (
                    <Link className={styles.forkAction} to={contributeHref}>
                        {communityText('Contribute')}
                    </Link>
                ) : null}
                {showSync ? (
                    <Button
                        size="small"
                        variant="primary"
                        busy={busy}
                        busyLabel={communityText('Syncing…')}
                        disabled={hasUncommitted}
                        aria-describedby={hasUncommitted ? hintId : null}
                        onClick={sync}
                    >
                        <RefreshCw size={14} />
                        {communityText('Sync with original')}
                    </Button>
                ) : null}
            </div>
            {showSync && hasUncommitted ? (
                <p className={styles.hint} id={hintId}>
                    {communityText('Commit your saved changes in the editor before syncing, so they are not replaced.')}
                </p>
            ) : null}
            {error && !session ? <Notice variant="error">{error}</Notice> : null}
            {notice ? <Notice variant="success" onDismiss={() => setNotice('')}>{notice}</Notice> : null}
            {session ? (
                <MergeConflicts
                    title={communityText('Resolve sync conflicts')}
                    lead={conflictLead}
                    conflicts={session.conflicts}
                    binaryConflicts={session.binaryConflicts}
                    keepLabel={communityText('Keep this remix')}
                    useLabel={communityText('Use the original')}
                    submitLabel={communityText('Save resolutions and sync')}
                    busy={busy}
                    busyLabel={communityText('Syncing…')}
                    error={error}
                    focusOnMount
                    onTextChange={(path, content) => setSession(current => withTextResolution(current, path, content))}
                    onChoose={(path, choice) => setSession(current => withBinaryChoice(current, path, choice))}
                    onSubmit={resolve}
                    actions={(
                        <Button
                            disabled={busy}
                            onClick={() => {
                                setSession(null);
                                setError('');
                            }}
                        >
                            {communityText('Cancel')}
                        </Button>
                    )}
                />
            ) : null}
        </div>
    );
};

ForkStatus.propTypes = {
    canContribute: PropTypes.bool,
    canSync: PropTypes.bool,
    contributeHref: PropTypes.string,
    hasUncommitted: PropTypes.bool,
    onSynced: PropTypes.func,
    projectId: PropTypes.string.isRequired,
    remixFrom: PropTypes.shape({
        ahead: PropTypes.number,
        behind: PropTypes.number,
        owner: PropTypes.string,
        title: PropTypes.string
    }).isRequired
};

export default ForkStatus;
