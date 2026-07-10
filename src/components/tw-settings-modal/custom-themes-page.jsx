import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import {FormattedMessage} from 'react-intl';
import {connect} from 'react-redux';

import Box from '../box/box.jsx';
import Input from '../forms/input.jsx';
import {Theme} from '../../lib/themes/index.js';
import {customThemeManager, CustomTheme, GradientUtils} from '../../lib/themes/custom-themes.js';
import {setTheme} from '../../reducers/theme.js';
import {applyTheme} from '../../lib/themes/themePersistance.js';
import {openWarpThemeModal, closeSettingsModal} from '../../reducers/modals.js';
import showAlert from '../../addons/window-system/alert';
import GradientBuilder from './gradient-builder.jsx';

import styles from './settings-modal.css';

import {Check, CirclePlus, Download, FolderInput, Edit, Trash, Store} from 'lucide-react';

class UnconnectedCustomThemesPage extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            customThemes: customThemeManager.getAllThemes(),
            activeEditor: null,
            editingThemeUuid: null,
            editorInitial: {},
            createName: '',
            createDescription: '',
            originalThemeBeforePreview: null
        };
        this.fileInputRef = React.createRef();
    }

    componentDidMount () {
        this.unsubscribe = customThemeManager.subscribe(() => {
            this.setState({customThemes: customThemeManager.getAllThemes()});
        });
    }

    componentWillUnmount () {
        if (this.unsubscribe) this.unsubscribe();
        if (this.state.originalThemeBeforePreview) {
            this.props.onChangeTheme(this.state.originalThemeBeforePreview);
        }
    }

    stopPreview () {
        if (this.state.originalThemeBeforePreview) {
            this.props.onChangeTheme(this.state.originalThemeBeforePreview);
            this.setState({originalThemeBeforePreview: null});
        }
    }

    closeEditor = () => {
        this.stopPreview();
        this.setState({activeEditor: null, editingThemeUuid: null, editorInitial: {}});
    };

    handleCreateFromCurrent = async () => {
        const name = this.state.createName.trim();
        if (!name) {
            await showAlert('Theme name is required');
            return;
        }
        try {
            const customTheme = customThemeManager.createFromCurrentTheme(
                this.props.theme,
                name,
                this.state.createDescription.trim()
            );
            this.setState({activeEditor: null, createName: '', createDescription: ''});
            this.props.onChangeTheme(customTheme);
        } catch (error) {
            await showAlert(`Failed to create theme: ${error.message}`);
        }
    };

    handlePreviewGradient = (name, gradientColors, primaryColor, direction) => {
        if (!name || this.state.originalThemeBeforePreview) {
            this.stopPreview();
            return;
        }

        const currentTheme = this.props.theme;
        const gradientAccent = GradientUtils.createGradientAccent(gradientColors, primaryColor, {direction});
        const previewTheme = new CustomTheme(
            name,
            this.state.createDescription,
            gradientAccent,
            currentTheme.gui || 'light',
            currentTheme.blocks || 'three',
            currentTheme.menuBarAlign || 'left',
            currentTheme.wallpaper,
            currentTheme.fonts
        );

        this.setState({originalThemeBeforePreview: currentTheme});
        this.props.onChangeTheme(previewTheme);
    };

    handleCreateGradient = async (name, description, colorStops, primary, direction) => {
        if (!name.trim()) {
            await showAlert('Theme name is required');
            return;
        }
        this.stopPreview();
        try {
            const customTheme = customThemeManager.createGradientTheme(
                name.trim(),
                description.trim(),
                colorStops.map(stop => ({color: stop.color, position: stop.position})),
                primary,
                {direction},
                this.props.theme
            );
            this.closeEditor();
            this.props.onChangeTheme(customTheme);
        } catch (error) {
            await showAlert(`Failed to create gradient theme: ${error.message}`);
        }
    };

    handleEditGradient = async themeUuid => {
        try {
            const gradientInfo = customThemeManager.getThemeGradientInfo(themeUuid);
            const theme = customThemeManager.getTheme(themeUuid);
            if (!gradientInfo || !theme) {
                await showAlert('Could not load gradient information for this theme');
                return;
            }
            this.setState({
                activeEditor: 'editGradient',
                editingThemeUuid: themeUuid,
                createDescription: theme.description,
                editorInitial: {
                    name: theme.name,
                    description: theme.description,
                    gradientColors: gradientInfo.colorStops,
                    direction: gradientInfo.direction,
                    primaryColor: gradientInfo.primaryColor
                }
            });
        } catch (error) {
            await showAlert(`Failed to load gradient theme: ${error.message}`);
        }
    };

    handleUpdateGradient = async (name, description, colorStops, primary, direction) => {
        const {editingThemeUuid} = this.state;
        if (!name.trim()) {
            await showAlert('Theme name is required');
            return;
        }
        this.stopPreview();
        try {
            const updatedTheme = customThemeManager.updateThemeGradient(
                editingThemeUuid,
                colorStops.map(stop => ({color: stop.color, position: stop.position})),
                primary,
                {direction}
            );

            if (updatedTheme.name !== name.trim() || updatedTheme.description !== description.trim()) {
                const newTheme = new CustomTheme(
                    name.trim(),
                    description.trim(),
                    updatedTheme.customAccent,
                    updatedTheme.gui,
                    updatedTheme.blocks,
                    updatedTheme.menuBarAlign,
                    updatedTheme.wallpaper,
                    updatedTheme.fonts,
                    updatedTheme.author
                );
                Object.defineProperty(newTheme, 'uuid', {value: editingThemeUuid, writable: false});
                Object.defineProperty(newTheme, 'createdAt', {value: updatedTheme.createdAt, writable: false});
                customThemeManager.themes.set(editingThemeUuid, newTheme);
                customThemeManager.saveCustomThemes();
            }

            this.closeEditor();

            const {theme} = this.props;
            if (theme instanceof CustomTheme && theme.uuid === editingThemeUuid) {
                this.props.onChangeTheme(customThemeManager.getTheme(editingThemeUuid));
            }
        } catch (error) {
            await showAlert(`Failed to update gradient theme: ${error.message}`);
        }
    };

    handleDeleteTheme = async (themeUuid, themeName) => {
        // eslint-disable-next-line no-alert
        if (confirm(`Are you sure you want to delete the theme "${themeName}"?`)) {
            try {
                customThemeManager.removeTheme(themeUuid);
            } catch (error) {
                await showAlert(`Failed to delete theme: ${error.message}`);
            }
        }
    };

    downloadJSON (data, filename) {
        const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    handleExportThemes = async () => {
        try {
            const date = new Date().toISOString()
                .split('T')[0];
            this.downloadJSON(
                customThemeManager.exportAllThemes(),
                `mistwarp-themes-${date}.json`
            );
        } catch (error) {
            await showAlert(`Failed to export themes: ${error.message}`);
        }
    };

    handleExportSingleTheme = async theme => {
        try {
            this.downloadJSON({
                version: '2.0',
                timestamp: Date.now(),
                themes: [theme.export()],
                platform: 'MistWarp'
            }, `${theme.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-theme.json`);
        } catch (error) {
            await showAlert(`Failed to export theme: ${error.message}`);
        }
    };

    handleImportFile = event => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async e => {
            try {
                const data = JSON.parse(e.target.result);
                const results = customThemeManager.importThemes(data, false);

                let message = `Import complete!\n`;
                message += `Imported: ${results.imported} themes\n`;
                if (results.skipped > 0) {
                    message += `Skipped: ${results.skipped} themes (already exist)\n`;
                }
                if (results.errors.length > 0) {
                    message += `Errors: ${results.errors.length}\n${results.errors.join('\n')}`;
                }
                await showAlert(message);
            } catch (error) {
                await showAlert(`Failed to import themes: ${error.message}`);
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    };

    render () {
        const {theme, onOpenWarpThemeMarketplace} = this.props;
        const {customThemes, activeEditor, editorInitial} = this.state;

        return (
            <Box className={styles.body}>
                <PageHeaderCustomThemes />
                <div className={styles.customThemesActions}>
                    <button
                        className={styles.button}
                        onClick={() => (activeEditor === 'create' ?
                            this.closeEditor() :
                            this.setState({activeEditor: 'create', createName: '', createDescription: ''}))}
                    >
                        <CirclePlus size={14} />
                        {' '}
                        <FormattedMessage
                            defaultMessage="Create from Current"
                            description="Create new custom theme from current theme"
                            id="tw.customThemes.create"
                        />
                    </button>
                    <button
                        className={styles.button}
                        onClick={() => (activeEditor === 'createGradient' ?
                            this.closeEditor() :
                            this.setState({activeEditor: 'createGradient', editorInitial: {}}))}
                    >
                        <CirclePlus size={14} />
                        {' '}
                        <FormattedMessage
                            defaultMessage="Create Gradient Theme"
                            description="Create gradient theme menu item"
                            id="tw.customThemes.createGradient"
                        />
                    </button>
                    <button
                        className={styles.button}
                        onClick={() => this.fileInputRef.current && this.fileInputRef.current.click()}
                    >
                        <FolderInput size={14} />
                        {' '}
                        <FormattedMessage
                            defaultMessage="Import"
                            description="Import custom themes"
                            id="tw.customThemes.import"
                        />
                    </button>
                    <button
                        className={styles.button}
                        disabled={customThemes.length === 0}
                        onClick={this.handleExportThemes}
                    >
                        <Download size={14} />
                        {' '}
                        <FormattedMessage
                            defaultMessage="Export All"
                            description="Export all custom themes"
                            id="tw.customThemes.export"
                        />
                    </button>
                    <button
                        className={styles.button}
                        onClick={onOpenWarpThemeMarketplace}
                    >
                        <Store size={14} />
                        {' '}
                        <FormattedMessage
                            defaultMessage="WarpTheme Marketplace"
                            description="Menu item to open WarpTheme marketplace"
                            id="mw.menu.warptheme"
                        />
                    </button>
                </div>

                {activeEditor === 'create' && (
                    <div className={styles.customThemesEditor}>
                        <div className={styles.textSettingLabel}>
                            <FormattedMessage
                                defaultMessage="Name"
                                id="tw.customThemes.createDialog.name"
                            />
                        </div>
                        <Input
                            type="text"
                            className={styles.textInput}
                            value={this.state.createName}
                            onChange={e => this.setState({createName: e.target.value})}
                            placeholder="My Custom Theme"
                            maxLength={50}
                        />
                        <div className={styles.textSettingLabel}>
                            <FormattedMessage
                                defaultMessage="Description (optional)"
                                id="tw.customThemes.createDialog.description"
                            />
                        </div>
                        <textarea
                            className={styles.textInput}
                            value={this.state.createDescription}
                            onChange={e => this.setState({createDescription: e.target.value})}
                            placeholder="A custom theme based on current settings"
                            maxLength={200}
                            rows={2}
                        />
                        <div className={styles.customThemesEditorButtons}>
                            <button
                                className={styles.button}
                                onClick={this.closeEditor}
                            >
                                <FormattedMessage
                                    defaultMessage="Cancel"
                                    id="tw.customThemes.createDialog.cancel"
                                />
                            </button>
                            <button
                                className={styles.button}
                                disabled={!this.state.createName.trim()}
                                onClick={this.handleCreateFromCurrent}
                            >
                                <FormattedMessage
                                    defaultMessage="Create"
                                    id="tw.customThemes.createDialog.createButton"
                                />
                            </button>
                        </div>
                    </div>
                )}

                {activeEditor === 'createGradient' && (
                    <div className={styles.customThemesEditor}>
                        <GradientBuilder
                            mode="create"
                            onSubmit={this.handleCreateGradient}
                            onPreview={this.handlePreviewGradient}
                            onCancel={this.closeEditor}
                        />
                    </div>
                )}

                {activeEditor === 'editGradient' && (
                    <div className={styles.customThemesEditor}>
                        <GradientBuilder
                            mode="edit"
                            initialName={editorInitial.name}
                            initialDescription={editorInitial.description}
                            initialGradientColors={editorInitial.gradientColors}
                            initialDirection={editorInitial.direction}
                            initialPrimaryColor={editorInitial.primaryColor}
                            onSubmit={this.handleUpdateGradient}
                            onPreview={this.handlePreviewGradient}
                            onCancel={this.closeEditor}
                        />
                    </div>
                )}

                <div className={styles.customThemesList}>
                    {customThemes.map(customTheme => {
                        const isSelected = theme instanceof CustomTheme && theme.uuid === customTheme.uuid;
                        return (
                            <div
                                key={customTheme.uuid}
                                className={classNames(styles.customThemesItem, {
                                    [styles.customThemesItemSelected]: isSelected
                                })}
                                onClick={() => this.props.onChangeTheme(customTheme)}
                            >
                                <Check
                                    size={15}
                                    className={classNames(styles.customThemesCheck, {
                                        [styles.customThemesCheckSelected]: isSelected
                                    })}
                                />
                                <div className={styles.customThemesItemInfo}>
                                    <div>{customTheme.name}</div>
                                    {customTheme.description && (
                                        <div className={styles.detail}>{customTheme.description}</div>
                                    )}
                                </div>
                                {customThemeManager.hasCustomGradient(customTheme.uuid) && (
                                    <button
                                        className={styles.iconButton}
                                        title="Edit gradient"
                                        onClick={e => {
                                            e.stopPropagation();
                                            this.handleEditGradient(customTheme.uuid);
                                        }}
                                    >
                                        <Edit size={16} />
                                    </button>
                                )}
                                <button
                                    className={styles.iconButton}
                                    title="Export theme"
                                    onClick={e => {
                                        e.stopPropagation();
                                        this.handleExportSingleTheme(customTheme);
                                    }}
                                >
                                    <Download size={16} />
                                </button>
                                <button
                                    className={styles.iconButton}
                                    title="Delete theme"
                                    onClick={e => {
                                        e.stopPropagation();
                                        this.handleDeleteTheme(customTheme.uuid, customTheme.name);
                                    }}
                                >
                                    <Trash size={16} />
                                </button>
                            </div>
                        );
                    })}
                    {customThemes.length === 0 && (
                        <p className={styles.detail}>
                            <FormattedMessage
                                defaultMessage="No custom themes"
                                description="Message when no custom themes exist"
                                id="tw.customThemes.empty"
                            />
                        </p>
                    )}
                </div>

                <input
                    ref={this.fileInputRef}
                    type="file"
                    accept=".json"
                    style={{display: 'none'}}
                    onChange={this.handleImportFile}
                />
            </Box>
        );
    }
}

const PageHeaderCustomThemes = () => (
    <div className={styles.header}>
        <FormattedMessage
            defaultMessage="Custom Themes"
            description="Menu item for custom themes"
            id="tw.menuBar.customThemes"
        />
        <div className={styles.divider} />
    </div>
);

UnconnectedCustomThemesPage.propTypes = {
    theme: PropTypes.instanceOf(Theme),
    onChangeTheme: PropTypes.func,
    onOpenWarpThemeMarketplace: PropTypes.func
};

export default connect(
    state => ({
        theme: state.scratchGui.theme.theme
    }),
    dispatch => ({
        onChangeTheme: theme => {
            dispatch(setTheme(theme));
            applyTheme(theme);
        },
        onOpenWarpThemeMarketplace: () => {
            dispatch(closeSettingsModal());
            dispatch(openWarpThemeModal());
        }
    })
)(UnconnectedCustomThemesPage);
