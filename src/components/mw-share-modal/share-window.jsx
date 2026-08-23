import React from 'react';
import PropTypes from 'prop-types';
import {publishToMistWarp, captureThumbnailDataUri, prepareThumbnailBlob} from '../../lib/community/publish.js';
import {request} from '../../lib/community/api.js';
import styles from './share-window.css';

class ShareWindow extends React.Component {
    constructor (props) {
        super(props);
        this.handlePublish = this.handlePublish.bind(this);
        this.handleRetake = this.handleRetake.bind(this);
        this.handleUpload = this.handleUpload.bind(this);
        this.handleTitleChange = this.handleTitleChange.bind(this);
        this.handleChangeMessage = this.handleChangeMessage.bind(this);
        this.handleSkipVersion = this.handleSkipVersion.bind(this);
        this.handleAcceptAgreement = this.handleAcceptAgreement.bind(this);
        this.handleProgress = this.handleProgress.bind(this);
        this.prepareThumbnail = this.prepareThumbnail.bind(this);
        this.releaseAgreement = this.releaseAgreement.bind(this);
        this.releasePublish = this.releasePublish.bind(this);
        this.fileInput = React.createRef();
        this.agreementPromise = null;
        this.agreementInFlight = false;
        this.publishInFlight = false;
        this.thumbnailPreparation = null;
        this.thumbnailPreparationSource = null;
        this.state = {
            title: props.initialTitle || 'Untitled',
            changeMessage: '',
            skipVersion: false,
            thumbnail: null,
            thumbnailBlob: null,
            status: null,
            phase: null,
            loaded: 0,
            total: 0,
            error: props.initialError ? props.initialError.message : null,
            errorCode: props.initialError ? props.initialError.code : null,
            notice: null,
            done: null,
            agreement: null,
            agreeBusy: false,
            agreeError: ''
        };
    }
    componentDidMount () {
        this.agreementPromise = request('/agreement').catch(() => null);
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
        this.setState({changeMessage: event.target.value, skipVersion: false});
    }
    handleSkipVersion () {
        this.setState({skipVersion: true}, this.handlePublish);
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
    releaseAgreement () {
        this.agreementInFlight = false;
    }
    releasePublish () {
        this.publishInFlight = false;
    }
    async handlePublish () {
        if (this.publishInFlight || this.state.status || this.state.agreeBusy) {
            return;
        }
        const isUpdate = this.props.action === 'update';
        if (isUpdate && !this.state.skipVersion && !this.state.changeMessage.trim()) {
            this.setState({error: 'Add a short note about what changed.'});
            return;
        }
        this.publishInFlight = true;

        this.setState({
            status: 'Checking your account',
            phase: 'check',
            loaded: 0,
            total: 0,
            error: null,
            errorCode: null,
            notice: null,
            agreement: null
        });
        try {
            const agreementData = await (this.agreementPromise || request('/agreement'));
            const ag = agreementData && agreementData.agreement;
            if (ag && ag.version > 0 && !ag.accepted) {
                this.setState({status: null, phase: null, agreement: ag, agreeError: ''});
                this.releasePublish();
                return;
            }
        } catch (e) {
            // proceed with upload if agreement check fails
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
            const result = await publishToMistWarp({
                vm: this.props.vm,
                title: isUpdate ? null : this.state.title,
                changeMessage: this.state.changeMessage,
                commitChanges: !this.state.skipVersion,
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
            this.props.onPublished(result);
        } catch (e) {
            this.releasePublish();
            this.setState({
                status: null,
                phase: null,
                loaded: 0,
                total: 0,
                error: e.message || 'Could not save',
                errorCode: e.code || null
            });
        }
    }

    async handleAcceptAgreement () {
        if (this.agreementInFlight) return;
        this.agreementInFlight = true;
        this.setState({agreeBusy: true, agreeError: ''});
        try {
            await request('/agreement/accept', {method: 'POST'});
            this.agreementPromise = Promise.resolve({agreement: {version: 0, accepted: true}});
            this.releaseAgreement();
            this.setState({agreeBusy: false, agreement: null}, this.handlePublish);
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
            </div>
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
            detail = 'Compressing the project and its version history on this device.';
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
            detail = 'The project is saved. Refreshing local version history.';
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
        const actionLabel = this.props.action === 'remix' ? 'Remix' :
            this.props.action === 'update' ? 'Update' : 'Save';

        if (this.state.agreement) {
            return (
                <div className={styles.root}>
                    <div className={styles.body}>
                        <h3 className={styles.agreeTitle}>
                            Upload agreement v{this.state.agreement.version}
                        </h3>
                        <div className={styles.agreeBody}>
                            <pre className={styles.agreeText}>{this.state.agreement.text}</pre>
                        </div>
                        {this.state.agreeError ? (
                            <div className={styles.error}>{this.state.agreeError}</div>
                        ) : null}
                    </div>
                    <div className={styles.footer}>
                        <button
                            type="button"
                            className={styles.secondary}
                            onClick={() => this.setState({agreement: null, agreeError: ''})}
                            disabled={this.state.agreeBusy}
                        >Cancel</button>
                        <button
                            type="button"
                            className={styles.primary}
                            onClick={this.handleAcceptAgreement}
                            disabled={this.state.agreeBusy}
                        >
                            {this.state.agreeBusy ?
                                'Accepting…' :
                                `Accept v${this.state.agreement.version} & ${actionLabel.toLowerCase()}`}
                        </button>
                    </div>
                </div>
            );
        }

        if (this.state.done) {
            return (
                <div className={styles.root}>
                    <div className={styles.body}>
                        <p className={styles.doneMessage}>
                            {this.state.done.shared ?
                                'Your project is saved and shared.' :
                                'Your project is saved to MistWarp. ' +
                                'It stays private until you share it from its project page.'}
                        </p>
                        {this.state.notice ? <div className={styles.notice}>{this.state.notice}</div> : null}
                    </div>
                    <div className={styles.footer}>
                        <button
                            type="button"
                            className={styles.secondary}
                            onClick={this.props.onClose}
                        >Close</button>
                        <button
                            type="button"
                            className={styles.primary}
                            onClick={() => {
                                window.open(this.state.done.url, '_blank', 'noopener');
                                this.props.onClose();
                            }}
                        >Open project page</button>
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
                            {'Upload the current version of this project to MistWarp. ' +
                            'The title and thumbnail stay as they are; edit those on the project page.'}
                        </p>
                        <label className={styles.label} htmlFor="mw-share-change">What changed?</label>
                        <input
                            id="mw-share-change"
                            className={styles.input}
                            value={this.state.changeMessage}
                            disabled={!!this.state.status}
                            maxLength={120}
                            placeholder="For example: Added a new level"
                            onChange={this.handleChangeMessage}
                        />
                        {this.renderStatus()}
                        {this.renderError()}
                    </div>
                    <div className={styles.footer}>
                        <button
                            type="button"
                            className={styles.secondary}
                            onClick={this.props.onClose}
                            disabled={!!this.state.status}
                        >Cancel</button>
                        <button
                            type="button"
                            className={styles.secondary}
                            onClick={this.handleSkipVersion}
                            disabled={!!this.state.status}
                        >Skip</button>
                        <button
                            type="button"
                            className={styles.primary}
                            onClick={this.handlePublish}
                            disabled={!!this.state.status || !this.state.changeMessage.trim()}
                        >{this.state.status ? 'Saving…' : actionLabel}</button>
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
                            <button
                                type="button"
                                className={styles.secondary}
                                onClick={this.handleRetake}
                                disabled={!!this.state.status}
                            >Use current canvas</button>
                            <button
                                type="button"
                                className={styles.secondary}
                                onClick={() => this.fileInput.current && this.fileInput.current.click()}
                                disabled={!!this.state.status}
                            >Upload an image</button>
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
                    <button
                        type="button"
                        className={styles.secondary}
                        onClick={this.props.onClose}
                        disabled={!!this.state.status}
                    >Cancel</button>
                    <button
                        type="button"
                        className={styles.primary}
                        onClick={this.handlePublish}
                        disabled={!!this.state.status || !this.state.title.trim()}
                    >{this.state.status ? 'Saving…' : actionLabel}</button>
                </div>
            </div>
        );
    }
}

ShareWindow.propTypes = {
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
    onClose: PropTypes.func.isRequired,
    onReviewStorage: PropTypes.func.isRequired,
    onPublished: PropTypes.func.isRequired
};

ShareWindow.defaultProps = {
    action: 'save'
};

export default ShareWindow;
