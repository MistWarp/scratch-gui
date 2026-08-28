import {defineMessages, FormattedMessage, intlShape, injectIntl} from 'react-intl';
import PropTypes from 'prop-types';
import React from 'react';
import classNames from 'classnames';
import bindAll from 'lodash.bindall';
import Box from '../box/box.jsx';
import Modal from '../../containers/windowed-modal.jsx';
import FancyCheckbox from '../tw-fancy-checkbox/checkbox.jsx';
import Input from '../forms/input.jsx';
import BufferedInputHOC from '../forms/buffered-input-hoc.jsx';
import {
    ModalSidebar,
    ModalSidebarContent,
    ModalSidebarGroup,
    ModalSidebarGroupHeader,
    ModalSidebarItem,
    ModalSidebarLayout
} from '../modal-sidebar/modal-sidebar.jsx';
import styles from './settings-modal.css';
import {APP_NAME} from '../../lib/constants/brand.js';
import {STYLE_GROUPS} from '../../lib/mw-style-settings';
import StylePreview from './style-preview.jsx';
import MenuBarLayoutSetting from './menu-bar-layout.jsx';
import MenuBarFeatureSettings from './menu-bar-settings.jsx';
import {LanguagePage, ThemePage, WallpaperPage, FontsPage} from './appearance-pages.jsx';
import LoadingScreenPage from './loading-screen-page.jsx';
import ShortcutManager from '../shortcut-manager/shortcut-manager.jsx';
import {takeSettingsModalInitialView} from '../../lib/settings/modal-view.js';

import {Settings, Zap, Blocks, Palette, PanelTop, Bug, GitBranch, Variable,
    Globe, SunMoon, Wallpaper, Type, Monitor, Keyboard, ChevronLeft,
    Hourglass} from 'lucide-react';
import {DEFINITIONS as DEBUGGER_SETTINGS, getSetting as getDebuggerSetting,
    setSetting as setDebuggerSetting} from '../../lib/debugger/settings.js';
import {DEFINITIONS as VARIABLE_MANAGER_SETTINGS, getSetting as getVariableManagerSetting,
    setSetting as setVariableManagerSetting} from '../../lib/variable-manager/settings.js';
import {
    getAuthorName, getAuthorEmail, setAuthorName, setAuthorEmail,
    getDefaultBranch, setDefaultBranch, getAutoCommit, setAutoCommit
} from '../../lib/git/config.js';
import {BooleanSetting, LearnMore, Setting} from './setting.jsx';

const BufferedInput = BufferedInputHOC(Input);

const messages = defineMessages({
    title: {
        defaultMessage: 'Settings',
        description: 'Title of settings modal',
        id: 'tw.settingsModal.title'
    },
    headerFeatured: {
        defaultMessage: 'Featured',
        description: 'Settings modal section',
        id: 'tw.settingsModal.featured'
    },
    headerRemoveLimits: {
        defaultMessage: 'Remove Limits',
        description: 'Settings modal section',
        id: 'tw.settingsModal.removeLimits'
    },
    headerDangerZone: {
        defaultMessage: 'Danger Zone',
        description: 'Settings modal section',
        id: 'tw.settingsModal.dangerZone'
    },
    headerExperimental: {
        defaultMessage: 'Experimental',
        id: 'mw.settings.experimental'
    },
    headerEditor: {
        defaultMessage: 'Editor',
        id: 'mw.settings.editor'
    },
    headerInterface: {
        defaultMessage: 'Interface',
        id: 'mw.settings.interface'
    },
    headerStage: {
        defaultMessage: 'Stage',
        id: 'mw.settings.stageHeader'
    },
    headerBlockPalette: {
        defaultMessage: 'Block Palette',
        id: 'mw.settings.blockPaletteHeader'
    },
    headerStyles: {
        defaultMessage: 'Styles',
        id: 'mw.settings.stylesHeader'
    },
    headerMenuBar: {
        defaultMessage: 'Menu Bar',
        id: 'mw.settings.menuBarHeader'
    },
    headerMenuBarLayout: {
        defaultMessage: 'Layout',
        id: 'mw.settings.menuBarLayoutHeader'
    },
    headerMenuBarItems: {
        defaultMessage: 'Menu Items',
        id: 'mw.settings.menuBarItemsHeader'
    },
    headerAutosave: {
        defaultMessage: 'Autosave',
        id: 'mw.settings.autosaveHeader'
    },
    headerDebugger: {
        defaultMessage: 'Debugger',
        id: 'mw.settings.debuggerHeader'
    },
    headerVersionControl: {
        defaultMessage: 'Version Control',
        id: 'mw.settings.versionControlHeader'
    },
    headerVariableManager: {
        defaultMessage: 'Variable Manager',
        id: 'mw.settings.variableManagerHeader'
    }
});

const Header = ({children}) => (
    <div className={styles.header}>
        {children}
        <div className={styles.divider} />
    </div>
);
Header.propTypes = {
    children: PropTypes.node
};

