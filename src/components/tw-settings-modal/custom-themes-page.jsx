import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import {FormattedMessage, injectIntl, intlShape} from 'react-intl';
import {
    Blend, Check, CircleAlert, CircleCheck, Download, Palette, PenLine, Sparkles, Store, Trash2, Upload, X
} from 'lucide-react';

import {Theme} from '../../lib/themes/index.js';
import {customThemeManager, CustomTheme} from '../../lib/themes/custom-themes.js';
import CustomThemeEditor from './custom-theme-editor.jsx';
import CustomThemePreview from './custom-theme-preview.jsx';
import messages from './custom-themes-messages.js';

import styles from './custom-themes.css';

const MAX_THEMES = 50;
const VIEWS = ['library', 'create', 'gradient'];
const customThemesTab = value => (VIEWS.includes(value) ? value : 'library');

const EDITOR_MODES = {
    create: 'current',
    gradient: 'gradient',
    edit: 'edit'
};

const downloadJSON = (data, filename) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

const themeFileName = name => {
    const slug = name.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '')
        .toLowerCase();
    return `${slug || 'custom'}-theme.json`;
};

class CustomThemesPage extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            view: customThemesTab(props.initialTab),
            customThemes: customThemeManager.getAllThemes(),
            editingUuid: null,
            editorKey: 0,
            editorError: '',
            status: null,
            pendingDelete: null
        };
        this.previewOriginal = null;
        this.fileInputRef = React.createRef();
    }

    componentDidMount () {
        this.unsubscribe = customThemeManager.subscribe(() => {
            this.setState({customThemes: customThemeManager.getAllThemes()});
        });
    }

    componentDidUpdate (previousProps) {
        if (previousProps.initialTab === this.props.initialTab) return;
        const next = customThemesTab(this.props.initialTab);
        if (next !== this.state.view && !(next === 'library' && this.state.view === 'edit')) {
            this.openView(next, {notify: false});
        }
    }

    componentWillUnmount () {
        if (this.unsubscribe) this.unsubscribe();
        this.stopPreview();
    }

    message (descriptor, values) {
        return this.props.intl.formatMessage(descriptor, values);
    }

    openView (view, {notify = true, editingUuid = null} = {}) {
        this.stopPreview();
        this.setState(state => ({
            view,
            editingUuid,
            editorKey: state.editorKey + 1,
            editorError: '',
            pendingDelete: null,
            status: view === 'library' ? state.status : null
        }), () => {
            if (notify && this.props.onTabChange && view !== 'edit') this.props.onTabChange(view);
        });
    }

    showStatus (kind, text) {
        this.setState({status: {kind, text}});
    }

    stopPreview () {
        if (!this.previewOriginal) return;
        const original = this.previewOriginal;
        this.previewOriginal = null;
        this.props.onChangeTheme(original);
    }

    baseTheme () {
        return this.previewOriginal || this.props.theme;
    }

    handlePreview = theme => {
        if (!theme) {
            this.stopPreview();
            return;
        }
        if (!this.previewOriginal) this.previewOriginal = this.props.theme;
        this.props.onChangeTheme(theme);
    };

    handleOpenCreate = () => this.openView('create');

    handleOpenGradient = () => this.openView('gradient');

    handleBack = () => this.openView('library');

    handleDismissStatus = () => this.setState({status: null});

    handleApply = e => {
        const theme = customThemeManager.getTheme(e.currentTarget.dataset.uuid);
        if (theme) this.props.onChangeTheme(theme);
    };

    handleEdit = e => {
        this.openView('edit', {editingUuid: e.currentTarget.dataset.uuid});
    };

    handleExportOne = e => {
        const theme = customThemeManager.getTheme(e.currentTarget.dataset.uuid);
        if (!theme) return;
        try {
            downloadJSON({
                version: '2.0',
                timestamp: Date.now(),
                themes: [theme.export()],
                platform: 'MistWarp'
            }, themeFileName(theme.name));
        } catch (error) {
            this.showStatus('error', this.message(messages.errorExport));
        }
    };

    handleExportAll = () => {
        try {
            const date = new Date().toISOString()
                .split('T')[0];
            downloadJSON(customThemeManager.exportAllThemes(), `mistwarp-themes-${date}.json`);
            this.showStatus('success', this.message(messages.exported, {count: this.state.customThemes.length}));
        } catch (error) {
            this.showStatus('error', this.message(messages.errorExport));
        }
    };

    handleImportClick = () => {
        if (this.fileInputRef.current) this.fileInputRef.current.click();
    };

    handleImportFile = e => {
        const file = e.target.files[0];
        e.target.value = '';
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            let results;
            try {
                results = customThemeManager.importThemes(JSON.parse(reader.result), false);
            } catch (error) {
                this.showStatus('error', this.message(messages.errorImport));
                return;
            }
            if (results.errors.length > 0 && results.imported === 0) {
                this.showStatus('error', this.message(messages.importedWithErrors, {failed: results.errors.length}));
                return;
            }
            const parts = [results.skipped > 0 ?
                this.message(messages.importedWithSkipped, {imported: results.imported, skipped: results.skipped}) :
                this.message(messages.imported, {imported: results.imported})];
            if (results.errors.length > 0) {
                parts.push(this.message(messages.importedWithErrors, {failed: results.errors.length}));
            }
            this.showStatus(results.errors.length > 0 ? 'error' : 'success', parts.join(' '));
        };
        reader.onerror = () => this.showStatus('error', this.message(messages.errorImport));
        reader.readAsText(file);
    };

    handleRequestDelete = e => {
        this.setState({pendingDelete: e.currentTarget.dataset.uuid});
    };

    handleCancelDelete = () => this.setState({pendingDelete: null});

    handleConfirmDelete = () => {
        const theme = customThemeManager.getTheme(this.state.pendingDelete);
        this.setState({pendingDelete: null});
        if (!theme) return;
        try {
            customThemeManager.removeTheme(theme.uuid);
            this.showStatus('success', this.message(messages.deleted, {themeName: theme.name}));
        } catch (error) {
            this.showStatus('error', this.message(messages.errorDelete));
        }
    };

    nameError (name, ignoreUuid) {
        if (!name) return this.message(messages.errorNameRequired);
        const lower = name.toLowerCase();
        const taken = this.state.customThemes.some(theme => theme.uuid !== ignoreUuid &&
            theme.name.trim().toLowerCase() === lower);
        if (taken) return this.message(messages.errorNameTaken, {themeName: name});
        return '';
    }

    handleSubmit = ({name, description, gradient}) => {
        const {view, editingUuid} = this.state;
        const editing = view === 'edit';
        const nameError = this.nameError(name, editing ? editingUuid : null);
        if (nameError) {
            this.setState({editorError: nameError});
            return;
        }
        if (!editing && this.state.customThemes.length >= MAX_THEMES) {
            this.setState({editorError: this.message(messages.errorLimit)});
            return;
        }

        const base = this.baseTheme();
        this.stopPreview();
        let saved;
        try {
            if (editing) {
                if (gradient) {
                    customThemeManager.updateThemeGradient(editingUuid, gradient.stops, gradient.primaryColor, {
                        direction: gradient.direction
                    });
                }
                saved = customThemeManager.updateTheme(editingUuid, {name, description});
            } else if (gradient) {
                saved = customThemeManager.createGradientTheme(
                    name,
                    description,
                    gradient.stops,
                    gradient.primaryColor,
                    {direction: gradient.direction},
                    base
                );
            } else {
                saved = customThemeManager.createFromCurrentTheme(base, name, description);
            }
        } catch (error) {
            this.setState({editorError: this.message(messages.errorSave)});
            return;
        }

        const current = this.props.theme;
        const wasActive = current instanceof CustomTheme && current.uuid === saved.uuid;
        if (!editing || wasActive) this.props.onChangeTheme(saved);
        this.openView('library');
        this.showStatus('success', this.message(editing ? messages.updated : messages.saved, {themeName: saved.name}));
    };

    renderToolbar () {
        return (
            <div className={styles.toolbar}>
                <div className={styles.toolbarGroup}>
                    <button
                        type="button"
                        className={styles.primaryButton}
                        onClick={this.handleOpenCreate}
                    >
                        <Sparkles size={16} />
                        <FormattedMessage {...messages.saveCurrent} />
                    </button>
                    <button
                        type="button"
                        className={styles.secondaryButton}
                        onClick={this.handleOpenGradient}
                    >
                        <Blend size={16} />
                        <FormattedMessage {...messages.newGradient} />
                    </button>
                </div>
            </div>
        );
    }

    renderStatus () {
        const {status} = this.state;
        if (!status) return null;
        const error = status.kind === 'error';
        const Icon = error ? CircleAlert : CircleCheck;
        return (
            <div
                className={classNames(styles.status, error ? styles.statusError : styles.statusSuccess)}
                role={error ? 'alert' : 'status'}
            >
                <Icon size={16} />
                <span className={styles.statusText}>{status.text}</span>
                <button
                    type="button"
                    className={styles.statusDismiss}
                    aria-label={this.message(messages.dismiss)}
                    title={this.message(messages.dismiss)}
                    onClick={this.handleDismissStatus}
                >
                    <X size={14} />
                </button>
            </div>
        );
    }

    renderEmpty () {
        return (
            <div className={styles.empty}>
                <span className={styles.emptyIcon}>
                    <Palette size={22} />
                </span>
                <span className={styles.emptyTitle}>
                    <FormattedMessage {...messages.emptyTitle} />
                </span>
                <span className={styles.emptyText}>
                    <FormattedMessage {...messages.emptyHint} />
                </span>
            </div>
        );
    }

    renderTile (customTheme) {
        const {theme} = this.props;
        const active = theme instanceof CustomTheme && theme.uuid === customTheme.uuid;
        const confirming = this.state.pendingDelete === customTheme.uuid;
        const isGradient = Boolean(customThemeManager.hasCustomGradient(customTheme.uuid));
        const themeName = customTheme.name;
        const author = customTheme.author && customTheme.author !== 'User' && customTheme.author !== 'Unknown' ?
            customTheme.author : '';
        let meta = customTheme.description;
        if (!meta && author) meta = this.message(messages.byAuthor, {author});
        if (!meta) meta = this.message(isGradient ? messages.gradientKind : messages.savedKind);

        return (
            <li
                key={customTheme.uuid}
                className={classNames(styles.tile, {
                    [styles.tileActive]: active,
                    [styles.tileConfirming]: confirming
                })}
            >
                <button
                    type="button"
                    className={styles.tilePreviewButton}
                    data-uuid={customTheme.uuid}
                    aria-pressed={active}
                    aria-label={this.message(messages.applyTheme, {themeName})}
                    onClick={this.handleApply}
                >
                    <CustomThemePreview theme={customTheme} />
                    {active ? (
                        <span className={styles.activeBadge}>
                            <Check size={12} />
                            <FormattedMessage {...messages.active} />
                        </span>
                    ) : null}
                </button>
                {confirming ? null : (
                    <div className={styles.tileActions}>
                        <button
                            type="button"
                            className={styles.iconButton}
                            data-uuid={customTheme.uuid}
                            aria-label={this.message(messages.editTheme, {themeName})}
                            title={this.message(messages.editTheme, {themeName})}
                            onClick={this.handleEdit}
                        >
                            <PenLine size={16} />
                        </button>
                        <button
                            type="button"
                            className={styles.iconButton}
                            data-uuid={customTheme.uuid}
                            aria-label={this.message(messages.exportTheme, {themeName})}
                            title={this.message(messages.exportTheme, {themeName})}
                            onClick={this.handleExportOne}
                        >
                            <Download size={16} />
                        </button>
                        <button
                            type="button"
                            className={styles.iconButton}
                            data-uuid={customTheme.uuid}
                            aria-label={this.message(messages.deleteTheme, {themeName})}
                            title={this.message(messages.deleteTheme, {themeName})}
                            onClick={this.handleRequestDelete}
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                )}
                {confirming ? (
                    <div className={styles.tileConfirm}>
                        <span className={styles.tileConfirmText}>
                            <FormattedMessage {...messages.deleteConfirm} />
                        </span>
                        <button
                            type="button"
                            className={styles.smallButton}
                            onClick={this.handleCancelDelete}
                        >
                            <FormattedMessage {...messages.cancel} />
                        </button>
                        <button
                            type="button"
                            className={classNames(styles.smallButton, styles.dangerButton)}
                            onClick={this.handleConfirmDelete}
                        >
                            <FormattedMessage {...messages.deleteAction} />
                        </button>
                    </div>
                ) : (
                    <div className={styles.tileInfo}>
                        <span
                            className={styles.tileName}
                            title={themeName}
                        >
                            {themeName}
                        </span>
                        <span
                            className={styles.tileMeta}
                            title={meta}
                        >
                            {meta}
                        </span>
                    </div>
                )}
            </li>
        );
    }

    renderLibrary () {
        const {customThemes} = this.state;
        return (
            <React.Fragment>
                {this.renderToolbar()}
                {this.renderStatus()}
                {customThemes.length === 0 ? this.renderEmpty() : (
                    <ul className={styles.grid}>
                        {customThemes.map(customTheme => this.renderTile(customTheme))}
                    </ul>
                )}
                <div className={styles.libraryFooter}>
                    <div className={styles.toolbarGroup}>
                        <button
                            type="button"
                            className={styles.ghostButton}
                            onClick={this.handleImportClick}
                        >
                            <Upload size={16} />
                            <FormattedMessage {...messages.importFile} />
                        </button>
                        <button
                            type="button"
                            className={styles.ghostButton}
                            disabled={customThemes.length === 0}
                            onClick={this.handleExportAll}
                        >
                            <Download size={16} />
                            <FormattedMessage {...messages.exportAll} />
                        </button>
                    </div>
                    {this.props.onOpenThemeMarketplace ? (
                        <button
                            type="button"
                            className={styles.linkButton}
                            onClick={this.props.onOpenThemeMarketplace}
                        >
                            <Store size={16} />
                            <FormattedMessage {...messages.browse} />
                        </button>
                    ) : null}
                </div>
            </React.Fragment>
        );
    }

    renderEditor () {
        const {view, editingUuid, editorKey, editorError} = this.state;
        const editingTheme = view === 'edit' ? customThemeManager.getTheme(editingUuid) : null;
        if (view === 'edit' && !editingTheme) return this.renderLibrary();
        let initialGradient = null;
        if (editingTheme) {
            const info = customThemeManager.getThemeGradientInfo(editingUuid);
            if (info) {
                initialGradient = {
                    stops: info.colorStops,
                    direction: info.direction,
                    primaryColor: info.primaryColor
                };
            }
        }
        return (
            <CustomThemeEditor
                key={editorKey}
                baseTheme={this.baseTheme()}
                editingTheme={editingTheme}
                error={editorError}
                initialGradient={initialGradient}
                mode={EDITOR_MODES[view]}
                onCancel={this.handleBack}
                onPreview={this.handlePreview}
                onSubmit={this.handleSubmit}
            />
        );
    }

    render () {
        return (
            <div className={styles.page}>
                {this.state.view === 'library' ? this.renderLibrary() : this.renderEditor()}
                <input
                    ref={this.fileInputRef}
                    type="file"
                    accept=".json,application/json"
                    className={styles.hiddenInput}
                    onChange={this.handleImportFile}
                />
            </div>
        );
    }
}

CustomThemesPage.propTypes = {
    initialTab: PropTypes.string,
    intl: intlShape.isRequired,
    theme: PropTypes.instanceOf(Theme),
    onChangeTheme: PropTypes.func,
    onOpenThemeMarketplace: PropTypes.func,
    onTabChange: PropTypes.func
};

export {customThemesTab};
export default injectIntl(CustomThemesPage);
