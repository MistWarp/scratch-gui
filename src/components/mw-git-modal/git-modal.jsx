import PropTypes from 'prop-types';
import React from 'react';
import {defineMessages, FormattedMessage, injectIntl, intlShape} from 'react-intl';
import {
    Check,
    CirclePlus,
    Download,
    RefreshCcw,
    RotateCcw,
    Trash
} from 'lucide-react';

import Box from '../box/box.jsx';
import Modal from '../../containers/windowed-modal.jsx';

import styles from './git-modal.css';

const messages = defineMessages({
    title: {
        defaultMessage: 'Git',
        description: 'Title of the git window',
        id: 'mw.gitModal.title'
    },
    branchesLabel: {
        defaultMessage: 'Branches',
        description: 'Label for branch list',
        id: 'mw.gitModal.branchesLabel'
    },
    mergeLabel: {
        defaultMessage: 'Merge',
        description: 'Merge section label',
        id: 'mw.gitModal.merge'
    },
    show: {
        defaultMessage: 'Show',
        description: 'Show button',
        id: 'mw.gitModal.show'
    },
    hide: {
        defaultMessage: 'Hide',
        description: 'Hide button',
        id: 'mw.gitModal.hide'
    },
    intoLabel: {
        defaultMessage: 'Into',
        description: 'Merge into branch label',
        id: 'mw.gitModal.merge.into'
    },
    fromLabel: {
        defaultMessage: 'From',
        description: 'Merge from branch label',
        id: 'mw.gitModal.merge.from'
    },
    selectBranch: {
        defaultMessage: 'Select branch',
        description: 'Select branch placeholder',
        id: 'mw.gitModal.merge.selectBranch'
    },
    previewMerge: {
        defaultMessage: 'Preview merge',
        description: 'Preview merge button',
        id: 'mw.gitModal.merge.preview'
    },
    conflictsLabel: {
        defaultMessage: 'Conflicts',
        description: 'Conflicts section label',
        id: 'mw.gitModal.merge.conflicts'
    },
    keepOurs: {
        defaultMessage: 'Keep ours',
        description: 'Keep ours version button',
        id: 'mw.gitModal.merge.keepOurs'
    },
    keepTheirs: {
        defaultMessage: 'Keep theirs',
        description: 'Keep theirs version button',
        id: 'mw.gitModal.merge.keepTheirs'
    },
    mergeApply: {
        defaultMessage: 'Merge',
        description: 'Apply merge button',
        id: 'mw.gitModal.merge.apply'
    }
});