const settingDefinitions = {
    highQualityPen: {
        label: {
            defaultMessage: 'High Quality Pen',
            description: 'High quality pen setting',
            id: 'tw.settingsModal.highQualityPen'
        },
        help: {
            // eslint-disable-next-line max-len
            defaultMessage: 'Allows pen projects to render at higher resolutions and disables some coordinate rounding in the editor. Not all projects benefit from this setting and it may impact performance.',
            description: 'High quality pen setting help',
            id: 'tw.settingsModal.highQualityPenHelp'
        },
        slug: 'high-quality-pen'
    },
    interpolation: {
        label: {
            defaultMessage: 'Interpolation',
            description: 'Interpolation setting',
            id: 'tw.settingsModal.interpolation'
        },
        help: {
            // eslint-disable-next-line max-len
            defaultMessage: 'Makes projects appear smoother by interpolating sprite motion. Interpolation should not be used on 3D projects, raytracers, pen projects, and laggy projects as interpolation will make them run slower without making them appear smoother.',
            description: 'Interpolation setting help',
            id: 'tw.settingsModal.interpolationHelp'
        },
        slug: 'interpolation'
    },
    infiniteClones: {
        label: {
            defaultMessage: 'Infinite Clones',
            description: 'Infinite Clones setting',
            id: 'tw.settingsModal.infiniteClones'
        },
        help: {
            defaultMessage: 'Disables Scratch\'s 300 clone limit.',
            description: 'Infinite Clones setting help',
            id: 'tw.settingsModal.infiniteClonesHelp'
        },
        slug: 'infinite-clones'
    },
    removeFencing: {
        label: {
            defaultMessage: 'Remove Fencing',
            description: 'Remove Fencing setting',
            id: 'tw.settingsModal.removeFencing'
        },
        help: {
            // eslint-disable-next-line max-len
            defaultMessage: 'Allows sprites to move offscreen, become as large or as small as they want, and makes touching blocks work offscreen.',
            description: 'Remove Fencing setting help',
            id: 'tw.settingsModal.removeFencingHelp'
        },
        slug: 'remove-fencing'
    },
    removeMiscLimits: {
        label: {
            defaultMessage: 'Remove Miscellaneous Limits',
            description: 'Remove Miscellaneous Limits setting',
            id: 'tw.settingsModal.removeMiscLimits'
        },
        help: {
            defaultMessage: 'Removes sound effect limits and pen size limits.',
            description: 'Remove Miscellaneous Limits setting help',
            id: 'tw.settingsModal.removeMiscLimitsHelp'
        },
        slug: 'remove-misc-limits'
    },
    warpTimer: {
        label: {
            defaultMessage: 'Warp Timer',
            description: 'Warp Timer setting',
            id: 'tw.settingsModal.warpTimer'
        },
        help: {
            // eslint-disable-next-line max-len
            defaultMessage: 'Makes scripts check if they are stuck in a long or infinite loop and run at a low framerate instead of getting stuck until the loop finishes. This fixes most crashes but has a significant performance impact, so it\'s only enabled by default in the editor.',
            description: 'Warp Timer help',
            id: 'tw.settingsModal.warpTimerHelp'
        },
        slug: 'warp-timer'
    },
    caseSensitiveLists: {
        label: {
            defaultMessage: 'Case Sensitive Lists',
            description: 'Case Sensitive Lists setting',
            id: 'tw.settingsModal.caseSensitiveLists'
        },
        help: {
            // eslint-disable-next-line max-len
            defaultMessage: 'Makes lists case sensitive. This means that \'a\' and \'A\' are different values. This is not recommended for most projects but can improve speed massively for list heavy projects.',
            description: 'Case Sensitive Lists help',
            id: 'tw.settingsModal.caseSensitiveListsHelp'
        }
    },
    realLayerIndexes: {
        label: {
            defaultMessage: 'Real Layer Indexes',
            description: 'Real Layer Indexes label',
            id: 'tw.settingsModal.realLayerIndexes'
        },
        help: {
            // eslint-disable-next-line max-len
            defaultMessage: 'Changes layer indexes to change the position in the render order array without limiting the number of layers to the number of drawables.',
            description: 'Real Layer Indexes help',
            id: 'tw.settingsModal.realLayerIndexesHelp'
        }
    },
    squareStageCorners: {
        label: {
            defaultMessage: 'Square Stage Corners',
            id: 'mw.settingsModal.squareStageCorners'
        },
        help: {
            defaultMessage: 'Removes the rounded corners from the stage.',
            id: 'mw.settingsModal.squareStageCornersHelp'
        }
    },
    hideDeleteButton: {
        label: {
            defaultMessage: 'Hide Delete Button',
            id: 'mw.settingsModal.hideDeleteButton'
        },
        help: {
            defaultMessage: 'Hides the delete button on sprites, costumes, and sounds.',
            id: 'mw.settingsModal.hideDeleteButtonHelp'
        }
    },
    hideExtensionButton: {
        label: {
            defaultMessage: 'Hide Extension Button',
            id: 'mw.settingsModal.hideExtensionButton'
        },
        help: {
            defaultMessage: 'Hides the add extension button in the bottom-left of the block palette.',
            id: 'mw.settingsModal.hideExtensionButtonHelp'
        }
    },
    hideBackpack: {
        label: {
            defaultMessage: 'Hide Backpack',
            id: 'mw.settingsModal.hideBackpack'
        },
        help: {
            defaultMessage: 'Hides the backpack bar at the bottom of the editor.',
            id: 'mw.settingsModal.hideBackpackHelp'
        }
    },
    hideOperatorArrows: {
        label: {
            defaultMessage: 'Hide Extendable Operator Arrows',
            id: 'mw.settingsModal.hideOperatorArrows'
        },
        help: {
            defaultMessage: 'Hides the arrows used to add or remove inputs on extendable ' +
                'operator blocks like +, and, or and join. You can still add or remove inputs ' +
                'by right-clicking the block.',
            id: 'mw.settingsModal.hideOperatorArrowsHelp'
        }
    },
    vanillaPalette: {
        label: {
            defaultMessage: 'Vanilla Compatible Blocks Only',
            id: 'mw.settingsModal.vanillaPalette'
        },
        help: {
            defaultMessage: 'Hides blocks that vanilla Scratch cannot run, such as the return block, ' +
                'the switch/case blocks, extra Strings blocks and the whole Assets category. ' +
                'Extendable operators stay ' +
                'visible because they are saved in a vanilla compatible way.',
            id: 'mw.settingsModal.vanillaPaletteHelp'
        }
    },
    unclipPalette: {
        label: {
            defaultMessage: 'Unclip Block Palette',
            id: 'mw.settingsModal.unclipPalette'
        },
        help: {
            defaultMessage: 'While the block palette is hovered, blocks that are wider than the ' +
                'palette overflow past its edge instead of being cut off.',
            id: 'mw.settingsModal.unclipPaletteHelp'
        }
    },
    showPauseButton: {
        label: {
            defaultMessage: 'Show Pause Button',
            id: 'mw.settingsModal.showPauseButton'
        },
        help: {
            defaultMessage: 'Adds a pause/play button between the green flag and stop button that ' +
                'freezes the project in place. The project can also be paused with Alt+X (Option+X on macOS).',
            id: 'mw.settingsModal.showPauseButtonHelp'
        }
    },
    showStepButton: {
        label: {
            defaultMessage: 'Show Frame Step Button',
            id: 'mw.settingsModal.showStepButton'
        },
        help: {
            defaultMessage: 'While the project is paused, adds a button that advances it by exactly one ' +
                'frame so you can watch behavior change step by step.',
            id: 'mw.settingsModal.showStepButtonHelp'
        }
    }
};

const createBooleanSetting = (key, definition) => {
    const SettingComponent = props => (
        <BooleanSetting
            value={typeof props.value === 'undefined' ? false : props.value}
            onChange={props.onChange}
            label={<FormattedMessage {...definition.label} />}
            help={<FormattedMessage {...definition.help} />}
            slug={definition.slug}
        />
    );

    SettingComponent.propTypes = {
        value: PropTypes.bool,
        onChange: PropTypes.func.isRequired
    };

    SettingComponent.displayName = key;
    return SettingComponent;
};

class DebuggerBooleanSetting extends React.Component {
    constructor (props) {
        super(props);
        this.handleChange = this.handleChange.bind(this);
        this.state = {value: getDebuggerSetting(props.settingId)};
    }
    handleChange (e) {
        const value = e.target.checked;
        setDebuggerSetting(this.props.settingId, value);
        this.setState({value});
    }
    render () {
        return (
            <BooleanSetting
                value={this.state.value}
                onChange={this.handleChange}
                label={this.props.label}
                help={this.props.help}
            />
        );
    }
}

DebuggerBooleanSetting.propTypes = {
    settingId: PropTypes.string.isRequired,
    label: PropTypes.node.isRequired,
    help: PropTypes.node
};

