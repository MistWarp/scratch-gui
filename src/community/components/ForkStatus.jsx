import PropTypes from 'prop-types';
import React, {useState} from 'react';
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

const ForkStatus = ({canContribute, canSync, contributeHref, hasUncommitted, onSynced, projectId, remixFrom}) => {
    const {text: communityText} = useCommunityText();
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [session, setSession] = useState(null);
    const original = remixParentLabel(remixFrom);
    const showSync = canSync && remixFrom.behind > 0 && !session;
    // eslint-disable-next-line max-len
    const conflictLead = communityText('This remix and {value1} changed the same files. Edit the text conflicts and choose which version of each asset to keep.', {value1: original});

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
            if (data.merge.alreadyMerged) {
                setNotice(communityText('This remix already has every change from {value1}.', {value1: original}));
                if (onSynced) await onSynced();
                return;
            }
            const prepared = await materializeMerge(data);
            if (prepared.conflicts.length || prepared.binaryConflicts.length) {
                setSession({...prepared, data});
            } else {
                await upload(data, prepared.files);
            }
        } catch (syncError) {
            setError(syncError.message || communityText('Could not sync this remix.'));
        } finally {
            setBusy(false);
        }
    };

    const resolve = async () => {
        if (!session || busy) return;
        setBusy(true);
        setError('');
        try {
            const unresolved = unresolvedBinaryConflict(session);
            if (unresolved) throw new Error(communityText('Choose a version for {value1}.', {value1: unresolved.path}));
            await upload(session.data, resolvedMergeFiles(session));
        } catch (resolveError) {
            setError(resolveError.message || communityText('Could not sync this remix.'));
        } finally {
            setBusy(false);
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
                        onClick={sync}
                    >
                        <RefreshCw size={14} />
                        {communityText('Sync with original')}
                    </Button>
                ) : null}
            </div>
            {showSync && hasUncommitted ? (
                <p className={styles.hint}>
                    {communityText('Commit your saved changes in the editor before syncing, so they are not replaced.')}
                </p>
            ) : null}
            {error ? <Notice variant="error">{error}</Notice> : null}
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
                    onTextChange={(path, content) => setSession(current => withTextResolution(current, path, content))}
                    onChoose={(path, choice) => setSession(current => withBinaryChoice(current, path, choice))}
                    onSubmit={resolve}
                    actions={(
                        <Button disabled={busy} onClick={() => setSession(null)}>
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
