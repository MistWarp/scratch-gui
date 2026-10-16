import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import {FormattedMessage, injectIntl, intlShape} from 'react-intl';
import {ArrowLeft, CircleAlert, Eye} from 'lucide-react';

import {Theme} from '../../lib/themes/index.js';
import {CustomTheme, GradientUtils} from '../../lib/themes/custom-themes.js';
import CustomThemePreview from './custom-theme-preview.jsx';
import GradientControls, {createGradientValue, gradientSignature, sortStops} from './gradient-builder.jsx';
import messages from './custom-themes-messages.js';

import styles from './custom-themes.css';

const NAME_LIMIT = 50;
const DESCRIPTION_LIMIT = 200;
const PREVIEW_DELAY = 150;

const TITLES = {
    current: messages.titleCurrent,
    gradient: messages.titleGradient,
    edit: messages.titleEdit
};

const gradientTheme = (base, gradient, name, description) => new CustomTheme(
    name,
    description,
    GradientUtils.createGradientAccent(sortStops(gradient.stops), gradient.primaryColor, {
        direction: gradient.direction
    }),
    base.gui || 'light',
    base.blocks || 'three',
    base.menuBarAlign || 'left',
    base.wallpaper,
    base.fonts,
    base.author || 'User',
    base.appearance
);