const HighQualityPen = createBooleanSetting('HighQualityPen', settingDefinitions.highQualityPen);
const Interpolation = createBooleanSetting('Interpolation', settingDefinitions.interpolation);
const InfiniteClones = createBooleanSetting('InfiniteClones', settingDefinitions.infiniteClones);
const RemoveFencing = createBooleanSetting('RemoveFencing', settingDefinitions.removeFencing);
const RemoveMiscLimits = createBooleanSetting('RemoveMiscLimits', settingDefinitions.removeMiscLimits);
const WarpTimer = createBooleanSetting('WarpTimer', settingDefinitions.warpTimer);
const CaseSensitiveLists = createBooleanSetting('CaseSensitiveLists', settingDefinitions.caseSensitiveLists);
const RealLayerIndexes = createBooleanSetting('RealLayerIndexes', settingDefinitions.realLayerIndexes);
const SquareStageCorners = createBooleanSetting('SquareStageCorners', settingDefinitions.squareStageCorners);
const HideDeleteButton = createBooleanSetting('HideDeleteButton', settingDefinitions.hideDeleteButton);
const HideExtensionButton = createBooleanSetting('HideExtensionButton', settingDefinitions.hideExtensionButton);
const HideBackpack = createBooleanSetting('HideBackpack', settingDefinitions.hideBackpack);
const HideOperatorArrows = createBooleanSetting('HideOperatorArrows', settingDefinitions.hideOperatorArrows);
const UnclipPalette = createBooleanSetting('UnclipPalette', settingDefinitions.unclipPalette);
const VanillaPalette = createBooleanSetting('VanillaPalette', settingDefinitions.vanillaPalette);

const STYLE_OPTIONS = {
    'tab-style': [
        {value: 'mistwarp', label: 'MistWarp'},
        {value: 'turbowarp', label: 'TurboWarp'},
        {value: 'scratchbox', label: 'ScratchBox'}
    ],
    'tab-looks': [
        {value: 'default', label: 'Default'},
        {value: 'icon-only', label: 'Icon Only'},
        {value: 'text-only', label: 'Text Only'}
    ],
    'window-style': [
        {value: 'mistwarp', label: 'MistWarp'},
        {value: 'macos', label: 'macOS'},
        {value: 'windows10', label: 'Windows 10'}
    ]
};

const getOptionCss = (groupId, value) => {
    const group = STYLE_GROUPS.find(g => g.id === groupId);
    if (!group) return null;
    const option = group.options.find(o => o.value === value);
    return option ? option.css : null;
};

const StyleOption = ({groupId, option, selected, onSelect}) => (
    <button
        type="button"
        className={classNames(styles.styleOption, {[styles.styleOptionSelected]: selected})}
        onClick={() => onSelect(option.value)}
    >
        <div className={styles.stylePreview}>
            <StylePreview
                type={groupId === 'window-style' ? 'window' : 'tabs'}
                variant={option.value}
                css={getOptionCss(groupId, option.value)}
            />
        </div>
        <span className={styles.styleOptionLabel}>{option.label}</span>
    </button>
);
StyleOption.propTypes = {
    groupId: PropTypes.string.isRequired,
    option: PropTypes.shape({
        value: PropTypes.string,
        label: PropTypes.string
    }).isRequired,
    selected: PropTypes.bool,
    onSelect: PropTypes.func.isRequired
};

const StyleSelect = ({groupId, label, value, onChange}) => (
    <div className={styles.setting}>
        <div className={styles.label}>{label}</div>
        <div className={styles.stylePicker}>
            {STYLE_OPTIONS[groupId].map(option => (
                <StyleOption
                    key={option.value}
                    groupId={groupId}
                    option={option}
                    selected={value === option.value}
                    onSelect={onChange}
                />
            ))}
        </div>
    </div>
);
StyleSelect.propTypes = {
    groupId: PropTypes.string.isRequired,
    label: PropTypes.node,
    value: PropTypes.string,
    onChange: PropTypes.func.isRequired
};

const TabStyleSelect = props => (
    <StyleSelect
        groupId="tab-style"
        label={<FormattedMessage
            defaultMessage="Tab Style"
            id="mw.settingsModal.tabStyle"
        />}
        value={props.value}
        onChange={props.onChange}
    />
);
TabStyleSelect.propTypes = {value: PropTypes.string, onChange: PropTypes.func};

const TabLooksSelect = props => (
    <StyleSelect
        groupId="tab-looks"
        label={<FormattedMessage
            defaultMessage="Tab Looks"
            id="mw.settingsModal.tabLooks"
        />}
        value={props.value}
        onChange={props.onChange}
    />
);
TabLooksSelect.propTypes = {value: PropTypes.string, onChange: PropTypes.func};

const WindowStyleSelect = props => {
    if (typeof window.EditorPreload !== 'undefined') {
        return (
            <p>
                <FormattedMessage
                    defaultMessage="Cannot set custom window styling on desktop"
                    id="mw.settingsModal.windowStyleDesktop"
                />
            </p>
        );
    }
    return (
        <StyleSelect
            groupId="window-style"
            label={<FormattedMessage
                defaultMessage="Window Style"
                id="mw.settingsModal.windowStyle"
            />}
            value={props.value}
            onChange={props.onChange}
        />
    );
};
WindowStyleSelect.propTypes = {value: PropTypes.string, onChange: PropTypes.func};

const CustomFPS = ({framerate, onChange, onCustomizeFramerate}) => (
    <Setting
        active={framerate !== 30}
        primary={
            <div className={styles.label}>
                <label className={styles.label}>
                    <FancyCheckbox
                        className={styles.checkbox}
                        checked={framerate !== 30}
                        onChange={onChange}
                    />
                    <FormattedMessage
                        defaultMessage="60 FPS"
                        description="FPS setting"
                        id="tw.settingsModal.fps"
                    />
                </label>
                <BufferedInput
                    className={styles.numberInput}
                    type="number"
                    value={framerate}
                    min="0.1"
                    step="0.1"
                    aria-label="Custom framerate"
                    onSubmit={onCustomizeFramerate}
                />
                <span>{'FPS'}</span>
            </div>
        }
        help={
            <FormattedMessage
                // eslint-disable-next-line max-len
                defaultMessage="Runs scripts at the selected framerate. Many projects expect 30 FPS and may run too quickly at higher values. Try Interpolation first if you only want smoother motion."
                description="FPS setting help"
                id="tw.settingsModal.fpsHelp"
            />
        }
        slug="custom-fps"
    />
);

CustomFPS.propTypes = {
    framerate: PropTypes.number,
    onChange: PropTypes.func,
    onCustomizeFramerate: PropTypes.func
};

