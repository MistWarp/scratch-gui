/* eslint-disable react/jsx-no-bind */
import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import {FormattedMessage} from 'react-intl';
import {connect} from 'react-redux';

import Box from '../box/box.jsx';
import {Theme} from '../../lib/themes/index.js';
import {customThemeManager, CustomTheme, GradientUtils} from '../../lib/themes/custom-themes.js';
import {setTheme} from '../../reducers/theme.js';
import {applyTheme} from '../../lib/themes/themePersistance.js';
import {openWarpThemeModal} from '../../reducers/modals.js';
import showAlert from '../../addons/window-system/alert';
import GradientBuilder from './gradient-builder.jsx';

import styles from './settings-modal.css';

import {
    Bookmark, Check, CirclePlus, Download, Edit, FolderInput,
    Palette, Sparkles, Store, Trash, Upload
} from 'lucide-react';

const TABS = {
    LIBRARY: 'library',
    CREATE: 'create',
    IMPORT: 'import'
};

const themePreviewStyle = theme => {
    try {
        const colors = theme.getGuiColors ? theme.getGuiColors() : {};
        const image = colors['menu-bar-background-image'];
        if (image) {
            return {backgroundImage: image, backgroundSize: 'cover'};
        }
        const solid = colors['looks-secondary'] || colors['menu-bar-background'] || '#4c97ff';
        return {background: solid};
    } catch (_) {
        return {background: '#4c97ff'};
    }
};

