import PropTypes from 'prop-types';
import React from 'react';
import classNames from 'classnames';
import {defineMessages, FormattedMessage, injectIntl, intlShape} from 'react-intl';
import {
    GitBranch,
    History,
    GitCommit,
    Cloud,
    FileText,
    Plus,
    RefreshCcw,
    RotateCcw,
    Download,
    Trash,
    Check,
    Upload,
    GitMerge,
    Globe,
    ExternalLink,
    Lock
} from 'lucide-react';

import Box from '../box/box.jsx';
import Modal from '../../containers/windowed-modal.jsx';
import DiffViewer from '../mw-git-diff-viewer/diff-viewer.jsx';
import {
    ModalSidebar,
    ModalSidebarContent,
    ModalSidebarFooter,
    ModalSidebarItem,
    ModalSidebarLayout
} from '../modal-sidebar/modal-sidebar.jsx';
import {takeGitModalInitialView} from '../../lib/git/modal-view.js';
import {GIT_HOST, parseRepoUrl} from '../../lib/rotur/git-api.js';

import styles from './git-modal.css';

const messages = defineMessages({
    title: {
        defaultMessage: 'Version history',
        description: 'Title of the git window',
        id: 'mw.git.title'
    },
    changes: {
        defaultMessage: 'Changes',
        description: 'Changes sidebar item',
        id: 'mw.git.nav.changes'
    },
    history: {
        defaultMessage: 'History',
        description: 'History sidebar item',
        id: 'mw.git.nav.history'
    },
    branches: {
        defaultMessage: 'Branches',
        description: 'Branches sidebar item',
        id: 'mw.git.nav.branches'
    },
    diff: {
        defaultMessage: 'Diff',
        description: 'Diff sidebar item',
        id: 'mw.git.nav.diff'
    },
    remote: {
        defaultMessage: 'Connections',
        description: 'Remote sidebar item',
        id: 'mw.git.nav.remote'
    },
    settings: {
        defaultMessage: 'Settings',
        description: 'Settings sidebar item',
        id: 'mw.git.nav.settings'
    },
    readme: {
        defaultMessage: 'Readme',
        description: 'Readme sidebar item',
        id: 'mw.git.nav.readme'
    },
    rotur: {
        defaultMessage: 'Rotur Git',
        description: 'Rotur Git sidebar item',
        id: 'mw.git.nav.rotur'
    }
});

const changeTypeClass = (styleMap, description) => {
    switch (description) {
    case 'untracked':
    case 'added':
        return styleMap.badgeAdd;
    case 'deleted':
        return styleMap.badgeDelete;
    default:
        return styleMap.badgeModify;
    }
};

// Git status badge: the change-type letter (M/A/D/U) coloured by its kind.
const FileBadge = ({description}) => {
    const letter = description && description[0] ? description[0].toUpperCase() : '?';
    return (
        <span className={classNames(styles.badge, changeTypeClass(styles, description))}>{letter}</span>
    );
};

FileBadge.propTypes = {
    description: PropTypes.string
};

export const GitFileRow = ({description, filepath, onClick, selected}) => {
    const content = (
        <React.Fragment>
            <FileBadge
                filepath={filepath}
                description={description}
            />
            <span className={styles.filePath}>{filepath}</span>
        </React.Fragment>
    );
    return (
        <li className={onClick ? null : styles.fileRow}>
            {onClick ? (
                <button
                    type="button"
                    className={classNames(styles.fileRow, styles.fileRowButton, {
                        [styles.commitRowSelected]: selected
                    })}
                    data-filepath={filepath}
                    aria-pressed={selected || null}
                    onClick={onClick}
                >
                    {content}
                </button>
            ) : content}
        </li>
    );
};

GitFileRow.propTypes = {
    description: PropTypes.string,
    filepath: PropTypes.string.isRequired,
    onClick: PropTypes.func,
    selected: PropTypes.bool
};

const getRoturRepoKey = repo => repo.fullName || repo.cloneUrl || repo.name;

class GitModalComponent extends React.Component {
    constructor (props) {
        super(props);
        const requestedView = takeGitModalInitialView();
        this.state = {
            currentView: ['history', 'branches', 'remote'].includes(requestedView) ? requestedView : 'history'
        };
        this.handleNavigate = this.handleNavigate.bind(this);
        this.handleNavigateClick = this.handleNavigateClick.bind(this);
        this.handleDiffChangedFile = this.handleDiffChangedFile.bind(this);
        this.handleDiffCommitFile = this.handleDiffCommitFile.bind(this);
        this.handleSetMergeResolution = this.handleSetMergeResolution.bind(this);
        this.handleRoturPush = this.handleRoturPush.bind(this);
        this.handleRoturClone = this.handleRoturClone.bind(this);
        this.handleRoturDelete = this.handleRoturDelete.bind(this);
        this.handleSelectCommit = this.handleSelectCommit.bind(this);
    }

    componentDidMount () {
        this.maybeLoadRoturRepos(this.state.currentView);
    }

    maybeLoadRoturRepos (view) {
        if (
            view === 'rotur' &&
            this.props.roturUsername &&
            !this.props.roturReposLoaded &&
            !this.props.roturReposLoading &&
            typeof this.props.onLoadRoturRepos === 'function'
        ) {
            this.props.onLoadRoturRepos();
        }
    }

    handleNavigate (view) {
        this.setState({currentView: view});
        this.props.onClearDiff();
        this.maybeLoadRoturRepos(view);
    }

    handleNavigateClick (event) {
        this.handleNavigate(event.currentTarget.value);
    }

    handleDiffChangedFile (event) {
        this.props.onDiffChangedFile(event.currentTarget.dataset.filepath);
    }

    handleDiffCommitFile (event) {
        this.props.onDiffCommitFile(event.currentTarget.dataset.filepath);
    }

    handleSetMergeResolution (event) {
        this.props.onSetMergeResolution(
            event.currentTarget.dataset.filepath,
            event.currentTarget.value
        );
    }

    findRoturRepo (event) {
        const key = event.currentTarget.dataset.repoKey;
        return [this.props.connectedRoturRepo, ...(this.props.roturRepos || [])]
            .find(repo => repo && getRoturRepoKey(repo) === key);
    }

    handleRoturPush (event) {
        const repo = this.findRoturRepo(event);
        if (repo) this.props.onRoturPush(repo);
    }