const GitModalComponent = props => {
    const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
    const [deleteConfirmMessage, setDeleteConfirmMessage] = React.useState('');
    const [deleteConfirmAction, setDeleteConfirmAction] = React.useState(null);
    const [pendingDeleteBranchRef, setPendingDeleteBranchRef] = React.useState(null);

    const handleRestoreCommit = props.onRestoreCommit;
    const handleDownloadCommit = props.onDownloadCommit;
    const handleDeleteCurrentBranch = props.onDeleteBranch;

    const handleDeleteRepoClick = () => {
        setDeleteConfirmMessage(
            'Delete this Git repository?\n\nThis removes the repo from this browser session/storage. ' +
            'If you want to keep history, save the project first so git.json is embedded in the SB3.'
        );
        setDeleteConfirmAction(() => props.onDeleteRepo);
        setShowDeleteConfirm(true);
    };

    const handleDeleteBranchClick = e => {
        const ref = e && e.currentTarget ? e.currentTarget.dataset.ref : null;
        if (!ref) return;
        setPendingDeleteBranchRef(ref);
        setDeleteConfirmMessage(`Delete branch "${ref}"?\n\nThis action cannot be undone.`);
        setDeleteConfirmAction(() => () => handleDeleteCurrentBranch(ref));
        setShowDeleteConfirm(true);
    };

    const confirmDelete = () => {
        if (deleteConfirmAction) {
            deleteConfirmAction();
        }
        setShowDeleteConfirm(false);
        setDeleteConfirmMessage('');
        setDeleteConfirmAction(null);
        setPendingDeleteBranchRef(null);
    };

    const cancelDelete = () => {
        setShowDeleteConfirm(false);
        setDeleteConfirmMessage('');
        setDeleteConfirmAction(null);
        setPendingDeleteBranchRef(null);
    };

    const percent = typeof props.busyProgress === 'number' ? Math.round(props.busyProgress * 100) : null;

    return (
        <Modal
            className={styles.modalContent}
            onRequestClose={props.onClose}
            contentLabel={props.intl.formatMessage(messages.title)}
            id="gitModal"
        >
            <Box className={styles.body}>
                {props.busy ? (
                    <Box className={styles.busy}>
                        <span className={styles.busyText}>
                            {props.busyMessage || 'Working…'}
                        </span>
                        {percent === null ? null : (
                            <span className={styles.busyPercent}>
                                {percent}{'%'}
                            </span>
                        )}
                        {percent === null ? null : (
                            <div className={styles.progressBar}>
                                <div
                                    className={styles.progressBarFill}
                                    style={{width: `${Math.max(0, Math.min(100, percent))}%`}}
                                />
                            </div>
                        )}
                    </Box>
                ) : null}

                {props.error ? (
                    <Box className={styles.error}>
                        {props.error}
                    </Box>
                ) : null}

                {props.initialized ? (
                    <React.Fragment>
                        <Box className={styles.section}>
                            <Box className={styles.sectionHeader}>
                                <span className={styles.sectionTitle}>
                                    <FormattedMessage
                                        defaultMessage="Branch"
                                        description="Current branch label"
                                        id="mw.gitModal.branch"
                                    />
                                </span>
                                <Box className={styles.headerActions}>
                                    <button
                                        className={styles.button}
                                        onClick={props.onRefresh}
                                        disabled={props.busy}
                                    >
                                        <RefreshCcw size={16} />
                                        <FormattedMessage
                                            defaultMessage="Refresh"
                                            description="Refresh git status"
                                            id="mw.gitModal.refresh"
                                        />
                                    </button>
                                    <button
                                        className={`${styles.button} ${styles.dangerButton}`}
                                        onClick={handleDeleteRepoClick}
                                        disabled={props.busy}
                                    >
                                        <Trash size={16} />
                                        <FormattedMessage
                                            defaultMessage="Delete repo"
                                            description="Delete repository"
                                            id="mw.gitModal.deleteRepo"
                                        />
                                    </button>
                                </Box>
                            </Box>

                            <Box className={`${styles.row} ${styles.rowWrap}`}>
                                <select
                                    className={styles.select}
                                    value={props.currentBranch || ''}
                                    onChange={props.onCheckoutBranch}
                                    disabled={props.busy}
                                >
                                    {props.currentBranch ? null : (
                                        <option value="">
                                            {'(detached)'}
                                        </option>
                                    )}
                                    {props.branches.map(b => (
                                        <option
                                            key={b}
                                            value={b}
                                        >
                                            {b}
                                        </option>
                                    ))}
                                </select>
                            </Box>

                            <Box className={`${styles.row} ${styles.rowWrap}`}>
                                <input
                                    className={styles.textInput}
                                    value={props.newBranchName}
                                    onChange={props.onChangeNewBranchName}
                                    placeholder="new-branch"
                                    disabled={props.busy}
                                />
                                <button
                                    className={styles.button}
                                    onClick={props.onCreateBranch}
                                    disabled={props.busy || !props.newBranchName.trim()}
                                >
                                    <CirclePlus size={16} />
                                    <FormattedMessage
                                        defaultMessage="Create branch"
                                        description="Create branch button"
                                        id="mw.gitModal.createBranch"
                                    />
                                </button>
                                <button
                                    className={`${styles.button} ${styles.dangerButton}`}
                                    onClick={handleDeleteBranchClick}
                                    data-ref={props.currentBranch || ''}
                                    disabled={props.busy || !props.currentBranch}
                                >
                                    <Trash size={16} />
                                    <FormattedMessage
                                        defaultMessage="Delete branch"
                                        description="Delete current branch"
                                        id="mw.gitModal.deleteBranch"
                                    />
                                </button>
                            </Box>
                        </Box>

                        <Box className={styles.section}>
                            <Box className={styles.sectionHeader}>
                                <span className={styles.sectionTitle}>
                                    <FormattedMessage
                                        defaultMessage="Author"
                                        description="Commit author label"
                                        id="mw.gitModal.author"
                                    />
                                </span>
                            </Box>
                            <Box className={`${styles.row} ${styles.rowWrap}`}>
                                <input
                                    className={styles.textInput}
                                    value={props.authorName}
                                    onChange={props.onChangeAuthorName}
                                    placeholder="Name"
                                    disabled={props.busy}
                                />
                                <input
                                    className={styles.textInput}
                                    value={props.authorEmail}
                                    onChange={props.onChangeAuthorEmail}
                                    placeholder="email@example.com"
                                    disabled={props.busy}
                                />
                            </Box>
                        </Box>

                        <Box className={styles.section}>
                            <Box className={styles.sectionHeader}>
                                <span className={styles.sectionTitle}>
                                    <FormattedMessage
                                        defaultMessage="Commit"
                                        description="Commit section label"
                                        id="mw.gitModal.commit"
                                    />
                                </span>
                            </Box>
                            <Box className={`${styles.row} ${styles.rowWrap}`}>
                                <input
                                    className={styles.textInput}
                                    value={props.commitMessage}
                                    onChange={props.onChangeCommitMessage}
                                    placeholder="Commit message"
                                    disabled={props.busy}
                                />
                                <button
                                    className={styles.primaryButton}
                                    onClick={props.onCommit}
                                    disabled={props.busy || !props.commitMessage.trim()}
                                >
                                    <Check size={16} />
                                    <FormattedMessage
                                        defaultMessage="Commit"
                                        description="Commit button"
                                        id="mw.gitModal.commitButton"
                                    />
                                </button>
                                <button
                                    className={styles.button}
                                    onClick={props.onUndoCommit}
                                    disabled={props.busy || !props.canUndoCommit}
                                >
                                    <RotateCcw size={16} />
                                    <FormattedMessage
                                        defaultMessage="Undo commit"
                                        description="Undo latest commit by creating a new commit"
                                        id="mw.gitModal.undoCommit"
                                    />
                                </button>
                            </Box>
                        </Box>

                        <Box className={styles.section}>
                            <Box className={styles.sectionHeader}>
                                <span className={styles.sectionTitle}>
                                    <FormattedMessage
                                        defaultMessage="Recent commits"
                                        description="Recent commits label"
                                        id="mw.gitModal.recent"
                                    />
                                </span>
                            </Box>
                            <Box className={styles.commitList}>
                                {props.commits.length ? props.commits.map(c => (
                                    <Box
                                        key={c.oid}
                                        className={styles.commitRow}
                                    >
                                        <span className={styles.commitOid}>
                                            {c.oid.slice(0, 7)}
                                        </span>
                                        <span className={styles.commitMsg}>
                                            {c.commit.message.split('\n')[0]}
                                        </span>
                                        <button
                                            className={styles.smallButton}
                                            onClick={handleRestoreCommit}
                                            data-oid={c.oid}
                                            disabled={props.busy}
                                        >
                                            <RotateCcw size={14} />
                                            <FormattedMessage
                                                defaultMessage="Restore"
                                                description="Restore this commit"
                                                id="mw.gitModal.restoreCommit"
                                            />
                                        </button>
                                        <button
                                            className={styles.smallButton}
                                            onClick={handleDownloadCommit}
                                            data-oid={c.oid}
                                            disabled={props.busy}
                                        >
                                            <Download size={14} />
                                            <FormattedMessage
                                                defaultMessage="Download"
                                                description="Download this commit as SB3"
                                                id="mw.gitModal.downloadCommit"
                                            />
                                        </button>
                                    </Box>
                                )) : (
                                    <Box className={styles.muted}>
                                        <FormattedMessage
                                            defaultMessage="No commits yet."
                                            description="Shown when there are no commits"
                                            id="mw.gitModal.noCommits"
                                        />
                                    </Box>
                                )}
                            </Box>
                        </Box>
                    </React.Fragment>
                ) : (
                    <Box className={styles.section}>
                        <Box className={styles.sectionHeader}>
                            <span className={styles.sectionTitle}>
                                <FormattedMessage
                                    defaultMessage="Repository"
                                    description="Git modal section label"
                                    id="mw.gitModal.repo"
                                />
                            </span>
                            <span className={styles.value}>
                                <FormattedMessage
                                    defaultMessage="Not initialized"
                                    description="Repo status when uninitialized"
                                    id="mw.gitModal.repo.notInitialized"
                                />
                            </span>
                        </Box>
                        <Box className={styles.buttonRow}>
                            <button
                                className={styles.primaryButton}
                                onClick={props.onInit}
                                disabled={props.busy}
                            >
                                <CirclePlus size={16} />
                                <FormattedMessage
                                    defaultMessage="Initialize"
                                    description="Button to initialize repository"
                                    id="mw.gitModal.init"
                                />
                            </button>
                        </Box>
                    </Box>
                )}
                
                {showDeleteConfirm && (
                    <Box className={styles.confirmDialog}>
                        <Box className={styles.confirmDialogContent}>
                            <Box className={styles.confirmMessage}>
                                {deleteConfirmMessage.split('\n').map((line, i) => (
                                    <React.Fragment key={i}>
                                        {line}
                                        {i < deleteConfirmMessage.split('\n').length - 1 && <br />}
                                    </React.Fragment>
                                ))}
                            </Box>
                            <Box className={styles.confirmButtons}>
                                <button
                                    className={styles.button}
                                    onClick={cancelDelete}
                                    disabled={props.busy}
                                >
                                    <FormattedMessage
                                        defaultMessage="Cancel"
                                        description="Cancel button"
                                        id="gui.prompt.cancelDelete"
                                    />
                                </button>
                                <button
                                    className={`${styles.button} ${styles.dangerButton}`}
                                    onClick={confirmDelete}
                                    disabled={props.busy}
                                >
                                    <FormattedMessage
                                        defaultMessage="Delete"
                                        description="Confirm delete button"
                                        id="mw.gitModal.confirmDelete"
                                    />
                                </button>
                            </Box>
                        </Box>
                    </Box>
                )}
            </Box>
        </Modal>
    );
};