const CustomStageSize = ({
    customStageSizeEnabled,
    stageWidth,
    onStageWidthChange,
    stageHeight,
    onStageHeightChange
}) => (
    <Setting
        active={customStageSizeEnabled}
        primary={
            <div className={classNames(styles.label, styles.customStageSize)}>
                <FormattedMessage
                    defaultMessage="Custom Stage Size:"
                    description="Custom Stage Size option"
                    id="tw.settingsModal.customStageSize"
                />
                <BufferedInput
                    value={stageWidth}
                    onSubmit={onStageWidthChange}
                    className={styles.customStageSizeInput}
                    type="number"
                    min="0"
                    max="1024"
                    step="1"
                />
                <span>{'×'}</span>
                <BufferedInput
                    value={stageHeight}
                    onSubmit={onStageHeightChange}
                    className={styles.customStageSizeInput}
                    type="number"
                    min="0"
                    max="1024"
                    step="1"
                />
            </div>
        }
        secondary={
            (stageWidth >= 1000 || stageHeight >= 1000) && (
                <div className={styles.warning}>
                    <FormattedMessage
                        // eslint-disable-next-line max-len
                        defaultMessage="Using a custom stage size this large is not recommended! Instead, use a lower size with the same aspect ratio and let fullscreen mode upscale it to match the user's display."
                        description="Warning about using stages that are too large in settings modal"
                        id="tw.settingsModal.largeStageWarning"
                    />
                    <LearnMore slug="custom-stage-size" />
                </div>
            )
        }
        help={
            <FormattedMessage
                // eslint-disable-next-line max-len
                defaultMessage="Changes the size of the Scratch stage from 480x360 to something else. Try 640x360 to make the stage widescreen. Very few projects will handle this properly."
                description="Custom Stage Size option"
                id="tw.settingsModal.customStageSizeHelp"
            />
        }
        slug="custom-stage-size"
    />
);
CustomStageSize.propTypes = {
    customStageSizeEnabled: PropTypes.bool,
    stageWidth: PropTypes.number,
    onStageWidthChange: PropTypes.func,
    stageHeight: PropTypes.number,
    onStageHeightChange: PropTypes.func
};

const StoreProjectOptions = ({
    onStoreProjectOptions,
    storeThemeInProject,
    onStoreThemeInProjectChange
}) => (
    <div className={styles.setting}>
        <div>
            <button
                type="button"
                onClick={onStoreProjectOptions}
                className={styles.button}
            >
                <FormattedMessage
                    defaultMessage="Store settings in project"
                    description="Button in settings modal"
                    id="tw.settingsModal.storeProjectOptions"
                />
            </button>
            <p>
                <FormattedMessage
                    // eslint-disable-next-line max-len
                    defaultMessage="Stores the selected settings in the project so they will be automatically applied when {APP_NAME} loads this project. Warp timer and disable compiler will not be saved."
                    description="Help text for the store settings in project button"
                    id="tw.settingsModal.storeProjectOptionsHelp"
                    values={{
                        APP_NAME
                    }}
                />
            </p>

            <label className={styles.label}>
                <FancyCheckbox
                    className={styles.checkbox}
                    checked={storeThemeInProject}
                    onChange={onStoreThemeInProjectChange}
                />
                <FormattedMessage
                    defaultMessage="Store theme in project"
                    description="Checkbox under the store settings in project button"
                    id="mw.settingsModal.storeThemeInProject"
                />
            </label>
            <p>
                <FormattedMessage
                    // eslint-disable-next-line max-len
                    defaultMessage='When enabled, clicking "Store settings in project" will also store the current MistWarp theme so it can be applied when this project is loaded.'
                    description="Help text for the store theme in project checkbox"
                    id="mw.settingsModal.storeThemeInProjectHelp"
                />
            </p>
        </div>
    </div>
);
StoreProjectOptions.propTypes = {
    onStoreProjectOptions: PropTypes.func,
    storeThemeInProject: PropTypes.bool,
    onStoreThemeInProjectChange: PropTypes.func
};

const pageConfigurations = {
    general: {
        sections: [
            {
                headerMessage: 'headerFeatured',
                settings: [
                    {
                        component: CustomFPS,
                        props: props => ({
                            framerate: props.framerate,
                            onChange: props.onFramerateChange,
                            onCustomizeFramerate: props.onCustomizeFramerate
                        })
                    },
                    {
                        component: Interpolation,
                        props: props => ({
                            value: props.interpolation,
                            onChange: props.onInterpolationChange
                        })
                    },
                    {
                        component: HighQualityPen,
                        props: props => ({
                            value: props.highQualityPen,
                            onChange: props.onHighQualityPenChange
                        })
                    },
                    {
                        component: WarpTimer,
                        props: props => ({
                            value: props.warpTimer,
                            onChange: props.onWarpTimerChange
                        })
                    }
                ]
            },
            {
                headerMessage: 'headerRemoveLimits',
                settings: [
                    {
                        component: InfiniteClones,
                        props: props => ({
                            value: props.infiniteClones,
                            onChange: props.onInfiniteClonesChange
                        })
                    },
                    {
                        component: RemoveFencing,
                        props: props => ({
                            value: props.removeFencing,
                            onChange: props.onRemoveFencingChange
                        })
                    },
                    {
                        component: RemoveMiscLimits,
                        props: props => ({
                            value: props.removeLimits,
                            onChange: props.onRemoveLimitsChange
                        })
                    }
                ]
            },
            {
                headerMessage: 'headerDangerZone',
                settings: [
                    {
                        component: CustomStageSize,
                        props: props => props,
                        condition: props => !props.isEmbedded
                    },
                    {
                        component: StoreProjectOptions,
                        props: props => props,
                        condition: props => !props.isEmbedded
                    }
                ]
            }
        ]
    },
    editor: {
        sections: [
            {
                headerMessage: 'headerStage',
                settings: [
                    {
                        component: DebuggerBooleanSetting,
                        props: () => ({
                            settingId: 'stage_pause_button',
                            label: <FormattedMessage {...settingDefinitions.showPauseButton.label} />,
                            help: <FormattedMessage {...settingDefinitions.showPauseButton.help} />
                        })
                    },
                    {
                        component: DebuggerBooleanSetting,
                        props: () => ({
                            settingId: 'stage_step_button',
                            label: <FormattedMessage {...settingDefinitions.showStepButton.label} />,
                            help: <FormattedMessage {...settingDefinitions.showStepButton.help} />
                        })
                    },
                    {
                        component: SquareStageCorners,
                        props: props => ({
                            value: props.squareStageCorners,
                            onChange: props.onSquareStageCornersChange
                        })
                    }
                ]
            },
            {
                headerMessage: 'headerBlockPalette',
                settings: [
                    {
                        component: HideExtensionButton,
                        props: props => ({
                            value: props.hideExtensionButton,
                            onChange: props.onHideExtensionButtonChange
                        })
                    },
                    {
                        component: HideOperatorArrows,
                        props: props => ({
                            value: props.hideOperatorArrows,
                            onChange: props.onHideOperatorArrowsChange
                        })
                    },
                    {
                        component: UnclipPalette,
                        props: props => ({
                            value: props.unclipPalette,
                            onChange: props.onUnclipPaletteChange
                        })
                    },
                    {
                        component: VanillaPalette,
                        props: props => ({
                            value: props.vanillaPalette,
                            onChange: props.onVanillaPaletteChange
                        })
                    }
                ]
            },
            {
                headerMessage: 'headerInterface',
                settings: [
                    {
                        component: HideDeleteButton,
                        props: props => ({
                            value: props.hideDeleteButton,
                            onChange: props.onHideDeleteButtonChange
                        })
                    },
                    {
                        component: HideBackpack,
                        props: props => ({
                            value: props.hideBackpack,
                            onChange: props.onHideBackpackChange
                        })
                    }
                ]
            }
        ]
    },
    styles: {
        sections: [
            {
                headerMessage: 'headerStyles',
                settings: [
                    {
                        component: TabStyleSelect,
                        props: props => ({
                            value: props.tabStyle,
                            onChange: props.onTabStyleChange
                        })
                    },
                    {
                        component: TabLooksSelect,
                        props: props => ({
                            value: props.tabLooks,
                            onChange: props.onTabLooksChange
                        })
                    },
                    {
                        component: WindowStyleSelect,
                        props: props => ({
                            value: props.windowStyle,
                            onChange: props.onWindowStyleChange
                        })
                    }
                ]
            }
        ]
    },
    menuBar: {
        sections: [
            {
                headerMessage: 'headerMenuBarLayout',
                settings: [
                    {
                        component: MenuBarLayoutSetting,
                        props: () => ({})
                    }
                ]
            },
            {
                headerMessage: 'headerMenuBarItems',
                settings: [
                    {
                        component: MenuBarFeatureSettings,
                        props: () => ({
                            ids: [
                                'menu_labels',
                                'show_block_count',
                                'show_costume_count',
                                'show_sound_count',
                                'show_complexity_score',
                                'show_media_recorder'
                            ]
                        })
                    }
                ]
            },
            {
                headerMessage: 'headerAutosave',
                settings: [
                    {
                        component: MenuBarFeatureSettings,
                        props: () => ({
                            ids: [
                                'autosave_enabled',
                                'autosave_interval',
                                'autosave_notifications',
                                'autosave_only_when_changed'
                            ]
                        })
                    }
                ]
            }
        ]
    },
    experimental: {
        sections: [
            {
                headerMessage: 'headerExperimental',
                settings: [
                    {
                        component: RealLayerIndexes,
                        props: props => ({
                            value: props.realLayerIndexes,
                            onChange: props.onRealLayerIndexesChange
                        })
                    },
                    {
                        component: CaseSensitiveLists,
                        props: props => ({
                            value: props.caseSensitiveLists,
                            onChange: props.onCaseSensitiveListsChange
                        })
                    }
                ]
            }
        ]
    }
};

