import React from 'react';
import {defineMessages} from 'react-intl';
import {openRestorePointModal, openSimpleDialog} from '../../reducers/modals.js';
import {revealInCode} from '../../reducers/editor-tab.js';
import {redoCodeApply, undoCodeApply} from './apply-pipeline.js';
import {redoExtensionApply, undoExtensionApply} from './extension-apply.js';
import workbenchMessages from '../../components/code-mode/messages.js';

const messages = defineMessages({
    impactTitle: {
        id: 'mw.codeMode.impactTitle',
        defaultMessage: 'Apply these changes?',
        description: 'Title of the dialog that lists what applying code would remove'
    },
    impactApply: {
        id: 'mw.codeMode.impactApply',
        defaultMessage: 'Apply',
        description: 'Button that confirms applying code that removes blocks or variables'
    },
    impactScripts: {
        id: 'mw.codeMode.impactScripts',
        defaultMessage: '{count, plural, one {# script} other {# scripts}} removed',
        description: 'Line in the apply dialog counting removed scripts'
    },
    impactBlocks: {
        id: 'mw.codeMode.impactBlocks',
        defaultMessage: '{count, plural, one {# block} other {# blocks}} removed',
        description: 'Line in the apply dialog counting removed blocks'
    },
    impactVariables: {
        id: 'mw.codeMode.impactVariables',
        defaultMessage: '{count, plural, one {# variable or list} other {# variables and lists}} deleted',
        description: 'Line in the apply dialog counting deleted variables and lists'
    },
    impactComments: {
        id: 'mw.codeMode.impactComments',
        defaultMessage: '{count, plural, one {# comment} other {# comments}} removed',
        description: 'Line in the apply dialog counting removed comments'
    },
    impactSprites: {
        id: 'mw.codeMode.impactSprites',
        defaultMessage: 'Affects {names}',
        description: 'Line in the apply dialog naming the sprites that use changed Stage variables'
    },
    impactStdlib: {
        id: 'mw.codeMode.impactStdlib',
        defaultMessage: 'Removes the custom blocks of {modules}',
        description: 'Line in the apply dialog naming removed standard library imports'
    },
    impactCloud: {
        id: 'mw.codeMode.impactCloud',
        defaultMessage: 'Deletes cloud variables {names}. Undo can\'t restore cloud values.',
        description: 'Line in the apply dialog warning that cloud values are lost'
    },
    impactValues: {
        id: 'mw.codeMode.impactValues',
        defaultMessage: 'Replaces the current values of {names}',
        description: 'Line in the apply dialog naming variables whose current value is overwritten'
    },
    backupTitle: {
        id: 'mw.codeMode.backupTitle',
        defaultMessage: 'Backup failed',
        description: 'Title of the dialog shown when the restore point before applying code could not be made'
    },
    backupMessage: {
        id: 'mw.codeMode.backupMessage',
        defaultMessage: 'Backup failed, apply anyway? {error}',
        description: 'Message asking whether to apply code without a restore point'
    },
    applyAnyway: {
        id: 'mw.codeMode.applyAnyway',
        defaultMessage: 'Apply anyway',
        description: 'Button that applies code without a restore point'
    },
    undoRefusedTitle: {
        id: 'mw.codeMode.undoRefusedTitle',
        defaultMessage: 'Can\'t undo this code change',
        description: 'Title of the dialog shown when a code apply cannot be undone'
    },
    redoRefusedTitle: {
        id: 'mw.codeMode.redoRefusedTitle',
        defaultMessage: 'Can\'t redo this code change',
        description: 'Title of the dialog shown when a code apply cannot be redone'
    },
    blocksChanged: {
        id: 'mw.codeMode.blocksChanged',
        defaultMessage: 'Blocks changed since this apply, so it can\'t be undone here.',
        description: 'Explains why a code apply cannot be undone'
    },
    blocksChangedRedo: {
        id: 'mw.codeMode.blocksChangedRedo',
        defaultMessage: 'Blocks changed since this undo, so it can\'t be redone here.',
        description: 'Explains why a code apply cannot be redone'
    },
    showChanges: {
        id: 'mw.codeMode.showChanges',
        defaultMessage: 'Show changes',
        description: 'Button that shows what changed since a code apply'
    },
    extensionImpactTitle: {
        id: 'mw.codeMode.extensionImpactTitle',
        defaultMessage: 'Apply this extension change?',
        description: 'Title of the dialog shown when an extension edit would break blocks the project uses'
    },
    extensionRemovedLine: {
        id: 'mw.codeMode.extensionRemovedLine',
        // eslint-disable-next-line max-len
        defaultMessage: '{label} is used by {blocks, plural, one {# block} other {# blocks}} in {sprites, plural, one {# sprite} other {# sprites}} and would become unknown',
        description: 'Line in the extension apply dialog naming a block that the new code removes'
    },
    extensionChangedLine: {
        id: 'mw.codeMode.extensionChangedLine',
        // eslint-disable-next-line max-len
        defaultMessage: '{label} is used by {blocks, plural, one {# block} other {# blocks}} in {sprites, plural, one {# sprite} other {# sprites}} and its inputs would change',
        description: 'Line in the extension apply dialog naming a block whose inputs the new code renames or reorders'
    },
    refusedChanged: {
        id: 'mw.codeMode.refusedChanged',
        defaultMessage: 'The project changed while applying, try again',
        description: 'Shown when an apply is refused because the project changed while it ran'
    },
    refusedBackup: {
        id: 'mw.codeMode.refusedBackup',
        defaultMessage: 'The backup failed, so nothing was applied',
        description: 'Shown when an apply is refused because the restore point could not be made'
    },
    extensionCollaboration: {
        id: 'mw.codeMode.extensionCollaboration',
        defaultMessage: 'Editing extensions is unavailable during collaboration',
        description: 'Shown when an extension change is refused during a collaboration session'
    },
    extensionChanged: {
        id: 'mw.codeMode.extensionChanged',
        defaultMessage: 'The extension changed since this apply, so it can\'t be undone here',
        description: 'Explains why an extension apply cannot be undone'
    },
    extensionRedoChanged: {
        id: 'mw.codeMode.extensionRedoChanged',
        defaultMessage: 'The extension changed since this undo, so it can\'t be redone here',
        description: 'Explains why an extension apply cannot be redone'
    },
    openRestorePoints: {
        id: 'mw.codeMode.openRestorePoints',
        defaultMessage: 'Open restore points',
        description: 'Button that opens the restore points window'
    }
});

