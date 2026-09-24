import PropTypes from 'prop-types';
import React from 'react';
import bindAll from 'lodash.bindall';
import {connect} from 'react-redux';
import {closeSettingsModal} from '../reducers/modals';
import {setTheme} from '../reducers/theme';
import SettingsModalComponent from '../components/tw-settings-modal/settings-modal.jsx';
import {defaultStageSize} from '../reducers/custom-stage-size';
import {CustomTheme} from '../lib/themes/custom-themes.js';
import {getAppearanceSetting, setAppearanceSetting} from '../lib/mw-appearance-settings';
import {getStyleSetting, getStyleSettings, setStyleSetting} from '../lib/mw-style-settings';
import {applyTheme} from '../lib/themes/themePersistance';
import {getHideOperatorArrows, setHideOperatorArrows} from '../lib/mw-operator-arrows';
import {getVanillaPalette, setVanillaPalette} from '../lib/mw-vanilla-palette';
import {
    getDisableCompiler, setDisableCompiler,
    getDisableCloudVariables, setDisableCloudVariables
} from '../lib/mw-editor-defaults';
import {setCloud} from '../reducers/tw';
import {normalizeCustomFramerate} from '../lib/utils/framerate';


class UsernameModal extends React.Component {
    constructor (props) {
        super(props);

        this.state = {
            storeThemeInProject: localStorage.getItem('mw:store-theme-in-project') === 'true',
            hideOperatorArrows: getHideOperatorArrows(),
            vanillaPalette: getVanillaPalette(),
            disableCompiler: getDisableCompiler(),
            disableCloudVariables: getDisableCloudVariables(),
            squareStageCorners: getAppearanceSetting('square-stage-corners'),
            hideDeleteButton: getAppearanceSetting('hide-delete-button'),
            hideExtensionButton: getAppearanceSetting('hide-extension-button'),
            unclipPalette: getAppearanceSetting('unclip-palette'),
            hideBackpack: getAppearanceSetting('hide-backpack')
        };

        bindAll(this, [
            'handleFramerateChange',
            'handleCustomizeFramerate',
            'handleHighQualityPenChange',
            'handleInterpolationChange',
            'handleInfiniteClonesChange',
            'handleRemoveFencingChange',
            'handleRemoveLimitsChange',
            'handleWarpTimerChange',
            'handleStageWidthChange',
            'handleStageHeightChange',
            'handleDisableCompilerChange',
            'handleDisableCloudVariablesChange',
            'handleCaseSensitiveListsChange',
            'handleRealLayerIndexesChange',
            'handleStoreProjectOptions',
            'handleStoreThemeInProjectChange',
            'handleHideOperatorArrowsChange',
            'handleVanillaPaletteChange',
            'handleSquareStageCornersChange',
            'handleHideDeleteButtonChange',
            'handleHideExtensionButtonChange',
            'handleUnclipPaletteChange',
            'handleHideBackpackChange',
            'handleTabStyleChange',
            'handleTabLooksChange',
            'handleWindowStyleChange'
        ]);
    }