const UnwrappedPageRenderer = ({config, intl, ...props}) => (
    <Box className={styles.body}>
        {config.sections.map((section, sectionIdx) => (
            <React.Fragment key={sectionIdx}>
                <Header>
                    {intl.formatMessage(messages[section.headerMessage])}
                </Header>
                {section.settings.map((setting, settingIdx) => {
                    if (setting.condition && !setting.condition(props)) {
                        return null;
                    }

                    const SettingComponent = setting.component;
                    const settingProps = setting.props(props);

                    return (<SettingComponent
                        key={settingIdx}
                        {...settingProps}
                    />);
                })}
            </React.Fragment>
        ))}
    </Box>
);

UnwrappedPageRenderer.propTypes = {
    config: PropTypes.object.isRequired,
    intl: intlShape.isRequired
};

const PageRenderer = injectIntl(UnwrappedPageRenderer);

const GeneralPage = props => (<PageRenderer
    config={pageConfigurations.general}
    {...props}
/>);
const ExperimentalPage = props => (<PageRenderer
    config={pageConfigurations.experimental}
    {...props}
/>);
const EditorPage = props => (<PageRenderer
    config={pageConfigurations.editor}
    {...props}
/>);
const StylesPage = props => (<PageRenderer
    config={pageConfigurations.styles}
    {...props}
/>);
const MenuBarPage = props => (<PageRenderer
    config={pageConfigurations.menuBar}
    {...props}
/>);

const STAGE_CONTROL_SETTINGS = ['stage_pause_button', 'stage_step_button'];

const UnwrappedDebuggerPage = ({intl}) => (
    <Box className={styles.body}>
        <Header>{intl.formatMessage(messages.headerDebugger)}</Header>
        {DEBUGGER_SETTINGS.filter(setting => !STAGE_CONTROL_SETTINGS.includes(setting.id)).map(setting => (
            <DebuggerBooleanSetting
                key={setting.id}
                settingId={setting.id}
                label={setting.label}
                help={setting.help}
            />
        ))}
    </Box>
);

UnwrappedDebuggerPage.propTypes = {
    intl: intlShape.isRequired
};

const DebuggerPage = injectIntl(UnwrappedDebuggerPage);

const TextSetting = ({label, help, value, onSubmit, placeholder}) => (
    <div className={styles.setting}>
        <div className={styles.textSettingLabel}>{label}</div>
        <BufferedInput
            className={styles.textInput}
            type="text"
            value={value}
            placeholder={placeholder}
            onSubmit={onSubmit}
        />
        {help && <p className={styles.detail}>{help}</p>}
    </div>
);
TextSetting.propTypes = {
    label: PropTypes.node,
    help: PropTypes.node,
    value: PropTypes.string,
    onSubmit: PropTypes.func.isRequired,
    placeholder: PropTypes.string
};

class UnwrappedVersionControlPage extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleNameChange',
            'handleEmailChange',
            'handleBranchChange',
            'handleAutoCommitChange'
        ]);
        this.state = {
            authorName: getAuthorName(),
            authorEmail: getAuthorEmail(),
            defaultBranch: getDefaultBranch(),
            autoCommit: getAutoCommit()
        };
    }
    handleNameChange (value) {
        setAuthorName(value);
        this.setState({authorName: getAuthorName()});
    }
    handleEmailChange (value) {
        setAuthorEmail(value);
        this.setState({authorEmail: getAuthorEmail()});
    }
    handleBranchChange (value) {
        setDefaultBranch(value);
        this.setState({defaultBranch: getDefaultBranch()});
    }
    handleAutoCommitChange (e) {
        const value = e.target.checked;
        setAutoCommit(value);
        this.setState({autoCommit: value});
    }
    render () {
        const {intl} = this.props;
        return (
            <Box className={styles.body}>
                <Header>{intl.formatMessage(messages.headerVersionControl)}</Header>
                <TextSetting
                    label={<FormattedMessage
                        defaultMessage="Author name"
                        id="mw.settings.vc.authorName"
                    />}
                    help={<FormattedMessage
                        // eslint-disable-next-line max-len
                        defaultMessage="Used as the commit author and as your username when pushing to private repositories."
                        id="mw.settings.vc.authorNameHelp"
                    />}
                    value={this.state.authorName}
                    onSubmit={this.handleNameChange}
                    placeholder="User"
                />
                <TextSetting
                    label={<FormattedMessage
                        defaultMessage="Author email"
                        id="mw.settings.vc.authorEmail"
                    />}
                    help={<FormattedMessage
                        defaultMessage="Recorded as the email address on each commit you make."
                        id="mw.settings.vc.authorEmailHelp"
                    />}
                    value={this.state.authorEmail}
                    onSubmit={this.handleEmailChange}
                    placeholder="user@example.com"
                />
                <TextSetting
                    label={<FormattedMessage
                        defaultMessage="Default branch name"
                        id="mw.settings.vc.defaultBranch"
                    />}
                    help={<FormattedMessage
                        defaultMessage="Branch created when a new repository is initialized."
                        id="mw.settings.vc.defaultBranchHelp"
                    />}
                    value={this.state.defaultBranch}
                    onSubmit={this.handleBranchChange}
                    placeholder="main"
                />
                <BooleanSetting
                    value={this.state.autoCommit}
                    onChange={this.handleAutoCommitChange}
                    label={<FormattedMessage
                        defaultMessage="Commit automatically when the project is saved"
                        id="mw.settings.vc.autoCommit"
                    />}
                    help={<FormattedMessage
                        // eslint-disable-next-line max-len
                        defaultMessage="Creates a commit each time you save the project so your history stays up to date without manual commits."
                        id="mw.settings.vc.autoCommitHelp"
                    />}
                />
            </Box>
        );
    }
}
UnwrappedVersionControlPage.propTypes = {
    intl: intlShape.isRequired
};
const VersionControlPage = injectIntl(UnwrappedVersionControlPage);

