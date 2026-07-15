import React from 'react';
import PropTypes from 'prop-types';
import {publishToMistWarp, captureThumbnailDataUri} from '../../lib/community/publish.js';
import styles from './share-window.css';

class ShareWindow extends React.Component {
    constructor (props) {
        super(props);
        this.handlePublish = this.handlePublish.bind(this);
        this.handleRetake = this.handleRetake.bind(this);
        this.handleUpload = this.handleUpload.bind(this);
        this.handleTitleChange = this.handleTitleChange.bind(this);
        this.fileInput = React.createRef();
        this.state = {
            title: props.initialTitle || 'Untitled',
            thumbnail: null,
            status: null,
            error: null
        };
    }
    componentDidMount () {
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
        if (this.state.status) {
            return;
        }
        this.setState({status: 'Publishing…', error: null});
        let thumbnailBlob = null;
        if (this.state.thumbnail) {
            try {
                thumbnailBlob = await (await fetch(this.state.thumbnail)).blob();
            } catch (e) {
                thumbnailBlob = null;
            }
        }
        try {
            const result = await publishToMistWarp({
                vm: this.props.vm,
                title: this.state.title,
                thumbnailBlob,
                onProgress: ({message}) => this.setState({status: message})
            });
            this.props.onPublished(result);
        } catch (e) {
            this.setState({status: null, error: e.message || 'Could not publish'});
        }
    }
    render () {
        const actionLabel = this.props.action === 'remix' ? 'Remix' :
            this.props.action === 'update' ? 'Update' : 'Publish';
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
    action: PropTypes.oneOf(['share', 'remix', 'update']),
    onClose: PropTypes.func.isRequired,
    onPublished: PropTypes.func.isRequired
};

ShareWindow.defaultProps = {
    action: 'share'
};

export default ShareWindow;
