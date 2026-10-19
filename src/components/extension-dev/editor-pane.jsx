/* eslint-disable react/jsx-no-bind */
import PropTypes from 'prop-types';
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import ReactDOM from 'react-dom';
import {injectIntl, intlShape} from 'react-intl';
import {
    BookOpen,
    Check,
    Copy,
    Download,
    FileInput,
    Loader2,
    Pencil,
    RefreshCw,
    ShieldAlert,
    ShieldCheck,
    Trash2
} from 'lucide-react';

import ActionMenu from './action-menu.jsx';
import CodeEditor from './code-editor.jsx';
import DiffView from '../code-mode/diff-view.jsx';
import codeMessages from '../code-mode/messages.js';
import messages from './messages.js';
import styles from './extension-dev.css';

import {createLinter} from '../../lib/extension-dev/lint-client.js';
import {findOpcodeDefinition} from '../../lib/extension-dev/source-locate.js';
import {applySource, convertEntry, reloadEntry} from '../../lib/extension-dev/actions.js';
import {
    clearDraft,
    downloadSource,
    getApplyAsYouType,
    getCachedSource,
    getDraft,
    isAuthored,
    markAuthored,
    setApplyAsYouType,
    setCachedSource,
    setDraft,
    markFirstApplyRestorePoint,
    needsFirstApplyRestorePoint
} from '../../lib/extension-dev/session.js';
import {baseHash, classifyDraft, loadDraft, scheduleDraftWrite} from '../../lib/code-mode/code-drafts.js';
import RestorePointAPI from '../../lib/api/restore-points.js';
import {DOCS_BASE} from '../../lib/help/index.js';

const LINT_DELAY = 300;
const AUTO_APPLY_DELAY = 800;
const GENERATED_PATTERN = /GENERATED FILE\s*-\s*DO NOT EDIT/i;
const DOCS_URL = `${DOCS_BASE}/building-extensions/introduction`;

const normalizeNewlines = value => value.replace(/\r\n?/g, '\n');

const mirrors = new Map();

const mirrorText = (id, sender, value) => {
    for (const listener of mirrors.get(id) || []) {
        if (listener !== sender) listener(value);
    }
};

