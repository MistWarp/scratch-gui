import {
    Bug,
    GitBranch,
    Globe,
    Keyboard,
    Monitor,
    Settings,
    SunMoon,
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
            items: [{
                id: 'theme',
                label: intl.formatMessage({id: 'mw.settings.theme', defaultMessage: 'Theme'}),
                icon: SunMoon
            }]
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
