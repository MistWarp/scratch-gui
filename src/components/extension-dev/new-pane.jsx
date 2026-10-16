/* eslint-disable react/jsx-no-bind */
import PropTypes from 'prop-types';
import React, {useMemo, useState} from 'react';
import {injectIntl, intlShape} from 'react-intl';
import {FilePlus2, Loader2} from 'lucide-react';

import messages from './messages.js';
import styles from './extension-dev.css';
import {
    blankTemplate,
    deriveExtensionId,
    isValidExtensionId,
    unsandboxedTemplate
} from '../../lib/extension-dev/templates.js';
import {readHeaderMetadata} from '../../lib/extension-dev/source-locate.js';

const NewPane = props => {
    const {intl, vm} = props;
    const pasted = typeof props.source === 'string' ? props.source : null;
    const header = useMemo(() => (pasted ? readHeaderMetadata(pasted) : {}), [pasted]);
    const [name, setName] = useState(header.name || '');
    const [id, setId] = useState(header.id || '');
    const [idEdited, setIdEdited] = useState(Boolean(header.id));
    const [template, setTemplate] = useState(pasted ? 'pasted' : 'blank');
    const [unsandboxed, setUnsandboxed] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);

    const effectiveId = idEdited ? id : deriveExtensionId(name);
    const idValid = isValidExtensionId(effectiveId);
    const idTaken = Boolean(effectiveId) && vm.extensionManager.isExtensionLoaded(effectiveId);
    const runUnsandboxed = template === 'unsandboxed' || unsandboxed;

    const onName = event => setName(event.target.value);
    const onId = event => {
        setIdEdited(true);
        setId(event.target.value);
    };

    const create = async event => {
        event.preventDefault();
        if (busy) return;
        if (template !== 'pasted' && (!name.trim() || !idValid || idTaken)) return;
        setBusy(true);
        setError(null);
        let source;
        if (template === 'pasted') source = pasted;
        else if (template === 'unsandboxed') source = unsandboxedTemplate({name: name.trim(), id: effectiveId});
        else source = blankTemplate({name: name.trim(), id: effectiveId});
        try {
            await props.onCreate(source, runUnsandboxed);
        } catch (e) {
            setError(e && e.message ? e.message : String(e));
            setBusy(false);
        }
    };

    const templates = pasted ? [
        {value: 'pasted', label: messages.templatePasted, hint: null}
    ] : [
        {value: 'blank', label: messages.templateBlank, hint: messages.templateBlankHint},
        {value: 'unsandboxed', label: messages.templateUnsandboxed, hint: messages.templateUnsandboxedHint}
    ];

    const usesTemplate = template !== 'pasted';
    let idProblem = null;
    if (effectiveId && !idValid) idProblem = intl.formatMessage(messages.idInvalid);
    else if (idTaken) idProblem = intl.formatMessage(messages.idTaken, {id: effectiveId});

    return (
        <form
            className={styles.newPane}
            onSubmit={create}
        >
            <div className={styles.newBody}>
                <h2 className={styles.removeHeading}>
                    <FilePlus2 size={18} />
                    <span>{intl.formatMessage(messages.newHeading)}</span>
                </h2>
                {usesTemplate ? (
                    <React.Fragment>
                        <label className={styles.field}>
                            <span className={styles.fieldLabel}>{intl.formatMessage(messages.nameLabel)}</span>
                            <input
                                autoFocus
                                className={styles.input}
                                placeholder={intl.formatMessage(messages.namePlaceholder)}
                                type="text"
                                value={name}
                                onChange={onName}
                            />
                        </label>
                        <label className={styles.field}>
                            <span className={styles.fieldLabel}>{intl.formatMessage(messages.idLabel)}</span>
                            <input
                                aria-invalid={Boolean(idProblem)}
                                className={idProblem ? `${styles.input} ${styles.inputInvalid}` : styles.input}
                                spellCheck={false}
                                type="text"
                                value={effectiveId}
                                onChange={onId}
                            />
                            <span className={idProblem ? styles.errorText : styles.fieldHint}>
                                {idProblem || intl.formatMessage(messages.idHint)}
                            </span>
                        </label>
                    </React.Fragment>
                ) : null}
                <fieldset className={styles.fieldset}>
                    <legend className={styles.fieldLabel}>{intl.formatMessage(messages.templateLabel)}</legend>
                    {templates.map(item => (
                        <label
                            className={template === item.value ?
                                `${styles.choice} ${styles.choiceSelected}` :
                                styles.choice}
                            key={item.value}
                        >
                            <input
                                checked={template === item.value}
                                name="mw-extension-template"
                                type="radio"
                                value={item.value}
                                onChange={() => setTemplate(item.value)}
                            />
                            <span className={styles.choiceText}>
                                <strong>{intl.formatMessage(item.label)}</strong>
                                {item.hint ? <span>{intl.formatMessage(item.hint)}</span> : null}
                            </span>
                        </label>
                    ))}
                </fieldset>
                <label className={styles.checkboxField}>
                    <input
                        checked={runUnsandboxed}
                        disabled={template === 'unsandboxed'}
                        type="checkbox"
                        onChange={event => setUnsandboxed(event.target.checked)}
                    />
                    <span className={styles.choiceText}>
                        <strong>{intl.formatMessage(messages.unsandboxedLabel)}</strong>
                        <span>{intl.formatMessage(messages.unsandboxedHint)}</span>
                    </span>
                </label>
                {error ? (
                    <p className={styles.errorText}>{intl.formatMessage(messages.createFailed, {message: error})}</p>
                ) : null}
            </div>
            <div className={styles.removeActions}>
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
                    className={styles.primaryButton}
                    disabled={busy || (template !== 'pasted' && (!name.trim() || !idValid || idTaken))}
                    type="submit"
                >
                    {busy ? <Loader2
                        size={15}
                        className={styles.spin}
                    /> : <FilePlus2 size={15} />}
                    <span>{intl.formatMessage(busy ? messages.creating : messages.create)}</span>
                </button>
            </div>
        </form>
    );
};

NewPane.propTypes = {
    intl: intlShape,
    source: PropTypes.string,
    vm: PropTypes.object.isRequired,
    onCancel: PropTypes.func.isRequired,
    onCreate: PropTypes.func.isRequired
};

export default injectIntl(NewPane);