const REFUSAL_MESSAGES = {
    collaboration: workbenchMessages.collaborating,
    changed: messages.refusedChanged,
    cancelled: workbenchMessages.applyCancelled,
    backup: messages.refusedBackup,
    blocksChanged: messages.blocksChanged,
    redoChanged: messages.blocksChangedRedo,
    extensionChanged: messages.extensionChanged,
    extensionRedoChanged: messages.extensionRedoChanged
};

const refusalText = (intl, result) => {
    if (!result) return '';
    if (result.reason === 'collaboration' && result.entry && result.entry.kind === 'extension') {
        return intl.formatMessage(messages.extensionCollaboration);
    }
    const descriptor = REFUSAL_MESSAGES[result.reason];
    return descriptor ? intl.formatMessage(descriptor) : (result.message || result.text || '');
};

const ask = (dispatch, config) => new Promise(resolve => {
    dispatch(openSimpleDialog({
        ...config,
        onOk: value => resolve(value || true),
        onCancel: () => resolve(null)
    }));
});

const promptText = (dispatch, config) => ask(dispatch, {...config, type: 'prompt'})
    .then(value => (typeof value === 'string' ? value : null));

const impactLines = (intl, impact) => {
    const lines = [];
    const {counts} = impact;
    if (counts.scripts) lines.push(intl.formatMessage(messages.impactScripts, {count: counts.scripts}));
    if (counts.blocks) lines.push(intl.formatMessage(messages.impactBlocks, {count: counts.blocks}));
    if (counts.variables) lines.push(intl.formatMessage(messages.impactVariables, {count: counts.variables}));
    if (counts.comments) lines.push(intl.formatMessage(messages.impactComments, {count: counts.comments}));
    if (impact.sprites.length) {
        lines.push(intl.formatMessage(messages.impactSprites, {names: impact.sprites.join(', ')}));
    }
    if (impact.stdlibRemoved.length) {
        lines.push(intl.formatMessage(messages.impactStdlib, {modules: impact.stdlibRemoved.join(', ')}));
    }
    if (impact.cloud.length) lines.push(intl.formatMessage(messages.impactCloud, {names: impact.cloud.join(', ')}));
    if (impact.replacedValues.length) {
        lines.push(intl.formatMessage(messages.impactValues, {names: impact.replacedValues.join(', ')}));
    }
    return lines;
};