class VmSetting extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, ['handleBooleanChange', 'handleSelectChange', 'handleNumberChange']);
        this.state = {value: getVariableManagerSetting(props.definition.id)};
    }
    commit (value) {
        setVariableManagerSetting(this.props.definition.id, value);
        this.setState({value: getVariableManagerSetting(this.props.definition.id)});
    }
    handleBooleanChange (e) {
        this.commit(e.target.checked);
    }
    handleSelectChange (e) {
        this.commit(e.target.value);
    }
    handleNumberChange (value) {
        this.commit(value);
    }
    render () {
        const {definition} = this.props;
        const {value} = this.state;
        if (definition.type === 'boolean') {
            return (
                <BooleanSetting
                    value={value}
                    onChange={this.handleBooleanChange}
                    label={definition.label}
                    help={definition.help}
                />
            );
        }
        if (definition.type === 'select') {
            return (
                <Setting
                    help={definition.help}
                    primary={
                        <div className={styles.label}>
                            <span className={styles.settingText}>{definition.label}</span>
                            <select
                                className={styles.select}
                                value={value}
                                onChange={this.handleSelectChange}
                            >
                                {definition.options.map(option => (
                                    <option
                                        key={option.value}
                                        value={option.value}
                                    >
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    }
                />
            );
        }
        return (
            <Setting
                help={definition.help}
                primary={
                    <div className={styles.label}>
                        <span className={styles.settingText}>{definition.label}</span>
                        <BufferedInput
                            className={styles.numberInput}
                            type="number"
                            value={value}
                            min={definition.min}
                            max={definition.max}
                            step={definition.step}
                            onSubmit={this.handleNumberChange}
                        />
                    </div>
                }
            />
        );
    }
}
VmSetting.propTypes = {
    definition: PropTypes.shape({
        id: PropTypes.string.isRequired,
        type: PropTypes.string.isRequired,
        label: PropTypes.string,
        help: PropTypes.string,
        min: PropTypes.number,
        max: PropTypes.number,
        step: PropTypes.number,
        options: PropTypes.array
    }).isRequired
};

const UnwrappedVariableManagerPage = ({intl}) => (
    <Box className={styles.body}>
        <Header>{intl.formatMessage(messages.headerVariableManager)}</Header>
        {VARIABLE_MANAGER_SETTINGS.map(definition => (
            <VmSetting
                key={definition.id}
                definition={definition}
            />
        ))}
    </Box>
);
UnwrappedVariableManagerPage.propTypes = {
    intl: intlShape.isRequired
};
const VariableManagerPage = injectIntl(UnwrappedVariableManagerPage);

const DesktopSelectSetting = ({label, help, value, options, onChange}) => (
    <Setting
        help={help}
        primary={
            <div className={styles.label}>
                <span className={styles.settingText}>{label}</span>
                <select
                    className={styles.select}
                    value={value}
                    onChange={onChange}
                >
                    {options.map(option => (
                        <option
                            key={option.value}
                            value={option.value}
                        >
                            {option.label}
                        </option>
                    ))}
                </select>
            </div>
        }
    />
);
DesktopSelectSetting.propTypes = {
    label: PropTypes.node,
    help: PropTypes.node,
    value: PropTypes.string,
    options: PropTypes.arrayOf(PropTypes.shape({
        value: PropTypes.string,
        label: PropTypes.node
    })),
    onChange: PropTypes.func
};

class DesktopPage extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            settings: null,
            devices: []
        };
    }

    componentDidMount () {
        try {
            this.setState({settings: window.EditorPreload.getDesktopSettings()});
        } catch (e) {
            this.setState({settings: null});
        }
        navigator.mediaDevices.enumerateDevices()
            .then(devices => this.setState({devices}))
            .catch(() => {});
    }

    set (key, value) {
        this.setState(prevState => ({
            settings: {
                ...prevState.settings,
                [key]: value
            }
        }));
        window.EditorPreload.setDesktopSetting(key, value);
    }

    renderDeviceSelect (key, label, help, kind) {
        const devices = this.state.devices.filter(device => device.kind === kind);
        return (
            <DesktopSelectSetting
                label={label}
                help={help}
                value={this.state.settings[key] || ''}
                options={[
                    {
                        value: '',
                        label: 'System default'
                    },
                    ...devices.map(device => ({
                        value: device.deviceId,
                        label: device.label || device.deviceId
                    }))
                ]}
                onChange={e => this.set(key, e.target.value || null)}
            />
        );
    }

    render () {
        const s = this.state.settings;
        if (!s) {
            return null;
        }
        return (
            <Box className={styles.pageContent}>
                {s.updateCheckerAllowed ? (
                    <DesktopSelectSetting
                        label={<FormattedMessage
                            defaultMessage="Update notifications"
                            id="mw.settingsModal.desktop.updateChecker"
                        />}
                        help={<FormattedMessage
                            defaultMessage="Controls which app updates you are notified about. Security updates only shows the most important releases; Never disables the update check entirely."
                            id="mw.settingsModal.desktop.updateCheckerHelp"
                        />}
                        value={s.updateChecker}
                        options={[
                            {value: 'unstable',
                                label: 'All updates, including betas'},
                            {value: 'stable',
                                label: 'Stable updates'},
                            {value: 'security',
                                label: 'Security updates only'},
                            {value: 'never',
                                label: 'Never'}
                        ]}
                        onChange={e => this.set('updateChecker', e.target.value)}
                    />
                ) : null}
                {this.renderDeviceSelect('microphone', (<FormattedMessage
                    defaultMessage="Microphone"
                    id="mw.settingsModal.desktop.microphone"
                />), (<FormattedMessage
                    defaultMessage="The input device projects use to record audio, such as the microphone extension."
                    id="mw.settingsModal.desktop.microphoneHelp"
                />), 'audioinput')}
                {this.renderDeviceSelect('camera', (<FormattedMessage
                    defaultMessage="Camera"
                    id="mw.settingsModal.desktop.camera"
                />), (<FormattedMessage
                    defaultMessage="The camera projects use for video sensing."
                    id="mw.settingsModal.desktop.cameraHelp"
                />), 'videoinput')}
                <BooleanSetting
                    value={!!s.hardwareAcceleration}
                    onChange={value => this.set('hardwareAcceleration', value)}
                    label={<FormattedMessage
                        defaultMessage="Hardware acceleration (requires restart)"
                        id="mw.settingsModal.desktop.hardwareAcceleration"
                    />}
                    help={<FormattedMessage
                        defaultMessage="Uses the GPU to speed up rendering. Turn this off if you see graphical glitches or crashes on your system."
                        id="mw.settingsModal.desktop.hardwareAccelerationHelp"
                    />}
                />
                <BooleanSetting
                    value={!!s.backgroundThrottling}
                    onChange={value => this.set('backgroundThrottling', value)}
                    label={<FormattedMessage
                        defaultMessage="Pause when the window is not visible"
                        id="mw.settingsModal.desktop.backgroundThrottling"
                    />}
                    help={<FormattedMessage
                        defaultMessage="Slows down projects while the window is hidden or minimized to save power. Disable this if projects need to keep running in the background."
                        id="mw.settingsModal.desktop.backgroundThrottlingHelp"
                    />}
                />
                <BooleanSetting
                    value={!!s.bypassCORS}
                    onChange={value => this.set('bypassCORS', value)}
                    label={<FormattedMessage
                        defaultMessage="Allow projects to access any website (requires restart, dangerous)"
                        id="mw.settingsModal.desktop.bypassCORS"
                    />}
                    help={<FormattedMessage
                        defaultMessage="Lets projects fetch data from websites that would normally block them. Only enable this for projects you trust, as it removes a security protection."
                        id="mw.settingsModal.desktop.bypassCORSHelp"
                    />}
                />
                <BooleanSetting
                    value={!!s.spellchecker}
                    onChange={value => this.set('spellchecker', value)}
                    label={<FormattedMessage
                        defaultMessage="Spellchecker (requires restart)"
                        id="mw.settingsModal.desktop.spellchecker"
                    />}
                    help={<FormattedMessage
                        defaultMessage="Underlines misspelled words in text fields like the ask block prompt and costume names."
                        id="mw.settingsModal.desktop.spellcheckerHelp"
                    />}
                />
                <BooleanSetting
                    value={!!s.exitFullscreenOnEscape}
                    onChange={value => this.set('exitFullscreenOnEscape', value)}
                    label={<FormattedMessage
                        defaultMessage="Exit fullscreen when escape is pressed"
                        id="mw.settingsModal.desktop.exitFullscreenOnEscape"
                    />}
                    help={<FormattedMessage
                        defaultMessage="Lets the Escape key leave fullscreen mode. Disable this if your project uses Escape for its own controls."
                        id="mw.settingsModal.desktop.exitFullscreenOnEscapeHelp"
                    />}
                />
                {s.richPresenceAvailable ? (
                    <BooleanSetting
                        value={!!s.richPresence}
                        onChange={value => this.set('richPresence', value)}
                        label={<FormattedMessage
                            defaultMessage="Discord rich presence"
                            id="mw.settingsModal.desktop.richPresence"
                        />}
                        help={<FormattedMessage
                            defaultMessage="Shows that you are using MistWarp on your Discord profile while the app is open."
                            id="mw.settingsModal.desktop.richPresenceHelp"
                        />}
                    />
                ) : null}
                <button
                    type="button"
                    className={styles.button}
                    onClick={() => window.EditorPreload.openUserData()}
                >
                    <FormattedMessage
                        defaultMessage="Open user data folder"
                        id="mw.settingsModal.desktop.openUserData"
                    />
                </button>
            </Box>
        );
    }
}

