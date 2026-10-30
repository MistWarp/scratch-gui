import {guardSavedCallback} from '../../lib/mw/save-guard.js';
import React from 'react';
import PropTypes from 'prop-types';
import {defineMessages, injectIntl} from 'react-intl';
import {
    publishToMistWarp, captureThumbnailDataUri, prepareThumbnailBlob, getRememberedPlatformProjectState
} from '../../lib/community/publish.js';
import {request} from '../../lib/community/api.js';
import Markdown from '../../community/components/Markdown.jsx';
import {login as roturLogin} from '../../lib/rotur/identity.js';
import Button from '../button/button.jsx';
import styles from './share-window.css';

const MAX_SHOWN_DIFFERENCES = 6;

const messages = defineMessages({
    cancel: {defaultMessage: 'Cancel', description: 'Cancel button in the share window', id: 'mw.shareWindow.cancel'},
    close: {defaultMessage: 'Close', description: 'Close button in the share window', id: 'mw.shareWindow.close'},
    openProjectPage: {
        defaultMessage: 'Open project page',
        description: 'Button that opens the shared project page',
        id: 'mw.shareWindow.openProjectPage'
    },
    saveWithoutVersion: {
        defaultMessage: 'Save without a version',
        description: 'Button that saves the project without creating a version',
        id: 'mw.shareWindow.saveWithoutVersion'
    },
    createVersionAndSave: {
        defaultMessage: 'Create version and save',
        description: 'Button that creates a version and saves the project',
        id: 'mw.shareWindow.createVersionAndSave'
    },
    useCurrentCanvas: {
        defaultMessage: 'Use current canvas',
        description: 'Button that captures the stage as the project thumbnail',
        id: 'mw.shareWindow.useCurrentCanvas'
    },
    uploadImage: {
        defaultMessage: 'Upload an image',
        description: 'Button that picks a thumbnail image from the computer',
        id: 'mw.shareWindow.uploadImage'
    },
    notExactIntro: {
        defaultMessage: 'Saving this version in history would change these parts of the project:',
        description: 'Shown above a list of the parts of a project that would not be kept exactly in a saved version',
        id: 'mw.shareWindow.notExactIntro'
    },
    notExactMore: {
        defaultMessage: '{count, plural, one {# more part would change too.} other {# more parts would change too.}}',
        description: 'Last item of the list of parts that a saved version would change, when the list is cut short',
        id: 'mw.shareWindow.notExactMore'
    },
    saveAnyway: {
        defaultMessage: 'Save this version anyway',
        description: 'Button that saves a version even though some parts of the project would change',
        id: 'mw.shareWindow.saveAnyway'
    },
    postToClaw: {
        defaultMessage: 'Post to claw',
        description: 'Button on the saved screen that opens a composer to post the shared project to claw',
        id: 'mw.shareWindow.postToClaw'
    },
    clawSignIn: {
        defaultMessage: 'Sign in to Rotur to post to claw.',
        description: 'Shown when posting to claw needs a Rotur sign-in first',
        id: 'mw.shareWindow.clawSignIn'
    },
    clawSignInButton: {
        defaultMessage: 'Sign in',
        description: 'Button next to the notice that posting to claw needs a Rotur sign-in',
        id: 'mw.shareWindow.clawSignInButton'
    },
    clawOpenFailed: {
        defaultMessage: 'Could not open the claw composer. Check your connection and try again.',
        description: 'Shown when the post to claw composer fails to load',
        id: 'mw.shareWindow.clawOpenFailed'
    },
    saving: {defaultMessage: 'Saving…', description: 'Busy label while the project saves', id: 'mw.shareWindow.saving'},
    remix: {defaultMessage: 'Remix', description: 'Confirm button when remixing', id: 'mw.shareWindow.remix'},
    update: {defaultMessage: 'Update', description: 'Confirm button when updating', id: 'mw.shareWindow.update'},
    save: {defaultMessage: 'Save', description: 'Confirm button when saving a project', id: 'mw.shareWindow.save'},
    changeMessagePlaceholder: {
        defaultMessage: 'For example: Added a new level',
        description: 'Placeholder for the change summary input in the share window',
        id: 'mw.shareWindow.changeMessagePlaceholder'
    }
});