    handleRoturClone (event) {
        const repo = this.findRoturRepo(event);
        if (repo) this.props.onRoturClone(repo);
    }

    handleRoturDelete (event) {
        const repo = this.findRoturRepo(event);
        if (repo) this.props.onRoturDelete(repo);
    }

    handleSelectCommit (event) {
        this.props.onSelectCommit(event.currentTarget.dataset.oid);
    }

    renderNotInitialized () {
        return (
            <Box className={styles.emptyState}>
                <GitCommit className={styles.emptyIcon} />
                <p>
                    <FormattedMessage
                        defaultMessage="This project doesn't have version history yet."
                        description="Shown when no repository exists"
                        id="mw.git.empty.description"
                    />
                </p>
                <button
                    type="button"
                    className={styles.primaryButton}
                    disabled={this.props.busy}
                    onClick={this.props.onInit}
                >
                    <FormattedMessage
                        defaultMessage="Start version history"
                        description="Init button"
                        id="mw.git.empty.init"
                    />
                </button>
                <div className={styles.emptyDivider}>
                    <FormattedMessage
                        defaultMessage="or clone an existing fractch project"
                        description="Divider between init and clone"
                        id="mw.git.empty.or"
                    />
                </div>
                <Box className={styles.cloneForm}>
                    <input
                        className={styles.input}
                        type="text"
                        value={this.props.cloneUrl}
                        onChange={this.props.onChangeCloneUrl}
                        disabled={this.props.busy}
                        placeholder="https://git.example.com/user/project.git"
                    />
                    <button
                        type="button"
                        className={styles.button}
                        disabled={this.props.busy || !this.props.cloneUrl || !this.props.cloneUrl.trim()}
                        onClick={this.props.onClone}
                    >
                        <Download className={styles.buttonIcon} />
                        <FormattedMessage
                            defaultMessage="Clone"
                            description="Clone button"
                            id="mw.git.empty.clone"
                        />
                    </button>
                </Box>
                {this.props.cloneConfirm ? (
                    <Box className={styles.cloneConfirm}>
                        <p>
                            <FormattedMessage
                                // eslint-disable-next-line max-len
                                defaultMessage="Cloning replaces your current project. Discard unsaved changes and clone?"
                                description="Clone overwrite confirmation"
                                id="mw.git.empty.cloneConfirm"
                            />
                        </p>
                        <Box className={styles.rowButtons}>
                            <button
                                type="button"
                                className={classNames(styles.button, styles.dangerButton)}
                                disabled={this.props.busy}
                                onClick={this.props.onClone}
                            >
                                <FormattedMessage
                                    defaultMessage="Clone anyway"
                                    description="Confirm clone button"
                                    id="mw.git.empty.cloneAnyway"
                                />
                            </button>
                            <button
                                type="button"
                                className={styles.button}
                                disabled={this.props.busy}
                                onClick={this.props.onCancelClone}
                            >
                                <FormattedMessage
                                    defaultMessage="Cancel"
                                    description="Cancel clone button"
                                    id="mw.git.empty.cloneCancel"
                                />
                            </button>
                        </Box>
                    </Box>
                ) : (
                    <p className={styles.muted}>
                        <FormattedMessage
                            defaultMessage="Private repos use your token (Remote) and author name (Settings)."
                            description="Clone auth hint"
                            id="mw.git.empty.cloneHint"
                        />
                    </p>
                )}
            </Box>
        );
    }

    renderChanges () {
        const {changes} = this.props;
        const hasChanges = Array.isArray(changes) && changes.length > 0;
        return (
            <Box className={styles.section}>
                <h2 className={styles.sectionTitle}>
                    <FormattedMessage
                        defaultMessage="Working changes"
                        description="Changes section heading"
                        id="mw.git.changes.heading"
                    />
                </h2>
                <textarea
                    className={styles.commitBox}
                    placeholder={this.props.intl.formatMessage({
                        defaultMessage: 'Describe your changes…',
                        description: 'Commit message placeholder',
                        id: 'mw.git.changes.placeholder'
                    })}
                    value={this.props.commitMessage}
                    onChange={this.props.onChangeCommitMessage}
                    disabled={this.props.busy}
                />
                <Box className={styles.rowButtons}>
                    <button
                        type="button"
                        className={styles.primaryButton}
                        disabled={this.props.busy || !hasChanges}
                        onClick={this.props.onCommit}
                    >
                        <Check className={styles.buttonIcon} />
                        <FormattedMessage
                            defaultMessage="Commit"
                            description="Commit button"
                            id="mw.git.changes.commit"
                        />
                    </button>
                    <button
                        type="button"
                        className={styles.button}
                        disabled={this.props.busy || !this.props.canUndoCommit}
                        onClick={this.props.onUndoCommit}
                    >
                        <RotateCcw className={styles.buttonIcon} />
                        <FormattedMessage
                            defaultMessage="Undo last commit"
                            description="Undo commit button"
                            id="mw.git.changes.undo"
                        />
                    </button>
                </Box>
                {hasChanges ? (
                    <ul className={styles.fileList}>
                        {changes.map(change => (
                            <GitFileRow
                                key={change.filepath}
                                description={change.description}
                                filepath={change.filepath}
                                onClick={/\.(fractch|svg|json|txt|md)$/i.test(change.filepath) ?
                                    this.handleDiffChangedFile : null}
                            />
                        ))}
                    </ul>
                ) : (
                    <p className={styles.muted}>
                        <FormattedMessage
                            defaultMessage="No uncommitted changes."
                            description="No changes message"
                            id="mw.git.changes.none"
                        />
                    </p>
                )}
                {this.props.diffFilepath && this.props.diffContext === 'working' && (
                    <DiffViewer
                        diff={this.props.diffData}
                        loading={this.props.diffLoading}
                        filepath={this.props.diffFilepath}
                    />
                )}
                <Box className={styles.dangerZone}>
                    <h3 className={styles.subTitle}>
                        <FormattedMessage
                            defaultMessage="Danger zone"
                            description="Danger zone heading"
                            id="mw.git.settings.danger"
                        />
                    </h3>
                    <button
                        type="button"
                        className={classNames(styles.button, styles.dangerButton)}
                        disabled={this.props.busy}
                        onClick={this.props.onDeleteRepo}
                    >
                        <Trash className={styles.buttonIcon} />
                        <FormattedMessage
                            defaultMessage="Delete repository"
                            description="Delete repo button"
                            id="mw.git.settings.deleteRepo"
                        />
                    </button>
                </Box>
            </Box>
        );
    }

