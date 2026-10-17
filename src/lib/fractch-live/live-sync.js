import JSZip from '@turbowarp/jszip';
import {defineMessages} from 'react-intl';
import {unitKind, unitsOf} from '../code-mode/fractch-adapter.js';
import {rebase, sliceUnit} from '../code-mode/code-rebase.js';
import {commitApply, isCollaborating, prepareApply} from '../code-mode/apply-pipeline.js';
import {refusalText} from '../code-mode/code-dialogs.js';
import {withProjectReplacement} from '../project-replacement.js';

const messages = defineMessages({
    collaboration: {
        id: 'mw.fractchLive.collaboration',
        defaultMessage: 'paused during collaboration',
        description: 'Problems entry shown when fractch live reload skips a change during a collaboration session'
    },
    conflicts: {
        id: 'mw.fractchLive.conflicts',
        defaultMessage: '{count, plural, one {# script} other {# scripts}} changed in both the file and the editor. ' +
            'Pick a version for each, then apply.',
        description: 'Problems entry shown when a fractch file change conflicts with edits made in the editor'
    },
    dirty: {
        id: 'mw.fractchLive.dirty',
        defaultMessage: 'skipped because this file has unapplied edits in Code mode',
        description: 'Problems entry shown when fractch live reload cannot merge into a file with unapplied edits'
    },
    missingTarget: {
        id: 'mw.fractchLive.missingTarget',
        defaultMessage: '{name} is not in this project',
        description: 'Problems entry shown when a fractch file names a sprite the editor does not have'
    },
    lineError: {
        id: 'mw.fractchLive.lineError',
        defaultMessage: '{message} (line {line})',
        description: 'Problems entry for a fractch error at a line'
    },
    reloadTitle: {
        id: 'mw.fractchLive.reloadTitle',
        defaultMessage: 'Reload the project from fractch?',
        description: 'Title of the dialog asking whether fractch live reload may reload the whole project'
    },
    reloadMessage: {
        id: 'mw.fractchLive.reloadMessage',
        defaultMessage: '{reason} Reloading replaces the project with the files on disk. ' +
            'A restore point is made first.',
        description: 'Message of the dialog asking whether fractch live reload may reload the whole project'
    },
    reloadButton: {
        id: 'mw.fractchLive.reloadButton',
        defaultMessage: 'Reload',
        description: 'Button that reloads the project from fractch'
    },
    reasonProject: {
        id: 'mw.fractchLive.reasonProject',
        defaultMessage: 'Extensions, monitors or project settings changed.',
        description: 'Reason fractch live reload needs a full reload'
    },
    reasonTargets: {
        id: 'mw.fractchLive.reasonTargets',
        defaultMessage: 'Sprites were added, removed or renamed.',
        description: 'Reason fractch live reload needs a full reload'
    },
    reasonTarget: {
        id: 'mw.fractchLive.reasonTarget',
        defaultMessage: 'The costumes, sounds or properties of {name} changed.',
        description: 'Reason fractch live reload needs a full reload'
    },
    notLoopback: {
        id: 'mw.fractchLive.notLoopback',
        defaultMessage: '{url} is not on this computer, so live reload ignored it',
        description: 'Problems entry shown when fractch live reload refuses an address outside this computer'
    },
    restorePoint: {
        id: 'mw.fractchLive.restorePoint',
        defaultMessage: 'Before fractch live reload',
        description: 'Name of the restore point made before fractch live reload changes the project'
    }
});

const stable = value => {
    if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
    if (value && typeof value === 'object') {
        return `{${Object.keys(value).sort()
            .map(key => `${JSON.stringify(key)}:${stable(value[key])}`)
            .join(',')}}`;
    }
    return JSON.stringify(value);
};

const STAGE_FIELDS = ['tempo', 'videoTransparency', 'videoState', 'textToSpeechLanguage'];
const SPRITE_FIELDS = ['visible', 'x', 'y', 'size', 'direction', 'draggable', 'rotationStyle'];
const TARGET_FIELDS = ['isStage', 'name', 'costumes', 'sounds', 'currentCostume', 'volume', 'layerOrder',
    'extensionStorage'];

const keyOf = target => (target.isStage ? 'Stage' : target.name);

const targetShape = target => {
    const shape = {};
    for (const field of TARGET_FIELDS.concat(target.isStage ? STAGE_FIELDS : SPRITE_FIELDS)) {
        shape[field] = typeof target[field] === 'undefined' ? null : target[field];
    }
    return stable(shape);
};

const projectShape = project => stable({
    extensions: project.extensions || [],
    extensionURLs: project.extensionURLs || null,
    extensionStorage: project.extensionStorage || null,
    monitors: project.monitors || [],
    customFonts: project.customFonts || null
});

const reloadReason = (previous, next) => {
    if (!previous) return null;
    if (projectShape(previous) !== projectShape(next)) return {kind: 'project'};
    const before = new Map((previous.targets || []).map(target => [keyOf(target), target]));
    const after = (next.targets || []).map(keyOf);
    if (before.size !== after.length || after.some(key => !before.has(key))) return {kind: 'targets'};
    for (const target of next.targets) {
        if (targetShape(before.get(keyOf(target))) !== targetShape(target)) {
            return {kind: 'target', name: keyOf(target)};
        }
    }
    return null;
};

const firstLine = piece => piece.split('\n')[0].trim();

