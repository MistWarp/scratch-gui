import PropTypes from 'prop-types';
import React from 'react';
import bindAll from 'lodash.bindall';
import {connect} from 'react-redux';
import VM from 'scratch-vm';

import GitModalComponent from '../components/tw-git-modal/git-modal.jsx';
import {closeGitModal} from '../reducers/modals.js';

import downloadBlob from '../lib/utils/download-blob.js';
import JSZip from 'jszip';

import {
    getDefaultAuthor,
    getRepoStatus,
    initRepo,
    createBranch,
    checkoutBranchAndRestore,
    checkoutCommitAndRestore,
    readSnapshotAtCommit,
    exportRepoToGitJsonString,
    deleteRepo,
    deleteBranch,
    commitProject
} from '../lib/git/browser-git.js';

class TWGitModal extends React.Component {
    constructor (props) {
        super(props);

        const author = getDefaultAuthor();

        this.state = {
            busy: false,
            error: null,
            initialized: false,
            currentBranch: null,
            branches: [],
            commits: [],
            commitMessage: '',
            authorName: author.name,
            authorEmail: author.email,
            newBranchName: ''
        };

        bindAll(this, [
            'refresh',
            'handleRefresh',
            'handleInit',
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
            'handleChangeNewBranchName'
        ]);
    }

    componentDidMount () {
        this.refresh();
    }

    async refresh () {
        this.setState({busy: true, error: null});
        try {
            const status = await getRepoStatus();
            this.setState({
                initialized: status.initialized,
                currentBranch: status.currentBranch,
                branches: status.branches,
                commits: status.commits
            });
        } catch (err) {
            this.setState({error: err && err.message ? err.message : String(err)});
        } finally {
            this.setState({busy: false});
        }
    }

    handleRefresh () {
        this.refresh();
    }

    async handleInit () {
        this.setState({busy: true, error: null});
        try {
            await initRepo({vm: this.props.vm});
            await this.refresh();
        } catch (err) {
            this.setState({error: err && err.message ? err.message : String(err)});
        } finally {
            this.setState({busy: false});
        }
    }

    async handleCommit () {
        const message = this.state.commitMessage.trim();
        if (!message) return;

        this.setState({busy: true, error: null});
        try {
            await commitProject({
                vm: this.props.vm,
                message,
                author: {
                    name: this.state.authorName || 'User',
                    email: this.state.authorEmail || 'user@example.com'
                }
            });
            this.setState({commitMessage: ''});
            await this.refresh();
        } catch (err) {
            this.setState({error: err && err.message ? err.message : String(err)});
        } finally {
            this.setState({busy: false});
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

        this.setState({busy: true, error: null});
        try {
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
                }
            });

