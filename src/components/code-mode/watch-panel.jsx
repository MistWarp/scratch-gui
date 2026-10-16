/* eslint-disable react/jsx-no-bind */
import PropTypes from 'prop-types';
import React, {useEffect, useState} from 'react';
import {injectIntl, intlShape} from 'react-intl';
import {CirclePause, Play, StepForward, X} from 'lucide-react';

import messages from './messages.js';
import styles from './workbench.css';

const REFRESH_MS = 250;

const ValueRow = ({action, name, value}) => (
    <li className={styles.watchRow}>
        <code className={styles.watchName}>{name}</code>
        <code className={styles.watchValue}>{value}</code>
        {action}
    </li>
);

ValueRow.propTypes = {
    action: PropTypes.node,
    name: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired
};

const WatchPanel = ({intl, read, onContinue, onJump, onStep, onUnpin}) => {
    const [snapshot, setSnapshot] = useState(read);
    useEffect(() => {
        setSnapshot(read());
        const timer = setInterval(() => setSnapshot(read()), REFRESH_MS);
        return () => clearInterval(timer);
    }, [read]);
    const {paused, watches} = snapshot;
    const unpinLabel = intl.formatMessage(messages.watchUnpin);
    return (
        <div className={styles.watch}>
            {paused ? (
                <div className={styles.watchSection}>
                    <div className={styles.watchPaused}>
                        <CirclePause size={14} />
                        <button
                            className={styles.watchLocation}
                            disabled={!paused.location}
                            type="button"
                            onClick={onJump}
                        >
                            {intl.formatMessage(messages.pausedAt, {location: paused.location || paused.script})}
                        </button>
                        <span className={styles.flexSpacer} />
                        <button
                            className={styles.panelAction}
                            type="button"
                            onClick={onContinue}
                        >
                            <Play size={13} />
                            {intl.formatMessage(messages.debugContinue)}
                        </button>
                        <button
                            className={styles.panelAction}
                            disabled={paused.compiled}
                            type="button"
                            onClick={onStep}
                        >
                            <StepForward size={13} />
                            {intl.formatMessage(messages.debugStep)}
                        </button>
                    </div>
                    {paused.compiled ? (
                        <p className={styles.panelEmpty}>
                            {intl.formatMessage(paused.compilerOnly ? messages.pausedCompilerOnly :
                                messages.pausedCompiled)}
                        </p>
                    ) : null}
                    <h3 className={styles.watchHeading}>{intl.formatMessage(messages.watchLocals)}</h3>
                    {paused.locals.length ? (
                        <ul className={styles.problemList}>
                            {paused.locals.map(item => (
                                <ValueRow
                                    key={item.key}
                                    name={item.name}
                                    value={item.value}
                                />
                            ))}
                        </ul>
                    ) : <p className={styles.panelEmpty}>{intl.formatMessage(messages.watchNoLocals)}</p>}
                </div>
            ) : null}
            <div className={styles.watchSection}>
                {paused ? <h3 className={styles.watchHeading}>{intl.formatMessage(messages.watchPinned)}</h3> : null}
                {watches.length ? (
                    <ul className={styles.problemList}>
                        {watches.map(item => (
                            <ValueRow
                                action={(
                                    <button
                                        aria-label={unpinLabel}
                                        className={styles.iconButton}
                                        title={unpinLabel}
                                        type="button"
                                        onClick={() => onUnpin(item.key)}
                                    >
                                        <X size={13} />
                                    </button>
                                )}
                                key={item.key}
                                name={item.name}
                                value={item.value === null ? intl.formatMessage(messages.watchMissing) : item.value}
                            />
                        ))}
                    </ul>
                ) : <p className={styles.panelEmpty}>{intl.formatMessage(messages.watchEmpty)}</p>}
            </div>
        </div>
    );
};

WatchPanel.propTypes = {
    intl: intlShape,
    read: PropTypes.func.isRequired,
    onContinue: PropTypes.func.isRequired,
    onJump: PropTypes.func.isRequired,
    onStep: PropTypes.func.isRequired,
    onUnpin: PropTypes.func.isRequired
};

export default injectIntl(WatchPanel);
