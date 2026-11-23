import PropTypes from 'prop-types';
import React from 'react';
import {Link} from 'react-router-dom';
import {GitFork, RefreshCw} from 'lucide-react';
import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
import {remixDivergenceSentence, remixParentLabel} from '../remix-origin.js';
import MergeConflicts from './MergeConflicts.jsx';
import Button from './ui/Button.jsx';
import Notice from './ui/Notice.jsx';
import styles from './ForkStatus.module.css';

const ForkStatus = ({canContribute, canSync, contributeHref, gitHead, hasUncommitted, projectId, remixFrom, sync}) => {
    const {text: communityText} = useCommunityText();
    const {busy, error, notice, session, cancel, chooseBinary, dismissNotice, resolve, updateText} = sync;
    const startSync = sync.sync;
    const original = remixParentLabel(remixFrom);
    const hintId = `fork-sync-hint-${projectId}`;
    const canSyncUnknown = typeof remixFrom.behind !== 'number' &&
        Boolean(remixFrom.head && gitHead && remixFrom.head !== gitHead);
    const showSync = canSync && (remixFrom.behind > 0 || canSyncUnknown) && !session;
    // eslint-disable-next-line max-len
    const conflictLead = communityText('This remix and {value1} changed the same files. Edit the text conflicts and choose which version of each asset to keep.', {value1: original});

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
                        onClick={startSync}
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
            {notice ? <Notice variant="success" onDismiss={dismissNotice}>{notice}</Notice> : null}
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
                    headingLevel="h2"
                    onTextChange={updateText}
                    onChoose={chooseBinary}
                    onSubmit={resolve}
                    actions={(
                        <Button
                            disabled={busy}
                            onClick={cancel}
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
    gitHead: PropTypes.string,
    hasUncommitted: PropTypes.bool,
    projectId: PropTypes.string.isRequired,
    remixFrom: PropTypes.shape({
        ahead: PropTypes.number,
        behind: PropTypes.number,
        head: PropTypes.string,
        owner: PropTypes.string,
        title: PropTypes.string
    }).isRequired,
    sync: PropTypes.shape({
        busy: PropTypes.bool,
        error: PropTypes.string,
        notice: PropTypes.string,
        session: PropTypes.object,
        sync: PropTypes.func,
        resolve: PropTypes.func,
        cancel: PropTypes.func,
        updateText: PropTypes.func,
        chooseBinary: PropTypes.func,
        dismissNotice: PropTypes.func
    }).isRequired
};

export default ForkStatus;
