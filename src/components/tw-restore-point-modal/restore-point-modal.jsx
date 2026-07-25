import {defineMessages, FormattedMessage, intlShape, injectIntl} from 'react-intl';
import PropTypes from 'prop-types';
import React from 'react';
import {AlertTriangle, Plus, RefreshCw, Trash2} from 'lucide-react';
import Modal from '../../containers/windowed-modal.jsx';
import RestorePoint from './restore-point.jsx';
import styles from './restore-point-modal.css';
import {formatBytes} from '../../lib/utils/bytes';

const messages = defineMessages({
    title: {
        defaultMessage: 'Restore Points',
        description: 'Title of restore point management modal',
        id: 'tw.restorePoints.title'
    },
    never: {
        defaultMessage: 'Never',
        id: 'tw.restorePoints.never'
    },
    oneMinute: {
        defaultMessage: 'Every minute',
        id: 'tw.restorePoints.1minute'
    },
    minutes: {
        defaultMessage: 'Every {n} minutes',
        id: 'tw.restorePoints.minutes'
    },
    refresh: {
        defaultMessage: 'Refresh',
        id: 'tw.restorePoints.refresh'
    }
});

const MINUTE = 1000 * 60;
const INTERVAL_OPTIONS = [
    MINUTE,
    MINUTE * 5,
    MINUTE * 10,
    MINUTE * 15,
    MINUTE * 30,
    -1
];

const IntervalSelector = props => (
    <select
        className={styles.intervalSelector}
        value={props.value}
        onChange={props.onChange}
    >
        {INTERVAL_OPTIONS.map(interval => (
            <option
                key={interval}
                value={interval}
            >
                {interval < 0 ? (
                    props.intl.formatMessage(messages.never)
                ) : interval === MINUTE ? (
                    props.intl.formatMessage(messages.oneMinute)
                ) : (
                    props.intl.formatMessage(messages.minutes, {
                        n: Math.round(interval / MINUTE)
                    })
                )}
            </option>
        ))}
        {!INTERVAL_OPTIONS.includes(props.value) && (
            <option value={props.value}>
                {`Every ${props.value}ms`}
            </option>
        )}
    </select>
);

IntervalSelector.propTypes = {
    intl: intlShape,
    value: PropTypes.number.isRequired,
    onChange: PropTypes.func.isRequired
};