class ShareWindow extends React.Component {
    constructor (props) {
        super(props);
        this.handlePublish = this.handlePublish.bind(this);
        this.handleSkipSave = this.handleSkipSave.bind(this);
        this.handleRetake = this.handleRetake.bind(this);
        this.handleUpload = this.handleUpload.bind(this);
        this.handleTitleChange = this.handleTitleChange.bind(this);
        this.handleChangeMessage = this.handleChangeMessage.bind(this);
        this.handleAcceptAgreement = this.handleAcceptAgreement.bind(this);
        this.handleProgress = this.handleProgress.bind(this);
        this.handlePostToClaw = this.handlePostToClaw.bind(this);
        this.handleClawSignIn = this.handleClawSignIn.bind(this);
        this.handleSaveAnyway = this.handleSaveAnyway.bind(this);
        this.prepareThumbnail = this.prepareThumbnail.bind(this);
        this.releaseAgreement = this.releaseAgreement.bind(this);
        this.releasePublish = this.releasePublish.bind(this);
        this.fileInput = React.createRef();
        this.agreementPromise = null;
        this.agreementInFlight = false;
        this.publishInFlight = false;
        this.pendingPublish = null;
        this.initialDestination = getRememberedPlatformProjectState()?.id;
        this.thumbnailPreparation = null;
        this.thumbnailPreparationSource = null;
        this.state = {
            title: props.initialTitle || 'Untitled',
            changeMessage: '',
            thumbnail: null,
            thumbnailBlob: null,
            status: null,
            phase: null,
            loaded: 0,
            total: 0,
            error: props.initialError ? props.initialError.message : null,
            errorCode: props.initialError ? props.initialError.code : null,
            differences: props.initialError && Array.isArray(props.initialError.differences) ?
                props.initialError.differences : [],
            notice: null,
            done: null,
            agreement: null,
            agreeBusy: false,
            agreeError: ''
        };
    }
    componentDidMount () {
        if (this.props.onRegisterBusyCheck) {
            this.props.onRegisterBusyCheck(() => this.publishInFlight || this.state.agreeBusy);
        }
        this.agreementPromise = request('/agreement').then(
            data => ({data}),
            error => ({error})
        );
        if (this.props.action === 'update') {
            return;
        }
        captureThumbnailDataUri(this.props.vm).then(thumbnail => {
            if (thumbnail && !this.state.thumbnail) {
                this.prepareThumbnail(thumbnail);
            }
        });
    }
    handleTitleChange (event) {
        this.setState({title: event.target.value});
    }
    handleChangeMessage (event) {
        this.setState({changeMessage: event.target.value});
    }
    prepareThumbnail (thumbnail) {
        this.thumbnailPreparationSource = thumbnail;
        this.setState({thumbnail, thumbnailBlob: null});
        this.thumbnailPreparation = prepareThumbnailBlob(thumbnail).then(thumbnailBlob => {
            if (this.thumbnailPreparationSource === thumbnail) {
                this.setState({thumbnailBlob});
            }
            return thumbnailBlob;
        });
        return this.thumbnailPreparation;
    }
    handleRetake () {
        captureThumbnailDataUri(this.props.vm).then(thumbnail => {
            if (thumbnail) {
                this.prepareThumbnail(thumbnail);
            }
        });
    }
    handleUpload (event) {
        const file = event.target.files && event.target.files[0];
        event.target.value = '';
        if (!file) {
            return;
        }
        const reader = new FileReader();
        reader.onload = () => this.prepareThumbnail(reader.result);
        reader.readAsDataURL(file);
    }
    handleProgress ({phase, message, loaded = 0, total = 0}) {
        this.setState({phase, status: message, loaded, total});
    }
    async handlePostToClaw () {
        const done = this.state.done;
        let opened = false;
        try {
            const {default: openClawPost} = await import('../../lib/mw/open-claw-post.js');
            opened = await openClawPost({id: String(done.id), title: this.state.title});
        } catch (e) {
            this.setState({clawNeedsSignIn: false, notice: this.props.intl.formatMessage(messages.clawOpenFailed)});
            return;
        }
        if (opened) {
            this.props.onClose();
        } else {
            this.setState({clawNeedsSignIn: true});
        }
    }
    async handleClawSignIn () {
        try {
            await roturLogin();
        } catch (e) {
            return;
        }
        this.setState({clawNeedsSignIn: false});
        await this.handlePostToClaw();
    }
    releaseAgreement () {
        this.agreementInFlight = false;
    }
    releasePublish () {
        this.publishInFlight = false;
    }
    handlePublish () {
        const isUpdate = this.props.action === 'update';
        if (isUpdate && !this.state.changeMessage.trim()) {
            this.setState({error: 'Add a short note about what changed.'});
            return Promise.resolve();
        }
        return this.runPublish({commitChanges: true, changeMessage: this.state.changeMessage});
    }
    handleSkipSave () {
        // Save to MistWarp without creating a version. The uploaded worktree
        // snapshot preserves the edits, which stay as uncommitted changes.
        return this.runPublish({commitChanges: false, changeMessage: ''});
    }
    handleSaveAnyway () {
        const pending = this.pendingPublish;
        if (!pending) return Promise.resolve();
        return this.runPublish({...pending, allowLoss: true});
    }
    async runPublish ({commitChanges, changeMessage, allowLoss = false}) {
        if (this.publishInFlight || this.state.status || this.state.agreeBusy) {
            return;
        }
        if (this.initialDestination !== getRememberedPlatformProjectState()?.id) {
            this.setState({error: 'The workspace changed. Close this window and save from the current workspace.'});
            return;
        }
        const isUpdate = this.props.action === 'update';
        this.publishInFlight = true;
        this.pendingPublish = {commitChanges, changeMessage, allowLoss};
        const destination = getRememberedPlatformProjectState()?.id;
        const onSaved = guardSavedCallback(this.props.vm, this.props.onPublished);

        this.setState({
            status: 'Checking your account',
            phase: 'check',
            loaded: 0,
            total: 0,
            error: null,
            errorCode: null,
            differences: [],
            notice: null,
            agreement: null
        });
        try {
            const agreementResult = await (this.agreementPromise || request('/agreement').then(
                data => ({data}),
                error => ({error})
            ));
            if (agreementResult.error) throw agreementResult.error;
            const agreementData = agreementResult.data;
            const ag = agreementData && agreementData.agreement;
            if (ag && ag.version > 0 && !ag.accepted) {
                this.setState({status: null, phase: null, agreement: ag, agreeError: ''});
                this.releasePublish();
                return;
            }
        } catch (e) {
            this.releasePublish();
            this.setState({
                status: null,
                phase: null,
                error: 'Could not load the community guidelines. Check your connection and try again.'
            });
            return;
        }

        this.setState({status: 'Preparing your project', phase: 'package'});
        let thumbnailBlob = null;
        if (!isUpdate && this.state.thumbnail) {
            try {
                thumbnailBlob = this.state.thumbnailBlob;
                if (!thumbnailBlob && this.thumbnailPreparationSource === this.state.thumbnail) {
                    thumbnailBlob = await this.thumbnailPreparation;
                }
                if (!thumbnailBlob) {
                    thumbnailBlob = await this.prepareThumbnail(this.state.thumbnail);
                }
            } catch (e) {
                thumbnailBlob = null;
                this.setState({notice: 'Couldn\'t attach thumbnail; publishing without it.'});
            }
        }
        try {
            if (destination !== getRememberedPlatformProjectState()?.id) {
                throw new Error('The open workspace changed. Close this window and save from the current workspace.');
            }
            const result = await publishToMistWarp({
                vm: this.props.vm,
                title: isUpdate ? null : this.state.title,
                changeMessage,
                commitChanges,
                allowLoss,
                thumbnailBlob,
                updateOnly: isUpdate,
                onProgress: this.handleProgress
            });
            const remoteWarnings = result.remoteWarnings || [];
            this.setState({
                status: null,
                phase: null,
                loaded: 0,
                total: 0,
                done: result,
                notice: remoteWarnings.length ?
                    `Saved to MistWarp, but ${remoteWarnings.map(remote => remote.name).join(', ')} could not sync.` :
                    this.state.notice
            });
            this.releasePublish();
            onSaved(result);
        } catch (e) {
            this.releasePublish();
            if (e.code === 'agreement_required' && e.data && e.data.agreement) {
                this.agreementPromise = Promise.resolve({data: {agreement: e.data.agreement}});
                this.setState({
                    status: null,
                    phase: null,
                    loaded: 0,
                    total: 0,
                    agreement: e.data.agreement,
                    agreeError: '',
                    error: null,
                    errorCode: null
                });
                return;
            }
            this.setState({
                status: null,
                phase: null,
                loaded: 0,
                total: 0,
                error: e.message || 'Could not save',
                errorCode: e.code || null,
                differences: Array.isArray(e.differences) ? e.differences : []
            });
        }
    }

