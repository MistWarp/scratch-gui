import {defineMessages} from 'react-intl';

const messages = defineMessages({
    saveCurrent: {
        defaultMessage: 'Save current look',
        description: 'Button that saves the current theme settings as a new custom theme',
        id: 'mw.customThemes.saveCurrent'
    },
    newGradient: {
        defaultMessage: 'New gradient',
        description: 'Button that opens the gradient theme builder',
        id: 'mw.customThemes.newGradient'
    },
    importFile: {
        defaultMessage: 'Import',
        description: 'Button that imports custom themes from a JSON file',
        id: 'tw.customThemes.import'
    },
    exportAll: {
        defaultMessage: 'Export all',
        description: 'Button that downloads every custom theme as one JSON file',
        id: 'tw.customThemes.export'
    },
    browse: {
        defaultMessage: 'Browse community themes',
        description: 'Link to the community theme gallery',
        id: 'mw.customThemes.browse'
    },
    emptyTitle: {
        defaultMessage: 'No custom themes yet',
        description: 'Shown when the custom theme library is empty',
        id: 'tw.customThemes.empty'
    },
    emptyHint: {
        // eslint-disable-next-line max-len
        defaultMessage: 'Save the look you have now, or build one from a gradient. Your themes show up here so you can switch between them.',
        description: 'Explains how to add the first custom theme',
        id: 'mw.customThemes.emptyHint'
    },
    active: {
        defaultMessage: 'Active',
        description: 'Badge on the custom theme that is currently applied',
        id: 'mw.customThemes.active'
    },
    gradientKind: {
        defaultMessage: 'Gradient',
        description: 'Shown under a custom theme that has no description and uses a gradient',
        id: 'mw.customThemes.kind.gradient'
    },
    savedKind: {
        defaultMessage: 'Saved look',
        description: 'Shown under a custom theme that has no description and was saved from the current look',
        id: 'mw.customThemes.kind.saved'
    },
    byAuthor: {
        defaultMessage: 'By {author}',
        description: 'Author of an imported custom theme',
        id: 'mw.customThemes.byAuthor'
    },
    applyTheme: {
        defaultMessage: 'Use {themeName}',
        description: 'Accessible label for the preview button that applies a custom theme',
        id: 'mw.customThemes.apply'
    },
    editTheme: {
        defaultMessage: 'Edit {themeName}',
        description: 'Accessible label for the button that edits a custom theme',
        id: 'mw.customThemes.edit'
    },
    exportTheme: {
        defaultMessage: 'Download {themeName}',
        description: 'Accessible label for the button that downloads one custom theme',
        id: 'mw.customThemes.exportOne'
    },
    deleteTheme: {
        defaultMessage: 'Delete {themeName}',
        description: 'Accessible label for the button that deletes a custom theme',
        id: 'mw.customThemes.deleteOne'
    },
    deleteConfirm: {
        defaultMessage: 'Delete this theme?',
        description: 'Confirmation shown before a custom theme is deleted',
        id: 'mw.customThemes.deleteConfirm'
    },
    deleteAction: {
        defaultMessage: 'Delete',
        description: 'Button that confirms deleting a custom theme',
        id: 'mw.customThemes.deleteAction'
    },
    cancel: {
        defaultMessage: 'Cancel',
        description: 'Button that cancels the current custom theme action',
        id: 'tw.customThemes.createDialog.cancel'
    },
    back: {
        defaultMessage: 'Back to your themes',
        description: 'Button that leaves the custom theme editor',
        id: 'mw.customThemes.back'
    },
    titleCurrent: {
        defaultMessage: 'Save current look',
        description: 'Heading of the editor that saves the current look as a custom theme',
        id: 'mw.customThemes.title.current'
    },
    titleGradient: {
        defaultMessage: 'New gradient theme',
        description: 'Heading of the editor that creates a gradient custom theme',
        id: 'mw.customThemes.title.gradient'
    },
    titleEdit: {
        defaultMessage: 'Edit theme',
        description: 'Heading of the editor that changes an existing custom theme',
        id: 'mw.customThemes.title.edit'
    },
    currentHint: {
        defaultMessage: 'Saves your accent, light or dark mode, block colors, wallpaper and fonts.',
        description: 'Explains what saving the current look includes',
        id: 'mw.customThemes.currentHint'
    },
    name: {
        defaultMessage: 'Name',
        description: 'Label for the custom theme name field',
        id: 'tw.customThemes.createDialog.name'
    },
    namePlaceholder: {
        defaultMessage: 'My theme',
        description: 'Placeholder for the custom theme name field',
        id: 'mw.customThemes.namePlaceholder'
    },
    description: {
        defaultMessage: 'Description (optional)',
        description: 'Label for the custom theme description field',
        id: 'tw.customThemes.createDialog.description'
    },
    descriptionPlaceholder: {
        defaultMessage: 'What makes this theme yours?',
        description: 'Placeholder for the custom theme description field',
        id: 'mw.customThemes.descriptionPlaceholder'
    },
    colors: {
        defaultMessage: 'Colors',
        description: 'Label for the gradient color stops',
        id: 'mw.customThemes.gradient.colors'
    },
    addColor: {
        defaultMessage: 'Add color',
        description: 'Button that adds a color stop to the gradient',
        id: 'mw.customThemes.gradient.addColor'
    },
    removeColor: {
        defaultMessage: 'Remove color {number}',
        description: 'Accessible label for the button that removes a gradient color stop',
        id: 'mw.customThemes.gradient.removeColor'
    },
    colorStop: {
        defaultMessage: 'Color {number} position',
        description: 'Accessible label for a draggable gradient color stop handle',
        id: 'mw.customThemes.gradient.stopHandle'
    },
    colorValue: {
        defaultMessage: 'Color {number}',
        description: 'Accessible label for a gradient color picker',
        id: 'mw.customThemes.gradient.stopColor'
    },
    presets: {
        defaultMessage: 'Presets',
        description: 'Label for the list of ready-made gradients',
        id: 'mw.customThemes.gradient.presets'
    },
    presetSunset: {
        defaultMessage: 'Sunset',
        description: 'Name of a ready-made gradient',
        id: 'mw.customThemes.preset.sunset'
    },
    presetOcean: {
        defaultMessage: 'Ocean',
        description: 'Name of a ready-made gradient',
        id: 'mw.customThemes.preset.ocean'
    },
    presetForest: {
        defaultMessage: 'Forest',
        description: 'Name of a ready-made gradient',
        id: 'mw.customThemes.preset.forest'
    },
    presetPurpleRain: {
        defaultMessage: 'Purple rain',
        description: 'Name of a ready-made gradient',
        id: 'mw.customThemes.preset.purpleRain'
    },
    presetFire: {
        defaultMessage: 'Fire',
        description: 'Name of a ready-made gradient',
        id: 'mw.customThemes.preset.fire'
    },
    presetAurora: {
        defaultMessage: 'Aurora',
        description: 'Name of a ready-made gradient',
        id: 'mw.customThemes.preset.aurora'
    },
    presetSpace: {
        defaultMessage: 'Space',
        description: 'Name of a ready-made gradient',
        id: 'mw.customThemes.preset.space'
    },
    presetCherry: {
        defaultMessage: 'Cherry',
        description: 'Name of a ready-made gradient',
        id: 'mw.customThemes.preset.cherry'
    },
    direction: {
        defaultMessage: 'Direction',
        description: 'Label for the gradient direction controls',
        id: 'tw.customThemes.gradientCreator.direction'
    },
    directionValue: {
        defaultMessage: '{degrees} degrees',
        description: 'Accessible label for a gradient direction button',
        id: 'mw.customThemes.gradient.directionValue'
    },
    accentColor: {
        defaultMessage: 'Accent color',
        description: 'Label for the color used for buttons and highlights in a gradient theme',
        id: 'mw.customThemes.gradient.accent'
    },
    accentHint: {
        defaultMessage: 'Used for buttons, tabs and highlights.',
        description: 'Explains what the accent color of a gradient theme changes',
        id: 'mw.customThemes.gradient.accentHint'
    },
    tryItOn: {
        defaultMessage: 'Try it on',
        description: 'Toggle that applies the theme being edited everywhere until it is turned off',
        id: 'mw.customThemes.tryItOn'
    },
    create: {
        defaultMessage: 'Save theme',
        description: 'Button that saves a new custom theme',
        id: 'mw.customThemes.create'
    },
    update: {
        defaultMessage: 'Save changes',
        description: 'Button that saves changes to an existing custom theme',
        id: 'tw.customThemes.gradientEditor.update'
    },
    errorNameRequired: {
        defaultMessage: 'Give your theme a name.',
        description: 'Error when saving a custom theme without a name',
        id: 'mw.customThemes.error.nameRequired'
    },
    errorNameTaken: {
        defaultMessage: 'You already have a theme called “{themeName}”.',
        description: 'Error when a custom theme name is already used',
        id: 'mw.customThemes.error.nameTaken'
    },
    errorLimit: {
        defaultMessage: 'Your library is full. Delete a theme to make room.',
        description: 'Error when the custom theme library has reached its limit',
        id: 'mw.customThemes.error.limit'
    },
    errorSave: {
        defaultMessage: 'This theme could not be saved.',
        description: 'Generic error when saving a custom theme fails',
        id: 'mw.customThemes.error.save'
    },
    errorDelete: {
        defaultMessage: 'This theme could not be deleted.',
        description: 'Error when deleting a custom theme fails',
        id: 'mw.customThemes.error.delete'
    },
    errorExport: {
        defaultMessage: 'Your themes could not be exported.',
        description: 'Error when exporting custom themes fails',
        id: 'mw.customThemes.error.export'
    },
    errorImport: {
        defaultMessage: 'That file could not be read as a theme file.',
        description: 'Error when a custom theme file cannot be imported',
        id: 'mw.customThemes.error.import'
    },
    saved: {
        defaultMessage: '“{themeName}” is saved and in use.',
        description: 'Status after a custom theme is created',
        id: 'mw.customThemes.status.saved'
    },
    updated: {
        defaultMessage: '“{themeName}” is updated.',
        description: 'Status after a custom theme is changed',
        id: 'mw.customThemes.status.updated'
    },
    deleted: {
        defaultMessage: '“{themeName}” is deleted.',
        description: 'Status after a custom theme is deleted',
        id: 'mw.customThemes.status.deleted'
    },
    exported: {
        defaultMessage: 'Downloaded {count, plural, one {# theme} other {# themes}}.',
        description: 'Status after custom themes are exported',
        id: 'mw.customThemes.status.exported'
    },
    imported: {
        defaultMessage: 'Imported {imported, plural, one {# theme} other {# themes}}.',
        description: 'Status after custom themes are imported',
        id: 'mw.customThemes.status.imported'
    },
    importedWithSkipped: {
        // eslint-disable-next-line max-len
        defaultMessage: 'Imported {imported, plural, one {# theme} other {# themes}}. Skipped {skipped, plural, one {# theme} other {# themes}} you already have.',
        description: 'Status after custom themes are imported and some were already in the library',
        id: 'mw.customThemes.status.importedSkipped'
    },
    importedWithErrors: {
        defaultMessage: '{failed, plural, one {# theme} other {# themes}} in that file could not be read.',
        description: 'Error after importing a file where some themes were invalid',
        id: 'mw.customThemes.status.importErrors'
    },
    dismiss: {
        defaultMessage: 'Dismiss',
        description: 'Accessible label for the button that hides a custom themes status message',
        id: 'mw.customThemes.dismiss'
    }
});

export default messages;
