/* eslint-disable react/jsx-no-bind */
import PropTypes from 'prop-types';
import React, {useEffect, useMemo, useState} from 'react';
import {injectIntl, intlShape} from 'react-intl';
import {Download, Loader2, Trash2} from 'lucide-react';

import messages from './messages.js';
import styles from './extension-dev.css';
import getCostumeUrl from '../../lib/utils/get-costume-url.js';
import {downloadSource, getDraft, unappliedIds} from '../../lib/extension-dev/session.js';

const thumbnailFor = (vm, targetId) => {
    const target = vm.runtime.getTargetById(targetId);
    if (!target) return null;
    const costume = target.getCostumes()[target.currentCostume];
    if (!costume || !costume.asset) return null;
    try {
        return getCostumeUrl(costume.asset);
    } catch (e) {
        return null;
    }
};

const mergeUsage = usages => {
    const targets = new Map();
    let totalBlocks = 0;
    let totalHatScripts = 0;
    let totalMonitors = 0;
    let storageKeys = 0;
    for (const usage of usages) {
        totalBlocks += usage.totalBlocks || 0;
        totalHatScripts += usage.totalHatScripts || 0;
        totalMonitors += usage.totalMonitors || 0;
        storageKeys += usage.storageKeys || 0;
        for (const target of usage.targets || []) {
            const existing = targets.get(target.targetId);
            if (existing) {
                existing.blocks += target.blocks;
                existing.hatScripts += target.hatScripts;
                existing.monitors += target.monitors;
            } else {
                targets.set(target.targetId, {...target});
            }
        }
    }
    return {targets: Array.from(targets.values()), totalBlocks, totalHatScripts, totalMonitors, storageKeys};
};

const RemovePane = props => {
    const {intl, vm, entries} = props;
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);
    const [usage, setUsage] = useState(null);

    const removing = useMemo(() => props.ids
        .map(id => entries.find(entry => entry.id === id))
        .filter(Boolean), [props.ids, entries]);

    useEffect(() => {
        if (typeof vm.getExtensionUsage !== 'function') {
            setUsage(mergeUsage([]));
            return;
        }
        try {
            setUsage(mergeUsage(props.ids.map(id => vm.getExtensionUsage(id))));
        } catch (e) {
            setError(e.message);
            setUsage(mergeUsage([]));
        }
    }, [props.ids, vm]);

    const withSource = removing.filter(entry => entry.kind !== 'builtin');
    const drafts = new Set(unappliedIds());
    const hasDraft = removing.some(entry => drafts.has(entry.id));

    const downloadAll = async () => {
        for (const entry of withSource) {
            const draft = getDraft(entry.id);
            if (draft !== null) {
                downloadSource(entry, draft);
                continue;
            }
            try {
                const text = await vm.extensionManager.getExtensionSource(entry.id);
                if (typeof text === 'string') downloadSource(entry, text);
            } catch (e) {
                setError(e.message);
            }
        }
    };

    const confirm = async () => {
        setBusy(true);
        setError(null);
        try {
            await props.onConfirm(props.ids);
        } catch (e) {
            setError(e && e.message ? e.message : String(e));
            setBusy(false);
        }
    };

    if (!removing.length) return null;

    const heading = removing.length === 1 ?
        intl.formatMessage(messages.removeHeading, {name: removing[0].name}) :
        intl.formatMessage(messages.removeHeadingMany, {count: removing.length});

    const consequences = [];
    if (usage) {
        if (usage.totalBlocks) {
            consequences.push(messages.consequenceBlocks);
            if (usage.totalHatScripts) consequences.push(messages.consequenceHats);
            consequences.push(messages.consequenceBranches);
            consequences.push(messages.consequenceReporters);
        }
        if (usage.totalMonitors) consequences.push(messages.consequenceMonitors);
        if (usage.storageKeys) consequences.push(messages.consequenceStorage);
        if (props.patches) consequences.push(messages.consequencePatches);
        if (hasDraft) consequences.push(messages.consequenceDraft);
        consequences.push(messages.consequenceUndo);
    }

    return (
        <div className={styles.removePane}>
            <div className={styles.removeBody}>
                <h2 className={styles.removeHeading}>
                    <Trash2 size={18} />
                    <span>{heading}</span>
                </h2>
                {usage === null ? (
                    <p className={styles.paneEmpty}>
                        <Loader2
                            className={styles.spin}
                            size={16}
                        />
                    </p>
                ) : (
                    <React.Fragment>
                        {usage.targets.length ? (
                            <ul className={styles.targetList}>
                                {usage.targets.map(target => {
                                    const thumbnail = thumbnailFor(vm, target.targetId);
                                    return (
                                        <li
                                            className={styles.targetRow}
                                            key={target.targetId}
                                        >
                                            <span className={styles.targetThumb}>
                                                {thumbnail ? (
                                                    <img
                                                        alt=""
                                                        draggable={false}
                                                        src={thumbnail}
                                                    />
                                                ) : null}
                                            </span>
                                            <span className={styles.targetName}>{target.name}</span>
                                            <span className={styles.targetCounts}>
                                                {intl.formatMessage(messages.removeTargetCounts, {
                                                    blocks: target.blocks,
                                                    hats: target.hatScripts,
                                                    monitors: target.monitors
                                                })}
                                            </span>
                                        </li>
                                    );
                                })}
                            </ul>
                        ) : (
                            <p className={styles.removeNote}>{intl.formatMessage(messages.removeNoBlocks)}</p>
                        )}
                        <h3 className={styles.subHeading}>{intl.formatMessage(messages.consequencesHeading)}</h3>
                        <ul className={styles.consequenceList}>
                            {consequences.map(message => (
                                <li key={message.id}>{intl.formatMessage(message)}</li>
                            ))}
                        </ul>
                    </React.Fragment>
                )}
                {error ? (
                    <p className={styles.errorText}>{intl.formatMessage(messages.removeFailed, {message: error})}</p>
                ) : null}
            </div>
            <div className={styles.removeActions}>
                {withSource.length ? (
                    <button
                        className={styles.textButton}
                        disabled={busy}
                        type="button"
                        onClick={downloadAll}
                    >
                        <Download size={15} />
                        <span>{intl.formatMessage(messages.download)}</span>
                    </button>
                ) : null}
                <span className={styles.tabSpacer} />
                <button
                    className={styles.secondaryButton}
                    disabled={busy}
                    type="button"
                    onClick={props.onCancel}
                >
                    {intl.formatMessage(messages.cancel)}
                </button>
                <button
                    className={styles.dangerButton}
                    disabled={busy || !usage}
                    type="button"
                    onClick={confirm}
                >
                    {busy ? <Loader2
                        size={15}
                        className={styles.spin}
                    /> : <Trash2 size={15} />}
                    <span>{intl.formatMessage(busy ? messages.removing : messages.removeConfirm)}</span>
                </button>
            </div>
        </div>
    );
};

RemovePane.propTypes = {
    entries: PropTypes.arrayOf(PropTypes.object).isRequired,
    ids: PropTypes.arrayOf(PropTypes.string).isRequired,
    intl: intlShape,
    patches: PropTypes.bool,
    vm: PropTypes.object.isRequired,
    onCancel: PropTypes.func.isRequired,
    onConfirm: PropTypes.func.isRequired
};

export default injectIntl(RemovePane);