const RestorePointModal = props => (
    <Modal
        centered
        className={styles.modalContent}
        contentLabel={props.intl.formatMessage(messages.title)}
        height={560}
        id="restorePointModal"
        minHeight={420}
        minWidth={500}
        onRequestClose={props.onClose}
        width={680}
    >
        <div className={styles.body}>
            <div className={styles.automaticRow}>
                <div>
                    <strong>
                        <FormattedMessage
                            defaultMessage="Automatic restore points"
                            id="tw.restorePoints.automaticHeading"
                        />
                    </strong>
                    <span>
                        <FormattedMessage
                            defaultMessage="Local recovery snapshots. Keep separate backups too."
                            id="tw.restorePoints.automaticDescription"
                        />
                    </span>
                </div>
                <IntervalSelector
                    intl={props.intl}
                    value={props.interval}
                    onChange={props.onChangeInterval}
                />
            </div>
            {props.interval < 0 && (
                <div className={styles.warning}>
                    <AlertTriangle />
                    <FormattedMessage
                        defaultMessage="Automatic restore points are off. Manual restore points are still available."
                        id="tw.restorePoints.off"
                    />
                </div>
            )}

            <div className={styles.listToolbar}>
                <div>
                    <strong>
                        <FormattedMessage
                            defaultMessage="Saved versions"
                            id="tw.restorePoints.savedHeading"
                        />
                    </strong>
                    {!props.isLoading && !props.error && (
                        <span className={styles.summary}>
                            <FormattedMessage
                                defaultMessage="{count} restore points · {size}"
                                id="tw.restorePoints.summary"
                                values={{
                                    count: props.restorePoints.length,
                                    size: formatBytes(props.totalSize)
                                }}
                            />
                        </span>
                    )}
                </div>
                <div className={styles.headerActions}>
                    <button
                        aria-label={props.intl.formatMessage(messages.refresh)}
                        className={styles.iconButton}
                        disabled={props.isLoading}
                        onClick={props.onClickRefresh}
                        title={props.intl.formatMessage(messages.refresh)}
                    >
                        <RefreshCw />
                    </button>
                    <button
                        className={styles.primaryButton}
                        disabled={props.isLoading}
                        onClick={props.onClickCreate}
                    >
                        <Plus />
                        <FormattedMessage
                            defaultMessage="Create"
                            id="tw.restorePoints.create"
                        />
                    </button>
                </div>
            </div>

            {props.error ? (
                <div className={styles.state}>
                    <AlertTriangle />
                    <strong>
                        <FormattedMessage
                            defaultMessage="Restore points could not be loaded"
                            id="tw.restorePoints.error"
                        />
                    </strong>
                    <span className={styles.errorMessage}>{props.error}</span>
                    <button
                        className={styles.secondaryButton}
                        onClick={props.onClickRefresh}
                    >
                        <RefreshCw />
                        <FormattedMessage
                            defaultMessage="Try again"
                            id="tw.restorePoints.retry"
                        />
                    </button>
                </div>
            ) : props.isLoading ? (
                <div className={styles.state}>
                    <RefreshCw className={styles.spinner} />
                    <FormattedMessage
                        defaultMessage="Loading restore points…"
                        id="tw.restorePoints.loading"
                    />
                </div>
            ) : props.restorePoints.length === 0 ? (
                <div className={styles.state}>
                    <strong>
                        <FormattedMessage
                            defaultMessage="No restore points yet"
                            id="tw.restorePoints.empty"
                        />
                    </strong>
                    <span>
                        <FormattedMessage
                            defaultMessage="Create one now or keep working until the next automatic snapshot."
                            id="tw.restorePoints.emptyDescription"
                        />
                    </span>
                </div>
            ) : (
                <div className={styles.table}>
                    <div className={styles.tableHeader}>
                        <span>
                            <FormattedMessage
                                defaultMessage="Project"
                                id="tw.restorePoints.projectColumn"
                            />
                        </span>
                        <span>
                            <FormattedMessage
                                defaultMessage="Type"
                                id="tw.restorePoints.typeColumn"
                            />
                        </span>
                        <span>
                            <FormattedMessage
                                defaultMessage="Created"
                                id="tw.restorePoints.createdColumn"
                            />
                        </span>
                        <span>
                            <FormattedMessage
                                defaultMessage="Size"
                                id="tw.restorePoints.sizeColumn"
                            />
                        </span>
                        <span />
                    </div>
                    <div className={styles.restorePointContainer}>
                        {props.restorePoints.map(restorePoint => (
                            <RestorePoint
                                key={restorePoint.id}
                                isExporting={props.isExporting(restorePoint.id)}
                                onClickDelete={props.onClickDelete}
                                onClickExport={props.onClickExport}
                                onClickLoad={props.onClickLoad}
                                {...restorePoint}
                            />
                        ))}
                    </div>
                </div>
            )}

            {!props.isLoading && !props.error && props.restorePoints.length > 0 && (
                <div className={styles.footer}>
                    <span>
                        <FormattedMessage
                            defaultMessage="Shared assets are counted once."
                            id="tw.restorePoints.size2"
                        />
                    </span>
                    <button
                        className={styles.deleteAllButton}
                        onClick={props.onClickDeleteAll}
                    >
                        <Trash2 />
                        <FormattedMessage
                            defaultMessage="Delete all"
                            id="tw.restorePoints.deleteAll"
                        />
                    </button>
                </div>
            )}
        </div>
    </Modal>
);

RestorePointModal.propTypes = {
    intl: intlShape,
    interval: PropTypes.number.isRequired,
    onChangeInterval: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
    onClickCreate: PropTypes.func.isRequired,
    onClickDelete: PropTypes.func.isRequired,
    onClickDeleteAll: PropTypes.func.isRequired,
    onClickExport: PropTypes.func.isRequired,
    onClickLoad: PropTypes.func.isRequired,
    onClickRefresh: PropTypes.func.isRequired,
    isExporting: PropTypes.func.isRequired,
    isLoading: PropTypes.bool.isRequired,
    totalSize: PropTypes.number.isRequired,
    restorePoints: PropTypes.arrayOf(PropTypes.shape({})),
    error: PropTypes.string
};

export default injectIntl(RestorePointModal);
