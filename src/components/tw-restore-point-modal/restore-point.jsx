import React from 'react';
import PropTypes from 'prop-types';
import {
    defineMessages,
    FormattedMessage,
    FormattedDate,
    FormattedTime,
    FormattedRelative,
    injectIntl,
    intlShape
} from 'react-intl';
import bindAll from 'lodash.bindall';
import styles from './restore-point-modal.css';
import {formatBytes} from '../../lib/utils/bytes';
import RestorePointAPI from '../../lib/api/restore-points';
import log from '../../lib/utils/log';

import {Download, ImageOff, LoaderCircle, RotateCcw, Trash2} from 'lucide-react';

const relativeTimeSupported = () => typeof Intl !== 'undefined' && typeof Intl.RelativeTimeFormat !== 'undefined';

const messages = defineMessages({
    restore: {
        defaultMessage: 'Restore',
        id: 'tw.restorePoints.restore'
    },
    export: {
        defaultMessage: 'Export',
        id: 'tw.restorePoints.export'
    },
    delete: {
        defaultMessage: 'Delete',
        id: 'tw.restorePoints.delete'
    }
});

export class RestorePoint extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleClickDelete',
            'handleClickExport',
            'handleClickLoad'
        ]);
        this.state = {
            thumbnail: null,
            error: false
        };
        this.unmounted = false;

        this.totalSize = this.getTotalSize();
    }

    componentDidMount () {
        RestorePointAPI.getThumbnail(this.props.id)
            .then(url => {
                if (this.unmounted) {
                    URL.revokeObjectURL(url);
                } else {
                    this.setState({
                        thumbnail: url
                    });
                }
            })
            .catch(error => {
                log.error(error);
                if (!this.unmounted) {
                    this.setState({
                        error: true
                    });
                }
            });
    }

    componentWillUnmount () {
        if (this.state.thumbnail) {
            URL.revokeObjectURL(this.state.thumbnail);
        }
        this.unmounted = true;
    }

    getTotalSize () {
        let size = this.props.projectSize + this.props.thumbnailSize;
        for (const assetSize of Object.values(this.props.assets)) {
            size += assetSize;
        }
        return size;
    }

    handleClickDelete () {
        this.props.onClickDelete(this.props.id);
    }

    handleClickExport () {
        this.props.onClickExport(this.props.id);
    }

    handleClickLoad () {
        this.props.onClickLoad(this.props.id);
    }

    render () {
        const createdDate = new Date(this.props.created * 1000);
        const restoreLabel = this.props.intl.formatMessage(messages.restore);
        const exportLabel = this.props.intl.formatMessage(messages.export);
        const deleteLabel = this.props.intl.formatMessage(messages.delete);
        return (
            <article className={styles.restorePoint}>
                <div className={styles.projectCell}>
                    <div className={styles.thumbnailContainer}>
                        {this.state.error ? (
                            <span className={styles.thumbnailPlaceholder}>
                                <ImageOff />
                            </span>
                        ) : this.state.thumbnail ? (
                            <img
                                alt=""
                                className={styles.thumbnailImage}
                                src={this.state.thumbnail}
                                draggable={false}
                            />
                        ) : (
                            <span className={styles.thumbnailPlaceholder}>
                                <LoaderCircle className={styles.spinner} />
                            </span>
                        )}
                    </div>
                    <div className={styles.restorePointTitle}>
                        {this.props.title}
                    </div>
                </div>

                <div className={styles.tableCell}>
                    {this.props.type === RestorePointAPI.TYPE_MANUAL ? (
                        <FormattedMessage
                            defaultMessage="Manual"
                            id="tw.restorePoints.manual"
                        />
                    ) : (
                        <FormattedMessage
                            defaultMessage="Automatic"
                            id="tw.restorePoints.automatic"
                        />
                    )}
                </div>

                <div className={styles.tableCell}>
                    {relativeTimeSupported() ? (
                        <FormattedRelative value={createdDate} />
                    ) : (
                        <FormattedDate value={createdDate} />
                    )}
                    <span>
                        <FormattedDate
                            day="numeric"
                            month="short"
                            value={createdDate}
                        />
                        {', '}
                        <FormattedTime value={createdDate} />
                    </span>
                </div>

                <div className={styles.tableCell}>
                    {formatBytes(this.totalSize)}
                    <span>
                        <FormattedMessage
                            defaultMessage="{n} assets"
                            id="tw.restorePoints.assets"
                            values={{
                                n: Object.keys(this.props.assets).length
                            }}
                        />
                    </span>
                </div>

                <div className={styles.restorePointButtons}>
                    <button
                        aria-label={restoreLabel}
                        className={styles.actionButton}
                        onClick={this.handleClickLoad}
                        title={restoreLabel}
                    >
                        <RotateCcw />
                    </button>
                    <button
                        aria-label={exportLabel}
                        className={styles.actionButton}
                        disabled={this.props.isExporting}
                        onClick={this.handleClickExport}
                        title={exportLabel}
                    >
                        <Download />
                    </button>

                    <button
                        aria-label={deleteLabel}
                        className={`${styles.actionButton} ${styles.deleteButton}`}
                        disabled={this.props.isExporting}
                        onClick={this.handleClickDelete}
                        title={deleteLabel}
                    >
                        <Trash2 />
                    </button>
                </div>
            </article>
        );
    }
}

RestorePoint.propTypes = {
    id: PropTypes.number.isRequired,
    title: PropTypes.string.isRequired,
    created: PropTypes.number.isRequired,
    projectSize: PropTypes.number.isRequired,
    thumbnailSize: PropTypes.number.isRequired,
    type: PropTypes.number.isRequired,
    assets: PropTypes.shape({}).isRequired,
    intl: intlShape,
    isExporting: PropTypes.bool.isRequired,
    onClickDelete: PropTypes.func.isRequired,
    onClickExport: PropTypes.func.isRequired,
    onClickLoad: PropTypes.func.isRequired
};

export default injectIntl(RestorePoint);