const SettingsRouter = ({view, ...handlers}) => {
    switch (view) {
    case 'general':
        return <GeneralPage {...handlers} />;
    case 'language':
        return <LanguagePage />;
    case 'shortcuts':
        return <ShortcutManager />;
    case 'theme':
        return <ThemePage />;
    case 'wallpaper':
        return <WallpaperPage />;
    case 'fonts':
        return <FontsPage />;
    case 'loadingScreen':
        return <LoadingScreenPage />;
    case 'debugger':
        return <DebuggerPage {...handlers} />;
    case 'versionControl':
        return <VersionControlPage {...handlers} />;
    case 'variableManager':
        return <VariableManagerPage {...handlers} />;
    case 'editor':
        return <EditorPage {...handlers} />;
    case 'styles':
        return <StylesPage {...handlers} />;
    case 'menuBar':
        return <MenuBarPage {...handlers} />;
    case 'desktop':
        return <DesktopPage {...handlers} />;
    case 'experimental':
        return <ExperimentalPage {...handlers} />;
    default:
        return null;
    }
};

SettingsRouter.propTypes = {
    view: PropTypes.string.isRequired,
    onStoreProjectOptions: PropTypes.func
};

class SettingsModalComponent extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleNavigate',
            'handleStoreProjectOptions',
            'handleToggleGroup',
            'handleMobileBack'
        ]);

        this.state = {
            currentView: takeSettingsModalInitialView() || 'general',
            collapsedGroups: {},
            mobileView: 'list'
        };
    }

    handleNavigate (category) {
        this.setState({currentView: category, mobileView: 'content'});
    }

    handleMobileBack () {
        this.setState({mobileView: 'list'});
    }

    handleToggleGroup (groupId) {
        this.setState(prevState => ({
            collapsedGroups: {
                ...prevState.collapsedGroups,
                [groupId]: !prevState.collapsedGroups[groupId]
            }
        }));
    }

    handleStoreProjectOptions () {
        this.props.onStoreProjectOptions();
    }

    render () {
        const {intl} = this.props;
        const {currentView} = this.state;

        const sidebarGroups = [
            {
                id: 'general',
                label: intl.formatMessage({id: 'mw.settings.groupGeneral', defaultMessage: 'General'}),
                items: [
                    {
                        id: 'general',
                        label: intl.formatMessage({id: 'mw.settings.general', defaultMessage: 'General'}),
                        icon: Settings
                    },
                    {
                        id: 'language',
                        label: intl.formatMessage({id: 'gui.menuBar.language', defaultMessage: 'Language'}),
                        icon: Globe
                    },
                    {
                        id: 'shortcuts',
                        label: intl.formatMessage({
                            id: 'tw.menuBar.keyboardShortcuts',
                            defaultMessage: 'Keyboard Shortcuts'
                        }),
                        icon: Keyboard
                    }
                ]
            },
            {
                id: 'appearance',
                label: intl.formatMessage({id: 'mw.settings.groupAppearance', defaultMessage: 'Appearance'}),
                items: [
                    {
                        id: 'theme',
                        label: intl.formatMessage({id: 'tw.menuBar.blockColors', defaultMessage: 'Block Colors'}),
                        icon: SunMoon
                    },
                    {
                        id: 'wallpaper',
                        label: intl.formatMessage({id: 'tw.menuBar.wallpaper', defaultMessage: 'Wallpaper'}),
                        icon: Wallpaper
                    },
                    {
                        id: 'fonts',
                        label: intl.formatMessage({id: 'tw.menuBar.fonts', defaultMessage: 'Fonts'}),
                        icon: Type
                    },
                    {
                        id: 'editor',
                        label: intl.formatMessage({id: 'mw.settings.editor', defaultMessage: 'Editor'}),
                        icon: Blocks
                    },
                    {
                        id: 'styles',
                        label: intl.formatMessage({id: 'mw.settings.styles', defaultMessage: 'Styles'}),
                        icon: Palette
                    },
                    {
                        id: 'menuBar',
                        label: intl.formatMessage({id: 'mw.settings.menuBar', defaultMessage: 'Menu Bar'}),
                        icon: PanelTop
                    },
                    {
                        id: 'loadingScreen',
                        label: intl.formatMessage({
                            id: 'mw.settings.loadingScreen',
                            defaultMessage: 'Loading Screen'
                        }),
                        icon: Hourglass
                    }
                ]
            },
            {
                id: 'tools',
                label: intl.formatMessage({id: 'mw.settings.groupTools', defaultMessage: 'Tools'}),
                items: [
                    {
                        id: 'versionControl',
                        label: intl.formatMessage({
                            id: 'mw.settings.versionControl',
                            defaultMessage: 'Version Control'
                        }),
                        icon: GitBranch
                    },
                    {
                        id: 'variableManager',
                        label: intl.formatMessage({
                            id: 'mw.settings.variableManager',
                            defaultMessage: 'Variable Manager'
                        }),
                        icon: Variable
                    },
                    {
                        id: 'debugger',
                        label: intl.formatMessage({id: 'mw.settings.debugger', defaultMessage: 'Debugger'}),
                        icon: Bug
                    }
                ]
            },
            {
                id: 'advanced',
                label: intl.formatMessage({id: 'mw.settings.groupAdvanced', defaultMessage: 'Advanced'}),
                items: [
                    {
                        id: 'experimental',
                        label: intl.formatMessage({id: 'mw.settings.experimental', defaultMessage: 'Experimental'}),
                        icon: Zap
                    }
                ]
            }
        ];

        if (typeof window.EditorPreload !== 'undefined') {
            sidebarGroups.splice(sidebarGroups.length - 1, 0, {
                id: 'desktop',
                label: intl.formatMessage({id: 'mw.settings.groupDesktop', defaultMessage: 'Desktop'}),
                items: [
                    {
                        id: 'desktop',
                        label: intl.formatMessage({id: 'mw.settings.desktop', defaultMessage: 'Desktop'}),
                        icon: Monitor
                    }
                ]
            });
        }

        return (
            <Modal
                className={styles.modalContent}
                onRequestClose={this.props.onClose}
                contentLabel={intl.formatMessage(messages.title)}
                id="settingsModal"
                width={880}
                height={550}
            >
                <ModalSidebarLayout mobileView={this.state.mobileView}>
                    <ModalSidebar
                        ariaLabel="Settings sections"
                        width="wide"
                    >
                        {sidebarGroups.map(group => {
                            const collapsed = !!this.state.collapsedGroups[group.id];
                            return (
                                <ModalSidebarGroup key={group.id}>
                                    <ModalSidebarGroupHeader
                                        collapsible
                                        collapsed={collapsed}
                                        label={group.label}
                                        onClick={() => this.handleToggleGroup(group.id)}
                                    />
                                    {!collapsed && group.items.map(cat => (
                                        <ModalSidebarItem
                                            key={cat.id}
                                            icon={cat.icon}
                                            label={cat.label}
                                            selected={currentView === cat.id}
                                            onClick={() => this.handleNavigate(cat.id)}
                                        />
                                    ))}
                                </ModalSidebarGroup>
                            );
                        })}
                    </ModalSidebar>
                    <ModalSidebarContent className={styles.contentArea}>
                        <button
                            type="button"
                            className={styles.mobileBackButton}
                            onClick={this.handleMobileBack}
                        >
                            <ChevronLeft size={18} />
                            <FormattedMessage
                                defaultMessage="Settings"
                                description="Back button in the settings window on mobile"
                                id="tw.settingsModal.back"
                            />
                        </button>
                        <SettingsRouter
                            view={currentView}
                            {...this.props}
                            onStoreProjectOptions={this.handleStoreProjectOptions}
                        />
                    </ModalSidebarContent>
                </ModalSidebarLayout>
            </Modal>
        );
    }
}

