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
import DocumentationLink from '../tw-documentation-link/documentation-link.jsx';
import styles from './settings-modal.css';
import helpIcon from './help-icon.svg';
import {APP_NAME} from '../../lib/constants/brand.js';
import {STYLE_GROUPS} from '../../lib/mw-style-settings';
import StylePreview from './style-preview.jsx';

import {Settings, Zap, Blocks, Palette} from 'lucide-react';

const BufferedInput = BufferedInputHOC(Input);

const messages = defineMessages({
    title: {
        defaultMessage: 'Settings',
        description: 'Title of settings modal',
        id: 'tw.settingsModal.title'
    },
    help: {
        defaultMessage: 'Click for help',
        description: 'Hover text of help icon in settings',
        id: 'tw.settingsModal.help'
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
    headerStyles: {
        defaultMessage: 'Styles',
        id: 'mw.settings.stylesHeader'
    }
});

const LearnMore = props => (
    <React.Fragment>
        {' '}
        <DocumentationLink {...props}>
            <FormattedMessage
                defaultMessage="Learn more."
                id="gui.alerts.cloudInfoLearnMore"
            />
        </DocumentationLink>
    </React.Fragment>
);

const Header = ({children}) => (
    <div className={styles.header}>
        {children}
        <div className={styles.divider} />
    </div>
);
Header.propTypes = {
    children: PropTypes.node
};

const SidebarItem = ({id, label, icon: Icon, isSelected, onClick}) => (
    <div
        className={classNames(styles.sidebarItem, {[styles.selected]: isSelected})}
        onClick={() => onClick(id)}
        title={label}
    >
        {Icon && <Icon className={styles.sidebarIcon} />}
        <span className={styles.sidebarLabel}>{label}</span>
    </div>
);

SidebarItem.propTypes = {
    id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    icon: PropTypes.elementType,
    onClick: PropTypes.func.isRequired,
    isSelected: PropTypes.bool
};

class UnwrappedSetting extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleClickHelp'
        ]);
        this.state = {
            helpVisible: false
        };
    }
    componentDidUpdate (prevProps) {
        if (this.props.active && !prevProps.active) {
            // eslint-disable-next-line react/no-did-update-set-state
            this.setState({
                helpVisible: true
            });
        }
    }
    handleClickHelp () {
        this.setState(prevState => ({
            helpVisible: !prevState.helpVisible
        }));
    }
    render () {
        const {primary, secondary, help, slug, intl} = this.props;
        const {helpVisible} = this.state;

        return (
            <div
                className={classNames(styles.setting, {
                    [styles.active]: this.props.active
                })}
            >
                <div className={styles.label}>
                    {primary}
                    <button
                        className={styles.helpIcon}
                        onClick={this.handleClickHelp}
                        title={intl.formatMessage(messages.help)}
                    >
                        <img
                            src={helpIcon}
                            draggable={false}
                        />
                    </button>
                </div>
                {helpVisible && (
                    <div className={styles.detail}>
                        {help}
                        {slug && <LearnMore slug={slug} />}
                    </div>
                )}
                {secondary}
            </div>
        );
    }
}

UnwrappedSetting.propTypes = {
    intl: intlShape,
    active: PropTypes.bool,
    help: PropTypes.node,
    primary: PropTypes.node,
    secondary: PropTypes.node,
    slug: PropTypes.string
};

const Setting = injectIntl(UnwrappedSetting);

const BooleanSetting = ({value, onChange, label, ...props}) => (
    <Setting
        {...props}
        active={value}
        primary={
            <label className={styles.label}>
                <FancyCheckbox
                    className={styles.checkbox}
                    checked={value}
                    onChange={onChange}
                />
                {label}
            </label>
        }
    />
);

BooleanSetting.propTypes = {
    onChange: PropTypes.func.isRequired,
    value: PropTypes.bool.isRequired,
    label: PropTypes.node.isRequired
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

const WindowStyleSelect = props => (
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
WindowStyleSelect.propTypes = {value: PropTypes.string, onChange: PropTypes.func};

const CustomFPS = ({framerate, onChange, onCustomizeFramerate}) => (
    <BooleanSetting
        value={framerate !== 30}
        onChange={onChange}
        label={
            <FormattedMessage
                defaultMessage="60 FPS (Custom FPS)"
                description="FPS setting"
                id="tw.settingsModal.fps"
            />
        }
        help={
            <FormattedMessage
                // eslint-disable-next-line max-len
                defaultMessage="Runs scripts 60 times per second instead of 30. Most projects will not work properly with this enabled. You should try Interpolation with 60 FPS mode disabled if that is the case. {customFramerate}."
                description="FPS setting help"
                id="tw.settingsModal.fpsHelp"
                values={{
                    customFramerate: (
                        <a
                            onClick={onCustomizeFramerate}
                            tabIndex="0"
                        >
                            <FormattedMessage
                                defaultMessage="Click to use a framerate other than 30 or 60"
                                description="FPS settings help"
                                id="tw.settingsModal.fpsHelp.customFramerate"
                            />
                        </a>
                    )
                }}
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
                headerMessage: 'headerInterface',
                settings: [
                    {
                        component: SquareStageCorners,
                        props: props => ({
                            value: props.squareStageCorners,
                            onChange: props.onSquareStageCornersChange
                        })
                    },
                    {
                        component: HideDeleteButton,
                        props: props => ({
                            value: props.hideDeleteButton,
                            onChange: props.onHideDeleteButtonChange
                        })
                    },
                    {
                        component: HideExtensionButton,
                        props: props => ({
                            value: props.hideExtensionButton,
                            onChange: props.onHideExtensionButtonChange
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

const SettingsRouter = ({view, ...handlers}) => {
    switch (view) {
    case 'general':
        return <GeneralPage {...handlers} />;
    case 'editor':
        return <EditorPage {...handlers} />;
    case 'styles':
        return <StylesPage {...handlers} />;
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
        bindAll(this, ['handleNavigate', 'handleStoreProjectOptions']);

        this.state = {
            currentView: 'general'
        };
    }

    handleNavigate (category) {
        this.setState({currentView: category});
    }

    handleStoreProjectOptions () {
        this.props.onStoreProjectOptions();
    }

    render () {
        const {intl} = this.props;
        const {currentView} = this.state;

        const categories = [
            {
                id: 'general',
                label: intl.formatMessage({id: 'mw.settings.general', defaultMessage: 'General'}),
                icon: Settings
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
                id: 'experimental',
                label: intl.formatMessage({id: 'mw.settings.experimental', defaultMessage: 'Experimental'}),
                icon: Zap
            }
        ];

        return (
            <Modal
                className={styles.modalContent}
                onRequestClose={this.props.onClose}
                contentLabel={intl.formatMessage(messages.title)}
                id="settingsModal"
                width={880}
                height={550}
            >
                <Box className={styles.sidebarLayout}>
                    <div className={styles.sidebar}>
                        <div className={styles.sidebarItems}>
                            {categories.map(cat => (
                                <SidebarItem
                                    key={cat.id}
                                    id={cat.id}
                                    label={cat.label}
                                    icon={cat.icon}
                                    onClick={this.handleNavigate}
                                    isSelected={currentView === cat.id}
                                />
                            ))}
                        </div>
                    </div>
                    <div className={styles.contentArea}>
                        <SettingsRouter
                            view={currentView}
                            {...this.props}
                            onStoreProjectOptions={this.handleStoreProjectOptions}
                        />
                    </div>
                </Box>
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
    hideBackpack: PropTypes.bool,
    onHideBackpackChange: PropTypes.func,
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
