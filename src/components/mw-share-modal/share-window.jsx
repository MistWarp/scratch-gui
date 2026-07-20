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
        this.handleAcceptAgreement = this.handleAcceptAgreement.bind(this);
        this.fileInput = React.createRef();
        this.state = {
            title: props.initialTitle || 'Untitled',
            thumbnail: null,
            status: null,
            error: null,
            notice: null,
            done: null,
            agreement: null,
            agreeBusy: false,
            agreeError: ''
        };
    }
    componentDidMount () {
        if (this.props.action === 'update') {
            return;
        }
        captureThumbnailDataUri(this.props.vm).then(thumbnail => {
            if (thumbnail && !this.state.thumbnail) {
                this.setState({thumbnail});
            }
        });
    }
    handleTitleChange (event) {
        this.setState({title: event.target.value});
    }
    handleRetake () {
        captureThumbnailDataUri(this.props.vm).then(thumbnail => {
            if (thumbnail) {
                this.setState({thumbnail});
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
        reader.onload = () => this.setState({thumbnail: reader.result});
        reader.readAsDataURL(file);
    }
    async handlePublish () {
        if (this.state.status || this.state.agreeBusy) {
            return;
        }
        const isUpdate = this.props.action === 'update';

        // Check agreement acceptance before uploading
        try {
            const agreementData = await request('/agreement');
            const ag = agreementData.agreement;
            if (ag.version > 0 && !ag.accepted) {
                this.setState({agreement: ag, agreeError: ''});
                return;
            }
        } catch (e) {
            // proceed with upload if agreement check fails
        }

        this.setState({status: 'Saving…', error: null, notice: null, agreement: null});
        let thumbnailBlob = null;
        if (!isUpdate && this.state.thumbnail) {
            try {
                thumbnailBlob = await prepareThumbnailBlob(this.state.thumbnail);
            } catch (e) {
                thumbnailBlob = null;
                this.setState({notice: 'Couldn\'t attach thumbnail; publishing without it.'});
            }
        }
        try {
            const result = await publishToMistWarp({
                vm: this.props.vm,
                title: isUpdate ? null : this.state.title,
                thumbnailBlob,
                updateOnly: isUpdate,
                onProgress: ({message}) => this.setState({status: message})
            });
            this.setState({status: null, done: result});
            this.props.onPublished(result);
        } catch (e) {
            this.setState({status: null, error: e.message || 'Could not save'});
        }
    }

    async handleAcceptAgreement () {
        this.setState({agreeBusy: true, agreeError: ''});
        try {
            await request('/agreement/accept', {method: 'POST'});
            this.setState({agreeBusy: false, agreement: null});
            // proceed with the save now that agreement is accepted
            this.handlePublish();
        } catch (e) {
            this.setState({agreeBusy: false, agreeError: e.message || 'Could not accept agreement.'});
        }
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
                            className={styles.secondary}
                            onClick={() => this.setState({agreement: null, agreeError: ''})}
                            disabled={this.state.agreeBusy}
                        >Cancel</button>
                        <button
                            className={styles.primary}
                            onClick={this.handleAcceptAgreement}
                            disabled={this.state.agreeBusy}
                        >
                            {this.state.agreeBusy ? 'Accepting…' : `Accept v${this.state.agreement.version} & ${actionLabel.toLowerCase()}`}
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
                    </div>
                    <div className={styles.footer}>
                        <button
                            className={styles.secondary}
                            onClick={this.props.onClose}
                        >Close</button>
                        <button
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
                        {this.state.error ? (
                            <div className={styles.error}>{this.state.error}</div>
                        ) : null}
                    </div>
                    <div className={styles.footer}>
                        <button
                            className={styles.secondary}
                            onClick={this.props.onClose}
                            disabled={!!this.state.status}
                        >Cancel</button>
                        <button
                            className={styles.primary}
                            onClick={this.handlePublish}
                            disabled={!!this.state.status}
                        >{this.state.status || actionLabel}</button>
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
                                className={styles.secondary}
                                onClick={this.handleRetake}
                                disabled={!!this.state.status}
                            >Use current canvas</button>
                            <button
                                className={styles.secondary}
                                onClick={() => this.fileInput.current && this.fileInput.current.click()}
                                disabled={!!this.state.status}
                            >Upload an image</button>
                            <input
                                ref={this.fileInput}
                                className={styles.hiddenInput}
                                type="file"
                                accept="image/*"
                                onChange={this.handleUpload}
                            />
                        </div>
                    </div>

                    {this.state.notice ? (
                        <div className={styles.notice}>{this.state.notice}</div>
                    ) : null}
                    {this.state.error ? (
                        <div className={styles.error}>{this.state.error}</div>
                    ) : null}
                </div>
                <div className={styles.footer}>
                    <button
                        className={styles.secondary}
                        onClick={this.props.onClose}
                        disabled={!!this.state.status}
                    >Cancel</button>
                    <button
                        className={styles.primary}
                        onClick={this.handlePublish}
                        disabled={!!this.state.status || !this.state.title.trim()}
                    >{this.state.status || actionLabel}</button>
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
    initialTitle: PropTypes.string,
    action: PropTypes.oneOf(['save', 'remix', 'update']),
    onClose: PropTypes.func.isRequired,
    onPublished: PropTypes.func.isRequired
};

ShareWindow.defaultProps = {
    action: 'save'
};

export default ShareWindow;