const EditorPane = props => {
    const {intl, entry, vm} = props;
    const cachedSource = props.stateKey ? getCachedSource(props.stateKey) : null;
    const cachedDraft = cachedSource === null ? null : getDraft(entry.id);
    const [source, setSourceState] = useState(cachedSource);
    const setSource = value => {
        if (typeof value === 'string' && props.stateKey) setCachedSource(props.stateKey, value);
        setSourceState(value);
    };
    const [text, setText] = useState(cachedDraft === null ? (cachedSource || '') : normalizeNewlines(cachedDraft));
    const [loadError, setLoadError] = useState(null);
    const [sourceMissing, setSourceMissing] = useState(false);
    const [revision, setRevision] = useState(0);
    const [status, setStatus] = useState('idle');
    const [lintDiagnostics, setLintDiagnostics] = useState([]);
    const [unlocked, setUnlocked] = useState(false);
    const [applyAsYouType, setApplyAsYouTypeState] = useState(getApplyAsYouType());
    const [staleDraft, setStaleDraft] = useState(null);
    const [restored, setRestored] = useState(false);
    const [notice, setNotice] = useState(null);
    const [focus, setFocus] = useState(null);
    const linter = useMemo(() => createLinter(), []);
    const lintTimer = useRef(null);
    const applyTimer = useRef(null);
    const applying = useRef(false);
    const pendingApply = useRef(null);
    const mounted = useRef(true);
    const latest = useRef({text: cachedDraft === null ? (cachedSource || '') : normalizeNewlines(cachedDraft),
        source: cachedSource});
    const handledFocus = useRef(null);
    const linted = useRef({text: null, diagnostics: []});
    const doApplyRef = useRef(null);
    const live = useRef({});
    const mirror = useRef(null);
    const onMirror = useRef(null);

    const persistDraft = value => {
        const base = latest.current.source;
        const draftInfo = {extensionId: entry.id};
        if (!props.draftIdentity || typeof base !== 'string') return;
        scheduleDraftWrite(props.draftIdentity, draftInfo, value === null || value === base ? null :
            {text: value, baseHash: baseHash(base)});
    };

    const loaded = entry.status === 'loaded';
    const isGenerated = typeof source === 'string' && GENERATED_PATTERN.test(source.slice(0, 2000));
    const hasSource = entry.kind !== 'builtin';
    let readOnlyReason = null;
    if (!hasSource) readOnlyReason = 'builtin';
    else if (props.locked) readOnlyReason = 'collaborating';
    else if (entry.kind === 'url' && loaded) readOnlyReason = 'url';
    else if (!unlocked && !isAuthored(entry.id) && isGenerated) readOnlyReason = 'generated';
    else if (!unlocked && !isAuthored(entry.id)) readOnlyReason = 'project';
    const readOnly = readOnlyReason !== null || Boolean(staleDraft);
    live.current = {entry, readOnly, locked: props.locked, applyAsYouType};

    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
            clearTimeout(lintTimer.current);
            clearTimeout(applyTimer.current);
            linter.dispose();
        };
    }, [linter]);

    const lintNow = useCallback(value => {
        if (linted.current.text === value && linted.current.mode === entry.mode) {
            return Promise.resolve(linted.current.diagnostics);
        }
        return linter.lint(value, {unsandboxed: entry.mode === 'unsandboxed'})
            .then(diagnostics => {
                if (!diagnostics || !mounted.current || latest.current.text !== value) return null;
                linted.current = {text: value, mode: entry.mode, diagnostics};
                setLintDiagnostics(diagnostics);
                props.onSetStaticProblems(entry.id, diagnostics);
                return diagnostics;
            })
            .catch(error => {
                console.error(error);
                return null;
            });
    }, [entry.id, entry.mode, linter]);

    const runLint = useCallback(value => {
        clearTimeout(lintTimer.current);
        lintTimer.current = setTimeout(() => lintNow(value), LINT_DELAY);
    }, [lintNow]);

    const replaceDocument = (base, {external = false} = {}) => {
        const storedDraft = getDraft(entry.id);
        const draft = storedDraft === null || storedDraft === base ? null : normalizeNewlines(storedDraft);
        if (external && draft !== null) {
            clearDraft(entry.id);
            latest.current = {text: base, source: base};
            ReactDOM.unstable_batchedUpdates(() => {
                setStaleDraft({baseText: base, text: draft});
                setRevision(value => value + 1);
                setText(base);
                setSource(base);
                setStatus('idle');
            });
            runLint(base);
            return;
        }
        const initial = draft === null ? base : draft;
        latest.current = {text: initial, source: base};
        ReactDOM.unstable_batchedUpdates(() => {
            setRevision(value => value + 1);
            setText(initial);
            setSource(base);
            if (draft !== null) setStatus('dirty');
        });
        runLint(initial);
    };

    const restorePersistedDraft = base => {
        if (!props.draftIdentity || getDraft(entry.id) !== null) return;
        loadDraft(props.draftIdentity, {extensionId: entry.id}).then(draft => {
            if (!mounted.current || latest.current.source !== base || latest.current.text !== base) return;
            const kind = classifyDraft(draft, base);
            if (kind === 'restore') {
                const restoredText = normalizeNewlines(draft.text);
                setDraft(entry.id, restoredText);
                latest.current.text = restoredText;
                ReactDOM.unstable_batchedUpdates(() => {
                    setText(restoredText);
                    setStatus('dirty');
                    setRestored(true);
                });
                runLint(restoredText);
            } else if (kind === 'stale') {
                setStaleDraft({baseText: base, text: normalizeNewlines(draft.text)});
            }
        })
            .catch(() => {});
    };

    useEffect(() => {
        const runtime = vm.runtime;
        if (!runtime || typeof runtime.on !== 'function') return;
        const onReloaded = event => {
            if (!event || event.id !== entry.id || applying.current) return;
            vm.extensionManager.getExtensionSource(entry.id).then(result => {
                if (!mounted.current || typeof result !== 'string') return;
                const fresh = normalizeNewlines(result);
                if (fresh !== latest.current.source) replaceDocument(fresh, {external: true});
            })
                .catch(() => {});
        };
        runtime.on('EXTENSION_RELOADED', onReloaded);
        return () => runtime.off('EXTENSION_RELOADED', onReloaded);
    }, [entry.id]);

    const autoApplyIfClean = value => {
        if (!mounted.current || !live.current.applyAsYouType || live.current.readOnly) return;
        if (latest.current.text !== value || value === latest.current.source) return;
        lintNow(value).then(diagnostics => {
            if (!diagnostics || !mounted.current || latest.current.text !== value) return;
            if (diagnostics.some(item => item.severity === 'error')) return;
            if (diagnostics.some(item => item.code === 'patches-internals')) return;
            doApplyRef.current(value, {auto: true});
        });
    };

    useEffect(() => {
        if (!hasSource) return;
        const manager = vm.extensionManager;
        if (!manager || typeof manager.getExtensionSource !== 'function') {
            setLoadError('getExtensionSource is unavailable');
            return;
        }
        manager.getExtensionSource(entry.id)
            .then(result => {
                if (!mounted.current) return;
                if (result === null && entry.kind === 'url' && entry.status !== 'loaded') {
                    setSourceMissing(true);
                }
                const base = typeof result === 'string' ? normalizeNewlines(result) : '';
                replaceDocument(base);
                if (typeof result === 'string') restorePersistedDraft(base);
            })
            .catch(error => {
                if (!mounted.current) return;
                setLoadError(error && error.message ? error.message : String(error));
            });
    }, []);

    const doApply = useCallback(async (value, {auto, allowReadOnly} = {}) => {
        const current = live.current;
        if (current.locked || (current.readOnly && !allowReadOnly)) return {status: 'refused'};
        if (applying.current) {
            pendingApply.current = {auto};
            return {status: 'queued'};
        }
        applying.current = true;
        setNotice(null);
        setStatus('applying');
        let outcome = {ok: false, diagnostics: []};
        try {
            const diagnostics = await lintNow(value);
            if (diagnostics && diagnostics.some(item => item.code === 'syntax' && item.severity === 'error')) {
                if (mounted.current) {
                    setStatus('failed');
                    setNotice(intl.formatMessage(messages.syntaxBlocksApply));
                    if (!auto && props.onShowProblems) props.onShowProblems();
                }
                return {status: 'invalid'};
            }
            if (needsFirstApplyRestorePoint()) {
                try {
                    await RestorePointAPI.createSafetyRestorePoint(vm, props.projectTitle || entry.name);
                    markFirstApplyRestorePoint();
                } catch (e) {
                    console.warn('Could not create a restore point before the first extension apply', e);
                }
            }
            outcome = await applySource({
                vm,
                dispatch: props.dispatch,
                entry: current.entry,
                source: value,
                keepURL: current.entry.kind === 'url',
                intl,
                messages,
                confirm: props.confirmImpact,
                auto
            });
        } finally {
            // eslint-disable-next-line require-atomic-updates
            applying.current = false;
        }
        if (!mounted.current) return {status: outcome.ok ? 'committed' : 'refused'};
        props.onSetLoadProblems(entry.id, outcome.ok ? [] : outcome.diagnostics);
        if (outcome.ok) {
            setSource(value);
            latest.current.source = value;
            if (latest.current.text === value) clearDraft(entry.id);
            else setDraft(entry.id, latest.current.text);
            persistDraft(latest.current.text);
            setRestored(false);
            props.onApplied(entry);
        }
        const stillDirty = latest.current.text !== latest.current.source;
        if (outcome.ok) setStatus(stillDirty ? 'dirty' : 'applied');
        else setStatus('failed');
        if (!outcome.ok && !auto && props.onShowProblems) props.onShowProblems();
        const queued = pendingApply.current;
        pendingApply.current = null;
        if (queued && stillDirty) {
            if (queued.auto) autoApplyIfClean(latest.current.text);
            else doApply(latest.current.text, queued);
        }
        return {status: outcome.ok ? 'committed' : 'refused'};
    }, [vm, intl, props.projectTitle, entry.id, props.confirmImpact, lintNow]);
    doApplyRef.current = doApply;

    const patchesInternals = lintDiagnostics.some(item => item.code === 'patches-internals');
    const lintErrors = lintDiagnostics.filter(item => item.severity === 'error').length;

    onMirror.current = value => {
        if (!mounted.current || latest.current.text === value) return;
        latest.current.text = value;
        setText(value);
        if (!applying.current) setStatus(value === latest.current.source ? 'idle' : 'dirty');
        runLint(value);
    };

    useEffect(() => {
        const listener = value => onMirror.current(value);
        const set = mirrors.get(entry.id) || new Set();
        set.add(listener);
        mirrors.set(entry.id, set);
        mirror.current = listener;
        return () => {
            set.delete(listener);
            if (!set.size) mirrors.delete(entry.id);
        };
    }, [entry.id]);

    const onChange = value => {
        if (live.current.readOnly) return;
        const wasClean = latest.current.text === latest.current.source;
        setText(value);
        latest.current.text = value;
        mirrorText(entry.id, mirror.current, value);
        setNotice(null);
        setRestored(false);
        persistDraft(value);
        if (value === latest.current.source) {
            clearDraft(entry.id);
        } else {
            setDraft(entry.id, value);
            if (wasClean && vm.runtime && typeof vm.runtime.emitProjectChanged === 'function') {
                vm.runtime.emitProjectChanged();
            }
        }
        if (!applying.current) setStatus(value === latest.current.source ? 'idle' : 'dirty');
        runLint(value);
        clearTimeout(applyTimer.current);
        if (applyAsYouType && !readOnly) {
            applyTimer.current = setTimeout(() => autoApplyIfClean(value), AUTO_APPLY_DELAY);
        }
    };

    const onApplyKey = () => {
        if (readOnly) {
            if (readOnlyReason === 'project' || readOnlyReason === 'generated') {
                setNotice(intl.formatMessage(messages.readOnlyKey));
            } else if (readOnlyReason === 'collaborating') {
                setNotice(intl.formatMessage(messages.collaborating));
            }
            return Promise.resolve({status: 'refused'});
        }
        clearTimeout(applyTimer.current);
        if (latest.current.text === latest.current.source && loaded) return Promise.resolve({status: 'clean'});
        return doApply(latest.current.text);
    };
    if (props.applyRef) props.applyRef.current = onApplyKey;

    const toggleApplyAsYouType = event => {
        setApplyAsYouType(event.target.checked);
        setApplyAsYouTypeState(event.target.checked);
    };

    const applyFix = (value, fix) => {
        let next = value;
        const changes = [...fix.changes].sort((a, b) => b.from - a.from);
        for (const change of changes) {
            next = next.slice(0, change.from) + change.insert + next.slice(change.to);
        }
        onChange(next);
    };

    const onFix = problem => {
        if (!problem.fix || readOnly) return;
        const current = latest.current.text;
        if (linted.current.text === current && linted.current.diagnostics.some(item => item.fix === problem.fix)) {
            applyFix(current, problem.fix);
            return;
        }
        lintNow(current).then(diagnostics => {
            if (!diagnostics || latest.current.text !== current) return;
            const match = diagnostics.find(item => item.fix && item.code === problem.code &&
                item.fix.label === problem.fix.label && item.message === problem.message);
            if (match) applyFix(current, match.fix);
        });
    };

    const onReload = async () => {
        if (applying.current || props.locked) return;
        applying.current = true;
        setNotice(null);
        setStatus('applying');
        let outcome;
        try {
            outcome = await reloadEntry({
                vm,
                dispatch: props.dispatch,
                entry,
                intl,
                messages,
                confirm: props.confirmImpact
            });
        } finally {
            // eslint-disable-next-line require-atomic-updates
            applying.current = false;
        }
        if (!mounted.current) return;
        if (outcome.ok && typeof outcome.source === 'string') {
            const fresh = normalizeNewlines(outcome.source);
            if (fresh !== latest.current.source) replaceDocument(fresh);
        }
        if (outcome.ok) setStatus(latest.current.text === latest.current.source ? 'applied' : 'dirty');
        else setStatus('failed');
        if (!outcome.ok && entry.kind === 'url' && outcome.diagnostics.length === 0) {
            setNotice(intl.formatMessage(messages.reloadRefused));
        }
    };

    const onConvert = async () => {
        if (props.locked) return;
        setNotice(null);
        try {
            await convertEntry({vm, dispatch: props.dispatch, entry, intl, messages});
            markAuthored(entry.id);
            props.onEntriesChanged();
        } catch (error) {
            if (mounted.current) setNotice(error && error.message ? error.message : String(error));
        }
    };

    const onEdit = () => {
        setNotice(null);
        setUnlocked(true);
        markAuthored(entry.id);
    };

    const fetchSource = async () => {
        setLoadError(null);
        try {
            const result = await vm.extensionManager.getExtensionSource(entry.id, {fetch: true});
            if (!mounted.current) return null;
            const base = typeof result === 'string' ? normalizeNewlines(result) : '';
            setSourceMissing(false);
            replaceDocument(base);
            return latest.current.text;
        } catch (error) {
            if (mounted.current) setLoadError(error && error.message ? error.message : String(error));
            return null;
        }
    };

    const onAllow = async () => {
        const value = sourceMissing ? await fetchSource() : latest.current.text;
        if (typeof value === 'string') doApply(value, {allowReadOnly: true});
    };

    const onDownload = () => downloadSource(entry, latest.current.text || source || '');

    const problems = useMemo(() => {
        const list = [];
        for (const item of props.loadProblems) list.push({...item, origin: 'load'});
        for (const item of lintDiagnostics) list.push({...item, origin: 'lint'});
        for (const item of props.runtimeProblems) list.push({...item, origin: 'runtime'});
        const rank = {error: 0, warning: 1, info: 2};
        return list.sort((a, b) => (rank[a.severity] || 2) - (rank[b.severity] || 2));
    }, [props.loadProblems, lintDiagnostics, props.runtimeProblems]);

    const editorDiagnostics = useMemo(() => problems.filter(item => (
        item.origin === 'lint' || ((item.origin === 'load' || item.origin === 'runtime') && item.line)
    )), [problems]);

    const sourceReady = typeof source === 'string';
    useEffect(() => {
        const request = props.focus;
        if (!request || !request.at || !sourceReady || handledFocus.current === request.at) return;
        if (request.opcode) {
            const location = findOpcodeDefinition(latest.current.text, request.opcode);
            if (location) {
                setFocus({...location, at: request.at});
            } else {
                setNotice(intl.formatMessage(messages.definitionNotFound, {opcode: request.opcode}));
            }
        } else {
            setFocus(request);
        }
        handledFocus.current = request.at;
        if (props.onFocusHandled) props.onFocusHandled(request.at);
    }, [props.focus, sourceReady]);

    let statusText = null;
    if (status === 'applying') statusText = intl.formatMessage(messages.statusApplying);
    else if (status === 'applied') statusText = intl.formatMessage(messages.statusApplied);
    else if (status === 'failed') statusText = intl.formatMessage(messages.statusFailedApply);
    else if (status === 'dirty') {
        statusText = lintErrors ?
            intl.formatMessage(messages.statusErrors, {count: lintErrors}) :
            intl.formatMessage(messages.statusUnapplied);
    }
    if (restored && status === 'dirty') statusText = intl.formatMessage(codeMessages.restoredDraft);
    if (notice && status !== 'applying') statusText = notice;
    else if (!statusText && patchesInternals && !readOnly) statusText = intl.formatMessage(messages.statusPatches);

    const banner = (() => {
        const editAction = readOnlyReason === 'project' ?
            {label: intl.formatMessage(messages.edit), icon: Pencil, onClick: onEdit} :
            null;
        if (readOnlyReason === 'collaborating') return {text: intl.formatMessage(messages.collaborating)};
        if (entry.status === 'failed') {
            return {
                heading: intl.formatMessage(messages.failedHeading),
                text: entry.error && entry.error.message,
                action: editAction
            };
        }
        if (entry.status === 'denied') {
            return {
                heading: intl.formatMessage(messages.deniedHeading),
                action: {
                    label: intl.formatMessage(messages.allow),
                    icon: ShieldCheck,
                    onClick: onAllow
                }
            };
        }
        if (readOnlyReason === 'url') {
            return {
                text: intl.formatMessage(messages.loadedFrom, {url: entry.url}),
                action: {label: intl.formatMessage(messages.convert), icon: FileInput, onClick: onConvert}
            };
        }
        if (readOnlyReason === 'generated') {
            return {
                text: intl.formatMessage(messages.readOnlyGenerated),
                action: {label: intl.formatMessage(messages.editAnyway), icon: Pencil, onClick: onEdit}
            };
        }
        if (readOnlyReason === 'project') {
            return {text: intl.formatMessage(messages.readOnlyProject), action: editAction};
        }
        return null;
    })();

    const handleBannerAction = banner && banner.action ? banner.action.onClick : null;

    const overflowItems = [
        hasSource && loaded && {
            id: 'reload',
            label: intl.formatMessage(messages.reload),
            icon: RefreshCw,
            disabled: props.locked,
            onClick: onReload
        },
        entry.kind === 'url' && loaded && {
            id: 'convert',
            label: intl.formatMessage(messages.convert),
            icon: FileInput,
            disabled: props.locked,
            onClick: onConvert
        },
        hasSource && !sourceMissing && {
            id: 'download',
            label: intl.formatMessage(messages.download),
            icon: Download,
            onClick: onDownload
        },
        props.onRunUnsandboxed && loaded && entry.kind === 'embedded' && entry.mode !== 'unsandboxed' && {
            id: 'unsandboxed',
            label: intl.formatMessage(messages.runUnsandboxed),
            icon: ShieldAlert,
            disabled: props.locked,
            onClick: () => props.onRunUnsandboxed(entry)
        },
        {
            id: 'docs',
            label: intl.formatMessage(messages.docs),
            icon: BookOpen,
            onClick: () => window.open(DOCS_URL, '_blank', 'noopener,noreferrer')
        },
        {
            id: 'remove',
            label: intl.formatMessage(messages.remove),
            icon: Trash2,
            danger: true,
            disabled: props.locked,
            onClick: () => props.onRemove([entry.id])
        }
    ];

    const applyHint = props.applyHint ? ` (${props.applyHint})` : '';

    return (
        <div
            className={styles.editorPane}
            data-mw-region="text"
            data-mw-text-tab="true"
            ref={props.containerRef}
        >
            <div className={styles.toolbar}>
                <div className={styles.toolbarTitle}>
                    <h2 className={styles.paneHeading}>{entry.name}</h2>
                    <span className={styles.toolbarFacts}>
                        {[
                            entry.id === entry.name ? null : entry.id,
                            entry.mode === 'unsandboxed' ? intl.formatMessage(messages.modeUnsandboxed) :
                                (entry.mode ? intl.formatMessage(messages.modeSandboxed) : null)
                        ].filter(Boolean).join(', ')}
                    </span>
                </div>
                <span
                    aria-live="polite"
                    title={statusText || ''}
                    className={status === 'failed' || (status === 'dirty' && lintErrors) ?
                        `${styles.status} ${styles.statusError}` :
                        styles.status}
                >
                    {status === 'applying' ? <Loader2
                        size={14}
                        className={styles.spin}
                    /> : null}
                    {status === 'applied' ? <Check size={14} /> : null}
                    {statusText ? <span className={styles.statusText}>{statusText}</span> : null}
                </span>
                {hasSource && !readOnlyReason ? (
                    <React.Fragment>
                        <label className={styles.toggle}>
                            <input
                                checked={applyAsYouType}
                                type="checkbox"
                                onChange={toggleApplyAsYouType}
                            />
                            <span>{intl.formatMessage(messages.applyAsYouType)}</span>
                        </label>
                        <button
                            className={styles.primaryButton}
                            disabled={status === 'applying' || typeof source !== 'string' ||
                                (text === source && entry.status === 'loaded')}
                            title={`${intl.formatMessage(messages.apply)}${applyHint}`}
                            type="button"
                            onClick={onApplyKey}
                        >
                            <Check size={15} />
                            <span>{intl.formatMessage(messages.apply)}</span>
                        </button>
                    </React.Fragment>
                ) : null}
                <ActionMenu
                    items={overflowItems}
                    label={intl.formatMessage(messages.moreActions)}
                />
            </div>
            {banner ? (
                <div className={entry.status === 'loaded' ? styles.banner : `${styles.banner} ${styles.bannerError}`}>
                    <div className={styles.bannerText}>
                        {banner.heading ? <strong>{banner.heading}</strong> : null}
                        {banner.text ? <span>{banner.text}</span> : null}
                    </div>
                    {banner.action ? (
                        <button
                            className={styles.textButton}
                            disabled={props.locked}
                            type="button"
                            onClick={handleBannerAction}
                        >
                            <banner.action.icon size={15} />
                            <span>{banner.action.label}</span>
                        </button>
                    ) : null}
                </div>
            ) : null}
            <div className={styles.editorHost}>
                {entry.kind === 'builtin' ? (
                    <p className={styles.paneEmpty}>{intl.formatMessage(messages.builtinNoSource)}</p>
                ) : loadError ? (
                    <p className={styles.paneEmpty}>
                        {intl.formatMessage(messages.sourceUnavailable, {message: loadError})}
                    </p>
                ) : sourceMissing ? (
                    <div className={styles.paneEmpty}>
                        <span>{intl.formatMessage(messages.sourceNotLoaded, {url: entry.url})}</span>
                        <button
                            className={styles.textButton}
                            type="button"
                            onClick={fetchSource}
                        >
                            <Download size={15} />
                            <span>{intl.formatMessage(messages.fetchSource)}</span>
                        </button>
                    </div>
                ) : source === null ? (
                    <p className={styles.paneEmpty}>{intl.formatMessage(messages.loadingSource)}</p>
                ) : staleDraft ? (
                    <DiffView
                        afterLabel={intl.formatMessage(codeMessages.yourText)}
                        beforeLabel={intl.formatMessage(codeMessages.currentCode)}
                        sections={[{
                            key: 'draft',
                            before: staleDraft.baseText,
                            after: staleDraft.text,
                            actions: [
                                {label: intl.formatMessage(codeMessages.copy),
                                    icon: Copy,
                                    primary: true,
                                    onClick: () => {
                                        if (!navigator.clipboard) return;
                                        navigator.clipboard.writeText(staleDraft.text).catch(() => {});
                                    }},
                                {label: intl.formatMessage(codeMessages.discard),
                                    icon: Trash2,
                                    onClick: () => {
                                        persistDraft(null);
                                        setStaleDraft(null);
                                    }}
                            ]
                        }]}
                        title={intl.formatMessage(codeMessages.staleDraft)}
                    />
                ) : (
                    <CodeEditor
                        dark={props.dark}
                        diagnostics={editorDiagnostics}
                        documentKey={entry.id}
                        focus={focus}
                        readOnly={readOnly}
                        revision={revision}
                        stateKey={props.stateKey}
                        value={text}
                        onChange={onChange}
                        onFix={onFix}
                    />
                )}
            </div>
        </div>
    );
};

EditorPane.propTypes = {
    applyHint: PropTypes.string,
    applyRef: PropTypes.object,
    confirmImpact: PropTypes.func,
    containerRef: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
    dark: PropTypes.bool,
    dispatch: PropTypes.func.isRequired,
    draftIdentity: PropTypes.string,
    entry: PropTypes.object.isRequired,
    focus: PropTypes.object,
    intl: intlShape,
    loadProblems: PropTypes.arrayOf(PropTypes.object).isRequired,
    locked: PropTypes.bool,
    projectTitle: PropTypes.string,
    runtimeProblems: PropTypes.arrayOf(PropTypes.object).isRequired,
    stateKey: PropTypes.string,
    vm: PropTypes.object.isRequired,
    onApplied: PropTypes.func.isRequired,
    onEntriesChanged: PropTypes.func.isRequired,
    onFocusHandled: PropTypes.func,
    onRemove: PropTypes.func.isRequired,
    onRunUnsandboxed: PropTypes.func,
    onSetLoadProblems: PropTypes.func.isRequired,
    onSetStaticProblems: PropTypes.func.isRequired,
    onShowProblems: PropTypes.func
};

export default injectIntl(EditorPane);