    async handleAcceptAgreement () {
        if (this.agreementInFlight) return;
        this.agreementInFlight = true;
        this.setState({agreeBusy: true, agreeError: ''});
        try {
            await request('/agreement/accept', {method: 'POST'});
            this.agreementPromise = Promise.resolve({data: {agreement: {version: 0, accepted: true}}});
            this.releaseAgreement();
            const pending = this.pendingPublish;
            this.setState({agreeBusy: false, agreement: null}, () => (
                pending ? this.runPublish(pending) : this.handlePublish()
            ));
        } catch (e) {
            this.releaseAgreement();
            this.setState({agreeBusy: false, agreeError: e.message || 'Could not accept agreement.'});
        }
    }
    renderError () {
        if (!this.state.error) return null;
        return (
            <div className={styles.errorPanel}>
                <div className={styles.error}>{this.state.error}</div>
                {this.state.errorCode === 'project_too_large' && (
                    <button
                        type="button"
                        className={styles.reviewStorage}
                        onClick={this.props.onReviewStorage}
                    >
                        {'Check project storage'}
                    </button>
                )}
                {this.state.errorCode === 'project_not_exact' && this.renderDifferences()}
                {this.state.errorCode === 'storage_full' && (
                    <a
                        className={styles.reviewStorage}
                        href="https://rotur.dev/membership"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        {'Get more storage with a Rotur membership'}
                    </a>
                )}
            </div>
        );
    }
    renderDifferences () {
        const differences = this.state.differences;
        const shown = differences.slice(0, MAX_SHOWN_DIFFERENCES);
        const hidden = differences.length - shown.length;
        return (
            <React.Fragment>
                <div className={styles.notice}>
                    {this.props.intl.formatMessage(messages.notExactIntro)}
                </div>
                <ul className={styles.differences}>
                    {shown.map((difference, index) => (
                        <li
                            key={index}
                            title={difference.detail || null}
                        >
                            {difference.target ? `${difference.target}: ${difference.message}` : difference.message}
                        </li>
                    ))}
                    {hidden > 0 && <li>{this.props.intl.formatMessage(messages.notExactMore, {count: hidden})}</li>}
                </ul>
                {this.pendingPublish && (
                    <button
                        type="button"
                        className={styles.reviewStorage}
                        onClick={this.handleSaveAnyway}
                    >
                        {this.props.intl.formatMessage(messages.saveAnyway)}
                    </button>
                )}
            </React.Fragment>
        );
    }
    renderStatus () {
        if (!this.state.status) return null;
        const uploading = this.state.phase === 'upload';
        const hasUploadTotal = uploading && this.state.total > 0;
        const uploadComplete = hasUploadTotal && this.state.loaded >= this.state.total;
        let detail = 'Nothing has been uploaded yet.';
        if (this.state.phase === 'register') {
            detail = 'Setting up the project page.';
        } else if (this.state.phase === 'package') {
            detail = 'Compressing the project and its pushed history on this device.';
        } else if (uploading && uploadComplete) {
            detail = 'Upload complete. MistWarp is validating and storing the files.';
        } else if (uploading && hasUploadTotal) {
            const loadedMb = (this.state.loaded / 1048576).toFixed(1);
            const totalMb = (this.state.total / 1048576).toFixed(1);
            detail = `${loadedMb} MB of ${totalMb} MB sent.`;
        } else if (uploading) {
            detail = 'Sending the project to MistWarp.';
        } else if (this.state.phase === 'sync') {
            detail = 'The project is saved. Updating its connected repositories.';
        } else if (this.state.phase === 'finish') {
            detail = 'The project is saved. Refreshing pushed project history.';
        } else if (this.state.phase === 'publish') {
            detail = 'Making the saved project visible to other people.';
        }
        const percent = hasUploadTotal ? Math.min(100, (this.state.loaded / this.state.total) * 100) : null;
        return (
            <div
                className={styles.uploadStatus}
                aria-live="polite"
            >
                <div className={styles.statusHeader}>
                    <span className={styles.spinner} />
                    <strong>{this.state.status}</strong>
                </div>
                <div className={styles.statusDetail}>{detail}</div>
                <div className={styles.progressTrack}>
                    <div
                        className={percent === null ? styles.progressIndeterminate : styles.progressValue}
                        style={percent === null ? null : {width: `${percent}%`}}
                    />
                </div>
            </div>
        );
    }
    render () {
        const {intl} = this.props;
        const actionLabel = intl.formatMessage(this.props.action === 'remix' ? messages.remix :
            this.props.action === 'update' ? messages.update : messages.save);

        if (this.state.agreement) {
            return (
                <div className={styles.root}>
                    <div className={styles.body}>
                        <h3 className={styles.agreeTitle}>
                            Upload agreement v{this.state.agreement.version}
                        </h3>
                        <div className={styles.agreeBody}>
                            <Markdown className={styles.agreeText}>{this.state.agreement.text}</Markdown>
                        </div>
                        {this.state.agreeError ? (
                            <div className={styles.error}>{this.state.agreeError}</div>
                        ) : null}
                    </div>
                    <div className={styles.footer}>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => this.setState({agreement: null, agreeError: ''})}
                            disabled={this.state.agreeBusy}
                        >{intl.formatMessage(messages.cancel)}</Button>
                        <Button
                            type="button"
                            variant="primary"
                            onClick={this.handleAcceptAgreement}
                            disabled={this.state.agreeBusy}
                        >
                            {this.state.agreeBusy ?
                                'Accepting…' :
                                `Accept v${this.state.agreement.version} & ${actionLabel.toLowerCase()}`}
                        </Button>
                    </div>
                </div>
            );
        }

