import PropTypes from 'prop-types';
import React from 'react';
import bindAll from 'lodash.bindall';
import {connect} from 'react-redux';
import VM from 'scratch-vm';

import GitModalComponent from '../components/mw-git-modal/git-modal.jsx';
import {closeGitModal} from '../reducers/modals.js';

import downloadBlob from '../lib/utils/download-blob.js';
import {openFractchMode} from '../lib/git/fractch-mode.js';

import {
    getDefaultAuthor,
    getRepoStatus,
    getRepoChanges,
    getFs,
    REPO_DIR,
    initRepo,
    createBranch,
    checkoutBranchAndRestore,
    checkoutCommitAndRestore,
    readSnapshotAtCommit,
    deleteRepo,
    deleteBranch,
    commitProject,
    mergeBranchesPreview,
    mergeBranchesApply,
    startEditorMerge,
    restoreProjectFromCurrentRef,
    computeCommitGraph,
    getRemotes,
    addRemote,
    removeRemote,
    push,
    cloneRepo,
    repoHasFractch,
    readReadme,
    writeReadme
} from '../lib/git/browser-git.js';
import {buildSb3FromFractchTree} from '../lib/git/fractch-tree.js';
import {
    listMyRepos as listRoturRepos,
    createRepo as createRoturRepo,
    deleteRepo as deleteRoturRepoApi,
    getAuth as getRoturGitAuth,
    getRemoteUrl as getRoturRemoteUrl,
    isRoturGitUrl,
    parseRepoUrl as parseRoturRepoUrl
} from '../lib/rotur/git-api.js';
import {getRoturSessionApi} from '../lib/rotur/session-api.js';
import {
    getFileContentAtCommit,
    getChangedFilesBetweenCommits,
    getCommitParents,
    computeLineDiff
} from '../lib/git/git-diff.js';

const TOKEN_KEY = 'mw:git-token';
const DEFAULT_BRANCH_KEY = 'mw:git-default-branch';
const AUTO_COMMIT_KEY = 'mw:git-autocommit';

const readLocal = (key, fallback) => {
    try {
        const value = localStorage.getItem(key);
        return value === null ? fallback : value;
    } catch (e) {
        return fallback;
    }
};

const writeLocal = (key, value) => {
    try {
        localStorage.setItem(key, value);
    } catch (e) {
        // ignore
    }
};

const isDiffable = filepath => /\.(fractch|svg|json|txt|md)$/i.test(filepath || '');

// Cheap content signature so a live-refreshing diff only re-renders when it changed.
const diffSignature = diff => (diff && Array.isArray(diff.hunks) ? JSON.stringify(diff.hunks) : '');

class TWGitModal extends React.Component {
    constructor (props) {
        super(props);

        const author = getDefaultAuthor();

        this.state = {
            busy: false,
            busyMessage: null,
            busyProgress: null,
            error: null,
            initialized: false,
            currentBranch: null,
            branches: [],
            commits: [],
            graphBranches: [],
            graphNodes: [],
            commitMessage: '',
            authorName: author.name,
            authorEmail: author.email,
            newBranchName: '',
            mergeSourceBranch: '',
            mergeConflicts: [],
            mergeResolutions: {},
            changes: [],
            // Remotes
            remotes: [],
            newRemoteName: 'origin',
            newRemoteUrl: '',
            pushRemote: 'origin',
            pushBranch: '',
            remoteToken: readLocal(TOKEN_KEY, ''),
            // Clone
            cloneUrl: '',
            cloneConfirm: false,
            // Readme
            readmeContent: '',
            readmeDirty: false,
            // Diff
            diffLoading: false,
            diffFilepath: null,
            diffData: null,
            diffContext: null,
            selectedCommitOid: null,
            commitFiles: [],
            // Settings
            defaultBranch: readLocal(DEFAULT_BRANCH_KEY, 'main'),
            autoCommit: readLocal(AUTO_COMMIT_KEY, 'false') === 'true',
            // Rotur Git
            roturRepos: [],
            roturReposLoaded: false,
            roturReposLoading: false,
            roturNewRepoName: '',
            roturNewRepoDesc: '',
            roturNewRepoPrivate: false,
            roturCloneOther: '',
            roturCloneConfirm: null,
            roturDeleteConfirm: null
        };

        this._lastProgressUpdate = 0;

        this._pollTimer = null;
        this._pollPromise = null;
        this._openDiffSig = null;

        bindAll(this, [
            'refresh',
            'pollChanges',
            'computeWorkingDiff',
            'handleProjectChanged',
            'handleRefresh',
            'handleInit',
            'handleClone',
            'handleCancelClone',
            'handleChangeCloneUrl',
            'handleCommit',
            'handleUndoCommit',
            'handleCheckoutBranch',
            'handleCreateBranch',
            'handleRestoreCommit',
            'handleDownloadCommit',
            'handleDeleteRepo',
            'handleDeleteBranch',
            'handleClose',
            'handleChangeCommitMessage',
            'handleChangeAuthorName',
            'handleChangeAuthorEmail',
            'handleChangeNewBranchName',
            'handleGitProgress',
            'handleChangeMergeSourceBranch',
            'handlePreviewMerge',
            'handleResolveInEditor',
            'handleSetMergeResolution',
            'handleApplyMerge',
            'handleDiffChangedFile',
            'handleSelectCommit',
            'handleDiffCommitFile',
            'handleClearDiff',
            'handleChangeNewRemoteName',
            'handleChangeNewRemoteUrl',
            'handleChangePushRemote',
            'handleChangePushBranch',
            'handleChangeRemoteToken',
            'handleAddRemote',
            'handleRemoveRemote',
            'handlePush',
            'handleChangeDefaultBranch',
            'handleToggleAutoCommit',
            'handleChangeReadme',
            'handleSaveReadme',
            'handleRoturLogin',
            'handleLoadRoturRepos',
            'handleChangeRoturNewRepoName',
            'handleChangeRoturNewRepoDesc',
            'handleToggleRoturNewRepoPrivate',
            'handleCreateRoturRepo',
            'handleRoturPush',
            'handleRoturClone',
            'handleRoturDelete',
            'handleChangeRoturCloneOther',
            'handleRoturCloneOther'
        ]);
    }

