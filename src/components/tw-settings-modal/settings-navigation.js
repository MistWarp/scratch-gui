import {
    Blocks,
    Bug,
    GitBranch,
    Globe,
    History,
    Image,
    Keyboard,
    Loader,
    Monitor,
    Palette,
    PanelTop,
    Pen,
    Puzzle,
    Settings,
    Shield,
    SunMoon,
    SwatchBook,
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
                    icon: Settings,
                    keywords: intl.formatMessage({
                        id: 'mw.settings.keywords.general',
                        description: 'Extra search terms for the General settings page, separated by spaces',
                        // eslint-disable-next-line max-len
                        defaultMessage: 'framerate fps 60 frames interpolation smooth pen quality warp timer clones limits fencing offscreen stage size width height project options compatibility playback'
                    })
                },
                {
                    id: 'language',
                    label: intl.formatMessage({id: 'gui.menuBar.language', defaultMessage: 'Language'}),
                    icon: Globe,
                    keywords: intl.formatMessage({
                        id: 'mw.settings.keywords.language',
                        description: 'Extra search terms for the Language settings page, separated by spaces',
                        defaultMessage: 'language translation locale interface'
                    })
                },
                {
                    id: 'shortcuts',
                    label: intl.formatMessage({
                        id: 'tw.menuBar.keyboardShortcuts',
                        defaultMessage: 'Keyboard Shortcuts'
                    }),
                    icon: Keyboard,
                    keywords: intl.formatMessage({
                        id: 'mw.settings.keywords.shortcuts',
                        description: 'Extra search terms for the Keyboard Shortcuts settings page, separated by spaces',
                        defaultMessage: 'keyboard shortcuts hotkeys keys bindings'
                    })
                },
                {
                    id: 'privacy',
                    label: intl.formatMessage({id: 'mw.settings.privacy', defaultMessage: 'Privacy'}),
                    icon: Shield,
                    keywords: intl.formatMessage({
                        id: 'mw.settings.keywords.privacy',
                        description: 'Extra search terms for the Privacy settings page, separated by spaces',
                        defaultMessage: 'privacy permissions blocked projects analytics usage data tracking'
                    })
                }
            ]
        },
        {
            id: 'appearance',
            label: intl.formatMessage({id: 'mw.settings.groupAppearance', defaultMessage: 'Appearance'}),
            items: [
                {
                    id: 'theme',
                    label: intl.formatMessage({id: 'mw.settings.theme', defaultMessage: 'Theme'}),
                    icon: SunMoon,
                    keywords: intl.formatMessage({
                        id: 'mw.settings.keywords.theme',
                        description: 'Extra search terms for the Theme settings page, separated by spaces',
                        defaultMessage: 'theme dark light mode accent color menu bar colors'
                    })
                },
                {
                    id: 'customThemes',
                    label: intl.formatMessage({id: 'mw.settings.customThemes', defaultMessage: 'Custom themes'}),
                    icon: SwatchBook,
                    keywords: intl.formatMessage({
                        id: 'mw.settings.keywords.customThemes',
                        description: 'Extra search terms for the Custom themes settings page, separated by spaces',
                        defaultMessage: 'custom themes create import export marketplace gradient library'
                    })
                },
                {
                    id: 'appearance',
                    label: intl.formatMessage({id: 'mw.settings.styles', defaultMessage: 'Styles'}),
                    icon: Palette,
                    keywords: intl.formatMessage({
                        id: 'mw.settings.keywords.appearance',
                        description: 'Extra search terms for the Styles settings page, separated by spaces',
                        defaultMessage: 'styles tabs window look corners'
                    })
                },
                {
                    id: 'menuBar',
                    label: intl.formatMessage({id: 'mw.settings.menuBar', defaultMessage: 'Menu Bar'}),
                    icon: PanelTop,
                    keywords: intl.formatMessage({
                        id: 'mw.settings.keywords.menuBar',
                        description: 'Extra search terms for the Menu Bar settings page, separated by spaces',
                        defaultMessage: 'menu bar layout items labels block count costume count sound count complexity'
                    })
                },
                {
                    id: 'blocks',
                    label: intl.formatMessage({id: 'mw.settings.blocks', defaultMessage: 'Blocks'}),
                    icon: Blocks,
                    keywords: intl.formatMessage({
                        id: 'mw.settings.keywords.blocks',
                        description: 'Extra search terms for the Blocks settings page, separated by spaces',
                        defaultMessage: 'blocks colors high contrast dark cat hat'
                    })
                },
                {
                    id: 'wallpaper',
                    label: intl.formatMessage({id: 'mw.settings.wallpaper', defaultMessage: 'Wallpaper'}),
                    icon: Image,
                    keywords: intl.formatMessage({
                        id: 'mw.settings.keywords.wallpaper',
                        description: 'Extra search terms for the Wallpaper settings page, separated by spaces',
                        defaultMessage: 'wallpaper background image opacity darkness grid'
                    })
                },
                {
                    id: 'fonts',
                    label: intl.formatMessage({id: 'mw.settings.fonts', defaultMessage: 'Fonts'}),
                    icon: Type,
                    keywords: intl.formatMessage({
                        id: 'mw.settings.keywords.fonts',
                        description: 'Extra search terms for the Fonts settings page, separated by spaces',
                        defaultMessage: 'fonts typeface text recently used'
                    })
                },
                {
                    id: 'editor',
                    label: intl.formatMessage({id: 'mw.settings.editor', defaultMessage: 'Editor'}),
                    icon: Pen,
                    keywords: intl.formatMessage({
                        id: 'mw.settings.keywords.editor',
                        description: 'Extra search terms for the Editor settings page, separated by spaces',
                        // eslint-disable-next-line max-len
                        defaultMessage: 'editor stage pause frame step mouse position clone counter volume mute screenshot palette extension button operator arrows unclip vanilla delete button backpack compiler cloud variables'
                    })
                },
                {
                    id: 'loadingScreen',
                    label: intl.formatMessage({id: 'mw.settings.loadingScreen', defaultMessage: 'Loading screen'}),
                    icon: Loader,
                    keywords: intl.formatMessage({
                        id: 'mw.settings.keywords.loadingScreen',
                        description: 'Extra search terms for the Loading screen settings page, separated by spaces',
                        defaultMessage: 'loading screen block animation title progress bar quotes github'
                    })
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
                    icon: GitBranch,
                    keywords: intl.formatMessage({
                        id: 'mw.settings.keywords.versionControl',
                        description: 'Extra search terms for the Version Control settings page, separated by spaces',
                        defaultMessage: 'version control versions history author name email branch save snapshot'
                    })
                },
                {
                    id: 'autosave',
                    label: intl.formatMessage({
                        id: 'mw.settings.autosave',
                        defaultMessage: 'Autosave'
                    }),
                    icon: History,
                    keywords: intl.formatMessage({
                        id: 'mw.settings.keywords.autosave',
                        description: 'Extra search terms for the Autosave settings page, separated by spaces',
                        defaultMessage: 'autosave automatic save interval minutes notifications'
                    })
                },
                {
                    id: 'variableManager',
                    label: intl.formatMessage({
                        id: 'mw.settings.variableManager',
                        defaultMessage: 'Variable Manager'
                    }),
                    icon: Variable,
                    keywords: intl.formatMessage({
                        id: 'mw.settings.keywords.variableManager',
                        description: 'Extra search terms for the Variable Manager settings page, separated by spaces',
                        defaultMessage: 'variable manager variables lists live updates'
                    })
                },
                {
                    id: 'debugger',
                    label: intl.formatMessage({id: 'mw.settings.debugger', defaultMessage: 'Debugger'}),
                    icon: Bug,
                    keywords: intl.formatMessage({
                        id: 'mw.settings.keywords.debugger',
                        description: 'Extra search terms for the Debugger settings page, separated by spaces',
                        defaultMessage: 'debugger logs logging highlight running blocks green flag clones breakpoints'
                    })
                }
            ]
        },
        {
            id: 'advanced',
            label: intl.formatMessage({id: 'mw.settings.groupAdvanced', defaultMessage: 'Advanced'}),
            items: [{
                id: 'experimental',
                label: intl.formatMessage({id: 'mw.settings.experimental', defaultMessage: 'Experimental'}),
                icon: Zap,
                keywords: intl.formatMessage({
                    id: 'mw.settings.keywords.experimental',
                    description: 'Extra search terms for the Experimental settings page, separated by spaces',
                    defaultMessage: 'experimental layer indexes case sensitive lists'
                })
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
                icon: Monitor,
                keywords: intl.formatMessage({
                    id: 'mw.settings.keywords.desktop',
                    description: 'Extra search terms for the Desktop settings page, separated by spaces',
                    // eslint-disable-next-line max-len
                    defaultMessage: 'desktop app updates microphone camera hardware acceleration spellchecker fullscreen escape discord user data'
                })
            }]
        });
    }

    return groups;
};

// Addons have their own settings window, so they only appear in search results.
const getAddonsSearchEntry = intl => ({
    id: 'addons',
    label: intl.formatMessage({
        id: 'tw.menuBar.addons',
        description: 'Menu bar item to open addon settings',
        defaultMessage: 'Addons'
    }),
    icon: Puzzle,
    keywords: intl.formatMessage({
        id: 'mw.settings.keywords.addons',
        description: 'Extra search terms for the addon settings, separated by spaces',
        defaultMessage: 'addons add-ons extensions features tweaks customize'
    })
});

export {getAddonsSearchEntry, getSettingsSidebarGroups};
