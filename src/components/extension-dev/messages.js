/* eslint-disable max-len */
import {defineMessages} from 'react-intl';

export default defineMessages({
    title: {
        defaultMessage: 'Manage Extensions',
        description: 'Title of the window that lists, edits and removes the project extensions',
        id: 'mw.extensionDev.title'
    },
    newExtension: {
        defaultMessage: 'New extension',
        description: 'Button that starts creating a new extension in the editor',
        id: 'mw.extensionDev.newExtension'
    },
    addExtension: {
        defaultMessage: 'Add extension',
        description: 'Button that opens the extension library',
        id: 'mw.extensionDev.addExtension'
    },
    files: {
        defaultMessage: 'Extensions',
        description: 'Accessible label of the list of loaded extensions',
        id: 'mw.extensionDev.files'
    },
    empty: {
        defaultMessage: 'This project has no extensions yet.',
        description: 'Shown in the extension list when the project has no extensions',
        id: 'mw.extensionDev.empty'
    },
    emptyHint: {
        defaultMessage: 'Add one from the library, or write your own with New extension.',
        description: 'Hint below the empty extension list',
        id: 'mw.extensionDev.emptyHint'
    },
    kindEmbedded: {
        defaultMessage: 'Embedded',
        description: 'Extension source kind: its code is saved inside the project',
        id: 'mw.extensionDev.kindEmbedded'
    },
    kindURL: {
        defaultMessage: 'URL',
        description: 'Extension source kind: loaded from a web address',
        id: 'mw.extensionDev.kindURL'
    },
    kindBuiltin: {
        defaultMessage: 'Built-in',
        description: 'Extension source kind: part of the editor',
        id: 'mw.extensionDev.kindBuiltin'
    },
    statusFailed: {
        defaultMessage: 'Failed to load',
        description: 'Extension status: its code failed to load',
        id: 'mw.extensionDev.statusFailed'
    },
    statusDenied: {
        defaultMessage: 'Not allowed',
        description: 'Extension status: the user did not allow it to load',
        id: 'mw.extensionDev.statusDenied'
    },
    modeSandboxed: {
        defaultMessage: 'Sandboxed',
        description: 'Extension runs inside the sandbox',
        id: 'mw.extensionDev.modeSandboxed'
    },
    modeUnsandboxed: {
        defaultMessage: 'Unsandboxed',
        description: 'Extension runs without the sandbox',
        id: 'mw.extensionDev.modeUnsandboxed'
    },
    problemCount: {
        defaultMessage: '{count, plural, one {# problem} other {# problems}}',
        description: 'Number of problems for an extension in the list',
        id: 'mw.extensionDev.problemCount'
    },
    moreActions: {
        defaultMessage: 'More actions',
        description: 'Button that opens the actions menu of an extension',
        id: 'mw.extensionDev.moreActions'
    },
    edit: {
        defaultMessage: 'Edit',
        description: 'Action that makes an extension editable in the code editor',
        id: 'mw.extensionDev.edit'
    },
    editAnyway: {
        defaultMessage: 'Edit anyway',
        description: 'Action that edits a file marked as generated',
        id: 'mw.extensionDev.editAnyway'
    },
    reload: {
        defaultMessage: 'Reload',
        description: 'Action that runs the extension code again',
        id: 'mw.extensionDev.reload'
    },
    convert: {
        defaultMessage: 'Convert to embedded',
        description: 'Action that saves a URL extension code inside the project',
        id: 'mw.extensionDev.convert'
    },
    download: {
        defaultMessage: 'Download .js',
        description: 'Action that downloads the extension code as a file',
        id: 'mw.extensionDev.download'
    },
    remove: {
        defaultMessage: 'Remove from project...',
        description: 'Action that starts removing an extension and its blocks from the project',
        id: 'mw.extensionDev.remove'
    },
    removeSelected: {
        defaultMessage: 'Remove {count, plural, one {# extension} other {# extensions}}...',
        description: 'Button that starts removing the selected extensions',
        id: 'mw.extensionDev.removeSelected'
    },
    docs: {
        defaultMessage: 'Extension docs',
        description: 'Action that opens the documentation for writing extensions',
        id: 'mw.extensionDev.docs'
    },
    moveUp: {
        defaultMessage: 'Move up',
        description: 'Action that moves an extension up in the block palette',
        id: 'mw.extensionDev.moveUp'
    },
    moveDown: {
        defaultMessage: 'Move down',
        description: 'Action that moves an extension down in the block palette',
        id: 'mw.extensionDev.moveDown'
    },
    apply: {
        defaultMessage: 'Apply',
        description: 'Button that runs the edited extension code in the project',
        id: 'mw.extensionDev.apply'
    },
    statusApplied: {
        defaultMessage: 'Applied',
        description: 'Status: the edited code is running',
        id: 'mw.extensionDev.statusApplied'
    },
    statusApplying: {
        defaultMessage: 'Applying...',
        description: 'Status: the edited code is being loaded',
        id: 'mw.extensionDev.statusApplying'
    },
    statusUnapplied: {
        defaultMessage: 'Not applied',
        description: 'Status: the editor has changes that are not running yet',
        id: 'mw.extensionDev.statusUnapplied'
    },
    statusErrors: {
        defaultMessage: 'Not applied: {count, plural, one {# error} other {# errors}}',
        description: 'Status: the edited code has errors and is not running',
        id: 'mw.extensionDev.statusErrors'
    },
    statusFailedApply: {
        defaultMessage: 'Not applied. The previous version is still running.',
        description: 'Status: applying failed and the old code keeps running',
        id: 'mw.extensionDev.statusFailedApply'
    },
    statusPatches: {
        defaultMessage: 'This file changes the editor itself. Reload the page to apply every change.',
        description: 'Status for extensions that patch editor internals',
        id: 'mw.extensionDev.statusPatches'
    },
    loadedFrom: {
        defaultMessage: 'Loaded from {url}. Convert it to embedded to edit it here.',
        description: 'Shown above the read-only code of a URL extension',
        id: 'mw.extensionDev.loadedFrom'
    },
    builtinNoSource: {
        defaultMessage: 'Built-in extensions have no editable source.',
        description: 'Shown for built-in extensions',
        id: 'mw.extensionDev.builtinNoSource'
    },
    readOnlyProject: {
        defaultMessage: 'This extension came with the project. Click Edit to change it.',
        description: 'Shown above embedded extensions that were not written in this session',
        id: 'mw.extensionDev.readOnlyProject'
    },
    readOnlyGenerated: {
        defaultMessage: 'This file says it is generated. Edits are usually lost when it is generated again.',
        description: 'Shown above extensions marked GENERATED FILE',
        id: 'mw.extensionDev.readOnlyGenerated'
    },
    readOnlyKey: {
        defaultMessage: 'Read-only. Click Edit to change this file.',
        description: 'Shown when pressing the apply shortcut in a read-only editor',
        id: 'mw.extensionDev.readOnlyKey'
    },
    collaborating: {
        defaultMessage: 'Extension editing is unavailable during collaboration.',
        description: 'Shown when extension editing is disabled because of a collaboration session',
        id: 'mw.extensionDev.collaborating'
    },
    failedHeading: {
        defaultMessage: 'This extension failed to load',
        description: 'Heading for an extension that failed to load',
        id: 'mw.extensionDev.failedHeading'
    },
    deniedHeading: {
        defaultMessage: 'This extension was not allowed to load',
        description: 'Heading for an extension the user denied',
        id: 'mw.extensionDev.deniedHeading'
    },
    allow: {
        defaultMessage: 'Allow',
        description: 'Button that loads an extension that was not allowed',
        id: 'mw.extensionDev.allow'
    },
    loadingSource: {
        defaultMessage: 'Loading source...',
        description: 'Shown while the extension code is being read',
        id: 'mw.extensionDev.loadingSource'
    },
    sourceUnavailable: {
        defaultMessage: 'The source could not be read: {message}',
        description: 'Shown when the extension code cannot be fetched',
        id: 'mw.extensionDev.sourceUnavailable'
    },
    reloadRefused: {
        defaultMessage: 'This server does not allow reloading the file. Use Convert to embedded instead.',
        description: 'Shown when a URL extension cannot be fetched again',
        id: 'mw.extensionDev.reloadRefused'
    },
    sourceNotLoaded: {
        defaultMessage: 'The code at {url} has not been downloaded.',
        description: 'Shown for an extension from a web address whose code has not been downloaded',
        id: 'mw.extensionDev.sourceNotLoaded'
    },
    fetchSource: {
        defaultMessage: 'Download code',
        description: 'Button that downloads the code of an extension from its web address to show it',
        id: 'mw.extensionDev.fetchSource'
    },
    definitionNotFound: {
        defaultMessage: 'Could not find where {opcode} is defined in this file.',
        description: 'Shown when Go to definition cannot find the block in the extension code',
        id: 'mw.extensionDev.definitionNotFound'
    },
    selectHint: {
        defaultMessage: 'Select an extension to see its code.',
        description: 'Shown when no extension is selected',
        id: 'mw.extensionDev.selectHint'
    },
    problems: {
        defaultMessage: 'Problems',
        description: 'Tab that lists extension problems',
        id: 'mw.extensionDev.problems'
    },
    output: {
        defaultMessage: 'Output',
        description: 'Tab that shows extension activity',
        id: 'mw.extensionDev.output'
    },
    noProblems: {
        defaultMessage: 'No problems.',
        description: 'Shown when an extension has no problems',
        id: 'mw.extensionDev.noProblems'
    },
    noOutput: {
        defaultMessage: 'Nothing yet. Applies, reloads and errors appear here.',
        description: 'Shown when the output tab is empty',
        id: 'mw.extensionDev.noOutput'
    },
    showPanel: {
        defaultMessage: 'Show panel',
        description: 'Button that expands the problems and output panel',
        id: 'mw.extensionDev.showPanel'
    },
    hidePanel: {
        defaultMessage: 'Hide panel',
        description: 'Button that collapses the problems and output panel',
        id: 'mw.extensionDev.hidePanel'
    },
    clearOutput: {
        defaultMessage: 'Clear',
        description: 'Button that clears the output tab',
        id: 'mw.extensionDev.clearOutput'
    },
    moreProblems: {
        defaultMessage: 'and {count} more',
        description: 'Shown after the problem list when some problems are hidden',
        id: 'mw.extensionDev.moreProblems'
    },
    showBlock: {
        defaultMessage: 'Show block',
        description: 'Button that shows the block that caused a problem',
        id: 'mw.extensionDev.showBlock'
    },
    dismiss: {
        defaultMessage: 'Dismiss',
        description: 'Button that hides a runtime problem',
        id: 'mw.extensionDev.dismiss'
    },
    lineColumn: {
        defaultMessage: 'Line {line}, column {column}',
        description: 'Position of a problem in the code',
        id: 'mw.extensionDev.lineColumn'
    },
    repeating: {
        defaultMessage: '{count, plural, one {# time} other {# times}}',
        description: 'How many times a runtime problem happened',
        id: 'mw.extensionDev.repeating'
    },
    kindBlockError: {
        defaultMessage: '{block} threw: {message}',
        description: 'Runtime problem where an extension block threw an error',
        id: 'mw.extensionDev.kindBlockError'
    },
    kindMenuError: {
        defaultMessage: 'Menu {menu} threw: {message}',
        description: 'Runtime problem where an extension menu threw an error',
        id: 'mw.extensionDev.kindMenuError'
    },
    outputApplied: {
        defaultMessage: 'Applied {name}.',
        description: 'Output entry when an extension edit was applied',
        id: 'mw.extensionDev.outputApplied'
    },
    outputApplyFailed: {
        defaultMessage: 'Could not apply {name}: {message}',
        description: 'Output entry when applying failed',
        id: 'mw.extensionDev.outputApplyFailed'
    },
    outputRemovedBlocks: {
        defaultMessage: 'Removed blocks: {opcodes}. Blocks already in the project keep their place but do nothing.',
        description: 'Output entry listing opcodes an apply removed',
        id: 'mw.extensionDev.outputRemovedBlocks'
    },
    outputConverted: {
        defaultMessage: '{name} is now embedded in the project.',
        description: 'Output entry after converting to embedded',
        id: 'mw.extensionDev.outputConverted'
    },
    outputCreated: {
        defaultMessage: 'Created {name}.',
        description: 'Output entry after creating an extension',
        id: 'mw.extensionDev.outputCreated'
    },
    outputRemoved: {
        defaultMessage: 'Removed {name} from the project.',
        description: 'Output entry after removing an extension',
        id: 'mw.extensionDev.outputRemoved'
    },
    removeHeading: {
        defaultMessage: 'Remove {name} from the project?',
        description: 'Heading of the remove confirmation for one extension',
        id: 'mw.extensionDev.removeHeading'
    },
    removeHeadingMany: {
        defaultMessage: 'Remove {count} extensions from the project?',
        description: 'Heading of the remove confirmation for several extensions',
        id: 'mw.extensionDev.removeHeadingMany'
    },
    removeTargetCounts: {
        defaultMessage: '{blocks, plural, one {# block} other {# blocks}}{hats, plural, =0 {} one {, # script starts with its blocks} other {, # scripts start with its blocks}}{monitors, plural, =0 {} one {, # monitor} other {, # monitors}}',
        description: 'Per sprite counts in the remove confirmation',
        id: 'mw.extensionDev.removeTargetCounts'
    },
    removeNoBlocks: {
        defaultMessage: 'No sprite uses its blocks.',
        description: 'Shown in the remove confirmation when no blocks are placed',
        id: 'mw.extensionDev.removeNoBlocks'
    },
    consequencesHeading: {
        defaultMessage: 'What happens',
        description: 'Heading of the list of consequences of removing an extension',
        id: 'mw.extensionDev.consequencesHeading'
    },
    consequenceBlocks: {
        defaultMessage: 'Its blocks are deleted from every sprite. Blocks below them move up to fill the gap.',
        description: 'Remove consequence',
        id: 'mw.extensionDev.consequenceBlocks'
    },
    consequenceHats: {
        defaultMessage: 'Scripts under its hat blocks stay as loose scripts that do not run.',
        description: 'Remove consequence',
        id: 'mw.extensionDev.consequenceHats'
    },
    consequenceBranches: {
        defaultMessage: 'Code inside its C blocks and reporters placed in its inputs are kept as loose scripts.',
        description: 'Remove consequence',
        id: 'mw.extensionDev.consequenceBranches'
    },
    consequenceReporters: {
        defaultMessage: 'Where its reporters sat in other blocks, those inputs go back to their default values.',
        description: 'Remove consequence',
        id: 'mw.extensionDev.consequenceReporters'
    },
    consequenceMonitors: {
        defaultMessage: 'Its monitors on the stage are deleted.',
        description: 'Remove consequence',
        id: 'mw.extensionDev.consequenceMonitors'
    },
    consequenceStorage: {
        defaultMessage: 'Data it saved in the project is deleted.',
        description: 'Remove consequence',
        id: 'mw.extensionDev.consequenceStorage'
    },
    consequenceUndo: {
        defaultMessage: 'Ctrl+Z cannot undo this. A restore point of the whole project is made first, in File > Restore Points.',
        description: 'Remove consequence about undo and restore points',
        id: 'mw.extensionDev.consequenceUndo'
    },
    consequenceDraft: {
        defaultMessage: 'Your unapplied edits are deleted with it unless you download them first.',
        description: 'Remove consequence when there are unapplied edits',
        id: 'mw.extensionDev.consequenceDraft'
    },
    consequencePatches: {
        defaultMessage: 'Some of its changes to the editor stay until the page reloads.',
        description: 'Remove consequence for extensions that patch the editor',
        id: 'mw.extensionDev.consequencePatches'
    },
    cancel: {
        defaultMessage: 'Cancel',
        description: 'Button that cancels',
        id: 'mw.extensionDev.cancel'
    },
    removeConfirm: {
        defaultMessage: 'Remove',
        description: 'Button that confirms removing extensions',
        id: 'mw.extensionDev.removeConfirm'
    },
    removing: {
        defaultMessage: 'Removing...',
        description: 'Shown while extensions are being removed',
        id: 'mw.extensionDev.removing'
    },
    removeFailed: {
        defaultMessage: 'The extension could not be removed: {message}',
        description: 'Shown when removing fails',
        id: 'mw.extensionDev.removeFailed'
    },
    newHeading: {
        defaultMessage: 'New extension',
        description: 'Heading of the new extension form',
        id: 'mw.extensionDev.newHeading'
    },
    nameLabel: {
        defaultMessage: 'Name',
        description: 'Label of the extension name field',
        id: 'mw.extensionDev.nameLabel'
    },
    namePlaceholder: {
        defaultMessage: 'My Extension',
        description: 'Placeholder of the extension name field',
        id: 'mw.extensionDev.namePlaceholder'
    },
    idLabel: {
        defaultMessage: 'ID',
        description: 'Label of the extension id field',
        id: 'mw.extensionDev.idLabel'
    },
    idHint: {
        defaultMessage: 'Letters and numbers only. Blocks are saved with this ID, so pick it once.',
        description: 'Help text of the extension id field',
        id: 'mw.extensionDev.idHint'
    },
    idInvalid: {
        defaultMessage: 'Use only letters and numbers.',
        description: 'Error for an invalid extension id',
        id: 'mw.extensionDev.idInvalid'
    },
    idTaken: {
        defaultMessage: 'Another extension already uses the ID {id}.',
        description: 'Error for an extension id that is taken',
        id: 'mw.extensionDev.idTaken'
    },
    templateLabel: {
        defaultMessage: 'Start from',
        description: 'Label of the template choice',
        id: 'mw.extensionDev.templateLabel'
    },
    templateBlank: {
        defaultMessage: 'Blank',
        description: 'Template: a minimal sandboxed extension',
        id: 'mw.extensionDev.templateBlank'
    },
    templateBlankHint: {
        defaultMessage: 'One reporter block. Runs in the sandbox and works anywhere.',
        description: 'Description of the blank template',
        id: 'mw.extensionDev.templateBlankHint'
    },
    templateUnsandboxed: {
        defaultMessage: 'Unsandboxed',
        description: 'Template: an extension with full access to the editor',
        id: 'mw.extensionDev.templateUnsandboxed'
    },
    templateUnsandboxedHint: {
        defaultMessage: 'Access to the project, stage and editor. Reacts when the green flag is clicked.',
        description: 'Description of the unsandboxed template',
        id: 'mw.extensionDev.templateUnsandboxedHint'
    },
    templatePasted: {
        defaultMessage: 'The code you pasted',
        description: 'Template choice when code was pasted',
        id: 'mw.extensionDev.templatePasted'
    },
    unsandboxedLabel: {
        defaultMessage: 'Run without sandbox',
        description: 'Checkbox that lets a new extension run without the sandbox',
        id: 'mw.extensionDev.unsandboxedLabel'
    },
    unsandboxedHint: {
        defaultMessage: 'Unsandboxed code can do anything the editor can, including reading your projects and account. Only enable this for code you trust.',
        description: 'Warning below the run without sandbox checkbox',
        id: 'mw.extensionDev.unsandboxedHint'
    },
    create: {
        defaultMessage: 'Create',
        description: 'Button that creates the new extension',
        id: 'mw.extensionDev.create'
    },
    creating: {
        defaultMessage: 'Creating...',
        description: 'Shown while a new extension loads',
        id: 'mw.extensionDev.creating'
    },
    createFailed: {
        defaultMessage: 'The extension could not be created: {message}',
        description: 'Shown when creating an extension fails',
        id: 'mw.extensionDev.createFailed'
    },
    back: {
        defaultMessage: 'Back',
        description: 'Button that returns to the extension list on narrow windows',
        id: 'mw.extensionDev.back'
    },
    unappliedClose: {
        defaultMessage: 'Some extensions have edits that are not applied. Close anyway? Your edits stay until you reload the page.',
        description: 'Confirmation when closing the window with unapplied edits',
        id: 'mw.extensionDev.unappliedClose'
    },
    viewSource: {
        defaultMessage: 'View source',
        description: 'Palette category menu item that opens the extension code',
        id: 'mw.extensionDev.viewSource'
    },
    editExtension: {
        defaultMessage: 'Edit extension',
        description: 'Palette category menu item that opens the extension in the editor',
        id: 'mw.extensionDev.editExtension'
    },
    reloadExtension: {
        defaultMessage: 'Reload extension',
        description: 'Palette category menu item that reloads the extension',
        id: 'mw.extensionDev.reloadExtension'
    },
    goToDefinition: {
        defaultMessage: 'Go to definition',
        description: 'Block context menu item that opens the extension code of the block',
        id: 'mw.extensionDev.goToDefinition'
    },
    showProblem: {
        defaultMessage: 'Show problem',
        description: 'Block context menu item that shows the problem the block caused',
        id: 'mw.extensionDev.showProblem'
    },
    problemsMenu: {
        defaultMessage: 'Extension Problems ({count})',
        description: 'Extensions menu item that opens the problem list',
        id: 'mw.extensionDev.problemsMenu'
    },
    newExtensionMenu: {
        defaultMessage: 'New Extension',
        description: 'Extensions menu item that creates a new extension',
        id: 'mw.extensionDev.newExtensionMenu'
    },
    blockMarkTooltip: {
        defaultMessage: 'This block caused an extension error. Right-click it and choose Show problem.',
        description: 'Tooltip of a block marked with an extension error',
        id: 'mw.extensionDev.blockMarkTooltip'
    },
    syntaxBlocksApply: {
        defaultMessage: 'Fix the syntax error before applying.',
        description: 'Shown when an extension edit is not applied because the code does not parse',
        id: 'mw.extensionDev.syntaxBlocksApply'
    },
    runUnsandboxed: {
        defaultMessage: 'Run unsandboxed',
        description: 'Action that asks to run an extension loaded from a file without the sandbox',
        id: 'mw.extensionDev.runUnsandboxed'
    },
    outputUnsandboxed: {
        defaultMessage: '{name} now runs without the sandbox.',
        description: 'Output entry after an extension was reloaded without the sandbox',
        id: 'mw.extensionDev.outputUnsandboxed'
    }
});