    componentDidMount () {
        this.refresh();
        // Re-check working changes only when the VM reports an actual project
        // edit, debounced so a burst of edits triggers a single re-serialization.
        if (this.props.vm && typeof this.props.vm.on === 'function') {
            this.props.vm.on('PROJECT_CHANGED', this.handleProjectChanged);
        }
    }

    componentWillUnmount () {
        if (this.props.vm && typeof this.props.vm.off === 'function') {
            this.props.vm.off('PROJECT_CHANGED', this.handleProjectChanged);
        }
        if (this._pollTimer) {
            clearTimeout(this._pollTimer);
            this._pollTimer = null;
        }
    }

    handleProjectChanged () {
        if (this._pollTimer) clearTimeout(this._pollTimer);
        this._pollTimer = setTimeout(this.pollChanges, 700);
    }

    pollChanges () {
        // Skip while another operation is running, before init, or if a poll is
        // still in flight (computing status re-serializes the project).
        if (this._pollPromise || this.state.busy || !this.state.initialized) return;
        this._pollPromise = this.runPoll().finally(() => {
            this._pollPromise = null;
        });
    }

    async waitForPollIdle () {
        while (this._pollPromise) {
            try {
                await this._pollPromise;
            } catch (e) {
                break;
            }
        }
    }

    async runPoll () {
        try {
            const changes = await getRepoChanges(this.props.vm);
            const prev = this.state.changes || [];
            const changed = prev.length !== changes.length ||
                changes.some((c, i) => !prev[i] ||
                    prev[i].filepath !== c.filepath ||
                    prev[i].description !== c.description);
            if (changed) {
                this.setState({changes});
            }
            // Keep an open working-tree diff in sync with live edits, swapping the
            // content in place (no loading flash) and only when it actually changed.
            if (this.state.diffContext === 'working' && this.state.diffFilepath && !this.state.diffLoading) {
                try {
                    const diff = await this.computeWorkingDiff(this.state.diffFilepath);
                    const sig = diffSignature(diff);
                    if (sig !== this._openDiffSig) {
                        this._openDiffSig = sig;
                        this.setState({diffData: diff});
                    }
                } catch (e) {
                    // ignore: the manual diff path still works
                }
            }
        } catch (e) {
            // silent: polling should never surface transient errors
        }
    }

    handleGitProgress (progress) {
        if (!progress || !this.state.busy) return;

        const now = Date.now();
        if (now - this._lastProgressUpdate < 100) return;
        this._lastProgressUpdate = now;

        const completed = typeof progress.completed === 'number' ? progress.completed : null;
        const total = typeof progress.total === 'number' ? progress.total : null;
        const ratio = completed !== null && total && total > 0 ? Math.max(0, Math.min(1, completed / total)) : null;

        let message = progress.message || 'Working…';
        if (ratio !== null) {
            message = `${message} ${Math.round(ratio * 100)}%`;
        } else if (completed !== null && completed > 0) {
            message = `${message} (${completed})`;
        }

        this.setState({
            busyMessage: message,
            busyProgress: ratio
        });
    }

    async refresh () {
        this.setState({busy: true, busyMessage: 'Refreshing…', busyProgress: null, error: null});
        try {
            const status = await getRepoStatus(this.props.vm);
            const hasCommits = Array.isArray(status.commits) && status.commits.length > 0;
            const graph = status.initialized ?
                (await computeCommitGraph({depth: 50})) :
                {branches: [], nodes: [], branchLogs: []};

            const palette = [
                '#4db6ac', '#9575cd', '#64b5f6',
                '#f06292', '#ba68c8', '#4fc3f7',
                '#81c784', '#ffb74d', '#e57373'
            ];
            const branchColors = {};
            graph.branches.forEach((b, i) => {
                branchColors[b] = palette[i % palette.length];
            });

            let remotes = [];
            let readme = this.state.readmeContent;
            if (status.initialized) {
                try {
                    remotes = await getRemotes(this.props.vm);
                } catch (e) {
                    remotes = [];
                }
                // Don't clobber unsaved README edits with the on-disk copy.
                if (!this.state.readmeDirty) {
                    try {
                        readme = await readReadme();
                    } catch (e) {
                        readme = '';
                    }
                }
            }

            this.setState({
                initialized: Boolean(status.initialized) && hasCommits,
                currentBranch: status.currentBranch,
                branches: status.branches,
                commits: status.commits,
                graphBranches: graph.branches,
                graphNodes: graph.nodes,
                graphBranchLogs: graph.branchLogs,
                branchColors,
                changes: status.changes,
                remotes,
                readmeContent: readme,
                pushRemote: (remotes[0] && remotes[0].name) || this.state.pushRemote,
                pushBranch: this.state.pushBranch ||
                    status.currentBranch ||
                    (Array.isArray(status.branches) && status.branches.includes('main') ?
                        'main' : (status.branches && status.branches[0])) ||
                    ''
            });
        } catch (err) {
            this.setState({error: err && err.message ? err.message : String(err)});
        } finally {
            this.setState({busy: false, busyMessage: null, busyProgress: null});
        }
    }