        if (this.state.done) {
            return (
                <div className={styles.root}>
                    <div className={styles.body}>
                        <p className={styles.doneMessage}>
                            {this.props.student ? 'Your project is saved to your class.' :
                                this.state.done.shared ?
                                    'Your project is saved and shared.' :
                                    'Your project is saved to MistWarp. ' +
                                    'It stays private until you share it from its project page.'}
                        </p>
                        {this.state.notice ? <div className={styles.notice}>{this.state.notice}</div> : null}
                        {this.state.clawNeedsSignIn ? (
                            <div className={styles.notice}>
                                {intl.formatMessage(messages.clawSignIn)}
                                <Button
                                    type="button"
                                    variant="secondary"
                                    className={styles.inlineButton}
                                    onClick={this.handleClawSignIn}
                                >{intl.formatMessage(messages.clawSignInButton)}</Button>
                            </div>
                        ) : null}
                    </div>
                    <div className={styles.footer}>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={this.props.onClose}
                        >{intl.formatMessage(messages.close)}</Button>
                        {this.state.done.shared && this.state.done.id && !this.props.student ? (
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={this.handlePostToClaw}
                            >{intl.formatMessage(messages.postToClaw)}</Button>
                        ) : null}
                        {this.props.student ? null : (
                            <Button
                                type="button"
                                variant="primary"
                                onClick={() => {
                                    window.open(this.state.done.url, '_blank', 'noopener');
                                    this.props.onClose();
                                }}
                            >{intl.formatMessage(messages.openProjectPage)}</Button>
                        )}
                    </div>
                </div>
            );
        }
        const isUpdate = this.props.action === 'update';
        if (isUpdate) {
            return (
                <div className={styles.root}>
                    <div className={styles.body}>
                        <p className={styles.doneMessage}>
                            {this.props.vm._mwHistoryHydration?.replaceHistory ?
                                'Saving replaces the saved project and all its commits and branches ' +
                                'with the imported history.' :
                                'Saving replaces the saved project code. Existing commits stay in history.'}
                            {' Save without a version uploads your code without adding a commit. ' +
                            'Create version and save adds a named commit. Cancel uploads nothing.'}
                        </p>
                        <label className={styles.label} htmlFor="mw-share-change">What changed?</label>
                        <input
                            id="mw-share-change"
                            className={styles.input}
                            value={this.state.changeMessage}
                            disabled={!!this.state.status}
                            maxLength={120}
                            placeholder={this.props.intl.formatMessage(messages.changeMessagePlaceholder)}
                            onChange={this.handleChangeMessage}
                        />
                        <p className={styles.notice}>
                            {'Write the name yourself.'}
                        </p>
                        {this.state.notice ? <div className={styles.notice}>{this.state.notice}</div> : null}
                        {this.renderStatus()}
                        {this.renderError()}
                    </div>
                    <div className={styles.footer}>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={this.props.onClose}
                            disabled={!!this.state.status}
                        >{intl.formatMessage(messages.cancel)}</Button>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={this.handleSkipSave}
                            disabled={!!this.state.status}
                        >{intl.formatMessage(messages.saveWithoutVersion)}</Button>
                        <Button
                            type="button"
                            variant="primary"
                            onClick={this.handlePublish}
                            disabled={!!this.state.status || !this.state.changeMessage.trim()}
                        >
                            {intl.formatMessage(this.state.status ? messages.saving : messages.createVersionAndSave)}
                        </Button>
                    </div>
                </div>
            );
        }
        return (
            <div className={styles.root}>
                <div className={styles.body}>
                    <label className={styles.label} htmlFor="mw-share-title">Title</label>
                    <input
                        id="mw-share-title"
                        className={styles.input}
                        value={this.state.title}
                        disabled={!!this.state.status}
                        maxLength={100}
                        onChange={this.handleTitleChange}
                    />

                    <div className={styles.label}>Thumbnail</div>
                    <div className={styles.thumbRow}>
                        {this.state.thumbnail ? (
                            <img
                                className={styles.thumb}
                                src={this.state.thumbnail}
                                alt="Project thumbnail"
                            />
                        ) : (
                            <div className={styles.thumbEmpty}>No preview</div>
                        )}
                        <div className={styles.thumbButtons}>
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={this.handleRetake}
                                disabled={!!this.state.status}
                            >{intl.formatMessage(messages.useCurrentCanvas)}</Button>
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => this.fileInput.current && this.fileInput.current.click()}
                                disabled={!!this.state.status}
                            >{intl.formatMessage(messages.uploadImage)}</Button>
                            <input
                                ref={this.fileInput}
                                className={styles.hiddenInput}
                                type="file"
                                disabled={!!this.state.status}
                                accept="image/*"
                                onChange={this.handleUpload}
                            />
                        </div>
                    </div>

