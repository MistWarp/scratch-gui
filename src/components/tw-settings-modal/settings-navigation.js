import {
    AppWindow,
    Blocks,
    Bug,
    GitBranch,
    Globe,
    Image,
    Keyboard,
    Monitor,
    PanelTop,
    Palette,
    Pencil,
    Settings,
    Type,
    Variable,
    Zap
} from 'lucide-react';

const getSettingsSidebarGroups = (intl, includeDesktop) => {
    const groups = [
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
                    id: 'appearance',
                    label: intl.formatMessage({id: 'mw.settings.themeAppearance', defaultMessage: 'Appearance'}),
                    icon: Palette
                },
                {
                    id: 'blocks',
                    label: intl.formatMessage({id: 'mw.settings.themeBlocks', defaultMessage: 'Blocks'}),
                    icon: Blocks
                },
                {
                    id: 'wallpaper',
                    label: intl.formatMessage({id: 'mw.settings.themeWallpaper', defaultMessage: 'Wallpaper'}),
                    icon: Image
                },
                {
                    id: 'fonts',
                    label: intl.formatMessage({id: 'mw.settings.themeFonts', defaultMessage: 'Fonts'}),
                    icon: Type
                },
                {
                    id: 'editor',
                    label: intl.formatMessage({id: 'mw.settings.themeEditor', defaultMessage: 'Editor'}),
                    icon: Pencil
                },
                {
                    id: 'menuBar',
                    label: intl.formatMessage({id: 'mw.settings.themeMenuBar', defaultMessage: 'Menu bar'}),
                    icon: PanelTop
                },
                {
                    id: 'loadingScreen',
                    label: intl.formatMessage({
                        id: 'mw.settings.themeLoadingScreen',
                        defaultMessage: 'Loading screen'
                    }),
                    icon: AppWindow
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
            items: [{
                id: 'experimental',
                label: intl.formatMessage({id: 'mw.settings.experimental', defaultMessage: 'Experimental'}),
                icon: Zap
            }]
        }
    ];

    if (includeDesktop) {
        groups.splice(groups.length - 1, 0, {
            id: 'desktop',
            label: intl.formatMessage({id: 'mw.settings.groupDesktop', defaultMessage: 'Desktop'}),
            items: [{
                id: 'desktop',
                label: intl.formatMessage({id: 'mw.settings.desktop', defaultMessage: 'Desktop'}),
                icon: Monitor
            }]
        });
    }

    return groups;
};

export {getSettingsSidebarGroups};