    handleRefresh () {
        this.refresh();
    }

    async handleInit () {
        this.setState({busy: true, busyMessage: 'Initializing repository…', busyProgress: 0, error: null});
        try {
            await this.waitForPollIdle();
            await initRepo({
                vm: this.props.vm,
                defaultBranch: this.state.defaultBranch || 'main',
                onProgress: this.handleGitProgress
            });
            await this.refresh();
        } catch (err) {
            this.setState({error: err && err.message ? err.message : String(err)});
        } finally {
            this.setState({busy: false, busyMessage: null, busyProgress: null});
        }
    }

    handleChangeCloneUrl (e) {
        this.setState({cloneUrl: e.target.value, cloneConfirm: false});
    }

    handleCancelClone () {
        this.setState({cloneConfirm: false});
    }

    async handleClone () {
        const url = (this.state.cloneUrl || '').trim();
        if (!url) {
            this.setState({error: 'Enter a git URL to clone'});
            return;
        }
        // Cloning replaces the current project (and any repo). Confirm first when
        // there are unsaved changes to avoid silently discarding work.
        if (this.props.projectChanged && !this.state.cloneConfirm) {
            this.setState({cloneConfirm: true, error: null});
            return;
        }
        this.setState({cloneConfirm: false});
        const token = this.state.remoteToken;
        const username = (this.state.authorName || '').trim();
        this.setState({busy: true, busyMessage: 'Cloning…', busyProgress: null, error: null});
        try {
            await this.waitForPollIdle();
            const cloneOpts = {url, onProgress: this.handleGitProgress};
            if (isRoturGitUrl(url) && this.props.roturUsername) {
                cloneOpts.onAuth = getRoturGitAuth;
            } else if (token) {
                cloneOpts.onAuth = () => (username ?
                    {username, password: token} :
                    {username: token, password: token});
            }
            await cloneRepo(cloneOpts);
            await this.loadProjectFromClonedRepo();

            this.setState({cloneUrl: ''});
            await this.refresh();
        } catch (err) {
            this.setState({error: err && err.message ? err.message : String(err)});
        } finally {
            this.setState({busy: false, busyMessage: null, busyProgress: null});
        }
    }

    async loadProjectFromClonedRepo () {
        if (!(await repoHasFractch())) {
            await deleteRepo();
            throw new Error('That repository is not a fractch project (no .fractch files found).');
        }

        const fs = getFs();
        const pfs = fs.promises;
        const bytes = await buildSb3FromFractchTree({fs: pfs, dir: REPO_DIR});
        const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);