const CustomThemeEditor = ({
    baseTheme,
    editingTheme,
    error,
    initialGradient,
    intl,
    mode,
    onCancel,
    onInput,
    onPreview,
    onSubmit
}) => {
    const hasGradient = mode === 'gradient' || Boolean(initialGradient);
    const [name, setName] = React.useState(editingTheme ? editingTheme.name : '');
    const [description, setDescription] = React.useState(editingTheme ? editingTheme.description || '' : '');
    const [gradient, setGradient] = React.useState(() => (
        hasGradient ? createGradientValue(initialGradient || {}) : null
    ));
    const [initialSignature] = React.useState(() => (gradient ? gradientSignature(gradient) : ''));
    const [trying, setTrying] = React.useState(false);
    const nameRef = React.useRef(null);
    const backRef = React.useRef(null);
    const previewRef = React.useRef(onPreview);
    previewRef.current = onPreview;

    React.useEffect(() => {
        const target = mode === 'current' ? nameRef.current : backRef.current;
        if (target) target.focus();
    }, []);

    const previewTheme = React.useMemo(() => {
        const base = editingTheme || baseTheme;
        if (gradient) return gradientTheme(base, gradient, name.trim() || 'Preview', description);
        return base;
    }, [baseTheme, editingTheme, gradient, name, description]);

    const previewThemeRef = React.useRef(previewTheme);
    previewThemeRef.current = previewTheme;

    React.useEffect(() => {
        if (!trying) return;
        const timeout = setTimeout(() => previewRef.current(previewThemeRef.current), PREVIEW_DELAY);
        return () => clearTimeout(timeout);
    }, [trying, gradient]);

    React.useEffect(() => () => previewRef.current(null), []);

    const handleTryToggle = React.useCallback(() => {
        if (trying) {
            previewRef.current(null);
            setTrying(false);
        } else {
            previewRef.current(previewThemeRef.current);
            setTrying(true);
        }
    }, [trying]);

    const handleNameChange = React.useCallback(e => {
        setName(e.target.value);
        if (onInput) onInput();
    }, [onInput]);

    const handleDescriptionChange = React.useCallback(e => setDescription(e.target.value), []);

    const handleSubmit = React.useCallback(e => {
        e.preventDefault();
        onSubmit({
            name: name.trim(),
            description: description.trim(),
            gradient: gradient ? {
                stops: sortStops(gradient.stops).map(stop => ({color: stop.color, position: stop.position})),
                direction: gradient.direction,
                primaryColor: gradient.primaryColor
            } : null,
            gradientChanged: gradient ? gradientSignature(gradient) !== initialSignature : false
        });
    }, [onSubmit, name, description, gradient, initialSignature]);

    const canSubmit = name.trim().length > 0;

    return (
        <form
            className={styles.editor}
            onSubmit={handleSubmit}
        >
            <div className={styles.editorTitleRow}>
                <button
                    ref={backRef}
                    type="button"
                    className={styles.iconButton}
                    aria-label={intl.formatMessage(messages.back)}
                    title={intl.formatMessage(messages.back)}
                    onClick={onCancel}
                >
                    <ArrowLeft size={18} />
                </button>
                <h3 className={styles.editorTitle}>
                    <FormattedMessage {...TITLES[mode]} />
                </h3>
            </div>

            <div className={styles.editorLayout}>
                <div className={styles.editorAside}>
                    <CustomThemePreview
                        className={styles.previewLarge}
                        theme={previewTheme}
                    />
                    {mode === 'current' ? (
                        <span className={styles.fieldHint}>
                            <FormattedMessage {...messages.currentHint} />
                        </span>
                    ) : null}
                    {gradient ? (
                        <button
                            type="button"
                            className={classNames(styles.tryButton, {[styles.tryButtonOn]: trying})}
                            aria-pressed={trying}
                            onClick={handleTryToggle}
                        >
                            <Eye size={16} />
                            <span className={styles.tryLabel}>
                                <FormattedMessage {...messages.tryItOn} />
                            </span>
                            <span
                                className={styles.trySwitch}
                                aria-hidden="true"
                            />
                        </button>
                    ) : null}
                </div>

                <div className={styles.editorFields}>
                    {gradient ? (
                        <GradientControls
                            value={gradient}
                            onChange={setGradient}
                        />
                    ) : null}
                    <label className={styles.field}>
                        <span className={styles.fieldLabel}>
                            <FormattedMessage {...messages.name} />
                        </span>
                        <input
                            ref={nameRef}
                            type="text"
                            className={styles.textInput}
                            value={name}
                            maxLength={NAME_LIMIT}
                            placeholder={intl.formatMessage(messages.namePlaceholder)}
                            autoComplete="off"
                            aria-invalid={Boolean(error)}
                            onChange={handleNameChange}
                        />
                    </label>
                    <label className={styles.field}>
                        <span className={styles.fieldLabel}>
                            <FormattedMessage {...messages.description} />
                        </span>
                        <textarea
                            className={classNames(styles.textInput, styles.textArea)}
                            value={description}
                            maxLength={DESCRIPTION_LIMIT}
                            rows={2}
                            placeholder={intl.formatMessage(messages.descriptionPlaceholder)}
                            onChange={handleDescriptionChange}
                        />
                    </label>
                    {error ? (
                        <div
                            className={classNames(styles.status, styles.statusError)}
                            role="alert"
                        >
                            <CircleAlert size={16} />
                            <span className={styles.statusText}>{error}</span>
                        </div>
                    ) : null}
                </div>
            </div>

            <div className={styles.editorFooter}>
                <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={onCancel}
                >
                    <FormattedMessage {...messages.cancel} />
                </button>
                <button
                    type="submit"
                    className={styles.primaryButton}
                    disabled={!canSubmit}
                >
                    <FormattedMessage {...(editingTheme ? messages.update : messages.create)} />
                </button>
            </div>
        </form>
    );
};

CustomThemeEditor.propTypes = {
    baseTheme: PropTypes.instanceOf(Theme).isRequired,
    editingTheme: PropTypes.instanceOf(CustomTheme),
    error: PropTypes.string,
    initialGradient: PropTypes.shape({
        stops: PropTypes.arrayOf(PropTypes.shape({
            color: PropTypes.string,
            position: PropTypes.number
        })),
        direction: PropTypes.number,
        primaryColor: PropTypes.string
    }),
    intl: intlShape.isRequired,
    mode: PropTypes.oneOf(['current', 'gradient', 'edit']).isRequired,
    onCancel: PropTypes.func.isRequired,
    onInput: PropTypes.func,
    onPreview: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired
};

export default injectIntl(CustomThemeEditor);