const lineList = lines => React.createElement(React.Fragment, null, lines.map((line, index) =>
    React.createElement('span', {key: index, style: {display: 'block'}}, line)));

const confirmImpact = (dispatch, intl, impact) => ask(dispatch, {
    type: 'confirm',
    title: intl.formatMessage(messages.impactTitle),
    message: lineList(impactLines(intl, impact)),
    choices: [{value: 'apply', label: intl.formatMessage(messages.impactApply)}]
}).then(value => value === 'apply');

const confirmExtensionImpact = (dispatch, intl, impact) => ask(dispatch, {
    type: 'confirm',
    title: intl.formatMessage(messages.extensionImpactTitle),
    message: lineList(impact.map(item => intl.formatMessage(
        item.kind === 'removed' ? messages.extensionRemovedLine : messages.extensionChangedLine,
        {label: item.label, blocks: item.blocks, sprites: item.targets.length}
    ))),
    choices: [{value: 'apply', label: intl.formatMessage(messages.impactApply)}]
}).then(value => value === 'apply');

const confirmBackupFailure = (dispatch, intl, error) => ask(dispatch, {
    type: 'confirm',
    title: intl.formatMessage(messages.backupTitle),
    message: intl.formatMessage(messages.backupMessage, {error: (error && error.message) || ''}),
    choices: [{value: 'apply', label: intl.formatMessage(messages.applyAnyway)}]
}).then(value => value === 'apply');

const showRefusal = (dispatch, intl, result, direction) => {
    const changed = result.reason === 'blocksChanged' || result.reason === 'redoChanged';
    const message = changed ?
        intl.formatMessage(direction === 'undo' ? messages.blocksChanged : messages.blocksChangedRedo) :
        refusalText(intl, result);
    return ask(dispatch, {
        type: 'confirm',
        title: intl.formatMessage(direction === 'undo' ? messages.undoRefusedTitle : messages.redoRefusedTitle),
        message,
        choices: changed ? [
            {value: 'changes', label: intl.formatMessage(messages.showChanges)},
            {value: 'restore', label: intl.formatMessage(messages.openRestorePoints)}
        ] : [{value: 'restore', label: intl.formatMessage(messages.openRestorePoints)}]
    }).then(choice => {
        if (choice === 'changes' && result.entry && result.entry.targetId) {
            dispatch(revealInCode({
                kind: 'codeChanges',
                targetId: result.entry.targetId,
                before: result.entry.afterText || null
            }));
        } else if (choice === 'restore') {
            dispatch(openRestorePointModal());
        }
    });
};

const runCodeHistory = ({vm, dispatch, intl, direction, targetId = null, entry}) => {
    let pending;
    if (entry && entry.kind === 'extension') {
        const run = direction === 'undo' ? undoExtensionApply : redoExtensionApply;
        pending = run({vm, entry, confirm: impact => confirmExtensionImpact(dispatch, intl, impact)});
    } else {
        const run = direction === 'undo' ? undoCodeApply : redoCodeApply;
        const options = {vm, targetId};
        if (entry) options.entry = entry;
        pending = run(options);
    }
    return pending.then(result => {
        if (result.status === 'refused') showRefusal(dispatch, intl, result, direction);
        return result.status === 'committed';
    });
};

export {
    ask,
    confirmBackupFailure,
    confirmExtensionImpact,
    confirmImpact,
    impactLines,
    messages as codeDialogMessages,
    promptText,
    refusalText,
    runCodeHistory
};