class UnconnectedCustomThemesPage extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            tab: TABS.LIBRARY,
            createMode: 'current', // 'current' | 'gradient'
            customThemes: customThemeManager.getAllThemes(),
            activeEditor: null,
            editingThemeUuid: null,
            editorInitial: {},
            createName: '',
            createDescription: '',
            originalThemeBeforePreview: null,
            statusMessage: ''
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

    setTab = tab => {
        this.stopPreview();
        this.setState({
            tab,
            activeEditor: null,
            editingThemeUuid: null,
            editorInitial: {},
            statusMessage: ''
        });
    };

    stopPreview () {
        if (this.state.originalThemeBeforePreview) {
            this.props.onChangeTheme(this.state.originalThemeBeforePreview);
            this.setState({originalThemeBeforePreview: null});
        }
    }

    closeEditor = () => {
        this.stopPreview();
        this.setState({
            activeEditor: null,
            editingThemeUuid: null,
            editorInitial: {},
            createMode: 'current'
        });
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
            this.setState({
                createName: '',
                createDescription: '',
                tab: TABS.LIBRARY,
                statusMessage: `“${customTheme.name}” saved to your library.`
            });
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
            currentTheme.fonts,
            'User',
            currentTheme.appearance
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
            this.setState({
                tab: TABS.LIBRARY,
                statusMessage: `“${customTheme.name}” saved to your library.`
            });
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
                tab: TABS.CREATE,
                createMode: 'gradient',
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
                    updatedTheme.author,
                    updatedTheme.appearance
                );
                Object.defineProperty(newTheme, 'uuid', {value: editingThemeUuid, writable: false});
                Object.defineProperty(newTheme, 'createdAt', {value: updatedTheme.createdAt, writable: false});
                customThemeManager.themes.set(editingThemeUuid, newTheme);
                customThemeManager.saveCustomThemes();
            }

            this.closeEditor();
            this.setState({
                tab: TABS.LIBRARY,
                statusMessage: 'Theme updated.'
            });

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
        if (confirm(`Delete “${themeName}”? This cannot be undone.`)) {
            try {
                customThemeManager.removeTheme(themeUuid);
                this.setState({statusMessage: `“${themeName}” deleted.`});
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
            this.setState({statusMessage: 'Exported all themes.'});
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

                let message = `Imported ${results.imported}`;
                if (results.skipped > 0) message += `, skipped ${results.skipped}`;
                if (results.errors.length > 0) message += `, ${results.errors.length} error(s)`;
                this.setState({
                    tab: TABS.LIBRARY,
                    statusMessage: `${message}.`
                });
                if (results.errors.length > 0) {
                    await showAlert(results.errors.join('\n'));
                }
            } catch (error) {
                await showAlert(`Failed to import themes: ${error.message}`);
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    };

    renderTabs () {
        const {tab, customThemes} = this.state;
        const items = [
            {
                id: TABS.LIBRARY,
                label: (
                    <FormattedMessage
                        defaultMessage="Library"
                        id="mw.customThemes.tab.library"
                    />
                ),
                icon: Bookmark,
                badge: customThemes.length || null
            },
            {
                id: TABS.CREATE,
                label: (
                    <FormattedMessage
                        defaultMessage="Create"
                        id="mw.customThemes.tab.create"
                    />
                ),
                icon: CirclePlus
            },
            {
                id: TABS.IMPORT,
                label: (
                    <FormattedMessage
                        defaultMessage="Import / Export"
                        id="mw.customThemes.tab.importExport"
                    />
                ),
                icon: FolderInput
            }
        ];

        return (
            <div
                className={styles.ctTabs}
                role="tablist"
            >
                {items.map(item => {
                    const Icon = item.icon;
                    const selected = tab === item.id;
                    return (
                        <button
                            key={item.id}
                            role="tab"
                            type="button"
                            aria-selected={selected}
                            className={classNames(styles.ctTab, {
                                [styles.ctTabSelected]: selected
                            })}
                            onClick={() => this.setTab(item.id)}
                        >
                            <Icon size={15} />
                            <span>{item.label}</span>
                            {typeof item.badge === 'number' && item.badge > 0 && (
                                <span className={styles.ctTabBadge}>{item.badge}</span>
                            )}
                        </button>
                    );
                })}
            </div>
        );
    }

    renderLibrary () {
        const {theme} = this.props;
        const {customThemes} = this.state;

        if (customThemes.length === 0) {
            return (
                <div className={styles.ctEmpty}>
                    <Palette size={28} />
                    <h3>
                        <FormattedMessage
                            defaultMessage="No custom themes yet"
                            id="tw.customThemes.empty"
                        />
                    </h3>
                    <p className={styles.detail}>
                        <FormattedMessage
                            defaultMessage="Create one from your current look, build a gradient, or browse WarpTheme."
                            id="mw.customThemes.empty.hint"
                        />
                    </p>
                    <div className={styles.ctEmptyActions}>
                        <button
                            type="button"
                            className={styles.button}
                            onClick={() => this.setTab(TABS.CREATE)}
                        >
                            <CirclePlus size={14} />
                            <FormattedMessage
                                defaultMessage="Create a theme"
                                id="mw.customThemes.empty.create"
                            />
                        </button>
                        <button
                            type="button"
                            className={styles.ctButtonSecondary}
                            onClick={this.props.onOpenWarpThemeMarketplace}
                        >
                            <Store size={14} />
                            <FormattedMessage
                                defaultMessage="Browse marketplace"
                                id="mw.customThemes.empty.marketplace"
                            />
                        </button>
                    </div>
                </div>
            );
        }

        return (
            <div className={styles.ctLibrary}>
                {customThemes.map(customTheme => {
                    const isSelected = theme instanceof CustomTheme && theme.uuid === customTheme.uuid;
                    const isGradient = customThemeManager.hasCustomGradient(customTheme.uuid);
                    return (
                        <div
                            key={customTheme.uuid}
                            className={classNames(styles.ctCard, {
                                [styles.ctCardSelected]: isSelected
                            })}
                        >
                            <button
                                type="button"
                                className={styles.ctCardMain}
                                onClick={() => this.props.onChangeTheme(customTheme)}
                            >
                                <span
                                    className={styles.ctCardSwatch}
                                    style={themePreviewStyle(customTheme)}
                                />
                                <span className={styles.ctCardBody}>
                                    <span className={styles.ctCardTitleRow}>
                                        <span className={styles.ctCardName}>{customTheme.name}</span>
                                        {isSelected && (
                                            <span className={styles.ctActivePill}>
                                                <Check size={12} />
                                                <FormattedMessage
                                                    defaultMessage="Active"
                                                    id="mw.customThemes.active"
                                                />
                                            </span>
                                        )}
                                    </span>
                                    {customTheme.description ? (
                                        <span className={styles.ctCardDesc}>{customTheme.description}</span>
                                    ) : (
                                        <span className={styles.ctCardDescMuted}>
                                            {isGradient ? 'Gradient theme' : 'Custom theme'}
                                            {customTheme.author && customTheme.author !== 'User' ?
                                                ` · ${customTheme.author}` : ''}
                                        </span>
                                    )}
                                </span>
                            </button>
                            <div className={styles.ctCardActions}>
                                {isGradient && (
                                    <button
                                        type="button"
                                        className={styles.iconButton}
                                        title="Edit gradient"
                                        onClick={() => this.handleEditGradient(customTheme.uuid)}
                                    >
                                        <Edit size={15} />
                                    </button>
                                )}
                                <button
                                    type="button"
                                    className={styles.iconButton}
                                    title="Export theme"
                                    onClick={() => this.handleExportSingleTheme(customTheme)}
                                >
                                    <Download size={15} />
                                </button>
                                <button
                                    type="button"
                                    className={styles.iconButton}
                                    title="Delete theme"
                                    onClick={() => this.handleDeleteTheme(customTheme.uuid, customTheme.name)}
                                >
                                    <Trash size={15} />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    }

    renderCreate () {
        const {createMode, activeEditor, editorInitial} = this.state;

        if (activeEditor === 'editGradient') {
            return (
                <div className={styles.ctPanel}>
                    <div className={styles.ctPanelHeader}>
                        <h3>
                            <FormattedMessage
                                defaultMessage="Edit gradient"
                                id="mw.customThemes.editGradient"
                            />
                        </h3>
                    </div>
                    <GradientBuilder
                        mode="edit"
                        initialName={editorInitial.name}
                        initialDescription={editorInitial.description}
                        initialGradientColors={editorInitial.gradientColors}
                        initialDirection={editorInitial.direction}
                        initialPrimaryColor={editorInitial.primaryColor}
                        onSubmit={this.handleUpdateGradient}
                        onPreview={this.handlePreviewGradient}
                        onCancel={() => {
                            this.closeEditor();
                            this.setTab(TABS.LIBRARY);
                        }}
                    />
                </div>
            );
        }

        return (
            <div className={styles.ctCreate}>
                <div className={styles.ctModeSwitch}>
                    <button
                        type="button"
                        className={classNames(styles.ctModeBtn, {
                            [styles.ctModeBtnSelected]: createMode === 'current'
                        })}
                        onClick={() => this.setState({createMode: 'current'})}
                    >
                        <Sparkles size={15} />
                        <FormattedMessage
                            defaultMessage="From current"
                            id="mw.customThemes.create.fromCurrent"
                        />
                    </button>
                    <button
                        type="button"
                        className={classNames(styles.ctModeBtn, {
                            [styles.ctModeBtnSelected]: createMode === 'gradient'
                        })}
                        onClick={() => this.setState({createMode: 'gradient'})}
                    >
                        <Palette size={15} />
                        <FormattedMessage
                            defaultMessage="Gradient"
                            id="mw.customThemes.create.gradient"
                        />
                    </button>
                </div>

                {createMode === 'current' ? (
                    <div className={styles.ctPanel}>
                        <div className={styles.ctSnapshot}>
                            <div
                                className={styles.ctSnapshotSwatch}
                                style={themePreviewStyle(this.props.theme)}
                            />
                            <div className={styles.ctSnapshotMeta}>
                                <strong>
                                    <FormattedMessage
                                        defaultMessage="Current look"
                                        id="mw.customThemes.create.snapshot"
                                    />
                                </strong>
                                <span>
                                    <FormattedMessage
                                        defaultMessage="Saves accent, GUI mode, blocks, wallpaper, and fonts."
                                        id="mw.customThemes.create.fromCurrent.hint"
                                    />
                                </span>
                            </div>
                        </div>

                        <label className={styles.ctField}>
                            <span className={styles.ctLabel}>
                                <FormattedMessage
                                    defaultMessage="Name"
                                    id="tw.customThemes.createDialog.name"
                                />
                            </span>
                            <input
                                type="text"
                                className={styles.ctInput}
                                value={this.state.createName}
                                onChange={e => this.setState({createName: e.target.value})}
                                placeholder="My Custom Theme"
                                maxLength={50}
                                autoComplete="off"
                            />
                        </label>

                        <label className={styles.ctField}>
                            <span className={styles.ctLabel}>
                                <FormattedMessage
                                    defaultMessage="Description (optional)"
                                    id="tw.customThemes.createDialog.description"
                                />
                            </span>
                            <textarea
                                className={styles.ctTextarea}
                                value={this.state.createDescription}
                                onChange={e => this.setState({createDescription: e.target.value})}
                                placeholder="A custom theme based on current settings"
                                maxLength={200}
                                rows={3}
                            />
                        </label>

                        <div className={styles.ctFormActions}>
                            <button
                                type="button"
                                className={styles.button}
                                disabled={!this.state.createName.trim()}
                                onClick={this.handleCreateFromCurrent}
                            >
                                <FormattedMessage
                                    defaultMessage="Save to library"
                                    id="mw.customThemes.create.save"
                                />
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className={styles.ctPanel}>
                        <GradientBuilder
                            mode="create"
                            onSubmit={this.handleCreateGradient}
                            onPreview={this.handlePreviewGradient}
                            onCancel={() => this.setTab(TABS.LIBRARY)}
                        />
                    </div>
                )}
            </div>
        );
    }

    renderImportExport () {
        const {customThemes} = this.state;
        return (
            <div className={styles.ctImport}>
                <div className={styles.ctActionCard}>
                    <div className={styles.ctActionIcon}><Upload size={18} /></div>
                    <div className={styles.ctActionBody}>
                        <h3>
                            <FormattedMessage
                                defaultMessage="Import"
                                id="tw.customThemes.import"
                            />
                        </h3>
                        <p className={styles.detail}>
                            <FormattedMessage
                                defaultMessage="Load themes from a MistWarp or NitroBolt JSON file."
                                id="mw.customThemes.import.hint"
                            />
                        </p>
                    </div>
                    <button
                        type="button"
                        className={styles.button}
                        onClick={() => this.fileInputRef.current && this.fileInputRef.current.click()}
                    >
                        <FolderInput size={14} />
                        <FormattedMessage
                            defaultMessage="Choose file"
                            id="mw.customThemes.import.choose"
                        />
                    </button>
                </div>

                <div className={styles.ctActionCard}>
                    <div className={styles.ctActionIcon}><Download size={18} /></div>
                    <div className={styles.ctActionBody}>
                        <h3>
                            <FormattedMessage
                                defaultMessage="Export all"
                                id="tw.customThemes.export"
                            />
                        </h3>
                        <p className={styles.detail}>
                            <FormattedMessage
                                defaultMessage="Download every theme in your library as one JSON file."
                                id="mw.customThemes.export.hint"
                            />
                        </p>
                    </div>
                    <button
                        type="button"
                        className={styles.ctButtonSecondary}
                        disabled={customThemes.length === 0}
                        onClick={this.handleExportThemes}
                    >
                        <Download size={14} />
                        <FormattedMessage
                            defaultMessage="Export"
                            id="mw.customThemes.export.button"
                        />
                    </button>
                </div>

                <div className={styles.ctActionCard}>
                    <div className={styles.ctActionIcon}><Store size={18} /></div>
                    <div className={styles.ctActionBody}>
                        <h3>
                            <FormattedMessage
                                defaultMessage="WarpTheme Marketplace"
                                id="mw.menu.warptheme"
                            />
                        </h3>
                        <p className={styles.detail}>
                            <FormattedMessage
                                defaultMessage="Browse community themes and add them to your library."
                                id="mw.customThemes.marketplace.hint"
                            />
                        </p>
                    </div>
                    <button
                        type="button"
                        className={styles.ctButtonSecondary}
                        onClick={this.props.onOpenWarpThemeMarketplace}
                    >
                        <Store size={14} />
                        <FormattedMessage
                            defaultMessage="Open"
                            id="mw.customThemes.marketplace.open"
                        />
                    </button>
                </div>
            </div>
        );
    }

    render () {
        const {tab, statusMessage} = this.state;

        return (
            <Box className={classNames(styles.body, styles.ctPage)}>
                <div className={styles.header}>
                    <FormattedMessage
                        defaultMessage="Custom Themes"
                        description="Menu item for custom themes"
                        id="tw.menuBar.customThemes"
                    />
                    <div className={styles.divider} />
                </div>

                {this.renderTabs()}

                {statusMessage && (
                    <div className={styles.ctStatus}>{statusMessage}</div>
                )}

                <div className={styles.ctContent}>
                    {tab === TABS.LIBRARY && this.renderLibrary()}
                    {tab === TABS.CREATE && this.renderCreate()}
                    {tab === TABS.IMPORT && this.renderImportExport()}
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
            dispatch(openWarpThemeModal());
        }
    })
)(UnconnectedCustomThemesPage);