        this.props.vm.quit();
        await this.props.vm.loadProject(buffer, {skipGitImport: true});
        this.props.vm.renderer.draw();
    }

    async handleCommit () {
        const message = this.state.commitMessage.trim();
        if (!message) {
            this.setState({error: 'Commit message is required'});
            return;
        }

        this.setState({busy: true, busyMessage: 'Committing…', busyProgress: 0, error: null});
        try {
            await this.waitForPollIdle();
            await commitProject({
                vm: this.props.vm,
                message,
                author: {
                    name: this.state.authorName || 'User',
                    email: this.state.authorEmail || 'user@example.com'
                },
                onProgress: this.handleGitProgress
            });
            this.setState({commitMessage: '', diffData: null, diffFilepath: null});
            await this.refresh();
        } catch (err) {
            this.setState({error: err && err.message ? err.message : String(err)});
        } finally {
            this.setState({busy: false, busyMessage: null, busyProgress: null});
        }
    }

    async handleUndoCommit () {
        if (!this.state.initialized) return;
        if (!this.state.currentBranch) {
            this.setState({error: 'Cannot undo commit while detached. Check out a branch first.'});
            return;
        }

        if (!Array.isArray(this.state.commits) || this.state.commits.length < 2) {
            this.setState({error: 'No previous commit to undo to.'});
            return;
        }

        const head = this.state.commits[0];
        const previous = this.state.commits[1];

        this.setState({busy: true, busyMessage: 'Undoing commit…', busyProgress: null, error: null});
        try {
            await this.waitForPollIdle();
            const snapshot = await readSnapshotAtCommit(previous.oid);
            this.props.vm.quit();
            await this.props.vm.loadProject(snapshot);

            const headLine = head && head.commit && head.commit.message ? head.commit.message.split('\n')[0] : '';
            const undoMessage = `Undo: ${headLine || head.oid.slice(0, 7)}`;

            await commitProject({
                vm: this.props.vm,
                message: undoMessage,
                author: {
                    name: this.state.authorName || 'User',
                    email: this.state.authorEmail || 'user@example.com'
                },
                onProgress: this.handleGitProgress
            });

            await this.refresh();
        } catch (err) {
            this.setState({error: err && err.message ? err.message : String(err)});
        } finally {
            this.setState({busy: false, busyMessage: null, busyProgress: null});
        }
    }

    async handleCreateBranch () {
        const ref = this.state.newBranchName.trim();
        if (!ref) {
            this.setState({error: 'Branch name is required'});
            return;
        }

        this.setState({busy: true, busyMessage: 'Creating branch…', busyProgress: null, error: null});
        try {
            await this.waitForPollIdle();
            await createBranch({ref, vm: this.props.vm});
            await checkoutBranchAndRestore({vm: this.props.vm, ref});
            this.setState({newBranchName: ''});
            await this.refresh();
        } catch (err) {
            this.setState({error: err && err.message ? err.message : String(err)});
        } finally {
            this.setState({busy: false, busyMessage: null, busyProgress: null});
        }
    }

    async handleCheckoutBranch (e) {
        const ref = e && e.target ? e.target.value : null;
        if (!ref) return;

        this.setState({busy: true, busyMessage: 'Checking out branch…', busyProgress: null, error: null});
        try {
            await this.waitForPollIdle();
            await checkoutBranchAndRestore({vm: this.props.vm, ref});
            await this.refresh();
        } catch (err) {
            this.setState({error: err && err.message ? err.message : String(err)});
        } finally {
            this.setState({busy: false, busyMessage: null, busyProgress: null});
        }
    }

    async handleRestoreCommit (e) {
        const oid = e && e.currentTarget ? e.currentTarget.dataset.oid : null;
        if (!oid) return;

        this.setState({busy: true, busyMessage: 'Restoring commit…', busyProgress: null, error: null});
        try {
            await this.waitForPollIdle();
            await checkoutCommitAndRestore({vm: this.props.vm, oid});
            await this.refresh();
        } catch (err) {
            this.setState({error: err && err.message ? err.message : String(err)});
        } finally {
            this.setState({busy: false, busyMessage: null, busyProgress: null});
        }
    }

    async handleDownloadCommit (e) {
        const oid = e && e.currentTarget ? e.currentTarget.dataset.oid : null;
        if (!oid) return;

        this.setState({busy: true, busyMessage: 'Preparing download…', busyProgress: null, error: null});
        try {
            const sb3ArrayBuffer = await readSnapshotAtCommit(oid);
            if (!sb3ArrayBuffer || sb3ArrayBuffer.byteLength === 0) {
                throw new Error('No project data found at this commit');
            }

            const short = oid.slice(0, 7);
            downloadBlob(`commit-${short}.sb3`, new Blob([sb3ArrayBuffer], {type: 'application/x.scratch.sb3'}));
        } catch (err) {
            this.setState({error: err && err.message ? err.message : String(err)});
        } finally {
            this.setState({busy: false, busyMessage: null, busyProgress: null});
        }
    }

    async handleDeleteRepo () {
        this.setState({busy: true, busyMessage: 'Deleting repository…', busyProgress: null, error: null});
        try {
            await this.waitForPollIdle();
            await deleteRepo();
            this.setState({diffData: null, diffFilepath: null, selectedCommitOid: null, commitFiles: []});
            await this.refresh();
        } catch (err) {
            this.setState({error: err && err.message ? err.message : String(err)});
        } finally {
            this.setState({busy: false, busyMessage: null, busyProgress: null});
        }
    }

    async handleDeleteBranch (eOrRef) {
        let ref = null;
        if (typeof eOrRef === 'string') {
            ref = eOrRef;
        } else if (eOrRef && eOrRef.currentTarget) {
            ref = eOrRef.currentTarget.dataset.ref || null;
        }
        if (!ref) return;

        this.setState({busy: true, busyMessage: 'Deleting branch…', busyProgress: null, error: null});
        try {
            await deleteBranch(ref);
            await this.refresh();
        } catch (err) {
            this.setState({error: err && err.message ? err.message : String(err)});
        } finally {
            this.setState({busy: false, busyMessage: null, busyProgress: null});
        }
    }

    async computeWorkingDiff (filepath) {
        const fs = getFs();
        const pfs = fs.promises;
        let workingText = '';
        try {
            const data = await pfs.readFile(`${REPO_DIR}/${filepath}`, 'utf8');
            workingText = typeof data === 'string' ? data : new TextDecoder().decode(data);
        } catch (e) {
            workingText = '';
        }
        let headText = '';
        // isomorphic-git's readBlob does not resolve the symbolic ref "HEAD",
        // so use the resolved oid of the latest commit instead.
        const headOid = Array.isArray(this.state.commits) && this.state.commits[0] ?
            this.state.commits[0].oid : null;
        if (headOid) {
            try {
                const res = await getFileContentAtCommit({fs, dir: REPO_DIR, oid: headOid, filepath});
                headText = res.text || '';
            } catch (e) {
                headText = '';
            }
        }
        return computeLineDiff(headText, workingText);
    }

    async handleDiffChangedFile (filepath) {
        if (!filepath || !isDiffable(filepath)) return;
        // Clicking the already-open file toggles its diff closed instead of
        // recomputing (which caused a brief flicker).
        if (this.state.diffContext === 'working' && this.state.diffFilepath === filepath && !this.state.diffLoading) {
            this.setState({diffData: null, diffFilepath: null});
            this._openDiffSig = null;
            return;
        }
        this.setState({diffLoading: true, diffFilepath: filepath, diffData: null, diffContext: 'working'});
        try {
            const diff = await this.computeWorkingDiff(filepath);
            this._openDiffSig = diffSignature(diff);
            this.setState({diffData: diff, diffLoading: false});
        } catch (err) {
            this.setState({diffLoading: false, error: err && err.message ? err.message : String(err)});
        }
    }

    async handleSelectCommit (oid) {
        if (!oid) return;
        this.setState({selectedCommitOid: oid, diffData: null, diffFilepath: null, diffContext: 'commit'});
        try {
            const fs = getFs();
            const parents = await getCommitParents({fs, dir: REPO_DIR, oid});
            const parent = parents[0] || null;
            let files = [];
            if (parent) {
                files = await getChangedFilesBetweenCommits({fs, dir: REPO_DIR, oidA: parent, oidB: oid});
            }
            this.setState({commitFiles: files});
        } catch (err) {
            this.setState({error: err && err.message ? err.message : String(err)});
        }
    }

    async handleDiffCommitFile (filepath) {
        const oid = this.state.selectedCommitOid;
        if (!oid || !filepath || !isDiffable(filepath)) return;
        if (this.state.diffContext === 'commit' && this.state.diffFilepath === filepath && !this.state.diffLoading) {
            this.setState({diffData: null, diffFilepath: null});
            return;
        }
        this.setState({diffLoading: true, diffFilepath: filepath, diffData: null, diffContext: 'commit'});
        try {
            const fs = getFs();
            const parents = await getCommitParents({fs, dir: REPO_DIR, oid});
            const parent = parents[0] || null;
            const newRes = await getFileContentAtCommit({fs, dir: REPO_DIR, oid, filepath});
            const oldRes = parent ?
                await getFileContentAtCommit({fs, dir: REPO_DIR, oid: parent, filepath}) :
                {text: ''};
            const diff = await computeLineDiff(oldRes.text || '', newRes.text || '');
            this.setState({diffData: diff, diffLoading: false});
        } catch (err) {
            this.setState({diffLoading: false, error: err && err.message ? err.message : String(err)});
        }
    }

    handleClearDiff () {
        this.setState({diffData: null, diffFilepath: null});
    }

    handleChangeNewRemoteName (e) {
        this.setState({newRemoteName: e.target.value});
    }

    handleChangeNewRemoteUrl (e) {
        this.setState({newRemoteUrl: e.target.value});
    }

    handleChangePushRemote (e) {
        this.setState({pushRemote: e.target.value});
    }

    handleChangePushBranch (e) {
        this.setState({pushBranch: e.target.value});
    }

    handleChangeRemoteToken (e) {
        const token = e.target.value;
        this.setState({remoteToken: token});
        writeLocal(TOKEN_KEY, token);
    }

    async handleAddRemote () {
        const name = this.state.newRemoteName.trim();
        const url = this.state.newRemoteUrl.trim();
        if (!name || !url) {
            this.setState({error: 'Remote name and URL are required'});
            return;
        }
        this.setState({busy: true, busyMessage: 'Adding remote…', busyProgress: null, error: null});
        try {
            await addRemote({vm: this.props.vm, name, url});
            this.setState({newRemoteUrl: ''});
            await this.refresh();
        } catch (err) {
            this.setState({error: err && err.message ? err.message : String(err)});
        } finally {
            this.setState({busy: false, busyMessage: null, busyProgress: null});
        }
    }

    async handleRemoveRemote (eOrName) {
        let name = null;
        if (typeof eOrName === 'string') {
            name = eOrName;
        } else if (eOrName && eOrName.currentTarget) {
            name = eOrName.currentTarget.dataset.name || null;
        }
        if (!name) return;
        this.setState({busy: true, busyMessage: 'Removing remote…', busyProgress: null, error: null});
        try {
            await removeRemote({vm: this.props.vm, name});
            await this.refresh();
        } catch (err) {
            this.setState({error: err && err.message ? err.message : String(err)});
        } finally {
            this.setState({busy: false, busyMessage: null, busyProgress: null});
        }
    }

    async handlePush () {
        const remote = this.state.pushRemote;
        const branch = this.state.pushBranch || this.state.currentBranch;
        const token = this.state.remoteToken;
        // The commit author name doubles as the remote username (Settings tab).
        const username = (this.state.authorName || '').trim();
        if (!remote) {
            this.setState({error: 'Select a remote to push to'});
            return;
        }
        if (!branch) {
            this.setState({error: 'Select a branch to push'});
            return;
        }
        this.setState({busy: true, busyMessage: `Pushing ${branch} to ${remote}…`, busyProgress: null, error: null});
        try {
            await push({
                vm: this.props.vm,
                remote,
                ref: branch,
                setUpstream: true,
                onProgress: this.handleGitProgress,
                // Standard Basic auth: commit author name as username, token as
                // password (Gitea/GitLab/self-hosted). Falls back to token-as-username
                // (GitHub PAT style) if no author name is set.
                onAuth: () => (username ?
                    {username, password: token} :
                    {username: token || 'x-access-token', password: token})
            });
            this.setState({error: null, busyMessage: 'Pushed'});
        } catch (err) {
            this.setState({error: err && err.message ? err.message : String(err)});
        } finally {
            this.setState({busy: false, busyMessage: null, busyProgress: null});
        }
    }

    handleChangeReadme (e) {
        this.setState({readmeContent: e.target.value, readmeDirty: true});
    }

    async handleSaveReadme () {
        this.setState({busy: true, busyMessage: 'Saving README…', busyProgress: null, error: null});
        try {
            await writeReadme(this.state.readmeContent);
            this.setState({readmeDirty: false});
            await this.refresh();
        } catch (err) {
            this.setState({error: err && err.message ? err.message : String(err)});
        } finally {
            this.setState({busy: false, busyMessage: null, busyProgress: null});
        }
    }

    handleChangeDefaultBranch (e) {
        const value = e.target.value;
        this.setState({defaultBranch: value});
        writeLocal(DEFAULT_BRANCH_KEY, value);
    }

    handleToggleAutoCommit () {
        const next = !this.state.autoCommit;
        this.setState({autoCommit: next});
        writeLocal(AUTO_COMMIT_KEY, next ? 'true' : 'false');
    }

    handleClose () {
        this.props.onClose();
    }

    handleChangeCommitMessage (e) {
        this.setState({commitMessage: e.target.value});
    }

    handleChangeAuthorName (e) {
        this.setState({authorName: e.target.value});
    }

    handleChangeAuthorEmail (e) {
        this.setState({authorEmail: e.target.value});
    }

    handleChangeNewBranchName (e) {
        this.setState({newBranchName: e.target.value});
    }

    handleChangeMergeSourceBranch (e) {
        this.setState({mergeSourceBranch: e.target.value});
    }

    async handlePreviewMerge () {
        const ours = this.state.currentBranch;
        const theirs = this.state.mergeSourceBranch;
        if (!ours || !theirs) return;
        if (ours === theirs) {
            this.setState({error: 'Select a different branch to merge.'});
            return;
        }
        this.setState({
            busy: true,
            busyMessage: 'Analyzing merge…',
            busyProgress: null,
            error: null,
            mergeConflicts: [],
            mergeResolutions: {}
        });
        try {
            const preview = await mergeBranchesPreview({ours, theirs});
            const conflicts = Array.isArray(preview.conflicts) ? preview.conflicts : [];
            this.setState({mergeConflicts: conflicts});
        } catch (err) {
            this.setState({error: err && err.message ? err.message : String(err)});
        } finally {
            this.setState({busy: false, busyMessage: null, busyProgress: null});
        }
    }

    handleSetMergeResolution (path, choice) {
        if (!path) return;
        const c = choice === 'theirs' ? 'theirs' : 'ours';
        this.setState(prev => ({mergeResolutions: {...prev.mergeResolutions, [path]: c}}));
    }

    async handleResolveInEditor () {
        const ours = this.state.currentBranch;
        const theirs = this.state.mergeSourceBranch;
        if (!ours || !theirs) return;
        this.setState({busy: true, busyMessage: 'Preparing merge…', busyProgress: null, error: null});
        try {
            await this.waitForPollIdle();
            const {conflicts, merged} = await startEditorMerge({
                ours,
                theirs,
                author: {
                    name: this.state.authorName || 'User',
                    email: this.state.authorEmail || 'user@example.com'
                }
            });
            if (merged) {
                await restoreProjectFromCurrentRef(this.props.vm);
                this.setState({mergeConflicts: [], mergeResolutions: {}, mergeSourceBranch: ''});
                await this.refresh();
                return;
            }
            if (conflicts.length === 0) {
                this.setState({error: 'Only binary files conflict here; pick a side for each file instead.'});
                return;
            }
            this.props.onClose();
            openFractchMode();
        } catch (err) {
            this.setState({error: err && err.message ? err.message : String(err)});
        } finally {
            this.setState({busy: false, busyMessage: null, busyProgress: null});
        }
    }

    async handleApplyMerge () {
        const ours = this.state.currentBranch;
        const theirs = this.state.mergeSourceBranch;
        if (!ours || !theirs) return;
        this.setState({busy: true, busyMessage: 'Merging…', busyProgress: null, error: null});
        try {
            await this.waitForPollIdle();
            await mergeBranchesApply({
                ours,
                theirs,
                resolutions: this.state.mergeResolutions,
                author: {
                    name: this.state.authorName || 'User',
                    email: this.state.authorEmail || 'user@example.com'
                }
            });
            await restoreProjectFromCurrentRef(this.props.vm);
            this.setState({mergeConflicts: [], mergeResolutions: {}, mergeSourceBranch: ''});
            await this.refresh();
        } catch (err) {
            this.setState({error: err && err.message ? err.message : String(err)});
        } finally {
            this.setState({busy: false, busyMessage: null, busyProgress: null});
        }
    }

    async handleRoturLogin () {
        const api = getRoturSessionApi();
        if (!api || typeof api.login !== 'function') {
            this.setState({error: 'Rotur session is not ready yet. Try again in a moment.'});
            return;
        }
        try {
            const user = await api.login();
            if (user) {
                await this.handleLoadRoturRepos();
            }
        } catch (err) {
            this.setState({error: err && err.message ? err.message : String(err)});
        }
    }

    async handleLoadRoturRepos () {
        if (this.state.roturReposLoading) return;
        this.setState({roturReposLoading: true, error: null});
        try {
            const repos = await listRoturRepos();
            this.setState({roturRepos: repos, roturReposLoaded: true, roturReposLoading: false});
        } catch (err) {
            this.setState({
                roturReposLoading: false,
                error: err && err.message ? err.message : String(err)
            });
        }
    }

    handleChangeRoturNewRepoName (e) {
        this.setState({roturNewRepoName: e.target.value});
    }

    handleChangeRoturNewRepoDesc (e) {
        this.setState({roturNewRepoDesc: e.target.value});
    }

    handleToggleRoturNewRepoPrivate () {
        this.setState(prev => ({roturNewRepoPrivate: !prev.roturNewRepoPrivate}));
    }

    async handleCreateRoturRepo () {
        const name = this.state.roturNewRepoName.trim();
        if (!name) {
            this.setState({error: 'Repository name is required'});
            return;
        }
        this.setState({busy: true, busyMessage: `Creating ${name}…`, busyProgress: null, error: null});
        try {
            await createRoturRepo({
                name,
                description: this.state.roturNewRepoDesc.trim(),
                isPrivate: this.state.roturNewRepoPrivate,
                defaultBranch: this.state.defaultBranch || 'main'
            });
            this.setState({roturNewRepoName: '', roturNewRepoDesc: '', roturNewRepoPrivate: false});
            await this.handleLoadRoturRepos();
        } catch (err) {
            this.setState({error: err && err.message ? err.message : String(err)});
        } finally {
            this.setState({busy: false, busyMessage: null, busyProgress: null});
        }
    }

    async handleRoturPush (repo) {
        if (!repo || !repo.owner || !repo.name) return;
        this.setState({busy: true, busyMessage: `Pushing to ${repo.fullName}…`, busyProgress: null, error: null});
        try {
            await this.waitForPollIdle();
            let branch = this.state.currentBranch;
            if (!this.state.initialized) {
                branch = this.state.defaultBranch || 'main';
                await initRepo({
                    vm: this.props.vm,
                    defaultBranch: branch,
                    onProgress: this.handleGitProgress
                });
            }
            branch = branch || this.state.defaultBranch || 'main';

            const url = getRoturRemoteUrl(repo.owner, repo.name);
            const remotes = await getRemotes(this.props.vm);
            let remoteName = null;
            const matching = remotes.find(r => r.url === url);
            if (matching) {
                remoteName = matching.name;
            } else {
                remoteName = 'rotur';
                if (remotes.some(r => r.name === 'rotur')) {
                    await removeRemote({vm: this.props.vm, name: 'rotur'});
                }
                await addRemote({vm: this.props.vm, name: 'rotur', url});
            }

            await push({
                vm: this.props.vm,
                remote: remoteName,
                ref: branch,
                setUpstream: true,
                onProgress: this.handleGitProgress,
                onAuth: getRoturGitAuth
            });
            await this.handleLoadRoturRepos();
            await this.refresh();
        } catch (err) {
            this.setState({error: err && err.message ? err.message : String(err)});
        } finally {
            this.setState({busy: false, busyMessage: null, busyProgress: null});
        }
    }

    async handleRoturClone (repo) {
        if (!repo || !repo.cloneUrl) return;
        if (this.props.projectChanged && this.state.roturCloneConfirm !== repo.fullName) {
            this.setState({roturCloneConfirm: repo.fullName, error: null});
            return;
        }
        this.setState({
            roturCloneConfirm: null,
            busy: true,
            busyMessage: `Cloning ${repo.fullName}…`,
            busyProgress: null,
            error: null
        });
        try {
            await this.waitForPollIdle();
            await cloneRepo({
                url: repo.cloneUrl,
                onAuth: getRoturGitAuth,
                onProgress: this.handleGitProgress
            });
            await this.loadProjectFromClonedRepo();
            this.setState({roturCloneOther: ''});
            await this.refresh();
        } catch (err) {
            this.setState({error: err && err.message ? err.message : String(err)});
        } finally {
            this.setState({busy: false, busyMessage: null, busyProgress: null});
        }
    }

    handleChangeRoturCloneOther (e) {
        this.setState({roturCloneOther: e.target.value, roturCloneConfirm: null});
    }

    async handleRoturCloneOther () {
        const parsed = parseRoturRepoUrl(this.state.roturCloneOther.trim());
        if (!parsed) {
            this.setState({error: 'Enter a repo as owner/name or a git.rotur.dev URL'});
            return;
        }
        await this.handleRoturClone({
            fullName: parsed.fullName,
            cloneUrl: getRoturRemoteUrl(parsed.owner, parsed.name)
        });
    }

    async handleRoturDelete (repo) {
        if (!repo || !repo.owner || !repo.name) return;
        if (this.state.roturDeleteConfirm !== repo.fullName) {
            this.setState({roturDeleteConfirm: repo.fullName, error: null});
            return;
        }
        this.setState({
            roturDeleteConfirm: null,
            busy: true,
            busyMessage: `Deleting ${repo.fullName}…`,
            busyProgress: null,
            error: null
        });
        try {
            await deleteRoturRepoApi(repo.owner, repo.name);
            await this.handleLoadRoturRepos();
        } catch (err) {
            this.setState({error: err && err.message ? err.message : String(err)});
        } finally {
            this.setState({busy: false, busyMessage: null, busyProgress: null});
        }
    }

    render () {
        const canUndoCommit = Boolean(this.state.currentBranch) &&
            Array.isArray(this.state.commits) &&
            this.state.commits.length >= 2;

        let connectedRoturRepo = null;
        for (const remote of this.state.remotes || []) {
            if (isRoturGitUrl(remote.url)) {
                const parsed = parseRoturRepoUrl(remote.url);
                if (parsed) {
                    connectedRoturRepo = {...parsed, remoteName: remote.name};
                    break;
                }
            }
        }

        return (
            <GitModalComponent
                busy={this.state.busy}
                busyMessage={this.state.busyMessage}
                busyProgress={this.state.busyProgress}
                error={this.state.error}
                initialized={this.state.initialized}
                currentBranch={this.state.currentBranch}
                branches={this.state.branches}
                commits={this.state.commits}
                graphBranches={this.state.graphBranches}
                graphNodes={this.state.graphNodes}
                graphBranchLogs={this.state.graphBranchLogs}
                branchColors={this.state.branchColors}
                commitMessage={this.state.commitMessage}
                authorName={this.state.authorName}
                authorEmail={this.state.authorEmail}
                newBranchName={this.state.newBranchName}
                mergeSourceBranch={this.state.mergeSourceBranch}
                mergeConflicts={this.state.mergeConflicts}
                mergeResolutions={this.state.mergeResolutions}
                canUndoCommit={canUndoCommit}
                changes={this.state.changes}
                remotes={this.state.remotes}
                newRemoteName={this.state.newRemoteName}
                newRemoteUrl={this.state.newRemoteUrl}
                pushRemote={this.state.pushRemote}
                pushBranch={this.state.pushBranch}
                remoteToken={this.state.remoteToken}
                diffLoading={this.state.diffLoading}
                diffFilepath={this.state.diffFilepath}
                diffData={this.state.diffData}
                diffContext={this.state.diffContext}
                selectedCommitOid={this.state.selectedCommitOid}
                commitFiles={this.state.commitFiles}
                defaultBranch={this.state.defaultBranch}
                autoCommit={this.state.autoCommit}
                readmeContent={this.state.readmeContent}
                readmeDirty={this.state.readmeDirty}
                onChangeReadme={this.handleChangeReadme}
                onSaveReadme={this.handleSaveReadme}
                onChangeCommitMessage={this.handleChangeCommitMessage}
                onChangeAuthorName={this.handleChangeAuthorName}
                onChangeAuthorEmail={this.handleChangeAuthorEmail}
                onChangeNewBranchName={this.handleChangeNewBranchName}
                onCheckoutBranch={this.handleCheckoutBranch}
                onCreateBranch={this.handleCreateBranch}
                onCommit={this.handleCommit}
                onUndoCommit={this.handleUndoCommit}
                onInit={this.handleInit}
                cloneUrl={this.state.cloneUrl}
                cloneConfirm={this.state.cloneConfirm}
                onChangeCloneUrl={this.handleChangeCloneUrl}
                onClone={this.handleClone}
                onCancelClone={this.handleCancelClone}
                onRefresh={this.handleRefresh}
                onRestoreCommit={this.handleRestoreCommit}
                onDownloadCommit={this.handleDownloadCommit}
                onDeleteRepo={this.handleDeleteRepo}
                onDeleteBranch={this.handleDeleteBranch}
                onChangeMergeSourceBranch={this.handleChangeMergeSourceBranch}
                onPreviewMerge={this.handlePreviewMerge}
                onResolveInEditor={this.handleResolveInEditor}
                onSetMergeResolution={this.handleSetMergeResolution}
                onApplyMerge={this.handleApplyMerge}
                onDiffChangedFile={this.handleDiffChangedFile}
                onSelectCommit={this.handleSelectCommit}
                onDiffCommitFile={this.handleDiffCommitFile}
                onClearDiff={this.handleClearDiff}
                onChangeNewRemoteName={this.handleChangeNewRemoteName}
                onChangeNewRemoteUrl={this.handleChangeNewRemoteUrl}
                onChangePushRemote={this.handleChangePushRemote}
                onChangePushBranch={this.handleChangePushBranch}
                onChangeRemoteToken={this.handleChangeRemoteToken}
                onAddRemote={this.handleAddRemote}
                onRemoveRemote={this.handleRemoveRemote}
                onPush={this.handlePush}
                onChangeDefaultBranch={this.handleChangeDefaultBranch}
                onToggleAutoCommit={this.handleToggleAutoCommit}
                onClose={this.handleClose}
                roturUsername={this.props.roturUsername}
                roturRepos={this.state.roturRepos}
                roturReposLoaded={this.state.roturReposLoaded}
                roturReposLoading={this.state.roturReposLoading}
                roturNewRepoName={this.state.roturNewRepoName}
                roturNewRepoDesc={this.state.roturNewRepoDesc}
                roturNewRepoPrivate={this.state.roturNewRepoPrivate}
                roturCloneOther={this.state.roturCloneOther}
                roturCloneConfirm={this.state.roturCloneConfirm}
                roturDeleteConfirm={this.state.roturDeleteConfirm}
                connectedRoturRepo={connectedRoturRepo}
                onRoturLogin={this.handleRoturLogin}
                onLoadRoturRepos={this.handleLoadRoturRepos}
                onChangeRoturNewRepoName={this.handleChangeRoturNewRepoName}
                onChangeRoturNewRepoDesc={this.handleChangeRoturNewRepoDesc}
                onToggleRoturNewRepoPrivate={this.handleToggleRoturNewRepoPrivate}
                onCreateRoturRepo={this.handleCreateRoturRepo}
                onRoturPush={this.handleRoturPush}
                onRoturClone={this.handleRoturClone}
                onRoturDelete={this.handleRoturDelete}
                onChangeRoturCloneOther={this.handleChangeRoturCloneOther}
                onRoturCloneOther={this.handleRoturCloneOther}
            />
        );
    }
}

TWGitModal.propTypes = {
    onClose: PropTypes.func.isRequired,
    vm: PropTypes.instanceOf(VM).isRequired,
    projectChanged: PropTypes.bool,
    roturUsername: PropTypes.string
};

const mapStateToProps = state => ({
    vm: state.scratchGui.vm,
    projectChanged: state.scratchGui.projectChanged,
    roturUsername: (state.scratchGui.rotur && state.scratchGui.rotur.username) || null
});

const mapDispatchToProps = dispatch => ({
    onClose: () => dispatch(closeGitModal())
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(TWGitModal);