SettingsModalComponent.propTypes = {
    intl: intlShape,
    onClose: PropTypes.func,
    isEmbedded: PropTypes.bool,
    framerate: PropTypes.number,
    onFramerateChange: PropTypes.func,
    onCustomizeFramerate: PropTypes.func,
    highQualityPen: PropTypes.bool,
    onHighQualityPenChange: PropTypes.func,
    interpolation: PropTypes.bool,
    onInterpolationChange: PropTypes.func,
    infiniteClones: PropTypes.bool,
    onInfiniteClonesChange: PropTypes.func,
    removeFencing: PropTypes.bool,
    onRemoveFencingChange: PropTypes.func,
    removeLimits: PropTypes.bool,
    onRemoveLimitsChange: PropTypes.func,
    warpTimer: PropTypes.bool,
    onWarpTimerChange: PropTypes.func,
    caseSensitiveLists: PropTypes.bool,
    onCaseSensitiveListsChange: PropTypes.func,
    realLayerIndexes: PropTypes.bool,
    onRealLayerIndexesChange: PropTypes.func,
    squareStageCorners: PropTypes.bool,
    onSquareStageCornersChange: PropTypes.func,
    hideDeleteButton: PropTypes.bool,
    onHideDeleteButtonChange: PropTypes.func,
    hideExtensionButton: PropTypes.bool,
    onHideExtensionButtonChange: PropTypes.func,
    unclipPalette: PropTypes.bool,
    onUnclipPaletteChange: PropTypes.func,
    hideBackpack: PropTypes.bool,
    onHideBackpackChange: PropTypes.func,
    hideOperatorArrows: PropTypes.bool,
    onHideOperatorArrowsChange: PropTypes.func,
    vanillaPalette: PropTypes.bool,
    onVanillaPaletteChange: PropTypes.func,
    tabStyle: PropTypes.string,
    onTabStyleChange: PropTypes.func,
    tabLooks: PropTypes.string,
    onTabLooksChange: PropTypes.func,
    windowStyle: PropTypes.string,
    onWindowStyleChange: PropTypes.func,
    customStageSizeEnabled: PropTypes.bool,
    stageWidth: PropTypes.number,
    onStageWidthChange: PropTypes.func,
    stageHeight: PropTypes.number,
    onStageHeightChange: PropTypes.func,
    onStoreProjectOptions: PropTypes.func,
    storeThemeInProject: PropTypes.bool,
    onStoreThemeInProjectChange: PropTypes.func,
    optimizeAnimations: PropTypes.bool,
    onOptimizeAnimationsChange: PropTypes.func,
    debugMode: PropTypes.bool,
    onDebugModeChange: PropTypes.func,
    showFPSCounter: PropTypes.bool,
    onShowFPSCounterChange: PropTypes.func
};

export default injectIntl(SettingsModalComponent);
