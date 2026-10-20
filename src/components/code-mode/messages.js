import {defineMessages} from 'react-intl';

export default defineMessages({
    editorMode: {
        id: 'mw.codeMode.editorMode',
        defaultMessage: 'Editor mode',
        description: 'Accessible label for the Blocks and Code mode switch'
    },
    blocksMode: {
        id: 'mw.codeMode.blocksMode',
        defaultMessage: 'Blocks',
        description: 'Button that switches the editor to Blocks mode'
    },
    codeMode: {
        id: 'mw.codeMode.codeMode',
        defaultMessage: 'Code',
        description: 'Button that switches the editor to Code mode, a text editor workbench'
    },
    explorer: {
        id: 'mw.codeMode.explorer',
        defaultMessage: 'Explorer',
        description: 'Heading of the file tree in Code mode'
    },
    toggleExplorer: {
        id: 'mw.codeMode.toggleExplorer',
        defaultMessage: 'Toggle explorer',
        description: 'Tooltip for the button that shows or hides the Code mode file tree'
    },
    stage: {
        id: 'mw.codeMode.stage',
        defaultMessage: 'Stage',
        description: 'Explorer row for the Stage'
    },
    costumes: {
        id: 'mw.codeMode.costumes',
        defaultMessage: 'Costumes',
        description: 'Explorer folder holding a sprite costumes'
    },
    backdrops: {
        id: 'mw.codeMode.backdrops',
        defaultMessage: 'Backdrops',
        description: 'Explorer folder holding the Stage backdrops'
    },
    sounds: {
        id: 'mw.codeMode.sounds',
        defaultMessage: 'Sounds',
        description: 'Explorer folder holding sounds'
    },
    extensions: {
        id: 'mw.codeMode.extensions',
        defaultMessage: 'Extensions',
        description: 'Explorer folder holding the project extensions'
    },
    noExtensions: {
        id: 'mw.codeMode.noExtensions',
        defaultMessage: 'No extensions',
        description: 'Shown inside the Extensions folder when the project has none'
    },
    builtIn: {
        id: 'mw.codeMode.builtIn',
        defaultMessage: 'Built in',
        description: 'Label on an extension row that has no editable source'
    },
    problemCount: {
        id: 'mw.codeMode.problemCount',
        defaultMessage: '{count, plural, one {# problem} other {# problems}}',
        description: 'Problem count shown on an explorer row'
    },
    addSprite: {
        id: 'mw.codeMode.addSprite',
        defaultMessage: 'Add sprite',
        description: 'Explorer button that opens the menu for adding a sprite'
    },
    paintSprite: {
        id: 'mw.codeMode.paintSprite',
        defaultMessage: 'Paint new sprite',
        description: 'Explorer menu item that adds a blank sprite to draw'
    },
    uploadSprite: {
        id: 'mw.codeMode.uploadSprite',
        defaultMessage: 'Upload sprite',
        description: 'Explorer menu item that adds sprites from the computer'
    },
    spriteLibrary: {
        id: 'mw.codeMode.spriteLibrary',
        defaultMessage: 'Choose a sprite',
        description: 'Explorer menu item that opens the sprite library'
    },
    surpriseSprite: {
        id: 'mw.codeMode.surpriseSprite',
        defaultMessage: 'Surprise sprite',
        description: 'Explorer menu item that adds a random sprite'
    },
    paintCostume: {
        id: 'mw.codeMode.paintCostume',
        defaultMessage: 'Paint new costume',
        description: 'Explorer menu item that adds a blank costume to draw'
    },
    uploadCostume: {
        id: 'mw.codeMode.uploadCostume',
        defaultMessage: 'Upload costume',
        description: 'Explorer menu item that adds costumes from the computer'
    },
    costumeLibrary: {
        id: 'mw.codeMode.costumeLibrary',
        defaultMessage: 'Choose a costume',
        description: 'Explorer menu item that opens the costume library'
    },
    paintBackdrop: {
        id: 'mw.codeMode.paintBackdrop',
        defaultMessage: 'Paint new backdrop',
        description: 'Explorer menu item that adds a blank backdrop to draw'
    },
    uploadBackdrop: {
        id: 'mw.codeMode.uploadBackdrop',
        defaultMessage: 'Upload backdrop',
        description: 'Explorer menu item that adds backdrops from the computer'
    },
    backdropLibrary: {
        id: 'mw.codeMode.backdropLibrary',
        defaultMessage: 'Choose a backdrop',
        description: 'Explorer menu item that opens the backdrop library'
    },
    recordSound: {
        id: 'mw.codeMode.recordSound',
        defaultMessage: 'Record sound',
        description: 'Explorer menu item that records a new sound'
    },
    uploadSound: {
        id: 'mw.codeMode.uploadSound',
        defaultMessage: 'Upload sound',
        description: 'Explorer menu item that adds sounds from the computer'
    },
    soundLibrary: {
        id: 'mw.codeMode.soundLibrary',
        defaultMessage: 'Choose a sound',
        description: 'Explorer menu item that opens the sound library'
    },
    newExtension: {
        id: 'mw.codeMode.newExtension',
        defaultMessage: 'New extension',
        description: 'Explorer menu item and button that start a new extension'
    },
    addExtension: {
        id: 'mw.codeMode.addExtension',
        defaultMessage: 'Add extension',
        description: 'Explorer menu item that opens the extension library'
    },
    open: {
        id: 'mw.codeMode.open',
        defaultMessage: 'Open',
        description: 'Explorer menu item that opens a file'
    },
    rename: {
        id: 'mw.codeMode.rename',
        defaultMessage: 'Rename',
        description: 'Explorer menu item that renames a sprite or file'
    },
    duplicate: {
        id: 'mw.codeMode.duplicate',
        defaultMessage: 'Duplicate',
        description: 'Explorer menu item that duplicates a sprite or file'
    },
    delete: {
        id: 'mw.codeMode.delete',
        defaultMessage: 'Delete',
        description: 'Explorer menu item that deletes a sprite or file'
    },
    export: {
        id: 'mw.codeMode.export',
        defaultMessage: 'Export',
        description: 'Explorer menu item that saves a sprite or file to the computer'
    },
    revealInSpritePane: {
        id: 'mw.codeMode.revealInSpritePane',
        defaultMessage: 'Reveal in sprite pane',
        description: 'Explorer menu item that selects a sprite in the sprite pane'
    },
    close: {
        id: 'mw.codeMode.close',
        defaultMessage: 'Close',
        description: 'Closes an editor tab'
    },
    closeOthers: {
        id: 'mw.codeMode.closeOthers',
        defaultMessage: 'Close others',
        description: 'Closes every editor tab except this one'
    },
    nextTab: {
        id: 'mw.codeMode.nextTab',
        defaultMessage: 'Next tab',
        description: 'Switches to the next editor tab'
    },
    previousTab: {
        id: 'mw.codeMode.previousTab',
        defaultMessage: 'Previous tab',
        description: 'Switches to the previous editor tab'
    },
    editorTabs: {
        id: 'mw.codeMode.editorTabs',
        defaultMessage: 'Open files',
        description: 'Accessible label for the row of editor tabs in Code mode'
    },
    emptyEditor: {
        id: 'mw.codeMode.emptyEditor',
        defaultMessage: 'Open a file from the explorer',
        description: 'Shown in the Code mode editor area when no file is open'
    },
    quickOpen: {
        id: 'mw.codeMode.quickOpen',
        defaultMessage: 'Quick open',
        description: 'Button and dialog title for searching every file in the project'
    },
    quickOpenPlaceholder: {
        id: 'mw.codeMode.quickOpenPlaceholder',
        defaultMessage: 'Search files',
        description: 'Placeholder in the quick open search box'
    },
    noMatches: {
        id: 'mw.codeMode.noMatches',
        defaultMessage: 'No matching files',
        description: 'Shown in quick open when nothing matches the search'
    },
    readOnlyHint: {
        id: 'mw.codeMode.readOnlyHint',
        defaultMessage: 'Locked scripts are kept exactly as they are. Edit them in Blocks mode.',
        description: 'Tooltip on the message that counts locked scripts in a text tab'
    },
    loading: {
        id: 'mw.codeMode.loading',
        defaultMessage: 'Loading',
        description: 'Header message while a script text tab is being generated'
    },
    emitFailed: {
        id: 'mw.codeMode.emitFailed',
        defaultMessage: 'Could not show these scripts as text: {message}',
        description: 'Header message when a sprite cannot be converted to text'
    },
    apply: {
        id: 'mw.codeMode.apply',
        defaultMessage: 'Apply',
        description: 'Button that applies the text of a file to the project'
    },
    runAll: {
        id: 'mw.codeMode.runAll',
        defaultMessage: 'Run all',
        description: 'Button that runs the green flag scripts of the open sprite'
    },
    stop: {
        id: 'mw.codeMode.stop',
        defaultMessage: 'Stop',
        description: 'Button that stops the scripts of the open sprite'
    },
    showBlock: {
        id: 'mw.codeMode.showBlock',
        defaultMessage: 'Show block',
        description: 'Menu item that switches to Blocks mode and selects the block under the cursor'
    },
    showInCode: {
        id: 'mw.codeMode.showInCode',
        defaultMessage: 'Show in code',
        description: 'Block context menu item that opens the block in Code mode'
    },
    copy: {
        id: 'mw.codeMode.copy',
        defaultMessage: 'Copy',
        description: 'Menu item that copies selected text'
    },
    openToEdit: {
        id: 'mw.codeMode.openToEdit',
        defaultMessage: 'Open to edit',
        description: 'Button on a costume or sound tab of a sprite that is not selected'
    },
    otherSprite: {
        id: 'mw.codeMode.otherSprite',
        defaultMessage: 'This file belongs to {name}, which is not the selected sprite.',
        description: 'Shown on a costume or sound tab whose sprite is not selected'
    },
    problems: {
        id: 'mw.codeMode.problems',
        defaultMessage: 'Problems',
        description: 'Panel tab listing problems in every file'
    },
    output: {
        id: 'mw.codeMode.output',
        defaultMessage: 'Output',
        description: 'Panel tab listing extension messages'
    },
    noProblems: {
        id: 'mw.codeMode.noProblems',
        defaultMessage: 'No problems',
        description: 'Shown in the Problems panel when there are none'
    },
    noOutput: {
        id: 'mw.codeMode.noOutput',
        defaultMessage: 'No output yet',
        description: 'Shown in the Output panel when it is empty'
    },
    showPanel: {
        id: 'mw.codeMode.showPanel',
        defaultMessage: 'Show panel',
        description: 'Tooltip for the button that opens the Code mode bottom panel'
    },
    hidePanel: {
        id: 'mw.codeMode.hidePanel',
        defaultMessage: 'Hide panel',
        description: 'Tooltip for the button that closes the Code mode bottom panel'
    },
    lineColumn: {
        id: 'mw.codeMode.lineColumn',
        defaultMessage: 'Line {line}, column {column}',
        description: 'Location of a problem in a file'
    },
    resizeExplorer: {
        id: 'mw.codeMode.resizeExplorer',
        defaultMessage: 'Resize explorer. Use left and right arrow keys.',
        description: 'Accessible label for the handle between the explorer and the editor'
    },
    afterApply: {
        id: 'mw.codeMode.afterApply',
        defaultMessage: 'After the apply',
        description: 'Diff legend for the text as it was right after a code apply'
    },
    applied: {
        id: 'mw.codeMode.applied',
        defaultMessage: 'Applied',
        description: 'Header message after the text of a file was applied to the project'
    },
    applyCancelled: {
        id: 'mw.codeMode.applyCancelled',
        defaultMessage: 'Apply cancelled',
        description: 'Header message after the user cancelled an apply confirmation'
    },
    applying: {
        id: 'mw.codeMode.applying',
        defaultMessage: 'Applying',
        description: 'Header message while the text of a file is being applied'
    },
    blockVersion: {
        id: 'mw.codeMode.blockVersion',
        defaultMessage: 'Block version',
        description: 'Diff legend for the text generated from the current blocks'
    },
    changesSinceApply: {
        id: 'mw.codeMode.changesSinceApply',
        defaultMessage: 'Changes since this apply',
        description: 'Title of the read only diff shown when a code apply cannot be undone'
    },
    conflicts: {
        id: 'mw.codeMode.conflicts',
        defaultMessage: '{count, plural, one {# script changed in blocks since you started editing} ' +
            'other {# scripts changed in blocks since you started editing}}',
        description: 'Header message when text and blocks were both edited'
    },
    currentBlocks: {
        id: 'mw.codeMode.currentBlocks',
        defaultMessage: 'Current blocks',
        description: 'Diff legend for the text of the scripts as they are now'
    },
    deleteIt: {
        id: 'mw.codeMode.deleteIt',
        defaultMessage: 'Delete it',
        description: 'Button that drops a script the user edited after it was deleted in blocks'
    },
    discard: {
        id: 'mw.codeMode.discard',
        defaultMessage: 'Discard',
        description: 'Button that throws away unapplied text from an earlier session'
    },
    discardChanges: {
        id: 'mw.codeMode.discardChanges',
        defaultMessage: 'Discard unapplied changes',
        description: 'Context menu item that resets a text tab to the current blocks'
    },
    keepMine: {
        id: 'mw.codeMode.keepMine',
        defaultMessage: 'Keep my version',
        description: 'Button that keeps the text the user typed for a script that also changed in blocks'
    },
    keepMyScript: {
        id: 'mw.codeMode.keepMyScript',
        defaultMessage: 'Keep my script',
        description: 'Button that keeps a script the user edited after it was deleted in blocks'
    },
    lockedReason: {
        id: 'mw.codeMode.lockedReason',
        defaultMessage: 'Uses a block fractch can\'t convert back the same way',
        description: 'Tooltip on the lock icon of a script that cannot be edited as text'
    },
    lockedScripts: {
        id: 'mw.codeMode.lockedScripts',
        defaultMessage: '{count, plural, one {# script can\'t be edited as text} ' +
            'other {# scripts can\'t be edited as text}}',
        description: 'Header message counting locked scripts'
    },
    moreMessages: {
        id: 'mw.codeMode.moreMessages',
        defaultMessage: '+{count} more',
        description: 'Button that lists the other header messages of a text tab'
    },
    redidCodeChange: {
        id: 'mw.codeMode.redidCodeChange',
        defaultMessage: 'Redid code change',
        description: 'Header message after a code apply was redone'
    },
    redo: {
        id: 'mw.codeMode.redo',
        defaultMessage: 'Redo',
        description: 'Button that redoes the code change that was just undone'
    },
    resolve: {
        id: 'mw.codeMode.resolve',
        defaultMessage: 'Resolve',
        description: 'Button that opens the view for choosing between text and block versions'
    },
    resolveTitle: {
        id: 'mw.codeMode.resolveTitle',
        defaultMessage: 'Changed in text and in blocks',
        description: 'Title of the view that lists scripts edited both as text and as blocks'
    },
    restoredDraft: {
        id: 'mw.codeMode.restoredDraft',
        defaultMessage: 'Restored unapplied changes',
        description: 'Header message when unapplied text from an earlier session was restored'
    },
    runScript: {
        id: 'mw.codeMode.runScript',
        defaultMessage: 'Run this script',
        description: 'Tooltip of the run icon in the gutter of a script'
    },
    showProblems: {
        id: 'mw.codeMode.showProblems',
        defaultMessage: 'Show',
        description: 'Button that opens the Problems panel'
    },
    staleDraft: {
        id: 'mw.codeMode.staleDraft',
        defaultMessage: 'Unapplied changes from an earlier session',
        description: 'Header message and title for unapplied text whose blocks changed since'
    },
    undidCodeChange: {
        id: 'mw.codeMode.undidCodeChange',
        defaultMessage: 'Undid code change',
        description: 'Message after a code apply was undone'
    },
    useBlocks: {
        id: 'mw.codeMode.useBlocks',
        defaultMessage: 'Use block version',
        description: 'Button that takes the block version of a script that changed on both sides'
    },
    yourText: {
        id: 'mw.codeMode.yourText',
        defaultMessage: 'Your text',
        description: 'Diff legend for the text the user typed'
    },
    collaborating: {
        id: 'mw.codeMode.collaborating',
        defaultMessage: 'Editing code is unavailable during collaboration',
        description: 'Shown when an extension action is blocked during a collaboration session'
    },
    currentCode: {
        id: 'mw.codeMode.currentCode',
        defaultMessage: 'Current code',
        description: 'Diff legend for the extension code that is loaded now'
    },
    goToDefinition: {
        id: 'mw.codeMode.goToDefinition',
        defaultMessage: 'Go to definition',
        description: 'Text editor action that jumps to where a custom block, broadcast or extension block is defined'
    },
    noDefinition: {
        id: 'mw.codeMode.noDefinition',
        defaultMessage: 'No definition found for {name}',
        description: 'Shown when Go to definition finds nothing for the name under the cursor'
    },
    receiverIn: {
        id: 'mw.codeMode.receiverIn',
        defaultMessage: 'when broadcast {name} in {target}',
        description: 'Entry in the list of broadcast receivers shown by Go to definition'
    },
    newExtensionTab: {
        id: 'mw.codeMode.newExtensionTab',
        defaultMessage: 'New extension',
        description: 'Title of the editor tab that creates an extension'
    },
    removeExtensionsTab: {
        id: 'mw.codeMode.removeExtensionsTab',
        defaultMessage: 'Remove extensions',
        description: 'Title of the editor tab that removes extensions from the project'
    },
    runUnsandboxed: {
        id: 'mw.codeMode.runUnsandboxed',
        defaultMessage: 'Run unsandboxed',
        description: 'Explorer action that asks to run an extension file without the sandbox'
    },
    reference: {
        id: 'mw.codeMode.reference',
        defaultMessage: 'Reference',
        description: 'Panel tab listing the blocks that can be written in fractch text'
    },
    watch: {
        id: 'mw.codeMode.watch',
        defaultMessage: 'Watch',
        description: 'Panel tab showing pinned variable values and, while paused, the local values of the paused script'
    },
    watchEmpty: {
        id: 'mw.codeMode.watchEmpty',
        defaultMessage: 'Hover a variable or list in a script and pin it to watch its value here',
        description: 'Shown in the Watch tab when nothing is pinned'
    },
    watchPin: {
        id: 'mw.codeMode.watchPin',
        defaultMessage: 'Pin to Watch',
        description: 'Button in a variable value tooltip that adds the variable to the Watch tab'
    },
    watchUnpin: {
        id: 'mw.codeMode.watchUnpin',
        defaultMessage: 'Remove from Watch',
        description: 'Button that removes a pinned value from the Watch tab'
    },
    watchList: {
        id: 'mw.codeMode.watchList',
        defaultMessage: 'list',
        description: 'Marks a list in a variable value tooltip'
    },
    watchMissing: {
        id: 'mw.codeMode.watchMissing',
        defaultMessage: 'Not found',
        description: 'Shown in the Watch tab for a pinned variable that no longer exists'
    },
    watchPinned: {
        id: 'mw.codeMode.watchPinned',
        defaultMessage: 'Pinned',
        description: 'Heading for the pinned values in the Watch tab'
    },
    watchLocals: {
        id: 'mw.codeMode.watchLocals',
        defaultMessage: 'Locals',
        description: 'Heading for the custom block inputs and script-local variables of the paused script'
    },
    watchNoLocals: {
        id: 'mw.codeMode.watchNoLocals',
        defaultMessage: 'This script has no inputs or local variables',
        description: 'Shown under Locals when the paused script has none'
    },
    pausedAt: {
        id: 'mw.codeMode.pausedAt',
        defaultMessage: 'Paused at {location}',
        description: 'Shown in the Watch tab while the project is paused at a block'
    },
    pausedCompiled: {
        id: 'mw.codeMode.pausedCompiled',
        defaultMessage: 'Compiled scripts stop between frames, so this shows the script rather than the exact ' +
            'block. Restart the script to stop on the exact block.',
        description: 'Explains why a paused compiled script highlights its first line'
    },
    pausedCompilerOnly: {
        id: 'mw.codeMode.pausedCompilerOnly',
        defaultMessage: 'This script uses blocks that only run compiled, such as the JSON list blocks, so it ' +
            'keeps compiling and stops between frames instead of on the exact block. Step is unavailable.',
        description: 'Explains why a paused script with compiler-only blocks stops at yield points'
    },
    debugContinue: {
        id: 'mw.codeMode.debugContinue',
        defaultMessage: 'Continue',
        description: 'Button that resumes the paused project'
    },
    debugStep: {
        id: 'mw.codeMode.debugStep',
        defaultMessage: 'Step',
        description: 'Button that runs the paused project one block further'
    },
    breakpointToggle: {
        id: 'mw.codeMode.breakpointToggle',
        defaultMessage: 'Toggle breakpoint',
        description: 'Tooltip for the breakpoint gutter in a script tab'
    },
    breakpointApplyFirst: {
        id: 'mw.codeMode.breakpointApplyFirst',
        defaultMessage: 'Apply your changes before adding breakpoints',
        description: 'Shown when a breakpoint is toggled in a script with unapplied text'
    },
    referenceSearch: {
        id: 'mw.codeMode.referenceSearch',
        defaultMessage: 'Search blocks',
        description: 'Placeholder of the search field in the block reference'
    },
    referenceEmpty: {
        id: 'mw.codeMode.referenceEmpty',
        defaultMessage: 'No blocks match',
        description: 'Shown when the block reference search has no results'
    },
    referenceInsert: {
        id: 'mw.codeMode.referenceInsert',
        defaultMessage: 'Insert {name}',
        description: 'Tooltip of a block reference row that inserts it into the open text tab'
    },
    openReference: {
        id: 'mw.codeMode.openReference',
        defaultMessage: 'Block reference',
        description: 'Text editor context menu item that opens the block reference'
    },
    clearOutput: {
        id: 'mw.codeMode.clearOutput',
        defaultMessage: 'Clear output',
        description: 'Button that clears the Output panel'
    },
    debuggingHelp: {
        id: 'mw.codeMode.debuggingHelp',
        defaultMessage: 'Debugging extensions',
        description: 'Link in the Output panel to the help card about debugger statements and devtools'
    },
    liveReload: {
        id: 'mw.codeMode.liveReload',
        defaultMessage: 'fractch live reload',
        description: 'Title of the Problems group for fractch live reload errors that belong to no file'
    },
    liveReloadProblem: {
        id: 'mw.codeMode.liveReloadProblem',
        defaultMessage: 'Live reload: {message}',
        description: 'Problems entry for an error from fractch live reload'
    },
    scriptRuntimeError: {
        id: 'mw.codeMode.scriptRuntimeError',
        defaultMessage: 'Runtime error: {message}',
        description: 'Problems entry for an error thrown while a script ran'
    },
    calledFrom: {
        id: 'mw.codeMode.calledFrom',
        defaultMessage: '{message} (called from {file}:{line})',
        description: 'Problems entry for an extension error, naming the script line that called the block'
    },
    extensionThrew: {
        id: 'mw.codeMode.extensionThrew',
        defaultMessage: '{label} threw: {message} ({file}:{line})',
        description: 'Problems entry in a script file for an extension block that threw, naming the extension line'
    },
    running: {
        id: 'mw.codeMode.running',
        defaultMessage: 'Running',
        description: 'Tooltip of the gutter marker on a script that is running'
    },
    findReferences: {
        id: 'mw.codeMode.findReferences',
        defaultMessage: 'Find references',
        description: 'Text editor action that lists every use of the name under the cursor'
    },
    renameSymbol: {
        id: 'mw.codeMode.renameSymbol',
        defaultMessage: 'Rename',
        description: 'Text editor action that renames the variable, list, broadcast or custom block under the cursor'
    },
    noReferences: {
        id: 'mw.codeMode.noReferences',
        defaultMessage: 'No references found for {name}',
        description: 'Shown when Find references finds nothing for the name under the cursor'
    },
    referenceCount: {
        id: 'mw.codeMode.referenceCount',
        defaultMessage: '{count, plural, one {# reference} other {# references}} to {name}',
        description: 'Shown after Find references, with the number of uses found'
    },
    referenceIn: {
        id: 'mw.codeMode.referenceIn',
        defaultMessage: '{name} in {location}',
        description: 'Entry in the list shown by Find references; location is a file and line'
    },
    moreReferences: {
        id: 'mw.codeMode.moreReferences',
        defaultMessage: '{count} more',
        description: 'Last entry of a long Find references list'
    },
    renameTitle: {
        id: 'mw.codeMode.renameTitle',
        defaultMessage: 'Rename {name}',
        description: 'Title of the dialog that asks for a new name'
    },
    renameMessage: {
        id: 'mw.codeMode.renameMessage',
        defaultMessage: 'New name',
        description: 'Label of the input in the rename dialog'
    },
    renameDirty: {
        id: 'mw.codeMode.renameDirty',
        defaultMessage: 'Apply or discard your code changes before renaming',
        description: 'Shown when a rename is refused because some files have unapplied text'
    },
    renameTaken: {
        id: 'mw.codeMode.renameTaken',
        defaultMessage: 'The name {name} is already used',
        description: 'Shown when a rename is refused because the new name is taken'
    },
    renameInvalid: {
        id: 'mw.codeMode.renameInvalid',
        defaultMessage: 'Custom block names use letters, digits and underscores, and cannot start with a digit',
        description: 'Shown when a custom block rename uses a name that is not a valid identifier'
    },
    renamed: {
        id: 'mw.codeMode.renamed',
        defaultMessage: 'Renamed {from} to {to}',
        description: 'Shown after a successful rename'
    },
    openReferenceTab: {
        id: 'mw.codeMode.openReferenceTab',
        defaultMessage: 'Open in editor',
        description: 'Button on the Reference panel tab that opens the reference as an editor tab'
    },
    otherGroup: {
        id: 'mw.codeMode.otherGroup',
        defaultMessage: 'This editor is open in the other editor group.',
        description: 'Shown on a costume or sound tab when the other split group already shows an editor of that kind'
    },
    splitRight: {
        id: 'mw.codeMode.splitRight',
        defaultMessage: 'Split right',
        description: 'Editor tab menu item that opens the tab in a second editor group beside the first'
    },
    splitDown: {
        id: 'mw.codeMode.splitDown',
        defaultMessage: 'Split down',
        description: 'Editor tab menu item that opens the tab in a second editor group below the first'
    },
    openInOtherGroup: {
        id: 'mw.codeMode.openInOtherGroup',
        defaultMessage: 'Open in other group',
        description: 'Editor tab menu item that also opens the tab in the other editor group'
    },
    moveToOtherGroup: {
        id: 'mw.codeMode.moveToOtherGroup',
        defaultMessage: 'Move to other group',
        description: 'Editor tab menu item that moves the tab to the other editor group'
    },
    resizeGroups: {
        id: 'mw.codeMode.resizeGroups',
        defaultMessage: 'Resize editor groups',
        description: 'Accessible label of the divider between two editor groups'
    },
    assets: {
        id: 'mw.codeMode.assets',
        defaultMessage: 'Assets',
        description: 'Explorer folder that holds the project assets, files the assets blocks can read and write'
    },
    noAssets: {
        id: 'mw.codeMode.noAssets',
        defaultMessage: 'No assets yet',
        description: 'Muted row shown in the empty Assets folder of the Code mode explorer'
    },
    newTextFile: {
        id: 'mw.codeMode.newTextFile',
        defaultMessage: 'New text file',
        description: 'Context menu item that creates an empty text asset'
    },
    newFolder: {
        id: 'mw.codeMode.newFolder',
        defaultMessage: 'New folder',
        description: 'Context menu item that creates a folder in the project assets'
    },
    uploadAsset: {
        id: 'mw.codeMode.uploadAsset',
        defaultMessage: 'Upload',
        description: 'Context menu item that adds files from the computer to the project assets'
    },
    download: {
        id: 'mw.codeMode.download',
        defaultMessage: 'Download',
        description: 'Button and menu item that saves a project asset to the computer'
    },
    binaryAsset: {
        id: 'mw.codeMode.binaryAsset',
        defaultMessage: 'This file has no preview',
        description: 'Shown in the tab of a project asset that is neither text, an image nor audio'
    },
    assetInfo: {
        id: 'mw.codeMode.assetInfo',
        defaultMessage: '{format} file, {size}',
        description: 'Format and size of a project asset, such as "png file, 4.2 KB"'
    },
    newTextFileMessage: {
        id: 'mw.codeMode.newTextFileMessage',
        defaultMessage: 'Name the file. Use slashes for folders, such as data/level1.txt',
        description: 'Prompt message when creating a text asset'
    },
    newFolderMessage: {
        id: 'mw.codeMode.newFolderMessage',
        defaultMessage: 'Name the folder',
        description: 'Prompt message when creating an asset folder'
    },
    deleteAssetTitle: {
        id: 'mw.codeMode.deleteAssetTitle',
        defaultMessage: 'Delete {name}?',
        description: 'Title of the confirmation before deleting a project asset or asset folder'
    },
    deleteAssetMessage: {
        id: 'mw.codeMode.deleteAssetMessage',
        defaultMessage: 'The file is removed from the project. Blocks that read it get nothing.',
        description: 'Confirmation message before deleting a project asset'
    },
    deleteFolderMessage: {
        id: 'mw.codeMode.deleteFolderMessage',
        defaultMessage: '{count, plural, one {# file is} other {# files are}} removed from the project.',
        description: 'Confirmation message before deleting an asset folder'
    },
    currentFile: {
        id: 'mw.codeMode.currentFile',
        defaultMessage: 'Current file',
        description: 'Diff legend for the text of a project asset as it is now'
    },
    assetChanged: {
        id: 'mw.codeMode.assetChanged',
        defaultMessage: 'The project changed this file since you started editing. Apply replaces it with your text.',
        description: 'Message in an asset text tab when blocks changed the asset while the tab had unapplied text'
    }
});