    handleFramerateChange (e) {
        this.props.vm.setFramerate(e.target.checked ? 60 : 30);
    }
    handleCustomizeFramerate (value) {
        const parsed = normalizeCustomFramerate(value);
        if (parsed !== null) {
            this.props.vm.setFramerate(parsed);
        }
    }
    handleHighQualityPenChange (e) {
        this.props.vm.renderer.setUseHighQualityRender(e.target.checked);
    }
    handleInterpolationChange (e) {
        this.props.vm.setInterpolation(e.target.checked);
    }
    handleInfiniteClonesChange (e) {
        this.props.vm.setRuntimeOptions({
            maxClones: e.target.checked ? Infinity : 300
        });
    }
    handleRemoveFencingChange (e) {
        this.props.vm.setRuntimeOptions({
            fencing: !e.target.checked
        });
    }
    handleRemoveLimitsChange (e) {
        this.props.vm.setRuntimeOptions({
            miscLimits: !e.target.checked
        });
    }
    handleWarpTimerChange (e) {
        this.props.vm.setCompilerOptions({
            warpTimer: e.target.checked
        });
    }
    handleDisableCompilerChange (e) {
        const disabled = e.target.checked;
        this.setState({disableCompiler: disabled});
        setDisableCompiler(disabled);
        this.props.vm.setCompilerOptions({
            enabled: !disabled
        });
    }
    handleDisableCloudVariablesChange (e) {
        const disabled = e.target.checked;
        this.setState({disableCloudVariables: disabled});
        setDisableCloudVariables(disabled);
        this.props.onSetCloud(!disabled);
    }
    handleCaseSensitiveListsChange (e) {
        this.props.vm.setRuntimeOptions({
            caseSensitiveLists: e.target.checked
        });
    }
    handleRealLayerIndexesChange (e) {
        this.props.vm.renderer.useRealLayerIndexes = e.target.checked;
        this.props.vm.setRuntimeOptions({
            realLayerIndexes: e.target.checked
        });
    }
    handleStageWidthChange (value) {
        this.props.vm.setStageSize(value, this.props.customStageSize.height);
        this.storeStageSizeInProject();
    }
    handleStageHeightChange (value) {
        this.props.vm.setStageSize(this.props.customStageSize.width, value);
        this.storeStageSizeInProject();
    }
    storeStageSizeInProject () {
        if (this.storeStageSizeTimeout) {
            clearTimeout(this.storeStageSizeTimeout);
        }
        this.storeStageSizeTimeout = setTimeout(() => {
            this.storeStageSizeTimeout = null;
            this.props.vm.storeProjectOptions();
        }, 500);
    }
    handleStoreProjectOptions () {
        if (!this.state.storeThemeInProject) {
            this.props.vm.storeProjectOptions();
            return;
        }

        const theme = this.props.theme;
        if (!theme) {
            this.props.vm.storeProjectOptions();
            return;
        }

        const mistwarpTheme = (() => {
            if (theme instanceof CustomTheme) {
                return {
                    version: 1,
                    kind: 'custom',
                    data: theme.export()
                };
            }
            return {
                version: 1,
                kind: 'standard',
                data: {
                    accent: theme.accent,
                    gui: theme.gui,
                    blocks: theme.blocks,
                    menuBarAlign: theme.menuBarAlign,
                    wallpaper: theme.wallpaper,
                    fonts: theme.fonts,
                    appearance: theme.appearance
                }
            };
        })();

        this.props.vm.storeProjectOptions({
            mistwarpTheme
        });
    }

    handleStoreThemeInProjectChange (e) {
        this.setState({storeThemeInProject: e.target.checked});
        try {
            localStorage.setItem('mw:store-theme-in-project', e.target.checked);
        } catch (err) {
            // ignore
        }
    }

    handleHideOperatorArrowsChange (e) {
        this.setState({hideOperatorArrows: e.target.checked});
        setHideOperatorArrows(e.target.checked);
    }

    handleVanillaPaletteChange (e) {
        this.setState({vanillaPalette: e.target.checked});
        setVanillaPalette(e.target.checked);
    }

    setAppearance_ (stateKey, id, checked) {
        this.setState({[stateKey]: checked});
        setAppearanceSetting(id, checked);
    }

    handleSquareStageCornersChange (e) {
        this.setAppearance_('squareStageCorners', 'square-stage-corners', e.target.checked);
    }

    handleHideDeleteButtonChange (e) {
        this.setAppearance_('hideDeleteButton', 'hide-delete-button', e.target.checked);
    }

    handleHideExtensionButtonChange (e) {
        this.setAppearance_('hideExtensionButton', 'hide-extension-button', e.target.checked);
    }

    handleHideBackpackChange (e) {
        this.setAppearance_('hideBackpack', 'hide-backpack', e.target.checked);
    }

    handleUnclipPaletteChange (e) {
        this.setAppearance_('unclipPalette', 'unclip-palette', e.target.checked);
    }

    setStyle_ (id, value) {
        setStyleSetting(id, value);
        if (this.props.theme) {
            this.props.onChangeTheme(this.props.theme.setAppearance({styles: getStyleSettings()}));
        }
    }

    handleTabStyleChange (value) {
        this.setStyle_('tab-style', value);
    }

    handleTabLooksChange (value) {
        this.setStyle_('tab-looks', value);
    }