const alignUnits = (base, doc) => {
    const out = {};
    const free = new Set(Object.keys(base.units));
    const pending = [];
    for (const key of Object.keys(doc.units)) {
        if (free.has(key)) {
            out[key] = doc.units[key];
            free.delete(key);
        } else {
            pending.push(key);
        }
    }
    const piece = (side, key, project) => project(sliceUnit(side.text, side.units, key) || '');
    const claim = (keys, project, unique) => keys.filter(key => {
        const value = piece(doc, key, project);
        const sameKind = other => unitKind(other) === unitKind(key);
        const found = Array.from(free).filter(other => sameKind(other) && piece(base, other, project) === value);
        const rivals = keys.filter(other => sameKind(other) && piece(doc, other, project) === value);
        if (!value || !found.length || (unique && (found.length > 1 || rivals.length > 1))) return true;
        out[found[0]] = doc.units[key];
        free.delete(found[0]);
        return false;
    });
    for (const key of claim(claim(pending, String, false), firstLine, true)) out[key] = doc.units[key];
    return {text: doc.text, units: out};
};

const parseProjectBuffer = async buffer => {
    const zip = await JSZip.loadAsync(buffer);
    const entry = zip.file('project.json');
    if (!entry) throw new Error('Invalid sb3: missing project.json');
    return JSON.parse(await entry.async('string'));
};

const errorText = error => (error && error.message) || String(error);

const createLiveSync = ({vm, client, controller, intl, dispatchProblems, ask, reveal, confirmImpact,
    confirmBackupFailure}) => {
    const bases = new Map();
    let previous = null;
    let generation = null;
    const title = () => intl.formatMessage(messages.restorePoint);

    const docOf = emitted => ({text: emitted.text, units: unitsOf(emitted.sourceMap)});

    const checkGeneration = () => {
        const current = vm._projectLoadGeneration || 0;
        if (current !== generation) bases.clear();
        generation = current;
    };

    const originals = () => vm.runtime.targets.filter(target => target.isOriginal);

    const prime = async project => {
        previous = project;
        checkGeneration();
        for (const target of originals()) {
            if (!bases.has(target.id)) bases.set(target.id, docOf(await client.emit(vm, target.id)));
        }
    };

    const confirmReload = reason => {
        const text = reason.kind === 'target' ?
            intl.formatMessage(messages.reasonTarget, {name: reason.name}) :
            intl.formatMessage(reason.kind === 'project' ? messages.reasonProject : messages.reasonTargets);
        return ask({
            type: 'confirm',
            title: intl.formatMessage(messages.reloadTitle),
            message: intl.formatMessage(messages.reloadMessage, {reason: text}),
            choices: [{value: 'reload', label: intl.formatMessage(messages.reloadButton)}]
        }).then(value => value === 'reload');
    };

    const syncTarget = async (target, incoming, add) => {
        const live = await client.emit(vm, target.id);
        const liveDoc = docOf(live);
        const base = bases.get(target.id) || liveDoc;
        if (incoming.text === live.text) {
            bases.set(target.id, liveDoc);
            return;
        }
        let text = incoming.text;
        if (live.text !== base.text) {
            const mine = alignUnits(base, docOf(incoming));
            const merged = rebase({base, theirs: liveDoc, mine});
            if (merged.conflicts.length) {
                const shown = await controller.propose(target.id, merged);
                bases.set(target.id, mine);
                if (shown) {
                    add(target.id, intl.formatMessage(messages.conflicts, {count: merged.conflicts.length}));
                    reveal(target.id);
                } else {
                    add(target.id, intl.formatMessage(messages.dirty));
                }
                return;
            }
            text = merged.text;
        }
        const plan = await prepareApply({
            vm,
            client,
            targetId: target.id,
            text,
            previous: {text: live.text, sourceMap: live.sourceMap},
            lockedScripts: live.lockedScripts
        });
        if (plan.status === 'invalid') {
            for (const item of plan.diagnostics.filter(entry => entry.severity === 'error')) {
                add(target.id, item.line ?
                    intl.formatMessage(messages.lineError, {message: item.message, line: item.line}) :
                    item.message);
            }
            return;
        }
        if (plan.status !== 'ready') {
            add(target.id, refusalText(intl, plan));
            return;
        }
        const outcome = await commitApply(plan, {vm, title: title(), confirmImpact, confirmBackupFailure});
        if (outcome.status !== 'committed') {
            add(target.id, refusalText(intl, outcome));
            return;
        }
        bases.set(target.id, docOf(await client.emit(vm, target.id)));
    };

    const sync = async (project, {loadProject}) => {
        const problems = {};
        const add = (key, message) => {
            (problems[key] = problems[key] || []).push(message);
        };
        try {
            if (isCollaborating(vm)) {
                add('project', intl.formatMessage(messages.collaboration));
                return {status: 'collaboration'};
            }
            const reason = reloadReason(previous, project);
            if (reason && await confirmReload(reason)) {
                await withProjectReplacement(vm, title(), loadProject);
                await prime(project);
                return {status: 'reloaded'};
            }
            // eslint-disable-next-line require-atomic-updates
            previous = project;
            checkGeneration();
            const texts = await client.emitProject(vm, project);
            const live = new Map(originals().map(target => [target.isStage ? 'Stage' : target.getName(), target]));
            for (const key of Object.keys(texts)) {
                const target = live.get(key);
                if (!target) {
                    if (!reason) add('project', intl.formatMessage(messages.missingTarget, {name: key}));
                    continue;
                }
                try {
                    await syncTarget(target, texts[key], add);
                } catch (error) {
                    add(target.id, errorText(error));
                }
            }
            return {status: 'synced'};
        } catch (error) {
            add('project', errorText(error));
            return {status: 'error', error};
        } finally {
            dispatchProblems(problems);
        }
    };

    return {prime, sync};
};

export {alignUnits, createLiveSync, messages, parseProjectBuffer, reloadReason};