GitModalComponent.propTypes = {
    intl: intlShape,
    busy: PropTypes.bool.isRequired,
    busyMessage: PropTypes.string,
    busyProgress: PropTypes.number,
    error: PropTypes.string,
    initialized: PropTypes.bool.isRequired,
    currentBranch: PropTypes.string,
    branches: PropTypes.arrayOf(PropTypes.string).isRequired,
    commits: PropTypes.arrayOf(PropTypes.shape({
        oid: PropTypes.string.isRequired,
        commit: PropTypes.shape({
            message: PropTypes.string.isRequired
        }).isRequired
    })).isRequired,
    commitMessage: PropTypes.string.isRequired,
    authorName: PropTypes.string.isRequired,
    authorEmail: PropTypes.string.isRequired,
    newBranchName: PropTypes.string.isRequired,
    canUndoCommit: PropTypes.bool.isRequired,
    onChangeCommitMessage: PropTypes.func.isRequired,
    onChangeAuthorName: PropTypes.func.isRequired,
    onChangeAuthorEmail: PropTypes.func.isRequired,
    onChangeNewBranchName: PropTypes.func.isRequired,
    onCheckoutBranch: PropTypes.func.isRequired,
    onCreateBranch: PropTypes.func.isRequired,
    onCommit: PropTypes.func.isRequired,
    onUndoCommit: PropTypes.func.isRequired,
    onInit: PropTypes.func.isRequired,
    onRefresh: PropTypes.func.isRequired,
    onRestoreCommit: PropTypes.func.isRequired,
    onDownloadCommit: PropTypes.func.isRequired,
    onDeleteBranch: PropTypes.func.isRequired,
    onDeleteRepo: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired
};

GitModalComponent.defaultProps = {
    error: null,
    currentBranch: null,
    busyMessage: null,
    busyProgress: null,
    graphBranches: [],
    graphNodes: [],
    branchColors: {},
    graphBranchLogs: []
};

export default injectIntl(GitModalComponent);