    renderHistory () {
        const {commits, branchColors} = this.props;
        return (
            <Box className={styles.section}>
                <h2 className={styles.sectionTitle}>
                    <FormattedMessage
                        defaultMessage="Version history"
                        description="History section heading"
                        id="mw.git.history.heading"
                    />
                </h2>
                {Array.isArray(commits) && commits.length ? (
                    <ul className={styles.commitList}>
                        {commits.map(entry => {
                            const branchesForCommit = (this.props.graphNodes || [])
                                .find(n => n.oid === entry.oid);
                            const chips = branchesForCommit ? branchesForCommit.branches : [];
                            const message = entry.commit && entry.commit.message ?
                                entry.commit.message.split('\n')[0] : '';
                            return (
                                <li
                                    key={entry.oid}
                                    className={classNames(styles.commitRow, {
                                        [styles.commitRowSelected]: this.props.selectedCommitOid === entry.oid
                                    })}
                                >
                                    <button
                                        type="button"
                                        className={styles.commitMain}
                                        data-oid={entry.oid}
                                        aria-pressed={this.props.selectedCommitOid === entry.oid}
                                        onClick={this.handleSelectCommit}
                                    >
                                        <span className={styles.commitMessage}>{message}</span>
                                        <span className={styles.commitMeta}>
                                            <span className={styles.commitHash}>{entry.oid.slice(0, 7)}</span>
                                            {chips.map(b => (
                                                <span
                                                    key={b}
                                                    className={styles.branchChip}
                                                    style={{backgroundColor: (branchColors || {})[b] || '#888'}}
                                                >{b}</span>
                                            ))}
                                        </span>
                                    </button>
                                    <div className={styles.commitActions}>
                                        <button
                                            type="button"
                                            className={styles.iconButton}
                                            data-oid={entry.oid}
                                            disabled={this.props.busy}
                                            title={this.props.intl.formatMessage({
                                                defaultMessage: 'Restore this commit',
                                                description: 'Restore commit tooltip',
                                                id: 'mw.git.history.restore'
                                            })}
                                            onClick={this.props.onRestoreCommit}
                                        >
                                            <RotateCcw className={styles.buttonIcon} />
                                        </button>
                                        <button
                                            type="button"
                                            className={styles.iconButton}
                                            data-oid={entry.oid}
                                            disabled={this.props.busy}
                                            title={this.props.intl.formatMessage({
                                                defaultMessage: 'Download as .sb3',
                                                description: 'Download commit tooltip',
                                                id: 'mw.git.history.download'
                                            })}
                                            onClick={this.props.onDownloadCommit}
                                        >
                                            <Download className={styles.buttonIcon} />
                                        </button>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                ) : (
                    <p className={styles.muted}>
                        <FormattedMessage
                            defaultMessage="No commits yet."
                            description="No commits message"
                            id="mw.git.history.none"
                        />
                    </p>
                )}
                {this.props.selectedCommitOid && (
                    <Box className={styles.subSection}>
                        <h3 className={styles.subTitle}>
                            <FormattedMessage
                                defaultMessage="Files changed in this commit"
                                description="Commit files heading"
                                id="mw.git.history.files"
                            />
                        </h3>
                        {Array.isArray(this.props.commitFiles) && this.props.commitFiles.length ? (
                            <ul className={styles.fileList}>
                                {this.props.commitFiles.map(file => (
                                    <GitFileRow
                                        key={file.path}
                                        description={file.type}
                                        filepath={file.path}
                                        onClick={/\.(fractch|svg|json|txt|md)$/i.test(file.path) ?
                                            this.handleDiffCommitFile : null}
                                    />
                                ))}
                            </ul>
                        ) : (
                            <p className={styles.muted}>
                                <FormattedMessage
                                    defaultMessage="No file-level changes to show."
                                    description="No commit file changes"
                                    id="mw.git.history.noFiles"
                                />
                            </p>
                        )}
                        {this.props.diffFilepath && this.props.diffContext === 'commit' && (
                            <DiffViewer
                                diff={this.props.diffData}
                                loading={this.props.diffLoading}
                                filepath={this.props.diffFilepath}
                            />
                        )}
                    </Box>
                )}
            </Box>
        );
    }

    renderBranches () {
        const {branches, currentBranch, mergeConflicts, mergeResolutions} = this.props;
        return (
            <Box className={styles.section}>
                <h2 className={styles.sectionTitle}>
                    <FormattedMessage
                        defaultMessage="Branches"
                        description="Branches section heading"
                        id="mw.git.branches.heading"
                    />
                </h2>
                <Box className={styles.field}>
                    <label className={styles.fieldLabel}>
                        <FormattedMessage
                            defaultMessage="Current branch"
                            description="Current branch label"
                            id="mw.git.branches.current"
                        />
                    </label>
                    <select
                        className={styles.select}
                        value={currentBranch || ''}
                        disabled={this.props.busy}
                        onChange={this.props.onCheckoutBranch}
                    >
                        {(branches || []).map(b => (
                            <option
                                key={b}
                                value={b}
                            >{b}</option>
                        ))}
                    </select>
                </Box>
                <Box className={styles.field}>
                    <label className={styles.fieldLabel}>
                        <FormattedMessage
                            defaultMessage="Create new branch"
                            description="New branch label"
                            id="mw.git.branches.new"
                        />
                    </label>
                    <Box className={styles.inlineForm}>
                        <input
                            className={styles.input}
                            type="text"
                            value={this.props.newBranchName}
                            onChange={this.props.onChangeNewBranchName}
                            disabled={this.props.busy}
                            placeholder="feature/my-branch"
                        />
                        <button
                            type="button"
                            className={styles.button}
                            disabled={this.props.busy || !this.props.newBranchName.trim()}
                            onClick={this.props.onCreateBranch}
                        >
                            <Plus className={styles.buttonIcon} />
                            <FormattedMessage
                                defaultMessage="Create"
                                description="Create branch button"
                                id="mw.git.branches.create"
                            />
                        </button>
                    </Box>
                </Box>
                <ul className={styles.branchList}>
                    {(branches || []).map(b => (
                        <li
                            key={b}
                            className={styles.branchRow}
                        >
                            <span className={styles.filePath}>
                                {b}
                                {b === currentBranch && (
                                    <span className={styles.currentTag}>
                                        <FormattedMessage
                                            defaultMessage="current"
                                            description="Current branch tag"
                                            id="mw.git.branches.currentTag"
                                        />
                                    </span>
                                )}
                            </span>
                            {b !== currentBranch && (
                                <button
                                    type="button"
                                    className={styles.iconButton}
                                    data-ref={b}
                                    disabled={this.props.busy}
                                    onClick={this.props.onDeleteBranch}
                                    title={this.props.intl.formatMessage({
                                        defaultMessage: 'Delete branch',
                                        description: 'Delete branch tooltip',
                                        id: 'mw.git.branches.delete'
                                    })}
                                >
                                    <Trash className={styles.buttonIcon} />
                                </button>
                            )}
                        </li>
                    ))}
                </ul>
                <Box className={styles.subSection}>
                    <h3 className={styles.subTitle}>
                        <GitMerge className={styles.buttonIcon} />
                        <FormattedMessage
                            defaultMessage="Merge"
                            description="Merge heading"
                            id="mw.git.branches.merge"
                        />
                    </h3>
                    <Box className={styles.inlineForm}>
                        <select
                            className={styles.select}
                            value={this.props.mergeSourceBranch}
                            disabled={this.props.busy}
                            onChange={this.props.onChangeMergeSourceBranch}
                        >
                            <option value="">
                                {this.props.intl.formatMessage({
                                    defaultMessage: 'Merge from…',
                                    description: 'Merge source placeholder',
                                    id: 'mw.git.branches.mergeFrom'
                                })}
                            </option>
                            {(branches || []).filter(b => b !== currentBranch).map(b => (
                                <option
                                    key={b}
                                    value={b}
                                >{b}</option>
                            ))}
                        </select>
                        <button
                            type="button"
                            className={styles.button}
                            disabled={this.props.busy || !this.props.mergeSourceBranch}
                            onClick={this.props.onPreviewMerge}
                        >
                            <FormattedMessage
                                defaultMessage="Preview"
                                description="Preview merge button"
                                id="mw.git.branches.preview"
                            />
                        </button>
                    </Box>
                    {Array.isArray(mergeConflicts) && mergeConflicts.length > 0 && (
                        <Box className={styles.conflicts}>
                            <p className={styles.muted}>
                                <FormattedMessage
                                    defaultMessage="Resolve conflicts by choosing a side for each file:"
                                    description="Conflict resolution instructions"
                                    id="mw.git.branches.conflictHelp"
                                />
                            </p>
                            {mergeConflicts.map(path => (
                                <Box
                                    key={path}
                                    className={styles.conflictRow}
                                >
                                    <span className={styles.filePath}>{path}</span>
                                    <Box className={styles.rowButtons}>
                                        <button
                                            className={classNames(styles.chip, {
                                                [styles.chipActive]: mergeResolutions[path] === 'ours'
                                            })}
                                            disabled={this.props.busy}
                                            data-filepath={path}
                                            value="ours"
                                            onClick={this.handleSetMergeResolution}
                                            type="button"
                                        >
                                            <FormattedMessage
                                                defaultMessage="Ours"
                                                description="Keep our version"
                                                id="mw.git.branches.ours"
                                            />
                                        </button>
                                        <button
                                            className={classNames(styles.chip, {
                                                [styles.chipActive]: mergeResolutions[path] === 'theirs'
                                            })}
                                            disabled={this.props.busy}
                                            data-filepath={path}
                                            value="theirs"
                                            onClick={this.handleSetMergeResolution}
                                            type="button"
                                        >
                                            <FormattedMessage
                                                defaultMessage="Theirs"
                                                description="Keep their version"
                                                id="mw.git.branches.theirs"
                                            />
                                        </button>
                                    </Box>
                                </Box>
                            ))}
                        </Box>
                    )}
                    {this.props.mergeSourceBranch && (
                        <Box className={styles.rowButtons}>
                            <button
                                type="button"
                                className={styles.primaryButton}
                                disabled={this.props.busy}
                                onClick={this.props.onApplyMerge}
                            >
                                <FormattedMessage
                                    defaultMessage="Apply merge"
                                    description="Apply merge button"
                                    id="mw.git.branches.apply"
                                />
                            </button>
                            <button
                                type="button"
                                className={styles.button}
                                disabled={this.props.busy}
                                onClick={this.props.onResolveInEditor}
                            >
                                <FormattedMessage
                                    defaultMessage="Resolve in editor"
                                    description="Button that opens conflicts in the Fractch code editor"
                                    id="mw.git.branches.resolveInEditor"
                                />
                            </button>
                        </Box>
                    )}
                </Box>
            </Box>
        );
    }

    renderDiff () {
        const {changes} = this.props;
        const diffableChanges = (Array.isArray(changes) ? changes : [])
            .filter(change => /\.(fractch|svg|json|txt|md)$/i.test(change.filepath));
        const hasDiffable = diffableChanges.length > 0;
        return (
            <Box className={styles.section}>
                <h2 className={styles.sectionTitle}>
                    <FormattedMessage
                        defaultMessage="Diff"
                        description="Diff section heading"
                        id="mw.git.diff.heading"
                    />
                </h2>
                <p className={styles.muted}>
                    <FormattedMessage
                        defaultMessage="Working tree vs. last commit. Select a file to view its readable fractch diff."
                        description="Diff section explanation"
                        id="mw.git.diff.explain"
                    />
                </p>
                {hasDiffable ? (
                    <ul className={styles.fileList}>
                        {diffableChanges.map(change => (
                            <GitFileRow
                                key={change.filepath}
                                description={change.description}
                                filepath={change.filepath}
                                selected={this.props.diffFilepath === change.filepath &&
                                    this.props.diffContext === 'working'}
                                onClick={this.handleDiffChangedFile}
                            />
                        ))}
                    </ul>
                ) : (
                    <p className={styles.muted}>
                        <FormattedMessage
                            defaultMessage="No uncommitted changes to diff."
                            description="Diff empty state"
                            id="mw.git.diff.none"
                        />
                    </p>
                )}
                {this.props.diffContext === 'working' && this.props.diffFilepath && (
                    <DiffViewer
                        diff={this.props.diffData}
                        loading={this.props.diffLoading}
                        filepath={this.props.diffFilepath}
                    />
                )}
            </Box>
        );
    }

    renderRemote () {
        const {remotes} = this.props;
        return (
            <Box className={styles.section}>
                <h2 className={styles.sectionTitle}>
                    <FormattedMessage
                        defaultMessage="Connections"
                        description="Remote section heading"
                        id="mw.git.remote.heading"
                    />
                </h2>
                {remotes && remotes.length > 0 ? (
                    <ul className={styles.remoteList}>
                        {remotes.map(remote => (
                            <li
                                key={remote.name}
                                className={styles.remoteRow}
                            >
                                <Cloud className={styles.remoteIcon} />
                                <div className={styles.remoteInfo}>
                                    <span className={styles.remoteName}>{remote.name}</span>
                                    <span className={styles.remoteUrl}>{remote.url}</span>
                                </div>
                                <button
                                    type="button"
                                    className={styles.iconButton}
                                    data-name={remote.name}
                                    disabled={this.props.busy}
                                    onClick={this.props.onRemoveRemote}
                                    title={this.props.intl.formatMessage({
                                        defaultMessage: 'Remove remote',
                                        description: 'Remove remote tooltip',
                                        id: 'mw.git.remote.remove'
                                    })}
                                >
                                    <Trash className={styles.buttonIcon} />
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className={styles.remoteEmpty}>
                        <Cloud className={styles.remoteEmptyIcon} />
                        <FormattedMessage
                            defaultMessage="No connections yet. Add a repository URL to sync it whenever you save."
                            description="No remotes message"
                            id="mw.git.remote.none"
                        />
                    </div>
                )}
                <Box className={styles.field}>
                    <label className={styles.fieldLabel}>
                        <FormattedMessage
                            defaultMessage="Repository URL"
                            description="Add remote label"
                            id="mw.git.remote.add"
                        />
                    </label>
                    <Box className={styles.inlineForm}>
                        <input
                            className={styles.input}
                            type="text"
                            value={this.props.newRemoteUrl}
                            onChange={this.props.onChangeNewRemoteUrl}
                            disabled={this.props.busy}
                            placeholder="https://github.com/user/repo.git"
                        />
                        <button
                            type="button"
                            className={styles.button}
                            disabled={this.props.busy}
                            onClick={this.props.onAddRemote}
                        >
                            <Plus className={styles.buttonIcon} />
                        </button>
                    </Box>
                </Box>
                <p className={styles.muted}>
                    <FormattedMessage
                        // eslint-disable-next-line max-len
                        defaultMessage="MistWarp syncs every connection after Save to MistWarp. RoturGit URLs use your Rotur sign-in automatically."
                        description="Explains automatic repository syncing"
                        id="mw.git.remote.syncNote"
                    />
                </p>
                <Box className={styles.field}>
                    <label className={styles.fieldLabel}>
                        <FormattedMessage
                            defaultMessage="Token or password for other services (stored locally)"
                            description="Token label"
                            id="mw.git.remote.token"
                        />
                    </label>
                    <input
                        className={styles.input}
                        type="password"
                        value={this.props.remoteToken}
                        onChange={this.props.onChangeRemoteToken}
                        disabled={this.props.busy}
                        placeholder="token…"
                    />
                    <p className={styles.muted}>
                        <FormattedMessage
                            // eslint-disable-next-line max-len
                            defaultMessage="RoturGit does not need this. Other services use your author name as the username."
                            description="Explains that the author name is the git username"
                            id="mw.git.remote.usernameNote"
                        />
                    </p>
                </Box>
            </Box>
        );
    }

    renderRoturRepoRow (repo) {
        const repoKey = getRoturRepoKey(repo);
        const cloneConfirmPending = this.props.roturCloneConfirm === repo.fullName;
        const deleteConfirmPending = this.props.roturDeleteConfirm === repo.fullName;
        const isConnected = Boolean(
            this.props.connectedRoturRepo &&
            this.props.connectedRoturRepo.fullName === repo.fullName
        );
        return (
            <li
                key={repo.fullName}
                className={styles.remoteRow}
            >
                <GitBranch className={styles.remoteIcon} />
                <div className={styles.remoteInfo}>
                    <span className={styles.remoteName}>
                        {repo.name}
                        {isConnected && (
                            <span className={styles.currentTag}>
                                <FormattedMessage
                                    defaultMessage="connected"
                                    description="Tag on the rotur repo this project is connected to"
                                    id="mw.git.rotur.connectedTag"
                                />
                            </span>
                        )}
                        {repo.isPrivate && (
                            <Lock
                                className={styles.buttonIcon}
                                aria-label={this.props.intl.formatMessage({
                                    defaultMessage: 'Private repository',
                                    description: 'Private repo badge tooltip',
                                    id: 'mw.git.rotur.private'
                                })}
                            />
                        )}
                    </span>
                    <span className={styles.remoteUrl}>
                        {repo.description || repo.cloneUrl}
                    </span>
                    {cloneConfirmPending && (
                        <span className={styles.cloneConfirm}>
                            <FormattedMessage
                                defaultMessage="This replaces your current project. Click clone again to confirm."
                                description="Confirm replacing project on rotur clone"
                                id="mw.git.rotur.cloneConfirm"
                            />
                        </span>
                    )}
                    {deleteConfirmPending && (
                        <span className={styles.cloneConfirm}>
                            <FormattedMessage
                                // eslint-disable-next-line max-len
                                defaultMessage="This permanently deletes the repository on Rotur Git. Click delete again to confirm."
                                description="Confirm deleting rotur repo"
                                id="mw.git.rotur.deleteConfirm"
                            />
                        </span>
                    )}
                </div>
                <button
                    type="button"
                    className={styles.iconButton}
                    data-repo-key={repoKey}
                    disabled={this.props.busy}
                    onClick={this.handleRoturPush}
                    title={this.props.intl.formatMessage({
                        defaultMessage: 'Push project to this repo',
                        description: 'Push to rotur repo tooltip',
                        id: 'mw.git.rotur.pushRepo'
                    })}
                >
                    <Upload className={styles.buttonIcon} />
                </button>
                <button
                    type="button"
                    className={styles.iconButton}
                    data-repo-key={repoKey}
                    disabled={this.props.busy || repo.isEmpty}
                    onClick={this.handleRoturClone}
                    title={this.props.intl.formatMessage({
                        defaultMessage: 'Clone this repo as your project',
                        description: 'Clone rotur repo tooltip',
                        id: 'mw.git.rotur.cloneRepo'
                    })}
                >
                    <Download className={styles.buttonIcon} />
                </button>
                <a
                    className={styles.iconButton}
                    href={repo.htmlUrl}
                    rel="noopener noreferrer"
                    target="_blank"
                    title={this.props.intl.formatMessage({
                        defaultMessage: 'Open on git.rotur.dev',
                        description: 'Open rotur repo in browser tooltip',
                        id: 'mw.git.rotur.openRepo'
                    })}
                >
                    <ExternalLink className={styles.buttonIcon} />
                </a>
                <button
                    type="button"
                    className={styles.iconButton}
                    data-repo-key={repoKey}
                    disabled={this.props.busy}
                    onClick={this.handleRoturDelete}
                    title={this.props.intl.formatMessage({
                        defaultMessage: 'Delete repository',
                        description: 'Delete rotur repo tooltip',
                        id: 'mw.git.rotur.deleteRepo'
                    })}
                >
                    <Trash className={styles.buttonIcon} />
                </button>
            </li>
        );
    }

    renderRotur () {
        const {roturUsername, roturRepos, roturReposLoading} = this.props;

        if (!roturUsername) {
            return (
                <Box className={styles.emptyState}>
                    <Globe className={styles.emptyIcon} />
                    <p>
                        <FormattedMessage
                            // eslint-disable-next-line max-len
                            defaultMessage="Sign in with Rotur to create repos on git.rotur.dev and push your project straight from MistWarp."
                            description="Shown on the Rotur Git tab when signed out"
                            id="mw.git.rotur.signedOut"
                        />
                    </p>
                    <button
                        type="button"
                        className={styles.primaryButton}
                        disabled={this.props.busy}
                        onClick={this.props.onRoturLogin}
                    >
                        <FormattedMessage
                            defaultMessage="Sign in with Rotur"
                            description="Sign in button on the Rotur Git tab"
                            id="mw.git.rotur.signIn"
                        />
                    </button>
                </Box>
            );
        }

        const connected = this.props.connectedRoturRepo;
        return (
            <Box className={styles.section}>
                <h2 className={styles.sectionTitle}>
                    <Globe className={styles.buttonIcon} />
                    <FormattedMessage
                        defaultMessage="Your repositories"
                        description="Rotur Git section heading"
                        id="mw.git.rotur.heading"
                    />
                </h2>
                <p className={styles.muted}>
                    <FormattedMessage
                        defaultMessage="Signed in as {username}. Repos live on {link}."
                        description="Rotur Git signed-in note"
                        id="mw.git.rotur.signedInAs"
                        values={{
                            username: roturUsername,
                            link: (
                                <a
                                    href={GIT_HOST}
                                    rel="noopener noreferrer"
                                    target="_blank"
                                >{'git.rotur.dev'}</a>
                            )
                        }}
                    />
                </p>
                {connected && (
                    <ul className={styles.remoteList}>
                        <li className={styles.remoteRow}>
                            <Cloud className={styles.remoteIcon} />
                            <div className={styles.remoteInfo}>
                                <span className={styles.remoteName}>
                                    {connected.fullName}
                                    <span className={styles.currentTag}>
                                        <FormattedMessage
                                            defaultMessage="connected"
                                            description="Tag on the rotur repo this project is connected to"
                                            id="mw.git.rotur.connectedTag"
                                        />
                                    </span>
                                </span>
                                <span className={styles.remoteUrl}>
                                    <FormattedMessage
                                        defaultMessage="This project pushes to and pulls from this repository."
                                        description="Connected rotur repo explanation"
                                        id="mw.git.rotur.connectedDesc"
                                    />
                                </span>
                            </div>
                            <button
                                type="button"
                                className={styles.iconButton}
                                data-repo-key={getRoturRepoKey(connected)}
                                disabled={this.props.busy}
                                onClick={this.handleRoturPush}
                                title={this.props.intl.formatMessage({
                                    defaultMessage: 'Push project to this repo',
                                    description: 'Push to rotur repo tooltip',
                                    id: 'mw.git.rotur.pushRepo'
                                })}
                            >
                                <Upload className={styles.buttonIcon} />
                            </button>
                            <a
                                className={styles.iconButton}
                                href={`${GIT_HOST}/${connected.fullName}`}
                                rel="noopener noreferrer"
                                target="_blank"
                                title={this.props.intl.formatMessage({
                                    defaultMessage: 'Open on git.rotur.dev',
                                    description: 'Open rotur repo in browser tooltip',
                                    id: 'mw.git.rotur.openRepo'
                                })}
                            >
                                <ExternalLink className={styles.buttonIcon} />
                            </a>
                        </li>
                    </ul>
                )}
                <Box className={styles.field}>
                    <label className={styles.fieldLabel}>
                        <FormattedMessage
                            defaultMessage="Create a repository"
                            description="Create rotur repo label"
                            id="mw.git.rotur.create"
                        />
                    </label>
                    <Box className={styles.inlineForm}>
                        <input
                            className={styles.inputSmall}
                            type="text"
                            value={this.props.roturNewRepoName}
                            onChange={this.props.onChangeRoturNewRepoName}
                            disabled={this.props.busy}
                            placeholder={this.props.intl.formatMessage({
                                defaultMessage: 'repo-name',
                                description: 'Placeholder for new repo name',
                                id: 'mw.git.rotur.namePlaceholder'
                            })}
                        />
                        <input
                            className={styles.input}
                            type="text"
                            value={this.props.roturNewRepoDesc}
                            onChange={this.props.onChangeRoturNewRepoDesc}
                            disabled={this.props.busy}
                            placeholder={this.props.intl.formatMessage({
                                defaultMessage: 'Description (optional)',
                                description: 'Placeholder for new repo description',
                                id: 'mw.git.rotur.descPlaceholder'
                            })}
                        />
                        <button
                            type="button"
                            className={styles.primaryButton}
                            disabled={this.props.busy || !this.props.roturNewRepoName.trim()}
                            onClick={this.props.onCreateRoturRepo}
                        >
                            <Plus className={styles.buttonIcon} />
                            <FormattedMessage
                                defaultMessage="Create"
                                description="Create rotur repo button"
                                id="mw.git.rotur.createButton"
                            />
                        </button>
                    </Box>
                    <label className={styles.checkboxRow}>
                        <input
                            type="checkbox"
                            checked={this.props.roturNewRepoPrivate}
                            disabled={this.props.busy}
                            onChange={this.props.onToggleRoturNewRepoPrivate}
                        />
                        <FormattedMessage
                            defaultMessage="Private repository"
                            description="Private repo checkbox"
                            id="mw.git.rotur.privateCheckbox"
                        />
                    </label>
                </Box>
                <Box className={styles.field}>
                    <Box className={styles.rowButtons}>
                        <label className={styles.fieldLabel}>
                            <FormattedMessage
                                defaultMessage="Repositories"
                                description="Rotur repo list label"
                                id="mw.git.rotur.repoList"
                            />
                        </label>
                        <button
                            type="button"
                            className={styles.iconButton}
                            disabled={this.props.busy || roturReposLoading}
                            onClick={this.props.onLoadRoturRepos}
                            title={this.props.intl.formatMessage({
                                defaultMessage: 'Reload repositories',
                                description: 'Reload rotur repos tooltip',
                                id: 'mw.git.rotur.reload'
                            })}
                        >
                            <RefreshCcw className={styles.buttonIcon} />
                        </button>
                    </Box>
                    {roturReposLoading ? (
                        <p className={styles.muted}>
                            <FormattedMessage
                                defaultMessage="Loading repositories…"
                                description="Rotur repos loading message"
                                id="mw.git.rotur.loading"
                            />
                        </p>
                    ) : roturRepos && roturRepos.length > 0 ? (
                        <ul className={styles.remoteList}>
                            {roturRepos.map(repo => this.renderRoturRepoRow(repo))}
                        </ul>
                    ) : (
                        <div className={styles.remoteEmpty}>
                            <Globe className={styles.remoteEmptyIcon} />
                            <FormattedMessage
                                defaultMessage="No repositories yet. Create one above, then push your project to it."
                                description="No rotur repos message"
                                id="mw.git.rotur.noRepos"
                            />
                        </div>
                    )}
                    <p className={styles.muted}>
                        <FormattedMessage
                            // eslint-disable-next-line max-len
                            defaultMessage="Push sends your committed history. Pushing an uninitialized project creates the repo locally and makes an initial commit first."
                            description="Rotur push help text"
                            id="mw.git.rotur.pushHelp"
                        />
                    </p>
                </Box>
                <Box className={styles.field}>
                    <label className={styles.fieldLabel}>
                        <FormattedMessage
                            defaultMessage="Clone any Rotur repo"
                            description="Clone other rotur repo label"
                            id="mw.git.rotur.cloneOther"
                        />
                    </label>
                    <Box className={styles.inlineForm}>
                        <input
                            className={styles.input}
                            type="text"
                            value={this.props.roturCloneOther}
                            onChange={this.props.onChangeRoturCloneOther}
                            disabled={this.props.busy}
                            placeholder="owner/repo"
                        />
                        <button
                            type="button"
                            className={styles.button}
                            disabled={this.props.busy || !this.props.roturCloneOther.trim()}
                            onClick={this.props.onRoturCloneOther}
                        >
                            <Download className={styles.buttonIcon} />
                            <FormattedMessage
                                defaultMessage="Clone"
                                description="Clone button"
                                id="mw.git.rotur.cloneOtherButton"
                            />
                        </button>
                    </Box>
                    {this.props.roturCloneOther.trim() &&
                        this.props.roturCloneConfirm ===
                        (parseRepoUrl(this.props.roturCloneOther.trim()) || {}).fullName && (
                        <p className={styles.cloneConfirm}>
                            <FormattedMessage
                                defaultMessage="This replaces your current project. Click clone again to confirm."
                                description="Confirm replacing project on rotur clone"
                                id="mw.git.rotur.cloneConfirm"
                            />
                        </p>
                    )}
                    <p className={styles.muted}>
                        <FormattedMessage
                            // eslint-disable-next-line max-len
                            defaultMessage="Cloning someone else's repo opens it as your project; push it to one of your own repos to keep changes."
                            description="Clone other rotur repo help text"
                            id="mw.git.rotur.cloneOtherHelp"
                        />
                    </p>
                </Box>
            </Box>
        );
    }

    renderReadme () {
        return (
            <Box className={styles.section}>
                <h2 className={styles.sectionTitle}>
                    <FileText className={styles.buttonIcon} />
                    <FormattedMessage
                        defaultMessage="Project README"
                        description="Readme section heading"
                        id="mw.git.readme.heading"
                    />
                </h2>
                <p className={styles.muted}>
                    <FormattedMessage
                        // eslint-disable-next-line max-len
                        defaultMessage="Saved as README.md in the repo. It commits, clones, and travels inside the .sb3 with your project."
                        description="Readme explanation"
                        id="mw.git.readme.explain"
                    />
                </p>
                <textarea
                    className={styles.readmeBox}
                    value={this.props.readmeContent}
                    onChange={this.props.onChangeReadme}
                    disabled={this.props.busy}
                    placeholder={'# My Project\n\nDescribe your project here…'}
                />
                <Box className={styles.rowButtons}>
                    <button
                        type="button"
                        className={styles.primaryButton}
                        disabled={this.props.busy || !this.props.readmeDirty}
                        onClick={this.props.onSaveReadme}
                    >
                        <Check className={styles.buttonIcon} />
                        <FormattedMessage
                            defaultMessage="Save README"
                            description="Save readme button"
                            id="mw.git.readme.save"
                        />
                    </button>
                </Box>
            </Box>
        );
    }

    renderContent () {
        if (!this.props.initialized) {
            return this.renderNotInitialized();
        }
        switch (this.state.currentView) {
        case 'history':
            return this.renderHistory();
        case 'branches':
            return this.renderBranches();
        case 'remote':
            return this.renderRemote();
        default:
            return this.renderHistory();
        }
    }

    render () {
        const {intl} = this.props;
        const categories = [
            {id: 'history', label: intl.formatMessage(messages.history), icon: History},
            {id: 'branches', label: intl.formatMessage(messages.branches), icon: GitBranch},
            {id: 'remote', label: intl.formatMessage(messages.remote), icon: Cloud}
        ];

        return (
            <Modal
                className={styles.modalContent}
                onRequestClose={this.props.onClose}
                contentLabel={intl.formatMessage(messages.title)}
                id="gitModal"
                width={880}
                height={560}
            >
                <ModalSidebarLayout>
                    <ModalSidebar
                        ariaLabel="Version control sections"
                        width="narrow"
                        footer={
                            <ModalSidebarFooter>
                                <button
                                    className={classNames(styles.button, styles.sidebarRefresh)}
                                    disabled={this.props.busy}
                                    onClick={this.props.onRefresh}
                                    type="button"
                                >
                                    <RefreshCcw className={styles.buttonIcon} />
                                    <FormattedMessage
                                        defaultMessage="Refresh"
                                        description="Refresh button"
                                        id="mw.git.refresh"
                                    />
                                </button>
                            </ModalSidebarFooter>
                        }
                    >
                        {categories.map(cat => (
                            <ModalSidebarItem
                                key={cat.id}
                                icon={cat.icon}
                                label={cat.label}
                                selected={this.state.currentView === cat.id}
                                value={cat.id}
                                onClick={this.handleNavigateClick}
                            />
                        ))}
                    </ModalSidebar>
                    <ModalSidebarContent className={styles.contentArea}>
                        {this.props.busy && (
                            <Box className={styles.busyBar}>
                                <span>{this.props.busyMessage || 'Working…'}</span>
                                {typeof this.props.busyProgress === 'number' && (
                                    <div className={styles.progressBar}>
                                        <div
                                            className={styles.progressBarFill}
                                            style={{width: `${Math.round(this.props.busyProgress * 100)}%`}}
                                        />
                                    </div>
                                )}
                            </Box>
                        )}
                        {this.props.error && (
                            <Box className={styles.errorBar}>{this.props.error}</Box>
                        )}
                        {this.renderContent()}
                    </ModalSidebarContent>
                </ModalSidebarLayout>
            </Modal>
        );
    }
}

GitModalComponent.propTypes = {
    intl: intlShape,
    busy: PropTypes.bool,
    busyMessage: PropTypes.string,
    busyProgress: PropTypes.number,
    error: PropTypes.string,
    initialized: PropTypes.bool,
    currentBranch: PropTypes.string,
    branches: PropTypes.arrayOf(PropTypes.string),
    commits: PropTypes.arrayOf(PropTypes.object),
    graphNodes: PropTypes.arrayOf(PropTypes.object),
    branchColors: PropTypes.object,
    commitMessage: PropTypes.string,
    newBranchName: PropTypes.string,
    mergeSourceBranch: PropTypes.string,
    onResolveInEditor: PropTypes.func,
    mergeConflicts: PropTypes.arrayOf(PropTypes.string),
    mergeResolutions: PropTypes.object,
    canUndoCommit: PropTypes.bool,
    changes: PropTypes.arrayOf(PropTypes.object),
    remotes: PropTypes.arrayOf(PropTypes.object),
    newRemoteUrl: PropTypes.string,
    remoteToken: PropTypes.string,
    diffLoading: PropTypes.bool,
    diffFilepath: PropTypes.string,
    diffData: PropTypes.object,
    diffContext: PropTypes.string,
    selectedCommitOid: PropTypes.string,
    commitFiles: PropTypes.arrayOf(PropTypes.object),
    readmeContent: PropTypes.string,
    readmeDirty: PropTypes.bool,
    onChangeReadme: PropTypes.func,
    onSaveReadme: PropTypes.func,
    cloneUrl: PropTypes.string,
    cloneConfirm: PropTypes.bool,
    onChangeCloneUrl: PropTypes.func,
    onClone: PropTypes.func,
    onCancelClone: PropTypes.func,
    onChangeCommitMessage: PropTypes.func,
    onChangeNewBranchName: PropTypes.func,
    onCheckoutBranch: PropTypes.func,
    onCreateBranch: PropTypes.func,
    onCommit: PropTypes.func,
    onUndoCommit: PropTypes.func,
    onInit: PropTypes.func,
    onRefresh: PropTypes.func,
    onRestoreCommit: PropTypes.func,
    onDownloadCommit: PropTypes.func,
    onDeleteRepo: PropTypes.func,
    onDeleteBranch: PropTypes.func,
    onChangeMergeSourceBranch: PropTypes.func,
    onPreviewMerge: PropTypes.func,
    onSetMergeResolution: PropTypes.func,
    onApplyMerge: PropTypes.func,
    onDiffChangedFile: PropTypes.func,
    onSelectCommit: PropTypes.func,
    onDiffCommitFile: PropTypes.func,
    onClearDiff: PropTypes.func,
    onChangeNewRemoteUrl: PropTypes.func,
    onChangeRemoteToken: PropTypes.func,
    onAddRemote: PropTypes.func,
    onRemoveRemote: PropTypes.func,
    onClose: PropTypes.func,
    roturUsername: PropTypes.string,
    roturRepos: PropTypes.arrayOf(PropTypes.object),
    roturReposLoaded: PropTypes.bool,
    roturReposLoading: PropTypes.bool,
    roturNewRepoName: PropTypes.string,
    roturNewRepoDesc: PropTypes.string,
    roturNewRepoPrivate: PropTypes.bool,
    roturCloneOther: PropTypes.string,
    roturCloneConfirm: PropTypes.string,
    roturDeleteConfirm: PropTypes.string,
    connectedRoturRepo: PropTypes.shape({
        owner: PropTypes.string,
        name: PropTypes.string,
        fullName: PropTypes.string,
        remoteName: PropTypes.string
    }),
    onRoturLogin: PropTypes.func,
    onLoadRoturRepos: PropTypes.func,
    onChangeRoturNewRepoName: PropTypes.func,
    onChangeRoturNewRepoDesc: PropTypes.func,
    onToggleRoturNewRepoPrivate: PropTypes.func,
    onCreateRoturRepo: PropTypes.func,
    onRoturPush: PropTypes.func,
    onRoturClone: PropTypes.func,
    onRoturDelete: PropTypes.func,
    onChangeRoturCloneOther: PropTypes.func,
    onRoturCloneOther: PropTypes.func
};

export default injectIntl(GitModalComponent);
export {GitModalComponent};