            await this.refresh();
        } catch (err) {
            this.setState({error: err && err.message ? err.message : String(err)});
        } finally {
            this.setState({busy: false});
        }
    }

    async handleCreateBranch () {
        const ref = this.state.newBranchName.trim();
        if (!ref) return;

        this.setState({busy: true, error: null});
        try {
            await createBranch(ref);
            await checkoutBranchAndRestore({vm: this.props.vm, ref});
            this.setState({newBranchName: ''});
            await this.refresh();
        } catch (err) {
            this.setState({error: err && err.message ? err.message : String(err)});
        } finally {
            this.setState({busy: false});
        }
    }

    async handleCheckoutBranch (e) {
        const ref = e && e.target ? e.target.value : null;
        if (!ref) return;

        this.setState({busy: true, error: null});
        try {
            await checkoutBranchAndRestore({vm: this.props.vm, ref});
            await this.refresh();
        } catch (err) {
            this.setState({error: err && err.message ? err.message : String(err)});
        } finally {
            this.setState({busy: false});
        }
    }

    async handleRestoreCommit (e) {
        const oid = e && e.currentTarget ? e.currentTarget.dataset.oid : null;
        if (!oid) return;

        this.setState({busy: true, error: null});
        try {
            await checkoutCommitAndRestore({vm: this.props.vm, oid});
            await this.refresh();
        } catch (err) {
            this.setState({error: err && err.message ? err.message : String(err)});
        } finally {
            this.setState({busy: false});
        }
    }

    async handleDownloadCommit (e) {
        const oid = e && e.currentTarget ? e.currentTarget.dataset.oid : null;
        if (!oid) return;

        this.setState({busy: true, error: null});
        try {
            const sb3ArrayBuffer = await readSnapshotAtCommit(oid);
            const gitJson = await exportRepoToGitJsonString();

            let outBuffer = sb3ArrayBuffer;
            if (gitJson) {
                const zip = await JSZip.loadAsync(sb3ArrayBuffer);
                zip.file('git.json', gitJson);
                outBuffer = await zip.generateAsync({
                    type: 'arraybuffer',
                    mimeType: 'application/x.scratch.sb3',
                    compression: 'DEFLATE'
                });
            }

            const short = oid.slice(0, 7);
            downloadBlob(`commit-${short}.sb3`, new Blob([outBuffer], {type: 'application/x.scratch.sb3'}));
        } catch (err) {
            this.setState({error: err && err.message ? err.message : String(err)});
        } finally {
            this.setState({busy: false});
        }
    }

    async handleDeleteRepo () {
        // eslint-disable-next-line no-alert
        const ok = confirm(
            'Delete this Git repository?\n\nThis removes the repo from this browser session/storage. ' +
            'If you want to keep history, save the project first so git.json is embedded in the SB3.'
        );
        if (!ok) return;

        this.setState({busy: true, error: null});
        try {
            await deleteRepo();
            await this.refresh();
        } catch (err) {
            this.setState({error: err && err.message ? err.message : String(err)});
        } finally {
            this.setState({busy: false});
        }
    }

    async handleDeleteBranch (e) {
        const ref = e && e.currentTarget ? e.currentTarget.dataset.ref : null;
        if (!ref) return;

        this.setState({busy: true, error: null});
        try {
            await deleteBranch(ref);
            await this.refresh();
        } catch (err) {
            this.setState({error: err && err.message ? err.message : String(err)});
        } finally {
            this.setState({busy: false});
        }
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

    render () {
        const canUndoCommit = Boolean(this.state.currentBranch) &&
            Array.isArray(this.state.commits) &&
            this.state.commits.length >= 2;

        return (
            <GitModalComponent
                busy={this.state.busy}
                error={this.state.error}
                initialized={this.state.initialized}
                currentBranch={this.state.currentBranch}
                branches={this.state.branches}
                commits={this.state.commits}
                commitMessage={this.state.commitMessage}
                authorName={this.state.authorName}
                authorEmail={this.state.authorEmail}
                newBranchName={this.state.newBranchName}
                canUndoCommit={canUndoCommit}
                onChangeCommitMessage={this.handleChangeCommitMessage}
                onChangeAuthorName={this.handleChangeAuthorName}
                onChangeAuthorEmail={this.handleChangeAuthorEmail}
                onChangeNewBranchName={this.handleChangeNewBranchName}
                onCheckoutBranch={this.handleCheckoutBranch}
                onCreateBranch={this.handleCreateBranch}
                onCommit={this.handleCommit}
                onUndoCommit={this.handleUndoCommit}
                onInit={this.handleInit}
                onRefresh={this.handleRefresh}
                onRestoreCommit={this.handleRestoreCommit}
                onDownloadCommit={this.handleDownloadCommit}
                onDeleteRepo={this.handleDeleteRepo}
                onDeleteBranch={this.handleDeleteBranch}
                onClose={this.handleClose}
            />
        );
    }
}

TWGitModal.propTypes = {
    onClose: PropTypes.func.isRequired,
    vm: PropTypes.instanceOf(VM).isRequired
};

const mapStateToProps = state => ({
    vm: state.scratchGui.vm
});

const mapDispatchToProps = dispatch => ({
    onClose: () => dispatch(closeGitModal())
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(TWGitModal);