    handleWindowStyleChange (value) {
        this.setStyle_('window-style', value);
    }
    render () {
        const {
            /* eslint-disable no-unused-vars */
            onClose,
            vm,
            /* eslint-enable no-unused-vars */
            ...props
        } = this.props;
        return (
            <SettingsModalComponent
                onClose={this.props.onClose}
                onFramerateChange={this.handleFramerateChange}
                onCustomizeFramerate={this.handleCustomizeFramerate}
                onHighQualityPenChange={this.handleHighQualityPenChange}
                onInterpolationChange={this.handleInterpolationChange}
                onInfiniteClonesChange={this.handleInfiniteClonesChange}
                onRemoveFencingChange={this.handleRemoveFencingChange}
                onRemoveLimitsChange={this.handleRemoveLimitsChange}
                onWarpTimerChange={this.handleWarpTimerChange}
                onStageWidthChange={this.handleStageWidthChange}
                onStageHeightChange={this.handleStageHeightChange}
                onDisableCompilerChange={this.handleDisableCompilerChange}
                disableCompiler={this.state.disableCompiler}
                onDisableCloudVariablesChange={this.handleDisableCloudVariablesChange}
                disableCloudVariables={this.state.disableCloudVariables}
                onCaseSensitiveListsChange={this.handleCaseSensitiveListsChange}
                onRealLayerIndexesChange={this.handleRealLayerIndexesChange}
                stageWidth={this.props.customStageSize.width}
                stageHeight={this.props.customStageSize.height}
                customStageSizeEnabled={
                    this.props.customStageSize.width !== defaultStageSize.width ||
                    this.props.customStageSize.height !== defaultStageSize.height
                }
                onStoreProjectOptions={this.handleStoreProjectOptions}
                onStoreThemeInProjectChange={this.handleStoreThemeInProjectChange}
                onHideOperatorArrowsChange={this.handleHideOperatorArrowsChange}
                hideOperatorArrows={this.state.hideOperatorArrows}
                onVanillaPaletteChange={this.handleVanillaPaletteChange}
                vanillaPalette={this.state.vanillaPalette}
                onSquareStageCornersChange={this.handleSquareStageCornersChange}
                squareStageCorners={this.state.squareStageCorners}
                onHideDeleteButtonChange={this.handleHideDeleteButtonChange}
                hideDeleteButton={this.state.hideDeleteButton}
                onHideExtensionButtonChange={this.handleHideExtensionButtonChange}
                hideExtensionButton={this.state.hideExtensionButton}
                onUnclipPaletteChange={this.handleUnclipPaletteChange}
                unclipPalette={this.state.unclipPalette}
                onHideBackpackChange={this.handleHideBackpackChange}
                hideBackpack={this.state.hideBackpack}
                onTabStyleChange={this.handleTabStyleChange}
                tabStyle={getStyleSetting('tab-style')}
                onTabLooksChange={this.handleTabLooksChange}
                tabLooks={getStyleSetting('tab-looks')}
                onWindowStyleChange={this.handleWindowStyleChange}
                windowStyle={getStyleSetting('window-style')}
                storeThemeInProject={this.state.storeThemeInProject}
                theme={this.props.theme}
                {...props}
            />
        );
    }
}

UsernameModal.propTypes = {
    onClose: PropTypes.func,
    vm: PropTypes.shape({
        renderer: PropTypes.shape({
            setUseHighQualityRender: PropTypes.func,
            useRealLayerIndexes: PropTypes.bool
        }),
        setFramerate: PropTypes.func,
        setCompilerOptions: PropTypes.func,
        setInterpolation: PropTypes.func,
        setRuntimeOptions: PropTypes.func,
        setStageSize: PropTypes.func,
        setExtendableOperators: PropTypes.func,
        storeProjectOptions: PropTypes.func
    }),
    isEmbedded: PropTypes.bool,
    framerate: PropTypes.number,
    highQualityPen: PropTypes.bool,
    interpolation: PropTypes.bool,
    infiniteClones: PropTypes.bool,
    removeFencing: PropTypes.bool,
    removeLimits: PropTypes.bool,
    warpTimer: PropTypes.bool,
    customStageSize: PropTypes.shape({
        width: PropTypes.number,
        height: PropTypes.number
    }),
    onSetCloud: PropTypes.func,
    caseSensitiveLists: PropTypes.bool,
    realLayerIndexes: PropTypes.bool,
    theme: PropTypes.any,
    onChangeTheme: PropTypes.func
};

const mapStateToProps = state => ({
    vm: state.scratchGui.vm,
    isEmbedded: state.scratchGui.mode.isEmbedded,
    framerate: state.scratchGui.tw.framerate,
    highQualityPen: state.scratchGui.tw.highQualityPen,
    interpolation: state.scratchGui.tw.interpolation,
    infiniteClones: state.scratchGui.tw.runtimeOptions.maxClones === Infinity,
    removeFencing: !state.scratchGui.tw.runtimeOptions.fencing,
    removeLimits: !state.scratchGui.tw.runtimeOptions.miscLimits,
    warpTimer: state.scratchGui.tw.compilerOptions.warpTimer,
    customStageSize: state.scratchGui.customStageSize,
    // Handle possible undefined value for caseSensitiveLists
    caseSensitiveLists: !!state.scratchGui.tw.runtimeOptions.caseSensitiveLists,
    realLayerIndexes: !!state.scratchGui.tw.runtimeOptions.realLayerIndexes,
    theme: state.scratchGui.theme?.theme
});

const mapDispatchToProps = dispatch => ({
    onClose: () => dispatch(closeSettingsModal()),
    onSetCloud: cloud => dispatch(setCloud(cloud)),
    onChangeTheme: theme => {
        dispatch(setTheme(theme));
        applyTheme(theme);
    }
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(UsernameModal);