                    {this.state.notice ? (
                        <div className={styles.notice}>{this.state.notice}</div>
                    ) : null}
                    {this.renderStatus()}
                    {this.renderError()}
                </div>
                <div className={styles.footer}>
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={this.props.onClose}
                        disabled={!!this.state.status}
                    >{intl.formatMessage(messages.cancel)}</Button>
                    <Button
                        type="button"
                        variant="primary"
                        onClick={this.handlePublish}
                        disabled={!!this.state.status || !this.state.title.trim()}
                    >{this.state.status ? intl.formatMessage(messages.saving) : actionLabel}</Button>
                </div>
            </div>
        );
    }
}

ShareWindow.propTypes = {
    intl: PropTypes.shape({formatMessage: PropTypes.func.isRequired}).isRequired,
    vm: PropTypes.shape({
        saveProjectSb3: PropTypes.func,
        renderer: PropTypes.object
    }).isRequired,
    initialError: PropTypes.shape({
        code: PropTypes.string,
        message: PropTypes.string
    }),
    initialTitle: PropTypes.string,
    action: PropTypes.oneOf(['save', 'remix', 'update']),
    student: PropTypes.bool,
    onClose: PropTypes.func.isRequired,
    onReviewStorage: PropTypes.func.isRequired,
    onPublished: PropTypes.func.isRequired,
    onRegisterBusyCheck: PropTypes.func
};

ShareWindow.defaultProps = {
    action: 'save'
};

export {ShareWindow};
export default injectIntl(ShareWindow);
