import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import {FormattedMessage} from 'react-intl';
import {connect} from 'react-redux';

import {MenuItem, Submenu} from '../menu/menu.jsx';
import {Theme} from '../../lib/themes/index.js';
import {customThemeManager, CustomTheme, GradientUtils} from '../../lib/themes/custom-themes.js';
import {closeSettingsMenu, openCustomThemes, customThemesOpen} from '../../reducers/menus.js';
import {setTheme} from '../../reducers/theme.js';
import {applyTheme} from '../../lib/themes/themePersistance.js';

import ChevronDown from './ChevronDown.jsx';
import addIcon from './tw-add.svg';
import exportIcon from './tw-export.svg';
import importIcon from './tw-import.svg';
import deleteIcon from './tw-delete.svg';
import editIcon from './icon--edit.svg';
import styles from './settings-menu.css';

import {Check, Palette} from 'lucide-react';

class CustomThemeMenu extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            customThemes: customThemeManager.getAllThemes(),
            showCreateDialog: false,
            showImportDialog: false,
            showGradientCreator: false,
            showGradientEditor: false,
            editingThemeUuid: null,
            createName: '',
            createDescription: '',
            importData: '',
            // Gradient creation state
            gradientColors: [
                { color: '#ff6b6b', position: 0 },
                { color: '#4ecdc4', position: 100 }
            ],
            gradientDirection: 90,
            primaryColor: '#ff6b6b',
            selectedPreset: '',
            showColorPicker: false,
            activeColorStop: 0
        };
        
        this.fileInputRef = React.createRef();
    }

    componentDidMount() {
        // Listen for custom theme changes
        this.themeUpdateInterval = setInterval(() => {
            const themes = customThemeManager.getAllThemes();
            if (themes.length !== this.state.customThemes.length) {
                this.setState({ customThemes: themes });
            }
        }, 1000);
    }

    componentWillUnmount() {
        if (this.themeUpdateInterval) {
            clearInterval(this.themeUpdateInterval);
        }
    }

    handleCreateTheme = () => {
        const {createName, createDescription} = this.state;
        const {theme} = this.props;
        
        if (!createName.trim()) {
            alert('Theme name is required');
            return;
        }

        try {
            const customTheme = customThemeManager.createFromCurrentTheme(
                theme,
                createName.trim(),
                createDescription.trim()
            );
            
            this.setState({
                customThemes: customThemeManager.getAllThemes(),
                showCreateDialog: false,
                createName: '',
                createDescription: ''
            });
            
            // Switch to the new theme
            this.props.onChangeTheme(customTheme);
        } catch (error) {
            alert(`Failed to create theme: ${error.message}`);
        }
    };

    handleCreateGradientTheme = () => {
        const {createName, createDescription, gradientColors, primaryColor, gradientDirection} = this.state;
        const {theme} = this.props;
        
        if (!createName.trim()) {
            alert('Theme name is required');
            return;
        }

        try {
            const colorStops = gradientColors.map(stop => ({
                color: stop.color,
                position: stop.position
            }));

            const customTheme = customThemeManager.createGradientTheme(
                createName.trim(),
                createDescription.trim(),
                colorStops,
                primaryColor,
                { direction: gradientDirection },
                theme
            );
            
            this.setState({
                customThemes: customThemeManager.getAllThemes(),
                showGradientCreator: false,
                createName: '',
                createDescription: '',
                gradientColors: [
                    { color: '#ff6b6b', position: 0 },
                    { color: '#4ecdc4', position: 100 }
                ],
                primaryColor: '#ff6b6b',
                gradientDirection: 90
            });
            
            // Switch to the new theme
            this.props.onChangeTheme(customTheme);
        } catch (error) {
            alert(`Failed to create gradient theme: ${error.message}`);
        }
    };

    handleAddColorStop = () => {
        const {gradientColors} = this.state;
        const newPosition = Math.round(gradientColors.reduce((sum, stop) => sum + stop.position, 0) / gradientColors.length);
        
        this.setState({
            gradientColors: [...gradientColors, {
                color: '#ffffff',
                position: Math.max(0, Math.min(100, newPosition))
            }].sort((a, b) => a.position - b.position)
        });
    };

    handleRemoveColorStop = (index) => {
        const {gradientColors} = this.state;
        if (gradientColors.length <= 2) return; // Keep minimum 2 colors
        
        this.setState({
            gradientColors: gradientColors.filter((_, i) => i !== index)
        });
    };

    handleColorChange = (index, color) => {
        const {gradientColors} = this.state;
        const newColors = [...gradientColors];
        newColors[index].color = color;
        
        this.setState({
            gradientColors: newColors,
            primaryColor: index === 0 ? color : this.state.primaryColor
        });
    };

    handlePositionChange = (index, position) => {
        const {gradientColors} = this.state;
        const newColors = [...gradientColors];
        newColors[index].position = Math.max(0, Math.min(100, parseInt(position) || 0));
        newColors.sort((a, b) => a.position - b.position);
        
        this.setState({
            gradientColors: newColors
        });
    };

    handlePresetSelect = (presetName) => {
        try {
            const preset = GradientUtils.getGradientPresets().find(p => p.name === presetName);
            if (preset) {
                const colorStops = preset.colors.map((color, index) => ({
                    color: color,
                    position: (index / (preset.colors.length - 1)) * 100
                }));
                
                this.setState({
                    gradientColors: colorStops,
                    gradientDirection: preset.direction,
                    primaryColor: preset.colors[0],
                    selectedPreset: presetName
                });
            } else {
                alert('Gradient preset not found');
            }
        } catch (error) {
            console.warn('Failed to load preset:', error);
        }
    };

    handleEditGradientTheme = (themeUuid) => {
        try {
            const gradientInfo = customThemeManager.getThemeGradientInfo(themeUuid);
            const theme = customThemeManager.getTheme(themeUuid);
            
            if (!gradientInfo || !theme) {
                alert('Could not load gradient information for this theme');
                return;
            }

            this.setState({
                showGradientEditor: true,
                editingThemeUuid: themeUuid,
                createName: theme.name,
                createDescription: theme.description,
                gradientColors: gradientInfo.colorStops,
                gradientDirection: gradientInfo.direction,
                primaryColor: gradientInfo.primaryColor,
                selectedPreset: ''
            });
        } catch (error) {
            alert(`Failed to load gradient theme: ${error.message}`);
        }
    };

    handleUpdateGradientTheme = () => {
        const {editingThemeUuid, createName, createDescription, gradientColors, primaryColor, gradientDirection} = this.state;
        
        if (!editingThemeUuid) {
            alert('No theme selected for editing');
            return;
        }
        
        if (!createName.trim()) {
            alert('Theme name is required');
            return;
        }

        try {
            const colorStops = gradientColors.map(stop => ({
                color: stop.color,
                position: stop.position
            }));

            const updatedTheme = customThemeManager.updateThemeGradient(
                editingThemeUuid,
                colorStops,
                primaryColor,
                { direction: gradientDirection }
            );

            // Update name and description if changed
            if (updatedTheme.name !== createName.trim() || updatedTheme.description !== createDescription.trim()) {
                // We need to create a new theme with updated metadata since name/description aren't part of gradient update
                const newTheme = new CustomTheme(
                    createName.trim(),
                    createDescription.trim(),
                    updatedTheme.customAccent,
                    updatedTheme.gui,
                    updatedTheme.blocks,
                    updatedTheme.menuBarAlign,
                    updatedTheme.wallpaper,
                    updatedTheme.fonts,
                    updatedTheme.author
                );
                
                // Preserve UUID and creation date
                Object.defineProperty(newTheme, 'uuid', { value: editingThemeUuid, writable: false });
                Object.defineProperty(newTheme, 'createdAt', { value: updatedTheme.createdAt, writable: false });
                
                customThemeManager.themes.set(editingThemeUuid, newTheme);
                customThemeManager.saveCustomThemes();
            }
            
            this.setState({
                customThemes: customThemeManager.getAllThemes(),
                showGradientEditor: false,
                editingThemeUuid: null,
                createName: '',
                createDescription: '',
                gradientColors: [
                    { color: '#ff6b6b', position: 0 },
                    { color: '#4ecdc4', position: 100 }
                ],
                primaryColor: '#ff6b6b',
                gradientDirection: 90
            });
            
            // Switch to the updated theme if it's currently active
            const {theme} = this.props;
            if (theme instanceof CustomTheme && theme.uuid === editingThemeUuid) {
                this.props.onChangeTheme(customThemeManager.getTheme(editingThemeUuid));
            }
        } catch (error) {
            alert(`Failed to update gradient theme: ${error.message}`);
        }
    };

    handleDeleteTheme = (themeUuid, themeName) => {
        if (confirm(`Are you sure you want to delete the theme "${themeName}"?`)) {
            try {
                customThemeManager.removeTheme(themeUuid);
                this.setState({
                    customThemes: customThemeManager.getAllThemes()
                });
            } catch (error) {
                alert(`Failed to delete theme: ${error.message}`);
            }
        }
    };

    handleExportThemes = () => {
        try {
            const exportData = customThemeManager.exportAllThemes();
            const blob = new Blob([JSON.stringify(exportData, null, 2)], {
                type: 'application/json'
            });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `mistwarp-themes-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            alert(`Failed to export themes: ${error.message}`);
        }
    };

    handleExportSingleTheme = (theme) => {
        try {
            const exportData = {
                version: '1.0',
                exportedAt: new Date().toISOString(),
                themes: [theme.export()],
                count: 1
            };
            const blob = new Blob([JSON.stringify(exportData, null, 2)], {
                type: 'application/json'
            });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${theme.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-theme.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            alert(`Failed to export theme: ${error.message}`);
        }
    };

    handleImportFile = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
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
                
                alert(message);
                this.setState({
                    customThemes: customThemeManager.getAllThemes()
                });
            } catch (error) {
                alert(`Failed to import themes: ${error.message}`);
            }
        };
        reader.readAsText(file);
        
        // Reset file input
        event.target.value = '';
    };

    render() {
        const { isOpen, isRtl, theme, onOpen } = this.props;
        const {customThemes, showCreateDialog, createName, createDescription} = this.state;

        return (
            <MenuItem expanded={isOpen}>
                <div
                    className={styles.option}
                    onClick={onOpen}
                >
                    <Palette className={styles.icon} />
                    <span className={styles.submenuLabel}>
                        <FormattedMessage
                            defaultMessage="Custom Themes"
                            description="Menu item for custom themes"
                            id="tw.menuBar.customThemes"
                        />
                    </span>
                    <ChevronDown className={styles.expandCaret} />
                </div>
                <Submenu place={isRtl ? 'left' : 'right'} className={styles.customThemeSubmenu}>
                    {/* Create new theme */}
                    <MenuItem 
                        className={styles.customThemeAction}
                        onClick={() => this.setState({ showCreateDialog: true })}
                    >
                        <div className={styles.option}>
                            <img src={addIcon} className={styles.customThemeActionIcon} alt="" />
                            <FormattedMessage
                                defaultMessage="Create from Current"
                                description="Create new custom theme from current theme"
                                id="tw.customThemes.create"
                            />
                        </div>
                    </MenuItem>

                    {/* Create gradient theme */}
                    <MenuItem 
                        className={styles.customThemeAction}
                        onClick={() => this.setState({ showGradientCreator: true })}
                    >
                        <div className={styles.option}>
                            <img src={addIcon} className={styles.customThemeActionIcon} alt="" />
                            <FormattedMessage
                                defaultMessage="Create Gradient Theme"
                                description="Create gradient theme menu item"
                                id="tw.customThemes.createGradient"
                            />
                        </div>
                    </MenuItem>

                    {/* Export themes */}
                    <MenuItem 
                        className={styles.customThemeAction}
                        onClick={this.handleExportThemes}
                    >
                        <div className={classNames(styles.option, {[styles.disabled]: customThemes.length === 0})}>
                            <img src={exportIcon} className={styles.customThemeActionIcon} alt="" />
                            <FormattedMessage
                                defaultMessage="Export All"
                                description="Export all custom themes"
                                id="tw.customThemes.export"
                            />
                        </div>
                    </MenuItem>

                    {/* Import themes */}
                    <MenuItem 
                        className={styles.customThemeAction}
                        onClick={() => this.fileInputRef.current?.click()}
                    >
                        <div className={styles.option}>
                            <img src={importIcon} className={styles.customThemeActionIcon} alt="" />
                            <FormattedMessage
                                defaultMessage="Import"
                                description="Import custom themes"
                                id="tw.customThemes.import"
                            />
                        </div>
                    </MenuItem>

                    {customThemes.length > 0 && <div className={styles.menuSeparator} />}

                    {/* List custom themes */}
                    {customThemes.map(customTheme => (
                        <MenuItem
                            key={customTheme.uuid}
                            className={classNames(styles.customThemeItem, {
                                [styles.selected]: theme instanceof CustomTheme && theme.uuid === customTheme.uuid
                            })}
                            onClick={() => this.props.onChangeTheme(customTheme)}
                        >
                            <div className={styles.option}>
                                <Check
                                    className={classNames(styles.check, {[styles.selected]: theme instanceof CustomTheme && theme.uuid === customTheme.uuid})}
                                    size={15}
                                />
                                <div className={styles.customThemeItemInfo}>
                                    <div className={styles.customThemeItemName}>
                                        {customTheme.name}
                                    </div>
                                    {customTheme.description && (
                                        <div className={styles.customThemeItemDescription}>
                                            {customTheme.description}
                                        </div>
                                    )}
                                </div>
                                <div className={styles.customThemeActions}>
                                    {customThemeManager.hasCustomGradient(customTheme.uuid) && (
                                        <button
                                            className={styles.customThemeEditButton}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                this.handleEditGradientTheme(customTheme.uuid);
                                            }}
                                            title="Edit gradient"
                                        >
                                            <img src={editIcon} alt="Edit" />
                                        </button>
                                    )}
                                    <button
                                        className={styles.customThemeActionButton}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            this.handleExportSingleTheme(customTheme);
                                        }}
                                        title="Export theme"
                                    >
                                        <img src={exportIcon} alt="Export" />
                                    </button>
                                    <button
                                        className={styles.customThemeDeleteButton}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            this.handleDeleteTheme(customTheme.uuid, customTheme.name);
                                        }}
                                        title="Delete theme"
                                    >
                                        <img src={deleteIcon} alt="Delete" />
                                    </button>
                                </div>
                            </div>
                        </MenuItem>
                    ))}

                    {customThemes.length === 0 && (
                        <MenuItem className={styles.customThemeEmpty}>
                            <div className={styles.option}>
                                <FormattedMessage
                                    defaultMessage="No custom themes"
                                    description="Message when no custom themes exist"
                                    id="tw.customThemes.empty"
                                />
                            </div>
                        </MenuItem>
                    )}
                </Submenu>

                {/* Hidden file input for importing */}
                <input
                    ref={this.fileInputRef}
                    type="file"
                    accept=".json"
                    style={{ display: 'none' }}
                    onChange={this.handleImportFile}
                />

                {/* Create theme dialog */}
                {showCreateDialog && (
                    <div className={styles.customThemeDialog}>
                        <div className={styles.customThemeDialogContent}>
                            <h3>
                                <FormattedMessage
                                    defaultMessage="Create Custom Theme"
                                    description="Title for create theme dialog"
                                    id="tw.customThemes.createDialog.title"
                                />
                            </h3>
                            <div className={styles.customThemeDialogField}>
                                <label>
                                    <FormattedMessage
                                        defaultMessage="Name"
                                        description="Label for theme name input"
                                        id="tw.customThemes.createDialog.name"
                                    />
                                </label>
                                <input
                                    type="text"
                                    value={createName}
                                    onChange={(e) => this.setState({ createName: e.target.value })}
                                    placeholder="My Custom Theme"
                                    maxLength={50}
                                />
                            </div>
                            <div className={styles.customThemeDialogField}>
                                <label>
                                    <FormattedMessage
                                        defaultMessage="Description (optional)"
                                        description="Label for theme description input"
                                        id="tw.customThemes.createDialog.description"
                                    />
                                </label>
                                <textarea
                                    value={createDescription}
                                    onChange={(e) => this.setState({ createDescription: e.target.value })}
                                    placeholder="A custom theme based on current settings"
                                    maxLength={200}
                                    rows={3}
                                />
                            </div>
                            <div className={styles.customThemeDialogButtons}>
                                <button
                                    className={styles.customThemeDialogButton}
                                    onClick={() => this.setState({ 
                                        showCreateDialog: false, 
                                        createName: '', 
                                        createDescription: '' 
                                    })}
                                >
                                    <FormattedMessage
                                        defaultMessage="Cancel"
                                        description="Cancel button"
                                        id="tw.customThemes.createDialog.cancel"
                                    />
                                </button>
                                <button
                                    className={classNames(styles.customThemeDialogButton, styles.primary)}
                                    onClick={this.handleCreateTheme}
                                    disabled={!createName.trim()}
                                >
                                    <FormattedMessage
                                        defaultMessage="Create"
                                        description="Create button"
                                        id="tw.customThemes.createDialog.create"
                                    />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Gradient creator dialog */}
                {this.state.showGradientCreator && (
                    <div className={styles.customThemeDialog}>
                        <div className={styles.customThemeDialogContent}>
                            <h3>
                                <FormattedMessage
                                    defaultMessage="Create Gradient Theme"
                                    description="Title for gradient creator dialog"
                                    id="tw.customThemes.gradientCreator.title"
                                />
                            </h3>
                            
                            {/* Theme name and description */}
                            <div className={styles.customThemeDialogField}>
                                <label>
                                    <FormattedMessage
                                        defaultMessage="Name"
                                        description="Label for theme name input"
                                        id="tw.customThemes.createDialog.name"
                                    />
                                </label>
                                <input
                                    type="text"
                                    value={this.state.createName}
                                    onChange={(e) => this.setState({ createName: e.target.value })}
                                    placeholder="My Gradient Theme"
                                    maxLength={50}
                                />
                            </div>
                            <div className={styles.customThemeDialogField}>
                                <label>
                                    <FormattedMessage
                                        defaultMessage="Description (optional)"
                                        description="Label for theme description input"
                                        id="tw.customThemes.createDialog.description"
                                    />
                                </label>
                                <textarea
                                    value={this.state.createDescription}
                                    onChange={(e) => this.setState({ createDescription: e.target.value })}
                                    placeholder="A custom gradient theme"
                                    maxLength={200}
                                    rows={2}
                                />
                            </div>

                            {/* Preset selection */}
                            <div className={styles.customThemeDialogField}>
                                <label>
                                    <FormattedMessage
                                        defaultMessage="Preset"
                                        description="Label for gradient preset selection"
                                        id="tw.customThemes.gradientCreator.preset"
                                    />
                                </label>
                                <select
                                    value={this.state.selectedPreset}
                                    onChange={(e) => this.handlePresetSelect(e.target.value)}
                                >
                                    <option value="">
                                        Custom Gradient
                                    </option>
                                    {GradientUtils.getGradientPresets().map(preset => (
                                        <option key={preset.name} value={preset.name}>
                                            {preset.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Gradient preview */}
                            <div className={styles.customThemeDialogField}>
                                <label>
                                    <FormattedMessage
                                        defaultMessage="Preview"
                                        description="Label for gradient preview"
                                        id="tw.customThemes.gradientCreator.preview"
                                    />
                                </label>
                                <div 
                                    className={styles.gradientPreview}
                                    style={{
                                        background: GradientUtils.createLinearGradient(
                                            this.state.gradientColors,
                                            this.state.gradientDirection
                                        )
                                    }}
                                />
                            </div>

                            {/* Color stops */}
                            <div className={styles.customThemeDialogField}>
                                <label>
                                    <FormattedMessage
                                        defaultMessage="Colors"
                                        description="Label for gradient colors section"
                                        id="tw.customThemes.gradientCreator.colors"
                                    />
                                </label>
                                <div className={styles.colorStops}>
                                    {this.state.gradientColors.map((stop, index) => (
                                        <div key={index} className={styles.colorStop}>
                                            <input
                                                type="color"
                                                value={stop.color}
                                                onChange={(e) => this.handleColorChange(index, e.target.value)}
                                                className={styles.colorPicker}
                                            />
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={stop.position}
                                                onChange={(e) => this.handlePositionChange(index, e.target.value)}
                                                className={styles.positionInput}
                                            />
                                            <span>%</span>
                                            {this.state.gradientColors.length > 2 && (
                                                <button
                                                    type="button"
                                                    onClick={() => this.handleRemoveColorStop(index)}
                                                    className={styles.removeColorButton}
                                                >
                                                    <FormattedMessage
                                                        defaultMessage="Remove"
                                                        description="Button to remove color stop"
                                                        id="tw.customThemes.gradientCreator.removeColor"
                                                    />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={this.handleAddColorStop}
                                        className={styles.addColorButton}
                                    >
                                        <FormattedMessage
                                            defaultMessage="Add Color"
                                            description="Button to add color stop"
                                            id="tw.customThemes.gradientCreator.addColor"
                                        />
                                    </button>
                                </div>
                            </div>

                            {/* Gradient direction */}
                            <div className={styles.customThemeDialogField}>
                                <label>
                                    <FormattedMessage
                                        defaultMessage="Direction"
                                        description="Label for gradient direction"
                                        id="tw.customThemes.gradientCreator.direction"
                                    />
                                </label>
                                <input
                                    type="range"
                                    min="0"
                                    max="360"
                                    value={this.state.gradientDirection}
                                    onChange={(e) => this.setState({ gradientDirection: parseInt(e.target.value) })}
                                    className={styles.directionSlider}
                                />
                                <span>{this.state.gradientDirection}°</span>
                            </div>

                            {/* Primary color */}
                            <div className={styles.customThemeDialogField}>
                                <label>
                                    <FormattedMessage
                                        defaultMessage="Primary Color"
                                        description="Label for primary accent color"
                                        id="tw.customThemes.gradientCreator.primaryColor"
                                    />
                                </label>
                                <input
                                    type="color"
                                    value={this.state.primaryColor}
                                    onChange={(e) => this.setState({ primaryColor: e.target.value })}
                                    className={styles.colorPicker}
                                />
                            </div>

                            <div className={styles.customThemeDialogButtons}>
                                <button
                                    className={styles.customThemeDialogButton}
                                    onClick={() => this.setState({ 
                                        showGradientCreator: false, 
                                        createName: '', 
                                        createDescription: '',
                                        gradientColors: [
                                            { color: '#ff6b6b', position: 0 },
                                            { color: '#4ecdc4', position: 100 }
                                        ],
                                        primaryColor: '#ff6b6b',
                                        gradientDirection: 90,
                                        selectedPreset: ''
                                    })}
                                >
                                    <FormattedMessage
                                        defaultMessage="Cancel"
                                        description="Cancel button"
                                        id="tw.customThemes.createDialog.cancel"
                                    />
                                </button>
                                <button
                                    className={classNames(styles.customThemeDialogButton, styles.primary)}
                                    onClick={this.handleCreateGradientTheme}
                                    disabled={!this.state.createName.trim()}
                                >
                                    <FormattedMessage
                                        defaultMessage="Create"
                                        description="Create button"
                                        id="tw.customThemes.createDialog.create"
                                    />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Gradient editor dialog */}
                {this.state.showGradientEditor && (
                    <div className={styles.customThemeDialog}>
                        <div className={styles.customThemeDialogContent}>
                            <h3>
                                <FormattedMessage
                                    defaultMessage="Edit Gradient Theme"
                                    description="Title for gradient editor dialog"
                                    id="tw.customThemes.gradientEditor.title"
                                />
                            </h3>
                            
                            {/* Theme name and description */}
                            <div className={styles.customThemeDialogField}>
                                <label>
                                    <FormattedMessage
                                        defaultMessage="Name"
                                        description="Label for theme name input"
                                        id="tw.customThemes.createDialog.name"
                                    />
                                </label>
                                <input
                                    type="text"
                                    value={this.state.createName}
                                    onChange={(e) => this.setState({ createName: e.target.value })}
                                    placeholder="My Gradient Theme"
                                    maxLength={50}
                                />
                            </div>
                            <div className={styles.customThemeDialogField}>
                                <label>
                                    <FormattedMessage
                                        defaultMessage="Description (optional)"
                                        description="Label for theme description input"
                                        id="tw.customThemes.createDialog.description"
                                    />
                                </label>
                                <textarea
                                    value={this.state.createDescription}
                                    onChange={(e) => this.setState({ createDescription: e.target.value })}
                                    placeholder="A custom gradient theme"
                                    maxLength={200}
                                    rows={2}
                                />
                            </div>

                            {/* Preset selection */}
                            <div className={styles.customThemeDialogField}>
                                <label>
                                    <FormattedMessage
                                        defaultMessage="Preset"
                                        description="Label for gradient preset selection"
                                        id="tw.customThemes.gradientCreator.preset"
                                    />
                                </label>
                                <select
                                    value={this.state.selectedPreset}
                                    onChange={(e) => this.handlePresetSelect(e.target.value)}
                                >
                                    <option value="">
                                        Custom Gradient
                                    </option>
                                    {GradientUtils.getGradientPresets().map(preset => (
                                        <option key={preset.name} value={preset.name}>
                                            {preset.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Gradient preview */}
                            <div className={styles.customThemeDialogField}>
                                <label>
                                    <FormattedMessage
                                        defaultMessage="Preview"
                                        description="Label for gradient preview"
                                        id="tw.customThemes.gradientCreator.preview"
                                    />
                                </label>
                                <div 
                                    className={styles.gradientPreview}
                                    style={{
                                        background: GradientUtils.createLinearGradient(
                                            this.state.gradientColors,
                                            this.state.gradientDirection
                                        )
                                    }}
                                />
                            </div>

                            {/* Color stops */}
                            <div className={styles.customThemeDialogField}>
                                <label>
                                    <FormattedMessage
                                        defaultMessage="Colors"
                                        description="Label for gradient colors section"
                                        id="tw.customThemes.gradientCreator.colors"
                                    />
                                </label>
                                <div className={styles.colorStops}>
                                    {this.state.gradientColors.map((stop, index) => (
                                        <div key={index} className={styles.colorStop}>
                                            <input
                                                type="color"
                                                value={stop.color}
                                                onChange={(e) => this.handleColorChange(index, e.target.value)}
                                                className={styles.colorPicker}
                                            />
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={stop.position}
                                                onChange={(e) => this.handlePositionChange(index, e.target.value)}
                                                className={styles.positionInput}
                                            />
                                            <span>%</span>
                                            {this.state.gradientColors.length > 2 && (
                                                <button
                                                    type="button"
                                                    onClick={() => this.handleRemoveColorStop(index)}
                                                    className={styles.removeColorButton}
                                                >
                                                    <FormattedMessage
                                                        defaultMessage="Remove"
                                                        description="Button to remove color stop"
                                                        id="tw.customThemes.gradientCreator.removeColor"
                                                    />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={this.handleAddColorStop}
                                        className={styles.addColorButton}
                                    >
                                        <FormattedMessage
                                            defaultMessage="Add Color"
                                            description="Button to add color stop"
                                            id="tw.customThemes.gradientCreator.addColor"
                                        />
                                    </button>
                                </div>
                            </div>

                            {/* Gradient direction */}
                            <div className={styles.customThemeDialogField}>
                                <label>
                                    <FormattedMessage
                                        defaultMessage="Direction"
                                        description="Label for gradient direction"
                                        id="tw.customThemes.gradientCreator.direction"
                                    />
                                </label>
                                <input
                                    type="range"
                                    min="0"
                                    max="360"
                                    value={this.state.gradientDirection}
                                    onChange={(e) => this.setState({ gradientDirection: parseInt(e.target.value) })}
                                    className={styles.directionSlider}
                                />
                                <span>{this.state.gradientDirection}°</span>
                            </div>

                            {/* Primary color */}
                            <div className={styles.customThemeDialogField}>
                                <label>
                                    <FormattedMessage
                                        defaultMessage="Primary Color"
                                        description="Label for primary accent color"
                                        id="tw.customThemes.gradientCreator.primaryColor"
                                    />
                                </label>
                                <input
                                    type="color"
                                    value={this.state.primaryColor}
                                    onChange={(e) => this.setState({ primaryColor: e.target.value })}
                                    className={styles.colorPicker}
                                />
                            </div>

                            <div className={styles.customThemeDialogButtons}>
                                <button
                                    className={styles.customThemeDialogButton}
                                    onClick={() => this.setState({ 
                                        showGradientEditor: false,
                                        editingThemeUuid: null,
                                        createName: '', 
                                        createDescription: '',
                                        gradientColors: [
                                            { color: '#ff6b6b', position: 0 },
                                            { color: '#4ecdc4', position: 100 }
                                        ],
                                        primaryColor: '#ff6b6b',
                                        gradientDirection: 90,
                                        selectedPreset: ''
                                    })}
                                >
                                    <FormattedMessage
                                        defaultMessage="Cancel"
                                        description="Cancel button"
                                        id="tw.customThemes.createDialog.cancel"
                                    />
                                </button>
                                <button
                                    className={classNames(styles.customThemeDialogButton, styles.primary)}
                                    onClick={this.handleUpdateGradientTheme}
                                    disabled={!this.state.createName.trim()}
                                >
                                    <FormattedMessage
                                        defaultMessage="Update"
                                        description="Update button for gradient editor"
                                        id="tw.customThemes.gradientEditor.update"
                                    />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </MenuItem>
        );
    }
}

CustomThemeMenu.propTypes = {
    isRtl: PropTypes.bool,
    onChangeTheme: PropTypes.func,
    theme: PropTypes.instanceOf(Theme),
    onOpen: PropTypes.func,
    isOpen: PropTypes.bool
};

const mapStateToProps = state => ({
    isOpen: customThemesOpen(state),
    isRtl: state.locales.isRtl,
    theme: state.scratchGui.theme.theme
});

const mapDispatchToProps = dispatch => ({
    onChangeTheme: theme => {
        dispatch(setTheme(theme));
        dispatch(closeSettingsMenu());
        applyTheme(theme);
    },
    onOpen: () => {
        dispatch(openCustomThemes());
    }
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(CustomThemeMenu);
